import { deflateRawSync } from 'zlib';

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&bull;/gi, '•')
    .replace(/&rarr;/gi, '→')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

function escapeXml(text: string): string {
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface HtmlNode {
  type: 'element' | 'text';
  tag?: string;
  attrs?: Record<string, string>;
  classes?: Set<string>;
  children?: HtmlNode[];
  text?: string;
}

const VOID_TAGS = new Set(['br', 'hr', 'img', 'meta', 'link', 'input', 'col', 'area', 'base', 'embed', 'param', 'source', 'track', 'wbr']);

function parseAttributes(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (!attrStr) return attrs;
  const regex = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(attrStr)) !== null) {
    const key = m[1].toLowerCase();
    const val = m[2] ?? m[3] ?? m[4] ?? '';
    attrs[key] = val;
  }
  return attrs;
}

export function parseHtmlToTree(rawHtml: string): HtmlNode[] {
  let html = rawHtml;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    html = bodyMatch[1];
  }

  // Remove script, style, comments
  html = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  const root: HtmlNode = { type: 'element', tag: 'root', attrs: {}, classes: new Set(), children: [] };
  const stack: HtmlNode[] = [root];

  const tokenRegex = /<\/?([a-zA-Z0-9]+)\b([^>]*?)(\/?)>|([^<]+)/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(html)) !== null) {
    const fullToken = match[0];
    const tagName = match[1]?.toLowerCase();
    const attrPart = match[2] || '';
    const selfClosingSlash = match[3] === '/';
    const textContent = match[4];

    const currentParent = stack[stack.length - 1];

    if (textContent !== undefined) {
      // Preserve meaningful text and newlines (especially inside pre-wrap answer boxes)
      if (textContent.length > 0) {
        currentParent.children!.push({
          type: 'text',
          text: textContent
        });
      }
      continue;
    }

    if (!tagName) continue;

    if (fullToken.startsWith('</')) {
      // Closing tag: pop until matching tag
      for (let i = stack.length - 1; i >= 1; i--) {
        if (stack[i].tag === tagName) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const attrs = parseAttributes(attrPart);
    const classSet = new Set<string>(
      (attrs.class || '')
        .split(/\s+/)
        .map(s => s.trim())
        .filter(Boolean)
    );

    const node: HtmlNode = {
      type: 'element',
      tag: tagName,
      attrs,
      classes: classSet,
      children: []
    };

    // Skip action toolbars (.no-print or #pdf-action-bar)
    if (attrs.id === 'pdf-action-bar' || classSet.has('no-print')) {
      if (!selfClosingSlash && !VOID_TAGS.has(tagName)) {
        // Push a dummy ignored container so its children don't attach to currentParent
        const ignoredNode: HtmlNode = { type: 'element', tag: tagName, attrs: { __ignore: '1' }, classes: classSet, children: [] };
        stack.push(ignoredNode);
      }
      continue;
    }

    if (!currentParent.attrs?.__ignore) {
      currentParent.children!.push(node);
    }

    if (!selfClosingSlash && !VOID_TAGS.has(tagName)) {
      if (currentParent.attrs?.__ignore) {
        node.attrs!.__ignore = '1';
      }
      stack.push(node);
    }
  }

  return root.children || [];
}

interface TextRunOptions {
  bold?: boolean;
  italic?: boolean;
  sizeHalfPt?: number; // 22 = 11pt
  colorHex?: string;
  preserveNewlines?: boolean;
}

function buildRunXml(rawText: string, opts: TextRunOptions = {}): string {
  const normalized = opts.preserveNewlines
    ? rawText.replace(/\r\n/g, '\n')
    : rawText.replace(/\s+/g, ' ');
  const lines = normalized.split('\n');

  const rPrParts: string[] = [
    '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>'
  ];
  if (opts.bold) rPrParts.push('<w:b/><w:bCs/>');
  if (opts.italic) rPrParts.push('<w:i/><w:iCs/>');
  const sz = opts.sizeHalfPt || 22;
  rPrParts.push(`<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`);
  if (opts.colorHex) {
    rPrParts.push(`<w:color w:val="${opts.colorHex}"/>`);
  }
  const rPr = `<w:rPr>${rPrParts.join('')}</w:rPr>`;

  const innerParts: string[] = [];
  lines.forEach((line, idx) => {
    const decoded = decodeHtmlEntities(line);
    if (decoded.length > 0) {
      innerParts.push(`<w:t xml:space="preserve">${escapeXml(decoded)}</w:t>`);
    }
    if (idx < lines.length - 1) {
      innerParts.push('<w:br/>');
    }
  });

  if (innerParts.length === 0) return '';
  return `<w:r>${rPr}${innerParts.join('')}</w:r>`;
}

function renderInlineNodesToRuns(nodes: HtmlNode[], baseOpts: TextRunOptions = {}): string {
  const runs: string[] = [];

  for (const node of nodes) {
    if (node.type === 'text') {
      const txt = node.text || '';
      if (!optsPreserve(baseOpts) && /^\s+$/.test(txt)) {
        // Keep single space between inline elements if not at start
        if (runs.length > 0) {
          runs.push(buildRunXml(' ', baseOpts));
        }
        continue;
      }
      const r = buildRunXml(txt, baseOpts);
      if (r) runs.push(r);
      continue;
    }

    const tag = node.tag || '';
    const classes = node.classes || new Set();

    if (tag === 'br') {
      runs.push('<w:r><w:br/></w:r>');
      continue;
    }

    const childOpts: TextRunOptions = { ...baseOpts };
    if (tag === 'strong' || tag === 'b' || classes.has('font-bold')) {
      childOpts.bold = true;
    }
    if (tag === 'em' || tag === 'i') {
      childOpts.italic = true;
    }
    if (tag === 'small' || classes.has('column-indicator')) {
      childOpts.sizeHalfPt = Math.max(16, (baseOpts.sizeHalfPt || 22) - 3);
      childOpts.colorHex = '64748B';
    }
    if (classes.has('badge')) {
      const badgeText = `[${extractPlainText(node).trim()}] `;
      runs.push(
        buildRunXml(badgeText, {
          ...childOpts,
          bold: true,
          sizeHalfPt: 18,
          colorHex: classes.has('badge-submitted') ? '047857' : classes.has('badge-filled') ? '1D4ED8' : '475569'
        })
      );
      continue;
    }
    if (classes.has('jf-badge')) {
      const badgeText = extractPlainText(node).trim();
      runs.push(
        buildRunXml(badgeText, {
          ...childOpts,
          bold: true,
          sizeHalfPt: 19,
          colorHex: classes.has('high') ? '047857' : classes.has('medium') ? 'B45309' : '64748B'
        })
      );
      continue;
    }

    if (node.children && node.children.length > 0) {
      const childRuns = renderInlineNodesToRuns(node.children, childOpts);
      if (childRuns) runs.push(childRuns);
    }
  }

  return runs.join('');
}

function optsPreserve(opts: TextRunOptions): boolean {
  return !!opts.preserveNewlines;
}

function extractPlainText(node: HtmlNode): string {
  if (node.type === 'text') return decodeHtmlEntities(node.text || '');
  if (node.tag === 'br') return '\n';
  return (node.children || []).map(extractPlainText).join('');
}

interface ParagraphOptions extends TextRunOptions {
  align?: 'left' | 'center' | 'right' | 'both';
  spaceBefore?: number;
  spaceAfter?: number;
  bottomBorderColor?: string;
  leftBorderColor?: string;
  shadingFill?: string;
  indentLeft?: number;
}

function buildParagraphFromRuns(runsXml: string, opts: ParagraphOptions = {}): string {
  if (!runsXml) return '';
  const pPrParts: string[] = [];
  if (opts.align) {
    pPrParts.push(`<w:jc w:val="${opts.align}"/>`);
  }
  const before = opts.spaceBefore ?? 60;
  const after = opts.spaceAfter ?? 80;
  pPrParts.push(`<w:spacing w:before="${before}" w:after="${after}" w:line="276" w:lineRule="auto"/>`);

  if (opts.bottomBorderColor || opts.leftBorderColor) {
    const bdrParts: string[] = [];
    if (opts.bottomBorderColor) {
      bdrParts.push(`<w:bottom w:val="single" w:sz="12" w:space="4" w:color="${opts.bottomBorderColor}"/>`);
    }
    if (opts.leftBorderColor) {
      bdrParts.push(`<w:left w:val="single" w:sz="24" w:space="8" w:color="${opts.leftBorderColor}"/>`);
    }
    pPrParts.push(`<w:pBdr>${bdrParts.join('')}</w:pBdr>`);
  }

  if (opts.shadingFill) {
    pPrParts.push(`<w:shd w:val="clear" w:color="auto" w:fill="${opts.shadingFill}"/>`);
  }

  if (opts.indentLeft) {
    pPrParts.push(`<w:ind w:left="${opts.indentLeft}"/>`);
  }

  return `<w:p><w:pPr>${pPrParts.join('')}</w:pPr>${runsXml}</w:p>`;
}

function buildParagraphFromNodes(nodes: HtmlNode[], opts: ParagraphOptions = {}): string {
  const runs = renderInlineNodesToRuns(nodes, opts);
  return buildParagraphFromRuns(runs, opts);
}

function buildParagraphFromText(text: string, opts: ParagraphOptions = {}): string {
  const runs = buildRunXml(text, opts);
  return buildParagraphFromRuns(runs, opts);
}

function buildCalloutBoxTable(innerParagraphsXml: string, opts: {
  fillHex: string;
  leftBorderHex?: string;
  boxBorderHex?: string;
  spaceAfter?: number;
}): string {
  if (!innerParagraphsXml.trim()) return '';
  const boxHex = opts.boxBorderHex || 'CBD5E1';
  const leftHex = opts.leftBorderHex || boxHex;
  const leftSz = opts.leftBorderHex ? '24' : '8';

  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="5000" w:type="pct"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="${boxHex}"/>
        <w:left w:val="single" w:sz="${leftSz}" w:space="0" w:color="${leftHex}"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="${boxHex}"/>
        <w:right w:val="single" w:sz="6" w:space="0" w:color="${boxHex}"/>
      </w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="120" w:type="dxa"/>
        <w:left w:w="180" w:type="dxa"/>
        <w:bottom w:w="120" w:type="dxa"/>
        <w:right w:w="180" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    <w:tr>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="5000" w:type="pct"/>
          <w:shd w:val="clear" w:color="auto" w:fill="${opts.fillHex}"/>
        </w:tcPr>
        ${innerParagraphsXml}
      </w:tc>
    </w:tr>
  </w:tbl>
  <w:p><w:pPr><w:spacing w:before="0" w:after="${opts.spaceAfter ?? 80}"/></w:pPr></w:p>`;
}

function findElementsByClass(node: HtmlNode, className: string): HtmlNode[] {
  const results: HtmlNode[] = [];
  if (node.classes?.has(className)) {
    results.push(node);
  }
  for (const child of node.children || []) {
    results.push(...findElementsByClass(child, className));
  }
  return results;
}

function findElementsByTag(node: HtmlNode, tagName: string): HtmlNode[] {
  const results: HtmlNode[] = [];
  if (node.tag === tagName) {
    results.push(node);
  }
  for (const child of node.children || []) {
    results.push(...findElementsByTag(child, tagName));
  }
  return results;
}

function renderTableNodeToXml(tableNode: HtmlNode): string {
  const trNodes = findElementsByTag(tableNode, 'tr');
  if (trNodes.length === 0) return '';

  const trXmlList: string[] = [];

  for (const tr of trNodes) {
    const cellNodes = (tr.children || []).filter(c => c.tag === 'th' || c.tag === 'td');
    const tcXmlList: string[] = [];

    for (const cell of cellNodes) {
      const isHeader = cell.tag === 'th';
      const colspan = Number(cell.attrs?.colspan || 1);
      const tcPrParts: string[] = [];
      if (colspan > 1) {
        tcPrParts.push(`<w:gridSpan w:val="${colspan}"/>`);
      }
      if (isHeader) {
        tcPrParts.push('<w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>');
      }
      tcPrParts.push('<w:vAlign w:val="top"/>');

      const cellParagraphs = buildParagraphFromNodes(cell.children || [], {
        bold: isHeader,
        sizeHalfPt: 20,
        colorHex: '111827',
        spaceBefore: 40,
        spaceAfter: 40
      }) || '<w:p/>';

      tcXmlList.push(`<w:tc><w:tcPr>${tcPrParts.join('')}</w:tcPr>${cellParagraphs}</w:tc>`);
    }

    if (tcXmlList.length > 0) {
      trXmlList.push(`<w:tr>${tcXmlList.join('')}</w:tr>`);
    }
  }

  if (trXmlList.length === 0) return '';

  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="5000" w:type="pct"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="475569"/>
        <w:left w:val="single" w:sz="6" w:space="0" w:color="475569"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="475569"/>
        <w:right w:val="single" w:sz="6" w:space="0" w:color="475569"/>
        <w:insideH w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:insideV w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
      </w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="90" w:type="dxa"/>
        <w:left w:w="130" w:type="dxa"/>
        <w:bottom w:w="90" w:type="dxa"/>
        <w:right w:w="130" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    ${trXmlList.join('\n')}
  </w:tbl>
  <w:p><w:pPr><w:spacing w:before="20" w:after="80"/></w:pPr></w:p>`;
}

function renderTwoColumnGridToTableXml(cardNodes: HtmlNode[]): string {
  const validCards = cardNodes.filter(c => c.type === 'element' && extractPlainText(c).trim().length > 0);
  if (validCards.length === 0) return '';

  const rowsXml: string[] = [];
  for (let i = 0; i < validCards.length; i += 2) {
    const leftCard = validCards[i];
    const rightCard = validCards[i + 1];

    const leftInner = renderNodeChildrenToXml(leftCard.children || []) || '<w:p/>';
    const rightInner = rightCard ? (renderNodeChildrenToXml(rightCard.children || []) || '<w:p/>') : '<w:p/>';

    rowsXml.push(`<w:tr>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="2500" w:type="pct"/>
          <w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/>
          <w:vAlign w:val="top"/>
        </w:tcPr>
        ${leftInner}
      </w:tc>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="2500" w:type="pct"/>
          <w:shd w:val="clear" w:color="auto" w:fill="${rightCard ? 'F8FAFC' : 'FFFFFF'}"/>
          <w:vAlign w:val="top"/>
        </w:tcPr>
        ${rightInner}
      </w:tc>
    </w:tr>`);
  }

  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="5000" w:type="pct"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:insideH w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:insideV w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
      </w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="100" w:type="dxa"/>
        <w:left w:w="140" w:type="dxa"/>
        <w:bottom w:w="100" w:type="dxa"/>
        <w:right w:w="140" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    ${rowsXml.join('\n')}
  </w:tbl>
  <w:p><w:pPr><w:spacing w:before="20" w:after="80"/></w:pPr></w:p>`;
}

function renderNodeToXml(node: HtmlNode): string {
  if (node.type === 'text') {
    const t = (node.text || '').trim();
    if (!t) return '';
    return buildParagraphFromText(t, { sizeHalfPt: 22, colorHex: '1E293B' });
  }

  const tag = node.tag || '';
  const classes = node.classes || new Set<string>();
  const children = node.children || [];

  // 1. Print Header (.print-header)
  if (classes.has('print-header')) {
    const logoArea = findElementsByClass(node, 'logo-area')[0];
    const metaArea = findElementsByClass(node, 'meta-area')[0];
    const leftXml = logoArea ? renderNodeChildrenToXml(logoArea.children || []) : '<w:p/>';
    const rightXml = metaArea
      ? (metaArea.children || [])
          .filter(c => c.type === 'element')
          .map(c => buildParagraphFromNodes(c.children || [], { align: 'right', sizeHalfPt: 20, colorHex: '475569', spaceBefore: 20, spaceAfter: 20 }))
          .join('')
      : '<w:p/>';

    return `<w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:bottom w:val="single" w:sz="12" w:space="0" w:color="4F46E5"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:bottom w:w="140" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr>${leftXml || '<w:p/>'}</w:tc>
        <w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/><w:vAlign w:val="bottom"/></w:tcPr>${rightXml || '<w:p/>'}</w:tc>
      </w:tr>
    </w:tbl>
    <w:p><w:pPr><w:spacing w:before="40" w:after="100"/></w:pPr></w:p>`;
  }

  // 2. Demographics Box (.demographics-box)
  if (classes.has('demographics-box')) {
    const titleNode = findElementsByClass(node, 'demo-title')[0];
    const demoItems = findElementsByClass(node, 'demo-item');
    const titleXml = titleNode
      ? buildParagraphFromText(extractPlainText(titleNode).trim(), {
          bold: true,
          sizeHalfPt: 21,
          colorHex: '4F46E5',
          spaceBefore: 20,
          spaceAfter: 80,
          bottomBorderColor: 'CBD5E1'
        })
      : '';
    const itemsXml = demoItems
      .map(item => {
        const spans = findElementsByTag(item, 'span');
        const strongs = findElementsByTag(item, 'strong');
        const lbl = spans[0] ? extractPlainText(spans[0]).trim() : '';
        const val = strongs[0] ? extractPlainText(strongs[0]).trim() : extractPlainText(item).trim();
        return buildParagraphFromRuns(
          buildRunXml(`${lbl}: `, { bold: true, sizeHalfPt: 21, colorHex: '475569' }) +
            buildRunXml(val, { bold: true, sizeHalfPt: 22, colorHex: '0F172A' }),
          { spaceBefore: 30, spaceAfter: 30 }
        );
      })
      .join('');
    return buildCalloutBoxTable(titleXml + itemsXml, { fillHex: 'F8FAFC', boxBorderHex: 'CBD5E1', spaceAfter: 140 });
  }

  // 3. Module Card Header (.module-card-header)
  if (classes.has('module-card-header')) {
    const h2Node = findElementsByTag(node, 'h2')[0];
    const badgeNodes = findElementsByClass(node, 'badge');
    const titleText = h2Node ? extractPlainText(h2Node).trim() : extractPlainText(node).trim();
    const badgesText = badgeNodes.map(b => `[${extractPlainText(b).trim()}]`).join('  ');

    const titleP = buildParagraphFromText(titleText, {
      bold: true,
      sizeHalfPt: 26,
      colorHex: '0F172A',
      spaceBefore: 40,
      spaceAfter: 40
    });
    const badgeP = badgesText
      ? buildParagraphFromText(badgesText, {
          bold: true,
          sizeHalfPt: 18,
          colorHex: '4F46E5',
          align: 'right',
          spaceBefore: 40,
          spaceAfter: 40
        })
      : '<w:p/>';

    return `<w:p><w:pPr><w:spacing w:before="140" w:after="20"/></w:pPr></w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:left w:val="single" w:sz="24" w:space="0" w:color="4F46E5"/>
          <w:bottom w:val="single" w:sz="10" w:space="0" w:color="CBD5E1"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="100" w:type="dxa"/>
          <w:left w:w="160" w:type="dxa"/>
          <w:bottom w:w="100" w:type="dxa"/>
          <w:right w:w="160" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3400" w:type="pct"/><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/><w:vAlign w:val="center"/></w:tcPr>${titleP}</w:tc>
        <w:tc><w:tcPr><w:tcW w:w="1600" w:type="pct"/><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/><w:vAlign w:val="center"/></w:tcPr>${badgeP}</w:tc>
      </w:tr>
    </w:tbl>
    <w:p><w:pPr><w:spacing w:before="20" w:after="60"/></w:pPr></w:p>`;
  }

  // 4. Question / Answer block (.qa-item, .q-text, .q-desc, .a-text, .sub-note)
  if (classes.has('q-text')) {
    return buildParagraphFromNodes(children, {
      bold: true,
      sizeHalfPt: 22,
      colorHex: '1E293B',
      spaceBefore: 120,
      spaceAfter: 40
    });
  }
  if (classes.has('q-desc')) {
    return buildParagraphFromNodes(children, {
      italic: true,
      sizeHalfPt: 19,
      colorHex: '64748B',
      spaceBefore: 0,
      spaceAfter: 40
    });
  }
  if (classes.has('a-text')) {
    const pXml = buildParagraphFromNodes(children, {
      sizeHalfPt: 22,
      colorHex: '0F172A',
      preserveNewlines: true,
      spaceBefore: 20,
      spaceAfter: 20
    });
    return buildCalloutBoxTable(pXml, {
      fillHex: 'F8FAFC',
      leftBorderHex: '4F46E5',
      boxBorderHex: 'E2E8F0',
      spaceAfter: 60
    });
  }
  if (classes.has('sub-note')) {
    const pXml = buildParagraphFromNodes(children, {
      sizeHalfPt: 20,
      colorHex: '334155',
      preserveNewlines: true,
      spaceBefore: 20,
      spaceAfter: 20
    });
    return buildCalloutBoxTable(pXml, {
      fillHex: 'EEF2FF',
      leftBorderHex: '818CF8',
      boxBorderHex: 'C7D2FE',
      spaceAfter: 60
    });
  }

  // 5. Mentor Notes Box (.mentor-notes-box)
  if (classes.has('mentor-notes-box')) {
    const titleNode = findElementsByClass(node, 'mentor-notes-title')[0];
    const bodyNode = findElementsByClass(node, 'mentor-notes-body')[0];
    const titleXml = titleNode
      ? buildParagraphFromText(extractPlainText(titleNode).trim(), {
          bold: true,
          sizeHalfPt: 21,
          colorHex: 'B45309',
          spaceBefore: 20,
          spaceAfter: 40
        })
      : '';
    const bodyXml = bodyNode
      ? buildParagraphFromText(extractPlainText(bodyNode).trim(), {
          sizeHalfPt: 22,
          colorHex: '1E293B',
          preserveNewlines: true,
          spaceBefore: 20,
          spaceAfter: 20
        })
      : '';
    return buildCalloutBoxTable(titleXml + bodyXml, {
      fillHex: 'FFFBEB',
      leftBorderHex: 'F59E0B',
      boxBorderHex: 'F59E0B',
      spaceAfter: 120
    });
  }

  // 6. Scored Test Headers & Banners
  if (classes.has('test-header')) {
    return buildParagraphFromText(extractPlainText(node).trim(), {
      bold: true,
      sizeHalfPt: 24,
      colorHex: '4F46E5',
      spaceBefore: 160,
      spaceAfter: 100,
      bottomBorderColor: 'C7D2FE'
    });
  }

  if (classes.has('color-result-banner')) {
    const smallLbl = findElementsByClass(node, 'small-label')[0];
    const largeRes = findElementsByClass(node, 'large-result')[0];
    const p1 = smallLbl
      ? buildParagraphFromText(extractPlainText(smallLbl).trim(), { bold: true, sizeHalfPt: 18, colorHex: '4F46E5', spaceBefore: 10, spaceAfter: 20 })
      : '';
    const p2 = largeRes
      ? buildParagraphFromText(extractPlainText(largeRes).trim(), { bold: true, sizeHalfPt: 28, colorHex: '0F172A', spaceBefore: 10, spaceAfter: 20 })
      : '';
    return buildCalloutBoxTable(p1 + p2, { fillHex: 'EEF2FF', leftBorderHex: '4F46E5', boxBorderHex: 'C7D2FE', spaceAfter: 100 });
  }

  // 7. 2-Column Grids (.pf16-grid, .riasec-grid, .smi-grid, .smi-rankings-grid)
  if (
    classes.has('pf16-grid') ||
    classes.has('riasec-grid') ||
    classes.has('smi-grid') ||
    classes.has('smi-rankings-grid')
  ) {
    const elementChildren = children.filter(c => c.type === 'element');
    return renderTwoColumnGridToTableXml(elementChildren);
  }

  // 8. Individual items inside grids/cards
  if (classes.has('pf16-num')) {
    return buildParagraphFromText(extractPlainText(node).trim(), { bold: true, sizeHalfPt: 19, colorHex: '4F46E5', spaceBefore: 10, spaceAfter: 20 });
  }
  if (classes.has('pf16-between') || classes.has('pf16-text')) {
    return buildParagraphFromText(extractPlainText(node).trim(), { sizeHalfPt: 20, colorHex: '1E293B', spaceBefore: 10, spaceAfter: 20 });
  }
  if (classes.has('pf16-val')) {
    return buildParagraphFromText(extractPlainText(node).trim(), { bold: true, sizeHalfPt: 20, colorHex: '0F172A', spaceBefore: 10, spaceAfter: 10 });
  }
  if (classes.has('riasec-card-header') || classes.has('color-section-title') || classes.has('smi-rank-title')) {
    const spans = findElementsByTag(node, 'span');
    if (spans.length >= 2) {
      return buildParagraphFromRuns(
        buildRunXml(extractPlainText(spans[0]).trim() + ' — ', { bold: true, sizeHalfPt: 21, colorHex: '0F172A' }) +
          buildRunXml(extractPlainText(spans[1]).trim(), { bold: true, sizeHalfPt: 19, colorHex: '4F46E5' }),
        { spaceBefore: 20, spaceAfter: 40, bottomBorderColor: 'E2E8F0' }
      );
    }
    return buildParagraphFromText(extractPlainText(node).trim(), { bold: true, sizeHalfPt: 21, colorHex: '0F172A', spaceBefore: 20, spaceAfter: 40, bottomBorderColor: 'E2E8F0' });
  }
  if (classes.has('smi-item')) {
    const spans = findElementsByTag(node, 'span');
    const strongs = findElementsByTag(node, 'strong');
    const lbl = spans[0] ? extractPlainText(spans[0]).trim() : '';
    const pts = strongs[0] ? extractPlainText(strongs[0]).trim() : '';
    return buildParagraphFromRuns(
      buildRunXml(lbl + ': ', { sizeHalfPt: 20, colorHex: '1E293B' }) +
        buildRunXml(pts, { bold: true, sizeHalfPt: 21, colorHex: '4F46E5' }),
      { spaceBefore: 20, spaceAfter: 20 }
    );
  }

  // 9. Parents Meeting Cards & Fields (.parents-card, .parent-field, .ratings-block, .priority-item)
  if (classes.has('parents-card') || classes.has('jf-sec-card') || classes.has('color-section-card')) {
    return renderNodeChildrenToXml(children);
  }
  if (classes.has('parents-card-title') || classes.has('jf-cat-title') || classes.has('jf-sec-title') || classes.has('sub-section-title')) {
    return buildParagraphFromText(extractPlainText(node).trim(), {
      bold: true,
      sizeHalfPt: 22,
      colorHex: '0F172A',
      shadingFill: 'F1F5F9',
      spaceBefore: 120,
      spaceAfter: 60,
      bottomBorderColor: 'CBD5E1'
    });
  }
  if (classes.has('parent-field')) {
    const lblNode = findElementsByClass(node, 'parent-label')[0];
    const valNode = findElementsByClass(node, 'parent-value')[0];
    const lbl = lblNode ? extractPlainText(lblNode).trim() : '';
    const val = valNode ? extractPlainText(valNode).trim() : '';
    return buildParagraphFromRuns(
      buildRunXml(`${lbl}: `, { bold: true, sizeHalfPt: 20, colorHex: '475569' }) +
        buildRunXml(val, { sizeHalfPt: 21, colorHex: '0F172A', preserveNewlines: true }),
      { spaceBefore: 30, spaceAfter: 40 }
    );
  }
  if (classes.has('ratings-block')) {
    const boxes = findElementsByClass(node, 'rating-box');
    const parts = boxes.map(b => {
      const rl = findElementsByClass(b, 'r-label')[0];
      const rv = findElementsByClass(b, 'r-val')[0];
      return `${rl ? extractPlainText(rl).trim() : ''}: ${rv ? extractPlainText(rv).trim() : ''}`;
    });
    return buildParagraphFromText(parts.join('   |   '), {
      bold: true,
      sizeHalfPt: 20,
      colorHex: '1E293B',
      shadingFill: 'E2E8F0',
      spaceBefore: 60,
      spaceAfter: 60
    });
  }
  if (classes.has('priority-item')) {
    const top = findElementsByClass(node, 'priority-top')[0];
    const exp = findElementsByClass(node, 'priority-exp')[0];
    const spans = top ? findElementsByTag(top, 'span') : [];
    const strongs = top ? findElementsByTag(top, 'strong') : [];
    const name = spans[0] ? extractPlainText(spans[0]).trim() : '';
    const score = strongs[0] ? extractPlainText(strongs[0]).trim() : '';
    let xml = buildParagraphFromRuns(
      buildRunXml(`• ${name}: `, { bold: true, sizeHalfPt: 21, colorHex: '1E293B' }) +
        buildRunXml(score, { bold: true, sizeHalfPt: 21, colorHex: '4F46E5' }),
      { spaceBefore: 30, spaceAfter: 20 }
    );
    if (exp) {
      xml += buildParagraphFromText(extractPlainText(exp).trim(), {
        italic: true,
        sizeHalfPt: 20,
        colorHex: '475569',
        indentLeft: 360,
        spaceBefore: 0,
        spaceAfter: 40
      });
    }
    return xml;
  }

  // 10. Self Discovery (.sd-question-item) & Job Functions (.jf-item-row)
  if (classes.has('sd-q-title')) {
    return buildParagraphFromText(extractPlainText(node).trim(), {
      bold: true,
      sizeHalfPt: 21,
      colorHex: '1E293B',
      spaceBefore: 100,
      spaceAfter: 30
    });
  }
  if (classes.has('sd-a-box')) {
    return buildParagraphFromText(extractPlainText(node).trim(), {
      sizeHalfPt: 21,
      colorHex: '334155',
      preserveNewlines: true,
      leftBorderColor: '6366F1',
      indentLeft: 180,
      spaceBefore: 20,
      spaceAfter: 80
    });
  }
  if (classes.has('jf-item-row')) {
    const textNode = findElementsByClass(node, 'jf-item-text')[0];
    const badgeNode = findElementsByClass(node, 'jf-badge')[0];
    const itemText = textNode ? extractPlainText(textNode).trim() : extractPlainText(node).trim();
    const badgeText = badgeNode ? extractPlainText(badgeNode).trim() : '';
    return buildParagraphFromRuns(
      buildRunXml(`${itemText}  —  `, { sizeHalfPt: 20, colorHex: '1E293B' }) +
        buildRunXml(badgeText, { bold: true, sizeHalfPt: 20, colorHex: '4F46E5' }),
      { spaceBefore: 25, spaceAfter: 25 }
    );
  }

  // 11. Standard HTML Headings, Tables, Lists, Paragraphs
  if (tag === 'h1') {
    return buildParagraphFromNodes(children, {
      bold: true,
      sizeHalfPt: 36,
      colorHex: '111827',
      align: 'center',
      spaceBefore: 120,
      spaceAfter: 160
    });
  }
  if (tag === 'h2') {
    return buildParagraphFromNodes(children, {
      bold: true,
      sizeHalfPt: 28,
      colorHex: '111827',
      spaceBefore: 260,
      spaceAfter: 120,
      bottomBorderColor: '111827'
    });
  }
  if (tag === 'h3') {
    return buildParagraphFromNodes(children, {
      bold: true,
      sizeHalfPt: 24,
      colorHex: '1E293B',
      spaceBefore: 180,
      spaceAfter: 80
    });
  }
  if (tag === 'h4' || tag === 'h5' || tag === 'h6') {
    return buildParagraphFromNodes(children, {
      bold: true,
      sizeHalfPt: 22,
      colorHex: '1E293B',
      spaceBefore: 140,
      spaceAfter: 60
    });
  }
  if (tag === 'table') {
    return renderTableNodeToXml(node);
  }
  if (tag === 'ul' || tag === 'ol') {
    const liNodes = children.filter(c => c.tag === 'li');
    return liNodes
      .map((li, idx) => {
        const prefix = tag === 'ol' ? `${idx + 1}. ` : '• ';
        const innerRuns = renderInlineNodesToRuns(li.children || [], { sizeHalfPt: 21, colorHex: '1F2937' });
        const prefixRun = buildRunXml(prefix, { bold: tag === 'ol', sizeHalfPt: 21, colorHex: '1F2937' });
        return buildParagraphFromRuns(prefixRun + innerRuns, {
          indentLeft: 360,
          spaceBefore: 30,
          spaceAfter: 40
        });
      })
      .join('\n');
  }
  if (tag === 'p') {
    return buildParagraphFromNodes(children, {
      sizeHalfPt: 22,
      colorHex: '111827',
      spaceBefore: 50,
      spaceAfter: 80
    });
  }

  if (classes.has('legend')) {
    return buildParagraphFromNodes(children, {
      bold: true,
      sizeHalfPt: 20,
      colorHex: '374151',
      spaceBefore: 40,
      spaceAfter: 80
    });
  }

  // Generic container (div, section, etc.): if it has block-level children, recurse; otherwise render inline content as paragraph
  const BLOCK_TAGS = new Set(['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'ul', 'ol', 'section', 'article', 'header', 'footer']);
  const hasBlockChild = children.some(c => c.type === 'element' && BLOCK_TAGS.has(c.tag || ''));

  if (hasBlockChild) {
    return renderNodeChildrenToXml(children);
  }

  const inlineRuns = renderInlineNodesToRuns(children, { sizeHalfPt: 22, colorHex: '1E293B' });
  if (!inlineRuns) return '';
  return buildParagraphFromRuns(inlineRuns, { spaceBefore: 40, spaceAfter: 60 });
}

function renderNodeChildrenToXml(children: HtmlNode[]): string {
  const xmlParts: string[] = [];
  for (const child of children) {
    const rendered = renderNodeToXml(child);
    if (rendered) xmlParts.push(rendered);
  }
  return xmlParts.join('\n');
}

function convertHtmlToWordBodyXml(rawHtml: string): string {
  const tree = parseHtmlToTree(rawHtml);
  const bodyXml = renderNodeChildrenToXml(tree);
  return bodyXml || '<w:p/>';
}

// --- CRC32 & ZIP Builder for OpenXML (.docx) ---

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Buffer;
}

function buildZipBuffer(entries: ZipEntry[]): Buffer {
  const localFileHeaders: Buffer[] = [];
  const centralDirHeaders: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const uncompressedSize = entry.data.length;
    const crc = crc32(entry.data);
    const compressedData = deflateRawSync(entry.data);
    const compressedSize = compressedData.length;

    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x21, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuf.copy(localHeader, 30);

    localFileHeaders.push(localHeader, compressedData);

    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x21, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressedSize, 20);
    centralHeader.writeUInt32LE(uncompressedSize, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    nameBuf.copy(centralHeader, 46);

    centralDirHeaders.push(centralHeader);
    offset += localHeader.length + compressedData.length;
  }

  const centralDirBuf = Buffer.concat(centralDirHeaders);
  const endOfCentralDir = Buffer.alloc(22);
  endOfCentralDir.writeUInt32LE(0x06054b50, 0);
  endOfCentralDir.writeUInt16LE(0, 4);
  endOfCentralDir.writeUInt16LE(0, 6);
  endOfCentralDir.writeUInt16LE(entries.length, 8);
  endOfCentralDir.writeUInt16LE(entries.length, 10);
  endOfCentralDir.writeUInt32LE(centralDirBuf.length, 12);
  endOfCentralDir.writeUInt32LE(offset, 16);
  endOfCentralDir.writeUInt16LE(0, 20);

  return Buffer.concat([...localFileHeaders, centralDirBuf, endOfCentralDir]);
}

/**
 * Generates a modern Word 2016/2019/365 OpenXML (.docx) binary Buffer from HTML.
 */
export function generateModernDocxFromHtml(rawHtml: string): Buffer {
  const bodyXml = convertHtmlToWordBodyXml(rawHtml);

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const documentRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;

  const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:compat>
    <w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>
    <w:compatSetting w:name="overrideTableStyleFontSizeAndJustification" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>
    <w:compatSetting w:name="enableOpenTypeFeatures" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>
  </w:compat>
</w:settings>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="100" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  return buildZipBuffer([
    { name: '[Content_Types].xml', data: Buffer.from(contentTypesXml, 'utf8') },
    { name: '_rels/.rels', data: Buffer.from(rootRelsXml, 'utf8') },
    { name: 'word/_rels/document.xml.rels', data: Buffer.from(documentRelsXml, 'utf8') },
    { name: 'word/settings.xml', data: Buffer.from(settingsXml, 'utf8') },
    { name: 'word/styles.xml', data: Buffer.from(stylesXml, 'utf8') },
    { name: 'word/document.xml', data: Buffer.from(documentXml, 'utf8') },
  ]);
}

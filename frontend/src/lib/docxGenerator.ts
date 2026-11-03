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
  // Remove invalid XML 1.0 control characters
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface TextRunOptions {
  bold?: boolean;
  italic?: boolean;
  sizeHalfPt?: number; // e.g. 22 = 11pt
  colorHex?: string;   // e.g. '111827'
}

function buildRunXml(rawText: string, opts: TextRunOptions = {}): string {
  const lines = rawText.split(/\r?\n/);
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

/**
 * Parses inline HTML (like <strong>, <b>, <em>, <i>, <br/>, <span>) into Word <w:r> runs
 */
function parseInlineHtmlToRuns(html: string, baseOpts: TextRunOptions = {}): string {
  if (!html) return '';
  // Normalize <br> tags to newline characters and strip block wrappers if any
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
    .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
    .replace(/<\/li>\s*<li[^>]*>/gi, '\n• ')
    .replace(/<li[^>]*>/gi, '• ');

  // Tokenize by inline tags: strong, b, em, i, small, span
  const tokenRegex = /(<\/?(?:strong|b|em|i|small|span)[^>]*>)/gi;
  const parts = withBreaks.split(tokenRegex);

  let bold = !!baseOpts.bold;
  let italic = !!baseOpts.italic;
  let sizeHalfPt = baseOpts.sizeHalfPt || 22;
  const runs: string[] = [];

  for (const part of parts) {
    if (!part) continue;
    const lower = part.toLowerCase();
    if (lower.startsWith('<strong') || lower.startsWith('<b ') || lower === '<b>') {
      bold = true;
      continue;
    }
    if (lower === '</strong>' || lower === '</b>') {
      bold = !!baseOpts.bold;
      continue;
    }
    if (lower.startsWith('<em') || lower.startsWith('<i ') || lower === '<i>') {
      italic = true;
      continue;
    }
    if (lower === '</em>' || lower === '</i>') {
      italic = !!baseOpts.italic;
      continue;
    }
    if (lower.startsWith('<small')) {
      sizeHalfPt = Math.max(16, (baseOpts.sizeHalfPt || 22) - 4);
      continue;
    }
    if (lower === '</small>') {
      sizeHalfPt = baseOpts.sizeHalfPt || 22;
      continue;
    }
    if (lower.startsWith('<span') || lower === '</span>') {
      continue;
    }

    // Strip any remaining HTML tags
    const plain = part.replace(/<[^>]+>/g, '');
    if (!plain) continue;
    const runXml = buildRunXml(plain, {
      ...baseOpts,
      bold,
      italic,
      sizeHalfPt
    });
    if (runXml) runs.push(runXml);
  }

  return runs.join('');
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

function buildParagraphXml(inlineHtml: string, opts: ParagraphOptions = {}): string {
  const pPrParts: string[] = [];
  if (opts.align) {
    pPrParts.push(`<w:jc w:val="${opts.align}"/>`);
  }
  const before = opts.spaceBefore ?? 60;
  const after = opts.spaceAfter ?? 100;
  pPrParts.push(`<w:spacing w:before="${before}" w:after="${after}" w:line="276" w:lineRule="auto"/>`);

  if (opts.bottomBorderColor || opts.leftBorderColor) {
    const bdrParts: string[] = [];
    if (opts.bottomBorderColor) {
      bdrParts.push(`<w:bottom w:val="single" w:sz="12" w:space="4" w:color="${opts.bottomBorderColor}"/>`);
    }
    if (opts.leftBorderColor) {
      bdrParts.push(`<w:left w:val="single" w:sz="18" w:space="8" w:color="${opts.leftBorderColor}"/>`);
    }
    pPrParts.push(`<w:pBdr>${bdrParts.join('')}</w:pBdr>`);
  }

  if (opts.shadingFill) {
    pPrParts.push(`<w:shd w:val="clear" w:color="auto" w:fill="${opts.shadingFill}"/>`);
  }

  if (opts.indentLeft) {
    pPrParts.push(`<w:ind w:left="${opts.indentLeft}"/>`);
  }

  const runsXml = parseInlineHtmlToRuns(inlineHtml, opts);
  if (!runsXml) return '';
  return `<w:p><w:pPr>${pPrParts.join('')}</w:pPr>${runsXml}</w:p>`;
}

function convertTableHtmlToXml(tableHtml: string): string {
  const rowMatches = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi);
  if (!rowMatches || rowMatches.length === 0) return '';

  const trXmlList: string[] = [];

  for (const rowHtml of rowMatches) {
    const cellRegex = /<(th|td)([^>]*)>([\s\S]*?)<\/\1>/gi;
    let cellMatch: RegExpExecArray | null;
    const tcXmlList: string[] = [];

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      const tag = cellMatch[1].toLowerCase();
      const attrs = cellMatch[2] || '';
      const cellInner = (cellMatch[3] || '').trim();
      const isHeader = tag === 'th';

      const colspanMatch = attrs.match(/colspan=["']?(\d+)["']?/i);
      const colspan = colspanMatch ? Number(colspanMatch[1]) : 1;

      const tcPrParts: string[] = [];
      if (colspan > 1) {
        tcPrParts.push(`<w:gridSpan w:val="${colspan}"/>`);
      }
      if (isHeader) {
        tcPrParts.push('<w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>');
      }
      tcPrParts.push('<w:vAlign w:val="top"/>');

      // Split cell content by <p> or <br> if needed, or build a single clean paragraph
      const cellParagraph = buildParagraphXml(cellInner || '—', {
        bold: isHeader,
        sizeHalfPt: 20,
        colorHex: '111827',
        spaceBefore: 40,
        spaceAfter: 40
      }) || '<w:p/>';

      tcXmlList.push(`<w:tc><w:tcPr>${tcPrParts.join('')}</w:tcPr>${cellParagraph}</w:tc>`);
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
        <w:top w:w="100" w:type="dxa"/>
        <w:left w:w="140" w:type="dxa"/>
        <w:bottom w:w="100" w:type="dxa"/>
        <w:right w:w="140" w:type="dxa"/>
      </w:tblCellMar>
      <w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>
    </w:tblPr>
    ${trXmlList.join('\n')}
  </w:tbl>`;
}

/**
 * Normalizes custom div classes from Combined Answers & Structured Report into semantic tags
 * before tokenizing into WordprocessingML blocks.
 */
function preprocessHtmlForDocx(rawHtml: string): string {
  let body = rawHtml;
  const bodyMatch = body.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    body = bodyMatch[1];
  }

  // Strip scripts, styles, and action toolbars
  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<div[^>]*id=["']pdf-action-bar["'][^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, '')
    .replace(/<div[^>]*class=["'][^"']*no-print[^"']*["'][^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, '');

  // Transform Combined Answers semantic divs into h3 / p tags so they preserve structure
  body = body
    .replace(/<div[^>]*class=["'][^"']*demo-title[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, '<h3>$1</h3>')
    .replace(/<div[^>]*class=["'][^"']*demo-item[^"']*["'][^>]*>\s*<span>([\s\S]*?)<\/span>\s*<strong>([\s\S]*?)<\/strong>\s*<\/div>/gi, '<p><strong>$1:</strong> $2</p>')
    .replace(/<div[^>]*class=["'][^"']*module-badges[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, '<p><em>$1</em></p>')
    .replace(/<span[^>]*class=["'][^"']*badge[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi, '[$1] ')
    .replace(/<div[^>]*class=["'][^"']*q-text[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, '<p class="q-text"><strong>$1</strong></p>')
    .replace(/<div[^>]*class=["'][^"']*q-desc[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, '<p class="q-desc"><em>$1</em></p>')
    .replace(/<div[^>]*class=["'][^"']*sub-note[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, '<p class="sub-note">$1</p>')
    .replace(/<div[^>]*class=["'][^"']*mentor-notes-title[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, '<p class="mentor-note"><strong>$1</strong></p>')
    .replace(/<div[^>]*class=["'][^"']*mentor-notes-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, '<p class="mentor-note">$1</p>')
    .replace(/<div[^>]*class=["'][^"']*legend[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, '<p><strong>$1</strong></p>')
    .replace(/<div[^>]*class=["'][^"']*jf-item-row[^"']*["'][^>]*>\s*<span>([\s\S]*?)<\/span>\s*<span[^>]*>([\s\S]*?)<\/span>\s*<\/div>/gi, '<p>• $1 — <strong>$2</strong></p>');

  // Unwrap `.a-text` divs that don't contain tables into `<p class="a-text">`
  body = body.replace(/<div[^>]*class=["'][^"']*a-text[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, (_, inner) => {
    if (/<table/i.test(inner) || /<ul/i.test(inner) || /<ol/i.test(inner)) {
      return inner;
    }
    return `<p class="a-text">${inner}</p>`;
  });

  return body;
}

function convertHtmlToWordBodyXml(rawHtml: string): string {
  const cleaned = preprocessHtmlForDocx(rawHtml);

  // Match top-level semantic elements in document order: h1, h2, h3, h4, table, ul, ol, p
  const blockRegex = /<(h1|h2|h3|h4|table|ul|ol|p)([^>]*)>([\s\S]*?)<\/\1>/gi;
  const xmlBlocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(cleaned)) !== null) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] || '';
    const inner = (match[3] || '').trim();
    if (!inner) continue;

    if (tag === 'h1') {
      const p = buildParagraphXml(inner, {
        bold: true,
        sizeHalfPt: 36,
        colorHex: '111827',
        align: 'center',
        spaceBefore: 120,
        spaceAfter: 160
      });
      if (p) xmlBlocks.push(p);
    } else if (tag === 'h2') {
      const p = buildParagraphXml(inner, {
        bold: true,
        sizeHalfPt: 28,
        colorHex: '111827',
        spaceBefore: 280,
        spaceAfter: 120,
        bottomBorderColor: '111827'
      });
      if (p) xmlBlocks.push(p);
    } else if (tag === 'h3' || tag === 'h4') {
      const p = buildParagraphXml(inner, {
        bold: true,
        sizeHalfPt: 24,
        colorHex: '1E293B',
        spaceBefore: 200,
        spaceAfter: 80
      });
      if (p) xmlBlocks.push(p);
    } else if (tag === 'table') {
      const tbl = convertTableHtmlToXml(`<table>${inner}</table>`);
      if (tbl) {
        xmlBlocks.push(tbl);
        // Add a small spacer paragraph after table
        xmlBlocks.push('<w:p><w:pPr><w:spacing w:before="40" w:after="80"/></w:pPr></w:p>');
      }
    } else if (tag === 'ul' || tag === 'ol') {
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch: RegExpExecArray | null;
      let idx = 1;
      while ((liMatch = liRegex.exec(inner)) !== null) {
        const prefix = tag === 'ol' ? `${idx++}. ` : '• ';
        const p = buildParagraphXml(`${prefix}${liMatch[1].trim()}`, {
          sizeHalfPt: 21,
          colorHex: '1F2937',
          indentLeft: 360,
          spaceBefore: 30,
          spaceAfter: 40
        });
        if (p) xmlBlocks.push(p);
      }
    } else if (tag === 'p') {
      // Check if <p> has special class
      const isQuestion = /q-text/i.test(attrs);
      const isDesc = /q-desc/i.test(attrs);
      const isSubNote = /sub-note/i.test(attrs);
      const isMentorNote = /mentor-note/i.test(attrs);

      const p = buildParagraphXml(inner, {
        bold: isQuestion,
        italic: isDesc,
        sizeHalfPt: isDesc ? 19 : 22,
        colorHex: isDesc ? '64748B' : isMentorNote ? '92400E' : '111827',
        spaceBefore: isQuestion ? 160 : 40,
        spaceAfter: isQuestion ? 40 : 80,
        leftBorderColor: isSubNote ? '6366F1' : isMentorNote ? 'F59E0B' : undefined,
        shadingFill: isMentorNote ? 'FFFBEB' : undefined,
        indentLeft: isSubNote || isMentorNote ? 200 : undefined
      });
      if (p) xmlBlocks.push(p);
    }
  }

  return xmlBlocks.join('\n');
}

// ---------------------------------------------------------------------------
// Minimal ZIP builder (creates a valid ECMA-376 OpenXML .docx archive in memory)
// ---------------------------------------------------------------------------

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC32_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Buffer;
}

function createZipBuffer(entries: ZipEntry[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const uncompressed = entry.data;
    const compressed = deflateRawSync(uncompressed);
    const crc = crc32(uncompressed);

    // Local file header (30 bytes + name)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4);         // version needed (2.0)
    localHeader.writeUInt16LE(0, 6);          // flags
    localHeader.writeUInt16LE(8, 8);          // compression method (8 = deflate)
    localHeader.writeUInt16LE(0, 10);         // mod time
    localHeader.writeUInt16LE(0x21, 12);      // mod date
    localHeader.writeUInt32LE(crc, 14);       // crc32
    localHeader.writeUInt32LE(compressed.length, 18); // compressed size
    localHeader.writeUInt32LE(uncompressed.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26); // file name length
    localHeader.writeUInt16LE(0, 28);         // extra field length

    localParts.push(localHeader, nameBuf, compressed);

    // Central directory header (46 bytes + name)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(20, 4);         // version made by
    centralHeader.writeUInt16LE(20, 6);         // version needed
    centralHeader.writeUInt16LE(0, 8);          // flags
    centralHeader.writeUInt16LE(8, 10);         // compression method
    centralHeader.writeUInt16LE(0, 12);         // mod time
    centralHeader.writeUInt16LE(0x21, 14);      // mod date
    centralHeader.writeUInt32LE(crc, 16);       // crc32
    centralHeader.writeUInt32LE(compressed.length, 20); // compressed size
    centralHeader.writeUInt32LE(uncompressed.length, 24); // uncompressed size
    centralHeader.writeUInt16LE(nameBuf.length, 28); // file name length
    centralHeader.writeUInt16LE(0, 30);         // extra field length
    centralHeader.writeUInt16LE(0, 32);         // comment length
    centralHeader.writeUInt16LE(0, 34);         // disk number
    centralHeader.writeUInt16LE(0, 36);         // internal attrs
    centralHeader.writeUInt32LE(0, 38);         // external attrs
    centralHeader.writeUInt32LE(offset, 42);    // relative offset of local header

    centralParts.push(centralHeader, nameBuf);
    offset += 30 + nameBuf.length + compressed.length;
  }

  const centralDirSize = centralParts.reduce((acc, b) => acc + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);          // EOCD signature
  eocd.writeUInt16LE(0, 4);                   // disk number
  eocd.writeUInt16LE(0, 6);                   // disk with central dir
  eocd.writeUInt16LE(entries.length, 8);      // entries on this disk
  eocd.writeUInt16LE(entries.length, 10);     // total entries
  eocd.writeUInt32LE(centralDirSize, 12);     // size of central dir
  eocd.writeUInt32LE(offset, 16);             // offset of central dir
  eocd.writeUInt16LE(0, 20);                  // comment length

  return Buffer.concat([...localParts, ...centralParts, eocd]);
}

/**
 * Generates a modern Word (2016/2019/365 OpenXML .docx) Buffer from HTML content.
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

  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;

  // compatibilityMode = 15 sets Word 2013/2016/2019/365 modern format (never 97-2003 or Compatibility Mode)
  const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:compat>
    <w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>
    <w:compatSetting w:name="overrideTableStyleFontSizeAndJustification" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>
    <w:compatSetting w:name="enableOpenTypeFeatures" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>
    <w:compatSetting w:name="doNotFlipMirrorIndents" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>
    <w:compatSetting w:name="differentiateMultirowTableHeaders" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>
  </w:compat>
</w:settings>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:color w:val="111827"/>
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
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  return createZipBuffer([
    { name: '[Content_Types].xml', data: Buffer.from(contentTypesXml, 'utf8') },
    { name: '_rels/.rels', data: Buffer.from(rootRelsXml, 'utf8') },
    { name: 'word/_rels/document.xml.rels', data: Buffer.from(docRelsXml, 'utf8') },
    { name: 'word/settings.xml', data: Buffer.from(settingsXml, 'utf8') },
    { name: 'word/styles.xml', data: Buffer.from(stylesXml, 'utf8') },
    { name: 'word/document.xml', data: Buffer.from(documentXml, 'utf8') }
  ]);
}

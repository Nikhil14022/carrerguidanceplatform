import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import pf16Questions from '@/data/pf16_questions.json';
import {
  COLOR_SECTIONS,
  SMI_SCENARIOS,
  SMI_COLUMN_LABELS,
  SD_ROUND1,
  SD_TEEN,
  SD_ADULT,
  JF_SECTIONS,
} from '@/lib/testQuestions';
import { testScoringService } from '@/services/TestScoringService';
import { generateModernDocxFromHtml } from '@/lib/docxGenerator';

const MENTOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY', 'EXPERT'];

export const dynamic = 'force-dynamic';

const EXTRA_FAMILY_QUESTIONS = [
  {
    id: 'family_lives_with',
    type: 'textarea',
    question: 'Who all do you currently live with at home?'
  },
  {
    id: 'family_arguments',
    type: 'textarea',
    question: 'What kind of arguments or disagreements do you usually have at home, and how are they resolved?'
  },
  {
    id: 'family_repeated_statements',
    type: 'textarea',
    question: 'What are some statements or phrases your family members keep repeating to you (can be good or bad)?'
  }
];

function isFilePath(val: any): boolean {
  if (typeof val !== 'string') return false;
  return val.startsWith('/uploads/') || val.startsWith('/api/upload/');
}

function cleanFileName(filepath: string): string {
  const raw = decodeURIComponent(filepath.split('/').pop() || filepath);
  // Strip leading timestamp prefix if present (e.g. "1793551234-marksheet.pdf" -> "marksheet.pdf")
  return raw.replace(/^\d{10,14}-/, '');
}

function getIntensityBand(score: number): string {
  if (score <= 4) return 'Not very high';
  if (score <= 7) return 'High';
  return 'Very high';
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!session?.user || !MENTOR_ROLES.includes(session.user.role)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const role = session.user.role;
    const mentorProfileId = session.user.mentorProfileId;

    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      if (!mentorProfileId) return new NextResponse('Forbidden', { status: 403 });
      const assignment = await (prisma as any).mentorAssignment.findFirst({
        where: { mentorProfileId, clientProfileId: id, isActive: true }
      });
      if (!assignment) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    const url = new URL(request.url);
    const modulesParam = url.searchParams.get('modules');
    const format = (url.searchParams.get('format') || 'pdf').toLowerCase();

    let client = await prisma.clientProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            module: true,
            response: { select: { data: true, submittedAt: true, approvedAt: true } }
          }
        },
        parentData: true
      }
    });

    if (!client) {
      client = await prisma.clientProfile.findUnique({
        where: { userId: id },
        include: {
          user: { select: { id: true, email: true, name: true } },
          modules: {
            orderBy: { order: 'asc' },
            include: {
              module: true,
              response: { select: { data: true, submittedAt: true, approvedAt: true } }
            }
          },
          parentData: true
        }
      });
    }

    if (!client) {
      return new NextResponse('Client not found', { status: 404 });
    }

    // Filter modules if ?modules= query param is provided
    let filteredModules = client.modules;
    if (modulesParam && modulesParam.trim() !== '') {
      const requestedIds = new Set(
        modulesParam
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      );
      filteredModules = client.modules.filter(
        m =>
          requestedIds.has(m.id) ||
          requestedIds.has(m.moduleId) ||
          requestedIds.has(String(m.order))
      );
    }

    const formatResponseValue = (q: any, val: any): string => {
      if (val === undefined || val === null || val === '') return '—';

      // File URL array or single file URL
      if (isFilePath(val)) {
        return `Attached File: ${cleanFileName(val)}`;
      }
      if (Array.isArray(val) && val.length > 0 && val.every(item => isFilePath(item))) {
        return val.map(item => `Attached File: ${cleanFileName(item)}`).join('\n');
      }

      // Strength / Weakness object { type: 'strength' | 'weakness', rating: number }
      if (val && typeof val === 'object' && ('type' in val) && ('rating' in val) && (val.type === 'strength' || val.type === 'weakness')) {
        const label = val.type === 'weakness' ? 'Weakness' : 'Strength';
        const r = Number(val.rating) || 5;
        return `${label} — Rating: ${r}/10 (${getIntensityBand(r)})`;
      }

      // Scale rating for sw_* (legacy numeric) or fear_*
      if (typeof val === 'number' && q?.id?.startsWith('sw_')) {
        const label = val < 5 ? 'Weakness' : 'Strength';
        return `${label} — Rating: ${val}/10 (${getIntensityBand(val)})`;
      }
      if (typeof val === 'number' && q?.id?.startsWith('fear_')) {
        return `${val}/10 (${getIntensityBand(val)})`;
      }

      // choice_with_rating { option: 'id', rating: 7 }
      if (val && typeof val === 'object' && 'option' in val && 'rating' in val && !Array.isArray(val)) {
        const optObj = q?.options?.find((o: any) => o.id === val.option || o.text === val.option);
        const optText = optObj ? optObj.text : String(val.option || '—');
        return `${optText} (Rating: ${val.rating}/10)`;
      }

      // multiselect_with_rank { selected: [...], ranked: [...] }
      if (val && typeof val === 'object' && (Array.isArray((val as any).ranked) || Array.isArray((val as any).selected))) {
        const list = Array.isArray((val as any).ranked) && (val as any).ranked.length > 0
          ? (val as any).ranked
          : (val as any).selected || [];
        return list.map((valItem: any, idx: number) => {
          if (q?.options) {
            const opt = q.options.find((o: any) => o.id === valItem || o.text === valItem);
            if (opt) return `${idx + 1}. ${opt.text}`;
          }
          return `${idx + 1}. ${valItem}`;
        }).join('\n');
      }

      // Education block object (school/college/university with optional multi-entries)
      if (val && typeof val === 'object' && (val.school || val.college || val.university)) {
        const parts: string[] = [];
        const levelNames: Record<string, string> = {
          school: 'School',
          college: 'College',
          university: 'University'
        };
        ['school', 'college', 'university'].forEach(level => {
          const d = (val as any)[level];
          if (d?.active) {
            if (Array.isArray(d.entries) && d.entries.length > 0) {
              const entryStrs = d.entries
                .filter((e: any) => e && (e.name || e.grade))
                .map((e: any) => `${e.name || 'N/A'}${e.grade ? ` (Year/Grade: ${e.grade})` : ''}`);
              if (entryStrs.length > 0) {
                parts.push(`${levelNames[level]}: ${entryStrs.join('; ')}`);
              }
            } else if (d.name || d.grade) {
              parts.push(`${levelNames[level]}: ${d.name || 'N/A'}${d.grade ? ` (Year/Grade: ${d.grade})` : ''}`);
            }
          }
        });
        return parts.length > 0 ? parts.join('\n') : '—';
      }

      // Array of values or objects (e.g. table rows, rank items, schedule blocks, trait_grid, multiselect)
      if (Array.isArray(val)) {
        const items = val.map((valItem: any, idx: number) => {
          if (valItem && typeof valItem === 'object') {
            // Rank item { option: '...' }
            if ('option' in valItem && Object.keys(valItem).length <= 2) {
              if (!valItem.option) return '';
              const opt = q?.options?.find((o: any) => o.id === valItem.option || o.text === valItem.option);
              return `Rank ${idx + 1}: ${opt ? opt.text : valItem.option}`;
            }
            // Trait grid item { trait, isStrength, isWeakness, rating }
            if ('trait' in valItem && 'rating' in valItem) {
              const kind = valItem.isWeakness ? 'Weakness' : 'Strength';
              return `${valItem.trait}: ${kind} (${valItem.rating}/10)`;
            }
            // Schedule slot { time, activity }
            if ('time' in valItem || 'activity' in valItem) {
              if (!valItem.time && !valItem.activity) return '';
              return `${valItem.time || '—'}: ${valItem.activity || '—'}`;
            }
            // Schedule block { days, slots }
            if (valItem.days && Array.isArray(valItem.slots)) {
              const slotsStr = valItem.slots
                .filter((s: any) => s && (s.time || s.activity))
                .map((s: any) => `${s.time || '—'}: ${s.activity || '—'}`)
                .join(' | ');
              return slotsStr ? `${valItem.days.join(', ')}: ${slotsStr}` : '';
            }
            // Table row { col1, col2, col3, col4 }
            if ('col1' in valItem || 'col2' in valItem || 'col3' in valItem || 'col4' in valItem) {
              const cols = [valItem.col1, valItem.col2, valItem.col3, valItem.col4]
                .map(c => (typeof c === 'string' ? c.trim() : c !== undefined && c !== null ? String(c) : ''))
                .filter(Boolean);
              return cols.length > 0 ? cols.join(' — ') : '';
            }
            // Generic object inside array
            const values = Object.entries(valItem)
              .filter(([k, v]) => v !== undefined && v !== null && v !== '' && k !== 'isOther')
              .map(([, v]) => String(v).trim())
              .filter(Boolean);
            return values.join(' — ');
          }
          if (q?.options) {
            const opt = q.options.find((o: any) => o.id === valItem || o.text === valItem);
            if (opt) return opt.text;
          }
          return String(valItem);
        }).filter(Boolean);

        return items.length > 0 ? items.join('\n') : '—';
      }

      // Time-activity schedule object
      if (val && typeof val === 'object' && Object.keys(val).some(k => k.includes('AM') || k.includes('PM'))) {
        return Object.entries(val)
          .filter(([, activity]) => activity)
          .map(([time, activity]) => `${time}: ${activity}`)
          .join('\n');
      }

      // Generic object formatting (no JSON.stringify)
      if (val && typeof val === 'object') {
        const entries = Object.entries(val)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => {
            const label = k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ');
            if (Array.isArray(v)) return `${label}: ${v.join(', ')}`;
            if (v && typeof v === 'object') {
              const inner = Object.entries(v)
                .filter(([, iv]) => iv !== undefined && iv !== null && iv !== '')
                .map(([ik, iv]) => `${ik}: ${iv}`)
                .join(', ');
              return inner ? `${label} (${inner})` : '';
            }
            return `${label}: ${v}`;
          })
          .filter(Boolean);
        return entries.length > 0 ? entries.join('\n') : '—';
      }

      // Options mapping for primitive values
      if (q?.options) {
        const opt = q.options.find((o: any) => o.id === val || o.text === val);
        return opt ? opt.text : String(val);
      }

      return String(val);
    };

    // Scored test HTML generation
    const renderScoredTestHTML = (testType: string, answers: any): string => {
      if (!answers || Object.keys(answers).length === 0) {
        return '<p class="no-response">No responses recorded for this test.</p>';
      }

      const clientNotesHtml = answers.__clientNotes
        ? `<div class="qa-item" style="margin-top: 14px;"><div class="q-text">Client / Section Notes</div><div class="a-text">${String(answers.__clientNotes)}</div></div>`
        : '';

      if (testType === '16PF') {
        const pfScore = testScoringService.score16PF(answers.__testData || answers);
        const render16PFValue = (val: any) => {
          const num = Number(val);
          if (isNaN(num)) return String(val);
          const labels: Record<number, string> = {
            1: 'Strongly Disagree (1)',
            2: 'Disagree (2)',
            3: 'Slightly Disagree (3)',
            4: 'Slightly Agree (4)',
            5: 'Agree (5)',
            6: 'Strongly Agree (6)',
          };
          return labels[num] || `Rating: ${num}`;
        };

        return `
          <div class="test-header">16PF Personality Factors Test — ${pfScore.roleName || ''} (${pfScore.type})</div>
          ${pfScore.narrative ? `<p style="margin-bottom: 12px; font-size: 12px; color: #334155;">${pfScore.narrative.replace(/\n/g, '<br/>')}</p>` : ''}
          <table class="values-table" style="margin-bottom: 16px;">
            <thead>
              <tr>
                <th>MIND</th>
                <th>ENERGY</th>
                <th>NATURE</th>
                <th>TACTICS</th>
                <th>IDENTITY</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${pfScore.dimensions.mind.leftPct ?? 50}% Extraverted<br/>${pfScore.dimensions.mind.rightPct ?? 50}% Introverted</td>
                <td>${pfScore.dimensions.energy.leftPct ?? 50}% Intuitive<br/>${pfScore.dimensions.energy.rightPct ?? 50}% Observant</td>
                <td>${pfScore.dimensions.nature.leftPct ?? 50}% Thinking<br/>${pfScore.dimensions.nature.rightPct ?? 50}% Feeling</td>
                <td>${pfScore.dimensions.tactics.leftPct ?? 50}% Judging<br/>${pfScore.dimensions.tactics.rightPct ?? 50}% Prospecting</td>
                <td>${pfScore.dimensions.identity.leftPct ?? 50}% Assertive<br/>${pfScore.dimensions.identity.rightPct ?? 50}% Turbulent</td>
              </tr>
            </tbody>
          </table>
          <div class="pf16-grid">
            ${pf16Questions.map((q: any) => {
              const val = answers[q.id];
              if (val === undefined) return '';
              return `
                <div class="pf16-item">
                  <div class="pf16-num">Question ${q.id.split('_')[1]}</div>
                  ${q.type === 'statement' ? `
                    <p class="pf16-text">${q.text}</p>
                    <p class="pf16-val">${render16PFValue(val)}</p>
                  ` : `
                    <div class="pf16-between">
                      <span>${q.left}</span>
                      <span> vs </span>
                      <span>${q.right}</span>
                    </div>
                    <div class="pf16-val center">Rating: ${val} (Preference: ${val <= 3 ? 'Left Statement' : 'Right Statement'})</div>
                  `}
                </div>
              `;
            }).join('')}
          </div>
          ${clientNotesHtml}
        `;
      }

      if (testType === 'VALUES') {
        const testData = answers.__testData || answers;
        const ranked = (testData.ranked as string[]) || [];
        const categorized = (testData.categorized as Record<string, string>) || {};

        if (ranked.length === 0) return '<p class="no-response">No values ranked yet.</p>';

        return `
          <div class="test-header">Ranked Values System (Top 10)</div>
          <table class="values-table">
            <thead>
              <tr>
                <th style="width: 80px;">Rank</th>
                <th>Value Name</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              ${ranked.map((v, i) => `
                <tr>
                  <td class="center font-bold">${i + 1}</td>
                  <td><strong>${v}</strong></td>
                  <td><span class="badge badge-values">${categorized[v] || 'Want & Preference'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${clientNotesHtml}
        `;
      }

      if (testType === 'RIASEC') {
        const testData = answers.__testData || answers;
        const riasecScored = testScoringService.scoreRIASEC(testData);
        const categories: Record<string, string> = {
          R: 'Realistic (Practical, Hands-on, Physical)',
          I: 'Investigative (Analytical, Scientific, Logical)',
          A: 'Artistic (Creative, Expressive, Unstructured)',
          S: 'Social (Empathetic, Helping, Teamwork)',
          E: 'Enterprising (Ambitious, Leading, Influencing)',
          C: 'Conventional (Organized, Detail-oriented, Precise)',
        };

        return `
          <div class="test-header">RIASEC Occupational Interests — Holland Code: ${riasecScored.hollandCode}</div>
          <table class="values-table" style="margin-bottom: 16px;">
            <thead>
              <tr>
                <th>Dimension</th>
                <th>I Am</th>
                <th>I Can</th>
                <th>I Like</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${(['R', 'I', 'A', 'S', 'E', 'C'] as const).map(code => {
                const sub = riasecScored.subScores?.[code] || { iAm: 0, iCan: 0, iLike: 0, total: 0 };
                return `
                  <tr>
                    <td><strong>${categories[code]}</strong></td>
                    <td>${sub.iAm}</td>
                    <td>${sub.iCan}</td>
                    <td>${sub.iLike}</td>
                    <td><strong>${sub.total}</strong></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="riasec-grid">
            ${Object.entries(categories).map(([code, label]) => {
              const list = Array.isArray(testData[code]) ? (testData[code] as string[]) : [];
              return `
                <div class="riasec-card">
                  <div class="riasec-card-header">
                    <span>${label}</span>
                    <span class="riasec-count">${list.length} selected</span>
                  </div>
                  ${list.length > 0 ? `
                    <ul>
                      ${list.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                  ` : '<p class="empty-text">None selected</p>'}
                </div>
              `;
            }).join('')}
          </div>
          ${clientNotesHtml}
        `;
      }

      if (testType === 'COLOR') {
        const testData = answers.__testData || answers;
        const colorScored = testScoringService.scoreColorTest(testData);
        const result = testData.result || colorScored.colorCode || 'N/A';

        return `
          <div class="test-header">Colour Test (Working Style Profile)</div>
          <div class="color-result-banner">
            <span class="color-badge">🎨</span>
            <div>
              <div class="small-label">WORKING STYLE RESULTS</div>
              <div class="large-result">${result}</div>
            </div>
          </div>
          <p style="margin-bottom: 14px; font-size: 12px; color: #334155;">${colorScored.interpretation}</p>
          <div class="color-sections">
            ${COLOR_SECTIONS.map((sec, secIdx) => {
              const userSelections = (testData[`section${secIdx + 1}`] as (string | null)[]) || [];
              return `
                <div class="color-section-card">
                  <div class="color-section-title">${sec.title}</div>
                  <table class="color-table">
                    <tbody>
                      ${sec.questions.map((q, qIdx) => {
                        const sel = userSelections[qIdx];
                        const selectedText = sel === 'a' ? q.a : sel === 'b' ? q.b : '—';
                        return `
                          <tr>
                            <td class="color-q-text">Q${qIdx + 1}: ${q.a} vs ${q.b}</td>
                            <td class="color-ans text-right"><strong>${selectedText}</strong></td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              `;
            }).join('')}
          </div>
          ${clientNotesHtml}
        `;
      }

      if (testType === 'SMI') {
        const testData = answers.__testData || answers;
        const columnTotals = (testData.columnTotals as Record<string, number>) || {};
        const top3Scenarios = (testData.top3Scenarios as number[]) || [];
        const scenarioAnswers = (testData.scenarioAnswers as Record<number, any>) || {};

        return `
          <div class="test-header">Subject Matter Interest (SMI)</div>
          
          <div class="smi-totals-section">
            <h4 class="sub-section-title">SMI Column Totals</h4>
            <div class="smi-grid">
              ${Object.entries(SMI_COLUMN_LABELS).map(([col, label]) => {
                const val = columnTotals[col] || 0;
                return `
                  <div class="smi-item">
                    <span>${col}: ${label}</span>
                    <strong class="smi-badge">${val} pts</strong>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          ${top3Scenarios.length > 0 ? `
            <div class="smi-scenarios-section">
              <h4 class="sub-section-title">Top Preferred Scenarios</h4>
              <ol class="scenario-list">
                ${top3Scenarios.map((id) => {
                  const sc = SMI_SCENARIOS.find((s) => s.id === id);
                  return `
                    <li>
                      <strong>Scenario ${id}:</strong> ${sc?.prompt}
                    </li>
                  `;
                }).join('')}
              </ol>
            </div>
          ` : ''}

          <div class="smi-rankings-section">
            <h4 class="sub-section-title">SMI Scenario Activity Rankings Detail</h4>
            <div class="smi-rankings-grid">
              ${SMI_SCENARIOS.map((sc) => {
                const ans = scenarioAnswers[sc.id];
                const ranking = (ans?.ranking as number[]) || [];
                return `
                  <div class="smi-rank-card">
                    <div class="smi-rank-title">Scenario ${sc.id}</div>
                    ${ranking.length > 0 ? `
                      <ol class="smi-rank-ol">
                        ${ranking.map((idx) => {
                          const act = sc.activities[idx];
                          return `
                            <li>${act?.label} <span class="column-indicator">(${act?.column})</span></li>
                          `;
                        }).join('')}
                      </ol>
                    ` : '<p class="empty-text">No answers ranked</p>'}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ${clientNotesHtml}
        `;
      }

      if (testType === 'PARENTS_MEETING') {
        const testData = answers.__testData || answers;

        const renderField = (label: string, value: any): string => {
          if (value === undefined || value === null || value === '') return '';
          if (Array.isArray(value) && value.length === 0) return '';
          return `
            <div class="parent-field">
              <div class="parent-label">${label}</div>
              <div class="parent-value">${Array.isArray(value) ? value.join(', ') : String(value)}</div>
            </div>
          `;
        };

        return `
          <div class="test-header">Parents Meeting Questionnaire</div>
          <div class="parents-meeting-sections">
            <div class="parents-card">
              <h5 class="parents-card-title">1. Describe the Child</h5>
              ${renderField('Selected Personality Descriptors', testData.q1_described_words)}
              ${renderField("Mother's Description", testData.q1_mother_description)}
              ${renderField("Father's Description", testData.q1_father_description)}
              ${renderField('Counsellor Notes (Q1)', testData.q1_notes)}
            </div>

            <div class="parents-card">
              <h5 class="parents-card-title">2. Relationship with Child</h5>
              ${renderField("Father's Relationship", testData.q2_dad_relationship)}
              ${renderField("Mother's Relationship", testData.q2_mom_relationship)}
              ${renderField('Counsellor Notes (Q2)', testData.q2_notes)}
            </div>

            <div class="parents-card">
              <h5 class="parents-card-title">3. School Journey</h5>
              ${renderField('Favourite Subject', testData.q3_favourite_subject)}
              ${renderField('Subject They Hate', testData.q3_hated_subject)}
              ${renderField('Kind of Learner', testData.q3_kind_of_learner)}
              ${renderField('Learning Style', testData.q3_learning_style)}
              ${renderField('Relationship with Teachers', testData.q3_relationship_teachers)}
              ${renderField('Relationship with Friends', testData.q3_relationship_friends)}
              ${renderField('Relationship with Opposite Gender', testData.q3_relationship_opposite_gender)}
              ${renderField('Bullying/Harassment Incidents', testData.q3_bullied_or_harassed)}
              ${renderField('Academic Grades & Performance', testData.q3_marks_scoring)}
              ${renderField('Won / Appreciated Awards', testData.q3_won_appreciated)}
              ${renderField('Extracurricular Activities', testData.q3_extracurriculars)}
              ${renderField('Counsellor Notes (Q3)', testData.q3_notes)}
            </div>

            <div class="parents-card">
              <h5 class="parents-card-title">4. Routine & Traits Ratings</h5>
              ${renderField('Waking & Sleeping Schedule', testData.q4_waking_sleeping)}
              ${renderField('Eating Habits', testData.q4_eating_habits)}
              ${renderField('Studying Habits', testData.q4_studying_habits)}
              ${renderField('Approach to Deadlines', testData.q4_deadlines_approach)}
              ${renderField('Traveling Habits', testData.q4_traveling)}
              
              <div class="ratings-block">
                <div class="rating-box">
                  <div class="r-label">Attention</div>
                  <div class="r-val">${testData.q4_rate_attention || 5}/10</div>
                </div>
                <div class="rating-box">
                  <div class="r-label">Emotional Reg</div>
                  <div class="r-val">${testData.q4_rate_emotional_regulation || 5}/10</div>
                </div>
                <div class="rating-box">
                  <div class="r-label">Decision Making</div>
                  <div class="r-val">${testData.q4_rate_decision_making || 5}/10</div>
                </div>
                <div class="rating-box">
                  <div class="r-label">Social Skill</div>
                  <div class="r-val">${testData.q4_rate_social_interaction || 5}/10</div>
                </div>
                <div class="rating-box">
                  <div class="r-label">Time Mgmt</div>
                  <div class="r-val">${testData.q4_rate_time_management || 5}/10</div>
                </div>
              </div>
              ${renderField('Counsellor Notes (Q4)', testData.q4_notes)}
            </div>

            <div class="parents-card">
              <h5 class="parents-card-title">5. Core Priorities (Out of 10)</h5>
              ${[
                { label: 'Money', rating: testData.q5_money_rating, exp: testData.q5_money_explanation },
                { label: 'Creative Expression', rating: testData.q5_creative_expression_rating, exp: testData.q5_creative_expression_explanation },
                { label: 'Passion', rating: testData.q5_passion_rating, exp: testData.q5_passion_explanation },
                { label: 'Satisfaction', rating: testData.q5_satisfaction_rating, exp: testData.q5_satisfaction_explanation },
                { label: 'Giving Back', rating: testData.q5_giving_back_rating, exp: testData.q5_giving_back_explanation },
              ].map(({ label, rating, exp }) => `
                <div class="priority-item">
                  <div class="priority-top">
                    <span>${label}</span>
                    <strong>${rating || 5}/10</strong>
                  </div>
                  ${exp ? `<p class="priority-exp">"${exp}"</p>` : ''}
                </div>
              `).join('')}
              ${renderField('Counsellor Notes (Q5)', testData.q5_notes)}
            </div>

            <div class="parents-card">
              <h5 class="parents-card-title">6. Social Spaces & Influences</h5>
              ${renderField('Selected Free Time Activities', testData.q6_free_time_activities)}
              ${renderField('Social Media Usage', testData.q6_social_media_usage)}
              ${renderField('Other Free Time Details', testData.q6_free_time)}
              ${renderField('Counsellor Notes (Q6)', testData.q6_notes)}
              ${renderField('Counsellor Notes (Q7)', testData.q7_notes)}
              
              <div class="ratings-block" style="margin-top: 15px;">
                <div class="rating-box">
                  <div class="r-label">Media Infl.</div>
                  <div class="r-val">${testData.q9_media_rating || 5}/10</div>
                </div>
                <div class="rating-box">
                  <div class="r-label">Friends Infl.</div>
                  <div class="r-val">${testData.q9_friends_rating || 5}/10</div>
                </div>
                <div class="rating-box">
                  <div class="r-label">Family Infl.</div>
                  <div class="r-val">${testData.q9_parents_family_rating || 5}/10</div>
                </div>
              </div>
              
              ${renderField('Media Content Watched', testData.q9_media_content)}
              ${renderField('Other Influences', testData.q9_anything_else_influence)}
              ${renderField('Significant Life Events/Incidents', testData.q9b_incidents)}
              ${renderField('Counsellor Notes (Q8)', testData.q8_notes)}
            </div>

            <div class="parents-card">
              <h5 class="parents-card-title">7. Independence, Risk & Career Stances</h5>
              ${renderField('Career Path Thoughts', testData.q10_career_thoughts)}
              ${renderField('Counsellor Notes (Q9)', testData.q9_notes)}
              ${renderField('Counsellor Notes (Q10)', testData.q10_notes)}
              ${renderField('Marriage Stance', testData.q12_marriage)}
              ${renderField('Independence Timeline', testData.q12_independence_time)}
              ${renderField('Financial Support Limit (Age)', testData.q12_financial_support_age)}
              ${renderField('Counsellor Notes (Q11)', testData.q11_notes)}
              ${renderField('Risk Behavior Inclinations', testData.q13_risk_behaviour)}
              ${renderField('Counsellor Notes (Q12)', testData.q12_notes)}
              ${renderField('Hidden Talents Identified', testData.q14_hidden_talents)}
              ${renderField('Path if No Constraints', testData.q14_if_no_constraints)}
              ${renderField('Qualities Inherited from Mom', testData.q14_qualities_from_mom)}
              ${renderField('Qualities Inherited from Dad', testData.q14_qualities_from_dad)}
              ${renderField('Counsellor Notes (Q13)', testData.q13_notes)}
              ${renderField('Additional Notes', testData.q15_anything_else)}
              ${renderField('Counsellor Notes (Q14)', testData.q14_notes)}
              ${renderField('Overall Counsellor Summary & Observations', testData.counsellor_notes)}
            </div>
          </div>
          ${clientNotesHtml}
        `;
      }

      if (testType === 'SELF_DISCOVERY') {
        const ageGroup = answers.sd_age_group || '';
        const round2Questions = ageGroup === '13-18' ? SD_TEEN : SD_ADULT;
        const questions = [...SD_ROUND1, ...round2Questions];

        return `
          <div class="test-header">Self Discovery (Age Group: ${ageGroup || 'All'})</div>
          <div class="sd-list">
            ${questions.map((q: any) => {
              const val = answers[q.id];
              if (val === undefined) return '';
              return `
                <div class="sd-question-item">
                  <div class="sd-q-title">Q${q.num}. ${q.text}</div>
                  <div class="sd-a-box">"${String(val).trim() ? val : '(No answer provided)'}"</div>
                </div>
              `;
            }).join('')}
          </div>
          ${clientNotesHtml}
        `;
      }

      if (testType === 'JOB_FUNCTIONS') {
        const renderRatingBadge = (rating: any) => {
          const num = Number(rating);
          if (isNaN(num)) return '<span class="jf-badge neutral">Unrated</span>';
          if (num >= 4) return `<span class="jf-badge high">${num}/5 — Confident</span>`;
          if (num >= 2) return `<span class="jf-badge medium">${num}/5 — Doubtful</span>`;
          return `<span class="jf-badge low">${num}/5 — Low Interest</span>`;
        };

        const categories = ['People-Oriented (One-on-One)', 'People-Oriented (Groups & Public)', 'Information & Ideas', 'Things & Physical World'];
        return `
          <div class="test-header">Job Functions Identification</div>
          <div class="jf-categories">
            ${categories.map(cat => {
              const catSections = JF_SECTIONS.filter(s => s.category === cat);
              return `
                <div class="jf-cat-block">
                  <h4 class="jf-cat-title">${cat}</h4>
                  ${catSections.map(sec => `
                    <div class="jf-sec-card">
                      <div class="jf-sec-title">${sec.title}</div>
                      <div class="jf-sec-items">
                        ${sec.items.map((item, idx) => {
                          const val = answers[item.id];
                          return `
                            <div class="jf-item-row">
                              <span class="jf-item-text">${idx + 1}. ${item.text}</span>
                              <span class="shrink-0">${renderRatingBadge(val)}</span>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  `).join('')}
                </div>
              `;
            }).join('')}
          </div>
          ${clientNotesHtml}
        `;
      }

      // Clean human-readable fallback table (never raw JSON)
      const entries = Object.entries(answers).filter(([k, v]) => !k.startsWith('__') && v !== undefined && v !== null && v !== '');
      return `
        <div class="qa-list">
          ${entries.map(([k, v]) => `
            <div class="qa-item">
              <div class="q-text">${k.replace(/_/g, ' ').toUpperCase()}</div>
              <div class="a-text">${formatResponseValue({}, v)}</div>
            </div>
          `).join('')}
        </div>
      `;
    };

    const reportDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const safeName = (client.user.name || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
    const isWordFormat = format === 'doc' || format === 'docx' || format === 'word';
    const htmlHeader = `<!DOCTYPE html><html>`;

    const html = `${htmlHeader}
<head>
  <meta charset="utf-8">
  <title>Assessment Responses - ${client.user.name || 'Client'}</title>
  ${!isWordFormat ? `
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  ` : ''}
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Calibri', 'Inter', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.5;
      font-size: 12pt;
      padding: 32px;
    }
    .print-header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .logo-area h1 {
      font-size: 20pt;
      font-weight: 900;
      color: #4f46e5;
    }
    .logo-area p {
      font-size: 10pt;
      color: #64748b;
    }
    .meta-area {
      text-align: right;
      font-size: 10pt;
      color: #64748b;
    }
    .meta-area strong {
      color: #1e293b;
    }
    .demographics-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 28px;
    }
    .demo-title {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #4f46e5;
      margin-bottom: 10px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 4px;
    }
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .demo-item span {
      color: #64748b;
      font-size: 10pt;
      display: block;
    }
    .demo-item strong {
      color: #0f172a;
      font-size: 11pt;
    }
    .module-card {
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 26px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .module-card-header {
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 10px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .module-card-header h2 {
      font-size: 14pt;
      font-weight: 700;
      color: #0f172a;
    }
    .module-badges {
      display: flex;
      gap: 8px;
    }
    .badge {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }
    .badge-submitted {
      background-color: #ecfdf5;
      color: #047857;
      border-color: #a7f3d0;
    }
    .badge-locked {
      background-color: #f1f5f9;
      color: #64748b;
    }
    .badge-filled {
      background-color: #eff6ff;
      color: #1d4ed8;
    }
    .badge-values {
      background-color: #f0fdf4;
      color: #166534;
    }
    .no-response {
      color: #64748b;
      font-style: italic;
      font-size: 11pt;
      padding: 12px 0;
    }
    .qa-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .qa-item {
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 10px;
      margin-bottom: 8px;
    }
    .q-text {
      font-weight: 700;
      color: #1e293b;
      font-size: 11pt;
      margin-bottom: 4px;
    }
    .q-desc {
      font-size: 9.5pt;
      color: #64748b;
      margin-bottom: 4px;
    }
    .a-text {
      color: #0f172a;
      font-size: 11pt;
      background-color: #f8fafc;
      padding: 8px 12px;
      border-radius: 6px;
      border-left: 3px solid #4f46e5;
      white-space: pre-wrap;
    }
    .sub-note {
      margin-top: 6px;
      font-size: 10pt;
      color: #334155;
      background-color: #eef2ff;
      padding: 6px 10px;
      border-radius: 6px;
      border-left: 3px solid #818cf8;
      white-space: pre-wrap;
    }
    .mentor-notes-box {
      margin-top: 18px;
      padding: 14px 16px;
      background-color: #fffbeb;
      border: 1.5px solid #f59e0b;
      border-radius: 8px;
    }
    .mentor-notes-title {
      font-size: 10.5pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #b45309;
      margin-bottom: 6px;
    }
    .mentor-notes-body {
      font-size: 11pt;
      color: #1e293b;
      white-space: pre-wrap;
    }
    .test-header {
      font-size: 12pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #4f46e5;
      margin-bottom: 12px;
    }
    .pf16-grid, .riasec-grid, .color-sections, .smi-grid, .smi-rankings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .pf16-item, .riasec-card, .color-section-card, .smi-item, .smi-rank-card, .parents-card, .jf-sec-card {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 8px;
    }
    .values-table, .color-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5pt;
      margin-bottom: 12px;
    }
    .values-table th, .values-table td, .color-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
    }
    .values-table th {
      background-color: #f1f5f9;
      font-weight: 700;
    }
    .parents-card-title, .jf-cat-title {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .parent-field {
      margin-bottom: 8px;
    }
    .parent-label {
      font-size: 9.5pt;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
    }
    .parent-value {
      font-size: 11pt;
      color: #0f172a;
    }
    .ratings-block {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin: 8px 0;
    }
    .rating-box {
      background-color: #e2e8f0;
      border-radius: 6px;
      padding: 6px 10px;
      text-align: center;
    }
    .sd-question-item {
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .sd-q-title {
      font-weight: 700;
      color: #1e293b;
    }
    .sd-a-box {
      color: #334155;
      margin-top: 4px;
      padding-left: 8px;
      border-left: 2px solid #6366f1;
    }
    .jf-item-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dashed #e2e8f0;
    }
  </style>
</head>
<body>
  ${!isWordFormat ? `
  <div id="pdf-action-bar" style="display:flex;justify-content:space-between;align-items:center;padding:12px 18px;margin-bottom:20px;background:#0f172a;color:#f8fafc;border-radius:10px;font-family:'Inter',sans-serif;">
    <div id="pdf-status-text" style="font-size:13px;font-weight:600;">⏳ Preparing your PDF download (${safeName}_Combined_Answers.pdf)...</div>
    <div style="display:flex;gap:10px;">
      <button onclick="downloadPdfFile()" style="background:#4f46e5;color:#ffffff;border:none;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">📥 Download PDF</button>
      <a href="/api/mentor/clients/${id}/combined-answers/download?format=docx${modulesParam ? `&modules=${encodeURIComponent(modulesParam)}` : ''}" style="background:#059669;color:#ffffff;text-decoration:none;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:700;">📄 Download Word (.docx)</a>
    </div>
  </div>
  ` : ''}
  <div id="pdf-export-root">
  <div class="print-header">
    <div class="logo-area">
      <h1>HOLISTREE</h1>
      <p>Career Guidance &amp; Assessment Portal</p>
    </div>
    <div class="meta-area">
      <p>Report Type: <strong>Assessment Survey Responses (${filteredModules.length} Module${filteredModules.length === 1 ? '' : 's'})</strong></p>
      <p>Date Generated: <strong>${reportDate}</strong></p>
    </div>
  </div>

  <div class="demographics-box">
    <div class="demo-title">Client Profile Details</div>
    <div class="demo-grid">
      <div class="demo-item">
        <span>Student Name</span>
        <strong>${client.user.name || 'Valued Client'}</strong>
      </div>
      <div class="demo-item">
        <span>Email Address</span>
        <strong>${client.user.email}</strong>
      </div>
    </div>
  </div>

  ${filteredModules.map(m => {
    const responseData = m.response?.data as any;
    const hasResponse = m.response && responseData && Object.keys(responseData).length > 0;
    const mentorNotesText = m.mentorNotes && m.mentorNotes.trim() !== '' ? m.mentorNotes.trim() : '';

    return `
      <div class="module-card">
        <div class="module-card-header">
          <h2>#${m.order}. ${m.module.title}</h2>
          <div class="module-badges">
            <span class="badge badge-filled">Filled by ${m.filledBy}</span>
            <span class="badge ${hasResponse ? 'badge-submitted' : 'badge-locked'}">${m.status}</span>
          </div>
        </div>
        
        ${(() => {
          if (!hasResponse) {
            return '<p class="no-response">No responses submitted for this module yet.</p>';
          }
          const answers = responseData || {};
          const schema = (m.module.schema || {}) as any;
          const testType = schema.testType;
          let questions = Array.isArray(schema.questions) ? [...schema.questions] : [];

          if (m.module.title?.toLowerCase().includes('family')) {
            const existingIds = new Set(questions.map((q: any) => q.id));
            EXTRA_FAMILY_QUESTIONS.forEach(fq => {
              if (!existingIds.has(fq.id)) questions.push(fq);
            });
          }

          if (testType) {
            return renderScoredTestHTML(testType, answers);
          }

          if (questions.length > 0) {
            return `
              <div class="qa-list">
                ${questions.map((q: any) => {
                  const val = answers[q.id];
                  const otherVal = answers[`${q.id}_other`];
                  const openTextVal = answers[`${q.id}_open_text`];
                  const hobbiesNotesVal = q.id === 'demo_hobbies' ? answers.demo_hobbies_notes : undefined;
                  const attachedFiles = Array.isArray(answers[`${q.id}_files`]) ? answers[`${q.id}_files`] : [];

                  if (
                    (val === undefined || val === null || val === '') &&
                    !otherVal &&
                    !openTextVal &&
                    !hobbiesNotesVal &&
                    attachedFiles.length === 0
                  ) {
                    return '';
                  }

                  return `
                    <div class="qa-item">
                      <div class="q-text">${q.question}</div>
                      ${q.description ? `<div class="q-desc">${q.description}</div>` : ''}
                      <div class="a-text">${formatResponseValue(q, val)}</div>
                      ${otherVal ? `<div class="sub-note"><strong>Other (Specified):</strong> ${otherVal}</div>` : ''}
                      ${hobbiesNotesVal ? `<div class="sub-note"><strong>Hobbies Additional Info:</strong> ${hobbiesNotesVal}</div>` : ''}
                      ${openTextVal ? `<div class="sub-note"><strong>Additional Notes / Details:</strong> ${openTextVal}</div>` : ''}
                      ${attachedFiles.length > 0 ? `<div class="sub-note"><strong>Attached Files:</strong> ${attachedFiles.map((f: string) => cleanFileName(f)).join(', ')}</div>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }

          const cleanEntries = Object.entries(answers).filter(([k, v]) => !k.startsWith('__') && v !== undefined && v !== null && v !== '');
          return `
            <div class="qa-list">
              ${cleanEntries.map(([k, v]) => `
                <div class="qa-item">
                  <div class="q-text">${k.replace(/_/g, ' ').toUpperCase()}</div>
                  <div class="a-text">${formatResponseValue({}, v)}</div>
                </div>
              `).join('')}
            </div>
          `;
        })()}

        ${mentorNotesText ? `
          <div class="mentor-notes-box">
            <div class="mentor-notes-title">📌 Mentor / Counsellor Notes for ${m.module.title}</div>
            <div class="mentor-notes-body">${mentorNotesText}</div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('')}
  </div>

  ${!isWordFormat ? `
  <script>
    var isGeneratingPdf = false;

    function buildRenderBatches(rootEl, maxBatchHeightPx) {
      // Collect top-level sections; only split a single module-card if it alone exceeds maxBatchHeightPx
      var topItems = [];
      var children = Array.from(rootEl.children || []);
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (!child || child.offsetHeight === 0) continue;
        if (child.offsetHeight > maxBatchHeightPx && child.children && child.children.length > 1) {
          var sub = Array.from(child.children);
          for (var s = 0; s < sub.length; s++) {
            if (sub[s].offsetHeight > 0) topItems.push(sub[s]);
          }
        } else {
          topItems.push(child);
        }
      }

      var batches = [];
      var currentBatch = [];
      var currentHeight = 0;

      for (var j = 0; j < topItems.length; j++) {
        var item = topItems[j];
        var h = item.offsetHeight || 200;
        if (currentBatch.length > 0 && currentHeight + h > maxBatchHeightPx) {
          batches.push(currentBatch);
          currentBatch = [item];
          currentHeight = h;
        } else {
          currentBatch.push(item);
          currentHeight += h;
        }
      }
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }
      return batches;
    }

    async function downloadPdfFile() {
      if (isGeneratingPdf) return;
      var statusEl = document.getElementById('pdf-status-text');
      var element = document.getElementById('pdf-export-root');
      if (!element || typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        if (statusEl) statusEl.innerText = '⚠️ PDF libraries still loading, retrying in a moment...';
        setTimeout(downloadPdfFile, 400);
        return;
      }
      isGeneratingPdf = true;
      var batchHost = null;
      try {
        var jsPDF = window.jspdf.jsPDF;
        var pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        var pageWidth = 210;
        var pageHeight = 297;
        var margin = 10;
        var contentWidth = pageWidth - margin * 2;
        var pageContentHeight = pageHeight - margin * 2;
        var cursorY = margin;

        // Group modules into large ~4800px batches (typically 1 batch for selective modules, 3-4 batches for all 19 modules)
        var batches = buildRenderBatches(element, 4800);
        var rootWidth = element.offsetWidth || 850;

        // Create an isolated host container and temporarily hide the main root so html2canvas only clones the active batch
        batchHost = document.createElement('div');
        batchHost.style.width = rootWidth + 'px';
        batchHost.style.background = '#ffffff';
        document.body.appendChild(batchHost);
        element.style.display = 'none';

        for (var b = 0; b < batches.length; b++) {
          if (statusEl) {
            statusEl.innerText = '⏳ Generating PDF (Batch ' + (b + 1) + ' of ' + batches.length + ')...';
          }
          batchHost.innerHTML = '';
          var batchItems = batches[b];
          for (var k = 0; k < batchItems.length; k++) {
            batchHost.appendChild(batchItems[k].cloneNode(true));
          }

          // Measure atomic element intervals inside batchHost so page slices never cut through text or rows
          var hostRect = batchHost.getBoundingClientRect();
          var atomicNodes = batchHost.querySelectorAll('.qa-item, .module-card-header, .mentor-notes-box, tr, .pf16-item, .riasec-card, .color-section-card, .smi-item, .smi-rank-card, .parent-field, .priority-item, .sd-question-item, .jf-item-row, h2, h3, h4, p, li');
          var intervals = [];
          for (var a = 0; a < atomicNodes.length; a++) {
            var r = atomicNodes[a].getBoundingClientRect();
            var topPx = r.top - hostRect.top;
            var botPx = r.bottom - hostRect.top;
            if (botPx > topPx && (botPx - topPx) <= 420) {
              intervals.push({ top: topPx, bottom: botPx });
            }
          }

          var canvas = await html2canvas(batchHost, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          if (!canvas || canvas.width === 0 || canvas.height === 0) continue;

          var scaleRatio = canvas.height / (batchHost.offsetHeight || 1);
          var pxPerMm = canvas.width / contentWidth;
          var srcY = 0;

          while (srcY < canvas.height - 2) {
            var availMm = (margin + pageContentHeight) - cursorY;
            if (availMm < 40 && cursorY > margin) {
              pdf.addPage();
              cursorY = margin;
              availMm = pageContentHeight;
            }

            var maxSlicePx = Math.floor(availMm * pxPerMm);
            var sliceHeightPx = canvas.height - srcY;

            if (sliceHeightPx > maxSlicePx) {
              var idealDomCut = (srcY + maxSlicePx) / scaleRatio;
              var minDomCut = (srcY / scaleRatio) + (maxSlicePx / scaleRatio) * 0.55;
              var safeDomCut = idealDomCut;

              for (var pass = 0; pass < 3; pass++) {
                var adjusted = false;
                for (var iv = 0; iv < intervals.length; iv++) {
                  var box = intervals[iv];
                  if (box.top < safeDomCut - 2 && box.bottom > safeDomCut + 2 && box.top >= minDomCut) {
                    safeDomCut = box.top - 4;
                    adjusted = true;
                  }
                }
                if (!adjusted) break;
              }
              sliceHeightPx = Math.max(40, Math.min(maxSlicePx, Math.floor(safeDomCut * scaleRatio) - srcY));
            }

            var sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = sliceHeightPx;
            var ctx = sliceCanvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
              ctx.drawImage(canvas, 0, srcY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
              var sliceMm = sliceHeightPx / pxPerMm;
              pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.94), 'JPEG', margin, cursorY, contentWidth, sliceMm);
              cursorY += sliceMm + 2;
            }
            srcY += sliceHeightPx;
            if (srcY < canvas.height - 2) {
              pdf.addPage();
              cursorY = margin;
            }
          }
        }

        element.style.display = '';
        if (batchHost && batchHost.parentNode) {
          batchHost.parentNode.removeChild(batchHost);
          batchHost = null;
        }

        pdf.save('${safeName}_Combined_Answers.pdf');
        if (statusEl) statusEl.innerText = '✅ PDF Downloaded (${safeName}_Combined_Answers.pdf)!';
      } catch (err) {
        console.error('PDF generation error:', err);
        if (statusEl) statusEl.innerText = '⚠️ Could not auto-download PDF. Click Download PDF to retry.';
      } finally {
        element.style.display = '';
        if (batchHost && batchHost.parentNode) {
          batchHost.parentNode.removeChild(batchHost);
        }
        isGeneratingPdf = false;
      }
    }
    window.onload = function() {
      setTimeout(downloadPdfFile, 250);
    };
  </script>
  ` : ''}
</body>
</html>`;

    if (isWordFormat) {
      const docxBuffer = generateModernDocxFromHtml(html);
      return new NextResponse(new Uint8Array(docxBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeName}_Combined_Answers.docx"`
        }
      });
    }

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error: any) {
    console.error('Combined Answers download error:', error);
    return new NextResponse(`Error generating combined answers: ${error.message}`, { status: 500 });
  }
}

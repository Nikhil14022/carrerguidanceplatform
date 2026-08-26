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

const MENTOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY', 'EXPERT'];

export const dynamic = 'force-dynamic';

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

    // Verify assignment for non-admins
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      if (!mentorProfileId) return new NextResponse('Forbidden', { status: 403 });
      const assignment = await (prisma as any).mentorAssignment.findFirst({
        where: { mentorProfileId, clientProfileId: id, isActive: true }
      });
      if (!assignment) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    const client = await prisma.clientProfile.findUnique({
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
      return new NextResponse('Client not found', { status: 404 });
    }

    // Helper functions for rendering modules
    const formatResponseValue = (q: any, val: any): string => {
      if (val === undefined || val === null) return '—';
      
      // 1. Array of values or objects
      if (Array.isArray(val)) {
        return val.map((valItem: any) => {
          if (valItem && typeof valItem === 'object') {
            // Check if it has time and activity (slots)
            if (valItem.time || valItem.activity) {
              return `${valItem.time || '—'}: ${valItem.activity || '—'}`;
            }
            // Check if it's a schedule block
            if (valItem.days && Array.isArray(valItem.slots)) {
              const slotsStr = valItem.slots.map((s: any) => `${s.time || '—'}: ${s.activity || '—'}`).join(', ');
              return `Days: ${valItem.days.join(', ')} [${slotsStr}]`;
            }
            // Default object values extraction
            const values = Object.values(valItem)
              .map(v => typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')
              .filter(v => v !== '');
            return values.length > 0 ? values.join(' - ') : JSON.stringify(valItem);
          }
          if (q.options) {
            const opt = q.options.find((o: any) => o.id === valItem);
            if (opt) return opt.text;
          }
          return String(valItem);
        }).filter(Boolean).join(', ');
      }
      
      // 2. Ranked lists
      if (val && typeof val === 'object' && Array.isArray((val as any).ranked)) {
        return (val as any).ranked.map((valItem: any, idx: number) => {
          if (q.options) {
            const opt = q.options.find((o: any) => o.id === valItem);
            if (opt) return `${idx + 1}. ${opt.text}`;
          }
          return `${idx + 1}. ${valItem}`;
        }).join(', ');
      }
      
      // 3. Education block object (school/college/university)
      if (val && typeof val === 'object' && (val.school || val.college || val.university)) {
        const parts: string[] = [];
        ['school', 'college', 'university'].forEach(level => {
          const d = (val as any)[level];
          if (d?.active) {
            parts.push(`${level.toUpperCase()}: ${d.name || 'N/A'} (Grade: ${d.grade || 'N/A'})`);
          }
        });
        return parts.join(' | ');
      }
      
      // 4. Time-activity schedule object
      if (val && typeof val === 'object' && Object.keys(val).some(k => k.includes('AM') || k.includes('PM'))) {
        return Object.entries(val)
          .map(([time, activity]) => `${time}: ${activity}`)
          .join(', ');
      }
      
      // 5. Generic object formatting
      if (val && typeof val === 'object') {
        const keys = Object.keys(val);
        if (keys.length === 0) return '—';
        return keys
          .map(k => {
            const label = k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ');
            const v = val[k];
            if (v && typeof v === 'object') return `${label}: ${JSON.stringify(v)}`;
            return `${label}: ${v}`;
          })
          .join(' | ');
      }
      
      // 6. Options mapping for primitives
      if (q.options) {
        const opt = q.options.find((o: any) => o.id === val);
        return opt ? opt.text : String(val);
      }
      
      return String(val);
    };

    // Scored test HTML generation
    const renderScoredTestHTML = (testType: string, answers: any): string => {
      if (!answers || Object.keys(answers).length === 0) {
        return '<p class="no-response">No responses recorded for this test.</p>';
      }

      if (testType === '16PF') {
        const render16PFValue = (val: any) => {
          const num = Number(val);
          if (isNaN(num)) return String(val);
          const labels: Record<number, string> = {
            1: "Strongly Disagree (1)",
            2: "Disagree (2)",
            3: "Slightly Disagree (3)",
            4: "Slightly Agree (4)",
            5: "Agree (5)",
            6: "Strongly Agree (6)",
          };
          return labels[num] || `Rating: ${num}`;
        };

        return `
          <div class="test-header">16PF Personality Factors Test</div>
          <div class="pf16-grid">
            ${pf16Questions.map((q: any) => {
              const val = answers[q.id];
              if (val === undefined) return '';
              return `
                <div class="pf16-item">
                  <div class="pf16-num">Question ${q.id.split("_")[1]}</div>
                  ${q.type === "statement" ? `
                    <p class="pf16-text">${q.text}</p>
                    <p class="pf16-val">${render16PFValue(val)}</p>
                  ` : `
                    <div class="pf16-between">
                      <span>${q.left}</span>
                      <span>${q.right}</span>
                    </div>
                    <div class="pf16-val center">Rating: ${val} (Preference: ${val <= 3 ? 'Left' : 'Right'})</div>
                  `}
                </div>
              `;
            }).join('')}
          </div>
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
                  <td><span class="badge badge-values">${categorized[v] || "Want & Preference"}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      if (testType === 'RIASEC') {
        const testData = answers.__testData || answers;
        const categories: Record<string, string> = {
          R: "Realistic (Practical, Hands-on, Physical)",
          I: "Investigative (Analytical, Scientific, Logical)",
          A: "Artistic (Creative, Expressive, Unstructured)",
          S: "Social (Empathetic, Helping, Teamwork)",
          E: "Enterprising (Ambitious, Leading, Influencing)",
          C: "Conventional (Organized, Detail-oriented, Precise)",
        };

        return `
          <div class="test-header">RIASEC Occupational Interests</div>
          <div class="riasec-grid">
            ${Object.entries(categories).map(([code, label]) => {
              const list = (testData[code] as string[]) || [];
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
        `;
      }

      if (testType === 'COLOR') {
        const testData = answers.__testData || answers;
        const result = testData.result || "N/A";

        return `
          <div class="test-header">Colour Test (Working Style Profile)</div>
          <div class="color-result-banner">
            <span class="color-badge">🎨</span>
            <div>
              <div class="small-label">WORKING STYLE RESULTS</div>
              <div class="large-result">${result}</div>
            </div>
          </div>
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
                        const selectedText = sel === "a" ? q.a : sel === "b" ? q.b : "—";
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
                ${top3Scenarios.map((id, index) => {
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
        `;
      }

      if (testType === 'PARENTS_MEETING') {
        const testData = answers.__testData || answers;

        const renderField = (label: string, value: any): string => {
          if (value === undefined || value === null || value === "") return '';
          return `
            <div class="parent-field">
              <div class="parent-label">${label}</div>
              <div class="parent-value">${Array.isArray(value) ? value.join(", ") : String(value)}</div>
            </div>
          `;
        };

        return `
          <div class="test-header">Parents Meeting Questionnaire</div>
          <div class="parents-meeting-sections">
            <div class="parents-card">
              <h5 class="parents-card-title">1. Describe the Child</h5>
              ${renderField("Selected Personality Descriptors", testData.q1_described_words)}
              ${renderField("Mother's Description", testData.q1_mother_description)}
              ${renderField("Father's Description", testData.q1_father_description)}
            </div>

            <div class="parents-card">
              <h5 class="parents-card-title">2. Relationship with Child</h5>
              ${renderField("Father's Relationship", testData.q2_dad_relationship)}
              ${renderField("Mother's Relationship", testData.q2_mom_relationship)}
            </div>

            <div class="parents-card">
              <h5 class="parents-card-title">3. School Journey</h5>
              ${renderField("Favourite Subject", testData.q3_favourite_subject)}
              ${renderField("Subject They Hate", testData.q3_hated_subject)}
              ${renderField("Kind of Learner", testData.q3_kind_of_learner)}
              ${renderField("Learning Style", testData.q3_learning_style)}
              ${renderField("Relationship with Teachers", testData.q3_relationship_teachers)}
              ${renderField("Relationship with Friends", testData.q3_relationship_friends)}
              ${renderField("Relationship with Opposite Gender", testData.q3_relationship_opposite_gender)}
              ${renderField("Bullying/Harassment Incidents", testData.q3_bullied_or_harassed)}
              ${renderField("Academic Grades & Performance", testData.q3_marks_scoring)}
              ${renderField("Won / Appreciated Awards", testData.q3_won_appreciated)}
              ${renderField("Extracurricular Activities", testData.q3_extracurriculars)}
            </div>

            <div class="parents-card">
              <h5 class="parents-card-title">4. Routine & Traits Ratings</h5>
              ${renderField("Waking & Sleeping Schedule", testData.q4_waking_sleeping)}
              ${renderField("Eating Habits", testData.q4_eating_habits)}
              ${renderField("Studying Habits", testData.q4_studying_habits)}
              ${renderField("Approach to Deadlines", testData.q4_deadlines_approach)}
              ${renderField("Traveling Habits", testData.q4_traveling)}
              
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
            </div>

            <div class="parents-card">
              <h5 class="parents-card-title">5. Core Priorities (Out of 10)</h5>
              ${[
                { label: "Money", rating: testData.q5_money_rating, exp: testData.q5_money_explanation },
                { label: "Creative Expression", rating: testData.q5_creative_expression_rating, exp: testData.q5_creative_expression_explanation },
                { label: "Passion", rating: testData.q5_passion_rating, exp: testData.q5_passion_explanation },
                { label: "Satisfaction", rating: testData.q5_satisfaction_rating, exp: testData.q5_satisfaction_explanation },
                { label: "Giving Back", rating: testData.q5_giving_back_rating, exp: testData.q5_giving_back_explanation },
              ].map(({ label, rating, exp }) => `
                <div class="priority-item">
                  <div class="priority-top">
                    <span>${label}</span>
                    <strong>${rating || 5}/10</strong>
                  </div>
                  ${exp ? `<p class="priority-exp">"${exp}"</p>` : ''}
                </div>
              `).join('')}
            </div>

            <div class="parents-card">
              <h5 class="parents-card-title">6. Social Spaces & Influences</h5>
              ${renderField("Selected Free Time Activities", testData.q6_free_time_activities)}
              ${renderField("Social Media Usage", testData.q6_social_media_usage)}
              ${renderField("Other Free Time Details", testData.q6_free_time)}
              
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
              
              ${renderField("Media Content Watched", testData.q9_media_content)}
              ${renderField("Other Influences", testData.q9_anything_else_influence)}
              ${renderField("Significant Life Events/Incidents", testData.q9b_incidents)}
            </div>

            <div class="parents-card">
              <h5 class="parents-card-title">7. Independence, Risk & Career Stances</h5>
              ${renderField("Career Path Thoughts", testData.q10_career_thoughts)}
              ${renderField("Marriage Stance", testData.q12_marriage)}
              ${renderField("Independence Timeline", testData.q12_independence_time)}
              ${renderField("Financial Support Limit (Age)", testData.q12_financial_support_age)}
              ${renderField("Risk Behavior Inclinations", testData.q13_risk_behaviour)}
              ${renderField("Hidden Talents Identified", testData.q14_hidden_talents)}
              ${renderField("Path if No Constraints", testData.q14_if_no_constraints)}
              ${renderField("Qualities Inherited from Mom", testData.q14_qualities_from_mom)}
              ${renderField("Qualities Inherited from Dad", testData.q14_qualities_from_dad)}
              ${renderField("Additional Notes", testData.q15_anything_else)}
            </div>
          </div>
        `;
      }

      if (testType === 'SELF_DISCOVERY') {
        const ageGroup = answers.sd_age_group || "";
        const round2Questions = ageGroup === "13-18" ? SD_TEEN : SD_ADULT;
        const questions = [...SD_ROUND1, ...round2Questions];

        return `
          <div class="test-header">Self Discovery (Age Group: ${ageGroup || "All"})</div>
          <div class="sd-list">
            ${questions.map((q: any) => {
              const val = answers[q.id];
              if (val === undefined) return '';
              return `
                <div class="sd-question-item">
                  <div class="sd-q-title">Q${q.num}. ${q.text}</div>
                  <div class="sd-a-box">"${val.trim() ? val : '(No answer provided)'}"</div>
                </div>
              `;
            }).join('')}
          </div>
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

        const categories = ["People-Oriented (One-on-One)", "People-Oriented (Groups & Public)", "Information & Ideas", "Things & Physical World"];
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
        `;
      }

      // Default fallback
      return `
        <pre class="fallback-json">${JSON.stringify(answers, null, 2)}</pre>
      `;
    };

    // Build layout HTML
    const reportDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Assessment Responses - ${client.user.name || 'Client'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.5;
      font-size: 13px;
      padding: 40px;
    }
    
    .print-header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-between;
      align-items: flex-end;
    }
    
    .logo-area h1 {
      font-size: 22px;
      font-weight: 900;
      color: #4f46e5;
      letter-spacing: -0.05em;
    }
    
    .logo-area p {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    
    .meta-area {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    
    .meta-area strong {
      color: #1e293b;
    }
    
    .demographics-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 35px;
    }
    
    .demo-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4f46e5;
      margin-bottom: 12px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 6px;
    }
    
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .demo-item {
      font-size: 12px;
    }
    
    .demo-item span {
      color: #64748b;
      font-weight: 500;
      display: block;
      margin-bottom: 2px;
    }
    
    .demo-item strong {
      color: #0f172a;
      font-size: 13px;
    }
    
    .module-card {
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 30px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .module-card-header {
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .module-card-header h2 {
      font-size: 16px;
      font-weight: 750;
      color: #0f172a;
    }
    
    .module-badges {
      display: flex;
      gap: 8px;
    }
    
    .badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid transparent;
    }
    
    .badge-submitted {
      background-color: #ecfdf5;
      color: #047857;
      border-color: #a7f3d0;
    }
    
    .badge-locked {
      background-color: #f1f5f9;
      color: #64748b;
      border-color: #cbd5e1;
    }
    
    .badge-filled {
      background-color: #eff6ff;
      color: #1d4ed8;
      border-color: #bfdbfe;
    }
    
    .badge-values {
      background-color: #f0fdf4;
      color: #166534;
      border-color: #bbf7d0;
      font-size: 9px;
    }
    
    .no-response {
      color: #64748b;
      font-style: italic;
      font-size: 12px;
      text-align: center;
      padding: 20px 0;
    }
    
    /* Standard Q&A styling */
    .qa-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .qa-item {
      border-bottom: 1px dashed #f1f5f9;
      padding-bottom: 12px;
    }
    
    .qa-item:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }
    
    .q-text {
      font-weight: 600;
      color: #334155;
      font-size: 12.5px;
      margin-bottom: 4px;
    }
    
    .q-desc {
      font-size: 10px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    
    .a-text {
      color: #0f172a;
      font-size: 13px;
      background-color: #f8fafc;
      padding: 8px 12px;
      border-radius: 8px;
      border-left: 3px solid #6366f1;
      white-space: pre-wrap;
    }
    
    /* Psychometric Test Layouts */
    .test-header {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4f46e5;
      margin-bottom: 15px;
    }
    
    .pf16-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .pf16-item {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px;
      font-size: 11px;
    }
    
    .pf16-num {
      color: #64748b;
      font-weight: 600;
      margin-bottom: 3px;
      font-size: 9px;
      text-transform: uppercase;
    }
    
    .pf16-text {
      font-weight: 500;
      color: #334155;
      margin-bottom: 4px;
    }
    
    .pf16-val {
      font-weight: 700;
      color: #4f46e5;
    }
    
    .pf16-val.center {
      text-align: center;
      background-color: #eff6ff;
      padding: 4px;
      border-radius: 6px;
      margin-top: 5px;
    }
    
    .pf16-between {
      display: flex;
      justify-content: space-between;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 500;
    }
    
    .values-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    
    .values-table th, .values-table td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
    }
    
    .values-table th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 600;
    }
    
    .riasec-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .riasec-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
    }
    
    .riasec-card-header {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 11px;
      color: #0f172a;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    
    .riasec-count {
      color: #4f46e5;
    }
    
    .riasec-card ul {
      list-style-type: square;
      padding-left: 15px;
      font-size: 11px;
      color: #334155;
    }
    
    .color-result-banner {
      background-color: #f5f3ff;
      border: 1px solid #ddd6fe;
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 15px;
    }
    
    .color-badge {
      font-size: 22px;
    }
    
    .small-label {
      font-size: 9px;
      font-weight: 700;
      color: #6d28d9;
    }
    
    .large-result {
      font-size: 14px;
      font-weight: 800;
      color: #4f46e5;
    }
    
    .color-sections {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .color-section-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
    }
    
    .color-section-title {
      font-weight: 700;
      font-size: 11px;
      color: #475569;
      margin-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }
    
    .color-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    
    .color-table td {
      padding: 4px 0;
      border-bottom: 1px dashed #f1f5f9;
    }
    
    .color-q-text {
      color: #64748b;
    }
    
    .color-ans {
      color: #4f46e5;
    }
    
    .smi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 15px;
    }
    
    .smi-item {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }
    
    .smi-badge {
      color: #4f46e5;
    }
    
    .sub-section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 8px;
    }
    
    .scenario-list {
      padding-left: 20px;
      font-size: 11px;
      margin-bottom: 15px;
    }
    
    .smi-rankings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .smi-rank-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px;
    }
    
    .smi-rank-title {
      font-weight: 700;
      font-size: 11px;
      color: #4f46e5;
      margin-bottom: 6px;
    }
    
    .smi-rank-ol {
      padding-left: 15px;
      font-size: 10.5px;
      color: #334155;
    }
    
    .column-indicator {
      color: #888;
      font-weight: 600;
    }
    
    .parents-meeting-sections {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .parents-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      background-color: #fcfcfc;
    }
    
    .parents-card-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    
    .parent-field {
      margin-bottom: 10px;
    }
    
    .parent-field:last-child {
      margin-bottom: 0;
    }
    
    .parent-label {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }
    
    .parent-value {
      font-size: 12px;
      color: #1e293b;
      margin-top: 2px;
    }
    
    .ratings-block {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .rating-box {
      flex: 1;
      min-width: 80px;
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 8px;
      text-align: center;
    }
    
    .r-label {
      font-size: 8px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    
    .r-val {
      font-size: 12px;
      font-weight: 900;
      color: #4f46e5;
    }
    
    .priority-item {
      border-bottom: 1px dashed #e2e8f0;
      padding: 6px 0;
    }
    
    .priority-top {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 600;
    }
    
    .priority-exp {
      font-size: 10px;
      color: #64748b;
      font-style: italic;
    }
    
    .sd-question-item {
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    
    .sd-q-title {
      font-weight: 600;
      color: #334155;
      font-size: 12px;
    }
    
    .sd-a-box {
      font-size: 12px;
      color: #4f46e5;
      font-style: italic;
      margin-top: 4px;
      padding-left: 8px;
      border-left: 2px solid #ddd6fe;
    }
    
    .jf-cat-block {
      margin-bottom: 20px;
    }
    
    .jf-cat-title {
      font-size: 12px;
      font-weight: 800;
      color: #4f46e5;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    
    .jf-sec-card {
      border: 1px solid #f1f5f9;
      background-color: #fcfcfc;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
    }
    
    .jf-sec-title {
      font-weight: 600;
      font-size: 11px;
      color: #475569;
      margin-bottom: 8px;
    }
    
    .jf-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 10.5px;
      border-bottom: 1px dashed #f1f5f9;
    }
    
    .jf-badge {
      font-size: 8px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }
    
    .jf-badge.high {
      background-color: #ecfdf5;
      color: #047857;
    }
    
    .jf-badge.medium {
      background-color: #fffbeb;
      color: #b45309;
    }
    
    .jf-badge.low {
      background-color: #fdf2f2;
      color: #b91c1c;
    }
    
    .empty-text {
      color: #94a3b8;
      font-style: italic;
    }
    
    .fallback-json {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 11px;
    }
    
    .center {
      text-align: center;
    }
    .font-bold {
      font-weight: 700;
    }
    .text-right {
      text-align: right;
    }
    
    @media print {
      body {
        padding: 0;
        font-size: 11px;
      }
      .module-card {
        border-color: #ccc;
        margin-bottom: 20px;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  
  <div class="print-header">
    <div class="logo-area">
      <h1>HOLISTREE</h1>
      <p>Career Guidance & Assessment Portal</p>
    </div>
    <div class="meta-area">
      <p>Report Type: <strong>Assessment Survey Responses</strong></p>
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

  ${client.modules.map(m => {
    const responseData = m.response?.data as any;
    const hasResponse = m.response && responseData && Object.keys(responseData).length > 0;
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
          const questions = schema.questions || [];

          if (testType) {
            return renderScoredTestHTML(testType, answers);
          }

          if (questions.length > 0) {
            return `
              <div class="qa-list">
                ${questions.map((q: any) => {
                  const val = answers[q.id];
                  if (val === undefined || val === null) return '';
                  return `
                    <div class="qa-item">
                      <div class="q-text">${q.question}</div>
                      ${q.description ? `<div class="q-desc">${q.description}</div>` : ''}
                      <div class="a-text">${formatResponseValue(q, val)}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }

          // Fallback if no questions schema but data exists
          return `
            <pre class="fallback-json">${JSON.stringify(answers, null, 2)}</pre>
          `;
        })()}
      </div>
    `;
  }).join('')}

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error: any) {
    console.error('PDF Combined Answers generation error:', error);
    return new NextResponse(`Error generating combined answers PDF: ${error.message}`, { status: 500 });
  }
}

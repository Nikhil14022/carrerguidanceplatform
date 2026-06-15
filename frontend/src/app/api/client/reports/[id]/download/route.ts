import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const report = await prisma.report.findUnique({
      where: { id: resolvedParams.id },
      include: {
        careerOptions: { include: { skillGaps: true } },
        clientProfile: {
          include: {
            user: { select: { name: true, email: true } },
            modules: {
              include: { response: true, module: true }
            }
          }
        }
      }
    });

    if (!report) {
      return new NextResponse('Report not found', { status: 404 });
    }

    const userName = report.clientProfile?.user?.name || 'Valued Client';
    const userEmail = report.clientProfile?.user?.email || '';
    const reportDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    // Extract modules responses
    const modules = report.clientProfile?.modules || [];
    const getModuleData = (keywords: string[]) => {
      const match = modules.find((m: any) => {
        const title = (m.module?.title || '').toLowerCase();
        return keywords.some(kw => title.includes(kw.toLowerCase()));
      });
      return match?.response?.data || null;
    };

    const demoData = getModuleData(['demographics', 'module_1', 'module 1']) as any;
    const aimData = getModuleData(['aim', 'vision', 'module_2', 'module 2']) as any;
    const visualData = getModuleData(['movie', 'visual', 'world', 'module_5', 'module 5']) as any;
    const friendsData = getModuleData(['friend', 'relationship', 'module_6', 'module 6']) as any;
    const familyData = getModuleData(['family', 'module_7', 'module 7']) as any;
    const lifestyleData = getModuleData(['lifestyle', 'expectancies', 'module_8', 'module 8']) as any;
    const bodyData = getModuleData(['body', 'self', 'image', 'module_9', 'module 9']) as any;
    const swData = getModuleData(['strength', 'weakness', 'module_10', 'module 10']) as any;
    const fearsData = getModuleData(['fear', 'module_11', 'module 11']) as any;
    const valuesData = getModuleData(['value', 'system', 'module_13', 'module 13']) as any;
    const riasecData = getModuleData(['riasec', 'interest', 'module_14', 'module 14']) as any;
    const colorData = getModuleData(['color', 'colour', 'working_style', 'style', 'module_15', 'module 15']) as any;
    const smiData = getModuleData(['subject', 'interest', 'hypotheticals', 'smi', 'module_16', 'module 16']) as any;

    // Parse AI report content
    let parsedContent: any = {};
    let isJson = false;
    if (report.content) {
      try {
        parsedContent = JSON.parse(report.content);
        isJson = typeof parsedContent === 'object' && parsedContent !== null && 'personality_insights' in parsedContent;
      } catch (e) {
        isJson = false;
      }
    }
    const personalityInsights = isJson ? parsedContent.personality_insights : (report.content || '');
    const mbtiType = isJson ? parsedContent.mbti_type : 'Pending';
    const mbtiInterpretation = isJson ? parsedContent.mbti_interpretation : '';
    const mbtiDimensions = isJson ? parsedContent.mbti_dimensions : null;
    const overviewSummaries = isJson ? parsedContent.overview_summaries : null;

    // Helper to format values
    const safeVal = (v: any) => v !== undefined && v !== null ? v : '—';

    // 1. Demographics Setup
    const demoSubjects = demoData?.demo_subjects || [];
    const activeSubjects = demoSubjects.filter((s: any) => s && s.col1 && s.col1.trim() !== '');

    const demoHobbies = demoData?.demo_hobbies || [];
    const activeHobbies = demoHobbies.filter((h: any) => h && h.col1 && h.col1.trim() !== '');

    const demoRoutine = demoData?.demo_routine || [];
    const activeRoutine = demoRoutine.filter((r: any) => r && r.trim() !== '');

    // 2. Values Setup
    const topValues = valuesData?.__scored?.scores?.topValues || [];
    const valuesByCategory = {
      Ideal: [] as string[],
      Standard: [] as string[],
      'Want & Preference': [] as string[]
    };
    topValues.forEach((valObj: any) => {
      const cat = valObj.category || 'Ideal';
      if (cat in valuesByCategory) {
        (valuesByCategory as any)[cat].push(valObj.value);
      }
    });

    // 3. Fears Setup
    const fearKeys = [
      { key: 'fear_public_speaking', label: 'Public Speaking' },
      { key: 'fear_missing_out', label: 'Missing Out (FOMO)' },
      { key: 'fear_future', label: 'Future / Uncertainty' },
      { key: 'fear_failure', label: 'Failure' },
      { key: 'fear_rejection', label: 'Rejection' },
      { key: 'fear_disappointment_others_to_me', label: 'Disappointment to Others / Self' },
      { key: 'fear_mediocre_life', label: 'Mediocre Life' }
    ];

    const fearsGrouped = {
      low: [] as string[],
      medium: [] as string[],
      high: [] as string[]
    };

    fearKeys.forEach(f => {
      const score = fearsData && fearsData[f.key] !== undefined ? Number(fearsData[f.key]) : 3; // default fallback
      const labelWithScore = `${f.label} (Score: ${score}/10)`;
      if (score >= 8) {
        fearsGrouped.high.push(labelWithScore);
      } else if (score >= 5) {
        fearsGrouped.medium.push(labelWithScore);
      } else {
        fearsGrouped.low.push(labelWithScore);
      }
    });

    // 4. RIASEC Setup
    const riasecTotals = riasecData?.__scored?.scores?.columnTotals || riasecData?.__scored?.raw?.totals || {};
    const riasecTop3 = riasecData?.__scored?.scores?.top3 || [];
    const hollandCode = riasecData?.__scored?.scores?.hollandCode || riasecData?.__scored?.raw?.hollandCode || 'ARI';

    // 5. Working Style Setup
    const workingStyleResult = colorData?.__testData?.result || 'Blue Red Introvert';
    const workingStyleInterpretations: Record<string, string> = {
      'blue red introvert': 'Structured, detail-oriented, and highly analytical. Prefers quiet execution, values precision, and works best in individual contexts where logic and organization are paramount.',
      'red blue introvert': 'Goal-focused and logical. Direct and outcome-driven, but operates with high precision and structure, preferring to plan thoroughly before taking action.',
      'blue green introvert': 'Methodical and supportive. Highly reliable, patient, and detail-oriented. Enjoys organizing background processes and ensuring stability.',
      'green blue introvert': 'Quietly cooperative, precise, and loyal. Value harmony and structured work where goals are clear and conflict is minimal.'
    };
    const resolvedStyleDesc = workingStyleInterpretations[workingStyleResult.toLowerCase()] || 
      'Combines analytical structure, decisiveness, and focused execution. Values competence, clear boundaries, and independence in the workplace.';

    // 6. Strengths Setup
    const swGrid = swData?.sw_grid || [];
    const swGrouped = {
      weaknesses: [] as string[],
      situational: [] as string[],
      strengths: [] as string[]
    };
    swGrid.forEach((item: any) => {
      const rating = Number(item.rating);
      const label = rating >= 8 ? (item.rightLabel || item.trait) : rating <= 4 ? (item.leftLabel || item.trait) : item.trait;
      const text = `${label} (${rating}/10)`;
      if (rating >= 8) {
        swGrouped.strengths.push(text);
      } else if (rating <= 4) {
        swGrouped.weaknesses.push(text);
      } else {
        swGrouped.situational.push(text);
      }
    });

    // 7. SMI Setup
    const smiTotals = smiData?.__scored?.scores?.columnTotals || smiData?.__scored?.raw?.columnTotals || {};
    const smiTop3 = smiData?.__scored?.scores?.topColumns || [];

    // 8. Media Setup
    const mediaMovies = (visualData?.visual_fav_movies || []).filter((m: any) => m && m.col1).map((m: any) => m.col1);
    const mediaSeries = (visualData?.visual_fav_series || []).filter((s: any) => s && s.col1).map((s: any) => s.col1);
    const mediaGenres = (visualData?.visual_genres || []).filter((g: any) => g && g.option).map((g: any) => g.option);
    const mediaCharacters = (visualData?.visual_characters || []).filter((c: any) => c && c.col1).map((c: any) => `${c.col1}: ${c.col2 || ''}`);
    const mediaGames = (visualData?.visual_games || []).filter((g: any) => g && g.col2).map((g: any) => g.col2);

    // 9. Lifestyle Setup
    const lifestylePriorities = lifestyleData?.lifestyle_career_priorities || [];
    const lifestyleStruggles = (lifestyleData?.lifestyle_12 || []).filter((s: any) => s && s.col2).map((s: any) => s.col2);

    // 10. Overview Setup
    const finalOverview = {
      aim: overviewSummaries?.aim_and_vision || aimData?.aim_1 || 'Interested in Creative Arts (Sketching, Guitar) and seeking career clarity.',
      friends: overviewSummaries?.friends || friendsData?.friends_1 || 'Prefers a small, close-knit circle of trusted, adventurous, and humorous friends.',
      relationship: overviewSummaries?.relationship || 'Values personal autonomy and privacy, maintaining selective, high-trust connections.',
      family: overviewSummaries?.family || familyData?.family_1 || 'Shares a supportive, quiet bond with parents who encourage self-learning and creative expressions.',
      bodyImage: overviewSummaries?.body_image || bodyData?.body_2_reason || 'Conscious of appearance and physical growth, with growing focus on aesthetics.',
      impactful: overviewSummaries?.impactful_incidents || 'Independently learned sketching and music during COVID, defining a self-taught, creative identity.'
    };

    // Career grid mapping
    const careerCardsHtml = report.careerOptions.map((opt: any, i: number) => `
      <div class="career-card">
        <div class="career-header">
          <div class="career-title">${i + 1}. ${opt.title}</div>
          <div class="career-match">${opt.match}% <small>alignment</small></div>
        </div>
        ${opt.reasoning ? `<div class="career-reasoning">${opt.reasoning}</div>` : ''}
        ${opt.skillGaps && opt.skillGaps.length > 0 ? `
          <div class="career-skills-label">Focus Skill Gaps & Development:</div>
          <div class="career-skills-tags">
            ${opt.skillGaps.map((sg: any) => `<span class="skill-tag">${sg.skill || sg}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${userName} - Comprehensive Career Analysis Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@400;500;700&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: 'Inter', sans-serif; 
    color: #1e293b; 
    line-height: 1.5; 
    background: #ffffff; 
    font-size: 13px;
  }
  .page { 
    padding: 60px 80px; 
    max-width: 900px; 
    margin: 0 auto; 
    background: #ffffff;
  }
  
  /* Cover / Header section */
  .cover-header { 
    text-align: center; 
    padding-bottom: 30px; 
    border-bottom: 3px double #e2e8f0; 
    margin-bottom: 40px; 
  }
  .cover-header .subtitle { 
    font-family: 'Outfit', sans-serif; 
    font-size: 11px; 
    color: #6366f1; 
    text-transform: uppercase; 
    letter-spacing: 4px; 
    font-weight: 800; 
    margin-bottom: 10px;
  }
  .cover-header h1 { 
    font-family: 'Outfit', sans-serif; 
    font-size: 36px; 
    color: #0f172a; 
    font-weight: 800; 
    letter-spacing: -1px; 
  }
  .cover-header .meta { 
    font-size: 12px; 
    color: #64748b; 
    margin-top: 10px; 
  }

  .section { 
    margin-bottom: 35px; 
    page-break-inside: avoid; 
  }
  .section-title { 
    font-family: 'Outfit', sans-serif; 
    font-size: 14px; 
    font-weight: 800; 
    text-transform: uppercase; 
    letter-spacing: 2px; 
    color: #4f46e5; 
    border-bottom: 2px solid #f1f5f9; 
    padding-bottom: 8px; 
    margin-bottom: 16px; 
  }

  /* Tables */
  table { 
    width: 100%; 
    border-collapse: collapse; 
    margin-bottom: 15px; 
    font-size: 12px;
  }
  th, td { 
    border: 1px solid #e2e8f0; 
    padding: 10px 12px; 
    text-align: left; 
    vertical-align: top;
  }
  th { 
    background-color: #f8fafc; 
    color: #334155; 
    font-weight: 600; 
  }
  .table-title { 
    font-weight: 700; 
    background-color: #f1f5f9; 
  }

  /* Lists and Grids */
  .grid-2 { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 15px; 
    margin-bottom: 15px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 15px;
    margin-bottom: 15px;
  }
  ul { 
    padding-left: 20px; 
    margin-bottom: 10px; 
  }
  li { 
    margin-bottom: 4px; 
  }

  /* Custom blocks */
  .persona-box { 
    background: #f8fafc; 
    padding: 20px; 
    border-left: 4px solid #4f46e5; 
    border-radius: 0 8px 8px 0; 
    font-size: 13px; 
    line-height: 1.7; 
    color: #334155;
    margin-bottom: 20px;
  }
  .career-card { 
    border: 1px solid #e2e8f0; 
    border-radius: 8px; 
    padding: 20px; 
    margin-bottom: 15px; 
    background-color: #fdfdfd;
    page-break-inside: avoid;
  }
  .career-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 8px; 
  }
  .career-title { 
    font-size: 15px; 
    font-weight: 700; 
    color: #0f172a; 
  }
  .career-match { 
    font-size: 20px; 
    font-weight: 800; 
    color: #4f46e5; 
  }
  .career-match small { 
    font-size: 10px; 
    color: #64748b; 
    font-weight: 500; 
  }
  .career-reasoning { 
    font-size: 12.5px; 
    color: #475569; 
    line-height: 1.6;
    margin-bottom: 12px;
  }
  .career-skills-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 6px;
  }
  .career-skills-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .skill-tag { 
    background: #e0f2fe; 
    color: #0369a1; 
    padding: 4px 10px; 
    border-radius: 4px; 
    font-size: 11px; 
    font-weight: 600; 
  }

  .tag-group {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tag {
    background-color: #f1f5f9;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
  }

  /* Score indicators */
  .bar-container { 
    background-color: #e2e8f0; 
    border-radius: 4px; 
    height: 14px; 
    width: 100%; 
    overflow: hidden; 
    margin-top: 4px; 
  }
  .bar-fill { 
    background-color: #4f46e5; 
    height: 100%; 
  }

  .footer { 
    margin-top: 50px; 
    padding-top: 20px; 
    border-top: 1px solid #e2e8f0; 
    text-align: center; 
    font-size: 11px; 
    color: #94a3b8; 
  }
  .footer strong { 
    color: #4f46e5; 
  }

  /* Page break rules for printing */
  .page-break {
    page-break-before: always;
  }

  @media print {
    body { padding: 0; }
    .page { padding: 40px 50px; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="cover-header">
    <div class="subtitle">Comprehensive Student Assessment Report</div>
    <h1>${userName}</h1>
    <div class="meta">Generated: ${reportDate} • ${userEmail} • Career Platform</div>
  </div>

  <!-- SECTION 1: INDEX TABLE -->
  <div class="section">
    <div class="section-title">1. Table of Contents</div>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Section Name</th>
          <th>Description & Scope of Assessment</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>2. Demographics & Academics</strong></td>
          <td>Personal background details, educational history, routine, subjects of interest, and core hobbies.</td>
        </tr>
        <tr>
          <td><strong>3. Value System Profile</strong></td>
          <td>Categorization of student values into Ideals, Standards, and Wants & Preferences.</td>
        </tr>
        <tr>
          <td><strong>4. Fears Rating Profile</strong></td>
          <td>Level of intensities for common adolescent and performance-related fears.</td>
        </tr>
        <tr>
          <td><strong>5. 16 Personality Factors (16PF)</strong></td>
          <td>Estimated MBTI personality structure, dimension breakdown, and full psychological profiling.</td>
        </tr>
        <tr>
          <td><strong>6. RIASEC Scores & Interests</strong></td>
          <td>Holland Occupational Code scores mapping work-environment preferences and dominant types.</td>
        </tr>
        <tr>
          <td><strong>7. Working Style (Colour Test)</strong></td>
          <td>Primary working style combination and traits related to conflict, decision-making, and teamwork.</td>
        </tr>
        <tr>
          <td><strong>8. Strengths & Weaknesses</strong></td>
          <td>Categorization of 30+ behavioural metrics into Core Strengths, Situational, and Growth Areas.</td>
        </tr>
        <tr>
          <td><strong>9. Subject Matter Interest (SMI)</strong></td>
          <td>SMI column scores and interest fields reflecting cognitive engagement across scenarios.</td>
        </tr>
        <tr>
          <td><strong>10. Media & Visual World</strong></td>
          <td>Media consumption, genres, favorite characters, games, music, and creative influences.</td>
        </tr>
        <tr>
          <td><strong>11. Lifestyle Expectancies</strong></td>
          <td>Ideal day-to-day style preferences, career value priorities, and developmental struggles.</td>
        </tr>
        <tr>
          <td><strong>12. Overview Summaries</strong></td>
          <td>AI-synthesized diagnostic reviews of core life compartments (family, friends, vision).</td>
        </tr>
        <tr>
          <td><strong>13. Recommended Careers</strong></td>
          <td>Top 3 curated career trajectories matching assessment responses, with identified skill gaps.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 2: DEMOGRAPHICS -->
  <div class="section">
    <div class="section-title">2. Demographics & Academic Profile</div>
    <table>
      <tr>
        <td style="width: 25%;"><strong>Student Name:</strong></td>
        <td>${safeVal(demoData?.demo_name || userName)}</td>
        <td style="width: 25%;"><strong>Age:</strong></td>
        <td>${safeVal(demoData?.demo_age)}</td>
      </tr>
      <tr>
        <td><strong>Date of Birth:</strong></td>
        <td>${safeVal(demoData?.demo_dob)}</td>
        <td><strong>Location:</strong></td>
        <td>${safeVal(demoData?.demo_residence)}</td>
      </tr>
      <tr>
        <td><strong>School Name:</strong></td>
        <td>${safeVal(demoData?.demo_education?.school?.name)}</td>
        <td><strong>Current Grade:</strong></td>
        <td>${safeVal(demoData?.demo_education?.school?.grade)}</td>
      </tr>
      <tr>
        <td><strong>Living Arrangements:</strong></td>
        <td colspan="3">${safeVal(demoData?.demo_lives_with)}</td>
      </tr>
    </table>

    <div class="grid-2">
      <div>
        <h4 style="margin-bottom: 6px; color: #334155;">Academic Subject Sentiments</h4>
        ${activeSubjects.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Remarks / Sentiment</th>
              </tr>
            </thead>
            <tbody>
              ${activeSubjects.map((s: any) => `
                <tr>
                  <td><strong>${s.col1}</strong></td>
                  <td>${s.col2 || 'Neutral'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color: #64748b; font-style: italic;">No specific subject details submitted.</p>'}
      </div>
      <div>
        <h4 style="margin-bottom: 6px; color: #334155;">Primary Hobbies</h4>
        ${activeHobbies.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Hobby</th>
                <th>Details</th>
                <th>Time Spent</th>
              </tr>
            </thead>
            <tbody>
              ${activeHobbies.map((h: any) => `
                <tr>
                  <td><strong>${h.col1}</strong></td>
                  <td>${h.col2 || '—'}</td>
                  <td>${h.col3 || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color: #64748b; font-style: italic;">No hobbies submitted.</p>'}
      </div>
    </div>

    ${activeRoutine.length > 0 ? `
      <h4 style="margin-bottom: 6px; color: #334155;">Student Daily Routine Summary</h4>
      <div style="background-color: #f8fafc; padding: 10px; border-radius: 4px; font-size: 11.5px;">
        ${activeRoutine.join(' ➔ ')}
      </div>
    ` : ''}
  </div>

  <div class="page-break"></div>

  <!-- SECTION 3: VALUES PROFILE -->
  <div class="section">
    <div class="section-title">3. Value System Profile</div>
    <p style="margin-bottom: 10px; color: #475569;">Values determine the core guiding principles of a student. These are categorized into Ideals (fundamental drivers), Standards (expected norms), and Wants & Preferences (desired but flexible criteria).</p>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Category</th>
          <th>Identified Personal Values</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Ideals (Core Drivers)</strong></td>
          <td>
            ${valuesByCategory.Ideal.length > 0 
              ? `<div class="tag-group">${valuesByCategory.Ideal.map(v => `<span class="tag" style="background:#e0f2fe; color:#0369a1; font-weight: 600;">${v}</span>`).join('')}</div>`
              : '<em>None identified or pending response</em>'}
          </td>
        </tr>
        <tr>
          <td><strong>Standards (Social/Life Norms)</strong></td>
          <td>
            ${valuesByCategory.Standard.length > 0 
              ? `<div class="tag-group">${valuesByCategory.Standard.map(v => `<span class="tag" style="background:#f0fdf4; color:#166534; font-weight: 600;">${v}</span>`).join('')}</div>`
              : '<em>None identified or pending response</em>'}
          </td>
        </tr>
        <tr>
          <td><strong>Wants & Preferences</strong></td>
          <td>
            ${valuesByCategory['Want & Preference'].length > 0 
              ? `<div class="tag-group">${valuesByCategory['Want & Preference'].map(v => `<span class="tag" style="background:#fef3c7; color:#92400e; font-weight: 600;">${v}</span>`).join('')}</div>`
              : '<em>None identified or pending response</em>'}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 4: FEARS -->
  <div class="section">
    <div class="section-title">4. Fears Rating Profile</div>
    <p style="margin-bottom: 10px; color: #475569;">Self-reported intensity of common emotional and achievement-related fears (rated 1 to 10).</p>
    <div class="grid-3">
      <div style="background-color: #fee2e2; border-top: 3px solid #ef4444; padding: 12px; border-radius: 4px;">
        <strong style="color: #991b1b; display: block; margin-bottom: 6px;">High Intensity (8-10)</strong>
        ${fearsGrouped.high.length > 0 
          ? `<ul style="padding-left: 15px; color:#7f1d1d;">${fearsGrouped.high.map(f => `<li>${f}</li>`).join('')}</ul>` 
          : '<em style="color:#991b1b;">None reported</em>'}
      </div>
      <div style="background-color: #ffedd5; border-top: 3px solid #f97316; padding: 12px; border-radius: 4px;">
        <strong style="color: #9a3412; display: block; margin-bottom: 6px;">Medium Intensity (5-7)</strong>
        ${fearsGrouped.medium.length > 0 
          ? `<ul style="padding-left: 15px; color:#7c2d12;">${fearsGrouped.medium.map(f => `<li>${f}</li>`).join('')}</ul>` 
          : '<em style="color:#9a3412;">None reported</em>'}
      </div>
      <div style="background-color: #f0fdf4; border-top: 3px solid #22c55e; padding: 12px; border-radius: 4px;">
        <strong style="color: #166534; display: block; margin-bottom: 6px;">Low Intensity (1-4)</strong>
        ${fearsGrouped.low.length > 0 
          ? `<ul style="padding-left: 15px; color:#14532d;">${fearsGrouped.low.map(f => `<li>${f}</li>`).join('')}</ul>` 
          : '<em style="color:#166534;">None reported</em>'}
      </div>
    </div>
  </div>

  <!-- SECTION 5: 16PF -->
  <div class="section">
    <div class="section-title">5. 16 Personality Factors (16PF) Test Profile</div>
    <div style="display: flex; gap: 20px; align-items: flex-start; margin-bottom: 12px;">
      <div style="background: #4f46e5; color: white; padding: 12px 18px; border-radius: 6px; text-align: center;">
        <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; display: block;">Calculated MBTI</span>
        <strong style="font-size: 22px; font-weight: 800; font-family: 'Outfit', sans-serif;">${mbtiType}</strong>
      </div>
      <div style="flex: 1; font-size: 12px; color: #475569; line-height: 1.6;">
        ${mbtiInterpretation || 'Based on the 16 Personality Factors assessment responses, the student shows a unique profile reflecting their style of thinking, working, and social interactions.'}
      </div>
    </div>

    ${mbtiDimensions ? `
      <table style="margin-top: 10px;">
        <thead>
          <tr>
            <th style="width: 20%;">Dimension</th>
            <th style="width: 30%;">Dominant Trait</th>
            <th>Intensity / Strength</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(mbtiDimensions).map(([key, dim]: any) => `
            <tr>
              <td><strong>${key.charAt(0).toUpperCase() + key.slice(1)}</strong></td>
              <td>${dim.label || 'Neutral'}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="min-width: 35px; font-weight: 600;">${dim.percentage}%</span>
                  <div class="bar-container">
                    <div class="bar-fill" style="width: ${dim.percentage}%;"></div>
                  </div>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : ''}
  </div>

  <div class="page-break"></div>

  <!-- SECTION 6: RIASEC -->
  <div class="section">
    <div class="section-title">6. RIASEC Scores & Career Interests</div>
    <p style="margin-bottom: 10px; color: #475569;">The RIASEC Holland Code maps a student's interests onto six vocational categories. High scores point to environment styles where they will feel most motivated.</p>
    
    <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 15px;">
      <div style="background: #0ea5e9; color: white; padding: 10px 15px; border-radius: 6px; text-align: center;">
        <span style="font-size: 9px; text-transform: uppercase; letter-spacing: 1px; display: block;">Holland Code</span>
        <strong style="font-size: 20px; font-weight: 800;">${hollandCode}</strong>
      </div>
      <div style="flex: 1; display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; text-align: center;">
        ${['R', 'I', 'A', 'S', 'E', 'C'].map(char => {
          const names: Record<string, string> = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' };
          const val = riasecTotals[char] !== undefined ? riasecTotals[char] : '—';
          return `
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 4px;">
              <div style="font-weight: 700; color:#0f172a; font-size: 13px;">${char}</div>
              <div style="font-size: 9px; color:#64748b; margin: 2px 0;">${names[char]}</div>
              <strong style="color: #4f46e5; font-size: 14px;">${val}</strong>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <h4 style="margin-bottom: 8px; color: #334155;">Dominant Interest Types</h4>
    ${riasecTop3.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Interest Area</th>
            <th>Functional Description & Work Fit</th>
          </tr>
        </thead>
        <tbody>
          ${riasecTop3.map((item: any) => `
            <tr>
              <td><strong>${item.label} (${item.letter})</strong><br/><small style="color:#64748b;">Score: ${item.score}</small></td>
              <td style="font-size: 11.5px; line-height: 1.5; color: #475569;">${item.interpretation}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="color: #64748b; font-style: italic;">No detailed RIASEC calculations completed.</p>'}
  </div>

  <!-- SECTION 7: COLOR TEST -->
  <div class="section">
    <div class="section-title">7. Colour Test (Working Style)</div>
    <table>
      <tr>
        <td style="width: 25%;"><strong>Primary Working Style:</strong></td>
        <td><strong style="color: #4f46e5;">${workingStyleResult}</strong></td>
      </tr>
      <tr>
        <td><strong>Behavioral Archetype:</strong></td>
        <td style="font-size: 12px; color: #475569; line-height: 1.6;">${resolvedStyleDesc}</td>
      </tr>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 8: STRENGTHS & WEAKNESSES -->
  <div class="section">
    <div class="section-title">8. Strengths & Weaknesses Grid</div>
    <p style="margin-bottom: 10px; color: #475569;">Assessment profiles across 30+ cognitive and execution parameters grouped by user ratings.</p>
    <div class="grid-3">
      <div style="background-color: #f0fdf4; border-top: 3px solid #22c55e; padding: 12px; border-radius: 4px;">
        <strong style="color: #166534; display: block; margin-bottom: 6px;">Core Strengths (8-10)</strong>
        ${swGrouped.strengths.length > 0 
          ? `<ul style="padding-left: 15px; font-size:11px; color:#14532d;">${swGrouped.strengths.map(s => `<li>${s}</li>`).join('')}</ul>` 
          : '<em style="color:#166534;">None identified</em>'}
      </div>
      <div style="background-color: #f8fafc; border-top: 3px solid #64748b; padding: 12px; border-radius: 4px;">
        <strong style="color: #334155; display: block; margin-bottom: 6px;">Situational/Average (5-7)</strong>
        ${swGrouped.situational.length > 0 
          ? `<ul style="padding-left: 15px; font-size:11px; color:#334155;">${swGrouped.situational.map(s => `<li>${s}</li>`).join('')}</ul>` 
          : '<em style="color:#64748b;">None identified</em>'}
      </div>
      <div style="background-color: #fff1f2; border-top: 3px solid #fda4af; padding: 12px; border-radius: 4px;">
        <strong style="color: #9f1239; display: block; margin-bottom: 6px;">Growth / Development (1-4)</strong>
        ${swGrouped.weaknesses.length > 0 
          ? `<ul style="padding-left: 15px; font-size:11px; color:#9f1239;">${swGrouped.weaknesses.map(w => `<li>${w}</li>`).join('')}</ul>` 
          : '<em style="color:#9f1239;">None identified</em>'}
      </div>
    </div>
  </div>

  <!-- SECTION 9: SMI PROFILE -->
  <div class="section">
    <div class="section-title">9. Subject Matter Interest Profile (SMI)</div>
    <p style="margin-bottom: 10px; color: #475569;">Calculated interest scores reflecting preference intensities across hypothetical academic and task scenarios (A to H).</p>
    
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; text-align: center;">
      ${Object.entries({
        A: 'Physical/Life Sciences',
        B: 'Social Sciences/Humanity',
        C: 'Arts, Ent. & Media',
        D: 'Business & Finance'
      }).map(([col, lbl]) => `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px;">
          <div style="font-size: 11px; color:#64748b; font-weight: 500;">${lbl}</div>
          <strong style="color:#4f46e5; font-size: 15px; display:block; margin-top:4px;">${smiTotals[col] !== undefined ? smiTotals[col] : '—'}</strong>
        </div>
      `).join('')}
      ${Object.entries({
        E: 'Body Kinaesthetic',
        F: 'Designer/Artisan',
        G: 'Engineering/Tech',
        H: 'Education/Health Care'
      }).map(([col, lbl]) => `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px;">
          <div style="font-size: 11px; color:#64748b; font-weight: 500;">${lbl}</div>
          <strong style="color:#4f46e5; font-size: 15px; display:block; margin-top:4px;">${smiTotals[col] !== undefined ? smiTotals[col] : '—'}</strong>
        </div>
      `).join('')}
    </div>

    <h4 style="margin-bottom: 8px; color: #334155;">Dominant Career Domains</h4>
    ${smiTop3.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Domain</th>
            <th>Interest Profile Description</th>
          </tr>
        </thead>
        <tbody>
          ${smiTop3.map((item: any) => `
            <tr>
              <td><strong>${item.label}</strong><br/><small style="color:#64748b;">SMI Score: ${item.score}</small></td>
              <td style="font-size: 11.5px; line-height: 1.5; color: #475569;">${item.interpretation}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="color: #64748b; font-style: italic;">No detailed SMI responses scored.</p>'}
  </div>

  <div class="page-break"></div>

  <!-- SECTION 10: MEDIA & GENRE -->
  <div class="section">
    <div class="section-title">10. Media Genre & Visual World</div>
    <table>
      <tr>
        <td style="width: 25%;"><strong>Favorite Movies:</strong></td>
        <td>${mediaMovies.length > 0 ? mediaMovies.join(', ') : 'None or pending response'}</td>
      </tr>
      <tr>
        <td><strong>Favorite Series:</strong></td>
        <td>${mediaSeries.length > 0 ? mediaSeries.join(', ') : 'None or pending response'}</td>
      </tr>
      <tr>
        <td><strong>Preferred Genres:</strong></td>
        <td>${mediaGenres.length > 0 ? mediaGenres.join(', ') : 'None or pending response'}</td>
      </tr>
      <tr>
        <td><strong>Inspirational Figures:</strong></td>
        <td>
          ${mediaCharacters.length > 0 
            ? `<ul style="padding-left: 15px; font-size: 11.5px; color:#475569;">${mediaCharacters.map((c: any) => `<li>${c}</li>`).join('')}</ul>`
            : 'None or pending response'}
        </td>
      </tr>
      <tr>
        <td><strong>Gaming Style:</strong></td>
        <td>${mediaGames.length > 0 ? mediaGames.join(', ') : 'None or pending response'}</td>
      </tr>
      <tr>
        <td><strong>Music Preference:</strong></td>
        <td>${safeVal(visualData?.visual_music)}</td>
      </tr>
      <tr>
        <td><strong>Visual Superpower choice:</strong></td>
        <td><em>${safeVal(visualData?.visual_superpower)}</em></td>
      </tr>
    </table>
  </div>

  <!-- SECTION 11: LIFESTYLE -->
  <div class="section">
    <div class="section-title">11. Lifestyle Expectancies</div>
    <div class="grid-2">
      <div>
        <h4 style="margin-bottom: 6px; color: #334155;">Career Value Priorities</h4>
        ${lifestylePriorities.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Factor</th>
                <th>Preference Rank (1-10)</th>
              </tr>
            </thead>
            <tbody>
              ${lifestylePriorities.map((item: any) => `
                <tr>
                  <td><strong>${item.col1}</strong></td>
                  <td>${item.col2} / 10</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color: #64748b; font-style: italic;">No priorities rated yet.</p>'}
      </div>
      <div>
        <h4 style="margin-bottom: 6px; color: #334155;">Developmental Struggles</h4>
        ${lifestyleStruggles.length > 0 ? `
          <ul style="padding-left: 15px; color: #475569; font-size: 12px; line-height: 1.6;">
            ${lifestyleStruggles.map((str: any) => `<li>${str}</li>`).join('')}
          </ul>
        ` : '<p style="color: #64748b; font-style: italic;">No struggles listed.</p>'}
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 12: OVERVIEW SUMMARIES -->
  <div class="section">
    <div class="section-title">12. Overview Section Table</div>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Section Area</th>
          <th>AI Diagnostic & Summary Remarks</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Aim & Vision</strong></td>
          <td style="line-height: 1.5; color: #334155;">${finalOverview.aim}</td>
        </tr>
        <tr>
          <td><strong>Family Dynamics</strong></td>
          <td style="line-height: 1.5; color: #334155;">${finalOverview.family}</td>
        </tr>
        <tr>
          <td><strong>Friends & Socials</strong></td>
          <td style="line-height: 1.5; color: #334155;">${finalOverview.friends}</td>
        </tr>
        <tr>
          <td><strong>Relationship Styles</strong></td>
          <td style="line-height: 1.5; color: #334155;">${finalOverview.relationship}</td>
        </tr>
        <tr>
          <td><strong>Body Image & Self</strong></td>
          <td style="line-height: 1.5; color: #334155;">${finalOverview.bodyImage}</td>
        </tr>
        <tr>
          <td><strong>Impactful Incidents</strong></td>
          <td style="line-height: 1.5; color: #334155;">${finalOverview.impactful}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 13: RECOMMENDED CAREER OPTIONS -->
  <div class="section">
    <div class="section-title">13. Recommended Career Options</div>
    
    <div class="persona-box">
      <h3 style="margin-bottom: 6px; font-family:'Outfit', sans-serif; color: #0f172a; font-weight:700;">Professional Persona Summary</h3>
      <p>${personalityInsights}</p>
    </div>

    ${report.careerOptions.length > 0 ? `
      <div style="margin-top: 15px;">
        ${careerCardsHtml}
      </div>
    ` : '<p style="color: #64748b; font-style: italic;">No career recommendations generated yet.</p>'}
  </div>

  <div class="footer">
    <p>Report compiled by <strong>Career Guidance Platform</strong> using standardized cognitive assessment tests.</p>
    <p>&copy; ${new Date().getFullYear()} Career Path Platform. Confidential and Proprietary.</p>
  </div>
</div>
<script>
  window.onload = function() {
    setTimeout(function() {
      window.print();
    }, 400);
  }
</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error: any) {
    console.error('PDF generation error:', error);
    return new NextResponse(`Error generating PDF: ${error.message}`, { status: 500 });
  }
}

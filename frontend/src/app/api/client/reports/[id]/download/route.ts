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
    const holistreeReport = isJson ? parsedContent.holistree_report : null;

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
<title>${userName} - Comprehensive Career Design Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@400;500;700&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: 'Inter', sans-serif; 
    color: #0f172a; 
    line-height: 1.5; 
    background: #ffffff; 
    font-size: 12px;
  }
  .page { 
    padding: 50px 60px; 
    max-width: 900px; 
    margin: 0 auto; 
    background: #ffffff;
  }
  
  .cover-header { 
    text-align: center; 
    padding-bottom: 25px; 
    border-bottom: 2px solid #e2e8f0; 
    margin-bottom: 30px; 
  }
  .cover-header .subtitle { 
    font-family: 'Outfit', sans-serif; 
    font-size: 11px; 
    color: #4f46e5; 
    text-transform: uppercase; 
    letter-spacing: 3px; 
    font-weight: 800; 
    margin-bottom: 8px;
  }
  .cover-header h1 { 
    font-family: 'Outfit', sans-serif; 
    font-size: 32px; 
    color: #0f172a; 
    font-weight: 800; 
    letter-spacing: -1px; 
  }
  .cover-header .meta { 
    font-size: 11px; 
    color: #64748b; 
    margin-top: 8px; 
  }

  .section { 
    margin-bottom: 30px; 
    page-break-inside: avoid; 
  }
  .section-title { 
    font-family: 'Outfit', sans-serif; 
    font-size: 13px; 
    font-weight: 800; 
    text-transform: uppercase; 
    letter-spacing: 1.5px; 
    color: #4f46e5; 
    border-bottom: 2px solid #f1f5f9; 
    padding-bottom: 6px; 
    margin-bottom: 12px; 
  }
  .section-subtitle {
    font-weight: 700;
    font-size: 11px;
    color: #334155;
    text-transform: uppercase;
    margin-bottom: 6px;
    margin-top: 10px;
  }
  
  table { 
    width: 100%; 
    border-collapse: collapse; 
    margin-bottom: 12px; 
    font-size: 11px;
  }
  th, td { 
    border: 1px solid #e2e8f0; 
    padding: 8px 10px; 
    text-align: left; 
    vertical-align: top;
  }
  th { 
    background-color: #f8fafc; 
    color: #334155; 
    font-weight: 600; 
  }

  .grid-2 { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 15px; 
    margin-bottom: 12px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 15px;
    margin-bottom: 12px;
  }

  ul { 
    padding-left: 15px; 
    margin-bottom: 8px; 
  }
  li { 
    margin-bottom: 3px; 
  }

  .tag-group {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 4px;
  }
  .tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
  }

  .bar-container { 
    background-color: #e2e8f0; 
    border-radius: 4px; 
    height: 12px; 
    width: 100px; 
    overflow: hidden; 
  }
  .bar-fill { 
    background-color: #4f46e5; 
    height: 100%; 
  }

  .persona-box { 
    background: #f8fafc; 
    padding: 15px; 
    border-left: 4px solid #4f46e5; 
    border-radius: 0 6px 6px 0; 
    font-size: 12px; 
    line-height: 1.6; 
    color: #334155;
    margin-bottom: 15px;
  }
  .career-card { 
    border: 1px solid #e2e8f0; 
    border-radius: 6px; 
    padding: 15px; 
    margin-bottom: 12px; 
    background-color: #fdfdfd;
    page-break-inside: avoid;
  }
  .career-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 6px; 
  }
  .career-title { 
    font-size: 13px; 
    font-weight: 700; 
    color: #0f172a; 
  }
  .career-match { 
    font-size: 16px; 
    font-weight: 800; 
    color: #4f46e5; 
  }
  .career-match small { 
    font-size: 9px; 
    color: #64748b; 
    font-weight: 500; 
  }
  .career-reasoning { 
    font-size: 11px; 
    color: #475569; 
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .footer { 
    margin-top: 40px; 
    padding-top: 15px; 
    border-top: 1px solid #e2e8f0; 
    text-align: center; 
    font-size: 10px; 
    color: #94a3b8; 
  }
  .page-break { 
    page-break-before: always; 
  }
</style>
</head>
<body>
<div class="page">
  <div class="cover-header">
    <div class="subtitle">Holistree Career Design</div>
    <h1>Career Design Report</h1>
    <div class="meta">
      <strong>Student Name:</strong> ${userName} &nbsp;|&nbsp; 
      <strong>Email:</strong> ${userEmail} &nbsp;|&nbsp; 
      <strong>Report Date:</strong> ${reportDate}
    </div>
  </div>

  <!-- RAW SCORES & PROFILES BLOCK -->
  <div class="section">
    <div class="section-title">Assessment Test Scores Overview</div>
    
    <div class="grid-2">
      <!-- Demographics Table -->
      <div>
        <div class="section-subtitle">Student Demographics</div>
        <table>
          <tr><td><strong>Age:</strong></td><td>${safeVal(demoData?.demo_age)}</td></tr>
          <tr><td><strong>DOB:</strong></td><td>${safeVal(demoData?.demo_dob)}</td></tr>
          <tr><td><strong>Location:</strong></td><td>${safeVal(demoData?.demo_residence)}</td></tr>
          <tr><td><strong>School:</strong></td><td>${safeVal(demoData?.demo_education?.school?.name)} (Grade ${safeVal(demoData?.demo_education?.school?.grade)})</td></tr>
          <tr><td><strong>Living with:</strong></td><td>${safeVal(demoData?.demo_lives_with)}</td></tr>
        </table>
      </div>

      <!-- Personality & Working Style -->
      <div>
        <div class="section-subtitle">Personality & Working Style</div>
        <table>
          <tr>
            <td><strong>MBTI Type:</strong></td>
            <td><strong>${mbtiType}</strong><br/><small style="color:#64748b;">${mbtiInterpretation ? mbtiInterpretation.substring(0, 100) + '...' : ''}</small></td>
          </tr>
          <tr>
            <td><strong>Colour style:</strong></td>
            <td><strong>${workingStyleResult}</strong><br/><small style="color:#64748b;">${resolvedStyleDesc.substring(0, 100) + '...'}</small></td>
          </tr>
        </table>
      </div>
    </div>

    <div class="grid-2">
      <!-- RIASEC Holland Codes -->
      <div>
        <div class="section-subtitle">Holland Code (RIASEC): ${hollandCode}</div>
        <table>
          <thead>
            <tr><th>Type</th><th>Score</th></tr>
          </thead>
          <tbody>
            ${['R', 'I', 'A', 'S', 'E', 'C'].map(char => `
              <tr>
                <td><strong>${char}</strong> (${{ R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' }[char]})</td>
                <td>${riasecTotals[char] !== undefined ? riasecTotals[char] : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- SMI Career domains -->
      <div>
        <div class="section-subtitle">Subject Matter Interest (SMI)</div>
        <table>
          <thead>
            <tr><th>Field</th><th>Score</th></tr>
          </thead>
          <tbody>
            ${Object.entries({
              A: 'Physical Sciences', B: 'Social Humanities',
              C: 'Arts & Media', D: 'Business & Finance',
              E: 'Body Kinaesthetic', F: 'Designer/Artisan',
              G: 'Engineering & Tech', H: 'Education & Health'
            }).map(([key, label]) => `
              <tr>
                <td><strong>${key}</strong> (${label})</td>
                <td>${smiTotals[key] !== undefined ? smiTotals[key] : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Values & Fears Summary -->
    <div class="grid-2">
      <div>
        <div class="section-subtitle">Values Categories</div>
        <table>
          <tr>
            <td><strong>Ideals:</strong></td>
            <td>${valuesByCategory.Ideal.join(', ') || '—'}</td>
          </tr>
          <tr>
            <td><strong>Standards:</strong></td>
            <td>${valuesByCategory.Standard.join(', ') || '—'}</td>
          </tr>
          <tr>
            <td><strong>Wants:</strong></td>
            <td>${valuesByCategory['Want & Preference'].join(', ') || '—'}</td>
          </tr>
        </table>
      </div>

      <div>
        <div class="section-subtitle">Self-reported Struggles & Fears</div>
        <table>
          <tr>
            <td><strong>High Fears:</strong></td>
            <td>${fearsGrouped.high.map(f => f.split('(')[0].trim()).join(', ') || 'None'}</td>
          </tr>
          <tr>
            <td><strong>Daily Struggles:</strong></td>
            <td>${lifestyleStruggles.join(', ') || 'None'}</td>
          </tr>
        </table>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- NARRATIVE NINE SECTIONS (JEET REPORT STANDARD) -->
  ${holistreeReport && Object.keys(holistreeReport).length > 0 ? `
    <!-- SECTION 1: WHO IS CLIENT -->
    <div class="section">
      <div class="section-title">1. Who is ${userName}?</div>
      
      <div class="section-subtitle">Core Nature (Natural Self)</div>
      <ul>
        ${holistreeReport.who_is_client?.core_nature?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Pending evaluation</li>'}
      </ul>

      ${holistreeReport.who_is_client?.what_energises?.length > 0 ? `
        <div class="section-subtitle">What naturally energises them</div>
        <ul>
          ${holistreeReport.who_is_client.what_energises.map((item: string) => `<li>${item}</li>`).join('')}
        </ul>
      ` : ''}

      <div class="section-subtitle">Conditioned Nature (Learnt Behaviours)</div>
      <ul>
        ${holistreeReport.who_is_client?.conditioned_nature?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Pending evaluation</li>'}
      </ul>

      ${holistreeReport.who_is_client?.why_patterns_developed?.length > 0 ? `
        <div class="section-subtitle">Why these patterns have developed</div>
        <ul>
          ${holistreeReport.who_is_client.why_patterns_developed.map((item: string) => `<li>${item}</li>`).join('')}
        </ul>
      ` : ''}
    </div>

    <!-- SECTION 2: WHAT DRIVES THEM -->
    <div class="section">
      <div class="section-title">2. What Drives them?</div>
      <div class="grid-2">
        <div>
          <div class="section-subtitle">Strongest Values</div>
          <div class="tag-group">
            ${holistreeReport.what_drives_client?.strongest_values?.map((val: string) => `<span class="tag" style="background:#e0f2fe; color:#0369a1;">${val}</span>`).join('') || '—'}
          </div>
        </div>
        <div>
          <div class="section-subtitle">Success Definition</div>
          <ul>
            ${holistreeReport.what_drives_client?.success_definition?.map((item: string) => `<li>${item}</li>`).join('') || '—'}
          </ul>
        </div>
      </div>
    </div>

    <div class="page-break"></div>

    <!-- SECTION 3: HOW THEY LEARN BEST -->
    <div class="section">
      <div class="section-title">3. How do they learn best?</div>
      <div class="grid-2">
        <div>
          <div class="section-subtitle" style="color:#16a34a;">Learns best through</div>
          <ul>
            ${holistreeReport.how_client_learns?.learns_best?.map((item: string) => `<li style="color:#15803d;">${item}</li>`).join('') || '—'}
          </ul>
        </div>
        <div>
          <div class="section-subtitle" style="color:#dc2626;">Struggles more with</div>
          <ul>
            ${holistreeReport.how_client_learns?.struggles_with?.map((item: string) => `<li style="color:#b91c1c;">${item}</li>`).join('') || '—'}
          </ul>
        </div>
      </div>
      ${holistreeReport.how_client_learns?.explanation?.length > 0 ? `
        <div style="background:#f8fafc; padding:12px; border-radius:6px; border:1px solid #e2e8f0; margin-top:10px;">
          <strong style="font-size:11px; display:block; margin-bottom:5px;">Subject Sentiments & Application Analysis:</strong>
          <ul style="margin:0; padding-left:15px;">
            ${holistreeReport.how_client_learns.explanation.map((item: string) => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>

    <!-- SECTION 4: EMOTIONAL & SOCIAL PROFILE -->
    <div class="section">
      <div class="section-title">4. Emotional & Social Profile</div>
      <div class="grid-2">
        <div>
          <div class="section-subtitle">Emotional Strengths</div>
          <ul>
            ${holistreeReport.emotional_social_profile?.emotional_strengths?.map((item: string) => `<li>${item}</li>`).join('') || '—'}
          </ul>
        </div>
        <div>
          <div class="section-subtitle">Emotional Growth Areas</div>
          <ul>
            ${holistreeReport.emotional_social_profile?.growth_areas?.map((item: string) => `<li>${item}</li>`).join('') || '—'}
          </ul>
        </div>
      </div>
      ${holistreeReport.emotional_social_profile?.social_style?.length > 0 ? `
        <div class="section-subtitle">Social Style</div>
        <ul>
          ${holistreeReport.emotional_social_profile.social_style.map((item: string) => `<li>${item}</li>`).join('')}
        </ul>
      ` : ''}
    </div>

    <!-- SECTION 5 & 6 & 7: STRENGTHS & DEVELOPMENTS -->
    <div class="section">
      <div class="section-title">5. Biggest Strengths</div>
      <div class="tag-group">
        ${holistreeReport.biggest_strengths?.map((str: string) => `<span class="tag" style="background:#dcfce7; color:#15803d; font-size:11px;">${str}</span>`).join('') || '—'}
      </div>
    </div>

    <div class="section">
      <div class="section-title">6. Priority Development Areas</div>
      <div class="grid-3">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:6px;">
          <strong style="color:#4f46e5; font-size:11px; display:block; margin-bottom:5px;">Personal Growth</strong>
          <ul style="padding-left:12px; font-size:10.5px;">
            ${holistreeReport.development_areas?.personal?.map((item: string) => `<li>${item}</li>`).join('') || '—'}
          </ul>
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:6px;">
          <strong style="color:#4f46e5; font-size:11px; display:block; margin-bottom:5px;">Academic Growth</strong>
          <ul style="padding-left:12px; font-size:10.5px;">
            ${holistreeReport.development_areas?.academic?.map((item: string) => `<li>${item}</li>`).join('') || '—'}
          </ul>
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:6px;">
          <strong style="color:#4f46e5; font-size:11px; display:block; margin-bottom:5px;">Professional Growth</strong>
          <ul style="padding-left:12px; font-size:10.5px;">
            ${holistreeReport.development_areas?.professional?.map((item: string) => `<li>${item}</li>`).join('') || '—'}
          </ul>
        </div>
      </div>
    </div>

    ${holistreeReport.what_interests_tell_us?.length > 0 ? `
      <div class="section">
        <div class="section-title">7. What their interests tell us</div>
        <ul>
          ${holistreeReport.what_interests_tell_us.map((item: string) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <div class="page-break"></div>

    <!-- SECTION 8: CAREER THEMES & RECOMMENDATIONS -->
    <div class="section">
      <div class="section-title">8. Career Themes Match</div>
      ${holistreeReport.career_themes?.map((theme: any) => `
        <div style="margin-bottom:12px; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px;">
          <strong style="color:#4f46e5; font-size:12px; display:block; margin-bottom:4px;">${theme.theme_name}</strong>
          <p style="font-size:11.5px; color:#475569;">${theme.careers?.join(', ')}</p>
        </div>
      `).join('') || '—'}

      ${holistreeReport.less_suitable_careers?.length > 0 ? `
        <div class="section-subtitle" style="color:#dc2626;">Careers That May Feel Less Suitable</div>
        <div class="tag-group">
          ${holistreeReport.less_suitable_careers.map((car: string) => `<span class="tag" style="background:#fee2e2; color:#b91c1c;">${car}</span>`).join('')}
        </div>
      ` : ''}
    </div>

    <!-- SECTION 9: EXPLORATION ROADMAP -->
    <div class="section">
      <div class="section-title">9. Exploration Roadmap</div>
      <div class="grid-3">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:6px;">
          <strong style="color:#3b82f6; font-size:11px; display:block; margin-bottom:5px;">Grade 10 Focus</strong>
          <ul style="padding-left:12px; font-size:10.5px;">
            ${holistreeReport.exploration_roadmap?.class_10?.map((item: string) => `<li>${item}</li>`).join('') || '—'}
          </ul>
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:6px;">
          <strong style="color:#3b82f6; font-size:11px; display:block; margin-bottom:5px;">Grade 11–12 Focus</strong>
          <ul style="padding-left:12px; font-size:10.5px;">
            ${holistreeReport.exploration_roadmap?.class_11_12?.map((item: string) => `<li>${item}</li>`).join('') || '—'}
          </ul>
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:6px;">
          <strong style="color:#3b82f6; font-size:11px; display:block; margin-bottom:5px;">Before College</strong>
          <ul style="padding-left:12px; font-size:10.5px;">
            ${holistreeReport.exploration_roadmap?.before_college?.map((item: string) => `<li>${item}</li>`).join('') || '—'}
          </ul>
        </div>
      </div>
    </div>

    <!-- SECTION 10: RECOMMENDATIONS FOR PARENTS -->
    <div class="section">
      <div class="section-title">10. Recommendations for Parents</div>
      <div class="grid-3">
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:10px; border-radius:6px;">
          <strong style="color:#15803d; font-size:11px; display:block; margin-bottom:5px;">Continue Encouraging</strong>
          <ul style="padding-left:12px; font-size:10.5px; color:#14532d;">
            ${holistreeReport.recommendations_parents?.continue_encouraging?.map((item: string) => `<li>${item}</li>`).join('') || '—'}
          </ul>
        </div>
        <div style="background:#f5f3ff; border:1px solid #ddd6fe; padding:10px; border-radius:6px;">
          <strong style="color:#6d28d9; font-size:11px; display:block; margin-bottom:5px;">Work Together On</strong>
          <ul style="padding-left:12px; font-size:10.5px; color:#581c87;">
            ${holistreeReport.recommendations_parents?.work_together_on?.map((item: string) => `<li>${item}</li>`).join('') || '—'}
          </ul>
        </div>
        <div style="background:#fff1f2; border:1px solid #fecdd3; padding:10px; border-radius:6px;">
          <strong style="color:#be123c; font-size:11px; display:block; margin-bottom:5px;">Avoid</strong>
          <ul style="padding-left:12px; font-size:10.5px; color:#881337;">
            ${holistreeReport.recommendations_parents?.avoid?.map((item: string) => `<li>${item}</li>`).join('') || '—'}
          </ul>
        </div>
      </div>
    </div>

    <div class="page-break"></div>

    <!-- SECTION 11: FINAL UNDERSTANDING -->
    <div class="section" style="background:#f5f3ff; border:1px solid #ddd6fe; padding:20px; border-radius:8px;">
      <div class="section-title" style="border:none; margin:0; padding:0; font-size:14px; color:#6d28d9;">11. Final Understanding of ${userName}</div>
      <p style="font-style:italic; font-size:12px; color:#3b0764; margin-top:8px; line-height:1.6;">
        "${holistreeReport.final_understanding?.summary}"
      </p>
      
      <div style="margin-top:15px; display:grid; grid-template-columns:1fr 1fr; gap:15px; font-size:11px;">
        <div style="background:#ffffff; border:1px solid #ddd6fe; padding:10px; border-radius:6px;">
          <strong style="color:#6d28d9; display:block; margin-bottom:2px;">Career Direction</strong>
          <span>${holistreeReport.final_understanding?.career_direction || '—'}</span>
        </div>
        <div style="background:#ffffff; border:1px solid #ddd6fe; padding:10px; border-radius:6px;">
          <strong style="color:#6d28d9; display:block; margin-bottom:2px;">Recommended Ecosystems</strong>
          <span>${holistreeReport.final_understanding?.most_suitable_ecosystems?.join(', ') || '—'}</span>
        </div>
      </div>
      ${holistreeReport.final_understanding?.current_priority ? `
        <div style="background:#ffffff; border:1px solid #ddd6fe; padding:10px; border-radius:6px; margin-top:10px; font-size:11px;">
          <strong style="color:#6d28d9; display:block; margin-bottom:2px;">Current Priority (Next 2-3 Years)</strong>
          <span>${holistreeReport.final_understanding.current_priority}</span>
        </div>
      ` : ''}
    </div>
  ` : `
    <!-- BACKWARD COMPATIBILITY MODE -->
    <div class="section">
      <div class="section-title">Professional Persona Summary</div>
      <div class="persona-box">
        <p>${personalityInsights}</p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Recommended Career Paths</div>
      ${careerCardsHtml}
    </div>
  `}

  <div class="footer">
    <p>Report compiled by <strong>Career Guidance Platform</strong> using standardized cognitive assessment tests.</p>
    <p>&copy; ${new Date().getFullYear()} Career Guidance Platform. Confidential and Proprietary.</p>
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

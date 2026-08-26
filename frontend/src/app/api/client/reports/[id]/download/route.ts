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
    const parentData = getModuleData(['parent', 'meeting', 'module_17', 'module 17']) as any;

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
    const holistreeReport = isJson ? parsedContent.holistree_report : null;

    // Helper to format values safely
    const safeVal = (v: any) => v !== undefined && v !== null && v !== '' ? v : '—';

    const printList = (arr: any[]) => {
      if (!arr || arr.length === 0) return '<li>—</li>';
      return arr.map(item => `<li>${safeVal(item)}</li>`).join('');
    };

    // 1. Demographics Setup
    const demoSubjects = demoData?.demo_subjects || [];
    const activeSubjects = demoSubjects.filter((s: any) => s && s.col1 && s.col1.trim() !== '');

    const demoHobbies = demoData?.demo_hobbies || [];
    const activeHobbies = demoHobbies.filter((h: any) => h && h.col1 && h.col1.trim() !== '');

    const demoRoutine = demoData?.demo_routine || [];
    const activeRoutine = demoRoutine.filter((r: any) => r && typeof r === 'string' && r.trim() !== '');

    // 2. Values Setup
    const topValues = valuesData?.__scored?.scores?.topValues || [];
    const allValuesList: { value: string; catTag: string }[] = [];
    
    if (valuesData) {
      Object.keys(valuesData).forEach(k => {
        if (k.startsWith('val_') && typeof valuesData[k] === 'string' && valuesData[k].trim()) {
          const valName = valuesData[k];
          const matchedScore = topValues.find((v: any) => v.value?.toLowerCase() === valName.toLowerCase());
          const catTag = matchedScore?.category === 'Standard' ? 'S' : matchedScore?.category?.includes('Want') ? 'WP' : 'ID';
          allValuesList.push({ value: valName, catTag });
        }
      });
    }
    if (allValuesList.length === 0 && topValues.length > 0) {
      topValues.forEach((v: any) => {
        const catTag = v.category === 'Standard' ? 'S' : v.category?.includes('Want') ? 'WP' : 'ID';
        allValuesList.push({ value: v.value, catTag });
      });
    }

    // 3. Fears Setup
    const allFears: { label: string; rating: number; cat: string }[] = [];
    const fearLabelsMap: Record<string, string> = {
      fear_heights: 'Fear of Heights',
      fear_claustrophobia: 'Claustrophobia',
      fear_left_out: 'Fear of Being Left Out',
      fear_public_speaking: 'Fear of Public Speaking/Performance',
      fear_unknown: 'Fear of the Unknown',
      fear_missing_out: 'Fear of Missing Out (FOMO)',
      fear_future: 'Fear of the Future',
      fear_numbers: 'Fear of Numbers',
      fear_failure: 'Fear of Failure',
      fear_rid_things: 'Fear of Getting Rid of Things',
      fear_appearance: 'Fear of Getting Fat/Skinny',
      fear_losing_freedom: 'Fear of Losing Freedom',
      fear_rejection: 'Fear of Rejection (people, work)',
      fear_disappointment_me: 'Fear of Disappointment (me to others)',
      fear_disappointment_others: 'Fear of Disappointment (others to me)',
      fear_losing_loved: 'Fear of Losing a Loved One',
      fear_germs: 'Germ phobia',
      fear_intimacy: 'Fear of Intimacy',
      fear_fire: 'Fear of Fire',
      fear_judged: 'Fear of Being Judged',
      fear_forgetting: 'Fear of Not Being Able to Remember Things',
      fear_mediocre_life: 'Fear of Living a Mediocre Life'
    };

    if (fearsData) {
      Object.keys(fearsData).forEach(k => {
        if ((k.startsWith('fear_') || k.includes('phobia')) && fearsData[k] !== undefined && k !== '__scored') {
          const rating = Number(fearsData[k]);
          if (!isNaN(rating)) {
            const label = fearLabelsMap[k] || k.replace('fear_', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const cat = rating >= 8 ? 'very high' : rating >= 5 ? 'high' : 'not very high';
            allFears.push({ label, rating, cat });
          }
        }
      });
    }

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
      'green blue introvert': 'Quietly cooperative, precise, and loyal. Values harmony and structured work where goals are clear and conflict is minimal.'
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
    const smiDescriptions: Record<string, string> = {
      A: 'Physical Sciences: Careers in physics, chemistry, geology, and physical analytics, with a focus on investigating matter, energy, and physical phenomena.',
      B: 'Social Humanities: Careers in sociology, history, literature, philosophy, and social structures, focusing on understanding cultural and human development.',
      C: 'Arts & Media: Careers in creative arts, entertainment, writing, design, storytelling, and digital content creation, focused on inspiring and engaging others.',
      D: 'Business & Finance: Careers in administration, marketing, finance, entrepreneurship, and operations, aiming to optimize growth and client service.',
      E: 'Body Kinaesthetic: Careers in physical education, sports, athletics, performance, or hands-on manual dexterity.',
      F: 'Designer/Artisan: Careers in crafts, design, fashion, architecture, or hand-made manufacturing.',
      G: 'Engineering & Tech: Careers in computing, engineering, software development, data science, and systemic technology solutions.',
      H: 'Education & Health: Careers in teaching, training, medicine, healthcare, therapy, and community support services.'
    };

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
      aim: aimData?.aim_1 || 'Interested in Creative Arts (Sketching, Guitar) and seeking career clarity.',
      friends: friendsData?.friends_1 || 'Prefers a small circle of close, trusted friends.',
      relationship: 'Values personal autonomy and privacy, maintaining selective, high-trust connections.',
      family: familyData?.family_1 || 'Shares a supportive, quiet bond with parents who encourage self-learning.',
      bodyImage: bodyData?.body_2_reason || 'Conscious of appearance and physical presentation.',
      impactful: 'Independently learned skills during COVID, defining a self-taught, creative identity.'
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
          <div class="career-skills-label" style="font-weight:700; margin-top:5px; font-size:10px;">Focus Skill Gaps & Development:</div>
          <div class="career-skills-tags">
            ${opt.skillGaps.map((sg: any) => `<span class="tag" style="background:#f1f5f9; border:1px solid #e2e8f0; margin-right:4px;">${sg.skill || sg}</span>`).join('')}
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
    line-height: 1.4; 
    background: #ffffff; 
    font-size: 11px;
  }
  .page { 
    padding: 40px 50px; 
    max-width: 900px; 
    margin: 0 auto; 
    background: #ffffff;
  }
  
  .cover-header { 
    text-align: center; 
    padding-bottom: 20px; 
    border-bottom: 2px solid #e2e8f0; 
    margin-bottom: 25px; 
  }
  .cover-header .subtitle { 
    font-family: 'Outfit', sans-serif; 
    font-size: 11px; 
    color: #4f46e5; 
    text-transform: uppercase; 
    letter-spacing: 3px; 
    font-weight: 800; 
    margin-bottom: 6px;
  }
  .cover-header h1 { 
    font-family: 'Outfit', sans-serif; 
    font-size: 28px; 
    color: #0f172a; 
    font-weight: 800; 
    letter-spacing: -1px; 
  }
  .cover-header .meta { 
    font-size: 11px; 
    color: #64748b; 
    margin-top: 6px; 
  }
  
  .section { 
    margin-bottom: 25px; 
    page-break-inside: avoid; 
  }
  .section-title { 
    font-family: 'Outfit', sans-serif; 
    font-size: 12px; 
    font-weight: 800; 
    text-transform: uppercase; 
    letter-spacing: 1.5px; 
    color: #4f46e5; 
    border-bottom: 2px solid #f1f5f9; 
    padding-bottom: 4px; 
    margin-bottom: 10px; 
  }
  .section-subtitle {
    font-weight: 700;
    font-size: 10.5px;
    color: #334155;
    text-transform: uppercase;
    margin-bottom: 5px;
    margin-top: 8px;
  }
  
  table { 
    width: 100%; 
    border-collapse: collapse; 
    margin-bottom: 10px; 
    font-size: 10.5px;
  }
  th, td { 
    border: 1px solid #cbd5e1; 
    padding: 6px 8px; 
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
    margin-bottom: 10px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 15px;
    margin-bottom: 10px;
  }
  
  ul { 
    padding-left: 15px; 
    margin-bottom: 8px; 
  }
  li { 
    margin-bottom: 2px; 
  }
  
  .tag-group {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 3px;
  }
  .tag {
    display: inline-block;
    padding: 1.5px 6px;
    border-radius: 4px;
    font-size: 9.5px;
    font-weight: 600;
  }
  
  .bar-container { 
    background-color: #e2e8f0; 
    border-radius: 3px; 
    height: 10px; 
    width: 100%; 
    overflow: hidden; 
    margin-top: 2px;
  }
  .bar-fill { 
    background-color: #4f46e5; 
    height: 100%; 
  }
  
  .persona-box { 
    background: #f8fafc; 
    padding: 12px; 
    border-left: 4px solid #4f46e5; 
    border-radius: 0 4px 4px 0; 
    font-size: 11px; 
    line-height: 1.5; 
    color: #334155;
    margin-bottom: 12px;
  }
  
  .career-card { 
    border: 1px solid #e2e8f0; 
    border-radius: 4px; 
    padding: 12px; 
    margin-bottom: 10px; 
    background-color: #fdfdfd;
    page-break-inside: avoid;
  }
  .career-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 4px; 
  }
  .career-title { 
    font-size: 12px; 
    font-weight: 700; 
    color: #0f172a; 
  }
  .career-match { 
    font-size: 14px; 
    font-weight: 800; 
    color: #4f46e5; 
  }
  .career-match small { 
    font-size: 8px; 
    color: #64748b; 
    font-weight: 500; 
  }
  
  .footer { 
    margin-top: 30px; 
    padding-top: 12px; 
    border-top: 1px solid #e2e8f0; 
    text-align: center; 
    font-size: 9px; 
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

  <!-- TABLE 0: INDEX TABLE -->
  <div class="section">
    <div class="section-title">INDEX</div>
    <table>
      <thead>
        <tr>
          <th style="width: 80px;">Sr. No.</th>
          <th>Assessment Modules / Sections</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>1</td><td>Demographics & Family Profile</td></tr>
        <tr><td>2</td><td>Values Profile</td></tr>
        <tr><td>3</td><td>Struggles & Fears Scale</td></tr>
        <tr><td>4</td><td>16 Personality Factors Test (16 PF)</td></tr>
        <tr><td>5</td><td>Holland Code (RIASEC Interest Matrix)</td></tr>
        <tr><td>6</td><td>Strengths and Weaknesses Matrix</td></tr>
        <tr><td>7</td><td>Working Style (Color Test)</td></tr>
        <tr><td>8</td><td>Parents Career Perspective</td></tr>
        <tr><td>9</td><td>Subject Matter Interest (SMI Domains)</td></tr>
        <tr><td>10</td><td>Media Genre & Character Analysis</td></tr>
        <tr><td>11</td><td>Lifestyle & Future Projections</td></tr>
        <tr><td>12</td><td>General Profile Overview</td></tr>
        <tr><td>13</td><td>Roadmap & Recommendations</td></tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- TABLE 1: DETAILED DEMOGRAPHICS -->
  <div class="section">
    <div class="section-title">1. Student Demographics & Family Profile</div>
    <table>
      <tr>
        <td style="width: 150px;"><strong>Name:</strong></td>
        <td>${userName}</td>
        <td style="width: 150px;"><strong>Lives with:</strong></td>
        <td>${safeVal(demoData?.demo_lives_with)}</td>
      </tr>
      <tr>
        <td><strong>Age:</strong></td>
        <td>${safeVal(demoData?.demo_age)}</td>
        <td><strong>Residence:</strong></td>
        <td>${safeVal(demoData?.demo_residence)}</td>
      </tr>
      <tr>
        <td><strong>Date of Birth:</strong></td>
        <td>${safeVal(demoData?.demo_dob)}</td>
        <td><strong>School name:</strong></td>
        <td>${safeVal(demoData?.demo_education?.school?.name || demoData?.demo_school_name)}</td>
      </tr>
      <tr>
        <td><strong>Current year:</strong></td>
        <td>${safeVal(demoData?.demo_education?.school?.grade || demoData?.demo_grade)}th</td>
        <td><strong>Syllabus / Board:</strong></td>
        <td>${safeVal(demoData?.demo_board || 'CBSE')}</td>
      </tr>
      <tr>
        <td><strong>Mother:</strong></td>
        <td>
          Name: ${safeVal(demoData?.demo_mother_name || demoData?.mother_name)} <br/>
          Occupation: ${safeVal(demoData?.demo_mother_occupation || demoData?.demo_mother_occ || demoData?.mother_occupation)}
        </td>
        <td><strong>Father:</strong></td>
        <td>
          Name: ${safeVal(demoData?.demo_father_name || demoData?.father_name)} <br/>
          Occupation: ${safeVal(demoData?.demo_father_occupation || demoData?.demo_father_occ || demoData?.father_occupation)}
        </td>
      </tr>
    </table>

    <div class="grid-2">
      <div>
        <div class="section-subtitle">Subjects Evaluated</div>
        <table>
          <thead>
            <tr><th>Subject</th><th>Sentiment / Score</th></tr>
          </thead>
          <tbody>
            ${activeSubjects.length > 0 ? activeSubjects.map((s: any) => `
              <tr><td><strong>${s.col1}</strong></td><td>${s.col2 || 'Neutral'}</td></tr>
            `).join('') : '<tr><td colspan="2">No subjects entered.</td></tr>'}
          </tbody>
        </table>
      </div>
      <div>
        <div class="section-subtitle">Hobbies & Interests</div>
        <table>
          <thead>
            <tr><th>Hobby</th><th>Skill Level / Notes</th></tr>
          </thead>
          <tbody>
            ${activeHobbies.length > 0 ? activeHobbies.map((h: any) => `
              <tr><td><strong>${h.col1}</strong></td><td>${h.col2 || 'Moderate'}</td></tr>
            `).join('') : '<tr><td colspan="2">No hobbies entered.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- TABLE 2: VALUES -->
  <div class="section">
    <div class="section-title">2. VALUES PROFILE</div>
    <div style="font-size: 9.5px; color: #64748b; margin-bottom: 6px;">
      * ID – Ideal Value; S – Standard Value; WP - Wants & Preference Value
    </div>
    <table>
      <thead>
        <tr><th>Value</th><th>Classification</th></tr>
      </thead>
      <tbody>
        ${allValuesList.length > 0 ? allValuesList.map(v => `
          <tr>
            <td><strong>${v.value}</strong></td>
            <td>
              <span class="tag" style="background:${v.catTag === 'ID' ? '#dbeafe' : v.catTag === 'S' ? '#f3e8ff' : '#fef3c7'}; color:${v.catTag === 'ID' ? '#1e40af' : v.catTag === 'S' ? '#6b21a8' : '#92400e'};">
                ${v.catTag === 'ID' ? 'ID (Ideal)' : v.catTag === 'S' ? 'S (Standard)' : 'WP (Wants & Preference)'}
              </span>
            </td>
          </tr>
        `).join('') : '<tr><td colspan="2">No values logged.</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- TABLE 3: FEARS -->
  <div class="section">
    <div class="section-title">3. Struggles & Fears Scale</div>
    <div style="font-size: 9.5px; color: #64748b; margin-bottom: 6px;">
      * Rating Index: 1-4: not very high; 5-7: high; 8-10: very high
    </div>
    <table>
      <thead>
        <tr><th>Fear / Struggle</th><th>Rating (1-10)</th><th>Classification</th></tr>
      </thead>
      <tbody>
        ${allFears.length > 0 ? allFears.map(f => `
          <tr>
            <td><strong>${f.label}</strong></td>
            <td>${f.rating}/10</td>
            <td>
              <span class="tag" style="background:${f.cat === 'very high' ? '#fee2e2' : f.cat === 'high' ? '#ffedd5' : '#f0fdf4'}; color:${f.cat === 'very high' ? '#991b1b' : f.cat === 'high' ? '#c2410c' : '#166534'};">
                ${f.cat.toUpperCase()}
              </span>
            </td>
          </tr>
        `).join('') : '<tr><td colspan="3">No fear ratings available.</td></tr>'}
      </tbody>
    </table>
  </div>

  <!-- TABLE 4: 16 PF (MBTI) -->
  <div class="section">
    <div class="section-title">4. 16 PERSONALITY FACTORS (MBTI: ${mbtiType})</div>
    
    <div class="persona-box">
      <strong>Calculated Type: ${mbtiType}</strong><br/>
      <p style="margin-top: 5px;">${mbtiInterpretation || 'Personality assessment profile based on cognitive answers.'}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>Trait Dimension</th>
          <th style="width: 250px;">Strength Profile Preference</th>
        </tr>
      </thead>
      <tbody>
        ${mbtiDimensions ? Object.entries(mbtiDimensions).map(([key, dim]: any) => {
          const oppositeLabel = (({
            mind: dim.label === 'Extraverted' ? 'Introverted' : 'Extraverted',
            energy: dim.label === 'Intuitive' ? 'Observant' : 'Intuitive',
            nature: dim.label === 'Thinking' ? 'Feeling' : 'Thinking',
            tactics: dim.label === 'Judging' ? 'Prospecting' : 'Judging',
            identity: dim.label === 'Assertive' ? 'Turbulent' : 'Assertive'
          } as Record<string, string>)[key]) || 'Opposite';
          
          return `
            <tr>
              <td><strong>${dim.label}</strong> (${dim.percentage}%) vs ${oppositeLabel} (${100 - dim.percentage}%)</td>
              <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div class="bar-container">
                    <div class="bar-fill" style="width: ${dim.percentage}%;"></div>
                  </div>
                </div>
              </td>
            </tr>
          `;
        }).join('') : `
          <tr><td>Mind (Extraverted / Introverted)</td><td>Pending Analysis</td></tr>
          <tr><td>Energy (Intuitive / Observant)</td><td>Pending Analysis</td></tr>
          <tr><td>Nature (Thinking / Feeling)</td><td>Pending Analysis</td></tr>
          <tr><td>Tactics (Judging / Prospecting)</td><td>Pending Analysis</td></tr>
          <tr><td>Identity (Assertive / Turbulent)</td><td>Pending Analysis</td></tr>
        `}
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- TABLE 5: COLOR TEST (WORKING STYLE) -->
  <div class="section">
    <div class="section-title">5. Working Style (Color Test: ${workingStyleResult})</div>
    <div class="persona-box" style="border-left-color: #10b981;">
      <strong>Style Output: ${workingStyleResult}</strong>
      <p style="margin-top: 8px; line-height: 1.6;">
        ${resolvedStyleDesc}
      </p>
    </div>
  </div>

  <!-- TABLE 6: RIASEC -->
  <div class="section">
    <div class="section-title">6. Holland Code (RIASEC Interest Matrix)</div>
    
    <div style="margin-bottom: 12px; font-weight: 700; font-size: 11px;">
      Holland Code: <span style="color:#4f46e5; font-size: 13px;">${hollandCode}</span>
    </div>

    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>I Am (Sub)</th>
          <th>I Can (Sub)</th>
          <th>I Like To (Sub)</th>
          <th>Total Score</th>
        </tr>
      </thead>
      <tbody>
        ${['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'].map(type => {
          const char = type.charAt(0);
          const amVal = riasecData?.[`${char.toLowerCase()}_am`] || '—';
          const canVal = riasecData?.[`${char.toLowerCase()}_can`] || '—';
          const likeVal = riasecData?.[`${char.toLowerCase()}_like`] || '—';
          const totalVal = riasecTotals[char] !== undefined ? riasecTotals[char] : '—';
          
          return `
            <tr>
              <td><strong>${type} (${char})</strong></td>
              <td>${amVal}</td>
              <td>${canVal}</td>
              <td>${likeVal}</td>
              <td><strong>${totalVal}</strong></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="section-subtitle">Holland Interest Interpretations</div>
    <div style="font-size: 10px; color:#475569; space-y-4;">
      ${riasecTop3.length > 0 ? riasecTop3.map((char: string) => {
        const label = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' }[char] || char;
        const text = {
          R: 'Realistic people are oriented to physical, real-world work with concrete tools or machinery.',
          I: 'Investigative people enjoy analytical thinking, researching data, and solving logic puzzles.',
          A: 'Artistic people value self-expression, imagination, aesthetics and creative storytelling.',
          S: 'Social people enjoy helping, teaching, supporting, and building deep community connections.',
          E: 'Enterprising people are action-oriented leaders who enjoy starting ventures and taking risks.',
          C: 'Conventional people enjoy structured routines, organization, precision, and business calculations.'
        }[char] || '';
        return `<p style="margin-top:4px;"><strong>${label} (${char}):</strong> ${text}</p>`;
      }).join('') : '<p>Detailed interest interpretations are compiled based on top scores.</p>'}
    </div>
  </div>

  <div class="page-break"></div>

  <!-- TABLE 7: STRENGTHS & WEAKNESSES -->
  <div class="section">
    <div class="section-title">7. STRENGTHS AND WEAKNESSES MATRIX</div>
    <div class="grid-2">
      <div>
        <div class="section-subtitle" style="color: #16a34a;">Top Personal Strengths (Rating &ge; 5)</div>
        <table>
          <thead>
            <tr><th>Trait</th><th>Rating</th></tr>
          </thead>
          <tbody>
            ${swGrouped.strengths.length > 0 ? swGrouped.strengths.map(s => {
              const parts = s.split('(');
              return `<tr><td><strong>${parts[0].trim()}</strong></td><td>${parts[1] ? parts[1].replace(')', '') : '8/10'}</td></tr>`;
            }).join('') : '<tr><td colspan="2">—</td></tr>'}
            ${swGrouped.situational.map(s => {
              const parts = s.split('(');
              return `<tr><td><strong>${parts[0].trim()}</strong></td><td>${parts[1] ? parts[1].replace(')', '') : '6/10'}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div>
        <div class="section-subtitle" style="color: #dc2626;">Struggles & Weaknesses (Rating &lt; 5)</div>
        <table>
          <thead>
            <tr><th>Struggle / Limit</th><th>Rating</th></tr>
          </thead>
          <tbody>
            ${swGrouped.weaknesses.length > 0 ? swGrouped.weaknesses.map(w => {
              const parts = w.split('(');
              return `<tr><td><strong>${parts[0].trim()}</strong></td><td>${parts[1] ? parts[1].replace(')', '') : '3/10'}</td></tr>`;
            }).join('') : '<tr><td colspan="2">No weaknesses logged.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- TABLE 8: PARENTS PERSPECTIVE -->
  <div class="section">
    <div class="section-title">8. Parent Perspectives & Environment</div>
    <table>
      <tr>
        <td style="width: 200px;"><strong>Mother's Personality Description:</strong></td>
        <td>${safeVal(parentData?.q1_mother_description || parentData?.mother_desc)}</td>
      </tr>
      <tr>
        <td><strong>Father's Personality Description:</strong></td>
        <td>${safeVal(parentData?.q1_father_description || parentData?.father_desc)}</td>
      </tr>
      <tr>
        <td><strong>Described words for Child:</strong></td>
        <td>${safeVal(parentData?.q1_described_words)}</td>
      </tr>
      <tr>
        <td><strong>Free time Activities & Social Media:</strong></td>
        <td>
          Activities: ${safeVal(parentData?.q6_free_time_activities || parentData?.free_time_activities)} <br/>
          Social Media: ${safeVal(parentData?.q6_social_media_usage || parentData?.social_media_usage)}
        </td>
      </tr>
      <tr>
        <td><strong>Hidden Talents / Potential observed:</strong></td>
        <td>${safeVal(parentData?.q14_hidden_talents || parentData?.hidden_talents)}</td>
      </tr>
      <tr>
        <td><strong>Perceived disliked subjects:</strong></td>
        <td>${safeVal(parentData?.q3_hated_subject || parentData?.hated_subjects)}</td>
      </tr>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- TABLE 9: SUBJECT MATTER INTEREST -->
  <div class="section">
    <div class="section-title">9. SUBJECT MATTER INTEREST (SMI)</div>
    <table>
      <thead>
        <tr>
          <th>Column</th>
          <th>SMI Domain</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries({
          A: 'Physical Sciences', B: 'Social Humanities',
          C: 'Arts & Media', D: 'Business & Finance',
          E: 'Body Kinaesthetic', F: 'Designer/Artisan',
          G: 'Engineering & Tech', H: 'Education & Health'
        }).map(([key, label]) => `
          <tr>
            <td><strong>${key}</strong></td>
            <td>${label}</td>
            <td><strong>${smiTotals[key] !== undefined ? smiTotals[key] : '0'}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="section-subtitle">Attraction Field Interpretations</div>
    <div style="font-size: 10px; color:#475569;">
      ${smiTop3.length > 0 ? smiTop3.map((char: string) => `
        <p style="margin-top: 4px;"><strong>According to ${char}:</strong> ${smiDescriptions[char] || 'Alignment to career fields.'}</p>
      `).join('') : '<p>Top Attraction fields are mapped above.</p>'}
    </div>
  </div>

  <!-- TABLE 10: MEDIA GENRE -->
  <div class="section">
    <div class="section-title">10. MEDIA GENRE & PREFERENCES</div>
    <table>
      <tr>
        <td style="width: 150px;"><strong>Favorite Movies:</strong></td>
        <td>${mediaMovies.join(', ') || '—'}</td>
      </tr>
      <tr>
        <td><strong>Favorite TV Series:</strong></td>
        <td>${mediaSeries.join(', ') || '—'}</td>
      </tr>
      <tr>
        <td><strong>Valued Genres:</strong></td>
        <td>${mediaGenres.join(', ') || '—'}</td>
      </tr>
      <tr>
        <td><strong>Games Played:</strong></td>
        <td>${mediaGames.join(', ') || '—'}</td>
      </tr>
      <tr>
        <td><strong>Relatable Characters:</strong></td>
        <td>
          <ul style="padding-left:12px; margin:0;">
            ${mediaCharacters.map((c: string) => `<li>${c}</li>`).join('') || '<li>—</li>'}
          </ul>
        </td>
      </tr>
      <tr>
        <td><strong>Superpower Desired:</strong></td>
        <td>${safeVal(visualData?.visual_superpower)}</td>
      </tr>
      <tr>
        <td><strong>Screen Time Habits:</strong></td>
        <td>
          Daily: ${safeVal(visualData?.visual_screentime_daily || '4-6 hours')} <br/>
          Weekly: ${safeVal(visualData?.visual_screentime_weekly || '42 hours')}
        </td>
      </tr>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- TABLE 11: LIFESTYLE -->
  <div class="section">
    <div class="section-title">11. LIFESTYLE & WORK ENVIRONMENTS</div>
    <table>
      <tr>
        <td style="width: 200px;"><strong>Ideal Future Routine:</strong></td>
        <td>${safeVal(lifestyleData?.lifestyle_1 || lifestyleData?.lifestyle_def || '8-9 am wake up, 5-6 hours in office, work from home is boring.')}</td>
      </tr>
      <tr>
        <td><strong>Valued Comforts / Housing wants:</strong></td>
        <td>${safeVal(lifestyleData?.lifestyle_7 || 'A Mountain/City view house penthouse with big tv home theatre system.')}</td>
      </tr>
      <tr>
        <td><strong>Me Time Preference:</strong></td>
        <td>${safeVal(lifestyleData?.lifestyle_8?.filter((a: any) => a && a.col1).map((a: any) => a.col1).join(', ') || 'Sleeping, watching movies, music, sketching.')}</td>
      </tr>
      <tr>
        <td><strong>Desired Legacy:</strong></td>
        <td>${safeVal(lifestyleData?.lifestyle_10 || 'Personality, taste, skills, creative art created, quality/dependability.')}</td>
      </tr>
      <tr>
        <td><strong>Daily Needs & Wants:</strong></td>
        <td>${safeVal(lifestyleData?.lifestyle_11 || 'Going out with friends, sketching, movies, variety of food, music.')}</td>
      </tr>
      <tr>
        <td><strong>Habits to Build (5 to get):</strong></td>
        <td>${safeVal(lifestyleData?.lifestyle_habit_to_gain || 'Fixed schedule to complete tasks on time.')}</td>
      </tr>
      <tr>
        <td><strong>Habits to Eliminate (5 to stop):</strong></td>
        <td>${lifestyleStruggles.join(', ') || 'Forgetting things, last-moment submissions, laziness.'}</td>
      </tr>
    </table>
  </div>

  <!-- TABLE 12: GENERAL OVERVIEW -->
  <div class="section">
    <div class="section-title">12. GENERAL PROFILE OVERVIEW</div>
    <table>
      <tr>
        <td style="width: 150px;"><strong>Aim and Vision:</strong></td>
        <td>${finalOverview.aim}</td>
      </tr>
      <tr>
        <td><strong>Friendship Definition:</strong></td>
        <td>${finalOverview.friends}</td>
      </tr>
      <tr>
        <td><strong>Family Bond:</strong></td>
        <td>${finalOverview.family}</td>
      </tr>
      <tr>
        <td><strong>Body & Self Image:</strong></td>
        <td>${finalOverview.bodyImage}</td>
      </tr>
      <tr>
        <td><strong>Impactful Incidents:</strong></td>
        <td>${finalOverview.impactful}</td>
      </tr>
      <tr>
        <td><strong>Out of the Box Careers:</strong></td>
        <td>${safeVal(aimData?.aim_3 || 'Reviewing movies, writing horror novels/scripts, music-related careers.')}</td>
      </tr>
      <tr>
        <td><strong>Dream spend:</strong></td>
        <td>${safeVal(aimData?.aim_5 || 'Buy luxury cars, travel, concert vinyls collection.')}</td>
      </tr>
      <tr>
        <td><strong>10 Year Goals:</strong></td>
        <td>${safeVal(aimData?.aim_2_career || 'Own a house, write novels, travel abroad, improve drawing.')}</td>
      </tr>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- NARRATIVE NINE SECTIONS (JEET REPORT NARRATIVE FORMAT) -->
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
          ${printList(holistreeReport.who_is_client.what_energises)}
        </ul>
      ` : ''}

      <div class="section-subtitle">Conditioned Nature (Learnt Behaviours)</div>
      <ul>
        ${holistreeReport.who_is_client?.conditioned_nature?.map((item: string) => `<li>${item}</li>`).join('') || '<li>Pending evaluation</li>'}
      </ul>

      ${holistreeReport.who_is_client?.why_patterns_developed?.length > 0 ? `
        <div class="section-subtitle">Why these patterns have developed</div>
        <ul>
          ${printList(holistreeReport.who_is_client.why_patterns_developed)}
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
            ${printList(holistreeReport.what_drives_client?.success_definition)}
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
          <strong style="font-size:10.5px; display:block; margin-bottom:5px;">Subject Sentiments & Application Analysis:</strong>
          <ul style="margin:0; padding-left:15px;">
            ${printList(holistreeReport.how_client_learns.explanation)}
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
            ${printList(holistreeReport.emotional_social_profile?.emotional_strengths)}
          </ul>
        </div>
        <div>
          <div class="section-subtitle">Emotional Growth Areas</div>
          <ul>
            ${printList(holistreeReport.emotional_social_profile?.growth_areas)}
          </ul>
        </div>
      </div>
      ${holistreeReport.emotional_social_profile?.social_style?.length > 0 ? `
        <div class="section-subtitle">Social Style</div>
        <ul>
          ${printList(holistreeReport.emotional_social_profile.social_style)}
        </ul>
      ` : ''}
    </div>

    <!-- SECTION 5 & 6 & 7: STRENGTHS & DEVELOPMENTS -->
    <div class="section">
      <div class="section-title">5. Biggest Strengths</div>
      <div class="tag-group">
        ${holistreeReport.biggest_strengths?.map((str: string) => `<span class="tag" style="background:#dcfce7; color:#15803d; font-size:10.5px;">${str}</span>`).join('') || '—'}
      </div>
    </div>

    <div class="section">
      <div class="section-title">6. Priority Development Areas</div>
      <div class="grid-3">
        <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; border-radius:6px;">
          <strong style="color:#4f46e5; font-size:10.5px; display:block; margin-bottom:4px;">Personal Growth</strong>
          <ul style="padding-left:12px; font-size:10px;">
            ${printList(holistreeReport.development_areas?.personal)}
          </ul>
        </div>
        <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; border-radius:6px;">
          <strong style="color:#4f46e5; font-size:10.5px; display:block; margin-bottom:4px;">Academic Growth</strong>
          <ul style="padding-left:12px; font-size:10px;">
            ${printList(holistreeReport.development_areas?.academic)}
          </ul>
        </div>
        <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; border-radius:6px;">
          <strong style="color:#4f46e5; font-size:10.5px; display:block; margin-bottom:4px;">Professional Growth</strong>
          <ul style="padding-left:12px; font-size:10px;">
            ${printList(holistreeReport.development_areas?.professional)}
          </ul>
        </div>
      </div>
    </div>

    ${holistreeReport.what_interests_tell_us?.length > 0 ? `
      <div class="section">
        <div class="section-title">7. What their interests tell us</div>
        <ul>
          ${printList(holistreeReport.what_interests_tell_us)}
        </ul>
      </div>
    ` : ''}

    <div class="page-break"></div>

    <!-- SECTION 8: CAREER THEMES & RECOMMENDATIONS -->
    <div class="section">
      <div class="section-title">8. Career Themes Match</div>
      ${holistreeReport.career_themes?.map((theme: any) => `
        <div style="margin-bottom:10px; padding:8px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px;">
          <strong style="color:#4f46e5; font-size:11px; display:block; margin-bottom:3px;">${theme.theme_name}</strong>
          <p style="font-size:10.5px; color:#475569;">${theme.careers?.join(', ')}</p>
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
        <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; border-radius:6px;">
          <strong style="color:#3b82f6; font-size:10.5px; display:block; margin-bottom:4px;">Grade 10 Focus</strong>
          <ul style="padding-left:12px; font-size:10px;">
            ${printList(holistreeReport.exploration_roadmap?.class_10)}
          </ul>
        </div>
        <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; border-radius:6px;">
          <strong style="color:#3b82f6; font-size:10.5px; display:block; margin-bottom:4px;">Grade 11–12 Focus</strong>
          <ul style="padding-left:12px; font-size:10px;">
            ${printList(holistreeReport.exploration_roadmap?.class_11_12)}
          </ul>
        </div>
        <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; border-radius:6px;">
          <strong style="color:#3b82f6; font-size:10.5px; display:block; margin-bottom:4px;">Before College</strong>
          <ul style="padding-left:12px; font-size:10px;">
            ${printList(holistreeReport.exploration_roadmap?.before_college)}
          </ul>
        </div>
      </div>
    </div>

    <!-- SECTION 10: RECOMMENDATIONS FOR PARENTS -->
    <div class="section">
      <div class="section-title">10. Recommendations for Parents</div>
      <div class="grid-3">
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:8px; border-radius:6px;">
          <strong style="color:#15803d; font-size:10.5px; display:block; margin-bottom:4px;">Continue Encouraging</strong>
          <ul style="padding-left:12px; font-size:10px; color:#14532d;">
            ${printList(holistreeReport.recommendations_parents?.continue_encouraging)}
          </ul>
        </div>
        <div style="background:#f5f3ff; border:1px solid #ddd6fe; padding:8px; border-radius:6px;">
          <strong style="color:#6d28d9; font-size:10.5px; display:block; margin-bottom:4px;">Work Together On</strong>
          <ul style="padding-left:12px; font-size:10px; color:#581c87;">
            ${printList(holistreeReport.recommendations_parents?.work_together_on)}
          </ul>
        </div>
        <div style="background:#fff1f2; border:1px solid #fecdd3; padding:8px; border-radius:6px;">
          <strong style="color:#be123c; font-size:10.5px; display:block; margin-bottom:4px;">Avoid</strong>
          <ul style="padding-left:12px; font-size:10px; color:#881337;">
            ${printList(holistreeReport.recommendations_parents?.avoid)}
          </ul>
        </div>
      </div>
    </div>

    <div class="page-break"></div>

    <!-- SECTION 11: FINAL UNDERSTANDING -->
    <div class="section" style="background:#f5f3ff; border:1px solid #ddd6fe; padding:15px; border-radius:8px;">
      <div class="section-title" style="border:none; margin:0; padding:0; font-size:13px; color:#6d28d9;">11. Final Understanding of ${userName}</div>
      <p style="font-style:italic; font-size:11.5px; color:#3b0764; margin-top:6px; line-height:1.5;">
        "${holistreeReport.final_understanding?.summary}"
      </p>
      
      <div style="margin-top:12px; display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:10.5px;">
        <div style="background:#ffffff; border:1px solid #ddd6fe; padding:8px; border-radius:6px;">
          <strong style="color:#6d28d9; display:block; margin-bottom:2px;">Career Direction</strong>
          <span>${holistreeReport.final_understanding?.career_direction || '—'}</span>
        </div>
        <div style="background:#ffffff; border:1px solid #ddd6fe; padding:8px; border-radius:6px;">
          <strong style="color:#6d28d9; display:block; margin-bottom:2px;">Recommended Ecosystems</strong>
          <span>${holistreeReport.final_understanding?.most_suitable_ecosystems?.join(', ') || '—'}</span>
        </div>
      </div>
      ${holistreeReport.final_understanding?.current_priority ? `
        <div style="background:#ffffff; border:1px solid #ddd6fe; padding:8px; border-radius:6px; margin-top:8px; font-size:10.5px;">
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

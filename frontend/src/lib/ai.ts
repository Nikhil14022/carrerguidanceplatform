import Groq from "groq-sdk";
import prisma from './prisma'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callGroq(prompt: string): Promise<string> {
  const result = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a JSON-only API. You MUST respond with valid JSON and nothing else. No markdown, no explanations, no code fences. Just raw JSON."
      },
      { role: "user", content: prompt }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    response_format: { type: "json_object" },
  });
  return result.choices[0]?.message?.content || "{}";
}

async function cleanupExistingReports(clientProfileId: string) {
  const existingReports = await prisma.report.findMany({ where: { clientProfileId } });
  if (existingReports.length > 0) {
    const reportIds = existingReports.map(r => r.id);

    const careerOptions = await prisma.careerOption.findMany({ where: { reportId: { in: reportIds } } });
    const careerOptionIds = careerOptions.map(c => c.id);

    if (careerOptionIds.length > 0) {
      await prisma.researchEntry.deleteMany({ where: { careerOptionId: { in: careerOptionIds } } });
      await prisma.skillGap.deleteMany({ where: { careerOptionId: { in: careerOptionIds } } });
      await prisma.careerOption.deleteMany({ where: { reportId: { in: reportIds } } });
    }
    await prisma.finalPlan.deleteMany({ where: { reportId: { in: reportIds } } });
    await prisma.report.deleteMany({ where: { clientProfileId } });
  }
}

export async function generateCareerReport(clientProfileId: string, customInstructions?: string) {
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { id: clientProfileId },
    include: {
      modules: {
        where: {
          status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] }
        },
        include: { response: true, module: true }
      }
    }
  })

  if (!clientProfile) {
    throw new Error('Client profile not found')
  }

  const responses = clientProfile.modules.map((m: any) => ({
    moduleTitle: m.module.title,
    responses: m.response?.data
  }))

  const prompt = `Analyze this student's career assessment data and return a JSON object.

Student Assessment Data:
${JSON.stringify(responses, null, 2)}

${customInstructions ? `Additional Custom Instructions / Guidance for Report Generation:
${customInstructions}

Please strictly incorporate the above custom instructions in your analysis, strengths, personality insights, and career suggestions.
` : ''}
Return a JSON object with exactly these keys:
- "personality_insights": a 2-3 paragraph professional profile describing the student's personality, strengths, work style, and professional potential. Make it detailed and insightful.
- "career_suggestions": an array of exactly 3 objects, each with:
  - "title": the career path name (e.g. "Data Scientist", "Product Manager")
  - "reasoning": a 2-3 sentence explanation of why this career fits this student
  - "match_percentage": a number between 60 and 98 representing alignment
- "skill_gap_analysis": an array of exactly 5 strings, each being a specific skill or certification the student should acquire

Example format:
{"personality_insights": "The student demonstrates...", "career_suggestions": [{"title": "Software Engineer", "reasoning": "Based on...", "match_percentage": 85}], "skill_gap_analysis": ["Python Programming", "Cloud Architecture"]}`;

  try {
    const response = await callGroq(prompt);
    const parsed = JSON.parse(response);

    // Validate the parsed structure
    if (!parsed.personality_insights || !Array.isArray(parsed.career_suggestions) || parsed.career_suggestions.length === 0) {
      throw new Error("AI response missing required fields");
    }

    await cleanupExistingReports(clientProfileId);

    const report = await prisma.report.create({
      data: {
        clientProfileId,
        status: 'FINALIZED',
        content: parsed.personality_insights,
        careerOptions: {
          create: parsed.career_suggestions.map((c: any) => ({
            title: c.title || 'Career Path',
            reasoning: c.reasoning || 'Analysis pending',
            match: typeof c.match_percentage === 'number' ? c.match_percentage : 75
          }))
        }
      },
      include: { careerOptions: true }
    })

    return { ...report, skillGaps: parsed.skill_gap_analysis || [] }
  } catch (error) {
    console.error('Groq API error:', error)

    await cleanupExistingReports(clientProfileId);

    const fallbackReport = await prisma.report.create({
      data: {
        clientProfileId,
        status: 'FINALIZED',
        content: 'Pending Analysis - AI service temporarily unavailable. An expert will review your responses manually.',
        careerOptions: {
          create: [
            { title: 'Analysis Pending', reasoning: 'Please check back later or click Regenerate.', match: 0 },
            { title: 'Analysis Pending', reasoning: 'Please check back later or click Regenerate.', match: 0 },
            { title: 'Analysis Pending', reasoning: 'Please check back later or click Regenerate.', match: 0 }
          ]
        }
      },
      include: { careerOptions: true }
    })

    return fallbackReport
  }
}

export async function generateCareerResearch(careerOptionId: string) {
  const careerOption = await prisma.careerOption.findUnique({
    where: { id: careerOptionId },
    include: {
      report: {
        include: {
          clientProfile: {
            include: {
              modules: {
                where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] } },
                include: { response: true, module: true }
              }
            }
          }
        }
      }
    }
  })

  if (!careerOption) throw new Error('Career option not found')

  const studentData = careerOption.report.clientProfile.modules.map((m: any) => ({
    module: m.module.title,
    responses: m.response?.data
  }))

  const prompt = `Create a comprehensive career research report for: "${careerOption.title}".

Student Profile Data:
${JSON.stringify(studentData, null, 2)}

Return a JSON object with exactly these keys:
- "pathway": a detailed 4-step roadmap string from current state to senior role
- "skills": an array of 6-8 specific skill strings needed for this career
- "indiaVsAbroad": a 2-paragraph comparison of salary, demand, and quality of life
- "lifestyle": a paragraph describing typical day, stress levels, and work-life balance
- "gaps": specific personalized advice on overcoming weaknesses for this career`;

  try {
    const response = await callGroq(prompt);
    const parsed = JSON.parse(response);

    const research = await prisma.researchEntry.upsert({
      where: { careerOptionId },
      update: {
        pathway: parsed.pathway,
        skills: parsed.skills || [],
        indiaVsAbroad: parsed.indiaVsAbroad,
        lifestyle: parsed.lifestyle,
        gaps: parsed.gaps
      },
      create: {
        careerOptionId,
        pathway: parsed.pathway,
        skills: parsed.skills || [],
        indiaVsAbroad: parsed.indiaVsAbroad,
        lifestyle: parsed.lifestyle,
        gaps: parsed.gaps
      }
    })

    return research
  } catch (error) {
    console.error('Research generation error:', error)
    throw error
  }
}

export async function generateFinalPlan(reportId: string, careerIds: string[]) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      clientProfile: {
        include: {
          modules: {
            where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] } },
            include: { response: true, module: true }
          }
        }
      },
      careerOptions: {
        where: { id: { in: careerIds } }
      }
    }
  })

  if (!report || report.careerOptions.length !== 2) {
    throw new Error('Report not found or invalid number of careers selected')
  }

  const studentData = report.clientProfile.modules.map((m: any) => ({
    module: m.module.title,
    responses: m.response?.data
  }))

  const prompt = `Compare these two career paths for this student: "${report.careerOptions[0].title}" vs "${report.careerOptions[1].title}".

Student Profile Data:
${JSON.stringify(studentData, null, 2)}

Return a JSON object with exactly these keys:
- "comparison": an array of 5 objects comparing the two careers, each with keys "factor", "option1", "option2"
- "final_verdict": a paragraph recommending the best approach or hybrid strategy
- "execution_roadmap": a detailed 12-month plan with specific courses, internships, and platforms
- "expert_tips": an array of 4-5 actionable tip strings`;

  try {
    const response = await callGroq(prompt);
    const parsed = JSON.parse(response);

    const finalPlan = await prisma.finalPlan.upsert({
      where: { reportId },
      update: {
        comparisonData: parsed.comparison || [],
        finalRoadmap: parsed.execution_roadmap || ''
      },
      create: {
        reportId,
        comparisonData: parsed.comparison || [],
        finalRoadmap: parsed.execution_roadmap || ''
      }
    })

    return { ...finalPlan, verdict: parsed.final_verdict, tips: parsed.expert_tips }
  } catch (error) {
    console.error('Final plan generation error:', error)
    throw error
  }
}

export async function generateGeneralResearch(topic: string) {
  const prompt = `Research the following career or educational topic: "${topic}".
  
Return a JSON object with exactly these keys:
- "material": A comprehensive 2-3 paragraph explanation and summary of the topic.
- "topicUrls": An array of exactly 3 relevant website URLs (like articles, courses, or Wikipedia) for further reading.
- "youtubeUrls": An array of exactly 2 relevant YouTube video search URLs (e.g. https://www.youtube.com/results?search_query=...) or specific video URLs.`;

  try {
    const response = await callGroq(prompt);
    return JSON.parse(response);
  } catch (error) {
    console.error('General research error:', error);
    throw error;
  }
}

export async function chatWithClientData(
  clientProfileId: string,
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
) {
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { id: clientProfileId },
    include: {
      user: { select: { name: true, email: true } },
      modules: {
        where: {
          status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] }
        },
        include: { response: true, module: true }
      }
    }
  })

  if (!clientProfile) {
    throw new Error('Client profile not found')
  }

  const responses = clientProfile.modules.map((m: any) => ({
    moduleTitle: m.module.title,
    responses: m.response?.data
  }))

  const systemMessage = {
    role: 'system',
    content: `You are an expert AI Career Guidance Counselor. You are assisting a mentor or admin in analyzing the career survey responses of the student named ${clientProfile.user.name || 'Unnamed Student'} (${clientProfile.user.email}).

Here is the student's complete assessment data from all modules:
${JSON.stringify(responses, null, 2)}

Your task is to answer specific questions about their responses, provide insights, suggest career paths, or help write/refine career report sections. 
Keep your responses detailed, professional, encouraging, and directly rooted in the student's actual responses. Use markdown formatting to make your answers easy to read.`
  };

  const result = await groq.chat.completions.create({
    messages: [systemMessage, ...messages] as any,
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
  });

  return result.choices[0]?.message?.content || "";
}

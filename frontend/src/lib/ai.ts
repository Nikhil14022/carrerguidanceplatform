import Groq from "groq-sdk";
import prisma from './prisma'

let groqClient: Groq | null = null;

function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY || '';
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set in environment variables. Please check your Vercel or environment settings.");
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

async function callGroq(prompt: string): Promise<string> {
  const client = getGroqClient();
  const result = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a JSON-only API. You MUST respond with valid JSON and nothing else. No markdown, no explanations, no code fences. Just raw JSON."
      },
      { role: "user", content: prompt }
    ],
    model: "llama-3.1-8b-instant",
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

  const responses: any[] = [];
  for (const m of clientProfile.modules) {
    const title = (m.module?.title || '').toLowerCase();
    const data = m.response?.data as any;
    if (!data) continue;

    if (title.includes('demographics') || title.includes('module_1')) {
      responses.push({
        module: 'Demographics',
        data: {
          name: data.demo_name,
          age: data.demo_age,
          residence: data.demo_residence,
          subjects: data.demo_subjects?.filter((s: any) => s && s.col1 && s.col1.trim() !== '').map((s: any) => `${s.col1}: ${s.col2 || ''}`),
          hobbies: data.demo_hobbies?.filter((h: any) => h && h.col1 && h.col1.trim() !== '').map((h: any) => `${h.col1}: ${h.col2 || ''}`)
        }
      });
    } else if (title.includes('aim') || title.includes('vision') || title.includes('module_2')) {
      responses.push({
        module: 'Aim and Vision',
        data: {
          career_aspirations: data.aim_1,
          goals: { career: data.aim_2_career, self: data.aim_2_self },
          dream_lifestyle: data.aim_5
        }
      });
    } else if (title.includes('friend') || title.includes('relationship') || title.includes('module_6')) {
      responses.push({
        module: 'Friends and Relationships',
        data: {
          definition_of_friend: data.friends_1,
          social_journey: data.friends_journey,
          friend_traits_valued: data.friends_3
        }
      });
    } else if (title.includes('family') || title.includes('module_7')) {
      responses.push({
        module: 'Family Dynamics',
        data: {
          family_role: data.family_1,
          parent_descriptions: data.family_2,
          feedback_received: data.family_4
        }
      });
    } else if (title.includes('body') || title.includes('self') || title.includes('image') || title.includes('module_9')) {
      responses.push({
        module: 'Body and Self Image',
        data: {
          self_perception: data.body_1_reason,
          physical_goals: data.body_2_reason
        }
      });
    } else if (title.includes('pf') || title.includes('personality_factors') || title.includes('module_12')) {
      const pfFiltered: Record<string, any> = {};
      Object.keys(data).forEach(k => {
        if (k.startsWith('pf16_')) {
          pfFiltered[k] = data[k];
        }
      });
      responses.push({
        module: '16 Personality Factors Test Answers',
        data: pfFiltered
      });
    } else if (title.includes('lifestyle') || title.includes('module_8')) {
      responses.push({
        module: 'Lifestyle Expectancies',
        data: {
          lifestyle_def: data.lifestyle_1,
          valued_traits: data.lifestyle_7,
          ideal_activities: data.lifestyle_8?.filter((a: any) => a && a.col1 && a.col1.trim() !== '').map((a: any) => a.col1)
        }
      });
    } else if (title.includes('movie') || title.includes('visual') || title.includes('module_5')) {
      responses.push({
        module: 'Movies and Visual World Preferences',
        data: {
          movies: data.visual_fav_movies?.filter((m: any) => m && m.col1 && m.col1.trim() !== '').map((m: any) => m.col1),
          series: data.visual_fav_series?.filter((s: any) => s && s.col1 && s.col1.trim() !== '').map((s: any) => s.col1),
          inspirational_characters: data.visual_characters?.filter((c: any) => c && c.col1 && c.col1.trim() !== '').map((c: any) => `${c.col1}: ${c.col2 || ''}`),
          superpower: data.visual_superpower
        }
      });
    } else if (title.includes('parent') || title.includes('meeting') || title.includes('module_17')) {
      responses.push({
        module: 'Parent Perspectives Summary',
        data: {
          mother_desc: data.q1_mother_description,
          father_desc: data.q1_father_description,
          described_words: data.q1_described_words,
          free_time: data.q6_free_time,
          free_time_activities: data.q6_free_time_activities,
          social_media_usage: data.q6_social_media_usage,
          hated_subjects: data.q3_hated_subject,
          hidden_talents: data.q14_hidden_talents
        }
      });
    }
  }

  const prompt = `Analyze this student's career assessment data and return a JSON object.

Student Assessment Data:
${JSON.stringify(responses, null, 2)}

${customInstructions ? `Additional Custom Instructions / Guidance for Report Generation:
${customInstructions}

Please strictly incorporate the above custom instructions in your analysis, strengths, personality insights, and career suggestions.
` : ''}

You must perform a detailed analysis of all modules:
1. Identify the student's 16 Personalities (MBTI) type based on their responses in the 16 Personality Factors Test module (Module 12: pf16_1 to pf16_129, rated 1-5 where 1=Inaccurate, 3=Neutral, 5=Accurate. The pairs have left-side being 1 and right-side being 5). Provide the MBTI code (e.g. "ENFJ-T", "INFP-A") and estimate percentages for the 5 dimensions:
   - Mind: Extraverted vs Introverted
   - Energy: Intuitive vs Observant
   - Nature: Thinking vs Feeling
   - Tactics: Judging vs Prospecting
   - Identity: Assertive vs Turbulent
2. Synthesize 2-line professional, compassionate summaries for each of the following areas from the student's responses (e.g., Module 2, 6, 7, 9):
   - Aim and Vision
   - Friends
   - Relationship
   - Family
   - Body image
   - Impactful incidents
3. Recommend exactly 3 career options.
4. Recommend exactly 5 skill gaps.

Return a JSON object with exactly these keys:
- "personality_insights": a 2-3 paragraph professional profile describing the student's personality, strengths, work style, and professional potential. Make it detailed and insightful.
- "mbti_type": a string representing the 16 personalities type (e.g., "ENFJ-T")
- "mbti_dimensions": an object with keys "mind", "energy", "nature", "tactics", "identity". Each dimension must be an object with:
  - "label": string (the dominant trait, e.g., "Extraverted" or "Introverted")
  - "percentage": number between 50 and 99 (representing the strength of the preference)
- "mbti_interpretation": a 1-paragraph summary explaining the calculated MBTI type.
- "overview_summaries": an object with keys "aim_and_vision", "friends", "relationship", "family", "body_image", "impactful_incidents", "other_observations". Each value must be a concise 2-line summary.
- "career_suggestions": an array of exactly 3 objects, each with:
  - "title": the career path name (e.g. "Creative Director", "Clinical Psychologist")
  - "reasoning": a 2-3 sentence explanation of why this career fits this student
  - "match_percentage": a number between 60 and 98 representing alignment
- "skill_gap_analysis": an array of exactly 5 strings, each being a specific skill or certification the student should acquire

Example format:
{
  "personality_insights": "The student demonstrates...",
  "mbti_type": "ENFJ-T",
  "mbti_dimensions": {
    "mind": { "label": "Extraverted", "percentage": 65 },
    "energy": { "label": "Intuitive", "percentage": 75 },
    "nature": { "label": "Feeling", "percentage": 60 },
    "tactics": { "label": "Judging", "percentage": 70 },
    "identity": { "label": "Turbulent", "percentage": 55 }
  },
  "mbti_interpretation": "As a Protagonist (ENFJ-T), the student is...",
  "overview_summaries": {
    "aim_and_vision": "Aims to achieve career clarity and develop personal discipline...",
    "friends": "Prefers a small, close-knit circle of trustworthy friends...",
    "relationship": "Values personal space and has romantic preferences...",
    "family": "Shares a supportive but quiet relationship with parents...",
    "body_image": "Highly conscious of self-image, with growing focus on personal aesthetics...",
    "impactful_incidents": "Sustained artistic self-learning during COVID which defined their creative identity...",
    "other_observations": "Shows natural talent in sketching and music..."
  },
  "career_suggestions": [
    { "title": "Art Director", "reasoning": "Fits their strong creative skills...", "match_percentage": 88 }
  ],
  "skill_gap_analysis": ["Digital Illustration", "Project Management"]
}`;

  try {
    const response = await callGroq(prompt);
    const parsed = JSON.parse(response);

    // Validate the parsed structure
    if (!parsed.personality_insights || !Array.isArray(parsed.career_suggestions) || parsed.career_suggestions.length === 0) {
      throw new Error("AI response missing required fields");
    }

    await cleanupExistingReports(clientProfileId);

    const reportContentString = JSON.stringify({
      personality_insights: parsed.personality_insights,
      mbti_type: parsed.mbti_type || 'Unknown',
      mbti_dimensions: parsed.mbti_dimensions || {},
      mbti_interpretation: parsed.mbti_interpretation || '',
      overview_summaries: parsed.overview_summaries || {}
    });

    const report = await prisma.report.create({
      data: {
        clientProfileId,
        status: 'FINALIZED',
        content: reportContentString,
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

    const fallbackReportContentString = JSON.stringify({
      personality_insights: 'Pending Analysis - AI service temporarily unavailable. An expert will review your responses manually.',
      mbti_type: 'Pending',
      mbti_dimensions: {},
      mbti_interpretation: '',
      overview_summaries: {
        aim_and_vision: 'Pending review...',
        friends: 'Pending review...',
        relationship: 'Pending review...',
        family: 'Pending review...',
        body_image: 'Pending review...',
        impactful_incidents: 'Pending review...'
      }
    });

    const fallbackReport = await prisma.report.create({
      data: {
        clientProfileId,
        status: 'FINALIZED',
        content: fallbackReportContentString,
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

  const client = getGroqClient();
  const result = await client.chat.completions.create({
    messages: [systemMessage, ...messages] as any,
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
  });

  return result.choices[0]?.message?.content || "";
}

export async function generateProfessionResearch(professionName: string, userId: string) {
  const clientProfile = await prisma.clientProfile.findFirst({
    where: { userId },
    include: {
      user: { select: { name: true, email: true, age: true } },
      modules: {
        where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] } },
        include: { response: true, module: true }
      }
    }
  })

  let studentProfileText = "No profile assessments completed yet."
  if (clientProfile && clientProfile.modules.length > 0) {
    const modulesData = clientProfile.modules.map((m: any) => ({
      module: m.module.title,
      answers: m.response?.data
    }))
    studentProfileText = JSON.stringify({
      studentName: clientProfile.user.name,
      studentAge: clientProfile.user.age,
      assessments: modulesData
    }, null, 2)
  }

  const prompt = `You are a world-class AI Career Guidance Specialist.
Generate a comprehensive, high-quality, structured profession research report for the profession: "${professionName}".

Student Profile Context (if available, customize Section 2 Questions 14 and 15 based on this; otherwise write general guidance):
${studentProfileText}

You MUST return a JSON object with exactly the following keys and structure. Return only the raw JSON string:

{
  "basic": {
    "q1": "Explain what this profession is in simple, child-friendly language.",
    "q2": "What does a person in this profession actually do on a daily basis?",
    "q3": "List the common job roles and designations in this profession.",
    "q4": "What does a typical workday look like during the first 0-3 years?",
    "q5": "List the five most important skills needed for this profession.",
    "q6": "What personal qualities or habits help a person succeed in this profession?",
    "q7": "What are the main advantages and challenges of this profession?",
    "q8": "Likely lifestyle (working hours, pressure, travel, flexibility, work-life balance, and social interaction).",
    "q9": "Describe academic pathways to enter this profession from: after Class 10, after Class 12, and after graduation.",
    "q10": "Which streams, subjects, degrees, and courses are most relevant for this profession?",
    "q11": "What entrance exams may be required?",
    "q12": "Name some leading colleges or universities in India offering relevant courses.",
    "q13": "What can a child start doing now to explore or prepare (reading, activities, projects, competitions, volunteering, shadowing)?",
    "q14": "Name short courses, certifications, internships, or projects that build an early advantage."
  },
  "advanced": {
    "q1": "What are the detailed career pathways and specialisations within this profession?",
    "q2": [
      {
        "pathwayName": "Name of specialization or path",
        "degreeName": "Degree or course name",
        "duration": "Duration (e.g. 4 years)",
        "eligibility": "Eligibility criteria",
        "subjects": "Required streams/subjects",
        "exam": "Entrance exam",
        "cutoff": "Approximate cut-off or score expectation",
        "colleges": "Leading colleges/universities",
        "fees": "Approximate course fees",
        "roles": "Career roles after completion"
      }
    ],
    "q3": "What are the best alternative pathways if the preferred course, college, or entrance exam does not work out?",
    "q4": {
      "y0_3": "Jobs and responsibilities at 0-3 years experience",
      "y3_6": "Jobs and responsibilities at 3-6 years experience",
      "y6_10": "Jobs and responsibilities at 6-10 years experience",
      "y10_plus": "Jobs and responsibilities at 10+ years experience"
    },
    "q5": {
      "y0_3": "Salary range in India at 0-3 years",
      "y3_6": "Salary range in India at 3-6 years",
      "y6_10": "Salary range in India at 6-10 years",
      "y10_plus": "Salary range in India at 10+ years"
    },
    "q6": {
      "y0_3": "Salary range abroad at 0-3 years (Country, currency, and INR equivalent)",
      "y3_6": "Salary range abroad at 3-6 years (Country, currency, and INR equivalent)",
      "y6_10": "Salary range abroad at 6-10 years (Country, currency, and INR equivalent)",
      "y10_plus": "Salary range abroad at 10+ years (Country, currency, and INR equivalent)"
    },
    "q7": "What factors have the biggest impact on success and earnings in this profession?",
    "q8": "Explain opportunities and requirements for freelancing, entrepreneurship, private practice, or remote work.",
    "q9": "What are the major risks, difficulties, competition levels, and trade-offs in this career?",
    "q10": "What is the current demand for this profession in India and internationally?",
    "q11": "What is the future outlook for the next 3-5 years?",
    "q12": "How will technology, AI, automation, regulations, or market changes affect this profession?",
    "q13": "Which future skills and emerging specialisations will be most valuable?",
    "q14": {
      "whySuit": "Personalized advice: why this profession may suit the child based on their profile data.",
      "strengths": "Strengths the child can use",
      "gaps": "Gaps to work on",
      "habits": "Habits, skills, and routines to build",
      "actionPlan": "A practical action plan for next 30 days, 3 months, 6 months, and 1 year"
    },
    "q15": {
      "score": "A number from 1 to 10 for overall profession-fit score",
      "recommendation": "A concise final counselor recommendation"
    }
  }
}`

  const client = getGroqClient()
  try {
    const result = await client.chat.completions.create({
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
    })

    const responseText = result.choices[0]?.message?.content || "{}"
    return JSON.parse(responseText.trim())
  } catch (error) {
    console.error('generateProfessionResearch error:', error)
    throw error
  }
}

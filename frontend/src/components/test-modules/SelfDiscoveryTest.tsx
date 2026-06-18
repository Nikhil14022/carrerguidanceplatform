"use client";

import React, { useState, useEffect } from "react";

interface SelfDiscoveryTestProps {
  answers: Record<string, any>;
  setAnswers: (answers: Record<string, any>) => void;
  onSubmit: () => void;
  readOnly?: boolean;
}

interface Question {
  id: string;
  num: number;
  text: string;
}

interface Section {
  title: string;
  subtitle: string;
  questions: Question[];
}

const ROUND1_SECTIONS: Section[] = [
  {
    title: "Round 1: Self-Discovery Questions",
    subtitle: "Reflect on activities, conversations, routines, and content that excite you.",
    questions: [
      { id: "sd_q1", num: 1, text: "What activities make you lose track of time?" },
      { id: "sd_q2", num: 2, text: "What is something that you get really excited about most of the time? What is it?" },
      { id: "sd_q3", num: 3, text: "What do you love talking about, regardless of whether others like or don’t?" },
      { id: "sd_q4", num: 4, text: "If school/Academics was over, how would you spend your days (daily routine)?" },
      { id: "sd_q5", num: 5, text: "What kind of videos, articles, or posts do you keep scrolling through?" }
    ]
  },
  {
    title: "Round 1: Creative and Skill-Based Questions",
    subtitle: "Explore your creative outlets, physical or cognitive work styles, and natural talents.",
    questions: [
      { id: "sd_q6", num: 6, text: "What do you enjoy making or creating most of the time?" },
      { id: "sd_q7", num: 7, text: "Do you like working with your hands (physical engagement), your mind (ideating, analysing, visualizing), or with people (talking/collaborating)?" },
      { id: "sd_q8", num: 8, text: "Is there something you’re naturally good at without trying too hard?" },
      { id: "sd_q9", num: 9, text: "Have you ever helped someone with a skill or talent of yours?" },
      { id: "sd_q10", num: 10, text: "What kind of areas, topics or projects excite you?" }
    ]
  },
  {
    title: "Round 1: Exploration and Exposure",
    subtitle: "Envision dream jobs, lifestyles, role models, and inspiring spaces.",
    questions: [
      { id: "sd_q11", num: 11, text: "If you could try any job for a day, what would it be and why?" },
      { id: "sd_q12", num: 12, text: "What do you think your dream lifestyle looks like (mention all the things you like as a list)?" },
      { id: "sd_q13", num: 13, text: "Who do you admire (in real life or online)? What do they do?" },
      { id: "sd_q14", num: 14, text: "Which subjects or classes do you enjoy the most - and the least - and why?" },
      { id: "sd_q15", num: 15, text: "Have you ever visited a space that made you think, “I want to be part of this”? (vibe, culture, ambience, people, way of doing something, their mission/cause)" }
    ]
  },
  {
    title: "Round 1: Emotional Clues",
    subtitle: "Identify your sources of pride, confidence, stress management, and collaboration preferences.",
    questions: [
      { id: "sd_q16", num: 16, text: "What makes you feel proud of yourself?" },
      { id: "sd_q17", num: 17, text: "What makes you feel confident?" },
      { id: "sd_q18", num: 18, text: "What do you do when you’re stressed or upset that makes you feel better?" },
      { id: "sd_q19", num: 19, text: "What’s one thing you always look forward to?" },
      { id: "sd_q20", num: 20, text: "Do you prefer working alone or in a group? In fast-paced or calm settings?" }
    ]
  },
  {
    title: "Round 1: Values and Meaning",
    subtitle: "Define what values and impact drive your actions and choices.",
    questions: [
      { id: "sd_q21", num: 21, text: "What kind of problems in the world do you wish you could solve?" },
      { id: "sd_q22", num: 22, text: "What’s more important to you: money, creativity, helping others, or freedom?" },
      { id: "sd_q23", num: 23, text: "Do you want your future job to be fun, meaningful, respected, or secure?" },
      { id: "sd_q24", num: 24, text: "Would you like to travel for work, or stay close to home? (If Travel mention frequency or duration)" },
      { id: "sd_q25", num: 25, text: "What kind of difference do you want to make in people’s lives? (Daily/regular basis)" }
    ]
  }
];

const TEEN_ROUND2_SECTIONS: Section[] = [
  {
    title: "Round 2: Decision Clarity & Career Direction (Ages 13-18)",
    subtitle: "Let's explore your early interests, work preferences, and internships.",
    questions: [
      { id: "sd_r2_q1", num: 26, text: "Which of your skills or hobbies would you like to use regularly in the next 2–4 years?" },
      { id: "sd_r2_q2", num: 27, text: "What kind of work or field do you see yourself trying first after school - studies, internships, or part-time roles?" },
      { id: "sd_r2_q3", num: 28, text: "If you had two options - one job that pays well but feels boring, and one that pays less but excites you - which would you choose, and why?" },
      { id: "sd_r2_q4", num: 29, text: "Are there 2–3 areas (like tech, arts, sports, teaching, design, science, etc.) you’d like to explore through internships, workshops, or projects in the next couple of years?" },
      { id: "sd_r2_q5", num: 30, text: "What’s one kind of work you would do happily, even if you didn’t earn money for the first few months?" }
    ]
  },
  {
    title: "Round 2: Mindset & Roadblocks (Ages 13-18)",
    subtitle: "Examine internal worries, peer comparisons, and perseverance.",
    questions: [
      { id: "sd_r2_q6", num: 31, text: "What’s the biggest thing holding you back from exploring your interests right now?" },
      { id: "sd_r2_q7", num: 32, text: "What worries you the most about failing or making mistakes while choosing your career?" },
      { id: "sd_r2_q8", num: 33, text: "Are you more afraid of picking the “wrong” path or of not choosing anything at all?" },
      { id: "sd_r2_q9", num: 34, text: "Do you compare your choices with classmates or friends? How does that affect you?" },
      { id: "sd_r2_q10", num: 35, text: "When you get bored of something, do you usually quit quickly or stick with it? How might that affect your career choices?" }
    ]
  },
  {
    title: "Round 2: Reality Check & Skill Gaps (Ages 13-18)",
    subtitle: "Identify growth areas, tools, platforms, and mentorship possibilities.",
    questions: [
      { id: "sd_r2_q11", num: 36, text: "What new skills do you want to learn in the next 2–4 years that will help you in college or work?" },
      { id: "sd_r2_q12", num: 37, text: "What type of work setting excites you more - working with a team, being independent, outdoors, office-style, or creating things?" },
      { id: "sd_r2_q13", num: 38, text: "Would you be open to learning from a mentor, teacher, or senior even if it feels challenging at first?" },
      { id: "sd_r2_q14", num: 39, text: "Which tools, apps, or platforms (like Canva, coding, video editing, Excel, etc.) are you curious to learn for future opportunities?" },
      { id: "sd_r2_q15", num: 40, text: "Is there someone (other than parents) you can talk to regularly for guidance about your career direction?" }
    ]
  },
  {
    title: "Round 2: Short-Term Future Vision (Ages 13-18)",
    subtitle: "Envision your next few years, non-negotiables, and how you want to grow.",
    questions: [
      { id: "sd_r2_q16", num: 41, text: "Imagine yourself 2–4 years from now. What does a “successful” day look like for you?" },
      { id: "sd_r2_q17", num: 42, text: "What is one thing you would never want to compromise on in your career (e.g., fun, freedom, money, respect, learning)?" },
      { id: "sd_r2_q18", num: 43, text: "Would you like to create something of your own (like a small project or start-up) or be part of a group/organization to gain experience first?" },
      { id: "sd_r2_q19", num: 44, text: "How would you like your teachers, friends, or family to describe your efforts and work habits 2–4 years from now?" },
      { id: "sd_r2_q20", num: 45, text: "Looking ahead, what’s one regret you want to avoid in your career journey during your teen years?" }
    ]
  }
];

const ADULT_ROUND2_SECTIONS: Section[] = [
  {
    title: "Round 2: Decision Clarity & Career Direction (Ages 18+)",
    subtitle: "Explore long-term career paths, realistic goals, and job options.",
    questions: [
      { id: "sd_r2_q1", num: 26, text: "Which of your interests or strengths do you see yourself using daily in your work?" },
      { id: "sd_r2_q2", num: 27, text: "Which career paths align with the lifestyle you want to live - and are actually realistic for you to achieve in the next 5-10 years?" },
      { id: "sd_r2_q3", num: 28, text: "If you had to choose between a job that paid really well but bored you, and one that paid average but excited you - which would you pick and why?" },
      { id: "sd_r2_q4", num: 29, text: "Are there 2–3 industries or fields you’re currently curious about enough to intern or work next year?" },
      { id: "sd_r2_q5", num: 30, text: "What kind of work would you still do, even if nobody paid you for it for the first 6 months?" }
    ]
  },
  {
    title: "Round 2: Mindset Check & Internal Blocks (Ages 18+)",
    subtitle: "Reflect on setbacks, peer pressure, and sticking to your path.",
    questions: [
      { id: "sd_r2_q6", num: 31, text: "What’s stopping you right now from going all-in on something you really want to explore?" },
      { id: "sd_r2_q7", num: 32, text: "What are you afraid will happen if you fail in your career journey?" },
      { id: "sd_r2_q8", num: 33, text: "Are you more afraid of choosing the wrong path or not choosing at all?" },
      { id: "sd_r2_q9", num: 34, text: "Do you compare your life decisions with your peers - and how does that impact your choices?" },
      { id: "sd_r2_q10", num: 35, text: "How do you handle boredom - and how might that affect your ability to stick with one path long enough to grow?" }
    ]
  },
  {
    title: "Round 2: Reality Check & Skill Gaps (Ages 18+)",
    subtitle: "Identify critical professional skills, work cultures, and professional networks.",
    questions: [
      { id: "sd_r2_q11", num: 36, text: "Which skills do you know you need to build in the next 1–2 years to be future-proof and employable?" },
      { id: "sd_r2_q12", num: 37, text: "What kind of work culture excites you - corporate, startup, outdoors, solo projects, or people-facing roles?" },
      { id: "sd_r2_q13", num: 38, text: "Are you open to mentorship or learning from someone ahead of you, even if it challenges your ego or comfort zone?" },
      { id: "sd_r2_q14", num: 39, text: "Which tools or platforms (Excel, Canva, coding, CRM, analytics, video editing, etc.) are you currently curious to master - not just for fun but for income potential?" },
      { id: "sd_r2_q15", num: 40, text: "Do you have 1–2 people in your network (not parents) who you can regularly talk to about career direction and accountability?" }
    ]
  },
  {
    title: "Round 2: Long-Term Vision (Ages 18+)",
    subtitle: "Define success at age 35, non-negotiables, and regrets you want to avoid.",
    questions: [
      { id: "sd_r2_q16", num: 41, text: "Imagine yourself at 35 - what does a “successful” day look like for you?" },
      { id: "sd_r2_q17", num: 42, text: "What is your non-negotiable - something you won’t sacrifice in your career no matter how good the opportunity looks?" },
      { id: "sd_r2_q18", num: 43, text: "Would you rather build something of your own with high risk, or be part of a growing system with more stability?" },
      { id: "sd_r2_q19", num: 44, text: "How do you want people to describe your work ethic or contribution 10 years from now?" },
      { id: "sd_r2_q20", num: 45, text: "What’s the one big life regret you want to make sure you avoid?" }
    ]
  }
];

export default function SelfDiscoveryTest({ answers, setAnswers, onSubmit, readOnly = false }: SelfDiscoveryTestProps) {
  // Page 0: Age selection
  // Page 1-5: Round 1 sections
  // Page 6-9: Round 2 sections (dependent on age)
  // Page 10: Summary & Review
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState("");

  const ageGroup = answers.sd_age_group || ""; // "13-18" or "18+"

  const round2Sections = ageGroup === "13-18" ? TEEN_ROUND2_SECTIONS : ADULT_ROUND2_SECTIONS;
  const allSections = [...ROUND1_SECTIONS, ...round2Sections];
  const totalPages = allSections.length + 2; // +1 for Age selection (page 0), +1 for Summary/Review (page 10)

  // Auto-fill age group from demographics if not already set and exists
  useEffect(() => {
    if (!answers.sd_age_group && answers.demo_age) {
      const ageNum = parseInt(answers.demo_age);
      if (!isNaN(ageNum)) {
        const group = ageNum >= 18 ? "18+" : "13-18";
        setAnswers({ ...answers, sd_age_group: group });
      }
    }
  }, [answers.demo_age]);

  const handleAgeSelect = (selectedGroup: "13-18" | "18+") => {
    if (readOnly) return;
    setAnswers({ ...answers, sd_age_group: selectedGroup });
    setError("");
  };

  const handleAnswerChange = (qId: string, val: string) => {
    if (readOnly) return;
    setAnswers({ ...answers, [qId]: val });
    if (error) setError("");
  };

  const handleNext = () => {
    // Validation for page 0 (Age selection)
    if (currentPage === 0 && !answers.sd_age_group) {
      setError("Please select your age group before continuing.");
      return;
    }

    // Validation for intermediate question pages
    if (currentPage > 0 && currentPage <= allSections.length) {
      const currentSectionData = allSections[currentPage - 1];
      const unanswered = currentSectionData.questions.some(
        (q) => !answers[q.id] || !answers[q.id].trim()
      );
      if (unanswered) {
        setError("Please answer all questions in this section before continuing.");
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
      setError("");
    } else {
      onSubmit();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
      setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const jumpToPage = (pageNum: number) => {
    // Validate if jump is permitted (cannot skip forward past unanswered pages)
    if (pageNum > currentPage) {
      if (currentPage === 0 && !answers.sd_age_group) {
        setError("Please select your age group first.");
        return;
      }
      // Check intermediate pages
      for (let i = 1; i < pageNum; i++) {
        if (i <= allSections.length) {
          const sec = allSections[i - 1];
          const incomplete = sec.questions.some((q) => !answers[q.id] || !answers[q.id].trim());
          if (incomplete) {
            setError(`Please complete Section ${i} before jumping ahead.`);
            return;
          }
        }
      }
    }
    setCurrentPage(pageNum);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Render Age Selection page
  if (currentPage === 0) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <div className="space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-widest">
              Setup
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Self Discovery Questionnaire
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto leading-relaxed text-sm md:text-base">
              Welcome to the Self Discovery Questionnaire. This assessment will help us understand your interests, work styles, values, and vision.
            </p>
          </div>

          <div className="mt-12 p-6 bg-slate-950/50 border border-slate-800/80 rounded-2xl space-y-4">
            <h3 className="text-indigo-400 font-bold uppercase tracking-wider text-xs">Instructions</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">1.</span> Please answer all questions in complete sentences.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">2.</span> Do not write one-word answers. Take your time to reflect.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">3.</span> Round 1 is common for everyone. Round 2 is customized based on your age.
              </li>
            </ul>
          </div>

          <div className="mt-12 space-y-4 text-center">
            <p className="text-slate-300 font-bold tracking-wide uppercase text-sm">
              Please select or confirm your age group:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto justify-center">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => !readOnly && handleAgeSelect("13-18")}
                className={`flex-1 py-5 px-6 rounded-2xl border-2 transition-all font-bold text-center flex flex-col items-center justify-center gap-2 ${
                  ageGroup === "13-18"
                    ? "border-indigo-500 bg-indigo-500/15 text-white shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                } ${readOnly ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <span className="text-lg">Ages 13 – 18</span>
                <span className="text-xs font-normal opacity-85">For School Students</span>
              </button>

              <button
                type="button"
                disabled={readOnly}
                onClick={() => !readOnly && handleAgeSelect("18+")}
                className={`flex-1 py-5 px-6 rounded-2xl border-2 transition-all font-bold text-center flex flex-col items-center justify-center gap-2 ${
                  ageGroup === "18+"
                    ? "border-purple-500 bg-purple-500/15 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                } ${readOnly ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <span className="text-lg">Ages 18 & Above</span>
                <span className="text-xs font-normal opacity-85">For Degree Students & Professionals</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center text-sm font-semibold animate-pulse">
              {error}
            </div>
          )}

          <div className="mt-12 flex justify-end">
            <button
              onClick={handleNext}
              className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {readOnly ? "View Questionnaire" : "Start Questionnaire"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Summary & Review page
  if (currentPage === totalPages - 1) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div>
            <h2 className="text-xl font-bold text-white bg-clip-text">
              Review and Submit
            </h2>
            <p className="text-slate-400 text-xs mt-1">Review your answers before completing the assessment.</p>
          </div>
          <button
            onClick={() => jumpToPage(0)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Age: {ageGroup}
          </button>
        </div>

        {/* Scrollable Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-xl max-h-[60vh] overflow-y-auto custom-scrollbar">
          {allSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-4">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                {sec.title}
              </h3>
              <div className="space-y-6">
                {sec.questions.map((q) => {
                  const ansVal = answers[q.id] || "";
                  return (
                    <div key={q.id} className="space-y-2 group">
                      <div className="flex items-start gap-2 justify-between">
                        <p className="text-slate-300 text-sm font-medium leading-relaxed">
                          <span className="text-slate-500 mr-1.5">{q.num}.</span>
                          {q.text}
                        </p>
                        {!readOnly && (
                          <button
                            onClick={() => jumpToPage(secIdx + 1)}
                            className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-400 hover:underline transition-colors shrink-0 uppercase tracking-wider ml-4 mt-0.5"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      <div className="p-4 bg-slate-950/70 border border-slate-850 rounded-xl text-slate-400 text-sm italic leading-relaxed whitespace-pre-wrap">
                        {ansVal.trim() ? ansVal : "(No answer provided)"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center text-sm font-semibold animate-pulse">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between py-4">
          <button
            onClick={handlePrev}
            className="px-6 py-3 rounded-xl font-medium bg-slate-800 hover:bg-slate-700 text-white transition-all hover:shadow-lg"
          >
            Back to Questions
          </button>
          
          <button
            onClick={handleNext}
            className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            {readOnly ? "Exit Assessment" : "Submit Assessment 🚀"}
          </button>
        </div>
      </div>
    );
  }

  // Render question pages (Page 1 to 9)
  const currentSectionIdx = currentPage - 1;
  const currentSectionData = allSections[currentSectionIdx];
  const pageProgress = ((currentPage) / (totalPages - 1)) * 100;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header and Quick Navigation Progress Circles */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white bg-clip-text">
            {currentSectionData.title}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">{currentSectionData.subtitle}</p>
        </div>

        {/* Quick Jump Dot Map */}
        <div className="flex items-center gap-1.5 self-center md:self-auto overflow-x-auto max-w-full py-1">
          {/* Age Selection Circle */}
          <button
            onClick={() => jumpToPage(0)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 shrink-0"
            title="Setup"
          >
            S
          </button>
          <div className="w-1 h-[2px] bg-slate-800 shrink-0" />
          
          {allSections.map((_, i) => {
            const pageNum = i + 1;
            let dotStyle = "border-slate-800 bg-slate-950/40 text-slate-500 hover:border-slate-700";
            if (pageNum === currentPage) {
              dotStyle = "border-indigo-500 bg-indigo-500/10 text-indigo-400 font-extrabold shadow-[0_0_10px_rgba(99,102,241,0.2)]";
            } else if (pageNum < currentPage) {
              dotStyle = "border-slate-700 bg-slate-900 text-slate-300";
            }
            return (
              <button
                key={i}
                onClick={() => jumpToPage(pageNum)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all border shrink-0 ${dotStyle}`}
                title={`Section ${pageNum}`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <div className="w-1 h-[2px] bg-slate-800 shrink-0" />
          {/* Review Circle */}
          <button
            onClick={() => jumpToPage(totalPages - 1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border border-slate-850 bg-slate-950/40 text-slate-500 hover:border-slate-700 shrink-0"
            title="Review & Submit"
          >
            R
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-800">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${pageProgress}%` }}
          />
        </div>

        <div className="p-6 md:p-8 space-y-10 mt-2">
          {currentSectionData.questions.map((q) => {
            const ansVal = answers[q.id] || "";
            return (
              <div key={q.id} className="space-y-4">
                <label className="block text-slate-200 text-base md:text-lg font-semibold leading-relaxed">
                  <span className="text-indigo-400 mr-2 font-bold">{q.num}.</span>
                  {q.text}
                </label>
                
                <textarea
                  value={ansVal}
                  onChange={(e) => !readOnly && handleAnswerChange(q.id, e.target.value)}
                  disabled={readOnly}
                  placeholder="Type your thoughtful response here..."
                  rows={4}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all text-sm md:text-base leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center text-sm font-semibold animate-pulse">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between py-4">
        <button
          onClick={handlePrev}
          className="px-6 py-3 rounded-xl font-medium bg-slate-850 hover:bg-slate-800 text-white transition-all hover:shadow-lg"
        >
          Previous Section
        </button>
        
        <button
          onClick={handleNext}
          className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          {currentPage === totalPages - 2 ? "Review Answers 🔍" : "Next Section"}
        </button>
      </div>
    </div>
  );
}

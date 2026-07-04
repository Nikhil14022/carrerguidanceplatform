"use client";

import React, { useState } from "react";

interface JobFunctionsTestProps {
  answers: Record<string, any>;
  setAnswers: (answers: Record<string, any>) => void;
  onSubmit: () => void;
  readOnly?: boolean;
}

interface JobFunctionItem {
  id: string;
  text: string;
}

interface JobFunctionSection {
  title: string;
  category: string;
  items: JobFunctionItem[];
}

const SECTIONS: JobFunctionSection[] = [
  // Page 1: People-Oriented Functions (One-on-One)
  {
    category: "People-Oriented (One-on-One)",
    title: "Problem Solving & Providing Expert Advice",
    items: [
      { id: "jf_t0_r1", text: "Mentoring, one-on-one teaching, instructing, training, tutoring" },
      { id: "jf_t0_r2", text: "Counseling, coaching, guiding, empowering" },
      { id: "jf_t0_r3", text: "Healing, treating the diseases or problems of, rehabilitating" },
      { id: "jf_t0_r4", text: "Advising, consulting with" },
      { id: "jf_t0_r5", text: "Assessing, evaluating" },
      { id: "jf_t0_r6", text: "Diagnosing, analysing or understanding an individual's needs, mood, motives, responses, behaviour, etc." },
      { id: "jf_t0_r7", text: "Using intuition or non-verbal clues to understand individuals" },
      { id: "jf_t0_r8", text: "Observing, studying behaviours" }
    ]
  },
  {
    category: "People-Oriented (One-on-One)",
    title: "Supporting, Enabling, Hosting & Entertaining",
    items: [
      { id: "jf_t1_r1", text: "Encouraging, supporting" },
      { id: "jf_t1_r2", text: "Providing emotional support" },
      { id: "jf_t1_r3", text: "Promoting, being an agent for others" },
      { id: "jf_t1_r4", text: "Listening" },
      { id: "jf_t1_r5", text: "Being understanding and patient with others" },
      { id: "jf_t1_r6", text: "Enabling, assisting other people to locate information" },
      { id: "jf_t1_r7", text: "Helping, serving, providing needs of individuals" },
      { id: "jf_t1_r8", text: "Assisting, caretaking" },
      { id: "jf_t1_r9", text: "Hosting" },
      { id: "jf_t1_r10", text: "Entertaining, amusing, conversing with" },
      { id: "jf_t1_r11", text: "Giving pleasure" },
      { id: "jf_t1_r12", text: "Using your personal charisma" }
    ]
  },
  {
    category: "People-Oriented (One-on-One)",
    title: "Managing, Informing & General Administrative Activities",
    items: [
      { id: "jf_t2_r1", text: "Cultivating and maintaining relationships" },
      { id: "jf_t2_r2", text: "Selecting, Screening, Hiring" },
      { id: "jf_t2_r3", text: "Managing, Supervising" },
      { id: "jf_t2_r4", text: "Giving instructions, providing information" },
      { id: "jf_t2_r5", text: "Persuading, selling, motivating, influencing, enrolling, recruiting" },
      { id: "jf_t2_r6", text: "Interviewing" },
      { id: "jf_t2_r7", text: "Communicating verbally with" },
      { id: "jf_t2_r8", text: "Bringing together, introducing" },
      { id: "jf_t2_r9", text: "Networking" },
      { id: "jf_t2_r10", text: "Building alliances and relationships" },
      { id: "jf_t2_r11", text: "Negotiating between individuals, arbitrating" }
    ]
  },

  // Page 2: People-Oriented Functions (Groups & Public)
  {
    category: "People-Oriented (Groups & Public)",
    title: "Problem Solving & Providing Expert Advice to a Group",
    items: [
      { id: "jf_t3_r1", text: "Empowering, enabling a group" },
      { id: "jf_t3_r2", text: "Instructing, teaching, training a group" },
      { id: "jf_t3_r3", text: "Guiding a group through a healing process" },
      { id: "jf_t3_r4", text: "Diagnosing, analysing, or understanding a group's existing or potential needs, mood, motives, responses, behaviour" },
      { id: "jf_t3_r5", text: "Using intuition or nonverbal cues to understand a group or individuals in a group setting" },
      { id: "jf_t3_r6", text: "Consulting to affect a group or organization's productivity, behaviour" },
      { id: "jf_t3_r7", text: "Advising a group, providing expertise" },
      { id: "jf_t3_r8", text: "Designing events or educational experiences" },
      { id: "jf_t3_r9", text: "Creating activities, games" }
    ]
  },
  {
    category: "People-Oriented (Groups & Public)",
    title: "Managing, Leading & Interacting with a Group",
    items: [
      { id: "jf_t4_r1", text: "Managing, leading a group, organization, company" },
      { id: "jf_t4_r2", text: "Initiating, creating, founding a group of people or a company" },
      { id: "jf_t4_r3", text: "Supervising, captaining a group or team" },
      { id: "jf_t4_r4", text: "Supporting a team, work group, orchestra as a member" },
      { id: "jf_t4_r5", text: "Leading group in recreation, games, exercise, travel, rehabilitation" },
      { id: "jf_t4_r6", text: "Negotiating between groups, resolving conflicts or disputes, bringing conflicting groups together" },
      { id: "jf_t4_r7", text: "Inspiring a group" },
      { id: "jf_t4_r8", text: "Facilitating, guiding a group" }
    ]
  },
  {
    category: "People-Oriented (Groups & Public)",
    title: "Influencing & Persuading a Group",
    items: [
      { id: "jf_t5_r1", text: "Persuading, motivating, convincing, or selling to a group" },
      { id: "jf_t5_r2", text: "Using personal charisma" },
      { id: "jf_t5_r3", text: "Networking with groups" },
      { id: "jf_t5_r4", text: "Communicating verbally with groups, public speaking, or communicating verbally through the media" },
      { id: "jf_t5_r5", text: "Communicating with people via art, music, writing, film, or other art forms" }
    ]
  },
  {
    category: "People-Oriented (Groups & Public)",
    title: "Entertaining & Hosting Group Functions",
    items: [
      { id: "jf_t6_r1", text: "Hosting, entertaining socially" },
      { id: "jf_t6_r2", text: "Amusing, providing entertainment or pleasure" },
      { id: "jf_t6_r3", text: "Performing, acting" },
      { id: "jf_t6_r4", text: "Presenting to people via TV, films, seminars, speeches" },
      { id: "jf_t6_r5", text: "Selecting, screening prospective members or employees" },
      { id: "jf_t6_r6", text: "Assisting, serving, helping" }
    ]
  },

  // Page 3: Information & Ideas
  {
    category: "Information & Ideas",
    title: "Creating, Designing & Using Imagination",
    items: [
      { id: "jf_t7_r1", text: "Idea generating, creating, inventing, imagining" },
      { id: "jf_t7_r2", text: "Asking new questions, pioneering new ideas, brainstorming" },
      { id: "jf_t7_r3", text: "Drawing, painting, filming, photographing" },
      { id: "jf_t7_r4", text: "Creating original works of art, including music" },
      { id: "jf_t7_r5", text: "Creating visual or written presentation or presentations using other media" },
      { id: "jf_t7_r6", text: "Creating marketing materials, advertisements, promotional campaigns" },
      { id: "jf_t7_r7", text: "Creating activities, games, or other experiential learning activities" },
      { id: "jf_t7_r8", text: "Designing events or educational experiences" },
      { id: "jf_t7_r9", text: "Writing fiction, creative writing, poetry, essays, novels, scripts" },
      { id: "jf_t7_r10", text: "Performing, acting" },
      { id: "jf_t7_r11", text: "Presenting to people via TV, films, seminars, speeches" },
      { id: "jf_t7_r12", text: "Information engineering, database design, computer programming" },
      { id: "jf_t7_r13", text: "Designing information architecture, such as in website design" },
      { id: "jf_t7_r14", text: "Creating software or similar works" },
      { id: "jf_t7_r15", text: "Designing research experiments to make new discoveries" }
    ]
  },
  {
    category: "Information & Ideas",
    title: "Problem Solving, Researching & Investigating",
    items: [
      { id: "jf_t8_r1", text: "Diagnosing by seeing the relationship between clues" },
      { id: "jf_t8_r2", text: "Analysing by perceiving patterns in data, events, or processes or accurately evaluating information" },
      { id: "jf_t8_r3", text: "Seeing through masses of information to the central principles or most important facts" },
      { id: "jf_t8_r4", text: "Breaking masses of data down into components, analysing" },
      { id: "jf_t8_r5", text: "Synthesizing: combining parts to form a whole" },
      { id: "jf_t8_r6", text: "Systematizing, prioritizing, categorizing, or organizing information" },
      { id: "jf_t8_r7", text: "Deciding what data or information to collect" },
      { id: "jf_t8_r8", text: "Conducting research to develop new ideas, theories" },
      { id: "jf_t8_r9", text: "Researching by observing behaviour or phenomena" },
      { id: "jf_t8_r10", text: "Researching by gathering or compiling information" },
      { id: "jf_t8_r11", text: "Making decisions about the meaning of data or information" }
    ]
  },
  {
    category: "Information & Ideas",
    title: "Reading, Learning & Mastering a Body of Knowledge",
    items: [
      { id: "jf_t9_r1", text: "Reading, learning, gathering information" },
      { id: "jf_t9_r2", text: "Interpreting other people's concepts, ideas" },
      { id: "jf_t9_r3", text: "Adapting information to suit another purpose" },
      { id: "jf_t9_r4", text: "Combining existing ideas or concepts into new ones" },
      { id: "jf_t9_r5", text: "Mastering a specialized body of knowledge, expertise, wisdom, lore" }
    ]
  },
  {
    category: "Information & Ideas",
    title: "Critiquing, Evaluating & Making Recommendations",
    items: [
      { id: "jf_t10_r1", text: "Critiquing other people's ideas" },
      { id: "jf_t10_r2", text: "Critiquing works of art, such as in script reading, book reviews, film reviews" },
      { id: "jf_t10_r3", text: "Critical writing, such as nonfiction, journalism, and science writing" },
      { id: "jf_t10_r4", text: "Technical writing, such as in business, law, technology, medicine, public policy" },
      { id: "jf_t10_r5", text: "Judging, evaluating, or appraising information" },
      { id: "jf_t10_r6", text: "Using physical senses to evaluate information" },
      { id: "jf_t10_r7", text: "Process improvement, making system more efficient" },
      { id: "jf_t10_r8", text: "Risk and opportunity cost analysis" },
      { id: "jf_t10_r9", text: "Making recommendations, providing solutions" },
      { id: "jf_t10_r10", text: "Troubleshooting, debugging, and maintaining software" },
      { id: "jf_t10_r11", text: "Editing to improve content" },
      { id: "jf_t10_r12", text: "Using mathematics, numbers, statistics, working with formulas to evaluate" }
    ]
  },
  {
    category: "Information & Ideas",
    title: "Organizing, Planning & Administrative Activities",
    items: [
      { id: "jf_t11_r1", text: "Organizing information, projects, or events" },
      { id: "jf_t11_r2", text: "Managing projects, setting goals and milestones, budgeting, status reporting" },
      { id: "jf_t11_r3", text: "Planning, strategizing, forecasting" },
      { id: "jf_t11_r4", text: "Translating, interpreting information to another language, medium, or style" },
      { id: "jf_t11_r5", text: "Copyediting to improve grammar, syntax" },
      { id: "jf_t11_r6", text: "Retrieving or finding information, researching, compiling information" },
      { id: "jf_t11_r7", text: "Entering data into a computer, data entry, word processing" },
      { id: "jf_t11_r8", text: "Comparing, proofing" },
      { id: "jf_t11_r9", text: "Accounting, bookkeeping, business mathematics" },
      { id: "jf_t11_r10", text: "Record keeping, storing, filing" }
    ]
  },

  // Page 4: Things & Physical World
  {
    category: "Things & Physical World",
    title: "Problem Solving & Understanding Complex Physical Systems",
    items: [
      { id: "jf_t12_r1", text: "Understanding complex physical systems such as in the physical sciences, medicine, engineering and technology" },
      { id: "jf_t12_r2", text: "Diagnosing and analysing complex mechanical systems, such as a mechanic, engineer, physician, or veterinarian does" },
      { id: "jf_t12_r3", text: "Repairing or improving complex mechanical systems" }
    ]
  },
  {
    category: "Things & Physical World",
    title: "Creating, Designing & Inventing Physical Objects",
    items: [
      { id: "jf_t13_r1", text: "Designing complex physical systems" },
      { id: "jf_t13_r2", text: "Creating new theories, understanding or interpreting physical systems" },
      { id: "jf_t13_r3", text: "Inventing, creating, designing original devices or objects" },
      { id: "jf_t13_r4", text: "Directing films or plays, choreographing scenes, storyboarding" },
      { id: "jf_t13_r5", text: "Creating works of three-dimensional art" }
    ]
  },
  {
    category: "Things & Physical World",
    title: "Evaluating, Critiquing, Fixing & Repairing",
    items: [
      { id: "jf_t14_r1", text: "Evaluating and critiquing physical objects, including food art, design, or the human body" },
      { id: "jf_t14_r2", text: "Appraising and judging physical objects, including food, arts, design or the human body" },
      { id: "jf_t14_r3", text: "Repairing or restoring things, maintaining physical structures" },
      { id: "jf_t14_r4", text: "Assembling" }
    ]
  },
  {
    category: "Things & Physical World",
    title: "Crafting, Beautifying & Using Tools to Produce Objects",
    items: [
      { id: "jf_t15_r1", text: "Sculpting, shaping, tooling" },
      { id: "jf_t15_r2", text: "Crafting (combining artistic and motor skills to fashion things)" },
      { id: "jf_t15_r3", text: "Employing fine hand dexterity (as used by surgeons, dentists, craftsmen, artists, musicians, etc.)" },
      { id: "jf_t15_r4", text: "Precision use of tools" },
      { id: "jf_t15_r5", text: "Manufacturing or mass producing objects" },
      { id: "jf_t15_r6", text: "Cooking, preparing, or displaying food" },
      { id: "jf_t15_r7", text: "Choosing, arranging objects artistically" },
      { id: "jf_t15_r8", text: "Utilizing eye for design, color, texture, or proportion" },
      { id: "jf_t15_r9", text: "Using sensual acuity of sight, sound, smell, taste, or feel" }
    ]
  },
  {
    category: "Things & Physical World",
    title: "Athletics & Manipulating the Human Anatomy",
    items: [
      { id: "jf_t16_r1", text: "Dancing or choreographing dance routines" },
      { id: "jf_t16_r2", text: "Using physical agility, fine sensory-motor skills, strength, and dexterity in athletics and other fields such as law enforcement, firefighting, emergency medicine" },
      { id: "jf_t16_r3", text: "Using spatial visualization for gymnastics, figure skating, diving, and other sports that require visualizing body movements" },
      { id: "jf_t16_r4", text: "Performing stunts or other extreme physical feats" },
      { id: "jf_t16_r5", text: "Massaging, adjusting, touching, hands-on healing" }
    ]
  },
  {
    category: "Things & Physical World",
    title: "Operating Machines & Equipment",
    items: [
      { id: "jf_t17_r1", text: "Operating an airplane, ship or boat, truck or car, motorcycle or bicycle" },
      { id: "jf_t17_r2", text: "Using large tools such as bulldozers and other construction machinery, tanks" },
      { id: "jf_t17_r3", text: "Constructing buildings or other large objects, such as bridges and roads" },
      { id: "jf_t17_r4", text: "Operating, controlling, or guiding machines" },
      { id: "jf_t17_r5", text: "Tending machines" },
      { id: "jf_t17_r6", text: "Fighting, using firearms or other weapons" },
      { id: "jf_t17_r7", text: "Installing" },
      { id: "jf_t17_r8", text: "Cleaning, preparing, washing, dusting" },
      { id: "jf_t17_r9", text: "Moving, storing, warehousing, carrying, lifting, handling" }
    ]
  },
  {
    category: "Things & Physical World",
    title: "Interacting with the Physical World & Nature",
    items: [
      { id: "jf_t18_r1", text: "Navigating, orienteering, pathfinding, exploring" },
      { id: "jf_t18_r2", text: "Farming, gardening, growing or tending plants or animals" },
      { id: "jf_t18_r3", text: "Exploring aspects of the physical environment, nature" },
      { id: "jf_t18_r4", text: "Hunting, trapping, fishing" }
    ]
  }
];

// Helper to group sections by page categories
const PAGES = [
  { name: "People-Oriented (1-on-1)", category: "People-Oriented (One-on-One)" },
  { name: "People-Oriented (Groups)", category: "People-Oriented (Groups & Public)" },
  { name: "Information & Ideas", category: "Information & Ideas" },
  { name: "Things & Physical World", category: "Things & Physical World" }
];

export default function JobFunctionsTest({
  answers,
  setAnswers,
  onSubmit,
  readOnly = false,
}: JobFunctionsTestProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");

  const pageConfig = PAGES[currentPage - 1];
  const pageSections = SECTIONS.filter(s => s.category === pageConfig.category);

  const handleRatingChange = (itemId: string, value: number) => {
    if (readOnly) return;
    setAnswers({ ...answers, [itemId]: value });
    if (error) setError("");
  };

  const handleNext = () => {
    if (!readOnly) {
      // Validate that all items on the current page have been rated
      const unratedItems = pageSections.flatMap(s => s.items).filter(item => answers[item.id] === undefined);
      if (unratedItems.length > 0) {
        setError("Please rate all job functions on this page before proceeding.");
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (currentPage < PAGES.length) {
      setCurrentPage((prev) => prev + 1);
      setError("");
    } else {
      onSubmit();
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">
            Identify Your Job Functions
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Rate the functions that come naturally to you or express what you do best.
          </p>
        </div>
        <div className="text-sm text-slate-350 font-bold bg-slate-950/40 px-4 py-2 border border-white/5 rounded-xl self-start md:self-auto shrink-0">
          Part {currentPage} of {PAGES.length}: <span className="text-amber-400 font-black">{pageConfig.name}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-1.5 bg-slate-950">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
            style={{ width: `${(currentPage / PAGES.length) * 100}%` }}
          />
        </div>

        {/* Rating Guide */}
        <div className="bg-slate-950/40 border-b border-slate-800 p-6">
          <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest mb-3">Rating Scale Guide</h4>
          <div className="grid grid-cols-3 gap-4 text-xs font-medium text-slate-400">
            <div className="flex gap-2 items-center">
              <span className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">1</span>
              <span>Low or no interest at all</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">2-3</span>
              <span>Doubtful / Need to work on it</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">4-5</span>
              <span>Confident / Comes naturally</span>
            </div>
          </div>
        </div>

        {/* Test Questions Container */}
        <div className="p-8 space-y-12">
          {pageSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-md font-extrabold text-slate-200">
                  {sec.title}
                </h3>
              </div>

              <div className="space-y-5">
                {sec.items.map((item, itemIdx) => {
                  const currentValue = answers[item.id];
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl hover:bg-white/2 transition-colors duration-200 border border-transparent hover:border-white/5"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-350 leading-relaxed">
                          <span className="text-slate-600 mr-2">{itemIdx + 1}.</span>
                          {item.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            disabled={readOnly}
                            onClick={() => handleRatingChange(item.id, val)}
                            className={`
                              w-10 h-10 rounded-full border-2 font-bold text-xs flex items-center justify-center transition-all duration-200 cursor-pointer
                              ${
                                currentValue === val
                                  ? val <= 1
                                    ? "border-rose-500 bg-rose-500/20 text-rose-400 scale-110 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                    : val >= 4
                                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                    : "border-amber-500 bg-amber-500/20 text-amber-400 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                  : "border-slate-800 hover:border-slate-600 hover:bg-slate-800 text-slate-500"
                              }
                              ${readOnly ? "cursor-not-allowed opacity-60" : ""}
                            `}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center animate-pulse font-medium text-sm">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between py-4">
        {currentPage > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="px-6 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white hover:shadow-lg transition-all"
          >
            Previous Part
          </button>
        )}

        <button
          type="button"
          onClick={handleNext}
          className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all ml-auto cursor-pointer"
        >
          {currentPage === PAGES.length
            ? readOnly
              ? "Exit Assessment"
              : "Complete Assessment 🚀"
            : "Next Part"}
        </button>
      </div>
    </div>
  );
}

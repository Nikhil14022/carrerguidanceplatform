"use client";

import React, { useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SectionKey = "R" | "I" | "A" | "S" | "E" | "C";

interface SectionData {
  key: SectionKey;
  label: string;
  color: string;           // tailwind ring / border accent
  colorBg: string;         // active-chip bg
  colorText: string;       // active-chip text
  groups: { heading: string; items: string[] }[];
}

interface RIASECResponse {
  R: string[];
  I: string[];
  A: string[];
  S: string[];
  E: string[];
  C: string[];
}

/* ------------------------------------------------------------------ */
/*  Full item data                                                     */
/* ------------------------------------------------------------------ */

const sections: SectionData[] = [
  {
    key: "R",
    label: "Realistic",
    color: "border-red-500 ring-red-500/40",
    colorBg: "bg-red-600/20",
    colorText: "text-red-300",
    groups: [
      {
        heading: "I AM",
        items: [
          "Practical", "Athletic", "Straightforward", "Mechanically inclined",
          "Reliable", "Persistent", "Thrifty", "Genuine",
        ],
      },
      {
        heading: "I CAN",
        items: [
          "Fix, build, or repair things", "Solve mechanical problems",
          "Play a sport", "Read blueprints or diagrams",
          "Operate tools, machinery, or equipment",
          "Use physical strength to accomplish things",
        ],
      },
      {
        heading: "I LIKE TO",
        items: [
          "Tinker with mechanisms", "Be outdoors", "Be physically active",
          "Use my hands", "Build new things", "Work with objects",
          "Care for animals", "Tend plants",
        ],
      },
    ],
  },
  {
    key: "I",
    label: "Investigative",
    color: "border-blue-500 ring-blue-500/40",
    colorBg: "bg-blue-600/20",
    colorText: "text-blue-300",
    groups: [
      {
        heading: "I AM",
        items: [
          "Inquisitive", "Analytical", "Introverted", "Scientific",
          "Independent", "Observant", "Precise", "Intellectual", "Reserved",
        ],
      },
      {
        heading: "I CAN",
        items: [
          "Analyze Data", "Understand scientific theories",
          "Do complex calculations", "Conduct research",
          "Evaluate information", "Chart Data on graphs",
        ],
      },
      {
        heading: "I LIKE TO",
        items: [
          "Explore ideas", "Use Computers", "Work independently",
          "Solve puzzles", "Perform laboratory experiments",
          "Read scientific or technical publications",
          "Study or solve problems",
        ],
      },
    ],
  },
  {
    key: "A",
    label: "Artistic",
    color: "border-purple-500 ring-purple-500/40",
    colorBg: "bg-purple-600/20",
    colorText: "text-purple-300",
    groups: [
      {
        heading: "I AM",
        items: [
          "Creative", "Intuitive", "Introspective", "Innovative",
          "Original", "Idealistic", "Expressive", "Nonconforming",
        ],
      },
      {
        heading: "I CAN",
        items: [
          "Draw, sculpt, or paint",
          "Play a musical instrument, sing, or compose music",
          "Write stories, poems, music, plays, or scripts",
          "Design fashions, objects, graphics, or interiors",
          "Express myself creatively",
          "Perform in front of an audience",
        ],
      },
      {
        heading: "I LIKE TO",
        items: [
          "Attend concerts, movies, theatre, or art exhibitions",
          "Read fiction, plays, or poetry", "Work on crafts",
          "Collect artwork", "Read about art, literature, or music",
          "Take photographs", "Work in unstructured situations",
          "Take an art course",
        ],
      },
    ],
  },
  {
    key: "S",
    label: "Social",
    color: "border-green-500 ring-green-500/40",
    colorBg: "bg-green-600/20",
    colorText: "text-green-300",
    groups: [
      {
        heading: "I AM",
        items: [
          "Helpful", "Insightful", "Outgoing", "Understanding",
          "Trustworthy", "Generous", "Nurturing",
        ],
      },
      {
        heading: "I CAN",
        items: [
          "Teach or train others", "Express myself clearly",
          "Lead a group discussion", "Counsel others", "Mediate disputes",
          "Plan and supervise an activity", "Cooperate well with others",
        ],
      },
      {
        heading: "I LIKE TO",
        items: [
          "Work in groups", "Help people with problems",
          "Participate in meetings", "Volunteer",
          "Work with young people", "Entertain others",
          "Play team sports",
          "Read about psychology, sociology, human relations",
        ],
      },
    ],
  },
  {
    key: "E",
    label: "Enterprising",
    color: "border-amber-500 ring-amber-500/40",
    colorBg: "bg-amber-600/20",
    colorText: "text-amber-300",
    groups: [
      {
        heading: "I AM",
        items: [
          "Self-confident", "Assertive", "Adventuresome", "Persuasive",
          "Enthusiastic", "Ambitious", "Talkative", "Extroverted",
        ],
      },
      {
        heading: "I CAN",
        items: [
          "Persuade people", "Start projects",
          "Sell things or promote ideas", "Give a speech",
          "Organize activities", "Run my own service or business",
          "Lead a group", "Supervise others",
        ],
      },
      {
        heading: "I LIKE TO",
        items: [
          "Make decisions affecting others", "Participate in politics",
          "Excel in leaderships or sales", "Meet important people",
          "Plan activities or meetings", "Read business publications",
          "Belong to groups or clubs",
        ],
      },
    ],
  },
  {
    key: "C",
    label: "Conventional",
    color: "border-teal-500 ring-teal-500/40",
    colorBg: "bg-teal-600/20",
    colorText: "text-teal-300",
    groups: [
      {
        heading: "I AM",
        items: [
          "Methodical", "Accurate", "Careful", "Conscientious",
          "Efficient", "Detail-oriented", "Patient", "Perseverant",
        ],
      },
      {
        heading: "I CAN",
        items: [
          "Work well within a system", "Follow instructions",
          "Set up a record keeping system",
          "Use a computer and/or office machines",
          "Write effective business documents",
          "Organize office products", "Follow a set plan",
        ],
      },
      {
        heading: "I LIKE TO",
        items: [
          "Work with numbers",
          "Check paperwork or products for errors",
          "Work with data", "Follow clearly defined office protocols",
          "Be responsible for details", "Collect and categorize things",
          "Keep accurate records", "Work in an office",
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface RIASECTestProps {
  answers: Record<string, any>;
  setAnswers: (answers: Record<string, any>) => void;
  onSubmit: () => void;
}

const emptyResponse: RIASECResponse = {
  R: [], I: [], A: [], S: [], E: [], C: [],
};

export default function RIASECTest({
  answers,
  setAnswers,
  onSubmit,
}: RIASECTestProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testData: RIASECResponse = answers.__testData ?? { ...emptyResponse };

  const activeSection = sections[currentIndex];
  const activeTab = activeSection.key;

  /* helpers */
  const toggleItem = (section: SectionKey, item: string) => {
    const current = testData[section] ?? [];
    const updated = current.includes(item)
      ? current.filter((i: string) => i !== item)
      : [...current, item];

    const next: RIASECResponse = { ...testData, [section]: updated };
    setAnswers({ ...answers, __testData: next });
  };

  const isChecked = (section: SectionKey, item: string) =>
    (testData[section] ?? []).includes(item);

  const countFor = (key: SectionKey) => (testData[key] ?? []).length;

  const totalChecked = (Object.keys(emptyResponse) as SectionKey[]).reduce(
    (sum, k) => sum + countFor(k),
    0
  );

  /* colour helpers -- we use static class maps so Tailwind can tree-shake */
  const tabColors: Record<SectionKey, { active: string; inactive: string }> = {
    R: { active: "border-red-500 text-red-300",    inactive: "border-transparent text-slate-500" },
    I: { active: "border-blue-500 text-blue-300",   inactive: "border-transparent text-slate-500" },
    A: { active: "border-purple-500 text-purple-300", inactive: "border-transparent text-slate-500" },
    S: { active: "border-green-500 text-green-300",  inactive: "border-transparent text-slate-500" },
    E: { active: "border-amber-500 text-amber-300",  inactive: "border-transparent text-slate-500" },
    C: { active: "border-teal-500 text-teal-300",   inactive: "border-transparent text-slate-500" },
  };

  const barColors: Record<SectionKey, string> = {
    R: "bg-red-500",
    I: "bg-blue-500",
    A: "bg-purple-500",
    S: "bg-green-500",
    E: "bg-amber-500",
    C: "bg-teal-500",
  };

  const barTextColors: Record<SectionKey, string> = {
    R: "text-red-400",
    I: "text-blue-400",
    A: "text-purple-400",
    S: "text-green-400",
    E: "text-amber-400",
    C: "text-teal-400",
  };

  return (
    <div className="space-y-5">
      {/* ---- Step-by-Step progress indicator ---- */}
      <div className="flex overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
        {sections.map((sec, idx) => {
          const isActive = idx === currentIndex;
          const count = countFor(sec.key);
          return (
            <div
              key={sec.key}
              className={`flex-1 min-w-[90px] border-b-2 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide transition-colors ${
                isActive
                  ? tabColors[sec.key].active
                  : "border-transparent text-slate-600"
              }`}
            >
              <span className="block text-base font-bold">{sec.key}</span>
              <span className="block mt-0.5 text-[10px] opacity-70">
                {sec.label}
              </span>
              {count > 0 && (
                <span className="mt-1 inline-block rounded-full bg-indigo-500/20 text-indigo-300 px-2 py-0.5 text-[10px] font-medium">
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ---- Active section content ---- */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className={`text-lg font-bold ${barTextColors[activeTab]}`}>
            {activeSection.label} Interest Area
          </h2>
          <span className="text-xs font-bold text-slate-500">
            Step {currentIndex + 1} of 6
          </span>
        </div>

        {activeSection.groups.map((group) => (
          <div key={group.heading}>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {group.heading}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => {
                const checked = isChecked(activeTab, item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleItem(activeTab, item)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                      checked
                        ? `${activeSection.color} ${activeSection.colorBg} ${activeSection.colorText} ring-1`
                        : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    {checked && (
                      <svg
                        className="mr-1.5 -ml-0.5 inline-block h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ---- Score summary bar ---- */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Score Summary
        </p>
        <div className="grid grid-cols-6 gap-2">
          {(Object.keys(emptyResponse) as SectionKey[]).map((key) => {
            const count = countFor(key);
            const sec = sections.find((s) => s.key === key)!;
            const maxItems = sec.groups.reduce((s, g) => s + g.items.length, 0);
            const pct = maxItems > 0 ? (count / maxItems) * 100 : 0;

            return (
              <div key={key} className="text-center">
                <p className={`text-xs font-bold ${barTextColors[key]}`}>{key}</p>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColors[key]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-300">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Step Navigation Buttons ---- */}
      <div className="flex justify-between gap-4 pt-4">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(prev => prev - 1)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl border font-bold uppercase tracking-wider text-xs transition-colors
            ${currentIndex === 0 
              ? 'border-slate-800 text-slate-600 cursor-not-allowed' 
              : 'border-slate-700 text-slate-300 hover:bg-slate-900 hover:text-white'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        
        {currentIndex < 5 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors shadow-lg shadow-indigo-500/20"
          >
            Continue
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            disabled={totalChecked === 0}
            onClick={onSubmit}
            className={`px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors shadow-lg
              ${totalChecked > 0 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          >
            Submit Assessment
          </button>
        )}
      </div>
    </div>
  );
}

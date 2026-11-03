"use client";

import React, { useState, useMemo } from "react";

interface ColorTestProps {
  answers: Record<string, any>;
  setAnswers: (answers: Record<string, any>) => void;
  onSubmit: () => void;
  readOnly?: boolean;
}

interface SectionQuestion {
  a: string;
  b: string;
}

interface Section {
  title: string;
  instruction: string;
  colALabel: string;
  colBLabel: string;
  questions: SectionQuestion[];
}

interface ColorTestResponse {
  section1: (string | null)[];
  section2: (string | null)[];
  section3: (string | null)[];
  section4: (string | null)[];
  result: string | null;
}

const SECTIONS: Section[] = [
  {
    title: "Section I — How You Take In Information",
    instruction: "At least 51% of the times I tend to... (Choose ONE option per row that best fits you in most situations)",
    colALabel: "Column A",
    colBLabel: "Column B",
    questions: [
      { a: "Value accuracy more (exact facts & precision)", b: "Value insights more (deeper meanings & patterns)" },
      { a: "Be interested in concrete issues (real, practical matters)", b: "Be interested in abstract ideas (concepts & theories)" },
      { a: "Prefer people who speak plainly (direct & literal)", b: "Prefer unusual ways of expression (metaphors & creative style)" },
      { a: "Remember many details (specifics, dates, facts)", b: "Be vague about details (remember the big picture instead)" },
      { a: "Be down to earth (grounded & practical)", b: "Be complex (deep & multi-layered thinker)" },
      { a: "Focus on the present (what is happening right now)", b: "Focus on future possibilities (what could happen next)" },
      { a: "Be valued for my common sense", b: "Be valued for seeing new trends & ideas" },
      { a: "Be realistic and pragmatic (what works in reality)", b: "Be theoretical and imaginative (exploring 'what if')" },
      { a: "Be trusting of the facts (proven evidence)", b: "Be trusting of my intuition (gut feeling & instinct)" },
    ],
  },
  {
    title: "Section II — How You Make Decisions",
    instruction: "At least 51% of the times I tend to... (Choose ONE option per row that best fits you in most situations)",
    colALabel: "Column A",
    colBLabel: "Column B",
    questions: [
      { a: "Frank and direct (say things straight as they are)", b: "Tactful and diplomatic (say things gently to not hurt feelings)" },
      { a: "Skeptical at first (questioning until proven)", b: "Accepting at first (trusting and open initially)" },
      { a: "Unemotional (decide with logic over feelings)", b: "Emotional (guided strongly by feelings)" },
      { a: "Analytical (break problems down logically)", b: "Empathetic (put myself in others' shoes)" },
      { a: "Apt to meet conflict head on (address disagreements directly)", b: "Apt to avoid conflict where possible (keep peace & harmony)" },
      { a: "Principled (stand firm on rules & fairness)", b: "Sympathetic (prioritize care & mercy for people)" },
      { a: "Objective when criticized (take feedback neutrally)", b: "Apt to take things personally (feel hurt by criticism)" },
      { a: "Impartial (treat everyone by the same standard)", b: "Compassionate (adapt based on each person's situation)" },
      { a: "Competitive (driven to win and excel)", b: "Supportive (driven to help and collaborate)" },
    ],
  },
  {
    title: "Section III — How You Organize Your Life & Work",
    instruction: "At least 51% of the times I tend to... (Choose ONE option per row that best fits you in most situations)",
    colALabel: "Column @",
    colBLabel: "Column #",
    questions: [
      { a: "Meet deadlines early (finish well ahead of time)", b: "Meet deadlines at the last minute (work in a final burst)" },
      { a: "Make detailed plans before I start", b: "Handle problems as they arise (improvise on the go)" },
      { a: "Be punctual and sometimes early", b: "Be leisurely, sometimes late" },
      { a: "Like to be scheduled (structured routine)", b: "Prefer to be spontaneous (go with the flow)" },
      { a: "Like clear guidelines (know exact expectations)", b: "Like flexibility (freedom to do things my own way)" },
      { a: "Feel settled (decided and organized)", b: "Often feel restless (looking for change or variety)" },
      { a: "Have a tidy workplace (everything in its place)", b: "Have a workplace with many piles/papers" },
      { a: "Be deliberate (careful, planned, and methodical)", b: "Be carefree (relaxed and easygoing)" },
      { a: "Like to make plans in advance", b: "Like to wait and see what happens" },
    ],
  },
  {
    title: "Section IV — How You Interact & Recharge Energy",
    instruction: "At least 51% of the times I tend to... (Choose ONE option per row that best fits you in most situations)",
    colALabel: "Column (e)",
    colBLabel: "Column (i)",
    questions: [
      { a: "Like to talk and express thoughts out loud", b: "Prefer to listen and process internally" },
      { a: "Become bored when alone too much", b: "Need time alone to recharge batteries" },
      { a: "Prefer to work with a group or team", b: "Prefer to work alone or one-on-one" },
      { a: "Speak first—then reflect", b: "Reflect first—then speak" },
      { a: "Be more interactive & energetic in groups", b: "Be more reflective and thoughtful" },
      { a: "Know a little about many topics", b: "Know a few topics in depth" },
      { a: "Initiate conversations at social gatherings", b: "Wait to be approached at social gatherings" },
    ],
  },
];

function computeResult(data: ColorTestResponse): string | null {
  const countChoices = (arr: (string | null)[], val: string) =>
    arr.filter((v) => v === val).length;

  const s1a = countChoices(data.section1, "a");
  const s1b = countChoices(data.section1, "b");
  const s2a = countChoices(data.section2, "a");
  const s2b = countChoices(data.section2, "b");
  const s3a = countChoices(data.section3, "a");
  const s3b = countChoices(data.section3, "b");
  const s4a = countChoices(data.section4, "a");
  const s4b = countChoices(data.section4, "b");

  // Section 1 determines which pair to use for primary/secondary
  let primaryColor: string;
  let secondaryColor: string;

  if (s1a >= s1b) {
    // More A in Section 1 -> Section 3 logic for primary
    primaryColor = s3a >= s3b ? "Gold" : "Red";
    // Section 2 for secondary
    secondaryColor = s2a >= s2b ? "Blue" : "Green";
  } else {
    // More B in Section 1 -> Section 2 logic for primary
    primaryColor = s2a >= s2b ? "Blue" : "Green";
    // Section 3 for secondary
    secondaryColor = s3a >= s3b ? "Gold" : "Red";
  }

  // Section 4: E/I
  const ei = s4a >= s4b ? "Extrovert" : "Introvert";

  return `${primaryColor} ${secondaryColor} ${ei}`;
}

export default function ColorTest({ answers, setAnswers, onSubmit, readOnly = false }: ColorTestProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const testData: ColorTestResponse = answers.__testData ?? {
    section1: Array(9).fill(null),
    section2: Array(9).fill(null),
    section3: Array(9).fill(null),
    section4: Array(7).fill(null),
  };

  const updateTestData = (updated: ColorTestResponse) => {
    setAnswers({ ...answers, __testData: updated });
  };

  const sectionKeys: (keyof Pick<ColorTestResponse, "section1" | "section2" | "section3" | "section4">)[] = [
    "section1",
    "section2",
    "section3",
    "section4",
  ];

  const handleSelect = (questionIndex: number, choice: "a" | "b") => {
    if (readOnly) return;
    const key = sectionKeys[currentSection];
    const sectionArr = [...testData[key]];
    sectionArr[questionIndex] = choice;
    updateTestData({ ...testData, [key]: sectionArr });
  };

  const currentSectionData = SECTIONS[currentSection];
  const currentKey = sectionKeys[currentSection];
  const currentAnswers = testData[currentKey];

  const sectionComplete = currentAnswers.every((v) => v !== null);
  const allComplete =
    testData.section1.every((v) => v !== null) &&
    testData.section2.every((v) => v !== null) &&
    testData.section3.every((v) => v !== null) &&
    testData.section4.every((v) => v !== null);

  const result = useMemo(() => {
    if (!allComplete) return null;
    return computeResult(testData);
  }, [allComplete, testData]);

  const handleNext = () => {
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
    } else if (allComplete) {
      handleFinalSubmit();
    }
  };

  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleFinalSubmit = () => {
    if (readOnly) {
      onSubmit();
      return;
    }
    const finalResult = computeResult(testData);
    updateTestData({ ...testData, result: finalResult });
    onSubmit();
  };

  // Color mapping for result display
  const colorMap: Record<string, string> = {
    Gold: "bg-yellow-500",
    Red: "bg-red-500",
    Blue: "bg-blue-500",
    Green: "bg-green-500",
  };

  if (showResult && result) {
    const parts = result.split(" ");
    const primary = parts[0];
    const secondary = parts[1];
    const orientation = parts[2];

    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-lg w-full bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
          <h2 className="text-2xl font-bold text-center mb-6">Your Color Personality Result</h2>

          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <div
                className={`w-20 h-20 rounded-full ${colorMap[primary] ?? "bg-gray-500"} mx-auto mb-2 shadow-lg`}
              />
              <p className="text-sm font-semibold text-gray-300">Primary</p>
              <p className="text-lg font-bold">{primary}</p>
            </div>
            <span className="text-gray-500 text-2xl">+</span>
            <div className="text-center">
              <div
                className={`w-20 h-20 rounded-full ${colorMap[secondary] ?? "bg-gray-500"} mx-auto mb-2 shadow-lg`}
              />
              <p className="text-sm font-semibold text-gray-300">Secondary</p>
              <p className="text-lg font-bold">{secondary}</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <span className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-full text-lg font-semibold">
              {orientation}
            </span>
          </div>

          <p className="text-center text-gray-400 mb-6 text-sm">
            Your personality combination is{" "}
            <span className="text-white font-semibold">{result}</span>.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleFinalSubmit}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
            >
              {readOnly ? "Exit" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center p-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8 mt-4">
        {SECTIONS.map((sec, i) => (
          <React.Fragment key={i}>
            <button
              onClick={() => setCurrentSection(i)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i === currentSection
                  ? "bg-indigo-600 text-white"
                  : i < currentSection
                  ? "bg-indigo-800 text-indigo-200"
                  : "bg-gray-800 text-gray-500"
              }`}
            >
              {i + 1}
            </button>
            {i < SECTIONS.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  i < currentSection ? "bg-indigo-600" : "bg-gray-800"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="max-w-2xl w-full">
        {/* Detailed Instructions Banner */}
        <div className="mb-6 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
            <span>🎨</span> Instructions — How to Complete the Colour Test
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            For each row below, compare the two statements and <strong>select ONE option from either column</strong> — the one which you tend to be or do <strong>at least 51% of the times</strong> in most situations with most people.
          </p>
          <p className="text-[11px] text-slate-400 italic">
            Tip: Even if both statements sometimes apply to you, pick the one that comes more naturally to you (51% vs 49%). Every row requires one selection.
          </p>
        </div>

        {/* Section header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-1">{currentSectionData.title}</h2>
          <p className="text-gray-400 italic text-sm">{currentSectionData.instruction}</p>
          <div className="flex justify-between mt-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>{currentSectionData.colALabel}</span>
            <span>{currentSectionData.colBLabel}</span>
          </div>
        </div>

        {/* Question cards */}
        <div className="space-y-3">
          {currentSectionData.questions.map((q, qIdx) => {
            const selected = currentAnswers[qIdx];
            return (
              <div
                key={qIdx}
                className="flex gap-3"
              >
                <button
                  onClick={() => !readOnly && handleSelect(qIdx, "a")}
                  disabled={readOnly}
                  className={`flex-1 p-4 rounded-xl text-left text-sm font-medium transition-all border ${
                    selected === "a"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                      : "bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-800"
                  } ${readOnly ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <span className="text-xs text-gray-500 mr-2">{qIdx + 1}.</span>
                  {q.a}
                </button>
                <button
                  onClick={() => !readOnly && handleSelect(qIdx, "b")}
                  disabled={readOnly}
                  className={`flex-1 p-4 rounded-xl text-left text-sm font-medium transition-all border ${
                    selected === "b"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                      : "bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-800"
                  } ${readOnly ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {q.b}
                </button>
              </div>
            );
          })}
        </div>

        {/* Client / Counsellor Notes Section */}
        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400">
            Add Notes / Additional Thoughts for Colour Test (Optional)
          </label>
          <textarea
            value={answers.__clientNotes || ""}
            disabled={readOnly}
            rows={3}
            spellCheck={true}
            autoCorrect="on"
            placeholder="Write any additional notes or thoughts about your choices here..."
            onChange={(e) => setAnswers({ ...answers, __clientNotes: e.target.value })}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 resize-y"
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {currentSection > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!sectionComplete}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
              sectionComplete
                ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            {currentSection < SECTIONS.length - 1 ? "Next" : "Submit"}
          </button>
        </div>

        {/* Section completion hint */}
        {!sectionComplete && (
          <p className="text-center text-gray-600 text-xs mt-3">
            Answer all questions in this section to continue.
          </p>
        )}
      </div>
    </div>
  );
}

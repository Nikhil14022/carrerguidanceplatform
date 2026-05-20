"use client";

import React, { useState, useMemo } from "react";

interface ColorTestProps {
  answers: Record<string, any>;
  setAnswers: (answers: Record<string, any>) => void;
  onSubmit: () => void;
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
    title: "Section I",
    instruction: "At least 51% of the times I tend to...",
    colALabel: "Column A",
    colBLabel: "Column B",
    questions: [
      { a: "Value accuracy more", b: "Value insights more" },
      { a: "Be interested in concrete issues", b: "Be interested in abstract ideas" },
      { a: "Prefer people who speak plainly", b: "Prefer unusual ways of expression" },
      { a: "Remember many details", b: "Be vague about details" },
      { a: "Be down to earth", b: "Be complex" },
      { a: "Focus on the present", b: "Focus on future possibilities" },
      { a: "Be valued for my common sense", b: "Be valued for seeing new trends" },
      { a: "Be realistic and pragmatic", b: "Be theoretical and imaginative" },
      { a: "Be trusting of the facts", b: "Be trusting of my intuition" },
    ],
  },
  {
    title: "Section II",
    instruction: "At least 51% of the times I tend to...",
    colALabel: "Column A",
    colBLabel: "Column B",
    questions: [
      { a: "Frank and direct", b: "Tactful and diplomatic" },
      { a: "Skeptical at first", b: "Accepting at first" },
      { a: "Unemotional", b: "Emotional" },
      { a: "Analytical", b: "Empathetic" },
      { a: "Apt to meet conflict head on", b: "Apt to avoid conflict where possible" },
      { a: "Principled", b: "Sympathetic" },
      { a: "Objective when criticized", b: "Apt to take things personally" },
      { a: "Impartial", b: "Compassionate" },
      { a: "Competitive", b: "Supportive" },
    ],
  },
  {
    title: "Section III",
    instruction: "At least 51% of the times I tend to...",
    colALabel: "Column @",
    colBLabel: "Column #",
    questions: [
      { a: "Meet deadlines early", b: "Meet deadlines at the last minute" },
      { a: "Make detailed plans before I start", b: "Handle problems as they arise" },
      { a: "Be punctual and sometimes early", b: "Be leisurely, sometimes late" },
      { a: "Like to be scheduled", b: "Prefer to be spontaneous" },
      { a: "Like clear guidelines", b: "Like flexibility" },
      { a: "Feel settled", b: "Often feel restless" },
      { a: "Have a tidy workplace", b: "Have a workplace with many piles/papers" },
      { a: "Be deliberate", b: "Be carefree" },
      { a: "Like to make plans", b: "Like to wait and see" },
    ],
  },
  {
    title: "Section IV",
    instruction: "At least 51% of the times I tend to...",
    colALabel: "Column (e)",
    colBLabel: "Column (i)",
    questions: [
      { a: "Like to talk", b: "Prefer to listen" },
      { a: "Become bored when alone too much", b: "Need time alone to recharge batteries" },
      { a: "Prefer to work with a group", b: "Prefer to work alone or with one another" },
      { a: "Speak first\u2014then reflect", b: "Reflect first\u2014then speak" },
      { a: "Be more interactive & energetic", b: "Be more reflective and thoughtful" },
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

export default function ColorTest({ answers, setAnswers, onSubmit }: ColorTestProps) {
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
      const finalResult = computeResult(testData);
      updateTestData({ ...testData, result: finalResult });
      setShowResult(true);
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
              Submit
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
        {/* Section header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-1">{currentSectionData.title}</h2>
          <p className="text-gray-400 italic">{currentSectionData.instruction}</p>
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
                  onClick={() => handleSelect(qIdx, "a")}
                  className={`flex-1 p-4 rounded-xl text-left text-sm font-medium transition-all border ${
                    selected === "a"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                      : "bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-800"
                  }`}
                >
                  <span className="text-xs text-gray-500 mr-2">{qIdx + 1}.</span>
                  {q.a}
                </button>
                <button
                  onClick={() => handleSelect(qIdx, "b")}
                  className={`flex-1 p-4 rounded-xl text-left text-sm font-medium transition-all border ${
                    selected === "b"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                      : "bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-800"
                  }`}
                >
                  {q.b}
                </button>
              </div>
            );
          })}
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
            {currentSection < SECTIONS.length - 1 ? "Next" : "See Result"}
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

"use client";

import React, { useState } from "react";
import questionsData from "../../data/pf16_questions.json";

interface PF16Question {
  id: string;
  type: "statement" | "pair";
  text?: string;
  left?: string;
  right?: string;
}

const pf16_questions: PF16Question[] = questionsData as PF16Question[];

// 129 questions. ~13 questions per page makes 10 pages perfectly.
const QUESTIONS_PER_PAGE = 13;
const TOTAL_PAGES = Math.ceil(pf16_questions.length / QUESTIONS_PER_PAGE);

const STATEMENT_SCALE_LABELS = [
  { val: 1, label: "Strongly Disagree" },
  { val: 2, label: "Disagree" },
  { val: 3, label: "Slightly Disagree" },
  { val: 4, label: "Slightly Agree" },
  { val: 5, label: "Agree" },
  { val: 6, label: "Strongly Agree" },
];

const PAIR_SCALE_LABELS = [
  { val: 1, label: "Strongly Left" },
  { val: 2, label: "Mostly Left" },
  { val: 3, label: "Slightly Left" },
  { val: 4, label: "Slightly Right" },
  { val: 5, label: "Mostly Right" },
  { val: 6, label: "Strongly Right" },
];

interface PersonalityFactorsTestProps {
  answers: Record<string, any>;
  setAnswers: (answers: Record<string, any>) => void;
  onSubmit: () => void;
  readOnly?: boolean;
}

export default function PersonalityFactorsTest({
  answers,
  setAnswers,
  onSubmit,
  readOnly = false,
}: PersonalityFactorsTestProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");

  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const currentQuestions = pf16_questions.slice(
    startIndex,
    startIndex + QUESTIONS_PER_PAGE
  );

  const handleAnswerChange = (qId: string, value: number) => {
    if (readOnly) return;
    setAnswers({ ...answers, [qId]: value });
    if (error) setError("");
  };

  const handleNext = () => {
    // Validate current page
    if (!readOnly) {
      const allAnswered = currentQuestions.every((q) => answers[q.id] !== undefined);
      if (!allAnswered) {
        setError("Please answer all questions on this page before continuing.");
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (currentPage < TOTAL_PAGES) {
      setCurrentPage((prev) => prev + 1);
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

  const answeredCount = pf16_questions.filter((q) => answers[q.id] !== undefined).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            16 Personality Factors Questionnaire
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Answered {answeredCount} of {pf16_questions.length} statements
          </p>
        </div>
        <div className="text-sm text-slate-300 font-bold bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          Page {currentPage} of {TOTAL_PAGES}
        </div>
      </div>

      {/* Clear Guided Instructions Banner */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 space-y-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
          📋 Instructions — How to Answer
        </h3>
        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside leading-relaxed">
          <li>
            <strong>Statements (Q1–Q105):</strong> Read each statement and select how accurately it describes you in everyday life — from <strong>1 (Strongly Disagree / Not Like Me)</strong> to <strong>6 (Strongly Agree / Very Much Like Me)</strong>.
          </li>
          <li>
            <strong>Paired Choices (Q106–Q129):</strong> Compare the statement on the <strong>Left</strong> with the statement on the <strong>Right</strong>, and select which side describes you better (1–3 leans Left, 4–6 leans Right).
          </li>
          <li>
            There are no right or wrong answers — answer honestly based on who you naturally are.
          </li>
        </ul>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-800">
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${(currentPage / TOTAL_PAGES) * 100}%` }}
          />
        </div>

        <div className="p-6 md:p-8 space-y-10">
          {currentQuestions.map((q, index) => {
            const num = startIndex + index + 1;
            const currentVal = answers[q.id];

            return (
              <div key={q.id} className="group pb-8 border-b border-slate-800/70 last:border-b-0 last:pb-0">
                {q.type === "statement" ? (
                  <div className="space-y-4">
                    <p className="text-base md:text-lg text-slate-100 font-semibold leading-relaxed">
                      <span className="text-indigo-400 font-bold mr-2">{num}.</span> {q.text}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                      {STATEMENT_SCALE_LABELS.map(({ val, label }) => {
                        const isSelected = currentVal === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            disabled={readOnly}
                            onClick={() => !readOnly && handleAnswerChange(q.id, val)}
                            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40 shadow-md"
                                : "border-slate-800 bg-slate-950 hover:border-indigo-400/50 hover:bg-slate-800/60 text-slate-400"
                            } ${readOnly ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                          >
                            <span className={`text-sm font-extrabold ${isSelected ? "text-indigo-300" : "text-slate-300"}`}>
                              {val}
                            </span>
                            <span className="text-[10px] leading-tight mt-1 font-medium">
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-indigo-400 uppercase tracking-wider font-bold">
                      <span className="mr-1">Question {num}:</span> Which statement describes you better?
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm md:text-base text-slate-100 font-semibold">
                        <span className="block text-[10px] uppercase tracking-wider text-indigo-400 font-bold mb-1">Left Statement (1–3)</span>
                        {q.left}
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm md:text-base text-slate-100 font-semibold">
                        <span className="block text-[10px] uppercase tracking-wider text-purple-400 font-bold mb-1">Right Statement (4–6)</span>
                        {q.right}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                      {PAIR_SCALE_LABELS.map(({ val, label }) => {
                        const isSelected = currentVal === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            disabled={readOnly}
                            onClick={() => !readOnly && handleAnswerChange(q.id, val)}
                            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                              isSelected
                                ? "border-purple-500 bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40 shadow-md"
                                : "border-slate-800 bg-slate-950 hover:border-purple-400/50 hover:bg-slate-800/60 text-slate-400"
                            } ${readOnly ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                          >
                            <span className={`text-sm font-extrabold ${isSelected ? "text-purple-300" : "text-slate-300"}`}>
                              {val}
                            </span>
                            <span className="text-[10px] leading-tight mt-1 font-medium">
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Notes / Observations Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
          Add Notes / Additional Thoughts for 16PF (Optional)
        </label>
        <textarea
          value={answers.__clientNotes || ""}
          disabled={readOnly}
          rows={3}
          spellCheck={true}
          autoCorrect="on"
          placeholder="Add any personal notes, questions, or counsellor observations here..."
          onChange={(e) => setAnswers({ ...answers, __clientNotes: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-y"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between py-4">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage === 1}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            currentPage === 1
              ? "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
              : "bg-slate-800 hover:bg-slate-700 text-white hover:shadow-lg"
          }`}
        >
          Previous Page
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all ml-auto"
        >
          {currentPage === TOTAL_PAGES ? (readOnly ? "Exit Assessment" : "Complete Assessment 🚀") : "Next Page"}
        </button>
      </div>
    </div>
  );
}

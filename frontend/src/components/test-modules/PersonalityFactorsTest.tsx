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

    window.scrollTo({ top: 0, behavior: 'smooth' });
    
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          16 Personality Factors Test
        </h2>
        <div className="text-sm text-slate-400 font-medium">
          Page {currentPage} of {TOTAL_PAGES}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Progress Bar */}
        <div className="h-1 bg-slate-800">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${(currentPage / TOTAL_PAGES) * 100}%` }}
          />
        </div>

        <div className="p-8 space-y-12">
          {currentQuestions.map((q, index) => {
            const num = startIndex + index + 1;
            const currentVal = answers[q.id];

            return (
              <div key={q.id} className="group">
                {q.type === 'statement' ? (
                  <div className="space-y-6">
                    <p className="text-lg text-slate-200 group-hover:text-indigo-200 transition-colors font-medium">
                      <span className="text-slate-500 mr-2">{num}.</span> {q.text}
                    </p>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2 max-w-3xl mx-auto w-full">
                          <span className="text-sm font-medium text-red-400/80 w-24 text-right">Inaccurate</span>
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              disabled={readOnly}
                              onClick={() => !readOnly && handleAnswerChange(q.id, val)}
                              className={`
                                relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200
                                ${
                                  currentVal === val
                                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-400 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                    : "border-slate-700 hover:border-indigo-400/50 hover:bg-slate-800 text-slate-500"
                                } ${readOnly ? "cursor-not-allowed opacity-60" : ""}
                              `}
                            >
                              <div className={`w-3 h-3 rounded-full transition-all ${currentVal === val ? 'bg-indigo-400' : 'bg-transparent'}`} />
                            </button>
                          ))}
                          <span className="text-sm font-medium text-emerald-400/80 w-24">Accurate</span>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm text-slate-500 mb-2 uppercase tracking-wider font-bold">
                      <span className="mr-2">{num}.</span> Choose your preference
                    </p>
                    <div className="flex items-center justify-between gap-6 w-full">
                        <div className="flex-1 text-right text-lg text-slate-300 font-medium group-hover:text-purple-200 transition-colors">{q.left}</div>
                        <div className="flex gap-3 shrink-0">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              disabled={readOnly}
                              onClick={() => !readOnly && handleAnswerChange(q.id, val)}
                              className={`
                                relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200
                                ${
                                  currentVal === val
                                    ? "border-purple-500 bg-purple-500/20 text-purple-400 scale-110 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                    : "border-slate-700 hover:border-purple-400/50 hover:bg-slate-800 text-slate-500"
                                } ${readOnly ? "cursor-not-allowed opacity-60" : ""}
                              `}
                            >
                              <div className={`w-3 h-3 rounded-full transition-all ${currentVal === val ? 'bg-purple-400' : 'bg-transparent'}`} />
                            </button>
                          ))}
                        </div>
                        <div className="flex-1 text-left text-lg text-slate-300 font-medium group-hover:text-purple-200 transition-colors">{q.right}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center animate-pulse">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between py-4">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            currentPage === 1
              ? "bg-slate-800 text-slate-600 cursor-not-allowed hidden"
              : "bg-slate-800 hover:bg-slate-700 text-white hover:shadow-lg"
          }`}
        >
          Previous Page
        </button>
        
        <button
          onClick={handleNext}
          className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all ml-auto"
        >
          {currentPage === TOTAL_PAGES ? (readOnly ? "Exit Assessment" : "Complete Assessment 🚀") : "Next Page"}
        </button>
      </div>
    </div>
  );
}

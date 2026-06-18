"use client";

import React, { useState, useMemo, useCallback } from "react";

type ValueGenre = "Personal" | "Social" | "Achievement" | "Physical";
type ValueCategory = "Ideal" | "Standard" | "Want & Preference";

interface ValuesResponse {
  selected: Record<ValueGenre, string[]>;
  ranked: string[];
  categorized: Record<string, ValueCategory>;
}

interface ValuesTestProps {
  answers: Record<string, any>;
  setAnswers: (answers: Record<string, any>) => void;
  onSubmit: () => void;
  readOnly?: boolean;
}

const MAX_PER_GENRE = 5;
const TOTAL_REQUIRED = 20;
const TOP_N = 10;

const VALUE_LISTS: Record<ValueGenre, string[]> = {
  Personal: [
    "Accepting", "Deliberate/Intentional", "Level-Headed/Balanced", "See the big picture",
    "Adventure", "Do the right thing", "Look Good/Appearance", "Seek Truth",
    "Aliveness", "Do what you should do", "Loyalty/Dutiful", "Self-Development",
    "Autonomy", "Empathy", "Mastery/Learning", "Self-Discipline",
    "Be extraordinary", "Excellence", "Objectivity/Logical", "Self-Awareness",
    "Be light", "Factual/Literal", "Open-Mindedness", "Subjectivity",
    "Careful/Cautious", "Feel Good", "Play by the rules", "Tactful",
    "Caring/Understanding", "Frankness", "Play it safe", "Tradition",
    "Change Agent/Catalyst", "Friendship", "Playfulness", "Truthfulness",
    "Cleverness", "Fulfilment/Joy/fun", "Practical", "Use my natural talents",
    "Compassion", "Honesty/Integrity/Trust", "Respect", "Wisdom/Wit",
    "Creativity/Innovation", "Independent/Solo", "Responsibility", "Work first, play later",
    "Critical Thinking", "Justice/Rules/Order", "Say it like it is", "Work is play",
    "Curiosity", "Leadership", "Security/Stability",
  ],
  Social: [
    "Alternative", "Forgiveness", "Meritocracy", "Seek Cooperation",
    "Be in control", "Freedom", "Moderate/Fairly sensible", "Seek Partnership",
    "Be who you are", "Getting Ahead", "My way or the highway", "Sexually Expressive",
    "Belong to the group", "Global Minded", "No kids by choice", "Social Responsibility",
    "Bend in, be accepted", "Have less/Have more", "Obey higher authority", "Social Status",
    "Benefit from", "Independent", "Obey inner authority", "Supremacy",
    "Challenge the status quo", "Intellectual", "Passion", "Systems Thinking",
    "Companionship", "Interdependence", "Patriotism", "Take care of others",
    "Conservative/Traditional", "Intuitive/Think outside the box", "Practical Minded", "Take care of your own",
    "Democracy", "Keep things the same", "Progressive Morals", "Team Spirit/Tribal",
    "Diversity", "Keep up with the joneses", "Punishment", "The strong deserves the most",
    "Empowerment", "Liberal/Free-thinking", "Rational/Logical", "Tolerance of differences",
    "Equality", "Local Minded", "Seek Authority", "Traditional Morals",
    "Family/Marriage/Children", "Meaningful", "Seek Competition",
  ],
  Achievement: [
    "Analysis", "Enlightenment", "Make a difference", "Reliability",
    "Be Happy", "Entrepreneurship", "Make a history", "Serve mankind",
    "Be Masterful", "Fame", "Make lots of money", "Shift a paradigm",
    "Be the best", "Finish what you start", "Make others look good", "Simplify",
    "Be world class", "Happiness is a way of life", "Make the world better", "Solving problems",
    "Big changes start small", "Happiness is earned", "New possibilities", "Spiritual Development",
    "Change the world", "Have the most", "Obey, get rewarded", "Start a revolution",
    "Daring", "Humour", "One step at a time", "Stick to things",
    "Depend on others", "Improve/Enhance", "Overcome the odds", "Making things work together as one",
    "Disobey", "Interdependence", "Peace", "Take a stand",
    "Do more with less", "Invent/Create", "Perseverance", "Usefulness",
    "Do something important", "Leave a legacy", "Personal comfort", "Work Hard",
    "Do what it takes", "Live to the fullest", "Philanthropy", "Work Smart",
    "Efficiency", "Make a contribution", "Quality",
  ],
  Physical: [
    "Adventure", "Elegance", "More is better", "Seek quality",
    "Aesthetics", "Entitled/Get my share", "Natural", "Seek quantity",
    "Artful", "Fairness", "Nature", "Simple living",
    "Beauty", "Fashionable", "Noisy/Busy", "Small is beautiful",
    "Bigger is better", "Financial security", "Organic", "Solitude/Privacy",
    "Bright/Sunny", "Fix broken things", "Plain/Simple", "Stylish",
    "Casual", "Functional", "Pleasure/Sensuality", "Success symbols",
    "Classical Methods", "Get what I deserve", "Rural", "Survive",
    "Close to home", "Holistic", "Safety", "Sustainability",
    "Comfort", "I will show them", "Saving/Investment", "Unique",
    "Conserve", "Interesting experiences", "See new places", "Urban",
    "Die with the most things", "Luxury", "Seek conservation", "Utilitarian (beneficial)",
    "Dominate", "Maximise wealth", "Seek development", "Wealth",
    "Ecological", "Modern",
  ],
};

const GENRES: ValueGenre[] = ["Personal", "Social", "Achievement", "Physical"];

const CATEGORY_DESCRIPTIONS: Record<ValueCategory, string> = {
  Ideal: "A core principle you aspire to live by",
  Standard: "A non-negotiable baseline you hold yourself to",
  "Want & Preference": "Something you desire or prefer but can be flexible on",
};

function getInitialData(answers: Record<string, any>): ValuesResponse {
  const existing = answers.__testData as ValuesResponse | undefined;
  if (existing) return existing;
  return {
    selected: { Personal: [], Social: [], Achievement: [], Physical: [] },
    ranked: [],
    categorized: {},
  };
}

export default function ValuesTest({ answers, setAnswers, onSubmit, readOnly = false }: ValuesTestProps) {
  const [step, setStep] = useState(1);
  const data = useMemo(() => getInitialData(answers), [answers]);

  const persist = useCallback(
    (next: ValuesResponse) => {
      setAnswers({ ...answers, __testData: next });
    },
    [answers, setAnswers]
  );

  const totalSelected = useMemo(
    () => GENRES.reduce((sum, g) => sum + data.selected[g].length, 0),
    [data.selected]
  );

  const allSelectedValues = useMemo(
    () => GENRES.flatMap((g) => data.selected[g]),
    [data.selected]
  );

  // ---- Step 1 handlers ----
  const toggleValue = (genre: ValueGenre, value: string) => {
    if (readOnly) return;
    const current = data.selected[genre];
    let next: string[];
    if (current.includes(value)) {
      next = current.filter((v) => v !== value);
    } else {
      if (current.length >= MAX_PER_GENRE) return;
      next = [...current, value];
    }
    const updated: ValuesResponse = {
      ...data,
      selected: { ...data.selected, [genre]: next },
      // If selection changed, clear downstream data that may be stale
      ranked: data.ranked.filter(
        (v) =>
          (genre === GENRES.find((g) => data.selected[g].includes(v))
            ? next.includes(v)
            : true) || GENRES.some((g) => g !== genre && data.selected[g].includes(v)) || next.includes(v)
      ),
    };
    // Simpler: just keep ranked items that are still in the full selected set
    const allNext = GENRES.flatMap((g) =>
      g === genre ? next : data.selected[g]
    );
    updated.ranked = data.ranked.filter((v) => allNext.includes(v));
    // Remove categorized entries for values no longer ranked
    const rankedSet = new Set(updated.ranked);
    const nextCategorized: Record<string, ValueCategory> = {};
    for (const [k, v] of Object.entries(data.categorized)) {
      if (rankedSet.has(k)) nextCategorized[k] = v;
    }
    updated.categorized = nextCategorized;
    persist(updated);
  };

  // ---- Step 2 handlers ----
  const toggleRank = (value: string) => {
    if (readOnly) return;
    const idx = data.ranked.indexOf(value);
    let nextRanked: string[];
    if (idx !== -1) {
      nextRanked = data.ranked.filter((v) => v !== value);
    } else {
      if (data.ranked.length >= TOP_N) return;
      nextRanked = [...data.ranked, value];
    }
    const rankedSet = new Set(nextRanked);
    const nextCategorized: Record<string, ValueCategory> = {};
    for (const [k, v] of Object.entries(data.categorized)) {
      if (rankedSet.has(k)) nextCategorized[k] = v;
    }
    persist({ ...data, ranked: nextRanked, categorized: nextCategorized });
  };

  // ---- Step 3 handlers ----
  const setCategoryForValue = (value: string, cat: ValueCategory) => {
    if (readOnly) return;
    persist({
      ...data,
      categorized: { ...data.categorized, [value]: cat },
    });
  };

  const canProceedStep1 = totalSelected === TOTAL_REQUIRED;
  const canProceedStep2 = data.ranked.length === TOP_N;
  const canSubmitStep3 = data.ranked.every((v) => data.categorized[v] !== undefined);

  // ---- Render helpers ----

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              s === step
                ? "bg-indigo-600 text-white"
                : s < step
                ? "bg-indigo-500/30 text-indigo-300"
                : "bg-slate-800 text-slate-500"
            }`}
          >
            {s}
          </div>
          {s < 3 && (
            <div
              className={`w-12 h-0.5 ${
                s < step ? "bg-indigo-500/50" : "bg-slate-700"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-1">Select Your Values</h2>
        <p className="text-slate-400 text-sm">
          Choose exactly 5 values from each genre ({totalSelected}/{TOTAL_REQUIRED} selected)
        </p>
      </div>

      {GENRES.map((genre) => {
        const count = data.selected[genre].length;
        return (
          <div key={genre}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-indigo-300">{genre} Values</h3>
              <span
                className={`text-sm font-medium ${
                  count === MAX_PER_GENRE ? "text-green-400" : "text-slate-400"
                }`}
              >
                {count}/{MAX_PER_GENRE} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {VALUE_LISTS[genre].map((value) => {
                const isSelected = data.selected[genre].includes(value);
                const isDisabled = !isSelected && count >= MAX_PER_GENRE;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={isDisabled || readOnly}
                    onClick={() => !readOnly && toggleValue(genre, value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-indigo-600/40 border-indigo-500 text-indigo-200"
                        : (isDisabled || readOnly)
                        ? "bg-slate-800/50 border-slate-700/50 text-slate-600 cursor-not-allowed"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-500/50 hover:text-indigo-200"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-1">Rank Your Top 10</h2>
        <p className="text-slate-400 text-sm">
          Click values in order of importance. 1st click = most important. ({data.ranked.length}/{TOP_N} ranked)
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {allSelectedValues.map((value) => {
          const rankIdx = data.ranked.indexOf(value);
          const isRanked = rankIdx !== -1;
          const isFull = data.ranked.length >= TOP_N && !isRanked;
          return (
            <button
              key={value}
              type="button"
              disabled={isFull || readOnly}
              onClick={() => !readOnly && toggleRank(value)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                isRanked
                  ? "bg-indigo-600/40 border-indigo-500 text-indigo-200"
                  : (isFull || readOnly)
                  ? "bg-slate-800/50 border-slate-700/50 text-slate-600 cursor-not-allowed"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-500/50 hover:text-indigo-200"
              }`}
            >
              {isRanked && (
                <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {rankIdx + 1}
                </span>
              )}
              {value}
            </button>
          );
        })}
      </div>

      {data.ranked.length > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Current Ranking</h4>
          <ol className="list-decimal list-inside space-y-1">
            {data.ranked.map((v, i) => (
              <li key={v} className="text-sm text-slate-400">
                <span className="text-indigo-300">{v}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-1">Categorize Your Top 10</h2>
        <p className="text-slate-400 text-sm">
          Assign a category to each of your ranked values.
        </p>
      </div>

      <div className="space-y-4">
        {data.ranked.map((value, i) => {
          const current = data.categorized[value];
          return (
            <div
              key={value}
              className="p-4 rounded-lg bg-slate-800/60 border border-slate-700"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-white">{value}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CATEGORY_DESCRIPTIONS) as ValueCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    title={CATEGORY_DESCRIPTIONS[cat]}
                    disabled={readOnly}
                    onClick={() => !readOnly && setCategoryForValue(value, cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                      current === cat
                        ? "bg-indigo-600/50 border-indigo-500 text-indigo-200"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-indigo-500/50 hover:text-slate-200"
                    } ${readOnly ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-3xl mx-auto">
        {renderStepIndicator()}

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                disabled={readOnly ? false : (step === 1 ? !canProceedStep1 : !canProceedStep2)}
                onClick={() => setStep(step + 1)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  readOnly || (step === 1 ? canProceedStep1 : canProceedStep2)
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                }`}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={!readOnly && !canSubmitStep3}
                onClick={onSubmit}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  readOnly || canSubmitStep3
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                }`}
              >
                {readOnly ? "Exit" : "Submit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

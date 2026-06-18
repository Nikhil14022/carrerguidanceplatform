"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SMIScenario {
  id: number;
  prompt: string;
  activities: { label: string; column: Column }[];
}

type Column = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

interface ScenarioAnswer {
  selected: number[]; // indices of the 5 chosen activities (0-7)
  ranking: number[];  // indices in rank order (index 0 = rank 1, etc.)
}

interface SMIResponse {
  scenarioAnswers: Record<number, ScenarioAnswer>;
  top3Scenarios: number[];        // which 3 scenarios they'd live in
  columnTotals: Record<Column, number>;
}

interface SubjectMatterTestProps {
  answers: Record<string, any>;
  setAnswers: (answers: Record<string, any>) => void;
  onSubmit: () => void;
  readOnly?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Column labels                                                      */
/* ------------------------------------------------------------------ */

const COLUMN_LABELS: Record<Column, string> = {
  A: "Physical & Life Sciences",
  B: "Social Sciences & Humanities",
  C: "Arts, Entertainment & Media",
  D: "Business & Financial",
  E: "Body Kinaesthetic & Sensory Acuity",
  F: "Designer & Artisan",
  G: "Engineering, Technology & Trades",
  H: "Education, Hospitality & Health Care",
};

const COLUMNS: Column[] = ["A", "B", "C", "D", "E", "F", "G", "H"];

const COLUMN_COLORS: Record<Column, string> = {
  A: "#6366f1",
  B: "#f59e0b",
  C: "#ec4899",
  D: "#10b981",
  E: "#ef4444",
  F: "#8b5cf6",
  G: "#3b82f6",
  H: "#14b8a6",
};

/* ------------------------------------------------------------------ */
/*  Scenario data                                                      */
/* ------------------------------------------------------------------ */

const SCENARIOS: SMIScenario[] = [
  {
    id: 1,
    prompt:
      "Imagine being stranded on a small island for 2 years with a few others. What activities would you be naturally inclined to do?",
    activities: [
      { label: "Building a fishing net & a spear for hunting", column: "A" },
      { label: "Be the wise person and draft a constitution for the island / enforce fairness & follow laws", column: "B" },
      { label: "Perform a stand-up comedy act, try to make people laugh", column: "C" },
      { label: "Monitor the food supply, needs of people", column: "D" },
      { label: "Hunt, fish, chop wood, gather berries, carry water", column: "E" },
      { label: "Fashion coconuts into bowls for eating/drinking, make clothes / create utensils", column: "F" },
      { label: "Construct huts to live in and build a raft", column: "G" },
      { label: "Nurse sick people back to health", column: "H" },
    ],
  },
  {
    id: 2,
    prompt:
      "If you were a performer or part of a team putting on a concert, what activities would you look forward to?",
    activities: [
      { label: "Invent unique electronic consoles for instruments / create effects", column: "A" },
      { label: "Write poetic and philosophical lyrics", column: "B" },
      { label: "Be the drummer or lead guitarist", column: "C" },
      { label: "Be the band manager", column: "D" },
      { label: "Be the roadie, drive the truck, and collect the equipment / logistics", column: "E" },
      { label: "Operate the visual light and laser show", column: "F" },
      { label: "Set up and troubleshoot the amplifiers and sound system", column: "G" },
      { label: "Be in charge of the fan club and social engagements", column: "H" },
    ],
  },
  {
    id: 3,
    prompt:
      "You\u2019re on a three-month sailing trip. As part of a small crew, how would you likely spend your time?",
    activities: [
      { label: "Do marine biology research", column: "A" },
      { label: "Spend long hours reading and pondering the meaning of life", column: "B" },
      { label: "Write a journal, document the trip or the crew\u2019s life stories", column: "C" },
      { label: "Be the captain of the ship and coordinate the shipmates\u2019 tasks", column: "D" },
      { label: "Do the athletic work of hands-on sailing and getting a good tan", column: "E" },
      { label: "Cook and coordinate meals", column: "F" },
      { label: "Be in charge of navigating and reading ocean maps", column: "G" },
      { label: "Plan events and trips to nearby islands and go shopping", column: "H" },
    ],
  },
  {
    id: 4,
    prompt:
      "As part of a group making a movie about a global warming disaster, which activities would interest you?",
    activities: [
      { label: "Advise on the atmospheric and geological theories for the film / plot of film", column: "A" },
      { label: "Write a screenplay about the social implications of a global disaster", column: "B" },
      { label: "Direct the film, coach the actors, and shape the overall plot line", column: "C" },
      { label: "Be the film producer in charge of funding and promoting the project", column: "D" },
      { label: "Be a stuntman or stuntwoman", column: "E" },
      { label: "Do the cinematography", column: "F" },
      { label: "Build the film sets", column: "G" },
      { label: "Gossip with the actors, organize lunch, schedule the day\u2019s activities", column: "H" },
    ],
  },
  {
    id: 5,
    prompt:
      "You and friends have a business plan of running a restaurant on a beach side. What roles would you play?",
    activities: [
      { label: "Be in charge of expanding the business and networking", column: "D" },
      { label: "Find a quiet spot at the bar and observe people", column: "B" },
      { label: "Play guitar and perform for people", column: "C" },
      { label: "Operate the bar, track inventory to make sure there\u2019s enough food & drinks", column: "A" },
      { label: "Play volleyball on the beach, dance, take part in events", column: "E" },
      { label: "Be the bartender", column: "F" },
      { label: "Be the utility person and fix anything that breaks", column: "G" },
      { label: "Be the host/hostess and make sure people have a good time", column: "H" },
    ],
  },
  {
    id: 6,
    prompt:
      "If you were part of the Rashtrapati Bhawan administration department, what would you do best?",
    activities: [
      { label: "Science adviser on renewable energy", column: "A" },
      { label: "A political speechwriter for the President", column: "B" },
      { label: "Press Secretary for the Rashtrapati Bhawan", column: "C" },
      { label: "Be the President & call all the shots", column: "D" },
      { label: "Be a fitness trainer to the staff or a Secret Service agent", column: "E" },
      { label: "Design handmade decorations for all holiday events and dinners", column: "F" },
      { label: "IT network specialist for a secure communications system", column: "G" },
      { label: "Secretary of education, interested in improving children\u2019s education", column: "H" },
    ],
  },
  {
    id: 7,
    prompt:
      "The President encourages people to invent a totally new kind of automobile. How would you participate?",
    activities: [
      { label: "Get a PhD in physics to understand complex 3D systems", column: "A" },
      { label: "Study sociology to learn the impacts of new technology on society", column: "B" },
      { label: "Write content for a website to promote the program", column: "C" },
      { label: "Study finance and economics to balance the national budget", column: "D" },
      { label: "Run in a marathon to raise money for the mission", column: "E" },
      { label: "Take photographs of today\u2019s traffic jams for an art exhibition", column: "F" },
      { label: "Become an engineer or mechanic in the automotive field", column: "G" },
      { label: "Be a grade-school teacher to prepare students for the future", column: "H" },
    ],
  },
  {
    id: 8,
    prompt:
      "You\u2019ve been assigned to be a professor for one year. What cluster of courses would you enjoy teaching?",
    activities: [
      { label: "Astrophysics, molecular biology, paleontology", column: "A" },
      { label: "World history, political science, human behavior", column: "B" },
      { label: "Journalism, public relations, screenwriting", column: "C" },
      { label: "Accounting, finance, business management", column: "D" },
      { label: "Anatomy, nutrition, physical fitness", column: "E" },
      { label: "Furniture making, cooking, interior design", column: "F" },
      { label: "Mechanical engineering, information technology, masonry", column: "G" },
      { label: "Child development, nursing, special education", column: "H" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helper: compute column totals from scenario answers                */
/* ------------------------------------------------------------------ */

function computeColumnTotals(
  scenarioAnswers: Record<number, ScenarioAnswer>
): Record<Column, number> {
  const totals: Record<Column, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0 };

  for (const scenario of SCENARIOS) {
    const answer = scenarioAnswers[scenario.id];
    if (!answer || answer.ranking.length !== 5) continue;

    // Rank 1 = 5 points, Rank 2 = 4, ... Rank 5 = 1
    answer.ranking.forEach((activityIdx, rankIdx) => {
      const col = scenario.activities[activityIdx].column;
      totals[col] += 5 - rankIdx;
    });
  }

  return totals;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SubjectMatterTest({
  answers,
  setAnswers,
  onSubmit,
  readOnly = false,
}: SubjectMatterTestProps) {
  // Current step: 0..7 = scenarios, 8 = top-3 pick, 9 = summary
  const [step, setStep] = useState(0);

  const testData = useMemo(() => {
    const existing = answers.__testData as SMIResponse | undefined;
    const scenarioAnswers = existing?.scenarioAnswers ?? (() => {
      const init: Record<number, ScenarioAnswer> = {};
      SCENARIOS.forEach((s) => {
        init[s.id] = { selected: [], ranking: [] };
      });
      return init;
    })();
    const top3Scenarios = existing?.top3Scenarios ?? [];
    const totals = computeColumnTotals(scenarioAnswers);
    return {
      scenarioAnswers,
      top3Scenarios,
      columnTotals: totals
    };
  }, [answers.__testData]);

  const scenarioAnswers = testData.scenarioAnswers;
  const top3Scenarios = testData.top3Scenarios;
  const columnTotals = testData.columnTotals;

  // Phase within a scenario: "select" or "rank"
  const currentScenario = step < 8 ? SCENARIOS[step] : null;
  const currentAnswer = currentScenario ? scenarioAnswers[currentScenario.id] : null;
  const phase: "select" | "rank" =
    currentAnswer && currentAnswer.selected.length === 5 && currentAnswer.ranking.length < 5
      ? "rank"
      : "select";

  /* ---------- scenario handlers ---------- */

  const toggleActivity = useCallback(
    (activityIdx: number) => {
      if (!currentScenario || readOnly) return;
      const ans = { ...scenarioAnswers[currentScenario.id] };
      const sel = [...ans.selected];
      const idx = sel.indexOf(activityIdx);
      if (idx >= 0) {
        sel.splice(idx, 1);
        ans.ranking = ans.ranking.filter((r) => r !== activityIdx);
      } else if (sel.length < 5) {
        sel.push(activityIdx);
      }
      ans.selected = sel;
      const nextScenarioAnswers = { ...scenarioAnswers, [currentScenario.id]: ans };
      setAnswers({
        ...answers,
        __testData: {
          ...testData,
          scenarioAnswers: nextScenarioAnswers,
          columnTotals: computeColumnTotals(nextScenarioAnswers),
        },
      });
    },
    [currentScenario, scenarioAnswers, answers, setAnswers, testData, readOnly]
  );

  const assignRank = useCallback(
    (activityIdx: number) => {
      if (!currentScenario || readOnly) return;
      const ans = { ...scenarioAnswers[currentScenario.id] };
      const ranking = [...ans.ranking];
      const idx = ranking.indexOf(activityIdx);
      if (idx >= 0) {
        ranking.splice(idx);
      } else if (ranking.length < 5) {
        ranking.push(activityIdx);
      }
      ans.ranking = ranking;
      const nextScenarioAnswers = { ...scenarioAnswers, [currentScenario.id]: ans };
      setAnswers({
        ...answers,
        __testData: {
          ...testData,
          scenarioAnswers: nextScenarioAnswers,
          columnTotals: computeColumnTotals(nextScenarioAnswers),
        },
      });
    },
    [currentScenario, scenarioAnswers, answers, setAnswers, testData, readOnly]
  );

  const resetScenario = useCallback(() => {
    if (!currentScenario || readOnly) return;
    const nextScenarioAnswers = {
      ...scenarioAnswers,
      [currentScenario.id]: { selected: [], ranking: [] },
    };
    setAnswers({
      ...answers,
      __testData: {
        ...testData,
        scenarioAnswers: nextScenarioAnswers,
        columnTotals: computeColumnTotals(nextScenarioAnswers),
      },
    });
  }, [currentScenario, scenarioAnswers, answers, setAnswers, testData, readOnly]);

  /* ---------- top-3 handler ---------- */

  const toggleTop3 = useCallback(
    (scenarioId: number) => {
      if (readOnly) return;
      let nextTop3: number[];
      const idx = top3Scenarios.indexOf(scenarioId);
      if (idx >= 0) {
        nextTop3 = top3Scenarios.filter((s) => s !== scenarioId);
      } else if (top3Scenarios.length < 3) {
        nextTop3 = [...top3Scenarios, scenarioId];
      } else {
        nextTop3 = top3Scenarios;
      }
      setAnswers({
        ...answers,
        __testData: {
          ...testData,
          top3Scenarios: nextTop3,
        },
      });
    },
    [top3Scenarios, answers, setAnswers, testData, readOnly]
  );

  /* ---------- navigation ---------- */

  const canGoNext = useMemo(() => {
    if (step < 8 && currentAnswer) {
      return currentAnswer.ranking.length === 5;
    }
    if (step === 8) return top3Scenarios.length === 3;
    return true;
  }, [step, currentAnswer, top3Scenarios]);

  const goNext = () => {
    if (!canGoNext) return;
    setStep((s) => Math.min(s + 1, 9));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    if (readOnly) {
      onSubmit();
      return;
    }
    const totals = computeColumnTotals(scenarioAnswers);
    const data: SMIResponse = { scenarioAnswers, top3Scenarios, columnTotals: totals };
    setAnswers({ ...answers, __testData: data });
    onSubmit();
  };

  /* ---------- column totals for summary ---------- */

  const maxTotal = useMemo(() => Math.max(...Object.values(columnTotals), 1), [columnTotals]);

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                   */
  /* ---------------------------------------------------------------- */

  const progressPercent = Math.round((step / 9) * 100);

  const renderProgressBar = () => (
    <div style={{ width: "100%", marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          color: "#94a3b8",
          marginBottom: 6,
        }}
      >
        <span>
          {step < 8
            ? `Scenario ${step + 1} of 8`
            : step === 8
            ? "Choose your top 3 scenarios"
            : "Summary"}
        </span>
        <span>{progressPercent}%</span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "#1e293b",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPercent}%`,
            borderRadius: 3,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );

  /* ---------- Scenario step ---------- */

  const renderScenario = () => {
    if (!currentScenario || !currentAnswer) return null;
    const isRanking = phase === "rank";
    const selectionComplete = currentAnswer.selected.length === 5;

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>
          Scenario {currentScenario.id}
        </h2>
        <p style={{ fontSize: 15, color: "#cbd5e1", marginBottom: 20, lineHeight: 1.5 }}>
          {currentScenario.prompt}
        </p>

        {/* Phase indicator */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              background: !isRanking ? "#6366f1" : "#334155",
              color: !isRanking ? "#fff" : "#94a3b8",
              transition: "all 0.2s",
            }}
          >
            1. Select 5 activities
          </span>
          <span style={{ color: "#475569" }}>&rarr;</span>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              background: isRanking ? "#6366f1" : "#334155",
              color: isRanking ? "#fff" : "#94a3b8",
              transition: "all 0.2s",
            }}
          >
            2. Rank them 1-5
          </span>

          <button
            onClick={resetScenario}
            disabled={readOnly}
            style={{
              marginLeft: "auto",
              padding: "4px 12px",
              borderRadius: 6,
              border: "1px solid #475569",
              background: "transparent",
              color: "#94a3b8",
              fontSize: 12,
              cursor: readOnly ? "not-allowed" : "pointer",
              opacity: readOnly ? 0.5 : 1,
            }}
          >
            Reset
          </button>
        </div>

        {!isRanking && (
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
            {currentAnswer.selected.length}/5 selected
            {currentAnswer.selected.length === 5 ? (readOnly ? "" : " — click any selected activity to start ranking") : ""}
          </p>
        )}

        {isRanking && (
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
            Click activities in order of preference. {currentAnswer.ranking.length}/5 ranked.
            {currentAnswer.ranking.length > 0 && !readOnly ? " Click a ranked item to undo from that point." : ""}
          </p>
        )}

        {/* Activity cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {currentScenario.activities.map((act, idx) => {
            const isSelected = currentAnswer.selected.includes(idx);
            const rankPos = currentAnswer.ranking.indexOf(idx);
            const hasRank = rankPos >= 0;
            const disabled = !isRanking && !isSelected && selectionComplete;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (readOnly) return;
                  if (isRanking && isSelected) {
                    assignRank(idx);
                  } else if (!isRanking) {
                    toggleActivity(idx);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1.5px solid ${
                    hasRank
                      ? "#6366f1"
                      : isSelected
                      ? "#475569"
                      : "#1e293b"
                  }`,
                  background: hasRank
                    ? "rgba(99,102,241,0.08)"
                    : isSelected
                    ? "rgba(71,85,105,0.15)"
                    : "#0f172a",
                  cursor: (disabled || readOnly) ? "not-allowed" : "pointer",
                  opacity: (disabled || readOnly) ? 0.5 : 1,
                  transition: "all 0.15s ease",
                  userSelect: "none" as const,
                }}
              >
                {/* Checkbox / Rank badge */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: hasRank ? 8 : 6,
                    border: `2px solid ${
                      hasRank ? "#6366f1" : isSelected ? "#6366f1" : "#334155"
                    }`,
                    background: hasRank
                      ? "#6366f1"
                      : isSelected
                      ? "rgba(99,102,241,0.2)"
                      : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    color: hasRank ? "#fff" : isSelected ? "#6366f1" : "#475569",
                    transition: "all 0.15s",
                  }}
                >
                  {hasRank ? rankPos + 1 : isSelected ? "\u2713" : ""}
                </div>

                <span
                  style={{
                    fontSize: 14,
                    color: hasRank ? "#e2e8f0" : isSelected ? "#cbd5e1" : "#94a3b8",
                    lineHeight: 1.4,
                  }}
                >
                  {act.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ---------- Top-3 Scenarios step ---------- */

  const renderTop3 = () => (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f1f5f9", marginBottom: 8 }}>
        Choose Your Top 3 Scenarios
      </h2>
      <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 20 }}>
        If you could live in 3 of these scenarios in real life, which would you choose?
        ({top3Scenarios.length}/3 selected)
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {SCENARIOS.map((s) => {
          const picked = top3Scenarios.includes(s.id);
          const disabled = !picked && top3Scenarios.length >= 3;
          return (
            <div
              key={s.id}
              onClick={() => !disabled && !readOnly && toggleTop3(s.id)}
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                border: `1.5px solid ${picked ? "#6366f1" : "#1e293b"}`,
                background: picked ? "rgba(99,102,241,0.08)" : "#0f172a",
                cursor: (disabled || readOnly) ? "not-allowed" : "pointer",
                opacity: (disabled || readOnly) ? 0.5 : 1,
                transition: "all 0.15s",
                userSelect: "none" as const,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: `2px solid ${picked ? "#6366f1" : "#334155"}`,
                    background: picked ? "#6366f1" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {picked ? "\u2713" : ""}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
                    Scenario {s.id}
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2, lineHeight: 1.4 }}>
                    {s.prompt}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ---------- Summary step ---------- */

  const renderSummary = () => (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f1f5f9", marginBottom: 8 }}>
        Your Subject Matter Interest Profile
      </h2>
      <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 24 }}>
        Below are your column totals based on your ranked preferences across all 8 scenarios.
      </p>

      {/* Bar chart */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {COLUMNS.map((col) => {
          const val = columnTotals[col];
          const pct = Math.round((val / maxTotal) * 100);
          return (
            <div key={col}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                <span style={{ color: "#e2e8f0", fontWeight: 500 }}>
                  {col}: {COLUMN_LABELS[col]}
                </span>
                <span style={{ color: "#94a3b8", fontWeight: 600 }}>{val}</span>
              </div>
              <div
                style={{
                  height: 20,
                  borderRadius: 6,
                  background: "#1e293b",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    borderRadius: 6,
                    background: COLUMN_COLORS[col],
                    transition: "width 0.4s ease",
                    minWidth: val > 0 ? 8 : 0,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Top 3 scenarios chosen */}
      <div style={{ marginTop: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", marginBottom: 10 }}>
          Scenarios You Would Choose to Live In
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {top3Scenarios.map((sid, i) => {
            const s = SCENARIOS.find((sc) => sc.id === sid);
            return (
              <div
                key={sid}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#1e293b",
                  fontSize: 13,
                  color: "#cbd5e1",
                }}
              >
                <span style={{ color: "#6366f1", fontWeight: 700, marginRight: 8 }}>#{i + 1}</span>
                Scenario {sid}: {s?.prompt}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Main render                                                      */
  /* ---------------------------------------------------------------- */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0f1a",
        color: "#e2e8f0",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#f8fafc",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Subject Matter Interest Test
        </h1>

        {renderProgressBar()}

        {/* Step content */}
        <div
          style={{
            background: "#111827",
            borderRadius: 14,
            padding: "24px 20px",
            border: "1px solid #1e293b",
          }}
        >
          {step < 8 && renderScenario()}
          {step === 8 && renderTop3()}
          {step === 9 && renderSummary()}
        </div>

        {/* Navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 20,
          }}
        >
          <button
            onClick={goBack}
            disabled={step === 0}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "transparent",
              color: step === 0 ? "#334155" : "#94a3b8",
              fontSize: 14,
              fontWeight: 500,
              cursor: step === 0 ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            Back
          </button>

          {step < 9 ? (
            <button
              onClick={goNext}
              disabled={!canGoNext}
              style={{
                padding: "10px 28px",
                borderRadius: 8,
                border: "none",
                background: canGoNext
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : "#1e293b",
                color: canGoNext ? "#fff" : "#475569",
                fontSize: 14,
                fontWeight: 600,
                cursor: canGoNext ? "pointer" : "not-allowed",
                transition: "all 0.15s",
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              style={{
                padding: "10px 28px",
                borderRadius: 8,
                border: "none",
                background: readOnly
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {readOnly ? "Exit" : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

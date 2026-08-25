"use client";

import React from "react";
import pf16Questions from "../data/pf16_questions.json";
import {
  COLOR_SECTIONS,
  SMI_SCENARIOS,
  SMI_COLUMN_LABELS,
  SD_ROUND1,
  SD_TEEN,
  SD_ADULT,
  JF_SECTIONS,
} from "../lib/testQuestions";

interface TestAnswersRendererProps {
  testType: string;
  answers: Record<string, any>;
}

// -------------------------------------------------------------
// Values (Module 13) Constants & Helper
// -------------------------------------------------------------
const VALUE_GENRES = ["Personal", "Social", "Achievement", "Physical"] as const;

export default function TestAnswersRenderer({ testType, answers }: TestAnswersRendererProps) {
  if (!answers || Object.keys(answers).length === 0) {
    return <p className="text-sm text-slate-400 italic">No responses recorded for this test.</p>;
  }

  // -----------------------------------------------------------
  // 1. 16PF (Module 12)
  // -----------------------------------------------------------
  if (testType === "16PF") {
    const render16PFValue = (val: any) => {
      const num = Number(val);
      if (isNaN(num)) return String(val);
      const labels: Record<number, string> = {
        1: "Strongly Disagree (1)",
        2: "Disagree (2)",
        3: "Slightly Disagree (3)",
        4: "Slightly Agree (4)",
        5: "Agree (5)",
        6: "Strongly Agree (6)",
      };
      return labels[num] || `Rating: ${num}`;
    };

    return (
      <div className="space-y-6">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300">
          <strong>16PF Personality Factors Test:</strong> Responses mapped by questions.
        </div>
        <div className="grid gap-4 md:grid-cols-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {pf16Questions.map((q) => {
            const val = answers[q.id];
            if (val === undefined) return null;
            return (
              <div key={q.id} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-1.5">
                <div className="font-semibold text-slate-400">Question {q.id.split("_")[1]}</div>
                {q.type === "statement" ? (
                  <>
                    <p className="text-slate-200">{q.text}</p>
                    <p className="font-bold text-indigo-400">{render16PFValue(val)}</p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-400">
                      <span className="w-1/2 text-left">{q.left}</span>
                      <span className="w-1/2 text-right">{q.right}</span>
                    </div>
                    <div className="font-bold text-indigo-400 text-center bg-indigo-500/5 py-1 rounded">
                      Selected rating: {val} (Preference: {val <= 3 ? `Left` : `Right`})
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 2. VALUES (Module 13)
  // -----------------------------------------------------------
  if (testType === "VALUES") {
    const testData = answers.__testData || answers;
    const ranked = (testData.ranked as string[]) || [];
    const categorized = (testData.categorized as Record<string, string>) || {};

    if (ranked.length === 0) {
      return <p className="text-slate-400 italic">No values ranked yet.</p>;
    }

    return (
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ranked Values System (Top 10)</h4>
        <div className="space-y-2">
          {ranked.map((v, i) => (
            <div key={v} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black">{i + 1}</span>
              <span className="text-sm font-semibold text-slate-200 flex-1">{v}</span>
              <span className="px-2.5 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-bold uppercase tracking-wider">
                {categorized[v] || "Want & Preference"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 3. RIASEC (Module 14)
  // -----------------------------------------------------------
  if (testType === "RIASEC") {
    const testData = answers.__testData || answers;
    const categories: Record<string, string> = {
      R: "Realistic (Practical, Hands-on, Physical)",
      I: "Investigative (Analytical, Scientific, Logical)",
      A: "Artistic (Creative, Expressive, Unstructured)",
      S: "Social (Empathetic, Helping, Teamwork)",
      E: "Enterprising (Ambitious, Leading, Influencing)",
      C: "Conventional (Organized, Detail-oriented, Precise)",
    };

    return (
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">RIASEC Selections</h4>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(categories).map(([code, label]) => {
            const list = (testData[code] as string[]) || [];
            return (
              <div key={code} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-sm font-bold text-indigo-300">{label}</span>
                  <span className="text-xs text-slate-500 font-bold bg-white/5 px-2 py-0.5 rounded-lg">{list.length} selected</span>
                </div>
                {list.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-slate-350 space-y-1">
                    {list.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-slate-650 italic">None selected</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 4. COLOR (Module 15)
  // -----------------------------------------------------------
  if (testType === "COLOR") {
    const testData = answers.__testData || answers;
    const result = testData.result || "N/A";

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold text-white uppercase">C</div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Personality Color Result</div>
            <div className="text-md font-black text-indigo-300 mt-0.5">{result}</div>
          </div>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {COLOR_SECTIONS.map((sec, secIdx) => {
            const userSelections = (testData[`section${secIdx + 1}`] as (string | null)[]) || [];
            return (
              <div key={secIdx} className="space-y-2">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-1">{sec.title}</h5>
                <div className="space-y-1.5">
                  {sec.questions.map((q, qIdx) => {
                    const sel = userSelections[qIdx];
                    const selectedText = sel === "a" ? q.a : sel === "b" ? q.b : "No answer";
                    return (
                      <div key={qIdx} className="flex justify-between items-center text-xs p-2 bg-white/3 border border-white/3 rounded-lg">
                        <span className="text-slate-500">Q{qIdx + 1}: {q.a} vs {q.b}</span>
                        <span className="font-bold text-indigo-400 shrink-0 ml-4 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">{selectedText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 5. SMI (Module 16)
  // -----------------------------------------------------------
  if (testType === "SMI") {
    const testData = answers.__testData || answers;
    const columnTotals = (testData.columnTotals as Record<string, number>) || {};
    const top3Scenarios = (testData.top3Scenarios as number[]) || [];
    const scenarioAnswers = (testData.scenarioAnswers as Record<number, any>) || {};

    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">SMI Column Totals</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(SMI_COLUMN_LABELS).map(([col, label]) => {
              const val = columnTotals[col] || 0;
              return (
                <div key={col} className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-350 font-medium">{col}: {label}</span>
                  <span className="font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">{val} pts</span>
                </div>
              );
            })}
          </div>
        </div>

        {top3Scenarios.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Preferred Scenarios to Live In</h4>
            <div className="flex flex-wrap gap-2">
              {top3Scenarios.map((id, index) => {
                const sc = SMI_SCENARIOS.find((s) => s.id === id);
                return (
                  <div key={id} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs flex items-start gap-2 w-full">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">{index + 1}</span>
                    <div>
                      <span className="font-bold text-slate-200">Scenario {id}: </span>
                      <span className="text-slate-400 leading-relaxed">{sc?.prompt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Scenario Rankings Detail</h4>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {SMI_SCENARIOS.map((sc) => {
              const ans = scenarioAnswers[sc.id];
              const ranking = (ans?.ranking as number[]) || [];
              return (
                <div key={sc.id} className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2">
                  <div className="font-bold text-indigo-300 text-xs">Scenario {sc.id} Activity Rankings:</div>
                  {ranking.length > 0 ? (
                    <ol className="list-decimal list-inside text-xs text-slate-350 space-y-1">
                      {ranking.map((idx, rankIdx) => {
                        const act = sc.activities[idx];
                        return (
                          <li key={rankIdx} className="leading-relaxed">
                            <span className="font-semibold text-slate-200">{act?.label}</span>{" "}
                            <span className="text-indigo-400 text-[10px] uppercase font-bold tracking-wider">({act?.column})</span>
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <p className="text-xs text-slate-600 italic">No answers ranked</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 6. PARENTS_MEETING (Module 17)
  // -----------------------------------------------------------
  if (testType === "PARENTS_MEETING") {
    const testData = answers.__testData || answers;

    const renderParentField = (label: string, value: any) => {
      if (value === undefined || value === null || value === "") return null;
      return (
        <div key={label} className="border-b border-white/5 pb-2 last:border-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</div>
          <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
            {Array.isArray(value) ? value.join(", ") : String(value)}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300">
          <strong>Parents Meeting Questionnaire Details:</strong> Responses formatted by question section.
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {/* Q1 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q1. Describe the Child</h5>
            {Array.isArray(testData.q1_described_words) && testData.q1_described_words.length > 0 ? (
              renderParentField("Selected Personality Descriptors", testData.q1_described_words.join(", "))
            ) : (
              <>
                {renderParentField("Mother's Description", testData.q1_mother_description)}
                {renderParentField("Father's Description", testData.q1_father_description)}
              </>
            )}
          </div>

          {/* Q2 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q2. Relationship with Child</h5>
            {renderParentField("Dad's Relationship", testData.q2_dad_relationship)}
            {renderParentField("Mom's Relationship", testData.q2_mom_relationship)}
          </div>

          {/* Q3 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q3. School Journey</h5>
            {renderParentField("Favourite Subject", testData.q3_favourite_subject)}
            {renderParentField("Subject They Hate", testData.q3_hated_subject)}
            {renderParentField("Kind of Learner (slow/avg/fast)", testData.q3_kind_of_learner)}
            {renderParentField("Learning Style", testData.q3_learning_style)}
            {renderParentField("Relationship with Teachers", testData.q3_relationship_teachers)}
            {renderParentField("Relationship with Friends", testData.q3_relationship_friends)}
            {renderParentField("Relationship with Opposite Gender", testData.q3_relationship_opposite_gender)}
            {renderParentField("Bullying/Harassment Incidents", testData.q3_bullied_or_harassed)}
            {renderParentField("Academic Grades & Performance", testData.q3_marks_scoring)}
            {renderParentField("Won / Appreciated Awards", testData.q3_won_appreciated)}
            {renderParentField("Extracurricular Activities", testData.q3_extracurriculars)}
          </div>

          {/* Q4 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q4. Routine & Traits Ratings</h5>
            {renderParentField("Waking & Sleeping Schedule", testData.q4_waking_sleeping)}
            {renderParentField("Eating Habits", testData.q4_eating_habits)}
            {renderParentField("Studying Habits", testData.q4_studying_habits)}
            {renderParentField("Approach to Deadlines", testData.q4_deadlines_approach)}
            {renderParentField("Traveling habits", testData.q4_traveling)}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-white/5">
              {[
                { label: "Attention", val: testData.q4_rate_attention },
                { label: "Emotional Reg", val: testData.q4_rate_emotional_regulation },
                { label: "Decision Making", val: testData.q4_rate_decision_making },
                { label: "Social Skill", val: testData.q4_rate_social_interaction },
                { label: "Time Mgmt", val: testData.q4_rate_time_management },
              ].map(({ label, val }) => (
                <div key={label} className="bg-slate-950 p-2 border border-slate-800 rounded-lg text-center">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</div>
                  <div className="text-sm font-black text-indigo-300 mt-0.5">{val || 5}/10</div>
                </div>
              ))}
            </div>
          </div>

          {/* Q5 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q5. Importance Ratings (1-10)</h5>
            {[
              { label: "Money", rating: testData.q5_money_rating, exp: testData.q5_money_explanation },
              { label: "Creative Expression", rating: testData.q5_creative_expression_rating, exp: testData.q5_creative_expression_explanation },
              { label: "Passion", rating: testData.q5_passion_rating, exp: testData.q5_passion_explanation },
              { label: "Satisfaction", rating: testData.q5_satisfaction_rating, exp: testData.q5_satisfaction_explanation },
              { label: "Giving Back", rating: testData.q5_giving_back_rating, exp: testData.q5_giving_back_explanation },
            ].map(({ label, rating, exp }) => (
              <div key={label} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-350">{label}</span>
                  <span className="text-xs font-black text-indigo-400">{rating || 5}/10</span>
                </div>
                {exp && <p className="text-xs text-slate-400 leading-relaxed italic">"{exp}"</p>}
              </div>
            ))}
          </div>

          {/* Q6 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q6. Free Time Utilization</h5>
            {Array.isArray(testData.q6_free_time_activities) && testData.q6_free_time_activities.length > 0 ? (
              <>
                {renderParentField("Selected Free Time Activities", testData.q6_free_time_activities.join(", "))}
                {testData.q6_social_media_usage && renderParentField("Social Media Usage", testData.q6_social_media_usage)}
              </>
            ) : (
              renderParentField("Activities", testData.q6_free_time)
            )}
          </div>

          {/* Q7 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q7. Social Space Behaviors</h5>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { l: "Comfort: Family", val: testData.q7_comfort_close_family },
                { l: "Comfort: Friends", val: testData.q7_comfort_friends },
                { l: "Comfort: Authority", val: testData.q7_comfort_authority },
                { l: "Comfort: Strangers", val: testData.q7_comfort_strangers },
                { l: "Comm: Family", val: testData.q7_communication_close_family },
                { l: "Comm: Friends", val: testData.q7_communication_friends },
                { l: "Comm: Authority", val: testData.q7_communication_authority },
                { l: "Comm: Strangers", val: testData.q7_communication_strangers },
                { l: "Initiation: Family", val: testData.q7_initiation_close_family },
                { l: "Initiation: Friends", val: testData.q7_initiation_friends },
                { l: "Initiation: Authority", val: testData.q7_initiation_authority },
                { l: "Initiation: Strangers", val: testData.q7_initiation_strangers },
                { l: "Emotional: Family", val: testData.q7_emotional_close_family },
                { l: "Emotional: Friends", val: testData.q7_emotional_friends },
                { l: "Emotional: Authority", val: testData.q7_emotional_authority },
                { l: "Emotional: Strangers", val: testData.q7_emotional_strangers },
              ].map(({ l, val }) => (
                <div key={l} className="p-2 bg-slate-950/60 border border-slate-900 rounded-lg">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{l}</div>
                  <div className="text-xs text-slate-300 mt-0.5">{val || "N/A"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Q8 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q8. Influences & Life Incidents</h5>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-950 p-2 text-center rounded-lg border border-slate-800">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Media Influence</div>
                <div className="text-sm font-black text-indigo-300 mt-0.5">{testData.q9_media_rating || 5}/10</div>
              </div>
              <div className="bg-slate-950 p-2 text-center rounded-lg border border-slate-800">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Friends Influence</div>
                <div className="text-sm font-black text-indigo-300 mt-0.5">{testData.q9_friends_rating || 5}/10</div>
              </div>
              <div className="bg-slate-950 p-2 text-center rounded-lg border border-slate-800">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Family Influence</div>
                <div className="text-sm font-black text-indigo-300 mt-0.5">{testData.q9_parents_family_rating || 5}/10</div>
              </div>
            </div>
            {renderParentField("Media Content Watched", testData.q9_media_content)}
            {renderParentField("Other Influences", testData.q9_anything_else_influence)}
            {renderParentField("Significant Life Events/Incidents", testData.q9b_incidents)}
          </div>

          {/* Q9 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q9. Career Stance & Concerns</h5>
            {renderParentField("Career Path Thoughts", testData.q10_career_thoughts)}
          </div>

          {/* Q10 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q10. Study Destination Stances</h5>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { l: "11/12th - Home", val: testData.q11_11_12_home, w: testData.q11_11_12_home_why },
                { l: "11/12th - India", val: testData.q11_11_12_india, w: testData.q11_11_12_india_why },
                { l: "11/12th - Abroad", val: testData.q11_11_12_abroad, w: testData.q11_11_12_abroad_why },
                { l: "Grad - Home", val: testData.q11_grad_home, w: testData.q11_grad_home_why },
                { l: "Grad - India", val: testData.q11_grad_india, w: testData.q11_grad_india_why },
                { l: "Grad - Abroad", val: testData.q11_grad_abroad, w: testData.q11_grad_abroad_why },
                { l: "Masters - Home", val: testData.q11_masters_home, w: testData.q11_masters_home_why },
                { l: "Masters - India", val: testData.q11_masters_india, w: testData.q11_masters_india_why },
                { l: "Masters - Abroad", val: testData.q11_masters_abroad, w: testData.q11_masters_abroad_why },
                { l: "Settle - Home", val: testData.q11_settle_home, w: testData.q11_settle_home_why },
                { l: "Settle - India", val: testData.q11_settle_india, w: testData.q11_settle_india_why },
                { l: "Settle - Abroad", val: testData.q11_settle_abroad, w: testData.q11_settle_abroad_why },
              ].map(({ l, val, w }) => (
                <div key={l} className="p-2 bg-slate-950 border border-slate-850 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">{l}</span>
                    <span className="font-bold text-indigo-400 text-[10px]">{val || "N/A"}</span>
                  </div>
                  {w && <p className="text-[10px] text-slate-500 mt-1 italic">Reason: "{w}"</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Q11 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q11. Marriage & Independence Stance</h5>
            {renderParentField("Marriage", testData.q12_marriage)}
            {renderParentField("Independence Timeline", testData.q12_independence_time)}
            {renderParentField("Financial Support Limit (Age)", testData.q12_financial_support_age)}
          </div>

          {/* Q12 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q12. Risk Behaviour Inclinations</h5>
            {renderParentField("Preferences", testData.q13_risk_behaviour)}
          </div>

          {/* Q13 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q13. Abilities & Qualities Inherited</h5>
            {renderParentField("Hidden Talents Identified", testData.q14_hidden_talents)}
            {renderParentField("Path if there were no constraints", testData.q14_if_no_constraints)}
            {renderParentField("Qualities Inherited from Mom", testData.q14_qualities_from_mom)}
            {renderParentField("Qualities Inherited from Dad", testData.q14_qualities_from_dad)}
          </div>

          {/* Q14 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q14. Additional Notes</h5>
            {renderParentField("Anything Else", testData.q15_anything_else)}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 7. SELF_DISCOVERY (Module 18)
  // -----------------------------------------------------------
  if (testType === "SELF_DISCOVERY") {
    const ageGroup = answers.sd_age_group || "";
    const round2Questions = ageGroup === "13-18" ? SD_TEEN : SD_ADULT;
    const questions = [...SD_ROUND1, ...round2Questions];

    return (
      <div className="space-y-4">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300 flex justify-between items-center">
          <span><strong>Self Discovery Test:</strong> Complete questionnaire responses.</span>
          <span className="bg-indigo-500/20 px-2 py-0.5 border border-indigo-500/30 rounded text-[10px] font-bold">Age: {ageGroup || "All"}</span>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {questions.map((q) => {
            const val = answers[q.id];
            if (val === undefined) return null;
            return (
              <div key={q.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                <div className="text-sm font-semibold text-slate-200">
                  <span className="text-indigo-400 font-bold mr-2">{q.num}.</span>
                  {q.text}
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl text-xs text-slate-350 leading-relaxed whitespace-pre-wrap italic">
                  "{val.trim() ? val : "(No answer provided)"}"
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 8. JOB_FUNCTIONS (Module 19)
  // -----------------------------------------------------------
  if (testType === "JOB_FUNCTIONS") {
    const renderRatingBadge = (rating: any) => {
      const num = Number(rating);
      if (isNaN(num)) return <span className="text-slate-500 text-xs font-bold">Unrated</span>;
      if (num >= 4) {
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-black">
            {num}/5 — Confident
          </span>
        );
      }
      if (num >= 2) {
        return (
          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-black">
            {num}/5 — Doubtful
          </span>
        );
      }
      return (
        <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-black">
          {num}/5 — Low Interest
        </span>
      );
    };

    return (
      <div className="space-y-6">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300">
          <strong>Identify Your Job Functions:</strong> Rating of natural confidence for each function category.
        </div>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {(() => {
            // Group by category, then by section title
            const categories = ["People-Oriented (One-on-One)", "People-Oriented (Groups & Public)", "Information & Ideas", "Things & Physical World"];
            return categories.map((cat) => {
              const catSections = JF_SECTIONS.filter((s) => s.category === cat);
              return (
                <div key={cat} className="space-y-3">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-500/20 pb-1.5">
                    {cat}
                  </h4>
                  <div className="space-y-4">
                    {catSections.map((sec) => (
                      <div key={sec.title} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                        <div className="text-xs font-extrabold text-slate-300">{sec.title}</div>
                        <div className="space-y-2">
                          {sec.items.map((item, idx) => {
                            const val = answers[item.id];
                            return (
                              <div key={item.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-950/40 rounded-lg border border-slate-900/60 hover:bg-slate-950/60 transition-colors">
                                <span className="text-slate-350 pr-4 leading-relaxed">
                                  <span className="text-slate-650 mr-2 font-bold">{idx + 1}.</span>
                                  {item.text}
                                </span>
                                <span className="shrink-0">{renderRatingBadge(val)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    );
  }

  // Fallback if not matching any custom testType
  return (
    <pre className="text-sm text-slate-300 whitespace-pre-wrap bg-white/5 p-3 rounded-xl overflow-x-auto border border-white/5">
      {JSON.stringify(answers, null, 2)}
    </pre>
  );
}

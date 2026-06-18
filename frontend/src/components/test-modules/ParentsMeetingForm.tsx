"use client";

import React, { useState, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ParentsMeetingFormProps {
  answers: Record<string, any>;
  setAnswers: (answers: Record<string, any>) => void;
  onSubmit: () => void;
  readOnly?: boolean;
}

const ReadOnlyContext = React.createContext(false);

interface TestData {
  // Q1
  q1_mother_description: string;
  q1_father_description: string;
  // Q2
  q2_dad_relationship: string;
  q2_mom_relationship: string;
  // Q3
  q3_favourite_subject: string;
  q3_hated_subject: string;
  q3_kind_of_learner: string;
  q3_learning_style: string;
  q3_relationship_teachers: string;
  q3_relationship_friends: string;
  q3_relationship_opposite_gender: string;
  q3_bullied_or_harassed: string;
  q3_marks_scoring: string;
  q3_won_appreciated: string;
  q3_extracurriculars: string;
  // Q4
  q4_waking_sleeping: string;
  q4_eating_habits: string;
  q4_studying_habits: string;
  q4_deadlines_approach: string;
  q4_traveling: string;
  q4_rate_attention: number;
  q4_rate_emotional_regulation: number;
  q4_rate_decision_making: number;
  q4_rate_social_interaction: number;
  q4_rate_time_management: number;
  // Q5
  q5_money_rating: number;
  q5_money_explanation: string;
  q5_creative_expression_rating: number;
  q5_creative_expression_explanation: string;
  q5_passion_rating: number;
  q5_passion_explanation: string;
  q5_satisfaction_rating: number;
  q5_satisfaction_explanation: string;
  q5_giving_back_rating: number;
  q5_giving_back_explanation: string;
  // Q6
  q6_free_time: string;
  // Q7
  q7_comfort_close_family: string;
  q7_comfort_friends: string;
  q7_comfort_authority: string;
  q7_comfort_strangers: string;
  q7_communication_close_family: string;
  q7_communication_friends: string;
  q7_communication_authority: string;
  q7_communication_strangers: string;
  q7_initiation_close_family: string;
  q7_initiation_friends: string;
  q7_initiation_authority: string;
  q7_initiation_strangers: string;
  q7_emotional_close_family: string;
  q7_emotional_friends: string;
  q7_emotional_authority: string;
  q7_emotional_strangers: string;
  // Q8
  q8_free_time_describe: string;
  // Q9
  q9_media_rating: number;
  q9_media_content: string;
  q9_friends_rating: number;
  q9_parents_family_rating: number;
  q9_anything_else_influence: string;
  q9b_incidents: string;
  // Q10
  q10_career_thoughts: string;
  // Q11
  q11_11_12_home: string;
  q11_11_12_home_why: string;
  q11_11_12_india: string;
  q11_11_12_india_why: string;
  q11_11_12_abroad: string;
  q11_11_12_abroad_why: string;
  q11_grad_home: string;
  q11_grad_home_why: string;
  q11_grad_india: string;
  q11_grad_india_why: string;
  q11_grad_abroad: string;
  q11_grad_abroad_why: string;
  q11_masters_home: string;
  q11_masters_home_why: string;
  q11_masters_india: string;
  q11_masters_india_why: string;
  q11_masters_abroad: string;
  q11_masters_abroad_why: string;
  q11_settle_home: string;
  q11_settle_home_why: string;
  q11_settle_india: string;
  q11_settle_india_why: string;
  q11_settle_abroad: string;
  q11_settle_abroad_why: string;
  // Q12
  q12_marriage: string;
  q12_independence_time: string;
  q12_financial_support_age: string;
  // Q13
  q13_risk_behaviour: string[];
  // Q14
  q14_hidden_talents: string;
  q14_if_no_constraints: string;
  q14_qualities_from_mom: string;
  q14_qualities_from_dad: string;
  // Q15
  q15_anything_else: string;
}

const TOTAL_QUESTIONS = 14;

const RELATIONSHIP_OPTIONS = [
  "Very Connected",
  "Friendly Bond",
  "Neutral",
  "Formal Relationship",
  "Emotionally Strained",
];

const RISK_BEHAVIOUR_OPTIONS = [
  "First finish degree then explore",
  "Safe options only",
  "Money is not a factor, okay if they earn less and are happy",
  "Join family business",
  "Do something they can manage their home with",
];

function getDefaultData(): TestData {
  return {
    q1_mother_description: "",
    q1_father_description: "",
    q2_dad_relationship: "",
    q2_mom_relationship: "",
    q3_favourite_subject: "",
    q3_hated_subject: "",
    q3_kind_of_learner: "",
    q3_learning_style: "",
    q3_relationship_teachers: "",
    q3_relationship_friends: "",
    q3_relationship_opposite_gender: "",
    q3_bullied_or_harassed: "",
    q3_marks_scoring: "",
    q3_won_appreciated: "",
    q3_extracurriculars: "",
    q4_waking_sleeping: "",
    q4_eating_habits: "",
    q4_studying_habits: "",
    q4_deadlines_approach: "",
    q4_traveling: "",
    q4_rate_attention: 5,
    q4_rate_emotional_regulation: 5,
    q4_rate_decision_making: 5,
    q4_rate_social_interaction: 5,
    q4_rate_time_management: 5,
    q5_money_rating: 5,
    q5_money_explanation: "",
    q5_creative_expression_rating: 5,
    q5_creative_expression_explanation: "",
    q5_passion_rating: 5,
    q5_passion_explanation: "",
    q5_satisfaction_rating: 5,
    q5_satisfaction_explanation: "",
    q5_giving_back_rating: 5,
    q5_giving_back_explanation: "",
    q6_free_time: "",
    q7_comfort_close_family: "",
    q7_comfort_friends: "",
    q7_comfort_authority: "",
    q7_comfort_strangers: "",
    q7_communication_close_family: "",
    q7_communication_friends: "",
    q7_communication_authority: "",
    q7_communication_strangers: "",
    q7_initiation_close_family: "",
    q7_initiation_friends: "",
    q7_initiation_authority: "",
    q7_initiation_strangers: "",
    q7_emotional_close_family: "",
    q7_emotional_friends: "",
    q7_emotional_authority: "",
    q7_emotional_strangers: "",
    q8_free_time_describe: "",
    q9_media_rating: 5,
    q9_media_content: "",
    q9_friends_rating: 5,
    q9_parents_family_rating: 5,
    q9_anything_else_influence: "",
    q9b_incidents: "",
    q10_career_thoughts: "",
    q11_11_12_home: "",
    q11_11_12_home_why: "",
    q11_11_12_india: "",
    q11_11_12_india_why: "",
    q11_11_12_abroad: "",
    q11_11_12_abroad_why: "",
    q11_grad_home: "",
    q11_grad_home_why: "",
    q11_grad_india: "",
    q11_grad_india_why: "",
    q11_grad_abroad: "",
    q11_grad_abroad_why: "",
    q11_masters_home: "",
    q11_masters_home_why: "",
    q11_masters_india: "",
    q11_masters_india_why: "",
    q11_masters_abroad: "",
    q11_masters_abroad_why: "",
    q11_settle_home: "",
    q11_settle_home_why: "",
    q11_settle_india: "",
    q11_settle_india_why: "",
    q11_settle_abroad: "",
    q11_settle_abroad_why: "",
    q12_marriage: "",
    q12_independence_time: "",
    q12_financial_support_age: "",
    q13_risk_behaviour: [],
    q14_hidden_talents: "",
    q14_if_no_constraints: "",
    q14_qualities_from_mom: "",
    q14_qualities_from_dad: "",
    q15_anything_else: "",
  };
}

/* ------------------------------------------------------------------ */
/*  Reusable sub-components                                            */
/* ------------------------------------------------------------------ */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-slate-300">
      {children}
    </label>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const readOnly = React.useContext(ReadOnlyContext);
  return (
    <textarea
      value={value}
      onChange={(e) => !readOnly && onChange(e.target.value)}
      disabled={readOnly}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const readOnly = React.useContext(ReadOnlyContext);
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => !readOnly && onChange(e.target.value)}
      disabled={readOnly}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

function RatingSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const readOnly = React.useContext(ReadOnlyContext);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="min-w-[2rem] text-center text-sm font-bold text-indigo-400">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        disabled={readOnly}
        onChange={(e) => !readOnly && onChange(Number(e.target.value))}
        className="w-full accent-indigo-500 disabled:opacity-50"
      />
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const readOnly = React.useContext(ReadOnlyContext);
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange(opt)}
          className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-all ${
            value === opt
              ? "border-indigo-500 bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/40"
              : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200"
          } ${readOnly ? "cursor-not-allowed opacity-60" : ""}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const readOnly = React.useContext(ReadOnlyContext);
  return (
    <div className="flex gap-2">
      {["Yes", "No"].map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange(opt)}
          className={`rounded-md border px-3 py-1 text-xs font-medium transition-all ${
            value === opt
              ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
              : "border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-600"
          } ${readOnly ? "cursor-not-allowed opacity-60" : ""}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function ParentsMeetingForm({
  answers,
  setAnswers,
  onSubmit,
  readOnly = false,
}: ParentsMeetingFormProps) {
  const [page, setPage] = useState(0);

  const testData: TestData = {
    ...getDefaultData(),
    ...(answers.__testData as Partial<TestData> | undefined),
  };

  const update = useCallback(
    (field: keyof TestData, value: any) => {
      setAnswers({
        ...answers,
        __testData: { ...testData, [field]: value },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers, setAnswers, testData]
  );

  const goNext = () => setPage((p) => Math.min(p + 1, TOTAL_QUESTIONS - 1));
  const goBack = () => setPage((p) => Math.max(p - 1, 0));

  /* ---------------------------------------------------------------- */
  /*  Render each question page                                        */
  /* ---------------------------------------------------------------- */

  function renderQuestion() {
    switch (page) {
      /* ---- Q1 ---- */
      case 0:
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">
              Q1. Describe your child
            </h3>
            <div>
              <Label>Mother&apos;s Description</Label>
              <Textarea
                value={testData.q1_mother_description}
                onChange={(v) => update("q1_mother_description", v)}
                placeholder="How would the mother describe the child..."
                rows={4}
              />
            </div>
            <div>
              <Label>Father&apos;s Description</Label>
              <Textarea
                value={testData.q1_father_description}
                onChange={(v) => update("q1_father_description", v)}
                placeholder="How would the father describe the child..."
                rows={4}
              />
            </div>
          </div>
        );

      /* ---- Q2 ---- */
      case 1:
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">
              Q2. What kind of relationship do you share with your child?
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label>Dad&apos;s Relationship</Label>
                <RadioGroup
                  options={RELATIONSHIP_OPTIONS}
                  value={testData.q2_dad_relationship}
                  onChange={(v) => update("q2_dad_relationship", v)}
                />
              </div>
              <div>
                <Label>Mom&apos;s Relationship</Label>
                <RadioGroup
                  options={RELATIONSHIP_OPTIONS}
                  value={testData.q2_mom_relationship}
                  onChange={(v) => update("q2_mom_relationship", v)}
                />
              </div>
            </div>
          </div>
        );

      /* ---- Q3 ---- */
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Q3. Your child&apos;s school journey
            </h3>
            {[
              { key: "q3_favourite_subject" as const, label: "Favourite subject" },
              { key: "q3_hated_subject" as const, label: "Subject they hate" },
              { key: "q3_kind_of_learner" as const, label: "Kind of learner (slow / average / fast)" },
              { key: "q3_learning_style" as const, label: "Learning style (readers / listeners / practical / rote / understand)" },
              { key: "q3_relationship_teachers" as const, label: "Relationship with teachers" },
              { key: "q3_relationship_friends" as const, label: "Relationship with friends and peers" },
              { key: "q3_relationship_opposite_gender" as const, label: "Relationship with opposite gender" },
              { key: "q3_bullied_or_harassed" as const, label: "Was child ever bullied or harassed?" },
              { key: "q3_marks_scoring" as const, label: "Marks - how do they score?" },
              { key: "q3_won_appreciated" as const, label: "Won / appreciated for anything?" },
              { key: "q3_extracurriculars" as const, label: "Extracurricular participation" },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label>{label}</Label>
                <Textarea
                  value={testData[key]}
                  onChange={(v) => update(key, v)}
                  rows={2}
                />
              </div>
            ))}
          </div>
        );

      /* ---- Q4 ---- */
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Q4. Describe their routine
            </h3>
            {[
              { key: "q4_waking_sleeping" as const, label: "Waking up and sleeping times" },
              { key: "q4_eating_habits" as const, label: "Eating habits" },
              { key: "q4_studying_habits" as const, label: "Studying habits" },
              { key: "q4_deadlines_approach" as const, label: "How do they approach deadlines?" },
              { key: "q4_traveling" as const, label: "Traveling" },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label>{label}</Label>
                <Textarea
                  value={testData[key]}
                  onChange={(v) => update(key, v)}
                  rows={2}
                />
              </div>
            ))}

            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-4">
              <p className="mb-3 text-sm font-medium text-slate-300">
                Rate the following (1-10):
              </p>
              <div className="space-y-4">
                <RatingSlider
                  label="Attention / Focus"
                  value={testData.q4_rate_attention}
                  onChange={(v) => update("q4_rate_attention", v)}
                />
                <RatingSlider
                  label="Emotional Regulation"
                  value={testData.q4_rate_emotional_regulation}
                  onChange={(v) => update("q4_rate_emotional_regulation", v)}
                />
                <RatingSlider
                  label="Decision Making"
                  value={testData.q4_rate_decision_making}
                  onChange={(v) => update("q4_rate_decision_making", v)}
                />
                <RatingSlider
                  label="Social Interaction"
                  value={testData.q4_rate_social_interaction}
                  onChange={(v) => update("q4_rate_social_interaction", v)}
                />
                <RatingSlider
                  label="Time Management"
                  value={testData.q4_rate_time_management}
                  onChange={(v) => update("q4_rate_time_management", v)}
                />
              </div>
            </div>
          </div>
        );

      /* ---- Q5 ---- */
      case 4:
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">
              Q5. How much do the following matter to your child?
            </h3>
            {[
              { rKey: "q5_money_rating" as const, eKey: "q5_money_explanation" as const, label: "Money" },
              { rKey: "q5_creative_expression_rating" as const, eKey: "q5_creative_expression_explanation" as const, label: "Creative Expression" },
              { rKey: "q5_passion_rating" as const, eKey: "q5_passion_explanation" as const, label: "Following Their Passion" },
              { rKey: "q5_satisfaction_rating" as const, eKey: "q5_satisfaction_explanation" as const, label: "Satisfaction and Happiness" },
              { rKey: "q5_giving_back_rating" as const, eKey: "q5_giving_back_explanation" as const, label: "Giving Back to Society" },
            ].map(({ rKey, eKey, label }) => (
              <div
                key={rKey}
                className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-3"
              >
                <RatingSlider
                  label={label}
                  value={testData[rKey] as number}
                  onChange={(v) => update(rKey, v)}
                />
                <Textarea
                  value={testData[eKey]}
                  onChange={(v) => update(eKey, v)}
                  placeholder={`Why does ${label.toLowerCase()} matter (or not) to them?`}
                  rows={2}
                />
              </div>
            ))}
          </div>
        );

      /* ---- Q6 ---- */
      case 5:
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">
              Q6. What does your child do in their free time?
            </h3>
            <Textarea
              value={testData.q6_free_time}
              onChange={(v) => update("q6_free_time", v)}
              placeholder="Describe what your child does when they have free time..."
              rows={6}
            />
          </div>
        );

      /* ---- Q7 ---- */
      case 6: {
        const rows = [
          { label: "Comfort Level", prefix: "q7_comfort" },
          { label: "Communication Style", prefix: "q7_communication" },
          { label: "Initiation of Interaction", prefix: "q7_initiation" },
          { label: "Emotional Expression", prefix: "q7_emotional" },
        ] as const;
        const cols = [
          { label: "Close Family", suffix: "close_family" },
          { label: "Friends", suffix: "friends" },
          { label: "Authority", suffix: "authority" },
          { label: "Strangers", suffix: "strangers" },
        ] as const;

        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">
              Q7. How is your child in different social spaces?
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-xs font-medium text-slate-400" />
                    {cols.map((c) => (
                      <th
                        key={c.suffix}
                        className="p-2 text-center text-xs font-medium text-indigo-400"
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.prefix}>
                      <td className="p-2 text-xs font-medium text-slate-300 whitespace-nowrap">
                        {row.label}
                      </td>
                      {cols.map((col) => {
                        const fieldKey = `${row.prefix}_${col.suffix}` as keyof TestData;
                        return (
                          <td key={col.suffix} className="p-1">
                            <TextInput
                              value={testData[fieldKey] as string}
                              onChange={(v) => update(fieldKey, v)}
                              placeholder="..."
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      /* ---- Q8 ---- */
      case 7:
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">
              Q8a. How much are they influenced by?
            </h3>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-4">
              <RatingSlider
                label="Media"
                value={testData.q9_media_rating}
                onChange={(v) => update("q9_media_rating", v)}
              />
              <div>
                <Label>What content do they watch?</Label>
                <Textarea
                  value={testData.q9_media_content}
                  onChange={(v) => update("q9_media_content", v)}
                  rows={2}
                />
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <RatingSlider
                label="Friends"
                value={testData.q9_friends_rating}
                onChange={(v) => update("q9_friends_rating", v)}
              />
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <RatingSlider
                label="Parents / Family"
                value={testData.q9_parents_family_rating}
                onChange={(v) => update("q9_parents_family_rating", v)}
              />
            </div>
            <div>
              <Label>Anything else that influences them?</Label>
              <Textarea
                value={testData.q9_anything_else_influence}
                onChange={(v) => update("q9_anything_else_influence", v)}
                rows={2}
              />
            </div>

            <hr className="border-slate-800" />

            <h3 className="text-lg font-semibold text-white">
              Q8b. Any incidents/events that impacted or changed them as a person?
            </h3>
            <Textarea
              value={testData.q9b_incidents}
              onChange={(v) => update("q9b_incidents", v)}
              placeholder="Describe any significant incidents or events..."
              rows={4}
            />
          </div>
        );

      /* ---- Q9 ---- */
      case 8:
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">
              Q9. Thoughts on career
            </h3>
            <p className="text-sm text-slate-400">
              Are there any fields or career paths that make you uncomfortable?
              Please share your thoughts and reasons.
            </p>
            <Textarea
              value={testData.q10_career_thoughts}
              onChange={(v) => update("q10_career_thoughts", v)}
              placeholder="Share your thoughts on uncomfortable career fields and why..."
              rows={6}
            />
          </div>
        );

      /* ---- Q10 ---- */
      case 9: {
        const stages = [
          { label: "11th - 12th", prefix: "q11_11_12" },
          { label: "Graduation", prefix: "q11_grad" },
          { label: "Masters", prefix: "q11_masters" },
          { label: "Settle", prefix: "q11_settle" },
        ] as const;
        const locations = [
          { label: "Home City", suffix: "home" },
          { label: "Anywhere in India", suffix: "india" },
          { label: "Abroad", suffix: "abroad" },
        ] as const;

        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">
              Q10. Stance on where to study
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-xs font-medium text-slate-400" />
                    {locations.map((loc) => (
                      <th
                        key={loc.suffix}
                        className="p-2 text-center text-xs font-medium text-indigo-400"
                      >
                        {loc.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stages.map((stage) => (
                    <tr key={stage.prefix} className="border-t border-slate-800">
                      <td className="p-2 text-xs font-medium text-slate-300 whitespace-nowrap align-top">
                        {stage.label}
                      </td>
                      {locations.map((loc) => {
                        const yesNoKey = `${stage.prefix}_${loc.suffix}` as keyof TestData;
                        const whyKey = `${stage.prefix}_${loc.suffix}_why` as keyof TestData;
                        return (
                          <td key={loc.suffix} className="p-2 align-top">
                            <div className="space-y-1.5">
                              <YesNoToggle
                                value={testData[yesNoKey] as string}
                                onChange={(v) => update(yesNoKey, v)}
                              />
                              {testData[yesNoKey] && (
                                <Textarea
                                  value={testData[whyKey] as string}
                                  onChange={(v) => update(whyKey, v)}
                                  placeholder="Why?"
                                  rows={2}
                                />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      /* ---- Q11 ---- */
      case 10:
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">
              Q11. Their expectations related to
            </h3>
            <div>
              <Label>Marriage</Label>
              <Textarea
                value={testData.q12_marriage}
                onChange={(v) => update("q12_marriage", v)}
                placeholder="Expectations around marriage..."
                rows={3}
              />
            </div>
            <div>
              <Label>Time to become independent</Label>
              <Textarea
                value={testData.q12_independence_time}
                onChange={(v) => update("q12_independence_time", v)}
                placeholder="When do you expect them to be independent..."
                rows={3}
              />
            </div>
            <div>
              <Label>Until what age will you provide financial support?</Label>
              <Textarea
                value={testData.q12_financial_support_age}
                onChange={(v) => update("q12_financial_support_age", v)}
                placeholder="Financial support expectations..."
                rows={3}
              />
            </div>
          </div>
        );

      /* ---- Q12 ---- */
      case 11:
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">
              Q12. Parents&apos; risk-taking behaviour
            </h3>
            <p className="text-sm text-slate-400">
              Select all that apply to your stance:
            </p>
            <div className="space-y-2">
              {RISK_BEHAVIOUR_OPTIONS.map((opt) => {
                const selected = testData.q13_risk_behaviour.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const current = testData.q13_risk_behaviour;
                      const next = selected
                        ? current.filter((x) => x !== opt)
                        : [...current, opt];
                      update("q13_risk_behaviour", next);
                    }}
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all ${
                      selected
                        ? "border-indigo-500 bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/40"
                        : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded border text-xs">
                      {selected ? "\u2713" : ""}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );

      /* ---- Q13 ---- */
      case 12:
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">
              Q13. Non-conventional questions
            </h3>
            <div>
              <Label>What hidden talents does your child have?</Label>
              <Textarea
                value={testData.q14_hidden_talents}
                onChange={(v) => update("q14_hidden_talents", v)}
                placeholder="Hidden talents..."
                rows={3}
              />
            </div>
            <div>
              <Label>
                If money and marks were not a concern, what would they become?
              </Label>
              <Textarea
                value={testData.q14_if_no_constraints}
                onChange={(v) => update("q14_if_no_constraints", v)}
                placeholder="If there were no constraints..."
                rows={3}
              />
            </div>
            <div>
              <Label>Qualities your child got from Mom</Label>
              <Textarea
                value={testData.q14_qualities_from_mom}
                onChange={(v) => update("q14_qualities_from_mom", v)}
                placeholder="Qualities from mother..."
                rows={3}
              />
            </div>
            <div>
              <Label>Qualities your child got from Dad</Label>
              <Textarea
                value={testData.q14_qualities_from_dad}
                onChange={(v) => update("q14_qualities_from_dad", v)}
                placeholder="Qualities from father..."
                rows={3}
              />
            </div>
          </div>
        );

      /* ---- Q14 ---- */
      case 13:
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">
              Q14. Anything else we should know?
            </h3>
            <Textarea
              value={testData.q15_anything_else}
              onChange={(v) => update("q15_anything_else", v)}
              placeholder="Any other information that might help us understand your child better..."
              rows={6}
            />
          </div>
        );

      default:
        return null;
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Main render                                                      */
  /* ---------------------------------------------------------------- */

  const isLastPage = page === TOTAL_QUESTIONS - 1;

  return (
    <ReadOnlyContext.Provider value={readOnly}>
      <div className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Question {page + 1} of {TOTAL_QUESTIONS}
          </span>
          <span>{Math.round(((page + 1) / TOTAL_QUESTIONS) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-800">
          <div
            className="h-1.5 rounded-full bg-indigo-500 transition-all duration-300"
            style={{
              width: `${((page + 1) / TOTAL_QUESTIONS) * 100}%`,
            }}
          />
        </div>
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 pt-1">
          {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={`h-2 w-2 rounded-full transition-all ${
                i === page
                  ? "bg-indigo-500 scale-125"
                  : i < page
                  ? "bg-indigo-500/40"
                  : "bg-slate-700"
              }`}
              title={`Go to question ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Question content */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 md:p-6">
        {renderQuestion()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={page === 0}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
            page === 0
              ? "cursor-not-allowed bg-slate-800 text-slate-600"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
        >
          Back
        </button>

        {isLastPage ? (
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500"
          >
            {readOnly ? "Exit" : "Submit"}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500"
          >
            Next
          </button>
        )}
      </div>
    </div>
    </ReadOnlyContext.Provider>
  );
}

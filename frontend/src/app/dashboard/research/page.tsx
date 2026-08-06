"use client";
import React, { useState } from 'react';

const basicQuestions = [
    { key: 'q1', num: '1', title: 'What is this profession?', desc: 'Explanation in simple, child-friendly language.' },
    { key: 'q2', num: '2', title: 'Daily Responsibilities', desc: 'What does a professional in this field actually do on a daily basis?' },
    { key: 'q3', num: '3', title: 'Common Job Roles & Designations', desc: 'Typical titles and hierarchy.' },
    { key: 'q4', num: '4', title: 'Workday in Early Career (0–3 Years)', desc: 'What to expect in the beginning.' },
    { key: 'q5', num: '5', title: 'Top 5 Important Skills', desc: 'Core technical and soft skills.' },
    { key: 'q6', num: '6', title: 'Personal Qualities & Habits', desc: 'Attributes that help someone succeed.' },
    { key: 'q7', num: '7', title: 'Advantages & Challenges', desc: 'Pros and cons of this career path.' },
    { key: 'q8', num: '8', title: 'Lifestyle & Work-Life Balance', desc: 'Working hours, pressure, travel, and flexibility.' },
    { key: 'q9', num: '9', title: 'Academic Pathways', desc: 'How to enter after 10th, 12th, or graduation.' },
    { key: 'q10', num: '10', title: 'Streams, Subjects & Degrees', desc: 'Best choices for secondary and higher education.' },
    { key: 'q11', num: '11', title: 'Entrance Exams', desc: 'Standard qualifying examinations.' },
    { key: 'q12', num: '12', title: 'Leading Colleges in India', desc: 'Top universities offering relevant courses.' },
    { key: 'q13', num: '13', title: 'Explore & Prepare Now', desc: 'Readings, activities, and volunteer ideas for students.' },
    { key: 'q14', num: '14', title: 'Early Advantage Boosters', desc: 'Short courses, certifications, and early internships.' }
];

const advancedQuestions = [
    { key: 'q1', num: '1', title: 'Pathways & Specialisations', desc: 'Detailed sub-fields and domains.' },
    { key: 'q3', num: '3', title: 'Alternative Routes', desc: 'Plan B pathways if primary entry fails.' },
    { key: 'q7', num: '7', title: 'Success & Earning Drivers', desc: 'Key factors that influence growth and pay.' },
    { key: 'q8', num: '8', title: 'Freelancing & Entrepreneurship', desc: 'Self-employment and private practice potential.' },
    { key: 'q9', num: '9', title: 'Major Career Risks & Trade-offs', desc: 'Difficulties and competition levels.' },
    { key: 'q10', num: '10', title: 'Current Demand', desc: 'Hiring outlook in India and abroad.' },
    { key: 'q11', num: '11', title: 'Future Outlook (3-5 Years)', desc: 'Growth projections.' },
    { key: 'q12', num: '12', title: 'Technology & AI Disruption', desc: 'How automation, regulation, or market changes will shape this role.' },
    { key: 'q13', num: '13', title: 'Emerging Core Skills', desc: 'Skills that will be most valuable in the coming years.' }
];

export default function AIResearchPage() {
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
    const [advancedUnlocked, setAdvancedUnlocked] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);
        setAdvancedUnlocked(false);
        setActiveTab('basic');

        try {
            const res = await fetch('/api/client/research/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to fetch research');
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-16 text-slate-800">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: '#0f172a' }}>AI Profession Research Lab</h1>
                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Instant structured intelligence reports</p>
                    </div>
                </div>
                <p className="text-sm mb-8 text-slate-650" style={{ color: '#475569' }}>Enter the name of any profession to instantly generate a detailed, structured two-stage overview.</p>

                <form onSubmit={handleSearch} className="mb-8">
                    <div className="relative">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Enter profession (e.g. Aerospace Engineer, Product Manager, Marine Biologist)"
                            className="w-full pl-6 pr-32 py-4 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-base"
                            style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !topic.trim()}
                            className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center cursor-pointer"
                        >
                            {loading ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Research'}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl mb-8 text-xs font-semibold">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="space-y-6">
                        {/* Tab Headers */}
                        <div className="flex border-b border-slate-200 gap-2 shrink-0">
                            <button
                                onClick={() => setActiveTab('basic')}
                                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${activeTab === 'basic' ? 'border-indigo-600 text-indigo-650' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                            >
                                1. Basic Understanding
                            </button>
                            <button
                                onClick={() => setActiveTab('advanced')}
                                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'advanced' ? 'border-indigo-600 text-indigo-650' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                            >
                                2. Advanced Understanding
                                {!advancedUnlocked && <span className="text-[10px]">🔒</span>}
                            </button>
                        </div>

                        {/* Basic Section */}
                        {activeTab === 'basic' && (
                            <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
                                {basicQuestions.map((q) => (
                                    <div key={q.key} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:border-slate-350 transition-all">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-150 flex items-center justify-center text-[10px] font-bold text-indigo-650">{q.num}</span>
                                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{q.title}</h3>
                                        </div>
                                        <p className="text-slate-700 text-xs leading-relaxed font-medium">{result.basic?.[q.key] || 'Generating information...'}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Advanced Section */}
                        {activeTab === 'advanced' && (
                            <div className="space-y-8 animate-fade-in">
                                {!advancedUnlocked ? (
                                    <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
                                        <div className="w-12 h-12 bg-white border border-slate-300 rounded-xl flex items-center justify-center mx-auto text-lg shadow-sm">🔒</div>
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Locked Section</h3>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            This advanced specialisation and personalized fit overview should be opened together with your counselor during your review meeting.
                                        </p>
                                        <button
                                            onClick={() => setAdvancedUnlocked(true)}
                                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                                        >
                                            Unlock Advanced Section
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-8 text-slate-800">
                                        {/* Personalized Guidance Header Callouts */}
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {/* Circular Fit Score */}
                                            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50 flex flex-col items-center text-center justify-center space-y-3 shadow-sm">
                                                <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">AI Profile Fit Score</div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-5xl font-black text-slate-900">{result.advanced?.q15?.score || '—'}</span>
                                                    <span className="text-sm text-slate-500 font-bold">/10</span>
                                                </div>
                                                <div className="text-xs font-semibold text-slate-700 max-w-xs">{result.advanced?.q15?.recommendation}</div>
                                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase tracking-widest border border-indigo-200">Personalized Match</span>
                                            </div>

                                            {/* Personal Fit Strengths & Gaps */}
                                            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">🎯 Quick Diagnostic</h4>
                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">Use Your Strengths</span>
                                                        <p className="text-slate-650 leading-relaxed text-[11px] font-medium">{result.advanced?.q14?.strengths}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block">Address Your Gaps</span>
                                                        <p className="text-slate-650 leading-relaxed text-[11px] font-medium">{result.advanced?.q14?.gaps}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Table of Pathways (q2) */}
                                        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Detailed Pathways & Course Details</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                                            <th className="py-2.5 pr-4">Specialization</th>
                                                            <th className="py-2.5 pr-4">Degree & Duration</th>
                                                            <th className="py-2.5 pr-4">Subjects & Exam</th>
                                                            <th className="py-2.5 pr-4">Colleges & Fees</th>
                                                            <th className="py-2.5">Available Roles</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                                        {(result.advanced?.q2 || []).map((path: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                                <td className="py-3 pr-4 font-bold text-slate-900">{path.pathwayName}</td>
                                                                <td className="py-3 pr-4">{path.degreeName} ({path.duration})</td>
                                                                <td className="py-3 pr-4">
                                                                    <div>{path.subjects}</div>
                                                                    <div className="text-[10px] text-slate-500 font-semibold">{path.exam} ({path.cutoff})</div>
                                                                </td>
                                                                <td className="py-3 pr-4">
                                                                    <div>{path.colleges}</div>
                                                                    <div className="text-[10px] text-indigo-650 font-bold">{path.fees}</div>
                                                                </td>
                                                                <td className="py-3">{path.roles}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Responsibilities & Salaries Timeline (q4, q5, q6) */}
                                        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Experience Level Progression</h3>
                                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                                {[
                                                    { key: 'y0_3', label: '0–3 Years' },
                                                    { key: 'y3_6', label: '3–6 Years' },
                                                    { key: 'y6_10', label: '6–10 Years' },
                                                    { key: 'y10_plus', label: '10+ Years' }
                                                ].map((exp) => (
                                                    <div key={exp.key} className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3 shadow-inner">
                                                        <div className="text-xs font-black text-indigo-600 uppercase tracking-widest">{exp.label}</div>
                                                        <div className="space-y-2 text-xs">
                                                            <div>
                                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Role Tasks</span>
                                                                <p className="text-slate-700 text-[11px] leading-relaxed mt-0.5 font-medium">{result.advanced?.q4?.[exp.key]}</p>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                                                                <div>
                                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">India Pay</span>
                                                                    <span className="text-slate-900 font-bold text-[10px]">{result.advanced?.q5?.[exp.key]}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Abroad Pay</span>
                                                                    <span className="text-slate-900 font-bold text-[10px] line-clamp-2">{result.advanced?.q6?.[exp.key]}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Standard Advanced Questions (q1, q3, q7 - q13) */}
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {advancedQuestions.map((q) => (
                                                <div key={q.key} className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:border-slate-350 transition-all">
                                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{q.title}</h4>
                                                    <p className="text-slate-700 text-xs leading-relaxed font-medium">{result.advanced?.[q.key]}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Personalized Guidance Details (q14) */}
                                        <div className="p-6 border border-indigo-250 bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl space-y-4 shadow-sm">
                                            <div className="flex items-center gap-2 border-b border-indigo-100 pb-3">
                                                <span className="text-base">👤</span>
                                                <div>
                                                    <h3 className="text-xs font-bold text-indigo-750 uppercase tracking-wider">Personalized Career Alignment Report</h3>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Based on completed assessments</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4 text-xs font-medium text-slate-700">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-indigo-650 uppercase tracking-wider block">Why this profession suits you</span>
                                                    <p className="text-slate-800 leading-relaxed">{result.advanced?.q14?.whySuit}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-indigo-650 uppercase tracking-wider block">Habits, Skills & Routines to Build</span>
                                                    <p className="text-slate-800 leading-relaxed">{result.advanced?.q14?.habits}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-indigo-650 uppercase tracking-wider block">Your 12-Month Action Plan</span>
                                                    <p className="text-slate-800 leading-relaxed whitespace-pre-line">{result.advanced?.q14?.actionPlan}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

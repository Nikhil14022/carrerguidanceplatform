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

    // Smart renderer to format objects, arrays, and strings with explicit high-contrast black text
    const renderContent = (val: any, textColor: string = '#0f172a'): React.ReactNode => {
        if (val === undefined || val === null || val === '') {
            return <p className="italic text-xs" style={{ color: '#64748b' }}>Information not available for this section.</p>;
        }

        // String, number or boolean
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            return <p className="text-xs leading-relaxed font-medium whitespace-pre-line" style={{ color: textColor }}>{String(val)}</p>;
        }

        // Array of items
        if (Array.isArray(val)) {
            if (val.length === 0) return <p className="italic text-xs" style={{ color: '#64748b' }}>—</p>;
            return (
                <div className="space-y-2 mt-1">
                    {val.map((item, idx) => {
                        if (typeof item === 'object' && item !== null) {
                            return (
                                <div key={idx} className="p-3 rounded-lg border space-y-1 text-xs" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
                                    {Object.entries(item).map(([k, v]) => (
                                        <div key={k} className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                                            <span className="font-bold capitalize shrink-0" style={{ color: '#b45309' }}>{k.replace(/_/g, ' ')}:</span>
                                            <span className="font-medium" style={{ color: '#0f172a' }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        }
                        return (
                            <div key={idx} className="flex items-start gap-2 text-xs font-medium" style={{ color: textColor }}>
                                <span className="font-bold shrink-0" style={{ color: '#d97706' }}>•</span>
                                <span>{String(item)}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Object / Dictionary
        if (typeof val === 'object') {
            const entries = Object.entries(val);
            if (entries.length === 0) return <p className="italic text-xs" style={{ color: '#64748b' }}>—</p>;
            return (
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 mt-1">
                    {entries.map(([k, v]) => (
                        <div key={k} className="p-2.5 rounded-lg border text-xs space-y-1" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
                            <span className="font-extrabold uppercase tracking-wider text-[10px] block" style={{ color: '#b45309' }}>{k.replace(/_/g, ' ')}</span>
                            <div>{renderContent(v, textColor)}</div>
                        </div>
                    ))}
                </div>
            );
        }

        return <p className="text-xs" style={{ color: textColor }}>{String(val)}</p>;
    };

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
        <div className="space-y-8 animate-fade-in pb-16">
            <div className="shadow-sm rounded-2xl p-6 md:p-8" style={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0' }}>
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#d97706' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: '#0f172a' }}>AI Profession Research Lab</h1>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#d97706' }}>Instant structured intelligence reports</p>
                    </div>
                </div>
                <p className="text-sm mb-8 font-medium" style={{ color: '#475569' }}>Enter the name of any profession to instantly generate a detailed, structured two-stage overview.</p>

                <form onSubmit={handleSearch} className="mb-8">
                    <div className="relative">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Enter profession (e.g. Aerospace Engineer, Product Manager, Marine Biologist)"
                            className="w-full pl-6 pr-32 py-4 rounded-xl outline-none font-semibold text-base shadow-sm"
                            style={{ backgroundColor: '#ffffff', color: '#000000', border: '2px solid #cbd5e1' }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !topic.trim()}
                            className="absolute right-2 top-2 bottom-2 px-6 text-xs font-bold uppercase tracking-widest rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                            style={{ backgroundColor: '#d97706', color: '#ffffff' }}
                        >
                            {loading ? (
                                <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Research'}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="p-4 rounded-xl mb-8 text-xs font-bold" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
                        {error}
                    </div>
                )}

                {result && (
                    <div className="space-y-6">
                        {/* Tab Headers */}
                        <div className="flex gap-2 shrink-0 border-b-2" style={{ borderColor: '#cbd5e1' }}>
                            <button
                                onClick={() => setActiveTab('basic')}
                                className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-all cursor-pointer rounded-t-lg"
                                style={activeTab === 'basic' ? { backgroundColor: '#fef3c7', color: '#78350f', borderBottom: '3px solid #d97706' } : { backgroundColor: '#f8fafc', color: '#475569' }}
                            >
                                1. Basic Understanding
                            </button>
                            <button
                                onClick={() => setActiveTab('advanced')}
                                className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 rounded-t-lg"
                                style={activeTab === 'advanced' ? { backgroundColor: '#fef3c7', color: '#78350f', borderBottom: '3px solid #d97706' } : { backgroundColor: '#f8fafc', color: '#475569' }}
                            >
                                2. Advanced Understanding
                                {!advancedUnlocked && <span className="text-[10px]">🔒</span>}
                            </button>
                        </div>

                        {/* Basic Section */}
                        {activeTab === 'basic' && (
                            <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
                                {basicQuestions.map((q) => (
                                    <div key={q.key} className="p-5 rounded-xl space-y-2.5 shadow-sm transition-all" style={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0' }}>
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: '#fef3c7', color: '#78350f', border: '1px solid #fde68a' }}>{q.num}</span>
                                            <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: '#0f172a' }}>{q.title}</h3>
                                        </div>
                                        <div>{renderContent(result.basic?.[q.key], '#0f172a')}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Advanced Section */}
                        {activeTab === 'advanced' && (
                            <div className="space-y-8 animate-fade-in">
                                {!advancedUnlocked ? (
                                    <div className="p-8 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm" style={{ backgroundColor: '#ffffff', border: '2px solid #cbd5e1' }}>
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto text-lg shadow-sm" style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}>🔒</div>
                                        <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: '#0f172a' }}>Locked Section</h3>
                                        <p className="text-xs leading-relaxed font-medium" style={{ color: '#334155' }}>
                                            This advanced specialisation and personalized fit overview should be opened together with your counselor during your review meeting.
                                        </p>
                                        <button
                                            onClick={() => setAdvancedUnlocked(true)}
                                            className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                                            style={{ backgroundColor: '#d97706', color: '#ffffff' }}
                                        >
                                            Unlock Advanced Section
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Personalized Guidance Header Callouts */}
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {/* Fit Score Card (High contrast dark container) */}
                                            <div className="p-6 rounded-2xl text-white flex flex-col items-center text-center justify-center space-y-3 shadow-md" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                                                <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#cbd5e1' }}>AI Profile Fit Score</div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-5xl font-black" style={{ color: '#fbbf24' }}>{typeof result.advanced?.q15 === 'object' ? (result.advanced.q15.score ?? '—') : String(result.advanced?.q15 ?? '—')}</span>
                                                    <span className="text-sm font-bold" style={{ color: '#94a3b8' }}>/10</span>
                                                </div>
                                                <div className="text-xs font-medium max-w-xs" style={{ color: '#f1f5f9' }}>{typeof result.advanced?.q15 === 'object' ? result.advanced.q15.recommendation : ''}</div>
                                                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest" style={{ backgroundColor: '#78350f', color: '#fef3c7', border: '1px solid #b45309' }}>Personalized Match</span>
                                            </div>

                                            {/* Personal Fit Strengths & Gaps */}
                                            <div className="p-6 rounded-2xl space-y-4 shadow-sm" style={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0' }}>
                                                <h4 className="text-xs font-black uppercase tracking-wider pb-2 flex items-center gap-2 border-b" style={{ color: '#0f172a', borderColor: '#e2e8f0' }}>
                                                    <span>🎯</span> Quick Diagnostic
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                                    <div className="space-y-1 p-3 rounded-xl" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                                                        <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: '#065f46' }}>Use Your Strengths</span>
                                                        <div>{renderContent(result.advanced?.q14?.strengths, '#064e3b')}</div>
                                                    </div>
                                                    <div className="space-y-1 p-3 rounded-xl" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                                                        <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: '#92400e' }}>Address Your Gaps</span>
                                                        <div>{renderContent(result.advanced?.q14?.gaps, '#78350f')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Table of Pathways (q2) */}
                                        <div className="p-6 rounded-2xl space-y-4 shadow-sm" style={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0' }}>
                                            <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: '#0f172a' }}>Detailed Pathways & Course Details</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b-2 font-black uppercase tracking-wider text-[10px]" style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: '#0f172a' }}>
                                                            <th className="py-3 px-3">Specialization</th>
                                                            <th className="py-3 px-3">Degree & Duration</th>
                                                            <th className="py-3 px-3">Subjects & Exam</th>
                                                            <th className="py-3 px-3">Colleges & Fees</th>
                                                            <th className="py-3 px-3">Available Roles</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y font-medium" style={{ borderColor: '#e2e8f0' }}>
                                                        {(Array.isArray(result.advanced?.q2) ? result.advanced.q2 : []).map((path: any, idx: number) => (
                                                            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                                                <td className="py-3 px-3 font-black" style={{ color: '#0f172a' }}>{typeof path === 'object' ? (path.pathwayName || '—') : String(path)}</td>
                                                                <td className="py-3 px-3" style={{ color: '#334155' }}>{typeof path === 'object' ? `${path.degreeName || ''} (${path.duration || ''})` : '—'}</td>
                                                                <td className="py-3 px-3">
                                                                    <div style={{ color: '#0f172a' }}>{typeof path === 'object' ? path.subjects : '—'}</div>
                                                                    <div className="text-[10px] font-bold" style={{ color: '#64748b' }}>{typeof path === 'object' ? `${path.exam || ''} (${path.cutoff || ''})` : ''}</div>
                                                                </td>
                                                                <td className="py-3 px-3">
                                                                    <div style={{ color: '#0f172a' }}>{typeof path === 'object' ? path.colleges : '—'}</div>
                                                                    <div className="text-[10px] font-black" style={{ color: '#b45309' }}>{typeof path === 'object' ? path.fees : ''}</div>
                                                                </td>
                                                                <td className="py-3 px-3" style={{ color: '#334155' }}>{typeof path === 'object' ? path.roles : '—'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Responsibilities & Salaries Timeline (q4, q5, q6) */}
                                        <div className="p-6 rounded-2xl space-y-4 shadow-sm" style={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0' }}>
                                            <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: '#0f172a' }}>Experience Level Progression</h3>
                                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                                {[
                                                    { key: 'y0_3', label: '0–3 Years' },
                                                    { key: 'y3_6', label: '3–6 Years' },
                                                    { key: 'y6_10', label: '6–10 Years' },
                                                    { key: 'y10_plus', label: '10+ Years' }
                                                ].map((exp) => {
                                                    const tasksVal = result.advanced?.q4?.[exp.key];
                                                    const indPayVal = result.advanced?.q5?.[exp.key];
                                                    const abrPayVal = result.advanced?.q6?.[exp.key];

                                                    return (
                                                        <div key={exp.key} className="p-4 rounded-xl space-y-3 shadow-sm flex flex-col justify-between" style={{ backgroundColor: '#ffffff', border: '2px solid #cbd5e1' }}>
                                                            <div className="space-y-2">
                                                                <div className="text-xs font-black uppercase tracking-widest pb-1.5 border-b" style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '4px 8px', borderRadius: '6px' }}>{exp.label}</div>
                                                                <div>
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: '#64748b' }}>Role Tasks</span>
                                                                    <div className="text-[11px] leading-relaxed mt-0.5 font-medium" style={{ color: '#0f172a' }}>
                                                                        {renderContent(typeof tasksVal === 'object' && tasksVal !== null ? tasksVal.roleTasks ?? tasksVal : tasksVal, '#0f172a')}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs" style={{ borderColor: '#cbd5e1' }}>
                                                                <div>
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: '#64748b' }}>India Pay</span>
                                                                    <span className="font-extrabold text-[10px] block" style={{ color: '#047857' }}>{typeof indPayVal === 'object' && indPayVal !== null ? (indPayVal.salaryRangeIndia ?? JSON.stringify(indPayVal)) : String(indPayVal ?? '—')}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: '#64748b' }}>Abroad Pay</span>
                                                                    <span className="font-extrabold text-[10px] block" style={{ color: '#b45309' }}>{typeof abrPayVal === 'object' && abrPayVal !== null ? (abrPayVal.salaryRangeAbroad ?? JSON.stringify(abrPayVal)) : String(abrPayVal ?? '—')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Standard Advanced Questions (q1, q3, q7 - q13) */}
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {advancedQuestions.map((q) => (
                                                <div key={q.key} className="p-5 rounded-xl space-y-2 shadow-sm" style={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0' }}>
                                                    <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: '#78350f' }}>{q.title}</h4>
                                                    <div>{renderContent(result.advanced?.[q.key], '#0f172a')}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Personalized Guidance Details (q14) */}
                                        <div className="p-6 rounded-2xl space-y-5 shadow-sm" style={{ backgroundColor: '#ffffff', border: '2px solid #d97706' }}>
                                            <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: '#fde68a' }}>
                                                <span className="text-xl">👤</span>
                                                <div>
                                                    <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: '#78350f' }}>Personalized Career Alignment Report</h3>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: '#92400e' }}>Based on completed assessments</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4 text-xs font-medium">
                                                <div className="space-y-1 p-4 rounded-xl border shadow-2xs" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
                                                    <span className="text-[10px] font-black uppercase tracking-wider block px-2.5 py-1 rounded-md w-fit mb-1.5" style={{ backgroundColor: '#fef3c7', color: '#78350f' }}>Why this profession suits you</span>
                                                    <div>{renderContent(result.advanced?.q14?.whySuit, '#0f172a')}</div>
                                                </div>
                                                <div className="space-y-1 p-4 rounded-xl border shadow-2xs" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
                                                    <span className="text-[10px] font-black uppercase tracking-wider block px-2.5 py-1 rounded-md w-fit mb-1.5" style={{ backgroundColor: '#fef3c7', color: '#78350f' }}>Habits, Skills & Routines to Build</span>
                                                    <div>{renderContent(result.advanced?.q14?.habits, '#0f172a')}</div>
                                                </div>
                                                <div className="space-y-1 p-4 rounded-xl border shadow-2xs" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
                                                    <span className="text-[10px] font-black uppercase tracking-wider block px-2.5 py-1 rounded-md w-fit mb-1.5" style={{ backgroundColor: '#fef3c7', color: '#78350f' }}>Your 12-Month Action Plan</span>
                                                    <div>{renderContent(result.advanced?.q14?.actionPlan, '#0f172a')}</div>
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

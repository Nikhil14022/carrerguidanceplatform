"use client";
import React from 'react';

interface ComparisonFactor {
    factor: string;
    option1: string;
    option2: string;
    score1?: number;
    score2?: number;
}

interface FinalPlan {
    comparisonData: any;
    finalRoadmap: string;
    verdict?: string;
    tips?: string[];
}

interface ComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: FinalPlan | null;
    career1: string;
    career2: string;
}

export default function ComparisonModal({ isOpen, onClose, plan, career1, career2 }: ComparisonModalProps) {
    if (!isOpen) return null;

    const comparisonFactors = plan?.comparisonData as ComparisonFactor[] || [];

    // Calculate visual scores for each factor (heuristic: longer response = higher score)
    const scoredFactors = comparisonFactors.map(f => {
        const s1 = f.score1 || Math.min(95, Math.max(40, (f.option1?.length || 0) * 1.2 + 30));
        const s2 = f.score2 || Math.min(95, Math.max(40, (f.option2?.length || 0) * 1.2 + 30));
        return { ...f, score1: Math.round(s1), score2: Math.round(s2) };
    });

    // Overall scores
    const avgScore1 = scoredFactors.length > 0 ? Math.round(scoredFactors.reduce((a, f) => a + f.score1, 0) / scoredFactors.length) : 50;
    const avgScore2 = scoredFactors.length > 0 ? Math.round(scoredFactors.reduce((a, f) => a + f.score2, 0) / scoredFactors.length) : 50;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Final Career Comparison</h2>
                        <p className="text-slate-400 text-sm">Strategic analysis of your top two career paths.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-12">

                    {/* Visual Score Overview */}
                    <section>
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="glass-card p-6 text-center border-indigo-500/20 bg-indigo-500/5">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Option A</div>
                                <h3 className="text-lg font-bold text-indigo-400 mb-3">{career1}</h3>
                                <div className="relative mx-auto w-24 h-24">
                                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="url(#grad1)" strokeWidth="8"
                                            strokeDasharray={`${avgScore1 * 2.51} 251`}
                                            strokeLinecap="round" />
                                        <defs><linearGradient id="grad1"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#6366f1" /></linearGradient></defs>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-indigo-400">{avgScore1}</div>
                                </div>
                            </div>
                            <div className="glass-card p-6 text-center border-purple-500/20 bg-purple-500/5">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Option B</div>
                                <h3 className="text-lg font-bold text-purple-400 mb-3">{career2}</h3>
                                <div className="relative mx-auto w-24 h-24">
                                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="url(#grad2)" strokeWidth="8"
                                            strokeDasharray={`${avgScore2 * 2.51} 251`}
                                            strokeLinecap="round" />
                                        <defs><linearGradient id="grad2"><stop offset="0%" stopColor="#c084fc" /><stop offset="100%" stopColor="#a855f7" /></linearGradient></defs>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-purple-400">{avgScore2}</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Factor Bar Charts */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold">Factor-by-Factor Breakdown</h3>
                        </div>

                        <div className="space-y-6">
                            {scoredFactors.map((item, idx) => (
                                <div key={idx} className="p-5 bg-white/5/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                                    <h4 className="text-sm font-bold text-slate-300 mb-4">{item.factor}</h4>

                                    {/* Visual bars */}
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-indigo-400 w-10 text-right">{item.score1}%</span>
                                            <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-700" style={{ width: `${item.score1}%` }} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-purple-400 w-10 text-right">{item.score2}%</span>
                                            <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-700" style={{ width: `${item.score2}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Text details */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-xs text-slate-400 leading-relaxed border-l-2 border-indigo-500/30 pl-3">{item.option1}</div>
                                        <div className="text-xs text-slate-400 leading-relaxed border-l-2 border-purple-500/30 pl-3">{item.option2}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Verdict */}
                    {plan?.verdict && (
                        <section className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">⚖️</span>
                                <h3 className="text-lg font-bold text-amber-400">AI Verdict</h3>
                            </div>
                            <p className="text-slate-300 leading-relaxed">{plan.verdict}</p>
                        </section>
                    )}

                    {/* Final Roadmap */}
                    {plan?.finalRoadmap && (
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-emerald-400">Your 12-Month Execution Roadmap</h3>
                            </div>

                            <div className="glass-card p-8 bg-emerald-500/5 border-emerald-500/10">
                                <div className="prose prose-invert max-w-none">
                                    <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {plan.finalRoadmap}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Expert Tips */}
                    {plan?.tips && plan.tips.length > 0 && (
                        <section className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Strategic Success Tips</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                {plan.tips.map((tip, idx) => (
                                    <div key={idx} className="flex gap-3 p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-slate-400 italic">"{tip}"</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-slate-900 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                            <span className="text-xs text-slate-500 font-bold">{career1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                            <span className="text-xs text-slate-500 font-bold">{career2}</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/5 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="px-6 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            Save as PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

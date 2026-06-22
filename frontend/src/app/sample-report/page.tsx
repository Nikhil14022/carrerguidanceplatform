"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function SampleReportPage() {
    const router = useRouter();

    const sampleReport = {
        title: "The Strategic Architect",
        createdAt: new Date().toISOString(),
        content: `You possess a unique cognitive blend of high-level systems thinking and tactical execution. Your assessment data indicates a strong "Architect" marker in the Personal Foundation module, suggesting you thrive when designing complex solutions to abstract problems. In the Skills domain, your quantitative aptitude is balanced by a high degree of empathy, making you an ideal candidate for leadership roles that require both technical mastery and stakeholder alignment. Your Values module highlights a deep-seated need for autonomy and intellectual challenge, pointing away from traditional, rigid corporate hierarchies and toward dynamic, high-growth environments.`,
        careerOptions: [
            {
                id: "1",
                title: "Quantitative Finance Strategist",
                match: 98,
                reasoning: "Your exceptional mathematical foundation paired with institutional curiosity makes you a top-tier candidate for algorithmic strategy roles. You don't just see numbers; you see the narrative of market efficiency."
            },
            {
                id: "2",
                title: "AI Product Management",
                match: 94,
                reasoning: "The ability to bridge technical AI capabilities with user-centric product discovery is your core competitive advantage. You are naturally wired to lead cross-functional engineering teams."
            },
            {
                id: "3",
                title: "Strategic Operations Lead",
                match: 91,
                reasoning: "Your systems-thinking markers suggest you would excel at optimizing complex organizational workflows. You possess the rare 'Operations-as-a-Product' mindset that scales companies."
            }
        ],
        gaps: [
            "Advanced Stakeholder Management",
            "Cross-functional Leadership in Matrix Environments",
            "Complex Risk Modeling in Volatile Markets"
        ]
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="max-w-5xl mx-auto space-y-12">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-12">
                    <div>
                        <button
                            onClick={() => router.push('/')}
                            className="text-xs font-bold text-slate-500 hover:text-indigo-400 mb-6 flex items-center gap-2 uppercase tracking-widest transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2} /></svg>
                            Back to Home
                        </button>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-[10px] font-bold text-indigo-400 mb-4 uppercase tracking-widest">
                            Sample Analysis Report
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">The <span className="text-gradient">Strategic Architect</span></h1>
                        <p className="text-slate-500 italic">Example AI Synthesis — Last Updated March 2026</p>
                    </div>
                    <div className="glass px-6 py-4 rounded-3xl border border-indigo-500/20 text-center">
                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Potential Profile</div>
                        <div className="text-xl font-bold">Elite Tier</div>
                    </div>
                </header>

                <div className="grid lg:grid-cols-[1fr_350px] gap-12">
                    <div className="space-y-12">
                        {/* Personality Profile */}
                        <section className="glass-card p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50" />
                            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth={2} /></svg>
                                </span>
                                Professional Persona
                            </h2>
                            <div className="text-slate-300 leading-relaxed space-y-4 text-lg font-light">
                                {sampleReport.content}
                            </div>
                        </section>

                        {/* Top Career Paths */}
                        <section className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={2} /></svg>
                                    </span>
                                    Recommended Trajectories
                                </h2>
                            </div>
                            <div className="grid gap-6">
                                {sampleReport.careerOptions.map((opt) => (
                                    <div key={opt.id} className="glass-card p-8 border hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{opt.title}</h3>
                                                <div className="flex gap-3">
                                                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">High Potential</span>
                                                    <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest border border-white/5">Global Demand</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-3xl font-black text-indigo-500">{opt.match}%</span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alignment Match</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-400 leading-relaxed text-base border-l-2 border-slate-800 pl-6 mb-4">
                                            {opt.reasoning}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar: Gaps & Actions */}
                    <aside className="space-y-8">
                        <div className="glass-card p-8 border-amber-500/20 bg-amber-500/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-20">
                                <svg className="w-20 h-20 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth={2} /></svg>
                                Growth Areas
                            </h3>
                            <ul className="space-y-6">
                                {sampleReport.gaps.map((gap, i) => (
                                    <li key={i} className="flex items-start gap-4 text-sm text-slate-300">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="leading-tight font-medium">{gap}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="glass-card p-8 space-y-8 bg-indigo-600/10 border-indigo-500/30">
                            <div className="space-y-2 text-center border-b border-indigo-500/10 pb-6">
                                <h3 className="text-lg font-bold">Uncover Your Plan</h3>
                                <p className="text-xs text-indigo-300/80 leading-relaxed font-medium">Ready to see your own strategic trajectories? Start your journey today.</p>
                            </div>
                            <div className="space-y-4">
                                <button
                                    onClick={() => router.push('/register')}
                                    className="w-full btn-primary py-4 text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                                >
                                    Get Your Personalized Analysis
                                </button>
                                <button
                                    onClick={() => router.push('/')}
                                    className="w-full btn-secondary py-4 text-[10px] font-bold uppercase tracking-widest"
                                >
                                    Learn More
                                </button>
                            </div>
                        </div>

                        <div className="p-4 text-center">
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">© 2026 Career Path AI</p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

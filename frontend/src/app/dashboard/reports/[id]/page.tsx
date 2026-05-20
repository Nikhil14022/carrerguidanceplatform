"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ResearchModal from '@/components/ResearchModal';
import ComparisonModal from '@/components/ComparisonModal';

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [selectedCareer, setSelectedCareer] = useState<{ id: string; title: string } | null>(null);
    const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
    const [finalPlan, setFinalPlan] = useState<any>(null);
    const [isComparisonOpen, setIsComparisonOpen] = useState(false);
    const [generatingPlan, setGeneratingPlan] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchReport();
        }
    }, [status]);

    const fetchReport = async () => {
        try {
            const { id } = await params;
            const res = await fetch(`/api/client/reports/${id}`);
            const data = await res.json();
            setReport(data);

            // Sync shortlisted IDs
            const initialShortlisted = data.careerOptions
                ?.filter((c: any) => c.isShortlisted)
                .map((c: any) => c.id) || [];
            setShortlistedIds(initialShortlisted);

            // Fetch existing final plan if any
            const planRes = await fetch(`/api/client/reports/${id}/final-plan`);
            if (planRes.ok) {
                const planData = await planRes.json();
                setFinalPlan(planData);
            }
        } catch (err) {
            console.error('Failed to fetch report', err);
        } finally {
            setLoading(false);
        }
    };

    const handleShortlist = async (careerId: string) => {
        try {
            const res = await fetch('/api/client/shortlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ careerOptionId: careerId })
            });

            if (!res.ok) {
                const error = await res.json();
                alert(error.error || 'Failed to shortlist');
                return;
            }

            const updated = await res.json();
            setShortlistedIds(prev =>
                updated.isShortlisted
                    ? [...prev, careerId]
                    : prev.filter(id => id !== careerId)
            );
        } catch (err) {
            console.error('Shortlist error:', err);
        }
    };

    const handleGenerateFinalPlan = async () => {
        if (shortlistedIds.length !== 2) return;
        setGeneratingPlan(true);
        try {
            const { id } = await params;
            const res = await fetch(`/api/client/reports/${id}/final-plan`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to generate plan');
            const data = await res.json();
            setFinalPlan(data);
            setIsComparisonOpen(true);
        } catch (err) {
            console.error('Plan generation error:', err);
        } finally {
            setGeneratingPlan(false);
        }
    };

    const handleGenerateReport = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/client/reports/generate', { method: 'POST' });
            if (!res.ok) throw new Error('Generation failed');
            const data = await res.json();
            // Navigate to the newly created report
            if (data.id) {
                router.push(`/dashboard/reports/${data.id}`);
            } else {
                router.refresh();
            }
        } catch (err) {
            console.error('AI Generation Error:', err);
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPdf = async () => {
        setDownloading(true);
        try {
            const { id } = await params;
            // Native browser download trick without leaving page
            window.open(`/api/client/reports/${id}/download`, '_blank');
        } catch (err) {
            console.error('PDF Download Error:', err);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-[#030712] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!report) return <div>Report not found</div>;

    return (
        <div className="min-h-screen bg-[#030712] text-slate-100 p-8">
            <div className="max-w-5xl mx-auto space-y-12">
                {/* Header */}
                <header className="flex justify-between items-center">
                    <div>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-xs font-bold text-slate-500 hover:text-indigo-400 mb-4 flex items-center gap-2 uppercase tracking-widest"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2} /></svg>
                            Back to Dashboard
                        </button>
                        <h1 className="text-4xl font-bold tracking-tight">AI Career Analysis</h1>
                        <p className="text-slate-500 mt-2 italic">Synthesized on {new Date(report.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleDownloadPdf}
                            disabled={downloading}
                            className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-4 py-2.5 rounded-xl border border-indigo-500/20 transition-all focus:outline-none"
                        >
                            {downloading ? (
                                <div className="w-4 h-4 border-2 border-indigo-400 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            )}
                            <span className="text-xs font-bold uppercase tracking-widest">{downloading ? 'Preparing...' : 'Download PDF'}</span>
                        </button>
                        <div className="glass px-6 py-3 rounded-2xl border border-indigo-500/20 hidden md:block">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Profile Status: Elite</span>
                        </div>
                    </div>
                </header>

                <div className="grid lg:grid-cols-[1fr_350px] gap-12">
                    <div className="space-y-12">
                        {/* Personality Profile */}
                        <section className="glass-card p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32" />
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth={2} /></svg>
                                </span>
                                Professional Persona
                            </h2>
                            <div className="text-slate-300 leading-relaxed space-y-4 text-lg">
                                {report.content}
                                {(report.content.includes('Pending Analysis') || report.content.includes('temporarily unavailable')) && (
                                    <div className="mt-8 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                                        <p className="text-sm text-indigo-300 mb-4 font-medium italic">Groq API key detected or service recovered? Click below to synthesize your live professional analysis.</p>
                                        <button
                                            onClick={handleGenerateReport}
                                            disabled={generating}
                                            className="btn-primary py-3 px-8 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 w-full sm:w-auto"
                                        >
                                            {generating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                    Synthesizing...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    Regenerate AI Analysis
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Top Career Paths */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={2} /></svg>
                                </span>
                                Recommended Trajectories
                            </h2>
                            <div className="grid gap-6">
                                {report.careerOptions?.map((opt: any) => (
                                    <div key={opt.id} className="glass-card p-8 border hover:border-indigo-500/30 transition-all group">
                                        <div className="flex justify-between items-start mb-6">
                                            <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{opt.title}</h3>
                                            <div className="flex flex-col items-end">
                                                <span className="text-2xl font-black text-indigo-500">{opt.match}%</span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alignment Match</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-400 leading-relaxed text-sm mb-6 border-l-2 border-slate-800 pl-6">
                                            {opt.reasoning}
                                        </p>
                                        <div className="flex gap-4 items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleShortlist(opt.id)}
                                                    className={`group/btn flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${shortlistedIds.includes(opt.id) ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'border-white/5 text-slate-500 hover:border-white/20'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${shortlistedIds.includes(opt.id) ? 'bg-indigo-500 border-indigo-500' : 'border-white/20 group-hover/btn:border-white/40'}`}>
                                                        {shortlistedIds.includes(opt.id) && (
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                                        {shortlistedIds.includes(opt.id) ? 'Shortlisted' : 'Shortlist'}
                                                    </span>
                                                </button>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setSelectedCareer({ id: opt.id, title: opt.title })}
                                                    className="px-6 py-2 rounded-xl bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all border border-white/5"
                                                >
                                                    Research
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar: Gaps & Actions */}
                    <aside className="space-y-8">
                        <div className="glass-card p-8 border-amber-500/20 bg-amber-500/5">
                            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth={2} /></svg>
                                Growth Areas
                            </h3>
                            <ul className="space-y-4">
                                {(report.skillGaps && report.skillGaps.length > 0 ? report.skillGaps : ["Advanced Quantitative Analysis", "Cross-functional Leadership", "Stakeholder Management", "Data Visualization", "Strategic Communication"]).map((gap: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                                        {gap}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="glass-card p-8 space-y-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Final Phase</h3>
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <span>Shortlisted</span>
                                        <span className="text-indigo-400">{shortlistedIds.length} / 2</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1, 2].map(i => (
                                            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${shortlistedIds.length >= i ? 'bg-indigo-500' : 'bg-white/5'}`} />
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-tight">Shortlist exactly 2 careers to unlock AI Comparison Analysis and Final Roadmap.</p>
                                </div>
                                <button
                                    onClick={handleGenerateFinalPlan}
                                    disabled={shortlistedIds.length !== 2 || generatingPlan}
                                    className={`w-full py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${shortlistedIds.length === 2 ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-slate-400 cursor-not-allowed border border-white/5'}`}
                                >
                                    {generatingPlan ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Analyzing...
                                        </div>
                                    ) : finalPlan ? 'Review Final Comparison' : 'Compare & Finalize'}
                                </button>
                                {finalPlan && (
                                    <button
                                        onClick={() => setIsComparisonOpen(true)}
                                        className="w-full btn-secondary py-3 text-[10px] font-bold uppercase tracking-widest"
                                    >
                                        View Generated Roadmap
                                    </button>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <ResearchModal
                isOpen={!!selectedCareer}
                onClose={() => setSelectedCareer(null)}
                careerId={selectedCareer?.id || ''}
                careerTitle={selectedCareer?.title || ''}
            />

            <ComparisonModal
                isOpen={isComparisonOpen}
                onClose={() => setIsComparisonOpen(false)}
                plan={finalPlan}
                career1={report.careerOptions.find((c: any) => c.id === shortlistedIds[0])?.title || 'Selected Path 1'}
                career2={report.careerOptions.find((c: any) => c.id === shortlistedIds[1])?.title || 'Selected Path 2'}
            />
        </div>
    );
}

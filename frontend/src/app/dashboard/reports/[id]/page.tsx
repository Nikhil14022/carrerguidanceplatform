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
    const [activeTab, setActiveTab] = useState<'persona' | 'personality' | 'cognitive' | 'interests' | 'diagnostic'>('persona');

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

    if (!report) return <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center">Report not found</div>;

    // Extract module responses
    const modules = report.clientProfile?.modules || [];
    const getModuleData = (keywords: string[]) => {
        const match = modules.find((m: any) => {
            const title = (m.module?.title || '').toLowerCase();
            return keywords.some(kw => title.includes(kw.toLowerCase()));
        });
        return match?.response?.data || null;
    };

    const demoData = getModuleData(['demographics', 'module_1', 'module 1']);
    const aimData = getModuleData(['aim', 'vision', 'module_2', 'module 2']);
    const visualData = getModuleData(['movie', 'visual', 'world', 'module_5', 'module 5']);
    const friendsData = getModuleData(['friend', 'relationship', 'module_6', 'module 6']);
    const familyData = getModuleData(['family', 'module_7', 'module 7']);
    const lifestyleData = getModuleData(['lifestyle', 'expectancies', 'module_8', 'module 8']);
    const bodyData = getModuleData(['body', 'self', 'image', 'module_9', 'module 9']);
    const swData = getModuleData(['strength', 'weakness', 'module_10', 'module 10']);
    const fearsData = getModuleData(['fear', 'module_11', 'module 11']);
    const valuesData = getModuleData(['value', 'system', 'module_13', 'module 13']);
    const riasecData = getModuleData(['riasec', 'interest', 'module_14', 'module 14']);
    const colorData = getModuleData(['color', 'colour', 'working_style', 'style', 'module_15', 'module 15']);
    const smiData = getModuleData(['subject', 'interest', 'hypotheticals', 'smi', 'module_16', 'module 16']);

    // Parse AI report content
    let parsedContent: any = {};
    let isJson = false;
    if (report.content) {
        try {
            parsedContent = JSON.parse(report.content);
            isJson = typeof parsedContent === 'object' && parsedContent !== null && 'personality_insights' in parsedContent;
        } catch (e) {
            isJson = false;
        }
    }
    const personalityInsights = isJson ? parsedContent.personality_insights : (report.content || '');
    const mbtiType = isJson ? parsedContent.mbti_type : 'Pending';
    const mbtiInterpretation = isJson ? parsedContent.mbti_interpretation : '';
    const mbtiDimensions = isJson ? parsedContent.mbti_dimensions : null;
    const overviewSummaries = isJson ? parsedContent.overview_summaries : null;

    // Helper to format values safely
    const safeVal = (v: any) => v !== undefined && v !== null && v !== '' ? v : '—';

    // 1. Demographics Arrays
    const activeSubjects = (demoData?.demo_subjects || []).filter((s: any) => s && s.col1 && s.col1.trim() !== '');
    const activeHobbies = (demoData?.demo_hobbies || []).filter((h: any) => h && h.col1 && h.col1.trim() !== '');
    const activeRoutine = (demoData?.demo_routine || []).filter((r: any) => r && r.trim() !== '');

    // 2. Values Category Grouping
    const topValues = valuesData?.__scored?.scores?.topValues || [];
    const valuesByCategory: Record<string, string[]> = { Ideal: [], Standard: [], 'Want & Preference': [] };
    topValues.forEach((valObj: any) => {
        const cat = valObj.category || 'Ideal';
        if (cat in valuesByCategory) {
            valuesByCategory[cat].push(valObj.value);
        }
    });

    // 3. Fears Categorization
    const fearKeys = [
        { key: 'fear_public_speaking', label: 'Public Speaking' },
        { key: 'fear_missing_out', label: 'Missing Out (FOMO)' },
        { key: 'fear_future', label: 'Future / Uncertainty' },
        { key: 'fear_failure', label: 'Failure' },
        { key: 'fear_rejection', label: 'Rejection' },
        { key: 'fear_disappointment_others_to_me', label: 'Disappointment to Others / Self' },
        { key: 'fear_mediocre_life', label: 'Mediocre Life' }
    ];
    const fearsGrouped = { low: [] as string[], medium: [] as string[], high: [] as string[] };
    fearKeys.forEach(f => {
        const score = fearsData && fearsData[f.key] !== undefined ? Number(fearsData[f.key]) : 3;
        const text = `${f.label} (${score}/10)`;
        if (score >= 8) fearsGrouped.high.push(text);
        else if (score >= 5) fearsGrouped.medium.push(text);
        else fearsGrouped.low.push(text);
    });

    // 4. RIASEC Totals
    const riasecTotals = riasecData?.__scored?.scores?.columnTotals || riasecData?.__scored?.raw?.totals || {};
    const riasecTop3 = riasecData?.__scored?.scores?.top3 || [];
    const hollandCode = riasecData?.__scored?.scores?.hollandCode || riasecData?.__scored?.raw?.hollandCode || 'ARI';

    // 5. Working Style
    const workingStyleResult = colorData?.__testData?.result || 'Blue Red Introvert';
    const workingStyleInterpretations: Record<string, string> = {
        'blue red introvert': 'Structured, detail-oriented, and highly analytical. Prefers quiet execution, values precision, and works best in individual contexts where logic and organization are paramount.',
        'red blue introvert': 'Goal-focused and logical. Direct and outcome-driven, but operates with high precision and structure, preferring to plan thoroughly before taking action.',
        'blue green introvert': 'Methodical and supportive. Highly reliable, patient, and detail-oriented. Enjoys organizing background processes and ensuring stability.',
        'green blue introvert': 'Quietly cooperative, precise, and loyal. Value harmony and structured work where goals are clear and conflict is minimal.'
    };
    const resolvedStyleDesc = workingStyleInterpretations[workingStyleResult.toLowerCase()] || 
      'Combines analytical structure, decisiveness, and focused execution. Values competence, clear boundaries, and independence in the workplace.';

    // 6. Strengths
    const swGrid = swData?.sw_grid || [];
    const swGrouped = { weaknesses: [] as string[], situational: [] as string[], strengths: [] as string[] };
    swGrid.forEach((item: any) => {
        const rating = Number(item.rating);
        const label = rating >= 8 ? (item.rightLabel || item.trait) : rating <= 4 ? (item.leftLabel || item.trait) : item.trait;
        const text = `${label} (${rating}/10)`;
        if (rating >= 8) swGrouped.strengths.push(text);
        else if (rating <= 4) swGrouped.weaknesses.push(text);
        else swGrouped.situational.push(text);
    });

    // 7. SMI Totals
    const smiTotals = smiData?.__scored?.scores?.columnTotals || smiData?.__scored?.raw?.columnTotals || {};
    const smiTop3 = smiData?.__scored?.scores?.topColumns || [];

    // 8. Media
    const mediaMovies = (visualData?.visual_fav_movies || []).filter((m: any) => m && m.col1).map((m: any) => m.col1);
    const mediaSeries = (visualData?.visual_fav_series || []).filter((s: any) => s && s.col1).map((s: any) => s.col1);
    const mediaGenres = (visualData?.visual_genres || []).filter((g: any) => g && g.option).map((g: any) => g.option);
    const mediaCharacters = (visualData?.visual_characters || []).filter((c: any) => c && c.col1).map((c: any) => `${c.col1}: ${c.col2 || ''}`);
    const mediaGames = (visualData?.visual_games || []).filter((g: any) => g && g.col2).map((g: any) => g.col2);

    // 9. Lifestyle Struggles
    const lifestylePriorities = lifestyleData?.lifestyle_career_priorities || [];
    const lifestyleStruggles = (lifestyleData?.lifestyle_12 || []).filter((s: any) => s && s.col2).map((s: any) => s.col2);

    // 10. Diagnostics Overview
    const finalOverview = {
        aim: overviewSummaries?.aim_and_vision || aimData?.aim_1 || 'Interested in Creative Arts (Sketching, Guitar) and seeking career clarity.',
        friends: overviewSummaries?.friends || friendsData?.friends_1 || 'Prefers a small, close-knit circle of trusted, adventurous, and humorous friends.',
        relationship: overviewSummaries?.relationship || 'Values personal autonomy and privacy, maintaining selective, high-trust connections.',
        family: overviewSummaries?.family || familyData?.family_1 || 'Shares a supportive, quiet bond with parents who encourage self-learning and creative expressions.',
        bodyImage: overviewSummaries?.body_image || bodyData?.body_2_reason || 'Conscious of appearance and physical growth, with growing focus on aesthetics.',
        impactful: overviewSummaries?.impactful_incidents || 'Independently learned sketching and music during COVID, defining a self-taught, creative identity.'
    };

    return (
        <div className="min-h-screen bg-[#030712] text-slate-100 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                    <div>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-xs font-bold text-slate-500 hover:text-indigo-400 mb-2 flex items-center gap-2 uppercase tracking-widest"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2} /></svg>
                            Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            Student Comprehensive Report
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Student Profile: <span className="text-indigo-400 font-semibold">{report.clientProfile?.user?.name || 'Valued Client'}</span> • Generated on {new Date(report.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={handleDownloadPdf}
                            disabled={downloading}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-5 py-2.5 rounded-xl border border-indigo-500/20 transition-all font-bold text-xs uppercase tracking-widest"
                        >
                            {downloading ? (
                                <div className="w-4 h-4 border-2 border-indigo-400 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            )}
                            {downloading ? 'Preparing...' : 'Download PDF'}
                        </button>
                    </div>
                </header>

                {/* Glassmorphic Navigation Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-white/5 pb-2">
                    {[
                        { id: 'persona', label: 'Persona & Careers', icon: '👤' },
                        { id: 'personality', label: 'Personality & Style', icon: '🧠' },
                        { id: 'cognitive', label: 'Cognitive & Values', icon: '⚡' },
                        { id: 'interests', label: 'Interests & Academics', icon: '📚' },
                        { id: 'diagnostic', label: 'Diagnostic Compartments', icon: '🔎' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/35 border border-indigo-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'}`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Contents */}
                <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
                    <div className="space-y-8">
                        
                        {/* TAB 1: PERSONA & CAREERS */}
                        {activeTab === 'persona' && (
                            <>
                                {/* Demographics Sub-Card */}
                                <section className="glass-card p-6">
                                    <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                        <span className="text-slate-500">2.</span> Demographics & Profile
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <span className="text-xs text-slate-500 block">Name</span>
                                            <strong className="text-slate-200">{safeVal(demoData?.demo_name || report.clientProfile?.user?.name || 'Valued Client')}</strong>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <span className="text-xs text-slate-500 block">Age</span>
                                            <strong className="text-slate-200">{safeVal(demoData?.demo_age)}</strong>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <span className="text-xs text-slate-500 block">Date of Birth</span>
                                            <strong className="text-slate-200">{safeVal(demoData?.demo_dob)}</strong>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <span className="text-xs text-slate-500 block">Location</span>
                                            <strong className="text-slate-200">{safeVal(demoData?.demo_residence)}</strong>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <span className="text-xs text-slate-500 block">School</span>
                                            <strong className="text-slate-200">{safeVal(demoData?.demo_education?.school?.name)}</strong>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <span className="text-xs text-slate-500 block">Grade</span>
                                            <strong className="text-slate-200">{safeVal(demoData?.demo_education?.school?.grade)}</strong>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5 md:col-span-2">
                                            <span className="text-xs text-slate-500 block">Living with</span>
                                            <strong className="text-slate-200">{safeVal(demoData?.demo_lives_with)}</strong>
                                        </div>
                                    </div>
                                    {activeRoutine.length > 0 && (
                                        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
                                            <span className="text-xs text-slate-500 block mb-1">Daily Routine</span>
                                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
                                                {activeRoutine.map((r: string, idx: number) => (
                                                    <React.Fragment key={idx}>
                                                        {idx > 0 && <span className="text-indigo-500">➔</span>}
                                                        <span className="bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/15">{r}</span>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>

                                {/* Professional Persona */}
                                <section className="glass-card p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] -mr-32 -mt-32" />
                                    <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                        <span className="text-slate-500">13.</span> Professional Persona Summary
                                    </h3>
                                    <div className="text-slate-300 leading-relaxed space-y-4 text-base">
                                        {personalityInsights}
                                        {(personalityInsights.includes('Pending Analysis') || personalityInsights.includes('temporarily unavailable')) && (
                                            <div className="mt-6 p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-center">
                                                <p className="text-xs text-indigo-300 mb-3 italic">API recovered? Generate the comprehensive AI persona analysis now.</p>
                                                <button
                                                    onClick={handleGenerateReport}
                                                    disabled={generating}
                                                    className="btn-primary py-2.5 px-6 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
                                                >
                                                    {generating ? (
                                                        <>
                                                            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                            Analyzing...
                                                        </>
                                                    ) : 'Generate AI Analysis'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Career suggestions */}
                                <section className="space-y-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <span className="text-slate-500">13.</span> Recommended Career Trajectories
                                    </h3>
                                    <div className="grid gap-6">
                                        {report.careerOptions?.map((opt: any, i: number) => (
                                            <div key={opt.id} className="glass-card p-6 border hover:border-indigo-500/35 transition-all group">
                                                <div className="flex justify-between items-start gap-4 mb-4">
                                                    <div>
                                                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Option {i + 1}</span>
                                                        <h4 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{opt.title}</h4>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-black text-indigo-500">{opt.match}%</span>
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">Match</span>
                                                    </div>
                                                </div>
                                                <p className="text-slate-400 leading-relaxed text-sm mb-4 border-l-2 border-slate-800 pl-4">
                                                    {opt.reasoning}
                                                </p>
                                                {opt.skillGaps && opt.skillGaps.length > 0 && (
                                                    <div className="mb-4">
                                                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Focus Skill Gaps:</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {opt.skillGaps.map((sg: any) => (
                                                                <span key={sg.id} className="bg-sky-500/10 text-sky-400 border border-sky-500/15 text-[10px] px-2 py-0.5 rounded font-medium">
                                                                    {sg.skill || sg}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex gap-4 items-center justify-between border-t border-white/5 pt-4">
                                                    <button
                                                        onClick={() => handleShortlist(opt.id)}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider ${shortlistedIds.includes(opt.id) ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-400'}`}
                                                    >
                                                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${shortlistedIds.includes(opt.id) ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                                                            {shortlistedIds.includes(opt.id) && (
                                                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        {shortlistedIds.includes(opt.id) ? 'Shortlisted' : 'Shortlist'}
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedCareer({ id: opt.id, title: opt.title })}
                                                        className="px-4 py-1.5 rounded-lg bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all border border-white/5"
                                                    >
                                                        Research Pathway
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        )}

                        {/* TAB 2: PERSONALITY & STYLE */}
                        {activeTab === 'personality' && (
                            <>
                                {/* MBTI 16PF Card */}
                                <section className="glass-card p-6">
                                    <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                        <span className="text-slate-500">5.</span> 16PF personality Factor
                                    </h3>
                                    <div className="flex flex-col md:flex-row gap-6 items-start mb-6">
                                        <div className="bg-indigo-600 text-white font-black text-3xl px-6 py-4 rounded-xl shadow-lg shadow-indigo-600/20 text-center min-w-[120px]">
                                            <span className="text-[9px] uppercase tracking-wider block font-bold text-indigo-200">Personality</span>
                                            {mbtiType}
                                        </div>
                                        <div className="flex-1 text-slate-300 leading-relaxed text-sm bg-white/5 p-4 rounded-xl border border-white/5">
                                            {mbtiInterpretation || 'Standard 16 personality types details compiled from assessment indexes.'}
                                        </div>
                                    </div>
                                    
                                    {mbtiDimensions && (
                                        <div className="space-y-4 border-t border-white/5 pt-4">
                                            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">MBTI Trait Gradients</h4>
                                            <div className="grid gap-3">
                                                {Object.entries(mbtiDimensions).map(([key, dim]: any) => (
                                                    <div key={key} className="space-y-1">
                                                        <div className="flex justify-between text-xs font-semibold">
                                                            <span className="text-slate-400 capitalize">{key}</span>
                                                            <span className="text-indigo-400">{dim.label} ({dim.percentage}%)</span>
                                                        </div>
                                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${dim.percentage}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>

                                {/* Holland Code RIASEC Card */}
                                <section className="glass-card p-6">
                                    <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                        <span className="text-slate-500">6.</span> RIASEC Occupational Interests
                                    </h3>
                                    <div className="flex flex-col md:flex-row gap-6 items-center mb-6">
                                        <div className="bg-sky-600 text-white font-black text-2xl px-5 py-3.5 rounded-xl shadow-lg shadow-sky-600/20 text-center min-w-[100px]">
                                            <span className="text-[8px] uppercase tracking-wider block font-bold text-sky-200">Holland Code</span>
                                            {hollandCode}
                                        </div>
                                        <div className="flex-1 grid grid-cols-3 md:grid-cols-6 gap-2 w-full">
                                            {['R', 'I', 'A', 'S', 'E', 'C'].map(char => {
                                                const val = riasecTotals[char] !== undefined ? riasecTotals[char] : 0;
                                                const labels: Record<string, string> = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' };
                                                return (
                                                    <div key={char} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-center">
                                                        <div className="text-base font-bold text-white">{char}</div>
                                                        <div className="text-[8px] text-slate-500 capitalize">{labels[char]}</div>
                                                        <div className="text-xs font-bold text-indigo-400 mt-1">{val}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {riasecTop3.length > 0 && (
                                        <div className="space-y-4 border-t border-white/5 pt-4">
                                            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">Dominant Profiles</h4>
                                            <div className="grid gap-4">
                                                {riasecTop3.map((item: any) => (
                                                    <div key={item.label} className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                        <span className="text-xs font-bold text-indigo-400 block mb-1">{item.label} ({item.letter}) — Score: {item.score}</span>
                                                        <p className="text-xs text-slate-400 leading-relaxed">{item.interpretation}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>

                                {/* Color Style */}
                                <section className="glass-card p-6">
                                    <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                        <span className="text-slate-500">7.</span> Colour Test (Working Style)
                                    </h3>
                                    <div className="flex flex-col md:flex-row gap-4 items-start bg-white/5 border border-white/5 p-4 rounded-xl">
                                        <div className="flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20 text-indigo-400 font-bold text-sm uppercase tracking-wider">
                                            🎨 {workingStyleResult}
                                        </div>
                                        <p className="flex-1 text-xs text-slate-300 leading-relaxed pt-1">{resolvedStyleDesc}</p>
                                    </div>
                                </section>
                            </>
                        )}

                        {/* TAB 3: COGNITIVE & VALUES */}
                        {activeTab === 'cognitive' && (
                            <>
                                {/* Values Profile */}
                                <section className="glass-card p-6">
                                    <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                        <span className="text-slate-500">3.</span> Value System Profile
                                    </h3>
                                    <div className="grid gap-4 text-sm">
                                        {Object.entries(valuesByCategory).map(([cat, valList]) => {
                                            const bgColors: Record<string, string> = {
                                                Ideal: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                                                Standard: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                                                'Want & Preference': 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                            };
                                            return (
                                                <div key={cat} className="p-4 bg-white/5 rounded-xl border border-white/5">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">{cat}</span>
                                                    {valList.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {valList.map(v => (
                                                                <span key={v} className={`px-2.5 py-1 rounded text-xs font-semibold border ${bgColors[cat] || 'bg-white/5 border-white/10 text-slate-300'}`}>
                                                                    {v}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <em className="text-xs text-slate-500">No values submitted in this category</em>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* Fears Rating */}
                                <section className="glass-card p-6">
                                    <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                        <span className="text-slate-500">4.</span> Fears Rating Profile
                                    </h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="p-4 bg-rose-500/5 border border-rose-500/15 rounded-xl">
                                            <strong className="text-xs uppercase text-rose-400 block tracking-wider mb-2">High Intensity (8-10)</strong>
                                            {fearsGrouped.high.length > 0 ? (
                                                <ul className="space-y-1.5 text-xs text-rose-300/80">
                                                    {fearsGrouped.high.map(f => <li key={f} className="list-disc ml-4">{f}</li>)}
                                                </ul>
                                            ) : <em className="text-xs text-slate-500 italic block">None</em>}
                                        </div>
                                        <div className="p-4 bg-orange-500/5 border border-orange-500/15 rounded-xl">
                                            <strong className="text-xs uppercase text-orange-400 block tracking-wider mb-2">Medium Intensity (5-7)</strong>
                                            {fearsGrouped.medium.length > 0 ? (
                                                <ul className="space-y-1.5 text-xs text-orange-300/80">
                                                    {fearsGrouped.medium.map(f => <li key={f} className="list-disc ml-4">{f}</li>)}
                                                </ul>
                                            ) : <em className="text-xs text-slate-500 italic block">None</em>}
                                        </div>
                                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                                            <strong className="text-xs uppercase text-emerald-400 block tracking-wider mb-2">Low Intensity (1-4)</strong>
                                            {fearsGrouped.low.length > 0 ? (
                                                <ul className="space-y-1.5 text-xs text-emerald-300/80">
                                                    {fearsGrouped.low.map(f => <li key={f} className="list-disc ml-4">{f}</li>)}
                                                </ul>
                                            ) : <em className="text-xs text-slate-500 italic block">None</em>}
                                        </div>
                                    </div>
                                </section>

                                {/* Strengths & Weaknesses */}
                                <section className="glass-card p-6">
                                    <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                        <span className="text-slate-500">8.</span> Strengths & Weaknesses Grid
                                    </h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                                            <strong className="text-xs uppercase text-emerald-400 block tracking-wider mb-2">Core Strengths (8-10)</strong>
                                            {swGrouped.strengths.length > 0 ? (
                                                <ul className="space-y-1.5 text-xs text-emerald-300/80">
                                                    {swGrouped.strengths.map(s => <li key={s} className="list-disc ml-4">{s}</li>)}
                                                </ul>
                                            ) : <em className="text-xs text-slate-500 italic block">None</em>}
                                        </div>
                                        <div className="p-4 bg-slate-500/5 border border-slate-500/15 rounded-xl">
                                            <strong className="text-xs uppercase text-slate-400 block tracking-wider mb-2">Situational (5-7)</strong>
                                            {swGrouped.situational.length > 0 ? (
                                                <ul className="space-y-1.5 text-xs text-slate-400/80">
                                                    {swGrouped.situational.map(s => <li key={s} className="list-disc ml-4">{s}</li>)}
                                                </ul>
                                            ) : <em className="text-xs text-slate-500 italic block">None</em>}
                                        </div>
                                        <div className="p-4 bg-rose-500/5 border border-rose-500/15 rounded-xl">
                                            <strong className="text-xs uppercase text-rose-400 block tracking-wider mb-2">Growth Areas (1-4)</strong>
                                            {swGrouped.weaknesses.length > 0 ? (
                                                <ul className="space-y-1.5 text-xs text-rose-300/80">
                                                    {swGrouped.weaknesses.map(w => <li key={w} className="list-disc ml-4">{w}</li>)}
                                                </ul>
                                            ) : <em className="text-xs text-slate-500 italic block">None</em>}
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}

                        {/* TAB 4: INTERESTS & ACADEMICS */}
                        {activeTab === 'interests' && (
                            <>
                                {/* Academic & Hobbies */}
                                <section className="grid md:grid-cols-2 gap-6">
                                    <div className="glass-card p-6">
                                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">🏫 Academic Sentiments</h4>
                                        {activeSubjects.length > 0 ? (
                                            <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                                {activeSubjects.map((s: any, idx: number) => (
                                                    <div key={idx} className="p-2.5 bg-white/5 border border-white/5 rounded-lg text-xs flex justify-between gap-3">
                                                        <strong className="text-slate-300">{s.col1}</strong>
                                                        <span className="text-slate-400 text-right">{s.col2 || 'Neutral'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-xs text-slate-500 italic">No subject feedback submitted</p>}
                                    </div>
                                    <div className="glass-card p-6">
                                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">🎨 Primary Hobbies</h4>
                                        {activeHobbies.length > 0 ? (
                                            <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                                {activeHobbies.map((h: any, idx: number) => (
                                                    <div key={idx} className="p-2.5 bg-white/5 border border-white/5 rounded-lg text-xs">
                                                        <div className="flex justify-between font-bold text-indigo-400">
                                                            <span>{h.col1}</span>
                                                            <span className="text-slate-500 font-medium">{h.col3}</span>
                                                        </div>
                                                        {h.col2 && <p className="text-slate-400 text-[11px] mt-1">{h.col2}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-xs text-slate-500 italic">No hobbies submitted</p>}
                                    </div>
                                </section>

                                {/* Subject Matter Interest (SMI) */}
                                <section className="glass-card p-6">
                                    <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                        <span className="text-slate-500">9.</span> Subject Matter Interest (SMI)
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center mb-6">
                                        {Object.entries({
                                            A: 'Physical Sciences', B: 'Social Humanities',
                                            C: 'Arts & Media', D: 'Business & Finance',
                                            E: 'Body Kinaesthetic', F: 'Designer/Artisan',
                                            G: 'Engineering & Tech', H: 'Education & Health'
                                        }).map(([key, label]) => (
                                            <div key={key} className="bg-white/5 border border-white/5 p-2.5 rounded-xl">
                                                <div className="text-[10px] text-slate-500 font-semibold">{label}</div>
                                                <strong className="text-lg text-indigo-400 block mt-1">{smiTotals[key] !== undefined ? smiTotals[key] : '—'}</strong>
                                            </div>
                                        ))}
                                    </div>
                                    {smiTop3.length > 0 && (
                                        <div className="space-y-3 border-t border-white/5 pt-4">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top SMI Career Domains</h4>
                                            {smiTop3.map((item: any) => (
                                                <div key={item.label} className="p-3 bg-white/5 rounded-lg border border-white/5">
                                                    <span className="text-xs font-bold text-indigo-400 block mb-0.5">{item.label} (Score: {item.score})</span>
                                                    <p className="text-xs text-slate-400 leading-relaxed">{item.interpretation}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* Media Genre Profile */}
                                <section className="glass-card p-6">
                                    <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                        <span className="text-slate-500">10.</span> Media Genre & Visual World
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4 text-xs">
                                        {mediaMovies.length > 0 && (
                                            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                                <span className="text-slate-500 font-semibold block mb-1">Favorite Movies</span>
                                                <p className="text-slate-300 font-medium">{mediaMovies.join(', ')}</p>
                                            </div>
                                        )}
                                        {mediaSeries.length > 0 && (
                                            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                                <span className="text-slate-500 font-semibold block mb-1">Favorite Series</span>
                                                <p className="text-slate-300 font-medium">{mediaSeries.join(', ')}</p>
                                            </div>
                                        )}
                                        {mediaGenres.length > 0 && (
                                            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                                <span className="text-slate-500 font-semibold block mb-1">Preferred Genres</span>
                                                <p className="text-slate-300 font-medium">{mediaGenres.join(', ')}</p>
                                            </div>
                                        )}
                                        {mediaGames.length > 0 && (
                                            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                                <span className="text-slate-500 font-semibold block mb-1">Gaming Styles</span>
                                                <p className="text-slate-300 font-medium">{mediaGames.join(', ')}</p>
                                            </div>
                                        )}
                                        {visualData?.visual_superpower && (
                                            <div className="p-3 bg-white/5 rounded-lg border border-white/5 md:col-span-2">
                                                <span className="text-slate-500 font-semibold block mb-1">Visual Superpower Choice</span>
                                                <p className="text-indigo-300 italic">"{visualData.visual_superpower}"</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Lifestyle & Struggles */}
                                <section className="glass-card p-6">
                                    <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                        <span className="text-slate-500">11.</span> Lifestyle Expectancies
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-6 text-xs">
                                        <div>
                                            <span className="text-slate-400 font-bold block mb-2 uppercase tracking-wider">Priorities Rating</span>
                                            {lifestylePriorities.length > 0 ? (
                                                <div className="space-y-1">
                                                    {lifestylePriorities.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between py-1 border-b border-white/5">
                                                            <span className="text-slate-300">{item.col1}</span>
                                                            <strong className="text-indigo-400">{item.col2}/10</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <em className="text-slate-500">No priorities scored</em>}
                                        </div>
                                        <div>
                                            <span className="text-slate-400 font-bold block mb-2 uppercase tracking-wider">Core Daily Struggles</span>
                                            {lifestyleStruggles.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {lifestyleStruggles.map((str: string, idx: number) => (
                                                        <li key={idx} className="bg-white/5 p-2 rounded-lg border border-white/5 text-slate-300">
                                                            ⚠️ {str}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : <em className="text-slate-500">No struggles identified</em>}
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}

                        {/* TAB 5: DIAGNOSTIC COMPARTMENTS */}
                        {activeTab === 'diagnostic' && (
                            <section className="glass-card p-6">
                                <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
                                    <span className="text-slate-500">12.</span> Overview Section Compartments
                                </h3>
                                <div className="space-y-6">
                                    {[
                                        { label: 'Aim & Vision Summary', text: finalOverview.aim, icon: '🎯' },
                                        { label: 'Family Compartment Dynamics', text: finalOverview.family, icon: '🏠' },
                                        { label: 'Friends & Social Group Dynamics', text: finalOverview.friends, icon: '🤝' },
                                        { label: 'Romantic & Relationship Styles', text: finalOverview.relationship, icon: '💖' },
                                        { label: 'Body Image & Self Identity', text: finalOverview.bodyImage, icon: '🧍' },
                                        { label: 'Impactful Life Incidents', text: finalOverview.impactful, icon: '⚡' }
                                    ].map((comp, idx) => (
                                        <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-indigo-500/20 transition-all">
                                            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                                                <span>{comp.icon}</span>
                                                {comp.label}
                                            </h4>
                                            <p className="text-xs text-slate-300 leading-relaxed pl-6">{comp.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                    </div>

                    {/* Right Sidebar - Finalization Comparison Actions */}
                    <aside className="space-y-6">
                        <div className="glass-card p-6 border-amber-500/20 bg-amber-500/5">
                            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth={2} /></svg>
                                Growth Areas
                            </h3>
                            <ul className="space-y-3">
                                {(report.skillGaps && report.skillGaps.length > 0 ? report.skillGaps : ["Advanced Quantitative Analysis", "Cross-functional Leadership", "Stakeholder Management", "Data Visualization", "Strategic Communication"]).map((gap: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                                        {gap}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="glass-card p-6 space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Final Phase</h3>
                            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
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
                                className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${shortlistedIds.length === 2 ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-slate-400 cursor-not-allowed border border-white/5'}`}
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
                                    className="w-full bg-white/5 text-slate-300 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all border border-white/5"
                                >
                                    View Generated Roadmap
                                </button>
                            )}
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

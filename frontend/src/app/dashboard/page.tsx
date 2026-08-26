"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { SkillRadar } from '@/components/analytics/SkillRadar';

function DashboardContent() {
    const { data: session, status } = useSession();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const [showSuccess, setShowSuccess] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [expandedStage, setExpandedStage] = useState<number | null>(null);

    const handleGenerateReport = async () => {
        setGeneratingAI(true);
        try {
            const res = await fetch('/api/client/reports/generate', { method: 'POST' });
            if (!res.ok) throw new Error('Generation failed');
            await fetchDashboard();
        } catch (err) {
            console.error('AI Generation Error:', err);
        } finally {
            setGeneratingAI(false);
        }
    };

    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('status') === 'submitted') {
            setShowSuccess(true);
            fetchDashboard();
            router.replace('/dashboard');
            const timer = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, router]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchDashboard();
        }
    }, [status, router]);

    const fetchDashboard = async () => {
        try {
            const res = await fetch('/api/client/dashboard', { cache: 'no-store' });
            const d = await res.json();
            setData(d);
        } catch (err) {
            console.error('Failed to fetch dashboard', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="text-slate-500 text-sm font-bold uppercase tracking-widest animate-pulse">Loading Journey...</div>
                </div>
            </div>
        );
    }

    const { stats, profile, currentModule, upcomingMeetings } = data || {};

    return (
        <div className="space-y-8 animate-fade-in text-slate-200">
            {showSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-700 px-6 py-4 rounded-xl flex items-center justify-between animate-slide-up">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold">Module Submitted successfully!</p>
                            <p className="text-xs text-green-600">Expert review has been initiated. Next module is now unlocked.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Journey Overview component here... */}
            <section className="grid md:grid-cols-[1fr_320px] gap-8">
                <div className="bg-white/5 border shadow-sm rounded-2xl p-8 flex flex-col justify-between">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Your Career Journey</h2>
                        <p className="text-slate-400 max-w-md">
                            You've completed {stats?.completed || 0} of {stats?.total || 7} assessment checkpoints.
                            {currentModule ? " Continue your progress to unlock personalized insights." : (stats?.completed && stats?.completed > 0) ? " Great job! You've completed all modules." : " Your journey is starting. Pick your next module below."}
                        </p>
                        <div className="flex gap-4 pt-4">
                            {currentModule ? (
                                <button
                                    onClick={() => router.push(`/dashboard/modules/${currentModule.id}`)}
                                    className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Continue {currentModule.title}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 shadow-sm rounded-2xl p-8 flex flex-col justify-center text-white relative overflow-hidden h-full">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[64px] -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="relative z-10 font-bold text-slate-400 uppercase tracking-widest text-xs mb-4">Overall Journey Progress</div>

                    <div className="relative z-10 flex items-baseline gap-2 mb-8">
                        <span className="text-6xl md:text-7xl font-black tracking-tighter bg-gradient-to-tr from-white to-slate-400 bg-clip-text text-transparent">
                            {stats?.progress || 0}
                        </span>
                        <span className="text-3xl font-bold text-slate-500">%</span>
                    </div>

                    <div className="relative z-10 w-full mt-auto">
                        <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700/50 backdrop-blur-sm shadow-inner relative">
                            {/* Inner gradient line track */}
                            <div className="absolute inset-0 bg-slate-800/30"></div>

                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)] relative overflow-hidden"
                                style={{ width: `${stats?.progress || 0}%` }}
                            >
                                <div className="absolute inset-0 w-full h-full bg-white/10" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }} />
                                <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-r from-transparent to-white/30 truncate" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 text-xs font-semibold text-slate-500">
                            <span>Started</span>
                            <span>Target</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Upcoming Appointments */}
            {upcomingMeetings && upcomingMeetings.length > 0 && (
                <section className="bg-white/5 border border-indigo-500/20 shadow-sm rounded-2xl p-8 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[64px] -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 relative z-10">
                        <span className="text-indigo-400">📅</span> Upcoming Scheduled Meetings
                    </h3>
                    
                    <div className="grid gap-6 md:grid-cols-2 relative z-10">
                        {upcomingMeetings.map((meet: any) => (
                            <div key={meet.id} className="p-5 bg-slate-950/40 rounded-2xl border border-white/5 space-y-3 hover:border-indigo-500/30 transition-all group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{meet.notes || 'Mentor Guidance Session'}</p>
                                        <p className="text-xs text-indigo-400/80 font-semibold mt-0.5">with {meet.expert.name}</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold tracking-widest">
                                        Confirmed
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400 space-y-2 pt-1 border-t border-white/5">
                                    <p className="flex items-center gap-2">
                                        <span>🕒</span> {new Date(meet.startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                    {meet.meetingLink && (
                                        <p className="flex items-center gap-2">
                                            <span>🔗</span> 
                                            <a href={meet.meetingLink} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-semibold underline decoration-indigo-500/30 hover:decoration-indigo-400 transition-all">
                                                Join Google Meet
                                            </a>
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Journey Timeline component */}
            <section className="bg-white/5 border shadow-sm rounded-2xl p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-100">Journey Workflow & Stages</h3>
                    <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" /> Completed</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500/20 border border-indigo-500/40" /> In Progress</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" /> On Hold</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" /> Not Started</div>
                    </div>
                </div>

                <div className="relative pt-4 pb-4">
                    {/* Vertical Connecting Line */}
                    <div className="absolute top-10 bottom-10 left-[1.125rem] md:left-[1.625rem] w-0.5 bg-white/5 z-0" />

                    <div className="flex flex-col gap-6 relative z-10 w-full pl-0">
                        {(profile?.stages || []).map((stage: any) => {
                            const isExpanded = expandedStage === stage.stageNumber;
                            const isCompleted = stage.status === 'COMPLETED';
                            const isInProgress = stage.status === 'IN_PROGRESS';
                            const isOnHold = stage.status === 'ON_HOLD';
                            const isNotApplicable = stage.status === 'NOT_APPLICABLE';
                            const isNotStarted = stage.status === 'NOT_STARTED';

                            let badgeStyle = "bg-white/5 border-white/5 text-slate-400";
                            let icon = <span className="font-bold text-xs">{stage.stageNumber}</span>;
                            let circleStyle = "border-white/10 text-slate-400 bg-slate-900";

                            if (isCompleted) {
                                badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                                circleStyle = "bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20";
                                icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
                            } else if (isInProgress) {
                                badgeStyle = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                                circleStyle = "bg-slate-900 border-indigo-500 text-indigo-400 shadow-indigo-500/20 border-2 scale-110";
                            } else if (isOnHold) {
                                badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                                circleStyle = "bg-slate-900 border-amber-500 text-amber-400 border-2";
                            } else if (isNotApplicable) {
                                badgeStyle = "bg-slate-800/50 text-slate-500 border-slate-800";
                                circleStyle = "bg-slate-900 border-slate-800 text-slate-600 line-through";
                            }

                            // Determine action button
                            let actionButton = null;
                            if (stage.stageNumber === 1) {
                                actionButton = (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); router.push('/dashboard/modules'); }}
                                        className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                                    >
                                        Go to Questionnaire Modules
                                    </button>
                                );
                            } else if (stage.stageNumber === 2) {
                                actionButton = (
                                    <div className="mt-3 text-xs text-slate-400">
                                        Ask your parent to link their profile and complete the Parent Questionnaire.
                                    </div>
                                );
                            } else if (stage.stageNumber === 3 || stage.stageNumber === 4 || stage.stageNumber === 6) {
                                actionButton = (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); router.push('/dashboard/appointments'); }}
                                        className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                                    >
                                        Schedule Appointment
                                    </button>
                                );
                            } else if (stage.stageNumber === 5) {
                                actionButton = (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); router.push('/dashboard/research'); }}
                                        className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                                    >
                                        Open AI Research Assistant
                                    </button>
                                );
                            } else if (stage.stageNumber === 8) {
                                actionButton = (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); router.push('/dashboard/reports'); }}
                                        className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                                    >
                                        View Recommended Shortlist
                                    </button>
                                );
                            }

                            // Parse JSON tasks & documents safely
                            let stageTasks = [];
                            try {
                                stageTasks = typeof stage.tasks === 'string' ? JSON.parse(stage.tasks) : (stage.tasks || []);
                            } catch (e) {
                                stageTasks = [];
                            }
                            let stageDocs = [];
                            try {
                                stageDocs = typeof stage.documents === 'string' ? JSON.parse(stage.documents) : (stage.documents || []);
                            } catch (e) {
                                stageDocs = [];
                            }

                            return (
                                <div
                                    key={stage.id}
                                    className="flex flex-row items-start gap-4 md:gap-6 group cursor-pointer w-full relative"
                                    onClick={() => setExpandedStage(isExpanded ? null : stage.stageNumber)}
                                >
                                    <div className={`shrink-0 w-9 h-9 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all duration-300 relative z-10 shadow-md ${circleStyle}`}>
                                        {icon}
                                        {isInProgress && (
                                            <div className="absolute inset-[-4px] border border-indigo-500/20 rounded-full animate-ping" />
                                        )}
                                    </div>

                                    <div className={`flex-1 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-4 md:p-5 transition-all -ml-2 hover:shadow-sm ${isExpanded ? 'bg-white/[0.07] border-white/10' : ''}`}>
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Stage {stage.stageNumber}</div>
                                                <div className={`text-sm md:text-base font-semibold text-slate-100`}>
                                                    {stage.stageName}
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${badgeStyle}`}>
                                                {stage.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        {/* Collapsible content block */}
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-white/5 space-y-4 text-xs md:text-sm text-slate-300 animate-slide-down">
                                                {stage.notes && (
                                                    <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3">
                                                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Counselor Remarks</h4>
                                                        <p className="text-slate-300 leading-relaxed text-xs">{stage.notes}</p>
                                                    </div>
                                                )}

                                                {stageTasks.length > 0 && (
                                                    <div>
                                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Checklist Tasks</h4>
                                                        <ul className="space-y-1.5">
                                                            {stageTasks.map((t: any, idx: number) => (
                                                                <li key={idx} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${t.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/20'}`}>
                                                                        {t.completed && (
                                                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                                                        )}
                                                                    </div>
                                                                    <span className={`text-xs ${t.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>{t.text}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {stageDocs.length > 0 && (
                                                    <div>
                                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Documents & Resources</h4>
                                                        <ul className="space-y-1.5">
                                                            {stageDocs.map((doc: any, idx: number) => (
                                                                <li key={idx} className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                                                                    <span>📄</span>
                                                                    <a
                                                                        href={doc.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-indigo-400 hover:text-indigo-300 underline font-semibold transition-colors"
                                                                    >
                                                                        {doc.name || "Attachment File"}
                                                                    </a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {stage.meetingOutcomes && (
                                                    <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3">
                                                        <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Meeting Decisions & Outcomes</h4>
                                                        <p className="text-slate-300 leading-relaxed text-xs">{stage.meetingOutcomes}</p>
                                                    </div>
                                                )}

                                                {actionButton}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading...</div>}>
            <DashboardContent />
        </Suspense>
    );
}

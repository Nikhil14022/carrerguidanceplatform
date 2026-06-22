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

    const { stats, profile, currentModule } = data || {};

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
                            {currentModule ? " Continue your progress to unlock personalized insights." : " Great job! You've completed all modules."}
                        </p>
                        {stats?.journeyStatus === 'Pending Mentor Meeting' && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                                <svg className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-bold text-amber-300">Mentor Meeting Required</p>
                                    <p className="text-xs text-amber-400/70 mt-1">You've completed a set of modules! Schedule a one-on-one with your mentor to review your progress and unlock the next set of assessments.</p>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-4 pt-4">
                            {stats?.journeyStatus === 'Pending Mentor Meeting' ? (
                                <button
                                    onClick={() => router.push('/dashboard/appointments')}
                                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-3 animate-pulse hover:animate-none"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Book Mentor Appointment
                                </button>
                            ) : currentModule ? (
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



            {/* Journey Timeline component */}
            <section className="bg-white/5 border shadow-sm rounded-2xl p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-100">Your Workflow Timeline</h3>
                    <div className="flex gap-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Verified</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> In Review</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Active</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-200" /> Locked</div>
                    </div>
                </div>

                <div className="relative pt-4 pb-4">
                    {/* Vertical Connecting Line */}
                    <div className="absolute top-10 bottom-10 left-[1.125rem] md:left-[1.625rem] w-1 bg-slate-100 rounded-full z-0" />

                    <div className="flex flex-col gap-6 md:gap-8 relative z-10 w-full pl-0">
                        {profile?.modules?.map((m: any, idx: number) => {
                            const isLocked = m.status === 'LOCKED';
                            const isCompleted = m.status === 'APPROVED';
                            const isReview = m.status === 'SUBMITTED' || m.status === 'UNDER_REVIEW';
                            const isActive = m.status === 'UNLOCKED' || m.status === 'IN_PROGRESS';

                            let statusColor = 'bg-white/5 border-white/10 text-slate-400';
                            let icon = <span className="font-bold">{idx + 1}</span>;

                            if (isCompleted) {
                                statusColor = 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20';
                                icon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
                            } else if (isReview) {
                                statusColor = 'bg-amber-500 border-amber-500 text-white shadow-amber-500/20';
                                icon = <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                            } else if (isActive) {
                                statusColor = 'bg-white/5 border-indigo-600 text-indigo-400 shadow-indigo-500/20 border-2 scale-110';
                            }

                            return (
                                <div key={m.id} className="flex flex-row items-center gap-4 md:gap-6 group cursor-pointer w-full relative" onClick={() => !isLocked && router.push(`/dashboard/modules/${m.id}`)}>
                                    
                                    <div className={`shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-full border flex items-center justify-center transition-all duration-300 relative z-10 shadow-md ${statusColor} ${isActive ? 'bg-white/5 scale-110' : 'bg-white/5'}`}>
                                        {icon}
                                        {isActive && (
                                            <div className="absolute inset-[-6px] border-2 border-indigo-500/30 rounded-full animate-ping" />
                                        )}
                                    </div>

                                    <div className="flex-1 bg-white/50 group-hover:bg-white/5 border border-transparent group-hover:border-white/5 rounded-xl p-3 md:p-4 transition-all -ml-2 hover:shadow-sm">
                                        <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Step {idx + 1}</div>
                                        <div className={`text-sm md:text-base font-semibold ${isActive ? 'text-indigo-900' : isLocked ? 'text-slate-400' : 'text-slate-200'}`}>
                                            {m.module.title}
                                        </div>
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

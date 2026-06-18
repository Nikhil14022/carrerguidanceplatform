"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuestionnairesPage() {
    const [modules, setModules] = useState<any[]>([]);
    const [journeyStatus, setJourneyStatus] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const res = await fetch('/api/client/dashboard', { cache: 'no-store' });
                const data = await res.json();
                if (data.profile?.modules) {
                    setModules(data.profile.modules);
                    setJourneyStatus(data.stats?.journeyStatus || '');
                }
            } catch (err) {
                console.error('Failed to fetch modules', err);
            } finally {
                setLoading(false);
            }
        };
        fetchModules();
    }, []);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="text-slate-500 text-sm font-bold uppercase tracking-widest animate-pulse">Loading Questionnaires...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in text-slate-200">
            <div className="bg-white/5 border shadow-sm rounded-2xl p-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-100 mb-2">Modules</h1>
                <p className="text-slate-400 mb-8">Complete the assessments to unlock your personalized career trajectory.</p>

                {journeyStatus === "Pending Mentor Meeting" && (
                    <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-4">
                        <svg className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <h3 className="text-amber-800 font-bold mb-1">Mentor Meeting Required</h3>
                            <p className="text-amber-700 text-sm">You have completed a batch of 3 modules. Excellent work! Before proceeding to the next batch, you must have an in-person meeting with your mentor for review and approval.</p>
                        </div>
                    </div>
                )}

                <div className="grid gap-4">
                    {modules.map((m: any, idx: number) => {
                        const isLocked = m.status === 'LOCKED';
                        const isCompleted = m.status === 'APPROVED';
                        const isReview = m.status === 'SUBMITTED' || m.status === 'UNDER_REVIEW';
                        const isActive = m.status === 'UNLOCKED' || m.status === 'IN_PROGRESS';

                        let statusColor = 'bg-white/5 border-white/10 text-slate-400';
                        let icon = <span className="font-bold">{idx + 1}</span>;

                        if (isCompleted) {
                            statusColor = 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm';
                            icon = <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
                        } else if (isReview) {
                            statusColor = 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm';
                            icon = <svg className="w-5 h-5 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                        } else if (isActive) {
                            statusColor = 'bg-white/5 border-indigo-600 border-2 shadow-md hover:shadow-lg transition-shadow cursor-pointer';
                            icon = <span className="font-bold text-indigo-600">{idx + 1}</span>;
                        }

                        return (
                            <div
                                key={m.id}
                                onClick={() => !isLocked && router.push(`/dashboard/modules/${m.id}`)}
                                className={`p-6 rounded-xl border flex items-center justify-between transition-all ${statusColor} ${!isLocked ? 'hover:scale-[1.01] cursor-pointer' : ''}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 bg-white/5
                                        ${isCompleted ? 'border-emerald-500' : isReview ? 'border-amber-500' : isActive ? 'border-indigo-600' : 'border-white/10'}
                                    `}>
                                        {icon}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Step {idx + 1}</div>
                                        <h3 className={`text-lg font-bold ${isActive ? 'text-indigo-900' : 'text-slate-200'}`}>{m.module?.title || 'Unknown Module'}</h3>
                                        <p className="text-sm text-slate-500 mt-1">{m.module?.description || 'Complete this module to progress.'}</p>
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    {isCompleted && <span className="px-3 py-1 bg-emerald-100 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">Completed</span>}
                                    {isReview && <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">In Review</span>}
                                    {isActive && <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">Start Module</button>}
                                    {isLocked && <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wider">Locked</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ParentProgressPage() {
    const router = useRouter();
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProgress();
    }, []);

    const fetchProgress = async () => {
        try {
            const res = await fetch('/api/parent/progress');
            const data = await res.json();
            if (res.ok) {
                setTimeline(data.timeline || []);
            }
        } catch (err) {
            console.error('Failed to fetch progress', err);
        } finally {
            setLoading(false);
        }
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            NOT_STARTED: 'bg-slate-800 text-slate-400 border-slate-700',
            IN_PROGRESS: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            ON_HOLD: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            NOT_APPLICABLE: 'bg-slate-800/50 text-slate-500 border-slate-700 line-through',
        };
        return map[status] || map.NOT_STARTED;
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            <header>
                <button onClick={() => router.push('/parent')} className="text-xs font-bold text-slate-500 hover:text-indigo-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2} /></svg>
                    Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold tracking-tight">Journey Timeline</h1>
                <p className="text-slate-500 mt-1">Milestones and stage-wise completion status.</p>
            </header>

            <div className="relative pl-8 space-y-8">
                {/* Vertical Line */}
                <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-white/5" />

                {timeline.map((item, i) => (
                    <div key={item.id} className="relative">
                        {/* Dot */}
                        <div className={`absolute -left-8 top-1.5 w-7 h-7 rounded-full border-4 border-[#030712] flex items-center justify-center z-10 ${item.status === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : item.status === 'IN_PROGRESS' ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : item.status === 'ON_HOLD' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800'}`}>
                            {item.status === 'COMPLETED' && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            )}
                        </div>

                        <div className={`glass-card p-6 transition-all ${item.status === 'COMPLETED' ? 'bg-white/5/[0.02]' : item.status === 'NOT_STARTED' ? 'opacity-60' : ''}`}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4 mb-4">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Stage {item.order}</div>
                                    <h3 className="font-bold text-lg">{item.title}</h3>
                                    {item.completedAt && (
                                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Completed on {new Date(item.completedAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <span className={`px-4 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest ${statusBadge(item.status)}`}>
                                    {item.status.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Additional details for Parent */}
                            <div className="space-y-3 text-xs text-slate-450">
                                {item.notes && (
                                    <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3">
                                        <h4 className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Counselor Remarks</h4>
                                        <p className="text-slate-300 leading-relaxed text-xs">{item.notes}</p>
                                    </div>
                                )}

                                {item.tasks && (() => {
                                    let tasksList = [];
                                    try {
                                        tasksList = typeof item.tasks === 'string' ? JSON.parse(item.tasks) : (item.tasks || []);
                                    } catch (e) {
                                        tasksList = [];
                                    }
                                    if (tasksList.length === 0) return null;
                                    return (
                                        <div>
                                            <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Checklist Tasks</h4>
                                            <ul className="space-y-1">
                                                {tasksList.map((t: any, idx: number) => (
                                                    <li key={idx} className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded border flex items-center justify-center ${t.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/20'}`}>
                                                            {t.completed && (
                                                                <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                                            )}
                                                        </div>
                                                        <span className={t.completed ? 'line-through text-slate-500' : 'text-slate-300'}>{t.text}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })()}

                                {item.documents && (() => {
                                    let docsList = [];
                                    try {
                                        docsList = typeof item.documents === 'string' ? JSON.parse(item.documents) : (item.documents || []);
                                    } catch (e) {
                                        docsList = [];
                                    }
                                    if (docsList.length === 0) return null;
                                    return (
                                        <div>
                                            <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Shared Documents</h4>
                                            <ul className="space-y-1">
                                                {docsList.map((doc: any, idx: number) => (
                                                    <li key={idx} className="flex items-center gap-2">
                                                        <span>📄</span>
                                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                                                            {doc.name}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })()}

                                {item.meetingOutcomes && (
                                    <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3">
                                        <h4 className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Meeting Decisions & Outcomes</h4>
                                        <p className="text-slate-300 leading-relaxed text-xs">{item.meetingOutcomes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

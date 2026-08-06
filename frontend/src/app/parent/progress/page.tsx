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
            NOT_STARTED: 'bg-slate-100 text-slate-600 border-slate-200',
            IN_PROGRESS: 'bg-indigo-50 text-indigo-750 border-indigo-200',
            ON_HOLD: 'bg-amber-50 text-amber-750 border-amber-200',
            COMPLETED: 'bg-emerald-50 text-emerald-750 border-emerald-200',
            NOT_APPLICABLE: 'bg-slate-50 text-slate-400 border-slate-200 line-through',
        };
        return map[status] || map.NOT_STARTED;
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto text-slate-800">
            <header>
                <button onClick={() => router.push('/parent')} className="text-xs font-bold text-slate-500 hover:text-indigo-600 mb-4 flex items-center gap-2 uppercase tracking-widest cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2} /></svg>
                    Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Journey Timeline</h1>
                <p className="text-slate-600 mt-1">Milestones and stage-wise completion status.</p>
            </header>

            <div className="relative pl-8 space-y-8">
                {/* Vertical Line */}
                <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-200" />

                {timeline.map((item, i) => (
                    <div key={item.id} className="relative">
                        {/* Dot */}
                        <div className={`absolute -left-8 top-1.5 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center z-10 ${item.status === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : item.status === 'IN_PROGRESS' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : item.status === 'ON_HOLD' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-slate-350'}`}>
                            {item.status === 'COMPLETED' && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            )}
                        </div>

                        <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all ${item.status === 'COMPLETED' ? 'bg-emerald-50/10' : item.status === 'NOT_STARTED' ? 'opacity-65' : ''}`}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Stage {item.order}</div>
                                    <h3 className="font-bold text-lg text-slate-900">{item.title}</h3>
                                    {item.completedAt && (
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Completed on {new Date(item.completedAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <span className={`px-4 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest ${statusBadge(item.status)}`}>
                                    {item.status.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Additional details for Parent */}
                            <div className="space-y-3 text-xs text-slate-700">
                                {item.notes && (
                                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-4">
                                        <h4 className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider mb-1">Counselor Remarks</h4>
                                        <p className="text-slate-800 leading-relaxed text-xs font-medium">{item.notes}</p>
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
                                                    <li key={idx} className="flex items-center gap-2 font-medium">
                                                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${t.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                                                            {t.completed && (
                                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                                            )}
                                                        </div>
                                                        <span className={t.completed ? 'line-through text-slate-400' : 'text-slate-700'}>{t.text}</span>
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
                                                    <li key={idx} className="flex items-center gap-2 font-medium">
                                                        <span>📄</span>
                                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 hover:underline">
                                                            {doc.name}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })()}

                                {item.meetingOutcomes && (
                                    <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4">
                                        <h4 className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider mb-1">Meeting Decisions & Outcomes</h4>
                                        <p className="text-slate-800 leading-relaxed text-xs font-medium">{item.meetingOutcomes}</p>
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

"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ModuleData {
    id: string;
    moduleId: string;
    status: string;
    order: number;
    filledBy: string;
    module: { title: string; description: string; schema: any };
    response: { data: any; submittedAt: string; approvedAt: string | null } | null;
}

interface ClientData {
    id: string;
    userId: string;
    currentStage: number;
    journeyStatus: string;
    user: { id: string; email: string; name: string | null; createdAt: string };
    modules: ModuleData[];
    reports: any[];
    parentData?: any[];
}

export default function MentorClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [client, setClient] = useState<ClientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [mentorNotes, setMentorNotes] = useState('');
    const [notification, setNotification] = useState<{ type: string; msg: string } | null>(null);
    const [clientId, setClientId] = useState<string>('');

    useEffect(() => {
        params.then(p => {
            setClientId(p.id);
            fetchClient(p.id);
        });
    }, []);

    const fetchClient = async (id: string) => {
        try {
            const res = await fetch(`/api/mentor/clients/${id}`);
            const data = await res.json();
            setClient(data.client);
        } catch (err) {
            console.error('Failed to fetch client', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (moduleId: string, action: 'APPROVE' | 'REJECT' | 'SAVE_NOTES' | 'UNLOCK' | 'UNLOCK_BATCH') => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/mentor/modules/${moduleId}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, notes: mentorNotes })
            });
            const data = await res.json();
            if (data.success) {
                setNotification({ type: 'success', msg: `${action === 'UNLOCK_BATCH' ? `Next ${data.unlockedCount || 3} modules unlocked` : `Module ${action === 'APPROVE' ? 'approved' : action === 'REJECT' ? 'rejected' : action === 'UNLOCK' ? 'unlocked' : 'notes saved'}`} successfully` });
                if (action !== 'SAVE_NOTES') {
                    setSelectedModule(null);
                    setMentorNotes('');
                }
                await fetchClient(clientId);
            } else {
                setNotification({ type: 'error', msg: data.error || 'Action failed' });
            }
        } catch (err) {
            setNotification({ type: 'error', msg: 'Network error' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            LOCKED: 'bg-slate-100 text-slate-500 border-white/10',
            UNLOCKED: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
            IN_PROGRESS: 'bg-blue-500/10 text-blue-600 border-blue-200',
            SUBMITTED: 'bg-amber-50 text-amber-600 border-amber-200',
            UNDER_REVIEW: 'bg-orange-500/10 text-orange-600 border-orange-200',
            APPROVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
        };
        return map[status] || map.LOCKED;
    };

    const renderTestScores = (scored: any) => {
        if (!scored?.scores) return null;
        const { testType, scores } = scored;

        if (testType === '16PF') {
            return (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl font-black text-indigo-400">{scores.type}</span>
                        <span className="text-xs font-bold text-slate-500 uppercase">Personality Type</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {Object.entries(scores.dimensions).map(([key, dim]: [string, any]) => (
                            <div key={key} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{key}</div>
                                <div className="text-sm font-bold text-indigo-300 mt-1">{dim.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (testType === 'RIASEC') {
            return (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-indigo-400">{scores.hollandCode}</span>
                        <span className="text-xs font-bold text-slate-500 uppercase">Holland Code</span>
                    </div>
                    <div className="space-y-3">
                        {scores.top3?.map((item: any) => (
                            <div key={item.letter} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-black">{item.letter}</div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-200">{item.label}</div>
                                        <div className="w-full bg-slate-800 rounded-full h-2 mt-1">
                                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(item.score * 4, 100)}%` }} />
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-400">{item.score}</span>
                                </div>
                                {item.interpretation && (
                                    <details className="group mt-2">
                                        <summary className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest cursor-pointer hover:text-indigo-400 transition-colors">
                                            View Interpretation
                                        </summary>
                                        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                                            {item.interpretation}
                                        </p>
                                    </details>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (testType === 'COLOR') {
            const colorMap: Record<string, string> = {
                Blue: 'bg-blue-500', Green: 'bg-emerald-500', Gold: 'bg-amber-500', Red: 'bg-red-500'
            };
            return (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full ${colorMap[scores.primaryColor] || 'bg-slate-500'}`} />
                        <div className={`w-6 h-6 rounded-full ${colorMap[scores.secondaryColor] || 'bg-slate-500'}`} />
                        <span className="text-lg font-bold text-slate-200">{scores.colorCode}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                            <div className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Primary</div>
                            <div className="font-bold text-slate-200 mt-1">{scores.primaryColor}</div>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                            <div className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Secondary</div>
                            <div className="font-bold text-slate-200 mt-1">{scores.secondaryColor}</div>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 col-span-2">
                            <div className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Energy</div>
                            <div className="font-bold text-slate-200 mt-1">{scores.energyType}</div>
                        </div>
                    </div>
                    {scores.interpretation && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-3">
                            <div className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest mb-2">Career Personality Interpretation</div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {scores.interpretation}
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        if (testType === 'VALUES') {
            return (
                <div className="space-y-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Top 10 Values</div>
                    <div className="space-y-2">
                        {scores.topValues?.map((v: any) => (
                            <div key={v.rank} className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black">{v.rank}</span>
                                <span className="text-sm font-medium text-slate-200 flex-1">{v.value}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-widest ${
                                    v.category === 'ideal' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                    v.category === 'standard' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>{v.category}</span>
                                <span className="text-[10px] text-slate-500 font-medium">{v.genre}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 text-xs">
                        {Object.entries(scores.distribution || {}).map(([cat, count]: [string, any]) => (
                            <div key={cat} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                                <span className="text-slate-500 uppercase font-bold">{cat}:</span> <span className="text-slate-200 font-bold">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (testType === 'SMI') {
            return (
                <div className="space-y-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Top Subject Interest Areas</div>
                    <div className="space-y-3">
                        {scores.topColumns?.map((col: any) => (
                            <div key={col.column} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-black">{col.column}</div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-200">{col.label}</div>
                                        <div className="w-full bg-slate-800 rounded-full h-2 mt-1">
                                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(col.score * 2.5, 100)}%` }} />
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-400">{col.score}</span>
                                </div>
                                {col.interpretation && (
                                    <details className="group mt-2">
                                        <summary className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest cursor-pointer hover:text-indigo-400 transition-colors">
                                            View Description
                                        </summary>
                                        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                                            {col.interpretation}
                                        </p>
                                    </details>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return null;
    };





    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-slate-500">Client not found or access denied</div>
            </div>
        );
    }

    const completedCount = client.modules.filter(m => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(m.status)).length;
    const approvedCount = client.modules.filter(m => m.status === 'APPROVED').length;
    const pendingReview = client.modules.filter(m => m.status === 'SUBMITTED' || m.status === 'UNDER_REVIEW');

    return (
        <div className="p-8 space-y-8 animate-fade-in text-slate-100">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl border text-sm font-bold shadow-lg animate-in slide-in-from-top ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-200 text-emerald-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {notification.msg}
                </div>
            )}

            {/* Header     */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                    <button onClick={() => router.push('/mentor')} className="text-xs font-bold text-slate-500 hover:text-indigo-600 mb-4 flex items-center gap-2 uppercase tracking-widest transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2} /></svg>
                        Back to Clients
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100">{client.user.name || 'Unnamed Client'}</h1>
                    <p className="text-slate-500 mt-1 mb-4">{client.user.email} · Joined {new Date(client.user.createdAt).toLocaleDateString()}</p>
                    <button
                        onClick={() => router.push(`/mentor/clients/${clientId}/combined-answers`)}
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors inline-flex items-center gap-2 border border-indigo-500/20 shadow-lg shadow-indigo-600/10 mb-4"
                    >
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Combined Answers Feed
                    </button>
                </div>
                <div className="flex gap-3">
                    {pendingReview.length > 0 && (
                        <div className="bg-white/5 rounded-2xl border border-amber-200 px-5 py-3 text-center shadow-sm">
                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Pending Review</div>
                            <div className="text-xl font-black text-amber-600">{pendingReview.length}</div>
                        </div>
                    )}
                    <div className="bg-white/5 rounded-2xl border border-white/10 px-5 py-3 text-center shadow-sm">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progress</div>
                        <div className="text-xl font-black text-indigo-600">{approvedCount}/{client.modules.length}</div>
                    </div>
                </div>
            </div>

            {/* Journey Status Bar */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-slate-300">Journey Progress</span>
                    <span className="text-xs font-medium text-slate-500">{client.journeyStatus}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${client.modules.length > 0 ? (approvedCount / client.modules.length * 100) : 0}%` }}
                    />
                </div>
            </div>

            {/* Unlock Next Batch CTA */}
            {client.journeyStatus === 'Pending Mentor Meeting' && (
                <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-300 text-lg">Mentor Meeting Checkpoint</h3>
                            <p className="text-sm text-slate-400 mt-1">This client has completed their current module set. After conducting a one-on-one review meeting, unlock the next 3 modules to continue their journey.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleReview(client.modules[0]?.id || '', 'UNLOCK_BATCH')}
                        disabled={actionLoading}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-500 text-white font-bold text-sm uppercase tracking-widest hover:from-amber-400 hover:to-indigo-400 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20 shrink-0 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                        {actionLoading ? 'Unlocking...' : 'Unlock Next 3 Modules'}
                    </button>
                </div>
            )}

            <div className="grid lg:grid-cols-[1fr_400px] gap-8">
                {/* Module Grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-100">Assigned Modules</h2>
                    </div>

                    {client.modules.map((mod) => (
                        <div
                            key={mod.id}
                            onClick={() => setSelectedModule(selectedModule?.id === mod.id ? null : mod)}
                            className={`bg-white/5 rounded-2xl border p-6 cursor-pointer shadow-sm transition-all hover:border-indigo-300 hover:shadow-md ${selectedModule?.id === mod.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-white/10'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-500 font-bold">#{mod.order}</span>
                                        <h3 className="font-bold text-slate-100">{mod.module.title}</h3>
                                    </div>
                                    <p className="text-xs text-slate-500">{mod.module.description}</p>
                                    {mod.filledBy !== 'CLIENT' && (
                                        <div className="mt-2">
                                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 border border-indigo-200 font-bold uppercase tracking-widest">Filled by {mod.filledBy}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${statusBadge(mod.status)}`}>
                                        {mod.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            {mod.response?.submittedAt && (
                                <div className="text-[10px] text-slate-500 mt-3 font-medium">Submitted: {new Date(mod.response.submittedAt).toLocaleDateString()}</div>
                            )}
                        </div>
                    ))}

                    {/* Reports */}
                    {client.reports.length > 0 && (
                        <div className="space-y-4 pt-4">
                            <h2 className="text-xl font-bold text-slate-100">Reports</h2>
                            {client.reports.map(report => (
                                <a key={report.id} href={`/mentor/reports/${report.id}`} className="bg-white/5 rounded-2xl border border-white/10 shadow-sm p-6 block hover:border-indigo-300 hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                <h3 className="font-bold text-slate-100 group-hover:text-indigo-600 transition-colors">AI Career Analysis</h3>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 font-medium">Status: {report.status} · {report.careerOptions?.length || 0} career options</div>
                                        </div>
                                        <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                    {/* Parent Data */}
                    {client.parentData && client.parentData.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h2 className="text-xl font-bold text-slate-100">Parent Uploads</h2>
                            {client.parentData.map((pd: any) => (
                                <div key={pd.id} className="bg-white/5 rounded-2xl border border-white/10 shadow-sm p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-slate-100">Record Data</h3>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(pd.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {pd.reportCardUrl && <a href={pd.reportCardUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline block truncate flex items-center gap-2">📄 Report Card</a>}
                                        {pd.projectsUrl && <a href={pd.projectsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline block truncate flex items-center gap-2">💻 Projects</a>}
                                        {pd.achievementsUrl && <a href={pd.achievementsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline block truncate flex items-center gap-2">🏆 Achievements</a>}
                                        {pd.notes && <p className="text-sm text-slate-400 mt-2 p-3 bg-white/5 rounded-lg border border-white/5 italic">"{pd.notes}"</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Review Panel */}
                <div className="space-y-6">
                    {selectedModule ? (
                        <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm p-6 space-y-6 sticky top-8 max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-100">{selectedModule.module.title}</h3>
                                    <div className="mt-2 flex gap-2 flex-wrap">
                                        <span className={`inline-block px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${statusBadge(selectedModule.status)}`}>
                                            {selectedModule.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedModule(null)} className="text-slate-400 hover:text-slate-400 p-1 border border-white/5 rounded-lg hover:bg-white/5 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Response Data */}
                            {selectedModule.response ? (
                                <>
                                    {/* View Full Answers Button */}
                                    <button
                                        onClick={() => router.push(`/mentor/clients/${clientId}/modules/${selectedModule.id}`)}
                                        className="w-full flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 hover:bg-indigo-500/15 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <div className="text-left">
                                                <div className="text-sm font-bold">View & Edit Answers</div>
                                                <div className="text-[10px] text-indigo-400/60">Questions with answers · Full page view</div>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-indigo-400/50 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    {/* Compact Response Summary */}
                                    <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Response Summary</h4>
                                        <div className="space-y-3 text-sm">
                                            {(() => {
                                                const data = selectedModule.response?.data || {};
                                                const questions = selectedModule.module?.schema?.questions || [];
                                                const questionMap: Record<string, string> = {};
                                                questions.forEach((q: any) => { questionMap[q.id] = q.question; });
                                                const entries = Object.entries(data);
                                                const shown = entries.slice(0, 5);
                                                return (
                                                    <>
                                                        {shown.map(([key, value]) => (
                                                            <div key={key} className="border-b border-white/5 pb-2">
                                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">
                                                                    {questionMap[key] || key.replace(/_/g, ' ')}
                                                                </div>
                                                                <div className="text-slate-300 truncate">
                                                                    {Array.isArray(value)
                                                                        ? `${value.length} item(s)`
                                                                        : typeof value === 'object'
                                                                        ? 'Complex data'
                                                                        : String(value).substring(0, 80) + (String(value).length > 80 ? '…' : '')
                                                                    }
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {entries.length > 5 && (
                                                            <div className="text-xs text-slate-500 text-center pt-1">
                                                                + {entries.length - 5} more answers
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Mentor Notes - Always visible if there is a response */}
                                    <div className="pt-4 space-y-4 border-t border-white/5 mt-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Mentor Notes (Visible to Client)</label>
                                            <textarea
                                                value={mentorNotes}
                                                onChange={(e) => setMentorNotes(e.target.value)}
                                                placeholder="Add constructive feedback, questions, or clarification notes here..."
                                                rows={3}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => handleReview(selectedModule.id, 'SAVE_NOTES')}
                                                disabled={actionLoading}
                                                className="px-4 py-2.5 rounded-xl bg-orange-100 text-orange-400 text-xs font-bold uppercase tracking-widest hover:bg-orange-200 transition-all disabled:opacity-50"
                                            >
                                                {actionLoading ? 'Saving...' : 'Save Notes'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {(selectedModule.status === 'SUBMITTED' || selectedModule.status === 'UNDER_REVIEW') && (
                                        <div className="pt-4 space-y-4 border-t border-white/5 mt-4">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleReview(selectedModule.id, 'APPROVE')}
                                                    disabled={actionLoading}
                                                    className="flex-1 py-3.5 rounded-xl bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-sm shadow-emerald-500/20"
                                                >
                                                    {actionLoading ? '...' : '✓ Approve'}
                                                </button>
                                                <button
                                                    onClick={() => handleReview(selectedModule.id, 'REJECT')}
                                                    disabled={actionLoading}
                                                    className="flex-1 py-3.5 rounded-xl bg-white/5 border-2 border-red-100 text-red-600 text-xs font-bold uppercase tracking-widest hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading ? '...' : '✗ Reject'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {selectedModule.status === 'LOCKED' && (
                                        <div className="pt-4 border-t border-white/5 mt-4 flex justify-end">
                                            <button
                                                onClick={() => handleReview(selectedModule.id, 'UNLOCK')}
                                                disabled={actionLoading}
                                                className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50"
                                            >
                                                {actionLoading ? '...' : '🔓 Unlock Module'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12 text-slate-500 bg-white/5 rounded-xl border border-white/5 border-dashed space-y-4">
                                    <p className="text-sm font-medium">No response submitted yet</p>
                                    {selectedModule.status === 'LOCKED' && (
                                        <div>
                                            <button
                                                onClick={() => handleReview(selectedModule.id, 'UNLOCK')}
                                                disabled={actionLoading}
                                                className="px-6 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest hover:bg-indigo-500/20 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                                {actionLoading ? '...' : 'Unlock This Module'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white/5 rounded-2xl border border-white/10 border-dashed shadow-sm p-12 text-center">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-bold text-slate-300 mb-1">Select a Module</h3>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto">Click on any assigned module to view client responses and take action.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

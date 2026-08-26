"use client";
import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import StageManagementPanel from '@/components/StageManagementPanel';

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
    appointments?: any[];
    stages?: any[];
}

export default function MentorClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: clientId } = use(params);
    const [client, setClient] = useState<ClientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [mentorNotes, setMentorNotes] = useState('');
    const [notification, setNotification] = useState<{ type: string; msg: string } | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');
    const [activeReportTab, setActiveReportTab] = useState<'persona' | 'personality' | 'cognitive' | 'interests' | 'diagnostic'>('persona');

    // Stage Management States
    const [editingStage, setEditingStage] = useState<any>(null);
    const [stageStatus, setStageStatus] = useState<string>('NOT_STARTED');
    const [stageNotes, setStageNotes] = useState<string>('');
    const [stageOutcomes, setStageOutcomes] = useState<string>('');
    const [stageTasks, setStageTasks] = useState<any[]>([]);
    const [stageDocs, setStageDocs] = useState<any[]>([]);
    const [newTaskText, setNewTaskText] = useState<string>('');
    const [newDocName, setNewDocName] = useState<string>('');
    const [newDocUrl, setNewDocUrl] = useState<string>('');
    const [updatingStage, setUpdatingStage] = useState<boolean>(false);

    const handleOpenEditStage = (stage: any) => {
        setEditingStage(stage);
        setStageStatus(stage.status);
        setStageNotes(stage.notes || '');
        setStageOutcomes(stage.meetingOutcomes || '');
        let tasks = [];
        try {
            tasks = typeof stage.tasks === 'string' ? JSON.parse(stage.tasks) : (stage.tasks || []);
        } catch (e) {
            tasks = [];
        }
        setStageTasks(tasks);
        let docs = [];
        try {
            docs = typeof stage.documents === 'string' ? JSON.parse(stage.documents) : (stage.documents || []);
        } catch (e) {
            docs = [];
        }
        setStageDocs(docs);
        setNewTaskText('');
        setNewDocName('');
        setNewDocUrl('');
    };

    const handleSaveStage = async () => {
        if (!editingStage || !clientId) return;
        setUpdatingStage(true);
        try {
            const res = await fetch(`/api/mentor/clients/${clientId}/stages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stageNumber: editingStage.stageNumber,
                    status: stageStatus,
                    notes: stageNotes,
                    meetingOutcomes: stageOutcomes,
                    tasks: stageTasks,
                    documents: stageDocs
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setNotification({ type: 'success', msg: 'Stage updated successfully!' });
                setEditingStage(null);
                fetchClient(clientId);
            } else {
                setNotification({ type: 'error', msg: data.error || 'Failed to update stage' });
            }
        } catch (err) {
            setNotification({ type: 'error', msg: 'Network error occurred' });
        } finally {
            setUpdatingStage(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const safeVal = (v: any) => v !== undefined && v !== null && v !== '' ? v : '—';

    const getModuleData = (keywords: string[]) => {
        if (!client) return null;
        const match = client.modules.find((m: any) => {
            const title = (m.module?.title || '').toLowerCase();
            return keywords.some(kw => title.includes(kw.toLowerCase()));
        });
        return match?.response?.data || null;
    };

    const handleGenerateReport = async (promptOverride?: string) => {
        setActionLoading(true);
        const finalPrompt = promptOverride !== undefined ? promptOverride : customPrompt;
        try {
            const res = await fetch(`/api/mentor/clients/${clientId}/generate-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: finalPrompt })
            });
            const data = await res.json();
            if (data.success) {
                setNotification({ type: 'success', msg: 'AI report generated successfully' });
                setCustomPrompt('');
                await fetchClient(clientId);
            } else {
                setNotification({ type: 'error', msg: data.error || 'Report generation failed' });
            }
        } catch (err) {
            setNotification({ type: 'error', msg: 'Network error' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    useEffect(() => {
        if (clientId) {
            fetchClient(clientId);
        }
    }, [clientId]);

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

    const handleReview = async (moduleId: string, action: 'APPROVE' | 'REJECT' | 'SAVE_NOTES' | 'UNLOCK' | 'UNLOCK_BATCH' | 'LOCK') => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/mentor/modules/${moduleId}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, notes: mentorNotes })
            });
            const data = await res.json();
            if (data.success) {
                setNotification({ type: 'success', msg: `${action === 'UNLOCK_BATCH' ? `Next ${data.unlockedCount || 3} modules unlocked` : `Module ${action === 'APPROVE' ? 'approved' : action === 'REJECT' ? 'rejected' : action === 'UNLOCK' ? 'unlocked' : action === 'LOCK' ? 'locked' : 'notes saved'}`} successfully` });
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

            {/* Stages & Workflow Control Panel */}
            <StageManagementPanel
                stages={client.stages || []}
                journeyStatus={client.journeyStatus}
                onEditStage={handleOpenEditStage}
                accentColor="indigo"
            />

            {/* Scheduled Meetings */}
            {client.appointments && client.appointments.length > 0 && (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <span>📅 Scheduled Google Calendar Meetings</span>
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {client.appointments.map((meet: any) => (
                            <div key={meet.id} className="p-4 bg-slate-950/40 rounded-xl border border-white/5 text-xs space-y-1 hover:border-indigo-500/30 transition-all">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-slate-200">{meet.notes || 'Mentor Session'}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold uppercase tracking-wider">
                                        {meet.status}
                                    </span>
                                </div>
                                <p className="text-slate-400">🕒 {new Date(meet.startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                {meet.meetingLink && (
                                    <p className="truncate text-indigo-400 mt-1">
                                        🔗 <a href={meet.meetingLink} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-400 font-semibold">
                                            Join Google Meet
                                        </a>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
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

                    {/* Generate Report widget */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                    <span>🤖 AI Report Generator</span>
                                    {approvedCount < client.modules.length && (
                                        <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                                            Locked
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    {approvedCount < client.modules.length 
                                        ? `Complete and approve all ${client.modules.length} modules to unlock report generation.`
                                        : "Generate the career guidance report with optional custom instructions."
                                    }
                                </p>
                            </div>
                        </div>

                        {approvedCount < client.modules.length && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs space-y-1">
                                <p className="font-semibold">⚠️ Attention: Incomplete Modules</p>
                                <p className="text-[11px] text-amber-400/90 leading-relaxed">
                                    Not all modules have been approved yet (Progress: {approvedCount}/{client.modules.length}). Generating a report now may result in incomplete analysis.
                                </p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                                    Custom Report Instructions (Optional)
                                </label>
                                <textarea
                                    value={customPrompt}
                                    onChange={e => setCustomPrompt(e.target.value)}
                                    placeholder="e.g., Focus on careers in clean energy and sustainability, highlight their RIASEC Artistic score..."
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <button
                                onClick={() => handleGenerateReport()}
                                disabled={actionLoading}
                                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
                            >
                                {actionLoading ? 'Generating...' : 'Generate Career Report'}
                            </button>
                        </div>
                    </div>

                    {/* Reports */}
                    {(client.reports || []).length > 0 && (
                        <div className="space-y-6 pt-4">
                            <h2 className="text-xl font-bold text-slate-100">AI Generated Reports</h2>
                            {(client.reports || []).map(report => {
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

                                // 6. Strengths & Weaknesses
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

                                // 8. Media Genre & Visual World
                                const mediaMovies = (visualData?.visual_fav_movies || []).filter((m: any) => m && m.col1).map((m: any) => m.col1);
                                const mediaSeries = (visualData?.visual_fav_series || []).filter((s: any) => s && s.col1).map((s: any) => s.col1);
                                const mediaGenres = (visualData?.visual_genres || []).filter((g: any) => g && g.option).map((g: any) => g.option);
                                const mediaGames = (visualData?.visual_games || []).filter((g: any) => g && g.col2).map((g: any) => g.col2);

                                // 9. Lifestyle Priorities & Struggles
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
                                    <div key={report.id} className="bg-white/5 rounded-2xl border border-white/10 shadow-sm p-6 space-y-6 relative group">
                                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                                                    <h3 className="font-bold text-slate-100 text-lg">Comprehensive Career Analysis Report</h3>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 font-medium">
                                                    Generated on {new Date(report.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest ${
                                                    report.status === 'FINALIZED' 
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                }`}>
                                                    {report.status.replace('_', ' ')}
                                                </span>
                                                <a 
                                                    href={`/mentor/reports/${report.id}`} 
                                                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
                                                >
                                                    Edit Report
                                                </a>
                                            </div>
                                        </div>

                                        {/* Tabs Navigation */}
                                        <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-3">
                                            {[
                                                { id: 'persona', label: 'Persona & Careers', icon: '👤' },
                                                { id: 'personality', label: 'Personality & Style', icon: '🧠' },
                                                { id: 'cognitive', label: 'Cognitive & Values', icon: '⚡' },
                                                { id: 'interests', label: 'Interests & Academics', icon: '📚' },
                                                { id: 'diagnostic', label: 'Diagnostic Overview', icon: '🔎' }
                                            ].map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setActiveReportTab(t.id as any)}
                                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                        activeReportTab === t.id 
                                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    <span>{t.icon}</span>
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Tab Content */}
                                        <div className="space-y-6 pt-2">
                                            {activeReportTab === 'persona' && (
                                                <div className="space-y-6">
                                                    {/* Demographics Summary */}
                                                    <div className="bg-slate-950 border border-slate-900 p-5 rounded-xl space-y-4">
                                                        <h4 className="text-xs font-bold text-slate-350 flex items-center gap-2">👤 Demographics & Profile</h4>
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                                            <div>
                                                                <span className="text-[10px] text-slate-500 block">Name</span>
                                                                <strong className="text-slate-300">{safeVal(demoData?.demo_name || client.user.name)}</strong>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-500 block">Age</span>
                                                                <strong className="text-slate-300">{safeVal(demoData?.demo_age)}</strong>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-500 block">DOB</span>
                                                                <strong className="text-slate-300">{safeVal(demoData?.demo_dob)}</strong>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-500 block">Location</span>
                                                                <strong className="text-slate-300">{safeVal(demoData?.demo_residence)}</strong>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* AI Persona Insights */}
                                                    <div className="space-y-2">
                                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Professional Persona Summary</h4>
                                                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto custom-scrollbar">
                                                            {personalityInsights}
                                                        </div>
                                                    </div>

                                                    {/* Career Suggestions */}
                                                    {report.careerOptions && report.careerOptions.length > 0 && (
                                                        <div className="space-y-3">
                                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended Career Trajectories</h4>
                                                            <div className="grid gap-4">
                                                                {report.careerOptions.map((opt: any, idx: number) => (
                                                                    <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-3">
                                                                        <div className="flex justify-between items-start gap-4">
                                                                            <div>
                                                                                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Option {idx + 1}</span>
                                                                                <h5 className="font-bold text-slate-200 text-base">{opt.title}</h5>
                                                                            </div>
                                                                            <span className="shrink-0 text-sm font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
                                                                                {opt.match}% Match
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-slate-450 leading-relaxed border-l border-slate-800 pl-3">{opt.reasoning}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {activeReportTab === 'personality' && (
                                                <div className="space-y-6">
                                                    {/* MBTI Section */}
                                                    <div className="bg-slate-950 border border-slate-900 p-5 rounded-xl space-y-4">
                                                        <h4 className="text-xs font-bold text-slate-350 flex items-center gap-2">🧠 16PF Personality Factor</h4>
                                                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                                                            <div className="bg-indigo-600 text-white font-black text-2xl px-5 py-3 rounded-xl shadow-md shrink-0">
                                                                {mbtiType}
                                                            </div>
                                                            <p className="text-xs text-slate-400 leading-relaxed">{mbtiInterpretation || "Personality factors interpretation compiled from the assessments."}</p>
                                                        </div>
                                                        {mbtiDimensions && typeof mbtiDimensions === 'object' && (
                                                            <div className="grid gap-3 pt-3 border-t border-white/5">
                                                                {Object.entries(mbtiDimensions).map(([k, d]: any) => {
                                                                    if (!d) return null;
                                                                    return (
                                                                        <div key={k} className="space-y-1">
                                                                            <div className="flex justify-between text-[10px] font-bold">
                                                                                <span className="text-slate-500 capitalize">{k}</span>
                                                                                <span className="text-indigo-400">{d?.label || 'N/A'} ({d?.percentage || 0}%)</span>
                                                                            </div>
                                                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${d?.percentage || 0}%` }} />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Holland RIASEC */}
                                                    <div className="bg-slate-950 border border-slate-900 p-5 rounded-xl space-y-4">
                                                        <h4 className="text-xs font-bold text-slate-350 flex items-center gap-2">🎯 RIASEC Occupational Interests</h4>
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-sky-600 text-white font-black text-xl px-4 py-2 rounded-xl shrink-0">
                                                                {hollandCode}
                                                            </div>
                                                            <div className="flex-1 grid grid-cols-6 gap-1">
                                                                {['R', 'I', 'A', 'S', 'E', 'C'].map(char => (
                                                                    <div key={char} className="bg-white/5 border border-white/5 rounded-lg py-1.5 text-center">
                                                                        <span className="text-xs font-bold text-slate-300 block">{char}</span>
                                                                        <span className="text-[10px] font-black text-indigo-400">{riasecTotals[char] || 0}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {riasecTop3 && Array.isArray(riasecTop3) && riasecTop3.length > 0 && (
                                                            <div className="space-y-2 pt-3 border-t border-white/5 text-xs">
                                                                {riasecTop3.map((item: any) => {
                                                                    if (!item) return null;
                                                                    return (
                                                                        <div key={item.label || item.letter} className="text-xs">
                                                                            <span className="font-bold text-indigo-400">{item.label || 'N/A'} ({item.letter || 'N/A'}) — Score: {item.score || 0}</span>
                                                                            <p className="text-slate-450 leading-relaxed mt-0.5">{item.interpretation || ''}</p>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Color Working Style */}
                                                    <div className="bg-slate-950 border border-slate-900 p-5 rounded-xl space-y-2">
                                                        <h4 className="text-xs font-bold text-slate-350">🎨 Colour Test (Working Style)</h4>
                                                        <div className="flex gap-2 items-center">
                                                            <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[10px] uppercase">{workingStyleResult}</span>
                                                            <p className="text-xs text-slate-400 leading-relaxed">{resolvedStyleDesc}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeReportTab === 'cognitive' && (
                                                <div className="space-y-6">
                                                    {/* Values System */}
                                                    <div className="bg-slate-950 border border-slate-900 p-5 rounded-xl space-y-3">
                                                        <h4 className="text-xs font-bold text-slate-350">⚡ Value System Profile</h4>
                                                        <div className="grid gap-3 text-xs">
                                                            {Object.entries(valuesByCategory).map(([cat, list]) => (
                                                                <div key={cat} className="flex flex-col gap-1">
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cat}</span>
                                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                                        {list.length > 0 ? list.map(v => (
                                                                            <span key={v} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-medium">{v}</span>
                                                                        )) : <span className="text-slate-600 italic">None</span>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Fears Profile */}
                                                    <div className="bg-slate-950 border border-slate-900 p-5 rounded-xl space-y-3">
                                                        <h4 className="text-xs font-bold text-slate-350">⚡ Fears Rating Profile</h4>
                                                        <div className="grid md:grid-cols-3 gap-3 text-xs">
                                                            <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                                                                <span className="font-bold text-rose-400 block mb-1">High (8-10)</span>
                                                                {fearsGrouped.high.length > 0 ? fearsGrouped.high.map(f => <span key={f} className="block text-[10px] text-slate-300">• {f}</span>) : <span className="text-slate-600">None</span>}
                                                            </div>
                                                            <div className="bg-orange-500/5 border border-orange-500/10 p-3 rounded-xl">
                                                                <span className="font-bold text-orange-400 block mb-1">Medium (5-7)</span>
                                                                {fearsGrouped.medium.length > 0 ? fearsGrouped.medium.map(f => <span key={f} className="block text-[10px] text-slate-300">• {f}</span>) : <span className="text-slate-600">None</span>}
                                                            </div>
                                                            <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                                                                <span className="font-bold text-emerald-400 block mb-1">Low (1-4)</span>
                                                                {fearsGrouped.low.length > 0 ? fearsGrouped.low.map(f => <span key={f} className="block text-[10px] text-slate-300">• {f}</span>) : <span className="text-slate-600">None</span>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Strengths & Weaknesses */}
                                                    <div className="bg-slate-950 border border-slate-900 p-5 rounded-xl space-y-3">
                                                        <h4 className="text-xs font-bold text-slate-350">⚡ Strengths & Weaknesses Grid</h4>
                                                        <div className="grid md:grid-cols-3 gap-3 text-xs">
                                                            <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                                                                <span className="font-bold text-emerald-400 block mb-1">Core Strengths</span>
                                                                {swGrouped.strengths.length > 0 ? swGrouped.strengths.map(s => <span key={s} className="block text-[10px] text-slate-300">• {s}</span>) : <span className="text-slate-600">None</span>}
                                                            </div>
                                                            <div className="bg-slate-500/5 border border-slate-500/10 p-3 rounded-xl">
                                                                <span className="font-bold text-slate-400 block mb-1">Situational</span>
                                                                {swGrouped.situational.length > 0 ? swGrouped.situational.map(s => <span key={s} className="block text-[10px] text-slate-300">• {s}</span>) : <span className="text-slate-600">None</span>}
                                                            </div>
                                                            <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                                                                <span className="font-bold text-rose-400 block mb-1">Growth Areas</span>
                                                                {swGrouped.weaknesses.length > 0 ? swGrouped.weaknesses.map(w => <span key={w} className="block text-[10px] text-slate-300">• {w}</span>) : <span className="text-slate-600">None</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeReportTab === 'interests' && (
                                                <div className="space-y-6">
                                                    {/* Academic & Hobbies */}
                                                    <div className="grid md:grid-cols-2 gap-4 text-xs">
                                                        <div className="bg-slate-950 border border-slate-900 p-5 rounded-xl space-y-2">
                                                            <h5 className="font-bold text-slate-300">🏫 Academic Sentiments</h5>
                                                            {activeSubjects.length > 0 ? activeSubjects.map((s: any, idx: number) => (
                                                                <div key={idx} className="flex justify-between py-1 border-b border-white/5">
                                                                    <strong className="text-slate-450">{s.col1}</strong>
                                                                    <span className="text-indigo-400">{s.col2 || 'Neutral'}</span>
                                                                </div>
                                                            )) : <span className="text-slate-600 italic">None</span>}
                                                        </div>
                                                        <div className="bg-slate-950 border border-slate-900 p-5 rounded-xl space-y-2">
                                                            <h5 className="font-bold text-slate-300">🎨 Primary Hobbies</h5>
                                                            {activeHobbies.length > 0 ? activeHobbies.map((h: any, idx: number) => (
                                                                <div key={idx} className="py-1 border-b border-white/5">
                                                                    <div className="flex justify-between font-bold text-indigo-400">
                                                                        <span>{h.col1}</span>
                                                                        <span className="text-slate-500">{h.col3}</span>
                                                                    </div>
                                                                    {h.col2 && <p className="text-[10px] text-slate-500 mt-0.5">{h.col2}</p>}
                                                                </div>
                                                            )) : <span className="text-slate-600 italic">None</span>}
                                                        </div>
                                                    </div>

                                                    {/* SMI occupational totals */}
                                                    <div className="bg-slate-950 border border-slate-900 p-5 rounded-xl space-y-3">
                                                        <h4 className="text-xs font-bold text-slate-350">📚 Subject Matter Interest (SMI)</h4>
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                            {Object.entries({
                                                                A: 'Physical Sciences', B: 'Social Humanities',
                                                                C: 'Arts & Media', D: 'Business & Finance',
                                                                E: 'Body Kinaesthetic', F: 'Designer/Artisan',
                                                                G: 'Engineering & Tech', H: 'Education & Health'
                                                            }).map(([k, lbl]) => (
                                                                <div key={k} className="bg-white/5 p-2 rounded-lg text-center">
                                                                    <span className="text-[9px] text-slate-500 block truncate">{lbl}</span>
                                                                    <strong className="text-sm text-indigo-400 block mt-0.5">{smiTotals[k] !== undefined ? smiTotals[k] : '—'}</strong>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {smiTop3.length > 0 && (
                                                            <div className="space-y-2 pt-3 border-t border-white/5 text-xs">
                                                                {smiTop3.map((item: any) => (
                                                                    <div key={item.label}>
                                                                        <span className="font-bold text-indigo-400">{item.label} (Score: {item.score})</span>
                                                                        <p className="text-slate-450 mt-0.5">{item.interpretation}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Media Genre */}
                                                    <div className="bg-slate-950 border border-slate-900 p-5 rounded-xl space-y-3">
                                                        <h4 className="text-xs font-bold text-slate-350">📚 Media Genre & Visual World</h4>
                                                        <div className="grid sm:grid-cols-2 gap-3 text-[10px]">
                                                            {mediaMovies.length > 0 && <div><span className="text-slate-500 block">Favorite Movies</span><strong className="text-slate-300">{mediaMovies.join(', ')}</strong></div>}
                                                            {mediaSeries.length > 0 && <div><span className="text-slate-500 block">Favorite Series</span><strong className="text-slate-300">{mediaSeries.join(', ')}</strong></div>}
                                                            {mediaGenres.length > 0 && <div><span className="text-slate-500 block">Preferred Genres</span><strong className="text-slate-300">{mediaGenres.join(', ')}</strong></div>}
                                                            {mediaGames.length > 0 && <div><span className="text-slate-500 block">Gaming Styles</span><strong className="text-slate-300">{mediaGames.join(', ')}</strong></div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeReportTab === 'diagnostic' && (
                                                <div className="bg-slate-950 border border-slate-900 p-5 rounded-xl space-y-4">
                                                    <h4 className="text-xs font-bold text-slate-350">🔍 Section Compartments</h4>
                                                    <div className="space-y-3 text-xs">
                                                        {[
                                                            { label: 'Aim & Vision Summary', text: finalOverview.aim, icon: '🎯' },
                                                            { label: 'Family Compartment Dynamics', text: finalOverview.family, icon: '🏠' },
                                                            { label: 'Friends & Social Group Dynamics', text: finalOverview.friends, icon: '🤝' },
                                                            { label: 'Romantic & Relationship Styles', text: finalOverview.relationship, icon: '💖' },
                                                            { label: 'Body Image & Self Identity', text: finalOverview.bodyImage, icon: '🧍' },
                                                            { label: 'Impactful Life Incidents', text: finalOverview.impactful, icon: '⚡' }
                                                        ].map((c, i) => (
                                                            <div key={i} className="py-2 border-b border-white/5 last:border-0">
                                                                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                                                    <span>{c.icon}</span> {c.label}
                                                                </span>
                                                                <p className="text-slate-400 mt-1 pl-5 leading-relaxed">{c.text}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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
                                    {selectedModule.status === 'LOCKED' ? (
                                        <div className="pt-4 border-t border-white/5 mt-4 flex justify-end">
                                            <button
                                                onClick={() => handleReview(selectedModule.id, 'UNLOCK')}
                                                disabled={actionLoading}
                                                className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50"
                                            >
                                                {actionLoading ? '...' : '🔓 Unlock Module'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="pt-4 border-t border-white/5 mt-4 flex justify-end">
                                            <button
                                                onClick={() => handleReview(selectedModule.id, 'LOCK')}
                                                disabled={actionLoading}
                                                className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                                            >
                                                {actionLoading ? '...' : '🔒 Lock Module'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12 text-slate-500 bg-white/5 rounded-xl border border-white/5 border-dashed space-y-4">
                                    <p className="text-sm font-medium">No response submitted yet</p>
                                    {selectedModule.status === 'LOCKED' ? (
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
                                    ) : (
                                        <div>
                                            <button
                                                onClick={() => handleReview(selectedModule.id, 'LOCK')}
                                                disabled={actionLoading}
                                                className="px-6 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                {actionLoading ? '...' : 'Lock This Module'}
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

                                                {/* Stage Editing Modal */}
            {editingStage && (
                <div className="fixed inset-0 bg-slate-955/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl" style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' }}>
                        <div className="flex justify-between items-center pb-3 border-b" style={{ borderBottomColor: '#e2e8f0' }}>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#0f172a' }}>Manage Stage {editingStage.stageNumber}</h3>
                                <p className="text-xs font-bold" style={{ color: '#64748b' }}>{editingStage.stageName}</p>
                            </div>
                            <button
                                onClick={() => setEditingStage(null)}
                                className="hover:text-slate-900 text-lg font-bold cursor-pointer"
                                style={{ color: '#64748b', backgroundColor: 'transparent', border: 'none' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Status Select */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Stage Status</label>
                            <select
                                value={stageStatus}
                                onChange={(e) => setStageStatus(e.target.value)}
                                className="w-full rounded-xl px-4 py-2 text-xs outline-none cursor-pointer"
                                style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }}
                            >
                                <option value="NOT_STARTED" style={{ backgroundColor: '#ffffff', color: '#000000' }}>Not Started</option>
                                <option value="IN_PROGRESS" style={{ backgroundColor: '#ffffff', color: '#000000' }}>In Progress</option>
                                <option value="ON_HOLD" style={{ backgroundColor: '#ffffff', color: '#000000' }}>On Hold</option>
                                <option value="COMPLETED" style={{ backgroundColor: '#ffffff', color: '#000000' }}>Completed</option>
                                <option value="NOT_APPLICABLE" style={{ backgroundColor: '#ffffff', color: '#000000' }}>Not Applicable</option>
                            </select>
                        </div>

                        {/* Counselor Notes */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Counselor Remarks / Notes</label>
                            <textarea
                                value={stageNotes}
                                onChange={(e) => setStageNotes(e.target.value)}
                                placeholder="Describe expectations, reminders, or general progress notes for the student..."
                                rows={3}
                                className="w-full rounded-xl p-3 text-xs outline-none resize-none"
                                style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }}
                            />
                        </div>

                        {/* Collaborative Outcomes (Meetings only) */}
                        {["Collaborative Meeting: Student and Parent", "Report Discussion with the Student", "Research Discussion"].includes(editingStage.stageName) && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Meeting Decisions & Outcomes</label>
                                <textarea
                                    value={stageOutcomes}
                                    onChange={(e) => setStageOutcomes(e.target.value)}
                                    placeholder="Enter finalized key decisions, follow-up points, or agreed alignments here..."
                                    rows={3}
                                    className="w-full rounded-xl p-3 text-xs outline-none resize-none"
                                    style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                        )}

                        {/* Tasks Checklist Manager */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Checklist Tasks</label>
                            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                {stageTasks.length === 0 ? (
                                    <p className="text-[10px] italic" style={{ color: '#64748b' }}>No tasks added to this stage yet.</p>
                                ) : (
                                    stageTasks.map((t, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg text-xs" style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={t.completed}
                                                    onChange={(e) => {
                                                        const updated = [...stageTasks];
                                                        updated[idx].completed = e.target.checked;
                                                        setStageTasks(updated);
                                                    }}
                                                    className="w-3.5 h-3.5 rounded accent-indigo-600 cursor-pointer"
                                                />
                                                <span className={t.completed ? "line-through text-slate-400" : ""}>{t.text}</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const updated = stageTasks.filter((_, i) => i !== idx);
                                                    setStageTasks(updated);
                                                }}
                                                className="text-red-650 hover:text-red-755 font-bold cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add a new checklist item..."
                                    value={newTaskText}
                                    onChange={(e) => setNewTaskText(e.target.value)}
                                    className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
                                    style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }}
                                />
                                <button
                                    onClick={() => {
                                        if (!newTaskText.trim()) return;
                                        setStageTasks([...stageTasks, { text: newTaskText.trim(), completed: false }]);
                                        setNewTaskText('');
                                    }}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-white"
                                    style={{ backgroundColor: '#4f46e5' }}
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Documents Manager */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Linked Documents & Resources</label>
                            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                {stageDocs.length === 0 ? (
                                    <p className="text-[10px] italic" style={{ color: '#64748b' }}>No documents attached yet.</p>
                                ) : (
                                    stageDocs.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg text-xs" style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                                            <div className="flex items-center gap-1.5 truncate">
                                                <span>📄</span>
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate text-indigo-600 font-semibold">
                                                    {doc.name}
                                                </a>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const updated = stageDocs.filter((_, i) => i !== idx);
                                                    setStageDocs(updated);
                                                }}
                                                className="text-red-650 hover:text-red-755 font-bold cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Document Name (e.g. Report.pdf)"
                                    value={newDocName}
                                    onChange={(e) => setNewDocName(e.target.value)}
                                    className="rounded-lg px-3 py-1.5 text-xs outline-none"
                                    style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Document URL (https://...)"
                                    value={newDocUrl}
                                    onChange={(e) => setNewDocUrl(e.target.value)}
                                    className="rounded-lg px-3 py-1.5 text-xs outline-none"
                                    style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    if (!newDocName.trim() || !newDocUrl.trim()) return;
                                    setStageDocs([...stageDocs, { name: newDocName.trim(), url: newDocUrl.trim(), addedAt: new Date().toISOString() }]);
                                    setNewDocName('');
                                    setNewDocUrl('');
                                }}
                                className="w-full py-2 text-xs font-bold rounded-lg transition-colors text-center cursor-pointer text-white"
                                style={{ backgroundColor: '#4f46e5' }}
                            >
                                + Attach Document
                            </button>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderTopColor: '#e2e8f0' }}>
                            <button
                                onClick={() => setEditingStage(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                style={{ backgroundColor: 'transparent', color: '#475569', border: '1px solid #cbd5e1' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveStage}
                                disabled={updatingStage}
                                className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50 text-white"
                                style={{ backgroundColor: '#4f46e5' }}
                            >
                                {updatingStage ? 'Saving...' : 'Save Stage Details'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

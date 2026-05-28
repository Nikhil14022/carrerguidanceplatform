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
    mentorNotes?: string | null;
}

interface ClientData {
    id: string;
    userId: string;
    currentStage: number;
    journeyStatus: string;
    user: { id: string; email: string; name: string | null; createdAt: string };
    modules: ModuleData[];
    reports: any[];
}

export default function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [client, setClient] = useState<ClientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: string; msg: string } | null>(null);
    const [clientId, setClientId] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [allModules, setAllModules] = useState<any[]>([]);
    const [isAddingModule, setIsAddingModule] = useState(false);
    const [mentorNotesInput, setMentorNotesInput] = useState('');

    useEffect(() => {
        params.then(p => {
            setClientId(p.id);
            fetchClient(p.id);
            fetchAllModules();
        });
    }, []);

    const fetchAllModules = async () => {
        try {
            const res = await fetch('/api/admin/modules');
            const data = await res.json();
            setAllModules(data.modules || []);
        } catch (err) {
            console.error('Failed to fetch all modules', err);
        }
    };

    const fetchClient = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/clients/${id}`);
            const data = await res.json();
            setClient(data.client);
        } catch (err) {
            console.error('Failed to fetch client', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (moduleId: string, action: 'APPROVE' | 'REJECT' | 'SAVE_NOTES', notes?: string) => {
        setActionLoading(true);
        const finalNotes = notes !== undefined ? notes : mentorNotesInput;
        try {
            const res = await fetch(`/api/admin/modules/${moduleId}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, notes: finalNotes })
            });
            const data = await res.json();
            if (data.success) {
                setNotification({ type: 'success', msg: `Module ${action === 'APPROVE' ? 'approved' : action === 'REJECT' ? 'rejected' : 'notes saved'} successfully` });
                if (action !== 'SAVE_NOTES') {
                    setSelectedModule(null);
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

    const handleManage = async (action: string, moduleId?: string, newOrder?: number, data?: any) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/clients/${clientId}/manage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, moduleId, newOrder, data })
            });
            const resData = await res.json();
            if (resData.success) {
                setNotification({ type: 'success', msg: `Action "${action}" completed` });
                setIsEditing(false);
                setIsAddingModule(false);
                await fetchClient(clientId);
            } else {
                setNotification({ type: 'error', msg: resData.error || 'Action failed' });
            }
        } catch (err) {
            setNotification({ type: 'error', msg: 'Network error' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleGenerateReport = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/clients/${clientId}/generate-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                setNotification({ type: 'success', msg: 'AI report generated successfully' });
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

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            LOCKED: 'bg-slate-800 text-slate-500 border-slate-700',
            UNLOCKED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            IN_PROGRESS: 'bg-blue-500/100/10 text-blue-400 border-blue-500/20',
            SUBMITTED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            UNDER_REVIEW: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
        return map[status] || map.LOCKED;
    };

    const isFileUrl = (val: any): boolean => {
        if (typeof val !== 'string') return false;
        return val.startsWith('/uploads/') || val.startsWith('http') && (
            val.match(/\.(pdf|png|jpg|jpeg|gif|webp|doc|docx)$/i) !== null || val.includes('/uploads/')
        );
    };

    const renderValue = (value: any, key?: string): React.ReactNode => {
        if (value === null || value === undefined) return <span className="text-slate-500 italic">—</span>;

        // File URL array (uploaded marksheets etc.)
        if (Array.isArray(value) && value.length > 0 && value.every((v: any) => isFileUrl(v))) {
            return (
                <div className="space-y-2">
                    {value.map((fileUrl: string, i: number) => (
                        <a
                            key={i}
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 text-sm hover:bg-indigo-500/20 transition-colors"
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="truncate">{fileUrl.split('/').pop()}</span>
                            <svg className="w-3 h-3 ml-auto flex-shrink-0 text-indigo-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    ))}
                </div>
            );
        }

        // Trait grid data (array of objects with trait/rating)
        if (Array.isArray(value) && value.length > 0 && value[0]?.trait) {
            return (
                <div className="space-y-1.5">
                    {value.map((row: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                            <span className="text-sm text-slate-300 font-medium">{row.trait}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${row.rating >= 7 ? 'bg-emerald-500/20 text-emerald-400' : row.rating <= 3 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                {row.rating}/10
                            </span>
                        </div>
                    ))}
                </div>
            );
        }

        // Table data (array of arrays or array of objects)
        if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
            return (
                <div className="space-y-1">
                    {value.map((row: any[], i: number) => (
                        <div key={i} className="flex gap-3 p-2 bg-white/5 rounded-lg text-sm text-slate-300">
                            {row.map((cell, j) => (
                                <span key={j} className="flex-1">{cell || '—'}</span>
                            ))}
                        </div>
                    ))}
                </div>
            );
        }

        // Generic array of strings
        if (Array.isArray(value) && value.every((v: any) => typeof v === 'string')) {
            return (
                <div className="flex flex-wrap gap-1.5">
                    {value.map((item: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-white/5 rounded-lg text-sm text-slate-300 border border-white/5">
                            {item}
                        </span>
                    ))}
                </div>
            );
        }

        // Object with selected/ranked (multiselect_with_rank)
        if (typeof value === 'object' && !Array.isArray(value) && value.ranked) {
            return (
                <div className="space-y-1">
                    {value.ranked.map((id: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg text-sm text-slate-300">
                            <span className="text-xs font-bold text-indigo-400 w-5 text-center">{i + 1}</span>
                            <span>{id}</span>
                        </div>
                    ))}
                </div>
            );
        }

        // Education history object
        if (typeof value === 'object' && !Array.isArray(value) && (value.school || value.college || value.university)) {
            return (
                <div className="space-y-2">
                    {['school', 'college', 'university'].map(level => {
                        const d = value[level];
                        if (!d?.active) return null;
                        return (
                            <div key={level} className="p-2.5 bg-white/5 rounded-lg text-sm text-slate-300">
                                <span className="font-bold text-indigo-400 capitalize">{level}: </span>
                                {d.name || 'N/A'} — Grade: {d.grade || 'N/A'}
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Schedule object
        if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).some(k => k.includes('AM') || k.includes('PM'))) {
            return (
                <div className="space-y-1">
                    {Object.entries(value).map(([time, activity]) => (
                        <div key={time} className="flex gap-3 p-2 bg-white/5 rounded-lg text-sm">
                            <span className="text-indigo-400 font-bold w-16 flex-shrink-0">{time}</span>
                            <span className="text-slate-300">{String(activity) || '—'}</span>
                        </div>
                    ))}
                </div>
            );
        }

        // Single file URL string
        if (isFileUrl(value)) {
            return (
                <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {String(value).split('/').pop()}
                </a>
            );
        }

        // Generic object fallback
        if (typeof value === 'object') {
            return <pre className="text-sm text-slate-300 whitespace-pre-wrap bg-white/5 p-3 rounded-lg overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>;
        }

        return <span>{String(value)}</span>;
    };

    const renderResponseData = (data: any) => {
        if (!data) return <p className="text-slate-400 italic">No response data</p>;

        if (isEditing) {
            return (
                <div className="space-y-4">
                    {Object.keys(selectedModule?.module.schema.properties || data).map((key) => (
                        <div key={key} className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{key.replace(/_/g, ' ')}</label>
                            <textarea
                                value={editData[key] || ''}
                                onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-orange-500/30"
                                rows={2}
                            />
                        </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => handleManage('EDIT_RESPONSE', selectedModule?.id, undefined, editData)}
                            className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex-1 py-2 rounded-lg bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            );
        }

        // Find question labels from schema
        const questions = selectedModule?.module?.schema?.questions || [];
        const questionMap: Record<string, string> = {};
        questions.forEach((q: any) => { questionMap[q.id] = q.question; });

        return (
            <div className="space-y-4">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="border-b border-white/5 pb-3">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                            {questionMap[key] || key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-slate-300 leading-relaxed">
                            {renderValue(value, key)}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-slate-500">Client not found</div>
            </div>
        );
    }

    const completedCount = client.modules.filter(m => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(m.status)).length;
    const approvedCount = client.modules.filter(m => m.status === 'APPROVED').length;
    const pendingReview = client.modules.filter(m => m.status === 'SUBMITTED' || m.status === 'UNDER_REVIEW');

    return (
        <div className="p-8 space-y-8">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl border text-sm font-bold animate-in slide-in-from-top ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {notification.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                    <button onClick={() => router.push('/admin')} className="text-xs font-bold text-slate-500 hover:text-orange-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2} /></svg>
                        Back to Clients
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight">{client.user.name || 'Unnamed Client'}</h1>
                    <p className="text-slate-500 mt-1 mb-4">{client.user.email} · Joined {new Date(client.user.createdAt).toLocaleDateString()}</p>
                    <button
                        onClick={() => router.push(`/admin/clients/${clientId}/combined-answers`)}
                        className="px-4 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-colors inline-flex items-center gap-2 border border-orange-500/20 shadow-lg shadow-orange-600/10 mb-4"
                    >
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Combined Answers Feed
                    </button>
                </div>
                <div className="flex gap-3">
                    {pendingReview.length > 0 && (
                        <div className="glass-card px-5 py-3 border-amber-500/20 bg-amber-500/5 text-center">
                            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Pending Review</div>
                            <div className="text-xl font-black text-amber-400">{pendingReview.length}</div>
                        </div>
                    )}
                    <div className="glass-card px-5 py-3 text-center">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progress</div>
                        <div className="text-xl font-black text-indigo-400">{approvedCount}/{client.modules.length}</div>
                    </div>
                </div>
            </div>

            {/* Journey Status Bar */}
            <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold">Journey Progress</span>
                    <span className="text-xs text-slate-500">{client.journeyStatus}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all"
                        style={{ width: `${client.modules.length > 0 ? (approvedCount / client.modules.length * 100) : 0}%` }}
                    />
                </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_400px] gap-8">
                {/* Module Grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Assigned Modules</h2>
                        <button
                            onClick={() => setIsAddingModule(!isAddingModule)}
                            className="px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest hover:bg-orange-500/20 transition-all border border-orange-500/20"
                        >
                            {isAddingModule ? 'Cancel' : '+ Add Module'}
                        </button>
                    </div>

                    {isAddingModule && (
                        <div className="glass-card p-6 border-indigo-500/20 bg-indigo-500/5 space-y-4 animate-in fade-in zoom-in-95">
                            <h3 className="text-sm font-bold">Select Module to Add</h3>
                            <div className="grid gap-3">
                                {allModules.filter(m => !client.modules.some(cm => cm.moduleId === m.id)).map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => handleManage('ADD', m.id)}
                                        className="flex flex-col items-start p-4 rounded-xl border border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-left"
                                    >
                                        <div className="font-bold text-sm text-indigo-400">{m.title}</div>
                                        <div className="text-[10px] text-slate-500 mt-1">{m.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {client.modules.map((mod) => (
                        <div
                            key={mod.id}
                            onClick={() => {
                                setSelectedModule(selectedModule?.id === mod.id ? null : mod);
                                setMentorNotesInput(mod.mentorNotes || '');
                                setIsEditing(false);
                            }}
                            className={`glass-card p-6 cursor-pointer transition-all hover:border-orange-500/20 ${selectedModule?.id === mod.id ? 'border-orange-500/30 ring-1 ring-orange-500/20' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400 font-bold">#{mod.order}</span>
                                        <h3 className="font-bold">{mod.module.title}</h3>
                                    </div>
                                    <p className="text-xs text-slate-500">{mod.module.description}</p>
                                    <div className="flex gap-2 mt-2">
                                        {mod.filledBy !== 'CLIENT' && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase tracking-widest">Filled by {mod.filledBy}</span>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleManage('REMOVE', mod.id); }}
                                            className="text-[10px] text-red-500/50 hover:text-red-400 font-bold uppercase tracking-widest px-2"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${statusBadge(mod.status)}`}>
                                        {mod.status.replace('_', ' ')}
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleManage('REORDER', mod.id, mod.order - 1); }}
                                            className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-300"
                                            title="Move Up"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 15l7-7 7 7" strokeWidth={3} /></svg>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleManage('REORDER', mod.id, mod.order + 1); }}
                                            className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-300"
                                            title="Move Down"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth={3} /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {mod.response?.submittedAt && (
                                <div className="text-[10px] text-slate-400 mt-2">Submitted: {new Date(mod.response.submittedAt).toLocaleDateString()}</div>
                            )}
                        </div>
                    ))}

                    {/* Generate Report Button */}
                    {approvedCount >= 3 && (
                        <div className="glass-card p-6 border-purple-500/20 bg-purple-500/5 text-center">
                            <h3 className="text-sm font-bold mb-2">AI Report Generation</h3>
                            <p className="text-xs text-slate-500 mb-4">{approvedCount} modules approved. Generate an AI career analysis for this client.</p>
                            <button
                                onClick={handleGenerateReport}
                                disabled={actionLoading}
                                className="btn-primary px-8 py-2 text-xs font-bold uppercase tracking-widest"
                            >
                                {actionLoading ? 'Generating...' : 'Generate AI Report'}
                            </button>
                        </div>
                    )}

                    {/* Reports */}
                    {client.reports.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Reports</h2>
                            {client.reports.map(report => (
                                <a key={report.id} href={`/admin/reports/${report.id}`} className="glass-card p-6 block hover:border-orange-500/20 transition-all group">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                                                <h3 className="font-bold group-hover:text-orange-400 transition-colors">AI Career Analysis</h3>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">Status: {report.status} · {report.careerOptions?.length || 0} career options</div>
                                        </div>
                                        <svg className="w-5 h-5 text-slate-400 group-hover:text-orange-400 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* Review Panel */}
                <div className="space-y-6">
                    {selectedModule ? (
                        <div className="glass-card p-6 space-y-6 sticky top-8 max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{selectedModule.module.title}</h3>
                                    <div className="flex gap-2 mt-1">
                                        <span className={`inline-block px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${statusBadge(selectedModule.status)}`}>
                                            {selectedModule.status.replace('_', ' ')}
                                        </span>
                                        {!isEditing && (
                                            <button
                                                onClick={() => {
                                                    setIsEditing(true);
                                                    setEditData(selectedModule.response?.data || {});
                                                }}
                                                className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500/20 transition-all font-bold"
                                            >
                                                {selectedModule.response ? 'Edit Response' : 'Manual Entry'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedModule(null); setIsEditing(false); }} className="text-slate-400 hover:text-slate-300 p-1">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Response Data */}
                            {selectedModule.response ? (
                                <>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Client Responses</h4>
                                        {renderResponseData(selectedModule.response.data)}
                                    </div>

                                    {/* Mentor Notes - Always visible if there is a response */}
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Mentor Notes (Optional)</label>
                                            <textarea
                                                value={mentorNotesInput}
                                                onChange={e => setMentorNotesInput(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-orange-500/30 resize-none placeholder:text-slate-400"
                                                placeholder="Add constructive feedback or notes here..."
                                                rows={3}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => handleReview(selectedModule.id, 'SAVE_NOTES')}
                                                disabled={actionLoading}
                                                className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest hover:bg-orange-500/30 transition-all border border-orange-500/20 disabled:opacity-50"
                                            >
                                                {actionLoading ? 'Saving...' : 'Save Notes'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {(selectedModule.status === 'SUBMITTED' || selectedModule.status === 'UNDER_REVIEW') && (
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleReview(selectedModule.id, 'APPROVE')}
                                                    disabled={actionLoading}
                                                    className="flex-1 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest hover:bg-emerald-500/30 transition-all border border-emerald-500/20 disabled:opacity-50"
                                                >
                                                    {actionLoading ? '...' : '✓ Approve'}
                                                </button>
                                                <button
                                                    onClick={() => handleReview(selectedModule.id, 'REJECT')}
                                                    disabled={actionLoading}
                                                    className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500/30 transition-all border border-red-500/20 disabled:opacity-50"
                                                >
                                                    {actionLoading ? '...' : '✗ Reject'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <p className="text-sm">No response submitted yet</p>
                                </div>
                            )}

                            {/* Module Management */}
                            <div className="pt-4 border-t border-white/5 space-y-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Module Controls</h4>
                                {selectedModule.status !== 'APPROVED' && (
                                    <button
                                        onClick={() => handleManage('SKIP', selectedModule.id)}
                                        disabled={actionLoading}
                                        className="w-full py-2 rounded-lg bg-white/5 text-slate-400 text-xs font-medium hover:bg-white/10 transition-all border border-white/5"
                                    >
                                        Skip This Module
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-8 text-center">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-bold text-slate-400 mb-1">Select a Module</h3>
                            <p className="text-xs text-slate-400">Click on any module to view responses and take action.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminReportEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [content, setContent] = useState('');
    const [careerOptions, setCareerOptions] = useState<any[]>([]);
    const [notification, setNotification] = useState<{ type: string; msg: string } | null>(null);
    const [reportId, setReportId] = useState('');

    useEffect(() => {
        params.then(async p => {
            setReportId(p.id);
            try {
                // Fetch all clients and find the report
                const clientsRes = await fetch('/api/admin/clients');
                const clientsData = await clientsRes.json();
                for (const client of (clientsData.clients || [])) {
                    const detailRes = await fetch(`/api/admin/clients/${client.id}`);
                    const detailData = await detailRes.json();
                    const found = detailData.client?.reports?.find((r: any) => r.id === p.id);
                    if (found) {
                        setReport({ ...found, clientName: client.name, clientEmail: client.email });
                        setContent(found.content || '');
                        setCareerOptions(found.careerOptions || []);
                        break;
                    }
                }
            } catch (err) {
                console.error('Failed to load report', err);
            } finally {
                setLoading(false);
            }
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/reports/${reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    careerOptions: careerOptions.map(o => ({ title: o.title, reasoning: o.reasoning || '', match: o.match }))
                })
            });
            const data = await res.json();
            if (data.success) {
                setNotification({ type: 'success', msg: 'Report saved. Status: HUMAN_REVIVING' });
                setReport({ ...report, status: 'HUMAN_REVIVING' });
            } else {
                setNotification({ type: 'error', msg: data.error || 'Save failed' });
            }
        } catch (err) {
            setNotification({ type: 'error', msg: 'Network error' });
        } finally {
            setSaving(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleFinalize = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/reports/${reportId}/finalize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                setNotification({ type: 'success', msg: 'Report finalized and published' });
                setReport({ ...report, status: 'FINALIZED' });
            } else {
                setNotification({ type: 'error', msg: data.error || 'Finalize failed' });
            }
        } catch (err) {
            setNotification({ type: 'error', msg: 'Network error' });
        } finally {
            setSaving(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const updateOption = (index: number, field: string, value: any) => {
        const updated = [...careerOptions];
        updated[index] = { ...updated[index], [field]: value };
        setCareerOptions(updated);
    };

    const addOption = () => {
        setCareerOptions([...careerOptions, { title: '', reasoning: '', match: 80 }]);
    };

    const removeOption = (index: number) => {
        setCareerOptions(careerOptions.filter((_, i) => i !== index));
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!report) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-slate-500">Report not found</div>
            </div>
        );
    }

    const statusColor = (s: string) => {
        switch (s) {
            case 'FINALIZED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'HUMAN_REVIVING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default: return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
        }
    };

    return (
        <div className="p-8 space-y-8">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl border text-sm font-bold ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {notification.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                    <button onClick={() => router.push('/admin/reports')} className="text-xs font-bold text-slate-500 hover:text-orange-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2} /></svg>
                        Back to Reports
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight">Report Editor</h1>
                    <p className="text-slate-500 mt-1">{report.clientName} · {report.clientEmail}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${statusColor(report.status)}`}>
                        {report.status.replace('_', ' ')}
                    </span>
                    {report.status !== 'FINALIZED' && (
                        <>
                            <button onClick={handleSave} disabled={saving} className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button onClick={handleFinalize} disabled={saving} className="px-6 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-sm font-bold hover:bg-emerald-500/30 transition-all disabled:opacity-50">
                                {saving ? '...' : 'Finalize & Publish'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content Editor */}
            <div className="glass-card p-8 space-y-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Persona & Analysis</h2>
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-300 placeholder:text-slate-400 focus:outline-none focus:border-orange-500/30 resize-none leading-relaxed"
                    placeholder="AI-generated persona analysis text..."
                    disabled={report.status === 'FINALIZED'}
                />
            </div>

            {/* Career Options Editor */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Career Options</h2>
                    {report.status !== 'FINALIZED' && (
                        <button onClick={addOption} className="px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest hover:bg-orange-500/20 transition-all border border-orange-500/20">
                            + Add Option
                        </button>
                    )}
                </div>
                {careerOptions.map((opt, i) => (
                    <div key={i} className="glass-card p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="text-xs text-slate-400 font-bold">Option #{i + 1}</div>
                            {report.status !== 'FINALIZED' && (
                                <button onClick={() => removeOption(i)} className="text-red-500/50 hover:text-red-400 text-xs">Remove</button>
                            )}
                        </div>
                        <div className="grid md:grid-cols-[1fr_120px] gap-4">
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={opt.title}
                                    onChange={e => updateOption(i, 'title', e.target.value)}
                                    placeholder="Career title (e.g., AI Product Manager)"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-300 placeholder:text-slate-400 focus:outline-none focus:border-orange-500/30"
                                    disabled={report.status === 'FINALIZED'}
                                />
                                <textarea
                                    value={opt.reasoning || ''}
                                    onChange={e => updateOption(i, 'reasoning', e.target.value)}
                                    placeholder="Reasoning and rationale..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-300 placeholder:text-slate-400 focus:outline-none focus:border-orange-500/30 h-20 resize-none"
                                    disabled={report.status === 'FINALIZED'}
                                />
                            </div>
                            <div className="text-center">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Match %</div>
                                <input
                                    type="number"
                                    value={opt.match}
                                    onChange={e => updateOption(i, 'match', parseInt(e.target.value) || 0)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center text-2xl font-black text-indigo-400 focus:outline-none focus:border-orange-500/30"
                                    min={0}
                                    max={100}
                                    disabled={report.status === 'FINALIZED'}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

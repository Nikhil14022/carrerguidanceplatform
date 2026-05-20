"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MentorReportEditorPage({ params }: { params: Promise<{ id: string }> }) {
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
                const res = await fetch(`/api/mentor/reports/${p.id}`);
                const data = await res.json();

                if (data.success && data.report) {
                    setReport(data.report);
                    setContent(data.report.content || '');
                    setCareerOptions(data.report.careerOptions || []);
                } else if (data.report) {
                    // API might return { report: ... } without success flag
                    setReport(data.report);
                    setContent(data.report.content || '');
                    setCareerOptions(data.report.careerOptions || []);
                } else {
                    console.error('Report load failed', data.error);
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
            const res = await fetch(`/api/mentor/reports/${reportId}`, {
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
            const res = await fetch(`/api/mentor/reports/${reportId}`, {
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
            <div className="h-full flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!report) {
        return (
            <div className="h-full flex flex-col items-center justify-center py-20">
                <div className="text-slate-500 font-medium">Report not found or access denied</div>
                <button onClick={() => router.push('/mentor')} className="mt-6 px-6 py-2 text-sm text-indigo-600 font-bold border border-indigo-200 rounded-xl hover:bg-indigo-500/10 transition-colors">Back to Dashboard</button>
            </div>
        );
    }

    const statusColor = (s: string) => {
        switch (s) {
            case 'FINALIZED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-200';
            case 'HUMAN_REVIVING': return 'text-amber-700 bg-amber-50 border-amber-200';
            default: return 'text-indigo-400 bg-indigo-500/10 border-indigo-200';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto p-8 text-slate-100">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl border text-sm font-bold shadow-lg animate-in slide-in-from-top ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-200 text-emerald-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {notification.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <button onClick={() => router.push(`/mentor/clients/${report.clientProfileId}`)} className="text-xs font-bold text-slate-500 hover:text-indigo-600 mb-4 flex items-center gap-2 uppercase tracking-widest transition-colors w-fit">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Client
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100">Career Report Editor</h1>
                    <p className="text-slate-500 mt-1 font-medium">{report.clientName} · {report.clientEmail}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
                    <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${statusColor(report.status)}`}>
                        {report.status.replace('_', ' ')}
                    </span>
                    {report.status !== 'FINALIZED' && (
                        <>
                            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 shadow-sm text-sm font-bold text-slate-300 hover:bg-white/5 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                                {saving ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button onClick={handleFinalize} disabled={saving} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                                {saving ? '...' : 'Finalize & Publish'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm p-8 space-y-4">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Persona & Analysis</h2>
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full h-56 bg-white/5 border border-white/10 rounded-xl p-5 text-sm text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y leading-relaxed shadow-inner"
                    placeholder="AI-generated persona analysis text goes here..."
                    disabled={report.status === 'FINALIZED'}
                />
            </div>

            {/* Career Options Editor */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-100">Career Options</h2>
                    {report.status !== 'FINALIZED' && (
                        <button onClick={addOption} className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-600 text-xs font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors border border-indigo-100 flex items-center gap-2">
                            <span>+</span> Add Option
                        </button>
                    )}
                </div>
                <div className="space-y-4">
                    {careerOptions.map((opt, i) => (
                        <div key={i} className="bg-white/5 rounded-2xl border border-white/10 shadow-sm p-6 lg:p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-md">Option #{i + 1}</div>
                                {report.status !== 'FINALIZED' && (
                                    <button onClick={() => removeOption(i)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-red-50">
                                        Remove
                                    </button>
                                )}
                            </div>
                            <div className="grid md:grid-cols-[1fr_140px] gap-6 lg:gap-8">
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={opt.title}
                                        onChange={e => updateOption(i, 'title', e.target.value)}
                                        placeholder="Career title (e.g., AI Product Manager)"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm font-bold text-slate-100 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white/5 transition-colors"
                                        disabled={report.status === 'FINALIZED'}
                                    />
                                    <textarea
                                        value={opt.reasoning || ''}
                                        onChange={e => updateOption(i, 'reasoning', e.target.value)}
                                        placeholder="Provide reasoning and rationale for why this career is a good fit..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white/5 transition-colors h-32 resize-none"
                                        disabled={report.status === 'FINALIZED'}
                                    />
                                </div>
                                <div className="flex flex-col justify-center items-center bg-white/5 rounded-xl border border-white/10 p-4 relative overflow-hidden group">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 text-center">Match Suitability</div>
                                    <div className="relative flex items-center justify-center w-full">
                                        <input
                                            type="number"
                                            value={opt.match}
                                            onChange={e => updateOption(i, 'match', parseInt(e.target.value) || 0)}
                                            className="w-20 bg-transparent border-0 text-center text-5xl font-black text-indigo-600 focus:outline-none focus:ring-0 p-0"
                                            min={0}
                                            max={100}
                                            disabled={report.status === 'FINALIZED'}
                                        />
                                        <span className="text-2xl font-bold text-slate-400 -ml-1 mt-2">%</span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-200">
                                        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${opt.match}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {careerOptions.length === 0 && (
                        <div className="text-center p-12 bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-slate-300 font-bold text-sm mb-1">No Career Options</h3>
                            <p className="text-slate-500 text-xs">Add potential career paths to this report to guide the client.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

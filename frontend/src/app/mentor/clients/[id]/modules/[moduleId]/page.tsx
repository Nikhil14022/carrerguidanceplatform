"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface QuestionSchema {
    id: string;
    type: string;
    question: string;
    description?: string;
    placeholder?: string;
    options?: { id: string; text: string }[];
    columns?: string[];
    col1Label?: string;
    col2Label?: string;
    col3Label?: string;
    col4Label?: string;
    rows?: number;
    traits?: { trait: string; leftLabel: string; rightLabel: string }[];
    dependsOn?: { questionId: string; value: string };
    numRanks?: number;
}

interface ModuleData {
    id: string;
    moduleId: string;
    status: string;
    order: number;
    filledBy: string;
    mentorNotes?: string | null;
    module: { title: string; description: string; schema: { questions: QuestionSchema[] } };
    response: { data: Record<string, any>; submittedAt: string; approvedAt: string | null } | null;
}

export default function MentorModuleAnswersPage({ params }: { params: Promise<{ id: string; moduleId: string }> }) {
    const router = useRouter();
    const [mod, setMod] = useState<ModuleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [clientId, setClientId] = useState('');
    const [moduleId, setModuleId] = useState('');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: string; msg: string } | null>(null);

    useEffect(() => {
        params.then(p => {
            setClientId(p.id);
            setModuleId(p.moduleId);
            fetchModule(p.id, p.moduleId);
        });
    }, []);

    const fetchModule = async (cId: string, mId: string) => {
        try {
            const res = await fetch(`/api/mentor/clients/${cId}`);
            const data = await res.json();
            if (data.client) {
                const found = data.client.modules.find((m: any) => m.id === mId);
                setMod(found || null);
            }
        } catch (err) {
            console.error('Failed to fetch module', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (questionId: string, newValue: any) => {
        if (!mod) return;
        setSaving(true);
        try {
            const updatedData = { ...(mod.response?.data || {}), [questionId]: newValue };
            const res = await fetch(`/api/mentor/modules/${mod.id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'EDIT_RESPONSE', data: updatedData })
            });
            const result = await res.json();
            if (result.success) {
                setNotification({ type: 'success', msg: 'Answer saved successfully' });
                setEditingKey(null);
                await fetchModule(clientId, moduleId);
            } else {
                setNotification({ type: 'error', msg: result.error || 'Failed to save' });
            }
        } catch (err) {
            setNotification({ type: 'error', msg: 'Network error' });
        } finally {
            setSaving(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const isFileUrl = (val: any): boolean => {
        if (typeof val !== 'string') return false;
        return val.startsWith('/uploads/') || (val.startsWith('http') && val.includes('/uploads/'));
    };

    const renderAnswer = (question: QuestionSchema, value: any): React.ReactNode => {
        if (value === null || value === undefined || value === '')
            return <span className="text-slate-500 italic text-sm">Not answered</span>;

        // File URLs
        if (Array.isArray(value) && value.length > 0 && value.every((v: any) => isFileUrl(v))) {
            return (
                <div className="space-y-2">
                    {value.map((fileUrl: string, i: number) => {
                        const fileName = fileUrl.split('/').pop() || fileUrl;
                        const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(fileUrl);
                        return (
                            <div key={i} className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl overflow-hidden">
                                {isImage && (
                                    <a href={fileUrl} target="_blank" rel="noreferrer">
                                        <img src={fileUrl} alt={fileName} className="w-full max-h-60 object-contain bg-slate-950 p-2" />
                                    </a>
                                )}
                                <a href={fileUrl} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-3 p-3 text-indigo-300 text-sm hover:bg-indigo-500/20 transition-colors">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    <span className="truncate font-medium">{fileName}</span>
                                    <svg className="w-4 h-4 ml-auto flex-shrink-0 text-indigo-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Single file URL
        if (isFileUrl(value)) {
            const fileName = String(value).split('/').pop() || value;
            const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(value);
            return (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl overflow-hidden inline-block">
                    {isImage && <a href={value} target="_blank" rel="noreferrer"><img src={value} alt={fileName} className="max-h-48 object-contain bg-slate-950 p-2" /></a>}
                    <a href={value} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2.5 text-indigo-300 text-sm hover:bg-indigo-500/20 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        {fileName}
                    </a>
                </div>
            );
        }

        // Choice / multiselect — resolve option text
        if ((question.type === 'choice' || question.type === 'multiselect' || question.type === 'dropdown_multi' || question.type === 'choice_with_rating') && question.options) {
            if (Array.isArray(value)) {
                const resolved = value.map(v => question.options?.find(o => o.id === v)?.text || v);
                return (
                    <div className="flex flex-wrap gap-2">
                        {resolved.map((text: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-300 font-medium">{text}</span>
                        ))}
                    </div>
                );
            }
            const text = question.options.find(o => o.id === value)?.text || value;
            return <span className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-300 font-medium inline-block">{text}</span>;
        }

        // Rank type
        if (question.type === 'rank' && Array.isArray(value)) {
            return (
                <div className="space-y-1.5">
                    {value.map((optId: string, i: number) => {
                        const text = question.options?.find(o => o.id === optId)?.text || optId;
                        return (
                            <div key={i} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/5">
                                <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black flex-shrink-0">{i + 1}</span>
                                <span className="text-sm text-slate-300">{text}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Multiselect with rank
        if (question.type === 'multiselect_with_rank' && typeof value === 'object' && value.ranked) {
            return (
                <div className="space-y-1.5">
                    {value.ranked.map((optId: string, i: number) => {
                        const text = question.options?.find(o => o.id === optId)?.text || optId;
                        return (
                            <div key={i} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/5">
                                <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black flex-shrink-0">{i + 1}</span>
                                <span className="text-sm text-slate-300">{text}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Trait grid
        if (question.type === 'trait_grid' && Array.isArray(value)) {
            return (
                <div className="space-y-2">
                    {value.map((row: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex-1">
                                <span className="text-sm text-slate-300 font-medium">{row.trait}</span>
                                {row.leftLabel && row.rightLabel && (
                                    <div className="text-[10px] text-slate-500 mt-0.5">{row.leftLabel} ← → {row.rightLabel}</div>
                                )}
                            </div>
                            <span className={`text-xs font-bold px-3 py-1 rounded-lg ${row.rating >= 7 ? 'bg-emerald-500/20 text-emerald-400' : row.rating <= 3 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                {row.rating}/10
                            </span>
                        </div>
                    ))}
                </div>
            );
        }

        // Table data (array of arrays)
        if (question.type === 'table' && Array.isArray(value)) {
            const labels = [question.col1Label, question.col2Label, question.col3Label, question.col4Label].filter(Boolean);
            return (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        {labels.length > 0 && (
                            <thead>
                                <tr>
                                    {labels.map((label, i) => (
                                        <th key={i} className="text-left p-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/10">{label}</th>
                                    ))}
                                </tr>
                            </thead>
                        )}
                        <tbody>
                            {value.map((row: any[], i: number) => (
                                <tr key={i} className="border-b border-white/5">
                                    {(Array.isArray(row) ? row : [row]).map((cell, j) => (
                                        <td key={j} className="p-2 text-slate-300">{cell || '—'}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        // Schedule (object with AM/PM keys)
        if (question.type === 'schedule' && typeof value === 'object' && !Array.isArray(value)) {
            return (
                <div className="grid grid-cols-2 gap-1">
                    {Object.entries(value).map(([time, activity]) => (
                        <div key={time} className="flex gap-3 p-2 bg-white/5 rounded-lg text-sm">
                            <span className="text-indigo-400 font-bold w-20 flex-shrink-0">{time}</span>
                            <span className="text-slate-300">{String(activity) || '—'}</span>
                        </div>
                    ))}
                </div>
            );
        }

        // Education history
        if (question.type === 'education_history' && typeof value === 'object' && !Array.isArray(value)) {
            return (
                <div className="space-y-2">
                    {['school', 'college', 'university'].map(level => {
                        const d = value[level];
                        if (!d?.active) return null;
                        return (
                            <div key={level} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black uppercase flex-shrink-0">{level[0]}</span>
                                <div>
                                    <div className="text-sm text-slate-300 font-medium capitalize">{level}</div>
                                    <div className="text-xs text-slate-500">{d.name || 'N/A'} — Grade: {d.grade || 'N/A'}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // List type
        if (question.type === 'list' && Array.isArray(value)) {
            return (
                <div className="space-y-1">
                    {value.map((item: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg text-sm text-slate-300">
                            <span className="text-xs text-slate-500 font-bold w-5 text-center">{i + 1}.</span>
                            <span>{item}</span>
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
                        <span key={i} className="px-2.5 py-1 bg-white/5 rounded-lg text-sm text-slate-300 border border-white/5">{item}</span>
                    ))}
                </div>
            );
        }

        // Generic object fallback
        if (typeof value === 'object') {
            return <pre className="text-sm text-slate-300 whitespace-pre-wrap bg-white/5 p-3 rounded-xl overflow-x-auto border border-white/5">{JSON.stringify(value, null, 2)}</pre>;
        }

        // Plain text
        return <p className="text-sm text-slate-300 leading-relaxed">{String(value)}</p>;
    };

    const renderEditField = (question: QuestionSchema, value: any): React.ReactNode => {
        const isComplex = typeof value === 'object' && value !== null;

        // For choice questions, show options as selectable buttons
        if ((question.type === 'choice') && question.options) {
            return (
                <div className="flex flex-wrap gap-2">
                    {question.options.map(opt => (
                        <button key={opt.id} onClick={() => setEditValue([opt.id])}
                            className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                                (Array.isArray(editValue) ? editValue.includes(opt.id) : editValue === opt.id)
                                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                        >{opt.text}</button>
                    ))}
                </div>
            );
        }

        // For multiselect, show toggleable options
        if ((question.type === 'multiselect' || question.type === 'dropdown_multi') && question.options) {
            const selected = Array.isArray(editValue) ? editValue : [];
            return (
                <div className="flex flex-wrap gap-2">
                    {question.options.map(opt => (
                        <button key={opt.id} onClick={() => {
                            setEditValue(selected.includes(opt.id)
                                ? selected.filter((v: string) => v !== opt.id)
                                : [...selected, opt.id]
                            );
                        }}
                            className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                                selected.includes(opt.id)
                                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                        >{opt.text}</button>
                    ))}
                </div>
            );
        }

        // For all other types, use textarea with JSON for complex values
        return (
            <textarea
                value={isComplex ? JSON.stringify(editValue, null, 2) : (editValue ?? '')}
                onChange={(e) => {
                    if (isComplex) {
                        try { setEditValue(JSON.parse(e.target.value)); } catch { setEditValue(e.target.value); }
                    } else {
                        setEditValue(e.target.value);
                    }
                }}
                rows={isComplex ? 6 : 3}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 resize-none"
                placeholder="Enter answer..."
            />
        );
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!mod) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-slate-500">Module not found</div>
            </div>
        );
    }

    const questions = mod.module.schema?.questions || [];
    const answers = mod.response?.data || {};

    // Determine visible questions (skip dependsOn questions whose condition is not met)
    const visibleQuestions = questions.filter((q: QuestionSchema) => {
        if (!q.dependsOn) return true;
        const depAnswer = answers[q.dependsOn.questionId];
        if (Array.isArray(depAnswer)) return depAnswer.includes(q.dependsOn.value);
        return depAnswer === q.dependsOn.value;
    });

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-fade-in text-slate-100">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl border text-sm font-bold shadow-lg ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {notification.msg}
                </div>
            )}

            {/* Header */}
            <div>
                <button onClick={() => router.push(`/mentor/clients/${clientId}`)}
                    className="text-xs font-bold text-slate-500 hover:text-indigo-400 mb-6 flex items-center gap-2 uppercase tracking-widest transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2} /></svg>
                    Back to Client
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{mod.module.title}</h1>
                        <p className="text-slate-500 mt-1 text-sm">{mod.module.description}</p>
                    </div>
                    <div className="flex gap-2 items-center flex-shrink-0">
                        <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${
                            mod.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            mod.status === 'SUBMITTED' || mod.status === 'UNDER_REVIEW' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>{mod.status.replace('_', ' ')}</span>
                        {mod.response?.submittedAt && (
                            <span className="text-[10px] text-slate-500">Submitted {new Date(mod.response.submittedAt).toLocaleDateString()}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Questions & Answers */}
            <div className="space-y-6">
                {visibleQuestions.map((q: QuestionSchema, idx: number) => {
                    const value = answers[q.id];
                    const isEditingThis = editingKey === q.id;

                    return (
                        <div key={q.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                            {/* Question Header */}
                            <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-slate-500">Q{idx + 1}</span>
                                            <h3 className="text-sm font-semibold text-slate-200 leading-relaxed">{q.question}</h3>
                                        </div>
                                        {q.description && (
                                            <p className="text-xs text-slate-500 mt-1 ml-8">{q.description}</p>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg flex-shrink-0">{q.type}</span>
                                </div>
                            </div>

                            {/* Answer Area */}
                            <div className="px-6 py-4">
                                {isEditingThis ? (
                                    <div className="space-y-3">
                                        {renderEditField(q, value)}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSave(q.id, editValue)}
                                                disabled={saving}
                                                className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50"
                                            >
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={() => { setEditingKey(null); setEditValue(null); }}
                                                className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            {renderAnswer(q, value)}
                                        </div>
                                        <button
                                            onClick={() => { setEditingKey(q.id); setEditValue(value); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 uppercase tracking-widest transition-all flex-shrink-0 border border-transparent hover:border-indigo-500/20"
                                            title="Edit this answer"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mentor Notes Section */}
            {mod.mentorNotes && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Mentor Notes</h3>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{mod.mentorNotes}</p>
                </div>
            )}
        </div>
    );
}

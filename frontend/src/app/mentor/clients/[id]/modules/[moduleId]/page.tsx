"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TestAnswersRenderer from "@/components/TestAnswersRenderer";
import InteractiveObjectEditor from "@/components/InteractiveObjectEditor";

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
    col1Placeholder?: string;
    col2Placeholder?: string;
    col3Placeholder?: string;
    col4Placeholder?: string;
    col2Options?: string[];
    col3Options?: string[];
    col4Options?: string[];
    prefilledRows?: any[];
    rows?: number;
    traits?: { trait: string; leftLabel: string; rightLabel: string }[];
    dependsOn?: { questionId: string; value: string };
    numRanks?: number;
    allowFileUpload?: boolean;
    useTextarea?: boolean;
    showcaseRankOrder?: boolean;
    hasOpenText?: boolean;
}

interface ModuleData {
    id: string;
    moduleId: string;
    status: string;
    order: number;
    filledBy: string;
    mentorNotes?: string | null;
    module: { title: string; description: string; schema: { questions: QuestionSchema[]; testType?: string } };
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
    const [editNotesValue, setEditNotesValue] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: string; msg: string } | null>(null);
    const [notesEditing, setNotesEditing] = useState(false);
    const [notesValue, setNotesValue] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mod) {
            setNotesValue(mod.mentorNotes || '');
        }
    }, [mod]);

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

    const handleSave = async (questionId: string, newValue: any, openTextValue?: string) => {
        if (!mod) return;
        setSaving(true);
        try {
            const updatedData = { ...(mod.response?.data || {}), [questionId]: newValue };
            if (openTextValue !== undefined) {
                updatedData[`${questionId}_open_text`] = openTextValue;
            }
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

    const handleSaveNotes = async () => {
        if (!mod) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/mentor/modules/${mod.id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'SAVE_NOTES', notes: notesValue })
            });
            const result = await res.json();
            if (result.success) {
                setNotification({ type: 'success', msg: 'Notes saved successfully' });
                setNotesEditing(false);
                await fetchModule(clientId, moduleId);
            } else {
                setNotification({ type: 'error', msg: result.error || 'Failed to save notes' });
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
        return val.startsWith('/uploads/') || val.startsWith('/api/upload/') || (val.startsWith('http') && (val.includes('/uploads/') || val.includes('/api/upload/')));
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

        // Table data (array of arrays or array of objects)
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
                            {value.map((row: any, i: number) => {
                                const cells = Array.isArray(row)
                                    ? row
                                    : [row?.col1, row?.col2, row?.col3, row?.col4].filter(c => c !== undefined);
                                return (
                                    <tr key={i} className="border-b border-white/5">
                                        {cells.map((cell, j) => (
                                            <td key={j} className="p-2 text-slate-300">{String(cell || '') || '—'}</td>
                                        ))}
                                    </tr>
                                );
                            })}
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
        if (value && typeof value === 'object') {
            const entries = Object.entries(value);
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {entries.map(([k, v]) => (
                        <div key={k} className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">{k.replace(/_/g, ' ')}</span>
                            <span className="text-sm text-slate-200 font-medium block">{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}</span>
                        </div>
                    ))}
                </div>
            );
        }

        // Plain text
        return <p className="text-sm text-slate-300 leading-relaxed">{String(value)}</p>;
    };

    const renderEditField = (question: QuestionSchema, value: any): React.ReactNode => {
        const isComplex = typeof value === 'object' && value !== null;

        // For choice questions, show options as selectable buttons
        if ((question.type === 'choice') && question.options) {
            return (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {question.options.map(opt => {
                            const isSelected = Array.isArray(editValue) ? editValue.includes(opt.id) : editValue === opt.id;
                            return (
                                <button key={opt.id} onClick={() => setEditValue(opt.id)}
                                    className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                                        isSelected
                                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                    }`}
                                >{opt.text}</button>
                            );
                        })}
                    </div>
                    <div className="space-y-1 mt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-medium">Notes / Comments</span>
                        <textarea
                            value={editNotesValue}
                            onChange={(e) => setEditNotesValue(e.target.value)}
                            rows={2}
                            placeholder="Add notes..."
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-slate-350 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>
            );
        }

        // For multiselect, show toggleable options
        if ((question.type === 'multiselect' || question.type === 'dropdown_multi') && question.options) {
            const selected = Array.isArray(editValue) ? editValue : [];
            return (
                <div className="space-y-3">
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
                    <div className="space-y-1 mt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-medium">Notes / Comments</span>
                        <textarea
                            value={editNotesValue}
                            onChange={(e) => setEditNotesValue(e.target.value)}
                            rows={2}
                            placeholder="Add notes..."
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-slate-355 focus:outline-none"
                        />
                    </div>
                </div>
            );
        }

        if (question.type === 'scale') {
            return (
                <select
                    value={Number(editValue) || 5}
                    onChange={e => setEditValue(Number(e.target.value))}
                    className="bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-slate-350 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
                >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num}</option>
                    ))}
                </select>
            );
        }

        if (question.type === 'table') {
            const numCols = question.col4Label ? 4 : (question.col3Label ? 3 : (question.col2Label ? 2 : 1));
            const colSpanClass = numCols === 4 ? 'grid-cols-4' : (numCols === 3 ? 'grid-cols-3' : (numCols === 2 ? 'grid-cols-2' : 'grid-cols-1'));
            const tableRows = Array.isArray(editValue) ? editValue : [];
            return (
                <div className="space-y-4 bg-slate-950 p-4 border border-white/10 rounded-xl">
                    {/* Headers */}
                    <div className={`grid ${colSpanClass} gap-3 border-b border-white/10 pb-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest`}>
                        <div>{question.col1Label || 'Item'}</div>
                        {numCols >= 2 && <div>{question.col2Label || 'Details'}</div>}
                        {numCols >= 3 && <div>{question.col3Label}</div>}
                        {numCols >= 4 && <div>{question.col4Label}</div>}
                    </div>

                    {/* Rows */}
                    <div className="space-y-2">
                        {tableRows.map((row: any, rIdx: number) => {
                            const handleCellChange = (colKey: string, cellVal: any) => {
                                const next = [...tableRows];
                                next[rIdx] = { ...next[rIdx], [colKey]: cellVal };
                                setEditValue(next);
                            };

                            return (
                                <div key={rIdx} className={`grid ${colSpanClass} gap-2 items-center`}>
                                    {/* Col 1 */}
                                    <input 
                                        type="text"
                                        value={row.col1 ?? ''}
                                        disabled={Array.isArray(question.prefilledRows) && rIdx < question.prefilledRows.length}
                                        placeholder={question.col1Placeholder || '...'}
                                        onChange={e => handleCellChange('col1', e.target.value)}
                                        className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                                    />

                                    {/* Col 2 */}
                                    {numCols >= 2 && (
                                        question.col2Options ? (
                                            <select
                                                value={row.col2 ?? ''}
                                                onChange={e => handleCellChange('col2', e.target.value)}
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                                            >
                                                <option value="">Select...</option>
                                                {question.col2Options.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input 
                                                type="text"
                                                value={row.col2 ?? ''}
                                                placeholder={question.col2Placeholder || '...'}
                                                onChange={e => handleCellChange('col2', e.target.value)}
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                                            />
                                        )
                                    )}

                                    {/* Col 3 */}
                                    {numCols >= 3 && (
                                        question.col3Options ? (
                                            <select
                                                value={row.col3 ?? ''}
                                                onChange={e => handleCellChange('col3', e.target.value)}
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                                            >
                                                <option value="">Select...</option>
                                                {question.col3Options.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input 
                                                type="text"
                                                value={row.col3 ?? ''}
                                                placeholder={question.col3Placeholder || '...'}
                                                onChange={e => handleCellChange('col3', e.target.value)}
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                                            />
                                        )
                                    )}

                                    {/* Col 4 */}
                                    {numCols >= 4 && (
                                        question.col4Options ? (
                                            <select
                                                value={row.col4 ?? ''}
                                                onChange={e => handleCellChange('col4', e.target.value)}
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                                            >
                                                <option value="">Select...</option>
                                                {question.col4Options.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input 
                                                type="text"
                                                value={row.col4 ?? ''}
                                                placeholder={question.col4Placeholder || '...'}
                                                onChange={e => handleCellChange('col4', e.target.value)}
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                                            />
                                        )
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Add Row Button */}
                    {(!question.prefilledRows || question.prefilledRows.length === 0) && (
                        <button
                            type="button"
                            onClick={() => setEditValue([...tableRows, { col1: '', col2: '', col3: '', col4: '' }])}
                            className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-[9px] font-bold text-slate-350 transition-all uppercase tracking-wider"
                        >
                            + Add Row
                        </button>
                    )}
                </div>
            );
        }

        if (question.type === 'schedule') {
            if (Array.isArray(editValue)) {
                return (
                    <div className="space-y-4 bg-slate-950 p-4 border border-white/10 rounded-xl">
                        {editValue.map((sched: any, sIdx: number) => (
                            <div key={sIdx} className="space-y-3 border-b border-white/10 pb-4 last:border-0">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Days: {Array.isArray(sched.days) ? sched.days.join(', ') : 'All Days'}
                                </div>
                                <div className="space-y-2">
                                    {(sched.slots || []).map((slot: any, slotIdx: number) => {
                                        const handleSlotChange = (field: 'time' | 'activity', val: string) => {
                                            const nextVal = [...editValue];
                                            const nextSlots = [...nextVal[sIdx].slots];
                                            nextSlots[slotIdx] = { ...nextSlots[slotIdx], [field]: val };
                                            nextVal[sIdx] = { ...nextVal[sIdx], slots: nextSlots };
                                            setEditValue(nextVal);
                                        };
                                        
                                        const handleRemoveSlot = () => {
                                            const nextVal = [...editValue];
                                            nextVal[sIdx] = {
                                                ...nextVal[sIdx],
                                                slots: nextVal[sIdx].slots.filter((_: any, idx: number) => idx !== slotIdx)
                                            };
                                            setEditValue(nextVal);
                                        };

                                        return (
                                            <div key={slotIdx} className="flex gap-3 items-center">
                                                <input 
                                                    type="text"
                                                    value={slot.time ?? ''}
                                                    placeholder="Time"
                                                    onChange={e => handleSlotChange('time', e.target.value)}
                                                    className="w-36 bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                                />
                                                <input 
                                                    type="text"
                                                    value={slot.activity ?? ''}
                                                    placeholder="Activity"
                                                    onChange={e => handleSlotChange('activity', e.target.value)}
                                                    className="flex-1 bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveSlot}
                                                    className="text-xs text-red-500 hover:text-red-400 font-bold px-1"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextVal = [...editValue];
                                        nextVal[sIdx] = {
                                            ...nextVal[sIdx],
                                            slots: [...(nextVal[sIdx].slots || []), { time: '', activity: '' }]
                                        };
                                        setEditValue(nextVal);
                                    }}
                                    className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-355 transition-all uppercase tracking-wider"
                                >
                                    + Add Slot
                                </button>
                            </div>
                        ))}
                    </div>
                );
            } else {
                const obj = typeof editValue === 'object' && editValue !== null ? editValue : {};
                const entries = Object.entries(obj);
                
                return (
                    <div className="space-y-4 bg-slate-950 p-4 border border-white/10 rounded-xl">
                        <div className="space-y-3">
                            {entries.map(([time, activity], rIdx) => {
                                const handleKeyChange = (newTime: string) => {
                                    const nextVal = { ...obj };
                                    delete nextVal[time];
                                    nextVal[newTime] = activity;
                                    setEditValue(nextVal);
                                };
                                
                                const handleValChange = (newActivity: string) => {
                                    const nextVal = { ...obj, [time]: newActivity };
                                    setEditValue(nextVal);
                                };
                                
                                const handleRemoveRow = () => {
                                    const nextVal = { ...obj };
                                    delete nextVal[time];
                                    setEditValue(nextVal);
                                };

                                return (
                                    <div key={rIdx} className="flex gap-3 items-center">
                                        <input 
                                            type="text"
                                            value={time}
                                            placeholder="Time"
                                            onChange={e => handleKeyChange(e.target.value)}
                                            className="w-36 bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                        />
                                        <input 
                                            type="text"
                                            value={String(activity)}
                                            placeholder="Activity"
                                            onChange={e => handleValChange(e.target.value)}
                                            className="flex-1 bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveRow}
                                            className="text-xs text-red-500 hover:text-red-400 font-bold px-1"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            type="button"
                            onClick={() => setEditValue({ ...obj, "": "" })}
                            className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-350 transition-all uppercase tracking-wider"
                        >
                            + Add Slot
                        </button>
                    </div>
                );
            }
        }

        return (
            <InteractiveObjectEditor
                value={editValue}
                onChange={setEditValue}
                accentColor="indigo"
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
                            <span className="text-[10px] text-slate-500">Submitted {mounted ? new Date(mod.response.submittedAt).toLocaleDateString() : ""}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Questions & Answers */}
            <div className="space-y-6">
                {mod.module.schema?.testType ?
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                        <TestAnswersRenderer testType={mod.module.schema.testType} answers={answers} />
                    </div>
                :
                    visibleQuestions.map((q: QuestionSchema, idx: number) => {
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
                                                onClick={() => handleSave(q.id, editValue, (q.type === 'choice' || q.type === 'multiselect') ? editNotesValue : undefined)}
                                                disabled={saving}
                                                className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50"
                                            >
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={() => { setEditingKey(null); setEditValue(null); setEditNotesValue(''); }}
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
                                             {q.allowFileUpload && answers[`${q.id}_files`] && (
                                                 <div className="mt-4 border-t border-white/5 pt-4">
                                                     <p className="text-xs font-bold text-slate-500 mb-2">Uploaded Playlist Image / Files:</p>
                                                     {renderAnswer({ ...q, type: 'file' }, answers[`${q.id}_files`])}
                                                 </div>
                                             )}
                                         </div>
                                        <button
                                            onClick={() => { setEditingKey(q.id); setEditValue(value); setEditNotesValue(answers[`${q.id}_open_text`] || ''); }}
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
                })
            }
            </div>

            {/* Mentor Notes Section */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Mentor Session Notes</h3>
                    </div>
                    {!notesEditing && (
                        <button 
                            onClick={() => setNotesEditing(true)}
                            className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-[#121212] text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer"
                        >
                            {mod.mentorNotes ? 'Edit Notes' : 'Add Notes'}
                        </button>
                    )}
                </div>
                
                {notesEditing ? (
                    <div className="space-y-4">
                        <textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            rows={6}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
                            placeholder="Type guidelines, action items, or remarks for this client meeting session..."
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={handleSaveNotes}
                                disabled={saving}
                                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 cursor-pointer"
                            >
                                {saving ? 'Saving...' : 'Save Notes'}
                            </button>
                            <button
                                onClick={() => {
                                    setNotesEditing(false);
                                    setNotesValue(mod.mentorNotes || '');
                                }}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold uppercase tracking-widest rounded-xl border border-white/10 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 rounded-xl p-4 border border-white/5">
                        {mod.mentorNotes ? (
                            <p className="whitespace-pre-wrap">{mod.mentorNotes}</p>
                        ) : (
                            <span className="text-slate-550 italic">No mentor session notes added yet. Click &quot;Add Notes&quot; to write guidelines for the live session.</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

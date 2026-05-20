"use client";
import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function EditModulePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [module, setModule] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<any[]>([]);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    useEffect(() => {
        const fetchModule = async () => {
            try {
                const res = await fetch(`/api/admin/modules/${id}`);
                const data = await res.json();
                if (data.module) {
                    setModule(data.module);
                    setTitle(data.module.title || '');
                    setDescription(data.module.description || '');
                    setQuestions(data.module.schema?.questions || []);
                }
            } catch (err) {
                console.error(err);
                setNotification({ type: 'error', msg: 'Failed to load module' });
            } finally {
                setLoading(false);
            }
        };
        fetchModule();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedSchema = { ...module?.schema, questions };
            const res = await fetch(`/api/admin/modules/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    schema: updatedSchema
                })
            });
            const data = await res.json();
            if (data.success) {
                setNotification({ type: 'success', msg: 'Module saved successfully' });
            } else {
                setNotification({ type: 'error', msg: data.error || 'Failed to save module' });
            }
        } catch (err) {
            console.error(err);
            setNotification({ type: 'error', msg: 'Network error saving module' });
        } finally {
            setSaving(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const addQuestion = () => {
        setQuestions([...questions, {
            id: `q${Date.now()}`,
            type: 'text',
            question: 'New Question?',
            description: ''
        }]);
    };

    const removeQuestion = (index: number) => {
        const newQ = [...questions];
        newQ.splice(index, 1);
        setQuestions(newQ);
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const newQ = [...questions];
        newQ[index] = { ...newQ[index], [field]: value };
        
        // Setup defaults when switching types
        if (field === 'type') {
            if (value === 'scale' && !newQ[index].min) {
                newQ[index].min = 1;
                newQ[index].max = 10;
            } else if (value === 'choice' && !newQ[index].options) {
                newQ[index].options = [{ id: 'A', text: 'Option A' }];
            }
        }
        
        setQuestions(newQ);
    };

    const moveQuestion = (index: number, dir: number) => {
        if (index + dir < 0 || index + dir >= questions.length) return;
        const newQ = [...questions];
        [newQ[index], newQ[index + dir]] = [newQ[index + dir], newQ[index]];
        setQuestions(newQ);
    };

    const addOption = (qIndex: number) => {
        const newQ = [...questions];
        const opts = newQ[qIndex].options || [];
        const nextLetter = String.fromCharCode(65 + opts.length); // A, B, C...
        opts.push({ id: nextLetter, text: `Option ${nextLetter}` });
        newQ[qIndex].options = opts;
        setQuestions(newQ);
    };

    const updateOption = (qIndex: number, oIndex: number, text: string) => {
        const newQ = [...questions];
        newQ[qIndex].options[oIndex].text = text;
        setQuestions(newQ);
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const newQ = [...questions];
        newQ[qIndex].options.splice(oIndex, 1);
        setQuestions(newQ);
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
            {notification && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl border text-sm font-bold animate-in slide-in-from-top shadow-xl ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {notification.msg}
                </div>
            )}

            <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                <button onClick={() => router.push('/admin/modules')} className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Module Builder</h1>
                    <p className="text-slate-500 mt-1">Configure questions and options</p>
                </div>
                <div className="ml-auto">
                    <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-2 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        {saving && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Module Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
            </div>

            {module?.schema?.testType ? (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-indigo-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-indigo-100">Specialized Test Module</h2>
                        <p className="text-indigo-200/70 mt-2 max-w-lg mx-auto">
                            This is a specialized assessment test using the <strong>{module.schema.testType}</strong> format. The questions and interactive components are handled natively by the assessment engine and cannot be edited via the standard question builder.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Questions ({questions.length})</h2>
                        <button onClick={addQuestion} className="px-4 py-2 bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Add Question
                        </button>
                    </div>

                    <div className="space-y-6">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 relative group">
                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                    <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} className="p-1 bg-slate-800 border border-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-30"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                                    <button onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1} className="p-1 bg-slate-800 border border-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-30"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                                </div>

                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-4">
                                        <div className="grid md:grid-cols-[150px_1fr] gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</label>
                                                <select 
                                                    value={q.type} 
                                                    onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                                >
                                                    <option value="text">Short Text</option>
                                                    <option value="textarea">Long Text / Textarea</option>
                                                    <option value="choice">Multiple Choice (MCQ)</option>
                                                    <option value="scale">Rating Scale</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Question Text</label>
                                                <input 
                                                    type="text" 
                                                    value={q.question} 
                                                    onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"
                                                    placeholder="Enter question text here"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Helper Description (Optional)</label>
                                            <input 
                                                type="text" 
                                                value={q.description || ''} 
                                                onChange={(e) => updateQuestion(idx, 'description', e.target.value)}
                                                className="w-full bg-slate-950/50 border border-slate-800/50 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                                                placeholder="Exta context for the user..."
                                            />
                                        </div>

                                        {/* Type Specific Fields */}
                                        {q.type === 'scale' && (
                                            <div className="flex gap-4 p-4 bg-slate-800/20 rounded-lg border border-slate-800">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Min Value</label>
                                                    <input type="number" value={q.min || 1} onChange={e => updateQuestion(idx, 'min', parseInt(e.target.value))} className="w-24 bg-slate-950 border border-slate-700 rounded p-2 text-sm" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Value</label>
                                                    <input type="number" value={q.max || 10} onChange={e => updateQuestion(idx, 'max', parseInt(e.target.value))} className="w-24 bg-slate-950 border border-slate-700 rounded p-2 text-sm" />
                                                </div>
                                            </div>
                                        )}

                                        {q.type === 'choice' && (
                                            <div className="space-y-3 p-4 bg-slate-800/20 rounded-lg border border-slate-800">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MCQ Options</label>
                                                    <button onClick={() => addOption(idx)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest">+ Add Option</button>
                                                </div>
                                                <div className="space-y-2">
                                                    {(q.options || []).map((opt: any, oIdx: number) => (
                                                        <div key={oIdx} className="flex gap-2 items-center">
                                                            <div className="w-8 h-8 rounded border border-slate-700 bg-slate-950 flex items-center justify-center text-xs font-bold text-slate-500">{opt.id}</div>
                                                            <input 
                                                                type="text" 
                                                                value={opt.text} 
                                                                onChange={e => updateOption(idx, oIdx, e.target.value)}
                                                                className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
                                                            />
                                                            <button onClick={() => removeOption(idx, oIdx)} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button onClick={() => removeQuestion(idx)} className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 hover:border-red-500/30 transition-all shrink-0">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        {questions.length === 0 && (
                            <div className="text-center p-12 border border-slate-800 border-dashed rounded-xl bg-slate-900/50">
                                <p className="text-slate-500 mb-4">This module currently has no questions.</p>
                                <button onClick={addQuestion} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-indigo-400 text-xs font-bold uppercase tracking-widest transition-colors">Add First Question</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';

// Lazy-load specialized test components
const PersonalityFactorsTest = lazy(() => import('./test-modules/PersonalityFactorsTest'));
const ValuesTest = lazy(() => import('./test-modules/ValuesTest'));
const RIASECTest = lazy(() => import('./test-modules/RIASECTest'));
const ColorTest = lazy(() => import('./test-modules/ColorTest'));
const SubjectMatterTest = lazy(() => import('./test-modules/SubjectMatterTest'));
const ParentsMeetingForm = lazy(() => import('./test-modules/ParentsMeetingForm'));
const SelfDiscoveryTest = lazy(() => import('./test-modules/SelfDiscoveryTest'));

const TEST_TYPE_COMPONENTS: Record<string, React.ComponentType<any>> = {
    '16PF': PersonalityFactorsTest,
    'VALUES': ValuesTest,
    'RIASEC': RIASECTest,
    'COLOR': ColorTest,
    'SMI': SubjectMatterTest,
    'PARENTS_MEETING': ParentsMeetingForm,
    'SELF_DISCOVERY': SelfDiscoveryTest,
};

export default function ModuleEngine({ moduleId }: { moduleId: string }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, originalSetAnswers] = useState<Record<string, any>>({});
    const [module, setModule] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const isReadOnly = module ? ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(module.status) : false;

    const setAnswers = (val: any) => {
        if (isReadOnly) return;
        originalSetAnswers(val);
    };

    // Comments Panel State
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        setComments([...comments, {
            id: Date.now().toString(),
            author: 'You',
            role: 'CLIENT',
            content: newComment,
            createdAt: new Date().toISOString()
        }]);
        setNewComment('');
    };

    const router = useRouter();
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isSavingRef = useRef(false);

    useEffect(() => {
        fetchModule();
    }, [moduleId]);

    const fetchModule = async () => {
        try {
            const res = await fetch(`/api/client/modules/${moduleId}`);
            if (!res.ok) throw new Error('Failed to load module');
            const data = await res.json();
            if (data.module) setModule(data.module);
            if (data.response?.data) originalSetAnswers(data.response.data);

            // Inject Mentor Notes as a comment if they exist
            if (data.module?.mentorNotes) {
                setComments([
                    { id: 'mentor-note', author: 'Mentor', role: 'EXPERT', content: data.module.mentorNotes, createdAt: data.response?.approvedAt || new Date().toISOString() }
                ]);
            } else {
                setComments([]);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-save logic Debounce
    useEffect(() => {
        if (loading || !module || isReadOnly) return;

        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

        autoSaveTimerRef.current = setTimeout(() => {
            handleSave(false);
        }, 3000); // Autosave 3 seconds after last change

        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [answers, currentStep, isReadOnly]);

    const handleSave = async (isFinal = false) => {
        if (isReadOnly || isSavingRef.current) {
            if (isReadOnly && isFinal) {
                router.push('/dashboard');
            }
            return;
        }
        isSavingRef.current = true;
        setIsSaving(true);
        try {
            const endpoint = isFinal ? `/api/client/modules/${moduleId}/submit` : `/api/client/modules/${moduleId}/save`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: answers }),
            });
            if (!res.ok) throw new Error('Failed to save progress');
            if (isFinal) router.push('/dashboard?status=submitted');
        } catch (err: any) {
            console.error('Save error:', err);
        } finally {
            isSavingRef.current = false;
            setIsSaving(false);
        }
    };

    const getNextStep = (step: number) => {
        let next = step + 1;
        while (next < (module?.schema?.questions?.length || 0)) {
            const q = module.schema.questions[next];
            if (!q.dependsOn) return next;
            const depValue = answers[q.dependsOn.questionId || q.dependsOn.id];
            const isMatch = Array.isArray(depValue) 
                ? depValue.includes(q.dependsOn.value)
                : depValue === q.dependsOn.value;
            if (isMatch) return next;
            next++;
        }
        return next;
    };

    const getPrevStep = (step: number) => {
        let prev = step - 1;
        while (prev >= 0) {
            const q = module.schema.questions[prev];
            if (!q.dependsOn) return prev;
            const depValue = answers[q.dependsOn.questionId || q.dependsOn.id];
            const isMatch = Array.isArray(depValue) 
                ? depValue.includes(q.dependsOn.value)
                : depValue === q.dependsOn.value;
            if (isMatch) return prev;
            prev--;
        }
        return prev;
    };

    const handleNext = () => {
        const next = getNextStep(currentStep);
        if (next < (module?.schema?.questions?.length || 0)) {
            setCurrentStep(next);
        } else {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
            }
            handleSave(true);
        }
    };

    const handleBack = () => {
        const prev = getPrevStep(currentStep);
        if (prev >= 0) setCurrentStep(prev);
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    );

    if (error || !module) return <div className="p-20 text-red-500">{error || 'Module not found'}</div>;

    const questions = module.schema?.questions || [];
    const q = questions[currentStep];
    const progress = questions.length > 0 ? ((currentStep) / questions.length) * 100 : 0;

    // ── Specialized Test Module Rendering ──
    const testType = module.schema?.testType;
    const TestComponent = testType ? TEST_TYPE_COMPONENTS[testType] : null;

    if (TestComponent) {
        return (
            <div className="relative">
                {/* Autosave Indicator */}
                <div className="absolute top-0 right-10 flex items-center gap-2 text-xs font-bold text-slate-400">
                    {isReadOnly ? (
                        <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">Read-Only</span>
                    ) : isSaving ? (
                        <>
                            <div className="w-3 h-3 border-2 border-slate-400/20 border-t-slate-400 rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Saved
                        </>
                    )}
                </div>

                <div className="max-w-4xl mx-auto py-10">
                    {isReadOnly && (
                        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-6 py-4 rounded-xl flex items-center gap-3 mb-6">
                            <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <div>
                                <p className="font-bold text-sm">Read-Only Mode</p>
                                <p className="text-xs text-indigo-400/80 mt-0.5">This module has already been submitted and is locked for editing.</p>
                            </div>
                        </div>
                    )}

                    <div className="mb-6">
                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Assessment Test</div>
                        <h1 className="text-2xl font-bold">{module.title}</h1>
                        {module.description && <p className="text-slate-400 mt-1 text-sm">{module.description}</p>}
                    </div>

                    <Suspense fallback={
                        <div className="flex items-center justify-center p-20">
                            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                    }>
                        <TestComponent
                            answers={answers}
                            setAnswers={setAnswers}
                            onSubmit={() => {
                                if (autoSaveTimerRef.current) {
                                    clearTimeout(autoSaveTimerRef.current);
                                    autoSaveTimerRef.current = null;
                                }
                                handleSave(true);
                            }}
                            readOnly={isReadOnly}
                        />
                    </Suspense>
                </div>
            </div>
        );
    }

    // ── Generic Module Rendering (existing logic) ──

    return (
        <div className="relative">
            {/* Autosave Indicator */}
            <div className="absolute top-0 right-10 flex items-center gap-2 text-xs font-bold text-slate-400">
                {isReadOnly ? (
                    <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">Read-Only</span>
                ) : isSaving ? (
                    <>
                        <div className="w-3 h-3 border-2 border-slate-400/20 border-t-slate-400 rounded-full animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Saved
                    </>
                )}
            </div>

            <div className="max-w-3xl mx-auto space-y-8 py-10">
                {isReadOnly && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-6 py-4 rounded-xl flex items-center gap-3">
                        <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <div>
                            <p className="font-bold text-sm">Read-Only Mode</p>
                            <p className="text-xs text-indigo-400/80 mt-0.5">This module has already been submitted and is locked for editing.</p>
                        </div>
                    </div>
                )}
                {/* Progress Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Module Assessment</div>
                            <h1 className="text-2xl font-bold">{module.title}</h1>
                        </div>
                        <div className="text-sm font-bold text-slate-500">{currentStep + 1} of {questions.length}</div>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 min-h-[400px] flex flex-col relative shadow-xl">
                    <div className="flex-1 space-y-8 mt-4 md:mt-0">
                        <div className="space-y-3 pr-16 md:pr-40">
                            <h2 className="text-2xl md:text-3xl font-bold leading-tight">{q?.question}</h2>
                            {q?.description && (
                                <div 
                                    className="text-slate-400 text-sm leading-relaxed" 
                                    dangerouslySetInnerHTML={{ __html: q.description }} 
                                />
                            )}
                        </div>

                        <div className="py-6">
                            {/* Question Inputs */}
                            {(q?.type === 'text' || q?.type === 'textarea') && (
                                <textarea
                                    placeholder={q?.placeholder || "Enter your answer..."}
                                    value={answers[q.id] || ''}
                                    rows={4}
                                    disabled={isReadOnly}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-6 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg"
                                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                />
                            )}
                            {(q?.type === 'date' || q?.type === 'number') && (
                                <input
                                    type={q.type}
                                    placeholder={q?.placeholder || "Enter your answer..."}
                                    value={answers[q.id] || ''}
                                    disabled={isReadOnly}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-6 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg [color-scheme:dark]"
                                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                />
                            )}
                            {q?.type === 'scale' && (
                                <div className="space-y-8">
                                    <div className="flex justify-between px-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        <span>{q.min} — Low</span>
                                        <span>{q.max} — High</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={q.min}
                                        max={q.max}
                                        value={answers[q.id] || (q.min + q.max) / 2}
                                        disabled={isReadOnly}
                                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        onChange={(e) => setAnswers({ ...answers, [q.id]: parseInt(e.target.value) })}
                                    />
                                    <div className="text-center text-5xl font-bold text-indigo-400">
                                        {answers[q.id] || (q.min + q.max) / 2}
                                    </div>
                                    <textarea
                                        placeholder="Why did you give this rating?"
                                        value={answers[`${q.id}_reason`] || ''}
                                        rows={2}
                                        disabled={isReadOnly}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mt-4 text-sm"
                                        onChange={(e) => setAnswers({ ...answers, [`${q.id}_reason`]: e.target.value })}
                                    />
                                </div>
                            )}
                            {q?.type === 'choice' && (() => {
                                const selectedId: string = Array.isArray(answers[q.id]) ? answers[q.id][0] : answers[q.id];
                                return (
                                <div className="grid gap-3">
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Select one option</p>
                                    {q.options?.map((opt: any) => {
                                        const isSelected = selectedId === opt.id;
                                        return (
                                        <button
                                            key={opt.id}
                                            disabled={isReadOnly}
                                            onClick={() => {
                                                setAnswers({ ...answers, [q.id]: [opt.id] });
                                            }}
                                            className={`w-full p-5 rounded-xl border text-left transition-all flex items-center gap-4
                                                ${isSelected ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'} ${isReadOnly ? 'opacity-80' : ''}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                                ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'}`}>
                                                {isSelected && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                                )}
                                            </div>
                                            {opt.text}
                                        </button>
                                        );
                                    })}
                                </div>
                                );
                            })()}
                            {q?.type === 'multiselect' && (
                                <div className="grid gap-3">
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Select all that apply</p>
                                    {q.options?.map((opt: any) => {
                                        const selected: string[] = answers[q.id] || [];
                                        const isSelected = selected.includes(opt.id);
                                        return (
                                            <button
                                                key={opt.id}
                                                disabled={isReadOnly}
                                                onClick={() => {
                                                    const current: string[] = answers[q.id] || [];
                                                    const updated = isSelected
                                                        ? current.filter((id: string) => id !== opt.id)
                                                        : [...current, opt.id];
                                                    setAnswers({ ...answers, [q.id]: updated });
                                                }}
                                                className={`w-full p-5 rounded-xl border text-left transition-all flex items-center gap-4
                                                    ${isSelected ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'} ${isReadOnly ? 'opacity-80' : ''}`}
                                            >
                                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0
                                                    ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'}`}>
                                                    {isSelected && (
                                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                    )}
                                                </div>
                                                {opt.text}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {q?.type === 'dropdown_multi' && (() => {
                                const selected: string[] = answers[q.id] || [];
                                return (
                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Select one or more options</p>
                                    <div className="grid gap-2">
                                        {q.options?.map((opt: any) => {
                                            const isSelected = selected.includes(opt.id);
                                            return (
                                                <button
                                                    key={opt.id}
                                                    disabled={isReadOnly}
                                                    onClick={() => {
                                                        const updated = isSelected
                                                            ? selected.filter((id: string) => id !== opt.id)
                                                            : [...selected, opt.id];
                                                        setAnswers({ ...answers, [q.id]: updated });
                                                    }}
                                                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4
                                                        ${isSelected ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'} ${isReadOnly ? 'opacity-80' : ''}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0
                                                        ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'}`}>
                                                        {isSelected && (
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    {opt.text}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selected.length > 0 && (
                                        <div className="text-xs text-slate-400 mt-2">
                                            {selected.length} selected
                                        </div>
                                    )}
                                </div>
                                );
                            })()}
                            {q?.type === 'table' && (() => {
                                const isPrefilled = Array.isArray(q.prefilledRows) && q.prefilledRows.length > 0;
                                const minRows = isPrefilled ? q.prefilledRows.length : (q.minRows || 1);
                                const numCols = q.col4Label ? 4 : (q.col3Label ? 3 : (q.col2Label ? 2 : 1));
                                const gridColsClass = numCols === 4 ? 'grid-cols-4' : (numCols === 3 ? 'grid-cols-3' : (numCols === 2 ? 'grid-cols-2' : 'grid-cols-1'));
                                
                                const tableData = Array.isArray(answers[q.id]) && answers[q.id].length >= minRows 
                                    ? answers[q.id] 
                                    : Array.from({ length: Math.max(minRows, (answers[q.id] || []).length) }).map((_, i) => {
                                        const defaultCol1 = isPrefilled && i < q.prefilledRows.length ? q.prefilledRows[i] : '';
                                        return answers[q.id]?.[i] || { col1: defaultCol1, col2: '', col3: '', col4: '' };
                                    });
                                
                                return (
                                    <div className="space-y-4">
                                        <div className={`grid ${gridColsClass} gap-4 mb-2 px-2`}>
                                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{q.col1Label || 'Item'}</div>
                                            {numCols >= 2 && <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{q.col2Label || 'Details'}</div>}
                                            {numCols >= 3 && <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{q.col3Label}</div>}
                                            {numCols >= 4 && <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{q.col4Label}</div>}
                                        </div>
                                        {tableData.map((row: any, i: number) => {
                                            const isRowPrefilled = isPrefilled && i < q.prefilledRows.length;
                                            return (
                                                <div key={i} className={`flex grid ${gridColsClass} gap-4`}>
                                                    <input
                                                        type="text"
                                                        value={row.col1}
                                                        readOnly={isRowPrefilled}
                                                        disabled={isRowPrefilled || isReadOnly}
                                                        placeholder={q.col1Placeholder || '...'}
                                                        className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 ${isRowPrefilled ? 'text-indigo-300 bg-slate-900/50 cursor-not-allowed border-none' : ''}`}
                                                        onChange={(e) => {
                                                            if (isRowPrefilled) return;
                                                            const newData = [...tableData];
                                                            newData[i] = { ...newData[i], col1: e.target.value };
                                                            setAnswers({ ...answers, [q.id]: newData });
                                                        }}
                                                    />
                                                    {numCols >= 2 && (
                                                        <input
                                                            type="text"
                                                            value={row.col2}
                                                            disabled={isReadOnly}
                                                            placeholder={q.col2Placeholder || '...'}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                                                            onChange={(e) => {
                                                                const newData = [...tableData];
                                                                newData[i] = { ...newData[i], col2: e.target.value };
                                                                setAnswers({ ...answers, [q.id]: newData });
                                                            }}
                                                        />
                                                    )}
                                                    {numCols >= 3 && (
                                                        <input
                                                            type="text"
                                                            value={row.col3}
                                                            disabled={isReadOnly}
                                                            placeholder={q.col3Placeholder || '...'}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                                                            onChange={(e) => {
                                                                const newData = [...tableData];
                                                                newData[i] = { ...newData[i], col3: e.target.value };
                                                                setAnswers({ ...answers, [q.id]: newData });
                                                            }}
                                                        />
                                                    )}
                                                    {numCols >= 4 && (
                                                        <input
                                                            type="text"
                                                            value={row.col4}
                                                            disabled={isReadOnly}
                                                            placeholder={q.col4Placeholder || '...'}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                                                            onChange={(e) => {
                                                                const newData = [...tableData];
                                                                newData[i] = { ...newData[i], col4: e.target.value };
                                                                setAnswers({ ...answers, [q.id]: newData });
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {!isPrefilled && (
                                            <button
                                                disabled={isReadOnly}
                                                onClick={() => setAnswers({ ...answers, [q.id]: [...tableData, { col1: '', col2: '', col3: '', col4: '' }] })}
                                                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Add Row
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}
                            {q?.type === 'schedule' && (() => {
                                const scheduleData = Array.isArray(answers[q.id]) && answers[q.id].length === 16 
                                    ? answers[q.id] 
                                    : Array.from({ length: 16 }).map((_, i) => answers[q.id]?.[i] || '');
                                
                                return (
                                    <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                                        <div className="grid grid-cols-[100px_1fr] gap-4 mb-2 px-2 sticky top-0 bg-slate-900 py-2 z-10">
                                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Time</div>
                                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Activity</div>
                                        </div>
                                        {scheduleData.map((activity: string, i: number) => {
                                            const hourNumber = i + 7;
                                            const ampm = hourNumber >= 12 ? 'PM' : 'AM';
                                            const displayHour = hourNumber > 12 ? hourNumber - 12 : hourNumber;
                                            const timeLabel = `${displayHour}:00 ${ampm}`;
                                            return (
                                                <div key={i} className="grid grid-cols-[100px_1fr] gap-4 items-center">
                                                    <div className="text-sm font-bold text-slate-400 text-right pr-4">
                                                        {timeLabel}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={activity}
                                                        disabled={isReadOnly}
                                                        placeholder="What do you do?"
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                                                        onChange={(e) => {
                                                            const newData = [...scheduleData];
                                                            newData[i] = e.target.value;
                                                            setAnswers({ ...answers, [q.id]: newData });
                                                        }}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                );
                            })()}
                            {q?.type === 'rank' && (() => {
                                const numRanks = q.numRanks || 3;
                                const rankData = Array.isArray(answers[q.id]) && answers[q.id].length === numRanks 
                                    ? answers[q.id] 
                                    : Array.from({ length: numRanks }).map((_, i) => answers[q.id]?.[i] || { option: '' });
                                const selectedOptions = rankData.map((r: any) => r.option).filter(Boolean);
                                return (
                                <div className="space-y-6">
                                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Available Options</p>
                                        <div className="grid gap-2">
                                            {q.options?.map((opt: any, i: number) => {
                                                const isUsed = selectedOptions.includes(opt.text);
                                                return (
                                                    <div key={opt.id} className={`flex items-start gap-3 text-sm px-3 py-2 rounded-lg transition-all ${isUsed ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'text-slate-400'}`}>
                                                        <span className={`font-bold shrink-0 w-6 text-right ${isUsed ? 'text-indigo-400' : 'text-slate-600'}`}>{i + 1}.</span>
                                                        <span>{opt.text}</span>
                                                        {isUsed && (
                                                            <span className="ml-auto text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full shrink-0">
                                                                Rank {selectedOptions.indexOf(opt.text) + 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {Array.from({ length: numRanks }).map((_, idx) => {
                                        const rankNum = idx + 1;
                                        const currentSelection = rankData[idx];
                                        const availableOptions = q.options?.filter((opt: any) =>
                                            opt.text === currentSelection.option || !selectedOptions.includes(opt.text)
                                        );
                                        return (
                                            <div key={rankNum} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-lg">
                                                <div className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Rank {rankNum}</div>
                                                <select
                                                    value={currentSelection.option}
                                                    disabled={isReadOnly}
                                                    onChange={(e) => {
                                                        const newData = [...rankData];
                                                        newData[idx] = { ...newData[idx], option: e.target.value };
                                                        setAnswers({ ...answers, [q.id]: newData });
                                                    }}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 appearance-none"
                                                >
                                                    <option value="">Select an option...</option>
                                                    {availableOptions?.map((opt: any) => (
                                                        <option key={opt.id} value={opt.text}>{opt.text}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                                );
                            })()}
                            {q?.type === 'choice_with_rating' && (() => {
                                const selectedOpt = answers[q.id]?.option || '';
                                const rating = answers[q.id]?.rating || 5;
                                return (
                                <div className="grid gap-6">
                                    <div className="grid gap-3">
                                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Select an option</p>
                                        {q.options?.map((opt: any) => {
                                            const isSelected = selectedOpt === opt.id;
                                            return (
                                            <button
                                                key={opt.id}
                                                disabled={isReadOnly}
                                                onClick={() => {
                                                    setAnswers({ ...answers, [q.id]: { option: opt.id, rating } });
                                                }}
                                                className={`w-full p-5 rounded-xl border text-left transition-all flex items-center gap-4
                                                    ${isSelected ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                                    ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                                </div>
                                                {opt.text}
                                            </button>
                                            );
                                        })}
                                    </div>
                                    {selectedOpt && (
                                        <div className="space-y-4 p-6 bg-slate-900 border border-slate-800 rounded-xl">
                                            <div className="flex justify-between px-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                <span>1 — Low</span>
                                                <span>10 — High</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={1}
                                                max={10}
                                                value={rating}
                                                disabled={isReadOnly}
                                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                onChange={(e) => setAnswers({ ...answers, [q.id]: { option: selectedOpt, rating: parseInt(e.target.value) } })}
                                            />
                                            <div className="text-center text-3xl font-bold text-indigo-400">
                                                Rating: {rating}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                );
                            })()}
                            {q?.type === 'multiselect_with_rank' && (() => {
                                const data = answers[q.id] || { selected: [], ranked: [] };
                                const selected: string[] = data.selected || [];
                                const ranked: string[] = data.ranked || [];
                                return (
                                <div className="grid gap-6">
                                    <div className="grid gap-3">
                                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Select all that apply</p>
                                        {q.options?.map((opt: any) => {
                                            const isSelected = selected.includes(opt.id);
                                            return (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    let newSelected: string[];
                                                    if (isSelected) {
                                                        newSelected = selected.filter((id: string) => id !== opt.id);
                                                    } else {
                                                        newSelected = [...selected, opt.id];
                                                    }
                                                    const newRanked = ranked.filter((id: string) => newSelected.includes(id));
                                                    const newlyAdded = newSelected.filter((id: string) => !newRanked.includes(id));
                                                    setAnswers({ ...answers, [q.id]: { selected: newSelected, ranked: [...newRanked, ...newlyAdded] } });
                                                }}
                                                className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4
                                                    ${isSelected ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0
                                                    ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'}`}>
                                                    {isSelected && (
                                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                    )}
                                                </div>
                                                {opt.text}
                                            </button>
                                            );
                                        })}
                                    </div>
                                    {ranked.length > 0 && (
                                        <div className="space-y-3 p-5 bg-slate-900 border border-slate-800 rounded-xl">
                                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Now rank your selections (drag to reorder or use numbers)</p>
                                            {ranked.map((optId: string, idx: number) => {
                                                const opt = q.options?.find((o: any) => o.id === optId);
                                                if (!opt) return null;
                                                return (
                                                    <div key={optId} className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                                        <select
                                                            value={idx + 1}
                                                            onChange={(e) => {
                                                                const newIdx = parseInt(e.target.value) - 1;
                                                                const newRanked = [...ranked];
                                                                newRanked.splice(idx, 1);
                                                                newRanked.splice(newIdx, 0, optId);
                                                                setAnswers({ ...answers, [q.id]: { selected, ranked: newRanked } });
                                                            }}
                                                            className="w-14 bg-indigo-500/20 border border-indigo-500/50 rounded-lg p-1.5 text-indigo-300 text-center font-bold text-sm focus:outline-none"
                                                        >
                                                            {ranked.map((_: any, i: number) => (
                                                                <option key={i} value={i + 1}>{i + 1}</option>
                                                            ))}
                                                        </select>
                                                        <span className="text-sm text-white">{opt.text}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                );
                            })()}
                            {q?.type === 'education_history' && (() => {
                                const eduData = answers[q.id] || { school: { active: false, name: '', grade: '' }, college: { active: false, name: '', grade: '' }, university: { active: false, name: '', grade: '' } };
                                const levels = [
                                    { key: 'school', label: 'School' },
                                    { key: 'college', label: 'College' },
                                    { key: 'university', label: 'University' },
                                ];
                                return (
                                <div className="space-y-6">
                                    {levels.map((level) => {
                                        const data = eduData[level.key];
                                        return (
                                            <div key={level.key} className={`p-5 rounded-xl border transition-all ${data.active ? 'bg-slate-900 border-indigo-500/50' : 'bg-slate-950 border-slate-800'}`}>
                                                <label className="flex items-center gap-4 cursor-pointer mb-4">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={data.active}
                                                        onChange={(e) => {
                                                            setAnswers({ ...answers, [q.id]: { ...eduData, [level.key]: { ...data, active: e.target.checked } } });
                                                        }}
                                                        className="w-5 h-5 rounded border-slate-700 text-indigo-500 bg-slate-900 focus:ring-indigo-500/50 focus:ring-offset-slate-950"
                                                    />
                                                    <span className={`font-bold ${data.active ? 'text-white' : 'text-slate-400'}`}>{level.label}</span>
                                                </label>
                                                {data.active && (
                                                    <div className="grid md:grid-cols-2 gap-4 pl-9">
                                                        <input
                                                            type="text"
                                                            value={data.name}
                                                            placeholder={`${level.label} Name...`}
                                                            onChange={(e) => setAnswers({ ...answers, [q.id]: { ...eduData, [level.key]: { ...data, name: e.target.value } } })}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={data.grade}
                                                            placeholder="Current Year / Grade..."
                                                            onChange={(e) => setAnswers({ ...answers, [q.id]: { ...eduData, [level.key]: { ...data, grade: e.target.value } } })}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                );
                            })()}
                            {q?.type === 'trait_grid' && (() => {
                                const traitsSource = q.traits || q.options || [];
                                const defaultTraits = traitsSource.map((o: any) => o.label || o.text);
                                const traitData = Array.isArray(answers[q.id]) && answers[q.id].length === defaultTraits.length 
                                    ? answers[q.id]
                                    : traitsSource.map((t: any) => ({ trait: t.label || t.text, leftLabel: t.leftLabel || '', rightLabel: t.rightLabel || '', isStrength: false, isWeakness: false, rating: 5 }));
                                
                                return (
                                <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                                    <div className="grid grid-cols-[minmax(120px,1.2fr)_minmax(100px,1fr)_minmax(100px,1fr)_80px] gap-3 mb-2 px-2 sticky top-0 bg-slate-900 py-2 z-10">
                                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Trait</div>
                                        <div className="text-xs font-bold text-pink-400 uppercase tracking-widest text-center">1 — Weakness</div>
                                        <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest text-center">10 — Strength</div>
                                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest text-center">Rating</div>
                                    </div>
                                    {traitData.map((row: any, i: number) => {
                                        return (
                                            <div key={i} className="grid grid-cols-[minmax(120px,1.2fr)_minmax(100px,1fr)_minmax(100px,1fr)_80px] gap-3 items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                <div className="text-sm font-bold text-white leading-tight">
                                                    {row.trait}
                                                </div>
                                                <div className="text-[10px] text-pink-400/70 text-center leading-tight">
                                                    {row.leftLabel}
                                                </div>
                                                <div className="text-[10px] text-emerald-400/70 text-center leading-tight">
                                                    {row.rightLabel}
                                                </div>
                                                <div className="flex flex-col items-center gap-1">
                                                    <input
                                                        type="range"
                                                        min={1}
                                                        max={10}
                                                        value={row.rating}
                                                        onChange={(e) => {
                                                            const newData = [...traitData];
                                                            newData[i] = { ...row, rating: parseInt(e.target.value) };
                                                            setAnswers({ ...answers, [q.id]: newData });
                                                        }}
                                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                    />
                                                    <span className="text-xs font-bold text-indigo-400">{row.rating}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                );
                            })()}
                            {q?.type === 'file' && (() => {
                                const files = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                                const isUploading = uploadingState[q.id] || false;
                                return (
                                <div className="space-y-4">
                                    <label className="block w-full border-2 border-dashed border-slate-700 bg-slate-900/50 hover:bg-slate-800/50 rounded-2xl p-8 cursor-pointer transition-colors text-center group">
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            multiple
                                            onChange={async (e) => {
                                                if (!e.target.files?.length) return;
                                                setUploadingState(prev => ({ ...prev, [q.id]: true }));
                                                const formData = new FormData();
                                                Array.from(e.target.files).forEach(f => formData.append('files', f));
                                                
                                                try {
                                                    const res = await fetch('/api/upload', {
                                                        method: 'POST',
                                                        body: formData
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        setAnswers({ ...answers, [q.id]: [...files, ...data.files] });
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                } finally {
                                                    setUploadingState(prev => ({ ...prev, [q.id]: false }));
                                                }
                                            }}
                                        />
                                        <div className="flex flex-col items-center gap-3">
                                            {isUploading ? (
                                                <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <svg className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                            )}
                                            <div className="text-sm text-slate-400">
                                                <span className="text-indigo-400 font-bold">Click to upload</span> or drag and drop files
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                PDF, DOC, DOCX, Images
                                            </div>
                                        </div>
                                    </label>
                                    {files.map((filepath: string, i: number) => (
                                        <div key={i} className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-sm flex justify-between items-center group">
                                            <a href={filepath} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                {filepath.split('/').pop()}
                                            </a>
                                            <button 
                                                onClick={() => {
                                                    const newFiles = [...files];
                                                    newFiles.splice(i, 1);
                                                    setAnswers({...answers, [q.id]: newFiles});
                                                }}
                                                className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-8 border-t border-slate-800 mt-8">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className={`flex items-center gap-2 font-bold uppercase tracking-widest transition-colors text-sm
                                ${currentStep === 0 ? 'text-slate-300 pointer-events-none' : 'text-slate-400 hover:text-white'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                            Back
                        </button>
                        <button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20 text-sm tracking-wide">
                            {currentStep === questions.length - 1 ? (isReadOnly ? 'Exit Assessment' : 'Submit Assessment') : 'Continue'}
                            {currentStep < questions.length - 1 && (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Slide-out Comments Drawer */}
            {isCommentsOpen && (
                <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-slide-left">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                            Expert Discussion
                        </h3>
                        <button onClick={() => setIsCommentsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {comments.length === 0 ? (
                            <div className="text-center text-slate-500 mt-10 text-sm">No comments on this question yet.</div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold uppercase">
                                                {comment.author[0]}
                                            </div>
                                            <span className="text-xs font-bold">{comment.author}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-300 ml-8 leading-relaxed">{comment.content}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-800 bg-slate-950">
                        <div className="relative">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Reply or ask a question..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 pr-12 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
                                rows={2}
                            />
                            <button
                                onClick={handleAddComment}
                                className="absolute right-2 bottom-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Discussion Button */}
            {!isCommentsOpen && (
                <button
                    onClick={() => setIsCommentsOpen(true)}
                    className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-3 transition-all z-40 hover:scale-110"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {comments.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                            {comments.length}
                        </span>
                    )}
                </button>
            )}
        </div>
    );
}

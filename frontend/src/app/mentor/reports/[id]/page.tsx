"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MentorReportEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [careerOptions, setCareerOptions] = useState<any[]>([]);
    const [notification, setNotification] = useState<{ type: string; msg: string } | null>(null);
    const [reportId, setReportId] = useState('');

    // Separate input states to prevent JSON corruption
    const [personaSummary, setPersonaSummary] = useState('');
    const [mbtiInterpretation, setMbtiInterpretation] = useState('');
    const [hReport, setHReport] = useState<any>({
        who_is_client: { core_nature: [], what_energises: [], conditioned_nature: [], why_patterns_developed: [] },
        what_drives_client: { strongest_values: [], success_definition: [] },
        how_client_learns: { learns_best: [], struggles_with: [], explanation: [] },
        emotional_social_profile: { emotional_strengths: [], growth_areas: [], social_style: [] },
        biggest_strengths: [],
        development_areas: { personal: [], academic: [], professional: [] },
        what_interests_tell_us: [],
        less_suitable_careers: [],
        exploration_roadmap: { class_10: [], class_11_12: [], before_college: [] },
        recommendations_parents: { continue_encouraging: [], work_together_on: [], avoid: [] },
        final_understanding: { summary: '', career_direction: '', most_suitable_ecosystems: [], current_priority: '' }
    });

    useEffect(() => {
        const resolveParamsAndLoad = async () => {
            try {
                const p = await params;
                if (!p?.id) return;
                setReportId(p.id);
                try {
                    const res = await fetch(`/api/mentor/reports/${p.id}`);
                    const data = await res.json();

                    if (data.success && data.report) {
                        setReport(data.report);
                        setCareerOptions(data.report.careerOptions || []);
                        try {
                            const parsed = JSON.parse(data.report.content);
                            setPersonaSummary(parsed.personality_insights || '');
                            setMbtiInterpretation(parsed.mbti_interpretation || '');
                            if (parsed.holistree_report) {
                                setHReport(parsed.holistree_report);
                            }
                        } catch (e) {
                            setPersonaSummary(data.report.content || '');
                        }
                    } else if (data.report) {
                        setReport(data.report);
                        setCareerOptions(data.report.careerOptions || []);
                        try {
                            const parsed = JSON.parse(data.report.content);
                            setPersonaSummary(parsed.personality_insights || '');
                            setMbtiInterpretation(parsed.mbti_interpretation || '');
                            if (parsed.holistree_report) {
                                setHReport(parsed.holistree_report);
                            }
                        } catch (e) {
                            setPersonaSummary(data.report.content || '');
                        }
                    } else {
                        console.error('Report load failed', data.error);
                    }
                } catch (err) {
                    console.error('Failed to load report', err);
                } finally {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Params resolution failed', err);
            }
        };
        resolveParamsAndLoad();
    }, [params]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Reconstruct content JSON safely
            const updatedContent = JSON.stringify({
                personality_insights: personaSummary,
                mbti_type: report?.mbti_type || 'Unknown',
                mbti_dimensions: report?.mbti_dimensions || {},
                mbti_interpretation: mbtiInterpretation,
                overview_summaries: report?.overview_summaries || {},
                holistree_report: hReport
            });

            const res = await fetch(`/api/mentor/reports/${reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: updatedContent,
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

    // Helper functions to manage arrays in editor
    const getArrayText = (arr: any) => Array.isArray(arr) ? arr.join('\n') : '';
    const setArrayText = (text: string) => text.split('\n').map(s => s.trim()).filter(Boolean);

    const updateHReport = (section: string, field: string, value: any) => {
        setHReport((prev: any) => ({
            ...prev,
            [section]: {
                ...(prev[section] || {}),
                [field]: value
            }
        }));
    };

    const updateFinalUnderstanding = (field: string, value: any) => {
        setHReport((prev: any) => ({
            ...prev,
            final_understanding: {
                ...(prev.final_understanding || {}),
                [field]: value
            }
        }));
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

            {/* Content Editor Blocks */}
            <div className="space-y-6">
                
                {/* 1. Core Persona & MBTI */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 lg:p-8 space-y-4">
                    <h2 className="text-lg font-bold text-indigo-400">1. Core Persona & MBTI Remarks</h2>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Professional Persona Summary</label>
                        <textarea
                            value={personaSummary}
                            onChange={e => setPersonaSummary(e.target.value)}
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Professional Persona Summary..."
                            disabled={report.status === 'FINALIZED'}
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">MBTI Interpretation Remarks</label>
                        <textarea
                            value={mbtiInterpretation}
                            onChange={e => setMbtiInterpretation(e.target.value)}
                            className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="MBTI Interpretation..."
                            disabled={report.status === 'FINALIZED'}
                        />
                    </div>
                </div>

                {/* 2. Who is Client */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 lg:p-8 space-y-4">
                    <h2 className="text-lg font-bold text-indigo-400">2. Who is Client? (Enter one item per line)</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Core Nature (Natural Self)</label>
                            <textarea
                                value={getArrayText(hReport.who_is_client?.core_nature)}
                                onChange={e => updateHReport('who_is_client', 'core_nature', setArrayText(e.target.value))}
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                placeholder="Highly creative...&#10;Highly observational..."
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">What naturally energises them</label>
                            <textarea
                                value={getArrayText(hReport.who_is_client?.what_energises)}
                                onChange={e => updateHReport('who_is_client', 'what_energises', setArrayText(e.target.value))}
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                placeholder="Sketching...&#10;Playing music..."
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Conditioned Nature (Learnt Behaviours)</label>
                            <textarea
                                value={getArrayText(hReport.who_is_client?.conditioned_nature)}
                                onChange={e => updateHReport('who_is_client', 'conditioned_nature', setArrayText(e.target.value))}
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                placeholder="Procrastination...&#10;Screen time escape..."
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Why these patterns developed</label>
                            <textarea
                                value={getArrayText(hReport.who_is_client?.why_patterns_developed)}
                                onChange={e => updateHReport('who_is_client', 'why_patterns_developed', setArrayText(e.target.value))}
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                placeholder="Academic stress...&#10;Expectation fear..."
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Drives, learning & social */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 lg:p-8 space-y-4">
                    <h2 className="text-lg font-bold text-indigo-400">3. Values, Learning & Social Profile (Enter one item per line)</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Strongest Values</label>
                            <textarea
                                value={getArrayText(hReport.what_drives_client?.strongest_values)}
                                onChange={e => updateHReport('what_drives_client', 'strongest_values', setArrayText(e.target.value))}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Success Definition</label>
                            <textarea
                                value={getArrayText(hReport.what_drives_client?.success_definition)}
                                onChange={e => updateHReport('what_drives_client', 'success_definition', setArrayText(e.target.value))}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Learns best through</label>
                            <textarea
                                value={getArrayText(hReport.how_client_learns?.learns_best)}
                                onChange={e => updateHReport('how_client_learns', 'learns_best', setArrayText(e.target.value))}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Struggles more with</label>
                            <textarea
                                value={getArrayText(hReport.how_client_learns?.struggles_with)}
                                onChange={e => updateHReport('how_client_learns', 'struggles_with', setArrayText(e.target.value))}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Subject sentiment & application sentiment (Enter one analysis statement per line)</label>
                            <textarea
                                value={getArrayText(hReport.how_client_learns?.explanation)}
                                onChange={e => updateHReport('how_client_learns', 'explanation', setArrayText(e.target.value))}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Emotional Strengths</label>
                            <textarea
                                value={getArrayText(hReport.emotional_social_profile?.emotional_strengths)}
                                onChange={e => updateHReport('emotional_social_profile', 'emotional_strengths', setArrayText(e.target.value))}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Emotional Growth Areas</label>
                            <textarea
                                value={getArrayText(hReport.emotional_social_profile?.growth_areas)}
                                onChange={e => updateHReport('emotional_social_profile', 'growth_areas', setArrayText(e.target.value))}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Social Style</label>
                            <textarea
                                value={getArrayText(hReport.emotional_social_profile?.social_style)}
                                onChange={e => updateHReport('emotional_social_profile', 'social_style', setArrayText(e.target.value))}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Strengths & development */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 lg:p-8 space-y-4">
                    <h2 className="text-lg font-bold text-indigo-400">4. Strengths, Development & Interests (Enter one item per line)</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Biggest Strengths</label>
                            <textarea
                                value={getArrayText(hReport.biggest_strengths)}
                                onChange={e => setHReport({ ...hReport, biggest_strengths: setArrayText(e.target.value) })}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Priority Development Areas - Personal</label>
                            <textarea
                                value={getArrayText(hReport.development_areas?.personal)}
                                onChange={e => updateHReport('development_areas', 'personal', setArrayText(e.target.value))}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Priority Development Areas - Academic</label>
                            <textarea
                                value={getArrayText(hReport.development_areas?.academic)}
                                onChange={e => updateHReport('development_areas', 'academic', setArrayText(e.target.value))}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Priority Development Areas - Professional</label>
                            <textarea
                                value={getArrayText(hReport.development_areas?.professional)}
                                onChange={e => updateHReport('development_areas', 'professional', setArrayText(e.target.value))}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">What interests tell us</label>
                            <textarea
                                value={getArrayText(hReport.what_interests_tell_us)}
                                onChange={e => setHReport({ ...hReport, what_interests_tell_us: setArrayText(e.target.value) })}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Careers That May Feel Less Suitable</label>
                            <textarea
                                value={getArrayText(hReport.less_suitable_careers)}
                                onChange={e => setHReport({ ...hReport, less_suitable_careers: setArrayText(e.target.value) })}
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                    </div>
                </div>

                {/* 5. Roadmap & parent recommendations */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 lg:p-8 space-y-4">
                    <h2 className="text-lg font-bold text-indigo-400">5. Exploration Roadmap & Recommendations (Enter one item per line)</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Roadmap - Grade 10 Focus</label>
                            <textarea
                                value={getArrayText(hReport.exploration_roadmap?.class_10)}
                                onChange={e => updateHReport('exploration_roadmap', 'class_10', setArrayText(e.target.value))}
                                className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Roadmap - Grade 11-12 Focus</label>
                            <textarea
                                value={getArrayText(hReport.exploration_roadmap?.class_11_12)}
                                onChange={e => updateHReport('exploration_roadmap', 'class_11_12', setArrayText(e.target.value))}
                                className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Roadmap - Before College</label>
                            <textarea
                                value={getArrayText(hReport.exploration_roadmap?.before_college)}
                                onChange={e => updateHReport('exploration_roadmap', 'before_college', setArrayText(e.target.value))}
                                className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Parents - Continue Encouraging</label>
                            <textarea
                                value={getArrayText(hReport.recommendations_parents?.continue_encouraging)}
                                onChange={e => updateHReport('recommendations_parents', 'continue_encouraging', setArrayText(e.target.value))}
                                className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Parents - Work Together On</label>
                            <textarea
                                value={getArrayText(hReport.recommendations_parents?.work_together_on)}
                                onChange={e => updateHReport('recommendations_parents', 'work_together_on', setArrayText(e.target.value))}
                                className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Parents - Avoid</label>
                            <textarea
                                value={getArrayText(hReport.recommendations_parents?.avoid)}
                                onChange={e => updateHReport('recommendations_parents', 'avoid', setArrayText(e.target.value))}
                                className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                    </div>
                </div>

                {/* 6. Final Understanding */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 lg:p-8 space-y-4">
                    <h2 className="text-lg font-bold text-indigo-400">6. Final Understanding of Student</h2>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Summary (Beyond Marks)</label>
                        <textarea
                            value={hReport.final_understanding?.summary || ''}
                            onChange={e => updateFinalUnderstanding('summary', e.target.value)}
                            className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Final overview summary..."
                            disabled={report.status === 'FINALIZED'}
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Career Direction</label>
                            <input
                                type="text"
                                value={hReport.final_understanding?.career_direction || ''}
                                onChange={e => updateFinalUnderstanding('career_direction', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="E.g., Creative Industries..."
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Most Suitable Ecosystems (One per line)</label>
                            <textarea
                                value={getArrayText(hReport.final_understanding?.most_suitable_ecosystems)}
                                onChange={e => updateFinalUnderstanding('most_suitable_ecosystems', setArrayText(e.target.value))}
                                className="w-full h-20 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Current Priority (Next 2-3 Years)</label>
                            <textarea
                                value={hReport.final_understanding?.current_priority || ''}
                                onChange={e => updateFinalUnderstanding('current_priority', e.target.value)}
                                className="w-full h-20 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="E.g., Focus on stability and consistent sketching habits..."
                                disabled={report.status === 'FINALIZED'}
                            />
                        </div>
                    </div>
                </div>

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

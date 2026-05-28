"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface QuestionSchema {
    id: string;
    type: string;
    question: string;
    description?: string;
    options?: { id: string; text: string }[];
}

interface ModuleData {
    id: string;
    status: string;
    order: number;
    filledBy: string;
    module: { title: string; description: string; schema: { questions?: QuestionSchema[]; testType?: string } };
    response: { data: Record<string, any>; submittedAt: string; approvedAt: string | null } | null;
}

interface ClientData {
    id: string;
    journeyStatus: string;
    user: { id: string; email: string; name: string | null };
    modules: ModuleData[];
}

// Round 1 and Round 2 question label maps for Self Discovery
const SELF_DISCOVERY_QUESTIONS: Record<string, string> = {
    sd_age_group: "Age Group",
    sd_q1: "Q1. What activities make you lose track of time?",
    sd_q2: "Q2. What is something that you get really excited about most of the time? What is it?",
    sd_q3: "Q3. What do you love talking about, regardless of whether others like or don’t?",
    sd_q4: "Q4. If school/Academics was over, how would you spend your days (daily routine)?",
    sd_q5: "Q5. What kind of videos, articles, or posts do you keep scrolling through?",
    sd_q6: "Q6. What do you enjoy making or creating most of the time?",
    sd_q7: "Q7. Do you like working with your hands (physical engagement), your mind (ideating, analysing, visualizing), or with people (talking/collaborating)?",
    sd_q8: "Q8. Is there something you’re naturally good at without trying too hard?",
    sd_q9: "Q9. Have you ever helped someone with a skill or talent of yours?",
    sd_q10: "Q10. What kind of areas, topics or projects excite you?",
    sd_q11: "Q11. If you could try any job for a day, what would it be and why?",
    sd_q12: "Q12. What do you think your dream lifestyle looks like (mention all the things you like as a list)?",
    sd_q13: "Q13. Who do you admire (in real life or online)? What do they do?",
    sd_q14: "Q14. Which subjects or classes do you enjoy the most - and the least - and why?",
    sd_q15: "Q15. Have you ever visited a space that made you think, “I want to be part of this”? (vibe, culture, ambience, people, way of doing something, their mission/cause)",
    sd_q16: "Q16. What makes you feel proud of yourself?",
    sd_q17: "Q17. What makes you feel confident?",
    sd_q18: "Q18. What do you do when you’re stressed or upset that makes you feel better?",
    sd_q19: "Q19. What’s one thing you always look forward to?",
    sd_q20: "Q20. Do you prefer working alone or in a group? In fast-paced or calm settings?",
    sd_q21: "Q21. What kind of problems in the world do you wish you could solve?",
    sd_q22: "Q22. What’s more important to you: money, creativity, helping others, or freedom?",
    sd_q23: "Q23. Do you want your future job to be fun, meaningful, respected, or secure?",
    sd_q24: "Q24. Would you like to travel for work, or stay close to home? (If Travel mention frequency or duration)",
    sd_q25: "Q25. What kind of difference do you want to make in people’s lives? (Daily/regular basis)",
    sd_r2_q1: "Q26. Round 2: Skills/hobbies to use regularly in next 2-4 years / Interests or strengths used daily in work?",
    sd_r2_q2: "Q27. Round 2: Field trying first after school / Career paths aligning with realistic 5-10 year lifestyle?",
    sd_r2_q3: "Q28. Round 2: Job that pays well and is boring vs less-paying and exciting?",
    sd_r2_q4: "Q29. Round 2: 2-3 areas you'd like to explore through internships / Curious enough to work next year?",
    sd_r2_q5: "Q30. Round 2: Kind of work happily done without money first few months?",
    sd_r2_q6: "Q31. Round 2: Biggest thing holding you back right now?",
    sd_r2_q7: "Q32. Round 2: Worries about failing or making mistakes in career journey?",
    sd_r2_q8: "Q33. Round 2: Afraid of picking wrong path vs not choosing at all?",
    sd_r2_q9: "Q34. Round 2: Comparing choices/decisions with classmates/peers?",
    sd_r2_q10: "Q35. Round 2: Handling boredom / Quitting quickly or sticking with it?",
    sd_r2_q11: "Q36. Round 2: New skills to learn in next 2-4 years / Skills needed to build in 1-2 years?",
    sd_r2_q12: "Q37. Round 2: Work setting / Work culture exciting you?",
    sd_r2_q13: "Q38. Round 2: Openness to mentorship / learning from senior?",
    sd_r2_q14: "Q39. Round 2: Tools, apps, or platforms curious to learn/master?",
    sd_r2_q15: "Q40. Round 2: Someone to talk to regularly for guidance/accountability?",
    sd_r2_q16: "Q41. Round 2: Successful day 2-4 years from now / Successful day at age 35?",
    sd_r2_q17: "Q42. Round 2: Non-negotiable in career you won't compromise/sacrifice?",
    sd_r2_q18: "Q43. Round 2: Create something own vs grow within existing system/group?",
    sd_r2_q19: "Q44. Round 2: How you want others to describe your efforts/work ethic in future?",
    sd_r2_q20: "Q45. Round 2: One big regret you want to make sure you avoid?",
};

export default function CombinedAnswersPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [client, setClient] = useState<ClientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [clientId, setClientId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedModuleFilters, setSelectedModuleFilters] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED_ONLY'>('ALL');

    // Editing states
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: string; msg: string } | null>(null);

    useEffect(() => {
        params.then(p => {
            setClientId(p.id);
            fetchClientData(p.id);
        });
    }, []);

    const fetchClientData = async (id: string) => {
        try {
            const res = await fetch(`/api/mentor/clients/${id}`);
            const data = await res.json();
            if (data.client) {
                setClient(data.client);
                // Initialize filters with all module IDs
                setSelectedModuleFilters(data.client.modules.map((m: any) => m.id));
            }
        } catch (err) {
            console.error('Failed to fetch client details', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAnswer = async (moduleId: string, questionId: string, newValue: any) => {
        const targetModule = client?.modules.find(m => m.id === moduleId);
        if (!targetModule) return;

        setSaving(true);
        try {
            const currentData = targetModule.response?.data || {};
            const updatedData = { ...currentData, [questionId]: newValue };

            const res = await fetch(`/api/mentor/modules/${moduleId}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'EDIT_RESPONSE', data: updatedData })
            });
            const result = await res.json();

            if (result.success) {
                setNotification({ type: 'success', msg: 'Answer updated successfully' });
                setEditingKey(null);
                setEditingModuleId(null);
                await fetchClientData(clientId);
            } else {
                setNotification({ type: 'error', msg: result.error || 'Failed to save' });
            }
        } catch (err) {
            setNotification({ type: 'error', msg: 'Network error occurred' });
        } finally {
            setSaving(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    // Filter modules based on selected filters and completion status
    const filteredModules = useMemo(() => {
        if (!client) return [];
        return client.modules.filter(m => {
            const matchesId = selectedModuleFilters.includes(m.id);
            const matchesStatus = statusFilter === 'ALL' || ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(m.status);
            return matchesId && matchesStatus;
        });
    }, [client, selectedModuleFilters, statusFilter]);

    // Format text summary of all modules and copy to clipboard
    const handleCopyAll = () => {
        if (!client) return;

        let summaryText = `CAREER GUIDANCE PLAN - CLIENT SURVEY RESPONSES\n`;
        summaryText += `Client: ${client.user.name || 'N/A'} (${client.user.email})\n`;
        summaryText += `Date Generated: ${new Date().toLocaleDateString()}\n`;
        summaryText += `==========================================\n\n`;

        client.modules.forEach(m => {
            const hasAns = m.response?.data;
            if (!hasAns) return;

            summaryText += `### ${m.module.title}\n`;
            summaryText += `Status: ${m.status}\n`;
            summaryText += `------------------------------------------\n`;

            if (m.module.schema.testType === 'SELF_DISCOVERY') {
                Object.entries(hasAns).forEach(([key, val]) => {
                    const qText = SELF_DISCOVERY_QUESTIONS[key] || key;
                    summaryText += `Q: ${qText}\nA: ${String(val)}\n\n`;
                });
            } else if (m.module.schema.testType && hasAns.__scored?.scores) {
                const scoreObj = hasAns.__scored.scores;
                summaryText += `Scored Results:\n${JSON.stringify(scoreObj, null, 2)}\n\n`;
            } else if (m.module.schema.questions) {
                m.module.schema.questions.forEach((q: any) => {
                    const val = hasAns[q.id];
                    if (val !== undefined && val !== null) {
                        summaryText += `Q: ${q.question}\nA: ${JSON.stringify(val)}\n\n`;
                    }
                });
            }
            summaryText += `\n`;
        });

        navigator.clipboard.writeText(summaryText);
        setNotification({ type: 'success', msg: 'Combined answers copied to clipboard!' });
        setTimeout(() => setNotification(null), 3000);
    };

    // Toggle filter checklists
    const toggleModuleFilter = (id: string) => {
        setSelectedModuleFilters(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleAllFilters = (selectAll: boolean) => {
        if (!client) return;
        setSelectedModuleFilters(selectAll ? client.modules.map(m => m.id) : []);
    };

    const isFileUrl = (val: any): boolean => {
        if (typeof val !== 'string') return false;
        return val.startsWith('/uploads/') || (val.startsWith('http') && val.includes('/uploads/'));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-500">Client details not found.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8 animate-fade-in print:bg-white print:text-black">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl border text-sm font-bold shadow-lg ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {notification.msg}
                </div>
            )}

            {/* Print friendly layout header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 print:border-b print:pb-4">
                <div>
                    <button 
                        onClick={() => router.push(`/mentor/clients/${clientId}`)}
                        className="text-xs font-bold text-slate-500 hover:text-indigo-400 mb-6 flex items-center gap-2 uppercase tracking-widest transition-colors print:hidden"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2} /></svg>
                        Back to Client Details
                    </button>
                    <h1 className="text-3xl font-extrabold tracking-tight">Combined Assessment Feed</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Viewing answers for <span className="font-bold text-slate-200">{client.user.name || 'Unnamed Client'}</span> ({client.user.email})
                    </p>
                </div>

                <div className="flex gap-3 print:hidden">
                    <button
                        onClick={handleCopyAll}
                        className="px-4 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center gap-2"
                        title="Copy text of all responses to paste in AI or analyze"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Copy Summary
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print PDF
                    </button>
                </div>
            </div>

            {/* Search and Filters panel */}
            <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-start">
                <div className="space-y-6 bg-slate-900/40 border border-slate-850 rounded-2xl p-6 print:hidden">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Search Answers</h3>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search keyword..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                            <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Status Filter</h3>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                            <option value="ALL">Show All Modules</option>
                            <option value="COMPLETED_ONLY">Show Only Answered</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Modules</h3>
                            <div className="flex gap-2">
                                <button onClick={() => toggleAllFilters(true)} className="text-[10px] text-indigo-400 hover:underline">All</button>
                                <span className="text-slate-700 text-[10px]">•</span>
                                <button onClick={() => toggleAllFilters(false)} className="text-[10px] text-indigo-400 hover:underline">None</button>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
                            {client.modules.map(m => {
                                const isChecked = selectedModuleFilters.includes(m.id);
                                return (
                                    <label key={m.id} className="flex items-start gap-2.5 p-2 hover:bg-slate-900 rounded-lg cursor-pointer text-xs transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleModuleFilter(m.id)}
                                            className="mt-0.5 accent-indigo-500"
                                        />
                                        <span className={isChecked ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                                            {m.module.title}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Unified Answers Display */}
                <div className="space-y-8">
                    {filteredModules.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/10 border border-slate-850 rounded-3xl border-dashed">
                            <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-slate-400 font-medium">No module data found matching the selected filters.</p>
                        </div>
                    ) : (
                        filteredModules.map((m) => {
                            const answers = m.response?.data || {};
                            const questions = m.module.schema.questions || [];
                            const testType = m.module.schema.testType;

                            const hasResponse = m.response && Object.keys(answers).length > 0;

                            // Filter questions based on search query or dependency
                            const visibleQuestions = questions.filter(q => {
                                // Match search query
                                const matchesSearch = !searchQuery || 
                                    q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                    (answers[q.id] && String(answers[q.id]).toLowerCase().includes(searchQuery.toLowerCase()));
                                
                                return matchesSearch;
                            });

                            if (!hasResponse) {
                                return (
                                    <div key={m.id} className="bg-slate-900/30 border border-slate-850 rounded-2xl p-6 opacity-60 print:hidden">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h3 className="text-base font-bold text-slate-400">#{m.order}. {m.module.title}</h3>
                                                <p className="text-xs text-slate-500 mt-1">{m.module.description}</p>
                                            </div>
                                            <span className="px-2 py-0.5 bg-slate-950 text-slate-500 rounded text-[10px] uppercase font-bold border border-slate-850">Not Submitted</span>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={m.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden page-break-after">
                                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40" />

                                    {/* Module Header */}
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-800 pb-4 gap-2">
                                        <div>
                                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                                <span className="text-indigo-400 font-bold text-sm">#{m.order}</span>
                                                {m.module.title}
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">{m.module.description}</p>
                                        </div>
                                        <div className="flex gap-2 items-center flex-shrink-0">
                                            <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">Filled by {m.filledBy}</span>
                                            <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">{m.status}</span>
                                        </div>
                                    </div>

                                    {/* Render Scored Test Details ifScored */}
                                    {testType && answers.__scored && (
                                        <div className="bg-slate-950/60 border border-indigo-900/20 rounded-2xl p-5 space-y-4">
                                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-900 pb-2">
                                                Computed Test Results ({testType})
                                            </div>
                                            <pre className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[300px]">
                                                {JSON.stringify(answers.__scored.scores, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    {/* Render Self Discovery Specialized Questions */}
                                    {testType === 'SELF_DISCOVERY' && (
                                        <div className="space-y-4">
                                            {Object.entries(answers).map(([key, val]) => {
                                                if (key === '__scored' || key === '__testData') return null;
                                                const qText = SELF_DISCOVERY_QUESTIONS[key];
                                                if (!qText) return null;

                                                // Filter based on search query
                                                if (searchQuery && !qText.toLowerCase().includes(searchQuery.toLowerCase()) && !String(val).toLowerCase().includes(searchQuery.toLowerCase())) {
                                                    return null;
                                                }

                                                const isEditingThis = editingModuleId === m.id && editingKey === key;

                                                return (
                                                    <div key={key} className="space-y-2 border-b border-slate-850 pb-4 last:border-b-0 group">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <p className="text-slate-300 font-semibold text-sm leading-relaxed">{qText}</p>
                                                            {!isEditingThis && (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingModuleId(m.id);
                                                                        setEditingKey(key);
                                                                        setEditingValue(val);
                                                                    }}
                                                                    className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-400 hover:underline transition-colors uppercase tracking-wider shrink-0 mt-0.5 print:hidden"
                                                                >
                                                                    Edit
                                                                </button>
                                                            )}
                                                        </div>

                                                        {isEditingThis ? (
                                                            <div className="space-y-2 pt-2">
                                                                <textarea
                                                                    value={editingValue}
                                                                    onChange={e => setEditingValue(e.target.value)}
                                                                    rows={3}
                                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleSaveAnswer(m.id, key, editingValue)}
                                                                        disabled={saving}
                                                                        className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50"
                                                                    >
                                                                        {saving ? 'Saving...' : 'Save'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setEditingKey(null); setEditingModuleId(null); }}
                                                                        className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap pl-4 border-l border-slate-800 mt-1">
                                                                {String(val) || <span className="italic text-slate-600">Not answered</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Render Dynamic Questions & Answers (Modules 1-11) */}
                                    {!testType && visibleQuestions.length > 0 && (
                                        <div className="space-y-6">
                                            {visibleQuestions.map((q) => {
                                                const value = answers[q.id];
                                                const isEditingThis = editingModuleId === m.id && editingKey === q.id;

                                                return (
                                                    <div key={q.id} className="space-y-2 border-b border-slate-850 pb-4 last:border-0 group">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div>
                                                                <p className="text-slate-300 font-semibold text-sm leading-relaxed">{q.question}</p>
                                                                {q.description && <p className="text-[10px] text-slate-500 mt-0.5">{q.description}</p>}
                                                            </div>
                                                            {!isEditingThis && (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingModuleId(m.id);
                                                                        setEditingKey(q.id);
                                                                        setEditingValue(value);
                                                                    }}
                                                                    className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-400 hover:underline transition-colors uppercase tracking-wider shrink-0 mt-0.5 print:hidden"
                                                                >
                                                                    Edit
                                                                </button>
                                                            )}
                                                        </div>

                                                        {isEditingThis ? (
                                                            <div className="space-y-2 pt-2">
                                                                {q.type === 'choice' && q.options ? (
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {q.options.map(opt => (
                                                                            <button 
                                                                                key={opt.id} 
                                                                                onClick={() => setEditingValue([opt.id])}
                                                                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all ${
                                                                                    (Array.isArray(editingValue) ? editingValue.includes(opt.id) : editingValue === opt.id)
                                                                                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                                                                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                                                                                }`}
                                                                            >{opt.text}</button>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <textarea
                                                                        value={typeof editingValue === 'object' ? JSON.stringify(editingValue, null, 2) : (editingValue ?? '')}
                                                                        onChange={e => {
                                                                            try {
                                                                                setEditingValue(JSON.parse(e.target.value));
                                                                            } catch {
                                                                                setEditingValue(e.target.value);
                                                                            }
                                                                        }}
                                                                        rows={3}
                                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                                                    />
                                                                )}
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleSaveAnswer(m.id, q.id, editingValue)}
                                                                        disabled={saving}
                                                                        className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50"
                                                                    >
                                                                        {saving ? 'Saving...' : 'Save'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setEditingKey(null); setEditingModuleId(null); }}
                                                                        className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-slate-400 text-sm leading-relaxed pl-4 border-l border-slate-800 mt-1 whitespace-pre-wrap">
                                                                {Array.isArray(value) ? (
                                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                                        {value.map((valItem: any, idx) => (
                                                                            <span key={idx} className="px-2.5 py-1 bg-slate-950/80 rounded-lg text-xs text-slate-300 border border-slate-850">
                                                                                {typeof valItem === 'object' ? JSON.stringify(valItem) : String(valItem)}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : typeof value === 'object' ? (
                                                                    <pre className="text-xs bg-slate-950 p-3 rounded-lg border border-slate-850 overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
                                                                ) : isFileUrl(value) ? (
                                                                    <a href={value} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1.5 text-xs font-semibold">
                                                                        📄 View Document File
                                                                    </a>
                                                                ) : (
                                                                    String(value) || <span className="italic text-slate-600">Not answered</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* If no questions but standard test answers exist (Fallbacks for VALUES, RIASEC, COLOR etc) */}
                                    {testType && testType !== 'SELF_DISCOVERY' && !answers.__scored && (
                                        <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl text-xs text-slate-400 max-h-40 overflow-y-auto">
                                            <p className="font-semibold uppercase text-slate-500 tracking-wider mb-2">Raw Data responses</p>
                                            <pre>{JSON.stringify(answers, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

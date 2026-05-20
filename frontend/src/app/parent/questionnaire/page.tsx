"use client";
import React, { useState, useEffect } from 'react';

const parentQuestions = [
    { id: 'q1', type: 'text', text: "What are your child's primary strengths as you observe them at home?" },
    { id: 'q2', type: 'text', text: "What career paths or industries has your child expressed interest in?" },
    { id: 'q3', type: 'text', text: "Are there any specific concerns you have regarding their career planning?" },
    { id: 'q4', type: 'select', text: "How would you prefer to be involved in the mentoring process?", options: ["Regular updates only", "Monthly meetings", "Active participation in milestones"] }
];

export default function ParentQuestionnairePage() {
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchQuestionnaire = async () => {
            try {
                const res = await fetch('/api/parent/questionnaire');
                const data = await res.json();
                if (data.questionnaire) {
                    setResponses(data.questionnaire.responses);
                    setSubmitted(true);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setFetching(false);
            }
        };
        fetchQuestionnaire();
    }, []);

    const handleChange = (qId: string, val: string) => {
        setResponses(prev => ({ ...prev, [qId]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/parent/questionnaire', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responses })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to submit');
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in text-slate-100">
            <div className="bg-white/5 border shadow-sm rounded-2xl p-8 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tight text-slate-100 mb-2">Parent Questionnaire</h1>
                <p className="text-slate-200 mb-8">Provide insights into your child's personality, interests, and strengths. Our experts use this information to create a holistic career trajectory.</p>

                {submitted ? (
                    <div className="bg-emerald-500/10 border border-emerald-200 p-8 rounded-xl text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-800 mb-2">Thank you!</h2>
                        <p className="text-emerald-400">Your insights have been securely submitted to the career expert. They will be reviewed shortly.</p>

                        <div className="mt-8 text-left border-t border-emerald-200 pt-6">
                            <h3 className="font-bold text-emerald-900 mb-4 uppercase tracking-widest text-xs">Your Responses</h3>
                            <ul className="space-y-4">
                                {parentQuestions.map(q => (
                                    <li key={q.id}>
                                        <p className="text-sm font-medium text-emerald-800 mb-1">{q.text}</p>
                                        <p className="text-emerald-900 font-bold bg-white/50 p-2 rounded-lg">{responses[q.id] || 'N/A'}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && <div className="text-rose-600 text-sm bg-rose-50 p-3 rounded-md border border-rose-200">{error}</div>}

                        <div className="space-y-6">
                            {parentQuestions.map((q) => (
                                <div key={q.id} className="bg-white/5 p-6 rounded-xl border border-white/5">
                                    <label className="block text-slate-200 font-bold mb-3">{q.text}</label>
                                    {q.type === 'text' ? (
                                        <textarea
                                            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 h-28 resize-none shadow-sm"
                                            placeholder="Type your response here..."
                                            value={responses[q.id] || ''}
                                            onChange={(e) => handleChange(q.id, e.target.value)}
                                            required
                                        />
                                    ) : (
                                        <select
                                            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                                            value={responses[q.id] || ''}
                                            onChange={(e) => handleChange(q.id, e.target.value)}
                                            required
                                        >
                                            <option value="" disabled>Select an option</option>
                                            {q.options?.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-white/5">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center min-w-[160px] shadow-sm"
                            >
                                {loading ? 'Submitting...' : 'Submit Insights'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

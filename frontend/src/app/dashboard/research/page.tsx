"use client";
import React, { useState } from 'react';

export default function AIResearchPage() {
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch('/api/client/research/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to fetch research');
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-slate-200">
            <div className="bg-white/5 border shadow-sm rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100">AI Research Assistant</h1>
                </div>
                <p className="text-slate-400 mb-8 pl-16">Ask the AI to research any career topic, and it will provide material and useful links.</p>

                <form onSubmit={handleSearch} className="mb-8">
                    <div className="relative">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. How to become a Data Scientist in India"
                            className="w-full pl-6 pr-32 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-inner text-lg"
                        />
                        <button
                            type="submit"
                            disabled={loading || !topic.trim()}
                            className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                        >
                            {loading ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Research'}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl mb-8">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="p-6 bg-white/5 rounded-xl border border-white/5">
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Topic Material
                            </h2>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{result.material}</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white/5 rounded-xl border shadow-sm">
                                <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    Helpful Links
                                </h2>
                                <ul className="space-y-3">
                                    {result.topicUrls?.map((url: string, i: number) => (
                                        <li key={i}>
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-start gap-2 break-all text-sm">
                                                <span className="shrink-0 mt-0.5">•</span>
                                                {url}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-6 bg-white/5 rounded-xl border shadow-sm">
                                <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    YouTube Resources
                                </h2>
                                <ul className="space-y-3">
                                    {result.youtubeUrls?.map((url: string, i: number) => (
                                        <li key={i}>
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:text-rose-800 hover:underline flex items-start gap-2 break-all text-sm">
                                                <span className="shrink-0 mt-0.5">•</span>
                                                {url}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

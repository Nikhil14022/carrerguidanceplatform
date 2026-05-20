"use client";
import React, { useState, useEffect } from 'react';

interface ResearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    careerId: string;
    careerTitle: string;
}

export default function ResearchModal({ isOpen, onClose, careerId, careerTitle }: ResearchModalProps) {
    const [research, setResearch] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && careerId) {
            generateResearch();
        } else {
            setResearch(null);
            setError('');
        }
    }, [isOpen, careerId]);

    const generateResearch = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/client/research/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ careerOptionId: careerId })
            });
            const data = await res.json();
            if (res.ok) {
                setResearch(data);
            } else {
                setError(data.error || 'Failed to generate research');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5/[0.02]">
                    <div>
                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Career Deep-Dive</div>
                        <h2 className="text-2xl font-bold tracking-tight">{careerTitle}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                            <div className="text-center">
                                <p className="text-sm font-bold uppercase tracking-widest text-indigo-400">Synthesizing Research...</p>
                                <p className="text-xs text-slate-500 mt-1 italic">Fetching pathways, salary trends, and lifestyle data...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="h-64 flex items-center justify-center text-red-400 font-bold">{error}</div>
                    ) : research ? (
                        <>
                            {/* Pathway */}
                            <section className="space-y-4">
                                <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                    Educational & Career Pathway
                                </h3>
                                <div className="p-6 rounded-2xl bg-white/5/[0.02] border border-white/5 text-slate-300 leading-relaxed whitespace-pre-line">
                                    {research.pathway}
                                </div>
                            </section>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Skills */}
                                <section className="space-y-4">
                                    <h3 className="text-purple-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        Required Skill Stack
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {research.skills?.map((skill: string, i: number) => (
                                            <span key={i} className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/10">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </section>

                                {/* India vs Abroad */}
                                <section className="space-y-4">
                                    <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2 2 2 0 012 2v.6b3.333 3.333 0 01-1 2.227" /></svg>
                                        India vs. Abroad
                                    </h3>
                                    <p className="text-xs text-slate-400 leading-relaxed italic">
                                        {research.indiaVsAbroad}
                                    </p>
                                </section>
                            </div>

                            {/* Lifestyle */}
                            <section className="space-y-4">
                                <h3 className="text-orange-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Lifestyle & Work-Life Balance
                                </h3>
                                <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-slate-300 text-sm leading-relaxed">
                                    {research.lifestyle}
                                </div>
                            </section>

                            {/* Personalized Gaps */}
                            <section className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                                <h3 className="text-indigo-400 font-bold text-sm mb-3">Personalized Gap Resolution</h3>
                                <p className="text-xs text-slate-400 leading-relaxed italic whitespace-pre-line">
                                    {research.gaps}
                                </p>
                            </section>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all">
                        Close Research
                    </button>
                </div>
            </div>
        </div>
    );
}

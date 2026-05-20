"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ParentDashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [linkCode, setLinkCode] = useState('');
    const [linking, setLinking] = useState(false);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await fetch('/api/parent/dashboard', {
                cache: 'no-store'
            });
            const result = await res.json();

            if (res.ok) {
                setData(result);
                setError('');
            } else if (res.status === 404) {
                setError('LINK_REQUIRED');
            } else {
                setError(result.error || 'Failed to load dashboard');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleLink = async () => {
        if (!linkCode) return;
        setLinking(true);
        try {
            const res = await fetch('/api/parent/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ childLinkCode: linkCode })
            });
            const result = await res.json();
            if (res.ok) {
                setError('');
                fetchDashboard();
            } else {
                alert(result.error || 'Failed to link account');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            setLinking(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error === 'LINK_REQUIRED') {
        return (
            <div className="p-8 h-full flex items-center justify-center">
                <div className="glass-card p-12 max-w-md text-center space-y-6">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold">Link Your Child</h2>
                    <p className="text-slate-500">You need to link your account to your child's profile to view their progress.</p>
                    <div className="space-y-4">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest text-center">Ask your child for their Profile ID</p>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Enter Profile ID"
                                value={linkCode}
                                onChange={(e) => setLinkCode(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-center font-mono text-sm"
                            />
                            <button
                                onClick={handleLink}
                                disabled={linking || !linkCode}
                                className="btn-primary w-full py-3 text-sm font-bold uppercase tracking-widest disabled:opacity-50"
                            >
                                {linking ? 'Linking...' : 'Link Child Account'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 h-full flex items-center justify-center">
                <div className="text-red-400 font-bold">{error}</div>
            </div>
        );
    }

    // Guard against high stage numbers (max 8 stages)
    const currentStage = (data?.stats?.currentStage > 8 ? 8 : (data?.stats?.currentStage || 1));

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Parent Portal</h1>
                    <p className="text-slate-500 mt-1">Viewing journey for <span className="text-white font-bold">{data?.child?.name || 'Child'}</span></p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <div className={`w-2 h-2 rounded-full ${data?.stats?.journeyStatus === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'}`} />
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{data?.stats?.journeyStatus || 'In Progress'}</span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border-indigo-500/10 bg-indigo-500/5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Overall Progress</div>
                    <div className="text-3xl font-black text-white">{data?.stats?.progress || 0}%</div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 mt-3">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${data?.stats?.progress || 0}%` }} />
                    </div>
                </div>
                <div className="glass-card p-6">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Modules Approved</div>
                    <div className="text-3xl font-black text-indigo-400">{data?.stats?.completed || 0} / {data?.stats?.total || 7}</div>
                </div>
                <div className="glass-card p-6">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Stage</div>
                    <div className="text-3xl font-black text-white">{currentStage}</div>
                </div>
            </div>

            {/* Child's Career Report */}
            {data?.report && data.report.careerOptions?.length > 0 && (
                <div className="glass-card p-8 space-y-6 border-indigo-500/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">AI Career Analysis Results</h2>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Your child's recommended career paths</p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {data.report.careerOptions.map((opt: any, i: number) => (
                            <div key={i} className="p-5 rounded-xl bg-white/5/[0.02] border border-white/5 hover:border-indigo-500/20 transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-white">{opt.title}</h3>
                                    <span className="text-indigo-400 font-black text-lg">{opt.match}%</span>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed">{opt.reasoning}</p>
                            </div>
                        ))}
                    </div>

                    {data.report.content && !data.report.content.includes('Pending') && (
                        <div className="p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Professional Persona Summary</h3>
                            <p className="text-sm text-slate-400 leading-relaxed line-clamp-4">{data.report.content}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Privacy Note */}
            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-amber-400">Privacy Protected</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">As a child-privacy-first platform, you can see progress and stage completion but cannot access private questionnaire responses.</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
                <button
                    onClick={() => router.push('/parent/progress')}
                    className="glass-card p-8 group hover:border-indigo-500/30 transition-all text-left"
                >
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-indigo-400 transition-colors">View Journey Timeline</h3>
                    <p className="text-sm text-slate-500 mt-1">See exactly when each milestone was reached and which stage is next.</p>
                </button>
                <div className="glass-card p-8 group border-slate-800/50 transition-all text-left">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold">Expert Consultation</h3>
                    <p className="text-sm text-slate-500 mt-1">Coming Soon: Connect with an expert once your child reaches the final stage.</p>
                </div>
            </div>
        </div>
    );
}

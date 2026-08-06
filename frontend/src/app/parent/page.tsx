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
            <div className="h-full flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error === 'LINK_REQUIRED') {
        return (
            <div className="p-8 h-full flex items-center justify-center text-slate-800">
                <div className="bg-white border border-slate-200 rounded-2xl p-12 max-w-md text-center space-y-6 shadow-sm">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Link Your Child</h2>
                    <p className="text-slate-650">You need to link your account to your child's profile to view their progress.</p>
                    <div className="space-y-4">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest text-center">Ask your child for their Profile ID</p>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Enter Profile ID"
                                value={linkCode}
                                onChange={(e) => setLinkCode(e.target.value)}
                                className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-center font-mono text-sm"
                            />
                            <button
                                onClick={handleLink}
                                disabled={linking || !linkCode}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm uppercase tracking-widest disabled:opacity-50 hover:bg-indigo-700 transition cursor-pointer"
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
                <div className="text-red-650 font-bold">{error}</div>
            </div>
        );
    }

    const activeStage = data?.stages?.find((s: any) => s.status === 'IN_PROGRESS')?.stageName || 'None';

    return (
        <div className="p-8 space-y-8 animate-fade-in text-slate-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Parent Portal</h1>
                    <p className="text-slate-600 mt-1">Viewing journey for <span className="text-indigo-600 font-bold">{data?.child?.name || 'Child'}</span></p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-150">
                    <div className={`w-2 h-2 rounded-full ${data?.stats?.journeyStatus === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'}`} />
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest">{data?.stats?.journeyStatus || 'In Progress'}</span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Overall Progress</div>
                    <div className="text-3xl font-black text-slate-900">{data?.stats?.progress || 0}%</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${data?.stats?.progress || 0}%` }} />
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Modules Approved</div>
                    <div className="text-3xl font-black text-indigo-650">{data?.stats?.completed || 0} / {data?.stats?.total || 7}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Stage</div>
                    <div className="text-sm font-bold text-slate-900 truncate" title={activeStage}>{activeStage}</div>
                </div>
            </div>

            {/* Child's Career Report */}
            {data?.report && data.report.careerOptions?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">AI Career Analysis Results</h2>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Your child's recommended career paths</p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {data.report.careerOptions.map((opt: any, i: number) => (
                            <div key={i} className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-slate-900">{opt.title}</h3>
                                    <span className="text-indigo-650 font-black text-lg">{opt.match}%</span>
                                </div>
                                <p className="text-sm text-slate-650 leading-relaxed font-medium">{opt.reasoning}</p>
                            </div>
                        ))}
                    </div>

                    {data.report.content && !data.report.content.includes('Pending') && (
                        <div className="p-5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-widest mb-2">Professional Persona Summary</h3>
                            <p className="text-sm text-slate-700 leading-relaxed line-clamp-4 font-medium">{data.report.content}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Privacy Note */}
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-amber-800">Privacy Protected</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">As a child-privacy-first platform, you can see progress and stage completion but cannot access private questionnaire responses.</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
                <button
                    onClick={() => router.push('/parent/progress')}
                    className="bg-white border border-slate-200 rounded-2xl p-8 group hover:border-indigo-400 transition-all text-left shadow-sm cursor-pointer"
                >
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-indigo-650 transition-colors text-slate-900">View Journey Timeline</h3>
                    <p className="text-sm text-slate-600 mt-1">See exactly when each milestone was reached and which stage is next.</p>
                </button>
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-left shadow-sm">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Expert Consultation</h3>
                    <p className="text-sm text-slate-600 mt-1">Coming Soon: Connect with an expert once your child reaches the final stage.</p>
                </div>
            </div>
        </div>
    );
}

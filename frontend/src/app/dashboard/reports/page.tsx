"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ReportsListPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchReports();
        }
    }, [status]);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/client/dashboard');
            const data = await res.json();
            setReports(data.reports || []);
        } catch (err) {
            console.error('Failed to fetch reports', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="max-w-5xl mx-auto space-y-12">
                <header className="flex justify-between items-center">
                    <div>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-xs font-bold text-slate-500 hover:text-indigo-400 mb-4 flex items-center gap-2 uppercase tracking-widest"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={2} /></svg>
                            Back to Dashboard
                        </button>
                        <h1 className="text-4xl font-bold tracking-tight">Your Career Reports</h1>
                        <p className="text-slate-500 mt-2">Access all your AI-synthesized career guidance and trajectories.</p>
                    </div>
                </header>

                {reports.length === 0 ? (
                    <div className="glass-card p-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold">No reports generated yet</h2>
                        <p className="text-slate-500 max-w-sm mx-auto">Complete all assessment modules in the dashboard to unlock your personalized AI Career Synthesis.</p>
                        <button onClick={() => router.push('/dashboard')} className="btn-primary px-8 py-2 text-sm mt-4">Go to Modules</button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {reports.map((report) => (
                            <div
                                key={report.id}
                                onClick={() => router.push(`/dashboard/reports/${report.id}`)}
                                className="glass-card p-8 border hover:border-indigo-500/30 transition-all group cursor-pointer flex justify-between items-center"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                        <h3 className="text-xl font-bold group-hover:text-indigo-400 transition-colors uppercase tracking-tight">AI Career Analysis</h3>
                                    </div>
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                    <p className="text-slate-400 line-clamp-1 max-w-xl text-sm">{report.content}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status</div>
                                        <div className="text-sm font-bold text-indigo-400 uppercase tracking-tighter">Ready</div>
                                    </div>
                                    <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

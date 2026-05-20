'use client';
import React, { useState, useEffect } from 'react';

export default function AdminAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/admin/analytics');
                const json = await res.json();
                if (res.ok) {
                    setData(json);
                }
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
    );

    const kpis = [
        { label: 'Active Clients', val: data?.kpis?.activeClients || '0', trend: '+12%', color: 'indigo' },
        { label: 'Modules Under Review', val: data?.kpis?.modulesUnderReview || '0', trend: '-2', color: 'amber' },
        { label: 'Pending Appointments', val: data?.kpis?.pendingAppointments || '0', trend: '+3', color: 'orange' },
        { label: 'Avg Completion Rate', val: data?.kpis?.avgCompletionRate || '0%', trend: '+5%', color: 'emerald' },
    ];

    const stageDistribution = data?.stageDistribution || [];
    const expertWorkload = data?.expertWorkload || [];

    return (
        <div className="space-y-8 animate-fade-in text-slate-300">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Platform Analytics</h1>
                <p className="text-slate-500 mt-1">Live metrics on client engagement and expert workload.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="glass-card p-6 shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{kpi.label}</div>
                        <div className="flex items-end justify-between">
                            <div className="text-3xl font-black text-white">{kpi.val}</div>
                            <div className={`text-xs font-bold ${kpi.trend.startsWith('+') ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {kpi.trend} this week
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Chart 1: Workflow Progression */}
                <div className="glass-card p-6 shadow-sm">
                    <h3 className="font-bold text-white mb-6">Client Distribution by Stage</h3>
                    <div className="space-y-6">
                        {stageDistribution.map((item: any, idx: number) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-300">{item.stage}</span>
                                    <span className="font-bold text-white">{item.count} clients</span>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${item.pct}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart 2: Expert Workload */}
                <div className="glass-card p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white">Expert Workload</h3>
                        <span className="text-xs font-bold px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-md">Real-time</span>
                    </div>

                    <div className="space-y-4">
                        {expertWorkload.map((expert: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                                    {expert.name[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm text-white">{expert.name}</div>
                                    <div className="flex gap-4 mt-1">
                                        <div className="text-xs text-slate-400"><span className="font-bold text-slate-300">{expert.reviews}</span> module reviews</div>
                                        <div className="text-xs text-slate-400"><span className="font-bold text-slate-300">{expert.sessions}</span> sessions</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h4 className="font-bold text-orange-900">Export Analytics Report</h4>
                    <p className="text-sm text-orange-800/80 mt-1">Download a full CSV breakdown of all platform metrics for external auditing.</p>
                </div>
                <button className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-md transition-colors shrink-0 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                </button>
            </div>
        </div>
    );
}

"use client";
import React, { useEffect, useState } from 'react';

export default function AdminReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => { fetchReports(); }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/admin/clients');
            const data = await res.json();
            const allReports: any[] = [];
            for (const client of (data.clients || [])) {
                const detailRes = await fetch(`/api/admin/clients/${client.id}`);
                const detailData = await detailRes.json();
                if (detailData.client?.reports) {
                    detailData.client.reports.forEach((r: any) => {
                        allReports.push({ ...r, clientName: client.name || 'Unnamed', clientEmail: client.email });
                    });
                }
            }
            setReports(allReports);
        } catch (err) {
            console.error('Failed to fetch reports', err);
        } finally {
            setLoading(false);
        }
    };

    const statusColor = (s: string) => {
        switch (s) {
            case 'FINALIZED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'HUMAN_REVIVING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default: return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
        }
    };

    const filtered = reports.filter(r => filter === 'all' || r.status === filter);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Report Management</h1>
                    <p className="text-slate-500 mt-1">{reports.length} reports across all clients</p>
                </div>
                <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
                    {['all', 'AI_GENERATED', 'HUMAN_REVIVING', 'FINALIZED'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-orange-500/20 text-orange-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {f === 'all' ? 'All' : f.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="glass-card p-16 text-center space-y-3">
                    <div className="text-slate-400 text-lg font-bold">No reports found</div>
                    <p className="text-slate-300 text-sm">Reports appear here once clients complete modules and AI analysis is triggered.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map(report => (
                        <a key={report.id} href={`/admin/reports/${report.id}`} className="glass-card p-6 hover:border-orange-500/20 transition-all group flex justify-between items-center">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    <h3 className="font-bold group-hover:text-orange-400 transition-colors">Career Analysis — {report.clientName}</h3>
                                </div>
                                <div className="text-xs text-slate-500">{report.clientEmail} · {report.careerOptions?.length || 0} career options</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${statusColor(report.status)}`}>
                                    {report.status.replace('_', ' ')}
                                </span>
                                <svg className="w-5 h-5 text-slate-400 group-hover:text-orange-400 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

"use client";
import React, { useEffect, useState } from 'react';

interface ClientModule {
    id: string;
    status: string;
    module: { title: string; schema: any };
    response?: { data: any; submittedAt: string } | null;
}

interface Client {
    id: string;
    currentStage: number;
    journeyStatus: string;
    permissions?: string[];
    assignedAt?: string;
    user: { name: string; email: string; createdAt: string };
    modules: ClientModule[];
    reports: { id: string; status: string }[];
}

export default function MentorDashboardPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/mentor/dashboard');
            if (res.ok) {
                const data = await res.json();
                setClients(data.clients);
                setRole(data.role);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filtered = clients.filter(c => {
        const matchesFilter = filter === 'all' || c.journeyStatus.toLowerCase() === filter.toLowerCase();
        const matchesSearch = !search ||
            c.user.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.user.email?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getTestBadges = (modules: ClientModule[]) => {
        const badges: { label: string; value: string; color: string }[] = [];
        for (const mod of modules) {
            const testType = mod.module?.schema?.testType;
            const scored = (mod.response?.data as any)?.__scored;
            if (!testType || !scored?.scores) continue;

            if (testType === '16PF') {
                badges.push({ label: 'MBTI', value: scored.scores.type, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' });
            } else if (testType === 'RIASEC') {
                badges.push({ label: 'Holland', value: scored.scores.hollandCode, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' });
            } else if (testType === 'COLOR') {
                badges.push({ label: 'Color', value: `${scored.scores.primaryColor}/${scored.scores.secondaryColor}`, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' });
            }
        }
        return badges;
    };

    const statusColor = (s: string) => {
        switch (s?.toLowerCase()) {
            case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'in progress': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'started': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            default: return 'text-slate-400 bg-white/50/10 border-slate-500/20';
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    const activeClients = clients.filter(c => c.journeyStatus === 'In Progress' || c.journeyStatus === 'Started').length;
    const pendingReviews = clients.reduce((acc, c) => acc + c.modules.filter(m => m.status === 'SUBMITTED' || m.status === 'UNDER_REVIEW').length, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Clients</h1>
                    <p className="text-slate-500 mt-1">
                        {role === 'SUPER_ADMIN' || role === 'ADMIN'
                            ? 'All clients on the platform'
                            : `${clients.length} client${clients.length !== 1 ? 's' : ''} assigned to you`}
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative">
                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 placeholder:text-slate-400 focus:outline-none focus:border-orange-500/30 w-64"
                        />
                    </div>
                    {/* Filter */}
                    <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
                        {['all', 'started', 'in progress', 'completed'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-orange-500/20 text-orange-400' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Clients', value: clients.length, color: 'text-slate-100' },
                    { label: 'Active', value: activeClients, color: 'text-indigo-600' },
                    { label: 'Pending Reviews', value: pendingReviews, color: 'text-amber-500' },
                    { label: 'Total Reports', value: clients.reduce((acc, c) => acc + c.reports.length, 0), color: 'text-emerald-500' },
                ].map(s => (
                    <div key={s.label} className="bg-white/5 rounded-2xl border border-white/10 shadow-sm p-6">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{s.label}</div>
                        <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Client Table */}
            {filtered.length === 0 ? (
                <div className="bg-white/5 rounded-2xl border border-white/10 border-dashed p-16 text-center space-y-3 shadow-sm">
                    <div className="text-slate-400 text-lg font-bold">No clients found</div>
                    <p className="text-slate-500 text-sm">Adjust your filters or assignments.</p>
                </div>
            ) : (
                <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
                    <table className="w-full text-left bg-white/5">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Client</th>
                                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Journey Focus</th>
                                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Modules Status</th>
                                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Test Results</th>
                                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                                <th className="py-4 px-6 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(client => {
                                const completedModules = client.modules.filter(m => m.status === 'APPROVED').length;
                                const pending = client.modules.filter(m => m.status === 'SUBMITTED' || m.status === 'UNDER_REVIEW').length;

                                return (
                                    <tr key={client.id} className="border-b border-white/10 hover:bg-white/5 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-sm text-slate-100">{client.user.name || 'Unnamed'}</div>
                                            <div className="text-xs text-slate-500 mt-1">{client.user.email}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm font-medium text-slate-300">Stage {client.currentStage}</div>
                                            {client.assignedAt && <div className="text-[10px] text-slate-500 mt-1">Assigned: {new Date(client.assignedAt).toLocaleDateString()}</div>}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-xs font-medium text-slate-400">{completedModules} / {client.modules.length} modules completed</div>
                                                {pending > 0 && <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-1">⚠ {pending} Pending Review</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-wrap gap-1">
                                                {getTestBadges(client.modules).map(b => (
                                                    <span key={b.label} className={`px-2 py-0.5 rounded-md border text-[9px] font-bold ${b.color}`}>
                                                        {b.label}: {b.value}
                                                    </span>
                                                ))}
                                                {getTestBadges(client.modules).length === 0 && (
                                                    <span className="text-[10px] text-slate-600 italic">No tests scored</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${statusColor(client.journeyStatus)}`}>
                                                {client.journeyStatus}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <a
                                                href={`/mentor/clients/${client.id}`}
                                                className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-600 text-[10px] font-bold uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-colors inline-block"
                                            >
                                                Mentor view
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

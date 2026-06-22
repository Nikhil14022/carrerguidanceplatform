"use client";
import React, { useEffect, useState } from 'react';

interface Query {
    id: string;
    subject: string;
    message: string;
    status: string;
    priority: string;
    createdAt: string;
    clientProfile: { user: { name: string; email: string } };
    messages: { content: string; senderRole: string; createdAt: string }[];
}

export default function AdminQueriesPage() {
    const [queries, setQueries] = useState<Query[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => { fetchQueries(); }, []);

    const fetchQueries = async () => {
        try {
            const res = await fetch('/api/admin/queries');
            if (res.ok) setQueries(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleStatusChange = async (queryId: string, newStatus: string) => {
        try {
            await fetch(`/api/admin/queries`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queryId, status: newStatus })
            });
            fetchQueries();
        } catch (err) { console.error(err); }
    };

    const handleReply = async () => {
        if (!reply.trim() || !selectedQuery) return;
        setSending(true);
        try {
            await fetch('/api/client/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queryId: selectedQuery.id, message: reply })
            });
            setReply('');
            fetchQueries();
            // Refresh selected query
            const updated = queries.find(q => q.id === selectedQuery.id);
            if (updated) setSelectedQuery(updated);
        } catch (err) { console.error(err); }
        finally { setSending(false); }
    };

    const filtered = queries.filter(q => filter === 'all' || q.status === filter);

    const statusColors: Record<string, string> = {
        OPEN: 'bg-red-500/10 text-red-400 border-red-500/20',
        IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        CLOSED: 'bg-white/50/10 text-slate-400 border-slate-500/20',
    };

    const priorityColors: Record<string, string> = {
        URGENT: 'text-red-400',
        HIGH: 'text-amber-400',
        MEDIUM: 'text-indigo-400',
        LOW: 'text-slate-500',
    };

    if (loading) return (
        <div className="h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Expert Queries</h1>
                    <p className="text-slate-500 mt-1 text-sm">Manage client support tickets and expert consultations</p>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{queries.length} total queries</span>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${filter === f ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'border-white/5 text-slate-500 hover:bg-white/5'}`}>
                        {f === 'all' ? 'All' : f.replace('_', ' ')}
                    </button>
                ))}
            </div>

            <div className="grid lg:grid-cols-[1fr_400px] gap-6">
                {/* Query List */}
                <div className="space-y-3">
                    {filtered.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <p className="text-slate-500">No queries found</p>
                        </div>
                    ) : filtered.map(q => (
                        <div key={q.id} onClick={() => setSelectedQuery(q)}
                            className={`glass-card p-5 cursor-pointer transition-all hover:border-indigo-500/30 ${selectedQuery?.id === q.id ? 'border-indigo-500/40 bg-indigo-500/5' : ''}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-slate-200">{q.subject || 'Support Request'}</h3>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {q.clientProfile?.user?.name || 'Unknown'} • {q.clientProfile?.user?.email || ''}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${priorityColors[q.priority] || 'text-slate-500'}`}>{q.priority}</span>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${statusColors[q.status] || statusColors.OPEN}`}>{q.status.replace('_', ' ')}</span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{q.message}</p>
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] text-slate-400">{new Date(q.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                                <span className="text-[10px] text-slate-400">{q.messages?.length || 0} messages</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Detail Panel */}
                <div className="glass-card p-6 space-y-4 sticky top-4 max-h-[80vh] overflow-y-auto">
                    {selectedQuery ? (
                        <>
                            <div>
                                <h2 className="text-lg font-bold text-white">{selectedQuery.subject || 'Support Request'}</h2>
                                <p className="text-xs text-slate-500 mt-1">{selectedQuery.clientProfile?.user?.name} • {new Date(selectedQuery.createdAt).toLocaleString()}</p>
                            </div>

                            <div className="p-3 rounded-xl bg-white/5/[0.02] border border-white/5 text-sm text-slate-400">{selectedQuery.message}</div>

                            {/* Status Actions */}
                            <div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Change Status</div>
                                <div className="flex gap-2 flex-wrap">
                                    {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
                                        <button key={s} onClick={() => handleStatusChange(selectedQuery.id, s)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedQuery.status === s ? statusColors[s] : 'border-white/5 text-slate-400 hover:bg-white/5'}`}>
                                            {s.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Messages Thread */}
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {(selectedQuery.messages || []).map((m, i) => (
                                    <div key={i} className={`p-3 rounded-xl text-xs ${m.senderRole === 'ADMIN' || m.senderRole === 'EXPERT' ? 'bg-indigo-500/5 border border-indigo-500/10 text-indigo-300 ml-4' : 'bg-white/5/[0.02] border border-white/5 text-slate-400 mr-4'}`}>
                                        <p>{m.content}</p>
                                        <span className="text-[9px] text-slate-400 mt-1 block">{m.senderRole} • {new Date(m.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Reply */}
                            <div className="flex gap-2">
                                <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Type a reply..."
                                    className="flex-1 bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                <button onClick={handleReply} disabled={!reply.trim() || sending}
                                    className="btn-primary px-4 py-2 text-xs font-bold uppercase tracking-widest">
                                    {sending ? '...' : 'Reply'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            <p className="text-sm text-slate-400">Select a query to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Module {
    id: string;
    title: string;
    description: string | null;
    schema: any;
    defaultOrder: number;
}

export default function ModuleManagerPage() {
    const router = useRouter();
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newModule, setNewModule] = useState({ title: '', description: '', schema: '{\n  "title": "New Module",\n  "type": "object",\n  "properties": {\n    "question1": {\n      "type": "string",\n      "title": "Your Question"\n    }\n  }\n}' });
    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            const res = await fetch('/api/admin/modules');
            const data = await res.json();
            setModules(data.modules || []);
        } catch (err) {
            console.error('Failed to fetch modules', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        setActionLoading(true);
        try {
            const schemaObj = JSON.parse(newModule.schema);
            const res = await fetch('/api/admin/modules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newModule.title,
                    description: newModule.description,
                    schema: schemaObj
                })
            });
            const data = await res.json();
            if (data.success) {
                setNotification({ type: 'success', msg: 'Module created successfully' });
                setIsCreating(false);
                setNewModule({ title: '', description: '', schema: '{\n  "title": "New Module",\n  "type": "object",\n  "properties": {\n    "question1": {\n      "type": "string",\n      "title": "Your Question"\n    }\n  }\n}' });
                fetchModules();
            } else {
                setNotification({ type: 'error', msg: data.error || 'Failed to create module' });
            }
        } catch (err) {
            setNotification({ type: 'error', msg: 'Invalid JSON schema or network error' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleReorder = async (moduleId: string, direction: 'up' | 'down') => {
        const index = modules.findIndex(m => m.id === moduleId);
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === modules.length - 1)) return;

        const newModules = [...modules];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newModules[index], newModules[swapIndex]] = [newModules[swapIndex], newModules[index]];

        // Just update local state for immediate feedback
        setModules(newModules);

        try {
            await fetch('/api/admin/modules/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newModules.map((m, i) => ({ moduleId: m.id, order: i + 1 })))
            });
        } catch (err) {
            console.error('Failed to save reorder', err);
            fetchModules(); // Rollback
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl border text-sm font-bold animate-in slide-in-from-top ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {notification.msg}
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Module Templates</h1>
                    <p className="text-slate-500 mt-1">Manage global questionnaire templates</p>
                </div>
                {!isCreating && (
                    <button onClick={() => setIsCreating(true)} className="btn-primary px-6 py-2 text-xs font-bold uppercase tracking-widest">
                        + Create New Module
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="glass-card p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">New Module Template</h2>
                        <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-slate-300">Cancel</button>
                    </div>
                    <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Title</label>
                                <input
                                    type="text"
                                    value={newModule.title}
                                    onChange={e => setNewModule({ ...newModule, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-orange-500/30"
                                    placeholder="e.g., Psychological Profiling"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                                <input
                                    type="text"
                                    value={newModule.description}
                                    onChange={e => setNewModule({ ...newModule, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-orange-500/30"
                                    placeholder="Brief description of the module"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">JSON Schema</label>
                            <textarea
                                value={newModule.schema}
                                onChange={e => setNewModule({ ...newModule, schema: e.target.value })}
                                className="w-full h-64 bg-slate-950 border border-white/10 rounded-xl p-4 text-xs font-mono text-indigo-300 focus:outline-none focus:border-orange-500/30 resize-none leading-relaxed"
                            />
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={actionLoading}
                            className="btn-primary w-full py-3 text-sm font-bold uppercase tracking-widest"
                        >
                            {actionLoading ? 'Creating...' : 'Create Template'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {modules.map((m, i) => (
                    <div key={m.id} className="glass-card p-6 flex justify-between items-center group">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => handleReorder(m.id, 'up')}
                                    disabled={i === 0}
                                    className="p-1 hover:text-orange-400 disabled:opacity-20 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                </button>
                                <button
                                    onClick={() => handleReorder(m.id, 'down')}
                                    disabled={i === modules.length - 1}
                                    className="p-1 hover:text-orange-400 disabled:opacity-20 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-slate-400 font-bold">#{m.defaultOrder}</span>
                                    <h3 className="font-bold">{m.title}</h3>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{m.description || 'No description'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Type</div>
                                <div className="text-sm font-bold text-slate-400">
                                    {m.schema.testType ? (
                                        <span className="text-indigo-400">Specialized Test</span>
                                    ) : (
                                        `${Object.keys(m.schema.properties || {}).length} Fields`
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => router.push(`/admin/modules/${m.id}`)}
                                className="p-2 rounded-lg bg-white/5 text-slate-500 hover:text-orange-400 border border-white/5 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

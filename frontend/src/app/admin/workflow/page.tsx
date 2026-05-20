"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminWorkflowPage() {
    const [modules, setModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const res = await fetch('/api/admin/workflow');
                const data = await res.json();
                if (res.ok && data.modules) {
                    setModules(data.modules);
                } else {
                    // Fallback to mock data if no modules exist yet
                    setModules([
                        { id: '1', title: 'Values Assessment', order: 1, isRequired: true },
                        { id: '2', title: 'Skills Inventory', order: 2, isRequired: true },
                        { id: '3', title: 'Personality Quiz', order: 3, isRequired: true },
                        { id: '4', title: 'Career Interests', order: 4, isRequired: false },
                        { id: '5', title: 'Parent Alignment', order: 5, isRequired: true },
                    ]);
                }
            } catch (err) {
                console.error('Failed to load workflow modules', err);
            } finally {
                setLoading(false);
            }
        };
        fetchModules();
    }, []);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));

        if (sourceIndex === targetIndex) return;

        const updatedModules = [...modules];
        const [draggedItem] = updatedModules.splice(sourceIndex, 1);
        updatedModules.splice(targetIndex, 0, draggedItem);

        // Update order properties
        const reordered = updatedModules.map((mod, index) => ({
            ...mod,
            order: index + 1
        }));

        setModules(reordered);
    };

    const saveWorkflow = async () => {
        setSaving(true);
        try {
            const payload = modules.map((m, idx) => ({ id: m.id, title: m.title, order: idx + 1 }));
            const res = await fetch('/api/admin/workflow', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modules: payload })
            });

            if (res.ok) {
                alert('Workflow sequence saved successfully to the database!');
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'Failed to save workflow.'}`);
            }
        } catch (err) {
            console.error('Failed to save workflow', err);
            alert('Network error while saving workflow.');
        } finally {
            setSaving(false);
        }
    };
    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100">Workflow Manager</h1>
                    <p className="text-slate-500 mt-1">Drag and drop to configure the default global assessment sequence.</p>
                </div>
                <button
                    onClick={saveWorkflow}
                    disabled={saving}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Publish Sequence'}
                </button>
            </div>

            <div className="bg-white/5 border rounded-2xl shadow-sm overflow-hidden max-w-4xl">
                <div className="bg-white/5 px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-slate-200">Global Module Sequence</h3>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{modules.length} Modules Active</div>
                </div>

                <div className="p-6 space-y-3">
                    {modules.map((mod, index) => (
                        <div
                            key={mod.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4 cursor-move hover:border-orange-400 hover:shadow-md transition-all group"
                        >
                            <div className="text-slate-300 group-hover:text-orange-500 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                            </div>

                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                                {mod.order}
                            </div>

                            <div className="flex-1">
                                <h4 className="font-bold text-slate-100">{mod.title}</h4>
                                <p className="text-xs text-slate-500">ID: {mod.id}</p>
                            </div>

                            <div>
                                <button
                                    onClick={() => {
                                        const updated = [...modules];
                                        updated[index].isRequired = !updated[index].isRequired;
                                        setModules(updated);
                                    }}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${mod.isRequired
                                        ? 'bg-emerald-100 text-emerald-400 hover:bg-emerald-200'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    {mod.isRequired ? 'Required' : 'Optional'}
                                </button>
                            </div>

                            <div className="pl-4 border-l border-white/5">
                                <button className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}

                    <button className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-slate-500 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-500/10 transition-all font-bold text-sm flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Module to Sequence
                    </button>
                </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 flex items-start gap-4 text-orange-800 max-w-4xl">
                <svg className="w-6 h-6 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                    <p className="font-bold mb-1">How Workflows Work</p>
                    <p className="opacity-80">This sequence determines the default journey for all new clients. Modules marked as required will enforce a hard stop, meaning the client cannot proceed to the next module until the required one is completed and approved by an expert. Optional modules can be skipped by the client.</p>
                </div>
            </div>
        </div>
    );
}

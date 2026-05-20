"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Workshop {
    id: string;
    title: string;
    description: string;
    date: string;
    meetLink: string | null;
    createdAt: string;
    enrollments: {
        id: string;
        clientProfileId: string;
        status: string;
        clientProfile: {
            user: { name: string; email: string };
        };
    }[];
}

export default function AdminWorkshopsPage() {
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Create form
    const [form, setForm] = useState({ title: '', description: '', date: '', meetLink: '' });

    useEffect(() => {
        setMounted(true);
        fetchWorkshops();
    }, []);

    const fetchWorkshops = async () => {
        try {
            const res = await fetch('/api/admin/workshops');
            if (res.ok) {
                const data = await res.json();
                setWorkshops(data.workshops || []);
                setSelectedWorkshop(prev => {
                    if (!prev) return null;
                    return data.workshops?.find((w: Workshop) => w.id === prev.id) || prev;
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const createWorkshop = async () => {
        if (!form.title || !form.date || !form.description) {
            alert("Please fill out all required fields: Title, Date & Time, and Description. Note: Make sure to fully complete the Date & Time field (including AM/PM if applicable).");
            return;
        }
        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/workshops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowCreate(false);
                setForm({ title: '', description: '', date: '', meetLink: '' });
                fetchWorkshops();
            } else {
                const data = await res.json();
                alert(`Creation failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const deleteWorkshop = async (id: string) => {
        if (!confirm('Are you sure you want to delete this workshop?')) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/workshops/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSelectedWorkshop(null);
                fetchWorkshops();
            } else {
                const data = await res.json();
                alert(`Deletion failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const updateEnrollmentStatus = async (enrollmentId: string, status: string) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/workshops/enrollments/${enrollmentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchWorkshops();
            } else {
                const data = await res.json();
                alert(`Update failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /></div>;

    return (
        <>
            <div className="space-y-6 animate-fade-in text-slate-200">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Workshop Management</h1>
                        <p className="text-slate-300 mt-1 text-sm">Schedule workshops, manage attendees, and review approvals.</p>
                    </div>
                    <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm shrink-0">+ Add Workshop</button>
                </div>

                <div className="grid lg:grid-cols-[1fr_400px] gap-6">
                    {/* Workshops List */}
                    <div className="space-y-3">
                        {workshops.length === 0 ? (
                            <div className="bg-white/5 border rounded-xl p-12 text-center shadow-sm">
                                <p className="text-slate-200 font-medium mb-4">No workshops scheduled. Click below to plan one.</p>
                                <button onClick={() => setShowCreate(true)} className="px-4 py-2 border border-white/20 rounded-lg text-slate-100 font-bold text-sm hover:bg-white/5 transition-colors">Add Workshop</button>
                            </div>
                        ) : workshops.map(w => {
                            const pendingCount = w.enrollments.filter(e => e.status === 'PENDING').length;
                            const approvedCount = w.enrollments.filter(e => e.status === 'APPROVED').length;
                            return (
                                <div key={w.id} onClick={() => setSelectedWorkshop(w)}
                                    className={`bg-white/5 border rounded-xl p-5 cursor-pointer transition-all shadow-sm hover:border-indigo-400 hover:shadow-md ${selectedWorkshop?.id === w.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-white/10'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-100">{w.title}</h3>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(w.date).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {pendingCount > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{pendingCount} Pending</span>}
                                            <span className="text-[10px] bg-emerald-100 text-emerald-400 px-2 py-0.5 rounded-full font-bold">{approvedCount} Approved</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-2 line-clamp-2">{w.description}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detail Panel */}
                    <div className={`bg-white/5 border shadow-sm rounded-xl p-6 space-y-5 sticky top-4 max-h-[80vh] overflow-y-auto ${selectedWorkshop ? 'block' : 'hidden lg:block'}`}>
                        {selectedWorkshop ? (
                            <>
                                <div className="flex justify-between items-start pb-4 border-b border-white/5">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-100">{selectedWorkshop.title}</h2>
                                        <p className="text-xs text-slate-500 font-medium">{new Date(selectedWorkshop.date).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => deleteWorkshop(selectedWorkshop.id)} disabled={actionLoading} className="text-[10px] text-rose-500 hover:text-rose-700 font-bold tracking-wider uppercase transition-colors px-2 py-1 bg-rose-50 rounded-md">Delete</button>
                                </div>

                                <div className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{selectedWorkshop.description}</div>

                                {selectedWorkshop.meetLink && (
                                    <div className="bg-indigo-500/10 border border-indigo-100 p-4 rounded-xl">
                                        <span className="text-[10px] text-indigo-800 font-bold uppercase tracking-widest block mb-1">Meeting Link</span>
                                        <a href={selectedWorkshop.meetLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline break-all">{selectedWorkshop.meetLink}</a>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-white/5">
                                    <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Attendee Management ({selectedWorkshop.enrollments.length})</h3>
                                    {selectedWorkshop.enrollments.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic">No attendees enrolled yet.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedWorkshop.enrollments.map(e => (
                                                <div key={e.id} className="p-3 rounded-lg border border-white/10 bg-white/5 flex items-center justify-between">
                                                    <div>
                                                        <span className="text-sm font-bold text-slate-100 block">{e.clientProfile.user.name || 'Unknown Client'}</span>
                                                        <span className="text-[10px] text-slate-500">{e.clientProfile.user.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${e.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-400' :
                                                            e.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {e.status}
                                                        </span>
                                                        {e.status === 'PENDING' && (
                                                            <div className="flex gap-1 ml-2">
                                                                <button onClick={() => updateEnrollmentStatus(e.id, 'APPROVED')} disabled={actionLoading} className="w-6 h-6 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-400 flex items-center justify-center transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></button>
                                                                <button onClick={() => updateEnrollmentStatus(e.id, 'REJECTED')} disabled={actionLoading} className="w-6 h-6 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <p className="text-sm text-slate-500 font-medium">Select a workshop to manage attendees</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreate && mounted && createPortal(
                <div className="fixed inset-0 flex items-center justify-center p-4 lg:pl-64" style={{ zIndex: 99999 }} onClick={() => setShowCreate(false)}>
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
                    <div className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 shrink-0 bg-slate-900">
                            <h2 className="text-xl font-bold text-slate-100">Schedule Workshop</h2>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 bg-white/5">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Workshop Title</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Master Interview Skills"
                                    className="w-full border border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none bg-white/5 shadow-sm" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Date & Time</label>
                                <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} type="datetime-local"
                                    className="w-full border border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none bg-white/5 shadow-sm" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Meeting Link (Optional)</label>
                                <input value={form.meetLink} onChange={e => setForm({ ...form, meetLink: e.target.value })} placeholder="https://meet.google.com/..." type="url"
                                    className="w-full border border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none bg-white/5 shadow-sm" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What will this workshop cover?" rows={4}
                                    className="w-full border border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none resize-none bg-white/5 shadow-sm" />
                            </div>
                        </div>
                        <div className="p-6 shrink-0 flex gap-3 border-t border-white/5 bg-white/5">
                            <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 text-slate-400 hover:bg-white/5 transition-colors">Cancel</button>
                            <button onClick={createWorkshop} disabled={actionLoading}
                                className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">{actionLoading ? 'Saving...' : 'Schedule Workshop'}</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Assignment {
    id: string;
    clientProfileId: string;
    permissions: string[];
    assignedAt: string;
    expiresAt: string | null;
    client?: { user: { name: string; email: string } };
}

interface Mentor {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    mentorProfile: {
        id: string;
        type: string;
        status: string;
        specializations: string[];
        bio: string | null;
        accessEnd: string | null;
        assignments: Assignment[];
        whatsappNumber?: string | null;
        googleCalendarUrl?: string | null;
    } | null;
}

interface Client { id: string; user: { name: string; email: string } }

const ALL_PERMISSIONS = ['VIEW_MODULES', 'REVIEW_MODULES', 'VIEW_REPORTS', 'EDIT_REPORTS', 'CHAT'];

export default function AdminDashboardPage() {
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
    const [showAssign, setShowAssign] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Create/Edit form
    const [form, setForm] = useState({ id: '', name: '', email: '', password: '', type: 'PERMANENT', specializations: '', bio: '', accessEnd: '', whatsappNumber: '', googleCalendarUrl: '' });
    // Assign form
    const [assignForm, setAssignForm] = useState({ clientProfileId: '', permissions: [...ALL_PERMISSIONS], expiresAt: '' });
    const [actionLoading, setActionLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchMentors();
        fetchClients();
    }, []);

    const fetchMentors = async () => {
        try {
            const res = await fetch('/api/admin/mentors');
            if (res.ok) {
                const data = await res.json();
                setMentors(data);
                setSelectedMentor(prev => {
                    if (!prev) return null;
                    return data.find((m: Mentor) => m.id === prev.id) || prev;
                });
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/admin/clients');
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.clients || []);
                setClients(list.map((c: any) => ({ id: c.id, user: { name: c.name || 'Unknown', email: c.email } })));
            }
        } catch (e) { console.error(e); }
    };

    const handleEditMentor = (mentor: Mentor) => {
        setForm({
            id: mentor.id,
            name: mentor.name,
            email: mentor.email,
            password: '', // Leave blank unless changing
            type: mentor.mentorProfile?.type || 'PERMANENT',
            specializations: mentor.mentorProfile?.specializations?.join(', ') || '',
            bio: mentor.mentorProfile?.bio || '',
            accessEnd: mentor.mentorProfile?.accessEnd ? new Date(mentor.mentorProfile.accessEnd).toISOString().split('T')[0] : '',
            whatsappNumber: mentor.mentorProfile?.whatsappNumber || '',
            googleCalendarUrl: mentor.mentorProfile?.googleCalendarUrl || '',
        });
        setIsEditing(true);
        setShowCreate(true);
    };

    const createOrUpdateMentor = async () => {
        setActionLoading(true);
        try {
            const method = isEditing ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/mentors', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    specializations: form.specializations.split(',').map(s => s.trim()).filter(Boolean)
                })
            });
            if (res.ok) {
                setShowCreate(false);
                setIsEditing(false);
                setForm({ id: '', name: '', email: '', password: '', type: 'PERMANENT', specializations: '', bio: '', accessEnd: '', whatsappNumber: '', googleCalendarUrl: '' });
                alert(isEditing ? 'Mentor details updated successfully!' : 'Mentor created successfully!');
                fetchMentors();
            } else {
                const data = await res.json();
                alert(`${isEditing ? 'Update' : 'Creation'} failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message}`);
        }
        finally { setActionLoading(false); }
    };

    const assignClient = async () => {
        if (!selectedMentor?.mentorProfile || !assignForm.clientProfileId) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/mentors', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'assign',
                    mentorProfileId: selectedMentor.mentorProfile.id,
                    clientProfileId: assignForm.clientProfileId,
                    permissions: assignForm.permissions,
                    expiresAt: assignForm.expiresAt || null
                })
            });
            if (res.ok) {
                setShowAssign(false);
                setAssignForm({ clientProfileId: '', permissions: [...ALL_PERMISSIONS], expiresAt: '' });
                alert('Client assigned successfully!');
                fetchMentors();
            } else {
                const data = await res.json();
                alert(`Assignment failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message}`);
        }
        finally { setActionLoading(false); }
    };

    const unassignClient = async (mentorProfileId: string, clientProfileId: string) => {
        if (!confirm('Are you sure you want to unassign this client?')) return;
        await fetch('/api/admin/mentors', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'unassign', mentorProfileId, clientProfileId })
        });
        alert('Client unassigned successfully!');
        fetchMentors();
    };

    const updateStatus = async (mentorProfileId: string, status: string) => {
        await fetch('/api/admin/mentors', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_status', mentorProfileId, status })
        });
        fetchMentors();
    };

    const deleteMentor = async (mentorProfileId: string) => {
        if (!confirm('Delete this mentor permanently?')) return;
        await fetch('/api/admin/mentors', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', mentorProfileId })
        });
        setSelectedMentor(null);
        fetchMentors();
    };

    const statusColors: Record<string, string> = {
        ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        SUSPENDED: 'bg-red-500/10 text-red-400 border-red-500/20',
        EXPIRED: 'bg-white/50/10 text-slate-400 border-slate-500/20'
    };

    if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /></div>;

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Mentors & Clients</h1>
                        <p className="text-slate-300 mt-1 text-sm">Manage hierarchical access: Mentors and their assigned clients.</p>
                    </div>
                    <button onClick={() => { setIsEditing(false); setForm({ id: '', name: '', email: '', password: '', type: 'PERMANENT', specializations: '', bio: '', accessEnd: '', whatsappNumber: '', googleCalendarUrl: '' }); setShowCreate(true); }} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm shrink-0">+ Add Mentor</button>
                </div>

                <div className="grid lg:grid-cols-[1fr_400px] gap-6">
                    {/* Mentor List */}
                    <div className="space-y-3">
                        {mentors.length === 0 ? (
                            <div className="bg-white/5 border rounded-xl p-12 text-center shadow-sm">
                                <p className="text-slate-200 font-medium mb-4">No mentors yet. Click below to create one.</p>
                                <button onClick={() => { setIsEditing(false); setShowCreate(true); }} className="px-4 py-2 border border-white/20 rounded-lg text-slate-100 font-bold text-sm hover:bg-white/5 transition-colors">Add Mentor</button>
                            </div>
                        ) : mentors.map(m => (
                            <div key={m.id} onClick={() => setSelectedMentor(m)}
                                className={`bg-white/5 border rounded-xl p-5 cursor-pointer transition-all shadow-sm hover:border-indigo-400 hover:shadow-md ${selectedMentor?.id === m.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-white/10'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-100">{m.name || 'Unnamed'}</h3>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">{m.mentorProfile?.type || 'LEGACY'}</span>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${statusColors[m.mentorProfile?.status || 'ACTIVE']}`}>
                                            {m.mentorProfile?.status || 'ACTIVE'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-2 text-[10px] text-slate-500 font-medium">
                                    <span>{m.mentorProfile?.assignments?.length || 0} clients assigned</span>
                                    <span>Joined {new Date(m.createdAt).toLocaleDateString()}</span>
                                    {m.mentorProfile?.specializations?.length ? <span>{m.mentorProfile.specializations.join(', ')}</span> : null}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Detail Panel */}
                    <div className={`bg-white/5 border shadow-sm rounded-xl p-6 space-y-5 sticky top-4 max-h-[80vh] overflow-y-auto ${selectedMentor ? 'block' : 'hidden lg:block'}`}>
                        {selectedMentor?.mentorProfile ? (
                            <>
                                <div className="flex justify-between items-start pb-4 border-b border-white/5">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-100">{selectedMentor.name}</h2>
                                        <p className="text-xs text-slate-500 font-medium">{selectedMentor.email}</p>
                                    </div>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${statusColors[selectedMentor.mentorProfile.status]}`}>
                                        {selectedMentor.mentorProfile.status}
                                    </span>
                                    <button onClick={() => handleEditMentor(selectedMentor)} className="ml-2 text-[10px] text-indigo-600 font-bold tracking-wider uppercase border border-indigo-200 bg-indigo-500/10 px-2 py-1 rounded transition-colors hover:bg-indigo-100">Edit</button>
                                </div>

                                {selectedMentor.mentorProfile.bio && <p className="text-xs text-slate-400 leading-relaxed">{selectedMentor.mentorProfile.bio}</p>}

                                {/* Status Actions */}
                                <div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Status</div>
                                    <div className="flex gap-2">
                                        {['ACTIVE', 'SUSPENDED'].map(s => (
                                            <button key={s} onClick={() => updateStatus(selectedMentor.mentorProfile!.id, s)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedMentor.mentorProfile!.status === s ? statusColors[s] : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>
                                                {s}
                                            </button>
                                        ))}
                                        <button onClick={() => deleteMentor(selectedMentor.mentorProfile!.id)}
                                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-rose-200 text-rose-600 hover:bg-rose-50 ml-auto transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Assigned Clients */}
                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Assigned Clients ({selectedMentor.mentorProfile.assignments.length})</span>
                                        <button onClick={() => setShowAssign(true)} className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest hover:underline px-2 py-1 rounded bg-indigo-500/10 border border-indigo-200">+ Assign New</button>
                                    </div>
                                    {selectedMentor.mentorProfile.assignments.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic">No clients assigned yet</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedMentor.mentorProfile.assignments.map(a => (
                                                <div key={a.id} className="p-4 rounded-xl border border-white/10 bg-white/50 hover:bg-white/5 hover:shadow-sm transition-all group">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="text-sm font-bold text-slate-100 group-hover:text-indigo-600 transition-colors">{a.client?.user?.name || 'Unknown'}</span>
                                                            <p className="text-xs text-slate-500">{a.client?.user?.email}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <a href={`/admin/clients/${a.clientProfileId}`} className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold tracking-wider uppercase border border-indigo-200 bg-indigo-500/10 px-2 py-1 rounded transition-colors">Review</a>
                                                            <button onClick={() => unassignClient(selectedMentor.mentorProfile!.id, a.clientProfileId)}
                                                                className="text-[10px] text-rose-500 hover:text-rose-700 font-bold tracking-wider uppercase transition-colors">Remove</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <p className="text-sm text-slate-500 font-medium">Select a mentor to manage details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreate && mounted && createPortal(
                <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 lg:pl-64" style={{ zIndex: 99999 }} onClick={() => setShowCreate(false)}>
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
                    <div className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 shrink-0 bg-slate-900">
                            <h2 className="text-xl font-bold text-slate-100">{isEditing ? 'Edit Mentor' : 'Create New Mentor'}</h2>
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 bg-white/5">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Full Name</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe"
                                        className="w-full border border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none placeholder:text-slate-400 bg-white/5 shadow-sm transition-shadow" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Email Address</label>
                                    <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="mentor@path.com" type="email"
                                        className="w-full border border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none placeholder:text-slate-400 bg-white/5 shadow-sm transition-shadow" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Password {isEditing ? '(Leave blank to keep unchanged)' : ''}</label>
                                    <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" type="password"
                                        className="w-full border border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none placeholder:text-slate-400 bg-white/5 shadow-sm transition-shadow" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Mentor Type</label>
                                    <div className="relative">
                                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                            className="w-full border border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none appearance-none bg-white/5 shadow-sm cursor-pointer">
                                            <option value="PERMANENT" className="bg-slate-900 text-slate-100">Permanent Mentor</option>
                                            <option value="TEMPORARY" className="bg-slate-900 text-slate-100">Temporary Mentor</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">▼</div>
                                    </div>
                                </div>
                                {form.type === 'TEMPORARY' && (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Access Expires At</label>
                                        <input value={form.accessEnd} onChange={e => setForm({ ...form, accessEnd: e.target.value })} type="date"
                                            className="w-full border border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none bg-white/5 shadow-sm" />
                                    </div>
                                )}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">WhatsApp Number (Optional)</label>
                                    <input value={form.whatsappNumber} onChange={e => setForm({ ...form, whatsappNumber: e.target.value })} placeholder="+1234567890" type="tel"
                                        className="w-full border border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none placeholder:text-slate-400 bg-white/5 shadow-sm transition-shadow" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Google Calendar URL (Optional)</label>
                                    <input value={form.googleCalendarUrl} onChange={e => setForm({ ...form, googleCalendarUrl: e.target.value })} placeholder="https://calendar.google.com/..." type="url"
                                        className="w-full border border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none placeholder:text-slate-400 bg-white/5 shadow-sm transition-shadow" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Specializations</label>
                                    <input value={form.specializations} onChange={e => setForm({ ...form, specializations: e.target.value })} placeholder="e.g. Resume Writing, Tech Interviews"
                                        className="w-full border border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none placeholder:text-slate-400 bg-white/5 shadow-sm transition-shadow" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Bio (Optional)</label>
                                    <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Brief background about the mentor..." rows={3}
                                        className="w-full border border-white/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none resize-none placeholder:text-slate-400 bg-white/5 shadow-sm transition-shadow" />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 shrink-0 flex gap-3 border-t border-white/5 bg-white/5">
                            <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 text-slate-400 hover:bg-white/5 transition-colors">Cancel</button>
                            <button onClick={createOrUpdateMentor} disabled={actionLoading || !form.name || !form.email || (!isEditing && !form.password)}
                                className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">{actionLoading ? 'Saving...' : (isEditing ? 'Update Mentor' : 'Create Mentor')}</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Assign Modal */}
            {showAssign && selectedMentor && mounted && createPortal(
                <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 lg:pl-64" style={{ zIndex: 99999 }} onClick={() => setShowAssign(false)}>
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
                    <div className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 shrink-0 bg-slate-900">
                            <h2 className="text-xl font-bold text-slate-100">Assign Client to <span className="text-indigo-600">{selectedMentor.name}</span></h2>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-white/5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Select Client</label>
                                <div className="relative">
                                    <select value={assignForm.clientProfileId} onChange={e => setAssignForm({ ...assignForm, clientProfileId: e.target.value })}
                                        className="w-full border border-white/20 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none appearance-none bg-white/5 shadow-sm cursor-pointer">
                                        <option value="" disabled className="bg-slate-900 text-slate-100">-- Choose a client --</option>
                                        {clients.map(c => <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">{c.user.name} ({c.user.email})</option>)}
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">▼</div>
                                </div>
                            </div>

                            <div className="p-5 rounded-xl border border-white/10 bg-white/5 shadow-sm">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Access Permissions</label>
                                <div className="flex flex-wrap gap-2">
                                    {ALL_PERMISSIONS.map(p => {
                                        const isSelected = assignForm.permissions.includes(p);
                                        return (
                                            <button key={p} onClick={() => {
                                                const perms = isSelected
                                                    ? assignForm.permissions.filter(x => x !== p)
                                                    : [...assignForm.permissions, p];
                                                setAssignForm({ ...assignForm, permissions: perms });
                                            }}
                                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${isSelected
                                                    ? 'bg-indigo-500/10 border-indigo-200 text-indigo-400 shadow-sm'
                                                    : 'border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
                                                {isSelected && <span className="mr-1.5 text-indigo-500">✓</span>}
                                                {p.replace('_', ' ')}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 shrink-0 flex gap-3 border-t border-white/5 bg-white/5">
                            <button onClick={() => setShowAssign(false)} className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 text-slate-400 hover:bg-white/5 transition-colors">Cancel</button>
                            <button onClick={assignClient} disabled={actionLoading || !assignForm.clientProfileId}
                                className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">{actionLoading ? 'Assigning...' : 'Complete Assignment'}</button>
                        </div>
                    </div>
                </div>
                , document.body)}
        </>
    );
}

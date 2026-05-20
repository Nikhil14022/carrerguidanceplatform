'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
    const { data: session, update } = useSession();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.email) {
            setEmail(session.user.email);
        }
    }, [session]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/client/appointments');
                const data = await res.json();
                if (data.appointments) {
                    setHistory(data.appointments.filter((a: any) => a.status === 'COMPLETED' || a.status === 'CANCELLED'));
                }
            } catch (err) {
                console.error('Failed to fetch appointment history', err);
            } finally {
                setHistoryLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch('/api/client/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Settings updated successfully!' });
                if (password) setPassword(''); // clear password field
                if (email !== session?.user?.email) {
                    await update({ email }); // tell NextAuth to update session if supported
                }
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update settings.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 space-y-8 text-slate-200">
            <h1 className="text-3xl font-bold text-slate-200">Settings</h1>

            {message && (
                <div className={`p-4 rounded-xl border font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-8 space-y-6">
                <h2 className="text-xl font-bold text-slate-100 border-b border-white/5 pb-4">Account Settings</h2>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white/5"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Update Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Optionally set a new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 hover:scale-105 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-8 space-y-6">
                <h2 className="text-xl font-bold text-slate-100 border-b border-white/5 pb-4">🔔 Notification Preferences</h2>

                <div className="space-y-4">
                    {[
                        { key: 'module', label: 'Module Updates', description: 'When a module is approved, reviewed, or status changes' },
                        { key: 'report', label: 'Report Notifications', description: 'When AI analysis is complete or reports are updated' },
                        { key: 'appointment', label: 'Appointment Reminders', description: 'Upcoming session alerts and schedule changes' },
                        { key: 'chat', label: 'Chat Messages', description: 'New messages from experts in the chat' },
                        { key: 'community', label: 'Community Replies', description: 'When someone replies to your forum discussions' },
                    ].map(item => (
                        <NotificationToggle key={item.key} label={item.label} description={item.description} />
                    ))}
                </div>
            </div>

            <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-8 space-y-6">
                <h2 className="text-xl font-bold text-slate-100 border-b border-white/5 pb-4">Appointment History</h2>

                {historyLoading ? (
                    <div className="text-slate-500 text-sm animate-pulse">Loading history...</div>
                ) : history.length === 0 ? (
                    <div className="text-slate-500 text-sm py-4">No completed or cancelled appointments found.</div>
                ) : (
                    <div className="divide-y divide-slate-100 border border-white/5 rounded-xl bg-white/5 overflow-hidden text-sm">
                        {history.map(apt => (
                            <div key={apt.id} className="p-4 sm:flex justify-between items-center transition-colors hover:bg-slate-100">
                                <div className="mb-2 sm:mb-0">
                                    <h4 className="font-bold text-slate-200">{apt.type === 'ONLINE' ? 'Virtual Consultation' : 'In-Person Strategy'}</h4>
                                    <p className="text-slate-500 mt-1">{new Date(apt.createdAt).toLocaleDateString()} • {apt.expert?.name || 'Expert'}</p>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${apt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-200'}`}>
                                    {apt.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function NotificationToggle({ label, description }: { label: string; description: string }) {
    const [enabled, setEnabled] = useState(true);
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-slate-100 transition-colors">
            <div>
                <h3 className="text-sm font-bold text-slate-200">{label}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
            <button
                onClick={() => setEnabled(!enabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white/5 shadow-sm transition-transform ${enabled ? 'translate-x-6' : ''}`} />
            </button>
        </div>
    );
}

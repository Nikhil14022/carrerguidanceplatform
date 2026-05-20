"use client";
import React, { useEffect, useState } from 'react';

export default function EmailInbox() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const res = await fetch('/api/admin/emails');
                const data = await res.json();
                setEmails(data);
            } catch (error) {
                console.error('Failed to load emails:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmails();
    }, []);

    if (loading) {
        return <div className="p-10 animate-pulse text-slate-500 font-bold tracking-widest uppercase">Loading Inbox...</div>;
    }

    return (
        <div className="p-8 space-y-8 animate-fade-in relative text-slate-200">
            <div>
                <h1 className="text-3xl font-bold">Email Sandbox Inbox</h1>
                <p className="text-slate-500 max-w-2xl mt-2">
                    This is a development preview showing all transactional emails sent by the system via Nodemailer to Etheral/Local logs.
                </p>
            </div>

            <div className="grid lg:grid-cols-[400px_1fr] gap-8 h-[600px]">
                {/* List */}
                <div className="bg-white/5 border rounded-2xl p-4 overflow-y-auto shadow-sm space-y-3">
                    {emails.length === 0 ? (
                        <div className="text-center p-8 text-slate-400">No emails sent yet.</div>
                    ) : (
                        emails.map((email) => (
                            <button
                                key={email.id}
                                onClick={() => setSelectedEmail(email)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedEmail?.id === email.id
                                        ? 'bg-indigo-500/10 border-indigo-200'
                                        : 'hover:bg-white/5 border-transparent'
                                    }`}
                            >
                                <div className="text-xs font-bold text-slate-500 mb-1">{new Date(email.date).toLocaleString()}</div>
                                <div className="font-bold text-slate-100 truncate">{email.subject}</div>
                                <div className="text-sm text-slate-500 truncate mt-1">To: {email.to}</div>
                            </button>
                        ))
                    )}
                </div>

                {/* Preview */}
                <div className="bg-white/5 border rounded-2xl p-8 flex flex-col shadow-sm">
                    {selectedEmail ? (
                        <div className="h-full flex flex-col">
                            <div className="border-b pb-6 mb-6">
                                <h2 className="text-2xl font-bold mb-2">{selectedEmail.subject}</h2>
                                <div className="text-sm text-slate-500">
                                    <span className="font-bold text-slate-300">To:</span> {selectedEmail.to}
                                </div>
                                <div className="text-sm text-slate-500">
                                    <span className="font-bold text-slate-300">Date:</span> {new Date(selectedEmail.date).toLocaleString()}
                                </div>
                            </div>
                            <div className="flex-1 bg-white/5 rounded-xl p-8 border overflow-y-auto">
                                <iframe
                                    className="w-full h-full"
                                    srcDoc={selectedEmail.html}
                                    title="Email Preview"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">
                            Select an email to view its contents
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

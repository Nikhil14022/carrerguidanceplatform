'use client';
import React from 'react';
import { useSession } from 'next-auth/react';

export default function MentorProfilePage() {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role || 'Mentor';
    const userName = session?.user?.name || 'Expert Mentor';
    const userEmail = session?.user?.email || 'N/A';
    const initial = userName.charAt(0).toUpperCase();

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-8">
            <h1 className="text-3xl font-bold text-slate-200">Mentor Profile</h1>

            <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 text-center md:text-left">
                    <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-full flex items-center justify-center text-4xl font-bold shrink-0 shadow-lg shadow-teal-500/25">
                        {initial}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">{userName}</h2>
                        <p className="text-slate-500 mt-1">Career Expert & Guide</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-xs font-medium text-teal-700">
                                <span className="font-semibold">Role:</span> {userRole}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                        <input type="text" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg" value={userName} disabled />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                        <input type="text" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg" value={userEmail} disabled />
                    </div>
                </div>
            </div>
        </div>
    );
}

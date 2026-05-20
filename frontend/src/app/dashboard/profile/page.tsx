'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const BADGE_DEFINITIONS = [
    { id: 'first_module', title: 'First Step', description: 'Completed your first module', icon: '🚀', color: 'from-blue-500 to-cyan-500' },
    { id: 'half_modules', title: 'Halfway Hero', description: 'Completed 50% of all modules', icon: '⭐', color: 'from-amber-500 to-orange-500' },
    { id: 'all_modules', title: 'Assessment Master', description: 'Completed all modules', icon: '🏆', color: 'from-emerald-500 to-green-500' },
    { id: 'first_report', title: 'AI Pioneer', description: 'Generated your first AI report', icon: '🤖', color: 'from-purple-500 to-violet-500' },
    { id: 'shortlisted', title: 'Career Explorer', description: 'Shortlisted career options', icon: '🔍', color: 'from-indigo-500 to-blue-500' },
    { id: 'first_chat', title: 'Connected', description: 'Sent your first expert chat message', icon: '💬', color: 'from-pink-500 to-rose-500' },
    { id: 'community', title: 'Community Voice', description: 'Posted in the discussion forum', icon: '📢', color: 'from-teal-500 to-cyan-500' },
    { id: 'appointment', title: 'Proactive', description: 'Booked your first appointment', icon: '📅', color: 'from-red-500 to-orange-500' },
];

export default function ProfilePage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<any>(null);

    const userRole = (session?.user as any)?.role || 'Client';
    const userName = session?.user?.name || 'Guest User';
    const userEmail = session?.user?.email || 'N/A';
    const userId = (session?.user as any)?.id || 'N/A';
    const clientProfileId = (session?.user as any)?.clientProfileId || 'N/A';
    const initial = userName.charAt(0).toUpperCase();

    useEffect(() => {
        fetch('/api/client/dashboard')
            .then(r => r.json())
            .then(data => setStats(data))
            .catch(() => { });
    }, []);

    // Calculate earned badges based on stats
    const earnedBadges = new Set<string>();
    if (stats) {
        const completedModules = stats.modules?.filter((m: any) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(m.status))?.length || 0;
        const totalModules = stats.modules?.length || 0;

        if (completedModules >= 1) earnedBadges.add('first_module');
        if (totalModules > 0 && completedModules >= totalModules / 2) earnedBadges.add('half_modules');
        if (totalModules > 0 && completedModules >= totalModules) earnedBadges.add('all_modules');
        if (stats.report) earnedBadges.add('first_report');
        if (stats.report?.careerOptions?.some((c: any) => c.isShortlisted)) earnedBadges.add('shortlisted');
    }

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-8">
            <h1 className="text-3xl font-bold text-slate-200">Client Profile</h1>

            {/* Profile Card */}
            <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 text-center md:text-left">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-4xl font-bold shrink-0 shadow-lg shadow-indigo-500/25">
                        {initial}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">{userName}</h2>
                        <p className="text-slate-500 mt-1">Career guidance program member</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-200 text-xs font-medium text-indigo-400">
                                <span className="font-semibold">Role:</span> {userRole}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-500">
                                <span className="font-semibold text-slate-300">ID:</span> {clientProfileId}
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

            {/* Badges & Achievements Section */}
            <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        🏅 Achievements
                    </h2>
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-500/10 px-3 py-1 rounded-full">
                        {earnedBadges.size} / {BADGE_DEFINITIONS.length}
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {BADGE_DEFINITIONS.map(badge => {
                        const earned = earnedBadges.has(badge.id);
                        return (
                            <div
                                key={badge.id}
                                className={`relative p-4 rounded-xl border text-center transition-all ${earned
                                        ? 'bg-white/5 border-white/10 shadow-sm'
                                        : 'bg-white/5 border-white/5 opacity-40 grayscale'
                                    }`}
                            >
                                <div className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-2xl mb-3 ${earned ? `bg-gradient-to-br ${badge.color} shadow-lg` : 'bg-slate-200'
                                    }`}>
                                    {badge.icon}
                                </div>
                                <h3 className="text-xs font-bold text-slate-200 mb-0.5">{badge.title}</h3>
                                <p className="text-[10px] text-slate-500 leading-tight">{badge.description}</p>
                                {earned && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Progress Stats */}
            {stats && (
                <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-8">
                    <h2 className="text-xl font-bold text-slate-100 mb-6">📊 Progress Overview</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Modules Done', value: stats.modules?.filter((m: any) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(m.status))?.length || 0, total: stats.modules?.length || 0, color: 'text-emerald-600' },
                            { label: 'Career Paths', value: stats.report?.careerOptions?.length || 0, total: null, color: 'text-indigo-600' },
                            { label: 'Stage', value: stats.stage || 'Getting Started', total: null, color: 'text-purple-600' },
                            { label: 'Badges', value: earnedBadges.size, total: BADGE_DEFINITIONS.length, color: 'text-amber-600' },
                        ].map((s, i) => (
                            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                                <div className={`text-2xl font-black ${s.color}`}>
                                    {s.total !== null ? `${s.value}/${s.total}` : s.value}
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

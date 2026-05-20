'use client';
import React from 'react';

export default function MentorSettingsPage() {
    return (
        <div className="max-w-3xl mx-auto py-8 space-y-8 text-slate-200">
            <h1 className="text-3xl font-bold text-slate-200">Mentor Settings</h1>
            <div className="bg-white/5 rounded-2xl shadow-sm border border-white/10 p-8 space-y-6">
                <h2 className="text-xl font-bold text-slate-100 border-b border-white/5 pb-4">Account Preferences</h2>
                <div className="text-slate-500 text-sm">
                    Configure your working hours, notification preferences, and calendar sync settings here.
                    (Coming soon in Phase 2)
                </div>
            </div>
        </div>
    );
}

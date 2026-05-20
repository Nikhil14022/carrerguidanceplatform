"use client";
import React from 'react';

export default function ResourcesPage() {
    return (
        <div className="space-y-8 animate-fade-in text-slate-200">
            <div className="bg-white/5 border shadow-sm rounded-2xl p-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-100 mb-2">Resources</h1>
                <p className="text-slate-400 mb-8">Access a curated list of resources to help you along your career path journey. Check back often as we add new materials.</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-6 border border-white/10 rounded-xl hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-lg mb-2">Resume Templates</h3>
                        <p className="text-sm text-slate-400 mb-4">Download industry-standard resume templates designed to get past ATS systems.</p>
                        <button className="px-4 py-2 bg-indigo-500/10 text-indigo-600 rounded-lg text-sm font-bold w-full hover:bg-indigo-100 transition-colors">View Templates</button>
                    </div>
                    <div className="p-6 border border-white/10 rounded-xl hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-lg mb-2">Interview Prep Guide</h3>
                        <p className="text-sm text-slate-400 mb-4">A comprehensive guide covering common behavioral and technical interview questions.</p>
                        <button className="px-4 py-2 bg-indigo-500/10 text-indigo-600 rounded-lg text-sm font-bold w-full hover:bg-indigo-100 transition-colors">Read Guide</button>
                    </div>
                    <div className="p-6 border border-white/10 rounded-xl hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-lg mb-2">Networking Strategies</h3>
                        <p className="text-sm text-slate-400 mb-4">Learn how to leverage LinkedIn and industry events to build meaningful connections.</p>
                        <button className="px-4 py-2 bg-indigo-500/10 text-indigo-600 rounded-lg text-sm font-bold w-full hover:bg-indigo-100 transition-colors">Start Learning</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

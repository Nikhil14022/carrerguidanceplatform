"use client";
import React, { useState, useEffect } from 'react';

export default function AppointmentsPage() {
    const [mentor, setMentor] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchMentor = async () => {
        try {
            const res = await fetch('/api/client/mentor');
            const data = await res.json();
            if (data.mentor) {
                setMentor(data.mentor);
            }
        } catch (err) {
            console.error('Failed to fetch mentor', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMentor();
    }, []);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in text-slate-200">
            <div className="bg-white/5 border shadow-sm rounded-2xl p-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-100 mb-2">Book an Appointment</h1>
                <p className="text-slate-400 mb-8">Schedule a meeting with your mentor to discuss your progress, modules, and career strategy.</p>

                {mentor ? (
                    mentor.googleCalendarUrl ? (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl shadow-sm border border-white/5 flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-slate-100 mb-2">Schedule with {mentor.name}</h2>
                            <p className="text-slate-500 mb-8 max-w-md">Your mentor uses Google Calendar for scheduling. Click the button below to view their calendar and book an available time slot.</p>
                            <a
                                href={mentor.googleCalendarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-sm hover:shadow transition-all flex items-center gap-3"
                            >
                                Open Google Calendar
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                        </div>
                    ) : (
                        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3">
                            <svg className="w-6 h-6 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Calendar Not Available</h3>
                                <p>Your mentor ({mentor.name}) has not configured their Google Calendar link yet. Please contact them directly to schedule a meeting.</p>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3">
                        <svg className="w-6 h-6 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div>
                            <h3 className="font-bold text-lg mb-1">No Mentor Assigned</h3>
                            <p>You don't have a mentor assigned yet. Appointments can only be booked with your assigned mentor.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

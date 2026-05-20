"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExpertChatPage() {
    const router = useRouter();
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
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in text-slate-200">
            <div className="bg-white/5 border shadow-sm rounded-2xl p-8 max-w-2xl mx-auto mt-12 text-center">
                <div className="w-20 h-20 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-100 mb-2">Chat with your Mentor</h1>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Take the conversation to WhatsApp for faster, more direct communication. Your mentor is here to help with your career path journey.
                </p>

                {mentor ? (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 max-w-sm mx-auto shadow-sm">
                        <div className="w-16 h-16 bg-slate-200 text-slate-500 rounded-full mx-auto flex items-center justify-center font-bold text-xl mb-4">
                            {mentor.name?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <h3 className="font-bold text-lg text-slate-200">{mentor.name || 'Your Mentor'}</h3>
                        <p className="text-sm text-slate-500 mb-6">{mentor.bio || 'Career Strategy Expert'}</p>

                        {mentor.whatsappNumber ? (
                            <a
                                href={`https://wa.me/${mentor.whatsappNumber.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                                </svg>
                                Chat on WhatsApp
                            </a>
                        ) : (
                            <div className="p-4 bg-amber-50 rounded-lg text-amber-700 text-sm border border-amber-200">
                                This mentor hasn't linked their WhatsApp number yet.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-6 bg-amber-50 rounded-xl text-amber-700 max-w-sm mx-auto border border-amber-200">
                        You don't have a mentor assigned yet. Please contact support.
                    </div>
                )}
            </div>
        </div>
    );
}

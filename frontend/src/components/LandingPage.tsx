"use client";
import React from 'react';
import { useSession, signOut } from 'next-auth/react';

export const Navbar = () => {
    return (
        <nav className="fixed top-0 w-full z-50 px-6 py-6">
            <div className="max-w-7xl mx-auto glass rounded-full px-8 py-4 flex items-center justify-center">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center">
                    <img src="/logo.jpg" alt="Logo" className="w-14 h-14 object-contain rounded-xl shrink-0 shadow-lg shadow-black/20" />
                    <a href="/" className="hover:opacity-90 transition-opacity font-black text-slate-100 text-2xl md:text-3xl tracking-tighter">
                        Career <span className="text-[var(--color-brand-yellow)]">Explore</span> Journey
                    </a>
                </div>
            </div>
        </nav>
    );
};

export const Hero = () => {
    const { data: session } = useSession();
    
    const getJourneyLink = () => {
        if (!session) return '/register';
        const role = (session.user as any)?.role;
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') return '/admin';
        if (role === 'EXPERT' || role?.startsWith('MENTOR')) return '/mentor';
        if (role === 'PARENT') return '/parent';
        return '/dashboard';
    };

    return (
        <section className="relative pt-44 pb-20 px-6 max-w-4xl mx-auto flex flex-col items-center">
            <div className="glass rounded-3xl p-8 md:p-12 space-y-8 border border-white/10 shadow-2xl relative z-10 text-center bg-slate-900/50">
                <h1 className="text-3xl md:text-5xl font-black text-slate-100 tracking-tight text-gradient">
                    Welcome to Holistree
                </h1>
                
                <div className="text-slate-350 text-sm md:text-base leading-relaxed text-justify space-y-6 max-w-3xl mx-auto font-medium">
                    <p className="text-center font-bold text-slate-200">
                        We're delighted to welcome you to Holistree.
                    </p>
                    <p>
                        Thank you for placing your trust in us and choosing to begin this journey of self-discovery, exploration, and career design. It is both an honour and a responsibility for us to walk alongside you.
                    </p>
                    <p>
                        At Holistree, we believe that the best career decisions begin with understanding yourself. Through guided conversations, structured assessments, reflection, and real-world exploration, you'll gain clarity about your strengths, interests, values, personality, and the opportunities that truly align with who you are.
                    </p>
                    <p>
                        Beyond self-awareness, we'll create opportunities for you to explore careers in the real world—connecting with professionals, researching industries, and experiencing different paths before making informed decisions. Our goal is to give you the confidence to choose a future based on understanding, not assumptions.
                    </p>
                    <p>
                        We're excited to be a part of your journey and look forward to helping you discover yourself, explore possibilities, and design a future that's truly your own.
                    </p>
                    <p className="text-center font-bold text-slate-200 text-lg">
                        Welcome to Holistree. Let's begin.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-white/5">
                    <a href={getJourneyLink()} className="btn-primary w-full sm:w-auto text-center font-bold">
                        {session ? 'Go to Dashboard' : 'Start Your Journey'}
                    </a>
                    <button
                        onClick={() => window.location.href = '/sample-report'}
                        className="btn-secondary w-full sm:w-auto font-bold"
                    >
                        View Sample Report
                    </button>
                </div>

                {session && (
                    <div className="pt-4">
                        <button
                            onClick={async () => {
                                await signOut({ redirect: false });
                                window.location.href = '/';
                            }}
                            className="text-xs font-black text-rose-450 hover:text-rose-455 transition-colors uppercase tracking-widest cursor-pointer"
                        >
                            Sign Out
                        </button>
                    </div>
                )}
            </div>

            {/* Background Decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-brand-yellow)]/5 rounded-full blur-[128px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
        </section>
    );
};

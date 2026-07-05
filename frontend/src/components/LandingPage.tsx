"use client";
import React from 'react';
import { useSession, signOut } from 'next-auth/react';

export const Navbar = () => {
    const { data: session, status } = useSession();

    return (
        <nav className="fixed top-0 w-full z-50 px-6 py-6">
            <div className="max-w-7xl mx-auto glass rounded-full px-8 py-3.5 flex items-center justify-between">
                <div className="text-2xl font-bold tracking-tighter flex items-center gap-3">
                    <img src="/logo.jpg" alt="Logo" className="w-12 h-12 object-contain rounded-xl shrink-0 shadow-md shadow-black/15" />
                    <a href="/" className="hover:opacity-90 transition-opacity font-black text-slate-100 text-xl md:text-2xl tracking-tighter">
                        Career <span className="text-[var(--color-brand-yellow)]">Explore</span> Journey
                    </a>
                </div>

                <div className="flex items-center gap-6 min-h-[40px]">
                    {status === 'loading' ? (
                        <div className="w-20 h-4 bg-white/5 animate-pulse rounded" />
                    ) : session ? (
                        <>
                            <a 
                                href={(session?.user as any)?.role === 'ADMIN' ? '/admin' : (session?.user as any)?.role === 'PARENT' ? '/parent' : '/dashboard'} 
                                className="text-xs font-bold text-[var(--color-brand-yellow)] hover:text-amber-400 transition-colors uppercase tracking-widest"
                            >
                                Dashboard
                            </a>
                            <button
                                onClick={async () => {
                                    await signOut({ redirect: false });
                                    window.location.href = '/';
                                }}
                                className="text-xs font-bold text-slate-450 hover:text-white transition-colors cursor-pointer uppercase tracking-widest"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <a href="/login" className="text-xs font-bold text-slate-350 hover:text-[var(--color-brand-yellow)] transition-colors uppercase tracking-widest">Log In</a>
                            <a href="/register" className="btn-primary text-xs py-2.5 px-5 font-bold uppercase tracking-wider rounded-xl">Get Started</a>
                        </>
                    )}
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
        <section className="relative pt-44 pb-32 px-6 max-w-6xl mx-auto flex flex-col items-center">
            {/* Top Hero Callout */}
            <div className="text-center space-y-6 max-w-3xl mx-auto mb-16 relative z-10">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-950 via-slate-850 to-slate-700">
                        Welcome to
                    </span>
                    <img 
                        src="/holistree-logo-1.png" 
                        alt="Holistree" 
                        className="h-10 sm:h-12 md:h-16 object-contain shrink-0" 
                    />
                </h1>
                
                <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                    A guided journey of self-discovery, exploration, and career design.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <a href={getJourneyLink()} className="btn-primary w-full sm:w-auto text-center font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 hover:-translate-y-0.5 transition-all duration-200">
                        {session ? 'Go to Dashboard' : 'Start Your Journey'}
                    </a>
                    <button
                        onClick={() => window.location.href = '/sample-report'}
                        className="btn-secondary w-full sm:w-auto font-bold px-8 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 hover:-translate-y-0.5 transition-all duration-200"
                    >
                        View Sample Report
                    </button>
                </div>
            </div>

            {/* Editorial Content Grid */}
            <div className="grid md:grid-cols-12 gap-8 md:gap-12 text-slate-350 text-sm md:text-base leading-relaxed text-left border-t border-white/5 pt-16 w-full relative z-10">
                {/* Left Side Highlight */}
                <div className="md:col-span-5 space-y-6 border-l-2 border-[var(--color-brand-yellow)] pl-6 md:pl-8 py-2">
                    <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">
                        Delighted to welcome you.
                    </h2>
                    <p className="text-slate-300 font-medium">
                        Thank you for placing your trust in us and choosing to begin this journey of self-discovery, exploration, and career design. It is both an honour and a responsibility for us to walk alongside you.
                    </p>
                </div>

                {/* Right Side Details */}
                <div className="md:col-span-7 space-y-6">
                    <p>
                        At Holistree, we believe that the best career decisions begin with understanding yourself. Through guided conversations, structured assessments, reflection, and real-world exploration, you'll gain clarity about your strengths, interests, values, personality, and the opportunities that truly align with who you are.
                    </p>
                    <p>
                        Beyond self-awareness, we'll create opportunities for you to explore careers in the real world—connecting with professionals, researching industries, and experiencing different paths before making informed decisions. Our goal is to give you the confidence to choose a future based on understanding, not assumptions.
                    </p>
                    <p className="text-slate-205 font-bold border-t border-white/5 pt-6 flex items-center gap-2">
                        <span>Let's begin.</span>
                        <span className="w-6 h-[1px] bg-[var(--color-brand-yellow)]"></span>
                    </p>
                </div>
            </div>

            {session && (
                <div className="pt-12 text-center relative z-10">
                    <button
                        onClick={async () => {
                            await signOut({ redirect: false });
                            window.location.href = '/';
                        }}
                        className="text-xs font-black text-rose-400 hover:text-rose-350 transition-colors uppercase tracking-widest cursor-pointer hover:underline"
                    >
                        Sign Out
                    </button>
                </div>
            )}

            {/* Background Decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-brand-yellow)]/5 rounded-full blur-[128px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
        </section>
    );
};

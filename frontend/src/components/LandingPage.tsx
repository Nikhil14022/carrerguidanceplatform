"use client";
import React from 'react';
import { useSession, signOut } from 'next-auth/react';

export const Navbar = () => {
    const { data: session, status } = useSession();

    return (
        <nav className="fixed top-0 w-full z-50 px-6 py-4">
            <div className="max-w-7xl mx-auto glass rounded-full px-8 py-3 flex items-center justify-between">
                <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-sm bg-white/20 rotate-45" />
                    </div>
                    <a href="/" className="hover:opacity-80 transition-opacity">Career Path</a>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                    <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
                    <a href="#experts" className="hover:text-white transition-colors">Our Experts</a>
                    <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                </div>

                <div className="flex items-center gap-4 min-h-[40px]">
                    {status === 'loading' ? (
                        <div className="w-20 h-4 bg-white/5 animate-pulse rounded" />
                    ) : session ? (
                        <>
                            <a href={(session?.user as any)?.role === 'ADMIN' ? '/admin' : (session?.user as any)?.role === 'PARENT' ? '/parent' : '/dashboard'} className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">Dashboard</a>
                            <button
                                onClick={() => signOut()}
                                className="text-sm font-medium text-slate-500 hover:text-white transition-colors"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <a href="/login" className="text-sm font-medium hover:text-indigo-400 transition-colors">Log In</a>
                            <a href="/register" className="btn-primary text-sm py-2 px-5">Get Started</a>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export const Hero = () => (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-xs font-semibold text-indigo-400 mb-8 animate-fade-in">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Now powered by Next-Gen AI
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
                Your Future, <span className="text-gradient">Tailored</span>. <br />
                AI Guided, <span className="text-white/40">Human Refined</span>.
            </h1>

            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Unlock your true potential with our hybrid guidance platform. Deep psychological profiling
                meets expert human validation to map your ideal career path.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="/register" className="btn-primary w-full sm:w-auto text-center">Start Your Journey</a>
                <button
                    onClick={() => window.location.href = '/sample-report'}
                    className="btn-secondary w-full sm:w-auto"
                >
                    View Sample Report
                </button>
            </div>
        </div>

        {/* Background Decorations */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
    </section>
);

export const Features = () => (
    <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
            {[
                {
                    title: "Digitized Modules",
                    desc: "Complete structured, self-paced questionnaires designed by psychologists.",
                    icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c1.097 0 2.148.195 3.122.552L12 19.354V6.042z"
                },
                {
                    title: "Expert Validation",
                    desc: "Our career veterans review every response to ensure depth and clarity.",
                    icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                },
                {
                    title: "AI Career Engine",
                    desc: "Advanced logic pairs your unique profile with real-world industry data.",
                    icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                }
            ].map((f, i) => (
                <div key={i} className="glass-card p-8 group">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                        <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
            ))}
        </div>
    </section>
);

export const DashboardPreview = () => (
    <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
            <div className="glass-card p-1 md:p-4 bg-white/5 border-white/5 overflow-hidden">
                <div className="glass rounded-xl overflow-hidden border-white/10 shadow-2xl relative">
                    {/* Header Mockup */}
                    <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-slate-900/40">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        </div>
                        <div className="px-3 py-1 rounded bg-white/5 text-[10px] text-slate-500 font-mono tracking-wider uppercase">
                            Client Dashboard // Finalizing Phase 1
                        </div>
                    </div>

                    {/* Content Mockup */}
                    <div className="p-8 grid md:grid-cols-[240px_1fr] gap-8 bg-[var(--background)]">
                        <div className="space-y-6 hidden md:block border-r border-white/5 pr-8">
                            <div className="w-32 h-4 bg-white/10 rounded" />
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`h-8 rounded flex items-center px-3 ${i === 0 ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                                        <div className={`w-3 h-3 rounded-sm mr-3 ${i === 0 ? 'bg-indigo-500' : 'bg-white/10'}`} />
                                        <div className="w-full h-2 bg-white/10 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xl font-bold mb-1">Career Journey Progress</h4>
                                    <p className="text-xs text-slate-500">Last updated today at 10:42 AM</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-indigo-400">74%</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">Completed</div>
                                </div>
                            </div>

                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="w-[74%] h-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="w-8 h-8 rounded bg-white/5" />
                                            <div className={`w-2 h-2 rounded-full ${i < 4 ? 'bg-green-500' : 'bg-indigo-500'}`} />
                                        </div>
                                        <div className="w-2/3 h-3 bg-white/10 rounded" />
                                        <div className="w-full h-2 bg-white/5 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

export const Experts = () => (
    <section id="experts" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Met Your <span className="text-gradient">Advisors</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Our experts combine decades of industry experience with deep psychological insights to guide your journey.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
            {[
                { name: "Dr. Aris Thorne", role: "Psychology Lead", expertise: "Behavioral Analysis", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aris" },
                { name: "Marcus Chen", role: "Industry Strategist", expertise: "Tech & Innovation", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" },
                { name: "Sarah Jenkins", role: "Career Coach", expertise: "Leadership Mastery", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
                { name: "Elena Rodriguez", role: "Market Analyst", expertise: "Global Trends", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena" }
            ].map((expert, i) => (
                <div key={i} className="glass-card p-6 text-center group hover:border-indigo-500/30 transition-all">
                    <div className="w-20 h-20 rounded-full mx-auto mb-6 border-2 border-indigo-500/20 p-1 group-hover:border-indigo-500/50 transition-colors">
                        <img src={expert.image} alt={expert.name} className="w-full h-full rounded-full bg-slate-800" />
                    </div>
                    <h4 className="font-bold text-lg mb-1">{expert.name}</h4>
                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">{expert.role}</p>
                    <div className="pt-4 border-t border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {expert.expertise}
                    </div>
                </div>
            ))}
        </div>
    </section>
);

export const Pricing = () => (
    <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, <span className="text-gradient">Transparent</span> Pricing</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Choose the path that best fits your career ambitions.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="glass-card p-10 border-white/5 relative overflow-hidden">
                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-2">Explorer</h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">$0</span>
                        <span className="text-slate-500 text-sm">/forever</span>
                    </div>
                </div>
                <ul className="space-y-4 mb-10">
                    {[
                        "7 Core Diagnostic Modules",
                        "Basic AI Behavior Markers",
                        "Community Access",
                        "Journey Progress Tracking"
                    ].map((perk, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {perk}
                        </li>
                    ))}
                </ul>
                <a href="/register" className="btn-secondary w-full text-center py-3">Get Started Free</a>
            </div>

            {/* Paid Tier */}
            <div className="glass-card p-10 border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 bg-indigo-500 text-[10px] font-bold uppercase tracking-widest text-white rounded-bl-xl">Most Popular</div>
                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-2">Elite</h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">$99</span>
                        <span className="text-slate-500 text-sm">/one-time</span>
                    </div>
                </div>
                <ul className="space-y-4 mb-10">
                    {[
                        "Everything in Explorer",
                        "Full AI Career Synthesis",
                        "Priority Expert Validation",
                        "1-on-1 Expert Chat Access",
                        "Lifetime Report Updates"
                    ].map((perk, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-100 font-medium">
                            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {perk}
                        </li>
                    ))}
                </ul>
                <button className="btn-primary w-full py-3 shadow-lg shadow-indigo-500/20">Upgrade to Elite</button>
            </div>
        </div>
    </section>
);

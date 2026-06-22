"use client";
import React from 'react';
import { useSession, signOut } from 'next-auth/react';

export const Navbar = () => {
    const { data: session, status } = useSession();

    return (
        <nav className="fixed top-0 w-full z-50 px-6 py-4">
            <div className="max-w-7xl mx-auto glass rounded-full px-8 py-3 flex items-center justify-between">
                <div className="text-2xl font-bold tracking-tighter flex items-center gap-3">
                    <img src="/logo.jpg" alt="Logo" className="w-9 h-9 object-contain rounded-md shrink-0" />
                    <a href="/" className="hover:opacity-80 transition-opacity font-extrabold text-slate-100 text-lg md:text-xl">
                        Career <span className="text-[var(--color-brand-yellow)]">Explore</span> Journey
                    </a>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                    <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
                    <a href="#experts" className="hover:text-white transition-colors">Our Experts</a>
                    <a href="#flow" className="hover:text-white transition-colors">User Flow</a>
                    <a href="#services" className="hover:text-white transition-colors">Services</a>
                </div>

                <div className="flex items-center gap-4 min-h-[40px]">
                    {status === 'loading' ? (
                        <div className="w-20 h-4 bg-white/5 animate-pulse rounded" />
                    ) : session ? (
                        <>
                            <a href={(session?.user as any)?.role === 'ADMIN' ? '/admin' : (session?.user as any)?.role === 'PARENT' ? '/parent' : '/dashboard'} className="text-sm font-bold text-[var(--color-brand-yellow)] hover:text-[var(--color-brand-yellow-hover)] transition-colors uppercase tracking-widest">Dashboard</a>
                            <button
                                onClick={() => signOut()}
                                className="text-sm font-medium text-slate-500 hover:text-white transition-colors cursor-pointer"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <a href="/login" className="text-sm font-medium hover:text-[var(--color-brand-yellow)] transition-colors">Log In</a>
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-brand-yellow)]/20 bg-[var(--color-brand-yellow)]/10 text-xs font-semibold text-[var(--color-brand-yellow)] mb-8 animate-fade-in">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand-yellow)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-brand-yellow)]"></span>
                </span>
                Now powered by Next-Gen AI
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] text-slate-100">
                Your Future, <span className="text-gradient">Tailored</span>. <br />
                AI Guided, <span className="text-white/40">Human Vetted</span>.
            </h1>

            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Unlock your true potential with our hybrid guidance platform. Deep psychological profiling
                meets expert 360° holistic analysis to map your ideal career path.
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
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-brand-yellow)]/5 rounded-full blur-[128px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
    </section>
);

export const Features = () => (
    <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
            {[
                {
                    title: "Modules",
                    desc: "Complete structured, self-paced questionnaires designed by psychologists.",
                    icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c1.097 0 2.148.195 3.122.552L12 19.354V6.042z"
                },
                {
                    title: "360° Holistic Analysis",
                    desc: "Our career veterans review every response to ensure depth and clarity.",
                    icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                },
                {
                    title: "Final Career Options",
                    desc: "Advanced logic pairs your unique profile with real-world industry data.",
                    icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                }
            ].map((f, i) => (
                <div key={i} className="glass-card p-8 group">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-yellow)]/10 border border-[var(--color-brand-yellow)]/20 flex items-center justify-center mb-6 group-hover:bg-[var(--color-brand-yellow)]/20 transition-colors">
                        <svg className="w-6 h-6 text-[var(--color-brand-yellow)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-100">{f.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
            ))}
        </div>
    </section>
);

export const Experts = () => (
    <section id="experts" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-100">Meet Your <span className="text-gradient">Advisors</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Our experts combine decades of industry experience with deep psychological insights to guide your journey.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
            {[
                { name: "Dr. Aris Thorne", role: "Psychology Lead", expertise: "Behavioral Analysis", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aris" },
                { name: "Marcus Chen", role: "Industry Strategist", expertise: "Tech & Innovation", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" },
                { name: "Sarah Jenkins", role: "Career Coach", expertise: "Leadership Mastery", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
                { name: "Elena Rodriguez", role: "Market Analyst", expertise: "Global Trends", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena" }
            ].map((expert, i) => (
                <div key={i} className="glass-card p-6 text-center group hover:border-[var(--color-brand-yellow)]/30 transition-all">
                    <div className="w-20 h-20 rounded-full mx-auto mb-6 border-2 border-[var(--color-brand-yellow)]/20 p-1 group-hover:border-[var(--color-brand-yellow)]/50 transition-colors">
                        <img src={expert.image} alt={expert.name} className="w-full h-full rounded-full bg-slate-800" />
                    </div>
                    <h4 className="font-bold text-lg mb-1 text-slate-100">{expert.name}</h4>
                    <p className="text-[var(--color-brand-yellow)] text-xs font-bold uppercase tracking-widest mb-4">{expert.role}</p>
                    <div className="pt-4 border-t border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {expert.expertise}
                    </div>
                </div>
            ))}
        </div>
    </section>
);

export const ClientFlow = () => (
    <section id="flow" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-100">How It Works for <span className="text-gradient">Clients</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Follow this simple 2-step process to kickstart your customized career planning.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto relative">
            {/* Step 1 */}
            <div className="glass-card p-10 border-white/5 relative flex flex-col justify-between">
                <div>
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-yellow)]/10 border border-[var(--color-brand-yellow)]/20 flex items-center justify-center mb-6 text-[var(--color-brand-yellow)] font-black text-xl">
                        1
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-100">Solve the First 3 Modules</h3>
                    <p className="text-slate-400 leading-relaxed mb-6">
                        Complete your foundational modules: **Demographics**, **Aim & Vision**, and **Interests & Personality Tests**. This forms the basis of your holistic profile.
                    </p>
                </div>
                <div className="text-xs text-[var(--color-brand-yellow)] font-bold tracking-widest uppercase">
                    Step 1: Foundational Assessment
                </div>
            </div>

            {/* Step 2 */}
            <div className="glass-card p-10 border-[var(--color-brand-yellow)]/30 bg-[var(--color-brand-yellow)]/5 relative flex flex-col justify-between">
                <div>
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-yellow)] flex items-center justify-center mb-6 text-[#121212] font-black text-xl">
                        2
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-100">Book Appointment with Mentor</h3>
                    <p className="text-slate-300 leading-relaxed mb-6">
                        Once the first 3 modules are filled, schedule a 1-on-1 session with your assigned career expert to analyze your results and validate your career roadmap.
                    </p>
                </div>
                <div className="text-xs text-[var(--color-brand-yellow)] font-bold tracking-widest uppercase">
                    Step 2: 1-on-1 Validation Session
                </div>
            </div>
        </div>
    </section>
);

export const Services = () => (
    <section id="services" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-100">Our Core <span className="text-gradient">Services</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Explore the range of advanced career analysis and support services provided on this platform.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
            {[
                {
                    title: "Personality Assessment",
                    desc: "In-depth testing covering MBTI (16 Personality Factors), Holland Codes (RIASEC), and Color profile alignment.",
                    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                },
                {
                    title: "AI Career Research",
                    desc: "Instant access to real-world salary comparisons, local vs. international demand, and customized pathways.",
                    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                },
                {
                    title: "Mock Interview Coach",
                    desc: "Practice for your dream role with an interactive AI coach providing realistic questions, scoring, and feedback.",
                    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                },
                {
                    title: "Expert Career Report",
                    desc: "Receive a verified, 360-degree holistic career report with actionable steps vetted by human career mentors.",
                    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                }
            ].map((s, i) => (
                <div key={i} className="glass-card p-6 flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-yellow)]/10 border border-[var(--color-brand-yellow)]/20 flex items-center justify-center mb-6 text-[var(--color-brand-yellow)]">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                            </svg>
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-slate-100">{s.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-4">{s.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    </section>
);

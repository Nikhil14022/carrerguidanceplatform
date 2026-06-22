'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationDropdown from '@/components/NotificationDropdown';
import ProfileDropdown from '@/components/ProfileDropdown';

const clientNavItems = [
    { 
        label: 'Profile Overview', 
        href: '/dashboard',
        icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        )
    },
    { 
        label: 'Modules', 
        href: '/dashboard/modules',
        icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        )
    },
    { 
        label: 'My Reports', 
        href: '/dashboard/reports',
        icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        )
    },
    { 
        label: 'AI Research', 
        href: '/dashboard/research',
        icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        )
    },
    { 
        label: 'Resume Builder', 
        href: '/dashboard/resume',
        icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        )
    },
    { 
        label: 'Expert Chat', 
        href: '/dashboard/expert-chat',
        icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        )
    },
    { 
        label: 'Appointments', 
        href: '/dashboard/appointments',
        icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )
    },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebar-minimized') === 'true';
        }
        return false;
    });

    const toggleMinimize = () => {
        setIsMinimized(prev => {
            const next = !prev;
            localStorage.setItem('sidebar-minimized', String(next));
            return next;
        });
    };

    const sidebarContent = (
        <div className="h-full flex flex-col justify-between">
            <div className="flex-1 flex flex-col">
                <div className={`p-6 ${isMinimized ? 'flex justify-center' : ''}`}>
                    <div className="flex items-center justify-between w-full">
                        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-85 transition-opacity cursor-pointer">
                            <img src="/logo.jpg" alt="Logo" className="w-8 h-8 object-contain rounded-md shrink-0" />
                            {!isMinimized && (
                                <span className="text-lg font-extrabold text-slate-100 leading-none">
                                    Career <span className="text-[var(--color-brand-yellow)]">Explore</span> Journey
                                </span>
                            )}
                        </Link>
                    </div>
                    {!isMinimized && <p className="text-sm text-slate-500 mt-1">Client Portal</p>}
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {clientNavItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    } ${isMinimized ? 'justify-center px-2' : ''}`}
                                title={isMinimized ? item.label : undefined}
                            >
                                <span className="shrink-0">{item.icon}</span>
                                {!isMinimized && <span className="transition-all duration-300">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Minimizer Toggle Button at bottom */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={toggleMinimize}
                    className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer w-full flex items-center justify-center gap-2"
                >
                    <svg className={`w-5 h-5 transition-transform duration-300 ${isMinimized ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                    {!isMinimized && <span className="text-xs font-bold uppercase tracking-widest">Minimize</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-300">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Desktop Sidebar (Always occupies space on large screens) */}
            <aside className={`hidden md:flex flex-col shrink-0 bg-slate-950 border-r border-slate-800 z-10 transition-all duration-300 ${isMinimized ? 'w-20' : 'w-64'}`}>
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar (Fixed overlay on small screens) */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 z-50 transform transition-transform duration-300 ease-in-out md:hidden" style={{ transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
                {sidebarContent}
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
                <header className="relative z-50 bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between md:bg-transparent md:border-transparent md:justify-end md:px-8 md:pt-8 md:pb-0">
                    <h1 className="font-bold text-lg text-slate-100 md:hidden">Career Explore Journey</h1>
                    <div className="flex items-center gap-4 ml-auto">
                        <NotificationDropdown />
                        <ProfileDropdown />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

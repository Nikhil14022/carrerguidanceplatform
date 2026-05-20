'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationDropdown from '@/components/NotificationDropdown';
import ProfileDropdown from '@/components/ProfileDropdown';

const clientNavItems = [
    { label: 'Profile Overview', href: '/dashboard' },
    { label: 'Modules', href: '/dashboard/modules' },
    { label: 'My Reports', href: '/dashboard/reports' },
    { label: 'AI Research', href: '/dashboard/research' },
    { label: 'Resume Builder', href: '/dashboard/resume' },
    { label: 'Expert Chat', href: '/dashboard/expert-chat' },
    { label: 'Appointments', href: '/dashboard/appointments' },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const sidebarContent = (
        <div className="h-full flex flex-col">
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <Link href="/">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                            Career Path
                        </h2>
                    </Link>
                </div>
                <p className="text-sm text-slate-500 mt-1">Client Portal</p>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {clientNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#030712] overflow-hidden text-slate-300">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Desktop Sidebar (Always occupies space on large screens) */}
            <aside className="hidden md:flex flex-col w-64 shrink-0 bg-slate-950 border-r border-slate-800 z-10 transition-all">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar (Fixed overlay on small screens) */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {sidebarContent}
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
                <header className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between z-10 md:bg-transparent md:border-transparent md:justify-end md:px-8 md:pt-8 md:pb-0">
                    <h1 className="font-bold text-lg text-white md:hidden">Career Path</h1>
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

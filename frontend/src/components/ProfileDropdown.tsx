'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function ProfileDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const { data: session } = useSession();
    const role = (session?.user as any)?.role || 'CLIENT';

    // Determine friendly role name for menu display
    const getFriendlyRoleName = (roleStr: string) => {
        const lower = roleStr.toLowerCase();
        if (lower.startsWith('mentor')) return 'Mentor';
        if (lower === 'super_admin') return 'Super Admin';
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    };

    // Determine the base path based on role
    const getBasePath = () => {
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') return '/admin';
        if (role === 'EXPERT' || role.startsWith('MENTOR')) return '/mentor';
        if (role === 'PARENT') return '/parent';
        return '/dashboard'; // Default client path
    };

    const basePath = getBasePath();

    return (
        <div className="relative flex items-center" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] overflow-hidden z-[9999] transform origin-top-right transition-all text-slate-200">
                    <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/50">
                        <p className="text-sm font-medium text-white">Menu</p>
                    </div>
                    <div className="p-2 space-y-1">
                        <Link
                            href={`${basePath}/profile`}
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            {getFriendlyRoleName(role)} Profile
                        </Link>
                        <Link
                            href={`${basePath}/settings`}
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Settings
                        </Link>
                    </div>
                    <div className="p-2 border-t border-slate-800">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                signOut({ callbackUrl: '/' });
                            }}
                            className="w-full text-left block px-3 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

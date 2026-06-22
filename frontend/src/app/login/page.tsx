"use client";
import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
    const [role, setRole] = useState('CLIENT');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');

    const roleMap: Record<string, string> = {
        'client': 'CLIENT',
        'parent': 'PARENT',
        'admin': 'ADMIN'
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
            } else {
                // Get the session after sign-in to check role for redirection
                const sessionRes = await fetch('/api/auth/session');
                const session = await sessionRes.json();

                if (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') {
                    router.push('/admin');
                } else if (session?.user?.role === 'EXPERT' || session?.user?.role === 'MENTOR_PERMANENT' || session?.user?.role === 'MENTOR_TEMPORARY') {
                    router.push('/mentor');
                } else if (session?.user?.role === 'PARENT') {
                    router.push('/parent');
                } else {
                    router.push('/dashboard');
                }
                router.refresh();
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen mesh-gradient flex items-center justify-center p-6">
            <div className="absolute top-8 left-8">
                <a href="/" className="text-2xl font-extrabold tracking-tighter flex items-center gap-3">
                    <img src="/logo.jpg" alt="Logo" className="w-8 h-8 object-contain rounded-md" />
                    <span>Career Explore Journey</span>
                </a>
            </div>

            <div className="max-w-md w-full glass-card p-10 relative overflow-hidden">
                {/* Role Selector */}
                <div className="flex bg-slate-800 p-1 rounded-xl mb-8 border border-slate-700">
                    {['client', 'parent', 'admin'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRole(roleMap[r])}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all 
                ${role === roleMap[r] ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold mb-3 capitalize">{role.toLowerCase()} Login</h1>
                    <p className="text-sm text-slate-400">Enter your credentials to access the platform</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                            {error}
                        </div>
                    )}

                    {registered === 'true' && !error && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm text-center font-bold">
                            Registration successful! Please log in.
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between px-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                            <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300">Forgot?</a>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full mt-4 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : `Sign In to ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                    <p className="text-sm text-slate-500">
                        Don't have an account?
                        <a href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium ml-2">Sign up</a>
                    </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen mesh-gradient flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>}>
            <LoginForm />
        </Suspense>
    );
}

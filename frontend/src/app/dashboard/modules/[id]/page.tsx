import ModuleEngine from '@/components/ModuleEngine';
import React from 'react';

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <main className="min-h-screen mesh-gradient p-4 md:p-10">
            <div className="mb-8">
                <a href="/dashboard" className="text-slate-500 hover:text-white transition-colors inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    Exit Assessment
                </a>
            </div>

            <ModuleEngine moduleId={id} />
        </main>
    );
}

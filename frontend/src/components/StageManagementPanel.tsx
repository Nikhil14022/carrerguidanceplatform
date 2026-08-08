"use client";
import React, { useState } from 'react';

interface Stage {
    id?: string;
    stageNumber: number;
    stageName: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'NOT_APPLICABLE' | string;
    notes?: string;
    meetingOutcomes?: string;
    tasks?: any;
    documents?: any;
}

interface StageManagementPanelProps {
    stages: Stage[];
    journeyStatus?: string;
    onEditStage: (stage: Stage) => void;
    accentColor?: 'indigo' | 'orange';
}

export default function StageManagementPanel({
    stages = [],
    journeyStatus = 'In Progress',
    onEditStage,
    accentColor = 'indigo'
}: StageManagementPanelProps) {
    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'PENDING'>('ALL');

    const totalStages = stages.length || 9;
    const completedCount = stages.filter(s => s.status === 'COMPLETED').length;
    const inProgressCount = stages.filter(s => s.status === 'IN_PROGRESS').length;
    const percentComplete = Math.round((completedCount / totalStages) * 100);

    const activeAccent = accentColor === 'orange' ? 'bg-orange-500 text-white' : 'bg-indigo-600 text-white';
    const borderAccent = accentColor === 'orange' ? 'border-orange-500/30' : 'border-indigo-500/30';
    const textAccent = accentColor === 'orange' ? 'text-orange-400' : 'text-indigo-400';
    const bgAccentSubtle = accentColor === 'orange' ? 'bg-orange-500/10 border-orange-500/20 text-orange-300' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300';

    const filteredStages = stages.filter(s => {
        if (filter === 'ACTIVE') return s.status === 'IN_PROGRESS' || s.status === 'ON_HOLD';
        if (filter === 'COMPLETED') return s.status === 'COMPLETED';
        if (filter === 'PENDING') return s.status === 'NOT_STARTED';
        return true;
    });

    return (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm space-y-6">
            {/* Header with Journey Status & Progress Counter */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b border-white/5">
                <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <span>🚀 Client Journey Stages & Workflow</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">Structured progression tracking for student career milestones.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${bgAccentSubtle}`}>
                        Status: {journeyStatus}
                    </span>
                </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">Overall Stage Completion</span>
                    <span className={`font-black ${textAccent}`}>{completedCount} of {totalStages} Stages Done ({percentComplete}%)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-white/5">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${accentColor === 'orange' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`}
                        style={{ width: `${percentComplete}%` }}
                    />
                </div>
            </div>

            {/* Sequential Step Indicator Bar */}
            <div className="overflow-x-auto pb-2">
                <div className="flex items-center justify-between min-w-[650px] relative px-4 py-2">
                    {/* Connecting line */}
                    <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 z-0" />

                    {stages.map((stage) => {
                        const isDone = stage.status === 'COMPLETED';
                        const isCurrent = stage.status === 'IN_PROGRESS';
                        const isHold = stage.status === 'ON_HOLD';

                        let circleStyle = "bg-slate-900 border-slate-700 text-slate-500";
                        if (isDone) circleStyle = "bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20";
                        else if (isCurrent) circleStyle = accentColor === 'orange' ? "bg-orange-500 border-orange-400 text-white animate-pulse ring-4 ring-orange-500/20" : "bg-indigo-600 border-indigo-400 text-white animate-pulse ring-4 ring-indigo-500/20";
                        else if (isHold) circleStyle = "bg-amber-500 border-amber-400 text-white";

                        return (
                            <button
                                key={stage.stageNumber}
                                onClick={() => onEditStage(stage)}
                                className="z-10 flex flex-col items-center gap-1.5 group cursor-pointer"
                                title={`Stage ${stage.stageNumber}: ${stage.stageName} (${stage.status})`}
                            >
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all group-hover:scale-110 ${circleStyle}`}>
                                    {isDone ? '✓' : stage.stageNumber}
                                </div>
                                <span className={`text-[9px] font-bold tracking-tight max-w-[64px] text-center line-clamp-1 transition-colors ${isCurrent ? textAccent : 'text-slate-400 group-hover:text-slate-200'}`}>
                                    S{stage.stageNumber}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                <div className="flex gap-1.5 overflow-x-auto">
                    {[
                        { key: 'ALL', label: `All Stages (${stages.length})` },
                        { key: 'ACTIVE', label: `Active / In Progress (${inProgressCount})` },
                        { key: 'COMPLETED', label: `Completed (${completedCount})` },
                        { key: 'PENDING', label: `Not Started (${stages.length - completedCount - inProgressCount})` }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter === tab.key ? activeAccent : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* De-cluttered Stages Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
                {filteredStages.length === 0 ? (
                    <div className="col-span-full py-8 text-center bg-slate-950/30 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-400 italic">No stages match the selected filter.</p>
                    </div>
                ) : (
                    filteredStages.map((stage) => {
                        const isDone = stage.status === 'COMPLETED';
                        const isCurrent = stage.status === 'IN_PROGRESS';
                        const isHold = stage.status === 'ON_HOLD';
                        const isNA = stage.status === 'NOT_APPLICABLE';

                        let badgeStyle = "bg-slate-800 text-slate-400 border-slate-700";
                        if (isDone) badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                        else if (isCurrent) badgeStyle = accentColor === 'orange' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                        else if (isHold) badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                        else if (isNA) badgeStyle = "bg-slate-800/50 text-slate-500 border-slate-800";

                        let tasks = [];
                        try {
                            tasks = typeof stage.tasks === 'string' ? JSON.parse(stage.tasks) : (stage.tasks || []);
                        } catch { tasks = []; }
                        const completedTasks = tasks.filter((t: any) => t.completed).length;

                        let docs = [];
                        try {
                            docs = typeof stage.documents === 'string' ? JSON.parse(stage.documents) : (stage.documents || []);
                        } catch { docs = []; }

                        return (
                            <div
                                key={stage.stageNumber}
                                className={`p-4 bg-slate-950/50 rounded-xl border transition-all flex flex-col justify-between space-y-3 hover:border-white/20 shadow-sm ${isCurrent ? borderAccent : 'border-white/5'}`}
                            >
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-slate-300">
                                                {stage.stageNumber}
                                            </span>
                                            <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{stage.stageName}</h4>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0 ${badgeStyle}`}>
                                            {stage.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>

                                    {stage.notes && (
                                        <p className="text-[11px] text-slate-400 italic line-clamp-2 bg-slate-900/40 p-2 rounded-lg border border-white/5">
                                            "{stage.notes}"
                                        </p>
                                    )}

                                    <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400 pt-1">
                                        {tasks.length > 0 && (
                                            <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                📋 Tasks: {completedTasks}/{tasks.length}
                                            </span>
                                        )}
                                        {docs.length > 0 && (
                                            <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                📄 Docs: {docs.length}
                                            </span>
                                        )}
                                        {stage.meetingOutcomes && (
                                            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                📝 Decisions logged
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => onEditStage(stage)}
                                    className={`w-full py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all text-center cursor-pointer shadow-sm ${isCurrent ? activeAccent : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'}`}
                                >
                                    Manage Stage Details
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

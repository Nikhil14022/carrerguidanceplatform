"use client";
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SkillData {
    subject: string;
    A: number;
    fullMark: number;
}

interface SkillRadarProps {
    data: SkillData[];
}

export const SkillRadar: React.FC<SkillRadarProps> = ({ data }) => {
    return (
        <div className="w-full h-[300px] bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Competency Map</h3>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                        itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                    />
                    <Radar
                        name="Student Capability"
                        dataKey="A"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.5}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

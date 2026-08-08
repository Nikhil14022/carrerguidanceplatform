"use client";
import React from 'react';

interface InteractiveObjectEditorProps {
    value: any;
    onChange: (newValue: any) => void;
    accentColor?: 'indigo' | 'orange';
}

export default function InteractiveObjectEditor({
    value,
    onChange,
    accentColor = 'indigo'
}: InteractiveObjectEditorProps) {
    const focusBorderClass = accentColor === 'orange' ? 'focus:border-orange-500' : 'focus:border-indigo-500';
    const badgeClass = accentColor === 'orange' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';

    // Helper: Educational background specific structure
    const isEduBg = value && typeof value === 'object' && !Array.isArray(value) && (value.school || value.college || value.university);

    if (isEduBg) {
        const edu = typeof value === 'object' && value !== null ? value : {};
        const levels = [
            { key: 'school', label: 'School / Schooling (Class 1 - 10)' },
            { key: 'college', label: 'Junior College / High School (Class 11 - 12)' },
            { key: 'university', label: 'University / Higher Education' }
        ];

        const handleEduChange = (levelKey: string, fieldKey: string, val: any) => {
            const currentLevel = edu[levelKey] || { active: false, name: '', grade: '' };
            const updated = {
                ...edu,
                [levelKey]: {
                    ...currentLevel,
                    [fieldKey]: val
                }
            };
            onChange(updated);
        };

        return (
            <div className="space-y-4 bg-slate-950 p-4 border border-slate-800 rounded-2xl max-w-4xl">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Educational Background Form</div>
                {levels.map(({ key, label }) => {
                    const levelData = edu[key] || { active: false, name: '', grade: '' };
                    return (
                        <div key={key} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-300">{label}</span>
                                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!levelData.active}
                                        onChange={e => handleEduChange(key, 'active', e.target.checked)}
                                        className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 accent-indigo-500"
                                    />
                                    <span>Active / Attended</span>
                                </label>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Institution Name</label>
                                    <input
                                        type="text"
                                        value={levelData.name || ''}
                                        placeholder="e.g. Delhi Public School / Mumbai Univ"
                                        onChange={e => handleEduChange(key, 'name', e.target.value)}
                                        className={`w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none ${focusBorderClass}`}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Grade / Stream / Percentage</label>
                                    <input
                                        type="text"
                                        value={levelData.grade || levelData.percentage || levelData.stream || levelData.degree || ''}
                                        placeholder="e.g. 92% / Science / B.Tech"
                                        onChange={e => handleEduChange(key, 'grade', e.target.value)}
                                        className={`w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none ${focusBorderClass}`}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Generic Object handling
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value;
        const entries = Object.entries(obj);

        const handleKeyChange = (oldKey: string, newKey: string) => {
            if (!newKey || oldKey === newKey) return;
            const updated: Record<string, any> = {};
            for (const [k, v] of Object.entries(obj)) {
                if (k === oldKey) {
                    updated[newKey] = v;
                } else {
                    updated[k] = v;
                }
            }
            onChange(updated);
        };

        const handleValueChange = (key: string, val: any) => {
            onChange({ ...obj, [key]: val });
        };

        const handleSubValueChange = (parentKey: string, subKey: string, val: any) => {
            const parentObj = obj[parentKey] && typeof obj[parentKey] === 'object' ? obj[parentKey] : {};
            onChange({
                ...obj,
                [parentKey]: {
                    ...parentObj,
                    [subKey]: val
                }
            });
        };

        const handleRemoveKey = (key: string) => {
            const updated = { ...obj };
            delete updated[key];
            onChange(updated);
        };

        const handleAddField = () => {
            const newKey = `field_${entries.length + 1}`;
            onChange({ ...obj, [newKey]: '' });
        };

        return (
            <div className="space-y-3 bg-slate-950 p-4 border border-slate-850 rounded-2xl max-w-4xl">
                {entries.map(([key, val], idx) => {
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                    // Nested object
                    if (val && typeof val === 'object' && !Array.isArray(val)) {
                        const subEntries = Object.entries(val);
                        return (
                            <div key={key} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                                    <span className="text-xs font-bold text-slate-300">{formattedKey}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveKey(key)}
                                        className="text-slate-500 hover:text-red-400 text-xs font-bold px-1"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    {subEntries.map(([subKey, subVal]) => {
                                        const subLabel = subKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                        if (typeof subVal === 'boolean') {
                                            return (
                                                <label key={subKey} className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer py-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={subVal}
                                                        onChange={e => handleSubValueChange(key, subKey, e.target.checked)}
                                                        className="w-4 h-4 rounded bg-slate-950 border-slate-800 accent-indigo-500"
                                                    />
                                                    <span>{subLabel}</span>
                                                </label>
                                            );
                                        }
                                        return (
                                            <div key={subKey}>
                                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">{subLabel}</label>
                                                <input
                                                    type="text"
                                                    value={String(subVal ?? '')}
                                                    onChange={e => handleSubValueChange(key, subKey, e.target.value)}
                                                    className={`w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none ${focusBorderClass}`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }

                    // Boolean field
                    if (typeof val === 'boolean') {
                        return (
                            <div key={key} className="flex items-center justify-between p-2.5 bg-slate-900/40 border border-slate-850 rounded-xl">
                                <span className="text-xs font-bold text-slate-300">{formattedKey}</span>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={val}
                                            onChange={e => handleValueChange(key, e.target.checked)}
                                            className="w-4 h-4 rounded bg-slate-950 border-slate-800 accent-indigo-500"
                                        />
                                        <span>{val ? 'Yes / Enabled' : 'No / Disabled'}</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveKey(key)}
                                        className="text-slate-500 hover:text-red-400 text-xs font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // Primitive field (string/number)
                    const isLongText = typeof val === 'string' && val.length > 100;
                    return (
                        <div key={key} className="space-y-1 bg-slate-900/30 p-2.5 border border-slate-850 rounded-xl">
                            <div className="flex justify-between items-center">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{formattedKey}</label>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveKey(key)}
                                    className="text-slate-500 hover:text-red-400 text-xs font-bold px-1"
                                >
                                    ✕
                                </button>
                            </div>
                            {isLongText ? (
                                <textarea
                                    value={String(val ?? '')}
                                    onChange={e => handleValueChange(key, e.target.value)}
                                    rows={3}
                                    className={`w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none ${focusBorderClass}`}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={String(val ?? '')}
                                    onChange={e => handleValueChange(key, e.target.value)}
                                    className={`w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none ${focusBorderClass}`}
                                />
                            )}
                        </div>
                    );
                })}

                <button
                    type="button"
                    onClick={handleAddField}
                    className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${badgeClass}`}
                >
                    + Add Custom Field
                </button>
            </div>
        );
    }

    // Array handling
    if (Array.isArray(value)) {
        const handleArrayItemChange = (idx: number, newVal: any) => {
            const next = [...value];
            next[idx] = newVal;
            onChange(next);
        };

        const handleRemoveArrayItem = (idx: number) => {
            onChange(value.filter((_, i) => i !== idx));
        };

        const handleAddArrayItem = () => {
            onChange([...value, '']);
        };

        return (
            <div className="space-y-2 bg-slate-950 p-4 border border-slate-850 rounded-2xl max-w-4xl">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">List Items</div>
                {value.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={String(item ?? '')}
                            onChange={e => handleArrayItemChange(idx, e.target.value)}
                            className={`flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none ${focusBorderClass}`}
                        />
                        <button
                            type="button"
                            onClick={() => handleRemoveArrayItem(idx)}
                            className="text-slate-500 hover:text-red-400 text-xs font-bold px-1"
                        >
                            ✕
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={handleAddArrayItem}
                    className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all mt-1 ${badgeClass}`}
                >
                    + Add Item
                </button>
            </div>
        );
    }

    // Primitive String / Number / Default
    const strVal = String(value ?? '');
    const isMultiLine = strVal.length > 80 || strVal.includes('\n');

    if (isMultiLine) {
        return (
            <textarea
                value={strVal}
                onChange={e => onChange(e.target.value)}
                rows={4}
                placeholder="Enter answer..."
                className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none ${focusBorderClass}`}
            />
        );
    }

    return (
        <input
            type="text"
            value={strVal}
            onChange={e => onChange(e.target.value)}
            placeholder="Enter answer..."
            className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none ${focusBorderClass}`}
        />
    );
}

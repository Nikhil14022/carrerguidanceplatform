"use client";
import React, { useState, useEffect } from 'react';

export default function ClientDataUploadPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('REPORT_CARD');
    const [fileUrl, setFileUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [dataList, setDataList] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = async () => {
        try {
            const res = await fetch('/api/parent/client-data');
            const data = await res.json();
            if (data.records) {
                setDataList(data.records);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!title.trim()) {
            setError('Title is required');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/parent/client-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, type, fileUrl })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to upload');

            setSuccess('Data uploaded successfully');
            setTitle('');
            setDescription('');
            setFileUrl('');
            fetchData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-slate-100">
            <div className="bg-white/5 border shadow-sm rounded-2xl p-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-100 mb-2">Upload Client Data</h1>
                <p className="text-slate-200 mb-8">Securely upload your child's report cards, certificates, and achievements. This data is reviewed by mentors and admins to refine the career strategy.</p>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <form onSubmit={handleSubmit} className="space-y-5 bg-white/5 p-6 rounded-xl border border-white/10">
                            <h2 className="text-lg font-bold text-slate-200 mb-2">New Entry</h2>

                            {error && <div className="text-rose-600 text-sm bg-rose-50 p-3 rounded-md border border-rose-200">{error}</div>}
                            {success && <div className="text-emerald-600 text-sm bg-emerald-500/10 p-3 rounded-md border border-emerald-200">{success}</div>}

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">Entry Type</label>
                                <select
                                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="REPORT_CARD">Report Card</option>
                                    <option value="ACHIEVEMENT">Certificate / Achievement</option>
                                    <option value="PROJECT">Project Details</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g. 10th Grade Final Marksheet"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">Description (Optional)</label>
                                <textarea
                                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-none"
                                    placeholder="Add any context or context..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">File URL or Link</label>
                                <input
                                    type="url"
                                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g. Google Drive link"
                                    value={fileUrl}
                                    onChange={(e) => setFileUrl(e.target.value)}
                                />
                                <p className="text-xs text-slate-500 mt-1">Please provide a link to the document (e.g., Google Drive, Dropbox). Ensure the link is accessible.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center"
                            >
                                {loading ? 'Uploading...' : 'Submit Entry'}
                            </button>
                        </form>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-slate-200 mb-4">Uploaded Records</h2>
                        {dataList.length === 0 ? (
                            <div className="p-8 border-2 border-dashed border-white/10 rounded-xl text-center text-slate-500">
                                No records uploaded yet.
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {dataList.map((record) => (
                                    <div key={record.id} className="p-4 bg-white/5 border rounded-lg shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded">
                                                {record.type.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(record.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-200">{record.title}</h3>
                                        {record.description && <p className="text-sm text-slate-400 mt-1">{record.description}</p>}
                                        {record.fileUrl && (
                                            <a
                                                href={record.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 mt-3 hover:underline"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                View Document
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

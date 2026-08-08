const fs = require('fs');
const path = require('path');

const mentorFilePath = path.join(__dirname, '../src/app/mentor/clients/[id]/page.tsx');
const adminFilePath = path.join(__dirname, '../src/app/admin/clients/[id]/page.tsx');
const adminPagePath = path.join(__dirname, '../src/app/admin/page.tsx');

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Define the light-themed replacement block for the Stage Editing Modal
    const replacement = `            {/* Stage Editing Modal */}
            {editingStage && (
                <div className="fixed inset-0 bg-slate-955/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl" style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' }}>
                        <div className="flex justify-between items-center pb-3 border-b" style={{ borderBottomColor: '#e2e8f0' }}>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#0f172a' }}>Manage Stage {editingStage.stageNumber}</h3>
                                <p className="text-xs font-bold" style={{ color: '#64748b' }}>{editingStage.stageName}</p>
                            </div>
                            <button
                                onClick={() => setEditingStage(null)}
                                className="hover:text-slate-900 text-lg font-bold cursor-pointer"
                                style={{ color: '#64748b', backgroundColor: 'transparent', border: 'none' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Status Select */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Stage Status</label>
                            <select
                                value={stageStatus}
                                onChange={(e) => setStageStatus(e.target.value)}
                                className="w-full rounded-xl px-4 py-2 text-xs outline-none cursor-pointer"
                                style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }}
                            >
                                <option value="NOT_STARTED" className="bg-white text-slate-900">Not Started</option>
                                <option value="IN_PROGRESS" className="bg-white text-slate-900">In Progress</option>
                                <option value="ON_HOLD" className="bg-white text-slate-900">On Hold</option>
                                <option value="COMPLETED" className="bg-white text-slate-900">Completed</option>
                                <option value="NOT_APPLICABLE" className="bg-white text-slate-900">Not Applicable</option>
                            </select>
                        </div>

                        {/* Counselor Notes */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Counselor Remarks / Notes</label>
                            <textarea
                                value={stageNotes}
                                onChange={(e) => setStageNotes(e.target.value)}
                                placeholder="Describe expectations, reminders, or general progress notes for the student..."
                                rows={3}
                                className="w-full rounded-xl p-3 text-xs outline-none resize-none"
                                style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }}
                            />
                        </div>

                        {/* Collaborative Outcomes (Meetings only) */}
                        {["Collaborative Meeting: Student and Parent", "Report Discussion with the Student", "Research Discussion"].includes(editingStage.stageName) && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Meeting Decisions & Outcomes</label>
                                <textarea
                                    value={stageOutcomes}
                                    onChange={(e) => setStageOutcomes(e.target.value)}
                                    placeholder="Enter finalized key decisions, follow-up points, or agreed alignments here..."
                                    rows={3}
                                    className="w-full rounded-xl p-3 text-xs outline-none resize-none"
                                    style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                        )}

                        {/* Tasks Checklist Manager */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Checklist Tasks</label>
                            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                {stageTasks.length === 0 ? (
                                    <p className="text-[10px] italic" style={{ color: '#64748b' }}>No tasks added to this stage yet.</p>
                                ) : (
                                    stageTasks.map((t, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg text-xs" style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={t.completed}
                                                    onChange={(e) => {
                                                        const updated = [...stageTasks];
                                                        updated[idx].completed = e.target.checked;
                                                        setStageTasks(updated);
                                                    }}
                                                    className="w-3.5 h-3.5 rounded accent-indigo-600 cursor-pointer"
                                                />
                                                <span className={t.completed ? "line-through text-slate-400" : ""}>{t.text}</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const updated = stageTasks.filter((_, i) => i !== idx);
                                                    setStageTasks(updated);
                                                }}
                                                className="text-red-650 hover:text-red-755 font-bold cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add a new checklist item..."
                                    value={newTaskText}
                                    onChange={(e) => setNewTaskText(e.target.value)}
                                    className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
                                    style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }}
                                />
                                <button
                                    onClick={() => {
                                        if (!newTaskText.trim()) return;
                                        setStageTasks([...stageTasks, { text: newTaskText.trim(), completed: false }]);
                                        setNewTaskText('');
                                    }}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-white"
                                    style={{ backgroundColor: '#4f46e5' }}
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Documents Manager */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Linked Documents & Resources</label>
                            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                {stageDocs.length === 0 ? (
                                    <p className="text-[10px] italic" style={{ color: '#64748b' }}>No documents attached yet.</p>
                                ) : (
                                    stageDocs.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg text-xs" style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                                            <div className="flex items-center gap-1.5 truncate">
                                                <span>📄</span>
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate text-indigo-600 font-semibold">
                                                    {doc.name}
                                                </a>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const updated = stageDocs.filter((_, i) => i !== idx);
                                                    setStageDocs(updated);
                                                }}
                                                className="text-red-650 hover:text-red-755 font-bold cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Document Name (e.g. Report.pdf)"
                                    value={newDocName}
                                    onChange={(e) => setNewDocName(e.target.value)}
                                    className="rounded-lg px-3 py-1.5 text-xs outline-none"
                                    style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Document URL (https://...)"
                                    value={newDocUrl}
                                    onChange={(e) => setNewDocUrl(e.target.value)}
                                    className="rounded-lg px-3 py-1.5 text-xs outline-none"
                                    style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    if (!newDocName.trim() || !newDocUrl.trim()) return;
                                    setStageDocs([...stageDocs, { name: newDocName.trim(), url: newDocUrl.trim(), addedAt: new Date().toISOString() }]);
                                    setNewDocName('');
                                    setNewDocUrl('');
                                }}
                                className="w-full py-2 text-xs font-bold rounded-lg transition-colors text-center cursor-pointer text-white"
                                style={{ backgroundColor: '#4f46e5' }}
                            >
                                + Attach Document
                            </button>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderTopColor: '#e2e8f0' }}>
                            <button
                                onClick={() => setEditingStage(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                style={{ backgroundColor: 'transparent', color: '#475569', border: '1px solid #cbd5e1' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveStage}
                                disabled={updatingStage}
                                className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50 text-white"
                                style={{ backgroundColor: '#4f46e5' }}
                            >
                                {updatingStage ? 'Saving...' : 'Save Stage Details'}
                            </button>
                        </div>
                    </div>
                </div>
            )}`;

    // Locate the modal block starting from "{/* Stage Editing Modal */}" to the next "            )}"
    const modalStartIndex = content.indexOf('{/* Stage Editing Modal */}');
    if (modalStartIndex === -1) {
        console.error('Could not find modal start comment in:', filePath);
        return;
    }

    const searchEndText = '            )}\n        </div>';
    const searchEndText2 = '            )}\r\n        </div>';
    let modalEndIndex = content.indexOf(searchEndText, modalStartIndex);
    let endOffset = searchEndText.length;
    if (modalEndIndex === -1) {
        modalEndIndex = content.indexOf(searchEndText2, modalStartIndex);
        endOffset = searchEndText2.length;
    }

    if (modalEndIndex === -1) {
        // Fallback: search for just the close brace
        const fallbackEndText = '            )}';
        modalEndIndex = content.indexOf(fallbackEndText, modalStartIndex + 500); // look further down
        endOffset = fallbackEndText.length;
    }

    if (modalEndIndex === -1) {
        console.error('Could not find modal end brace in:', filePath);
        return;
    }

    const targetBlock = content.slice(modalStartIndex, modalEndIndex + endOffset);
    const newContent = content.replace(targetBlock, replacement + '\n        </div>');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Successfully fixed modal contrast in:', filePath);
}

function fixAdminPage(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Update the Admin creation modal block to be light themed with black text inputs
    const replacement = `            {/* Create Client & Parent Modal */}
            {showCreateClient && mounted && createPortal(
                <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 lg:pl-64" style={{ zIndex: 99999 }} onClick={() => setShowCreateClient(false)}>
                    <div className="absolute inset-0 bg-slate-955/40 backdrop-blur-sm" />
                    <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up" style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }} onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b shrink-0" style={{ borderBottomColor: '#e2e8f0' }}>
                            <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>Create Client & Parent Accounts</h2>
                            <p className="text-xs font-semibold mt-1" style={{ color: '#64748b' }}>Registers linked student & parent profiles together and optionally assigns to a mentor.</p>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            {/* Client (Student) Details */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-2" style={{ color: '#4f46e5', borderBottomColor: '#e2e8f0' }}>Client (Student) Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Student Name</label>
                                        <input type="text" value={clientForm.clientName} onChange={e => setClientForm({ ...clientForm, clientName: e.target.value })}
                                            className="w-full rounded-xl px-4 py-2.5 text-xs outline-none" style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }} placeholder="John Doe" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Student Age</label>
                                        <input type="number" value={clientForm.clientAge} onChange={e => setClientForm({ ...clientForm, clientAge: parseInt(e.target.value) || 16 })}
                                            className="w-full rounded-xl px-4 py-2.5 text-xs outline-none" style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }} placeholder="16" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Student Email</label>
                                        <input type="email" value={clientForm.clientEmail} onChange={e => setClientForm({ ...clientForm, clientEmail: e.target.value })}
                                            className="w-full rounded-xl px-4 py-2.5 text-xs outline-none" style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }} placeholder="student@example.com" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Student Password</label>
                                        <input type="password" value={clientForm.clientPassword} onChange={e => setClientForm({ ...clientForm, clientPassword: e.target.value })}
                                            className="w-full rounded-xl px-4 py-2.5 text-xs outline-none" style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }} placeholder="••••••••" />
                                    </div>
                                </div>
                            </div>

                            {/* Parent Details */}
                            <div className="space-y-4 pt-4 border-t" style={{ borderTopColor: '#e2e8f0' }}>
                                <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-2" style={{ color: '#4f46e5', borderBottomColor: '#e2e8f0' }}>Parent Details</h3>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Parent Name</label>
                                    <input type="text" value={clientForm.parentName} onChange={e => setClientForm({ ...clientForm, parentName: e.target.value })}
                                        className="w-full rounded-xl px-4 py-2.5 text-xs outline-none" style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }} placeholder="Jane Doe" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Parent Email</label>
                                        <input type="email" value={clientForm.parentEmail} onChange={e => setClientForm({ ...clientForm, parentEmail: e.target.value })}
                                            className="w-full rounded-xl px-4 py-2.5 text-xs outline-none" style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }} placeholder="parent@example.com" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Parent Password</label>
                                        <input type="password" value={clientForm.parentPassword} onChange={e => setClientForm({ ...clientForm, parentPassword: e.target.value })}
                                            className="w-full rounded-xl px-4 py-2.5 text-xs outline-none" style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }} placeholder="••••••••" />
                                    </div>
                                </div>
                            </div>

                            {/* Direct Assignment */}
                            <div className="space-y-4 pt-4 border-t" style={{ borderTopColor: '#e2e8f0' }}>
                                <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-2" style={{ color: '#4f46e5', borderBottomColor: '#e2e8f0' }}>Assign to Mentor (Optional)</h3>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#475569' }}>Select Mentor</label>
                                    <div className="relative">
                                        <select value={clientForm.mentorProfileId} onChange={e => setClientForm({ ...clientForm, mentorProfileId: e.target.value })}
                                            className="w-full rounded-xl px-4 py-2.5 text-xs outline-none cursor-pointer appearance-none" style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #cbd5e1' }}>
                                            <option value="" className="bg-white text-slate-500">-- Do not assign yet --</option>
                                            {mentors.map(m => (
                                                <option key={m.id} value={m.mentorProfile?.id || ''} className="bg-white text-slate-900">
                                                    {m.name} ({m.email})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">▼</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 shrink-0 flex gap-3 border-t" style={{ borderTopColor: '#e2e8f0', backgroundColor: '#ffffff' }}>
                            <button onClick={() => setShowCreateClient(false)} className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer" style={{ backgroundColor: 'transparent', color: '#475569', border: '1px solid #cbd5e1' }}>Cancel</button>
                            <button onClick={createClientAndParent} disabled={actionLoading || !clientForm.clientName || !clientForm.clientEmail || !clientForm.clientPassword || !clientForm.parentName || !clientForm.parentEmail || !clientForm.parentPassword}
                                className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer text-white" style={{ backgroundColor: '#4f46e5' }}>{actionLoading ? 'Creating...' : 'Create Client & Parent'}</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}`;

    const modalStartIndex = content.indexOf('{/* Create Client & Parent Modal */}');
    if (modalStartIndex === -1) {
        console.error('Could not find admin modal start comment in:', filePath);
        return;
    }

    const searchEndText = '            )}\r\n        </>';
    const searchEndText2 = '            )}\n        </>';
    let modalEndIndex = content.indexOf(searchEndText, modalStartIndex);
    let endOffset = searchEndText.length;
    if (modalEndIndex === -1) {
        modalEndIndex = content.indexOf(searchEndText2, modalStartIndex);
        endOffset = searchEndText2.length;
    }

    if (modalEndIndex === -1) {
        const fallbackEndText = '            )}';
        modalEndIndex = content.indexOf(fallbackEndText, modalStartIndex + 500);
        endOffset = fallbackEndText.length;
    }

    if (modalEndIndex === -1) {
        console.error('Could not find admin modal end brace in:', filePath);
        return;
    }

    const targetBlock = content.slice(modalStartIndex, modalEndIndex + endOffset);
    const newContent = content.replace(targetBlock, replacement + '\n        </>');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Successfully fixed admin parent creation modal in:', filePath);
}

fixFile(mentorFilePath);
fixFile(adminFilePath);
fixAdminPage(adminPagePath);

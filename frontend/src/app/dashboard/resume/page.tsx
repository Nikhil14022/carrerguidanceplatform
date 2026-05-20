"use client";
import React, { useState } from 'react';

export default function ResumeBuilderPage() {
    const [personalInfo, setPersonalInfo] = useState({ name: '', email: '', phone: '', summary: '' });
    const [experiences, setExperiences] = useState([{ title: '', company: '', dates: '', description: '' }]);
    const [education, setEducation] = useState([{ degree: '', school: '', dates: '' }]);
    const [skills, setSkills] = useState('');

    const addExperience = () => setExperiences([...experiences, { title: '', company: '', dates: '', description: '' }]);
    const addEducation = () => setEducation([...education, { degree: '', school: '', dates: '' }]);

    return (
        <div className="space-y-6 animate-fade-in text-slate-200 pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-100 mb-2">Resume Builder</h1>
                <p className="text-slate-400">Create a professional resume tailored to your target industry. Fill out the details on the left, and view your live resume on the right.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">

                {/* EDITOR / FORM SIDE */}
                <div className="space-y-8 bg-white/5 border border-white/10 shadow-sm rounded-2xl p-6 lg:p-8">

                    {/* Personal Info */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-200 mb-4 pb-2 border-b border-white/5 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Personal Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                                <input type="text" className="w-full border-white/10 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="John Doe" value={personalInfo.name} onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                                <input type="email" className="w-full border-white/10 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="john@example.com" value={personalInfo.email} onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                                <input type="tel" className="w-full border-white/10 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="+1 (555) 000-0000" value={personalInfo.phone} onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-300 mb-1">Professional Summary</label>
                                <textarea rows={3} className="w-full border-white/10 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="A brief summary of your professional background and goals..." value={personalInfo.summary} onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })} />
                            </div>
                        </div>
                    </section>

                    {/* Experience */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-200 mb-4 pb-2 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                Experience
                            </div>
                            <button onClick={addExperience} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">+ Add</button>
                        </h2>
                        <div className="space-y-6">
                            {experiences.map((exp, index) => (
                                <div key={index} className="space-y-4 p-4 bg-white/5 border border-white/5 rounded-xl relative group">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Job Title</label>
                                            <input type="text" className="w-full text-sm border-white/10 rounded focus:ring-indigo-500 focus:border-indigo-500" placeholder="Software Engineer" value={exp.title} onChange={(e) => { const newExp = [...experiences]; newExp[index].title = e.target.value; setExperiences(newExp); }} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Company</label>
                                            <input type="text" className="w-full text-sm border-white/10 rounded focus:ring-indigo-500 focus:border-indigo-500" placeholder="Tech Corp" value={exp.company} onChange={(e) => { const newExp = [...experiences]; newExp[index].company = e.target.value; setExperiences(newExp); }} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Dates</label>
                                            <input type="text" className="w-full text-sm border-white/10 rounded focus:ring-indigo-500 focus:border-indigo-500" placeholder="Jan 2020 - Present" value={exp.dates} onChange={(e) => { const newExp = [...experiences]; newExp[index].dates = e.target.value; setExperiences(newExp); }} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                                            <textarea rows={2} className="w-full text-sm border-white/10 rounded focus:ring-indigo-500 focus:border-indigo-500" placeholder="Describe your achievements..." value={exp.description} onChange={(e) => { const newExp = [...experiences]; newExp[index].description = e.target.value; setExperiences(newExp); }} />
                                        </div>
                                    </div>
                                    {experiences.length > 1 && (
                                        <button onClick={() => setExperiences(experiences.filter((_, i) => i !== index))} className="absolute -top-3 -right-3 w-6 h-6 bg-white/5 shrink-0 border border-red-200 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 hover:text-red-600">
                                            &times;
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Education */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-200 mb-4 pb-2 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                                Education
                            </div>
                            <button onClick={addEducation} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">+ Add</button>
                        </h2>
                        <div className="space-y-6">
                            {education.map((edu, index) => (
                                <div key={index} className="space-y-4 p-4 bg-white/5 border border-white/5 rounded-xl relative group">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Degree / Certificate</label>
                                            <input type="text" className="w-full text-sm border-white/10 rounded focus:ring-indigo-500 focus:border-indigo-500" placeholder="B.S. Computer Science" value={edu.degree} onChange={(e) => { const newEdu = [...education]; newEdu[index].degree = e.target.value; setEducation(newEdu); }} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">School</label>
                                                <input type="text" className="w-full text-sm border-white/10 rounded focus:ring-indigo-500 focus:border-indigo-500" placeholder="University Name" value={edu.school} onChange={(e) => { const newEdu = [...education]; newEdu[index].school = e.target.value; setEducation(newEdu); }} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Dates</label>
                                                <input type="text" className="w-full text-sm border-white/10 rounded focus:ring-indigo-500 focus:border-indigo-500" placeholder="2016 - 2020" value={edu.dates} onChange={(e) => { const newEdu = [...education]; newEdu[index].dates = e.target.value; setEducation(newEdu); }} />
                                            </div>
                                        </div>
                                    </div>
                                    {education.length > 1 && (
                                        <button onClick={() => setEducation(education.filter((_, i) => i !== index))} className="absolute -top-3 -right-3 w-6 h-6 bg-white/5 shrink-0 border border-red-200 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 hover:text-red-600">
                                            &times;
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Skills */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-200 mb-4 pb-2 border-b border-white/5 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                            Skills
                        </h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Comma-separated Skills</label>
                            <input type="text" className="w-full border-white/10 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="JavaScript, React, Node.js, Project Management..." value={skills} onChange={(e) => setSkills(e.target.value)} />
                        </div>
                    </section>
                </div>

                {/* RESUME PREVIEW SIDE */}
                <div className="sticky top-6 lg:h-[85vh] flex flex-col">
                    <div className="flex justify-between items-end mb-4 px-2">
                        <h2 className="text-lg font-bold text-slate-300 tracking-tight flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Live Preview
                        </h2>
                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2" onClick={() => window.print()}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Download PDF
                        </button>
                    </div>

                    <div className="bg-white/5 border rounded-xl shadow-md p-10 flex-1 overflow-y-auto print:shadow-none print:border-none print:p-0 print:overflow-visible">
                        {/* Resume Header */}
                        <div className="text-center border-b pb-6 mb-6 border-white/20">
                            <h1 className="text-3xl font-bold uppercase tracking-widest text-black mb-2">{personalInfo.name || 'Your Name'}</h1>
                            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-sm text-black font-medium">
                                <span>{personalInfo.email || 'email@example.com'}</span>
                                <span className="text-slate-400">•</span>
                                <span>{personalInfo.phone || '(555) 000-0000'}</span>
                            </div>
                        </div>

                        {/* Summary */}
                        {personalInfo.summary && (
                            <div className="mb-6">
                                <p className="text-sm text-black leading-relaxed">{personalInfo.summary}</p>
                            </div>
                        )}

                        {/* Experience */}
                        {experiences.some(e => e.title || e.company) && (
                            <div className="mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-800 border-b border-white/20 pb-1 mb-4">Experience</h3>
                                <div className="space-y-5">
                                    {experiences.map((exp, index) => (
                                        (exp.title || exp.company) ? (
                                            <div key={index}>
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h4 className="font-bold text-black">{exp.title}</h4>
                                                    <span className="text-xs font-bold text-slate-200 whitespace-nowrap ml-4">{exp.dates}</span>
                                                </div>
                                                <div className="text-sm font-bold text-slate-200 mb-2">{exp.company}</div>
                                                <p className="text-sm text-black leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                            </div>
                                        ) : null
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {education.some(e => e.degree || e.school) && (
                            <div className="mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-800 border-b border-white/20 pb-1 mb-4">Education</h3>
                                <div className="space-y-4">
                                    {education.map((edu, index) => (
                                        (edu.degree || edu.school) ? (
                                            <div key={index} className="flex justify-between items-baseline">
                                                <div>
                                                    <h4 className="font-bold text-black">{edu.degree}</h4>
                                                    <div className="text-sm font-medium text-slate-100">{edu.school}</div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-200 whitespace-nowrap ml-4">{edu.dates}</span>
                                            </div>
                                        ) : null
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Skills */}
                        {skills && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-800 border-b border-white/20 pb-1 mb-4">Skills</h3>
                                <div className="flex flex-wrap gap-2 text-sm text-black font-medium">
                                    {skills.split(',').map((skill, index) => skill.trim() ? (
                                        <span key={index} className="bg-slate-100 text-black px-2 py-1 rounded border border-white/20">{skill.trim()}</span>
                                    ) : null)}
                                </div>
                            </div>
                        )}

                        {/* Placeholder text if empty */}
                        {!personalInfo.name && !personalInfo.summary && experiences.length === 1 && !experiences[0].title && education.length === 1 && !education[0].degree && !skills && (
                            <div className="h-full flex items-center justify-center text-slate-300 border-2 border-dashed border-white/5 rounded-xl p-10 text-center text-sm font-medium">
                                Your resume will take shape here. <br /> Fill in the details on the left.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import TestAnswersRenderer from './TestAnswersRenderer';

// Lazy-load specialized test components
const PersonalityFactorsTest = lazy(() => import('./test-modules/PersonalityFactorsTest'));
const ValuesTest = lazy(() => import('./test-modules/ValuesTest'));
const RIASECTest = lazy(() => import('./test-modules/RIASECTest'));
const ColorTest = lazy(() => import('./test-modules/ColorTest'));
const SubjectMatterTest = lazy(() => import('./test-modules/SubjectMatterTest'));
const ParentsMeetingForm = lazy(() => import('./test-modules/ParentsMeetingForm'));
const SelfDiscoveryTest = lazy(() => import('./test-modules/SelfDiscoveryTest'));
const JobFunctionsTest = lazy(() => import('./test-modules/JobFunctionsTest'));

const TEST_TYPE_COMPONENTS: Record<string, React.ComponentType<any>> = {
    '16PF': PersonalityFactorsTest,
    'VALUES': ValuesTest,
    'RIASEC': RIASECTest,
    'COLOR': ColorTest,
    'SMI': SubjectMatterTest,
    'PARENTS_MEETING': ParentsMeetingForm,
    'SELF_DISCOVERY': SelfDiscoveryTest,
    'JOB_FUNCTIONS': JobFunctionsTest,
};

const TRAIT_MAP: Record<string, string> = {
    'Communication': 'sw_communication',
    'Organisational Skills': 'sw_organisational_skills',
    'Organising Thoughts and Flow in Mind': 'sw_organising_thoughts',
    'Responsibility': 'sw_responsibility',
    'Problem Solving': 'sw_problem_solving',
    'Adaptability': 'sw_adaptability',
    'Prioritising': 'sw_prioritising',
    'Patience': 'sw_patience',
    'Curiosity': 'sw_curiosity',
    'Perseverance': 'sw_perseverance',
    'Thoughtfulness & Reflection': 'sw_thoughtfulness',
    'Sticking to Deadlines': 'sw_deadlines',
    'Generating Ideas': 'sw_generating_ideas',
    'Multi-tasking': 'sw_multitasking',
    'Time Management': 'sw_time_management',
    'Independence': 'sw_independence',
    'Seeking Help': 'sw_seeking_help',
    'Goal Setting and Execution': 'sw_goal_setting',
    'Stress Management': 'sw_stress_management',
    'Team Work': 'sw_teamwork',
    'Growth Mindset': 'sw_growth_mindset',
    'Criticism': 'sw_criticism',
    'Feedback': 'sw_feedback',
    'Listening': 'sw_listening',
    'Empathy / Sensitivity': 'sw_empathy',
    'Procrastination': 'sw_procrastination',
    'Working Individually/One Person': 'sw_working_individually',
    'Social Interaction': 'sw_social_interaction',
    'Expressiveness': 'sw_expressiveness',
    'Accountability': 'sw_accountability',
    'Spontaneity': 'sw_spontaneity',
    'Rules and Routines': 'sw_rules_routines',
    'Accepting Change': 'sw_accepting_change',
    'Finding Direction': 'sw_finding_direction',
    'Conversing with a Group': 'sw_conversing_group',
    'Initiating Conversations': 'sw_initiating_conversations',
    'Taking a Stand for Oneself': 'sw_taking_stand',
    'Self-control': 'sw_self_control'
};

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
    const hour = h === 0 ? 12 : (h > 12 ? h - 12 : h);
    const ampm = h < 12 ? 'AM' : 'PM';
    TIME_OPTIONS.push(`${hour}:00 ${ampm}`);
    TIME_OPTIONS.push(`${hour}:30 ${ampm}`);
}

const GAME_GENRE_OPTIONS: string[] = [
    'Action / Fighting Games',
    'Adventure / Open World',
    'Shooter Games (COD, PUBG, Fortnite, Valorant)',
    'Building / Creating Games (Minecraft, Roblox)',
    'Racing / Driving Games',
    'Brain / Strategy Games (Chess, Clash of Clans)',
    'Puzzles & Logic Games (Tetris, Sudoku, Wordle)',
    'Platform Games (Super Mario)',
    'Board & Card Games (Monopoly, Uno, Ludo, Cluedo)',
    'Interactive 3D Story / Movie Games',
    'Casual / Cozy / Simulation Games (Candy Crush, Sims)',
    'Social Deduction / Party Games (Among Us, Stumble Guys)',
    'Crime / Investigation / Mystery Games',
    'Superhero Games',
    'Horror / Survival Games',
    'Sports Games (FIFA, NBA, Cricket)',
    'RPG / Fantasy Games',
    'Other'
];

const QUESTION_EXAMPLES: Record<string, string> = {
    demo_name: 'Example: Vanya Mehta',
    demo_age: 'Example: 17',
    demo_dob: 'Example: Type 15/11/2008 or select Day, Month, and Year below.',
    demo_education: 'Example: Add your current and past schools/colleges (e.g., School: DPS - Grade 10 (91%); College: KJ Somaiya - FY BCA). Click "+ Add Another" if you attended multiple institutions.',
    demo_residence: 'Example: Powai, Hiranandani, Mumbai',
    demo_lives_with: 'Example: Mother (HR at Tata Projects), Father (Business), Grandmother & Grandfather',
    demo_exams: 'Example: JEE Main | Completed | 94 Percentile, or SAT | Planned | —',
    demo_extracurricular: 'Example: Debate Club | Weekly | Won Inter-school Trophy | 8/10',
    demo_marksheets: 'Example: Upload PDF or clear photos/screenshots of your last 3–4 years of academic marksheets.',
    demo_academic_overview: 'Example: English -> Like & Score Well; Mathematics -> Don\'t Like but Score Well',
    demo_hobbies: 'Example: Creative Writing | Writing short fantasy stories & journaling | 5 hours/week',
    demo_routine: 'Example: 07:00 AM - Wake up & exercise, 08:30 AM - College/School, 05:00 PM - Hobbies/Gaming',
    aim_1: 'Example: "I want clarity on which degree/career path matches my creative and analytical strengths."',
    aim_4: 'Example: Ethical Hacker, Wildlife Filmmaker, Perfumer, Game Narrative Designer',
    visual_fav_movies: 'Example: How to Train Your Dragon | Loved the bond between characters and world-building',
    visual_fav_series: 'Example: Wednesday, Brooklyn Nine-Nine | Fast-paced mystery and clever humor',
    visual_superpower: 'Example: Superspeed (like The Flash) — because I could finish chores, crafts, and travel in seconds!',
    visual_characters: 'Example: Hermione Granger (Harry Potter) | Relate to her curiosity, preparedness, and loyalty to friends',
    visual_games: 'Example: Select your favourite game genres from the dropdown (or choose Other) and list the games you enjoy.',
    family_1: 'Example: Tick all the words in the table below that come to your mind when you think of "Family".',
    family_2: 'Example: Mother - Comforting; Father - Practical; Sibling - Playful',
    family_lives_with: 'Example: Parents, younger brother, and paternal grandparents in a joint family setup.',
    family_arguments: 'Example: Screen time, waking up late on weekends, choosing between a safe career vs creative career.',
    family_repeated_statements: 'Example: Good: "We trust your hard work." | Critical/Bad: "Stop wasting time on your phone", "Choose a stable job."',
    lifestyle_8: 'Example: Need: Personal workspace, daily me-time, close friends | Want: House with a garden, international travel'
};

const EXTRA_FAMILY_QUESTIONS: any[] = [
    {
        id: 'family_lives_with',
        type: 'text',
        question: 'Who all do you live with at home? (Mention family members, their roles/occupations, and family setup)',
        description: 'Example: Mother, Father, Siblings, Grandparents, Pets, etc. Share a brief note on your living arrangement.',
        placeholder: 'e.g., Mother (HR), Father (Business), younger sister, and grandparents...'
    },
    {
        id: 'family_arguments',
        type: 'textarea',
        question: 'What kind of arguments or disagreements do you usually have in your family?',
        description: 'Think about recurring topics of disagreement (e.g., academics, career choices, routine, screen time, independence, communication gap) and how they usually unfold.',
        placeholder: 'Describe common arguments, what triggers them, and how you react...'
    },
    {
        id: 'family_repeated_statements',
        type: 'table',
        question: 'What are some statements that your family keeps repeating to you? (Can be Good/Positive or Bad/Critical)',
        description: 'List phrases or statements your parents/family members say often — both encouraging words and critical/nagging remarks.',
        col1Label: 'Repeated Statement / Phrase',
        col2Label: 'Type (Good / Bad / Neutral)',
        col3Label: 'Who says it & how it makes you feel',
        col1Placeholder: 'e.g., "You have great potential if you focus"',
        col2Options: ['Good / Encouraging', 'Bad / Critical / Pressuring', 'Neutral / Practical Advice'],
        col3Placeholder: 'e.g., Mom — makes me feel supported / pressured',
        minRows: 3,
        hasOpenText: true,
        openTextLabel: 'Additional notes about family conversations or repeated statements:'
    }
];

async function compressImageIfNeeded(file: File): Promise<File> {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif' || file.size <= 1.2 * 1024 * 1024) {
        return file;
    }
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const maxDim = 2000;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(file);
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => {
                    if (!blob || blob.size >= file.size) {
                        resolve(file);
                    } else {
                        const newName = file.name.replace(/\.[^.]+$/, '.jpg');
                        resolve(new File([blob], newName, { type: 'image/jpeg' }));
                    }
                },
                'image/jpeg',
                0.82
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(file);
        };
        img.src = url;
    });
}

function migrateAnswers(data: Record<string, any>) {
    if (!data) return {};
    const migrated = { ...data };
    if (Array.isArray(data.sw_grid)) {
        data.sw_grid.forEach((row: any) => {
            const trait = row.trait;
            const rating = row.rating;
            const traitId = TRAIT_MAP[trait];
            if (traitId && migrated[traitId] === undefined) {
                migrated[traitId] = rating;
            }
        });
    }
    
    // Normalize demo_academic_overview values to match select options
    if (Array.isArray(migrated.demo_academic_overview)) {
        migrated.demo_academic_overview = migrated.demo_academic_overview.map((row: any) => {
            if (!row || typeof row.col2 !== 'string') return row;
            let col2 = row.col2.trim().replace(/’/g, "'"); // Replace curly apostrophe with straight one
            
            // Map common variants to exact option strings
            if (col2 === "Don't Like but Score Well" || col2 === "Do not Like but Score Well") {
                col2 = "Don't Like but Score Well";
            } else if (col2 === "Like & Don't Score Well" || col2 === "Like & Do not Score Well") {
                col2 = "Like & Don't Score Well";
            } else if (col2 === "Don't Like & Don't Score" || col2 === "Do not Like & Don't Score") {
                col2 = "Don't Like & Don't Score";
            }
            return { ...row, col2 };
        });
    }

    // Migrate friends_2 from table array of objects to textarea string
    if (Array.isArray(data.friends_2)) {
        migrated.friends_2 = data.friends_2
            .map((row: any, idx: number) => {
                if (!row) return '';
                const item = row.col1 || '';
                const detail = row.col2 || '';
                if (!item && !detail) return '';
                return `${idx + 1}. Craziest Thing: ${item}${detail ? ` (When/Why: ${detail})` : ''}`;
            })
            .filter(Boolean)
            .join('\n');
    }

    // Migrate family_6 from choice ID to rank objects
    if (data.family_6 && (typeof data.family_6 === 'string' || (Array.isArray(data.family_6) && data.family_6.length > 0 && typeof data.family_6[0] === 'string'))) {
        const family6Options = [
            { id: '1', text: "They are very open for me to explore anything I would love to do including out of the box options. They want me to express myself even if it's any offbeat space. Earning isn't really first priority & they are ok even if my journey is random to start with. They don't have any specific timeline" },
            { id: '2', text: "They are open for me to explore anything I would love to do including out of the box career options but want me to be clearer about what I want now/work. They need me to work towards it now & find my pathway" },
            { id: '3', text: "They say they are ok with offbeat spaces but honestly, I see them scared. They may still allow me to do what I want but internally they will always be skeptical" },
            { id: '4', text: "They want to choose safe options, get done with degree & then whatever I want to do later" },
            { id: '5', text: "They have specific things in their mind which they keep expressing directly or indirectly & somehow, I am stuck there. Their opinion has become my opinion now" },
            { id: '6', text: "They are clear of what they want me to do & I don't have a lot of say & thought here for now. I am scared of putting my thoughts as they have counter questions for which I have no answers" },
            { id: '7', text: "They want me to be safe & secured in a way they understand/fields they know which I don't agree & thus there's always a battle" },
            { id: '8', text: "They want me to do good with academics, get into good college & then its upto me" },
            { id: '9', text: "Everyone in family is into something & they are looking for me to get into the same thing" },
            { id: '10', text: "They say but I do what I want to do & that's how it goes." }
        ];
        const selectedId = Array.isArray(data.family_6) ? data.family_6[0] : data.family_6;
        const matchedOpt = family6Options.find(o => o.id === selectedId);
        if (matchedOpt) {
            migrated.family_6 = [{ option: matchedOpt.text }, { option: '' }, { option: '' }];
        } else {
            migrated.family_6 = [{ option: '' }, { option: '' }, { option: '' }];
        }
    }
    
    return migrated;
}

export default function ModuleEngine({ 
    moduleId, 
    targetClientId, 
    isEditableByAdminOrMentor = false 
}: { 
    moduleId: string; 
    targetClientId?: string; 
    isEditableByAdminOrMentor?: boolean;
}) {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, originalSetAnswers] = useState<Record<string, any>>({});
    const [module, setModule] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDraggingFile, setIsDraggingFile] = useState(false);

    const [uploadError, setUploadError] = useState<string>('');
    const isReadOnly = isEditableByAdminOrMentor ? false : (module ? ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'LOCKED'].includes(module.status) : true);

    const setAnswers = (val: any) => {
        if (isReadOnly) return;
        if (typeof val === 'function') {
            originalSetAnswers((prev) => {
                const next = val(prev);
                answersRef.current = next;
                return next;
            });
        } else {
            answersRef.current = val;
            originalSetAnswers(val);
        }
    };

    // Comments Panel State
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
    const [activeScheduleTabs, setActiveScheduleTabs] = useState<Record<string, number>>({});

    const uploadFilesSequentially = async (rawFiles: File[], targetKey: string) => {
        if (isReadOnly || !rawFiles.length) return;
        setUploadError('');
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.heic', '.heif', '.bmp', '.tiff', '.jfif', '.xls', '.xlsx', '.txt'];
        const validFiles = rawFiles.filter(file => {
            const name = file.name.toLowerCase();
            return allowedExtensions.some(ext => name.endsWith(ext)) || file.type.startsWith('image/') || file.type === 'application/pdf';
        });

        if (validFiles.length === 0) {
            setUploadError('Unsupported file format. Please upload PDF, Word, Excel, or Image files (JPG, PNG, HEIC, WEBP).');
            return;
        }

        setUploadingState(prev => ({ ...prev, [targetKey]: true }));
        const newlyUploaded: string[] = [];
        const failedFiles: string[] = [];

        try {
            for (const rawFile of validFiles) {
                try {
                    const fileToUpload = await compressImageIfNeeded(rawFile);
                    if (fileToUpload.size > 12 * 1024 * 1024) {
                        failedFiles.push(`${rawFile.name} (exceeds 12MB limit)`);
                        continue;
                    }
                    const formData = new FormData();
                    formData.append('files', fileToUpload);

                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    if (!res.ok) {
                        failedFiles.push(`${rawFile.name} (Server status ${res.status})`);
                        continue;
                    }
                    const data = await res.json();
                    if (data.success && Array.isArray(data.files)) {
                        newlyUploaded.push(...data.files);
                    } else {
                        failedFiles.push(`${rawFile.name} (${data.message || 'Upload failed'})`);
                    }
                } catch (fileErr) {
                    console.error('Individual file upload error:', fileErr);
                    failedFiles.push(rawFile.name);
                }
            }

            if (newlyUploaded.length > 0) {
                let updatedAnswersSnapshot: Record<string, any> = {};
                originalSetAnswers(prev => {
                    const existing = Array.isArray(prev[targetKey]) ? prev[targetKey] : [];
                    const next = { ...prev, [targetKey]: [...existing, ...newlyUploaded] };
                    answersRef.current = next;
                    updatedAnswersSnapshot = next;
                    return next;
                });

                // Immediately persist uploaded files to backend draft
                try {
                    await fetch(`/api/client/modules/${moduleId}/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ data: updatedAnswersSnapshot })
                    });
                } catch (saveErr) {
                    console.warn('Immediate post-upload save warning:', saveErr);
                }
            }

            if (failedFiles.length > 0) {
                setUploadError(`Could not upload: ${failedFiles.join(', ')}. Please try a smaller PDF or compressed image.`);
            }
        } finally {
            setUploadingState(prev => ({ ...prev, [targetKey]: false }));
        }
    };

    const renderFileUpload = (q: any) => {
        const fileKey = `${q.id}_files`;
        const files = Array.isArray(answers[fileKey]) ? answers[fileKey] : [];
        const isUploading = uploadingState[fileKey] || false;
        
        const handleDragOver = (e: React.DragEvent) => {
            e.preventDefault();
            if (!isReadOnly) setIsDraggingFile(true);
        };
        const handleDragLeave = (e: React.DragEvent) => {
            e.preventDefault();
            setIsDraggingFile(false);
        };
        const handleDrop = async (e: React.DragEvent) => {
            e.preventDefault();
            setIsDraggingFile(false);
            if (isReadOnly || !e.dataTransfer.files?.length) return;
            await uploadFilesSequentially(Array.from(e.dataTransfer.files), fileKey);
        };

        return (
            <div className="space-y-4 mt-4 w-full">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{q.fileUploadLabel || "Upload files:"}</p>
                <label 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`block w-full border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-colors text-center group
                        ${isDraggingFile 
                            ? 'border-indigo-500 bg-indigo-500/10' 
                            : 'border-slate-700 bg-slate-900/50 hover:bg-slate-800/50'} ${isReadOnly ? 'opacity-60 pointer-events-none' : ''}`}
                >
                    <input 
                        type="file" 
                        className="hidden" 
                        multiple
                        disabled={isReadOnly}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif,.heic,.heif,image/*,application/pdf"
                        onChange={async (e) => {
                            if (!e.target.files?.length) return;
                            const selected = Array.from(e.target.files);
                            e.target.value = '';
                            await uploadFilesSequentially(selected, fileKey);
                        }}
                    />
                    <div className="flex flex-col items-center gap-3">
                        {isUploading ? (
                            <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        )}
                        <div className="text-xs text-slate-400">
                            <span className="text-indigo-400 font-bold">{isUploading ? 'Uploading files...' : 'Click to upload'}</span> {!isUploading && 'or drag and drop files'}
                        </div>
                    </div>
                </label>
                {uploadError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                        ⚠️ {uploadError}
                    </div>
                )}
                {files.map((filepath: string, i: number) => (
                    <div key={i} className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-xs flex justify-between items-center group">
                        <a href={filepath} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-2 text-slate-100 font-medium">
                            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            {decodeURIComponent(filepath.split('/').pop() || 'Attached File')}
                        </a>
                        {!isReadOnly && (
                            <button 
                                type="button"
                                onClick={() => {
                                    const newFiles = [...files];
                                    newFiles.splice(i, 1);
                                    setAnswers((prev: any) => ({ ...prev, [fileKey]: newFiles }));
                                }}
                                className="text-slate-500 hover:text-red-400 p-1 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        setComments([...comments, {
            id: Date.now().toString(),
            author: 'You',
            role: 'CLIENT',
            content: newComment,
            createdAt: new Date().toISOString()
        }]);
        setNewComment('');
    };

    const router = useRouter();
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isSavingRef = useRef(false);
    const answersRef = useRef(answers);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        fetchModule();
    }, [moduleId]);

    const fetchModule = async () => {
        try {
            const res = await fetch(`/api/client/modules/${moduleId}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to load module');
            const data = await res.json();
            if (data.module) {
                const modObj = { ...data.module };
                // Ensure Module 7: Family has the 64 adjectives on family_1 and the 3 new family questions
                if (
                    modObj.title?.toLowerCase().includes('family') &&
                    Array.isArray(modObj.schema?.questions)
                ) {
                    const updatedQs = modObj.schema.questions.map((qItem: any) => {
                        if (qItem.id === 'family_1' && (!Array.isArray(qItem.options) || qItem.options.length === 0)) {
                            const familyAdjectives = [
                                "Love", "Home", "Belonging", "Safety", "Security", "Trust", "Care", "Support",
                                "Acceptance", "Respect", "Comfort", "Strength", "Togetherness", "Unity", "Connection",
                                "Loyalty", "Commitment", "Responsibility", "Sacrifice", "Protection", "Guidance",
                                "Stability", "Warmth", "Peace", "Happiness", "Joy", "Gratitude", "Compassion",
                                "Kindness", "Understanding", "Encouragement", "Forgiveness", "Patience", "Reliability",
                                "Dependability", "Authenticity", "Nurturing", "Growth", "Foundation", "Identity",
                                "Roots", "Tradition", "Values", "Legacy", "Purpose", "Motivation", "Inspiration",
                                "Refuge", "Sanctuary", "Anchor", "Haven", "Lifeline", "Bond", "Resilience", "Hope",
                                "Balance", "Harmony", "Presence", "Freedom", "Unconditional", "Companionship",
                                "Memories", "Celebration", "Empowerment"
                            ];
                            return {
                                ...qItem,
                                type: 'multiselect',
                                options: familyAdjectives.map((opt, idx) => ({ id: String(idx + 1), text: opt }))
                            };
                        }
                        return qItem;
                    });
                    const existingIds = new Set(updatedQs.map((q: any) => q.id));
                    const missingFamilyQs = EXTRA_FAMILY_QUESTIONS.filter(fq => !existingIds.has(fq.id));
                    modObj.schema = {
                        ...modObj.schema,
                        questions: [...updatedQs, ...missingFamilyQs]
                    };
                }
                setModule(modObj);
            }
            if (data.response?.data) {
                const migrated = migrateAnswers(data.response.data);
                answersRef.current = migrated;
                originalSetAnswers(migrated);
            }

            // Inject Mentor Notes as a comment if they exist
            if (data.module?.mentorNotes) {
                setComments([
                    { id: 'mentor-note', author: 'Mentor', role: 'EXPERT', content: data.module.mentorNotes, createdAt: data.response?.approvedAt || new Date().toISOString() }
                ]);
            } else {
                setComments([]);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-save logic Debounce
    useEffect(() => {
        if (loading || !module || isReadOnly) return;

        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

        autoSaveTimerRef.current = setTimeout(() => {
            handleSave(false);
        }, 3000); // Autosave 3 seconds after last change

        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [answers, currentStep, isReadOnly]);

    // Visibility and BeforeUnload event listeners to save immediately
    useEffect(() => {
        if (isReadOnly) return;
        const handleVisibilityChange = () => {
            if (isReadOnly) return;
            if (document.visibilityState === 'hidden' && autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
                handleSave(false);
            }
        };
        const handleBeforeUnload = () => {
            if (isReadOnly) return;
            if (autoSaveTimerRef.current) {
                const endpoint = `/api/client/modules/${moduleId}/save`;
                fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: answersRef.current }),
                    keepalive: true
                });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [moduleId, isReadOnly]);

    const handleSave = async (isFinal = false) => {
        if (isReadOnly || isSavingRef.current) {
            if (isReadOnly && isFinal) {
                router.push('/dashboard/modules');
            }
            return;
        }
        isSavingRef.current = true;
        setIsSaving(true);
        try {
            const endpoint = isFinal ? `/api/client/modules/${moduleId}/submit` : `/api/client/modules/${moduleId}/save`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: answersRef.current }),
            });
            if (!res.ok) throw new Error('Failed to save progress');
            if (isFinal) router.push('/dashboard?status=submitted');
        } catch (err: any) {
            console.error('Save error:', err);
        } finally {
            isSavingRef.current = false;
            setIsSaving(false);
        }
    };

    const getNextStep = (step: number) => {
        let next = step + 1;
        while (next < (module?.schema?.questions?.length || 0)) {
            const q = module.schema.questions[next];
            if (!q.dependsOn) return next;
            const depValue = answersRef.current[q.dependsOn.questionId || q.dependsOn.id];
            const isMatch = Array.isArray(depValue) 
                ? depValue.includes(q.dependsOn.value)
                : depValue === q.dependsOn.value;
            if (isMatch) return next;
            next++;
        }
        return next;
    };

    const getPrevStep = (step: number) => {
        let prev = step - 1;
        while (prev >= 0) {
            const q = module.schema.questions[prev];
            if (!q.dependsOn) return prev;
            const depValue = answersRef.current[q.dependsOn.questionId || q.dependsOn.id];
            const isMatch = Array.isArray(depValue) 
                ? depValue.includes(q.dependsOn.value)
                : depValue === q.dependsOn.value;
            if (isMatch) return prev;
            prev--;
        }
        return prev;
    };

    const handleNext = () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
        const next = getNextStep(currentStep);
        if (next < (module?.schema?.questions?.length || 0)) {
            handleSave(false);
            setCurrentStep(next);
        } else {
            handleSave(true);
        }
    };

    const handleBack = () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
        const prev = getPrevStep(currentStep);
        if (prev >= 0) {
            handleSave(false);
            setCurrentStep(prev);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    );

    if (error || !module) return <div className="p-20 text-red-500">{error || 'Module not found'}</div>;

    const questions = module.schema?.questions || [];
    const q = questions[currentStep];
    const progress = questions.length > 0 ? ((currentStep) / questions.length) * 100 : 0;

    // ── Specialized Test Module Rendering ──
    const testType = module.schema?.testType;
    const TestComponent = testType ? TEST_TYPE_COMPONENTS[testType] : null;

    if (TestComponent && isReadOnly) {
        return (
            <div className="max-w-4xl mx-auto py-10 space-y-6">
                <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100">{module.title} — Locked (View-Only)</h2>
                            <p className="text-xs text-slate-400">
                                This assessment has already been submitted{module.status === 'APPROVED' ? ' and approved' : ''}. You can review your submitted responses below.
                            </p>
                        </div>
                    </div>
                    <a
                        href="/dashboard/modules"
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shrink-0 text-center"
                    >
                        Back to Modules
                    </a>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
                    <TestAnswersRenderer testType={testType} answers={answers} />
                </div>
            </div>
        );
    }

    if (TestComponent) {
        return (
            <div className="relative">
                {/* Autosave Indicator */}
                <div className="absolute top-0 right-10 flex items-center gap-2 text-xs font-bold text-slate-400">
                    {isReadOnly ? (
                        <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">Read-Only</span>
                    ) : isSaving ? (
                        <>
                            <div className="w-3 h-3 border-2 border-slate-400/20 border-t-slate-400 rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Saved
                        </>
                    )}
                </div>

                <div className="max-w-4xl mx-auto py-10">
                    {isEditableByAdminOrMentor && (
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-6 py-4 rounded-xl flex items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">✏️</span>
                                <div>
                                    <p className="font-bold text-sm">Admin / Mentor Proxy Editing Active</p>
                                    <p className="text-xs text-amber-400/80 mt-0.5">You are answering/editing this module on behalf of the client. All fields are interactive.</p>
                                </div>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-amber-500/20 rounded-md border border-amber-500/30">
                                Proxy Override
                            </span>
                        </div>
                    )}
                    {!isEditableByAdminOrMentor && isReadOnly && (
                        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-6 py-4 rounded-xl flex items-center gap-3 mb-6">
                            <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <div>
                                <p className="font-bold text-sm">Read-Only Mode</p>
                                <p className="text-xs text-indigo-400/80 mt-0.5">This module has already been submitted and is locked for editing.</p>
                            </div>
                        </div>
                    )}

                    <div className="mb-6">
                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Assessment Test</div>
                        <h1 className="text-2xl font-bold">{module.title}</h1>
                        {module.description && <p className="text-slate-400 mt-1 text-sm">{module.description}</p>}
                    </div>

                    <Suspense fallback={
                        <div className="flex items-center justify-center p-20">
                            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                    }>
                        <TestComponent
                            answers={answers}
                            setAnswers={setAnswers}
                            onSubmit={() => {
                                if (autoSaveTimerRef.current) {
                                    clearTimeout(autoSaveTimerRef.current);
                                    autoSaveTimerRef.current = null;
                                }
                                handleSave(true);
                            }}
                            readOnly={isReadOnly}
                        />
                    </Suspense>
                </div>
            </div>
        );
    }

    // ── Generic Module Rendering (existing logic) ──

    return (
        <div className="relative">
            {/* Autosave Indicator */}
            <div className="absolute top-0 right-10 flex items-center gap-2 text-xs font-bold text-slate-400">
                {isReadOnly ? (
                    <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">Read-Only</span>
                ) : isSaving ? (
                    <>
                        <div className="w-3 h-3 border-2 border-slate-400/20 border-t-slate-400 rounded-full animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Saved
                    </>
                )}
            </div>

            <div className="max-w-3xl mx-auto space-y-8 py-10">
                {isReadOnly && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-6 py-4 rounded-xl flex items-center gap-3">
                        <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <div>
                            <p className="font-bold text-sm">Read-Only Mode</p>
                            <p className="text-xs text-indigo-400/80 mt-0.5">This module has already been submitted and is locked for editing.</p>
                        </div>
                    </div>
                )}
                {/* Progress Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Module Assessment</div>
                            <h1 className="text-2xl font-bold">{module.title}</h1>
                        </div>
                        <div className="text-sm font-bold text-slate-500">{currentStep + 1} of {questions.length}</div>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 min-h-[400px] flex flex-col relative shadow-xl">
                    <div className="flex-1 space-y-8 mt-4 md:mt-0">
                        <div className="space-y-3 pr-4 md:pr-20">
                            <h2 className="text-2xl md:text-3xl font-bold leading-tight text-slate-100">{q?.question}</h2>
                            {q?.description && (
                                <div 
                                    className="text-slate-300 text-sm leading-relaxed" 
                                    dangerouslySetInnerHTML={{ __html: q.description }} 
                                />
                            )}
                            {(q?.example || (q?.id && QUESTION_EXAMPLES[q.id])) && (
                                <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-slate-200 flex items-start gap-2.5">
                                    <span className="text-indigo-400 font-bold shrink-0">💡 Example:</span>
                                    <span>{q?.example || QUESTION_EXAMPLES[q.id]}</span>
                                </div>
                            )}
                        </div>

                        <div className="py-6 space-y-6">
                            {/* Question Inputs */}
                            {(q?.type === 'text' || q?.type === 'textarea') && (() => {
                                return (
                                    <div className="space-y-4 w-full">
                                        <textarea
                                            placeholder={q?.placeholder || "Enter your answer..."}
                                            value={answers[q.id] || ''}
                                            rows={q?.type === 'textarea' ? 5 : 4}
                                            disabled={isReadOnly}
                                            spellCheck={true}
                                            autoCorrect="on"
                                            autoCapitalize="sentences"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-5 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-base leading-relaxed resize-y"
                                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                        />
                                        {q.allowFileUpload && renderFileUpload(q)}
                                    </div>
                                );
                            })()}
                            {q?.type === 'number' && (
                                <input
                                    type="number"
                                    placeholder={q?.placeholder || "Enter number..."}
                                    value={answers[q.id] || ''}
                                    disabled={isReadOnly}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-5 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg"
                                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                />
                            )}
                            {q?.type === 'date' && (() => {
                                const rawVal = String(answers[q.id] || '');
                                // Parse YYYY-MM-DD or DD/MM/YYYY if possible
                                let year = '';
                                let month = '';
                                let day = '';
                                if (/^\d{4}-\d{2}-\d{2}$/.test(rawVal)) {
                                    [year, month, day] = rawVal.split('-');
                                } else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(rawVal)) {
                                    const parts = rawVal.split(/[\/\-]/);
                                    day = parts[0].padStart(2, '0');
                                    month = parts[1].padStart(2, '0');
                                    year = parts[2];
                                }

                                const monthsList = [
                                    { val: '01', label: 'January' },
                                    { val: '02', label: 'February' },
                                    { val: '03', label: 'March' },
                                    { val: '04', label: 'April' },
                                    { val: '05', label: 'May' },
                                    { val: '06', label: 'June' },
                                    { val: '07', label: 'July' },
                                    { val: '08', label: 'August' },
                                    { val: '09', label: 'September' },
                                    { val: '10', label: 'October' },
                                    { val: '11', label: 'November' },
                                    { val: '12', label: 'December' }
                                ];

                                const updateDateParts = (newD: string, newM: string, newY: string) => {
                                    const d = newD || day || '01';
                                    const m = newM || month || '01';
                                    const y = newY || year || '2005';
                                    if (y.length === 4) {
                                        setAnswers({ ...answers, [q.id]: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` });
                                    } else {
                                        setAnswers({ ...answers, [q.id]: `${d}/${m}/${y}` });
                                    }
                                };

                                return (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">
                                                Type Date of Birth Manually (DD/MM/YYYY or YYYY-MM-DD)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g., 15/11/2008 or 15th November 2008"
                                                value={rawVal}
                                                disabled={isReadOnly}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-base font-medium"
                                                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                            />
                                        </div>
                                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                Or Quick Select Day / Month / Year:
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <select
                                                    value={day}
                                                    disabled={isReadOnly}
                                                    onChange={(e) => updateDateParts(e.target.value, month, year)}
                                                    className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                                                >
                                                    <option value="">Day</option>
                                                    {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                                                        <option key={d} value={d}>{Number(d)}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={month}
                                                    disabled={isReadOnly}
                                                    onChange={(e) => updateDateParts(day, e.target.value, year)}
                                                    className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                                                >
                                                    <option value="">Month</option>
                                                    {monthsList.map(m => (
                                                        <option key={m.val} value={m.val}>{m.label}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={year}
                                                    disabled={isReadOnly}
                                                    onChange={(e) => updateDateParts(day, month, e.target.value)}
                                                    className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                                                >
                                                    <option value="">Year</option>
                                                    {Array.from({ length: 60 }, (_, i) => String(2020 - i)).map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            {q?.type === 'scale' && (() => {
                                const isStrengthWeakness = Boolean(q.id?.startsWith('sw_') || (q.leftLabel && q.rightLabel && module?.title?.toLowerCase().includes('strength')));
                                if (isStrengthWeakness) {
                                    const raw = answers[q.id];
                                    let selectedCategory: 'Strength' | 'Weakness' | '' = '';
                                    let ratingVal = 7;

                                    if (raw && typeof raw === 'object' && 'category' in raw) {
                                        selectedCategory = raw.category;
                                        ratingVal = Number(raw.rating) || 7;
                                    } else if (typeof raw === 'number' || (typeof raw === 'string' && !isNaN(Number(raw)) && raw !== '')) {
                                        const num = Number(raw);
                                        selectedCategory = num < 5 ? 'Weakness' : 'Strength';
                                        ratingVal = num < 5 ? Math.max(5, 11 - num) : num;
                                    }

                                    const bandLabel = ratingVal <= 4 ? 'Not very high (1–4)' : ratingVal <= 7 ? 'High (5–7)' : 'Very high (8–10)';

                                    const handleSelectSW = (cat: 'Strength' | 'Weakness', newRating = ratingVal) => {
                                        setAnswers({
                                            ...answers,
                                            [q.id]: {
                                                category: cat,
                                                rating: newRating,
                                                statement: cat === 'Strength' ? (q.rightLabel || '') : (q.leftLabel || '')
                                            }
                                        });
                                    };

                                    return (
                                        <div className="space-y-6">
                                            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
                                                <strong>Step 1:</strong> Choose whether this trait is a <strong>Strength</strong> or a <strong>Weakness</strong> for you by clicking one of the two cards below.
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    disabled={isReadOnly}
                                                    onClick={() => handleSelectSW('Strength')}
                                                    className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                                                        selectedCategory === 'Strength'
                                                            ? 'bg-emerald-500/15 border-emerald-500 shadow-lg'
                                                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                                                            ✓ Strength
                                                        </span>
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                            selectedCategory === 'Strength' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-600'
                                                        }`}>
                                                            {selectedCategory === 'Strength' && '✓'}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-100 leading-relaxed">
                                                        {q.rightLabel || `This is one of my strengths`}
                                                    </p>
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={isReadOnly}
                                                    onClick={() => handleSelectSW('Weakness')}
                                                    className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                                                        selectedCategory === 'Weakness'
                                                            ? 'bg-rose-500/15 border-rose-500 shadow-lg'
                                                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-500 border border-rose-500/30">
                                                            ⚠ Weakness
                                                        </span>
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                            selectedCategory === 'Weakness' ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-600'
                                                        }`}>
                                                            {selectedCategory === 'Weakness' && '✓'}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-100 leading-relaxed">
                                                        {q.leftLabel || `This is an area of weakness / improvement for me`}
                                                    </p>
                                                </button>
                                            </div>

                                            {selectedCategory && (
                                                <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                                            <strong>Step 2:</strong> Rate how strong this {selectedCategory.toLowerCase()} is (1 to 10):
                                                        </span>
                                                        <span className="px-3 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 text-xs font-bold border border-indigo-500/30">
                                                            {selectedCategory}: {ratingVal}/10 — {bandLabel}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                                            <button
                                                                key={num}
                                                                type="button"
                                                                disabled={isReadOnly}
                                                                onClick={() => handleSelectSW(selectedCategory as 'Strength' | 'Weakness', num)}
                                                                className={`py-2.5 rounded-xl font-bold text-sm border transition-all ${
                                                                    ratingVal === num
                                                                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                                                                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-indigo-500/40'
                                                                }`}
                                                            >
                                                                {num}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
                                                        <span>1–4: Not very high</span>
                                                        <span>5–7: High</span>
                                                        <span>8–10: Very high</span>
                                                    </div>
                                                </div>
                                            )}

                                            <textarea
                                                placeholder="Optional: Add an example or note about this trait..."
                                                value={answers[`${q.id}_reason`] || ''}
                                                rows={2}
                                                disabled={isReadOnly}
                                                spellCheck={true}
                                                autoCorrect="on"
                                                autoCapitalize="sentences"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                                                onChange={(e) => setAnswers({ ...answers, [`${q.id}_reason`]: e.target.value })}
                                            />
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-6">
                                        <div className="flex justify-between px-2 text-xs font-bold text-slate-400 uppercase tracking-widest gap-4">
                                            <span className="text-pink-400 text-left max-w-[45%]">{q.leftLabel || `${q.min || 1} — Not at all / Low`}</span>
                                            <span className="text-emerald-400 text-right max-w-[45%]">{q.rightLabel || `${q.max || 10} — Extremely High`}</span>
                                        </div>
                                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                            {Array.from({ length: (q.max || 10) - (q.min || 1) + 1 }, (_, idx) => (q.min || 1) + idx).map(num => {
                                                const currentVal = answers[q.id] ?? Math.round(((q.min || 1) + (q.max || 10)) / 2);
                                                return (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        disabled={isReadOnly}
                                                        onClick={() => setAnswers({ ...answers, [q.id]: num })}
                                                        className={`py-3 rounded-xl font-bold text-sm border transition-all ${
                                                            currentVal === num
                                                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                                                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-indigo-500/40'
                                                        }`}
                                                    >
                                                        {num}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
                                            <span>1–4: Not very high</span>
                                            <span>5–7: High</span>
                                            <span>8–10: Very high</span>
                                        </div>
                                        <div className="text-center text-4xl font-bold text-indigo-400">
                                            {answers[q.id] ?? Math.round(((q.min || 1) + (q.max || 10)) / 2)}
                                        </div>
                                        <textarea
                                            placeholder="Optional: Why did you give this rating? Add any notes or examples..."
                                            value={answers[`${q.id}_reason`] || ''}
                                            rows={2}
                                            disabled={isReadOnly}
                                            spellCheck={true}
                                            autoCorrect="on"
                                            autoCapitalize="sentences"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mt-2 text-sm"
                                            onChange={(e) => setAnswers({ ...answers, [`${q.id}_reason`]: e.target.value })}
                                        />
                                    </div>
                                );
                            })()}
                            {q?.type === 'choice' && (() => {
                                const selectedId: string = Array.isArray(answers[q.id]) ? answers[q.id][0] : answers[q.id];
                                return (
                                <div className="space-y-6">
                                    <div className="grid gap-3">
                                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Select one option</p>
                                        {q.options?.map((opt: any) => {
                                            const isSelected = selectedId === opt.id;
                                            return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                disabled={isReadOnly}
                                                onClick={() => {
                                                    setAnswers({ ...answers, [q.id]: [opt.id] });
                                                }}
                                                className={`w-full p-5 rounded-xl border text-left transition-all flex items-center gap-4
                                                    ${isSelected ? 'bg-indigo-500/20 border-indigo-500 text-slate-100 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'} ${isReadOnly ? 'opacity-80' : ''}`}
                                            >
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                                    ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'}`}>
                                                    {isSelected && (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                                    )}
                                                </div>
                                                {opt.text}
                                            </button>
                                            );
                                        })}
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            {q.hasOpenText ? (q.openTextLabel || "Give details below:") : "Add Notes / Thoughts (Optional)"}
                                        </p>
                                        <textarea
                                            value={answers[`${q.id}_open_text`] || ''}
                                            disabled={isReadOnly}
                                            rows={q.hasOpenText ? 4 : 2}
                                            spellCheck={true}
                                            autoCorrect="on"
                                            autoCapitalize="sentences"
                                            placeholder={q.openTextPlaceholder || "Add your notes, examples, or thoughts here..."}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm leading-relaxed"
                                            onChange={(e) => setAnswers({ ...answers, [`${q.id}_open_text`]: e.target.value })}
                                        />
                                    </div>
                                </div>
                                );
                            })()}
                            {q?.type === 'multiselect' && (() => {
                                const selected: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                                const optionsList = q.options || [];
                                const isLargeWordTable = q.id === 'family_1' || optionsList.length >= 20;
                                const hasOtherOpt = optionsList.some((o: any) => o.id === 'other' || String(o.text).toLowerCase() === 'other');

                                const toggleOpt = (optId: string) => {
                                    if (isReadOnly) return;
                                    const updated = selected.includes(optId)
                                        ? selected.filter((id: string) => id !== optId)
                                        : [...selected, optId];
                                    setAnswers({ ...answers, [q.id]: updated });
                                };

                                return (
                                <div className="space-y-6">
                                    {isLargeWordTable ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                                                    Select all words/adjectives from the table below that apply ({selected.length} selected)
                                                </p>
                                            </div>
                                            <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950 shadow-inner">
                                                <table className="w-full border-collapse text-left">
                                                    <tbody>
                                                        {Array.from({ length: Math.ceil(optionsList.length / 4) }).map((_, rowIdx) => {
                                                            const rowOpts = optionsList.slice(rowIdx * 4, rowIdx * 4 + 4);
                                                            return (
                                                                <tr key={rowIdx} className="border-b border-slate-800 last:border-b-0">
                                                                    {rowOpts.map((opt: any) => {
                                                                        const isSelected = selected.includes(opt.id);
                                                                        return (
                                                                            <td
                                                                                key={opt.id}
                                                                                onClick={() => toggleOpt(opt.id)}
                                                                                className={`p-3 border-r border-slate-800 last:border-r-0 cursor-pointer transition-all select-none w-1/4 ${
                                                                                    isSelected
                                                                                        ? 'bg-indigo-500/20 text-slate-100 font-bold'
                                                                                        : 'hover:bg-slate-900 text-slate-300'
                                                                                }`}
                                                                            >
                                                                                <div className="flex items-center gap-2.5">
                                                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                                                                        isSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-600 bg-slate-900'
                                                                                    }`}>
                                                                                        {isSelected && <span className="text-[10px] leading-none">✓</span>}
                                                                                    </div>
                                                                                    <span className="text-xs sm:text-sm leading-snug">{opt.text}</span>
                                                                                </div>
                                                                            </td>
                                                                        );
                                                                    })}
                                                                    {rowOpts.length < 4 && Array.from({ length: 4 - rowOpts.length }).map((_, emptyIdx) => (
                                                                        <td key={`empty-${emptyIdx}`} className="p-3 border-r border-slate-800 last:border-r-0 w-1/4" />
                                                                    ))}
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Select all that apply</p>
                                            {optionsList.map((opt: any) => {
                                                const isSelected = selected.includes(opt.id);
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        disabled={isReadOnly}
                                                        onClick={() => toggleOpt(opt.id)}
                                                        className={`w-full p-5 rounded-xl border text-left transition-all flex items-center gap-4
                                                            ${isSelected ? 'bg-indigo-500/20 border-indigo-500 text-slate-100 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'} ${isReadOnly ? 'opacity-80' : ''}`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0
                                                            ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'}`}>
                                                            {isSelected && (
                                                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        {opt.text}
                                                    </button>
                                                );
                                            })}
                                            {!hasOtherOpt && (
                                                <button
                                                    type="button"
                                                    disabled={isReadOnly}
                                                    onClick={() => toggleOpt('other')}
                                                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4
                                                        ${selected.includes('other') ? 'bg-indigo-500/20 border-indigo-500 text-slate-100 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                                                >
                                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0
                                                        ${selected.includes('other') ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'}`}>
                                                        {selected.includes('other') && (
                                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    Other (Specify below)
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {selected.includes('other') && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">
                                                Specify "Other":
                                            </label>
                                            <input
                                                type="text"
                                                value={answers[`${q.id}_other`] || ''}
                                                disabled={isReadOnly}
                                                spellCheck={true}
                                                autoCorrect="on"
                                                placeholder="Type your custom option/genre here..."
                                                className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl p-3.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                                                onChange={(e) => setAnswers({ ...answers, [`${q.id}_other`]: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2 mt-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            {q.hasOpenText ? (q.openTextLabel || "Give details below:") : "Add Notes / Additional Thoughts (Optional)"}
                                        </p>
                                        <textarea
                                            value={answers[`${q.id}_open_text`] || ''}
                                            disabled={isReadOnly}
                                            rows={q.hasOpenText ? 4 : 3}
                                            spellCheck={true}
                                            autoCorrect="on"
                                            autoCapitalize="sentences"
                                            placeholder={q.openTextPlaceholder || "Add any extra words, notes, or thoughts here..."}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm leading-relaxed"
                                            onChange={(e) => setAnswers({ ...answers, [`${q.id}_open_text`]: e.target.value })}
                                        />
                                    </div>
                                </div>
                                );
                            })()}
                            {q?.type === 'dropdown_multi' && (() => {
                                const selected: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                                return (
                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Select one or more options</p>
                                    <select
                                        value=""
                                        disabled={isReadOnly}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val && !selected.includes(val)) {
                                                setAnswers({ ...answers, [q.id]: [...selected, val] });
                                            }
                                        }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                                    >
                                        <option value="">Choose from dropdown to add...</option>
                                        {q.options?.map((opt: any) => (
                                            <option key={opt.id} value={opt.id}>
                                                {selected.includes(opt.id) ? `✓ ${opt.text}` : opt.text}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="grid gap-2">
                                        {q.options?.map((opt: any) => {
                                            const isSelected = selected.includes(opt.id);
                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    disabled={isReadOnly}
                                                    onClick={() => {
                                                        const updated = isSelected
                                                            ? selected.filter((id: string) => id !== opt.id)
                                                            : [...selected, opt.id];
                                                        setAnswers({ ...answers, [q.id]: updated });
                                                    }}
                                                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4
                                                        ${isSelected ? 'bg-indigo-500/20 border-indigo-500 text-slate-100 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'} ${isReadOnly ? 'opacity-80' : ''}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0
                                                        ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'}`}>
                                                        {isSelected && (
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    {opt.text}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selected.length > 0 && (
                                        <div className="text-xs text-slate-400 mt-2">
                                            {selected.length} selected
                                        </div>
                                    )}
                                </div>
                                );
                            })()}
                            {q?.type === 'table' && (() => {
                                const isPrefilled = Array.isArray(q.prefilledRows) && q.prefilledRows.length > 0;
                                const minRows = isPrefilled ? q.prefilledRows.length : (q.minRows || 1);
                                const numCols = q.col4Label ? 4 : (q.col3Label ? 3 : (q.col2Label ? 2 : 1));
                                const gridColsClass = numCols === 4 ? 'grid-cols-4' : (numCols === 3 ? 'grid-cols-3' : (numCols === 2 ? 'grid-cols-2' : 'grid-cols-1'));
                                
                                const tableData = Array.isArray(answers[q.id]) && answers[q.id].length >= minRows 
                                    ? answers[q.id] 
                                    : Array.from({ length: Math.max(minRows, (answers[q.id] || []).length) }).map((_, i) => {
                                        const defaultCol1 = isPrefilled && i < q.prefilledRows.length ? q.prefilledRows[i] : '';
                                        return answers[q.id]?.[i] || { col1: defaultCol1, col2: '', col3: '', col4: '' };
                                    });
                                
                                return (
                                    <div className="space-y-4">
                                        {q.id === 'visual_games' && (() => {
                                            const genreRowIdx = tableData.findIndex((r: any) => String(r.col1).toLowerCase().includes('genre'));
                                            const currentGenreStr = genreRowIdx >= 0 ? String(tableData[genreRowIdx]?.col2 || '') : '';
                                            const selectedGameGenres = currentGenreStr
                                                .split(',')
                                                .map(s => s.trim())
                                                .filter(Boolean);

                                            const handleAddGameGenre = (genre: string) => {
                                                if (!genre || isReadOnly) return;
                                                const nextList = selectedGameGenres.includes(genre)
                                                    ? selectedGameGenres.filter(g => g !== genre)
                                                    : [...selectedGameGenres, genre];
                                                const newData = [...tableData];
                                                const targetIdx = genreRowIdx >= 0 ? genreRowIdx : 1;
                                                newData[targetIdx] = {
                                                    ...newData[targetIdx],
                                                    col1: newData[targetIdx]?.col1 || 'Favourite game genres',
                                                    col2: nextList.join(', ')
                                                };
                                                setAnswers({ ...answers, [q.id]: newData });
                                            };

                                            return (
                                                <div className="p-4 bg-slate-950 border border-indigo-500/30 rounded-2xl space-y-3 mb-4">
                                                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">
                                                        🎮 Select Game Genres from Dropdown (You can select multiple or choose "Other"):
                                                    </label>
                                                    <select
                                                        value=""
                                                        disabled={isReadOnly}
                                                        onChange={(e) => {
                                                            if (e.target.value) handleAddGameGenre(e.target.value);
                                                        }}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                                                    >
                                                        <option value="">-- Click to select a Game Genre --</option>
                                                        {GAME_GENRE_OPTIONS.map((g) => (
                                                            <option key={g} value={g}>
                                                                {selectedGameGenres.includes(g) ? `✓ ${g}` : g}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {selectedGameGenres.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 pt-1">
                                                            {selectedGameGenres.map((g) => (
                                                                <span
                                                                    key={g}
                                                                    onClick={() => handleAddGameGenre(g)}
                                                                    className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 text-slate-100 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/20"
                                                                >
                                                                    {g}
                                                                    {!isReadOnly && <span className="text-indigo-400 font-bold">✕</span>}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {selectedGameGenres.includes('Other') && (
                                                        <input
                                                            type="text"
                                                            value={answers['visual_games_other_genre'] || ''}
                                                            disabled={isReadOnly}
                                                            spellCheck={true}
                                                            autoCorrect="on"
                                                            placeholder="Type your custom game genre(s) here..."
                                                            onChange={(e) => setAnswers({ ...answers, visual_games_other_genre: e.target.value })}
                                                            className="w-full bg-slate-900 border border-indigo-500/40 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        <div className={`grid ${gridColsClass} gap-4 mb-2 px-2`}>
                                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{q.col1Label || 'Item'}</div>
                                            {numCols >= 2 && <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{q.col2Label || 'Details'}</div>}
                                            {numCols >= 3 && <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{q.col3Label}</div>}
                                            {numCols >= 4 && <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{q.col4Label}</div>}
                                        </div>
                                        {tableData.map((row: any, i: number) => {
                                            const isRowPrefilled = isPrefilled && i < q.prefilledRows.length;
                                            return (
                                                <div key={i} className={`flex grid ${gridColsClass} gap-4 items-start`}>
                                                    <input
                                                        type="text"
                                                        value={row.col1 ?? ''}
                                                        readOnly={isRowPrefilled}
                                                        disabled={isRowPrefilled || isReadOnly}
                                                        spellCheck={true}
                                                        autoCorrect="on"
                                                        placeholder={q.col1Placeholder || '...'}
                                                        className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 ${isRowPrefilled ? 'text-indigo-400 font-semibold bg-slate-900/50 cursor-not-allowed border-slate-800' : ''}`}
                                                        onChange={(e) => {
                                                            if (isRowPrefilled) return;
                                                            const newData = [...tableData];
                                                            newData[i] = { ...newData[i], col1: e.target.value };
                                                            setAnswers({ ...answers, [q.id]: newData });
                                                        }}
                                                    />
                                                    {numCols >= 2 && (
                                                        q.col2Options && Array.isArray(q.col2Options) ? (
                                                            <select
                                                                value={row.col2 ?? ''}
                                                                disabled={isReadOnly}
                                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                                                                onChange={(e) => {
                                                                    const newData = [...tableData];
                                                                    newData[i] = { ...newData[i], col2: e.target.value };
                                                                    setAnswers({ ...answers, [q.id]: newData });
                                                                }}
                                                            >
                                                                <option value="">Select Option...</option>
                                                                {q.col2Options.map((opt: string) => (
                                                                    <option key={opt} value={opt} className="bg-slate-950">{opt}</option>
                                                                ))}
                                                            </select>
                                                        ) : (q.useTextarea || q.id === 'demo_hobbies' || q.id === 'visual_games') ? (
                                                            <textarea
                                                                value={row.col2 ?? ''}
                                                                disabled={isReadOnly}
                                                                rows={q.id === 'demo_hobbies' ? 2 : 3}
                                                                spellCheck={true}
                                                                autoCorrect="on"
                                                                autoCapitalize="sentences"
                                                                placeholder={q.col2Placeholder || '...'}
                                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-y"
                                                                onChange={(e) => {
                                                                    const newData = [...tableData];
                                                                    newData[i] = { ...newData[i], col2: e.target.value };
                                                                    setAnswers({ ...answers, [q.id]: newData });
                                                                }}
                                                            />
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={row.col2 ?? ''}
                                                                disabled={isReadOnly}
                                                                spellCheck={true}
                                                                autoCorrect="on"
                                                                placeholder={q.col2Placeholder || '...'}
                                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                                                                onChange={(e) => {
                                                                    const newData = [...tableData];
                                                                    newData[i] = { ...newData[i], col2: e.target.value };
                                                                    setAnswers({ ...answers, [q.id]: newData });
                                                                }}
                                                            />
                                                        )
                                                    )}
                                                    {numCols >= 3 && (
                                                        q.col3Options && Array.isArray(q.col3Options) ? (
                                                            <select
                                                                value={row.col3}
                                                                disabled={isReadOnly}
                                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                                                                onChange={(e) => {
                                                                    const newData = [...tableData];
                                                                    newData[i] = { ...newData[i], col3: e.target.value };
                                                                    setAnswers({ ...answers, [q.id]: newData });
                                                                }}
                                                            >
                                                                <option value="">Select Option...</option>
                                                                {q.col3Options.map((opt: string) => (
                                                                    <option key={opt} value={opt} className="bg-slate-950">{opt}</option>
                                                                ))}
                                                            </select>
                                                        ) : q.useTextarea ? (
                                                            <textarea
                                                                value={row.col3}
                                                                disabled={isReadOnly}
                                                                rows={3}
                                                                placeholder={q.col3Placeholder || '...'}
                                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-y"
                                                                onChange={(e) => {
                                                                    const newData = [...tableData];
                                                                    newData[i] = { ...newData[i], col3: e.target.value };
                                                                    setAnswers({ ...answers, [q.id]: newData });
                                                                }}
                                                            />
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={q.id === 'demo_exams' && row.col2 !== 'Completed' ? '' : row.col3}
                                                                disabled={isReadOnly || (q.id === 'demo_exams' && row.col2 !== 'Completed')}
                                                                placeholder={q.id === 'demo_exams' && row.col2 !== 'Completed' ? 'Locked (Completed status required)' : (q.col3Placeholder || '...')}
                                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                                                                onChange={(e) => {
                                                                    const newData = [...tableData];
                                                                    newData[i] = { ...newData[i], col3: e.target.value };
                                                                    setAnswers({ ...answers, [q.id]: newData });
                                                                }}
                                                            />
                                                        )
                                                    )}
                                                    {numCols >= 4 && (
                                                        q.col4Options && Array.isArray(q.col4Options) ? (
                                                            <select
                                                                value={row.col4}
                                                                disabled={isReadOnly}
                                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                                                                onChange={(e) => {
                                                                    const newData = [...tableData];
                                                                    newData[i] = { ...newData[i], col4: e.target.value };
                                                                    setAnswers({ ...answers, [q.id]: newData });
                                                                }}
                                                            >
                                                                <option value="">Select Option...</option>
                                                                {q.col4Options.map((opt: string) => (
                                                                    <option key={opt} value={opt} className="bg-slate-950">{opt}</option>
                                                                ))}
                                                            </select>
                                                        ) : q.useTextarea ? (
                                                            <textarea
                                                                value={row.col4}
                                                                disabled={isReadOnly}
                                                                rows={3}
                                                                placeholder={q.col4Placeholder || '...'}
                                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-y"
                                                                onChange={(e) => {
                                                                    const newData = [...tableData];
                                                                    newData[i] = { ...newData[i], col4: e.target.value };
                                                                    setAnswers({ ...answers, [q.id]: newData });
                                                                }}
                                                            />
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={row.col4}
                                                                disabled={isReadOnly}
                                                                placeholder={q.col4Placeholder || '...'}
                                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                                                                onChange={(e) => {
                                                                    const newData = [...tableData];
                                                                    newData[i] = { ...newData[i], col4: e.target.value };
                                                                    setAnswers({ ...answers, [q.id]: newData });
                                                                }}
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {!isPrefilled && (
                                            <div className="flex items-center gap-4 mt-6">
                                                <button
                                                    disabled={isReadOnly}
                                                    onClick={() => setAnswers({ ...answers, [q.id]: [...tableData, { col1: '', col2: '', col3: '', col4: '' }] })}
                                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    Add Row
                                                </button>
                                                {tableData.length > 1 && (
                                                    <button
                                                        disabled={isReadOnly}
                                                        onClick={() => {
                                                            const newData = [...tableData];
                                                            newData.pop();
                                                            setAnswers({ ...answers, [q.id]: newData });
                                                        }}
                                                        className="px-5 py-2.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/40 text-rose-300 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 active:scale-95 cursor-pointer"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                        </svg>
                                                        Delete Row
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {q.showcaseRankOrder && (() => {
                                            const rankedItems = tableData
                                                .map((row: any) => ({
                                                    name: row.col1,
                                                    rank: parseInt(row.col2, 10)
                                                }))
                                                .filter((item: any) => !isNaN(item.rank))
                                                .sort((a: any, b: any) => a.rank - b.rank);
                                                
                                            if (rankedItems.length === 0) return null;
                                            
                                            return (
                                                <div className="mt-6 bg-slate-950 border border-slate-850 rounded-xl p-6 space-y-3">
                                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Selected Priority Order</p>
                                                    <div className="flex flex-col gap-2">
                                                        {rankedItems.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-3 text-sm px-4 py-3 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-xl">
                                                                <span className="font-black text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded text-xs">Rank {item.rank}</span>
                                                                <span className="font-semibold">{item.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        {q.hasOpenText && (
                                            <div className="space-y-2 mt-6">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{q.openTextLabel || "Give details below:"}</p>
                                                <textarea
                                                    value={answers[`${q.id}_open_text`] || ''}
                                                    disabled={isReadOnly}
                                                    rows={5}
                                                    spellCheck={true}
                                                    autoCorrect="on"
                                                    placeholder={q.openTextPlaceholder || "Type in detail here..."}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm leading-relaxed resize-y"
                                                    onChange={(e) => setAnswers({ ...answers, [`${q.id}_open_text`]: e.target.value })}
                                                />
                                            </div>
                                        )}
                                        {q.id === 'demo_hobbies' && (
                                            <div className="space-y-2 mt-6">
                                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Additional Info &amp; Notes about your Hobbies (Optional)</p>
                                                <textarea
                                                    value={answers[`demo_hobbies_notes`] || ''}
                                                    disabled={isReadOnly}
                                                    rows={5}
                                                    spellCheck={true}
                                                    autoCorrect="on"
                                                    placeholder="Describe your hobbies, achievements, or any additional details you want to share..."
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm leading-relaxed resize-y"
                                                    onChange={(e) => setAnswers({ ...answers, demo_hobbies_notes: e.target.value })}
                                                />
                                            </div>
                                        )}
                                        {q.allowFileUpload && renderFileUpload(q)}
                                    </div>
                                );
                            })()}
                            {q?.type === 'schedule' && (() => {
                                const rawData = answers[q.id];
                                let schedules: { days: string[]; slots: { time: string; activity: string }[] }[] = [];
                                
                                // Parse existing/old data formats
                                if (Array.isArray(rawData)) {
                                    if (rawData.length > 0) {
                                        if (typeof rawData[0] === 'string') {
                                            // Old array of strings format
                                            const slots = rawData.map((act, i) => {
                                                const hourNumber = i + 7;
                                                const ampm = hourNumber >= 12 ? 'PM' : 'AM';
                                                const displayHour = hourNumber > 12 ? hourNumber - 12 : hourNumber;
                                                return { time: `${displayHour}:00 ${ampm}`, activity: act };
                                            });
                                            schedules = [{ days: ['All Days'], slots }];
                                        } else if (rawData[0] && typeof rawData[0] === 'object' && 'days' in rawData[0] && 'slots' in rawData[0]) {
                                            // New format
                                            schedules = rawData.map((item: any) => ({
                                                days: Array.isArray(item.days) ? item.days : ['All Days'],
                                                slots: Array.isArray(item.slots) ? item.slots : []
                                            }));
                                        } else {
                                            // Old array of slot objects format
                                            const slots = rawData.map((item: any) => ({
                                                time: item?.time || item?.col1 || '',
                                                activity: item?.activity || item?.col2 || ''
                                            }));
                                            schedules = [{ days: ['All Days'], slots }];
                                        }
                                    }
                                }
                                
                                if (schedules.length === 0) {
                                    schedules = [
                                        {
                                            days: ['All Days'],
                                            slots: [
                                                { time: '07:00 AM', activity: '' },
                                                { time: '08:00 AM', activity: '' },
                                                { time: '01:00 PM', activity: '' },
                                                { time: '05:00 PM', activity: '' },
                                                { time: '10:00 PM', activity: '' },
                                            ]
                                        }
                                    ];
                                }

                                const activeIdx = activeScheduleTabs[q.id] !== undefined ? activeScheduleTabs[q.id] : 0;
                                const currentActiveIdx = activeIdx >= schedules.length ? 0 : activeIdx;
                                const currentSchedule = schedules[currentActiveIdx];
                                const scheduleData = currentSchedule.slots;

                                const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'All Days'];

                                const toggleDay = (day: string) => {
                                    if (isReadOnly) return;
                                    const newSchedules = [...schedules];
                                    let currentDays = [...(newSchedules[currentActiveIdx].days || [])];
                                    
                                    if (day === 'All Days') {
                                        currentDays = ['All Days'];
                                    } else {
                                        currentDays = currentDays.filter(d => d !== 'All Days');
                                        if (currentDays.includes(day)) {
                                            currentDays = currentDays.filter(d => d !== day);
                                        } else {
                                            currentDays.push(day);
                                        }
                                        if (currentDays.length === 0) {
                                            currentDays = ['All Days'];
                                        }
                                    }
                                    newSchedules[currentActiveIdx] = { ...newSchedules[currentActiveIdx], days: currentDays };
                                    setAnswers({ ...answers, [q.id]: newSchedules });
                                };

                                const addSchedule = () => {
                                    if (isReadOnly) return;
                                    const newSchedules = [...schedules, {
                                        days: ['New Schedule'],
                                        slots: [
                                            { time: '08:00 AM', activity: '' },
                                            { time: '01:00 PM', activity: '' }
                                        ]
                                    }];
                                    setAnswers({ ...answers, [q.id]: newSchedules });
                                    setActiveScheduleTabs({ ...activeScheduleTabs, [q.id]: newSchedules.length - 1 });
                                };

                                const deleteSchedule = (idxToDelete: number) => {
                                    if (isReadOnly) return;
                                    const newSchedules = schedules.filter((_, idx) => idx !== idxToDelete);
                                    setAnswers({ ...answers, [q.id]: newSchedules });
                                    setActiveScheduleTabs({ ...activeScheduleTabs, [q.id]: 0 });
                                };

                                return (
                                    <div className="space-y-6">
                                        {/* Tabs bar */}
                                        <div className="flex gap-2 flex-wrap items-center border-b border-slate-800 pb-3">
                                            {schedules.map((sched, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setActiveScheduleTabs({ ...activeScheduleTabs, [q.id]: idx })}
                                                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                                                        idx === currentActiveIdx
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-850'
                                                    }`}
                                                >
                                                    {sched.days.join(', ')}
                                                </button>
                                            ))}
                                            {!isReadOnly && (
                                                <button
                                                    type="button"
                                                    onClick={addSchedule}
                                                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[10px] font-bold rounded-lg transition-all"
                                                >
                                                    + Add Schedule
                                                </button>
                                            )}
                                        </div>

                                        {/* Day Selectors */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Days for this Schedule:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {daysOfWeek.map((day) => {
                                                    const isSelected = currentSchedule.days.includes(day);
                                                    return (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            disabled={isReadOnly}
                                                            onClick={() => toggleDay(day)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                isSelected
                                                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-550/30'
                                                                    : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-400'
                                                            }`}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Slots grid */}
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-[150px_1fr_50px] gap-4 mb-2 px-2">
                                                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Time</div>
                                                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Activity</div>
                                                <div></div>
                                            </div>
                                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                                {scheduleData.map((item, i) => (
                                                    <div key={i} className="grid grid-cols-[150px_1fr_50px] gap-4 items-center">
                                                        <select
                                                            value={item.time}
                                                            disabled={isReadOnly}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm font-semibold text-center"
                                                            onChange={(e) => {
                                                                const newSchedules = [...schedules];
                                                                newSchedules[currentActiveIdx].slots[i] = {
                                                                    ...newSchedules[currentActiveIdx].slots[i],
                                                                    time: e.target.value
                                                                };
                                                                setAnswers({ ...answers, [q.id]: newSchedules });
                                                            }}
                                                        >
                                                            <option value="">Select Time...</option>
                                                            {(() => {
                                                                const options = [...TIME_OPTIONS];
                                                                if (item.time && !options.includes(item.time)) {
                                                                    options.unshift(item.time);
                                                                }
                                                                return options.map(opt => (
                                                                    <option key={opt} value={opt} className="bg-slate-950">{opt}</option>
                                                                ));
                                                            })()}
                                                        </select>
                                                        <input
                                                            type="text"
                                                            value={item.activity}
                                                            disabled={isReadOnly}
                                                            spellCheck={true}
                                                            autoCorrect="on"
                                                            placeholder="What do you do?"
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                                                            onChange={(e) => {
                                                                const newSchedules = [...schedules];
                                                                newSchedules[currentActiveIdx].slots[i] = {
                                                                    ...newSchedules[currentActiveIdx].slots[i],
                                                                    activity: e.target.value
                                                                };
                                                                setAnswers({ ...answers, [q.id]: newSchedules });
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            disabled={isReadOnly}
                                                            onClick={() => {
                                                                const newSchedules = [...schedules];
                                                                newSchedules[currentActiveIdx].slots = newSchedules[currentActiveIdx].slots.filter((_, idx) => idx !== i);
                                                                setAnswers({ ...answers, [q.id]: newSchedules });
                                                            }}
                                                            className="text-slate-500 hover:text-red-400 p-2 disabled:opacity-50 transition-colors"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    disabled={isReadOnly}
                                                    onClick={() => {
                                                        const newSchedules = [...schedules];
                                                        newSchedules[currentActiveIdx].slots = [...newSchedules[currentActiveIdx].slots, { time: '', activity: '' }];
                                                        setAnswers({ ...answers, [q.id]: newSchedules });
                                                    }}
                                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-lg shadow-white/5 cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    Add Time Slot
                                                </button>
                                                {schedules.length > 1 && !isReadOnly && (
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteSchedule(currentActiveIdx)}
                                                        className="px-5 py-2.5 bg-red-950/20 hover:bg-red-900 border border-red-800 text-red-300 text-sm font-bold rounded-xl transition-all"
                                                    >
                                                        Delete This Schedule Option
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            {q?.type === 'rank' && (() => {
                                const numRanks = q.numRanks || 3;
                                const rankData = Array.isArray(answers[q.id]) && answers[q.id].length === numRanks 
                                    ? answers[q.id] 
                                    : Array.from({ length: numRanks }).map((_, i) => answers[q.id]?.[i] || { option: '' });
                                const selectedOptions = rankData.map((r: any) => r.option).filter(Boolean);
                                const optionTexts = (q.options || []).map((opt: any) => opt.text);
                                return (
                                <div className="space-y-6">
                                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Available Options</p>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {q.options?.map((opt: any, i: number) => {
                                                const isUsed = selectedOptions.includes(opt.text);
                                                return (
                                                    <div key={opt.id} className={`flex items-start gap-3 text-sm px-3 py-2 rounded-lg transition-all ${isUsed ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'text-slate-400'}`}>
                                                        <span className={`font-bold shrink-0 w-6 text-right ${isUsed ? 'text-indigo-400' : 'text-slate-600'}`}>{i + 1}.</span>
                                                        <span>{opt.text}</span>
                                                        {isUsed && (
                                                            <span className="ml-auto text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full shrink-0">
                                                                Rank {selectedOptions.indexOf(opt.text) + 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {Array.from({ length: numRanks }).map((_, idx) => {
                                        const rankNum = idx + 1;
                                        const currentSelection = rankData[idx] || { option: '' };
                                        const currentVal = currentSelection.option || '';
                                        const isCustom = Boolean(currentSelection.isOther) || (currentVal !== '' && !optionTexts.includes(currentVal));
                                        const availableOptions = q.options?.filter((opt: any) =>
                                            opt.text === currentVal || !selectedOptions.includes(opt.text)
                                        );
                                        return (
                                            <div key={rankNum} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 shadow-lg">
                                                <div className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Rank {rankNum}</div>
                                                <select
                                                    value={isCustom ? '__OTHER__' : currentVal}
                                                    disabled={isReadOnly}
                                                    onChange={(e) => {
                                                        const newData = [...rankData];
                                                        if (e.target.value === '__OTHER__') {
                                                            newData[idx] = { ...newData[idx], option: '', isOther: true };
                                                        } else {
                                                            newData[idx] = { ...newData[idx], option: e.target.value, isOther: false };
                                                        }
                                                        setAnswers({ ...answers, [q.id]: newData });
                                                    }}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 focus:outline-none focus:border-indigo-500"
                                                >
                                                    <option value="">Select an option from dropdown...</option>
                                                    {availableOptions?.map((opt: any) => (
                                                        <option key={opt.id} value={opt.text} className="bg-slate-950">{opt.text}</option>
                                                    ))}
                                                    <option value="__OTHER__" className="bg-slate-950 font-bold">Other (Type your own genre / option)</option>
                                                </select>
                                                {isCustom && (
                                                    <input
                                                        type="text"
                                                        value={currentVal}
                                                        disabled={isReadOnly}
                                                        spellCheck={true}
                                                        autoCorrect="on"
                                                        placeholder="Type your custom genre or option for this rank..."
                                                        onChange={(e) => {
                                                            const newData = [...rankData];
                                                            newData[idx] = { ...newData[idx], option: e.target.value, isOther: true };
                                                            setAnswers({ ...answers, [q.id]: newData });
                                                        }}
                                                        className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl p-3.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                );
                            })()}
                            {q?.type === 'choice_with_rating' && (() => {
                                const selectedOpt = answers[q.id]?.option || '';
                                const rating = answers[q.id]?.rating || 5;
                                return (
                                <div className="grid gap-6">
                                    <div className="grid gap-3">
                                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Select an option</p>
                                        {q.options?.map((opt: any) => {
                                            const isSelected = selectedOpt === opt.id;
                                            return (
                                            <button
                                                key={opt.id}
                                                disabled={isReadOnly}
                                                onClick={() => {
                                                    setAnswers({ ...answers, [q.id]: { option: opt.id, rating } });
                                                }}
                                                className={`w-full p-5 rounded-xl border text-left transition-all flex items-center gap-4
                                                    ${isSelected ? 'bg-indigo-500/20 border-indigo-500 text-slate-100' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                                    ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                                </div>
                                                {opt.text}
                                            </button>
                                            );
                                        })}
                                    </div>
                                    {selectedOpt && (
                                        <div className="space-y-4 p-6 bg-slate-900 border border-slate-800 rounded-xl">
                                            <div className="flex justify-between px-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                <span>1 — Low</span>
                                                <span>10 — High</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={1}
                                                max={10}
                                                value={rating}
                                                disabled={isReadOnly}
                                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                onChange={(e) => setAnswers({ ...answers, [q.id]: { option: selectedOpt, rating: parseInt(e.target.value) } })}
                                            />
                                            <div className="text-center text-3xl font-bold text-indigo-400">
                                                Rating: {rating}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                );
                            })()}
                            {q?.type === 'multiselect_with_rank' && (() => {
                                const data = answers[q.id] || { selected: [], ranked: [] };
                                const selected: string[] = data.selected || [];
                                const ranked: string[] = data.ranked || [];
                                return (
                                <div className="grid gap-6">
                                    <div className="grid gap-3">
                                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Select all that apply</p>
                                        {q.options?.map((opt: any) => {
                                            const isSelected = selected.includes(opt.id);
                                            return (
                                            <button
                                                key={opt.id}
                                                disabled={isReadOnly}
                                                onClick={() => {
                                                    if (isReadOnly) return;
                                                    let newSelected: string[];
                                                    if (isSelected) {
                                                        newSelected = selected.filter((id: string) => id !== opt.id);
                                                    } else {
                                                        newSelected = [...selected, opt.id];
                                                    }
                                                    const newRanked = ranked.filter((id: string) => newSelected.includes(id));
                                                    const newlyAdded = newSelected.filter((id: string) => !newRanked.includes(id));
                                                    setAnswers({ ...answers, [q.id]: { selected: newSelected, ranked: [...newRanked, ...newlyAdded] } });
                                                }}
                                                className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4
                                                    ${isSelected ? 'bg-indigo-500/20 border-indigo-500 text-slate-100' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0
                                                    ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'}`}>
                                                    {isSelected && (
                                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                    )}
                                                </div>
                                                {opt.text}
                                            </button>
                                            );
                                        })}
                                    </div>
                                    {ranked.length > 0 && (
                                        <div className="space-y-3 p-5 bg-slate-900 border border-slate-800 rounded-xl">
                                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Now rank your selections (drag to reorder or use numbers)</p>
                                            {ranked.map((optId: string, idx: number) => {
                                                const opt = q.options?.find((o: any) => o.id === optId);
                                                if (!opt) return null;
                                                return (
                                                    <div key={optId} className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                                        <select
                                                            value={idx + 1}
                                                            disabled={isReadOnly}
                                                            onChange={(e) => {
                                                                if (isReadOnly) return;
                                                                const newIdx = parseInt(e.target.value) - 1;
                                                                const newRanked = [...ranked];
                                                                newRanked.splice(idx, 1);
                                                                newRanked.splice(newIdx, 0, optId);
                                                                setAnswers({ ...answers, [q.id]: { selected, ranked: newRanked } });
                                                            }}
                                                            className="w-14 bg-indigo-500/20 border border-indigo-500/50 rounded-lg p-1.5 text-indigo-300 text-center font-bold text-sm focus:outline-none"
                                                        >
                                                            {ranked.map((_: any, i: number) => (
                                                                <option key={i} value={i + 1}>{i + 1}</option>
                                                            ))}
                                                        </select>
                                                        <span className="text-sm text-slate-100">{opt.text}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                );
                            })()}
                            {q?.type === 'education_history' && (() => {
                                const eduData = answers[q.id] || {
                                    school: { active: false, name: '', grade: '', entries: [{ name: '', grade: '' }] },
                                    college: { active: false, name: '', grade: '', entries: [{ name: '', grade: '' }] },
                                    university: { active: false, name: '', grade: '', entries: [{ name: '', grade: '' }] }
                                };
                                const levels = [
                                    { key: 'school', label: 'School' },
                                    { key: 'college', label: 'College / Junior College' },
                                    { key: 'university', label: 'University / Degree' },
                                ];
                                return (
                                <div className="space-y-6">
                                    <p className="text-xs text-slate-400">Select all educational levels you have attended. You can add multiple schools or colleges if you have attended more than one.</p>
                                    {levels.map((level) => {
                                        const data = eduData[level.key] || { active: false, name: '', grade: '', entries: [{ name: '', grade: '' }] };
                                        const entries: Array<{ name: string; grade: string }> =
                                            Array.isArray(data.entries) && data.entries.length > 0
                                                ? data.entries
                                                : [{ name: data.name || '', grade: data.grade || '' }];

                                        const updateLevelEntries = (newEntries: Array<{ name: string; grade: string }>) => {
                                            const combinedName = newEntries.map(e => e.name).filter(Boolean).join('; ');
                                            const combinedGrade = newEntries.map(e => e.grade).filter(Boolean).join('; ');
                                            setAnswers({
                                                ...answers,
                                                [q.id]: {
                                                    ...eduData,
                                                    [level.key]: {
                                                        ...data,
                                                        name: combinedName,
                                                        grade: combinedGrade,
                                                        entries: newEntries
                                                    }
                                                }
                                            });
                                        };

                                        return (
                                            <div key={level.key} className={`p-5 rounded-xl border transition-all ${data.active ? 'bg-slate-900 border-indigo-500/50' : 'bg-slate-950 border-slate-800'}`}>
                                                <label className="flex items-center gap-4 cursor-pointer mb-4">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={Boolean(data.active)}
                                                        disabled={isReadOnly}
                                                        onChange={(e) => {
                                                            if (isReadOnly) return;
                                                            setAnswers({
                                                                ...answers,
                                                                [q.id]: {
                                                                    ...eduData,
                                                                    [level.key]: { ...data, active: e.target.checked, entries }
                                                                }
                                                            });
                                                        }}
                                                        className="w-5 h-5 rounded border-slate-700 text-indigo-500 bg-slate-900 focus:ring-indigo-500/50 focus:ring-offset-slate-950"
                                                    />
                                                    <span className={`font-bold ${data.active ? 'text-slate-100' : 'text-slate-400'}`}>{level.label}</span>
                                                </label>
                                                {data.active && (
                                                    <div className="space-y-3 pl-9">
                                                        {entries.map((entry, idx) => (
                                                            <div key={idx} className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-center">
                                                                <input
                                                                    type="text"
                                                                    value={entry.name || ''}
                                                                    disabled={isReadOnly}
                                                                    spellCheck={true}
                                                                    autoCorrect="on"
                                                                    placeholder={`${level.label} ${entries.length > 1 ? `#${idx + 1} ` : ''}Name...`}
                                                                    onChange={(e) => {
                                                                        const next = [...entries];
                                                                        next[idx] = { ...next[idx], name: e.target.value };
                                                                        updateLevelEntries(next);
                                                                    }}
                                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={entry.grade || ''}
                                                                    disabled={isReadOnly}
                                                                    spellCheck={true}
                                                                    autoCorrect="on"
                                                                    placeholder="Year / Grade / Stream (e.g. Class 10, 2nd Year)..."
                                                                    onChange={(e) => {
                                                                        const next = [...entries];
                                                                        next[idx] = { ...next[idx], grade: e.target.value };
                                                                        updateLevelEntries(next);
                                                                    }}
                                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                                                                />
                                                                {!isReadOnly && entries.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const next = entries.filter((_, i) => i !== idx);
                                                                            updateLevelEntries(next);
                                                                        }}
                                                                        className="px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/30 border border-rose-800/40 rounded-lg"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {!isReadOnly && (
                                                            <button
                                                                type="button"
                                                                onClick={() => updateLevelEntries([...entries, { name: '', grade: '' }])}
                                                                className="mt-2 px-4 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                                                            >
                                                                <span>+ Add Another {level.label}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                );
                            })()}
                            {q?.type === 'trait_grid' && (() => {
                                const traitsSource = q.traits || q.options || [];
                                const defaultTraits = traitsSource.map((o: any) => o.label || o.text);
                                const traitData = Array.isArray(answers[q.id]) && answers[q.id].length === defaultTraits.length 
                                    ? answers[q.id]
                                    : traitsSource.map((t: any) => ({ trait: t.label || t.text, leftLabel: t.leftLabel || '', rightLabel: t.rightLabel || '', isStrength: true, isWeakness: false, rating: 5 }));
                                
                                return (
                                <div className="space-y-3 overflow-y-auto max-h-[550px] pr-2 custom-scrollbar">
                                    <div className="grid grid-cols-[minmax(120px,1.2fr)_180px_100px] gap-3 mb-2 px-2 sticky top-0 bg-slate-900 py-2 z-10">
                                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Trait</div>
                                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest text-center">Type (Strength / Weakness)</div>
                                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest text-center">Intensity (1-10)</div>
                                    </div>
                                    {traitData.map((row: any, i: number) => {
                                        const isWeak = Boolean(row.isWeakness);
                                        return (
                                            <div key={i} className="grid grid-cols-[minmax(120px,1.2fr)_180px_100px] gap-3 items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                <div>
                                                    <div className="text-sm font-bold text-slate-100 leading-tight">{row.trait}</div>
                                                    {(row.leftLabel || row.rightLabel) && (
                                                        <div className="text-[10px] text-slate-400 mt-0.5">{row.leftLabel} / {row.rightLabel}</div>
                                                    )}
                                                </div>
                                                <div className="flex gap-1.5 justify-center">
                                                    <button
                                                        type="button"
                                                        disabled={isReadOnly}
                                                        onClick={() => {
                                                            const newData = [...traitData];
                                                            newData[i] = { ...row, isStrength: true, isWeakness: false };
                                                            setAnswers({ ...answers, [q.id]: newData });
                                                        }}
                                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${!isWeak ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                                                    >
                                                        Strength
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isReadOnly}
                                                        onClick={() => {
                                                            const newData = [...traitData];
                                                            newData[i] = { ...row, isStrength: false, isWeakness: true };
                                                            setAnswers({ ...answers, [q.id]: newData });
                                                        }}
                                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${isWeak ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                                                    >
                                                        Weakness
                                                    </button>
                                                </div>
                                                <div className="flex flex-col items-center gap-1">
                                                    <input
                                                        type="range"
                                                        min={1}
                                                        max={10}
                                                        disabled={isReadOnly}
                                                        value={row.rating}
                                                        onChange={(e) => {
                                                            const newData = [...traitData];
                                                            newData[i] = { ...row, rating: parseInt(e.target.value) };
                                                            setAnswers({ ...answers, [q.id]: newData });
                                                        }}
                                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                    />
                                                    <span className="text-xs font-bold text-indigo-400">{row.rating}/10</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                );
                            })()}
                            {q?.type === 'file' && (() => {
                                const files = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                                const isUploading = uploadingState[q.id] || false;
                                const errMsg = uploadError;
                                
                                const handleDragOver = (e: React.DragEvent) => {
                                    e.preventDefault();
                                    if (!isReadOnly) setIsDraggingFile(true);
                                };
                                const handleDragLeave = (e: React.DragEvent) => {
                                    e.preventDefault();
                                    setIsDraggingFile(false);
                                };
                                const handleDrop = async (e: React.DragEvent) => {
                                    e.preventDefault();
                                    setIsDraggingFile(false);
                                    if (isReadOnly || !e.dataTransfer.files?.length) return;
                                    await uploadFilesSequentially(Array.from(e.dataTransfer.files), q.id);
                                };
                                
                                return (
                                <div className="space-y-4">
                                    <label 
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`block w-full border-2 border-dashed rounded-2xl p-8 transition-colors text-center group
                                            ${isReadOnly ? 'opacity-60 cursor-not-allowed border-slate-800 bg-slate-900/30' : 'cursor-pointer'}
                                            ${isDraggingFile 
                                                ? 'border-indigo-500 bg-indigo-500/10' 
                                                : 'border-slate-700 bg-slate-900/50 hover:bg-slate-800/50'}`}
                                    >
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            multiple
                                            disabled={isReadOnly || isUploading}
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,image/*,application/pdf"
                                            onChange={async (e) => {
                                                const inputEl = e.target;
                                                if (!inputEl.files?.length) return;
                                                const selectedFiles = Array.from(inputEl.files);
                                                inputEl.value = '';
                                                await uploadFilesSequentially(selectedFiles, q.id);
                                            }}
                                        />
                                        <div className="flex flex-col items-center gap-3">
                                            {isUploading ? (
                                                <>
                                                    <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                                    <div className="text-sm font-bold text-indigo-400">Uploading &amp; saving mark sheets... Please wait</div>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <div className="text-sm text-slate-400">
                                                        <span className="text-indigo-400 font-bold">Click to upload</span> or drag and drop files
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        PDF, Word Documents (DOC, DOCX), or Photos/Screenshots (JPG, PNG, WEBP, HEIC)
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </label>
                                    {errMsg && (
                                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium">
                                            {errMsg}
                                        </div>
                                    )}
                                    {files.map((filepath: string, i: number) => (
                                        <div key={i} className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-sm flex justify-between items-center group">
                                            <a href={filepath} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-2 font-medium break-all">
                                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                {decodeURIComponent(filepath.split('/').pop() || filepath)}
                                            </a>
                                            {!isReadOnly && (
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const newFiles = [...files];
                                                        newFiles.splice(i, 1);
                                                        setAnswers((prev: Record<string, any>) => {
                                                            const next = { ...prev, [q.id]: newFiles };
                                                            fetch(`/api/client/modules/${moduleId}/save`, {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ answers: next, currentStep })
                                                            }).catch(() => {});
                                                            return next;
                                                        });
                                                    }}
                                                    className="text-slate-500 hover:text-red-400 p-1 transition-all"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                );
                            })()}

                            {/* Universal Section Notes Box (for question types that do not already render _open_text) */}
                            {q && !['scale', 'choice', 'multiselect'].includes(q.type) && !(q.type === 'table' && q.hasOpenText) && (
                                <div className="pt-5 mt-6 border-t border-slate-800/70 space-y-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Add Notes / Additional Thoughts for this Section (Optional)
                                    </label>
                                    <textarea
                                        value={answers[`${q.id}_open_text`] || ''}
                                        disabled={isReadOnly}
                                        rows={3}
                                        spellCheck={true}
                                        autoCorrect="on"
                                        placeholder="Write any additional notes, context, or observations here..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-sm leading-relaxed resize-y"
                                        onChange={(e) => setAnswers({ ...answers, [`${q.id}_open_text`]: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-8 border-t border-slate-800 mt-8">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className={`flex items-center gap-2 font-bold uppercase tracking-widest transition-colors text-sm
                                ${currentStep === 0 ? 'text-slate-300 pointer-events-none' : 'text-slate-400 hover:text-white'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                            Back
                        </button>
                        <button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20 text-sm tracking-wide">
                            {currentStep === questions.length - 1 ? (isReadOnly ? 'Exit Assessment' : 'Submit Assessment') : 'Continue'}
                            {currentStep < questions.length - 1 && (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Slide-out Comments Drawer */}
            {isCommentsOpen && (
                <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-slide-left">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                            Expert Discussion
                        </h3>
                        <button onClick={() => setIsCommentsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {comments.length === 0 ? (
                            <div className="text-center text-slate-500 mt-10 text-sm">No comments on this question yet.</div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold uppercase">
                                                {comment.author[0]}
                                            </div>
                                            <span className="text-xs font-bold">{comment.author}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-300 ml-8 leading-relaxed">{comment.content}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-800 bg-slate-950">
                        <div className="relative">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Reply or ask a question..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 pr-12 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
                                rows={2}
                            />
                            <button
                                onClick={handleAddComment}
                                className="absolute right-2 bottom-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Discussion Button */}
            {!isCommentsOpen && (
                <button
                    onClick={() => setIsCommentsOpen(true)}
                    className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-3 transition-all z-40 hover:scale-110"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {comments.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                            {comments.length}
                        </span>
                    )}
                </button>
            )}
        </div>
    );
}

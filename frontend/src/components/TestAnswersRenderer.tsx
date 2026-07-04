"use client";

import React from "react";
import pf16Questions from "../data/pf16_questions.json";

interface TestAnswersRendererProps {
  testType: string;
  answers: Record<string, any>;
}

// -------------------------------------------------------------
// Values (Module 13) Constants & Helper
// -------------------------------------------------------------
const VALUE_GENRES = ["Personal", "Social", "Achievement", "Physical"] as const;

// -------------------------------------------------------------
// Color Test (Module 15) Questions Definition
// -------------------------------------------------------------
const COLOR_SECTIONS = [
  {
    title: "Section I (Sense vs Intuition)",
    questions: [
      { a: "Value accuracy more", b: "Value insights more" },
      { a: "Be interested in concrete issues", b: "Be interested in abstract ideas" },
      { a: "Prefer people who speak plainly", b: "Prefer unusual ways of expression" },
      { a: "Remember many details", b: "Be vague about details" },
      { a: "Be down to earth", b: "Be complex" },
      { a: "Focus on the present", b: "Focus on future possibilities" },
      { a: "Be valued for my common sense", b: "Be valued for seeing new trends" },
      { a: "Be realistic and pragmatic", b: "Be theoretical and imaginative" },
      { a: "Be trusting of the facts", b: "Be trusting of my intuition" },
    ],
  },
  {
    title: "Section II (Thinking vs Feeling)",
    questions: [
      { a: "Frank and direct", b: "Tactful and diplomatic" },
      { a: "Skeptical at first", b: "Accepting at first" },
      { a: "Unemotional", b: "Emotional" },
      { a: "Analytical", b: "Empathetic" },
      { a: "Apt to meet conflict head on", b: "Apt to avoid conflict where possible" },
      { a: "Principled", b: "Sympathetic" },
      { a: "Objective when criticized", b: "Apt to take things personally" },
      { a: "Impartial", b: "Compassionate" },
      { a: "Competitive", b: "Supportive" },
    ],
  },
  {
    title: "Section III (Judging vs Perceiving)",
    questions: [
      { a: "Meet deadlines early", b: "Meet deadlines at the last minute" },
      { a: "Make detailed plans before I start", b: "Handle problems as they arise" },
      { a: "Be punctual and sometimes early", b: "Be leisurely, sometimes late" },
      { a: "Like to be scheduled", b: "Prefer to be spontaneous" },
      { a: "Like clear guidelines", b: "Like flexibility" },
      { a: "Feel settled", b: "Often feel restless" },
      { a: "Have a tidy workplace", b: "Have a workplace with many piles/papers" },
      { a: "Be deliberate", b: "Be carefree" },
      { a: "Like to make plans", b: "Like to wait and see" },
    ],
  },
  {
    title: "Section IV (Extraversion vs Introversion)",
    questions: [
      { a: "Like to talk", b: "Prefer to listen" },
      { a: "Become bored when alone too much", b: "Need time alone to recharge batteries" },
      { a: "Prefer to work with a group", b: "Prefer to work alone or with one another" },
      { a: "Speak first—then reflect", b: "Reflect first—then speak" },
      { a: "Be more interactive & energetic", b: "Be more reflective and thoughtful" },
      { a: "Know a little about many topics", b: "Know a few topics in depth" },
      { a: "Initiate conversations at social gatherings", b: "Wait to be approached at social gatherings" },
    ],
  },
];

// -------------------------------------------------------------
// Subject Matter Interest (Module 16) Scenarios
// -------------------------------------------------------------
const SMI_SCENARIOS = [
  {
    id: 1,
    prompt: "Imagine being stranded on a small island for 2 years with a few others. What activities would you be naturally inclined to do?",
    activities: [
      { label: "Building a fishing net & a spear for hunting", column: "A" },
      { label: "Be the wise person and draft a constitution for the island / enforce fairness & follow laws", column: "B" },
      { label: "Perform a stand-up comedy act, try to make people laugh", column: "C" },
      { label: "Monitor the food supply, needs of people", column: "D" },
      { label: "Hunt, fish, chop wood, gather berries, carry water", column: "E" },
      { label: "Fashion coconuts into bowls for eating/drinking, make clothes / create utensils", column: "F" },
      { label: "Construct huts to live in and build a raft", column: "G" },
      { label: "Nurse sick people back to health", column: "H" },
    ],
  },
  {
    id: 2,
    prompt: "If you were a performer or part of a team putting on a concert, what activities would you look forward to?",
    activities: [
      { label: "Invent unique electronic consoles for instruments / create effects", column: "A" },
      { label: "Write poetic and philosophical lyrics", column: "B" },
      { label: "Be the drummer or lead guitarist", column: "C" },
      { label: "Be the band manager", column: "D" },
      { label: "Be the roadie, drive the truck, and collect the equipment / logistics", column: "E" },
      { label: "Operate the visual light and laser show", column: "F" },
      { label: "Set up and troubleshoot the amplifiers and sound system", column: "G" },
      { label: "Be in charge of the fan club and social engagements", column: "H" },
    ],
  },
  {
    id: 3,
    prompt: "You’re on a three-month sailing trip. As part of a small crew, how would you likely spend your time?",
    activities: [
      { label: "Do marine biology research", column: "A" },
      { label: "Spend long hours reading and pondering the meaning of life", column: "B" },
      { label: "Write a journal, document the trip or the crew’s life stories", column: "C" },
      { label: "Be the captain of the ship and coordinate the shipmates’ tasks", column: "D" },
      { label: "Do the athletic work of hands-on sailing and getting a good tan", column: "E" },
      { label: "Cook and coordinate meals", column: "F" },
      { label: "Be in charge of navigating and reading ocean maps", column: "G" },
      { label: "Plan events and trips to nearby islands and go shopping", column: "H" },
    ],
  },
  {
    id: 4,
    prompt: "As part of a group making a movie about a global warming disaster, which activities would interest you?",
    activities: [
      { label: "Advise on the atmospheric and geological theories for the film / plot of film", column: "A" },
      { label: "Write a screenplay about the social implications of a global disaster", column: "B" },
      { label: "Direct the film, coach the actors, and shape the overall plot line", column: "C" },
      { label: "Be the film producer in charge of funding and promoting the project", column: "D" },
      { label: "Be a stuntman or stuntwoman", column: "E" },
      { label: "Do the cinematography", column: "F" },
      { label: "Build the film sets", column: "G" },
      { label: "Gossip with the actors, organize lunch, schedule the day’s activities", column: "H" },
    ],
  },
  {
    id: 5,
    prompt: "You and friends have a business plan of running a restaurant on a beach side. What roles would you play?",
    activities: [
      { label: "Be in charge of expanding the business and networking", column: "D" },
      { label: "Find a quiet spot at the bar and observe people", column: "B" },
      { label: "Play guitar and perform for people", column: "C" },
      { label: "Operate the bar, track inventory to make sure there’s enough food & drinks", column: "A" },
      { label: "Play volleyball on the beach, dance, take part in events", column: "E" },
      { label: "Be the bartender", column: "F" },
      { label: "Be the utility person and fix anything that breaks", column: "G" },
      { label: "Be the host/hostess and make sure people have a good time", column: "H" },
    ],
  },
  {
    id: 6,
    prompt: "If you were part of the Rashtrapati Bhawan administration department, what would you do best?",
    activities: [
      { label: "Science adviser on renewable energy", column: "A" },
      { label: "A political speechwriter for the President", column: "B" },
      { label: "Press Secretary for the Rashtrapati Bhawan", column: "C" },
      { label: "Be the President & call all the shots", column: "D" },
      { label: "Be a fitness trainer to the staff or a Secret Service agent", column: "E" },
      { label: "Design handmade decorations for all holiday events and dinners", column: "F" },
      { label: "IT network specialist for a secure communications system", column: "G" },
      { label: "Secretary of education, interested in improving children’s education", column: "H" },
    ],
  },
  {
    id: 7,
    prompt: "The President encourages people to invent a totally new kind of automobile. How would you participate?",
    activities: [
      { label: "Get a PhD in physics to understand complex 3D systems", column: "A" },
      { label: "Study sociology to learn the impacts of new technology on society", column: "B" },
      { label: "Write content for a website to promote the program", column: "C" },
      { label: "Study finance and economics to balance the national budget", column: "D" },
      { label: "Run in a marathon to raise money for the mission", column: "E" },
      { label: "Take photographs of today’s traffic jams for an art exhibition", column: "F" },
      { label: "Become an engineer or mechanic in the automotive field", column: "G" },
      { label: "Be a grade-school teacher to prepare students for the future", column: "H" },
    ],
  },
  {
    id: 8,
    prompt: "You’ve been assigned to be a professor for one year. What cluster of courses would you enjoy teaching?",
    activities: [
      { label: "Astrophysics, molecular biology, paleontology", column: "A" },
      { label: "World history, political science, human behavior", column: "B" },
      { label: "Journalism, public relations, screenwriting", column: "C" },
      { label: "Accounting, finance, business management", column: "D" },
      { label: "Anatomy, nutrition, physical fitness", column: "E" },
      { label: "Furniture making, cooking, interior design", column: "F" },
      { label: "Mechanical engineering, information technology, masonry", column: "G" },
      { label: "Child development, nursing, special education", column: "H" },
    ],
  },
];

const SMI_COLUMN_LABELS: Record<string, string> = {
  A: "Physical & Life Sciences",
  B: "Social Sciences & Humanities",
  C: "Arts, Entertainment & Media",
  D: "Business & Financial",
  E: "Body Kinaesthetic & Sensory Acuity",
  F: "Designer & Artisan",
  G: "Engineering, Technology & Trades",
  H: "Education, Hospitality & Health Care",
};

// -------------------------------------------------------------
// Self Discovery Test (Module 18) Sections
// -------------------------------------------------------------
interface SDQuestion {
  id: string;
  num: number;
  text: string;
}

const SD_ROUND1: SDQuestion[] = [
  { id: "sd_q1", num: 1, text: "What activities make you lose track of time?" },
  { id: "sd_q2", num: 2, text: "What is something that you get really excited about most of the time? What is it?" },
  { id: "sd_q3", num: 3, text: "What do you love talking about, regardless of whether others like or don’t?" },
  { id: "sd_q4", num: 4, text: "If school/Academics was over, how would you spend your days (daily routine)?" },
  { id: "sd_q5", num: 5, text: "What kind of videos, articles, or posts do you keep scrolling through?" },
  { id: "sd_q6", num: 6, text: "What do you enjoy making or creating most of the time?" },
  { id: "sd_q7", num: 7, text: "Do you like working with your hands (physical engagement), your mind (ideating, analysing, visualizing), or with people (talking/collaborating)?" },
  { id: "sd_q8", num: 8, text: "Is there something you’re naturally good at without trying too hard?" },
  { id: "sd_q9", num: 9, text: "Have you ever helped someone with a skill or talent of yours?" },
  { id: "sd_q10", num: 10, text: "What kind of areas, topics or projects excite you?" },
  { id: "sd_q11", num: 11, text: "If you could try any job for a day, what would it be and why?" },
  { id: "sd_q12", num: 12, text: "What do you think your dream lifestyle looks like (mention all the things you like as a list)?" },
  { id: "sd_q13", num: 13, text: "Who do you admire (in real life or online)? What do they do?" },
  { id: "sd_q14", num: 14, text: "Which subjects or classes do you enjoy the most - and the least - and why?" },
  { id: "sd_q15", num: 15, text: "Have you ever visited a space that made you think, “I want to be part of this”? (vibe, culture, ambience, people, way of doing something, their mission/cause)" },
  { id: "sd_q16", num: 16, text: "What makes you feel proud of yourself?" },
  { id: "sd_q17", num: 17, text: "What makes you feel confident?" },
  { id: "sd_q18", num: 18, text: "What do you do when you’re stressed or upset that makes you feel better?" },
  { id: "sd_q19", num: 19, text: "What’s one thing you always look forward to?" },
  { id: "sd_q20", num: 20, text: "Do you prefer working alone or in a group? In fast-paced or calm settings?" },
  { id: "sd_q21", num: 21, text: "What kind of problems in the world do you wish you could solve?" },
  { id: "sd_q22", num: 22, text: "What’s more important to you: money, creativity, helping others, or freedom?" },
  { id: "sd_q23", num: 23, text: "Do you want your future job to be fun, meaningful, respected, or secure?" },
  { id: "sd_q24", num: 24, text: "Would you like to travel for work, or stay close to home? (If Travel mention frequency or duration)" },
  { id: "sd_q25", num: 25, text: "What kind of difference do you want to make in people’s lives? (Daily/regular basis)" }
];

const SD_TEEN: SDQuestion[] = [
  { id: "sd_r2_q1", num: 26, text: "Which of your skills or hobbies would you like to use regularly in the next 2–4 years?" },
  { id: "sd_r2_q2", num: 27, text: "What kind of work or field do you see yourself trying first after school - studies, internships, or part-time roles?" },
  { id: "sd_r2_q3", num: 28, text: "If you had two options - one job that pays well but feels boring, and one that pays less but excites you - which would you choose, and why?" },
  { id: "sd_r2_q4", num: 29, text: "Are there 2–3 areas (like tech, arts, sports, teaching, design, science, etc.) you’d like to explore through internships, workshops, or projects in the next couple of years?" },
  { id: "sd_r2_q5", num: 30, text: "What’s one kind of work you would do happily, even if you didn’t earn money for the first few months?" },
  { id: "sd_r2_q6", num: 31, text: "What’s the biggest thing holding you back from exploring your interests right now?" },
  { id: "sd_r2_q7", num: 32, text: "What worries you the most about failing or making mistakes while choosing your career?" },
  { id: "sd_r2_q8", num: 33, text: "Are you more afraid of picking the “wrong” path or of not choosing anything at all?" },
  { id: "sd_r2_q9", num: 34, text: "Do you compare your choices with classmates or friends? How does that affect you?" },
  { id: "sd_r2_q10", num: 35, text: "When you get bored of something, do you usually quit quickly or stick with it? How might that affect your career choices?" },
  { id: "sd_r2_q11", num: 36, text: "What new skills do you want to learn in the next 2–4 years that will help you in college or work?" },
  { id: "sd_r2_q12", num: 37, text: "What type of work setting excites you more - working with a team, being independent, outdoors, office-style, or creating things?" },
  { id: "sd_r2_q13", num: 38, text: "Would you be open to learning from a mentor, teacher, or senior even if it feels challenging at first?" },
  { id: "sd_r2_q14", num: 39, text: "Which tools, apps, or platforms (like Canva, coding, video editing, Excel, etc.) are you curious to learn for future opportunities?" },
  { id: "sd_r2_q15", num: 40, text: "Is there someone (other than parents) you can talk to regularly for guidance about your career direction?" },
  { id: "sd_r2_q16", num: 41, text: "Imagine yourself 2–4 years from now. What does a “successful” day look like for you?" },
  { id: "sd_r2_q17", num: 42, text: "What is one thing you would never want to compromise on in your career (e.g., fun, freedom, money, respect, learning)?" },
  { id: "sd_r2_q18", num: 43, text: "Would you like to create something of your own (like a small project or start-up) or be part of a group/organization to gain experience first?" },
  { id: "sd_r2_q19", num: 44, text: "How would you like your teachers, friends, or family to describe your efforts and work habits 2–4 years from now?" },
  { id: "sd_r2_q20", num: 45, text: "Looking ahead, what’s one regret you want to avoid in your career journey during your teen years?" }
];

const SD_ADULT: SDQuestion[] = [
  { id: "sd_r2_q1", num: 26, text: "Which of your interests or strengths do you see yourself using daily in your work?" },
  { id: "sd_r2_q2", num: 27, text: "Which career paths align with the lifestyle you want to live - and are actually realistic for you to achieve in the next 5-10 years?" },
  { id: "sd_r2_q3", num: 28, text: "If you had to choose between a job that paid really well but bored you, and one that paid average but excited you - which would you pick and why?" },
  { id: "sd_r2_q4", num: 29, text: "Are there 2–3 industries or fields you’re currently curious about enough to intern or work next year?" },
  { id: "sd_r2_q5", num: 30, text: "What kind of work would you still do, even if nobody paid you for it for the first 6 months?" },
  { id: "sd_r2_q6", num: 31, text: "What’s stopping you right now from going all-in on something you really want to explore?" },
  { id: "sd_r2_q7", num: 32, text: "What are you afraid will happen if you fail in your career journey?" },
  { id: "sd_r2_q8", num: 33, text: "Are you more afraid of choosing the wrong path or not choosing at all?" },
  { id: "sd_r2_q9", num: 34, text: "Do you compare your life decisions with your peers - and how does that impact your choices?" },
  { id: "sd_r2_q10", num: 35, text: "How do you handle boredom - and how might that affect your ability to stick with one path long enough to grow?" },
  { id: "sd_r2_q11", num: 36, text: "Which skills do you know you need to build in the next 1–2 years to be future-proof and employable?" },
  { id: "sd_r2_q12", num: 37, text: "What kind of work culture excites you - corporate, startup, outdoors, solo projects, or people-facing roles?" },
  { id: "sd_r2_q13", num: 38, text: "Are you open to mentorship or learning from someone ahead of you, even if it challenges your ego or comfort zone?" },
  { id: "sd_r2_q14", num: 39, text: "Which tools or platforms (Excel, Canva, coding, CRM, analytics, video editing, etc.) are you currently curious to master - not just for fun but for income potential?" },
  { id: "sd_r2_q15", num: 40, text: "Do you have 1–2 people in your network (not parents) who you can regularly talk to about career direction and accountability?" },
  { id: "sd_r2_q16", num: 41, text: "Imagine yourself at 35 - what does a “successful” day look like for you?" },
  { id: "sd_r2_q17", num: 42, text: "What is your non-negotiable - something you won’t sacrifice in your career no matter how good the opportunity looks?" },
  { id: "sd_r2_q18", num: 43, text: "Would you rather build something of your own with high risk, or be part of a growing system with more stability?" },
  { id: "sd_r2_q19", num: 44, text: "How do you want people to describe your work ethic or contribution 10 years from now?" },
  { id: "sd_r2_q20", num: 45, text: "What’s the one big life regret you want to make sure you avoid?" }
];

// -------------------------------------------------------------
// Job Functions (Module 19) Definition
// -------------------------------------------------------------
interface JobFunctionItem {
  id: string;
  text: string;
}

interface JobFunctionSection {
  title: string;
  category: string;
  items: JobFunctionItem[];
}

const JF_SECTIONS: JobFunctionSection[] = [
  {
    category: "People-Oriented (One-on-One)",
    title: "Problem Solving & Providing Expert Advice",
    items: [
      { id: "jf_t0_r1", text: "Mentoring, one-on-one teaching, instructing, training, tutoring" },
      { id: "jf_t0_r2", text: "Counseling, coaching, guiding, empowering" },
      { id: "jf_t0_r3", text: "Healing, treating the diseases or problems of, rehabilitating" },
      { id: "jf_t0_r4", text: "Advising, consulting with" },
      { id: "jf_t0_r5", text: "Assessing, evaluating" },
      { id: "jf_t0_r6", text: "Diagnosing, analysing or understanding an individual's needs, mood, motives, responses, behaviour, etc." },
      { id: "jf_t0_r7", text: "Using intuition or non-verbal clues to understand individuals" },
      { id: "jf_t0_r8", text: "Observing, studying behaviours" }
    ]
  },
  {
    category: "People-Oriented (One-on-One)",
    title: "Supporting, Enabling, Hosting & Entertaining",
    items: [
      { id: "jf_t1_r1", text: "Encouraging, supporting" },
      { id: "jf_t1_r2", text: "Providing emotional support" },
      { id: "jf_t1_r3", text: "Promoting, being an agent for others" },
      { id: "jf_t1_r4", text: "Listening" },
      { id: "jf_t1_r5", text: "Being understanding and patient with others" },
      { id: "jf_t1_r6", text: "Enabling, assisting other people to locate information" },
      { id: "jf_t1_r7", text: "Helping, serving, providing needs of individuals" },
      { id: "jf_t1_r8", text: "Assisting, caretaking" },
      { id: "jf_t1_r9", text: "Hosting" },
      { id: "jf_t1_r10", text: "Entertaining, amusing, conversing with" },
      { id: "jf_t1_r11", text: "Giving pleasure" },
      { id: "jf_t1_r12", text: "Using your personal charisma" }
    ]
  },
  {
    category: "People-Oriented (One-on-One)",
    title: "Managing, Informing & General Administrative Activities",
    items: [
      { id: "jf_t2_r1", text: "Cultivating and maintaining relationships" },
      { id: "jf_t2_r2", text: "Selecting, Screening, Hiring" },
      { id: "jf_t2_r3", text: "Managing, Supervising" },
      { id: "jf_t2_r4", text: "Giving instructions, providing information" },
      { id: "jf_t2_r5", text: "Persuading, selling, motivating, influencing, enrolling, recruiting" },
      { id: "jf_t2_r6", text: "Interviewing" },
      { id: "jf_t2_r7", text: "Communicating verbally with" },
      { id: "jf_t2_r8", text: "Bringing together, introducing" },
      { id: "jf_t2_r9", text: "Networking" },
      { id: "jf_t2_r10", text: "Building alliances and relationships" },
      { id: "jf_t2_r11", text: "Negotiating between individuals, arbitrating" }
    ]
  },
  {
    category: "People-Oriented (Groups & Public)",
    title: "Problem Solving & Providing Expert Advice to a Group",
    items: [
      { id: "jf_t3_r1", text: "Empowering, enabling a group" },
      { id: "jf_t3_r2", text: "Instructing, teaching, training a group" },
      { id: "jf_t3_r3", text: "Guiding a group through a healing process" },
      { id: "jf_t3_r4", text: "Diagnosing, analysing, or understanding a group's existing or potential needs, mood, motives, responses, behaviour" },
      { id: "jf_t3_r5", text: "Using intuition or nonverbal cues to understand a group or individuals in a group setting" },
      { id: "jf_t3_r6", text: "Consulting to affect a group or organization's productivity, behaviour" },
      { id: "jf_t3_r7", text: "Advising a group, providing expertise" },
      { id: "jf_t3_r8", text: "Designing events or educational experiences" },
      { id: "jf_t3_r9", text: "Creating activities, games" }
    ]
  },
  {
    category: "People-Oriented (Groups & Public)",
    title: "Managing, Leading & Interacting with a Group",
    items: [
      { id: "jf_t4_r1", text: "Managing, leading a group, organization, company" },
      { id: "jf_t4_r2", text: "Initiating, creating, founding a group of people or a company" },
      { id: "jf_t4_r3", text: "Supervising, captaining a group or team" },
      { id: "jf_t4_r4", text: "Supporting a team, work group, orchestra as a member" },
      { id: "jf_t4_r5", text: "Leading group in recreation, games, exercise, travel, rehabilitation" },
      { id: "jf_t4_r6", text: "Negotiating between groups, resolving conflicts or disputes, bringing conflicting groups together" },
      { id: "jf_t4_r7", text: "Inspiring a group" },
      { id: "jf_t4_r8", text: "Facilitating, guiding a group" }
    ]
  },
  {
    category: "People-Oriented (Groups & Public)",
    title: "Influencing & Persuading a Group",
    items: [
      { id: "jf_t5_r1", text: "Persuading, motivating, convincing, or selling to a group" },
      { id: "jf_t5_r2", text: "Using personal charisma" },
      { id: "jf_t5_r3", text: "Networking with groups" },
      { id: "jf_t5_r4", text: "Communicating verbally with groups, public speaking, or communicating verbally through the media" },
      { id: "jf_t5_r5", text: "Communicating with people via art, music, writing, film, or other art forms" }
    ]
  },
  {
    category: "People-Oriented (Groups & Public)",
    title: "Entertaining & Hosting Group Functions",
    items: [
      { id: "jf_t6_r1", text: "Hosting, entertaining socially" },
      { id: "jf_t6_r2", text: "Amusing, providing entertainment or pleasure" },
      { id: "jf_t6_r3", text: "Performing, acting" },
      { id: "jf_t6_r4", text: "Presenting to people via TV, films, seminars, speeches" },
      { id: "jf_t6_r5", text: "Selecting, screening prospective members or employees" },
      { id: "jf_t6_r6", text: "Assisting, serving, helping" }
    ]
  },
  {
    category: "Information & Ideas",
    title: "Creating, Designing & Using Imagination",
    items: [
      { id: "jf_t7_r1", text: "Idea generating, creating, inventing, imagining" },
      { id: "jf_t7_r2", text: "Asking new questions, pioneering new ideas, brainstorming" },
      { id: "jf_t7_r3", text: "Drawing, painting, filming, photographing" },
      { id: "jf_t7_r4", text: "Creating original works of art, including music" },
      { id: "jf_t7_r5", text: "Creating visual or written presentation or presentations using other media" },
      { id: "jf_t7_r6", text: "Creating marketing materials, advertisements, promotional campaigns" },
      { id: "jf_t7_r7", text: "Creating activities, games, or other experiential learning activities" },
      { id: "jf_t7_r8", text: "Designing events or educational experiences" },
      { id: "jf_t7_r9", text: "Writing fiction, creative writing, poetry, essays, novels, scripts" },
      { id: "jf_t7_r10", text: "Performing, acting" },
      { id: "jf_t7_r11", text: "Presenting to people via TV, films, seminars, speeches" },
      { id: "jf_t7_r12", text: "Information engineering, database design, computer programming" },
      { id: "jf_t7_r13", text: "Designing information architecture, such as in website design" },
      { id: "jf_t7_r14", text: "Creating software or similar works" },
      { id: "jf_t7_r15", text: "Designing research experiments to make new discoveries" }
    ]
  },
  {
    category: "Information & Ideas",
    title: "Problem Solving, Researching & Investigating",
    items: [
      { id: "jf_t8_r1", text: "Diagnosing by seeing the relationship between clues" },
      { id: "jf_t8_r2", text: "Analysing by perceiving patterns in data, events, or processes or accurately evaluating information" },
      { id: "jf_t8_r3", text: "Seeing through masses of information to the central principles or most important facts" },
      { id: "jf_t8_r4", text: "Breaking masses of data down into components, analysing" },
      { id: "jf_t8_r5", text: "Synthesizing: combining parts to form a whole" },
      { id: "jf_t8_r6", text: "Systematizing, prioritizing, categorizing, or organizing information" },
      { id: "jf_t8_r7", text: "Deciding what data or information to collect" },
      { id: "jf_t8_r8", text: "Conducting research to develop new ideas, theories" },
      { id: "jf_t8_r9", text: "Researching by observing behaviour or phenomena" },
      { id: "jf_t8_r10", text: "Researching by gathering or compiling information" },
      { id: "jf_t8_r11", text: "Making decisions about the meaning of data or information" }
    ]
  },
  {
    category: "Information & Ideas",
    title: "Reading, Learning & Mastering a Body of Knowledge",
    items: [
      { id: "jf_t9_r1", text: "Reading, learning, gathering information" },
      { id: "jf_t9_r2", text: "Interpreting other people's concepts, ideas" },
      { id: "jf_t9_r3", text: "Adapting information to suit another purpose" },
      { id: "jf_t9_r4", text: "Combining existing ideas or concepts into new ones" },
      { id: "jf_t9_r5", text: "Mastering a specialized body of knowledge, expertise, wisdom, lore" }
    ]
  },
  {
    category: "Information & Ideas",
    title: "Critiquing, Evaluating & Making Recommendations",
    items: [
      { id: "jf_t10_r1", text: "Critiquing other people's ideas" },
      { id: "jf_t10_r2", text: "Critiquing works of art, such as in script reading, book reviews, film reviews" },
      { id: "jf_t10_r3", text: "Critical writing, such as nonfiction, journalism, and science writing" },
      { id: "jf_t10_r4", text: "Technical writing, such as in business, law, technology, medicine, public policy" },
      { id: "jf_t10_r5", text: "Judging, evaluating, or appraising information" },
      { id: "jf_t10_r6", text: "Using physical senses to evaluate information" },
      { id: "jf_t10_r7", text: "Process improvement, making system more efficient" },
      { id: "jf_t10_r8", text: "Risk and opportunity cost analysis" },
      { id: "jf_t10_r9", text: "Making recommendations, providing solutions" },
      { id: "jf_t10_r10", text: "Troubleshooting, debugging, and maintaining software" },
      { id: "jf_t10_r11", text: "Editing to improve content" },
      { id: "jf_t10_r12", text: "Using mathematics, numbers, statistics, working with formulas to evaluate" }
    ]
  },
  {
    category: "Information & Ideas",
    title: "Organizing, Planning & Administrative Activities",
    items: [
      { id: "jf_t11_r1", text: "Organizing information, projects, or events" },
      { id: "jf_t11_r2", text: "Managing projects, setting goals and milestones, budgeting, status reporting" },
      { id: "jf_t11_r3", text: "Planning, strategizing, forecasting" },
      { id: "jf_t11_r4", text: "Translating, interpreting information to another language, medium, or style" },
      { id: "jf_t11_r5", text: "Copyediting to improve grammar, syntax" },
      { id: "jf_t11_r6", text: "Retrieving or finding information, researching, compiling information" },
      { id: "jf_t11_r7", text: "Entering data into a computer, data entry, word processing" },
      { id: "jf_t11_r8", text: "Comparing, proofing" },
      { id: "jf_t11_r9", text: "Accounting, bookkeeping, business mathematics" },
      { id: "jf_t11_r10", text: "Record keeping, storing, filing" }
    ]
  },
  {
    category: "Things & Physical World",
    title: "Problem Solving & Understanding Complex Physical Systems",
    items: [
      { id: "jf_t12_r1", text: "Understanding complex physical systems such as in the physical sciences, medicine, engineering and technology" },
      { id: "jf_t12_r2", text: "Diagnosing and analysing complex mechanical systems, such as a mechanic, engineer, physician, or veterinarian does" },
      { id: "jf_t12_r3", text: "Repairing or improving complex mechanical systems" }
    ]
  },
  {
    category: "Things & Physical World",
    title: "Creating, Designing & Inventing Physical Objects",
    items: [
      { id: "jf_t13_r1", text: "Designing complex physical systems" },
      { id: "jf_t13_r2", text: "Creating new theories, understanding or interpreting physical systems" },
      { id: "jf_t13_r3", text: "Inventing, creating, designing original devices or objects" },
      { id: "jf_t13_r4", text: "Directing films or plays, choreographing scenes, storyboarding" },
      { id: "jf_t13_r5", text: "Creating works of three-dimensional art" }
    ]
  },
  {
    category: "Things & Physical World",
    title: "Evaluating, Critiquing, Fixing & Repairing",
    items: [
      { id: "jf_t14_r1", text: "Evaluating and critiquing physical objects, including food art, design, or the human body" },
      { id: "jf_t14_r2", text: "Appraising and judging physical objects, including food, arts, design or the human body" },
      { id: "jf_t14_r3", text: "Repairing or restoring things, maintaining physical structures" },
      { id: "jf_t14_r4", text: "Assembling" }
    ]
  },
  {
    category: "Things & Physical World",
    title: "Crafting, Beautifying & Using Tools to Produce Objects",
    items: [
      { id: "jf_t15_r1", text: "Sculpting, shaping, tooling" },
      { id: "jf_t15_r2", text: "Crafting (combining artistic and motor skills to fashion things)" },
      { id: "jf_t15_r3", text: "Employing fine hand dexterity (as used by surgeons, dentists, craftsmen, artists, musicians, etc.)" },
      { id: "jf_t15_r4", text: "Precision use of tools" },
      { id: "jf_t15_r5", text: "Manufacturing or mass producing objects" },
      { id: "jf_t15_r6", text: "Cooking, preparing, or displaying food" },
      { id: "jf_t15_r7", text: "Choosing, arranging objects artistically" },
      { id: "jf_t15_r8", text: "Utilizing eye for design, color, texture, or proportion" },
      { id: "jf_t15_r9", text: "Using sensual acuity of sight, sound, smell, taste, or feel" }
    ]
  },
  {
    category: "Things & Physical World",
    title: "Athletics & Manipulating the Human Anatomy",
    items: [
      { id: "jf_t16_r1", text: "Dancing or choreographing dance routines" },
      { id: "jf_t16_r2", text: "Using physical agility, fine sensory-motor skills, strength, and dexterity in athletics and other fields such as law enforcement, firefighting, emergency medicine" },
      { id: "jf_t16_r3", text: "Using spatial visualization for gymnastics, figure skating, diving, and other sports that require visualizing body movements" },
      { id: "jf_t16_r4", text: "Performing stunts or other extreme physical feats" },
      { id: "jf_t16_r5", text: "Massaging, adjusting, touching, hands-on healing" }
    ]
  },
  {
    category: "Things & Physical World",
    title: "Operating Machines & Equipment",
    items: [
      { id: "jf_t17_r1", text: "Operating an airplane, ship or boat, truck or car, motorcycle or bicycle" },
      { id: "jf_t17_r2", text: "Using large tools such as bulldozers and other construction machinery, tanks" },
      { id: "jf_t17_r3", text: "Constructing buildings or other large objects, such as bridges and roads" },
      { id: "jf_t17_r4", text: "Operating, controlling, or guiding machines" },
      { id: "jf_t17_r5", text: "Tending machines" },
      { id: "jf_t17_r6", text: "Fighting, using firearms or other weapons" },
      { id: "jf_t17_r7", text: "Installing" },
      { id: "jf_t17_r8", text: "Cleaning, preparing, washing, dusting" },
      { id: "jf_t17_r9", text: "Moving, storing, warehousing, carrying, lifting, handling" }
    ]
  },
  {
    category: "Things & Physical World",
    title: "Interacting with the Physical World & Nature",
    items: [
      { id: "jf_t18_r1", text: "Navigating, orienteering, pathfinding, exploring" },
      { id: "jf_t18_r2", text: "Farming, gardening, growing or tending plants or animals" },
      { id: "jf_t18_r3", text: "Exploring aspects of the physical environment, nature" },
      { id: "jf_t18_r4", text: "Hunting, trapping, fishing" }
    ]
  }
];

export default function TestAnswersRenderer({ testType, answers }: TestAnswersRendererProps) {
  if (!answers || Object.keys(answers).length === 0) {
    return <p className="text-sm text-slate-400 italic">No responses recorded for this test.</p>;
  }

  // -----------------------------------------------------------
  // 1. 16PF (Module 12)
  // -----------------------------------------------------------
  if (testType === "16PF") {
    const render16PFValue = (val: any) => {
      const num = Number(val);
      if (isNaN(num)) return String(val);
      const labels: Record<number, string> = {
        1: "Inaccurate / Strongly Disagree (1)",
        2: "Mostly Inaccurate / Disagree (2)",
        3: "Neutral (3)",
        4: "Mostly Accurate / Agree (4)",
        5: "Accurate / Strongly Agree (5)",
      };
      return labels[num] || `Rating: ${num}`;
    };

    return (
      <div className="space-y-6">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300">
          <strong>16PF Personality Factors Test:</strong> Responses mapped by questions.
        </div>
        <div className="grid gap-4 md:grid-cols-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {pf16Questions.map((q) => {
            const val = answers[q.id];
            if (val === undefined) return null;
            return (
              <div key={q.id} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-1.5">
                <div className="font-semibold text-slate-400">Question {q.id.split("_")[1]}</div>
                {q.type === "statement" ? (
                  <>
                    <p className="text-slate-200">{q.text}</p>
                    <p className="font-bold text-indigo-400">{render16PFValue(val)}</p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-400">
                      <span className="w-1/2 text-left">{q.left}</span>
                      <span className="w-1/2 text-right">{q.right}</span>
                    </div>
                    <div className="font-bold text-indigo-450 text-center bg-indigo-500/5 py-1 rounded">
                      Selected rating: {val} (Preference: {val <= 2 ? `Left` : val >= 4 ? `Right` : `Neutral`})
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 2. VALUES (Module 13)
  // -----------------------------------------------------------
  if (testType === "VALUES") {
    const testData = answers.__testData || answers;
    const ranked = (testData.ranked as string[]) || [];
    const categorized = (testData.categorized as Record<string, string>) || {};

    if (ranked.length === 0) {
      return <p className="text-slate-400 italic">No values ranked yet.</p>;
    }

    return (
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ranked Values System (Top 10)</h4>
        <div className="space-y-2">
          {ranked.map((v, i) => (
            <div key={v} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black">{i + 1}</span>
              <span className="text-sm font-semibold text-slate-200 flex-1">{v}</span>
              <span className="px-2.5 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-bold uppercase tracking-wider">
                {categorized[v] || "Want & Preference"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 3. RIASEC (Module 14)
  // -----------------------------------------------------------
  if (testType === "RIASEC") {
    const testData = answers.__testData || answers;
    const categories: Record<string, string> = {
      R: "Realistic (Practical, Hands-on, Physical)",
      I: "Investigative (Analytical, Scientific, Logical)",
      A: "Artistic (Creative, Expressive, Unstructured)",
      S: "Social (Empathetic, Helping, Teamwork)",
      E: "Enterprising (Ambitious, Leading, Influencing)",
      C: "Conventional (Organized, Detail-oriented, Precise)",
    };

    return (
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">RIASEC Selections</h4>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(categories).map(([code, label]) => {
            const list = (testData[code] as string[]) || [];
            return (
              <div key={code} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-sm font-bold text-indigo-300">{label}</span>
                  <span className="text-xs text-slate-500 font-bold bg-white/5 px-2 py-0.5 rounded-lg">{list.length} selected</span>
                </div>
                {list.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-slate-350 space-y-1">
                    {list.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-slate-650 italic">None selected</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 4. COLOR (Module 15)
  // -----------------------------------------------------------
  if (testType === "COLOR") {
    const testData = answers.__testData || answers;
    const result = testData.result || "N/A";

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold text-white uppercase">C</div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Personality Color Result</div>
            <div className="text-md font-black text-indigo-300 mt-0.5">{result}</div>
          </div>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {COLOR_SECTIONS.map((sec, secIdx) => {
            const userSelections = (testData[`section${secIdx + 1}`] as (string | null)[]) || [];
            return (
              <div key={secIdx} className="space-y-2">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-1">{sec.title}</h5>
                <div className="space-y-1.5">
                  {sec.questions.map((q, qIdx) => {
                    const sel = userSelections[qIdx];
                    const selectedText = sel === "a" ? q.a : sel === "b" ? q.b : "No answer";
                    return (
                      <div key={qIdx} className="flex justify-between items-center text-xs p-2 bg-white/3 border border-white/3 rounded-lg">
                        <span className="text-slate-500">Q{qIdx + 1}: {q.a} vs {q.b}</span>
                        <span className="font-bold text-indigo-400 shrink-0 ml-4 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">{selectedText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 5. SMI (Module 16)
  // -----------------------------------------------------------
  if (testType === "SMI") {
    const testData = answers.__testData || answers;
    const columnTotals = (testData.columnTotals as Record<string, number>) || {};
    const top3Scenarios = (testData.top3Scenarios as number[]) || [];
    const scenarioAnswers = (testData.scenarioAnswers as Record<number, any>) || {};

    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">SMI Column Totals</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(SMI_COLUMN_LABELS).map(([col, label]) => {
              const val = columnTotals[col] || 0;
              return (
                <div key={col} className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-350 font-medium">{col}: {label}</span>
                  <span className="font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">{val} pts</span>
                </div>
              );
            })}
          </div>
        </div>

        {top3Scenarios.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Preferred Scenarios to Live In</h4>
            <div className="flex flex-wrap gap-2">
              {top3Scenarios.map((id, index) => {
                const sc = SMI_SCENARIOS.find((s) => s.id === id);
                return (
                  <div key={id} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs flex items-start gap-2 w-full">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">{index + 1}</span>
                    <div>
                      <span className="font-bold text-slate-200">Scenario {id}: </span>
                      <span className="text-slate-400 leading-relaxed">{sc?.prompt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Scenario Rankings Detail</h4>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {SMI_SCENARIOS.map((sc) => {
              const ans = scenarioAnswers[sc.id];
              const ranking = (ans?.ranking as number[]) || [];
              return (
                <div key={sc.id} className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2">
                  <div className="font-bold text-indigo-300 text-xs">Scenario {sc.id} Activity Rankings:</div>
                  {ranking.length > 0 ? (
                    <ol className="list-decimal list-inside text-xs text-slate-350 space-y-1">
                      {ranking.map((idx, rankIdx) => {
                        const act = sc.activities[idx];
                        return (
                          <li key={rankIdx} className="leading-relaxed">
                            <span className="font-semibold text-slate-200">{act?.label}</span>{" "}
                            <span className="text-indigo-400 text-[10px] uppercase font-bold tracking-wider">({act?.column})</span>
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <p className="text-xs text-slate-600 italic">No answers ranked</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 6. PARENTS_MEETING (Module 17)
  // -----------------------------------------------------------
  if (testType === "PARENTS_MEETING") {
    const testData = answers.__testData || answers;

    const renderParentField = (label: string, value: any) => {
      if (value === undefined || value === null || value === "") return null;
      return (
        <div key={label} className="border-b border-white/5 pb-2 last:border-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</div>
          <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
            {Array.isArray(value) ? value.join(", ") : String(value)}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300">
          <strong>Parents Meeting Questionnaire Details:</strong> Responses formatted by question section.
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {/* Q1 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q1. Describe the Child</h5>
            {renderParentField("Mother's Description", testData.q1_mother_description)}
            {renderParentField("Father's Description", testData.q1_father_description)}
          </div>

          {/* Q2 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q2. Relationship with Child</h5>
            {renderParentField("Dad's Relationship", testData.q2_dad_relationship)}
            {renderParentField("Mom's Relationship", testData.q2_mom_relationship)}
          </div>

          {/* Q3 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q3. School Journey</h5>
            {renderParentField("Favourite Subject", testData.q3_favourite_subject)}
            {renderParentField("Subject They Hate", testData.q3_hated_subject)}
            {renderParentField("Kind of Learner (slow/avg/fast)", testData.q3_kind_of_learner)}
            {renderParentField("Learning Style", testData.q3_learning_style)}
            {renderParentField("Relationship with Teachers", testData.q3_relationship_teachers)}
            {renderParentField("Relationship with Friends", testData.q3_relationship_friends)}
            {renderParentField("Relationship with Opposite Gender", testData.q3_relationship_opposite_gender)}
            {renderParentField("Bullying/Harassment Incidents", testData.q3_bullied_or_harassed)}
            {renderParentField("Academic Grades & Performance", testData.q3_marks_scoring)}
            {renderParentField("Won / Appreciated Awards", testData.q3_won_appreciated)}
            {renderParentField("Extracurricular Activities", testData.q3_extracurriculars)}
          </div>

          {/* Q4 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q4. Routine & Traits Ratings</h5>
            {renderParentField("Waking & Sleeping Schedule", testData.q4_waking_sleeping)}
            {renderParentField("Eating Habits", testData.q4_eating_habits)}
            {renderParentField("Studying Habits", testData.q4_studying_habits)}
            {renderParentField("Approach to Deadlines", testData.q4_deadlines_approach)}
            {renderParentField("Traveling habits", testData.q4_traveling)}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-white/5">
              {[
                { label: "Attention", val: testData.q4_rate_attention },
                { label: "Emotional Reg", val: testData.q4_rate_emotional_regulation },
                { label: "Decision Making", val: testData.q4_rate_decision_making },
                { label: "Social Skill", val: testData.q4_rate_social_interaction },
                { label: "Time Mgmt", val: testData.q4_rate_time_management },
              ].map(({ label, val }) => (
                <div key={label} className="bg-slate-950 p-2 border border-slate-800 rounded-lg text-center">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</div>
                  <div className="text-sm font-black text-indigo-300 mt-0.5">{val || 5}/10</div>
                </div>
              ))}
            </div>
          </div>

          {/* Q5 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q5. Importance Ratings (1-10)</h5>
            {[
              { label: "Money", rating: testData.q5_money_rating, exp: testData.q5_money_explanation },
              { label: "Creative Expression", rating: testData.q5_creative_expression_rating, exp: testData.q5_creative_expression_explanation },
              { label: "Passion", rating: testData.q5_passion_rating, exp: testData.q5_passion_explanation },
              { label: "Satisfaction", rating: testData.q5_satisfaction_rating, exp: testData.q5_satisfaction_explanation },
              { label: "Giving Back", rating: testData.q5_giving_back_rating, exp: testData.q5_giving_back_explanation },
            ].map(({ label, rating, exp }) => (
              <div key={label} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-350">{label}</span>
                  <span className="text-xs font-black text-indigo-400">{rating || 5}/10</span>
                </div>
                {exp && <p className="text-xs text-slate-400 leading-relaxed italic">"{exp}"</p>}
              </div>
            ))}
          </div>

          {/* Q6 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q6. Free Time Utilization</h5>
            {renderParentField("Activities", testData.q6_free_time)}
          </div>

          {/* Q7 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q7. Social Space Behaviors</h5>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { l: "Comfort: Family", val: testData.q7_comfort_close_family },
                { l: "Comfort: Friends", val: testData.q7_comfort_friends },
                { l: "Comfort: Authority", val: testData.q7_comfort_authority },
                { l: "Comfort: Strangers", val: testData.q7_comfort_strangers },
                { l: "Comm: Family", val: testData.q7_communication_close_family },
                { l: "Comm: Friends", val: testData.q7_communication_friends },
                { l: "Comm: Authority", val: testData.q7_communication_authority },
                { l: "Comm: Strangers", val: testData.q7_communication_strangers },
                { l: "Initiation: Family", val: testData.q7_initiation_close_family },
                { l: "Initiation: Friends", val: testData.q7_initiation_friends },
                { l: "Initiation: Authority", val: testData.q7_initiation_authority },
                { l: "Initiation: Strangers", val: testData.q7_initiation_strangers },
                { l: "Emotional: Family", val: testData.q7_emotional_close_family },
                { l: "Emotional: Friends", val: testData.q7_emotional_friends },
                { l: "Emotional: Authority", val: testData.q7_emotional_authority },
                { l: "Emotional: Strangers", val: testData.q7_emotional_strangers },
              ].map(({ l, val }) => (
                <div key={l} className="p-2 bg-slate-950/60 border border-slate-900 rounded-lg">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{l}</div>
                  <div className="text-xs text-slate-300 mt-0.5">{val || "N/A"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Q8 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q8. Influences & Life Incidents</h5>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-950 p-2 text-center rounded-lg border border-slate-800">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Media Influence</div>
                <div className="text-sm font-black text-indigo-300 mt-0.5">{testData.q9_media_rating || 5}/10</div>
              </div>
              <div className="bg-slate-950 p-2 text-center rounded-lg border border-slate-800">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Friends Influence</div>
                <div className="text-sm font-black text-indigo-300 mt-0.5">{testData.q9_friends_rating || 5}/10</div>
              </div>
              <div className="bg-slate-950 p-2 text-center rounded-lg border border-slate-800">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Family Influence</div>
                <div className="text-sm font-black text-indigo-300 mt-0.5">{testData.q9_parents_family_rating || 5}/10</div>
              </div>
            </div>
            {renderParentField("Media Content Watched", testData.q9_media_content)}
            {renderParentField("Other Influences", testData.q9_anything_else_influence)}
            {renderParentField("Significant Life Events/Incidents", testData.q9b_incidents)}
          </div>

          {/* Q9 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q9. Career Stance & Concerns</h5>
            {renderParentField("Career Path Thoughts", testData.q10_career_thoughts)}
          </div>

          {/* Q10 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q10. Study Destination Stances</h5>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { l: "11/12th - Home", val: testData.q11_11_12_home, w: testData.q11_11_12_home_why },
                { l: "11/12th - India", val: testData.q11_11_12_india, w: testData.q11_11_12_india_why },
                { l: "11/12th - Abroad", val: testData.q11_11_12_abroad, w: testData.q11_11_12_abroad_why },
                { l: "Grad - Home", val: testData.q11_grad_home, w: testData.q11_grad_home_why },
                { l: "Grad - India", val: testData.q11_grad_india, w: testData.q11_grad_india_why },
                { l: "Grad - Abroad", val: testData.q11_grad_abroad, w: testData.q11_grad_abroad_why },
                { l: "Masters - Home", val: testData.q11_masters_home, w: testData.q11_masters_home_why },
                { l: "Masters - India", val: testData.q11_masters_india, w: testData.q11_masters_india_why },
                { l: "Masters - Abroad", val: testData.q11_masters_abroad, w: testData.q11_masters_abroad_why },
                { l: "Settle - Home", val: testData.q11_settle_home, w: testData.q11_settle_home_why },
                { l: "Settle - India", val: testData.q11_settle_india, w: testData.q11_settle_india_why },
                { l: "Settle - Abroad", val: testData.q11_settle_abroad, w: testData.q11_settle_abroad_why },
              ].map(({ l, val, w }) => (
                <div key={l} className="p-2 bg-slate-950 border border-slate-850 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">{l}</span>
                    <span className="font-bold text-indigo-400 text-[10px]">{val || "N/A"}</span>
                  </div>
                  {w && <p className="text-[10px] text-slate-500 mt-1 italic">Reason: "{w}"</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Q11 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q11. Marriage & Independence Stance</h5>
            {renderParentField("Marriage", testData.q12_marriage)}
            {renderParentField("Independence Timeline", testData.q12_independence_time)}
            {renderParentField("Financial Support Limit (Age)", testData.q12_financial_support_age)}
          </div>

          {/* Q12 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q12. Risk Behaviour Inclinations</h5>
            {renderParentField("Preferences", testData.q13_risk_behaviour)}
          </div>

          {/* Q13 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q13. Abilities & Qualities Inherited</h5>
            {renderParentField("Hidden Talents Identified", testData.q14_hidden_talents)}
            {renderParentField("Path if there were no constraints", testData.q14_if_no_constraints)}
            {renderParentField("Qualities Inherited from Mom", testData.q14_qualities_from_mom)}
            {renderParentField("Qualities Inherited from Dad", testData.q14_qualities_from_dad)}
          </div>

          {/* Q14 */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-white/5 pb-1">Q14. Additional Notes</h5>
            {renderParentField("Anything Else", testData.q15_anything_else)}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 7. SELF_DISCOVERY (Module 18)
  // -----------------------------------------------------------
  if (testType === "SELF_DISCOVERY") {
    const ageGroup = answers.sd_age_group || "";
    const round2Questions = ageGroup === "13-18" ? SD_TEEN : SD_ADULT;
    const questions = [...SD_ROUND1, ...round2Questions];

    return (
      <div className="space-y-4">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300 flex justify-between items-center">
          <span><strong>Self Discovery Test:</strong> Complete questionnaire responses.</span>
          <span className="bg-indigo-500/20 px-2 py-0.5 border border-indigo-500/30 rounded text-[10px] font-bold">Age: {ageGroup || "All"}</span>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {questions.map((q) => {
            const val = answers[q.id];
            if (val === undefined) return null;
            return (
              <div key={q.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                <div className="text-sm font-semibold text-slate-200">
                  <span className="text-indigo-400 font-bold mr-2">{q.num}.</span>
                  {q.text}
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl text-xs text-slate-350 leading-relaxed whitespace-pre-wrap italic">
                  "{val.trim() ? val : "(No answer provided)"}"
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 8. JOB_FUNCTIONS (Module 19)
  // -----------------------------------------------------------
  if (testType === "JOB_FUNCTIONS") {
    const renderRatingBadge = (rating: any) => {
      const num = Number(rating);
      if (isNaN(num)) return <span className="text-slate-500 text-xs font-bold">Unrated</span>;
      if (num >= 4) {
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-black">
            {num}/5 — Confident
          </span>
        );
      }
      if (num >= 2) {
        return (
          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-black">
            {num}/5 — Doubtful
          </span>
        );
      }
      return (
        <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-black">
          {num}/5 — Low Interest
        </span>
      );
    };

    return (
      <div className="space-y-6">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300">
          <strong>Identify Your Job Functions:</strong> Rating of natural confidence for each function category.
        </div>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {(() => {
            // Group by category, then by section title
            const categories = ["People-Oriented (One-on-One)", "People-Oriented (Groups & Public)", "Information & Ideas", "Things & Physical World"];
            return categories.map((cat) => {
              const catSections = JF_SECTIONS.filter((s) => s.category === cat);
              return (
                <div key={cat} className="space-y-3">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-500/20 pb-1.5">
                    {cat}
                  </h4>
                  <div className="space-y-4">
                    {catSections.map((sec) => (
                      <div key={sec.title} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                        <div className="text-xs font-extrabold text-slate-300">{sec.title}</div>
                        <div className="space-y-2">
                          {sec.items.map((item, idx) => {
                            const val = answers[item.id];
                            return (
                              <div key={item.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-950/40 rounded-lg border border-slate-900/60 hover:bg-slate-950/60 transition-colors">
                                <span className="text-slate-350 pr-4 leading-relaxed">
                                  <span className="text-slate-650 mr-2 font-bold">{idx + 1}.</span>
                                  {item.text}
                                </span>
                                <span className="shrink-0">{renderRatingBadge(val)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    );
  }

  // Fallback if not matching any custom testType
  return (
    <pre className="text-sm text-slate-300 whitespace-pre-wrap bg-white/5 p-3 rounded-xl overflow-x-auto border border-white/5">
      {JSON.stringify(answers, null, 2)}
    </pre>
  );
}

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action, career, question, answer, difficulty } = body;

        if (action === 'generate_questions') {
            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional career interview coach. Generate exactly 5 interview questions for a ${career || 'general'} position at ${difficulty || 'intermediate'} level. Return ONLY valid JSON array of objects with "question" and "type" fields. Types: "behavioral", "technical", "situational". No markdown.`
                    },
                    { role: 'user', content: `Generate 5 ${difficulty || 'intermediate'}-level interview questions for: ${career}` }
                ],
                temperature: 0.7,
                max_tokens: 1000
            });

            const text = completion.choices[0]?.message?.content || '[]';
            try {
                const questions = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
                return NextResponse.json({ questions });
            } catch {
                return NextResponse.json({
                    questions: [
                        { question: "Tell me about yourself and why you're interested in this career.", type: "behavioral" },
                        { question: "Describe a challenging project you've worked on.", type: "situational" },
                        { question: "What are your key strengths relevant to this role?", type: "behavioral" },
                        { question: "How do you stay updated with industry trends?", type: "technical" },
                        { question: "Where do you see yourself in 5 years?", type: "behavioral" }
                    ]
                });
            }
        }

        if (action === 'evaluate_answer') {
            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert interview evaluator. Evaluate the interview answer. Return ONLY valid JSON with: "score" (1-10), "strengths" (array of 2-3 strings), "improvements" (array of 2-3 strings), "sampleAnswer" (string, ideal answer in 2-3 sentences). No markdown.`
                    },
                    { role: 'user', content: `Career: ${career}\nQuestion: ${question}\nCandidate Answer: ${answer}` }
                ],
                temperature: 0.5,
                max_tokens: 800
            });

            const text = completion.choices[0]?.message?.content || '{}';
            try {
                const evaluation = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
                return NextResponse.json({ evaluation });
            } catch {
                return NextResponse.json({
                    evaluation: {
                        score: 6,
                        strengths: ["Shows genuine interest", "Good communication"],
                        improvements: ["Add specific examples", "Quantify achievements"],
                        sampleAnswer: "A strong answer would include specific, measurable achievements and how they relate to the role."
                    }
                });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Interview API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

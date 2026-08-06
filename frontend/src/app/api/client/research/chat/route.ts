import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateProfessionResearch } from '@/lib/ai'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { topic } = await req.json()
        if (!topic) {
            return NextResponse.json({ error: 'Missing topic' }, { status: 400 })
        }

        const research = await generateProfessionResearch(topic, session.user.id)
        return NextResponse.json(research)
    } catch (error: any) {
        console.error('API research chat error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

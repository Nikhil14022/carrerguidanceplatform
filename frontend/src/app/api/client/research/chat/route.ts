import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateGeneralResearch } from '@/lib/ai'

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

        const research = await generateGeneralResearch(topic)
        return NextResponse.json(research)
    } catch (error) {
        console.error('API research chat error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

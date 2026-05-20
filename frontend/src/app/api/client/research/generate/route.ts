import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateCareerResearch } from '@/lib/ai'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { careerOptionId } = await req.json()
        if (!careerOptionId) {
            return NextResponse.json({ error: 'Missing careerOptionId' }, { status: 400 })
        }

        // Check if research already exists
        const existing = await prisma.researchEntry.findUnique({
            where: { careerOptionId }
        })

        if (existing) {
            return NextResponse.json(existing)
        }

        // Generate if not exists
        const research = await generateCareerResearch(careerOptionId)
        return NextResponse.json(research)
    } catch (error) {
        console.error('API research generate error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

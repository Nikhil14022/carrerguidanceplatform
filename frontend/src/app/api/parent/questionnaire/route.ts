import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const clientProfile = await prisma.clientProfile.findFirst({
            where: { parentId: session.user.id }
        })

        if (!clientProfile) {
            return NextResponse.json({ questionnaire: null })
        }

        const clientId = clientProfile.id

        const questionnaire = await prisma.parentQuestionnaire.findFirst({
            where: { clientProfileId: clientId, parentId: session.user.id },
            orderBy: { submittedAt: 'desc' }
        })

        return NextResponse.json({ questionnaire })
    } catch (error) {
        console.error('get parent questionnaire error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { responses } = await req.json()
        if (!responses) return NextResponse.json({ error: 'Missing responses' }, { status: 400 })

        const clientProfile = await prisma.clientProfile.findFirst({
            where: { parentId: session.user.id }
        })

        if (!clientProfile) {
            return NextResponse.json({ error: 'No associated child profile' }, { status: 400 })
        }

        const clientId = clientProfile.id

        const questionnaire = await prisma.parentQuestionnaire.create({
            data: {
                clientProfileId: clientId,
                parentId: session.user.id,
                responses
            }
        })

        return NextResponse.json({ success: true, questionnaire })
    } catch (error) {
        console.error('post parent questionnaire error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

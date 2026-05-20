import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateFinalPlan } from '@/lib/ai'
import prisma from '@/lib/prisma'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: reportId } = await params

        // Verify report ownership
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: { careerOptions: { where: { isShortlisted: true } } }
        })

        if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

        // Find client profile to verify ownership
        const profile = await prisma.clientProfile.findUnique({
            where: { userId: session.user.id }
        })

        if (!profile || report.clientProfileId !== profile.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const shortlistedIds = report.careerOptions.map(c => c.id)

        if (shortlistedIds.length !== 2) {
            return NextResponse.json({ error: 'Please shortlist exactly 2 careers to generate a final comparison.' }, { status: 400 })
        }

        const finalPlan = await generateFinalPlan(reportId, shortlistedIds)

        return NextResponse.json(finalPlan)
    } catch (error) {
        console.error('Final plan generation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: reportId } = await params

        const finalPlan = await prisma.finalPlan.findUnique({
            where: { reportId }
        })

        if (!finalPlan) return NextResponse.json({ error: 'Final plan not found' }, { status: 404 })

        return NextResponse.json(finalPlan)
    } catch (error) {
        console.error('Final plan fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { careerOptionId } = await req.json()

        const careerOption = await prisma.careerOption.findUnique({
            where: { id: careerOptionId },
            include: { report: true }
        })

        if (!careerOption) return NextResponse.json({ error: 'Career option not found' }, { status: 404 })

        // Check if the report belongs to the user
        const profile = await prisma.clientProfile.findUnique({
            where: { userId: session.user.id }
        })

        if (!profile || careerOption.report.clientProfileId !== profile.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Toggle logic
        const newState = !careerOption.isShortlisted

        // If trying to shortlist, check the count
        if (newState) {
            const count = await prisma.careerOption.count({
                where: {
                    reportId: careerOption.reportId,
                    isShortlisted: true
                }
            })

            if (count >= 2) {
                return NextResponse.json({ error: 'You can only shortlist up to 2 careers.' }, { status: 400 })
            }
        }

        const updated = await prisma.careerOption.update({
            where: { id: careerOptionId },
            data: { isShortlisted: newState }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Shortlist error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

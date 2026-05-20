import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user || !['MENTOR_PERMANENT', 'MENTOR_TEMPORARY'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { status } = await request.json()
        const resolvedParams = await params;

        const enrollment = await prisma.workshopEnrollment.update({
            where: { id: resolvedParams.id },
            data: { status, respondedAt: new Date() }
        })

        return NextResponse.json({ success: true, enrollment })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
}

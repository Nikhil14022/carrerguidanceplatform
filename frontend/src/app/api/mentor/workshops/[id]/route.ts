import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user || !['MENTOR_PERMANENT', 'MENTOR_TEMPORARY'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params;

        // Ensure the workshop belongs to the mentor
        const workshop = await prisma.workshop.findUnique({
            where: { id: resolvedParams.id }
        });

        if (!workshop || workshop.createdBy !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Need to delete enrollments first because of Prisma constraints if cascade is not set
        await prisma.workshopEnrollment.deleteMany({
            where: { workshopId: resolvedParams.id }
        });

        await prisma.workshop.delete({
            where: { id: resolvedParams.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}

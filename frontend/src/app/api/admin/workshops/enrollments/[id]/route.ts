import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        const { id } = await params

        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { status } = body

        if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const enrollment = await prisma.workshopEnrollment.update({
            where: { id },
            data: { status }
        })

        return NextResponse.json({ success: true, enrollment })
    } catch (error) {
        console.error('Update enrollment error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

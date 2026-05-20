import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { enrollmentId, notificationId, rsvp } = body

        if (!enrollmentId || !notificationId || !rsvp) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (rsvp !== 'YES' && rsvp !== 'NO') {
            return NextResponse.json({ error: 'Invalid RSVP value' }, { status: 400 })
        }

        const status = rsvp === 'YES' ? 'APPROVED' : 'REJECTED'
        const isParent = session.user.role === 'PARENT'

        // Update the enrollment
        await prisma.workshopEnrollment.update({
            where: { id: enrollmentId },
            data: {
                status,
                respondedAt: new Date(),
                ...(isParent && rsvp === 'YES' ? { parentApproved: true } : {})
            }
        })

        // Mark the notification as read
        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        })

        return NextResponse.json({ success: true, status })
    } catch (error: any) {
        console.error('RSVP error:', error)
        return NextResponse.json({ error: `Internal server error: ${error?.message || String(error)}` }, { status: 500 })
    }
}

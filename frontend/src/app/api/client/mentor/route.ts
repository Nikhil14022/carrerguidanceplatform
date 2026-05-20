import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const clientProfile = await prisma.clientProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!clientProfile) {
            return NextResponse.json({ mentor: null });
        }

        const assignment = await prisma.mentorAssignment.findFirst({
            where: { clientProfileId: clientProfile.id, isActive: true },
            include: { mentorProfile: { include: { user: true } } }
        });

        if (!assignment) {
            return NextResponse.json({ mentor: null })
        }

        const mentor = assignment.mentorProfile;
        return NextResponse.json({
            mentor: {
                id: mentor.id,
                name: mentor.user.name,
                email: mentor.user.email,
                whatsappNumber: mentor.whatsappNumber,
                googleCalendarUrl: mentor.googleCalendarUrl,
                bio: mentor.bio,
            }
        })
    } catch (error) {
        console.error('API mentor error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

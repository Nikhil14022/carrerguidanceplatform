import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user || !['MENTOR_PERMANENT', 'MENTOR_TEMPORARY'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // A mentor can see workshops they created, OR workshops where their assignments are enrolled.
        // For simplicity, let's just let them see workshops they created for now, but also we can show all workshops if they want to refer clients.
        // Let's just fetch workshops created by this mentor.
        const workshops = await prisma.workshop.findMany({
            where: {
                createdBy: session.user.id
            },
            orderBy: { date: 'asc' },
            include: {
                enrollments: {
                    include: {
                        clientProfile: {
                            include: {
                                user: { select: { name: true, email: true } }
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json({ workshops, mentorId: session.user.id })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user || !['MENTOR_PERMANENT', 'MENTOR_TEMPORARY'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { title, description, date, meetLink } = await request.json()

        // Find the mentor's assigned clients so we can auto-enroll them as pending
        const mentorProfile = await prisma.mentorProfile.findUnique({
            where: { userId: session.user.id },
            include: { assignments: true }
        });

        const enrollments = mentorProfile?.assignments.map(a => ({
            clientProfileId: a.clientProfileId,
            status: 'PENDING'
        })) || [];

        const workshop = await prisma.workshop.create({
            data: {
                title,
                description,
                date: new Date(date),
                location: meetLink || null, // Using location field for meet link
                createdBy: session.user.id,
                enrollments: {
                    create: enrollments
                }
            }
        })

        return NextResponse.json({ success: true, workshop })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
    }
}

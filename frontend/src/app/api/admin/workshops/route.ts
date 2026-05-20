import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const workshops = await prisma.workshop.findMany({
            orderBy: { date: 'desc' },
            include: {
                enrollments: {
                    // @ts-ignore - Temporary workaround for outdated Prisma types in dev server
                    include: {
                        clientProfile: {
                            include: { user: { select: { name: true, email: true } } }
                        }
                    }
                }
            }
        })

        const mappedWorkshops = workshops.map((w: any) => ({
            ...w,
            meetLink: w.location // Map location field from DB to meetLink for the UI
        }))

        return NextResponse.json({ workshops: mappedWorkshops })
    } catch (error) {
        console.error('Fetch workshops error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { title, description, date, meetLink } = body

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'User ID is missing from session. Please log out and log back in.' }, { status: 401 })
        }

        if (!title || !description || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const workshop = await prisma.workshop.create({
            data: {
                title,
                description,
                date: new Date(date),
                location: meetLink || null, // Storing meetLink in the location field
                createdBy: session.user.id, // Ensure createdBy is set to avoid schema errors
            }
        })

        // Auto-enroll all active clients and send RSVP notifications
        const clients = await prisma.clientProfile.findMany({
            include: { user: true }
        })

        for (const client of clients) {
            // 1. Create Pending Enrollment
            const enrollment = await prisma.workshopEnrollment.create({
                data: {
                    workshopId: workshop.id,
                    clientProfileId: client.id,
                    status: 'PENDING',
                    parentApproved: false
                }
            })

            // 2. Notify Client
            if (client.userId) {
                await prisma.notification.create({
                    data: {
                        userId: client.userId,
                        title: `New Workshop: ${workshop.title}`,
                        message: `A new workshop is scheduled for ${new Date(workshop.date).toLocaleString()}. Are you attending?`,
                        type: 'SYSTEM',
                        link: `rsvp:${enrollment.id}`
                    }
                })
            }

            // 3. Notify Parent (if exists)
            if (client.parentId) {
                await prisma.notification.create({
                    data: {
                        userId: client.parentId,
                        title: `Workshop RSVP: ${client.user?.name || 'Your child'}`,
                        message: `A new workshop "${workshop.title}" is scheduled for ${new Date(workshop.date).toLocaleString()}. Do you approve their attendance?`,
                        type: 'SYSTEM',
                        link: `rsvp:${enrollment.id}`
                    }
                })
            }
        }

        return NextResponse.json({ success: true, workshop })
    } catch (error: any) {
        console.error('Create workshop error:', error)
        return NextResponse.json({ error: `Internal server error: ${error?.message || String(error)}` }, { status: 500 })
    }
}

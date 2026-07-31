import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const MENTOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY', 'EXPERT'];

// GET: Mentor dashboard — assigned clients with progress
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || !MENTOR_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const mentorProfileId = session.user.mentorProfileId;

        let clients: any[] = [];
        
        // Super Admin / legacy Admin sees all clients
        if (['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
            clients = await prisma.clientProfile.findMany({
                include: {
                    user: { select: { name: true, email: true } },
                    modules: {
                        include: {
                            module: { select: { title: true, schema: true } },
                            response: { select: { data: true, submittedAt: true } }
                        }
                    },
                    reports: { select: { id: true, status: true } }
                }
            });
        } else {
            // Mentors see only assigned clients
            if (mentorProfileId) {
                const assignments = await (prisma as any).mentorAssignment.findMany({
                    where: { mentorProfileId, isActive: true }
                });

                const clientIds = assignments.map((a: any) => a.clientProfileId);

                const rawClients = await prisma.clientProfile.findMany({
                    where: { id: { in: clientIds } },
                    include: {
                        user: { select: { name: true, email: true } },
                        modules: {
                            include: {
                                module: { select: { title: true, schema: true } },
                                response: { select: { data: true, submittedAt: true } }
                            }
                        },
                        reports: { select: { id: true, status: true } }
                    }
                });

                // Enrich with permissions
                clients = rawClients.map(c => {
                    const assignment = assignments.find((a: any) => a.clientProfileId === c.id);
                    return {
                        ...c,
                        permissions: assignment?.permissions || [],
                        assignedAt: assignment?.assignedAt
                    };
                });
            }
        }

        // Fetch appointments scheduled for this mentor's expertId (or all if admin)
        const slotQuery: any = {};
        if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
            slotQuery.expertId = session.user.id;
        }
        
        const mentorSlots = await prisma.appointmentSlot.findMany({
            where: slotQuery
        });
        const slotIds = mentorSlots.map(s => s.id);

        const rawBookings = await prisma.appointmentBooking.findMany({
            where: {
                slotId: { in: slotIds }
            },
            include: {
                clientProfile: {
                    include: {
                        user: { select: { name: true, email: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const meetings = rawBookings.map(bk => {
            const slot = mentorSlots.find(s => s.id === bk.slotId);
            return {
                id: bk.id,
                startTime: slot?.startTime || bk.createdAt,
                endTime: slot?.endTime,
                status: bk.status,
                type: bk.type,
                meetingLink: bk.meetingLink,
                notes: bk.notes,
                clientName: bk.clientProfile.user.name || 'Unnamed Client',
                clientEmail: bk.clientProfile.user.email
            };
        });

        return NextResponse.json({ clients, role: session.user.role, meetings });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

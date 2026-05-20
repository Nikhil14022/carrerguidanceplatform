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

        // Super Admin / legacy Admin sees all clients
        if (['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
            const clients = await prisma.clientProfile.findMany({
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
            return NextResponse.json({ clients, role: session.user.role });
        }

        // Mentors see only assigned clients
        if (!mentorProfileId) {
            return NextResponse.json({ clients: [], role: session.user.role });
        }

        const assignments = await (prisma as any).mentorAssignment.findMany({
            where: { mentorProfileId, isActive: true }
        });

        const clientIds = assignments.map((a: any) => a.clientProfileId);

        const clients = await prisma.clientProfile.findMany({
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
        const enrichedClients = clients.map(c => {
            const assignment = assignments.find((a: any) => a.clientProfileId === c.id);
            return {
                ...c,
                permissions: assignment?.permissions || [],
                assignedAt: assignment?.assignedAt
            };
        });

        return NextResponse.json({ clients: enrichedClients, role: session.user.role });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const MENTOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY', 'EXPERT'];

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user || !MENTOR_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const role = session.user.role;
        const mentorProfileId = session.user.mentorProfileId;

        // If not admin, verify assignment
        if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
            if (!mentorProfileId) return NextResponse.json({ error: 'No mentor profile' }, { status: 403 });
            const assignment = await (prisma as any).mentorAssignment.findFirst({
                where: { mentorProfileId, clientProfileId: id, isActive: true }
            });
            if (!assignment) {
                return NextResponse.json({ error: 'Client not assigned to you' }, { status: 403 });
            }
        }

        const clientProfile = await prisma.clientProfile.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, email: true, name: true, createdAt: true } },
                modules: {
                    orderBy: { order: 'asc' },
                    include: {
                        module: true,
                        response: { select: { data: true, submittedAt: true, approvedAt: true } }
                    }
                },
                reports: {
                    include: { careerOptions: true }
                },
                parentData: true
            }
        });

        if (!clientProfile) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json({ client: clientProfile });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

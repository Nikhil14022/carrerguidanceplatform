import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

// GET: List all mentors
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const mentors = await prisma.user.findMany({
            where: { role: { in: ['MENTOR_PERMANENT', 'MENTOR_TEMPORARY', 'EXPERT'] } },
            include: {
                mentorProfile: {
                    include: {
                        assignments: {
                            where: { isActive: true },
                            select: {
                                id: true,
                                clientProfileId: true,
                                permissions: true,
                                assignedAt: true,
                                expiresAt: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Enrich with client names for each assignment
        const enriched = await Promise.all(mentors.map(async (m) => {
            const assignments = m.mentorProfile?.assignments || [];
            const clientIds = assignments.map(a => a.clientProfileId);
            const clients = clientIds.length > 0
                ? await prisma.clientProfile.findMany({
                    where: { id: { in: clientIds } },
                    include: { user: { select: { name: true, email: true } } }
                })
                : [];

            return {
                id: m.id,
                name: m.name,
                email: m.email,
                role: m.role,
                createdAt: m.createdAt,
                mentorProfile: m.mentorProfile ? {
                    id: m.mentorProfile.id,
                    type: m.mentorProfile.type,
                    status: m.mentorProfile.status,
                    specializations: m.mentorProfile.specializations,
                    bio: m.mentorProfile.bio,
                    accessEnd: m.mentorProfile.accessEnd,
                    whatsappNumber: m.mentorProfile.whatsappNumber,
                    googleCalendarUrl: m.mentorProfile.googleCalendarUrl,
                    assignments: assignments.map(a => ({
                        ...a,
                        client: clients.find(c => c.id === a.clientProfileId)
                    }))
                } : null
            };
        }));

        return NextResponse.json(enriched);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new mentor
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { name, email, password, type, specializations, bio, accessEnd, whatsappNumber, googleCalendarUrl } = await req.json();

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
        }

        const hashedPassword = await hash(password, 12);
        const role = type === 'TEMPORARY' ? 'MENTOR_TEMPORARY' : 'MENTOR_PERMANENT';

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role as any,
                mentorProfile: {
                    create: {
                        type: type || 'PERMANENT',
                        specializations: specializations || [],
                        bio: bio || null,
                        whatsappNumber: whatsappNumber || null,
                        googleCalendarUrl: googleCalendarUrl || null,
                        accessEnd: accessEnd ? new Date(accessEnd) : null
                    }
                }
            },
            include: { mentorProfile: true }
        });

        return NextResponse.json({ id: user.id, name: user.name, email: user.email, mentorProfile: user.mentorProfile });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update an existing mentor
export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id, name, email, password, type, specializations, bio, accessEnd, whatsappNumber, googleCalendarUrl } = await req.json();

        // Check if mentor user exists
        const user = await prisma.user.findUnique({ where: { id }, include: { mentorProfile: true } });
        if (!user || !user.mentorProfile) {
            return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
        }

        const updateData: any = { name, email };
        if (password && password.trim() !== '') {
            updateData.password = await hash(password, 12);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...updateData,
                mentorProfile: {
                    update: {
                        type: type || 'PERMANENT',
                        specializations: specializations || [],
                        bio: bio || null,
                        whatsappNumber: whatsappNumber || null,
                        googleCalendarUrl: googleCalendarUrl || null,
                        accessEnd: accessEnd ? new Date(accessEnd) : null
                    }
                }
            },
            include: { mentorProfile: true }
        });

        return NextResponse.json({ id: updatedUser.id, name: updatedUser.name, mentorProfile: updatedUser.mentorProfile });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Update mentor status or assign/unassign clients
export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { action, mentorProfileId, clientProfileId, permissions, status, expiresAt } = await req.json();

        if (action === 'assign') {
            const assignment = await prisma.mentorAssignment.create({
                data: {
                    mentorProfileId,
                    clientProfileId,
                    permissions: permissions || ['VIEW_MODULES', 'VIEW_REPORTS', 'CHAT'],
                    assignedBy: session.user.id,
                    expiresAt: expiresAt ? new Date(expiresAt) : null
                }
            });
            return NextResponse.json(assignment);
        }

        if (action === 'unassign') {
            await prisma.mentorAssignment.updateMany({
                where: { mentorProfileId, clientProfileId, isActive: true },
                data: { isActive: false }
            });
            return NextResponse.json({ success: true });
        }

        if (action === 'update_status') {
            const updated = await prisma.mentorProfile.update({
                where: { id: mentorProfileId },
                data: { status }
            });
            return NextResponse.json(updated);
        }

        if (action === 'delete') {
            // Deactivate all assignments then delete profile and user
            await prisma.mentorAssignment.updateMany({
                where: { mentorProfileId },
                data: { isActive: false }
            });
            const profile = await prisma.mentorProfile.findUnique({ where: { id: mentorProfileId } });
            if (profile) {
                await prisma.mentorProfile.delete({ where: { id: mentorProfileId } });
                await prisma.user.delete({ where: { id: profile.userId } });
            }
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

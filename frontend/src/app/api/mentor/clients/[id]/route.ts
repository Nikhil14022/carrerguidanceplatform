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

        let clientProfile = await prisma.clientProfile.findUnique({
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
                parentData: true,
                stages: {
                    orderBy: { stageNumber: 'asc' }
                }
            }
        });

        if (!clientProfile) {
            clientProfile = await prisma.clientProfile.findUnique({
                where: { userId: id },
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
                    parentData: true,
                    stages: {
                        orderBy: { stageNumber: 'asc' }
                    }
                }
            });
        }

        if (!clientProfile) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // If not admin, verify assignment using actual clientProfile.id
        if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
            if (!mentorProfileId) return NextResponse.json({ error: 'No mentor profile' }, { status: 403 });
            const assignment = await (prisma as any).mentorAssignment.findFirst({
                where: { mentorProfileId, clientProfileId: clientProfile.id, isActive: true }
            });
            if (!assignment) {
                return NextResponse.json({ error: 'Client not assigned to you' }, { status: 403 });
            }
        }

        // --- JIT Initialize Workflow Stages ---
        const defaultStageNames = [
            "Student Questionnaire",
            "Parent Questionnaire",
            "Collaborative Meeting: Student and Parent",
            "Report Discussion with the Student",
            "Research and Knowledge Building",
            "Research Discussion",
            "Short Courses and Internships",
            "Shortlisting: Colleges, Universities, and Courses",
            "Entrance Exams"
        ];

        let stages = clientProfile.stages || [];
        if (stages.length < 9) {
            const existingNums = new Set(stages.map((s: any) => s.stageNumber));
            for (let num = 1; num <= 9; num++) {
                if (!existingNums.has(num)) {
                    await prisma.clientStage.create({
                        data: {
                            clientProfileId: clientProfile.id,
                            stageNumber: num,
                            stageName: defaultStageNames[num - 1],
                            status: "NOT_STARTED",
                            notes: "",
                            tasks: [],
                            documents: [],
                            meetingOutcomes: ""
                        }
                    });
                }
            }
            stages = await prisma.clientStage.findMany({
                where: { clientProfileId: clientProfile.id },
                orderBy: { stageNumber: 'asc' }
            });
            // Attach to returned object
            (clientProfile as any).stages = stages;
        }

        // Fetch client appointments
        const rawBookings = await prisma.appointmentBooking.findMany({
            where: { clientProfileId: clientProfile.id },
            orderBy: { createdAt: 'desc' }
        });

        const appointments = await Promise.all(rawBookings.map(async (bk) => {
            const slot = await prisma.appointmentSlot.findUnique({ where: { id: bk.slotId } });
            let expertName = 'Expert Advisor';
            if (slot && slot.expertId) {
                const expertUser = await prisma.user.findUnique({ where: { id: slot.expertId } });
                if (expertUser) expertName = expertUser.name || 'Expert Advisor';
            }
            return {
                id: bk.id,
                startTime: slot?.startTime || bk.createdAt,
                endTime: slot?.endTime,
                status: bk.status,
                type: bk.type,
                meetingLink: bk.meetingLink,
                notes: bk.notes,
                expert: { name: expertName }
            };
        }));

        return NextResponse.json({ 
            client: {
                ...clientProfile,
                appointments
            } 
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

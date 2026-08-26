import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'EXPERT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
        stages: {
          orderBy: { stageNumber: 'asc' }
        }
      }
    })

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
          stages: {
            orderBy: { stageNumber: 'asc' }
          }
        }
      })
    }

    if (!clientProfile) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
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
    })
  } catch (error) {
    console.error('Admin client detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

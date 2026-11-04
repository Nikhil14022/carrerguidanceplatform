import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: { module: true, response: true }
        },
        reports: {
          where: { active: true },
          orderBy: { id: 'desc' }
        },
        stages: {
          orderBy: { stageNumber: 'asc' }
        }
      }
    })

    if (!clientProfile) {
      const moduleTemplates = await prisma.module.findMany({
        orderBy: { defaultOrder: 'asc' }
      });

      clientProfile = await prisma.clientProfile.create({
        data: {
          userId: session.user.id,
          currentStage: 1,
          journeyStatus: 'Started',
          modules: {
            create: moduleTemplates.map((template, idx) => ({
              moduleId: template.id,
              // All modules start LOCKED; admin/mentor unlocks them manually
              status: 'LOCKED',
              order: idx + 1,
              filledBy: 'CLIENT'
            }))
          }
        },
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: { module: true, response: true }
          },
          reports: {
            where: { active: true },
            orderBy: { id: 'desc' }
          },
          stages: {
            orderBy: { stageNumber: 'asc' }
          }
        }
      });
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
          try {
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
          } catch (e) {
            console.error(`Error creating stage ${num}:`, e);
          }
        }
      }

      stages = await prisma.clientStage.findMany({
        where: { clientProfileId: clientProfile.id },
        orderBy: { stageNumber: 'asc' }
      });
    }

    // --- Just-In-Time Module Synchronization ---
    const allModuleTemplates = await prisma.module.findMany({
      orderBy: { defaultOrder: 'asc' }
    })

    const existingModuleIds = new Set(clientProfile.modules.map((m: any) => m.moduleId))
    const missingTemplates = allModuleTemplates.filter((t: any) => !existingModuleIds.has(t.id))

    if (missingTemplates.length > 0) {
      // Add missing modules to user profile
      const newClientModules = await Promise.all(
        missingTemplates.map((template: any) =>
          prisma.clientModule.create({
            data: {
              clientProfileId: clientProfile.id,
              moduleId: template.id,
              order: template.defaultOrder,
              status: 'LOCKED',
              filledBy: 'CLIENT'
            },
            include: { module: true, response: true }
          })
        )
      )

      // Refresh the modules list and recalibrate journey status if needed
      clientProfile.modules = [...clientProfile.modules, ...newClientModules].sort((a, b) => a.order - b.order)
    }

    // NOTE: Modules are never auto-unlocked. Admin/mentor must unlock specific modules manually.

    const completedModules = clientProfile.modules.filter(
      (m: any) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(m.status)
    ).length

    const totalModules = clientProfile.modules.length
    const moduleProgress = totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0

    // Auto-sync Stage 1 status if appropriate
    const stage1 = stages.find((s: any) => s.stageNumber === 1);
    if (stage1) {
      if (completedModules === totalModules && totalModules > 0 && stage1.status !== 'COMPLETED') {
        await prisma.clientStage.update({
          where: { id: stage1.id },
          data: { status: 'COMPLETED' }
        });
        stage1.status = 'COMPLETED';
      } else if (completedModules > 0 && stage1.status === 'NOT_STARTED') {
        await prisma.clientStage.update({
          where: { id: stage1.id },
          data: { status: 'IN_PROGRESS' }
        });
        stage1.status = 'IN_PROGRESS';
      }
    }

    const currentModule = clientProfile.modules.find(
      (m: any) => m.status === 'UNLOCKED' || m.status === 'IN_PROGRESS'
    )

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

    const upcomingMeetings = appointments.filter(appt => new Date(appt.startTime) > new Date());

    const completedStages = stages.filter((s: any) => s.status === 'COMPLETED').length;
    const stageProgress = Math.round((completedStages / 9) * 100);

    return NextResponse.json({
      profile: {
        ...clientProfile,
        stages
      },
      stats: {
        completed: completedModules,
        total: totalModules,
        progress: moduleProgress,
        moduleProgress,
        stageProgress,
        currentStage: clientProfile.currentStage,
        journeyStatus: clientProfile.journeyStatus,
        profileId: clientProfile.id
      },
      currentModule: currentModule ? {
        id: currentModule.id,
        title: currentModule.module.title,
        status: currentModule.status
      } : null,
      reports: clientProfile.reports,
      upcomingMeetings
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

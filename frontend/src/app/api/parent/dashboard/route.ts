import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const clientProfile = await prisma.clientProfile.findFirst({
      where: { parentId: session.user.id },
      include: {
        user: {
          select: { name: true, email: true }
        },
        modules: {
          orderBy: { order: 'asc' },
          include: { module: true, response: true }
        },
        stages: {
          orderBy: { stageNumber: 'asc' }
        }
      }
    })

    if (!clientProfile) {
      return NextResponse.json({ error: 'No child profile linked' }, { status: 404 })
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
      const createdStages = [];

      for (let num = 1; num <= 9; num++) {
        if (!existingNums.has(num)) {
          const created = await prisma.clientStage.create({
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
          createdStages.push(created);
        }
      }

      stages = await prisma.clientStage.findMany({
        where: { clientProfileId: clientProfile.id },
        orderBy: { stageNumber: 'asc' }
      });
    }

    // --- Just-In-Time Module Synchronization (Parent View) ---
    // This ensures parents see the same module count as the student
    const allModuleTemplates = await prisma.module.findMany({
      orderBy: { defaultOrder: 'asc' }
    })

    const existingModuleIds = new Set(clientProfile.modules.map((m: any) => m.moduleId))
    const missingTemplates = allModuleTemplates.filter((t: any) => !existingModuleIds.has(t.id))

    if (missingTemplates.length > 0) {
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
      clientProfile.modules = [...clientProfile.modules, ...newClientModules].sort((a, b) => a.order - b.order)
    }
    // -------------------------------------------------------

    const completedModules = clientProfile.modules.filter(
      (m: any) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(m.status)
    ).length
    const totalModules = clientProfile.modules.length

    // Fetch latest report for the child (only if mentor approved)
    const latestReport = await prisma.report.findFirst({
      where: { clientProfileId: clientProfile.id, active: true, mentorApproved: true },
      include: { careerOptions: true },
      orderBy: { id: 'desc' }
    })

    const completedStages = stages.filter((s: any) => s.status === 'COMPLETED').length;
    const progress = Math.round((completedStages / 9) * 100);

    return NextResponse.json({
      child: {
        name: clientProfile.user.name,
        email: clientProfile.user.email
      },
      stats: {
        completed: completedModules,
        total: totalModules,
        progress,
        currentStage: clientProfile.currentStage,
        journeyStatus: clientProfile.journeyStatus
      },
      stages,
      report: latestReport ? {
        id: latestReport.id,
        content: latestReport.content,
        status: latestReport.status,
        careerOptions: latestReport.careerOptions.map((c: any) => ({
          title: c.title,
          match: c.match,
          reasoning: c.reasoning
        }))
      } : null
    })
  } catch (error) {
    console.error('Parent dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

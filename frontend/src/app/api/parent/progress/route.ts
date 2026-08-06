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
    }

    const timeline = stages.map(s => ({
      id: s.id,
      title: s.stageName,
      status: s.status,
      order: s.stageNumber,
      notes: s.notes,
      tasks: s.tasks,
      documents: s.documents,
      meetingOutcomes: s.meetingOutcomes,
      completedAt: s.status === 'COMPLETED' ? s.updatedAt : null
    }))

    return NextResponse.json({ timeline })
  } catch (error) {
    console.error('Parent progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

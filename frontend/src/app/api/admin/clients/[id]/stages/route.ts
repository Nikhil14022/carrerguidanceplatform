import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const MENTOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY', 'EXPERT'];

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

async function ensureClientStages(clientProfileId: string) {
  const existingStages = await prisma.clientStage.findMany({
    where: { clientProfileId },
    orderBy: { stageNumber: 'asc' }
  });

  if (existingStages.length === 9) {
    return existingStages;
  }

  const existingNums = new Set(existingStages.map(s => s.stageNumber));
  const createdStages = [];

  for (let num = 1; num <= 9; num++) {
    if (!existingNums.has(num)) {
      const created = await prisma.clientStage.create({
        data: {
          clientProfileId,
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
    } else {
      const found = existingStages.find(s => s.stageNumber === num);
      if (found) createdStages.push(found);
    }
  }

  return createdStages.sort((a, b) => a.stageNumber - b.stageNumber);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admins, mentors, and the client themselves (or their parent) can view
    const isTeam = MENTOR_ROLES.includes(session.user.role);
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { id },
      select: { id: true, userId: true, parentId: true }
    });

    if (!clientProfile) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
    }

    const isOwnProfile = session.user.id === clientProfile.userId || (clientProfile.parentId && session.user.id === clientProfile.parentId);

    if (!isTeam && !isOwnProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stages = await ensureClientStages(id);
    return NextResponse.json({ success: true, stages });
  } catch (error: any) {
    console.error('GET stages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user || !MENTOR_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { stageNumber, status, notes, tasks, documents, meetingOutcomes } = body;

    if (!stageNumber || !status) {
      return NextResponse.json({ error: 'Missing required fields: stageNumber, status' }, { status: 400 });
    }

    // Ensure stages are initialized
    await ensureClientStages(id);

    const updated = await prisma.clientStage.update({
      where: {
        clientProfileId_stageNumber: {
          clientProfileId: id,
          stageNumber: parseInt(stageNumber)
        }
      },
      data: {
        status,
        notes: notes !== undefined ? notes : undefined,
        tasks: tasks !== undefined ? tasks : undefined,
        documents: documents !== undefined ? documents : undefined,
        meetingOutcomes: meetingOutcomes !== undefined ? meetingOutcomes : undefined
      }
    });

    // Update overall client profile journeyStatus based on stages completed/active
    const allStages = await prisma.clientStage.findMany({
      where: { clientProfileId: id }
    });

    const activeStages = allStages.filter(s => s.status === 'IN_PROGRESS');
    const completedStages = allStages.filter(s => s.status === 'COMPLETED');

    let nextJourneyStatus = "In Progress";
    if (activeStages.length > 0) {
      nextJourneyStatus = `Active: ${activeStages.map(s => s.stageName).join(', ')}`;
    } else if (completedStages.length === 9) {
      nextJourneyStatus = "Completed";
    } else {
      nextJourneyStatus = "Started";
    }

    // Truncate journey status if too long
    if (nextJourneyStatus.length > 35) {
      nextJourneyStatus = nextJourneyStatus.substring(0, 32) + "...";
    }

    await prisma.clientProfile.update({
      where: { id },
      data: { journeyStatus: nextJourneyStatus }
    });

    return NextResponse.json({ success: true, stage: updated });
  } catch (error: any) {
    console.error('POST stages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

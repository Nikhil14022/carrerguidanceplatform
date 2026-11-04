import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EXPERT', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY']

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

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let clientProfile = await prisma.clientProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, age: true, createdAt: true, updatedAt: true } },
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
    })

    if (!clientProfile) {
      clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: id },
        include: {
          user: { select: { id: true, email: true, name: true, age: true, createdAt: true, updatedAt: true } },
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

    // Fetch active mentor assignment and linked parent user
    const [mentorAssignment, parentUser] = await Promise.all([
      prisma.mentorAssignment.findFirst({
        where: { clientProfileId: clientProfile.id, isActive: true },
        include: {
          mentorProfile: {
            include: { user: { select: { id: true, name: true, email: true } } }
          }
        }
      }),
      clientProfile.parentId
        ? prisma.user.findUnique({
            where: { id: clientProfile.parentId },
            select: { id: true, name: true, email: true }
          })
        : null
    ]);

    const assignedMentor = mentorAssignment ? {
      id: mentorAssignment.mentorProfile.id,
      name: mentorAssignment.mentorProfile.user.name,
      email: mentorAssignment.mentorProfile.user.email
    } : null;

    return NextResponse.json({ 
      client: {
        ...clientProfile,
        parent: parentUser,
        assignedMentor,
        assignedMentors: assignedMentor ? [assignedMentor] : [],
        appointments
      }
    })
  } catch (error) {
    console.error('Admin client detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find client profile
    let clientProfile = await prisma.clientProfile.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!clientProfile) {
      clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: id },
        include: { user: true }
      })
    }

    if (!clientProfile) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      email,
      password,
      age,
      parentId,
      mentorProfileId,
      currentStage,
      journeyStatus
    } = body

    // 1. Email check if changing email
    if (email && email.toLowerCase() !== clientProfile.user.email.toLowerCase()) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })
      if (existingUser && existingUser.id !== clientProfile.userId) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
      }
    }

    // 2. Prepare User updates
    const userUpdates: any = {}
    if (name !== undefined) userUpdates.name = name.trim()
    if (email !== undefined) userUpdates.email = email.trim().toLowerCase()
    if (age !== undefined) userUpdates.age = age ? parseInt(String(age), 10) : null
    if (password && typeof password === 'string' && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }
      userUpdates.password = await hash(password.trim(), 12)
    }

    if (Object.keys(userUpdates).length > 0) {
      await prisma.user.update({
        where: { id: clientProfile.userId },
        data: userUpdates
      })
    }

    // 3. Prepare ClientProfile updates
    const clientUpdates: any = {}
    if (parentId !== undefined) {
      clientUpdates.parentId = parentId && parentId !== '' ? parentId : null
    }
    if (currentStage !== undefined) {
      const stageNum = parseInt(String(currentStage), 10)
      if (!isNaN(stageNum) && stageNum >= 1 && stageNum <= 9) {
        clientUpdates.currentStage = stageNum
      }
    }
    if (journeyStatus !== undefined) {
      clientUpdates.journeyStatus = journeyStatus
    }

    if (Object.keys(clientUpdates).length > 0) {
      await prisma.clientProfile.update({
        where: { id: clientProfile.id },
        data: clientUpdates
      })
    }

    // 4. Update mentor assignment if mentorProfileId was provided
    if (mentorProfileId !== undefined) {
      if (!mentorProfileId || mentorProfileId === '') {
        // Deactivate all assignments
        await prisma.mentorAssignment.updateMany({
          where: { clientProfileId: clientProfile.id, isActive: true },
          data: { isActive: false }
        })
      } else {
        // Deactivate existing other assignments
        await prisma.mentorAssignment.updateMany({
          where: {
            clientProfileId: clientProfile.id,
            mentorProfileId: { not: mentorProfileId },
            isActive: true
          },
          data: { isActive: false }
        })

        // Check if assignment to this mentor exists
        const existingAssignment = await prisma.mentorAssignment.findFirst({
          where: {
            clientProfileId: clientProfile.id,
            mentorProfileId
          }
        })

        if (existingAssignment) {
          await prisma.mentorAssignment.update({
            where: { id: existingAssignment.id },
            data: { isActive: true }
          })
        } else {
          await prisma.mentorAssignment.create({
            data: {
              mentorProfileId,
              clientProfileId: clientProfile.id,
              permissions: ['VIEW_MODULES', 'REVIEW_MODULES', 'VIEW_REPORTS', 'EDIT_REPORTS', 'CHAT'],
              assignedBy: session.user.id,
              isActive: true
            }
          })
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Client details updated successfully' })
  } catch (error) {
    console.error('Admin client update error:', error)
    return NextResponse.json({ error: 'Failed to update client details' }, { status: 500 })
  }
}

export const PUT = PATCH;

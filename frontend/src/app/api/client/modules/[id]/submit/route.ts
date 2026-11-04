import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { moduleResponseSchema } from '@/lib/validations'
import { testScoringService } from '@/services/TestScoringService'
import { TestType } from '@/types/test-modules'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = moduleResponseSchema.parse(body)
    const isTeam = ['SUPER_ADMIN', 'ADMIN', 'EXPERT', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY'].includes(session.user.role)

    let clientProfile = null;
    let clientModule = null;

    if (isTeam) {
      clientModule = await prisma.clientModule.findUnique({
        where: { id }
      });
      if (clientModule) {
        clientProfile = await prisma.clientProfile.findUnique({
          where: { id: clientModule.clientProfileId }
        });
      }
    } else {
      if (session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: session.user.id }
      })

      if (!clientProfile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      clientModule = await prisma.clientModule.findFirst({
        where: {
          id: id,
          clientProfileId: clientProfile.id
        }
      })
    }

    if (!clientProfile || !clientModule) {
      return NextResponse.json({ error: 'Module or profile not found' }, { status: 404 })
    }

    if (
      !isTeam &&
      ['LOCKED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(clientModule.status)
    ) {
      return NextResponse.json({ error: 'Module is already submitted or locked and cannot be edited.' }, { status: 403 })
    }

    // Fetch the module schema to check for testType and existing response
    const moduleData = await prisma.clientModule.findFirst({
      where: { id },
      include: {
        module: { select: { schema: true } },
        response: { select: { approvedAt: true, submittedAt: true } }
      }
    })

    // Extra safety: if already approved, client cannot re-submit even if status was somehow altered
    if (!isTeam && moduleData?.response?.approvedAt) {
      return NextResponse.json({ error: 'Module is already approved and locked.' }, { status: 403 })
    }

    const testType = (moduleData?.module?.schema as any)?.testType as TestType | undefined
    let responseData = validatedData.data as any

    // If this is a test module, compute scores server-side
    if (testType && responseData.__testData) {
      const scored = testScoringService.scoreTest(testType, responseData.__testData)
      responseData = { ...responseData, __scored: scored }
    }

    const preserveApproved = isTeam && clientModule.status === 'APPROVED';

    const response = await prisma.moduleResponse.upsert({
      where: { clientModuleId: id },
      update: {
        data: responseData,
        submittedAt: moduleData?.response?.submittedAt || new Date()
      },
      create: {
        clientModuleId: id,
        data: responseData,
        submittedAt: new Date()
      }
    })

    await prisma.clientModule.update({
      where: { id },
      data: { status: preserveApproved ? 'APPROVED' : 'SUBMITTED' }
    })

    // Find subsequent modules in sequence to safely unlock the next uncompleted module
    const subsequentModules = await prisma.clientModule.findMany({
      where: {
        clientProfileId: clientProfile.id,
        order: { gt: clientModule.order }
      },
      include: {
        response: { select: { submittedAt: true, approvedAt: true } }
      },
      orderBy: { order: 'asc' }
    })

    // Modules are never auto-unlocked after submission; admin/mentor unlocks them manually.
    const updateData: any = {
      currentStage: { increment: 1 }
    }

    if (subsequentModules.every(m => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(m.status))) {
      // If no more uncompleted modules, mark journey as "Analysis in Progress"
      updateData.journeyStatus = "Analysis in Progress"
    }

    await prisma.clientProfile.update({
      where: { id: clientProfile.id },
      data: updateData
    })

    return NextResponse.json({ success: true, submittedAt: response.submittedAt })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

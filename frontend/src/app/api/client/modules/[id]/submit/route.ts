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
      (clientModule.status === 'LOCKED' || clientModule.status === 'APPROVED')
    ) {
      return NextResponse.json({ error: 'Module cannot be submitted' }, { status: 403 })
    }

    // Fetch the module schema to check for testType
    const moduleData = await prisma.clientModule.findFirst({
      where: { id },
      include: { module: { select: { schema: true } } }
    })

    const testType = (moduleData?.module?.schema as any)?.testType as TestType | undefined
    let responseData = validatedData.data as any

    // Filter out fear ratings less than 5
    if (responseData) {
      Object.keys(responseData).forEach(key => {
        if (key.startsWith('fear_')) {
          const val = Number(responseData[key])
          if (!isNaN(val) && val < 5) {
            delete responseData[key]
          }
        }
      })
    }

    // If this is a test module, compute scores server-side
    if (testType && responseData.__testData) {
      const scored = testScoringService.scoreTest(testType, responseData.__testData)
      responseData = { ...responseData, __scored: scored }
    }

    const response = await prisma.moduleResponse.upsert({
      where: { clientModuleId: id },
      update: {
        data: responseData,
        submittedAt: new Date()
      },
      create: {
        clientModuleId: id,
        data: responseData,
        submittedAt: new Date()
      }
    })

    await prisma.clientModule.update({
      where: { id },
      data: { status: 'SUBMITTED' }
    })

    // Find the next module in sequence
    const nextModule = await prisma.clientModule.findFirst({
      where: {
        clientProfileId: clientProfile.id,
        order: clientModule.order + 1
      }
    })

    // Update profile: increment stage and unlock next module
    const updateData: any = {
      currentStage: { increment: 1 }
    }

    if (nextModule) {
      await prisma.clientModule.update({
        where: { id: nextModule.id },
        data: { status: 'UNLOCKED' }
      })
    } else {
      // If no more modules, mark journey as "In Review" or "Completed"
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

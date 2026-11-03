import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { moduleResponseSchema } from '@/lib/validations'

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

    let clientModule = null;
    if (isTeam) {
      clientModule = await prisma.clientModule.findUnique({
        where: { id }
      });
    } else {
      if (session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const clientProfile = await prisma.clientProfile.findUnique({
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

    if (!clientModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    const existingResponse = await prisma.moduleResponse.findUnique({
      where: { clientModuleId: id }
    })

    if (
      !isTeam &&
      (['LOCKED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(clientModule.status) ||
        Boolean(existingResponse?.approvedAt))
    ) {
      return NextResponse.json({ error: 'Module cannot be edited' }, { status: 403 })
    }

    const isAlreadyCompleted = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(clientModule.status)

    const response = await prisma.moduleResponse.upsert({
      where: { clientModuleId: id },
      update: {
        data: validatedData.data as any,
        ...(isTeam && isAlreadyCompleted
          ? {}
          : { submittedAt: null, approvedAt: null })
      },
      create: {
        clientModuleId: id,
        data: validatedData.data as any,
        submittedAt: null,
        approvedAt: null
      }
    })

    if (!isAlreadyCompleted) {
      await prisma.clientModule.update({
        where: { id },
        data: { status: 'IN_PROGRESS' }
      })
    }

    return NextResponse.json({ success: true, response })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Save draft error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    if (session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = moduleResponseSchema.parse(body)

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!clientProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const clientModule = await prisma.clientModule.findFirst({
      where: {
        id: id,
        clientProfileId: clientProfile.id
      }
    })

    if (!clientModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    if (clientModule.status === 'LOCKED' || clientModule.status === 'APPROVED') {
      return NextResponse.json({ error: 'Module cannot be edited' }, { status: 403 })
    }

    const response = await prisma.moduleResponse.upsert({
      where: { clientModuleId: id },
      update: { data: validatedData.data as any },
      create: {
        clientModuleId: id,
        data: validatedData.data as any
      }
    })

    await prisma.clientModule.update({
      where: { id },
      data: { status: 'IN_PROGRESS' }
    })

    return NextResponse.json({ success: true, response })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Save draft error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

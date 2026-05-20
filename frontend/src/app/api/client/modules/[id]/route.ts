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

    if (session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
      },
      include: {
        module: true,
        response: true
      }
    })

    if (!clientModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    if (clientModule.status === 'LOCKED') {
      return NextResponse.json({ error: 'Module is locked' }, { status: 403 })
    }

    return NextResponse.json({
      module: {
        id: clientModule.id,
        moduleId: clientModule.moduleId,
        title: clientModule.module.title,
        description: clientModule.module.description,
        schema: clientModule.module.schema,
        status: clientModule.status,
        mentorNotes: clientModule.mentorNotes,
      },
      response: clientModule.response
    })
  } catch (error: any) {
    console.error('Module detail error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

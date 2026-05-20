import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: { module: true, response: true }
        }
      }
    })

    if (!clientProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const modules = clientProfile.modules.map(m => ({
      id: m.id,
      moduleId: m.moduleId,
      title: m.module.title,
      description: m.module.description,
      status: m.status,
      order: m.order,
      filledBy: m.filledBy,
      submittedAt: m.response?.submittedAt,
      hasDraft: !!m.response && !m.response.submittedAt
    }))

    return NextResponse.json({ modules })
  } catch (error) {
    console.error('Modules list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

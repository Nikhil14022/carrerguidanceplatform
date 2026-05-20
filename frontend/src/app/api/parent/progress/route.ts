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
        modules: {
          orderBy: { order: 'asc' },
          include: {
            module: { select: { title: true } },
            response: { select: { approvedAt: true } }
          }
        }
      }
    })

    if (!clientProfile) {
      return NextResponse.json({ error: 'No child profile linked' }, { status: 404 })
    }

    const timeline = clientProfile.modules.map(m => ({
      id: m.id,
      title: m.module.title,
      status: m.status,
      order: m.order,
      completedAt: m.status === 'APPROVED' ? m.response?.approvedAt : null
    }))

    return NextResponse.json({ timeline })
  } catch (error) {
    console.error('Parent progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

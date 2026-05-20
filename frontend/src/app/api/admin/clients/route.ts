import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'EXPERT', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage')
    const status = searchParams.get('status')

    const where: any = {}

    if (stage) {
      where.currentStage = parseInt(stage)
    }

    const clients = await prisma.clientProfile.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true, updatedAt: true } },
        modules: {
          select: { status: true }
        }
      },
      orderBy: { user: { updatedAt: 'desc' } }
    })

    const filteredClients = clients.map(client => {
      const moduleStats = {
        locked: client.modules.filter(m => m.status === 'LOCKED').length,
        inProgress: client.modules.filter(m => m.status === 'IN_PROGRESS').length,
        submitted: client.modules.filter(m => m.status === 'SUBMITTED' || m.status === 'UNDER_REVIEW').length,
        approved: client.modules.filter(m => m.status === 'APPROVED').length
      }

      let clientStatus = 'In Progress'
      if (moduleStats.approved === client.modules.length && client.modules.length > 0) {
        clientStatus = 'Completed'
      } else if (moduleStats.submitted > 0) {
        clientStatus = 'Under Review'
      }

      if (status && clientStatus.toLowerCase() !== status.toLowerCase()) {
        return null
      }

      return {
        id: client.id,
        userId: client.userId,
        email: client.user.email,
        name: client.user.name,
        currentStage: client.currentStage,
        journeyStatus: client.journeyStatus,
        stats: moduleStats,
        status: clientStatus,
        updatedAt: client.user.updatedAt
      }
    }).filter(Boolean)

    return NextResponse.json({ clients: filteredClients })
  } catch (error) {
    console.error('Admin clients error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

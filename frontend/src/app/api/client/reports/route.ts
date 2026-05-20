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

    const reports = await prisma.report.findMany({
      where: {
        clientProfile: { userId: session.user.id },
        active: true,
        status: { in: ['AI_GENERATED', 'FINALIZED'] }
      },
      include: { careerOptions: { include: { research: true } } },
      orderBy: { id: 'desc' }
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await auth()
    const { reportId } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'EXPERT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: { status: 'FINALIZED' }
    })

    return NextResponse.json({ success: true, report: updatedReport })
  } catch (error) {
    console.error('Finalize report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

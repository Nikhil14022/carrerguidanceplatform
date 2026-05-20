import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateCareerReport } from '@/lib/ai'

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

    if (session.user.role !== 'ADMIN' && session.user.role !== 'EXPERT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const report = await generateCareerReport(id)

    return NextResponse.json({ success: true, report })
  } catch (error: any) {
    console.error('Generate report error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 })
  }
}

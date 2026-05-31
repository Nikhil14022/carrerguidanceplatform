import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateCareerReport } from '@/lib/ai'
import prisma from '@/lib/prisma'

const MENTOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY', 'EXPERT'];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user || !MENTOR_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify assignment if not admin
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      const mentorProfileId = session.user.mentorProfileId;
      if (!mentorProfileId) return NextResponse.json({ error: 'No mentor profile' }, { status: 403 });
      const assignment = await (prisma as any).mentorAssignment.findFirst({
        where: { mentorProfileId, clientProfileId: id, isActive: true }
      });
      if (!assignment) {
        return NextResponse.json({ error: 'Client not assigned to you' }, { status: 403 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const prompt = body?.prompt || undefined;

    const report = await generateCareerReport(id, prompt)

    return NextResponse.json({ success: true, report })
  } catch (error: any) {
    console.error('Mentor generate report error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { chatWithClientData } from '@/lib/ai'
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

    const { messages } = await request.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 })
    }

    const responseText = await chatWithClientData(id, messages)
    return NextResponse.json({ success: true, response: responseText })
  } catch (error: any) {
    console.error('Mentor chat error:', error)
    return NextResponse.json({ error: error.message || 'Failed to get chat response' }, { status: 500 })
  }
}

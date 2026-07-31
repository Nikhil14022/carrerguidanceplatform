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

    if (session.user.role !== 'ADMIN' && session.user.role !== 'EXPERT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, createdAt: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            module: true,
            response: { select: { data: true, submittedAt: true, approvedAt: true } }
          }
        },
        reports: {
          include: { careerOptions: true }
        }
      }
    })

    if (!clientProfile) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch client appointments
    const rawBookings = await prisma.appointmentBooking.findMany({
      where: { clientProfileId: id },
      orderBy: { createdAt: 'desc' }
    });

    const appointments = await Promise.all(rawBookings.map(async (bk) => {
      const slot = await prisma.appointmentSlot.findUnique({ where: { id: bk.slotId } });
      let expertName = 'Expert Advisor';
      if (slot && slot.expertId) {
        const expertUser = await prisma.user.findUnique({ where: { id: slot.expertId } });
        if (expertUser) expertName = expertUser.name || 'Expert Advisor';
      }
      return {
        id: bk.id,
        startTime: slot?.startTime || bk.createdAt,
        endTime: slot?.endTime,
        status: bk.status,
        type: bk.type,
        meetingLink: bk.meetingLink,
        notes: bk.notes,
        expert: { name: expertName }
      };
    }));

    return NextResponse.json({ 
      client: {
        ...clientProfile,
        appointments
      }
    })
  } catch (error) {
    console.error('Admin client detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

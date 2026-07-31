import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('x-sync-secret');
    const expectedSecret = process.env.GOOGLE_SYNC_SECRET || 'holistree_sync_secret_2026';
    
    if (authHeader !== expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { clientEmail, mentorEmail, startTime, endTime, meetingLink, notes } = body;

    if (!clientEmail || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields: clientEmail, startTime, endTime' }, { status: 400 });
    }

    // 1. Find client profile
    const clientUser = await prisma.user.findFirst({
      where: { email: { equals: clientEmail, mode: 'insensitive' }, role: 'CLIENT' },
      include: { clientProfile: true }
    });

    if (!clientUser || !clientUser.clientProfile) {
      return NextResponse.json({ error: `Client with email ${clientEmail} not found` }, { status: 404 });
    }

    const clientProfileId = clientUser.clientProfile.id;

    // 2. Find mentor profile/user
    let mentorUserId: string | null = null;
    if (mentorEmail) {
      const mentorUser = await prisma.user.findFirst({
        where: { 
          email: { equals: mentorEmail, mode: 'insensitive' }, 
          role: { in: ['SUPER_ADMIN', 'ADMIN', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY', 'EXPERT'] } 
        }
      });
      if (mentorUser) {
        mentorUserId = mentorUser.id;
      }
    }

    // If no mentor user found by email, try to find via client's assignment
    if (!mentorUserId) {
      const assignment = await (prisma as any).mentorAssignment.findFirst({
        where: { clientProfileId, isActive: true },
        include: { mentorProfile: true }
      });
      if (assignment?.mentorProfile) {
        mentorUserId = assignment.mentorProfile.userId;
      }
    }

    // Default fallback to an admin if no mentor is assigned
    if (!mentorUserId) {
      const fallbackUser = await prisma.user.findFirst({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
      });
      mentorUserId = fallbackUser?.id || "65b8c9d0f1b2c3d4e5f6a7b8";
    }

    // 3. Create slot and booking in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const slot = await tx.appointmentSlot.create({
        data: {
          expertId: mentorUserId!,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          isBooked: true
        }
      });

      const booking = await tx.appointmentBooking.create({
        data: {
          slotId: slot.id,
          clientProfileId,
          type: 'ONLINE',
          meetingLink: meetingLink || null,
          status: 'CONFIRMED',
          notes: notes || 'Google Calendar Booking'
        }
      });

      return { slot, booking };
    });

    return NextResponse.json({ success: true, bookingId: result.booking.id, slotId: result.slot.id });
  } catch (error: any) {
    console.error('Google calendar sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

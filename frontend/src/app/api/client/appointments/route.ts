import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.clientProfileId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clientProfileId = session.user.clientProfileId;

        // 1. Fetch user's bookings
        const rawBookings = await prisma.appointmentBooking.findMany({
            where: { clientProfileId },
            orderBy: { createdAt: 'desc' }
        });

        // Resolve slot and expert details
        const appointments = await Promise.all(rawBookings.map(async (bk) => {
            const slot = await prisma.appointmentSlot.findUnique({ where: { id: bk.slotId } });
            let expertName = 'Expert Advisor';
            if (slot && slot.expertId) {
                const expertUser = await prisma.user.findUnique({ where: { id: slot.expertId } });
                if (expertUser) expertName = expertUser.name || 'Expert Advisor';
            }
            return {
                id: bk.id,
                date: slot?.startTime || bk.createdAt,
                status: bk.status,
                type: bk.type,
                expert: { name: expertName },
                createdAt: bk.createdAt
            };
        }));

        // 2. Fetch available slots
        let rawSlots = await prisma.appointmentSlot.findMany({
            where: { isBooked: false, startTime: { gt: new Date() } },
            orderBy: { startTime: 'asc' },
            take: 10
        });

        // Auto-seed some slots if none exist for demonstration
        if (rawSlots.length === 0) {
            const adminUser = await prisma.user.findFirst({ where: { role: { in: ['ADMIN', 'EXPERT'] } } }) || await prisma.user.findFirst();
            const expertIdStr = adminUser?.id || "65b8c9d0f1b2c3d4e5f6a7b8"; // fallback ObjectId

            for (let i = 1; i <= 3; i++) {
                await prisma.appointmentSlot.create({
                    data: {
                        expertId: expertIdStr,
                        startTime: new Date(Date.now() + (i * 86400000) + 3600000), // i days from now
                        endTime: new Date(Date.now() + (i * 86400000) + 7200000),
                        isBooked: false
                    }
                });
            }
            // Re-fetch
            rawSlots = await prisma.appointmentSlot.findMany({
                where: { isBooked: false, startTime: { gt: new Date() } },
                orderBy: { startTime: 'asc' },
                take: 10
            });
        }

        const availableSlots = await Promise.all(rawSlots.map(async (s) => {
            let expertName = 'Expert Advisor';
            if (s.expertId) {
                const expertUser = await prisma.user.findUnique({ where: { id: s.expertId } });
                if (expertUser) expertName = expertUser.name || 'Expert Advisor';
            }

            return {
                id: s.id,
                startTime: s.startTime,
                endTime: s.endTime,
                expert: { name: expertName },
                isBooked: s.isBooked,
                type: 'ONLINE' // Default type
            };
        }));

        return NextResponse.json({ appointments, availableSlots });
    } catch (error: any) {
        console.error('Appointments GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.clientProfileId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { slotId } = await req.json();
        if (!slotId) return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 });

        const slot = await prisma.appointmentSlot.findUnique({ where: { id: slotId } });
        if (!slot || slot.isBooked) {
            return NextResponse.json({ error: 'Slot is no longer available' }, { status: 400 });
        }

        // Book it transactionally
        await prisma.$transaction([
            prisma.appointmentBooking.create({
                data: {
                    slotId,
                    clientProfileId: session.user.clientProfileId,
                    type: 'ONLINE',
                    status: 'REQUESTED'
                }
            }),
            prisma.appointmentSlot.update({
                where: { id: slotId },
                data: { isBooked: true }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Appointments POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { BaseService } from './BaseService';
import { AppointmentType, BookingStatus } from '@prisma/client';

export class SchedulingService extends BaseService {

    /**
     * Admin creates available time slots for an expert.
     */
    async createSlots(expertId: string, slots: { startTime: Date, endTime: Date }[]) {
        return await this.db.appointmentSlot.createMany({
            data: slots.map(s => ({ ...s, expertId, isBooked: false }))
        });
    }

    /**
     * Client requests an appointment booking for an available slot.
     */
    async requestBooking(clientProfileId: string, slotId: string, type: AppointmentType, notes?: string) {
        // 1. Transaction to prevent double booking race condition
        return await this.db.$transaction(async (prisma) => {
            const slot = await prisma.appointmentSlot.findUnique({ where: { id: slotId } });

            if (!slot) throw new Error("Slot not found");
            if (slot.isBooked) throw new Error("Slot is already booked");

            // 2. Mark slot as booked
            await prisma.appointmentSlot.update({
                where: { id: slotId },
                data: { isBooked: true }
            });

            // 3. Create the booking request
            return await prisma.appointmentBooking.create({
                data: {
                    clientProfileId,
                    slotId,
                    type,
                    notes,
                    status: BookingStatus.REQUESTED
                }
            });
        });
    }

    /**
     * Admin or Expert confirms the booking, optionally generating a meeting link.
     */
    async confirmBooking(bookingId: string, meetingLink?: string) {
        return await this.db.appointmentBooking.update({
            where: { id: bookingId },
            data: {
                status: BookingStatus.CONFIRMED,
                meetingLink
            }
        });
    }

    /**
     * After the session, the expert marks it complete and leaves a session summary.
     */
    async completeSession(bookingId: string, sessionSummary: string) {
        return await this.db.appointmentBooking.update({
            where: { id: bookingId },
            data: {
                status: BookingStatus.COMPLETED,
                sessionSummary
            }
        });
    }
}

export const schedulingService = new SchedulingService();

import { PrismaClient, NotificationType } from '@prisma/client';
import prisma from '@/lib/prisma'; // Assuming this is your prisma instance

interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
}

export class NotificationService {
    /**
     * Creates a new notification for a specific user.
     */
    static async create(params: CreateNotificationParams) {
        try {
            const notification = await prisma.notification.create({
                data: params,
            });
            return notification;
        } catch (error) {
            console.error('[NotificationService.create] Error:', error);
            throw error;
        }
    }

    /**
     * Mark a specific notification as read.
     */
    static async markAsRead(notificationId: string) {
        return prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }

    /**
     * Mark all notifications for a user as read.
     */
    static async markAllAsRead(userId: string) {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    /**
     * Get unread notifications for a user.
     */
    static async getUnread(userId: string, limit = 10) {
        return prisma.notification.findMany({
            where: { userId, isRead: false },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Get all notifications for a user.
     */
    static async getAll(userId: string, limit = 20) {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}

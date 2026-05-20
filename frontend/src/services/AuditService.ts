import { BaseService } from './BaseService';
import { Role } from '@prisma/client';

export class AuditService extends BaseService {

    /**
     * Generic, centralized audit logging for any state mutation in the app.
     */
    async logAction(userId: string, userRole: Role, action: string, entity: string, entityId: string, oldValue?: any, newValue?: any) {
        return await this.db.auditLog.create({
            data: {
                userId,
                userRole,
                action,
                entity,
                entityId,
                oldValue: oldValue || null,
                newValue: newValue || null,
            }
        });
    }

    /**
     * Fetch history of actions on a specific entity. Useful for Admin Dashboard.
     */
    async getEntityHistory(entity: string, entityId: string) {
        return await this.db.auditLog.findMany({
            where: { entity, entityId },
            orderBy: { timestamp: 'desc' },
            include: { user: { select: { name: true, email: true, role: true } } }
        });
    }
}

export const auditService = new AuditService();

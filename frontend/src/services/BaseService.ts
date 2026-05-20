import prisma from '@/lib/prisma';

/**
 * BaseService provides a standardized way to interact with the database 
 * and handles common CRUD operations, logging, and error throwing.
 */
export abstract class BaseService {
    protected readonly db = prisma;

    // You can put common audit logging logic here, e.g.
    // protected async auditLog(userId, action, entity, entityId, oldValue, newValue) { ... }
}

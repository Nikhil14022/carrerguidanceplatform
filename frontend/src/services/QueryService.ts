import { BaseService } from './BaseService';
import { QueryStatus, QueryPriority } from '@prisma/client';

export class QueryService extends BaseService {

    /**
     * Client opens a formal query ticket.
     */
    async openQuery(clientProfileId: string, category: string, subject: string, description: string, priority: QueryPriority) {
        return await this.db.clientQuery.create({
            data: {
                clientProfileId,
                category,
                subject,
                description,
                priority,
                status: QueryStatus.OPEN
            }
        });
    }

    /**
     * Expert or Admin responds to a query.
     */
    async respondToQuery(queryId: string, userId: string, message: string) {
        return await this.db.$transaction(async (prisma) => {
            // Add response
            const response = await prisma.queryResponse.create({
                data: { queryId, userId, message }
            });

            // Update query status if it was open
            await prisma.clientQuery.update({
                where: { id: queryId },
                data: { status: QueryStatus.IN_PROGRESS }
            });

            return response;
        });
    }

    /**
     * Client or expert marks the query as resolved.
     */
    async resolveQuery(queryId: string) {
        return await this.db.clientQuery.update({
            where: { id: queryId },
            data: { status: QueryStatus.RESOLVED }
        });
    }
}

export const queryService = new QueryService();

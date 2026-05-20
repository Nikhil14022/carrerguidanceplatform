import { BaseService } from './BaseService';
import { FlagType, FlagStatus } from '@prisma/client';

export class ModuleService extends BaseService {

    /**
     * Add a threaded comment (or query) specific to a question in a module.
     */
    async addComment(clientModuleId: string, questionId: string, userId: string, content: string, parentId?: string) {
        return await this.db.moduleComment.create({
            data: {
                clientModuleId,
                questionId,
                userId,
                content,
                parentId,
                resolved: false
            }
        });
    }

    /**
     * Get all comments for a specific module, threaded.
     */
    async getComments(clientModuleId: string) {
        // A robust query that groups parent and child comments
        const comments = await this.db.moduleComment.findMany({
            where: { clientModuleId },
            orderBy: { createdAt: 'asc' }
        });

        // In memory structuring: Group by parentId
        const threads = comments.reduce((acc, comment) => {
            if (!comment.parentId) {
                acc[comment.id] = { ...comment, replies: [] };
            } else if (acc[comment.parentId]) {
                acc[comment.parentId].replies.push(comment);
            }
            return acc;
        }, {} as Record<string, any>);

        return Object.values(threads);
    }

    /**
     * Flag an inconsistency (expert) or raise a query (client) natively to a specific field.
     */
    async raiseDataFlag(clientProfileId: string, type: FlagType, fieldRef: string, description: string) {
        return await this.db.dataFlag.create({
            data: {
                clientProfileId,
                type,
                fieldRef,
                description,
                status: FlagStatus.OPEN
            }
        });
    }

    /**
     * Resolve a specific data flag.
     */
    async resolveDataFlag(flagId: string) {
        return await this.db.dataFlag.update({
            where: { id: flagId },
            data: { status: FlagStatus.RESOLVED }
        });
    }
}

export const moduleService = new ModuleService();

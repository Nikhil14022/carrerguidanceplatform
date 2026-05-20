import { BaseService } from './BaseService';
import { ReportStatus, Prisma } from '@prisma/client';

export class VersionControlService extends BaseService {

    /**
     * Creates an immutable snapshot of a module response.
     */
    async snapshotModuleResponse(moduleId: string, clientProfileId: string, data: any, savedBy: string) {
        // Determine the next version number
        const previousVersions = await this.db.moduleResponseVersion.findMany({
            where: { moduleId, clientProfileId },
            orderBy: { version: 'desc' },
            take: 1
        });

        const nextVersion = previousVersions.length > 0 ? previousVersions[0].version + 1 : 1;

        return await this.db.moduleResponseVersion.create({
            data: {
                moduleId,
                clientProfileId,
                data,
                version: nextVersion,
                savedBy
            }
        });
    }

    /**
     * Creates an immutable snapshot of a report before edits.
     */
    async snapshotReport(reportId: string, content: string, status: ReportStatus, createdBy: string) {
        const previousVersions = await this.db.reportVersion.findMany({
            where: { reportId },
            orderBy: { version: 'desc' },
            take: 1
        });

        const nextVersion = previousVersions.length > 0 ? previousVersions[0].version + 1 : 1;

        return await this.db.reportVersion.create({
            data: {
                reportId,
                content,
                status,
                version: nextVersion,
                createdBy
            }
        });
    }
}

export const versionControlService = new VersionControlService();

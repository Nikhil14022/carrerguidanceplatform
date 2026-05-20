import { BaseService } from './BaseService';
import { ExposureStatus } from '@prisma/client';

export class ExposureService extends BaseService {

    /**
     * Admin maps a client to a new exposure program
     */
    async assignExposure(clientProfileId: string, programId: string) {
        return await this.db.clientExposureProgress.create({
            data: {
                clientProfileId,
                programId,
                status: ExposureStatus.NOT_STARTED
            }
        });
    }

    /**
     * Client submits reflection for an exposure program
     */
    async submitReflection(progressId: string, reflection: string) {
        return await this.db.$transaction(async (prisma) => {
            const feedback = await prisma.exposureFeedback.create({
                data: { progressId, reflection }
            });

            await prisma.clientExposureProgress.update({
                where: { id: progressId },
                data: { status: ExposureStatus.COMPLETED } // or IN_PROGRESS if multi-step
            });

            return feedback;
        });
    }

    /**
     * Expert evaluates client's reflection
     */
    async evaluateReflection(feedbackId: string, expertEvaluation: string) {
        return await this.db.exposureFeedback.update({
            where: { id: feedbackId },
            data: { expertEvaluation }
        });
    }
}

export const exposureService = new ExposureService();

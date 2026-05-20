import { BaseService } from './BaseService';

export class SkillGapAnalyzer extends BaseService {

    /**
     * Adds a structured skill gap requirement for a client's career option.
     */
    async addSkillGap(careerOptionId: string, clientProfileId: string, requiredSkill: string, requiredLevel: number, clientLevel: number, improvementPlan: string) {
        const gapScore = requiredLevel - clientLevel;

        return await this.db.skillGap.create({
            data: {
                careerOptionId,
                clientProfileId,
                requiredSkill,
                requiredLevel,
                clientLevel,
                gapScore: gapScore > 0 ? gapScore : 0,
                improvementPlan,
            }
        });
    }

    /**
     * Client updates their progress on a specific skill.
     */
    async updateProgress(skillGapId: string, newLevelProgress: number) {
        const gap = await this.db.skillGap.findUnique({ where: { id: skillGapId } });
        if (!gap) throw new Error("Gap tracking not found");

        const newGapScore = gap.requiredLevel - newLevelProgress;

        return await this.db.skillGap.update({
            where: { id: skillGapId },
            data: {
                clientLevel: newLevelProgress,
                gapScore: newGapScore > 0 ? newGapScore : 0,
                progress: (newLevelProgress / gap.requiredLevel) * 100
            }
        });
    }
}

export const skillGapAnalyzer = new SkillGapAnalyzer();

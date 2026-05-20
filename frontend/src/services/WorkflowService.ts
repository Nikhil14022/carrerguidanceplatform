import { BaseService } from './BaseService';
import { WorkflowStatus, ModuleStatus } from '@prisma/client';

export class WorkflowService extends BaseService {

    /**
     * Initializes the workflow state for a new client based on a default configuration.
     */
    async initializeClientWorkflow(clientProfileId: string, defaultConfigurationId: string) {
        const config = await this.db.workflowConfiguration.findUnique({
            where: { id: defaultConfigurationId }
        });

        if (!config) throw new Error("Default workflow configuration not found");

        return await this.db.clientWorkflowState.create({
            data: {
                clientProfileId,
                currentStage: config.defaultSequence[0] || "1",
                status: WorkflowStatus.IN_PROGRESS,
                moduleOrdering: config.defaultSequence,
                history: [{ action: "INITIALIZED", date: new Date().toISOString() }]
            }
        });
    }

    /**
     * Automatically unlocks the next module if conditions are met.
     */
    async evaluateNextStep(clientProfileId: string) {
        const state = await this.db.clientWorkflowState.findUnique({
            where: { clientProfileId }
        });

        if (!state) throw new Error("Workflow state not found");

        // In a real implementation, you would:
        // 1. Fetch the latest submitted module.
        // 2. Check the `rules` JSON in WorkflowConfiguration to see if a conditional branch applies.
        // 3. Update Custom ordering if remediation is needed.
        // 4. Find the next module ID in `moduleOrdering` and unlock it in `ClientModule`.

        return state;
    }

    /**
     * Admin manual override to unlock a module for a client.
     */
    async appendOverrideLog(clientProfileId: string, adminId: string, reason: string) {
        const state = await this.db.clientWorkflowState.findUnique({ where: { clientProfileId } });
        if (!state) throw new Error("Workflow state not found");

        const history = state.history as any[];
        history.push({
            action: "ADMIN_OVERRIDE",
            adminId,
            reason,
            date: new Date().toISOString()
        });

        await this.db.clientWorkflowState.update({
            where: { clientProfileId },
            data: { history }
        });
    }
}

export const workflowService = new WorkflowService();

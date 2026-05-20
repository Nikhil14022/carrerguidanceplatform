import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { workflowService } from '@/services/WorkflowService';
import { z } from 'zod';

const overrideSchema = z.object({
    clientProfileId: z.string(),
    reason: z.string().min(5)
});

// GET Workflow State
export const GET = withErrorHandler(async (req: NextRequest) => {
    const url = new URL(req.url);
    const clientProfileId = url.searchParams.get('clientProfileId');

    if (!clientProfileId) {
        return NextResponse.json({ error: "Missing clientProfileId" }, { status: 400 });
    }

    // Use DB directly or via service
    // const state = await workflowService.getState(clientProfileId);

    return NextResponse.json({ message: "Workflow state retrieved successfully (stub)" });
});

// POST to trigger an evaluate next step
export const POST = withErrorHandler(async (req: NextRequest) => {
    const body = await req.json();
    const { clientProfileId } = z.object({ clientProfileId: z.string() }).parse(body);

    const newState = await workflowService.evaluateNextStep(clientProfileId);

    return NextResponse.json({ message: "Workflow evaluated successfully", state: newState });
});

// PATCH for Admin Override
export const PATCH = withErrorHandler(async (req: NextRequest) => {
    const body = await req.json();
    const { clientProfileId, reason } = overrideSchema.parse(body);

    // Hardcoded test adminID
    await workflowService.appendOverrideLog(clientProfileId, "admin-123", reason);

    return NextResponse.json({ message: "Override applied successfully." });
});

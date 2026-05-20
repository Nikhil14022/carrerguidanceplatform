import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { moduleService } from '@/services/ModuleService';
import { z } from 'zod';

const commentSchema = z.object({
    clientModuleId: z.string(),
    questionId: z.string(),
    userId: z.string(),
    content: z.string().min(1),
    parentId: z.string().optional()
});

export const POST = withErrorHandler(async (req: NextRequest) => {
    const body = await req.json();
    const args = commentSchema.parse(body);

    const newComment = await moduleService.addComment(
        args.clientModuleId,
        args.questionId,
        args.userId,
        args.content,
        args.parentId
    );

    return NextResponse.json({ message: "Comment added", comment: newComment }, { status: 201 });
});

export const GET = withErrorHandler(async (req: NextRequest) => {
    const url = new URL(req.url);
    const clientModuleId = url.searchParams.get('clientModuleId');

    if (!clientModuleId) {
        return NextResponse.json({ error: "Missing clientModuleId" }, { status: 400 });
    }

    const threads = await moduleService.getComments(clientModuleId);
    return NextResponse.json({ threads });
});

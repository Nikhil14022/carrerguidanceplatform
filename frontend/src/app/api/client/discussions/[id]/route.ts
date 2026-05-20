import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET comments for a discussion
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Increment view count
        await prisma.discussion.update({
            where: { id },
            data: { views: { increment: 1 } }
        });

        const discussion = await prisma.discussion.findUnique({
            where: { id },
            include: {
                comments: { orderBy: { createdAt: 'asc' } }
            }
        });

        if (!discussion) {
            return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
        }

        return NextResponse.json({ discussion });
    } catch (error: any) {
        console.error('Discussion detail GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST a comment to a discussion
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { content } = await req.json();

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
        }

        const comment = await prisma.discussionComment.create({
            data: {
                discussionId: id,
                userId: session.user.id,
                userName: session.user.name || 'Anonymous',
                userRole: session.user.role || 'CLIENT',
                content: content.trim()
            }
        });

        return NextResponse.json({ comment });
    } catch (error: any) {
        console.error('Comment POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

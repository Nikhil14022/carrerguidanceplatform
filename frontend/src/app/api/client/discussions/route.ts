import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET all discussions
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');

        const where = category && category !== 'All' ? { category } : {};

        const discussions = await prisma.discussion.findMany({
            where,
            include: { _count: { select: { comments: true } } },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ discussions });
    } catch (error: any) {
        console.error('Discussions GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST a new discussion
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, content, category } = await req.json();

        if (!title?.trim() || !content?.trim()) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        const discussion = await prisma.discussion.create({
            data: {
                userId: session.user.id,
                userName: session.user.name || 'Anonymous',
                userRole: session.user.role || 'CLIENT',
                title: title.trim(),
                content: content.trim(),
                category: category || 'General'
            }
        });

        return NextResponse.json({ discussion });
    } catch (error: any) {
        console.error('Discussions POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

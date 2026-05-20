import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;

        const module = await prisma.module.findUnique({
            where: { id: resolvedParams.id }
        });

        if (!module) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({ module });
    } catch (error) {
        console.error('Error fetching module:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const body = await request.json();
        
        const updated = await prisma.module.update({
            where: { id: resolvedParams.id },
            data: {
                title: body.title,
                description: body.description,
                schema: body.schema,
            }
        });

        return NextResponse.json({ success: true, module: updated });
    } catch (error) {
        console.error('Error updating module:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;

        await prisma.module.delete({
            where: { id: resolvedParams.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting module:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

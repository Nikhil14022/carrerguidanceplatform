import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const modules = await prisma.module.findMany({
            orderBy: { defaultOrder: 'asc' }
        });

        const formattedModules = modules.map(m => ({
            id: m.id,
            title: m.title,
            order: m.defaultOrder,
            isRequired: true // Schema doesn't have isRequired, assuming true for now
        }));

        return NextResponse.json({ modules: formattedModules });
    } catch (error: any) {
        console.error('Admin Workflow GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { modules } = await req.json();

        // Update each module's order sequentially based on the payload
        // Transaction ensures atomicity
        await prisma.$transaction(
            modules.map((m: any, index: number) =>
                prisma.module.update({
                    where: { id: m.id },
                    data: { defaultOrder: index + 1 }
                })
            )
        );

        return NextResponse.json({ success: true, message: 'Workflow updated' });
    } catch (error: any) {
        console.error('Admin Workflow PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

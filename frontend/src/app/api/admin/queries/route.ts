import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const queries = await prisma.clientQuery.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                clientProfile: {
                    include: { user: { select: { name: true, email: true } } }
                },
                responses: {
                    orderBy: { createdAt: 'asc' },
                    take: 50
                }
            }
        });

        return NextResponse.json(queries);
    } catch (error: any) {
        console.error('Admin queries error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { queryId, status } = await req.json();
        const updated = await prisma.clientQuery.update({
            where: { id: queryId },
            data: { status }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Update query error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

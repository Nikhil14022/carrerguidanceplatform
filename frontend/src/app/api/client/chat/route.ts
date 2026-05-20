import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.clientProfileId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clientProfileId = session.user.clientProfileId;

        // Find the active query (chat thread) for this client
        let query = await prisma.clientQuery.findFirst({
            where: { clientProfileId, status: { not: 'CLOSED' } },
            include: { responses: { orderBy: { createdAt: 'asc' } } },
            orderBy: { createdAt: 'desc' }
        });

        // If no active query exists, create a default one to serve as the main chat thread
        if (!query) {
            query = await prisma.clientQuery.create({
                data: {
                    clientProfileId,
                    category: 'GENERAL',
                    subject: 'Expert Chat Support',
                    description: 'Direct thread with your career expert.',
                    status: 'OPEN',
                    priority: 'MEDIUM',
                },
                include: { responses: true }
            });

            // Auto-greet from the system/expert
            const adminUser = await prisma.user.findFirst({ where: { role: 'EXPERT' } }) || await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            if (adminUser) {
                await prisma.queryResponse.create({
                    data: {
                        queryId: query.id,
                        userId: adminUser.id,
                        message: "Hello! I'm your dedicated career expert. How can I assist you with your roadmap today?"
                    }
                });

                // Re-fetch to include the greeting
                query = await prisma.clientQuery.findUnique({
                    where: { id: query.id },
                    include: { responses: { orderBy: { createdAt: 'asc' } } }
                });
            }
        }

        // Map the responses to include sender details
        const messages = await Promise.all((query?.responses || []).map(async (r) => {
            const user = await prisma.user.findUnique({ where: { id: r.userId }, select: { name: true, role: true } });
            return {
                id: r.id,
                message: r.message,
                sender: user?.name || (user?.role === 'CLIENT' ? 'You' : 'Expert'),
                isOwn: r.userId === session.user.id,
                role: user?.role,
                createdAt: r.createdAt
            };
        }));

        return NextResponse.json({ queryId: query?.id, messages });
    } catch (error: any) {
        console.error('Chat GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { queryId, message } = await req.json();

        if (!queryId || !message || message.trim() === '') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const response = await prisma.queryResponse.create({
            data: {
                queryId,
                userId: session.user.id,
                message: message.trim()
            }
        });

        return NextResponse.json({ success: true, response });
    } catch (error: any) {
        console.error('Chat POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

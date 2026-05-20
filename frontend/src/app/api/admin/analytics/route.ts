import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. KPI Metrics
        const activeClients = await prisma.user.count({ where: { role: 'CLIENT' } });
        const modulesUnderReview = await prisma.clientModule.count({ where: { status: 'UNDER_REVIEW' } });
        const pendingAppointments = await prisma.appointmentBooking.count({ where: { status: 'REQUESTED' } });

        // Mock average completion for now
        const avgCompletionRate = activeClients > 0 ? "68%" : "0%";

        // 2. Client Stage Distribution
        const clients = await prisma.clientProfile.findMany({ select: { currentStage: true } });
        const stageCounts: Record<number, number> = {};
        clients.forEach(c => {
            stageCounts[c.currentStage] = (stageCounts[c.currentStage] || 0) + 1;
        });

        const stageDistribution = [
            { stage: 'Stage 1: Values', count: stageCounts[1] || 0, pct: activeClients ? Math.round(((stageCounts[1] || 0) / activeClients) * 100) : 0 },
            { stage: 'Stage 2: Skills', count: stageCounts[2] || 0, pct: activeClients ? Math.round(((stageCounts[2] || 0) / activeClients) * 100) : 0 },
            { stage: 'Stage 3: Personality', count: stageCounts[3] || 0, pct: activeClients ? Math.round(((stageCounts[3] || 0) / activeClients) * 100) : 0 },
            { stage: 'Stage 4: Analytics', count: stageCounts[4] || 0, pct: activeClients ? Math.round(((stageCounts[4] || 0) / activeClients) * 100) : 0 },
            { stage: 'Stage 5: Final', count: stageCounts[5] || 0, pct: activeClients ? Math.round(((stageCounts[5] || 0) / activeClients) * 100) : 0 },
        ].filter(s => s.count > 0);

        const finalStageDistribution = stageDistribution;

        // 3. Expert Workload
        const experts = await prisma.user.findMany({ where: { role: 'EXPERT' }, select: { id: true, name: true } });
        const workloads = await Promise.all(experts.map(async (expert) => {
            const reviews = await prisma.clientModule.count({ where: { response: { reviewerId: expert.id } } });
            const sessions = await prisma.appointmentSlot.count({ where: { expertId: expert.id, isBooked: true } });
            return {
                name: expert.name || 'Expert',
                reviews,
                sessions,
                color: 'bg-indigo-500' // mock color, handled in UI
            };
        }));

        const finalWorkloads = workloads;

        return NextResponse.json({
            kpis: {
                activeClients: activeClients,
                modulesUnderReview: modulesUnderReview,
                pendingAppointments: pendingAppointments,
                avgCompletionRate
            },
            stageDistribution: finalStageDistribution,
            expertWorkload: finalWorkloads
        });
    } catch (error: any) {
        console.error('Admin Analytics error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

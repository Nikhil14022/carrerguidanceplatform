import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const clientProfile = await prisma.clientProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                user: { select: { name: true, email: true } },
                modules: {
                    where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] } },
                    include: { response: true, module: true }
                },
                reports: {
                    where: { active: true },
                    include: { careerOptions: true },
                    orderBy: { id: 'desc' },
                    take: 1
                }
            }
        });

        if (!clientProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        // Extract key data from module responses for resume pre-fill
        const moduleData: Record<string, any> = {};
        clientProfile.modules.forEach((m: any) => {
            if (m.response?.data) {
                moduleData[m.module.title] = m.response.data;
            }
        });

        const report = clientProfile.reports?.[0] || null;

        return NextResponse.json({
            user: {
                name: clientProfile.user.name || '',
                email: clientProfile.user.email || ''
            },
            report: report ? {
                content: report.content,
                careerOptions: report.careerOptions?.map((c: any) => ({
                    title: c.title,
                    match: c.match,
                    reasoning: c.reasoning
                }))
            } : null,
            moduleData
        });
    } catch (error: any) {
        console.error('Resume data error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

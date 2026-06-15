import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const MENTOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY', 'EXPERT'];

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user || !MENTOR_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const report = await prisma.report.findUnique({
            where: { id },
            include: {
                clientProfile: {
                    include: { user: { select: { name: true, email: true } } }
                },
                careerOptions: true
            }
        });

        if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Basic check for assigned mentors
        if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
            const assignment = await prisma.mentorAssignment.findFirst({
                where: {
                    mentorProfileId: session.user.mentorProfileId as string,
                    clientProfileId: report.clientProfileId,
                    isActive: true
                }
            });
            if (!assignment) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // Unpack content if it's JSON
        let contentToReturn = report.content || '';
        try {
            if (report.content) {
                const parsed = JSON.parse(report.content);
                if (parsed && typeof parsed === 'object' && 'personality_insights' in parsed) {
                    contentToReturn = parsed.personality_insights;
                }
            }
        } catch (e) {
            // Not JSON, return as-is
        }

        return NextResponse.json({
            report: {
                ...report,
                content: contentToReturn,
                clientName: report.clientProfile.user.name,
                clientEmail: report.clientProfile.user.email
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user || !MENTOR_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify assignment
        if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
            const r = await prisma.report.findUnique({ where: { id } });
            if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            const assignment = await prisma.mentorAssignment.findFirst({
                where: { mentorProfileId: session.user.mentorProfileId as string, clientProfileId: r.clientProfileId, isActive: true }
            });
            if (!assignment) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        // Get the current report content to see if we should merge JSON or just save text
        const currentReport = await prisma.report.findUnique({
            where: { id }
        });

        let contentToSave = body.content;
        if (currentReport && currentReport.content) {
            try {
                const parsed = JSON.parse(currentReport.content);
                if (parsed && typeof parsed === 'object' && 'personality_insights' in parsed) {
                    parsed.personality_insights = body.content;
                    contentToSave = JSON.stringify(parsed);
                }
            } catch (e) {
                // Not JSON, save as plain text
            }
        }

        await prisma.$transaction(async (tx: any) => {
            await tx.careerOption.deleteMany({ where: { reportId: id } });
            if (body.careerOptions?.length) {
                await tx.careerOption.createMany({
                    data: body.careerOptions.map((opt: any) => ({
                        reportId: id,
                        title: opt.title,
                        reasoning: opt.reasoning,
                        match: opt.match
                    }))
                });
            }
            await tx.report.update({
                where: { id },
                data: {
                    content: contentToSave,
                    status: 'HUMAN_REVIVING'
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Finalize report
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user || !MENTOR_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.report.update({
            where: { id },
            data: { status: 'FINALIZED' }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

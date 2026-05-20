import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateCareerReport } from '@/lib/ai'
import prisma from '@/lib/prisma'
import { EmailService } from '@/lib/EmailService'

export async function POST() {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const clientProfile = await prisma.clientProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                modules: true
            }
        })

        if (!clientProfile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        // Check if enough modules are submitted
        const submittedCount = clientProfile.modules.filter((m: any) =>
            ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(m.status)
        ).length

        if (submittedCount < clientProfile.modules.length) {
            return NextResponse.json({
                error: `Incomplete assessment. Please complete all ${clientProfile.modules.length} modules before generating analysis.`
            }, { status: 400 })
        }

        const report = await generateCareerReport(clientProfile.id)

        // Fire and forget email notification
        EmailService.sendReportReadyEmail(
            session.user.email!,
            session.user.name || 'User',
            `/dashboard/reports/${report.id}`
        ).catch(e => console.error('Error sending report ready email', e))

        return NextResponse.json(report)
    } catch (error) {
        console.error('Report generation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        const { id } = await params

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const report = await prisma.report.findUnique({
            where: { id },
            include: {
                careerOptions: {
                    include: {
                        research: true
                    }
                }
            }
        })

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 })
        }

        return NextResponse.json(report)
    } catch (error) {
        console.error('Fetch report error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

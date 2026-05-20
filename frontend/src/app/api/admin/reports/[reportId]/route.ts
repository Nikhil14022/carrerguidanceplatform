import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { reportUpdateSchema } from '@/lib/validations'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await auth()
    const { reportId } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'EXPERT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = reportUpdateSchema.parse(body)

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { careerOptions: true }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        content: validatedData.content,
        status: 'HUMAN_REVIVING'
      }
    })

    if (validatedData.careerOptions) {
      for (const option of report.careerOptions) {
        await prisma.careerOption.delete({ where: { id: option.id } })
      }

      await prisma.careerOption.createMany({
        data: validatedData.careerOptions.map(option => ({
          reportId,
          title: option.title,
          reasoning: option.reasoning,
          match: option.match
        }))
      })
    }

    return NextResponse.json({ success: true, report: updatedReport })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Report update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

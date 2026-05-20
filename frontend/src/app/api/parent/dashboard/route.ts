import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const clientProfile = await prisma.clientProfile.findFirst({
      where: { parentId: session.user.id },
      include: {
        user: {
          select: { name: true, email: true }
        },
        modules: {
          orderBy: { order: 'asc' },
          include: { module: true, response: true }
        }
      }
    })

    if (!clientProfile) {
      return NextResponse.json({ error: 'No child profile linked' }, { status: 404 })
    }

    // --- Just-In-Time Module Synchronization (Parent View) ---
    // This ensures parents see the same module count as the student
    const allModuleTemplates = await prisma.module.findMany({
      orderBy: { defaultOrder: 'asc' }
    })

    const existingModuleIds = new Set(clientProfile.modules.map((m: any) => m.moduleId))
    const missingTemplates = allModuleTemplates.filter((t: any) => !existingModuleIds.has(t.id))

    if (missingTemplates.length > 0) {
      const newClientModules = await Promise.all(
        missingTemplates.map((template: any) =>
          prisma.clientModule.create({
            data: {
              clientProfileId: clientProfile.id,
              moduleId: template.id,
              order: template.defaultOrder,
              status: 'LOCKED',
              filledBy: 'CLIENT'
            },
            include: { module: true, response: true }
          })
        )
      )
      clientProfile.modules = [...clientProfile.modules, ...newClientModules].sort((a, b) => a.order - b.order)
    }
    // -------------------------------------------------------

    const completedModules = clientProfile.modules.filter(
      (m: any) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(m.status)
    ).length
    const totalModules = clientProfile.modules.length

    // Fetch latest report for the child (only if mentor approved)
    const latestReport = await prisma.report.findFirst({
      where: { clientProfileId: clientProfile.id, active: true, mentorApproved: true },
      include: { careerOptions: true },
      orderBy: { id: 'desc' }
    })

    return NextResponse.json({
      child: {
        name: clientProfile.user.name,
        email: clientProfile.user.email
      },
      stats: {
        completed: completedModules,
        total: totalModules,
        progress: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
        currentStage: clientProfile.currentStage,
        journeyStatus: clientProfile.journeyStatus
      },
      report: latestReport ? {
        id: latestReport.id,
        content: latestReport.content,
        status: latestReport.status,
        careerOptions: latestReport.careerOptions.map((c: any) => ({
          title: c.title,
          match: c.match,
          reasoning: c.reasoning
        }))
      } : null
    })
  } catch (error) {
    console.error('Parent dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

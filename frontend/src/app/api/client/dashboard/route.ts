import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: { module: true, response: true }
        },
        reports: {
          where: { active: true },
          orderBy: { id: 'desc' }
        }
      }
    })

    if (!clientProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // --- Just-In-Time Module Synchronization ---
    const allModuleTemplates = await prisma.module.findMany({
      orderBy: { defaultOrder: 'asc' }
    })

    const existingModuleIds = new Set(clientProfile.modules.map((m: any) => m.moduleId))
    const missingTemplates = allModuleTemplates.filter((t: any) => !existingModuleIds.has(t.id))

    if (missingTemplates.length > 0) {
      // Add missing modules to user profile
      const newClientModules = await Promise.all(
        missingTemplates.map((template: any) =>
          prisma.clientModule.create({
            data: {
              clientProfileId: clientProfile.id,
              moduleId: template.id,
              order: template.defaultOrder,
              status: template.defaultOrder <= 3 ? 'UNLOCKED' : 'LOCKED',
              filledBy: 'CLIENT'
            },
            include: { module: true, response: true }
          })
        )
      )

      // Refresh the modules list and recalibrate journey status if needed
      clientProfile.modules = [...clientProfile.modules, ...newClientModules].sort((a, b) => a.order - b.order)

      // If they were stuck at "Analysis in Progress" but now have more modules, unlock the next one
      if (clientProfile.journeyStatus === "Analysis in Progress") {
        const nextToUnlock = clientProfile.modules.find(m => m.status === 'LOCKED')
        if (nextToUnlock) {
          await prisma.clientModule.update({
            where: { id: nextToUnlock.id },
            data: { status: 'UNLOCKED' }
          })
          nextToUnlock.status = 'UNLOCKED'
          await prisma.clientProfile.update({
            where: { id: clientProfile.id },
            data: { journeyStatus: "In Progress" }
          })
          clientProfile.journeyStatus = "In Progress"
        }
      }
    }
    // ------------------------------------------

    const completedModules = clientProfile.modules.filter(
      (m: any) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(m.status)
    ).length

    const totalModules = clientProfile.modules.length
    const progressPercentage = totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0

    const currentModule = clientProfile.modules.find(
      (m: any) => m.status === 'UNLOCKED' || m.status === 'IN_PROGRESS'
    )

    return NextResponse.json({
      profile: clientProfile,
      stats: {
        completed: completedModules,
        total: totalModules,
        progress: progressPercentage,
        currentStage: clientProfile.currentStage,
        journeyStatus: clientProfile.journeyStatus,
        profileId: clientProfile.id
      },
      currentModule: currentModule ? {
        id: currentModule.id,
        title: currentModule.module.title,
        status: currentModule.status
      } : null,
      reports: clientProfile.reports
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

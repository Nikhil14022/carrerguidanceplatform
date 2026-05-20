import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { moduleReviewSchema } from '@/lib/validations'

const MENTOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY', 'EXPERT']

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user || !MENTOR_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, notes, data } = moduleReviewSchema.parse(body)

    const clientModule = await prisma.clientModule.findUnique({
      where: { id },
      include: { response: true }
    })

    if (!clientModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    if (action === 'SAVE_NOTES') {
      await prisma.clientModule.update({
        where: { id },
        data: { mentorNotes: notes || '' }
      })
      return NextResponse.json({ success: true, action: 'SAVE_NOTES' })
    }

    if (action === 'APPROVE') {
      await prisma.clientModule.update({
        where: { id },
        data: {
          status: 'APPROVED',
          mentorNotes: notes || clientModule.mentorNotes
        }
      })

      if (clientModule.response) {
        await prisma.moduleResponse.update({
          where: { clientModuleId: id },
          data: { approvedAt: new Date(), reviewerId: session.user.id }
        })
      }

      return NextResponse.json({ success: true, action: 'APPROVE' })
    }

    if (action === 'REJECT') {
      await prisma.clientModule.update({
        where: { id },
        data: {
          status: 'UNLOCKED',
          mentorNotes: notes || 'Please revise and resubmit.'
        }
      })
      return NextResponse.json({ success: true, action: 'REJECT' })
    }

    if (action === 'UNLOCK') {
      await prisma.clientModule.update({
        where: { id },
        data: {
          status: 'UNLOCKED'
        }
      })
      return NextResponse.json({ success: true, action: 'UNLOCK' })
    }

    if (action === 'UNLOCK_BATCH') {
      // Find the client profile for this module
      const clientProfileId = clientModule.clientProfileId

      // Find the next 3 locked modules in order
      const lockedModules = await prisma.clientModule.findMany({
        where: {
          clientProfileId,
          status: 'LOCKED'
        },
        orderBy: { order: 'asc' },
        take: 3
      })

      // Unlock them all
      if (lockedModules.length > 0) {
        await Promise.all(
          lockedModules.map(m =>
            prisma.clientModule.update({
              where: { id: m.id },
              data: { status: 'UNLOCKED' }
            })
          )
        )
      }

      // Reset journey status back to In Progress
      await prisma.clientProfile.update({
        where: { id: clientProfileId },
        data: { journeyStatus: 'In Progress' }
      })

      return NextResponse.json({ success: true, action: 'UNLOCK_BATCH', unlockedCount: lockedModules.length })
    }

    if (action === 'EDIT_RESPONSE') {
      if (!data) {
        return NextResponse.json({ error: 'No data provided' }, { status: 400 })
      }

      // Upsert the response — create if none exists, update if it does
      if (clientModule.response) {
        await prisma.moduleResponse.update({
          where: { clientModuleId: id },
          data: { data: data as any }
        })
      } else {
        await prisma.moduleResponse.create({
          data: {
            clientModuleId: id,
            data: data as any,
            submittedAt: new Date()
          }
        })
        // Also update module status to SUBMITTED if it was UNLOCKED/IN_PROGRESS
        if (['UNLOCKED', 'IN_PROGRESS'].includes(clientModule.status)) {
          await prisma.clientModule.update({
            where: { id },
            data: { status: 'SUBMITTED' }
          })
        }
      }

      return NextResponse.json({ success: true, action: 'EDIT_RESPONSE' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Review error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

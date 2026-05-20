import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { clientManageSchema } from '@/lib/validations'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'EXPERT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = clientManageSchema.parse(body)

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { id },
      include: { modules: true }
    })

    if (!clientProfile) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (validatedData.action === 'REORDER' && validatedData.moduleId && validatedData.newOrder !== undefined) {
      const module = clientProfile.modules.find(m => m.id === validatedData.moduleId)
      if (!module) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 })
      }

      await prisma.clientModule.update({
        where: { id: validatedData.moduleId },
        data: { order: validatedData.newOrder }
      })

      return NextResponse.json({ success: true })
    }

    if (validatedData.action === 'SKIP' && validatedData.moduleId) {
      const currentModule = clientProfile.modules.find(m => m.id === validatedData.moduleId)
      if (!currentModule) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 })
      }

      await prisma.clientModule.update({
        where: { id: validatedData.moduleId },
        data: { status: 'APPROVED' }
      })

      const nextModule = clientProfile.modules.find(m => m.order === currentModule.order + 1)
      if (nextModule) {
        await prisma.clientModule.update({
          where: { id: nextModule.id },
          data: { status: 'UNLOCKED' }
        })
      }

      return NextResponse.json({ success: true })
    }

    if (validatedData.action === 'ADD' && validatedData.moduleId) {
      const existingModule = clientProfile.modules.find(m => m.moduleId === validatedData.moduleId)
      if (existingModule) {
        return NextResponse.json({ error: 'Module already assigned' }, { status: 400 })
      }

      const maxOrder = Math.max(...clientProfile.modules.map(m => m.order), 0)

      await prisma.clientModule.create({
        data: {
          clientProfileId: id,
          moduleId: validatedData.moduleId,
          status: 'UNLOCKED',
          order: maxOrder + 1
        }
      })

      return NextResponse.json({ success: true })
    }

    if (validatedData.action === 'EDIT_RESPONSE' && validatedData.moduleId && validatedData.data) {
      const module = clientProfile.modules.find(m => m.id === validatedData.moduleId)
      if (!module) return NextResponse.json({ error: 'Module not found' }, { status: 404 })

      await prisma.moduleResponse.upsert({
        where: { clientModuleId: validatedData.moduleId },
        update: { data: validatedData.data },
        create: {
          clientModuleId: validatedData.moduleId,
          data: validatedData.data,
          submittedAt: new Date()
        }
      })

      return NextResponse.json({ success: true })
    }

    if (validatedData.action === 'REMOVE' && validatedData.moduleId) {
      await prisma.clientModule.delete({
        where: { id: validatedData.moduleId }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Client manage error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

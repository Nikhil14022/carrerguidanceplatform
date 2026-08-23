import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'EXPERT', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage')
    const status = searchParams.get('status')

    const where: any = {}

    if (stage) {
      where.currentStage = parseInt(stage)
    }

    const clients = await prisma.clientProfile.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true, createdAt: true, updatedAt: true } },
        modules: {
          select: { status: true }
        }
      },
      orderBy: { user: { updatedAt: 'desc' } }
    })

    const clientIds = clients.map(c => c.id);
    const parentIds = Array.from(new Set(clients.map(c => c.parentId).filter(Boolean))) as string[];

    const parentUsers = parentIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: parentIds } },
      select: { id: true, name: true, email: true }
    }) : [];

    const mentorAssignments = clientIds.length > 0 ? await prisma.mentorAssignment.findMany({
      where: { clientProfileId: { in: clientIds }, isActive: true },
      include: {
        mentorProfile: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    }) : [];

    const parentMap = new Map(parentUsers.map(p => [p.id, p]));

    const filteredClients = clients.map(client => {
      const moduleStats = {
        locked: client.modules.filter(m => m.status === 'LOCKED').length,
        inProgress: client.modules.filter(m => m.status === 'IN_PROGRESS').length,
        submitted: client.modules.filter(m => m.status === 'SUBMITTED' || m.status === 'UNDER_REVIEW').length,
        approved: client.modules.filter(m => m.status === 'APPROVED').length
      }

      let clientStatus = 'In Progress'
      if (moduleStats.approved === client.modules.length && client.modules.length > 0) {
        clientStatus = 'Completed'
      } else if (moduleStats.submitted > 0) {
        clientStatus = 'Under Review'
      }

      if (status && clientStatus.toLowerCase() !== status.toLowerCase()) {
        return null
      }

      const parentInfo = client.parentId ? parentMap.get(client.parentId) || null : null;
      const clientAssignments = mentorAssignments.filter(a => a.clientProfileId === client.id);

      return {
        id: client.id,
        userId: client.userId,
        email: client.user.email,
        name: client.user.name,
        currentStage: client.currentStage,
        journeyStatus: client.journeyStatus,
        stats: moduleStats,
        status: clientStatus,
        parent: parentInfo ? { id: parentInfo.id, name: parentInfo.name, email: parentInfo.email } : null,
        assignedMentors: clientAssignments.map(a => ({
          id: a.mentorProfile.id,
          name: a.mentorProfile.user.name,
          email: a.mentorProfile.user.email
        })),
        createdAt: client.user.createdAt,
        updatedAt: client.user.updatedAt
      }
    }).filter(Boolean)

    // Fetch all parent accounts
    const allParents = await prisma.user.findMany({
      where: { role: 'PARENT' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ clients: filteredClients, parents: allParents })
  } catch (error) {
    console.error('Admin clients error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { role } = body

    if (role === 'CLIENT') {
      const {
        clientName,
        clientEmail,
        clientPassword,
        clientAge,
        parentId,
        mentorProfileId
      } = body

      if (!clientName || !clientEmail || !clientPassword) {
        return NextResponse.json({ error: 'Student name, email, and password are required' }, { status: 400 })
      }

      // Check if student email is already registered
      const existingClient = await prisma.user.findUnique({ where: { email: clientEmail } })
      if (existingClient) {
        return NextResponse.json({ error: `Student email ${clientEmail} is already registered.` }, { status: 400 })
      }

      const hashedClientPassword = await hash(clientPassword, 12)

      const moduleTemplates = await prisma.module.findMany({
        orderBy: { defaultOrder: 'asc' }
      })

      const result = await prisma.$transaction(async (tx) => {
        const clientUser = await tx.user.create({
          data: {
            name: clientName,
            email: clientEmail,
            password: hashedClientPassword,
            role: 'CLIENT',
            age: parseInt(clientAge as any) || 16,
            clientProfile: {
              create: {
                currentStage: 1,
                journeyStatus: 'Started',
                parentId: parentId || null,
                modules: {
                  create: moduleTemplates.map((template, idx) => ({
                    moduleId: template.id,
                    status: 'LOCKED',
                    order: idx + 1,
                    filledBy: 'CLIENT'
                  }))
                }
              }
            }
          },
          include: { clientProfile: true }
        })

        if (mentorProfileId && clientUser.clientProfile) {
          await tx.mentorAssignment.create({
            data: {
              mentorProfileId,
              clientProfileId: clientUser.clientProfile.id,
              permissions: ['VIEW_MODULES', 'VIEW_REPORTS', 'CHAT'],
              assignedBy: session.user.id,
              isActive: true,
              assignedAt: new Date()
            }
          })
        }

        return {
          clientId: clientUser.id,
          clientProfileId: clientUser.clientProfile?.id
        }
      })

      return NextResponse.json({ success: true, ...result }, { status: 201 })

    } else if (role === 'PARENT') {
      const {
        parentName,
        parentEmail,
        parentPassword,
        clientProfileId
      } = body

      if (!parentName || !parentEmail || !parentPassword) {
        return NextResponse.json({ error: 'Parent name, email, and password are required' }, { status: 400 })
      }

      // Check if parent email is already registered
      const existingParent = await prisma.user.findUnique({ where: { email: parentEmail } })
      if (existingParent) {
        return NextResponse.json({ error: `Parent email ${parentEmail} is already registered.` }, { status: 400 })
      }

      const hashedParentPassword = await hash(parentPassword, 12)

      const result = await prisma.$transaction(async (tx) => {
        const parentUser = await tx.user.create({
          data: {
            name: parentName,
            email: parentEmail,
            password: hashedParentPassword,
            role: 'PARENT'
          }
        })

        if (clientProfileId) {
          await tx.clientProfile.update({
            where: { id: clientProfileId },
            data: { parentId: parentUser.id }
          })
        }

        return {
          parentId: parentUser.id
        }
      })

      return NextResponse.json({ success: true, ...result }, { status: 201 })

    } else {
      return NextResponse.json({ error: 'Invalid or missing role parameter' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error creating client or parent:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

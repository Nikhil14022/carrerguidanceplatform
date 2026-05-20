import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'EXPERT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const modules = await prisma.module.findMany({
      orderBy: { defaultOrder: 'asc' }
    })

    return NextResponse.json({ modules })
  } catch (error) {
    console.error('Admin modules GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, description, schema } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const maxOrder = await prisma.module.aggregate({
      _max: { defaultOrder: true }
    })

    const module = await prisma.module.create({
      data: {
        title,
        description,
        schema: schema || { type: 'object', properties: {} },
        defaultOrder: (maxOrder._max.defaultOrder || 0) + 1
      }
    })

    return NextResponse.json({ success: true, module })
  } catch (error) {
    console.error('Admin modules POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const clientProfile = await prisma.clientProfile.findFirst({
            where: { parentId: session.user.id }
        })

        if (!clientProfile) {
            return NextResponse.json({ records: [] })
        }

        const clientId = clientProfile.id

        const records = await prisma.parentData.findMany({
            where: { clientProfileId: clientId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ records })
    } catch (error) {
        console.error('get parent data error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { title, description, type, fileUrl } = await req.json()
        if (!title || !type) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

        const clientProfile = await prisma.clientProfile.findFirst({
            where: { parentId: session.user.id }
        })

        if (!clientProfile) {
            return NextResponse.json({ error: 'No associated child profile' }, { status: 400 })
        }

        const clientId = clientProfile.id

        const record = await prisma.parentData.create({
            data: {
                clientProfileId: clientId,
                title,
                description,
                type,
                fileUrl,
                uploadedBy: session.user.id
            }
        })

        return NextResponse.json({ success: true, record })
    } catch (error) {
        console.error('post parent data error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

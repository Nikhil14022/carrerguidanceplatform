import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'PARENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { childLinkCode } = await request.json()

        if (!childLinkCode) {
            return NextResponse.json({ error: 'Link code is required' }, { status: 400 })
        }

        // Currently using ClientProfile ID as the link code
        const clientProfile = await prisma.clientProfile.findUnique({
            where: { id: childLinkCode }
        })

        if (!clientProfile) {
            return NextResponse.json({ error: 'Invalid link code. Child profile not found.' }, { status: 404 })
        }

        if (clientProfile.parentId) {
            return NextResponse.json({ error: 'This profile is already linked to another parent.' }, { status: 400 })
        }

        await prisma.clientProfile.update({
            where: { id: childLinkCode },
            data: { parentId: session.user.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Parent link error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

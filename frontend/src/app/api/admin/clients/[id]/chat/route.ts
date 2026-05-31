import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { chatWithClientData } from '@/lib/ai'

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

    const { messages } = await request.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 })
    }

    const responseText = await chatWithClientData(id, messages)
    return NextResponse.json({ success: true, response: responseText })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: error.message || 'Failed to get chat response' }, { status: 500 })
  }
}

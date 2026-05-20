import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test DB connection
    const userCount = await prisma.user.count()
    return NextResponse.json({ 
      status: 'ok', 
      database: 'connected', 
      userCount,
      env: {
        hasAuthSecret: !!process.env.AUTH_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        nodeEnv: process.env.NODE_ENV
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      database: 'failed', 
      error: error.message || error.toString() 
    }, { status: 500 })
  }
}

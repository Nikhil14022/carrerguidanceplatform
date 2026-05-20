import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import prisma from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'
import { EmailService } from '@/lib/EmailService'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(validatedData.password, 12)

    const modules = await prisma.module.findMany({
      orderBy: { defaultOrder: 'asc' }
    })

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: validatedData.role,
        ...(validatedData.role === 'CLIENT' && {
          clientProfile: {
            create: {
              currentStage: 1,
              journeyStatus: 'Started',
              ...(validatedData.parentId && { parentId: validatedData.parentId }),
              modules: {
                create: modules.map((mod, index) => ({
                  moduleId: mod.id,
                  status: index < 3 ? 'UNLOCKED' : 'LOCKED',
                  order: index + 1,
                  filledBy: 'CLIENT'
                }))
              }
            }
          }
        })
      },
      include: { clientProfile: true }
    })
    // Fire and forget welcome email
    EmailService.sendWelcomeEmail(user.email, user.name || 'User').catch(e => console.error('Error sending welcome email', e))

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

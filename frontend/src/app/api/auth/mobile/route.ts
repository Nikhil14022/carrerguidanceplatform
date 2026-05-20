import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                clientProfile: true,
                mentorProfile: {
                    include: {
                        assignments: {
                            where: { isActive: true },
                            select: { clientProfileId: true, permissions: true }
                        }
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
        }

        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
        }

        // Check if temporary mentor has expired
        if (user.mentorProfile?.type === 'TEMPORARY' && user.mentorProfile.accessEnd) {
            if (new Date() > user.mentorProfile.accessEnd) {
                return NextResponse.json({ success: false, error: 'Mentor access expired' }, { status: 403 });
            }
        }

        // Check if mentor is suspended
        if (user.mentorProfile?.status === 'SUSPENDED') {
            return NextResponse.json({ success: false, error: 'Account suspended' }, { status: 403 });
        }

        const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            clientProfileId: user.clientProfile?.id || null,
            mentorProfileId: user.mentorProfile?.id || null,
            mentorType: user.mentorProfile?.type || null,
            assignedClients: user.mentorProfile?.assignments?.map(a => ({
                clientProfileId: a.clientProfileId,
                permissions: a.permissions
            })) || []
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

        return NextResponse.json({
            success: true,
            token,
            user: payload
        });
    } catch (error) {
        console.error('Mobile Auth Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

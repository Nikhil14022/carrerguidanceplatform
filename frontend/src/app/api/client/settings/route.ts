import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { email, password } = body;

        // Ensure at least one field is provided
        if (!email && !password) {
            return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
        }

        const dataToUpdate: any = {};

        // If updating email, ensure it doesn't already exist for another user
        if (email && email !== session.user.email) {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return NextResponse.json({ error: 'Email is already taken' }, { status: 400 });
            }
            dataToUpdate.email = email;
        }

        if (password && password.length > 0) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(dataToUpdate).length > 0) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: dataToUpdate
            });
        }

        return NextResponse.json({ success: true, message: 'Settings updated successfully' });
    } catch (error: any) {
        console.error('Settings update error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

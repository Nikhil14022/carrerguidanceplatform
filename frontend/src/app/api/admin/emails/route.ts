import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const logPath = path.join(process.cwd(), 'email-logs.json');

        if (!fs.existsSync(logPath)) {
            return NextResponse.json([]);
        }

        const data = fs.readFileSync(logPath, 'utf8');
        const emails = JSON.parse(data);
        return NextResponse.json(emails);
    } catch (error) {
        console.error('Error fetching email logs:', error);
        return new NextResponse('Error fetching emails', { status: 500 });
    }
}

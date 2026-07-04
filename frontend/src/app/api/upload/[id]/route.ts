import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // Validate MongoDB ObjectId format
    if (!id || id.length !== 24) {
      return new Response('Invalid ID format', { status: 400 });
    }

    const file = await prisma.uploadedFile.findUnique({ where: { id } });
    if (!file) {
      return new Response('File Not Found', { status: 404 });
    }
    
    const buffer = Buffer.from(file.data, 'base64');
    return new Response(buffer, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${file.filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error fetching uploaded file:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

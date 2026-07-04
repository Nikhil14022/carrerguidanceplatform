import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ file: string[] }> }) {
  try {
    const { file } = await params;
    if (!file || file.length === 0) {
      return new Response('File parameter missing', { status: 400 });
    }

    const id = file[0];
    
    // Validate MongoDB ObjectId format
    if (!id || id.length !== 24) {
      return new Response('Invalid ID format', { status: 400 });
    }

    const fileRecord = await prisma.uploadedFile.findUnique({ where: { id } });
    if (!fileRecord) {
      return new Response('File Not Found', { status: 404 });
    }
    
    const buffer = Buffer.from(fileRecord.data, 'base64');
    return new Response(buffer, {
      headers: {
        'Content-Type': fileRecord.mimeType,
        'Content-Disposition': `inline; filename="${fileRecord.filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error fetching uploaded file:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

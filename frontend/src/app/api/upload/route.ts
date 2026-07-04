import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const files = data.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: 'No files uploaded' }, { status: 400 });
    }

    const uploadedPaths = [];

    // Save files
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Save to database (highly compatible with Vercel serverless functions)
      const dbFile = await prisma.uploadedFile.create({
        data: {
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          data: buffer.toString('base64')
        }
      });

      // Try to write to local public/uploads directory for local dev environment (fails silently if read-only)
      try {
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const filepath = join(process.cwd(), 'public', 'uploads', filename);
        await writeFile(filepath, buffer);
      } catch (fsError) {
        console.warn('Local filesystem write skipped (expected on read-only environments like Vercel):', fsError);
      }

      // Return catch-all path including filename to ensure standard file checkers work properly
      const safeFilename = encodeURIComponent(file.name.replace(/\s+/g, '_'));
      uploadedPaths.push(`/api/upload/${dbFile.id}/${safeFilename}`);
    }

    return NextResponse.json({ success: true, files: uploadedPaths });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ success: false, message: 'Error uploading files' }, { status: 500 });
  }
}

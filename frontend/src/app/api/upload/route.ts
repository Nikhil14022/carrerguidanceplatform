import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

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

      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const filepath = join(process.cwd(), 'public', 'uploads', filename);

      await writeFile(filepath, buffer);
      uploadedPaths.push(`/uploads/${filename}`);
    }

    return NextResponse.json({ success: true, files: uploadedPaths });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ success: false, message: 'Error uploading files' }, { status: 500 });
  }
}

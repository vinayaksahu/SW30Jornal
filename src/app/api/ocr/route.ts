import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ocrService } from '@/lib/services/ocr-service';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let buffer: Buffer | null = null;
    let mimeType = 'image/png';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      const fileUrl = body.fileUrl || body.url;

      if (!fileUrl) {
        return NextResponse.json({ error: 'No fileUrl provided' }, { status: 400 });
      }

      if (fileUrl.startsWith('/uploads/')) {
        // Local file
        const filePath = join(process.cwd(), 'public', fileUrl.replace('/', ''));
        buffer = await readFile(filePath);
      } else if (fileUrl.startsWith('http')) {
        // Remote URL (Vercel Blob, etc.)
        const response = await fetch(fileUrl);
        const arrayBuf = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
        mimeType = response.headers.get('content-type') || 'image/png';
      }
    } else {
      // Multipart form data
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (file) {
        const arrayBuf = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
        mimeType = file.type;
      }
    }

    if (!buffer) {
      return NextResponse.json({ error: 'No valid image received for OCR' }, { status: 400 });
    }

    const extractedData = await ocrService.extract(buffer, mimeType);
    return NextResponse.json(extractedData);
  } catch (error) {
    console.error('OCR Route Error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}

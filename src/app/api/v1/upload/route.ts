import { NextRequest } from 'next/server';
import { getUserFromToken, jsonResponse, errorResponse } from '@/app/api/_store/db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(req: NextRequest) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return errorResponse(400, 'No file provided');

    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      return errorResponse(400, 'File must be JPEG, PNG, WebP, or GIF');
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return errorResponse(400, 'File must be under 5MB');
    }

    // Ensure upload dir exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    const url = `/uploads/${filename}`;
    return jsonResponse({ url }, 201);
  } catch {
    return errorResponse(500, 'Upload failed');
  }
}

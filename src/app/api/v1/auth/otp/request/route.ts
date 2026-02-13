import { NextRequest } from 'next/server';
import { getDb, saveDb, generateOtp, jsonResponse, errorResponse } from '@/app/api/_store/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone } = body;

  if (!phone || typeof phone !== 'string') {
    return errorResponse(400, 'Phone number is required');
  }

  const db = getDb();

  // Rate limit: 1 OTP per 30s per phone
  const recent = db.otps.find(o => o.phone === phone && !o.used && Date.now() - o.createdAt < 30000);
  if (recent) {
    const wait = Math.ceil((30000 - (Date.now() - recent.createdAt)) / 1000);
    return errorResponse(400, `Rate limit exceeded. Please wait ${wait} seconds.`);
  }

  const code = generateOtp();

  db.otps.push({
    phone,
    code,
    createdAt: Date.now(),
    used: false,
  });
  saveDb(db);

  // Log to console so dev can see the OTP
  console.log(`\n📱 OTP for ${phone}: ${code}\n`);

  return jsonResponse({ ok: true });
}

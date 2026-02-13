import { NextRequest } from 'next/server';
import { getDb, saveDb, uuid, makeJwt, jsonResponse, errorResponse, type DbUser } from '@/app/api/_store/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, code } = body;

  if (!phone || !code) {
    return errorResponse(400, 'Phone and code are required');
  }

  const db = getDb();

  // Find valid OTP (not used, not expired - 5 min)
  const otpIdx = db.otps.findIndex(
    o => o.phone === phone && o.code === code && !o.used && Date.now() - o.createdAt < 300000
  );

  if (otpIdx === -1) {
    // Check if expired
    const expired = db.otps.find(o => o.phone === phone && o.code === code && !o.used && Date.now() - o.createdAt >= 300000);
    if (expired) {
      return errorResponse(401, 'Code expired (OTP codes expire after 5 minutes)');
    }
    const used = db.otps.find(o => o.phone === phone && o.code === code && o.used);
    if (used) {
      return errorResponse(401, 'Code already used');
    }
    return errorResponse(401, 'Invalid or expired OTP code');
  }

  // Mark OTP as used
  db.otps[otpIdx].used = true;

  // Find or create user
  let user = db.users.find(u => u.phone === phone);
  if (!user) {
    user = {
      id: uuid(),
      phone,
      language: 'en',
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
  }

  // Generate tokens
  const accessToken = makeJwt(user.id, 'access');
  const refreshToken = makeJwt(user.id, 'refresh');

  db.tokens.push(
    { token: accessToken, userId: user.id, type: 'access', createdAt: Date.now(), expiresAt: Date.now() + 900000, revoked: false },
    { token: refreshToken, userId: user.id, type: 'refresh', createdAt: Date.now(), expiresAt: Date.now() + 2592000000, revoked: false },
  );

  saveDb(db);

  return jsonResponse({
    accessToken,
    refreshToken,
    me: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
}

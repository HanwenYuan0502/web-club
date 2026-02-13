import { NextRequest } from 'next/server';
import { getDb, saveDb, makeJwt, parseJwt, jsonResponse, errorResponse } from '@/app/api/_store/db';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse(401, 'Missing refresh token');
  }

  const oldToken = authHeader.slice(7);
  const payload = parseJwt(oldToken);
  if (!payload) return errorResponse(401, 'Invalid refresh token');

  const db = getDb();
  const tokenRecord = db.tokens.find(t => t.token === oldToken && t.type === 'refresh' && !t.revoked);
  if (!tokenRecord) return errorResponse(401, 'Refresh token has been revoked');
  if (tokenRecord.expiresAt < Date.now()) return errorResponse(401, 'Refresh token expired');

  // Revoke old tokens
  tokenRecord.revoked = true;

  // Generate new pair
  const accessToken = makeJwt(payload.sub, 'access');
  const refreshToken = makeJwt(payload.sub, 'refresh');

  db.tokens.push(
    { token: accessToken, userId: payload.sub, type: 'access', createdAt: Date.now(), expiresAt: Date.now() + 900000, revoked: false },
    { token: refreshToken, userId: payload.sub, type: 'refresh', createdAt: Date.now(), expiresAt: Date.now() + 2592000000, revoked: false },
  );

  saveDb(db);
  return jsonResponse({ accessToken, refreshToken });
}

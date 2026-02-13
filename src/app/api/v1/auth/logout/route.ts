import { NextRequest } from 'next/server';
import { getDb, saveDb, parseJwt, jsonResponse, errorResponse } from '@/app/api/_store/db';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse(401, 'Missing refresh token');
  }

  const token = authHeader.slice(7);
  const payload = parseJwt(token);
  if (!payload) return errorResponse(401, 'Invalid token');

  const db = getDb();
  // Revoke all tokens for this user
  db.tokens.forEach(t => {
    if (t.userId === payload.sub) t.revoked = true;
  });
  saveDb(db);

  return jsonResponse({ ok: true });
}

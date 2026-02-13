import { NextRequest } from 'next/server';
import { getDb, saveDb, getUserFromToken, jsonResponse, errorResponse } from '@/app/api/_store/db';

export async function GET(req: NextRequest) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const db = getDb();
  const notifications = (db.notifications || [])
    .filter(n => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return jsonResponse(notifications);
}

// Mark all as read
export async function POST(req: NextRequest) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const db = getDb();
  (db.notifications || []).forEach(n => {
    if (n.userId === user.id) n.read = true;
  });
  saveDb(db);

  return jsonResponse({ ok: true });
}

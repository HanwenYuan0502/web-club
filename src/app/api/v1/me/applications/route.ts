import { NextRequest } from 'next/server';
import { getDb, getUserFromToken, jsonResponse, errorResponse } from '@/app/api/_store/db';

export async function GET(req: NextRequest) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const db = getDb();
  const apps = db.applications.filter(a => a.userId === user.id);
  return jsonResponse(apps);
}

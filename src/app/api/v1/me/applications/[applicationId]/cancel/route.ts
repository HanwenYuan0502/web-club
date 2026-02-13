import { NextRequest } from 'next/server';
import { getDb, saveDb, getUserFromToken, jsonResponse, errorResponse } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ applicationId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { applicationId } = await ctx.params;
  const db = getDb();
  const idx = db.applications.findIndex(a => a.id === applicationId && a.userId === user.id && a.status === 'PENDING');
  if (idx === -1) return errorResponse(404, 'Application not found or not cancellable');

  db.applications[idx].status = 'CANCELLED';
  saveDb(db);
  return jsonResponse(db.applications[idx]);
}

import { NextRequest } from 'next/server';
import { getDb, saveDb, getUserFromToken, jsonResponse, errorResponse, addAuditLog } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ clubId: string; applicationId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId, applicationId } = await ctx.params;
  const db = getDb();
  const admin = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.role === 'ADMIN' && m.status === 'ACTIVE');
  if (!admin) return errorResponse(403, 'Admin access required');

  const idx = db.applications.findIndex(a => a.id === applicationId && a.clubId === clubId);
  if (idx === -1) return errorResponse(404, 'Application not found');
  if (db.applications[idx].status !== 'PENDING') return errorResponse(400, 'Application is not pending');

  const body = await req.json();
  db.applications[idx].status = 'REJECTED';
  db.applications[idx].denialReason = body.denialReason || 'OTHER';
  db.applications[idx].denialNotes = body.denialNotes;

  addAuditLog(db, { clubId, action: 'APPLICATION_REJECTED', eventCategory: 'MEMBER', targetType: 'APPLICATION', targetId: applicationId, actorUserId: user.id, result: 'SUCCESS', statusCode: 200 });
  saveDb(db);
  return jsonResponse(db.applications[idx]);
}

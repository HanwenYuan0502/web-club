import { NextRequest } from 'next/server';
import { getDb, saveDb, getUserFromToken, jsonResponse, errorResponse, addAuditLog } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ clubId: string; userId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId, userId } = await ctx.params;
  const db = getDb();

  const adminMembership = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.role === 'ADMIN' && m.status === 'ACTIVE');
  if (!adminMembership) return errorResponse(403, 'Admin access required');

  const idx = db.memberships.findIndex(m => m.clubId === clubId && m.userId === userId);
  if (idx === -1) return errorResponse(404, 'Member not found');

  const body = await req.json();
  if (body.role) db.memberships[idx].role = body.role;
  if (body.status) db.memberships[idx].status = body.status;
  if (body.adminNotes !== undefined) db.memberships[idx].adminNotes = body.adminNotes;

  addAuditLog(db, { clubId, action: 'MEMBER_UPDATED', eventCategory: 'MEMBER', targetType: 'USER', targetId: userId, actorUserId: user.id, result: 'SUCCESS', statusCode: 200 });
  saveDb(db);
  return jsonResponse(db.memberships[idx]);
}

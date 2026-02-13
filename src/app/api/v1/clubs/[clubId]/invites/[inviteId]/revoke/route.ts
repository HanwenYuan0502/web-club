import { NextRequest } from 'next/server';
import { getDb, saveDb, getUserFromToken, jsonResponse, errorResponse, addAuditLog } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ clubId: string; inviteId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId, inviteId } = await ctx.params;
  const db = getDb();
  const admin = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.role === 'ADMIN' && m.status === 'ACTIVE');
  if (!admin) return errorResponse(403, 'Admin access required');

  const idx = db.invites.findIndex(i => i.id === inviteId && i.clubId === clubId);
  if (idx === -1) return errorResponse(404, 'Invite not found');

  db.invites[idx].status = 'REVOKED';
  addAuditLog(db, { clubId, action: 'INVITE_REVOKED', eventCategory: 'MEMBER', targetType: 'INVITE', targetId: inviteId, actorUserId: user.id, result: 'SUCCESS', statusCode: 200 });
  saveDb(db);
  return jsonResponse({ ok: true });
}

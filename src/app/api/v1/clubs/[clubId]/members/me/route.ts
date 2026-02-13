import { NextRequest } from 'next/server';
import { getDb, saveDb, getUserFromToken, jsonResponse, errorResponse, addAuditLog } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ clubId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await ctx.params;
  const db = getDb();
  const m = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.status !== 'REMOVED');
  if (!m) return errorResponse(404, 'Membership not found');

  return jsonResponse(m);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await ctx.params;
  const db = getDb();
  const idx = db.memberships.findIndex(m => m.clubId === clubId && m.userId === user.id && m.status !== 'REMOVED');
  if (idx === -1) return errorResponse(404, 'Membership not found');

  const m = db.memberships[idx];
  if (m.role === 'ADMIN') {
    const otherAdmins = db.memberships.filter(mm => mm.clubId === clubId && mm.role === 'ADMIN' && mm.status === 'ACTIVE' && mm.userId !== user.id);
    if (otherAdmins.length === 0) {
      return errorResponse(400, 'Cannot leave: you are the last active admin');
    }
  }

  db.memberships[idx].status = 'REMOVED';
  addAuditLog(db, { clubId, action: 'MEMBER_LEFT', eventCategory: 'MEMBER', targetType: 'MEMBER', targetId: m.id, actorUserId: user.id, result: 'SUCCESS', statusCode: 204 });
  saveDb(db);
  return new Response(null, { status: 204 });
}

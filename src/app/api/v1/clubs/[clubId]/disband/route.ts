import { NextRequest } from 'next/server';
import { getDb, saveDb, getUserFromToken, jsonResponse, errorResponse, addAuditLog } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ clubId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await ctx.params;
  const db = getDb();
  const idx = db.clubs.findIndex(c => c.id === clubId);
  if (idx === -1) return errorResponse(404, 'Club not found');

  const membership = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.role === 'ADMIN' && m.status === 'ACTIVE');
  if (!membership) return errorResponse(403, 'Admin access required');

  addAuditLog(db, { clubId, action: 'CLUB_DISBANDED', eventCategory: 'CLUB', targetType: 'CLUB', targetId: clubId, actorUserId: user.id, result: 'SUCCESS', statusCode: 204 });

  db.clubs.splice(idx, 1);
  db.memberships = db.memberships.filter(m => m.clubId !== clubId);
  db.invites = db.invites.filter(i => i.clubId !== clubId);
  db.applications = db.applications.filter(a => a.clubId !== clubId);

  saveDb(db);
  return new Response(null, { status: 204 });
}

import { NextRequest } from 'next/server';
import { getDb, saveDb, getUserFromToken, jsonResponse, errorResponse, addAuditLog } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ clubId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await ctx.params;
  const db = getDb();
  const club = db.clubs.find(c => c.id === clubId);
  if (!club) return errorResponse(404, 'Club not found');

  return jsonResponse(club);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await ctx.params;
  const db = getDb();
  const idx = db.clubs.findIndex(c => c.id === clubId);
  if (idx === -1) return errorResponse(404, 'Club not found');

  const membership = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.role === 'ADMIN' && m.status === 'ACTIVE');
  if (!membership) return errorResponse(403, 'Admin access required');

  const body = await req.json();
  const club = db.clubs[idx];
  if (body.name !== undefined) club.name = body.name;
  if (body.description !== undefined) club.description = body.description;
  if (body.type !== undefined) club.type = body.type;
  if (body.levelsAccepted !== undefined) club.levelsAccepted = body.levelsAccepted;
  if (body.rules !== undefined) club.rules = body.rules;
  if (body.joinMode !== undefined) club.joinMode = body.joinMode;
  if (body.isAcceptingNewMembers !== undefined) club.isAcceptingNewMembers = body.isAcceptingNewMembers;
  if (body.activeMemberLimit !== undefined) club.activeMemberLimit = body.activeMemberLimit;
  club.updatedAt = new Date().toISOString();

  addAuditLog(db, { clubId, action: 'CLUB_UPDATED', eventCategory: 'CLUB', targetType: 'CLUB', targetId: clubId, actorUserId: user.id, result: 'SUCCESS', statusCode: 200 });
  saveDb(db);
  return jsonResponse(club);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await ctx.params;
  const db = getDb();
  const idx = db.clubs.findIndex(c => c.id === clubId);
  if (idx === -1) return errorResponse(404, 'Club not found');

  const membership = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.role === 'ADMIN' && m.status === 'ACTIVE');
  if (!membership) return errorResponse(403, 'Admin access required');

  addAuditLog(db, { clubId, action: 'CLUB_DELETED', eventCategory: 'CLUB', targetType: 'CLUB', targetId: clubId, actorUserId: user.id, result: 'SUCCESS', statusCode: 204 });

  db.clubs.splice(idx, 1);
  db.memberships = db.memberships.filter(m => m.clubId !== clubId);
  db.invites = db.invites.filter(i => i.clubId !== clubId);
  db.applications = db.applications.filter(a => a.clubId !== clubId);

  saveDb(db);
  return new Response(null, { status: 204 });
}

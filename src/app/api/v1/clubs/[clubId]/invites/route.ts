import { NextRequest } from 'next/server';
import { getDb, saveDb, uuid, getUserFromToken, jsonResponse, errorResponse, addAuditLog } from '@/app/api/_store/db';
import crypto from 'crypto';

type Ctx = { params: Promise<{ clubId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await ctx.params;
  const db = getDb();
  const admin = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.role === 'ADMIN' && m.status === 'ACTIVE');
  if (!admin) return errorResponse(403, 'Admin access required');

  const invitesList = db.invites.filter(i => i.clubId === clubId);
  return jsonResponse(invitesList);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await ctx.params;
  const db = getDb();
  const admin = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.role === 'ADMIN' && m.status === 'ACTIVE');
  if (!admin) return errorResponse(403, 'Admin access required');

  const body = await req.json().catch(() => ({}));
  const isTargeted = !!(body.targetPhone || body.targetEmail);

  // For general invites, revoke previous general ones
  if (!isTargeted) {
    db.invites.forEach(i => {
      if (i.clubId === clubId && !i.targetPhone && !i.targetEmail && i.status === 'ACTIVE') {
        i.status = 'REVOKED';
      }
    });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const invite = {
    id: uuid(),
    clubId,
    token: crypto.randomBytes(16).toString('hex'),
    targetPhone: body.targetPhone || undefined,
    targetEmail: body.targetEmail || undefined,
    status: 'ACTIVE',
    expiresAt,
    createdAt: now.toISOString(),
  };

  db.invites.push(invite);
  addAuditLog(db, { clubId, action: 'INVITE_CREATED', eventCategory: 'MEMBER', targetType: 'INVITE', targetId: invite.id, actorUserId: user.id, result: 'SUCCESS', statusCode: 201 });
  saveDb(db);
  return jsonResponse(invite, 201);
}

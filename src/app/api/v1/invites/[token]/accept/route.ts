import { NextRequest } from 'next/server';
import { getDb, saveDb, uuid, getUserFromToken, jsonResponse, errorResponse, addAuditLog } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { token } = await ctx.params;
  const db = getDb();
  const invite = db.invites.find(i => i.token === token && i.status === 'ACTIVE');
  if (!invite) return errorResponse(404, 'Invalid or expired invite link');

  const isTargeted = !!(invite.targetPhone || invite.targetEmail);

  if (isTargeted) {
    if (invite.targetPhone && invite.targetPhone !== user.phone) return errorResponse(403, 'This invite is for a different user');
    if (invite.targetEmail && invite.targetEmail !== user.email) return errorResponse(403, 'This invite is for a different user');

    // Create/reactivate membership directly
    const existing = db.memberships.find(m => m.clubId === invite.clubId && m.userId === user.id);
    if (existing) {
      existing.status = 'ACTIVE';
      existing.role = 'MEMBER';
    } else {
      db.memberships.push({ id: uuid(), userId: user.id, clubId: invite.clubId, role: 'MEMBER', status: 'ACTIVE', showPhoneToMembers: false, showEmailToMembers: false, createdAt: new Date().toISOString() });
    }

    // Consume targeted invite
    invite.status = 'CONSUMED';
    addAuditLog(db, { clubId: invite.clubId, action: 'INVITE_ACCEPTED', eventCategory: 'MEMBER', targetType: 'INVITE', targetId: invite.id, actorUserId: user.id, result: 'SUCCESS', statusCode: 200 });
  } else {
    // General invite → create membership directly for general invites too
    const existing = db.memberships.find(m => m.clubId === invite.clubId && m.userId === user.id);
    if (existing) {
      existing.status = 'ACTIVE';
    } else {
      db.memberships.push({ id: uuid(), userId: user.id, clubId: invite.clubId, role: 'MEMBER', status: 'ACTIVE', showPhoneToMembers: false, showEmailToMembers: false, createdAt: new Date().toISOString() });
    }
    addAuditLog(db, { clubId: invite.clubId, action: 'INVITE_ACCEPTED', eventCategory: 'MEMBER', targetType: 'INVITE', targetId: invite.id, actorUserId: user.id, result: 'SUCCESS', statusCode: 200 });
  }

  saveDb(db);
  return jsonResponse({ ok: true });
}

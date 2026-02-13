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

  // Check expiration
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    invite.status = 'EXPIRED';
    saveDb(db);
    return errorResponse(410, 'This invite link has expired');
  }

  // Check member limit
  const club = db.clubs.find(c => c.id === invite.clubId);
  if (club?.activeMemberLimit) {
    const activeCount = db.memberships.filter(m => m.clubId === invite.clubId && m.status === 'ACTIVE').length;
    if (activeCount >= club.activeMemberLimit) {
      return errorResponse(403, 'Club has reached its member limit');
    }
  }

  // Check if club is accepting new members
  if (club && club.isAcceptingNewMembers === false) {
    return errorResponse(403, 'Club is not accepting new members');
  }

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

  // Notify club admins about new member
  db.notifications = db.notifications || [];
  const admins = db.memberships.filter(m => m.clubId === invite.clubId && m.role === 'ADMIN' && m.status === 'ACTIVE');
  for (const admin of admins) {
    db.notifications.push({
      id: uuid(), userId: admin.userId, type: 'MEMBER_JOINED',
      title: 'New Member Joined',
      body: `${user.firstName || user.phone} joined ${club?.name || 'your club'} via invite`,
      clubId: invite.clubId, linkUrl: `/clubs/${invite.clubId}?tab=members`, read: false, createdAt: new Date().toISOString(),
    });
  }

  saveDb(db);
  return jsonResponse({ ok: true });
}

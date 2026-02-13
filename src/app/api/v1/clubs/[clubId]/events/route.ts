import { NextRequest } from 'next/server';
import { getDb, saveDb, uuid, getUserFromToken, jsonResponse, errorResponse, addAuditLog } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ clubId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await ctx.params;
  const db = getDb();
  const membership = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.status === 'ACTIVE');
  if (!membership) return errorResponse(403, 'Member access required');

  const eventsList = (db.events || [])
    .filter(e => e.clubId === clubId)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .map(e => {
      const regs = (db.eventRegistrations || []).filter(r => r.eventId === e.id && r.status === 'REGISTERED');
      const isRegistered = regs.some(r => r.userId === user.id);
      return { ...e, registrationCount: regs.length, isRegistered };
    });

  return jsonResponse(eventsList);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await ctx.params;
  const db = getDb();
  const admin = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.role === 'ADMIN' && m.status === 'ACTIVE');
  if (!admin) return errorResponse(403, 'Admin access required');

  const body = await req.json();
  if (!body.title?.trim()) return errorResponse(400, 'Event title is required');
  if (!body.startTime) return errorResponse(400, 'Start time is required');

  const event = {
    id: uuid(),
    clubId,
    title: body.title,
    description: body.description || undefined,
    location: body.location || undefined,
    startTime: body.startTime,
    endTime: body.endTime || undefined,
    maxParticipants: body.maxParticipants || null,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  };

  db.events = db.events || [];
  db.events.push(event);

  // Notify all club members about the new event
  db.notifications = db.notifications || [];
  const members = db.memberships.filter(m => m.clubId === clubId && m.status === 'ACTIVE' && m.userId !== user.id);
  const club = db.clubs.find(c => c.id === clubId);
  for (const member of members) {
    db.notifications.push({
      id: uuid(),
      userId: member.userId,
      type: 'EVENT_CREATED',
      title: 'New Event',
      body: `${event.title} in ${club?.name || 'your club'}`,
      clubId,
      linkUrl: `/clubs/${clubId}?tab=events`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  addAuditLog(db, { clubId, action: 'EVENT_CREATED', eventCategory: 'EVENT', targetType: 'EVENT', targetId: event.id, actorUserId: user.id, result: 'SUCCESS', statusCode: 201 });
  saveDb(db);
  return jsonResponse(event, 201);
}

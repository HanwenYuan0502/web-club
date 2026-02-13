import { NextRequest } from 'next/server';
import { getDb, saveDb, uuid, getUserFromToken, jsonResponse, errorResponse } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ clubId: string; eventId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId, eventId } = await ctx.params;
  const db = getDb();
  const membership = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.status === 'ACTIVE');
  if (!membership) return errorResponse(403, 'Member access required');

  const event = (db.events || []).find(e => e.id === eventId && e.clubId === clubId);
  if (!event) return errorResponse(404, 'Event not found');

  db.eventRegistrations = db.eventRegistrations || [];
  const existing = db.eventRegistrations.find(r => r.eventId === eventId && r.userId === user.id && r.status === 'REGISTERED');
  if (existing) return errorResponse(409, 'Already registered');

  // Check capacity
  if (event.maxParticipants) {
    const count = db.eventRegistrations.filter(r => r.eventId === eventId && r.status === 'REGISTERED').length;
    if (count >= event.maxParticipants) return errorResponse(403, 'Event is full');
  }

  const reg = {
    id: uuid(),
    eventId,
    userId: user.id,
    status: 'REGISTERED' as const,
    createdAt: new Date().toISOString(),
  };
  db.eventRegistrations.push(reg);
  saveDb(db);
  return jsonResponse(reg, 201);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId, eventId } = await ctx.params;
  const db = getDb();

  db.eventRegistrations = db.eventRegistrations || [];
  const idx = db.eventRegistrations.findIndex(r => r.eventId === eventId && r.userId === user.id && r.status === 'REGISTERED');
  if (idx === -1) return errorResponse(404, 'Not registered');

  db.eventRegistrations[idx].status = 'CANCELLED';
  saveDb(db);
  return jsonResponse({ ok: true });
}

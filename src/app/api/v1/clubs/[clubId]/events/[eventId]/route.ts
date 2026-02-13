import { NextRequest } from 'next/server';
import { getDb, getUserFromToken, jsonResponse, errorResponse } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ clubId: string; eventId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId, eventId } = await ctx.params;
  const db = getDb();
  const membership = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.status === 'ACTIVE');
  if (!membership) return errorResponse(403, 'Member access required');

  const event = (db.events || []).find(e => e.id === eventId && e.clubId === clubId);
  if (!event) return errorResponse(404, 'Event not found');

  const regs = (db.eventRegistrations || []).filter(r => r.eventId === eventId && r.status === 'REGISTERED');
  return jsonResponse({ ...event, registrationCount: regs.length, isRegistered: regs.some(r => r.userId === user.id) });
}

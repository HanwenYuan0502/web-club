import { NextRequest } from 'next/server';
import { getDb, saveDb, uuid, getUserFromToken, jsonResponse, errorResponse } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ clubId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await ctx.params;
  const db = getDb();
  const admin = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.role === 'ADMIN' && m.status === 'ACTIVE');
  if (!admin) return errorResponse(403, 'Admin access required');

  const apps = db.applications
    .filter(a => a.clubId === clubId)
    .map(a => {
      const u = db.users.find(u => u.id === a.userId);
      return { ...a, user: u ? { id: u.id, firstName: u.firstName, lastName: u.lastName, phone: u.phone, email: u.email } : undefined };
    });

  return jsonResponse(apps);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await ctx.params;
  const db = getDb();
  const club = db.clubs.find(c => c.id === clubId);
  if (!club) return errorResponse(404, 'Club not found');
  if (club.joinMode !== 'APPLY_TO_JOIN') return errorResponse(400, 'Club is invite-only');

  const existing = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.status === 'ACTIVE');
  if (existing) return errorResponse(400, 'Already a member');

  const app = { id: uuid(), clubId, userId: user.id, status: 'PENDING' as const, createdAt: new Date().toISOString() };
  db.applications.push(app);
  saveDb(db);
  return jsonResponse(app, 201);
}

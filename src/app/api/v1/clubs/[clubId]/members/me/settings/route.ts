import { NextRequest } from 'next/server';
import { getDb, saveDb, getUserFromToken, jsonResponse, errorResponse } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ clubId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await ctx.params;
  const db = getDb();
  const idx = db.memberships.findIndex(m => m.clubId === clubId && m.userId === user.id && m.status !== 'REMOVED');
  if (idx === -1) return errorResponse(404, 'Membership not found');

  const body = await req.json();
  if (body.showPhoneToMembers !== undefined) db.memberships[idx].showPhoneToMembers = body.showPhoneToMembers;
  if (body.showEmailToMembers !== undefined) db.memberships[idx].showEmailToMembers = body.showEmailToMembers;

  saveDb(db);
  return jsonResponse(db.memberships[idx]);
}

import { NextRequest } from 'next/server';
import { getDb, getUserFromToken, jsonResponse, errorResponse } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ clubId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await ctx.params;
  const db = getDb();

  const myMembership = db.memberships.find(m => m.clubId === clubId && m.userId === user.id && m.status !== 'REMOVED');
  if (!myMembership) return errorResponse(403, 'Member access required');

  const isAdmin = myMembership.role === 'ADMIN';
  const members = db.memberships
    .filter(m => m.clubId === clubId && (isAdmin || m.status === 'ACTIVE' || m.userId === user.id))
    .map(m => {
      const u = db.users.find(u => u.id === m.userId);
      return {
        ...m,
        user: u ? {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          phone: m.showPhoneToMembers || isAdmin ? u.phone : undefined,
          email: m.showEmailToMembers || isAdmin ? u.email : undefined,
        } : undefined,
      };
    });

  return jsonResponse(members);
}

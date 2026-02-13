import { NextRequest } from 'next/server';
import { getDb, jsonResponse, errorResponse } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  const db = getDb();
  const invite = db.invites.find(i => i.token === token && i.status === 'ACTIVE');
  if (!invite) return errorResponse(404, 'Invalid or expired invite link');

  const club = db.clubs.find(c => c.id === invite.clubId);
  return jsonResponse({ club: club || {}, invite: { id: invite.id, token: invite.token, targetPhone: invite.targetPhone, targetEmail: invite.targetEmail } });
}

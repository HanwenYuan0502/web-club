import { NextRequest } from 'next/server';
import { getDb, getUserFromToken, jsonResponse, errorResponse } from '@/app/api/_store/db';

export async function GET(req: NextRequest) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const q = req.nextUrl.searchParams.get('q')?.toLowerCase() || '';
  const db = getDb();

  const clubs = db.clubs.filter(c => {
    if (q && !c.name.toLowerCase().includes(q) && !c.description?.toLowerCase().includes(q)) return false;
    const membership = db.memberships.find(m => m.userId === user.id && m.clubId === c.id && m.status !== 'REMOVED');
    if (membership) return true;
    if (c.joinMode === 'APPLY_TO_JOIN' && c.isAcceptingNewMembers !== false) return true;
    return false;
  });

  return jsonResponse(clubs);
}

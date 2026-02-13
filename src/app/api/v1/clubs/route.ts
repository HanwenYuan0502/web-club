import { NextRequest } from 'next/server';
import { getDb, saveDb, uuid, getUserFromToken, jsonResponse, errorResponse, type DbClub } from '@/app/api/_store/db';

export async function GET(req: NextRequest) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const db = getDb();
  const myClubIds = db.memberships
    .filter(m => m.userId === user.id && m.status !== 'REMOVED')
    .map(m => m.clubId);
  const clubs = db.clubs.filter(c => myClubIds.includes(c.id));

  return jsonResponse(clubs);
}

export async function POST(req: NextRequest) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const body = await req.json();
  if (!body.name?.trim()) return errorResponse(400, 'Club name is required');

  const db = getDb();
  const now = new Date().toISOString();

  const club: DbClub = {
    id: uuid(),
    name: body.name,
    description: body.description || undefined,
    type: body.type || 'CASUAL',
    levelsAccepted: body.levelsAccepted || [],
    location: body.location || undefined,
    rules: body.rules || undefined,
    joinMode: body.joinMode || 'APPLY_TO_JOIN',
    isAcceptingNewMembers: body.isAcceptingNewMembers ?? true,
    activeMemberLimit: body.activeMemberLimit || null,
    createdAt: now,
    updatedAt: now,
  };

  db.clubs.push(club);

  // Creator becomes ADMIN
  db.memberships.push({
    id: uuid(),
    userId: user.id,
    clubId: club.id,
    role: 'ADMIN',
    status: 'ACTIVE',
    showPhoneToMembers: false,
    showEmailToMembers: false,
    createdAt: now,
  });

  saveDb(db);
  return jsonResponse(club, 201);
}

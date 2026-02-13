import { NextRequest } from 'next/server';
import { getDb, saveDb, getUserFromToken, jsonResponse, errorResponse } from '@/app/api/_store/db';

export async function GET(req: NextRequest) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { createdAt, ...profile } = user;
  return jsonResponse(profile);
}

export async function PATCH(req: NextRequest) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const body = await req.json();
  const db = getDb();
  const idx = db.users.findIndex(u => u.id === user.id);
  if (idx === -1) return errorResponse(404, 'User not found');

  const { firstName, lastName, nickname, email, language } = body;

  if (email && email !== user.email && db.users.find(u => u.email === email && u.id !== user.id)) {
    return errorResponse(409, 'Email already in use');
  }

  if (firstName !== undefined) db.users[idx].firstName = firstName;
  if (lastName !== undefined) db.users[idx].lastName = lastName;
  if (nickname !== undefined) db.users[idx].nickname = nickname;
  if (email !== undefined) db.users[idx].email = email;
  if (language !== undefined) db.users[idx].language = language;

  saveDb(db);

  const { createdAt, ...profile } = db.users[idx];
  return jsonResponse(profile);
}

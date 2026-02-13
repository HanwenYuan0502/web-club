import { NextRequest } from 'next/server';
import { getDb, saveDb, uuid, jsonResponse, errorResponse, type DbUser } from '@/app/api/_store/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, firstName, lastName, nickname, email, dateOfBirth, gender, referrer, language } = body;

  if (!phone || typeof phone !== 'string') {
    return errorResponse(400, 'Phone number is required');
  }
  if (!/^\+[1-9]\d{6,14}$/.test(phone)) {
    return errorResponse(400, 'Invalid phone format. Must be E.164 (e.g., +1234567890)');
  }

  const db = getDb();

  if (db.users.find(u => u.phone === phone)) {
    return errorResponse(409, 'Phone number already registered');
  }
  if (email && db.users.find(u => u.email === email)) {
    return errorResponse(409, 'Email already in use');
  }
  if (gender && !['male', 'female'].includes(gender)) {
    return errorResponse(400, 'Gender must be "male" or "female"');
  }

  const user: DbUser = {
    id: uuid(),
    phone,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    nickname: nickname || undefined,
    email: email || undefined,
    dateOfBirth: dateOfBirth || undefined,
    gender: gender || undefined,
    referrer: referrer || undefined,
    language: language || 'en',
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  saveDb(db);

  const { createdAt, ...profile } = user;
  return jsonResponse(profile, 201);
}

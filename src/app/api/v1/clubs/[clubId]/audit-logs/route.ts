import { NextRequest } from 'next/server';
import { getDb, getUserFromToken, jsonResponse, errorResponse } from '@/app/api/_store/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ clubId: string }> }) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await params;
  const db = getDb();

  const membership = db.memberships.find(m => m.userId === user.id && m.clubId === clubId && m.role === 'ADMIN');
  if (!membership) return errorResponse(403, 'Admin access required');

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const eventCategory = searchParams.get('eventCategory');
  const result = searchParams.get('result');
  const correlationId = searchParams.get('correlationId');
  const createdAfter = searchParams.get('createdAfter');
  const createdBefore = searchParams.get('createdBefore');

  let logs = (db.auditLogs || [])
    .filter(l => l.clubId === clubId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (eventCategory) logs = logs.filter(l => l.eventCategory === eventCategory);
  if (result) logs = logs.filter(l => l.result === result);
  if (correlationId) logs = logs.filter(l => l.correlationId === correlationId);
  if (createdAfter) logs = logs.filter(l => new Date(l.createdAt) >= new Date(createdAfter));
  if (createdBefore) logs = logs.filter(l => new Date(l.createdAt) <= new Date(createdBefore));

  const page = logs.slice(offset, offset + limit);

  return jsonResponse(page);
}

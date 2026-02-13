import { NextRequest } from 'next/server';
import { getDb, getUserFromToken, jsonResponse, errorResponse } from '@/app/api/_store/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ clubId: string }> }) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  const { clubId } = await params;
  const db = getDb();

  const membership = db.memberships.find(m => m.userId === user.id && m.clubId === clubId && m.role === 'ADMIN');
  if (!membership) return errorResponse(403, 'Admin access required');

  const body = await req.json().catch(() => ({}));
  const pageSize = body.pageSize || 20;
  const pageToken = body.pageToken || '';

  let logs = (db.auditLogs || [])
    .filter(l => l.clubId === clubId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (body.eventCategory) {
    logs = logs.filter(l => l.eventCategory === body.eventCategory);
  }

  let startIdx = 0;
  if (pageToken) {
    startIdx = logs.findIndex(l => l.id === pageToken);
    if (startIdx === -1) startIdx = 0;
    else startIdx += 1;
  }

  const page = logs.slice(startIdx, startIdx + pageSize);
  const nextPageToken = page.length === pageSize && startIdx + pageSize < logs.length ? page[page.length - 1].id : '';

  return jsonResponse({
    items: page,
    nextPageToken,
  });
}

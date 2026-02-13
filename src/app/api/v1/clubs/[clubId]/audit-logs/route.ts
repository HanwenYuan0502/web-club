import { NextRequest } from 'next/server';
import { getUserFromToken, jsonResponse, errorResponse } from '@/app/api/_store/db';

type Ctx = { params: Promise<{ clubId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = getUserFromToken(req.headers.get('authorization'));
  if (!user) return errorResponse(401, 'Unauthorized');

  // Return empty audit logs for local mock
  return jsonResponse({ items: [], nextPageToken: '' });
}

import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for API routes
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // requests per window
const RATE_WINDOW = 60_000; // 1 minute

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit API routes only
  if (pathname.startsWith('/api/')) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = `${ip}:${pathname}`;
    if (isRateLimited(key)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
  }

  const res = NextResponse.next();

  // CSP header for all responses
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://sandbox.api.badmintonclub.ai https://api.badmintonclub.ai",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads/).*)'],
};

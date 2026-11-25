import { NextRequest, NextResponse } from 'next/server';
import { revokeRefreshToken } from '@/lib/oauth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const form = new URLSearchParams(await request.text());
  const token = form.get('token');
  if (token) await revokeRefreshToken(token);
  return new NextResponse(null, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}

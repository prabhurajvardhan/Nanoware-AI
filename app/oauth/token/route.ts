import { NextRequest, NextResponse } from 'next/server';
import { exchangeAuthorizationCode, refreshAccessToken } from '@/lib/oauth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function formBody(request: NextRequest) {
  const body = await request.text();
  return new URLSearchParams(body);
}

export async function POST(request: NextRequest) {
  try {
    const form = await formBody(request);
    const grantType = form.get('grant_type');
    const clientId = form.get('client_id') || '';
    const result = grantType === 'authorization_code'
      ? await exchangeAuthorizationCode({ code: form.get('code') || '', clientId, redirectUri: form.get('redirect_uri') || '', codeVerifier: form.get('code_verifier') || '' })
      : grantType === 'refresh_token'
        ? await refreshAccessToken({ refreshToken: form.get('refresh_token') || '', clientId })
        : null;
    if (!result) return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } });
  } catch {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
}

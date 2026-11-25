import { NextRequest, NextResponse } from 'next/server';
import { AuthBoundaryError, getVerifiedSession } from '@/lib/auth/server';
import { createAuthorizationCode, getClient, normalizeScope, validateRedirectUri } from '@/lib/oauth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorResponse(error: string, status = 400) {
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getVerifiedSession();
    const body = await request.json() as { action?: string; client_id?: string; redirect_uri?: string; state?: string; scope?: string; code_challenge?: string; code_challenge_method?: string };
    const clientId = body.client_id || '';
    const redirectUri = body.redirect_uri || '';
    const client = await getClient(clientId);
    if (!client || !validateRedirectUri(redirectUri, client.redirect_uris)) return errorResponse('invalid_request');
    const callback = new URL(redirectUri);
    if (body.state) callback.searchParams.set('state', body.state);
    if (body.action === 'deny') {
      callback.searchParams.set('error', 'access_denied');
      callback.searchParams.set('error_description', 'The user denied connector access.');
      return NextResponse.json({ redirect_uri: callback.toString() }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (body.action !== 'authorize') return errorResponse('invalid_request');
    const scope = normalizeScope(body.scope);
    const code = await createAuthorizationCode({ clientId, userId: session.uid, redirectUri, scope, codeChallenge: body.code_challenge || '', codeChallengeMethod: body.code_challenge_method || '' });
    callback.searchParams.set('code', code);
    return NextResponse.json({ redirect_uri: callback.toString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof AuthBoundaryError) return errorResponse('unauthorized', 401);
    return errorResponse(error instanceof Error ? error.message : 'invalid_request');
  }
}

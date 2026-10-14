import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/server';
import { enforceRateLimit, rateLimitResponse, trustedClientKey } from '@/lib/security/rate-limit';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};

const MAX_BODY_BYTES = 24_000;

async function readBody(request: NextRequest) {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(trustedClientKey(request, 'session'), 10, 15 * 60 * 1000);
    const body: unknown = JSON.parse(await readBody(request));
    const idToken = body && typeof body === 'object' && 'idToken' in body && typeof body.idToken === 'string'
      ? body.idToken : '';
    if (!idToken || idToken.length > 20_000) return NextResponse.json({ error: 'Invalid session token.' }, { status: 400 });

    const adminAuth = getAuth(getFirebaseAdminApp());
    await adminAuth.verifyIdToken(idToken, true);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_SECONDS * 1000 });
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, sessionCookie, cookieOptions);
    return response;
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    if (error instanceof Error && error.message === 'BODY_TOO_LARGE') {
      return NextResponse.json({ error: 'Request body too large.' }, { status: 413 });
    }
    console.error('Session creation failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to establish a session.' }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionCookie) {
    try {
      const decoded = await getAuth(getFirebaseAdminApp()).verifySessionCookie(sessionCookie, false);
      await getAuth(getFirebaseAdminApp()).revokeRefreshTokens(decoded.uid);
    } catch {
      // Clearing a malformed/expired cookie remains safe and idempotent.
    }
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return response;
}

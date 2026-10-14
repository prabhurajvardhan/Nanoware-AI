import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { getAuth } from 'firebase-admin/auth';
import { FirebaseAdminConfigurationError, getFirebaseAdminApp } from '@/lib/firebase-admin';
import { MFA_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/server';
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

function firebaseErrorCode(error: unknown) {
  return error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' ? error.code : '';
}

function isInvalidCredential(error: unknown) {
  return ['auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-id-token', 'auth/argument-error', 'auth/user-disabled'].includes(firebaseErrorCode(error));
}

function response(body: Record<string, unknown>, status: number, requestId: string) {
  const result = NextResponse.json(body, { status });
  result.headers.set('x-request-id', requestId);
  return result;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    await enforceRateLimit(trustedClientKey(request, 'session'), 10, 15 * 60 * 1000);
    let body: unknown;
    try { body = JSON.parse(await readBody(request)); }
    catch (error) {
      if (error instanceof Error && error.message === 'BODY_TOO_LARGE') return response({ error: 'Request body too large.' }, 413, requestId);
      return response({ error: 'Invalid request.' }, 400, requestId);
    }
    const idToken = body && typeof body === 'object' && 'idToken' in body && typeof body.idToken === 'string' ? body.idToken : '';
    if (!idToken || idToken.length > 20_000) return response({ error: 'Invalid session token.' }, 400, requestId);
    const adminAuth = getAuth(getFirebaseAdminApp());
    await adminAuth.verifyIdToken(idToken, true);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_SECONDS * 1000 });
    const result = response({ success: true }, 200, requestId);
    result.cookies.set(SESSION_COOKIE, sessionCookie, cookieOptions);
    return result;
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) { limited.headers.set('x-request-id', requestId); return limited; }
    if (error instanceof FirebaseAdminConfigurationError) {
      console.error('Session infrastructure configuration failure:', error.code, requestId);
      return response({ error: 'Authentication service is temporarily unavailable.' }, 503, requestId);
    }
    if (isInvalidCredential(error)) return response({ error: 'Authentication failed.' }, 401, requestId);
    console.error('Session provider failure:', firebaseErrorCode(error) || 'unknown', requestId);
    return response({ error: 'Authentication service is temporarily unavailable.' }, 503, requestId);
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  const result = NextResponse.json({ success: true });
  result.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  result.cookies.set(MFA_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return result;
}

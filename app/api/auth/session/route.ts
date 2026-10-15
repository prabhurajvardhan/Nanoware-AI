import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { acquireLocalConcurrency, rateLimitResponse } from '@/lib/security/concurrency.mjs';
import { MFA_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/constants';
import { sessionErrorDetails } from '@/lib/auth/session-diagnostics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};
const MAX_BODY_BYTES = 24_000;
const MAX_RECENT_SIGN_IN_AGE_SECONDS = 5 * 60;

type SessionFailure = { code?: unknown; name?: unknown };

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
  const value = error as SessionFailure;
  return typeof value?.code === 'string' ? value.code : '';
}

function isConfigurationFailure(error: unknown) {
  const value = error as SessionFailure;
  return value?.name === 'FirebaseAdminConfigurationError'
    || ['FIREBASE_SERVICE_ACCOUNT_JSON_MISSING', 'FIREBASE_SERVICE_ACCOUNT_JSON_INVALID', 'FIREBASE_PROJECT_MISMATCH'].includes(firebaseErrorCode(error));
}

function isInvalidCredential(error: unknown) {
  return ['auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-id-token', 'auth/argument-error', 'auth/user-disabled'].includes(firebaseErrorCode(error));
}

function isSameOrigin(request: NextRequest) {
  const expectedOrigin = request.nextUrl.origin;
  const suppliedOrigin = request.headers.get('origin');
  if (suppliedOrigin) return suppliedOrigin === expectedOrigin;
  const referer = request.headers.get('referer');
  if (referer) {
    try { return new URL(referer).origin === expectedOrigin; } catch { return false; }
  }
  return true;
}

function trustedClientKey(request: NextRequest, scope: string, clientProof: string) {
  const forwarded = request.headers.get('x-forwarded-for');
  const trustedProxy = process.env.TRUSTED_PROXY_IP_HEADER === 'x-forwarded-for';
  const source = trustedProxy && forwarded ? forwarded.split(',')[0].trim() : '';
  if (source) return `${scope}:ip:${source}`;
  const proofHash = crypto.createHash('sha256').update(clientProof).digest('hex');
  return `${scope}:proof:${proofHash}`;
}

function response(body: Record<string, unknown>, status: number, requestId: string) {
  const result = NextResponse.json(body, { status });
  result.headers.set('x-request-id', requestId);
  return result;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  let stage = 'origin-check';
  let releaseConcurrency: (() => void) | undefined;
  let persistentRateLimitResponse: ((error: unknown) => Response | null) | undefined;
  try {
    if (!isSameOrigin(request)) return response({ error: 'Invalid request origin.' }, 403, requestId);

    let body: unknown;
    try { body = JSON.parse(await readBody(request)); }
    catch (error) {
      if (error instanceof Error && error.message === 'BODY_TOO_LARGE') return response({ error: 'Request body too large.' }, 413, requestId);
      return response({ error: 'Invalid request.' }, 400, requestId);
    }
    const idToken = body && typeof body === 'object' && 'idToken' in body && typeof body.idToken === 'string' ? body.idToken : '';
    if (!idToken || idToken.length > 20_000) return response({ error: 'Invalid session token.' }, 400, requestId);

    // Keep a cheap local guard available even if a serverless dependency cannot load.
    stage = 'local-concurrency-guard';
    releaseConcurrency = acquireLocalConcurrency();
    stage = 'rate-limit-module-load';
    const rateLimit = await import('@/lib/security/rate-limit');
    persistentRateLimitResponse = rateLimit.rateLimitResponse;
    stage = 'rate-limit-check';
    await rateLimit.enforceRateLimit(trustedClientKey(request, 'session', idToken), 10, 15 * 60 * 1000);

    // Load Firebase Admin only inside the request boundary so initialization failures are observable JSON errors.
    stage = 'firebase-admin-module-load';
    const [{ getAuth }, { getFirebaseAdminApp }] = await Promise.all([
      import('firebase-admin/auth'),
      import('@/lib/firebase-admin'),
    ]);
    stage = 'firebase-admin-initialize';
    const adminAuth = getAuth(getFirebaseAdminApp());
    stage = 'verify-id-token';
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    if (!decoded.auth_time || Math.floor(Date.now() / 1000) - decoded.auth_time > MAX_RECENT_SIGN_IN_AGE_SECONDS) {
      return response({ error: 'Recent sign-in required.' }, 401, requestId);
    }
    stage = 'create-session-cookie';
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_SECONDS * 1000 });
    stage = 'write-session-cookie';
    const result = response({ success: true }, 200, requestId);
    result.cookies.set(SESSION_COOKIE, sessionCookie, cookieOptions);
    return result;
  } catch (error) {
    const limited = persistentRateLimitResponse?.(error) ?? rateLimitResponse(error);
    if (limited) { limited.headers.set('x-request-id', requestId); return limited; }
    if (isConfigurationFailure(error)) {
      console.error('Session infrastructure configuration failure:', firebaseErrorCode(error) || 'unknown', requestId);
      return response({ error: 'Authentication service is temporarily unavailable.' }, 503, requestId);
    }
    if (isInvalidCredential(error)) return response({ error: 'Authentication failed.' }, 401, requestId);
    console.error('Session provider failure', {
      requestId,
      stage,
      ...sessionErrorDetails(error),
    });
    return response({ error: 'Authentication service is temporarily unavailable.' }, 503, requestId);
  } finally {
    releaseConcurrency?.();
  }
}

export async function DELETE() {
  const result = NextResponse.json({ success: true });
  result.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  result.cookies.set(MFA_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return result;
}

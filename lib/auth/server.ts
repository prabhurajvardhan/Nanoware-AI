import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb, getFirebaseAdminApp } from '@/lib/firebase-admin';
import { MFA_COOKIE, SESSION_COOKIE } from './constants';

// Re-exported so existing importers keep working; the constants themselves live in a dependency-free module.
export { MFA_COOKIE, MFA_MAX_AGE_SECONDS, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from './constants';

export class AuthBoundaryError extends Error {
  constructor(public readonly code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'MFA_REQUIRED') {
    super(code);
    this.name = 'AuthBoundaryError';
  }
}

export async function getVerifiedSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) throw new AuthBoundaryError('UNAUTHENTICATED');

  try {
    return await getAuth(getFirebaseAdminApp()).verifySessionCookie(session, true);
  } catch {
    throw new AuthBoundaryError('UNAUTHENTICATED');
  }
}

export async function requireAdminActor(options: { requireMfa?: boolean } = {}) {
  const decoded = await getVerifiedSession();
  const adminDoc = await getAdminDb().collection('admins').doc(decoded.uid).get();
  if (!adminDoc.exists) throw new AuthBoundaryError('FORBIDDEN');

  if (options.requireMfa) {
    const cookieStore = await cookies();
    const mfaToken = cookieStore.get(MFA_COOKIE)?.value;
    if (!mfaToken || !/^[a-f0-9]{64}$/.test(mfaToken)) throw new AuthBoundaryError('MFA_REQUIRED');
    const session = await getAdminDb().collection('admin_mfa_sessions').doc(hash(mfaToken)).get();
    const data = session.data();
    if (!session.exists || data?.uid !== decoded.uid || Number(data.expiresAt || 0) <= Date.now()) {
      throw new AuthBoundaryError('MFA_REQUIRED');
    }
  }

  return decoded;
}

export function createMfaToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthBoundaryError) {
    if (error.code === 'MFA_REQUIRED') return { code: error.code, message: 'Additional verification required.' };
    return { code: error.code, message: error.code === 'FORBIDDEN' ? 'Forbidden.' : 'Authentication required.' };
  }
  return { code: 'INTERNAL_ERROR', message: 'Unable to complete the request.' };
}

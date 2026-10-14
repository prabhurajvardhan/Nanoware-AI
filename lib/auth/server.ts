import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb, getFirebaseAdminApp } from '@/lib/firebase-admin';

export const SESSION_COOKIE = '__session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export class AuthBoundaryError extends Error {
  constructor(public readonly code: 'UNAUTHENTICATED' | 'FORBIDDEN') {
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

export async function requireAdminActor() {
  const decoded = await getVerifiedSession();
  const adminDoc = await getAdminDb().collection('admins').doc(decoded.uid).get();
  if (!adminDoc.exists) throw new AuthBoundaryError('FORBIDDEN');
  return decoded;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthBoundaryError) {
    return { code: error.code, message: error.code === 'FORBIDDEN' ? 'Forbidden.' : 'Authentication required.' };
  }
  return { code: 'INTERNAL_ERROR', message: 'Unable to complete the request.' };
}

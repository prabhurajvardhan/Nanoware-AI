import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { AuthBoundaryError, requireAdminActor } from '@/lib/auth/server';

export async function GET() {
  try {
    await requireAdminActor({ requireMfa: true });
    const snapshot = await getAdminDb().collection('serviceRequests').orderBy('createdAt', 'desc').limit(100).get();
    return NextResponse.json({ requests: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) {
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code === 'MFA_REQUIRED' ? 'Additional verification required.' : 'Unauthorized.' }, { status: error.code === 'MFA_REQUIRED' ? 403 : 401 });
    console.error('Admin service-request listing failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to load service requests.' }, { status: 500 });
  }
}

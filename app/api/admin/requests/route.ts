import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdminActor, AuthBoundaryError } from '@/lib/auth/server';

export async function GET() {
  try {
    await requireAdminActor({ requireMfa: true });
    const snapshot = await getAdminDb().collection('requests').orderBy('createdAt', 'desc').limit(100).get();
    const requests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ requests });
  } catch (error) {
    if (error instanceof AuthBoundaryError) {
      return NextResponse.json({ error: error.code === 'MFA_REQUIRED' ? 'Additional verification required.' : 'Unauthorized.' }, { status: error.code === 'MFA_REQUIRED' ? 403 : 401 });
    }
    console.error('Admin request listing failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to load requests.' }, { status: 500 });
  }
}

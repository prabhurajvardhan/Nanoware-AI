import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { AuthBoundaryError, requireAdminActor } from '@/lib/auth/server';

const transitions: Record<string, string[]> = {
  Submitted: ['Under Review', 'Cancelled'],
  'Under Review': ['Proposal Sent', 'Cancelled'],
  'Proposal Sent': ['Accepted', 'In Progress', 'Cancelled'],
  Accepted: ['In Progress', 'Cancelled'],
  'In Progress': ['Awaiting Customer', 'Completed', 'Cancelled'],
  'Awaiting Customer': ['In Progress', 'Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const admin = await requireAdminActor({ requireMfa: true });
    const { requestId } = await params;
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(requestId)) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    const body = await request.json();
    const status = typeof body?.status === 'string' ? body.status : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!Object.hasOwn(transitions, status) || message.length > 1000) return NextResponse.json({ error: 'Invalid status or update message.' }, { status: 400 });
    const ref = getAdminDb().collection('serviceRequests').doc(requestId);
    let updated = false;
    await getAdminDb().runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) return;
      const current = String(doc.data()?.status || '');
      if (!transitions[current]?.includes(status) && current !== status) throw new Error('INVALID_STATUS_TRANSITION');
      const updates = message ? FieldValue.arrayUnion({ message, createdAt: new Date(), createdBy: admin.uid }) : undefined;
      tx.update(ref, { status, updatedAt: FieldValue.serverTimestamp(), ...(updates ? { updates } : {}) });
      updated = true;
    });
    if (!updated) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    return NextResponse.json({ updated: true, requestId, status });
  } catch (error) {
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code === 'MFA_REQUIRED' ? 'Additional verification required.' : 'Unauthorized.' }, { status: error.code === 'MFA_REQUIRED' ? 403 : 401 });
    if (error instanceof Error && error.message === 'INVALID_STATUS_TRANSITION') return NextResponse.json({ error: 'That status transition is not allowed.' }, { status: 409 });
    console.error('Admin service-request update failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to update the service request.' }, { status: 500 });
  }
}

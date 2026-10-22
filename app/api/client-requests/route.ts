import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { AuthBoundaryError, requireEmailVerifiedSession } from '@/lib/auth/server';
import { clientServices } from '@/lib/client-services';
import { enforceRateLimit, rateLimitResponse } from '@/lib/security/rate-limit';

const MAX_DETAILS = 4000;
function respondError(error: unknown) {
  if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
  console.error('Client service request failed:', error instanceof Error ? error.message : 'unknown error');
  return NextResponse.json({ error: 'Unable to complete the service request.' }, { status: 500 });
}

export async function GET() {
  try {
    const session = await requireEmailVerifiedSession();
    const snapshot = await getAdminDb().collection('serviceRequests').where('userId', '==', session.uid).orderBy('createdAt', 'desc').limit(100).get();
    return NextResponse.json({ requests: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) { return respondError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireEmailVerifiedSession();
    await enforceRateLimit(`client-service-request:${session.uid}`, 10, 60 * 60 * 1000);
    const body = await request.json();
    const idempotencyKey = typeof body?.idempotencyKey === 'string' ? body.idempotencyKey : '';
    const serviceId = typeof body?.serviceId === 'string' ? body.serviceId : '';
    const service = clientServices.find((item) => item.id === serviceId)?.name || '';
    const details = typeof body?.details === 'string' ? body.details.trim() : '';
    const contactName = typeof body?.contactName === 'string' ? body.contactName.trim() : '';
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey) || !service || !contactName || contactName.length > 100 || !details || details.length > MAX_DETAILS) {
      return NextResponse.json({ error: 'Provide a service, contact name, and project brief (up to 4,000 characters).' }, { status: 400 });
    }
    const db = getAdminDb();
    const keyHash = crypto.createHash('sha256').update(`${session.uid}:${idempotencyKey}`).digest('hex');
    const keyRef = db.collection('service_request_idempotency').doc(keyHash);
    const requestRef = db.collection('serviceRequests').doc();
    let requestId = '';
    let created = false;
    await db.runTransaction(async (tx) => {
      const existing = await tx.get(keyRef);
      const fingerprint = crypto.createHash('sha256').update(JSON.stringify({ service, contactName, details })).digest('hex');
      if (existing.exists) {
        if (existing.data()?.fingerprint !== fingerprint) throw new Error('IDEMPOTENCY_CONFLICT');
        requestId = String(existing.data()?.requestId || '');
        return;
      }
      tx.create(requestRef, {
        userId: session.uid,
        contactEmail: session.email || null,
        contactName,
        service,
        details,
        status: 'Submitted',
        reference: `NW-${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updates: [],
      });
      tx.create(keyRef, { requestId: requestRef.id, fingerprint, createdAt: FieldValue.serverTimestamp() });
      requestId = requestRef.id;
      created = true;
    });
    if (!requestId) return NextResponse.json({ error: 'Unable to register this request.' }, { status: 500 });
    return NextResponse.json({ requestId, created }, { status: created ? 201 : 200 });
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    if (error instanceof Error && error.message === 'IDEMPOTENCY_CONFLICT') return NextResponse.json({ error: 'This request key was already used for different information.' }, { status: 409 });
    return respondError(error);
  }
}

import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireBusinessActor } from '@/lib/tenant/server';
import { AuthBoundaryError } from '@/lib/auth/server';
import { CustomerValidationError, normalizeCustomerContact } from '@/lib/crm/customer.mjs';
import { validateCustomerInput } from '@/lib/workspace/records.mjs';
import { enforceRateLimit, rateLimitResponse } from '@/lib/security/rate-limit';
import { assertTrialActive } from '@/lib/billing/trial';
import { trialExpiredResponse } from '@/lib/billing/trial-response';

function contactKey(businessId: string, contact: { email?: string | null; phone?: string | null }) {
  const normalized = normalizeCustomerContact({ email: contact.email ?? undefined, phone: contact.phone ?? undefined });
  return crypto.createHash('sha256').update(`${businessId}\0${normalized.email ?? normalized.phone}`).digest('hex');
}
function error(error: unknown) {
  const expired = trialExpiredResponse(error);
  if (expired) return expired;
  const limited = rateLimitResponse(error);
  if (limited) return limited;
  if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
  if (error instanceof TypeError) return NextResponse.json({ error: error.message }, { status: 400 });
  if (error instanceof CustomerValidationError) return NextResponse.json({ error: error.code }, { status: 400 });
  console.error('Workspace customer request failed:', error instanceof Error ? error.message : 'unknown error');
  return NextResponse.json({ error: 'Unable to complete the customer request.' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId') || undefined;
    const actor = await requireBusinessActor(['owner', 'admin', 'member'], businessId);
    assertTrialActive(actor.business.subscription);
    const includeArchived = request.nextUrl.searchParams.get('archived') === 'true';
    const db = getAdminDb();
    let query = db.collection('customers').where('businessId', '==', actor.businessId).orderBy('updatedAt', 'desc').limit(100);
    if (!includeArchived) query = query.where('archivedAt', '==', null) as typeof query;
    const snapshot = await query.get();
    return NextResponse.json({ customers: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })), businessId: actor.businessId });
  } catch (cause) { return error(cause); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body?.businessId !== 'string') return NextResponse.json({ error: 'Business workspace is required.' }, { status: 400 });
    const actor = await requireBusinessActor(['owner', 'admin'], body.businessId);
    assertTrialActive(actor.business.subscription);
    await enforceRateLimit(`crm-create:${actor.businessId}:${actor.uid}`, 100, 60 * 60 * 1000);
    const customer = validateCustomerInput(body);
    const db = getAdminDb();
    const keyId = contactKey(actor.businessId, customer.contact);
    const keyRef = db.collection('customer_contact_keys').doc(keyId);
    let outcome: { id: string; created: boolean } | null = null;
    const newCustomerRef = db.collection('customers').doc();
    await db.runTransaction(async (transaction) => {
      const keyDoc = await transaction.get(keyRef);
      if (keyDoc.exists) {
        const existingId = keyDoc.data()?.customerId;
        if (typeof existingId !== 'string') throw new Error('CUSTOMER_KEY_CORRUPT');
        const existingRef = db.collection('customers').doc(existingId);
        const existingDoc = await transaction.get(existingRef);
        if (!existingDoc.exists || existingDoc.data()?.businessId !== actor.businessId) throw new Error('CUSTOMER_KEY_CORRUPT');
        outcome = { id: existingId, created: false };
        return;
      }
      transaction.create(newCustomerRef, { ...customer, businessId: actor.businessId, createdBy: actor.uid, archivedAt: null, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      transaction.create(keyRef, { businessId: actor.businessId, customerId: newCustomerRef.id, createdAt: FieldValue.serverTimestamp() });
      transaction.create(newCustomerRef.collection('history').doc(), { businessId: actor.businessId, customerId: newCustomerRef.id, kind: 'customer_created', createdAt: FieldValue.serverTimestamp(), actorId: actor.uid });
      outcome = { id: newCustomerRef.id, created: true };
    });
    return NextResponse.json({ customerId: outcome!.id, created: outcome!.created }, { status: outcome!.created ? 201 : 200 });
  } catch (cause) { return error(cause); }
}

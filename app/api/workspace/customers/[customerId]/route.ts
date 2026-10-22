import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { AuthBoundaryError } from '@/lib/auth/server';
import { requireBusinessActor } from '@/lib/tenant/server';
import { CustomerValidationError, normalizeCustomerContact } from '@/lib/crm/customer.mjs';
import { validateCustomerInput } from '@/lib/workspace/records.mjs';
import { assertTrialActive } from '@/lib/billing/trial';
import { trialExpiredResponse } from '@/lib/billing/trial-response';

function keyId(businessId: string, contact: { email?: string | null; phone?: string | null }) {
  const normalized = normalizeCustomerContact({ email: contact.email ?? undefined, phone: contact.phone ?? undefined });
  return crypto.createHash('sha256').update(`${businessId}\0${normalized.email ?? normalized.phone}`).digest('hex');
}
function fail(error: unknown) {
  const expired = trialExpiredResponse(error);
  if (expired) return expired;
  if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
  if (error instanceof TypeError) return NextResponse.json({ error: error.message }, { status: 400 });
  if (error instanceof CustomerValidationError) return NextResponse.json({ error: error.code }, { status: 400 });
  if (error instanceof Error && error.message === 'CUSTOMER_NOT_FOUND') return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  if (error instanceof Error && error.message === 'CONTACT_IN_USE') return NextResponse.json({ error: 'That contact is already linked to another customer.' }, { status: 409 });
  console.error('Workspace customer update failed:', error instanceof Error ? error.message : 'unknown error');
  return NextResponse.json({ error: 'Unable to update the customer.' }, { status: 500 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    const { customerId } = await params;
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(customerId)) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    const body = await request.json();
    if (typeof body?.businessId !== 'string') return NextResponse.json({ error: 'Business workspace is required.' }, { status: 400 });
    const actor = await requireBusinessActor(['owner', 'admin'], body.businessId);
    assertTrialActive(actor.business.subscription);
    const customer = validateCustomerInput(body);
    const db = getAdminDb();
    const ref = db.collection('customers').doc(customerId);
    const nextRef = db.collection('customer_contact_keys').doc(keyId(actor.businessId, customer.contact));
    await db.runTransaction(async (tx) => {
      const existing = await tx.get(ref);
      if (!existing.exists || existing.data()?.businessId !== actor.businessId) throw new Error('CUSTOMER_NOT_FOUND');
      const existingData = existing.data()!;
      if (existingData.archivedAt) throw new Error('CUSTOMER_NOT_FOUND');
      const oldContact = normalizeCustomerContact(existingData.contact || {});
      const oldRef = db.collection('customer_contact_keys').doc(keyId(actor.businessId, oldContact));
      const [oldKey, newKey] = await Promise.all([tx.get(oldRef), tx.get(nextRef)]);
      if (newKey.exists && newKey.data()?.customerId !== customerId) throw new Error('CONTACT_IN_USE');
      tx.update(ref, { ...customer, updatedAt: FieldValue.serverTimestamp() });
      tx.create(ref.collection('history').doc(), { businessId: actor.businessId, customerId, kind: 'customer_updated', createdAt: FieldValue.serverTimestamp(), actorId: actor.uid });
      if (oldRef.path !== nextRef.path) {
        if (oldKey.exists && oldKey.data()?.customerId === customerId) tx.delete(oldRef);
        tx.set(nextRef, { businessId: actor.businessId, customerId, updatedAt: FieldValue.serverTimestamp() });
      }
    });
    return NextResponse.json({ updated: true, customerId });
  } catch (cause) { return fail(cause); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    const { customerId } = await params;
    const businessId = request.nextUrl.searchParams.get('businessId');
    if (!businessId || !/^[A-Za-z0-9_-]{16,128}$/.test(customerId)) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    const actor = await requireBusinessActor(['owner', 'admin'], businessId);
    assertTrialActive(actor.business.subscription);
    const db = getAdminDb();
    const ref = db.collection('customers').doc(customerId);
    await db.runTransaction(async (tx) => {
      const existing = await tx.get(ref);
      if (!existing.exists || existing.data()?.businessId !== actor.businessId) throw new Error('CUSTOMER_NOT_FOUND');
      const oldContact = normalizeCustomerContact(existing.data()?.contact || {});
      const oldRef = db.collection('customer_contact_keys').doc(keyId(actor.businessId, oldContact));
      const oldKey = await tx.get(oldRef);
      tx.update(ref, { archivedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      if (oldKey.exists && oldKey.data()?.customerId === customerId) tx.delete(oldRef);
      tx.create(ref.collection('history').doc(), { businessId: actor.businessId, customerId, kind: 'customer_archived', createdAt: FieldValue.serverTimestamp(), actorId: actor.uid });
    });
    return NextResponse.json({ archived: true, customerId });
  } catch (cause) { return fail(cause); }
}

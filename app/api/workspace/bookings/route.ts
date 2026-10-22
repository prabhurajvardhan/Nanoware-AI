import crypto from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { AuthBoundaryError } from '@/lib/auth/server';
import { requireBusinessActor } from '@/lib/tenant/server';
import { assertWithinBusinessHours, bookingSlotIds, validateBookingInput } from '@/lib/workspace/records.mjs';
import { enforceRateLimit, rateLimitResponse } from '@/lib/security/rate-limit';
import { assertTrialActive } from '@/lib/billing/trial';
import { trialExpiredResponse } from '@/lib/billing/trial-response';

function digest(value: string) { return crypto.createHash('sha256').update(value).digest('hex'); }
function fail(error: unknown) {
  const expired = trialExpiredResponse(error);
  if (expired) return expired;
  const limited = rateLimitResponse(error);
  if (limited) return limited;
  if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
  if (error instanceof TypeError) return NextResponse.json({ error: error.message }, { status: 400 });
  if (error instanceof Error && error.message === 'BOOKING_SLOT_UNAVAILABLE') return NextResponse.json({ error: 'That time conflicts with an existing booking.' }, { status: 409 });
  if (error instanceof Error && error.message === 'CUSTOMER_NOT_FOUND') return NextResponse.json({ error: 'Customer not found in this workspace.' }, { status: 404 });
  if (error instanceof Error && error.message === 'IDEMPOTENCY_CONFLICT') return NextResponse.json({ error: 'This idempotency key was already used for different booking details.' }, { status: 409 });
  console.error('Workspace booking request failed:', error instanceof Error ? error.message : 'unknown error');
  return NextResponse.json({ error: 'Unable to complete the booking request.' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireBusinessActor(['owner', 'admin', 'member'], request.nextUrl.searchParams.get('businessId') || undefined);
    assertTrialActive(actor.business.subscription);
    const snapshot = await getAdminDb().collection('bookingRequests').where('businessId', '==', actor.businessId).orderBy('startAt', 'desc').limit(100).get();
    return NextResponse.json({ bookings: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })), businessId: actor.businessId });
  } catch (cause) { return fail(cause); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body?.businessId !== 'string') return NextResponse.json({ error: 'Business workspace is required.' }, { status: 400 });
    const actor = await requireBusinessActor(['owner', 'admin'], body.businessId);
    assertTrialActive(actor.business.subscription);
    await enforceRateLimit(`booking-create:${actor.businessId}:${actor.uid}`, 200, 60 * 60 * 1000);
    const input = validateBookingInput(body);
    const db = getAdminDb();
    const businessRef = db.collection('businesses').doc(actor.businessId);
    const bookingRef = db.collection('bookingRequests').doc();
    const idempotencyRef = db.collection('booking_idempotency').doc(digest(`${actor.businessId}:${input.idempotencyKey}`));
    const slotIds = bookingSlotIds(actor.businessId, input.startAt, input.endAt);
    const locks = slotIds.map((id: string) => db.collection('booking_slot_locks').doc(id));
    const customerRef = input.customerId ? db.collection('customers').doc(input.customerId) : null;
    const customerHistoryRef = customerRef ? customerRef.collection('history').doc(bookingRef.id) : null;
    const fingerprint = digest(JSON.stringify({ service: input.service, startAt: input.startAt.toISOString(), durationMinutes: input.durationMinutes, timezone: input.timezone, customerId: input.customerId }));
    let result: { id: string; created: boolean };
    await db.runTransaction(async (tx) => {
      const previous = await tx.get(idempotencyRef);
      if (previous.exists) {
        const data = previous.data() || {};
        if (data.fingerprint !== fingerprint) throw new Error('IDEMPOTENCY_CONFLICT');
        result = { id: String(data.bookingId), created: false };
        return;
      }
      const readRefs = customerRef ? [businessRef, ...locks, customerRef] : [businessRef, ...locks];
      const docs = await Promise.all(readRefs.map((ref) => tx.get(ref)));
      const businessDoc = docs[0];
      const businessData = businessDoc.data() || {};
      const businessTimezone = typeof businessData.timezone === 'string' ? businessData.timezone : 'UTC';
      if (!businessDoc.exists || input.timezone !== businessTimezone) throw new TypeError('INVALID_TIMEZONE');
      assertWithinBusinessHours({ startAt: input.startAt, endAt: input.endAt, timezone: businessTimezone, weeklyHours: businessData.availabilityPolicy?.weeklyHours });
      if (customerRef) {
        const customerDoc = docs[docs.length - 1];
        if (!customerDoc.exists || customerDoc.data()?.businessId !== actor.businessId || customerDoc.data()?.archivedAt) throw new Error('CUSTOMER_NOT_FOUND');
      }
      if (docs.slice(1, 1 + locks.length).some((doc) => doc.exists)) throw new Error('BOOKING_SLOT_UNAVAILABLE');
      tx.create(bookingRef, {
        businessId: actor.businessId,
        customerId: input.customerId,
        service: input.service,
        startAt: Timestamp.fromDate(input.startAt),
        endAt: Timestamp.fromDate(input.endAt),
        durationMinutes: input.durationMinutes,
        timezone: input.timezone,
        status: 'confirmed',
        origin: 'manual',
        createdBy: actor.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        slotIds,
        availabilityPolicyVersion: businessData.availabilityPolicy?.version || null,
      });
      locks.forEach((ref) => tx.create(ref, { businessId: actor.businessId, bookingId: bookingRef.id, createdAt: FieldValue.serverTimestamp() }));
      if (customerHistoryRef) tx.create(customerHistoryRef, { businessId: actor.businessId, customerId: input.customerId, bookingId: bookingRef.id, kind: 'booking_created', service: input.service, startAt: Timestamp.fromDate(input.startAt), status: 'confirmed', origin: 'manual', createdAt: FieldValue.serverTimestamp() });
      tx.create(idempotencyRef, { businessId: actor.businessId, bookingId: bookingRef.id, fingerprint, createdAt: FieldValue.serverTimestamp() });
      result = { id: bookingRef.id, created: true };
    });
    return NextResponse.json({ bookingId: result!.id, created: result!.created }, { status: result!.created ? 201 : 200 });
  } catch (cause) { return fail(cause); }
}

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { AuthBoundaryError } from '@/lib/auth/server';
import { requireBusinessActor } from '@/lib/tenant/server';
import { canTransitionBooking } from '@/lib/booking/lifecycle.mjs';
import { assertWithinBusinessHours, bookingSlotIds, validateBookingInput } from '@/lib/workspace/records.mjs';
import { assertTrialActive } from '@/lib/billing/trial';
import { trialExpiredResponse } from '@/lib/billing/trial-response';

function responseError(error: unknown) {
  const expired = trialExpiredResponse(error);
  if (expired) return expired;
  if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
  if (error instanceof TypeError) return NextResponse.json({ error: error.message }, { status: 400 });
  if (error instanceof Error && error.message === 'BOOKING_NOT_FOUND') return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  if (error instanceof Error && error.message === 'BOOKING_SLOT_UNAVAILABLE') return NextResponse.json({ error: 'That time conflicts with an existing booking.' }, { status: 409 });
  if (error instanceof Error && error.message === 'INVALID_BOOKING_TRANSITION') return NextResponse.json({ error: 'That booking status change is not allowed.' }, { status: 409 });
  console.error('Workspace booking update failed:', error instanceof Error ? error.message : 'unknown error');
  return NextResponse.json({ error: 'Unable to update the booking.' }, { status: 500 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { bookingId } = await params;
    const body = await request.json();
    if (typeof body?.businessId !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(bookingId)) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    const actor = await requireBusinessActor(['owner', 'admin'], body.businessId);
    assertTrialActive(actor.business.subscription);
    const db = getAdminDb();
    const bookingRef = db.collection('bookingRequests').doc(bookingId);
    const status = typeof body.status === 'string' ? body.status : '';
    if (['cancelled', 'completed', 'no_show'].includes(status)) {
      await db.runTransaction(async (tx) => {
        const booking = await tx.get(bookingRef);
        if (!booking.exists || booking.data()?.businessId !== actor.businessId) throw new Error('BOOKING_NOT_FOUND');
        const data = booking.data()!;
        if (!canTransitionBooking(data.status, status)) throw new Error('INVALID_BOOKING_TRANSITION');
        const slotIds: string[] = Array.isArray(data.slotIds) ? data.slotIds : [];
        const lockRefs = slotIds.map((id) => db.collection('booking_slot_locks').doc(id));
        const locks = await Promise.all(lockRefs.map((ref) => tx.get(ref)));
        const customerRef = typeof data.customerId === 'string' ? db.collection('customers').doc(data.customerId) : null;
        const customerDoc = customerRef ? await tx.get(customerRef) : null;
        if (customerDoc && (!customerDoc.exists || customerDoc.data()?.businessId !== actor.businessId)) throw new Error('BOOKING_NOT_FOUND');
        tx.update(bookingRef, { status, updatedAt: FieldValue.serverTimestamp(), statusChangedBy: actor.uid });
        locks.forEach((lock, index) => { if (lock.exists && lock.data()?.bookingId === bookingId) tx.delete(lockRefs[index]); });
        if (customerRef) tx.create(customerRef.collection('history').doc(), { businessId: actor.businessId, customerId: customerRef.id, bookingId, kind: 'booking_status_changed', status, service: data.service, startAt: data.startAt, createdAt: FieldValue.serverTimestamp(), actorId: actor.uid });
      });
      return NextResponse.json({ updated: true, bookingId, status });
    }

    if (body.reschedule === true) {
      const booking = await bookingRef.get();
      if (!booking.exists || booking.data()?.businessId !== actor.businessId) throw new Error('BOOKING_NOT_FOUND');
      const old = booking.data()!;
      if (old.status !== 'confirmed') throw new Error('INVALID_BOOKING_TRANSITION');
      const input = validateBookingInput({ service: old.service, localStartAt: body.localStartAt, startAt: body.startAt, durationMinutes: body.durationMinutes ?? old.durationMinutes, timezone: actor.business.timezone || 'UTC', customerId: old.customerId, idempotencyKey: body.idempotencyKey });
      const newSlotIds: string[] = bookingSlotIds(actor.businessId, input.startAt, input.endAt);
      const oldSlotIds: string[] = Array.isArray(old.slotIds) ? old.slotIds : [];
      const newLocks = newSlotIds.map((id) => db.collection('booking_slot_locks').doc(id));
      const oldLocks = oldSlotIds.map((id) => db.collection('booking_slot_locks').doc(id));
      const businessRef = db.collection('businesses').doc(actor.businessId);
      await db.runTransaction(async (tx) => {
        const existing = await tx.get(bookingRef);
        if (!existing.exists || existing.data()?.businessId !== actor.businessId || existing.data()?.status !== 'confirmed') throw new Error('BOOKING_NOT_FOUND');
        const [businessDoc, ...checkLocks] = await Promise.all([businessRef, ...newLocks].map((ref) => tx.get(ref)));
        const businessData = businessDoc.data() || {};
        const timezone = typeof businessData.timezone === 'string' ? businessData.timezone : 'UTC';
        if (!businessDoc.exists || input.timezone !== timezone) throw new TypeError('INVALID_TIMEZONE');
        assertWithinBusinessHours({ startAt: input.startAt, endAt: input.endAt, timezone, weeklyHours: businessData.availabilityPolicy?.weeklyHours });
        const uniqueOld = oldLocks.filter((ref) => !newLocks.some((next) => next.path === ref.path));
        const oldDocs = await Promise.all(uniqueOld.map((ref) => tx.get(ref)));
        const customerRef = typeof old.customerId === 'string' ? db.collection('customers').doc(old.customerId) : null;
        const customerDoc = customerRef ? await tx.get(customerRef) : null;
        if (customerDoc && (!customerDoc.exists || customerDoc.data()?.businessId !== actor.businessId)) throw new Error('BOOKING_NOT_FOUND');
        if (checkLocks.some((doc) => doc.exists && doc.data()?.bookingId !== bookingId)) throw new Error('BOOKING_SLOT_UNAVAILABLE');
        newLocks.forEach((ref) => tx.set(ref, { businessId: actor.businessId, bookingId, updatedAt: FieldValue.serverTimestamp() }));
        oldDocs.forEach((doc, index) => { if (doc.exists && doc.data()?.bookingId === bookingId) tx.delete(uniqueOld[index]); });
        tx.update(bookingRef, { startAt: Timestamp.fromDate(input.startAt), endAt: Timestamp.fromDate(input.endAt), durationMinutes: input.durationMinutes, slotIds: newSlotIds, availabilityPolicyVersion: businessData.availabilityPolicy?.version || null, updatedAt: FieldValue.serverTimestamp(), statusChangedBy: actor.uid });
        if (customerRef) tx.create(customerRef.collection('history').doc(), { businessId: actor.businessId, customerId: customerRef.id, bookingId, kind: 'booking_rescheduled', service: old.service, startAt: Timestamp.fromDate(input.startAt), createdAt: FieldValue.serverTimestamp(), actorId: actor.uid });
      });
      return NextResponse.json({ updated: true, bookingId, rescheduled: true });
    }
    return NextResponse.json({ error: 'A supported status or reschedule action is required.' }, { status: 400 });
  } catch (error) { return responseError(error); }
}

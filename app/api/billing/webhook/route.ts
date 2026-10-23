import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getBillingPlans } from '@/lib/billing/config';
import { mapRazorpaySubscriptionState, verifyRazorpayWebhookSignature } from '@/lib/billing/razorpay.mjs';

export const runtime = 'nodejs';

const SUBSCRIPTION_EVENTS = new Set([
  'subscription.authenticated', 'subscription.activated', 'subscription.charged',
  'subscription.completed', 'subscription.updated', 'subscription.pending',
  'subscription.halted', 'subscription.paused', 'subscription.resumed', 'subscription.cancelled',
]);
const SAFE_ID = /^[A-Za-z0-9_-]{16,128}$/;

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-razorpay-signature');
  const eventId = request.headers.get('x-razorpay-event-id');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawBody = await request.text();
  if (!signature || !eventId || !secret) return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 400 });
  if (!verifyRazorpayWebhookSignature(rawBody, signature, secret)) return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  if (!/^[A-Za-z0-9._:-]{8,160}$/.test(eventId)) return NextResponse.json({ error: 'Invalid event identifier.' }, { status: 400 });

  let event: any;
  try { event = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 }); }
  if (!SUBSCRIPTION_EVENTS.has(event?.event)) return NextResponse.json({ received: true, ignored: true });

  const subscription = event?.payload?.subscription?.entity;
  if (!subscription || typeof subscription.id !== 'string' || typeof subscription.plan_id !== 'string' || !Number.isFinite(event.created_at)) {
    return NextResponse.json({ error: 'Invalid subscription event.' }, { status: 400 });
  }
  const configuredPlan = getBillingPlans().find((plan) => plan.providerPlanId === subscription.plan_id && !plan.customSales);
  const notesBusinessId = subscription.notes?.businessId;
  if (!configuredPlan || typeof notesBusinessId !== 'string' || !SAFE_ID.test(notesBusinessId)) {
    const eventRef = getAdminDb().collection('razorpay_events').doc(eventId);
    await eventRef.set({ type: event.event, processedAt: FieldValue.serverTimestamp(), outcome: 'unmapped_plan_or_business' }, { merge: true });
    return NextResponse.json({ received: true, ignored: true });
  }
  const notesPlanId = subscription.notes?.planId;
  if (notesPlanId !== configuredPlan.id) return NextResponse.json({ error: 'Subscription plan metadata mismatch.' }, { status: 400 });

  const db = getAdminDb();
  const eventRef = db.collection('razorpay_events').doc(eventId);
  const businessRef = db.collection('businesses').doc(notesBusinessId);
  try {
    let outcome = 'accepted';
    await db.runTransaction(async (tx) => {
      const [eventSnapshot, businessSnapshot] = await Promise.all([tx.get(eventRef), tx.get(businessRef)]);
      if (eventSnapshot.exists) { outcome = 'duplicate'; return; }
      if (!businessSnapshot.exists) {
        tx.create(eventRef, { type: event.event, processedAt: FieldValue.serverTimestamp(), outcome: 'unmapped_business' });
        outcome = 'unmapped_business';
        return;
      }
      const business = businessSnapshot.data() || {};
      const billing = business.billing || {};
      const previous = business.subscription || {};
      if (billing.razorpaySubscriptionId && billing.razorpaySubscriptionId !== subscription.id) {
        tx.create(eventRef, { type: event.event, businessId: notesBusinessId, processedAt: FieldValue.serverTimestamp(), outcome: 'stale_subscription' });
        outcome = 'stale_subscription';
        return;
      }
      const eventCreatedAt = new Date(event.created_at * 1000).toISOString();
      const nextState = mapRazorpaySubscriptionState(subscription.status);
      if (previous.providerSubscriptionId === subscription.id && ['cancelled', 'expired'].includes(String(previous.state || '')) && nextState !== previous.state) {
        tx.create(eventRef, { type: event.event, businessId: notesBusinessId, providerSubscriptionId: subscription.id, processedAt: FieldValue.serverTimestamp(), outcome: 'ignored_terminal_transition' });
        outcome = 'ignored_terminal_transition';
        return;
      }
      if (previous.lastEventCreatedAt && Date.parse(eventCreatedAt) < Date.parse(previous.lastEventCreatedAt)) {
        tx.create(eventRef, { type: event.event, businessId: notesBusinessId, processedAt: FieldValue.serverTimestamp(), outcome: 'ignored_out_of_order' });
        outcome = 'ignored_out_of_order';
        return;
      }
      const update: Record<string, unknown> = {
        provider: 'razorpay',
        providerSubscriptionId: subscription.id,
        state: nextState,
        planId: configuredPlan.id,
        lastEventId: eventId,
        lastEventCreatedAt: eventCreatedAt,
      };
      if (Number.isFinite(subscription.current_end) && subscription.current_end > 0) update.currentPeriodEnd = new Date(subscription.current_end * 1000).toISOString();
      if (event.event === 'subscription.charged') update.lastPaymentAt = eventCreatedAt;
      if (typeof subscription.has_scheduled_changes === 'boolean') update.hasScheduledChanges = subscription.has_scheduled_changes;
      const pendingPlanId = ['active', 'cancelled', 'expired'].includes(String(nextState)) ? null : configuredPlan.id;
      tx.set(businessRef, { subscription: { ...previous, ...update }, billing: { ...billing, razorpaySubscriptionId: subscription.id, razorpayPlanId: subscription.plan_id, razorpayPendingPlanId: pendingPlanId, razorpaySubscriptionShortUrl: null }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      tx.create(eventRef, { type: event.event, businessId: notesBusinessId, providerSubscriptionId: subscription.id, processedAt: FieldValue.serverTimestamp(), outcome: 'accepted' });
    });
    return NextResponse.json({ received: true, outcome });
  } catch (error) {
    console.error('Razorpay webhook processing failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { getStripe } from '@/lib/billing/stripe';

export const runtime = 'nodejs';

function stateForSubscription(status: Stripe.Subscription.Status) {
  if (status === 'active') return 'active';
  if (status === 'trialing') return 'trialing';
  if (status === 'past_due' || status === 'unpaid') return 'past_due';
  return status === 'canceled' ? 'cancelled' : 'expired';
}

async function findBusinessId(object: Stripe.Checkout.Session | Stripe.Subscription | Stripe.Invoice) {
  const metadataBusinessId = object.metadata?.businessId;
  if (metadataBusinessId) return metadataBusinessId;
  const customerId = typeof object.customer === 'string' ? object.customer : object.customer?.id;
  if (!customerId) return null;
  const snapshot = await getAdminDb().collection('businesses').where('billing.stripeCustomerId', '==', customerId).limit(1).get();
  return snapshot.empty ? null : snapshot.docs[0].id;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 400 });
  const rawBody = await request.text();
  let event: Stripe.Event;
  try { event = getStripe().webhooks.constructEvent(rawBody, signature, secret); }
  catch { return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 }); }

  const db = getAdminDb();
  const eventRef = db.collection('stripe_events').doc(event.id);
  const existing = await eventRef.get();
  if (existing.exists) return NextResponse.json({ received: true, duplicate: true });

  try {
    const object = event.data.object as Stripe.Checkout.Session | Stripe.Subscription | Stripe.Invoice;
    const businessId = await findBusinessId(object);
    if (businessId) {
      const businessRef = db.collection('businesses').doc(businessId);
      await db.runTransaction(async (transaction) => {
        const [eventSnapshot, businessSnapshot] = await Promise.all([transaction.get(eventRef), transaction.get(businessRef)]);
        if (eventSnapshot.exists) return;
        const business = businessSnapshot.data() || {};
        const previous = business.subscription || {};
        const eventCreatedAt = new Date(event.created * 1000).toISOString();
        if (previous.lastEventCreatedAt && Date.parse(eventCreatedAt) < Date.parse(previous.lastEventCreatedAt)) {
          transaction.set(eventRef, { type: event.type, processedAt: FieldValue.serverTimestamp(), outcome: 'ignored_out_of_order' });
          return;
        }
        const update: Record<string, unknown> = { lastEventId: event.id, lastEventCreatedAt: eventCreatedAt };
        if (event.type === 'checkout.session.completed') {
          const session = object as Stripe.Checkout.Session;
          update.stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
          update.checkoutCompleted = true;
        } else if (event.type.startsWith('customer.subscription.')) {
          const subscription = object as Stripe.Subscription;
          update.state = stateForSubscription(subscription.status);
          update.stripeSubscriptionId = subscription.id;
          update.stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id || null;
          update.currentPeriodEnd = new Date(subscription.items.data[0]?.current_period_end ? subscription.items.data[0].current_period_end * 1000 : Date.now()).toISOString();
          update.cancelAtPeriodEnd = subscription.cancel_at_period_end;
        } else if (event.type === 'invoice.paid') {
          update.lastInvoicePaidAt = eventCreatedAt;
        } else if (event.type === 'invoice.payment_failed') {
          update.state = 'past_due';
          update.lastPaymentFailureAt = eventCreatedAt;
        }
        transaction.set(businessRef, { subscription: { ...previous, ...update }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        transaction.set(eventRef, { type: event.type, businessId, processedAt: FieldValue.serverTimestamp(), outcome: 'accepted' });
      });
    } else {
      await eventRef.set({ type: event.type, processedAt: FieldValue.serverTimestamp(), outcome: 'unmapped' });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}

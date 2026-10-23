import { randomUUID } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getBillingPlan } from '@/lib/billing/config';
import { razorpayRequest } from '@/lib/billing/razorpay.mjs';
import { canManageBilling, requireBusinessActor } from '@/lib/tenant/server';

function cycleCount() {
  const value = Number(process.env.RAZORPAY_SUBSCRIPTION_TOTAL_CYCLES || '1200');
  if (!Number.isInteger(value) || value < 1 || value > 1200) throw new Error('INVALID_RAZORPAY_SUBSCRIPTION_CYCLES');
  return value;
}

export async function POST(request: NextRequest) {
  let lockRef: FirebaseFirestore.DocumentReference | null = null;
  let lockToken: string | null = null;
  try {
    const body = await request.json() as { planId?: unknown; businessId?: unknown };
    const requestedBusinessId = typeof body.businessId === 'string' ? body.businessId : undefined;
    const actor = await requireBusinessActor(['owner', 'admin'], requestedBusinessId);
    if (!canManageBilling(actor.role)) return NextResponse.json({ error: 'Only business owners and admins may manage billing.' }, { status: 403 });
    const plan = typeof body.planId === 'string' ? getBillingPlan(body.planId) : null;
    if (plan?.customSales) return NextResponse.json({ error: 'Daken² uses a custom sales enquiry and has no fixed-price checkout.' }, { status: 400 });
    if (!plan?.providerPlanId) return NextResponse.json({ error: 'This Razorpay plan is not configured for checkout.' }, { status: 400 });
    if (!plan.checkoutEnabled) return NextResponse.json({ error: 'Checkout is not enabled for this plan. Complete the required feature and billing checks before launch.' }, { status: 400 });

    const db = getAdminDb();
    const businessRef = db.collection('businesses').doc(actor.businessId);
    lockRef = db.collection('razorpay_checkout_locks').doc(actor.businessId);
    lockToken = randomUUID();
    const lockNow = Date.now();
    let existingUrl: string | null = null;
    await db.runTransaction(async (tx) => {
      const [businessSnapshot, lockSnapshot] = await Promise.all([tx.get(businessRef), tx.get(lockRef!)]);
      const billing = businessSnapshot.data()?.billing || {};
      if (billing.razorpayPendingPlanId === plan.id && typeof billing.razorpaySubscriptionShortUrl === 'string') {
        existingUrl = billing.razorpaySubscriptionShortUrl;
        return;
      }
      if (typeof billing.razorpaySubscriptionShortUrl === 'string' || typeof billing.razorpayPendingPlanId === 'string') throw new Error('CHECKOUT_ALREADY_PENDING');
      const currentState = businessSnapshot.data()?.subscription?.state;
      if (['active', 'trialing'].includes(String(currentState || ''))) throw new Error('SUBSCRIPTION_ALREADY_ACTIVE');
      const lockCreatedAt = lockSnapshot.exists ? (lockSnapshot.data()?.createdAt as Timestamp | undefined)?.toMillis() : undefined;
      if (lockCreatedAt && lockNow - lockCreatedAt < 120_000) throw new Error('CHECKOUT_IN_PROGRESS');
      tx.set(lockRef!, { token: lockToken, createdAt: Timestamp.fromMillis(lockNow), businessId: actor.businessId, planId: plan.id });
    });
    if (existingUrl) return NextResponse.json({ url: existingUrl, reused: true });

    const subscription = await razorpayRequest('/subscriptions', {
      method: 'POST',
      body: {
        plan_id: plan.providerPlanId,
        total_count: cycleCount(),
        quantity: 1,
        customer_notify: true,
        notes: { businessId: actor.businessId, planId: plan.id },
      },
    });
    if (typeof subscription?.id !== 'string' || typeof subscription?.short_url !== 'string' || !subscription.short_url.startsWith('https://')) throw new Error('RAZORPAY_INVALID_SUBSCRIPTION_RESPONSE');

    await db.runTransaction(async (tx) => {
      const lock = await tx.get(lockRef!);
      if (!lock.exists || lock.data()?.token !== lockToken) throw new Error('CHECKOUT_LOCK_LOST');
      tx.set(businessRef, {
        billing: {
          ...(actor.business.billing || {}),
          razorpaySubscriptionId: subscription.id,
          razorpayPendingPlanId: plan.id,
          razorpaySubscriptionShortUrl: subscription.short_url,
          razorpayCheckoutCreatedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      tx.delete(lockRef!);
    });
    return NextResponse.json({ url: subscription.short_url });
  } catch (error) {
    if (lockRef && lockToken) {
      try {
        await getAdminDb().runTransaction(async (tx) => {
          const lock = await tx.get(lockRef!);
          if (lock.exists && lock.data()?.token === lockToken) tx.delete(lockRef!);
        });
      } catch { /* The lease expires automatically; do not expose provider credentials or errors. */ }
    }
    const message = error instanceof Error ? error.message : '';
    if (message === 'CHECKOUT_IN_PROGRESS') return NextResponse.json({ error: 'A checkout is already being prepared. Please wait a moment and try again.' }, { status: 409 });
    if (message === 'CHECKOUT_ALREADY_PENDING') return NextResponse.json({ error: 'A Razorpay subscription authorisation is already pending for this workspace.' }, { status: 409 });
    if (message === 'SUBSCRIPTION_ALREADY_ACTIVE') return NextResponse.json({ error: 'This workspace already has an active subscription. Contact support to change plans.' }, { status: 409 });
    if (message === 'FORBIDDEN') return NextResponse.json({ error: 'Billing access denied.' }, { status: 403 });
    console.error('Razorpay subscription creation failed:', message || 'unknown error');
    return NextResponse.json({ error: 'Unable to start Razorpay checkout.' }, { status: 500 });
  }
}

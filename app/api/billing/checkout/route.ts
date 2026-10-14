import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { getBillingPlan } from '@/lib/billing/config';
import { getAppUrl, getStripe } from '@/lib/billing/stripe';
import { canManageBilling } from '@/lib/tenant/server';
import { requireBusinessActor } from '@/lib/tenant/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { planId?: unknown; businessId?: unknown };
    const requestedBusinessId = typeof body.businessId === 'string' ? body.businessId : undefined;
    const actor = await requireBusinessActor(['owner', 'admin'], requestedBusinessId);
    if (!canManageBilling(actor.role)) return NextResponse.json({ error: 'Only business owners and admins may manage billing.' }, { status: 403 });
    const { planId } = body;
    const plan = typeof planId === 'string' ? getBillingPlan(planId) : null;
    if (!plan?.priceId) return NextResponse.json({ error: 'This plan is not configured for checkout.' }, { status: 400 });
    const db = getAdminDb();
    const businessRef = db.collection('businesses').doc(actor.businessId);
    const businessSnapshot = await businessRef.get();
    const business = businessSnapshot.data() || {};
    let customerId = business.billing?.stripeCustomerId as string | undefined;
    const stripe = getStripe();
    if (!customerId) {
      const customer = await stripe.customers.create({ name: String(business.name || 'Nanoware AI business'), metadata: { businessId: actor.businessId } }, { idempotencyKey: `customer:${actor.businessId}` });
      customerId = customer.id;
      await businessRef.set({ billing: { ...(business.billing || {}), stripeCustomerId: customerId }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    const session = await stripe.checkout.sessions.create({ mode: 'subscription', customer: customerId, line_items: [{ price: plan.priceId, quantity: 1 }], success_url: `${getAppUrl()}/billing?checkout=success`, cancel_url: `${getAppUrl()}/billing?checkout=cancelled`, client_reference_id: actor.businessId, metadata: { businessId: actor.businessId, planId: plan.id }, subscription_data: { metadata: { businessId: actor.businessId, planId: plan.id } } }, { idempotencyKey: `checkout:${actor.businessId}:${plan.id}` });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout creation failed:', error instanceof Error ? error.message : 'unknown error');
    const status = error instanceof Error && error.message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Billing access denied.' : 'Unable to start checkout.' }, { status });
  }
}

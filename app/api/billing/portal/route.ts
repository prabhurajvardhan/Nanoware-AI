import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { razorpayRequest } from '@/lib/billing/razorpay.mjs';
import { canManageBilling, requireBusinessActor } from '@/lib/tenant/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { businessId?: unknown };
    const businessId = typeof body.businessId === 'string' ? body.businessId : undefined;
    const actor = await requireBusinessActor(['owner', 'admin'], businessId);
    if (!canManageBilling(actor.role)) return NextResponse.json({ error: 'Only business owners and admins may manage billing.' }, { status: 403 });
    const subscriptionId = actor.business.billing?.razorpaySubscriptionId;
    if (typeof subscriptionId !== 'string' || !/^sub_[A-Za-z0-9]+$/.test(subscriptionId)) return NextResponse.json({ error: 'No Razorpay subscription is linked to this workspace.' }, { status: 400 });
    const state = actor.business.subscription?.state;
    if (!['active', 'trialing', 'past_due'].includes(String(state || ''))) return NextResponse.json({ error: 'This subscription cannot be cancelled from its current state.' }, { status: 409 });

    const cancelled = await razorpayRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
      method: 'POST', body: { cancel_at_cycle_end: true },
    });
    await getAdminDb().collection('businesses').doc(actor.businessId).set({
      billing: { ...(actor.business.billing || {}), cancellationRequestedAt: FieldValue.serverTimestamp(), cancellationScheduledAtCycleEnd: true },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return NextResponse.json({ requested: true, cancelAtCycleEnd: cancelled?.has_scheduled_changes === true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'FORBIDDEN') return NextResponse.json({ error: 'Billing access denied.' }, { status: 403 });
    console.error('Razorpay cancellation request failed:', message || 'unknown error');
    return NextResponse.json({ error: 'Unable to update the Razorpay subscription.' }, { status: 500 });
  }
}

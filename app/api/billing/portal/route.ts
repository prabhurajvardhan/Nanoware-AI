import { NextRequest, NextResponse } from 'next/server';
import { getAppUrl, getStripe } from '@/lib/billing/stripe';
import { requireBusinessActor } from '@/lib/tenant/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { businessId?: unknown };
    const requestedBusinessId = typeof body.businessId === 'string' ? body.businessId : undefined;
    const actor = await requireBusinessActor(['owner', 'admin'], requestedBusinessId);
    const customerId = actor.business.billing?.stripeCustomerId as string | undefined;
    if (!customerId) return NextResponse.json({ error: 'No Stripe customer exists yet.' }, { status: 400 });
    const session = await getStripe().billingPortal.sessions.create({ customer: customerId, return_url: `${getAppUrl()}/billing` });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Billing portal creation failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to open the billing portal.' }, { status: 500 });
  }
}

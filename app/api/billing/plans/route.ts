import { NextResponse } from 'next/server';
import { getBillingPlans } from '@/lib/billing/config';

export async function GET() {
  return NextResponse.json({ plans: getBillingPlans().map(({ id, name, description, priceId }) => ({ id, name, description, configured: Boolean(priceId) })) });
}

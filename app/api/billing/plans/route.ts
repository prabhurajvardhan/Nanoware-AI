import { NextResponse } from 'next/server';
import { getPublicBillingPlans } from '@/lib/billing/config';

export async function GET() {
  return NextResponse.json({ plans: getPublicBillingPlans().map(({ id, name, description, displayPrice, storageGb, monthlyTokenAllowance, bookingLimit, features, customSales, checkoutEnabled, priceId }) => ({ id, name, description, displayPrice, storageGb, monthlyTokenAllowance, bookingLimit, features, customSales: Boolean(customSales), configured: Boolean(customSales || (priceId && checkoutEnabled)), checkoutEnabled: Boolean(checkoutEnabled) })) });
}

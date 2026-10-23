import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { AuthBoundaryError } from '@/lib/auth/server';
import { requireBusinessActor } from '@/lib/tenant/server';
import { assertTrialActive } from '@/lib/billing/trial';
import { trialExpiredResponse } from '@/lib/billing/trial-response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    const { customerId } = await params;
    const businessId = request.nextUrl.searchParams.get('businessId') || undefined;
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(customerId)) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    const actor = await requireBusinessActor(['owner', 'admin', 'member'], businessId);
    assertTrialActive(actor.business.subscription);
    const customerRef = getAdminDb().collection('customers').doc(customerId);
    const customer = await customerRef.get();
    if (!customer.exists || customer.data()?.businessId !== actor.businessId) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    const history = await customerRef.collection('history').where('businessId', '==', actor.businessId).orderBy('createdAt', 'desc').limit(100).get();
    return NextResponse.json({ history: history.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) {
    const expired = trialExpiredResponse(error);
    if (expired) return expired;
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
    console.error('Customer history request failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to load customer history.' }, { status: 500 });
  }
}

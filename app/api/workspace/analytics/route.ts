import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { AuthBoundaryError } from '@/lib/auth/server';
import { requireBusinessActor } from '@/lib/tenant/server';
import { assertTrialActive } from '@/lib/billing/trial';
import { trialExpiredResponse } from '@/lib/billing/trial-response';

async function count(query: FirebaseFirestore.Query) {
  const result = await query.count().get();
  return result.data().count;
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireBusinessActor(['owner', 'admin', 'member'], request.nextUrl.searchParams.get('businessId') || undefined);
    assertTrialActive(actor.business.subscription);
    const db = getAdminDb();
    const customers = db.collection('customers').where('businessId', '==', actor.businessId).where('archivedAt', '==', null);
    const bookings = db.collection('bookingRequests').where('businessId', '==', actor.businessId);
    const now = Timestamp.now();
    const [customerCount, bookingCount, requested, confirmed, cancelled, completed, upcoming, manual, whatsapp] = await Promise.all([
      count(customers), count(bookings),
      count(bookings.where('status', '==', 'requested')),
      count(bookings.where('status', '==', 'confirmed')),
      count(bookings.where('status', '==', 'cancelled')),
      count(bookings.where('status', '==', 'completed')),
      count(bookings.where('startAt', '>=', now).where('status', 'in', ['requested', 'confirmed'])),
      count(bookings.where('origin', '==', 'manual')),
      count(bookings.where('origin', '==', 'whatsapp')),
    ]);
    return NextResponse.json({
      businessId: actor.businessId,
      customers: { total: customerCount },
      bookings: { total: bookingCount, requested, confirmed, cancelled, completed, upcoming, byOrigin: { manual, whatsapp } },
      activity: { source: 'persisted CRM and booking records', generatedAt: new Date().toISOString() },
      tokenUsage: { available: false, reason: 'No provider-reported token usage records are currently persisted.' },
      storageUsage: { available: false, reason: 'No tenant-scoped storage metering is currently persisted.' },
    });
  } catch (error) {
    const expired = trialExpiredResponse(error);
    if (expired) return expired;
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
    console.error('Workspace analytics failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to load workspace analytics.' }, { status: 500 });
  }
}

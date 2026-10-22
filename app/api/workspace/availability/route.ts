import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { AuthBoundaryError } from '@/lib/auth/server';
import { requireBusinessActor } from '@/lib/tenant/server';
import { assertTrialActive } from '@/lib/billing/trial';
import { trialExpiredResponse } from '@/lib/billing/trial-response';

function validateWeeklyHours(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('INVALID_WEEKLY_HOURS');
  const entries = Object.entries(value as Record<string, unknown>);
  const result: Record<string, { start: string; end: string }> = {};
  for (const [day, schedule] of entries) {
    if (!/^[0-6]$/.test(day) || !schedule || typeof schedule !== 'object') throw new TypeError('INVALID_WEEKLY_HOURS');
    const { start, end } = schedule as Record<string, unknown>;
    if (typeof start !== 'string' || typeof end !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(end) || start >= end) throw new TypeError('INVALID_WEEKLY_HOURS');
    result[day] = { start, end };
  }
  if (Object.keys(result).length === 0) throw new TypeError('AT_LEAST_ONE_OPEN_DAY_REQUIRED');
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireBusinessActor(['owner', 'admin', 'member'], request.nextUrl.searchParams.get('businessId') || undefined);
    assertTrialActive(actor.business.subscription);
    const policy = actor.business.availabilityPolicy || null;
    return NextResponse.json({ timezone: typeof actor.business.timezone === 'string' ? actor.business.timezone : 'UTC', weeklyHours: policy?.weeklyHours || {}, version: Number(policy?.version || 0) });
  } catch (error) {
    const expired = trialExpiredResponse(error);
    if (expired) return expired;
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
    console.error('Workspace availability read failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to load business availability.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body?.businessId !== 'string') return NextResponse.json({ error: 'Business workspace is required.' }, { status: 400 });
    const actor = await requireBusinessActor(['owner', 'admin'], body.businessId);
    assertTrialActive(actor.business.subscription);
    const weeklyHours = validateWeeklyHours(body.weeklyHours);
    const db = getAdminDb();
    const ref = db.collection('businesses').doc(actor.businessId);
    let version = 0;
    await db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (!current.exists) throw new Error('BUSINESS_NOT_FOUND');
      version = Number(current.data()?.availabilityPolicy?.version || 0) + 1;
      tx.update(ref, { availabilityPolicy: { timezone: actor.business.timezone || 'UTC', weeklyHours, version, updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() } });
    });
    return NextResponse.json({ saved: true, timezone: actor.business.timezone || 'UTC', version });
  } catch (error) {
    const expired = trialExpiredResponse(error);
    if (expired) return expired;
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
    if (error instanceof TypeError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('Workspace availability save failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to save business availability.' }, { status: 500 });
  }
}

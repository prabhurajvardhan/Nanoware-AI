import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { AuthBoundaryError, requireEmailVerifiedSession } from '@/lib/auth/server';
import { BusinessAccessError, requireBusinessMembership } from '@/lib/business/access';
import { DAKEN_TRIAL_MILLISECONDS, summarizeTrial } from '@/lib/billing/trial';

function fail(error: unknown) {
  if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
  if (error instanceof BusinessAccessError) return NextResponse.json({ error: error.code }, { status: 403 });
  if (error instanceof Error && error.message === 'TRIAL_ALREADY_USED') return NextResponse.json({ error: 'The one-time trial has already been used for this business.' }, { status: 409 });
  if (error instanceof Error && error.message === 'TRIAL_USED_ON_OTHER_WORKSPACE') return NextResponse.json({ error: 'This owner has already used a trial on another workspace.' }, { status: 409 });
  if (error instanceof Error && error.message === 'SUBSCRIPTION_EXISTS') return NextResponse.json({ error: 'This workspace already has a subscription state and is not eligible for a new trial.' }, { status: 409 });
  console.error('Business trial request failed:', error instanceof Error ? error.message : 'unknown error');
  return NextResponse.json({ error: 'Unable to complete the trial request.' }, { status: 500 });
}
function used(data: FirebaseFirestore.DocumentData | undefined) { return Boolean(data?.subscription?.trialUsedAt || data?.subscription?.trialStartedAt); }

export async function GET(request: NextRequest) {
  try {
    const session = await requireEmailVerifiedSession();
    const businessId = request.nextUrl.searchParams.get('businessId') || '';
    if (!businessId) return NextResponse.json({ error: 'Business workspace is required.' }, { status: 400 });
    const membership = await requireBusinessMembership(session.uid, businessId);
    const db = getAdminDb();
    const businessDoc = await db.collection('businesses').doc(businessId).get();
    const owned = await db.collection('businesses').where('ownerId', '==', session.uid).get();
    const claim = await db.collection('business_trial_claims').doc(session.uid).get();
    const subscription = businessDoc.data()?.subscription || {};
    const hasUsedAny = claim.exists || owned.docs.some((doc) => used(doc.data()));
    const hasActiveSubscription = ['active', 'trialing', 'past_due'].includes(String(subscription.state || ''));
    return NextResponse.json({ trial: summarizeTrial(subscription), canStart: membership.role === 'owner' && !hasUsedAny && !hasActiveSubscription && !subscription.trialUsedAt, plan: 'daken', durationDays: 7 });
  } catch (error) { return fail(error); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireEmailVerifiedSession();
    const body = await request.json();
    const businessId = typeof body?.businessId === 'string' ? body.businessId : '';
    if (!businessId) return NextResponse.json({ error: 'Business workspace is required.' }, { status: 400 });
    const membership = await requireBusinessMembership(session.uid, businessId, ['owner']);
    const db = getAdminDb();
    const businessRef = db.collection('businesses').doc(businessId);
    const claimRef = db.collection('business_trial_claims').doc(session.uid);
    const ownedQuery = db.collection('businesses').where('ownerId', '==', session.uid);
    let startedAt = 0;
    await db.runTransaction(async (tx) => {
      const [businessDoc, owned, claim] = await Promise.all([tx.get(businessRef), tx.get(ownedQuery), tx.get(claimRef)]);
      if (!businessDoc.exists || businessDoc.data()?.ownerId !== session.uid || membership.role !== 'owner') throw new BusinessAccessError('BUSINESS_FORBIDDEN');
      const data = businessDoc.data()!;
      const subscription = data.subscription || {};
      if (claim.exists && claim.data()?.businessId !== businessId) throw new Error('TRIAL_USED_ON_OTHER_WORKSPACE');
      if (claim.exists || used(data)) throw new Error('TRIAL_ALREADY_USED');
      if (['active', 'trialing', 'past_due'].includes(String(subscription.state || ''))) throw new Error('SUBSCRIPTION_EXISTS');
      if (owned.docs.some((doc) => doc.id !== businessId && used(doc.data()))) throw new Error('TRIAL_USED_ON_OTHER_WORKSPACE');
      startedAt = Date.now();
      const start = Timestamp.fromMillis(startedAt);
      const expires = Timestamp.fromMillis(startedAt + DAKEN_TRIAL_MILLISECONDS);
      tx.update(businessRef, {
        subscription: {
          ...subscription,
          state: 'trialing',
          planId: 'daken',
          trialStartedAt: start,
          trialEndsAt: expires,
          trialUsedAt: start,
          trialUsedBy: session.uid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.create(claimRef, { businessId, uid: session.uid, claimedAt: FieldValue.serverTimestamp() });
    });
    return NextResponse.json({ started: true, plan: 'daken', durationDays: 7, startedAt: new Date(startedAt).toISOString(), expiresAt: new Date(startedAt + DAKEN_TRIAL_MILLISECONDS).toISOString() }, { status: 201 });
  } catch (error) { return fail(error); }
}

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { AuthBoundaryError, requireEmailVerifiedSession } from '@/lib/auth/server';
import { BusinessAccessError, requireBusinessMembership } from '@/lib/business/access';
import { getAdminDb } from '@/lib/firebase-admin';

function validGoogleUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ['google.com', 'www.google.com', 'maps.google.com', 'business.google.com', 'maps.app.goo.gl'].includes(url.hostname);
  } catch { return false; }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireEmailVerifiedSession();
    const body = await request.json() as { businessId?: unknown; url?: unknown };
    const businessId = typeof body.businessId === 'string' ? body.businessId : '';
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    if (!validGoogleUrl(url)) return NextResponse.json({ error: 'Enter a valid Google Maps or Business Profile URL.' }, { status: 400 });
    await requireBusinessMembership(session.uid, businessId);
    const ref = getAdminDb().collection('businesses').doc(businessId);
    await getAdminDb().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists || snapshot.data()?.ownerId !== session.uid) throw new BusinessAccessError('BUSINESS_FORBIDDEN');
      transaction.update(ref, {
        'verification.checks.googleBusinessProfile': 'claimed',
        'verification.googleBusinessProfileUrl': url,
        'verification.evidence': FieldValue.arrayUnion({ evidenceType: 'google_business_profile', status: 'claimed', source: 'user_submitted_url', checkedAt: new Date().toISOString() }),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    return NextResponse.json({ success: true, status: 'claimed' });
  } catch (error) {
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code === 'EMAIL_VERIFICATION_REQUIRED' ? 'Verify your account email first.' : 'Authentication required.' }, { status: error.code === 'EMAIL_VERIFICATION_REQUIRED' ? 403 : 401 });
    if (error instanceof BusinessAccessError) return NextResponse.json({ error: 'Business access denied.' }, { status: 403 });
    console.error('Google Business Profile evidence failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to save the profile URL.' }, { status: 500 });
  }
}

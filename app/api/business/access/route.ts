import { NextRequest, NextResponse } from 'next/server';
import { AuthBoundaryError, getVerifiedSession, requireEmailVerifiedSession } from '@/lib/auth/server';
import { BusinessAccessError, listBusinessMemberships, requireVerifiedBusinessMembership } from '@/lib/business/access';

function errorResponse(error: unknown) {
  if (error instanceof AuthBoundaryError) {
    if (error.code === 'EMAIL_VERIFICATION_REQUIRED') return NextResponse.json({ error: 'Verify your account email first.', emailVerificationRequired: true }, { status: 403 });
    return NextResponse.json({ error: error.code === 'FORBIDDEN' ? 'Business access denied.' : 'Authentication required.' }, { status: error.code === 'FORBIDDEN' ? 403 : 401 });
  }
  if (error instanceof BusinessAccessError) {
    const status = error.code === 'BUSINESS_NOT_FOUND' ? 404 : 403;
    const message = error.code === 'BUSINESS_PENDING_VERIFICATION' ? 'Business verification is pending.' : status === 404 ? 'Business not found.' : 'Business access denied.';
    return NextResponse.json({ error: message }, { status });
  }
  console.error('Business access lookup failed:', error instanceof Error ? error.message : 'unknown error');
  return NextResponse.json({ error: 'Unable to load business access.' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getVerifiedSession();
    const businessId = request.nextUrl.searchParams.get('businessId');
    if (businessId) {
      await requireEmailVerifiedSession();
      const business = await requireVerifiedBusinessMembership(session.uid, businessId);
      return NextResponse.json({ businesses: [business], selectedBusinessId: business.businessId });
    }
    const businesses = await listBusinessMemberships(session.uid);
    return NextResponse.json({ businesses, onboardingRequired: businesses.length === 0 });
  } catch (error) {
    return errorResponse(error);
  }
}

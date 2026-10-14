import { NextRequest, NextResponse } from 'next/server';
import { AuthBoundaryError, getVerifiedSession } from '@/lib/auth/server';
import { BusinessAccessError, listBusinessMemberships, requireBusinessMembership } from '@/lib/business/access';

function errorResponse(error: unknown) {
  if (error instanceof AuthBoundaryError) {
    return NextResponse.json({ error: error.code === 'FORBIDDEN' ? 'Business access denied.' : 'Authentication required.' }, { status: error.code === 'FORBIDDEN' ? 403 : 401 });
  }
  if (error instanceof BusinessAccessError) {
    const status = error.code === 'BUSINESS_NOT_FOUND' ? 404 : 403;
    return NextResponse.json({ error: status === 404 ? 'Business not found.' : 'Business access denied.' }, { status });
  }
  console.error('Business access lookup failed:', error instanceof Error ? error.message : 'unknown error');
  return NextResponse.json({ error: 'Unable to load business access.' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getVerifiedSession();
    const businessId = request.nextUrl.searchParams.get('businessId');
    if (businessId) {
      const business = await requireBusinessMembership(session.uid, businessId);
      return NextResponse.json({ businesses: [business], selectedBusinessId: business.businessId });
    }
    const businesses = await listBusinessMemberships(session.uid);
    return NextResponse.json({ businesses, onboardingRequired: businesses.length === 0 });
  } catch (error) {
    return errorResponse(error);
  }
}

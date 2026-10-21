import { NextRequest, NextResponse } from 'next/server';
import { AuthBoundaryError, requireAdminActor } from '@/lib/auth/server';
import { listBusinessVerificationReviews } from '@/lib/business/verification-admin';
import { BusinessVerificationError } from '@/lib/business/verification';

function authError(error: unknown) {
  if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code === 'MFA_REQUIRED' ? 'Additional verification required.' : 'Unauthorized.' }, { status: error.code === 'MFA_REQUIRED' ? 403 : 401 });
  if (error instanceof BusinessVerificationError) return NextResponse.json({ error: 'Unable to load verification reviews.' }, { status: 400 });
  console.error('Admin verification listing failed:', error instanceof Error ? error.message : 'unknown');
  return NextResponse.json({ error: 'Unable to load verification reviews.' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor({ requireMfa: true });
    const requestedStatus = request.nextUrl.searchParams.get('status') || 'pending_review';
    const status = ['pending_review', 'verified', 'rejected', 'suspended'].includes(requestedStatus) ? requestedStatus as 'pending_review' | 'verified' | 'rejected' | 'suspended' : 'pending_review';
    return NextResponse.json({ reviews: await listBusinessVerificationReviews(status) });
  } catch (error) {
    return authError(error);
  }
}

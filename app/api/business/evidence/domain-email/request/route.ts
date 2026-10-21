import { NextRequest, NextResponse } from 'next/server';
import { AuthBoundaryError, requireEmailVerifiedSession } from '@/lib/auth/server';
import { BusinessAccessError, requireBusinessMembership } from '@/lib/business/access';
import { issueDomainEmailToken, DomainEmailVerificationError } from '@/lib/business/domain-email-verification';
import { sendBusinessDomainEmailVerificationEmail } from '@/lib/email/actions';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const session = await requireEmailVerifiedSession();
    const body = await request.json() as { businessId?: unknown; email?: unknown };
    const businessId = typeof body.businessId === 'string' ? body.businessId : '';
    const email = typeof body.email === 'string' ? body.email : '';
    await requireBusinessMembership(session.uid, businessId);
    const business = await getAdminDb().collection('businesses').doc(businessId).get();
    const website = typeof business.data()?.verification?.website === 'string' ? business.data()!.verification.website : '';
    const issued = await issueDomainEmailToken({ uid: session.uid, businessId, email, website });
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const delivery = await sendBusinessDomainEmailVerificationEmail(issued.email, business.data()?.name || 'Business owner', `${appUrl}/api/business/evidence/domain-email/verify?token=${issued.token}`);
    if (!delivery.success) return NextResponse.json({ error: 'Email delivery is temporarily unavailable.' }, { status: 503 });
    return NextResponse.json({ success: true, expiresAt: issued.expiresAt });
  } catch (error) {
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code === 'EMAIL_VERIFICATION_REQUIRED' ? 'Verify your account email first.' : 'Authentication required.' }, { status: error.code === 'EMAIL_VERIFICATION_REQUIRED' ? 403 : 401 });
    if (error instanceof BusinessAccessError) return NextResponse.json({ error: 'Business access denied.' }, { status: 403 });
    if (error instanceof DomainEmailVerificationError) return NextResponse.json({ error: error.code === 'MISMATCH' ? 'Use an email on the website domain or one of its subdomains, for example you@example.com for example.com. This signal is optional for local businesses.' : error.code === 'RATE_LIMITED' ? 'Please wait before requesting another link.' : 'Enter a valid business email.' }, { status: error.code === 'RATE_LIMITED' ? 429 : 400 });
    console.error('Business-domain email request failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to request business email verification.' }, { status: 500 });
  }
}

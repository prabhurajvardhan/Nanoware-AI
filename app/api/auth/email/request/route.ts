import { NextRequest, NextResponse } from 'next/server';
import { AuthBoundaryError, getVerifiedSession } from '@/lib/auth/server';
import { issueEmailVerificationToken, invalidateEmailVerificationToken, EmailVerificationError } from '@/lib/auth/email-verification';
import { sendAccountEmailVerificationEmail } from '@/lib/email/actions';

export async function POST() {
  try {
    const session = await getVerifiedSession();
    const email = typeof session.email === 'string' ? session.email.toLowerCase() : '';
    if (!email) return NextResponse.json({ error: 'An account email is required.' }, { status: 400 });
    const issued = await issueEmailVerificationToken({ uid: session.uid, email });
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const delivery = await sendAccountEmailVerificationEmail(email, email.split('@')[0], `${appUrl}/api/auth/email/verify?token=${issued.token}`);
    if (!delivery.success) {
      await invalidateEmailVerificationToken(issued.token, session.uid);
      return NextResponse.json({ error: 'Email delivery is temporarily unavailable. Please try again later.' }, { status: 503 });
    }
    return NextResponse.json({ success: true, expiresAt: issued.expiresAt });
  } catch (error) {
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    if (error instanceof EmailVerificationError && error.code === 'RATE_LIMITED') return NextResponse.json({ error: 'Please wait before requesting another email.' }, { status: 429 });
    if (error instanceof EmailVerificationError && error.code === 'TOKEN_USED') return NextResponse.json({ error: 'This email is already verified.' }, { status: 409 });
    console.error('Account email verification request failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to send the verification email.' }, { status: 500 });
  }
}

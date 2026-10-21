import { NextRequest, NextResponse } from 'next/server';
import { AuthBoundaryError, getVerifiedSession } from '@/lib/auth/server';
import { consumePhoneOtp, PhoneVerificationError } from '@/lib/auth/phone-verification';

export async function POST(request: NextRequest) {
  try {
    const session = await getVerifiedSession();
    const body = await request.json() as { code?: unknown };
    await consumePhoneOtp({ uid: session.uid, code: typeof body.code === 'string' ? body.code : '' });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    if (error instanceof PhoneVerificationError) {
      const status = error.code === 'PHONE_REUSED' ? 409 : error.code === 'EXPIRED' || error.code === 'ATTEMPTS_EXCEEDED' ? 410 : 400;
      const messages: Record<string, string> = { PHONE_REUSED: 'This mobile number is already associated with another account. Contact support for a safe recovery review.', EXPIRED: 'This code has expired. Request a new code.', ATTEMPTS_EXCEEDED: 'Too many attempts. Request a new code.', INVALID_CODE: 'That code is not correct.' };
      return NextResponse.json({ error: messages[error.code] || 'Unable to verify the code.' }, { status });
    }
    console.error('Phone OTP verification failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to verify the mobile number.' }, { status: 500 });
  }
}

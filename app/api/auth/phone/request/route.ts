import { NextRequest, NextResponse } from 'next/server';
import { AuthBoundaryError, getVerifiedSession } from '@/lib/auth/server';
import { issuePhoneOtp, PhoneVerificationError } from '@/lib/auth/phone-verification';
import { enforceRateLimit, rateLimitResponse, trustedClientKey } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const session = await getVerifiedSession();
    await enforceRateLimit(`phone-otp:${trustedClientKey(request, session.uid)}`, 3, 15 * 60 * 1000);
    const body = await request.json() as { countryCode?: unknown; phone?: unknown };
    const result = await issuePhoneOtp({ uid: session.uid, countryCode: typeof body.countryCode === 'string' ? body.countryCode.toUpperCase() : '', phone: typeof body.phone === 'string' ? body.phone : '' });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    if (error instanceof PhoneVerificationError) {
      const status = error.code === 'PROVIDER_UNAVAILABLE' ? 503 : error.code === 'RATE_LIMITED' ? 429 : 400;
      const message = error.code === 'PROVIDER_UNAVAILABLE' ? 'SMS verification is not configured yet. Contact support to complete verification.' : error.code === 'RATE_LIMITED' ? 'Please wait before requesting another code.' : 'Enter a valid international mobile number.';
      return NextResponse.json({ error: message, code: error.code }, { status });
    }
    console.error('Phone OTP request failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to send the verification code.' }, { status: 500 });
  }
}

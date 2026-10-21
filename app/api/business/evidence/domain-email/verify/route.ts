import { NextRequest, NextResponse } from 'next/server';
import { consumeDomainEmailToken, DomainEmailVerificationError } from '@/lib/business/domain-email-verification';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const url = new URL('/businesses/onboarding', request.url);
  try {
    await consumeDomainEmailToken(token);
    url.searchParams.set('domainEmailVerified', '1');
  } catch (error) {
    if (!(error instanceof DomainEmailVerificationError)) console.error('Business-domain email callback failed.');
    url.searchParams.set('domainEmailError', '1');
  }
  return NextResponse.redirect(url);
}

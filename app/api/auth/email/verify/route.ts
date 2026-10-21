import { NextRequest, NextResponse } from 'next/server';
import { consumeEmailVerificationToken, EmailVerificationError } from '@/lib/auth/email-verification';

function redirect(request: NextRequest, state: 'success' | 'error') {
  const url = new URL('/login', request.url);
  url.searchParams.set(state === 'success' ? 'emailVerified' : 'emailVerificationError', '1');
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  try {
    await consumeEmailVerificationToken(token);
    return redirect(request, 'success');
  } catch (error) {
    if (error instanceof EmailVerificationError) return redirect(request, 'error');
    console.error('Account email verification callback failed:', error instanceof Error ? error.message : 'unknown');
    return redirect(request, 'error');
  }
}

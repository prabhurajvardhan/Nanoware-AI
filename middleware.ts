import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Presence only provides UX routing. Protected server operations must verify
  // this HttpOnly Firebase session cookie with the Admin SDK.
  const sessionCookie = request.cookies.get('__session')?.value;
  
  const protectedRoutes = ['/revenue-loss-calculator', '/dashboard', '/reports', '/client-portal', '/billing', '/businesses/onboarding'];
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (isProtectedRoute && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if logged in and trying to access login page
  if (sessionCookie && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/revenue-loss-calculator/:path*', '/dashboard/:path*', '/reports/:path*', '/client-portal/:path*', '/billing/:path*', '/businesses/onboarding/:path*', '/login'],
};

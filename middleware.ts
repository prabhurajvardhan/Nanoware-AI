import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value;
  
  const protectedRoutes = ['/revenue-loss-calculator', '/dashboard', '/reports', '/client-portal'];
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (isProtectedRoute && !authToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if logged in and trying to access login page
  if (authToken && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/revenue-loss-calculator/:path*', '/dashboard/:path*', '/reports/:path*', '/client-portal/:path*', '/login'],
};

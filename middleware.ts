import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self' https:",
    "font-src 'self' data:",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
};

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  const isProtectedRoute = nextUrl.pathname.startsWith('/dashboard');
  const isAuthRoute =
    nextUrl.pathname.startsWith('/sign-in') ||
    nextUrl.pathname.startsWith('/sign-up') ||
    nextUrl.pathname.startsWith('/forgot-password') ||
    nextUrl.pathname.startsWith('/reset-password');

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/sign-in', nextUrl));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Apply security headers to every response
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
});

export const config = {
  matcher: [
    // Match all routes except static files and api
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

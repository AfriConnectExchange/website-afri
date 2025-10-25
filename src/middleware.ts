import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that should bypass onboarding gate
const PUBLIC_PATHS = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/auth/',
  '/onboarding/',
  '/static/',
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  if (isPublicPath(pathname)) return NextResponse.next();

  const cookie = req.headers.get('cookie') || '';

  // Forward the cookie to our internal onboarding-status API to check DB-backed profile fields
  try {
    const origin = process.env.NEXTAUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const res = await fetch(`${origin}/api/auth/onboarding-status`, {
      headers: { cookie },
      cache: 'no-store',
    });

    if (!res.ok) return NextResponse.next();
    const data = await res.json();

    if (data.authenticated && data.needsOnboarding) {
      // If already on onboarding path, allow
      if (pathname.startsWith('/onboarding')) return NextResponse.next();
      // Redirect to onboarding complete profile
      const url = new URL('/onboarding/complete-profile', req.url);
      return NextResponse.redirect(url);
    }
    // Best-effort: log a 'visit' activity for authenticated requests so IP/UA
    // are captured server-side. Fire-and-forget to avoid blocking the response.
    try {
      if (data.authenticated) {
        fetch(`${origin}/api/logs/activity`, {
          method: 'POST',
          headers: {
            cookie,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ event_type: 'visit', payload: { path: pathname } }),
          // do not rely on cached responses
          cache: 'no-store',
          // keepalive is only available in the browser; in middleware we just fire
        }).catch(() => {});
      }
    } catch (err) {
      // swallow logging errors; do not impact request flow
    }
  } catch (err) {
    console.error('Middleware onboarding check failed:', err);
    // On failure, allow the request to proceed (fail-open)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/marketplace/:path*', '/product/:path*', '/seller/:path*', '/transactions/:path*', '/orders/:path*', '/profile/:path*'],
};

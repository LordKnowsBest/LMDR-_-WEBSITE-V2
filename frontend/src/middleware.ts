import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Phase 3: Auth disabled — pass through all requests
  // Phase 4 will add Firebase Auth token verification
  if (process.env.DISABLE_AUTH === 'true') {
    return NextResponse.next();
  }

  const token = request.cookies.get('session')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/driver/:path*', '/carrier/:path*', '/admin/:path*', '/recruiter/:path*'],
};

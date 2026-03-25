import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = 'tc_petrobras';
const COOKIE_NAME = 'tc_auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sempre permitir: página de login, API de auth e assets estáticos
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const auth = request.cookies.get(COOKIE_NAME);
  if (auth?.value === PASSWORD) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

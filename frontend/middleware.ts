import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ONLY_ROUTES = [
  '/admin',
  '/dashboard',
  '/finance',
  '/suppliers',
  '/restock',
  '/settings',
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const role = request.cookies.get('user_role')?.value;
  const { pathname } = request.nextUrl;
  
  const isLoginPage = pathname.startsWith('/login');

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (token && isLoginPage) {
    const destination = role === 'admin' ? '/dashboard' : '/cashier';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (token && role !== 'admin') {
    const isTryingAdminRoute = ADMIN_ONLY_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    if (isTryingAdminRoute) {
      return NextResponse.redirect(new URL('/cashier', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
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
  // 1. Ambil token & role dari cookies
  const token = request.cookies.get('auth_token')?.value;
  const role = request.cookies.get('user_role')?.value;
  const { pathname } = request.nextUrl;
  
  // 2. Cek apakah user sedang mencoba membuka halaman /login
  const isLoginPage = pathname.startsWith('/login');

  // SKENARIO A: Belum punya token, dan mencoba buka halaman selain /login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // SKENARIO B: Sudah punya token, tapi membuka halaman /login lagi
  if (token && isLoginPage) {
    const destination = role === 'admin' ? '/dashboard' : '/cashier';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // SKENARIO C: User dengan role Kasir mencoba mengakses rute khusus Admin
  if (token && role === 'kasir') {
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
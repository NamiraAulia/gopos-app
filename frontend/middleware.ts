import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Ambil token dari cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // 2. Cek apakah user sedang mencoba membuka halaman /login
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  // SKENARIO A: Belum punya token, dan mencoba buka halaman selain /login
  if (!token && !isLoginPage) {
    // Tilang dan lempar ke halaman login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // SKENARIO B: Sudah punya token, tapi iseng buka halaman /login lagi
  if (token && isLoginPage) {
    // Langsung arahkan ke Kasir, nggak usah login ulang
    return NextResponse.redirect(new URL('/cashier', request.url));
  }

  // SKENARIO C: Semua aman, silakan lewat
  return NextResponse.next();
}

// Bagian konfigurasi matcher route Next.js
// Jangan jalankan middleware ini untuk file sistem Next.js (seperti gambar, CSS, dll)
export const config = {
  matcher: [
    /*
     * Match semua rute KECUALI:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
// proxy.js — WARKOP NUSANTARA (Next.js 16; dulu bernama middleware.js)
//
// Fungsi WAJIB bernama `proxy`. Berjalan di runtime Node.js. Lapisan 2 dari empat
// lapisan penjaga: KENYAMANAN, BUKAN PAGAR (cetak biru bagian 8). Keputusan
// otorisasi ada di lapisan 3 (layout) dan 4 (setiap route API).
//
// TERBUKTI 31 Agustus 2026 (Next.js 16.3.3, custom server, dev & produksi):
//   - berkas ini dijalankan; header yang diset di sini sampai ke halaman
//   - JEBAKAN: di bawah custom server, request.url dan request.nextUrl.host
//     berisi hostname:port yang diberikan ke next() (mis. 0.0.0.0:3000),
//     BUKAN host yang diminta pengguna. Pola dokumentasi Next.js
//     `NextResponse.redirect(new URL('/x', request.url))` akan mengalihkan ke
//     https://0.0.0.0:3000/x di produksi. Selalu pakai urlDariHeader() di bawah.
//
// Tahap 0: hanya kerangka + header uji. Tahap 2: isi logika sesungguhnya.

import { NextResponse } from 'next/server';

/** Susun URL absolut dari header yang dikirim Traefik/Cloudflare, bukan dari request.url. */
export function urlDariHeader(request, path) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return new URL(path, `${proto}://${host}`);
}

export function proxy(request) {
  const h = new Headers(request.headers);

  // --- Tahap 0: penanda uji, DIHAPUS di Tahap 2 ---
  h.set('x-uji-proxy', 'proxy-berjalan');

  // --- Tahap 2: pemisahan host (aktif hanya bila STAF_HOST terisi) ---
  // const stafHost = process.env.STAF_HOST || '';
  // const hostAsli = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  // const { pathname } = request.nextUrl;
  // if (stafHost) {
  //   const diHostStaf = hostAsli === stafHost;
  //   if (diHostStaf && !pathname.startsWith('/staf') && pathname !== '/login' && !pathname.startsWith('/api')) {
  //     return NextResponse.redirect(urlDariHeader(request, '/staf/dashboard'));
  //   }
  //   if (!diHostStaf && (pathname.startsWith('/staf') || pathname === '/login')) {
  //     return NextResponse.redirect(new URL(pathname, `https://${stafHost}`));
  //   }
  // }
  // ... verifikasi token dengan jose, set x-user-id / x-user-role, alihkan ke /login bila perlu

  return NextResponse.next({ request: { headers: h } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|logo-warkop.png|fonts|unggahan).*)'],
};

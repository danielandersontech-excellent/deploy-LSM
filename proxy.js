// proxy.js — WARKOP NUSANTARA (Next.js 16; dulu bernama middleware.js)
//
// Fungsi WAJIB bernama `proxy`. Berjalan di runtime Node.js. Lapisan 2 dari empat
// lapisan penjaga: KENYAMANAN, BUKAN PAGAR (cetak biru bagian 8). Keputusan
// otorisasi ada di lapisan 3 (layout: requireUser) dan 4 (setiap route API: requireRole).
//
// TERBUKTI (Tahap 0, Next.js 16.3.4, custom server, dev & produksi):
//   - berkas ini dijalankan; header yang diset di sini sampai ke halaman
//   - JEBAKAN: di bawah custom server, request.url dan request.nextUrl.host
//     berisi hostname:port yang diberikan ke next() (0.0.0.0:3000), BUKAN host
//     yang diminta pengguna. Setiap URL absolut WAJIB lewat urlDariHeader().
//
// Tugas (tipis, tanpa kueri basis data, tanpa modul bersama — jose diimpor langsung):
//   1. pemisahan host (hanya bila STAF_HOST terisi)
//   2. verifikasi tanda tangan JWT dari cookie -> header x-user-id / x-user-role
//      (token_version TIDAK diperiksa di sini; itu tugas lapisan 3/4 terhadap DB)
//   3. halaman /staf/* tanpa token sah -> /login

import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const NAMA_COOKIE = 'warkop_token';

/** Susun URL absolut dari header yang dikirim Traefik/Cloudflare, bukan dari request.url. */
export function urlDariHeader(request, path) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return new URL(path, `${proto}://${host}`);
}

/** Verifikasi tanda tangan + kedaluwarsa JWT saja (tanpa DB). null bila tidak sah. */
async function bacaToken(token) {
  const rahasia = process.env.JWT_SECRET;
  if (!token || !rahasia) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(rahasia), { algorithms: ['HS256'], issuer: 'warkop-nusantara' });
    return { id: String(payload.sub), peran: String(payload.peran || '') };
  } catch {
    return null;
  }
}

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const stafHost = process.env.STAF_HOST || '';
  const hostAsli = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const jalurStaf = pathname === '/staf' || pathname.startsWith('/staf/');
  const jalurLogin = pathname === '/login';
  const jalurApi = pathname.startsWith('/api/');
  const jalurBebasHost = jalurStaf || jalurLogin || jalurApi || pathname === '/tanpa-akses';

  // --- 1. pemisahan host (aktif hanya bila STAF_HOST terisi) ---
  if (stafHost) {
    const diHostStaf = hostAsli === stafHost;
    if (!diHostStaf && (jalurStaf || jalurLogin)) {
      // domain utama -> /staf/* atau /login: alihkan ke host staf (bukan 404)
      const proto = stafHost.startsWith('localhost') ? 'http' : 'https';
      return NextResponse.redirect(new URL(pathname + search, `${proto}://${stafHost}`));
    }
    if (diHostStaf && !jalurBebasHost) {
      // host staf hanya melayani ruang staf
      return NextResponse.redirect(urlDariHeader(request, '/staf/dashboard'));
    }
  }

  // --- 2. identitas dari cookie (tanda tangan saja) ---
  const muatan = await bacaToken(request.cookies.get(NAMA_COOKIE)?.value);
  const h = new Headers(request.headers);
  h.delete('x-user-id');   // cegah klien menyuntikkan header identitas
  h.delete('x-user-role');
  h.set('x-jalur', pathname); // QA-1: jalur permintaan untuk layout server (pengalihan wajib ganti sandi di sisi server)
  if (muatan) {
    h.set('x-user-id', muatan.id);
    h.set('x-user-role', muatan.peran);
  }

  // --- 3. halaman staf tanpa token -> /login ; sudah bertoken di /login -> dashboard ---
  if (jalurStaf && !muatan) {
    return NextResponse.redirect(urlDariHeader(request, `/login?lanjut=${encodeURIComponent(pathname)}`));
  }
  // QA-2 B0a: /login TIDAK dialihkan di sini. Tanda tangan JWT sah bukan berarti sesi sah (token_version naik setelah
  // ganti sandi/paksa keluar). Halaman /login memverifikasi sesi PENUH ke DB: sah -> dashboard; cookie ada tapi tak sah ->
  // /api/auth/bersihkan-sesi (hapus cookie) -> formulir. Pengalihan di sini menyebabkan loop ERR_TOO_MANY_REDIRECTS.

  return NextResponse.next({ request: { headers: h } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|logo-warkop.png|logo-warkop-besar.png|og-default.png|fonts|unggahan|penampung).*)'],
};

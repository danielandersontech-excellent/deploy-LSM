// GET /api/auth/bersihkan-sesi?lanjut=/staf/... — QA-2 B0a: menghapus cookie sesi yang TIDAK SAH (basi/kadaluarsa/akun
// nonaktif) lalu mengalihkan ke /login?lanjut=... sehingga formulir login tampil tanpa loop. Tidak butuh sesi.
// Hanya cookie yang dihapus (tidak ada perubahan data); `lanjut` dibatasi jalur /staf/* agar tidak menjadi open redirect.
import { NextResponse } from 'next/server';
import { NAMA_COOKIE, opsiHapusCookieSesi } from '@/lib/auth/sesi';
import { urlDariHeader } from '@/proxy';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const lanjutMentah = request.nextUrl.searchParams.get('lanjut') || '/staf/dashboard';
  const lanjut = /^\/staf(\/[A-Za-z0-9\-_/?=&%.]*)?$/.test(lanjutMentah) ? lanjutMentah : '/staf/dashboard';
  const balasan = NextResponse.redirect(urlDariHeader(request, `/login?lanjut=${encodeURIComponent(lanjut)}`), 307);
  balasan.cookies.set(NAMA_COOKIE, '', opsiHapusCookieSesi(request));
  balasan.headers.set('cache-control', 'no-store');
  return balasan;
}

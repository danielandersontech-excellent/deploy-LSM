// GET /api/artikel — daftar artikel PUBLIK, hanya status 'terbit' (SQL). Tanpa login.
// Query: ?kategori=<slug>&q=<kata>&halaman=&perHalaman=
import { NextResponse } from 'next/server';
import { ambilArtikelTerbit } from '@/lib/db/artikel';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const sp = request.nextUrl.searchParams;
    const hasil = await ambilArtikelTerbit({
      kategoriSlug: (sp.get('kategori') || '').slice(0, 60) || null,
      q: (sp.get('q') || '').trim().slice(0, 100) || null,
      halaman: sp.get('halaman'),
      perHalaman: sp.get('perHalaman'),
    });
    // Kolom yang dibalas ke publik: tanpa isi penuh, tanpa penulis_id (cukup nama).
    const baris = hasil.baris.map(({ penulis_id: _p, ...a }) => a);
    return NextResponse.json({ ...hasil, baris }, { headers: { 'cache-control': 'public, max-age=60' } });
  } catch (galat) {
    console.error('[api/artikel] galat:', galat?.message);
    return NextResponse.json({ galat: 'Terjadi kesalahan di server', kode: 'GALAT_SERVER' }, { status: 500 });
  }
}

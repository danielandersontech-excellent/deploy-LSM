// GET /api/artikel/[slug] — detail artikel TERBIT untuk publik (isi sudah bersih di DB,
// disanitasi lagi saat dibalas sebagai lapisan kedua). params wajib di-await (aturan 12).
import { NextResponse } from 'next/server';
import { ambilArtikelBySlug, ambilTagArtikel, ambilArtikelTerkait } from '@/lib/db/artikel';
import { sanitasiIsiArtikel } from '@/lib/sanitasi';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    if (!/^[a-z0-9-]{1,255}$/.test(String(slug))) {
      return NextResponse.json({ galat: 'Slug tidak sah', kode: 'SLUG_TIDAK_SAH' }, { status: 400 });
    }
    const artikel = await ambilArtikelBySlug(slug, { hanyaTerbit: true });
    if (!artikel) return NextResponse.json({ galat: 'Artikel tidak ditemukan', kode: 'TIDAK_DITEMUKAN' }, { status: 404 });
    const [tag, terkait] = await Promise.all([ambilTagArtikel(artikel.id), ambilArtikelTerkait(artikel.id, artikel.kategori_id, 3)]);
    const { penulis_id: _p, ...aman } = artikel;
    return NextResponse.json(
      { artikel: { ...aman, isi: sanitasiIsiArtikel(artikel.isi) }, tag, terkait: terkait.map(({ penulis_id: _q, ...t }) => t) },
      { headers: { 'cache-control': 'public, max-age=60' } },
    );
  } catch (galat) {
    console.error('[api/artikel/slug] galat:', galat?.message);
    return NextResponse.json({ galat: 'Terjadi kesalahan di server', kode: 'GALAT_SERVER' }, { status: 500 });
  }
}

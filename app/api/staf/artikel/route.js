// GET /api/staf/artikel — daftar artikel ruang staf (redaktur, penulis, superadmin, pimpinan_wilayah).
// Pembatasan: penulis = miliknya; pimpinan_wilayah = wilayahnya — keduanya di SQL (lib/db/artikel.js).
// POST (buat artikel) dibuat di Tahap 5.
import { NextResponse } from 'next/server';
import { denganPeran } from '@/lib/auth/penjaga';
import { HAK, wilayahTerbatas } from '@/lib/auth/hakAkses';
import { ambilArtikelStaf } from '@/lib/db/artikel';

export const dynamic = 'force-dynamic';

const STATUS_SAH = ['draf', 'terbit', 'arsip'];

export const GET = denganPeran(HAK.artikel_lihat, async (request, _konteks, pengguna) => {
  const sp = request.nextUrl.searchParams;
  const status = sp.get('status');
  const hasil = await ambilArtikelStaf({
    peran: pengguna.peran,
    userId: pengguna.id,
    wilayahId: wilayahTerbatas(pengguna),
    status: STATUS_SAH.includes(status) ? status : null,
    q: (sp.get('q') || '').slice(0, 100) || null,
    halaman: sp.get('halaman'),
    perHalaman: sp.get('perHalaman'),
  });
  return NextResponse.json(hasil, { headers: { 'cache-control': 'no-store' } });
});

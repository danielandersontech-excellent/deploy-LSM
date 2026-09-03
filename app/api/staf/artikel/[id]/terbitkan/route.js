// POST /api/staf/artikel/[id]/terbitkan — MENERBITKAN artikel: redaktur & superadmin SAJA
// (HAK.artikel_terbitkan). penulis -> 403 walau tombolnya dipaksa muncul (aturan 3).
// terbit_pada diisi dari aplikasi (waktuSekarang, WIB) — bukan NOW() (aturan 1). Audit 'artikel_terbit'.
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilArtikelById, terbitkanArtikel } from '@/lib/db/artikel';
import { catatAudit } from '@/lib/db/audit';
import { siarkanArtikelTerbit } from '@/lib/socket/siaran';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

export const POST = denganPeran(HAK.artikel_terbitkan, async (request, { params }, pengguna) => {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new GalatHttp(400, 'ID tidak sah', 'ID_TIDAK_SAH');
  const artikel = await ambilArtikelById(n);
  if (!artikel) throw new GalatHttp(404, 'Artikel tidak ditemukan', 'TIDAK_DITEMUKAN');
  if (!artikel.kategori_id) throw new GalatHttp(422, 'Artikel tanpa kategori tidak dapat diterbitkan (aturan 7)', 'KATEGORI_WAJIB');
  if (artikel.status === 'terbit') {
    return NextResponse.json({ artikel, sudahTerbit: true }, { headers: { 'cache-control': 'no-store' } });
  }
  await terbitkanArtikel(n);
  await catatAudit({ userId: pengguna.id, aksi: 'artikel_terbit', tabelTerkait: 'artikel', idTerkait: n,
    detail: { judul: artikel.judul, dari: artikel.status }, ip: await alamatIpPermintaan(request) });
  const terbit = await ambilArtikelById(n);
  // Siaran realtime (Tahap 8) lewat pembantu: hanya judul, slug, kategori, penulis.
  try { siarkanArtikelTerbit(terbit); } catch (g) { console.error('[api/terbitkan] siaran gagal:', g?.message); }
  return NextResponse.json({ artikel: terbit }, { headers: { 'cache-control': 'no-store' } });
});

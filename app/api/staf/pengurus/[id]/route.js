// /api/staf/pengurus/[id] — GET (konten_lihat), PATCH & DELETE (konten_kelola). params di-await.
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilPengurus, perbaruiPengurus, hapusPengurus } from '@/lib/db/pengurus';
import { validasiPengurus, GalatValidasiKonten } from '@/lib/validasi/konten';
import { periksaWilayahKelompok } from '@/lib/validasi/wilayahPengurus';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

async function idDari(params) {
  const { id } = await params; const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new GalatHttp(400, 'ID tidak sah', 'ID_TIDAK_SAH');
  return n;
}

export const GET = denganPeran(HAK.konten_lihat, async (_r, { params }) => {
  const id = await idDari(params);
  const p = await ambilPengurus(id);
  if (!p) throw new GalatHttp(404, 'Pengurus tidak ditemukan', 'TIDAK_DITEMUKAN');
  return NextResponse.json({ pengurus: p }, { headers: { 'cache-control': 'no-store' } });
});

export const PATCH = denganPeran(HAK.konten_kelola, async (request, { params }, pengguna) => {
  const id = await idDari(params);
  const lama = await ambilPengurus(id);
  if (!lama) throw new GalatHttp(404, 'Pengurus tidak ditemukan', 'TIDAK_DITEMUKAN');
  const body = await bacaJson(request);
  let m;
  try { m = validasiPengurus({ ...lama, aktif_sejak: lama.aktif_sejak, wilayah_id: lama.wilayah_id, ...body }); } catch (g) { if (g instanceof GalatValidasiKonten) throw new GalatHttp(g.status, g.message, g.kode); throw g; }
  await periksaWilayahKelompok(m);
  await perbaruiPengurus(id, m);
  await catatAudit({ userId: pengguna.id, aksi: 'pengurus_ubah', tabelTerkait: 'pengurus', idTerkait: id, detail: { nama: m.nama }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ pengurus: await ambilPengurus(id) }, { headers: { 'cache-control': 'no-store' } });
});

export const DELETE = denganPeran(HAK.konten_kelola, async (request, { params }, pengguna) => {
  const id = await idDari(params);
  const lama = await ambilPengurus(id);
  if (!lama) throw new GalatHttp(404, 'Pengurus tidak ditemukan', 'TIDAK_DITEMUKAN');
  await hapusPengurus(id);
  await catatAudit({ userId: pengguna.id, aksi: 'pengurus_hapus', tabelTerkait: 'pengurus', idTerkait: id, detail: { nama: lama.nama }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ dihapus: true, id }, { headers: { 'cache-control': 'no-store' } });
});

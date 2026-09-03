// /api/staf/galeri/[id] — GET (konten_lihat), PATCH (multipart/JSON; berkas opsional untuk mengganti) & DELETE (konten_kelola).
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilGaleriById, perbaruiGaleri, hapusGaleri } from '@/lib/db/galeri';
import { validasiGaleri, GalatValidasiKonten } from '@/lib/validasi/konten';
import { bacaMuatanGaleri, simpanBerkasGaleri } from '@/lib/galeriUnggah';
import { catatAudit } from '@/lib/db/audit';
import { jalurDiskUnggahan } from '@/lib/unggahan';
import { unlink } from 'node:fs/promises';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

/** DATE dari mysql2 (pool +07:00) -> 'YYYY-MM-DD' WIB tanpa bergantung zona waktu mesin (geser +7 jam, baca komponen UTC). */
function tanggalYMD(v) {
  if (!v) return null;
  if (v instanceof Date) return new Date(v.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

/** Hapus berkas unggahan galeri di disk (hanya jalur /unggahan/galeri/…); galat diabaikan (berkas mungkin sudah tidak ada). */
async function hapusBerkasGaleri(jalur) {
  if (!jalur || !String(jalur).startsWith('/unggahan/galeri/')) return;
  const b = await jalurDiskUnggahan(String(jalur).replace(/^\/unggahan\//, '').split('/'));
  if (b) await unlink(b.jalur).catch(() => {});
}

async function idDari(params) {
  const { id } = await params; const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new GalatHttp(400, 'ID tidak sah', 'ID_TIDAK_SAH');
  return n;
}

export const GET = denganPeran(HAK.konten_lihat, async (_r, { params }) => {
  const id = await idDari(params);
  const g = await ambilGaleriById(id);
  if (!g) throw new GalatHttp(404, 'Item galeri tidak ditemukan', 'TIDAK_DITEMUKAN');
  return NextResponse.json({ galeri: g }, { headers: { 'cache-control': 'no-store' } });
});

export const PATCH = denganPeran(HAK.konten_kelola, async (request, { params }, pengguna) => {
  const id = await idDari(params);
  const lama = await ambilGaleriById(id);
  if (!lama) throw new GalatHttp(404, 'Item galeri tidak ditemukan', 'TIDAK_DITEMUKAN');
  const { data, berkas, thumbnail } = await bacaMuatanGaleri(request);
  const jenis = data.jenis ? (data.jenis === 'video' ? 'video' : 'foto') : lama.jenis;
  const jalurBerkas = await simpanBerkasGaleri(berkas, jenis);
  const jalurThumb = await simpanBerkasGaleri(thumbnail, 'foto');
  let m;
  try {
    m = validasiGaleri({ ...lama, wilayah_id: lama.wilayah_id, tanggal_kegiatan: tanggalYMD(lama.tanggal_kegiatan), ...data, jenis, berkas: jalurBerkas ?? data.berkas ?? lama.berkas, thumbnail: jalurThumb ?? data.thumbnail ?? lama.thumbnail });
  } catch (g) { if (g instanceof GalatValidasiKonten) throw new GalatHttp(g.status, g.message, g.kode); throw g; }
  await perbaruiGaleri(id, m);
  await catatAudit({ userId: pengguna.id, aksi: 'galeri_ubah', tabelTerkait: 'galeri', idTerkait: id, detail: { judul: m.judul }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ galeri: await ambilGaleriById(id) }, { headers: { 'cache-control': 'no-store' } });
});

export const DELETE = denganPeran(HAK.konten_kelola, async (request, { params }, pengguna) => {
  const id = await idDari(params);
  const lama = await ambilGaleriById(id);
  if (!lama) throw new GalatHttp(404, 'Item galeri tidak ditemukan', 'TIDAK_DITEMUKAN');
  await hapusGaleri(id);
  await Promise.all([hapusBerkasGaleri(lama.berkas), hapusBerkasGaleri(lama.thumbnail)]); // berkas tidak yatim (temuan agen)
  await catatAudit({ userId: pengguna.id, aksi: 'galeri_hapus', tabelTerkait: 'galeri', idTerkait: id, detail: { judul: lama.judul }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ dihapus: true, id }, { headers: { 'cache-control': 'no-store' } });
});

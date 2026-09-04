// /api/staf/artikel/[id]
//   GET    — detail artikel untuk editor (peran artikel_lihat; penulis hanya miliknya;
//            pimpinan_wilayah hanya wilayahnya — diperiksa di sini, baca-saja).
//   PATCH  — sunting (penulis: MILIKNYA SAJA; redaktur, superadmin). Body JSON: judul, ringkasan, isi,
//            gambar_utama, kategori_id, wilayah_id, tag[]; opsional `status`: 'draf' | 'arsip'
//            (hanya redaktur/superadmin; menerbitkan HANYA lewat /terbitkan). Slug beku setelah terbit.
//   DELETE — hapus (redaktur, superadmin SAJA). Semua menulis audit_log. params wajib di-await.
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK, wilayahTerbatas } from '@/lib/auth/hakAkses';
import { ambilArtikelById, perbaruiArtikel, hapusArtikel, arsipkanArtikel, kembalikanKeDraf, ambilTagArtikel } from '@/lib/db/artikel';
import { validasiMuatanArtikel, GalatValidasi } from '@/lib/validasi/artikel';
import { pastikanKategoriArtikelAktif } from '@/lib/validasi/kategoriArtikel';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

async function idDari(params) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new GalatHttp(400, 'ID tidak sah', 'ID_TIDAK_SAH');
  return n;
}

/** Artikel yang boleh DILIHAT peran ini; 404 (bukan 403) agar keberadaan artikel lain tidak bocor. */
async function artikelTerjangkau(id, pengguna) {
  const artikel = await ambilArtikelById(id);
  if (!artikel) throw new GalatHttp(404, 'Artikel tidak ditemukan', 'TIDAK_DITEMUKAN');
  if (pengguna.peran === 'penulis' && Number(artikel.penulis_id) !== Number(pengguna.id)) {
    throw new GalatHttp(403, 'Penulis hanya boleh mengakses artikel miliknya sendiri', 'BUKAN_MILIK');
  }
  const wilayah = wilayahTerbatas(pengguna);
  if (wilayah !== null && Number(artikel.wilayah_id) !== wilayah) {
    throw new GalatHttp(404, 'Artikel tidak ditemukan', 'TIDAK_DITEMUKAN');
  }
  return artikel;
}

export const GET = denganPeran(HAK.artikel_lihat, async (_request, { params }, pengguna) => {
  const id = await idDari(params);
  const artikel = await artikelTerjangkau(id, pengguna);
  const tag = await ambilTagArtikel(id);
  return NextResponse.json({ artikel, tag }, { headers: { 'cache-control': 'no-store' } });
});

export const PATCH = denganPeran(HAK.artikel_sunting, async (request, { params }, pengguna) => {
  const id = await idDari(params);
  const artikel = await artikelTerjangkau(id, pengguna); // penulis: 403 bila bukan miliknya
  const body = await bacaJson(request);

  // Perubahan status draf/arsip (redaktur, superadmin) — TANPA menerbitkan.
  if (body && Object.prototype.hasOwnProperty.call(body, 'status') && Object.keys(body).length === 1) {
    if (!HAK.artikel_terbitkan.includes(pengguna.peran)) throw new GalatHttp(403, 'Hanya redaktur/superadmin yang boleh mengubah status', 'TIDAK_BERHAK');
    if (body.status === 'arsip') await arsipkanArtikel(id);
    else if (body.status === 'draf') await kembalikanKeDraf(id);
    else throw new GalatHttp(422, "Status hanya 'draf' atau 'arsip' (menerbitkan lewat /terbitkan)", 'STATUS_TIDAK_SAH');
    await catatAudit({ userId: pengguna.id, aksi: body.status === 'arsip' ? 'artikel_arsip' : 'artikel_ke_draf', tabelTerkait: 'artikel', idTerkait: id,
      detail: { dari: artikel.status }, ip: await alamatIpPermintaan(request) });
    return NextResponse.json({ artikel: await ambilArtikelById(id) }, { headers: { 'cache-control': 'no-store' } });
  }

  let muatan;
  try {
    muatan = validasiMuatanArtikel({ ...artikel, tag: undefined, ...body }); // field yang tidak dikirim mengikuti nilai lama
  } catch (galat) {
    if (galat instanceof GalatValidasi) throw new GalatHttp(galat.status, galat.message, galat.kode);
    throw galat;
  }
  await pastikanKategoriArtikelAktif(muatan.kategoriId);
  await perbaruiArtikel(id, { ...muatan, tag: Array.isArray(body.tag) || typeof body.tag === 'string' ? muatan.tag : null });
  await catatAudit({ userId: pengguna.id, aksi: 'artikel_sunting', tabelTerkait: 'artikel', idTerkait: id,
    detail: { judul: muatan.judul }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ artikel: await ambilArtikelById(id), tag: await ambilTagArtikel(id) }, { headers: { 'cache-control': 'no-store' } });
});

export const DELETE = denganPeran(HAK.artikel_hapus, async (request, { params }, pengguna) => {
  const id = await idDari(params);
  const artikel = await ambilArtikelById(id);
  if (!artikel) throw new GalatHttp(404, 'Artikel tidak ditemukan', 'TIDAK_DITEMUKAN');
  await hapusArtikel(id);
  await catatAudit({ userId: pengguna.id, aksi: 'artikel_hapus', tabelTerkait: 'artikel', idTerkait: id,
    detail: { judul: artikel.judul, status: artikel.status }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ dihapus: true, id }, { headers: { 'cache-control': 'no-store' } });
});

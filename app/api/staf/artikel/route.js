// /api/staf/artikel
//   GET  — daftar artikel ruang staf (redaktur, penulis, superadmin, pimpinan_wilayah).
//          Pembatasan: penulis = miliknya; pimpinan_wilayah = wilayahnya — keduanya di SQL.
//   POST — buat artikel (penulis, redaktur, superadmin), status awal DRAF. Kategori wajib (aturan 7),
//          isi disanitasi di server (lib/validasi/artikel.js -> lib/sanitasi.js), slug otomatis unik,
//          audit_log 'artikel_buat'.
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK, wilayahTerbatas } from '@/lib/auth/hakAkses';
import { ambilArtikelStaf, buatArtikel, ambilArtikelById } from '@/lib/db/artikel';
import { validasiMuatanArtikel, GalatValidasi } from '@/lib/validasi/artikel';
import { pastikanKategoriArtikelAktif } from '@/lib/validasi/kategoriArtikel';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

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

export const POST = denganPeran(HAK.artikel_buat, async (request, _konteks, pengguna) => {
  const body = await bacaJson(request);
  let muatan;
  try {
    muatan = validasiMuatanArtikel(body);
  } catch (galat) {
    if (galat instanceof GalatValidasi) throw new GalatHttp(galat.status, galat.message, galat.kode);
    throw galat;
  }
  await pastikanKategoriArtikelAktif(muatan.kategoriId);
  const id = await buatArtikel({ ...muatan, penulisId: pengguna.id });
  await catatAudit({ userId: pengguna.id, aksi: 'artikel_buat', tabelTerkait: 'artikel', idTerkait: id,
    detail: { judul: muatan.judul, kategoriId: muatan.kategoriId }, ip: await alamatIpPermintaan(request) });
  const artikel = await ambilArtikelById(id);
  return NextResponse.json({ artikel }, { status: 201, headers: { 'cache-control': 'no-store' } });
});

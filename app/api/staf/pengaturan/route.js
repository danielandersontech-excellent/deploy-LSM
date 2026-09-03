// /api/staf/pengaturan — superadmin SAJA (aturan 8, pelajaran Cap Jiki nomor 8).
//   GET   — seluruh setelan {kunci: nilai} + definisi (label, tipe, kelompok) untuk formulir.
//   PATCH — body {kunci: nilai, …}. DAFTAR PUTIH = KUNCI_PENGATURAN dari lib/pengaturanDefinisi.js (sumber
//           tunggal yang juga dipakai formulir & seed). Kunci di luar daftar DITOLAK 422 dengan pesan yang
//           menyebut kunci yang salah dan daftar yang diizinkan — TIDAK diabaikan diam-diam. Validasi tipe
//           per kunci (angka/teks/email/teks_panjang) di lib/validasi/pengaturan.js. Satu kunci salah =
//           seluruh kiriman ditolak (tidak ada simpan sebagian). Audit setiap simpan (kunci yang berubah).
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp, bacaJson } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { ambilPengaturan, simpanPengaturan } from '@/lib/db/pengaturan';
import { PENGATURAN_DEFINISI, KUNCI_PENGATURAN } from '@/lib/pengaturanDefinisi';
import { validasiPasanganPengaturan, GalatValidasiPengaturan } from '@/lib/validasi/pengaturan';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';

export const dynamic = 'force-dynamic';

export const GET = denganPeran(HAK.pengaturan_kelola, async () => {
  const nilai = await ambilPengaturan();
  return NextResponse.json({ nilai, definisi: PENGATURAN_DEFINISI, daftarPutih: KUNCI_PENGATURAN }, { headers: { 'cache-control': 'no-store' } });
});

export const PATCH = denganPeran(HAK.pengaturan_kelola, async (request, _k, pengguna) => {
  const body = await bacaJson(request);
  let bersih;
  try {
    bersih = validasiPasanganPengaturan(body);
  } catch (g) {
    if (g instanceof GalatValidasiPengaturan) throw new GalatHttp(g.status, g.message, g.kode);
    throw g;
  }
  let tersimpan;
  try {
    tersimpan = await simpanPengaturan(bersih);
  } catch (g) {
    if (g?.kode === 'KUNCI_TIDAK_SAH') throw new GalatHttp(422, g.message, g.kode); // lapisan kedua di lib/db
    throw g;
  }
  await catatAudit({ userId: pengguna.id, aksi: 'pengaturan_simpan', tabelTerkait: 'pengaturan', idTerkait: null, detail: { kunci: tersimpan }, ip: await alamatIpPermintaan(request) });
  return NextResponse.json({ tersimpan, nilai: await ambilPengaturan(tersimpan) }, { headers: { 'cache-control': 'no-store' } });
});

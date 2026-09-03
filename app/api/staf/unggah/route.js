// POST /api/staf/unggah — unggah gambar (penulis, redaktur, verifikator, superadmin).
// multipart/form-data, field `berkas` (+ opsional `tujuan`: 'artikel' | 'pengurus' | 'program' | 'galeri').
// Validasi di lib/unggahan.js: ukuran (UPLOAD_MAX_MB, gambar dibatasi 5 MB sesuai teks desain
// "Maks 5MB"), MAGIC BYTES, kompres ulang sharp, nama acak. Balasan: { jalur, namaBerkas, tipeMime, ukuran }.
import { NextResponse } from 'next/server';
import { denganPeran, GalatHttp } from '@/lib/auth/penjaga';
import { HAK } from '@/lib/auth/hakAkses';
import { simpanGambar, GalatUnggahan, batasByte } from '@/lib/unggahan';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';
import { periksaLaju, pesanDibatasi } from '@/lib/pembatasLajuUmum';

export const dynamic = 'force-dynamic';

const TUJUAN_SAH = ['artikel', 'pengurus', 'program', 'galeri'];
const MAKS_GAMBAR = Math.min(batasByte(), 5 * 1024 * 1024);

export const POST = denganPeran(HAK.unggah, async (request, _konteks, pengguna) => {
  // Tahap 9 B4: pembatas laju per akun (60/jam) — sebelum berkas dibaca.
  const laju = periksaLaju('unggah_staf', `u:${pengguna.id}`);
  if (laju.dibatasi) throw new GalatHttp(429, pesanDibatasi(laju.sisaDetik), 'DIBATASI');
  let form;
  try {
    form = await request.formData();
  } catch {
    throw new GalatHttp(400, 'Permintaan harus multipart/form-data dengan field "berkas"', 'FORM_TIDAK_SAH');
  }
  const berkas = form.get('berkas');
  if (!berkas || typeof berkas === 'string') throw new GalatHttp(400, 'Field "berkas" wajib berupa berkas', 'BERKAS_KOSONG');
  const tujuan = TUJUAN_SAH.includes(form.get('tujuan')) ? form.get('tujuan') : 'artikel';

  // Batas ukuran diperiksa dari header dulu agar berkas raksasa tidak dibaca ke memori.
  if (berkas.size > MAKS_GAMBAR) {
    throw new GalatHttp(413, `Ukuran berkas melebihi batas ${Math.round(MAKS_GAMBAR / 1024 / 1024)} MB`, 'TERLALU_BESAR');
  }
  const buffer = Buffer.from(await berkas.arrayBuffer());
  try {
    const hasil = await simpanGambar(buffer, { subfolder: tujuan, maksByte: MAKS_GAMBAR });
    await catatAudit({ userId: pengguna.id, aksi: 'unggah_gambar', tabelTerkait: null, idTerkait: null,
      detail: { tujuan, namaBerkas: hasil.namaBerkas, ukuran: hasil.ukuran, tipe: hasil.tipeMime }, ip: await alamatIpPermintaan(request) });
    return NextResponse.json(hasil, { status: 201, headers: { 'cache-control': 'no-store' } });
  } catch (galat) {
    if (galat instanceof GalatUnggahan) throw new GalatHttp(galat.status, galat.message, galat.kode);
    throw galat;
  }
});

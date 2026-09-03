// POST /api/pengaduan — kirim pengaduan (PUBLIK, tanpa login). TAHAP-06 §2, §9, §10, §11.
// Menerima multipart/form-data (formulir + lampiran) ATAU JSON (tanpa lampiran).
// Lapisan perlindungan di sini:
//   1. pembatas laju per IP (lib/pembatasLajuUmum: 10 kiriman / 60 menit) — 429 dengan pesan netral,
//   2. honeypot `situs_web` (harus kosong) + token formulir bertanda waktu (lib/tokenFormulir) —
//      tantangan sederhana tanpa CAPTCHA pihak ketiga,
//   3. validasi server (lib/validasi/pengaduan): anonim === true -> identitas DIABAIKAN dan disimpan NULL,
//      apa pun yang ikut terkirim (lapisan kedua; lapisan pertama = formulir tidak mengirimnya),
//   4. lampiran: maks 5 berkas, 20 MB/berkas (UPLOAD_MAX_MB), total 40 MB, magic bytes jpg/png/webp/pdf/mp4,
//      nama acak di subfolder acak di direktori TERJAGA (UPLOAD_PRIVATE_DIR/pengaduan/<acak>/...) di LUAR public/,
//      hanya bisa dibaca lewat /api/staf/pengaduan/[id]/lampiran/[lampiranId] (requireRole),
//   5. semuanya dalam SATU transaksi buku besar (buatPengaduan: pengaduan + riwayat pertama).
// Balasan hanya nomor kasus — tidak pernah memantulkan identitas.
import { NextResponse } from 'next/server';
import { buatPengaduan, tambahLampiran } from '@/lib/db/pengaduan';
import { validasiKirimanPengaduan, GalatValidasiPengaduan } from '@/lib/validasi/pengaduan';
import { periksaLaju, pesanDibatasi } from '@/lib/pembatasLajuUmum';
import { periksaTokenFormulir } from '@/lib/tokenFormulir';
import { simpanLampiran, GalatUnggahan, batasByte, kenaliTipe, JENIS_LAMPIRAN } from '@/lib/unggahan';
import { catatAudit } from '@/lib/db/audit';
import { alamatIpPermintaan } from '@/lib/auth/sesi';
import { randomBytes } from 'node:crypto';

export const dynamic = 'force-dynamic';

const MAKS_BERKAS = 5;
const MAKS_TOTAL = 40 * 1024 * 1024;

function galat(status, pesan, kode, tambahan = {}) {
  return NextResponse.json({ galat: pesan, kode, ...tambahan }, { status, headers: { 'cache-control': 'no-store' } });
}

export async function POST(request) {
  const ip = await alamatIpPermintaan(request);
  const laju = periksaLaju('pengaduan', ip);
  if (laju.dibatasi) {
    return galat(429, pesanDibatasi(laju.sisaDetik), 'TERLALU_BANYAK', { sisaDetik: laju.sisaDetik });
  }

  // Tolak lebih awal bila Content-Length jelas melampaui total lampiran yang diizinkan (pesan jelas, bukan 400 generik).
  const panjang = Number(request.headers.get('content-length') || 0);
  if (panjang > MAKS_TOTAL + 2 * 1024 * 1024) {
    return galat(413, `Total kiriman terlalu besar (maksimal ${Math.round(MAKS_TOTAL / 1024 / 1024)} MB untuk seluruh lampiran)`, 'LAMPIRAN_TOTAL_TERLALU_BESAR');
  }

  // --- baca muatan: multipart (formulir) atau JSON ---
  let data = {};
  const berkas = [];
  const tipe = request.headers.get('content-type') || '';
  try {
    if (tipe.includes('multipart/form-data')) {
      const form = await request.formData();
      for (const [k, v] of form.entries()) {
        if (typeof v === 'string') data[k] = v;
        else if (k === 'lampiran' || k === 'lampiran[]') berkas.push(v);
      }
    } else {
      data = await request.json();
    }
  } catch {
    // Body multipart yang terlalu besar gagal diurai — beri pesan ukuran yang jelas, bukan 400 generik.
    if (panjang > batasByte()) {
      return galat(413, `Kiriman terlalu besar: setiap lampiran maksimal ${Math.round(batasByte() / 1024 / 1024)} MB`, 'LAMPIRAN_TERLALU_BESAR');
    }
    return galat(400, 'Muatan tidak sah', 'MUATAN_TIDAK_SAH');
  }

  // --- tantangan sederhana: honeypot + token formulir ---
  if (typeof data.situs_web === 'string' && data.situs_web.trim() !== '') {
    // Bot mengisi field tersembunyi. Balasan dibuat seolah sukses agar bot tidak belajar,
    // tetapi tidak ada yang disimpan.
    return NextResponse.json({ nomorKasus: `WRP-${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`, anonim: true, diterima: false }, { status: 202 });
  }
  const token = periksaTokenFormulir(data.token_formulir);
  if (!token.sah) {
    const pesan = token.alasan === 'TERLALU_CEPAT'
      ? 'Formulir terkirim terlalu cepat. Mohon periksa kembali isian Anda lalu kirim lagi.'
      : 'Sesi formulir tidak sah atau sudah kedaluwarsa. Muat ulang halaman lalu kirim lagi.';
    return galat(400, pesan, token.alasan);
  }

  // --- validasi (anonim -> identitas NULL) ---
  let muatan;
  try {
    muatan = validasiKirimanPengaduan(data);
  } catch (g) {
    if (g instanceof GalatValidasiPengaduan) return galat(g.status, g.message, g.kode, { bidang: g.bidang });
    throw g;
  }

  // --- lampiran: validasi dulu SEBELUM menulis apa pun ---
  if (berkas.length > MAKS_BERKAS) return galat(422, `Maksimal ${MAKS_BERKAS} berkas lampiran`, 'LAMPIRAN_TERLALU_BANYAK');
  const perBerkas = batasByte();
  let total = 0;
  for (const b of berkas) {
    if (b.size > perBerkas) return galat(413, `Setiap lampiran maksimal ${Math.round(perBerkas / 1024 / 1024)} MB`, 'LAMPIRAN_TERLALU_BESAR');
    total += b.size;
  }
  if (total > MAKS_TOTAL) return galat(413, `Total lampiran maksimal ${Math.round(MAKS_TOTAL / 1024 / 1024)} MB`, 'LAMPIRAN_TOTAL_TERLALU_BESAR');
  // Magic bytes diperiksa SEBELUM pengaduan dibuat agar kiriman dengan lampiran palsu ditolak utuh
  // (tidak ada pengaduan setengah jadi).
  const bufferLampiran = [];
  for (const b of berkas) {
    const buffer = Buffer.from(await b.arrayBuffer());
    if (!kenaliTipe(buffer, JENIS_LAMPIRAN)) return galat(415, 'Lampiran ditolak: format harus JPG, PNG, WebP, PDF, atau MP4 (isi berkas tidak cocok)', 'LAMPIRAN_TIPE_TIDAK_SAH');
    bufferLampiran.push(buffer);
  }

  try {
    const { id, nomorKasus } = await buatPengaduan(muatan);
    // Subfolder acak per pengaduan: jalur tidak bisa ditebak dan tidak dilayani /unggahan publik.
    // Direktori TERJAGA di luar public/ (UPLOAD_PRIVATE_DIR): tidak pernah dilayani statis maupun /unggahan.
    const sub = `pengaduan/${randomBytes(12).toString('hex')}`;
    const tersimpan = [];
    for (const buffer of bufferLampiran) {
      const hasil = await simpanLampiran(buffer, { subfolder: sub, maksByte: perBerkas, terjaga: true });
      await tambahLampiran({ pengaduanId: id, namaBerkas: hasil.namaBerkas, path: hasil.jalur, tipeMime: hasil.tipeMime, ukuran: hasil.ukuran });
      tersimpan.push(hasil.tipeMime);
    }
    // Audit tanpa identitas: hanya id pengaduan, anonim, jumlah lampiran, IP.
    await catatAudit({ userId: null, aksi: 'pengaduan_masuk', tabelTerkait: 'pengaduan', idTerkait: id,
      detail: { anonim: muatan.anonim, lampiran: tersimpan.length }, ip });
    return NextResponse.json({ nomorKasus, anonim: muatan.anonim, lampiran: tersimpan.length, diterima: true }, { status: 201, headers: { 'cache-control': 'no-store' } });
  } catch (g) {
    if (g instanceof GalatUnggahan) return galat(g.status, `Lampiran ditolak: ${g.message}`, g.kode);
    console.error('[api/pengaduan] galat:', g?.message);
    return galat(500, 'Laporan belum dapat disimpan karena gangguan server. Silakan coba lagi beberapa saat.', 'GALAT_SERVER');
  }
}

#!/usr/bin/env node
// QA-2 C3a — LAMPIRAN PENGADUAN: semua jenis yang dijanjikan (JPG, PNG, WebP, PDF, MP4) dan SEMUA BATAS
// (5 berkas, 20 MB per berkas, 40 MB total, magic bytes, pembatas laju 10 kiriman/jam per IP).
// Tiap lampiran yang tersimpan dibuka kembali oleh verifikator (200 + content-type benar + nosniff) dan
// DITOLAK tanpa sesi (401) — identitas pelapor tidak pernah ikut ke jalur publik.
// Berkas uji dibuat di memori (sharp untuk gambar; PDF/MP4 dari magic bytes) — tidak ada berkas dari internet (K1).
// Urutan kiriman disusun agar POST ke-11 tepat menabrak pembatas laju (bukti 429), lalu data uji dihapus lunak.
// Pemakaian: node laporan/bukti-qa-2/skrip/uji-c3a-lampiran.mjs [URL]   (bawaan http://127.0.0.1:3000)
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { buatTokenFormulir } from '../../../lib/tokenFormulir.js';

const U = process.argv[2] || 'http://127.0.0.1:3000';
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim()]));
let no = 0, gagal = 0; const nomorUji = [];
const langkah = async (teks, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${teks} → ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${teks} → GAGAL: ${g.message}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };
const api = async (metode, jalur, tk, badan, ip = null) => {
  const h = { ...(badan instanceof FormData ? {} : badan ? { 'content-type': 'application/json' } : {}), ...(tk ? { cookie: `warkop_token=${tk}` } : {}), ...(ip ? { 'x-forwarded-for': ip } : {}) };
  const r = await fetch(`${U}${jalur}`, { method: metode, headers: h, body: badan instanceof FormData ? badan : badan ? JSON.stringify(badan) : undefined, redirect: 'manual' });
  let j; try { j = await r.clone().json(); } catch { j = { teks: (await r.text()).slice(0, 120) }; }
  return { s: r.status, j, h: r.headers };
};
const login = async (email, sandi) => { const { s, h } = await api('POST', '/api/auth/login', null, { email, kataSandi: sandi }); wajib(s === 200, `login ${email} HTTP ${s}`); return ((h.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1]; };

// --- berkas uji dibuat sendiri (K1: tidak ada berkas dari internet) ---
const gambar = (w, h) => sharp({ create: { width: w, height: h, channels: 3, background: { r: 210, g: 190, b: 150 } } });
const JPG = await gambar(64, 48).jpeg().toBuffer();
const PNG = await gambar(64, 48).png().toBuffer();
const WEBP = await gambar(64, 48).webp().toBuffer();
// PDF minimal yang sah (magic %PDF-)
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n', 'latin1');
// MP4 minimal: kotak ftyp (byte 4..7 = "ftyp") + isi penambal
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.from([0, 0, 2, 0]), Buffer.from('isomiso2mp41'), Buffer.alloc(256)]);
// Berkas yang HARUS ditolak: skrip Windows (MZ) dan SVG (teks) — keduanya bukan jenis yang diizinkan
const EXE = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(512, 0x90)]);
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'utf8');
const besar = (mb) => Buffer.concat([PNG, Buffer.alloc(mb * 1024 * 1024)]); // PNG sah di depan, penambal di belakang

const formulir = (deskripsi, berkasList = []) => {
  const f = new FormData();
  f.append('token_formulir', buatTokenFormulir(Date.now() - 5000));
  f.append('anonim', 'true');
  f.append('kategori_masalah', 'lainnya');
  f.append('wilayah_id', '13');
  f.append('deskripsi', deskripsi);
  for (const [buf, nama, tipe] of berkasList) f.append('lampiran', new Blob([buf], { type: tipe }), nama);
  return f;
};
const DESKRIPSI = 'Uji QA-2 C3a lampiran pengaduan; data uji ini dihapus lunak pada akhir skrip.';
// Tiap kelompok uji memakai alamat IP pelapor berbeda (rentang dokumentasi RFC 5737) agar kuota pembatas laju
// 10 kiriman/jam per IP tidak habis di tengah kelompok; kelompok C sengaja menghabiskan kuota satu IP.
// Alamat diacak tiap kali skrip dijalankan: pembatas laju hidup di memori proses peladen selama 60 menit,
// jadi alamat tetap akan membuat pengulangan uji dalam satu jam gagal karena sisa kuota lari sebelumnya.
const oktet = () => 1 + Math.floor(Math.random() * 250);
const [IP_A, IP_B, IP_C, IP_D] = [`203.0.113.${oktet()}`, `203.0.113.${oktet()}`, `203.0.113.${oktet()}`, `203.0.113.${oktet()}`];

console.log(`# QA-2 C3a — lampiran pengaduan: jenis & batas — ${U} — ${new Date().toISOString()}`);
const tkVerifikator = await login('siti.aminah@warkopnusantara.id', env.SEED_STAF_PASSWORD);

// Membuka lampiran sebagai verifikator dan memastikan pagar peran bekerja.
const bukaLampiran = async (nomor, harapTipe) => {
  const d = await api('GET', `/api/staf/pengaduan?q=${nomor}`, tkVerifikator);
  const baris = (d.j.baris || []).find((x) => x.nomor_kasus === nomor);
  wajib(baris, 'pengaduan tidak ditemukan di daftar staf');
  const det = await api('GET', `/api/staf/pengaduan/${baris.id}`, tkVerifikator);
  const hasil = [];
  for (const l of det.j.lampiran || []) {
    const url = l.url || `/api/staf/pengaduan/${baris.id}/lampiran/${l.id}`;
    const r = await fetch(`${U}${url}`, { headers: { cookie: `warkop_token=${tkVerifikator}` } });
    const ct = r.headers.get('content-type') || '';
    wajib(r.status === 200, `lampiran ${url} HTTP ${r.status}`);
    wajib(r.headers.get('x-content-type-options') === 'nosniff', 'lampiran tanpa nosniff');
    const r2 = await fetch(`${U}${url}`);
    wajib(r2.status === 401, `lampiran tanpa sesi ${r2.status} (harus 401)`);
    hasil.push(ct.split(';')[0]);
  }
  if (harapTipe) wajib(hasil.includes(harapTipe), `content-type ${hasil.join(',')} tidak memuat ${harapTipe}`);
  return hasil;
};

console.log('\n## A. Lima jenis lampiran yang dijanjikan (kiriman 1-5)');
for (const [nama, buf, berkasNama, mime, harap] of [
  ['JPG', JPG, 'bukti.jpg', 'image/jpeg', 'image/jpeg'],
  ['PNG', PNG, 'bukti.png', 'image/png', 'image/png'],
  ['WebP', WEBP, 'bukti.webp', 'image/webp', 'image/webp'],
  ['PDF', PDF, 'dokumen.pdf', 'application/pdf', 'application/pdf'],
  ['MP4', MP4, 'rekaman.mp4', 'video/mp4', 'video/mp4'],
]) {
  await langkah(`lampiran ${nama} → 201 lampiran=1; verifikator membuka 200 ${harap} + nosniff; tanpa sesi 401`, async () => {
    const { s, j } = await api('POST', '/api/pengaduan', null, formulir(DESKRIPSI, [[buf, berkasNama, mime]]), IP_A);
    wajib(s === 201 && j.lampiran === 1, `HTTP ${s} ${JSON.stringify(j).slice(0, 140)}`);
    nomorUji.push(j.nomorKasus);
    const ct = await bukaLampiran(j.nomorKasus, harap);
    return `201 ${j.nomorKasus}; content-type ${ct.join(',')}`;
  });
}

console.log('\n## B. Batas jumlah, ukuran per berkas, ukuran total, dan jenis (kiriman 6-10)');
await langkah('5 lampiran sekaligus (batas jumlah) → 201 lampiran=5; kelimanya bisa dibuka verifikator', async () => {
  const { s, j } = await api('POST', '/api/pengaduan', null, formulir(DESKRIPSI, [[JPG, 'a.jpg', 'image/jpeg'], [PNG, 'b.png', 'image/png'], [WEBP, 'c.webp', 'image/webp'], [PDF, 'd.pdf', 'application/pdf'], [MP4, 'e.mp4', 'video/mp4']]), IP_A);
  wajib(s === 201 && j.lampiran === 5, `HTTP ${s} ${JSON.stringify(j).slice(0, 140)}`);
  nomorUji.push(j.nomorKasus);
  const ct = await bukaLampiran(j.nomorKasus);
  wajib(ct.length === 5, `hanya ${ct.length} lampiran terbaca`);
  return `201 ${j.nomorKasus}; 5 lampiran terbuka (${ct.join(',')})`;
});
await langkah('6 lampiran (melewati batas jumlah) → 422 LAMPIRAN_TERLALU_BANYAK, tanpa pengaduan baru', async () => {
  const sebelum = (await api('GET', '/api/staf/pengaduan?perHalaman=1', tkVerifikator)).j.total;
  const { s, j } = await api('POST', '/api/pengaduan', null, formulir(DESKRIPSI, [[JPG, 'a.jpg', 'image/jpeg'], [PNG, 'b.png', 'image/png'], [WEBP, 'c.webp', 'image/webp'], [PDF, 'd.pdf', 'application/pdf'], [MP4, 'e.mp4', 'video/mp4'], [PNG, 'f.png', 'image/png']]), IP_B);
  wajib(s === 422 && j.kode === 'LAMPIRAN_TERLALU_BANYAK', `HTTP ${s} ${JSON.stringify(j).slice(0, 140)}`);
  const sesudah = (await api('GET', '/api/staf/pengaduan?perHalaman=1', tkVerifikator)).j.total;
  wajib(sebelum === sesudah, `jumlah pengaduan berubah ${sebelum} → ${sesudah}`);
  return `422 ${j.kode}; total pengaduan tetap ${sesudah}`;
});
await langkah('lampiran 21 MB (melewati 20 MB per berkas) → 413 LAMPIRAN_TERLALU_BESAR', async () => {
  const { s, j } = await api('POST', '/api/pengaduan', null, formulir(DESKRIPSI, [[besar(21), 'besar.png', 'image/png']]), IP_B);
  wajib(s === 413 && /TERLALU_BESAR/.test(j.kode || ''), `HTTP ${s} ${JSON.stringify(j).slice(0, 140)}`);
  return `413 ${j.kode}`;
});
await langkah('3 lampiran 15 MB (total 45 MB > 40 MB) → 413 LAMPIRAN_TOTAL_TERLALU_BESAR', async () => {
  const b = besar(15);
  const { s, j } = await api('POST', '/api/pengaduan', null, formulir(DESKRIPSI, [[b, 'a.png', 'image/png'], [b, 'b.png', 'image/png'], [b, 'c.png', 'image/png']]), IP_B);
  wajib(s === 413 && /TOTAL_TERLALU_BESAR/.test(j.kode || ''), `HTTP ${s} ${JSON.stringify(j).slice(0, 140)}`);
  return `413 ${j.kode}`;
});
await langkah('lampiran palsu (EXE bernama .jpg dan SVG bernama .png) → 415 LAMPIRAN_TIPE_TIDAK_SAH', async () => {
  const a = await api('POST', '/api/pengaduan', null, formulir(DESKRIPSI, [[EXE, 'gambar.jpg', 'image/jpeg']]), IP_B);
  wajib(a.s === 415 && a.j.kode === 'LAMPIRAN_TIPE_TIDAK_SAH', `EXE HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 120)}`);
  const b = await api('POST', '/api/pengaduan', null, formulir(DESKRIPSI, [[SVG, 'gambar.png', 'image/png']]), IP_B);
  wajib(b.s === 415 && b.j.kode === 'LAMPIRAN_TIPE_TIDAK_SAH', `SVG HTTP ${b.s} ${JSON.stringify(b.j).slice(0, 120)}`);
  return `415 ${a.j.kode} untuk EXE dan SVG`;
});

console.log('\n## C. Pembatas laju pengaduan (10 kiriman/jam per IP)');
await langkah('10 kiriman sah dari satu IP → semua 201; ke-11 → 429 pesan netral + sisaDetik; IP lain tidak ikut terkunci', async () => {
  for (let i = 1; i <= 10; i++) {
    const { s, j } = await api('POST', '/api/pengaduan', null, formulir(`${DESKRIPSI} Kiriman ke-${i} untuk menguji pembatas laju.`), IP_C);
    wajib(s === 201, `kiriman ke-${i} HTTP ${s} ${JSON.stringify(j).slice(0, 120)}`);
    nomorUji.push(j.nomorKasus);
  }
  const { s, j } = await api('POST', '/api/pengaduan', null, formulir(DESKRIPSI), IP_C);
  wajib(s === 429 && j.kode === 'TERLALU_BANYAK', `ke-11 HTTP ${s} ${JSON.stringify(j).slice(0, 140)}`);
  // balasan galat route ini memakai kolom `galat` (bukan `pesan`) — pesan harus ada dan tidak menyalahkan pelapor
  const pesan = j.galat || '';
  wajib(pesan.length > 20, `balasan 429 tanpa pesan untuk pelapor: ${JSON.stringify(j).slice(0, 120)}`);
  wajib(!/salah|dilarang|spam|penyalahgunaan/i.test(pesan), `pesan menyalahkan pelapor: ${pesan}`);
  wajib(Number(j.sisaDetik) > 0, 'sisaDetik tidak ada');
  const lain = await api('POST', '/api/pengaduan', null, formulir(`${DESKRIPSI} Kiriman dari IP lain sesudah IP pertama dibatasi.`), IP_D);
  wajib(lain.s === 201, `IP lain ikut dibatasi: HTTP ${lain.s}`);
  nomorUji.push(lain.j.nomorKasus);
  return `10x 201; ke-11 429 "${pesan.slice(0, 60)}..." sisaDetik ${j.sisaDetik}; IP lain tetap 201`;
});

console.log('\n## D. Pembersihan data uji');
await langkah('pengaduan uji dihapus lunak', async () => {
  const { kueri, tutupPool } = await import('../../../lib/db/index.js');
  const { waktuSekarang } = await import('../../../lib/utils.js');
  if (!nomorUji.length) { await tutupPool(); return 'tidak ada data uji'; }
  const tanda = nomorUji.map(() => '?').join(',');
  const r = await kueri(`UPDATE pengaduan SET dihapus_pada=?, diperbarui_pada=? WHERE nomor_kasus IN (${tanda}) AND dihapus_pada IS NULL`, [waktuSekarang(), waktuSekarang(), ...nomorUji]);
  await tutupPool();
  return `${r.affectedRows} pengaduan (${nomorUji.join(', ')})`;
});

console.log(`\nRINGKASAN C3a: ${no} langkah, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);

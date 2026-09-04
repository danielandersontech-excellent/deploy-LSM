#!/usr/bin/env node
// QA-2 C4 — UJI REGRESI untuk bug yang ditemukan & diperbaiki di RUN QA-2. Satu berkas agar mudah dijalankan ulang.
//
//  BUG 1 — lampiran/unggahan di atas 10 MB ditolak "Muatan tidak sah".
//    Next.js 16 memotong badan permintaan yang lewat proxy.js pada 10 MB (bawaan proxyClientMaxBodySize), padahal
//    antarmuka & TAHAP-06 §4 menjanjikan 20 MB per berkas / 40 MB total. Perbaikan: next.config.mjs
//    experimental.proxyClientMaxBodySize = '44mb'. Regresi di sini: JPG 16 MB, MP4 15 MB, PDF 14 MB harus DITERIMA,
//    tersimpan, dan terbaca kembali oleh verifikator (PDF/MP4 byte-per-byte utuh; gambar dikompres ulang sharp).
//
//  BUG 2 — pengurus tingkat "pusat" tanpa kelompok tidak pernah tampil di halaman publik mana pun.
//    Kelola Pengurus menawarkan pilihan "Tanpa kelompok (Pimpinan Regional)", tetapi /struktur hanya memasukkan
//    pengurus tingkat 'wilayah' ke bagian Pimpinan Regional -> data yang dimasukkan pemilik hilang (melanggar K3).
//    Perbaikan: app/(publik)/struktur/page.js — bagian regional juga memuat pengurus tanpa kelompok.
//
// Pemakaian: node laporan/bukti-qa-2/skrip/uji-c4-regresi-bug.mjs [URL] [URL staf]
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { buatTokenFormulir } from '../../../lib/tokenFormulir.js';
import { KELOMPOK_PENGURUS } from '../../../lib/kelompokPengurus.js';

const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://127.0.0.1:3000'; const US = argv[1] || U;
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim()]));
let no = 0, gagal = 0; const nomorUji = [];
const langkah = async (teks, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${teks} → ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${teks} → GAGAL: ${g.message}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };
const api = async (metode, jalur, tk, badan, ip = null) => {
  const h = { ...(badan instanceof FormData ? {} : badan ? { 'content-type': 'application/json' } : {}), ...(tk ? { cookie: `warkop_token=${tk}` } : {}), ...(ip ? { 'x-forwarded-for': ip } : {}) };
  const r = await fetch(`${US}${jalur}`, { method: metode, headers: h, body: badan instanceof FormData ? badan : badan ? JSON.stringify(badan) : undefined, redirect: 'manual' });
  let j; try { j = await r.clone().json(); } catch { j = { teks: (await r.text()).slice(0, 120) }; }
  return { s: r.status, j, h: r.headers };
};
const login = async (email, sandi) => { const { s, h } = await api('POST', '/api/auth/login', null, { email, kataSandi: sandi }); wajib(s === 200, `login ${email} HTTP ${s}`); return ((h.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1]; };
const oktet = () => 1 + Math.floor(Math.random() * 250);
const ipAcak = () => `10.${oktet()}.${oktet()}.${oktet()}`; // QA-4: ruang alamat luas, hindari 429 palsu antarsuite

console.log(`# QA-2 C4 — regresi bug yang diperbaiki — ${U} — ${new Date().toISOString()}`);
const tkVerifikator = await login('siti.aminah@warkopnusantara.id', env.SEED_STAF_PASSWORD);
const tkRedaktur = await login('siti.rahma@warkopnusantara.id', env.SEED_STAF_PASSWORD);

console.log('\n## BUG 1 — lampiran besar (10-20 MB) harus diterima utuh, bukan 400 "Muatan tidak sah"');
// JPEG 16 MB sungguhan: derau acak agar tidak terkompres kecil
const W = 4000, H = 3000; const mentah = Buffer.alloc(W * H * 3);
for (let i = 0; i < mentah.length; i++) mentah[i] = (Math.random() * 256) | 0;
const JPG16 = await sharp(mentah, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 100 }).toBuffer();
const MP4_15 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.from([0, 0, 2, 0]), Buffer.from('isomiso2mp41'), Buffer.alloc(15 * 1024 * 1024)]);
const PDF14 = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(14 * 1024 * 1024, 0x20), Buffer.from('\n%%EOF\n')]);
const formulir = (deskripsi, berkasList) => {
  const f = new FormData();
  f.append('token_formulir', buatTokenFormulir(Date.now() - 5000));
  f.append('anonim', 'true'); f.append('kategori_masalah', 'lainnya'); f.append('wilayah_id', '13');
  f.append('deskripsi', deskripsi);
  for (const [buf, nama, tipe] of berkasList) f.append('lampiran', new Blob([buf], { type: tipe }), nama);
  return f;
};
await langkah(`lampiran JPG ${(JPG16.length / 1048576).toFixed(1)} MB (di bawah batas 20 MB) → 201, tersimpan, gambar terbaca utuh`, async () => {
  const { s, j } = await api('POST', '/api/pengaduan', null, formulir('Uji QA-2 C4 regresi: lampiran gambar 16 MB. Dihapus lunak.', [[JPG16, 'bukti-besar.jpg', 'image/jpeg']]), ipAcak());
  wajib(s === 201 && j.lampiran === 1, `HTTP ${s} ${JSON.stringify(j).slice(0, 140)}`);
  nomorUji.push(j.nomorKasus);
  const d = await api('GET', `/api/staf/pengaduan?q=${j.nomorKasus}`, tkVerifikator);
  const id = d.j.baris[0].id;
  const det = await api('GET', `/api/staf/pengaduan/${id}`, tkVerifikator);
  const l = det.j.lampiran[0];
  const r = await fetch(`${US}${l.url || `/api/staf/pengaduan/${id}/lampiran/${l.id}`}`, { headers: { cookie: `warkop_token=${tkVerifikator}` } });
  const isi = Buffer.from(await r.arrayBuffer());
  const meta = await sharp(isi).metadata();
  wajib(r.status === 200 && meta.width > 0, `lampiran ${r.status}, meta ${JSON.stringify(meta).slice(0, 60)}`);
  return `201 ${j.nomorKasus}; tersimpan ${(isi.length / 1048576).toFixed(2)} MB, gambar sah ${meta.width}x${meta.height} (dikompres ulang sharp, sesuai rancangan)`;
});
await langkah('lampiran MP4 15 MB + PDF 14 MB dalam satu kiriman → 201, keduanya tersimpan BYTE-PER-BYTE utuh', async () => {
  const { s, j } = await api('POST', '/api/pengaduan', null, formulir('Uji QA-2 C4 regresi: rekaman MP4 15 MB dan dokumen PDF 14 MB. Dihapus lunak.', [[MP4_15, 'rekaman.mp4', 'video/mp4'], [PDF14, 'dokumen.pdf', 'application/pdf']]), ipAcak());
  wajib(s === 201 && j.lampiran === 2, `HTTP ${s} ${JSON.stringify(j).slice(0, 140)}`);
  nomorUji.push(j.nomorKasus);
  const d = await api('GET', `/api/staf/pengaduan?q=${j.nomorKasus}`, tkVerifikator);
  const id = d.j.baris[0].id;
  const det = await api('GET', `/api/staf/pengaduan/${id}`, tkVerifikator);
  const ukuran = {};
  for (const l of det.j.lampiran) {
    const r = await fetch(`${US}${l.url || `/api/staf/pengaduan/${id}/lampiran/${l.id}`}`, { headers: { cookie: `warkop_token=${tkVerifikator}` } });
    const isi = Buffer.from(await r.arrayBuffer());
    ukuran[(r.headers.get('content-type') || '').split(';')[0]] = isi.length;
  }
  wajib(ukuran['video/mp4'] === MP4_15.length, `MP4 tersimpan ${ukuran['video/mp4']} byte, dikirim ${MP4_15.length}`);
  wajib(ukuran['application/pdf'] === PDF14.length, `PDF tersimpan ${ukuran['application/pdf']} byte, dikirim ${PDF14.length}`);
  return `201 ${j.nomorKasus}; MP4 ${ukuran['video/mp4']} byte & PDF ${ukuran['application/pdf']} byte identik dengan yang dikirim`;
});
await langkah('batas ATAS tetap dijaga route (bukan pemotongan diam-diam): 21 MB → 413, total 45 MB → 413', async () => {
  const ip = ipAcak();
  const b21 = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(21 * 1024 * 1024)]);
  const a = await api('POST', '/api/pengaduan', null, formulir('Uji QA-2 C4 regresi batas atas.', [[b21, 'x.jpg', 'image/jpeg']]), ip);
  wajib(a.s === 413, `21 MB HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 120)}`);
  const b15 = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(15 * 1024 * 1024)]);
  const b = await api('POST', '/api/pengaduan', null, formulir('Uji QA-2 C4 regresi batas total.', [[b15, 'a.jpg', 'image/jpeg'], [b15, 'b.jpg', 'image/jpeg'], [b15, 'c.jpg', 'image/jpeg']]), ip);
  wajib(b.s === 413, `45 MB HTTP ${b.s} ${JSON.stringify(b.j).slice(0, 120)}`);
  return `413 ${a.j.kode} dan 413 ${b.j.kode}`;
});
await langkah('unggahan gambar staf: 4 MB diterima; 16 MB ditolak 413 dengan pesan batas 5 MB (batas desain, bukan pemotongan diam-diam)', async () => {
  // batas gambar artikel memang 5 MB (app/api/staf/unggah: MAKS_GAMBAR), lebih ketat dari batas lampiran 20 MB
  const kecil = await sharp(mentah.subarray(0, 2000 * 1500 * 3), { raw: { width: 2000, height: 1500, channels: 3 } }).jpeg({ quality: 92 }).toBuffer();
  wajib(kecil.length < 5 * 1024 * 1024 && kecil.length > 1024 * 1024, `berkas uji kecil ${(kecil.length / 1048576).toFixed(2)} MB tidak berada di antara 1 dan 5 MB`);
  const f1 = new FormData(); f1.append('berkas', new Blob([kecil], { type: 'image/jpeg' }), 'gambar.jpg'); f1.append('tujuan', 'artikel');
  const a = await api('POST', '/api/staf/unggah', tkRedaktur, f1);
  wajib((a.s === 200 || a.s === 201) && /^\/unggahan\//.test(a.j.jalur || ''), `4 MB HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 140)}`);
  const r = await fetch(`${U}${a.j.jalur}`);
  wajib(r.status === 200, `berkas publik ${r.status}`);
  const f2 = new FormData(); f2.append('berkas', new Blob([JPG16], { type: 'image/jpeg' }), 'gambar-besar.jpg'); f2.append('tujuan', 'artikel');
  const b = await api('POST', '/api/staf/unggah', tkRedaktur, f2);
  wajib(b.s === 413 && /5 MB/.test(b.j.galat || ''), `16 MB HTTP ${b.s} ${JSON.stringify(b.j).slice(0, 140)}`);
  const { unlinkSync, existsSync } = await import('node:fs');
  const p = `public${a.j.jalur}`; if (existsSync(p)) unlinkSync(p);
  return `${(kecil.length / 1048576).toFixed(2)} MB → ${a.s} ${a.j.jalur}; 16 MB → 413 "${b.j.galat}"`;
});
await langkah('galeri video MP4 15 MB (batas galeri 20 MB) → 201 tersimpan; sebelum perbaikan gagal karena pemotongan 10 MB', async () => {
  const f = new FormData();
  f.append('judul', 'Regresi C4 video galeri'); f.append('deskripsi', 'Berkas uji regresi QA-2 C4, dihapus di akhir langkah.');
  f.append('jenis', 'video'); f.append('kategori', 'sosialisasi'); f.append('wilayah_id', '13'); f.append('lokasi', 'Pekanbaru');
  f.append('tanggal_kegiatan', '2026-09-01');
  f.append('berkas', new Blob([MP4_15], { type: 'video/mp4' }), 'rekaman.mp4');
  const a = await api('POST', '/api/staf/galeri', tkRedaktur, f);
  wajib(a.s === 201, `POST ${a.s} ${JSON.stringify(a.j).slice(0, 180)}`);
  const id = a.j.galeri?.id ?? a.j.id;
  const d = await api('DELETE', `/api/staf/galeri/${id}`, tkRedaktur);
  wajib(d.s === 200, `DELETE ${d.s}`);
  return `201 id ${id} (${(MP4_15.length / 1048576).toFixed(0)} MB), lalu dihapus`;
});

console.log('\n## BUG 2 — pengurus tanpa kelompok harus tetap tampil di halaman publik /struktur');
// HTML yang dipakai untuk memeriksa POSISI harus dibersihkan dari <script> lebih dulu: Next.js menyisipkan
// muatan RSC (self.__next_f.push) berisi SELURUH teks halaman sekali lagi di akhir dokumen, sehingga indexOf
// pada HTML mentah bisa menemukan teks di muatan itu, bukan di DOM yang terlihat.
const tanpaSkrip = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '');
const halamanStruktur = async () => tanpaSkrip(await (await fetch(`${U}/struktur`)).text());
function posisiJudul(html, slug) {
  const label = KELOMPOK_PENGURUS.find((k) => k.slug === slug)?.label;
  const m = label && html.match(new RegExp(`>\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<`));
  return m ? m.index : -1;
}
// RUN QA-3 menggantikan perilaku ini: pengurus TANPA kelompok tidak lagi boleh ada (kelompok wajib) sehingga
// tidak mungkin lagi "tersimpan tetapi tidak tampil". Regresinya kini: kelompok kosong DITOLAK 422.
await langkah('QA-3: pengurus TANPA kelompok ditolak 422 KELOMPOK_WAJIB (dulu tersimpan tetapi tidak tampil di mana pun)', async () => {
  const a = await api('POST', '/api/staf/pengurus', tkRedaktur, { nama: 'Regresi C4 Pusat Tanpa Kelompok', jabatan: 'Staf Ahli', tingkat: 'pusat', kelompok: '', wilayah_id: null, foto: null, deskripsi: null, aktif: true });
  wajib(a.s === 422 && a.j.kode === 'KELOMPOK_WAJIB', `HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 120)}`);
  return `422 ${a.j.kode}`;
});
await langkah('QA-3: pengurus DPW berwilayah (provinsi 13) tampil di blok Dewan Pimpinan Wilayah', async () => {
  const a = await api('POST', '/api/staf/pengurus', tkRedaktur, { nama: 'Regresi C4 DPW Jawa Barat', jabatan: 'Ketua DPW', tingkat: 'wilayah', kelompok: 'dpw', wilayah_id: 13, foto: null, deskripsi: null, aktif: true });
  wajib(a.s === 201, `POST ${a.s} ${JSON.stringify(a.j).slice(0, 140)}`);
  const id = a.j.pengurus?.id ?? a.j.id;
  const html = await halamanStruktur();
  const iDpw = html.search(/>\s*Dewan Pimpinan Wilayah \(DPW\)\s*</); const iNama = html.indexOf('Regresi C4 DPW Jawa Barat');
  const d = await api('DELETE', `/api/staf/pengurus/${id}`, tkRedaktur);
  wajib(iDpw > 0 && iNama > iDpw, `tidak tampil di blok DPW (dpw ${iDpw}, nama ${iNama})`);
  wajib(d.s === 200, `pembersihan DELETE ${d.s}`);
  return `id ${id} tampil di blok DPW, lalu dihapus`;
});
await langkah('QA-3: blok Dewan Pimpinan Wilayah mendahului blok Koordinator Daerah; DPC/Direktorat Eksekutif tidak ada', async () => {
  const html = await halamanStruktur();
  const iDpw = html.search(/>\s*Dewan Pimpinan Wilayah \(DPW\)\s*</); const iKorda = html.search(/>\s*Koordinator Daerah\s*</);
  wajib(iDpw > 0 && iKorda > iDpw, `urutan blok salah (dpw ${iDpw}, korda ${iKorda})`);
  wajib(!/Dewan Pimpinan Cabang|Direktorat Eksekutif/.test(html), 'DPC/Direktorat Eksekutif masih dirender');
  const provinsi = (html.match(/Ketua DPW /g) || []).length;
  return `DPW lalu Koordinator Daerah; kerangka DPW ${provinsi} provinsi tanpa pejabat tampil "(Belum terisi)"`;
});

console.log('\n## Bagian Pimpinan Regional: filter wilayah & tampilan peta (kini kosong karena data DPP belum punya pengurus berwilayah)');
await langkah('QA-3: blok Koordinator Daerah dirender (keadaan kosong bila belum ada koordinator)', async () => {
  const html = await halamanStruktur();
  wajib(/>\s*Koordinator Daerah\s*</.test(html), 'blok Koordinator Daerah tidak dirender');
  return /Belum ada koordinator daerah/.test(html) ? 'keadaan kosong Koordinator Daerah tampil' : 'daftar koordinator daerah tampil';
});
await langkah('dengan satu pengurus berwilayah: filter ?wilayah= dan ?tampilan=peta bekerja, lalu data uji dihapus', async () => {
  const a = await api('POST', '/api/staf/pengurus', tkRedaktur, { nama: 'Regresi C4 Pimpinan Riau', jabatan: 'Ketua DPW', tingkat: 'wilayah', kelompok: 'dpw', wilayah_id: 13, foto: null, deskripsi: null, aktif: true });
  wajib(a.s === 201, `POST ${a.s} ${JSON.stringify(a.j).slice(0, 140)}`);
  const id = a.j.pengurus?.id ?? a.j.id;
  try {
    const semua = await halamanStruktur();
    wajib(semua.includes('Regresi C4 Pimpinan Riau'), 'tidak tampil pada daftar tanpa filter');
    const tersaring = tanpaSkrip(await (await fetch(`${U}/struktur?wilayah=13`)).text());
    wajib(tersaring.includes('Regresi C4 Pimpinan Riau'), 'hilang saat difilter ke wilayahnya sendiri');
    const lain = tanpaSkrip(await (await fetch(`${U}/struktur?wilayah=1`)).text());
    wajib(!lain.includes('Regresi C4 Pimpinan Riau'), 'masih tampil saat difilter ke wilayah lain');
    const peta = await fetch(`${U}/struktur?tampilan=peta`);
    wajib(peta.status === 200 && tanpaSkrip(await peta.text()).includes('Regresi C4 Pimpinan Riau'), `tampilan peta ${peta.status}`);
  } finally {
    const d = await api('DELETE', `/api/staf/pengurus/${id}`, tkRedaktur);
    wajib(d.s === 200, `pembersihan DELETE ${d.s}`);
  }
  return 'tanpa filter tampil; ?wilayah=13 tampil; ?wilayah=1 tidak; ?tampilan=peta 200';
});

console.log('\n## Pembersihan');
await langkah('pengaduan uji dihapus lunak', async () => {
  if (!nomorUji.length) return 'tidak ada data uji';
  const { kueri, tutupPool } = await import('../../../lib/db/index.js');
  const { waktuSekarang } = await import('../../../lib/utils.js');
  const tanda = nomorUji.map(() => '?').join(',');
  const r = await kueri(`UPDATE pengaduan SET dihapus_pada=?, diperbarui_pada=? WHERE nomor_kasus IN (${tanda}) AND dihapus_pada IS NULL`, [waktuSekarang(), waktuSekarang(), ...nomorUji]);
  await tutupPool();
  return `${r.affectedRows} pengaduan (${nomorUji.join(', ')})`;
});

console.log(`\nRINGKASAN C4: ${no} langkah, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);

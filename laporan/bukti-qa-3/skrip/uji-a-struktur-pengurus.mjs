#!/usr/bin/env node
// QA-3 A+B — uji ujung ke ujung restrukturisasi organisasi.
//   A1 susunan kelompok final: kelompok yang ditiadakan (dpc, direktorat_eksekutif) ditolak API;
//       kelompok WAJIB (tidak boleh kosong) sehingga pengurus tidak bisa lagi jatuh ke luar bagan.
//   A2 Direktorat 12 bagian: bagian wajib untuk kelompok direktorat, bagian tak dikenal ditolak,
//       bagan /struktur menampilkan 12 bagian (yang kosong tertulis "(Belum terisi)").
//   A3 wilayah dua tingkat: DPW wajib PROVINSI (kabupaten ditolak), Koordinator Daerah wajib
//       KABUPATEN/KOTA (provinsi ditolak); keduanya tampil di /struktur pada blok yang benar.
//   BUG kelompok hilang saat menyunting: PATCH tanpa menyebut kelompok TIDAK boleh menghapusnya.
//   B  Kelola Pengurus: halaman memuat baris kepala kelompok (bg-primary) dan sub-kepala bagian.
// Seluruh data uji dibuat lalu dihapus lagi.
// Pemakaian: node laporan/bukti-qa-3/skrip/uji-a-struktur-pengurus.mjs [URL] [URL staf]
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { BAGIAN_DIREKTORAT, KELOMPOK_PENGURUS } from '../../../lib/kelompokPengurus.js';

const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://127.0.0.1:3000'; const US = argv[1] || U;
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim()]));
let no = 0, gagal = 0; const dibuat = [];
const langkah = async (teks, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${teks} → ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${teks} → GAGAL: ${g.message}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };
const api = async (metode, jalur, tk, badan) => {
  const r = await fetch(`${US}${jalur}`, { method: metode, headers: { ...(badan ? { 'content-type': 'application/json' } : {}), ...(tk ? { cookie: `warkop_token=${tk}` } : {}) }, body: badan ? JSON.stringify(badan) : undefined, redirect: 'manual' });
  let j; try { j = await r.clone().json(); } catch { j = { teks: (await r.text()).slice(0, 120) }; }
  return { s: r.status, j };
};
const login = async (email, sandi) => { const { s, j } = await api('POST', '/api/auth/login', null, { email, kataSandi: sandi }); wajib(s === 200, `login ${email} HTTP ${s} ${JSON.stringify(j).slice(0, 80)}`); const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, kataSandi: sandi }) }); return ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1]; };
const halaman = async (jalur, tk) => { const r = await fetch(`${jalur.startsWith('/staf') ? US : U}${jalur}`, { headers: tk ? { cookie: `warkop_token=${tk}` } : {}, redirect: 'manual' }); return { s: r.status, html: r.status === 200 ? (await r.text()).replace(/<script[\s\S]*?<\/script>/g, '') : '' }; };

console.log(`# QA-3 A+B — restrukturisasi organisasi — ${U} — ${new Date().toISOString()}`);
const tk = await login('siti.rahma@warkopnusantara.id', env.SEED_STAF_PASSWORD);
const dasar = { nama: 'Uji QA3 Pengurus', jabatan: 'Anggota', tingkat: 'pusat', foto: null, deskripsi: null, aktif: true };
const buat = async (tambahan) => api('POST', '/api/staf/pengurus', tk, { ...dasar, ...tambahan });
const wilayahDaftar = async () => {
  const { kueri, tutupPool } = await import('../../../lib/db/index.js');
  const prov = await kueri("SELECT id, nama FROM wilayah WHERE jenis='provinsi' ORDER BY id LIMIT 1");
  const kab = await kueri("SELECT id, nama, induk_id FROM wilayah WHERE jenis='kabupaten_kota' AND induk_id=? ORDER BY id LIMIT 1", [prov[0].id]);
  await tutupPool();
  return { provinsi: prov[0], kabupaten: kab[0] };
};
const { provinsi, kabupaten } = await wilayahDaftar();

console.log('\n## A1 — susunan kelompok final');
await langkah('kelompok kosong DITOLAK 422 (dulu diterima, dan itulah sebab pengurus hilang dari bagan)', async () => {
  const a = await buat({ kelompok: '' });
  wajib(a.s === 422 && a.j.kode === 'KELOMPOK_WAJIB', `HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 120)}`);
  return `422 ${a.j.kode}`;
});
await langkah('kelompok yang ditiadakan (dpc, direktorat_eksekutif, dpd) DITOLAK 422', async () => {
  const hasil = [];
  for (const k of ['dpc', 'direktorat_eksekutif', 'dpd']) {
    const a = await buat({ kelompok: k });
    wajib(a.s === 422 && a.j.kode === 'KELOMPOK_TIDAK_SAH', `${k}: HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 100)}`);
    hasil.push(`${k}→422`);
  }
  return hasil.join(', ');
});
await langkah(`delapan kelompok resmi diterima: ${KELOMPOK_PENGURUS.map((k) => k.slug).join(', ')}`, async () => {
  const hasil = [];
  for (const k of KELOMPOK_PENGURUS) {
    const tambahan = { kelompok: k.slug, nama: `Uji QA3 ${k.slug}` };
    if (k.berbagian) tambahan.bagian = 'investigasi';
    if (k.wilayahJenis === 'provinsi') tambahan.wilayah_id = provinsi.id;
    if (k.wilayahJenis === 'kabupaten_kota') tambahan.wilayah_id = kabupaten.id;
    const a = await buat(tambahan);
    wajib(a.s === 201, `${k.slug}: HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 140)}`);
    dibuat.push(a.j.pengurus.id);
    hasil.push(`${k.slug}→201`);
  }
  return hasil.join(', ');
});

console.log('\n## A2 — Direktorat 12 bagian');
await langkah('kelompok direktorat TANPA bagian ditolak 422; bagian tak dikenal ditolak 422', async () => {
  const a = await buat({ kelompok: 'direktorat', bagian: '' });
  wajib(a.s === 422 && a.j.kode === 'BAGIAN_WAJIB', `tanpa bagian HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 100)}`);
  const b = await buat({ kelompok: 'direktorat', bagian: 'bagian-karangan' });
  wajib(b.s === 422 && b.j.kode === 'BAGIAN_TIDAK_SAH', `bagian ngawur HTTP ${b.s}`);
  return `422 ${a.j.kode}; 422 ${b.j.kode}`;
});
await langkah('halaman /struktur menampilkan 12 bagian direktorat; bagian kosong tertulis (Belum terisi)', async () => {
  const h = await halaman('/struktur');
  wajib(h.s === 200, `HTTP ${h.s}`);
  const hilang = BAGIAN_DIREKTORAT.filter((b) => !h.html.includes(b.label));
  wajib(hilang.length === 0, `bagian tidak tampil: ${hilang.map((b) => b.label).join(', ')}`);
  wajib(h.html.includes('(Belum terisi)'), 'penanda bagian kosong tidak tampil');
  return `12 bagian tampil; penanda kosong ada`;
});

console.log('\n## A3 — wilayah dua tingkat');
await langkah('DPW dengan KABUPATEN ditolak 422; Koordinator Daerah dengan PROVINSI ditolak 422', async () => {
  const a = await buat({ kelompok: 'dpw', wilayah_id: kabupaten.id });
  wajib(a.s === 422 && a.j.kode === 'WILAYAH_JENIS_TIDAK_COCOK', `dpw+kabupaten HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 120)}`);
  const b = await buat({ kelompok: 'korda', wilayah_id: provinsi.id });
  wajib(b.s === 422 && b.j.kode === 'WILAYAH_JENIS_TIDAK_COCOK', `korda+provinsi HTTP ${b.s}`);
  const c = await buat({ kelompok: 'dpw' });
  wajib(c.s === 422 && c.j.kode === 'WILAYAH_WAJIB', `dpw tanpa wilayah HTTP ${c.s}`);
  return `422 x3 (jenis tidak cocok x2, wilayah wajib x1)`;
});
await langkah('DPW & Koordinator Daerah uji tampil di /struktur pada blok yang benar', async () => {
  const h = await halaman('/struktur');
  // Judul dicari dalam bentuk teks di antara tag; kata yang sama juga ada di <meta name="description">.
  const iDpw = h.html.search(/>\s*Dewan Pimpinan Wilayah \(DPW\)\s*</);
  const iKorda = h.html.search(/>\s*Koordinator Daerah\s*</);
  wajib(iDpw > 0 && iKorda > iDpw, `judul blok tidak urut (dpw ${iDpw}, korda ${iKorda})`);
  wajib(h.html.includes('Uji QA3 dpw'), 'pengurus DPW uji tidak tampil');
  wajib(h.html.includes('Uji QA3 korda'), 'pengurus Koordinator Daerah uji tidak tampil');
  wajib(h.html.includes(provinsi.nama), `nama provinsi ${provinsi.nama} tidak tampil`);
  return `blok DPW lalu Koordinator Daerah; keduanya memuat pengurus uji`;
});
await langkah('jumlah kabupaten/kota lengkap 514 dan semuanya punya provinsi induk', async () => {
  const { kueri, tutupPool } = await import('../../../lib/db/index.js');
  const n = await kueri("SELECT COUNT(*) n FROM wilayah WHERE jenis='kabupaten_kota'");
  const yatim = await kueri("SELECT COUNT(*) n FROM wilayah WHERE jenis='kabupaten_kota' AND induk_id IS NULL");
  const lama = await kueri('SELECT COUNT(*) n FROM wilayah WHERE id BETWEEN 1 AND 39');
  await tutupPool();
  wajib(Number(n[0].n) === 514, `kabupaten/kota ${n[0].n}`);
  wajib(Number(yatim[0].n) === 0, `tanpa induk ${yatim[0].n}`);
  wajib(Number(lama[0].n) === 39, `baris lama ${lama[0].n} (harus tetap 39)`);
  return `514 kabupaten/kota, 0 tanpa induk, 39 baris lama utuh`;
});

console.log('\n## BUG — menyunting pengurus tidak boleh menghapus kelompoknya');
await langkah('PATCH hanya jabatan → kelompok & bagian TETAP (dulu terhapus diam-diam)', async () => {
  const a = await buat({ kelompok: 'direktorat', bagian: 'media', nama: 'Uji QA3 Sunting' });
  wajib(a.s === 201, `POST ${a.s}`);
  const id = a.j.pengurus.id; dibuat.push(id);
  const b = await api('PATCH', `/api/staf/pengurus/${id}`, tk, { jabatan: 'Direktur Media (diubah)' });
  wajib(b.s === 200, `PATCH ${b.s} ${JSON.stringify(b.j).slice(0, 120)}`);
  const p = b.j.pengurus;
  wajib(p.kelompok === 'direktorat', `kelompok berubah menjadi ${p.kelompok}`);
  wajib(p.bagian === 'media', `bagian berubah menjadi ${p.bagian}`);
  return `jabatan berubah, kelompok=${p.kelompok}, bagian=${p.bagian} tetap`;
});

console.log('\n## B — Kelola Pengurus: baris kepala kelompok');
await langkah('/staf/pengurus memuat baris kepala kelompok (bg-primary, colspan) + sub-kepala bagian', async () => {
  const h = await halaman('/staf/pengurus', tk);
  wajib(h.s === 200, `HTTP ${h.s}`);
  const kepala = KELOMPOK_PENGURUS.filter((k) => h.html.includes(`${k.label} - ${k.tingkatLabel}`));
  wajib(kepala.length >= 4, `hanya ${kepala.length} baris kepala kelompok ditemukan`);
  wajib(/colspan="8"[^>]*class="[^"]*bg-primary|bg-primary[\s\S]{0,200}colSpan|<tr class="bg-primary text-on-primary">/.test(h.html) || h.html.includes('bg-primary text-on-primary'), 'gaya kepala tabel tidak ditemukan');
  wajib(h.html.includes('Bagian: Media') || h.html.includes('Bagian: Investigasi'), 'sub-kepala bagian direktorat tidak tampil');
  return `${kepala.length} kepala kelompok: ${kepala.map((k) => k.label).join(', ')}`;
});

console.log('\n## Pembersihan');
await langkah('pengurus uji dihapus', async () => {
  const hasil = [];
  for (const id of dibuat) { const d = await api('DELETE', `/api/staf/pengurus/${id}`, tk); hasil.push(`${id}:${d.s}`); }
  const h = await halaman('/struktur');
  wajib(!h.html.includes('Uji QA3'), 'masih ada pengurus uji di /struktur');
  return hasil.join(' ');
});

console.log(`\nRINGKASAN QA-3 A+B: ${no} langkah, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);

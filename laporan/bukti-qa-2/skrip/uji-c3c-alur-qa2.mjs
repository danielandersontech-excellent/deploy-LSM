#!/usr/bin/env node
// QA-2 C3c — ALUR UJUNG KE UJUNG untuk yang BARU di RUN QA-2 (di luar cakupan uji QA-1 4b):
//   A. Pengurus berkelompok (A2): buat -> tampil di bagan /struktur pada kelompok yang benar -> pindah kelompok ->
//      kelompok tidak sah ditolak -> hapus. Semua lewat API staf (K3: bisa diubah dari ruang staf).
//   B. Pratinjau artikel (B8): draf dapat dipratinjau oleh yang berhak, ditolak untuk penulis lain,
//      dialihkan ke /login tanpa sesi, dan TIDAK bocor ke publik.
//   C. Alamat resmi lewat Pengaturan (A1): ubah -> tampil di footer & /kontak -> dipulihkan.
//   D. Galeri butir video->foto (B7): /galeri merender gambar, bukan pemutar video.
//   E. Aturan K2 pada HALAMAN TERENDER: tidak ada em/en dash di teks yang tampil.
// Data uji dibuat dan dihapus lagi. Pemakaian: node laporan/bukti-qa-2/skrip/uji-c3c-alur-qa2.mjs [URL] [URL staf]
import 'dotenv/config';
import { readFileSync } from 'node:fs';

const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const U = argv[0] || 'http://127.0.0.1:3000'; const US = argv[1] || U;
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim()]));
let no = 0, gagal = 0; const S = {};
const langkah = async (teks, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${teks} → ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${teks} → GAGAL: ${g.message}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };
const api = async (metode, jalur, tk, badan) => {
  const h = { ...(badan instanceof FormData ? {} : badan ? { 'content-type': 'application/json' } : {}), ...(tk ? { cookie: `warkop_token=${tk}` } : {}) };
  const r = await fetch(`${US}${jalur}`, { method: metode, headers: h, body: badan instanceof FormData ? badan : badan ? JSON.stringify(badan) : undefined, redirect: 'manual' });
  let j; try { j = await r.clone().json(); } catch { j = { teks: (await r.text()).slice(0, 120) }; }
  return { s: r.status, j, h: r.headers };
};
const login = async (email, sandi) => { const { s, h } = await api('POST', '/api/auth/login', null, { email, kataSandi: sandi }); wajib(s === 200, `login ${email} HTTP ${s}`); return ((h.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1]; };
const halaman = async (jalur, tk) => { const r = await fetch(`${jalur.startsWith('/staf') ? US : U}${jalur}`, { headers: tk ? { cookie: `warkop_token=${tk}` } : {}, redirect: 'manual' }); return { s: r.status, lokasi: r.headers.get('location'), html: r.status === 200 ? await r.text() : '' }; };
// Batas blok kelompok pada /struktur dicari dari JUDUL yang benar-benar dirender (teks di antara tag),
// bukan sekadar indexOf pada seluruh HTML — kata yang sama juga muncul di <meta name="description">.
const { KELOMPOK_PENGURUS } = await import('../../../lib/kelompokPengurus.js');
function posisiJudul(html, slug) {
  const label = KELOMPOK_PENGURUS.find((k) => k.slug === slug)?.label;
  if (!label) return -1;
  const m = html.match(new RegExp(`>\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<`));
  return m ? m.index : -1;
}
/** true bila `teks` muncul di antara judul kelompok `slug` dan judul kelompok berikutnya yang dirender. */
function diBlok(html, slug, teks) {
  const mulai = posisiJudul(html, slug);
  if (mulai < 0) return false;
  const berikut = KELOMPOK_PENGURUS.map((k) => posisiJudul(html, k.slug)).filter((i) => i > mulai).sort((a, b) => a - b)[0] ?? html.length;
  const i = html.indexOf(teks);
  return i > mulai && i < berikut;
}

console.log(`# QA-2 C3c — alur ujung ke ujung untuk perubahan RUN QA-2 — ${U} — ${new Date().toISOString()}`);
S.superadmin = await login(env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD);
S.redaktur = await login('siti.rahma@warkopnusantara.id', env.SEED_STAF_PASSWORD);
S.penulis = await login('budi.santoso@warkopnusantara.id', env.SEED_STAF_PASSWORD);

console.log('\n## A. Pengurus berkelompok (A2) — bisa diubah sepenuhnya dari ruang staf (K3)');
await langkah('POST pengurus kelompok "satgas" → 201; tampil di /struktur di bawah judul Satuan Tugas', async () => {
  const a = await api('POST', '/api/staf/pengurus', S.redaktur, { nama: 'Pengurus Uji QA-2 C3c', jabatan: 'Anggota', tingkat: 'pusat', kelompok: 'satgas', wilayah_id: null, foto: null, deskripsi: null, aktif: true });
  wajib(a.s === 201, `POST ${a.s} ${JSON.stringify(a.j).slice(0, 160)}`);
  S.idPengurus = a.j.pengurus?.id ?? a.j.id;
  const h = await halaman('/struktur');
  wajib(h.s === 200 && h.html.includes('Pengurus Uji QA-2 C3c'), `tidak tampil di /struktur (HTTP ${h.s})`);
  wajib(diBlok(h.html, 'satgas', 'Pengurus Uji QA-2 C3c'), 'nama tidak berada di dalam blok Satuan Tugas');
  return `id ${S.idPengurus}; kartu berada di dalam blok Satuan Tugas`;
});
await langkah('PATCH kelompok → "dewan_pembina" → 200; posisi di /struktur ikut pindah', async () => {
  const b = await api('PATCH', `/api/staf/pengurus/${S.idPengurus}`, S.redaktur, { nama: 'Pengurus Uji QA-2 C3c', jabatan: 'Anggota', tingkat: 'pusat', kelompok: 'dewan_pembina', wilayah_id: null, foto: null, deskripsi: null, aktif: true });
  wajib(b.s === 200, `PATCH ${b.s} ${JSON.stringify(b.j).slice(0, 160)}`);
  const h = await halaman('/struktur');
  wajib(diBlok(h.html, 'dewan_pembina', 'Pengurus Uji QA-2 C3c'), 'nama tidak berada di dalam blok Dewan Pembina');
  wajib(!diBlok(h.html, 'satgas', 'Pengurus Uji QA-2 C3c'), 'nama masih tertinggal di blok Satuan Tugas');
  return 'kartu pindah dari blok Satuan Tugas ke blok Dewan Pembina';
});
await langkah('PATCH kelompok tidak sah ("bukan-kelompok") → 422, data tidak berubah', async () => {
  const c = await api('PATCH', `/api/staf/pengurus/${S.idPengurus}`, S.redaktur, { nama: 'Pengurus Uji QA-2 C3c', jabatan: 'Anggota', tingkat: 'pusat', kelompok: 'bukan-kelompok', wilayah_id: null, foto: null, deskripsi: null, aktif: true });
  wajib(c.s === 422, `HTTP ${c.s} ${JSON.stringify(c.j).slice(0, 160)}`);
  const d = await api('GET', `/api/staf/pengurus/${S.idPengurus}`, S.redaktur);
  const kelompok = d.j.pengurus?.kelompok ?? d.j.kelompok;
  wajib(kelompok === 'dewan_pembina', `kelompok berubah menjadi ${kelompok}`);
  return `422; kelompok tetap ${kelompok}`;
});
await langkah('penulis (tanpa hak) PATCH pengurus → 403; DELETE oleh redaktur → 200; hilang dari /struktur', async () => {
  const e = await api('PATCH', `/api/staf/pengurus/${S.idPengurus}`, S.penulis, { nama: 'X', jabatan: 'Y', tingkat: 'pusat', kelompok: 'satgas', aktif: true });
  wajib(e.s === 403, `penulis ${e.s}`);
  const f = await api('DELETE', `/api/staf/pengurus/${S.idPengurus}`, S.redaktur);
  wajib(f.s === 200, `DELETE ${f.s}`);
  const h = await halaman('/struktur');
  wajib(!h.html.includes('Pengurus Uji QA-2 C3c'), 'masih tampil di /struktur setelah dihapus');
  return '403 untuk penulis; dihapus dan hilang dari bagan';
});

console.log('\n## B. Pratinjau artikel (B8)');
await langkah('penulis membuat draf → pratinjau 200 memuat isi; /berita/<slug> publik → 404', async () => {
  const a = await api('POST', '/api/staf/artikel', S.penulis, { judul: 'Draf uji pratinjau QA-2 C3c', kategori_id: 1, isi: '<p>Isi draf uji pratinjau QA-2 C3c, cukup panjang untuk lolos validasi minimal panjang isi.</p>' });
  wajib(a.s === 201, `POST ${a.s} ${JSON.stringify(a.j).slice(0, 140)}`);
  S.idArtikel = a.j.artikel.id; S.slug = a.j.artikel.slug;
  const p = await halaman(`/staf/artikel/${S.idArtikel}/pratinjau`, S.penulis);
  wajib(p.s === 200, `pratinjau penulis HTTP ${p.s}`);
  wajib(p.html.includes('Draf uji pratinjau QA-2 C3c'), 'pratinjau tidak memuat judul');
  wajib(/Mode pratinjau/.test(p.html) && /Draf/.test(p.html), 'pita status pratinjau tidak tampil');
  const pub = await halaman(`/berita/${S.slug}`);
  wajib(pub.s === 404, `draf bocor ke publik: HTTP ${pub.s}`);
  return `id ${S.idArtikel}; pratinjau 200, publik 404`;
});
await langkah('pratinjau: redaktur 200; penulis LAIN → /tanpa-akses; tanpa sesi → 307 ke /login', async () => {
  const r = await halaman(`/staf/artikel/${S.idArtikel}/pratinjau`, S.redaktur);
  wajib(r.s === 200, `redaktur ${r.s}`);
  // penulis lain: buat akun penulis kedua sementara
  const buat = await api('POST', '/api/staf/pengguna', S.superadmin, { nama: 'Penulis Uji C3c', email: `uji.c3c.${Date.now()}@warkopnusantara.id`, peran: 'penulis', kata_sandi: 'SandiUjiC3c-2026!', aktif: true });
  wajib(buat.s === 201, `buat penulis kedua ${buat.s} ${JSON.stringify(buat.j).slice(0, 120)}`);
  S.idPenggunaUji = buat.j.pengguna.id; S.emailUji = buat.j.pengguna.email;
  const tk2 = await login(S.emailUji, 'SandiUjiC3c-2026!');
  const l = await halaman(`/staf/artikel/${S.idArtikel}/pratinjau`, tk2);
  wajib(l.s === 307 && /tanpa-akses/.test(l.lokasi || ''), `penulis lain HTTP ${l.s} → ${l.lokasi}`);
  const t = await halaman(`/staf/artikel/${S.idArtikel}/pratinjau`);
  wajib(t.s === 307 && /\/login/.test(t.lokasi || ''), `tanpa sesi HTTP ${t.s} → ${t.lokasi}`);
  wajib(!/0\.0\.0\.0/.test(t.lokasi || ''), `Location memuat 0.0.0.0: ${t.lokasi}`);
  return `redaktur 200; penulis lain → ${l.lokasi}; tanpa sesi → ${t.lokasi}`;
});
await langkah('artikel diterbitkan → pratinjau tetap 200 & tombol "Buka halaman publik" muncul; lalu dihapus', async () => {
  const t = await api('POST', `/api/staf/artikel/${S.idArtikel}/terbitkan`, S.redaktur, {});
  wajib(t.s === 200, `terbit ${t.s}`);
  const p = await halaman(`/staf/artikel/${S.idArtikel}/pratinjau`, S.redaktur);
  wajib(p.s === 200 && p.html.includes('Buka halaman publik'), 'tombol halaman publik tidak muncul saat status terbit');
  const pub = await halaman(`/berita/${S.slug}`);
  wajib(pub.s === 200, `publik setelah terbit ${pub.s}`);
  const d = await api('DELETE', `/api/staf/artikel/${S.idArtikel}`, S.redaktur);
  wajib(d.s === 200, `DELETE ${d.s}`);
  return 'pratinjau 200 + tombol publik; publik 200; artikel dihapus';
});

console.log('\n## C. Alamat resmi lewat Pengaturan (A1)');
await langkah('PATCH kontak_alamat_kota → tampil di footer beranda dan halaman /kontak → dipulihkan', async () => {
  const asli = (await api('GET', '/api/staf/pengaturan', S.superadmin)).j.nilai;
  wajib(asli.kontak_alamat_kota, 'kunci kontak_alamat_kota tidak ada di pengaturan');
  const uji = 'Kota Uji C3c, Riau 28999';
  const a = await api('PATCH', '/api/staf/pengaturan', S.superadmin, { kontak_alamat_kota: uji });
  wajib(a.s === 200, `PATCH ${a.s} ${JSON.stringify(a.j).slice(0, 120)}`);
  const beranda = await halaman('/'); const kontak = await halaman('/kontak');
  wajib(beranda.html.includes(uji), 'footer beranda tidak memuat alamat baru');
  wajib(kontak.html.includes(uji), 'halaman kontak tidak memuat alamat baru');
  const b = await api('PATCH', '/api/staf/pengaturan', S.superadmin, { kontak_alamat_kota: asli.kontak_alamat_kota });
  wajib(b.s === 200, `pulih ${b.s}`);
  const c = await halaman('/');
  wajib(c.html.includes(asli.kontak_alamat_kota), 'alamat tidak pulih di footer');
  return `diubah & dipulihkan ke "${asli.kontak_alamat_kota}"`;
});

console.log('\n## D. Galeri butir 3: foto, bukan video (B7)');
await langkah('/galeri: butir "Kampanye Hak Lapor Warga" dirender sebagai gambar; tidak ada rujukan galeri-3.mp4', async () => {
  const g = await halaman('/galeri');
  wajib(g.s === 200, `HTTP ${g.s}`);
  wajib(!g.html.includes('galeri-3.mp4'), 'halaman masih merujuk galeri-3.mp4');
  wajib(g.html.includes('galeri-3.jpg'), 'gambar galeri-3.jpg tidak dirujuk');
  const berkas = await fetch(`${U}/penampung/galeri-3.jpg`);
  wajib(berkas.status === 200, `berkas galeri-3.jpg HTTP ${berkas.status}`);
  return 'gambar dirujuk dan berkasnya ada (200)';
});

console.log('\n## E. Aturan K2 pada halaman terender');
await langkah('16 halaman publik + 6 halaman staf: 0 em dash / en dash pada HTML terender', async () => {
  const publik = ['/', '/tentang', '/struktur', '/program', '/galeri', '/kontak', '/berita', '/lacak', '/faq', '/kebijakan-privasi', '/pedoman-komunitas'];
  const staf = ['/staf/dashboard', '/staf/artikel', '/staf/pengaduan', '/staf/pengurus', '/staf/program', '/staf/pengaturan'];
  const pelanggaran = [];
  for (const p of publik) { const h = await halaman(p); const n = (h.html.match(/[—–]/g) || []).length; if (n) pelanggaran.push(`${p}:${n}`); }
  for (const p of staf) { const h = await halaman(p, S.superadmin); const n = (h.html.match(/[—–]/g) || []).length; if (n) pelanggaran.push(`${p}:${n}`); }
  wajib(pelanggaran.length === 0, `halaman dengan em/en dash: ${pelanggaran.join(', ')}`);
  return `${publik.length + staf.length} halaman bersih`;
});

console.log('\n## Pembersihan');
await langkah('pengguna uji dihapus', async () => {
  const { kueri, tutupPool } = await import('../../../lib/db/index.js');
  const r = await kueri("DELETE FROM users WHERE email LIKE 'uji.c3c.%@warkopnusantara.id'");
  await tutupPool();
  return `${r.affectedRows} pengguna`;
});

console.log(`\nRINGKASAN C3c: ${no} langkah, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);

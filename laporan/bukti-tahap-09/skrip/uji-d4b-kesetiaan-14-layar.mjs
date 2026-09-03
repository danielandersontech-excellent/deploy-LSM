#!/usr/bin/env node
// D4b Tahap 9 — uji kesetiaan SELURUH 14 layar desain (REFERENSI 8 & 18.5) terhadap halaman sungguhan pada build produksi.
// Render diambil dengan fetch (cookie login untuk halaman staf) dan disimpan ke berkas, lalu paket-pendukung/UJI/uji-kesetiaan.mjs
// dijalankan per layar dengan --json. Tabel: layar | cakupan kelas | kelas hilang | sisa cacat export (harus 0).
// Pemakaian: node uji-d4b-kesetiaan-14-layar.mjs [URL dasar]  (bawaan http://localhost:3000; server produksi lokal)
import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const U = process.argv[2] || 'http://localhost:3000'; const US = process.argv[3] || U; const PROD = process.argv.includes('--produksi');
const env = Object.fromEntries(readFileSync(PROD ? '.env.produksi' : '.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const D = 'desain/stitch_portal_berita_inklusif'; const R = 'laporan/bukti-tahap-09/render-kesetiaan'; mkdirSync(R, { recursive: true });
const r = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, kataSandi: env.SEED_ADMIN_PASSWORD }) });
const TK = ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1];
const H = (staf) => (staf && TK ? { cookie: `warkop_token=${TK}` } : {});
const artikel = await (await fetch(`${U}/api/artikel?perHalaman=1`)).json(); const slug = artikel.baris?.[0]?.slug ?? artikel.data?.[0]?.slug;
const draf = await (await fetch(`${US}/api/staf/artikel?perHalaman=1`, { headers: H(true) })).json(); const idArtikel = draf.baris?.[0]?.id ?? draf.data?.[0]?.id;
const LAYAR = [
  ['beranda_warkop_nusantara', '/', false], ['tentang_kami_warkop_nusantara', '/tentang', false], ['struktur_organisasi', '/struktur', false],
  ['program_kegiatan', '/program', false], ['galeri_dokumentasi', '/galeri', false], ['kontak_pengaduan_warkop_nusantara_updated_logo', '/kontak', false],
  ['portal_berita_beranda', '/berita', false], ['daftar_berita_investigasi', '/berita', false], ['detail_artikel_investigasi', `/berita/${slug}`, false],
  ['login_staff_warkop_nusantara', '/login', false], ['dashboard_staff_warkop', '/staf/dashboard', true], ['kelola_artikel_admin', '/staf/artikel', true],
  ['editor_artikel_admin', `/staf/artikel/${idArtikel}`, true], ['kelola_pengaduan_admin', '/staf/pengaduan', true],
];
console.log(`# D4b — kesetiaan 14 layar pada ${U} — ${new Date().toISOString()}\nlogin staf: ${TK ? 'ok' : 'GAGAL'}; slug artikel: ${slug}; id artikel editor: ${idArtikel}\n`);
console.log('| # | Layar desain | Halaman | HTTP | Cakupan kelas | Kelas hilang | Token hilang | Teks hilang | Sisa cacat export |\n|---|---|---|---|---|---|---|---|---|');
let totalCacat = 0, gagalHttp = 0; const rincian = [];
for (const [i, [layar, jalur, staf]] of LAYAR.entries()) {
  const res = await fetch(`${(staf || jalur === '/login') ? US : U}${jalur}`, { headers: H(staf), redirect: 'manual' }); const html = await res.text();
  const berkas = `${R}/${String(i + 1).padStart(2, '0')}-${layar}.html`; writeFileSync(berkas, html);
  if (res.status !== 200) gagalHttp++;
  let j; try { j = JSON.parse(execFileSync('node', ['paket-pendukung/UJI/uji-kesetiaan.mjs', `${D}/${layar}/code.html`, berkas, '--json'], { encoding: 'utf8', maxBuffer: 50e6 })); }
  catch (g) { console.log(`| ${i + 1} | ${layar} | ${jalur} | ${res.status} | GAGAL menjalankan uji-kesetiaan: ${String(g.message).slice(0, 80)} | | | | |`); continue; }
  const cacat = j.cacatExport || {}; let jumlahCacat = 0; const rincianCacat = [];
  for (const [k, v] of Object.entries(cacat)) { const n = Array.isArray(v) ? v.length : typeof v === 'number' ? v : v ? 1 : 0; jumlahCacat += n; if (n) rincianCacat.push(`${k}=${n}`); }
  totalCacat += jumlahCacat;
  console.log(`| ${i + 1} | ${layar} | ${jalur} | ${res.status} | ${j.kelas.cakupanPersen}% (${j.kelas.ditemukanDiRender}/${j.kelas.desain}) | ${j.kelas.hilang.length} | ${j.token.hilangDiRender.length} | ${j.teks.hilang.length} | ${jumlahCacat}${rincianCacat.length ? ' (' + rincianCacat.join(', ') + ')' : ''} |`);
  rincian.push(`### ${i + 1}. ${layar} → ${jalur}\n- kelas hilang (${j.kelas.hilang.length}): ${j.kelas.hilang.join(', ') || '-'}\n- token hilang: ${j.token.hilangDiRender.join(', ') || '-'}\n- teks hilang: ${j.teks.hilang.slice(0, 10).join(' | ') || '-'}\n- cacat export: ${JSON.stringify(cacat)}`);
}
console.log(`\nRINGKASAN D4b: ${LAYAR.length} layar; HTTP bukan 200: ${gagalHttp}; total sisa cacat export: ${totalCacat} -> ${totalCacat === 0 && gagalHttp === 0 ? 'LULUS (cacat export nol semua)' : 'GAGAL'}`);
console.log('\n## Rincian per layar\n' + rincian.join('\n\n'));
process.exit(0);

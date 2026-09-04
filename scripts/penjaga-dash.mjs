#!/usr/bin/env node
// scripts/penjaga-dash.mjs — PENJAGA aturan K2 (RUN QA-2): tidak boleh ada EM DASH (U+2014) atau EN DASH (U+2013) pada
// teks yang tampil ke pengguna: berkas tampilan (app/, components/, lib/) di luar komentar, dan konten seed
// (database/seed.sql, sql/02-seed.sql, database/migrations/*.sql). Komentar kode (// … , /* … */, {/* … */}, -- di SQL) boleh.
// Keluar 1 bila ada pelanggaran (dipakai uji regresi). Pemakaian: node scripts/penjaga-dash.mjs [--db]
//   --db : juga memeriksa basis data lokal (kolom teks tabel artikel/pengaturan/pengurus/program/galeri) lewat lib/db.
import 'dotenv/config';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const DASH = /[–—]/;
const AKAR = ['app', 'components', 'lib'];
const SEED = ['database/seed.sql', 'sql/02-seed.sql'];
function jalan(dir, keluar = []) { for (const n of readdirSync(dir)) { const p = join(dir, n); const st = statSync(p); if (st.isDirectory()) jalan(p, keluar); else if (['.js', '.jsx', '.mjs', '.css'].includes(extname(p))) keluar.push(p); } return keluar; }
function tanpaKomentar(baris, dalamBlok) {
  // menghapus komentar // dan /* */ (termasuk {/* */}) — cukup untuk mendeteksi teks tampil; string tetap diperiksa
  let out = ''; let i = 0; let blok = dalamBlok;
  while (i < baris.length) {
    if (blok) { const j = baris.indexOf('*/', i); if (j < 0) return { teks: out, blok: true }; i = j + 2; blok = false; continue; }
    if (baris.startsWith('/*', i)) { blok = true; i += 2; continue; }
    if (baris.startsWith('//', i)) break;
    out += baris[i]; i++;
  }
  return { teks: out, blok };
}
const pelanggaran = [];
for (const akar of AKAR) for (const f of jalan(akar)) {
  const baris = readFileSync(f, 'utf8').split('\n'); let blok = false;
  baris.forEach((b, n) => { const r = tanpaKomentar(b, blok); blok = r.blok; if (DASH.test(r.teks)) pelanggaran.push(`${f}:${n + 1}: ${r.teks.trim().slice(0, 110)}`); });
}
for (const f of SEED.concat(readdirSync('database/migrations').map((n) => `database/migrations/${n}`))) {
  // QA-2 C5: `\r` di akhir baris (berkas CRLF di Windows) membuat /--.*$/ TIDAK cocok — titik dalam regex
  // JavaScript tidak pernah cocok dengan carriage return — sehingga komentar SQL yang memang boleh memuat
  // em dash dilaporkan sebagai pelanggaran palsu. Akhir baris dibuang lebih dulu.
  try { readFileSync(f, 'utf8').split('\n').forEach((b, n) => { const t = b.replace(/\r$/, '').replace(/--.*$/, ''); if (DASH.test(t)) pelanggaran.push(`${f}:${n + 1}: ${t.trim().slice(0, 110)}`); }); } catch {}
}
if (process.argv.includes('--db')) {
  const { kueri, tutupPool } = await import('../lib/db/index.js');
  const CEK = [['artikel', ['judul', 'ringkasan', 'isi']], ['pengaturan', ['nilai'], 'kunci'], ['pengurus', ['nama', 'jabatan', 'deskripsi']], ['program', ['judul', 'ringkasan', 'isi']], ['galeri', ['judul', 'deskripsi', 'lokasi']], ['kategori_artikel', ['nama']], ['wilayah', ['nama']]];
  for (const [tabel, kolom, kunci = 'id'] of CEK) { const syarat = kolom.map((k) => `${k} LIKE '%—%' OR ${k} LIKE '%–%'`).join(' OR '); const baris = await kueri(`SELECT ${kunci} AS id FROM ${tabel} WHERE ${syarat}`); if (baris.length) pelanggaran.push(`DB ${tabel}: ${baris.length} baris (id ${baris.slice(0, 8).map((b) => b.id).join(',')})`); }
  await tutupPool();
}
if (pelanggaran.length) { console.log(`PENJAGA DASH: ${pelanggaran.length} pelanggaran em/en dash pada teks tampil/seed${process.argv.includes('--db') ? '/DB' : ''}:`); for (const p of pelanggaran) console.log('  ' + p); process.exit(1); }
console.log(`PENJAGA DASH: bersih (tidak ada em/en dash di teks tampil app/components/lib, seed, migrasi${process.argv.includes('--db') ? ', DB lokal' : ''})`);

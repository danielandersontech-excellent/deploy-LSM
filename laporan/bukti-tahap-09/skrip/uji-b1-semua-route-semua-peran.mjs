#!/usr/bin/env node
// B1 Tahap 9 — SELURUH route API × SETIAP peran (+ tanpa login). Peran yang tidak berhak wajib 403;
// tanpa login wajib 401; peran berhak tidak boleh 401/403 (400/404/422 boleh: badan/ID uji sengaja tidak sah).
// ID 999999 dipakai agar tidak ada data nyata yang berubah/terhapus. Dev server 127.0.0.1:3000.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
const U = process.env.U || 'http://127.0.0.1:3000';
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim()]));
const PERAN = {
  superadmin: [env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD],
  redaktur: ['siti.rahma@warkopnusantara.id', env.SEED_STAF_PASSWORD],
  penulis: ['budi.santoso@warkopnusantara.id', env.SEED_STAF_PASSWORD],
  verifikator: ['siti.aminah@warkopnusantara.id', env.SEED_STAF_PASSWORD],
  pimpinan_wilayah: ['rahmat.siregar@warkopnusantara.id', env.SEED_STAF_PASSWORD],
};
const SEMUA = Object.keys(PERAN);
const A = { artikel_lihat: ['superadmin', 'redaktur', 'penulis', 'pimpinan_wilayah'], artikel_buat: ['superadmin', 'redaktur', 'penulis'], artikel_sunting: ['superadmin', 'redaktur', 'penulis'], artikel_hapus: ['superadmin', 'redaktur'], artikel_terbitkan: ['superadmin', 'redaktur'], pengaduan_lihat: ['superadmin', 'verifikator', 'pimpinan_wilayah'], pengaduan_ubah_status: ['superadmin', 'verifikator'], konten_lihat: ['superadmin', 'redaktur', 'pimpinan_wilayah'], konten_kelola: ['superadmin', 'redaktur'], pengguna_kelola: ['superadmin'], pengaturan_kelola: ['superadmin'], unggah: ['superadmin', 'redaktur', 'penulis', 'verifikator'], semua: SEMUA };
const X = 999999;
// [metode, jalur, peran berhak | 'PUBLIK', badan]
const ROUTE = [
  ['GET', '/api/health', 'PUBLIK'], ['POST', '/api/auth/logout', 'PUBLIK', {}], ['GET', '/api/auth/saya', A.semua],
  ['GET', '/api/artikel', 'PUBLIK'], ['GET', '/api/artikel/slug-tidak-ada', 'PUBLIK'],
  ['POST', '/api/pengaduan', 'PUBLIK', {}], ['GET', '/api/pengaduan/lacak/WRP-000000', 'PUBLIK'],
  ['GET', '/api/staf/artikel', A.artikel_lihat], ['POST', '/api/staf/artikel', A.artikel_buat, {}],
  ['GET', `/api/staf/artikel/${X}`, A.artikel_lihat], ['PATCH', `/api/staf/artikel/${X}`, A.artikel_sunting, {}], ['DELETE', `/api/staf/artikel/${X}`, A.artikel_hapus],
  ['POST', `/api/staf/artikel/${X}/terbitkan`, A.artikel_terbitkan, {}],
  ['GET', '/api/staf/pengaduan', A.pengaduan_lihat], ['GET', `/api/staf/pengaduan/${X}`, A.pengaduan_lihat], ['PATCH', `/api/staf/pengaduan/${X}`, A.pengaduan_ubah_status, {}],
  ['POST', `/api/staf/pengaduan/${X}/status`, A.pengaduan_ubah_status, {}], ['GET', `/api/staf/pengaduan/${X}/lampiran/${X}`, A.pengaduan_lihat],
  ['GET', '/api/staf/pengurus', A.konten_lihat], ['POST', '/api/staf/pengurus', A.konten_kelola, {}], ['GET', `/api/staf/pengurus/${X}`, A.konten_lihat], ['PATCH', `/api/staf/pengurus/${X}`, A.konten_kelola, {}], ['DELETE', `/api/staf/pengurus/${X}`, A.konten_kelola], ['PATCH', '/api/staf/pengurus/urutan', A.konten_kelola, {}],
  ['GET', '/api/staf/program', A.konten_lihat], ['POST', '/api/staf/program', A.konten_kelola, {}], ['GET', `/api/staf/program/${X}`, A.konten_lihat], ['PATCH', `/api/staf/program/${X}`, A.konten_kelola, {}], ['DELETE', `/api/staf/program/${X}`, A.konten_kelola],
  ['GET', '/api/staf/galeri', A.konten_lihat], ['POST', '/api/staf/galeri', A.konten_kelola, {}], ['GET', `/api/staf/galeri/${X}`, A.konten_lihat], ['PATCH', `/api/staf/galeri/${X}`, A.konten_kelola, {}], ['DELETE', `/api/staf/galeri/${X}`, A.konten_kelola],
  ['GET', '/api/staf/pengguna', A.pengguna_kelola], ['POST', '/api/staf/pengguna', A.pengguna_kelola, {}], ['GET', `/api/staf/pengguna/${X}`, A.pengguna_kelola], ['PATCH', `/api/staf/pengguna/${X}`, A.pengguna_kelola, {}], ['DELETE', `/api/staf/pengguna/${X}`, A.pengguna_kelola],
  ['POST', `/api/staf/pengguna/${X}/reset-sandi`, A.pengguna_kelola, {}], ['POST', `/api/staf/pengguna/${X}/paksa-keluar`, A.pengguna_kelola, {}],
  ['GET', '/api/staf/pengaturan', A.pengaturan_kelola], ['PATCH', '/api/staf/pengaturan', A.pengaturan_kelola, {}],
  ['POST', '/api/staf/ganti-sandi', A.semua, {}], ['POST', '/api/staf/unggah', A.unggah, {}], ['GET', '/api/staf/statistik', A.semua],
];
async function login(email, sandi) {
  const r = await fetch(`${U}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, kataSandi: sandi }) });
  return ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1] || null;
}
async function panggil(metode, jalur, token, badan) {
  const h = { 'content-type': 'application/json' }; if (token) h.cookie = `warkop_token=${token}`;
  const r = await fetch(`${U}${jalur}`, { method: metode, headers: h, body: badan !== undefined && metode !== 'GET' ? JSON.stringify(badan) : undefined, redirect: 'manual' });
  return r.status;
}
console.log(`# B1 — ${ROUTE.length} route × ${SEMUA.length} peran + tanpa login — ${new Date().toISOString()}`);
const TK = {}; for (const p of SEMUA) { TK[p] = await login(...PERAN[p]); console.log(`login ${p}: ${TK[p] ? 'ok' : 'GAGAL'}`); }
let uji = 0, gagal = 0; const baris = [];
for (const [metode, jalur, berhak, badan] of ROUTE) {
  const hasil = {};
  const s0 = await panggil(metode, jalur, null, badan); hasil['tanpa-login'] = s0;
  for (const p of SEMUA) hasil[p] = await panggil(metode, jalur, TK[p], badan);
  const catatan = [];
  if (berhak === 'PUBLIK') { uji++; if (s0 === 401 || s0 === 403) { gagal++; catatan.push('PUBLIK tetapi ditolak'); } }
  else {
    uji++; if (s0 !== 401) { gagal++; catatan.push(`tanpa login harus 401, dapat ${s0}`); }
    for (const p of SEMUA) { uji++; const ok = berhak.includes(p) ? (hasil[p] !== 401 && hasil[p] !== 403) : hasil[p] === 403; if (!ok) { gagal++; catatan.push(`${p}: dapat ${hasil[p]} (${berhak.includes(p) ? 'harus bukan 401/403' : 'harus 403'})`); } }
  }
  baris.push(`| ${metode} | ${jalur} | ${berhak === 'PUBLIK' ? 'PUBLIK' : berhak.join(', ')} | ${hasil['tanpa-login']} | ${SEMUA.map((p) => hasil[p]).join(' / ')} | ${catatan.length ? 'GAGAL: ' + catatan.join('; ') : 'OK'} |`);
}
console.log(`\n| Metode | Route | Berhak | tanpa login | ${SEMUA.join(' / ')} | Hasil |\n|---|---|---|---|---|---|`);
console.log(baris.join('\n'));
console.log(`\nRINGKASAN: ${uji} pemeriksaan, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);

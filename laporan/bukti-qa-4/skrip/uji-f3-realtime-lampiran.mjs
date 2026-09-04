#!/usr/bin/env node
// QA-4 F3 (bagian baru; bagian lain F3 memakai ulang skrip QA-2/QA-3 yang sudah terbukti, lihat jalankan-f3.sh):
//   1. REALTIME: klien socket.io (superadmin) tersambung; pengaduan baru lewat API publik memunculkan event
//      'pengaduan:baru' pada klien itu <= 3 detik, muatannya TANPA identitas pelapor (aturan 3); pergantian
//      status memunculkan 'pengaduan:status'.
//   2. LAMPIRAN TERSIMPAN DI DIREKTORI TERJAGA: pengaduan berlampiran JPG+PDF+MP4; setiap lampiran benar-benar
//      ada sebagai berkas di UPLOAD_PRIVATE_DIR (bawaan ./unggahan-terjaga; produksi /app/unggahan-terjaga),
//      BUKAN di public/, dan terbuka kembali oleh verifikator (200 + nosniff) sementara tanpa sesi 401.
//   3. PENGATURAN SOSIAL MEDIA lewat API: isi YouTube -> ikon muncul di footer -> kosongkan -> hilang.
// Data uji dibersihkan (pengaduan dihapus lunak, berkas lampiran uji dihapus dari disk).
// Pemakaian: node laporan/bukti-qa-4/skrip/uji-f3-realtime-lampiran.mjs [URL]   (lokal)
import 'dotenv/config';
import { readFileSync, existsSync, unlinkSync, statSync } from 'node:fs';
import path from 'node:path';
import { io } from 'socket.io-client';
import sharp from 'sharp';
import { buatTokenFormulir } from '../../../lib/tokenFormulir.js';

const U = process.argv[2] || 'http://127.0.0.1:3000';
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim()]));
let no = 0, gagal = 0; const nomorUji = []; const berkasUji = [];
const langkah = async (teks, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${teks} → ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${teks} → GAGAL: ${g.message}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const api = async (metode, jalur, tk, badan, ip) => { const r = await fetch(`${U}${jalur}`, { method: metode, headers: { ...(badan instanceof FormData ? {} : badan ? { 'content-type': 'application/json' } : {}), ...(tk ? { cookie: `warkop_token=${tk}` } : {}), ...(ip ? { 'x-forwarded-for': ip } : {}) }, body: badan instanceof FormData ? badan : badan ? JSON.stringify(badan) : undefined, redirect: 'manual' }); let j; try { j = await r.clone().json(); } catch { j = { teks: (await r.text()).slice(0, 120) }; } return { s: r.status, j, h: r.headers }; };
const login = async (email, sandi) => { const r = await fetch(`${U}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, kataSandi: sandi }) }); wajib(r.status === 200, `login ${email} HTTP ${r.status}`); return ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1]; };
const ip = () => `203.0.113.${1 + Math.floor(Math.random() * 250)}`;
const formulir = (deskripsi, berkas = [], bernama = false) => { const f = new FormData(); f.append('token_formulir', buatTokenFormulir(Date.now() - 5000)); f.append('anonim', bernama ? 'false' : 'true'); if (bernama) { f.append('nama_pelapor', 'Pelapor Uji QA4'); f.append('nik_pelapor', '3273010101900009'); f.append('telepon_pelapor', '081200000009'); f.append('email_pelapor', 'pelapor.qa4@contoh.id'); } f.append('kategori_masalah', 'pungli'); f.append('wilayah_id', '13'); f.append('deskripsi', deskripsi); for (const [buf, nama, tipe] of berkas) f.append('lampiran', new Blob([buf], { type: tipe }), nama); return f; };

console.log(`# QA-4 F3 — realtime + lampiran terjaga + pengaturan sosial — ${U} — ${new Date().toISOString()}`);
const tkAdmin = await login(env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD);
const tkVerif = await login('siti.aminah@warkopnusantara.id', env.SEED_STAF_PASSWORD);

console.log('\n## 1. Realtime: pengaduan baru muncul di dashboard (event socket)');
let socket = null; const diterima = [];
await langkah('klien socket superadmin tersambung (cookie httpOnly), room memuat "staf"', async () => {
  socket = io(U, { path: '/socket.io', transports: ['websocket'], reconnection: false, extraHeaders: { cookie: `warkop_token=${tkAdmin}` } });
  const hasil = await new Promise((r) => { socket.on('connect', () => r({ ok: true })); socket.on('connect_error', (e) => r({ ok: false, galat: e.message })); });
  wajib(hasil.ok, `tidak tersambung: ${hasil.galat}`);
  socket.on('pengaduan:baru', (m) => diterima.push({ jenis: 'baru', m, t: Date.now() }));
  socket.on('pengaduan:status', (m) => diterima.push({ jenis: 'status', m, t: Date.now() }));
  const room = await new Promise((r) => socket.emit('room:saya', r));
  wajib(room.includes('staf'), `room: ${room.join(',')}`);
  return `tersambung; room ${room.join(', ')}`;
});
let idBernama = null;
await langkah('POST pengaduan BERNAMA -> event pengaduan:baru diterima <= 3 s, muatan tanpa nama/NIK/telepon/email', async () => {
  const awal = Date.now();
  const r = await api('POST', '/api/pengaduan', null, formulir('Uji QA-4 F3 realtime: pengaduan bernama, dihapus lunak di akhir.', [], true), ip());
  wajib(r.s === 201, `HTTP ${r.s} ${JSON.stringify(r.j).slice(0, 100)}`);
  nomorUji.push(r.j.nomorKasus);
  let ev = null; for (let i = 0; i < 30 && !ev; i++) { await tidur(100); ev = diterima.find((d) => d.jenis === 'baru' && JSON.stringify(d.m).includes(r.j.nomorKasus)); }
  wajib(ev, 'event pengaduan:baru tidak diterima dalam 3 detik');
  const teks = JSON.stringify(ev.m);
  wajib(!/Pelapor Uji QA4|3273010101900009|081200000009|pelapor\.qa4/.test(teks), `muatan memuat identitas: ${teks.slice(0, 160)}`);
  wajib(!/nama_pelapor|nik_pelapor|telepon_pelapor|email_pelapor/.test(teks), `muatan memuat kunci identitas: ${Object.keys(ev.m).join(',')}`);
  const d = await api('GET', `/api/staf/pengaduan?q=${r.j.nomorKasus}`, tkVerif); idBernama = d.j.baris?.[0]?.id;
  return `201 ${r.j.nomorKasus}; event dalam ${ev.t - awal} ms; kunci muatan: ${Object.keys(ev.m).join(',')}`;
});
await langkah('verifikator mengubah status -> event pengaduan:status diterima', async () => {
  wajib(idBernama, 'id pengaduan tidak diketahui');
  const a = await api('POST', `/api/staf/pengaduan/${idBernama}/status`, tkVerif, { status: 'diverifikasi', catatan: 'Uji QA-4 F3 realtime status.' });
  wajib(a.s === 200, `status HTTP ${a.s} ${JSON.stringify(a.j).slice(0, 100)}`);
  let ev = null; for (let i = 0; i < 30 && !ev; i++) { await tidur(100); ev = diterima.find((d) => d.jenis === 'status'); }
  wajib(ev, 'event pengaduan:status tidak diterima');
  wajib(!/Pelapor Uji QA4|3273010101900009/.test(JSON.stringify(ev.m)), 'muatan status memuat identitas');
  return `event status: ${JSON.stringify(ev.m).slice(0, 100)}`;
});
socket?.close();

console.log('\n## 2. Lampiran tersimpan di direktori TERJAGA (bukan public/) dan terbuka kembali oleh staf');
const dirTerjaga = path.resolve(env.UPLOAD_PRIVATE_DIR || path.join(process.cwd(), 'unggahan-terjaga'));
await langkah(`pengaduan anonim JPG+PDF+MP4 -> 201; tiap berkas ada di ${dirTerjaga}; tidak ada di public/`, async () => {
  const JPG = await sharp({ create: { width: 64, height: 48, channels: 3, background: { r: 200, g: 180, b: 140 } } }).jpeg().toBuffer();
  const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n', 'latin1');
  const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.from([0, 0, 2, 0]), Buffer.from('isomiso2mp41'), Buffer.alloc(1024)]);
  const r = await api('POST', '/api/pengaduan', null, formulir('Uji QA-4 F3 lampiran terjaga: tiga berkas, dihapus lunak di akhir.', [[JPG, 'a.jpg', 'image/jpeg'], [PDF, 'b.pdf', 'application/pdf'], [MP4, 'c.mp4', 'video/mp4']]), ip());
  wajib(r.s === 201 && r.j.lampiran === 3, `HTTP ${r.s} ${JSON.stringify(r.j).slice(0, 120)}`);
  nomorUji.push(r.j.nomorKasus);
  const d = await api('GET', `/api/staf/pengaduan?q=${r.j.nomorKasus}`, tkVerif); const id = d.j.baris[0].id;
  const det = await api('GET', `/api/staf/pengaduan/${id}`, tkVerif);
  // Jalur disk TIDAK dibocorkan API (disengaja); dibaca langsung dari tabel pengaduan_lampiran.
  const { kueri } = await import('../../../lib/db/index.js');
  const jalurDb = Object.fromEntries((await kueri('SELECT id, path FROM pengaduan_lampiran WHERE pengaduan_id = ?', [id])).map((b) => [Number(b.id), b.path]));
  wajib(!('path' in (det.j.lampiran[0] || {})), 'API detail membocorkan jalur disk lampiran');
  const hasil = [];
  for (const l of det.j.lampiran) {
    // path tersimpan berbentuk /terjaga/<sub>/<nama> -> berkas di <dirTerjaga>/<sub>/<nama>
    const relatif = String(jalurDb[Number(l.id)] || '').replace(/^\/terjaga\//, '');
    wajib(relatif && !relatif.startsWith('/'), `jalur lampiran tidak dikenali: ${jalurDb[Number(l.id)]}`);
    const diDisk = path.join(dirTerjaga, relatif);
    wajib(existsSync(diDisk), `berkas tidak ada di disk terjaga: ${diDisk}`);
    wajib(!existsSync(path.join(process.cwd(), 'public', 'unggahan', relatif)), `berkas ikut ada di public/: ${relatif}`);
    berkasUji.push(diDisk);
    const x = await fetch(`${U}${l.url || `/api/staf/pengaduan/${id}/lampiran/${l.id}`}`, { headers: { cookie: `warkop_token=${tkVerif}` } });
    wajib(x.status === 200 && x.headers.get('x-content-type-options') === 'nosniff', `buka lampiran ${x.status}`);
    const y = await fetch(`${U}${l.url || `/api/staf/pengaduan/${id}/lampiran/${l.id}`}`);
    wajib(y.status === 401, `tanpa sesi ${y.status}`);
    hasil.push(`${l.tipe_mime} ${statSync(diDisk).size}B`);
  }
  return `201 ${r.j.nomorKasus}; ${hasil.join(', ')}; semua di disk terjaga, 200+nosniff, tanpa sesi 401`;
});

console.log('\n## 3. Pengaturan media sosial lewat ruang staf (K3)');
await langkah('isi sosial_youtube -> ikon muncul di footer; kosongkan -> hilang', async () => {
  const a = await api('PATCH', '/api/staf/pengaturan', tkAdmin, { sosial_youtube: 'https://www.youtube.com/@ujiqa4' });
  wajib(a.s === 200, `PATCH ${a.s}`);
  const ada = (await (await fetch(`${U}/`)).text()).replace(/<script[\s\S]*?<\/script>/g, '').includes('https://www.youtube.com/@ujiqa4');
  const b = await api('PATCH', '/api/staf/pengaturan', tkAdmin, { sosial_youtube: '' });
  wajib(b.s === 200, `kosongkan ${b.s}`);
  const hilang = !(await (await fetch(`${U}/`)).text()).replace(/<script[\s\S]*?<\/script>/g, '').includes('youtube.com');
  wajib(ada && hilang, `muncul=${ada} hilang=${hilang}`);
  return 'ikon YouTube muncul lalu hilang';
});

console.log('\n## Pembersihan');
await langkah('pengaduan uji dihapus lunak; berkas lampiran uji dihapus dari disk', async () => {
  const { kueri, tutupPool } = await import('../../../lib/db/index.js');
  const { waktuSekarang } = await import('../../../lib/utils.js');
  const r = nomorUji.length ? await kueri(`UPDATE pengaduan SET dihapus_pada=?, diperbarui_pada=? WHERE nomor_kasus IN (${nomorUji.map(() => '?').join(',')}) AND dihapus_pada IS NULL`, [waktuSekarang(), waktuSekarang(), ...nomorUji]) : { affectedRows: 0 };
  await tutupPool();
  let n = 0; for (const f of berkasUji) { try { unlinkSync(f); n++; } catch { /* abaikan */ } }
  return `${r.affectedRows} pengaduan; ${n} berkas`;
});
console.log(`\nRINGKASAN F3-baru: ${no} langkah, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);

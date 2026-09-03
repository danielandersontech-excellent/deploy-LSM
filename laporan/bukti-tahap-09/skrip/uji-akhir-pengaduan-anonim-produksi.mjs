#!/usr/bin/env node
// Verifikasi akhir PRODUKSI — pengaduan ANONIM ujung ke ujung di domain: token formulir (HMAC dengan rahasia produksi dari
// .env.produksi, tidak dicetak) → POST /api/pengaduan anonim → GET /api/pengaduan/lacak/<nomor> → halaman /lacak → daftar staf
// (verifikator/superadmin) memuat kasus → detail: anonim=1, identitas NULL. Nomor kasus dicetak agar dihapus lunak lewat SQL
// (SELECT dulu, baru UPDATE) oleh langkah berikutnya. Tidak ada data pelapor dikirim.
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('.env.produksi', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
process.env.JWT_SECRET = env.JWT_SECRET; // kunci HMAC token formulir produksi
const { buatTokenFormulir } = await import('../../../lib/tokenFormulir.js');
const U = `https://${env.DOMAIN}`, US = `https://${env.STAF_HOST}`;
let gagal = 0; const cek = (n, ok, k) => { if (!ok) gagal++; console.log(`  ${ok ? 'OK   ' : 'GAGAL'} ${n}${k ? ' — ' + k : ''}`); };
console.log(`# Verifikasi akhir — pengaduan anonim end-to-end di ${U} — ${new Date().toISOString()}`);
const tokenFormulir = buatTokenFormulir(Date.now() - 5000);
const r = await fetch(`${U}/api/pengaduan`, { method: 'POST', headers: { 'content-type': 'application/json', origin: U }, body: JSON.stringify({ token_formulir: tokenFormulir, anonim: true, kategori_masalah: 'lainnya', wilayah_id: 13, deskripsi: 'Verifikasi akhir Tahap 9 (4 Sep 2026): pengaduan anonim uji dari laptop pengembang — akan dihapus lunak segera setelah diperiksa.' }) });
const j = await r.json().catch(() => ({})); const NOMOR = j.nomorKasus;
cek('POST /api/pengaduan anonim → 201 nomor kasus', r.status === 201 && /^WRP-\d{6}$/.test(NOMOR || ''), `HTTP ${r.status} ${JSON.stringify(j)}`);
const l = await fetch(`${U}/api/pengaduan/lacak/${NOMOR}`); const lj = await l.json().catch(() => ({}));
cek('GET /api/pengaduan/lacak → 200 status baru, 1 riwayat, hanya kolom publik', l.status === 200 && lj.pengaduan?.status === 'baru' && lj.riwayat?.length === 1 && !/nama_pelapor|deskripsi|catatan|petugas/.test(JSON.stringify(lj)), `HTTP ${l.status} kunci pengaduan: ${Object.keys(lj.pengaduan || {}).join(',')}`);
const h = await fetch(`${U}/lacak?nomor=${NOMOR}`); const ht = await h.text();
cek('Halaman /lacak menampilkan nomor & status', h.status === 200 && ht.includes(NOMOR), `HTTP ${h.status}`);
const rl = await fetch(`${US}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, kataSandi: env.SEED_ADMIN_PASSWORD }) });
const TK = ((rl.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1];
const d = await fetch(`${US}/api/staf/pengaduan?q=${NOMOR}`, { headers: { cookie: `warkop_token=${TK}` } }); const dj = await d.json().catch(() => ({})); const baris = (dj.baris || []).find((x) => x.nomor_kasus === NOMOR);
cek('Daftar staf (superadmin) memuat kasus baru', d.status === 200 && !!baris, `HTTP ${d.status}, id ${baris?.id}`);
if (baris) { const dt = await fetch(`${US}/api/staf/pengaduan/${baris.id}`, { headers: { cookie: `warkop_token=${TK}` } }); const dtj = await dt.json().catch(() => ({})); const p = dtj.pengaduan || {};
  cek('Detail staf: anonim=1 dan nama/nik/telepon/email pelapor NULL', dt.status === 200 && (p.anonim === 1 || p.anonim === true) && p.nama_pelapor == null && p.nik_pelapor == null && p.telepon_pelapor == null && p.email_pelapor == null, `anonim=${p.anonim} nama=${p.nama_pelapor} nik=${p.nik_pelapor} telepon=${p.telepon_pelapor} email=${p.email_pelapor}; riwayat ${dtj.riwayat?.length}`); }
console.log(`NOMOR_UJI=${NOMOR}`);
console.log(`RINGKASAN: ${gagal === 0 ? 'LULUS' : `${gagal} GAGAL`}`);
process.exit(0);

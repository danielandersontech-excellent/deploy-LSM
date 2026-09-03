#!/usr/bin/env node
// Tahap 9 — uji keamanan aktif di dev server (127.0.0.1:3000):
//   B2 injeksi SQL pada setiap kolom pencarian/filter, B5 CSRF (Origin lintas asal), B6 lampiran (tebak URL, tanpa eksekusi),
//   C8 daftar putih pengaturan (kunci tampilan = kunci API; simpan-muat ulang setiap kunci), C13 identitas pelapor tidak keluar
//   (HTML beranda, JSON /lacak, balasan API peran tak berhak, balasan pimpinan wilayah), B4 rate limit (login, pengaduan, lacak, unggah)
//   — B4 dijalankan TERAKHIR karena menghabiskan kuota IP dev server.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { buatTokenFormulir } from '../../../lib/tokenFormulir.js';
import { PENGATURAN_DEFINISI, KUNCI_PENGATURAN } from '../../../lib/pengaturanDefinisi.js';
const U = 'http://127.0.0.1:3000';
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim()]));
const login = async (email, sandi) => { const r = await fetch(`${U}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, kataSandi: sandi }) }); return ((r.headers.get('set-cookie') || '').match(/warkop_token=([^;]+)/) || [])[1] || null; };
const H = (tk, ekstra = {}) => ({ 'content-type': 'application/json', ...(tk ? { cookie: `warkop_token=${tk}` } : {}), ...ekstra });
let gagalTotal = 0; const hasil = (nama, ok, ket) => { if (!ok) gagalTotal++; console.log(`  ${ok ? 'OK   ' : 'GAGAL'} ${nama}${ket ? ' — ' + ket : ''}`); };
console.log(`# Uji keamanan Tahap 9 — ${new Date().toISOString()}`);
const TKa = await login(env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD), TKv = await login('siti.aminah@warkopnusantara.id', env.SEED_STAF_PASSWORD), TKp = await login('budi.santoso@warkopnusantara.id', env.SEED_STAF_PASSWORD), TKw = await login('pimpinan.jabar@warkopnusantara.id', env.SEED_STAF_PASSWORD);
console.log(`login: superadmin ${!!TKa}, verifikator ${!!TKv}, penulis ${!!TKp}, pimpinan wilayah 13 ${!!TKw}`);

// ---------- B2
console.log('\n## B2. Injeksi SQL — payload ke setiap kolom pencarian/filter; tidak boleh 500, tidak boleh "lolos" (jumlah hasil tidak melonjak), tanpa pesan SQL');
const PAYLOAD = [`' OR '1'='1`, `' OR 1=1--`, `1; DROP TABLE artikel--`, `" OR ""="`, `1 UNION SELECT NULL,NULL,NULL--`, `%27%20OR%201%3D1`, `\\' OR 1=1#`];
const TARGET = [
  ['GET', '/api/artikel?q=', null], ['GET', '/api/artikel?kategori=', null], ['GET', '/api/artikel?halaman=', null],
  ['GET', '/api/staf/artikel?q=', TKa], ['GET', '/api/staf/artikel?status=', TKa], ['GET', '/api/staf/artikel?kategori=', TKa],
  ['GET', '/api/staf/pengaduan?q=', TKa], ['GET', '/api/staf/pengaduan?status=', TKa], ['GET', '/api/staf/pengaduan?kategori=', TKa], ['GET', '/api/staf/pengaduan?wilayah=', TKa],
  ['GET', '/api/staf/program?q=', TKa], ['GET', '/api/staf/galeri?kategori=', TKa], ['GET', '/api/staf/pengguna?q=', TKa], ['GET', '/api/staf/pengguna?peran=', TKa],
  ['GET', '/api/pengaduan/lacak/', null], ['GET', '/api/artikel/', null],
  ['GET', '/berita?q=', null], ['GET', '/program?kategori=', null], ['GET', '/galeri?kategori=', null], ['GET', '/lacak?nomor=', null], ['GET', '/staf/pengaduan?q=', TKa], ['GET', '/staf/artikel?q=', TKa],
];
let b2 = 0, b2gagal = 0;
for (const [m, jalur, tk] of TARGET) {
  const dasar = await fetch(`${U}${jalur}xyzxyz`, { headers: H(tk) }); const teksDasar = await dasar.text(); const jumlahDasar = (teksDasar.match(/"id":/g) || []).length;
  for (const p of PAYLOAD) {
    b2++;
    const r = await fetch(`${U}${jalur}${encodeURIComponent(p)}`, { headers: H(tk) }); const t = await r.text();
    const jumlah = (t.match(/"id":/g) || []).length; const bocorSql = /SQL syntax|mysql|mariadb|ER_PARSE|sqlMessage/i.test(t);
    const ok = r.status !== 500 && !bocorSql && jumlah <= jumlahDasar;
    if (!ok) { b2gagal++; console.log(`  GAGAL ${m} ${jalur}<${p}> -> ${r.status}, id=${jumlah} (dasar ${jumlahDasar}), bocor=${bocorSql}`); }
  }
}
hasil(`B2: ${b2} payload × kolom`, b2gagal === 0, `${b2gagal} gagal; setiap payload dibalas 200/400/404/422 tanpa 500, tanpa pesan SQL, jumlah hasil tidak melonjak`);
// pembanding: login dengan injeksi
const rl = await fetch(`${U}/api/auth/login`, { method: 'POST', headers: H(null), body: JSON.stringify({ email: `' OR '1'='1`, kataSandi: `' OR '1'='1` }) });
hasil('B2: login dengan payload injeksi', rl.status === 400 || rl.status === 401, `HTTP ${rl.status}`);

// ---------- C13 + B6 memakai satu pengaduan BERNAMA (dihapus lunak di akhir)
console.log('\n## C13. Identitas pelapor tidak pernah keluar — pengaduan BERNAMA dibuat, lalu diperiksa di 5 saluran');
const IDENT = { nama_pelapor: 'Zulkifli Identitas Uji', nik_pelapor: '3273011212900099', telepon_pelapor: '081299998888', email_pelapor: 'zulkifli.uji@contoh.id' };
const rp = await fetch(`${U}/api/pengaduan`, { method: 'POST', headers: H(null), body: JSON.stringify({ token_formulir: buatTokenFormulir(Date.now() - 5000), anonim: false, ...IDENT, kategori_masalah: 'pungli', wilayah_id: 13, deskripsi: 'Uji C13 Tahap 9: laporan bernama untuk memastikan identitas tidak keluar ke publik/socket/API peran lain.' }) });
const dp = await rp.json(); const NOMOR = dp.nomorKasus; console.log(`  pengaduan bernama -> ${rp.status} ${NOMOR}`);
const nilaiIdent = Object.values(IDENT);
const mengandung = (t) => nilaiIdent.filter((v) => t.includes(v));
const beranda = await (await fetch(`${U}/`)).text(); hasil('C13-1 HTML beranda (kasus berjalan publik)', mengandung(beranda).length === 0 && !/nama_pelapor|nik_pelapor/.test(beranda), `${beranda.length} byte, identitas: ${mengandung(beranda).length}`);
const lacakJson = await (await fetch(`${U}/api/pengaduan/lacak/${NOMOR}`)).text(); hasil('C13-2 JSON /api/pengaduan/lacak', mengandung(lacakJson).length === 0 && !/nama_pelapor|deskripsi|catatan|petugas/.test(lacakJson), `kunci: ${Object.keys(JSON.parse(lacakJson)).join(',')}`);
const lacakHtml = await (await fetch(`${U}/lacak?nomor=${NOMOR}`)).text(); hasil('C13-3 HTML /lacak', mengandung(lacakHtml).length === 0, `identitas: ${mengandung(lacakHtml).length}`);
const idBaris = await (await fetch(`${U}/api/staf/pengaduan?q=${NOMOR}`, { headers: H(TKa) })).json(); const ID = idBaris.baris?.[0]?.id ?? idBaris.data?.[0]?.id; console.log(`  id pengaduan: ${ID}`);
const rPenulis = await fetch(`${U}/api/staf/pengaduan/${ID}`, { headers: H(TKp) }); hasil('C13-4 API detail untuk penulis', rPenulis.status === 403, `HTTP ${rPenulis.status}`);
const tw = await (await fetch(`${U}/api/staf/pengaduan/${ID}`, { headers: H(TKw) })).text(); hasil('C13-5 API detail untuk pimpinan wilayah 13 (berhak lihat kasus, BUKAN identitas)', mengandung(tw).length === 0 && !/nama_pelapor|nik_pelapor|telepon_pelapor|email_pelapor/.test(tw), `identitas: ${mengandung(tw).length}; kunci pengaduan: ${Object.keys(JSON.parse(tw).pengaduan || JSON.parse(tw)).slice(0, 12).join(',')}`);
const tv = await (await fetch(`${U}/api/staf/pengaduan/${ID}`, { headers: H(TKv) })).text(); hasil('C13-kontrol verifikator melihat identitas (harus ADA)', mengandung(tv).length === nilaiIdent.length, `identitas: ${mengandung(tv).length}/${nilaiIdent.length}`);
const daftarW = await (await fetch(`${U}/api/staf/pengaduan?q=${NOMOR}`, { headers: H(TKw) })).text(); hasil('C13-6 daftar pengaduan pimpinan wilayah', mengandung(daftarW).length === 0, `identitas: ${mengandung(daftarW).length}`);
const dashW = await (await fetch(`${U}/staf/dashboard`, { headers: H(TKw) })).text(); hasil('C13-7 HTML dashboard pimpinan wilayah', mengandung(dashW).length === 0, `identitas: ${mengandung(dashW).length}`);

// ---------- B6
console.log('\n## B6. Berkas unggahan — tebak URL lampiran, tanpa eksekusi, magic bytes, nama acak');
const r6a = await fetch(`${U}/unggahan/pengaduan/d35679f073cb65da3035bebb/apa-saja.jpg`); hasil('B6-1 /unggahan/pengaduan/<sub>/<nama> (lampiran pengaduan lewat penyaji publik)', r6a.status === 404, `HTTP ${r6a.status}`);
const r6b = await fetch(`${U}/unggahan/../.env`); hasil('B6-2 /unggahan/../.env', r6b.status === 404 || r6b.status === 400, `HTTP ${r6b.status}`);
const r6c = await fetch(`${U}/unggahan/galeri/x.php`); hasil('B6-3 /unggahan/galeri/x.php (ekstensi tak dikenal)', r6c.status === 404, `HTTP ${r6c.status}`);
const r6d = await fetch(`${U}/api/staf/pengaduan/${ID}/lampiran/1`); hasil('B6-4 lampiran terjaga tanpa login', r6d.status === 401, `HTTP ${r6d.status}`);
const r6e = await fetch(`${U}/api/staf/pengaduan/${ID}/lampiran/999999`, { headers: H(TKv) }); hasil('B6-5 lampiran id tebakan (bukan milik pengaduan)', r6e.status === 404, `HTTP ${r6e.status}`);
const r6f = await fetch(`${U}/api/staf/pengaduan/1/lampiran/1`, { headers: H(TKp) }); hasil('B6-6 lampiran oleh penulis', r6f.status === 403, `HTTP ${r6f.status}`);
// header penyajian gambar publik
const galeri = await (await fetch(`${U}/api/staf/galeri?perHalaman=1`, { headers: H(TKa) })).json(); const jalurGambar = (JSON.stringify(galeri).match(/\/unggahan\/[^"\\]+\.(jpg|jpeg|png|webp)/) || [])[0];
if (jalurGambar) { const r6g = await fetch(`${U}${jalurGambar}`); hasil('B6-7 gambar publik: nosniff + content-type gambar + nama acak', r6g.status === 200 && r6g.headers.get('x-content-type-options') === 'nosniff' && /^image\//.test(r6g.headers.get('content-type') || '') && /\/[a-f0-9]{16,}\.(jpg|jpeg|png|webp)$/.test(jalurGambar), `${jalurGambar} -> ${r6g.status} ${r6g.headers.get('content-type')} nosniff=${r6g.headers.get('x-content-type-options')}`); }
else console.log('  (tidak ada gambar galeri terunggah untuk B6-7 — dilewati)');
// unggah berkas berbahaya oleh staf
const phpForm = new FormData(); phpForm.append('berkas', new Blob([`<?php system($_GET['c']); ?>`], { type: 'image/jpeg' }), 'jahat.jpg');
const r6h = await fetch(`${U}/api/staf/unggah`, { method: 'POST', headers: { cookie: `warkop_token=${TKa}` }, body: phpForm }); hasil('B6-8 unggah PHP menyamar .jpg (magic bytes)', r6h.status === 415 || r6h.status === 422 || r6h.status === 400, `HTTP ${r6h.status}`);
const svgForm = new FormData(); svgForm.append('berkas', new Blob([`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`], { type: 'image/svg+xml' }), 'x.svg');
const r6i = await fetch(`${U}/api/staf/unggah`, { method: 'POST', headers: { cookie: `warkop_token=${TKa}` }, body: svgForm }); hasil('B6-9 unggah SVG (skrip)', r6i.status === 415 || r6i.status === 422 || r6i.status === 400, `HTTP ${r6i.status}`);

// ---------- B5
console.log('\n## B5. CSRF — permintaan pengubah data dengan cookie sah tetapi Origin lintas asal');
const r5a = await fetch(`${U}/api/staf/pengaturan`, { method: 'PATCH', headers: H(TKa, { origin: 'https://jahat.example' }), body: JSON.stringify({}) }); hasil('B5-1 PATCH pengaturan Origin jahat.example', r5a.status === 403 && (await r5a.json()).kode === 'ASAL_TIDAK_SAH', `HTTP ${r5a.status}`);
const r5b = await fetch(`${U}/api/staf/pengaturan`, { method: 'PATCH', headers: H(TKa, { origin: U }), body: JSON.stringify({}) }); hasil('B5-2 PATCH pengaturan Origin same-origin (kontrol)', r5b.status !== 403, `HTTP ${r5b.status}`);
const r5c = await fetch(`${U}/api/staf/artikel/999999`, { method: 'DELETE', headers: H(TKa, { referer: 'https://jahat.example/halaman' }) }); hasil('B5-3 DELETE artikel Referer jahat.example (tanpa Origin)', r5c.status === 403, `HTTP ${r5c.status}`);
const r5d = await fetch(`${U}/api/auth/login`, { method: 'POST', headers: H(null, { origin: 'https://jahat.example' }), body: JSON.stringify({ email: 'a@b.c', kataSandi: 'x' }) }); hasil('B5-4 POST login Origin jahat.example', r5d.status === 403, `HTTP ${r5d.status}`);
const r5e = await fetch(`${U}/api/staf/pengaturan`, { headers: H(TKa, { origin: 'https://jahat.example' }) }); hasil('B5-5 GET dengan Origin asing tetap boleh (bukan pengubah data)', r5e.status === 200, `HTTP ${r5e.status}`);
const sc = (await fetch(`${U}/api/auth/login`, { method: 'POST', headers: H(null), body: JSON.stringify({ email: env.SEED_ADMIN_EMAIL, kataSandi: env.SEED_ADMIN_PASSWORD }) })).headers.get('set-cookie') || '';
hasil('B5-6 cookie sesi HttpOnly + SameSite=Lax', /HttpOnly/i.test(sc) && /SameSite=lax/i.test(sc), sc.replace(/warkop_token=[^;]+/, 'warkop_token=<…>').slice(0, 120));

// ---------- C8
console.log('\n## C8. Daftar putih pengaturan — kunci tampilan = kunci API (satu sumber PENGATURAN_DEFINISI); simpan-muat ulang setiap kunci');
const asli = await (await fetch(`${U}/api/staf/pengaturan`, { headers: H(TKa) })).json(); const nilaiAsli = asli.pengaturan ?? asli.nilai ?? asli;
const kunciApi = Object.keys(nilaiAsli).sort(); const kunciDef = [...KUNCI_PENGATURAN].sort();
hasil(`C8-1 kunci API (${kunciApi.length}) identik dengan definisi (${kunciDef.length})`, JSON.stringify(kunciApi) === JSON.stringify(kunciDef), kunciDef.join(','));
const rTolak = await fetch(`${U}/api/staf/pengaturan`, { method: 'PATCH', headers: H(TKa), body: JSON.stringify({ kunci_di_luar_daftar: 'x' }) }); hasil('C8-2 kunci di luar daftar putih ditolak', rTolak.status === 400 || rTolak.status === 422, `HTTP ${rTolak.status}`);
let c8gagal = 0;
for (const d of PENGATURAN_DEFINISI) {
  const lama = nilaiAsli[d.kunci]; let baru;
  // nilai uji harus tetap SAH menurut validasi tipe (email tetap email, angka tetap angka) — yang diuji adalah daftar putih + simpan-muat ulang
  if (d.tipe === 'angka' || d.tipe === 'number') baru = Number(lama || 0) + 1; else if (d.tipe === 'boolean' || d.tipe === 'bool') baru = !lama; else if (d.tipe === 'email' || /email/.test(d.kunci)) baru = 'uji.c8@contoh.id'; else if (d.tipe === 'url') baru = 'https://contoh.id/uji-c8'; else if (/hotline|telepon/.test(d.kunci)) baru = '0800-1-000000'; else baru = `${String(lama ?? '').slice(0, 40)} UJI-C8`.trim();
  const rs = await fetch(`${U}/api/staf/pengaturan`, { method: 'PATCH', headers: H(TKa), body: JSON.stringify({ [d.kunci]: baru }) });
  const muat = await (await fetch(`${U}/api/staf/pengaturan`, { headers: H(TKa) })).json(); const nilaiMuat = (muat.pengaturan ?? muat.nilai ?? muat)[d.kunci];
  const ok = rs.status === 200 && String(nilaiMuat) === String(baru);
  if (!ok) { c8gagal++; console.log(`  GAGAL ${d.kunci} (${d.tipe}): simpan ${rs.status}, muat ulang "${String(nilaiMuat).slice(0, 40)}" ≠ "${String(baru).slice(0, 40)}"`); }
  await fetch(`${U}/api/staf/pengaturan`, { method: 'PATCH', headers: H(TKa), body: JSON.stringify({ [d.kunci]: lama }) }); // pulihkan
}
const pulih = await (await fetch(`${U}/api/staf/pengaturan`, { headers: H(TKa) })).json(); hasil(`C8-3 simpan-muat ulang ${PENGATURAN_DEFINISI.length} kunci`, c8gagal === 0 && JSON.stringify(pulih.pengaturan ?? pulih.nilai ?? pulih) === JSON.stringify(nilaiAsli), `${c8gagal} gagal; nilai asli dipulihkan: ${JSON.stringify(pulih.pengaturan ?? pulih.nilai ?? pulih) === JSON.stringify(nilaiAsli)}`);

// ---------- bersihkan pengaduan uji
const { kueri, tutupPool } = await import('../../../lib/db/index.js'); const { waktuSekarang } = await import('../../../lib/utils.js');
await kueri("UPDATE pengaduan SET dihapus_pada=?, diperbarui_pada=? WHERE nomor_kasus=? AND dihapus_pada IS NULL", [waktuSekarang(), waktuSekarang(), NOMOR]); console.log(`\n  pengaduan uji ${NOMOR} dihapus lunak`);

// ---------- B4 (terakhir)
console.log('\n## B4. Rate limit — login, pengaduan, lacak, unggah (menghabiskan kuota IP dev; dijalankan terakhir)');
async function sampai429(nama, maks, fn) { for (let i = 1; i <= maks; i++) { const s = await fn(i); if (s === 429) { hasil(`B4 ${nama}`, true, `429 pada percobaan ke-${i}`); return; } } hasil(`B4 ${nama}`, false, `tidak pernah 429 dalam ${maks} percobaan`); }
await sampai429('login (gagal beruntun, per IP 20 / per akun 30)', 40, async () => (await fetch(`${U}/api/auth/login`, { method: 'POST', headers: H(null), body: JSON.stringify({ email: 'tidak.ada@contoh.id', kataSandi: 'salah' }) })).status);
await sampai429('pengaduan (10/60 menit per IP)', 20, async () => (await fetch(`${U}/api/pengaduan`, { method: 'POST', headers: H(null), body: JSON.stringify({}) })).status);
await sampai429('lacak (60/15 menit per IP)', 80, async () => (await fetch(`${U}/api/pengaduan/lacak/WRP-000001`)).status);
await sampai429('unggah staf (60/jam per akun)', 80, async () => { const f = new FormData(); return (await fetch(`${U}/api/staf/unggah`, { method: 'POST', headers: { cookie: `warkop_token=${TKa}` }, body: f })).status; });
await tutupPool();
console.log(`\nRINGKASAN: ${gagalTotal === 0 ? 'LULUS — semua pemeriksaan OK' : `${gagalTotal} pemeriksaan GAGAL`}`);
process.exit(0);

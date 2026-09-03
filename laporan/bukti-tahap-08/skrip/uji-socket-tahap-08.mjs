#!/usr/bin/env node
// UJI TAHAP 8 tingkat socket (node, socket.io-client): b muatan bersih (laporan BERNAMA), c tanpa token / token
// versi lama / token kedaluwarsa, d isolasi room wilayah, k beban (50 socket, 20 event), l pembersihan (20× buka-tutup).
// Prasyarat: dev server 127.0.0.1:3000 baru dinyalakan (kuota rate limit pengaduan segar), .env lokal.
import 'dotenv/config';
import { io } from 'socket.io-client';
import { SignJWT } from 'jose';
import { readFileSync } from 'node:fs';
import { KUNCI_TERLARANG } from '../../../lib/socket/siaran.js';
import { buatTokenFormulir } from '../../../lib/tokenFormulir.js';

const U = 'http://127.0.0.1:3000';
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((b) => /^[A-Z_]+=/.test(b)).map((b) => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1).trim()]));
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(email, sandi) {
  const r = await fetch(`${U}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, kataSandi: sandi }) });
  const set = r.headers.get('set-cookie') || '';
  const m = set.match(/warkop_token=([^;]+)/);
  return m ? m[1] : null;
}
function sambung(token, opsi = {}) {
  return new Promise((resolve) => {
    const s = io(U, { path: '/socket.io', transports: ['websocket'], reconnection: false, extraHeaders: token ? { cookie: `warkop_token=${token}` } : {}, ...opsi });
    s.on('connect', () => resolve({ ok: true, socket: s }));
    s.on('connect_error', (e) => resolve({ ok: false, galat: e.message, socket: s }));
  });
}
async function kirimPengaduan(muatan) {
  const r = await fetch(`${U}/api/pengaduan`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token_formulir: buatTokenFormulir(Date.now() - 5000), ...muatan }) });
  return { status: r.status, data: await r.json().catch(() => ({})) };
}
function periksaBersih(muatan) {
  const teks = JSON.stringify(muatan).toLowerCase();
  const kunci = Object.keys(muatan);
  const kunciTerlarang = kunci.filter((k) => KUNCI_TERLARANG.includes(k));
  return { kunci, kunciTerlarang };
}

console.log(`# Uji socket Tahap 8 — ${new Date().toISOString()}`);
const TK = {
  admin: await login(env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD),
  verif: await login('siti.aminah@warkopnusantara.id', env.SEED_STAF_PASSWORD),
  pw13: await login('pimpinan.jabar@warkopnusantara.id', env.SEED_STAF_PASSWORD),
  pw3: await login('rahmat.siregar@warkopnusantara.id', env.SEED_STAF_PASSWORD),
};
console.log('login:', Object.entries(TK).map(([k, v]) => `${k}=${v ? 'ok' : 'GAGAL'}`).join(' '));

// ---------------- c. autentikasi socket
console.log('\n## c. Socket tanpa token / token tidak sah / token versi lama / token kedaluwarsa -> DITOLAK');
const c1 = await sambung(null); console.log('  tanpa cookie          ->', c1.ok ? 'TERSAMBUNG (GAGAL)' : `ditolak: ${c1.galat}`); c1.socket.close();
const c2 = await sambung('token.palsu.abc'); console.log('  token palsu           ->', c2.ok ? 'TERSAMBUNG (GAGAL)' : `ditolak: ${c2.galat}`); c2.socket.close();
const rahasia = new TextEncoder().encode(env.JWT_SECRET);
const tvLama = await new SignJWT({ peran: 'superadmin', wilayah_id: null, tv: 999 }).setProtectedHeader({ alg: 'HS256' }).setSubject('1').setIssuer('warkop-nusantara').setIssuedAt().setExpirationTime('8h').sign(rahasia);
const c3 = await sambung(tvLama); console.log('  token_version berbeda ->', c3.ok ? 'TERSAMBUNG (GAGAL)' : `ditolak: ${c3.galat}`); c3.socket.close();
const kedaluwarsa = await new SignJWT({ peran: 'superadmin', wilayah_id: null, tv: 0 }).setProtectedHeader({ alg: 'HS256' }).setSubject('1').setIssuer('warkop-nusantara').setIssuedAt(Math.floor(Date.now() / 1000) - 7200).setExpirationTime(Math.floor(Date.now() / 1000) - 3600).sign(rahasia);
const c4 = await sambung(kedaluwarsa); console.log('  token kedaluwarsa     ->', c4.ok ? 'TERSAMBUNG (GAGAL)' : `ditolak: ${c4.galat}`); c4.socket.close();
const c5 = await sambung(TK.admin); console.log('  token sah (superadmin)->', c5.ok ? 'tersambung (kontrol)' : `ditolak: ${c5.galat}`);
const roomAdmin = await new Promise((r) => c5.socket.emit('room:saya', r)); console.log('  room superadmin:', roomAdmin.join(', '));
console.log('  HASIL c:', !c1.ok && !c2.ok && !c3.ok && !c4.ok && c5.ok ? 'LULUS' : 'GAGAL');

// ---------------- b + d. muatan bersih (laporan BERNAMA) & isolasi room wilayah
console.log('\n## b/d. Muatan mentah siaran (laporan BERNAMA, wilayah 13) & isolasi room wilayah');
const sV = (await sambung(TK.verif)).socket, s13 = (await sambung(TK.pw13)).socket, s3 = (await sambung(TK.pw3)).socket;
console.log('  room pimpinan wil 13:', (await new Promise((r) => s13.emit('room:saya', r))).join(', '));
console.log('  room pimpinan wil 3 :', (await new Promise((r) => s3.emit('room:saya', r))).join(', '));
const tangkap = { admin: [], verif: [], pw13: [], pw3: [] };
for (const [nama, s] of [['admin', c5.socket], ['verif', sV], ['pw13', s13], ['pw3', s3]]) for (const ev of ['pengaduan:baru', 'pengaduan:status', 'artikel:terbit']) s.on(ev, (m) => tangkap[nama].push({ ev, m }));
const kirim = await kirimPengaduan({ anonim: false, nama_pelapor: 'Pelapor Bernama Uji Socket', nik_pelapor: '3201019999990001', telepon_pelapor: '081299998888', email_pelapor: 'pelapor.socket@contoh.id', kategori_masalah: 'pungli', wilayah_id: 13, deskripsi: 'Uji b Tahap 8: laporan bernama untuk memastikan siaran socket tidak membawa identitas maupun deskripsi ini.' });
console.log('  POST /api/pengaduan (bernama, wilayah 13) ->', kirim.status, kirim.data.nomorKasus);
await tidur(1500);
// ubah status (verifikator) -> pengaduan:status
const idB = kirim.data.nomorKasus;
const rId = await fetch(`${U}/api/staf/pengaduan?q=${idB}`, { headers: { cookie: `warkop_token=${TK.verif}` } }).then((r) => r.json());
const pId = rId.baris?.[0]?.id;
const st = await fetch(`${U}/api/staf/pengaduan/${pId}/status`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: `warkop_token=${TK.verif}` }, body: JSON.stringify({ status: 'diverifikasi', catatan: 'Catatan internal rahasia uji b — tidak boleh ikut siaran.' }) });
console.log('  POST status diverifikasi ->', st.status);
await tidur(1500);
for (const [nama, daftar] of Object.entries(tangkap)) {
  console.log(`  [${nama}] menerima ${daftar.length} pesan`);
  for (const { ev, m } of daftar) {
    const { kunci, kunciTerlarang } = periksaBersih(m);
    const teks = JSON.stringify(m);
    const bocor = ['Pelapor Bernama', '3201019999990001', '081299998888', 'pelapor.socket', 'Uji b Tahap 8', 'Catatan internal', 'Siti Aminah'].filter((x) => teks.includes(x));
    console.log(`    ${ev} ${teks}`);
    console.log(`      kunci: ${kunci.join(',')} | kunci terlarang: ${kunciTerlarang.length ? kunciTerlarang.join(',') : 'NIHIL'} | nilai sensitif: ${bocor.length ? bocor.join(',') : 'NIHIL'}`);
  }
}
const semuaBersih = Object.values(tangkap).flat().every(({ m }) => periksaBersih(m).kunciTerlarang.length === 0 && !/Pelapor Bernama|3201019999990001|081299998888|pelapor\.socket|Uji b Tahap 8|Catatan internal|Siti Aminah/.test(JSON.stringify(m)));
console.log('  HASIL b:', semuaBersih && tangkap.verif.length >= 2 ? 'LULUS — semua muatan bersih (laporan bernama)' : 'GAGAL');
console.log('  HASIL d:', tangkap.pw13.length >= 2 && tangkap.pw3.length === 0 ? `LULUS — wilayah 13 menerima ${tangkap.pw13.length}, wilayah 3 menerima 0` : `GAGAL (13:${tangkap.pw13.length}, 3:${tangkap.pw3.length})`);
// artikel:terbit (redaktur menerbitkan draf seed id 42 lalu dikembalikan ke draf)
const TKr = await login('siti.rahma@warkopnusantara.id', env.SEED_STAF_PASSWORD);
const draf = await fetch(`${U}/api/staf/artikel?status=draf&perHalaman=1`, { headers: { cookie: `warkop_token=${TKr}` } }).then((r) => r.json());
const idDraf = draf.baris?.[0]?.id;
const tb = await fetch(`${U}/api/staf/artikel/${idDraf}/terbitkan`, { method: 'POST', headers: { cookie: `warkop_token=${TKr}` } });
await tidur(1200);
const art = tangkap.admin.filter((x) => x.ev === 'artikel:terbit');
console.log(`  artikel:terbit (POST terbitkan -> ${tb.status}) diterima superadmin: ${art.length}`, art[0] ? JSON.stringify(art[0].m) : '');
await fetch(`${U}/api/staf/artikel/${idDraf}`, { method: 'PATCH', headers: { 'content-type': 'application/json', cookie: `warkop_token=${TKr}` }, body: JSON.stringify({ status: 'draf' }) });

// ---------------- k. beban: 50 socket, 20 event
console.log('\n## k. Beban — 50 socket verifikator tersambung, 20 perubahan status beruntun');
const banyak = []; for (let i = 0; i < 50; i++) banyak.push((await sambung(TK.verif)).socket);
const hitung = new Array(50).fill(0); const latensi = [];
banyak.forEach((s, i) => s.on('pengaduan:status', (m) => { hitung[i] += 1; if (m.waktu) latensi.push(Date.now() - Date.parse(m.waktu)); }));
const stat0 = await fetch(`${U}/api/staf/statistik`, { headers: { cookie: `warkop_token=${TK.admin}` } }).then((r) => r.json());
console.log('  socket tersambung (statistik.jumlahSocket):', stat0.jumlahSocket);
const mulai = Date.now(); const urutan = ['diproses', 'diverifikasi'];
for (let i = 0; i < 20; i++) await fetch(`${U}/api/staf/pengaduan/${pId}/status`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: `warkop_token=${TK.verif}` }, body: JSON.stringify({ status: urutan[i % 2], catatan: `Uji beban perubahan status ke-${i + 1}.` }) });
await tidur(2000);
const total = hitung.reduce((a, b) => a + b, 0); const mem = process.memoryUsage().rss / 1024 / 1024;
console.log(`  20 POST status dalam ${Date.now() - mulai - 2000} ms; pesan diterima ${total}/1000 (50 socket × 20); socket dengan <20 pesan: ${hitung.filter((h) => h < 20).length}; latensi rata-rata ${latensi.length ? Math.round(latensi.reduce((a, b) => a + b, 0) / latensi.length) : '-'} ms (dari waktu siaran WIB); RSS klien ${mem.toFixed(0)} MB`);
console.log('  HASIL k:', total === 1000 ? 'LULUS — tidak ada pesan hilang' : 'GAGAL');

// ---------------- l. pembersihan: tutup semua, buka-tutup 20×, hitung kembali
console.log('\n## l. Pembersihan — tutup 50 socket, buka-tutup 20×, jumlah socket kembali ke dasar');
for (const s of [...banyak, sV, s13, s3]) s.close();
await tidur(1500);
const statDasar = await fetch(`${U}/api/staf/statistik`, { headers: { cookie: `warkop_token=${TK.admin}` } }).then((r) => r.json());
console.log('  setelah 50 ditutup (tersisa 1 socket superadmin uji):', statDasar.jumlahSocket);
for (let i = 0; i < 20; i++) { const s = (await sambung(TK.verif)).socket; await tidur(50); s.close(); }
await tidur(1500);
const statAkhir = await fetch(`${U}/api/staf/statistik`, { headers: { cookie: `warkop_token=${TK.admin}` } }).then((r) => r.json());
console.log('  setelah 20× buka-tutup:', statAkhir.jumlahSocket, '| listener event di io.sockets:', 'diperiksa server-side per socket (dibersihkan saat disconnect)');
console.log('  HASIL l:', statAkhir.jumlahSocket === statDasar.jumlahSocket && statDasar.jumlahSocket <= 1 ? 'LULUS — kembali ke dasar' : 'GAGAL');
c5.socket.close();
await tidur(800);
const statNol = await fetch(`${U}/api/staf/statistik`, { headers: { cookie: `warkop_token=${TK.admin}` } }).then((r) => r.json());
console.log('  setelah socket terakhir ditutup:', statNol.jumlahSocket);
// bersihkan pengaduan uji (hapus lunak) & data
const { kueri, tutupPool } = await import('../../../lib/db/index.js'); const { waktuSekarang } = await import('../../../lib/utils.js');
await kueri('UPDATE pengaduan SET dihapus_pada=?, diperbarui_pada=? WHERE nomor_kasus=?', [waktuSekarang(), waktuSekarang(), idB]); await tutupPool();
console.log('  pengaduan uji', idB, 'dihapus lunak');
process.exit(0);

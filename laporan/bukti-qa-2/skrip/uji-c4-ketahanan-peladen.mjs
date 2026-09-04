#!/usr/bin/env node
// QA-2 C4 — KETAHANAN PELADEN: satu galat di jalur permintaan TIDAK BOLEH mematikan seluruh proses.
//
// Latar: saat menjalankan uji C2, peladen lokal mati sendiri dengan
//   ⨯ uncaughtException: TypeError: Invalid state: Controller is already closed (ERR_INVALID_STATE)
// sesudah rentetan permintaan berbadan besar. Peladen kustom (server.js) tidak memasang penjaga proses,
// sehingga satu galat aliran yang tidak berbahaya menjatuhkan situs publik DAN ruang staf sekaligus.
// Perbaikan: server.js memasang uncaughtException/unhandledRejection (galat aliran aman -> dicatat lalu
// tetap melayani; galat lain -> keluar 1 agar container disalakan ulang), clientError, dan penutupan rapi SIGTERM.
//
// Uji ini menembak jalur-jalur yang secara nyata bisa memicu galat aliran, lalu memastikan peladen MASIH HIDUP:
//   1. badan permintaan jauh melewati batas (50 MB, 60 MB)
//   2. unggahan sah 15 MB yang DIPUTUS klien di tengah jalan (sinyal ponsel hilang) — beberapa waktu putus
//   3. permintaan HTTP cacat mentah lewat soket (header rusak, Content-Length bohong, badan terpotong)
//   4. beban campuran: 40 permintaan halaman + API sekaligus
// Setelah tiap kelompok: GET /api/health harus 200.
// Pemakaian: node laporan/bukti-qa-2/skrip/uji-c4-ketahanan-peladen.mjs [URL]
import 'dotenv/config';
import net from 'node:net';
import { buatTokenFormulir } from '../../../lib/tokenFormulir.js';

const U = process.argv[2] || 'http://127.0.0.1:3000';
const { hostname, port } = new URL(U);
let no = 0, gagal = 0; const nomorUji = [];
const langkah = async (teks, fn) => { no++; try { const h = await fn(); console.log(`  ${String(no).padStart(2)}. ${teks} → ${h}`); } catch (g) { gagal++; console.log(`  ${String(no).padStart(2)}. ${teks} → GAGAL: ${g.message}`); } };
const wajib = (k, p) => { if (!k) throw new Error(p); };
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const hidup = async () => { await tidur(1200); try { return (await fetch(`${U}/api/health`)).status; } catch { return 'MATI'; } };
const oktet = () => 1 + Math.floor(Math.random() * 250);
const formulir = (deskripsi, buf, nama, tipe) => {
  const f = new FormData();
  f.append('token_formulir', buatTokenFormulir(Date.now() - 5000));
  f.append('anonim', 'true'); f.append('kategori_masalah', 'lainnya'); f.append('wilayah_id', '13');
  f.append('deskripsi', deskripsi);
  if (buf) f.append('lampiran', new Blob([buf], { type: tipe }), nama);
  return f;
};
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.from([0, 0, 2, 0]), Buffer.from('isomiso2mp41'), Buffer.alloc(15 * 1024 * 1024)]);

console.log(`# QA-2 C4 — ketahanan peladen terhadap galat jalur permintaan — ${U} — ${new Date().toISOString()}`);

await langkah('badan permintaan 50 MB dan 60 MB (jauh melewati batas) → 413 dari route, peladen tetap hidup', async () => {
  const kode = [];
  for (const mb of [50, 60]) {
    const r = await fetch(`${U}/api/pengaduan`, { method: 'POST', headers: { 'x-forwarded-for': `203.0.113.${oktet()}` }, body: formulir('Uji ketahanan C4: badan permintaan melewati batas.', Buffer.alloc(mb * 1024 * 1024), 'besar.png', 'image/png') });
    kode.push(`${mb}MB→${r.status}`);
    wajib(r.status === 413, `${mb} MB dibalas ${r.status}, seharusnya 413`);
  }
  const h = await hidup(); wajib(h === 200, `health ${h}`);
  return `${kode.join(', ')}; health 200`;
});

await langkah('unggahan sah 15 MB DIPUTUS klien pada 60/150/400/900 ms → peladen tetap hidup di setiap kasus', async () => {
  const hasil = [];
  for (const ms of [60, 150, 400, 900]) {
    const ac = new AbortController();
    setTimeout(() => ac.abort(), ms);
    try {
      const r = await fetch(`${U}/api/pengaduan`, { method: 'POST', signal: ac.signal, headers: { 'x-forwarded-for': `203.0.113.${oktet()}` }, body: formulir(`Uji ketahanan C4: unggahan diputus pada ${ms} ms. Dihapus lunak.`, MP4, 'rekaman.mp4', 'video/mp4') });
      hasil.push(`${ms}ms→HTTP ${r.status}`);
      if (r.status === 201) { try { nomorUji.push((await r.json()).nomorKasus); } catch { /* abaikan */ } }
    } catch (g) { hasil.push(`${ms}ms→putus(${g.name})`); }
    const h = await hidup(); wajib(h === 200, `health ${h} setelah putus di ${ms} ms`);
  }
  return `${hasil.join(', ')}; health 200 di semua kasus`;
});

await langkah('permintaan HTTP cacat lewat soket mentah (header rusak, Content-Length bohong, badan terpotong) → peladen tetap hidup', async () => {
  const kirimMentah = (data, tutupCepat) => new Promise((selesai) => {
    const s = net.connect(Number(port), hostname, () => { s.write(data); if (tutupCepat) setTimeout(() => s.destroy(), 80); });
    let balasan = '';
    s.setTimeout(3000, () => s.destroy());
    s.on('data', (d) => { balasan += d.toString('latin1').slice(0, 40); });
    s.on('close', () => selesai(balasan.split('\r\n')[0] || '(tanpa balasan)'));
    s.on('error', () => selesai('(soket galat)'));
  });
  const hasil = [];
  hasil.push(`baris permintaan rusak: ${await kirimMentah('INI BUKAN HTTP\r\n\r\n')}`);
  hasil.push(`header rusak: ${await kirimMentah('GET /api/health HTTP/1.1\r\nHost: x\r\nBad Header Tanpa Titik Dua\r\n\r\n')}`);
  hasil.push(`Content-Length bohong: ${await kirimMentah('POST /api/pengaduan HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nContent-Length: 9999999\r\n\r\n{"a":1}', true)}`);
  hasil.push(`badan terpotong: ${await kirimMentah(`POST /api/pengaduan HTTP/1.1\r\nHost: x\r\nContent-Type: multipart/form-data; boundary=xx\r\nContent-Length: 500000\r\n\r\n--xx\r\n`, true)}`);
  const h = await hidup(); wajib(h === 200, `health ${h}`);
  return `${hasil.join(' | ')}; health 200`;
});

await langkah('beban campuran 40 permintaan serentak (halaman + API) → semua terjawab, peladen tetap hidup', async () => {
  const jalur = ['/', '/berita', '/struktur', '/kontak', '/api/health', '/api/artikel', '/api/pengaduan/lacak/WRP-000000', '/galeri'];
  const hasil = await Promise.all(Array.from({ length: 40 }, (_, i) => fetch(`${U}${jalur[i % jalur.length]}`).then((r) => r.status).catch(() => 'GAGAL')));
  const buruk = hasil.filter((s) => s !== 200 && s !== 404 && s !== 429);
  wajib(buruk.length === 0, `${buruk.length} permintaan gagal: ${buruk.slice(0, 5).join(',')}`);
  const h = await hidup(); wajib(h === 200, `health ${h}`);
  return `40 permintaan: ${[...new Set(hasil)].join('/')}; health 200`;
});

await langkah('pembersihan data uji', async () => {
  const { kueri, tutupPool } = await import('../../../lib/db/index.js');
  const { waktuSekarang } = await import('../../../lib/utils.js');
  const r = await kueri("UPDATE pengaduan SET dihapus_pada=?, diperbarui_pada=? WHERE dihapus_pada IS NULL AND deskripsi LIKE 'Uji ketahanan C4%'", [waktuSekarang(), waktuSekarang()]);
  await tutupPool();
  return `${r.affectedRows} pengaduan dihapus lunak`;
});

console.log(`\nRINGKASAN C4-ketahanan: ${no} langkah, ${gagal} gagal -> ${gagal === 0 ? 'LULUS' : 'GAGAL'}`);
process.exit(0);

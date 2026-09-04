// server.js — WARKOP NUSANTARA
// Next.js 16 + Socket.io dalam SATU proses (cetak biru bagian 9).
// TERBUKTI 31 Agustus 2026: proxy.js dijalankan Next.js 16.3.3 di bawah server ini,
// baik `node server.js` (dev) maupun NODE_ENV=production setelah `next build`.
//
// Jangan memakai `next start` — Socket.io butuh akses ke http.Server yang sama.
// Jangan memakai output: 'standalone' — server ini butuh node_modules penuh.

import { createServer } from 'node:http';
import next from 'next';
import { initSocket } from './lib/socket/server.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((req, res) => handle(req, res));

// Socket.io menumpang di http.Server yang sama. Instance disimpan di globalThis
// oleh initSocket agar route API (bundle berbeda) bisa memakainya lewat
// lib/socket/siaran.js — route API TIDAK pernah menyentuh io langsung.
initSocket(server);

// QA-2 C4 (BUG DIPERBAIKI): satu galat di jalur permintaan mematikan SELURUH peladen.
// Terjadi saat uji: badan permintaan yang melewati batas membuat Next menutup aliran, lalu menyusul
//   ⨯ uncaughtException: TypeError: Invalid state: Controller is already closed (ERR_INVALID_STATE)
// dan proses berhenti — semua sesi staf terputus dan pengaduan yang sedang diunggah hilang, padahal
// galatnya sendiri tidak berbahaya (aliran balasan memang sudah selesai). `next start` memasang penjaga
// serupa; peladen kustom ini tidak punya, jadi dipasang di sini.
//
// Sikap: galat aliran/koneksi yang sudah diketahui tidak berbahaya -> CATAT dan TERUS MELAYANI.
// Galat lain -> catat lalu keluar dengan kode 1 supaya Docker/Coolify menyalakan ulang container
// dalam keadaan bersih (healthcheck sudah ada), bukan berjalan dengan keadaan yang mungkin rusak.
const GALAT_ALIRAN_AMAN = new Set(['ERR_INVALID_STATE', 'ERR_STREAM_PREMATURE_CLOSE', 'ERR_STREAM_DESTROYED', 'ECONNRESET', 'EPIPE', 'ERR_HTTP_HEADERS_SENT']);
function tanganiGalatProses(jenis, galat) {
  // Pesan galat TIDAK PERNAH memuat isi permintaan; hanya nama, kode, dan baris pertama tumpukan.
  const kode = galat?.code || '(tanpa kode)';
  const baris = String(galat?.stack || galat?.message || galat).split('\n')[0];
  if (GALAT_ALIRAN_AMAN.has(kode)) {
    console.error(`[warkop] ${jenis} diabaikan (galat aliran/koneksi yang aman) kode=${kode}: ${baris}`);
    return;
  }
  console.error(`[warkop] ${jenis} FATAL kode=${kode}: ${baris}`);
  process.exitCode = 1;
  server.close(() => process.exit(1));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('uncaughtException', (g) => tanganiGalatProses('uncaughtException', g));
process.on('unhandledRejection', (g) => tanganiGalatProses('unhandledRejection', g));
// Permintaan HTTP cacat (header rusak, kiriman terpotong) tidak boleh menjatuhkan peladen.
server.on('clientError', (galat, socket) => {
  console.error(`[warkop] clientError kode=${galat?.code || '(tanpa kode)'}`);
  if (socket.writable && !socket.destroyed) socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
  else socket.destroy();
});

server.listen(port, hostname, () => {
  console.log(`[warkop] siap di http://${hostname}:${port}  mode=${dev ? 'dev' : 'produksi'}  STAF_HOST=${process.env.STAF_HOST || '(kosong: pemisahan host nonaktif)'}`);
});

// Penutupan rapi saat Docker/Coolify mengirim SIGTERM pada redeploy: berhenti menerima koneksi baru,
// biarkan permintaan yang sedang berjalan selesai (mis. pengaduan 20 MB yang sedang diunggah), maksimal 20 detik.
for (const sinyal of ['SIGTERM', 'SIGINT']) {
  process.on(sinyal, () => {
    console.log(`[warkop] ${sinyal} diterima: menutup peladen, menunggu permintaan berjalan selesai (maks 20 s)`);
    server.close(() => { console.log('[warkop] peladen ditutup rapi'); process.exit(0); });
    setTimeout(() => { console.log('[warkop] batas 20 s tercapai, keluar paksa'); process.exit(0); }, 20_000).unref();
  });
}

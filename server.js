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

server.listen(port, hostname, () => {
  console.log(`[warkop] siap di http://${hostname}:${port}  mode=${dev ? 'dev' : 'produksi'}  STAF_HOST=${process.env.STAF_HOST || '(kosong: pemisahan host nonaktif)'}`);
});

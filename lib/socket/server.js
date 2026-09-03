// lib/socket/server.js — memasang Socket.io pada http.Server yang sama dengan Next.js
// (cetak biru bagian 9). Instance io disimpan di globalThis agar route API — yang
// berada di bundle berbeda — bisa memakainya lewat lib/socket/siaran.js (Tahap 8).
// Tahap 0: kerangka saja, belum ada event/autentikasi socket.

import { Server } from 'socket.io';

const KUNCI_GLOBAL = '__warkopIo';

export function initSocket(httpServer) {
  if (globalThis[KUNCI_GLOBAL]) return globalThis[KUNCI_GLOBAL];

  const io = new Server(httpServer, {
    path: '/socket.io',
    // Tanpa konfigurasi CORS: klien wajib menyambung same-origin
    // (cookie httpOnly tidak lintas subdomain — REFERENSI 13).
    serveClient: false,
  });

  globalThis[KUNCI_GLOBAL] = io;
  console.log('[warkop] Socket.io terpasang di path /socket.io');
  return io;
}

/** Mengambil instance io yang tersimpan; null bila server belum menyalakannya. */
export function ambilIo() {
  return globalThis[KUNCI_GLOBAL] || null;
}

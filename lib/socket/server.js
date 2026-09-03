// lib/socket/server.js — Socket.io pada http.Server yang sama dengan Next.js (cetak biru bagian 9).
// Instance io disimpan di globalThis agar route API (bundle berbeda) memakainya lewat lib/socket/siaran.js.
//
// Tahap 8 — AUTENTIKASI SOCKET (TAHAP-08 §2): setiap socket WAJIB terverifikasi sebelum masuk room.
//   1. token dibaca dari cookie `warkop_token` pada handshake (same-origin: cookie httpOnly ikut terkirim),
//   2. diverifikasi dengan jose (lib/auth/jwt.js: tanda tangan, issuer, kedaluwarsa),
//   3. diperiksa ke DB (lib/db/users.js): akun aktif + token_version sama (paksa keluar/ganti sandi membatalkan),
//   4. tanpa token / tidak sah -> DITOLAK (next(Error)), bukan dibiarkan tersambung tanpa room.
// ROOM (§3): global, user:<id>, staf, wilayah:<id> (hanya pimpinan_wilayah, sesuai wilayahnya).
// Berkas ini dimuat langsung oleh server.js (Node ESM) — jangan mengimpor modul yang bergantung pada
// runtime Next (next/headers, dsb.).
import { Server } from 'socket.io';
import { verifikasiToken } from '../auth/jwt.js';
import { ambilUserUntukSesi } from '../db/users.js';

const KUNCI_GLOBAL = '__warkopIo';
const NAMA_COOKIE = 'warkop_token';

/** Mengambil nilai satu cookie dari header Cookie mentah (tanpa pustaka). */
export function ambilCookie(header, nama) {
  if (!header) return null;
  for (const bagian of String(header).split(';')) {
    const i = bagian.indexOf('=');
    if (i < 0) continue;
    if (bagian.slice(0, i).trim() === nama) return decodeURIComponent(bagian.slice(i + 1).trim());
  }
  return null;
}

/**
 * Room yang dimasuki pengguna terverifikasi (§3).
 * KEPUTUSAN BARU: pimpinan_wilayah TIDAK masuk room `staf` — hanya `wilayah:<id>` (+ global, user). Bila ia ikut
 * `staf`, siaran pengaduan wilayah lain (yang dikirim ke `staf`) akan sampai kepadanya dan uji d (isolasi wilayah)
 * gagal. Ini padanan socket dari matriks REFERENSI 11: pimpinan_wilayah hanya data wilayahnya.
 */
export function roomUntuk(pengguna) {
  const daftar = ['global', `user:${pengguna.id}`];
  if (pengguna.peran === 'pimpinan_wilayah') {
    if (pengguna.wilayah_id != null) daftar.push(`wilayah:${pengguna.wilayah_id}`);
  } else {
    daftar.push('staf');
  }
  return daftar;
}

export function initSocket(httpServer) {
  if (globalThis[KUNCI_GLOBAL]) return globalThis[KUNCI_GLOBAL];

  const io = new Server(httpServer, {
    path: '/socket.io',
    // Tanpa konfigurasi CORS: klien wajib menyambung same-origin (cookie httpOnly tidak lintas subdomain — REFERENSI 13).
    serveClient: false,
    // Muatan kecil saja (event penanda); batasi agar tidak disalahgunakan
    maxHttpBufferSize: 16 * 1024,
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  // Middleware autentikasi — berjalan SEBELUM 'connection'; gagal = handshake ditolak.
  io.use(async (socket, next) => {
    try {
      const token = ambilCookie(socket.handshake.headers?.cookie, NAMA_COOKIE);
      if (!token) return next(new Error('TANPA_TOKEN'));
      const muatan = await verifikasiToken(token);
      if (!muatan) return next(new Error('TOKEN_TIDAK_SAH'));
      const pengguna = await ambilUserUntukSesi(muatan.id);
      if (!pengguna || !pengguna.aktif) return next(new Error('AKUN_NONAKTIF'));
      if (Number(pengguna.token_version) !== Number(muatan.token_version)) return next(new Error('SESI_DIBATALKAN'));
      socket.data.pengguna = { id: pengguna.id, peran: pengguna.peran, wilayah_id: pengguna.wilayah_id ?? null };
      return next();
    } catch (galat) {
      console.error('[socket] galat autentikasi:', galat?.message);
      return next(new Error('GALAT_AUTENTIKASI'));
    }
  });

  io.on('connection', (socket) => {
    const p = socket.data.pengguna;
    for (const room of roomUntuk(p)) socket.join(room);
    // Klien boleh meminta daftar room-nya (diagnostik uji d); tidak ada event lain dari klien yang diproses.
    socket.on('room:saya', (balas) => { if (typeof balas === 'function') balas([...socket.rooms].filter((r) => r !== socket.id)); });
  });

  globalThis[KUNCI_GLOBAL] = io;
  console.log('[warkop] Socket.io terpasang di path /socket.io (autentikasi cookie + room per peran)');
  return io;
}

/** Mengambil instance io yang tersimpan; null bila server belum menyalakannya. */
export function ambilIo() {
  return globalThis[KUNCI_GLOBAL] || null;
}

/** Jumlah socket tersambung saat ini (uji k/l; dibaca route statistik untuk superadmin). */
export function jumlahSocket() {
  const io = ambilIo();
  return io ? io.engine.clientsCount : 0;
}

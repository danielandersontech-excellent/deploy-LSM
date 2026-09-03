// lib/db/index.js — pool koneksi MariaDB (cetak biru bagian 7).
//
// Dua hal WAJIB dan tidak boleh dilewat (aturan 1, pelajaran Cap Jiki nomor 1):
//   1. timezone: '+07:00' pada pool, agar DATETIME dibaca/ditulis sebagai WIB
//   2. hook pool.on('connection') yang menjalankan SET time_zone = '+07:00'
//      pada SETIAP koneksi baru, agar NOW() di sisi server juga WIB.
//
// Seluruh SQL sistem ini ada di lib/db/*.js. Route API tidak pernah menulis SQL.

import mysql from 'mysql2/promise';

let pool;

/** Pool tunggal (lazy) — dibuat saat pertama dipakai, dipakai ulang di seluruh proses. */
export function db() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
      timezone: '+07:00',
      charset: 'utf8mb4_unicode_ci',
      // KEPUTUSAN BARU (Tahap 0): batas waktu sambung 5 detik agar /api/health
      // menjawab 503 dengan cepat saat DB mati — healthcheck Docker/Coolify
      // memakai timeout 10 detik (cetak biru bagian 6).
      connectTimeout: 5000,
    });

    // WAJIB: samakan zona waktu sesi, agar NOW() dan CURRENT_TIMESTAMP
    // menghasilkan waktu lokal (WIB), bukan UTC.
    pool.on('connection', (conn) => {
      conn.query("SET time_zone = '+07:00'");
    });
  }
  return pool;
}

/** Memeriksa koneksi basis data. Mengembalikan true bila kueri sederhana berhasil. */
export async function periksaKoneksi() {
  try {
    const [baris] = await db().query('SELECT 1 AS ok');
    return Array.isArray(baris) && baris[0]?.ok === 1;
  } catch {
    return false;
  }
}

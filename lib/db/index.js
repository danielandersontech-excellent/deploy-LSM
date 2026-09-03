// lib/db/index.js — pool koneksi MariaDB (cetak biru bagian 7).
//
// Dua hal WAJIB dan tidak boleh dilewat (aturan 1, pelajaran Cap Jiki nomor 1):
//   1. timezone: '+07:00' pada pool, agar DATETIME dibaca/ditulis sebagai WIB
//   2. hook pool.on('connection') yang menjalankan SET time_zone = '+07:00'
//      pada SETIAP koneksi baru, agar NOW() di sisi server juga WIB.
//
// Seluruh SQL sistem ini ada di lib/db/*.js. Route API tidak pernah menulis SQL.
// Semua kueri lewat kueri() = prepared statement (execute), tanpa kecuali.

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

/** Log kueri ke stdout bila DB_LOG_KUERI=1 (untuk uji penyaringan identitas/wilayah). */
function logKueri(sql, params) {
  if (process.env.DB_LOG_KUERI === '1') {
    console.log('[SQL]', sql.replace(/\s+/g, ' ').trim(), params?.length ? JSON.stringify(params) : '');
  }
}

/**
 * Menjalankan SATU prepared statement. Selalu memakai execute() (parameter
 * dikirim terpisah dari SQL — bukan penggabungan string).
 * @param {string} sql        SQL dengan placeholder ?
 * @param {any[]}  params     nilai parameter
 * @param {import('mysql2/promise').PoolConnection} [koneksi] koneksi transaksi (opsional)
 * @returns {Promise<any>} baris hasil (SELECT) atau ResultSetHeader (INSERT/UPDATE/DELETE)
 */
export async function kueri(sql, params = [], koneksi = null) {
  logKueri(sql, params);
  const [hasil] = await (koneksi ?? db()).execute(sql, params);
  return hasil;
}

/**
 * Menjalankan fn di dalam satu transaksi. Commit bila fn selesai, rollback
 * SELURUHNYA bila fn melempar galat. fn menerima koneksi untuk diteruskan ke kueri().
 */
export async function transaksi(fn) {
  const koneksi = await db().getConnection();
  try {
    await koneksi.beginTransaction();
    const hasil = await fn(koneksi);
    await koneksi.commit();
    return hasil;
  } catch (galat) {
    await koneksi.rollback();
    throw galat;
  } finally {
    koneksi.release();
  }
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

/** Nama tabel yang boleh dihitung/diperiksa oleh skrip CLI (daftar putih, bukan masukan). */
const TABEL_DIKENAL = Object.freeze(['wilayah', 'users', 'kategori_artikel', 'artikel', 'tag', 'artikel_tag', 'pengaduan',
  'pengaduan_lampiran', 'pengaduan_riwayat', 'pengurus', 'program', 'galeri', 'pengaturan', 'audit_log']);

/** Berapa tabel dari daftar yang sudah ada di skema aktif (untuk memastikan schema.sql sudah dijalankan). */
export async function hitungTabelAda(daftar = TABEL_DIKENAL) {
  const aman = daftar.filter((t) => TABEL_DIKENAL.includes(t));
  if (!aman.length) return 0;
  const baris = await kueri(
    `SELECT COUNT(*) AS jumlah FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN (${aman.map(() => '?').join(', ')})`,
    aman,
  );
  return Number(baris[0].jumlah);
}

/** Jumlah baris satu tabel dari daftar putih (nama tabel TIDAK berasal dari masukan pengguna). */
export async function hitungBaris(tabel) {
  if (!TABEL_DIKENAL.includes(tabel)) throw new Error(`Tabel tidak dikenal: ${tabel}`);
  const baris = await kueri(`SELECT COUNT(*) AS jumlah FROM ${tabel}`); // nama dari TABEL_DIKENAL, bukan masukan
  return Number(baris[0].jumlah);
}

/**
 * Menjalankan teks SQL multi-pernyataan (berkas database/seed.sql) lewat koneksi
 * terpisah ber-multipleStatements. Hanya untuk skrip CLI; route API tidak memakainya.
 */
export async function jalankanSkripSql(teksSql) {
  const koneksi = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    multipleStatements: true, timezone: '+07:00', charset: 'utf8mb4_unicode_ci',
  });
  try {
    await koneksi.query("SET time_zone = '+07:00'");
    await koneksi.query(teksSql);
  } finally {
    await koneksi.end();
  }
}

/** Menutup pool (dipakai skrip CLI seperti scripts/seed.js). */
export async function tutupPool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

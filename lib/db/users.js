// lib/db/users.js — seluruh SQL tabel users. Prepared statement tanpa kecuali.
// Kolom kata_sandi_hash HANYA dikembalikan oleh cariUserByEmail (untuk login).
import { kueri } from './index.js';
import { waktuSekarang } from '../utils.js';

const KOLOM_AMAN = `u.id, u.nama, u.email, u.peran, u.wilayah_id, w.nama AS wilayah_nama,
  u.aktif, u.token_version, u.terakhir_masuk, u.dibuat_pada, u.diperbarui_pada`;

/** Untuk login: mengembalikan baris termasuk kata_sandi_hash, atau null. */
export async function cariUserByEmail(email) {
  const baris = await kueri(
    `SELECT u.id, u.nama, u.email, u.kata_sandi_hash, u.peran, u.wilayah_id, u.aktif, u.token_version
     FROM users u WHERE u.email = ? LIMIT 1`,
    [String(email).trim().toLowerCase()],
  );
  return baris[0] ?? null;
}

export async function ambilUser(id) {
  const baris = await kueri(
    `SELECT ${KOLOM_AMAN} FROM users u LEFT JOIN wilayah w ON w.id = u.wilayah_id WHERE u.id = ? LIMIT 1`,
    [Number(id)],
  );
  return baris[0] ?? null;
}

export async function ambilSemuaUser() {
  return kueri(
    `SELECT ${KOLOM_AMAN} FROM users u LEFT JOIN wilayah w ON w.id = u.wilayah_id ORDER BY u.peran, u.nama`,
  );
}

/** Membuat pengguna. kataSandiHash sudah di-hash bcrypt oleh pemanggil. Mengembalikan id. */
export async function buatUser({ nama, email, kataSandiHash, peran, wilayahId = null, aktif = 1 }) {
  const sekarang = waktuSekarang();
  const hasil = await kueri(
    `INSERT INTO users (nama, email, kata_sandi_hash, peran, wilayah_id, aktif, token_version, dibuat_pada, diperbarui_pada)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [nama, String(email).trim().toLowerCase(), kataSandiHash, peran, wilayahId, aktif ? 1 : 0, sekarang, sekarang],
  );
  return hasil.insertId;
}

export async function perbaruiUser(id, { nama, peran, wilayahId = null, aktif }) {
  const hasil = await kueri(
    `UPDATE users SET nama = ?, peran = ?, wilayah_id = ?, aktif = ?, diperbarui_pada = ? WHERE id = ?`,
    [nama, peran, wilayahId, aktif ? 1 : 0, waktuSekarang(), Number(id)],
  );
  return hasil.affectedRows;
}

/** Mengganti kata sandi DAN menaikkan token_version (seluruh sesi lama batal). */
export async function ubahKataSandi(id, kataSandiHash) {
  const hasil = await kueri(
    `UPDATE users SET kata_sandi_hash = ?, token_version = token_version + 1, diperbarui_pada = ? WHERE id = ?`,
    [kataSandiHash, waktuSekarang(), Number(id)],
  );
  return hasil.affectedRows;
}

/** Membatalkan seluruh JWT lama pengguna (cetak biru bagian 8). */
export async function naikkanTokenVersion(id) {
  const hasil = await kueri(
    `UPDATE users SET token_version = token_version + 1, diperbarui_pada = ? WHERE id = ?`,
    [waktuSekarang(), Number(id)],
  );
  return hasil.affectedRows;
}

export async function catatTerakhirMasuk(id) {
  await kueri(`UPDATE users SET terakhir_masuk = ? WHERE id = ?`, [waktuSekarang(), Number(id)]);
}

/**
 * Menonaktifkan akun (penghapusan lunak). Akun TIDAK pernah dihapus fisik:
 * artikel.penulis_id ON DELETE RESTRICT — riwayat kepenulisan harus tetap ada.
 * Token lama ikut dibatalkan.
 */
export async function nonaktifkanUser(id) {
  const hasil = await kueri(
    `UPDATE users SET aktif = 0, token_version = token_version + 1, diperbarui_pada = ? WHERE id = ?`,
    [waktuSekarang(), Number(id)],
  );
  return hasil.affectedRows;
}

export async function hitungUser() {
  const baris = await kueri(`SELECT COUNT(*) AS jumlah FROM users`);
  return Number(baris[0].jumlah);
}

/** Seed: menyetel ulang kata sandi + memaksa peran superadmin & aktif; token lama batal. */
export async function setelUlangSuperadmin(id, kataSandiHash) {
  const hasil = await kueri(
    `UPDATE users SET kata_sandi_hash = ?, peran = 'superadmin', aktif = 1, token_version = token_version + 1, diperbarui_pada = ? WHERE id = ?`,
    [kataSandiHash, waktuSekarang(), Number(id)],
  );
  return hasil.affectedRows;
}

/** Seed: mengaktifkan akun contoh yang masih ber-hash penampung '!' (tidak bisa masuk). */
export async function aktifkanAkunContoh(id, kataSandiHash) {
  const hasil = await kueri(
    `UPDATE users SET kata_sandi_hash = ?, aktif = 1, diperbarui_pada = ? WHERE id = ? AND kata_sandi_hash = '!'`,
    [kataSandiHash, waktuSekarang(), Number(id)],
  );
  return hasil.affectedRows;
}

/** Sesi (lapisan 3/4): kolom minimum untuk memeriksa aktif + token_version. Tanpa hash. */
export async function ambilUserUntukSesi(id) {
  const baris = await kueri(
    `SELECT u.id, u.nama, u.email, u.peran, u.wilayah_id, w.nama AS wilayah_nama, u.aktif, u.token_version
     FROM users u LEFT JOIN wilayah w ON w.id = u.wilayah_id WHERE u.id = ? LIMIT 1`,
    [Number(id)],
  );
  return baris[0] ?? null;
}

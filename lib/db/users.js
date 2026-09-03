// lib/db/users.js — seluruh SQL tabel users. Prepared statement tanpa kecuali.
// Kolom kata_sandi_hash HANYA dikembalikan oleh cariUserByEmail (untuk login).
import { kueri } from './index.js';
import { waktuSekarang } from '../utils.js';

const KOLOM_AMAN = `u.id, u.nama, u.email, u.peran, u.wilayah_id, w.nama AS wilayah_nama,
  u.aktif, u.token_version, u.wajib_ganti_sandi, u.terakhir_masuk, u.dibuat_pada, u.diperbarui_pada`;

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

/** Kandidat petugas pengaduan: verifikator & superadmin yang aktif (tanpa hash). */
export async function ambilPetugasKandidat() {
  return kueri(`SELECT id, nama, peran FROM users WHERE aktif = 1 AND peran IN ('verifikator', 'superadmin') ORDER BY nama`);
}

/** Reset kata sandi oleh superadmin: hash baru + wajib ganti saat login berikutnya + token lama batal. */
export async function setelUlangSandiOlehAdmin(id, kataSandiHash) {
  const hasil = await kueri(
    `UPDATE users SET kata_sandi_hash = ?, wajib_ganti_sandi = 1, token_version = token_version + 1, diperbarui_pada = ? WHERE id = ?`,
    [kataSandiHash, waktuSekarang(), Number(id)],
  );
  return hasil.affectedRows;
}

/** Pengguna mengganti sandinya sendiri: wajib_ganti_sandi dihapus (token lama tidak dibatalkan di sini). */
export async function gantiSandiSendiri(id, kataSandiHash) {
  const hasil = await kueri(
    `UPDATE users SET kata_sandi_hash = ?, wajib_ganti_sandi = 0, diperbarui_pada = ? WHERE id = ?`,
    [kataSandiHash, waktuSekarang(), Number(id)],
  );
  return hasil.affectedRows;
}

/** Ubah email (superadmin); keunikan dijamin UNIQUE KEY + pemeriksaan di route. */
export async function ubahEmailUser(id, email) {
  const hasil = await kueri(`UPDATE users SET email = ?, diperbarui_pada = ? WHERE id = ?`, [String(email).trim().toLowerCase(), waktuSekarang(), Number(id)]);
  return hasil.affectedRows;
}

/** Jumlah superadmin AKTIF — larangan menghapus/menonaktifkan superadmin terakhir. */
export async function hitungSuperadminAktif() {
  const baris = await kueri(`SELECT COUNT(*) AS jumlah FROM users WHERE peran = 'superadmin' AND aktif = 1`);
  return Number(baris[0].jumlah);
}

/** Hapus fisik pengguna; gagal (ER_ROW_IS_REFERENCED_2) bila punya artikel/riwayat — pemanggil menyarankan nonaktifkan. */
/**
 * Tahap 9 (KEPUTUSAN BARU): jumlah jejak pengguna di tabel lain. FK audit_log.user_id, pengaduan_riwayat.oleh_user_id,
 * pengaduan.petugas_id ber-ON DELETE SET NULL sehingga penghapusan akan MENGHILANGKAN pelaku dari jejak audit/buku besar.
 * Pengguna yang punya jejak tidak boleh dihapus — cukup dinonaktifkan (skema: "akun dinonaktifkan, bukan dihapus").
 */
export async function hitungJejakUser(id) {
  const [b] = await kueri(
    `SELECT (SELECT COUNT(*) FROM audit_log WHERE user_id = ?) AS audit,
            (SELECT COUNT(*) FROM pengaduan_riwayat WHERE oleh_user_id = ?) AS riwayat,
            (SELECT COUNT(*) FROM pengaduan WHERE petugas_id = ?) AS petugas,
            (SELECT COUNT(*) FROM artikel WHERE penulis_id = ?) AS artikel`,
    [Number(id), Number(id), Number(id), Number(id)],
  );
  return { audit: Number(b?.audit || 0), riwayat: Number(b?.riwayat || 0), petugas: Number(b?.petugas || 0), artikel: Number(b?.artikel || 0) };
}

export async function hapusUser(id) {
  const hasil = await kueri(`DELETE FROM users WHERE id = ?`, [Number(id)]);
  return hasil.affectedRows;
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
    `SELECT u.id, u.nama, u.email, u.peran, u.wilayah_id, w.nama AS wilayah_nama, u.aktif, u.token_version, u.wajib_ganti_sandi
     FROM users u LEFT JOIN wilayah w ON w.id = u.wilayah_id WHERE u.id = ? LIMIT 1`,
    [Number(id)],
  );
  return baris[0] ?? null;
}

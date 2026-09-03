// lib/db/audit.js — jejak audit. Setiap pembukaan identitas pelapor WAJIB lewat sini.
import { kueri } from './index.js';
import { waktuSekarang } from '../utils.js';

/**
 * Mencatat satu tindakan. `detail` diserialisasi ke JSON — JANGAN memasukkan
 * identitas pelapor ke dalam detail (cukup id pengaduan dan jenis aksi).
 */
export async function catatAudit({ userId = null, aksi, tabelTerkait = null, idTerkait = null, detail = null, ip = null }, koneksi = null) {
  const hasil = await kueri(
    `INSERT INTO audit_log (user_id, aksi, tabel_terkait, id_terkait, detail, ip, dibuat_pada)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, aksi, tabelTerkait, idTerkait, detail == null ? null : JSON.stringify(detail), ip, waktuSekarang()],
    koneksi,
  );
  return hasil.insertId;
}

/** Aktivitas staf terbaru untuk dashboard (tanpa detail sensitif). */
export async function ambilAktivitasTerbaru(batas = 10) {
  return kueri(
    `SELECT a.id, a.aksi, a.tabel_terkait, a.id_terkait, a.dibuat_pada, u.nama AS nama_user
     FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.dibuat_pada DESC, a.id DESC LIMIT ?`,
    [Math.max(1, Math.min(100, Number(batas) || 10))],
  );
}

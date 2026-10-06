// lib/db/aiSaran.js — seluruh SQL tabel ai_saran (RUN AI-1: asisten berita AI).
// Muatan saran (judul, ringkasan, isiHtml, kategoriSlug, tag, kueriGambar, catatanVerifikasi, sumberRiset) disimpan
// sebagai JSON; sumberRiset/catatanVerifikasi/gambar_sumber adalah data INTERNAL redaksi — modul publik tidak pernah
// membaca tabel ini (lib/db/artikel.js tidak menyentuh kolom ai_saran_id pada kueri publik).
import { kueri, transaksi } from './index.js';
import { waktuSekarang, tanggalSekarang } from '../utils.js';

const KOLOM = `s.id, s.kelompok, s.topik, s.muatan, s.gambar_jalur, s.gambar_sumber, s.status, s.pemakai_id, s.artikel_id,
  s.model, s.token_masuk, s.token_keluar, s.jumlah_pencarian, s.dibuat_pada, s.diperbarui_pada`;

/** MariaDB menyimpan JSON sebagai LONGTEXT: mysql2 mengembalikan string -> diurai di sini (tahan nilai NULL/rusak). */
function uraiJson(nilai, bawaan = null) {
  if (nilai == null) return bawaan;
  if (typeof nilai !== 'string') return nilai;
  try { return JSON.parse(nilai); } catch { return bawaan; }
}

function normalkan(baris) {
  if (!baris) return null;
  return { ...baris, muatan: uraiJson(baris.muatan, {}), gambar_sumber: uraiJson(baris.gambar_sumber, null) };
}

/**
 * Menyimpan satu kelompok saran (hasil SATU panggilan API). Setiap saran = satu baris; token/jumlah pencarian
 * dicatat sama pada tiap baris kelompok (biaya per panggilan dihitung DISTINCT kelompok).
 * @returns {Promise<number[]>} id baris yang dibuat, urut sama dengan `daftar`
 */
export async function simpanKelompokSaran({ kelompok, topik, daftar, pemakaiId, model, tokenMasuk = 0, tokenKeluar = 0, jumlahPencarian = 0 }) {
  return transaksi(async (koneksi) => {
    const sekarang = waktuSekarang();
    const id = [];
    for (const muatan of daftar) {
      const hasil = await kueri(
        `INSERT INTO ai_saran (kelompok, topik, muatan, status, pemakai_id, model, token_masuk, token_keluar, jumlah_pencarian, dibuat_pada, diperbarui_pada)
         VALUES (?, ?, ?, 'baru', ?, ?, ?, ?, ?, ?, ?)`,
        [kelompok, topik, JSON.stringify(muatan), Number(pemakaiId), model, Number(tokenMasuk) || 0, Number(tokenKeluar) || 0, Number(jumlahPencarian) || 0, sekarang, sekarang],
        koneksi,
      );
      id.push(hasil.insertId);
    }
    return id;
  });
}

export async function ambilSaranById(id) {
  const baris = await kueri(`SELECT ${KOLOM} FROM ai_saran s WHERE s.id = ? LIMIT 1`, [Number(id)]);
  return normalkan(baris[0] ?? null);
}

/** Riwayat saran satu pengguna (terbaru dulu), semua status. */
export async function ambilSaranPengguna(pemakaiId, batas = 30) {
  const baris = await kueri(
    `SELECT ${KOLOM}, a.judul AS artikel_judul, a.status AS artikel_status
     FROM ai_saran s LEFT JOIN artikel a ON a.id = s.artikel_id
     WHERE s.pemakai_id = ? ORDER BY s.dibuat_pada DESC, s.id DESC LIMIT ?`,
    [Number(pemakaiId), Math.max(1, Math.min(100, Number(batas) || 30))],
  );
  return baris.map(normalkan);
}

/** Jumlah PANGGILAN API (DISTINCT kelompok) pengguna sejak 00:00 WIB hari ini — dasar kuota 10/hari. */
export async function hitungPanggilanHariIni(pemakaiId) {
  const baris = await kueri(
    `SELECT COUNT(DISTINCT kelompok) AS jumlah FROM ai_saran WHERE pemakai_id = ? AND dibuat_pada >= ?`,
    [Number(pemakaiId), `${tanggalSekarang()} 00:00:00`],
  );
  return Number(baris[0]?.jumlah || 0);
}

/** Menyimpan hasil mesin gambar untuk satu saran (jalur berkas + asal foto internal). */
export async function simpanGambarSaran(id, jalur, sumber) {
  const hasil = await kueri(
    `UPDATE ai_saran SET gambar_jalur = ?, gambar_sumber = ?, diperbarui_pada = ? WHERE id = ?`,
    [jalur, sumber == null ? null : JSON.stringify(sumber), waktuSekarang(), Number(id)],
  );
  return hasil.affectedRows;
}

/** Menandai saran dipakai -> artikel draf `artikelId`. Hanya dari status 'baru' (mencegah pakai ganda). */
export async function tandaiDipakai(id, artikelId, koneksi = null) {
  const hasil = await kueri(
    `UPDATE ai_saran SET status = 'dipakai', artikel_id = ?, diperbarui_pada = ? WHERE id = ? AND status = 'baru'`,
    [Number(artikelId), waktuSekarang(), Number(id)],
    koneksi,
  );
  return hasil.affectedRows;
}

/** Saran 'baru' yang lebih tua dari `hari` hari (kandidat pembersihan). */
export async function ambilSaranKadaluarsa(hari = 7) {
  const batas = waktuSekarang(new Date(Date.now() - Math.max(1, Number(hari) || 7) * 24 * 60 * 60 * 1000));
  return kueri(`SELECT id, gambar_jalur FROM ai_saran WHERE status = 'baru' AND dibuat_pada < ? ORDER BY id LIMIT 500`, [batas]);
}

export async function tandaiDibersihkan(id) {
  const hasil = await kueri(
    `UPDATE ai_saran SET status = 'dibersihkan', gambar_jalur = NULL, diperbarui_pada = ? WHERE id = ? AND status = 'baru'`,
    [waktuSekarang(), Number(id)],
  );
  return hasil.affectedRows;
}

/** Asal AI sebuah artikel (untuk pita + panel internal di editor); null bila artikel bukan dari saran AI. */
export async function ambilAsalAiArtikel(artikelId) {
  const baris = await kueri(
    `SELECT ${KOLOM} FROM artikel a JOIN ai_saran s ON s.id = a.ai_saran_id WHERE a.id = ? LIMIT 1`,
    [Number(artikelId)],
  );
  return normalkan(baris[0] ?? null);
}

/** Statistik ringkas untuk laporan/diagnosis (per penyedia gambar & biaya), tanpa muatan. */
export async function ringkasanSaran() {
  const baris = await kueri(
    `SELECT status, COUNT(*) AS jumlah, COUNT(DISTINCT kelompok) AS panggilan, SUM(token_masuk) AS token_masuk, SUM(token_keluar) AS token_keluar
     FROM ai_saran GROUP BY status`,
  );
  return baris;
}

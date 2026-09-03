// lib/db/galeri.js — seluruh SQL tabel galeri.
import { kueri } from './index.js';
import { waktuSekarang } from '../utils.js';

const KOLOM = `g.id, g.judul, g.deskripsi, g.jenis, g.berkas, g.thumbnail, g.kategori, g.wilayah_id, w.nama AS wilayah_nama,
  g.lokasi, g.tanggal_kegiatan, g.dibuat_pada`;
const GABUNG = `FROM galeri g LEFT JOIN wilayah w ON w.id = g.wilayah_id`;

/** Daftar galeri publik: filter kategori & rentang tanggal, terbaru dulu. */
export async function ambilGaleri({ kategori = null, dari = null, sampai = null, halaman = 1, perHalaman = 12 } = {}) {
  const per = Math.max(1, Math.min(60, Number(perHalaman) || 12));
  const hal = Math.max(1, Number(halaman) || 1);
  const syarat = [];
  const params = [];
  if (kategori) { syarat.push(`g.kategori = ?`); params.push(kategori); }
  if (dari) { syarat.push(`g.tanggal_kegiatan >= ?`); params.push(dari); }
  if (sampai) { syarat.push(`g.tanggal_kegiatan <= ?`); params.push(sampai); }
  const where = syarat.length ? `WHERE ${syarat.join(' AND ')}` : '';
  const [totalBaris, baris] = await Promise.all([
    kueri(`SELECT COUNT(*) AS jumlah ${GABUNG} ${where}`, params),
    kueri(`SELECT ${KOLOM} ${GABUNG} ${where} ORDER BY g.tanggal_kegiatan DESC, g.id DESC LIMIT ? OFFSET ?`, [...params, per, (hal - 1) * per]),
  ]);
  const total = Number(totalBaris[0].jumlah);
  return { baris, total, halaman: hal, perHalaman: per, totalHalaman: Math.max(1, Math.ceil(total / per)) };
}

export async function ambilGaleriById(id) {
  const baris = await kueri(`SELECT ${KOLOM} ${GABUNG} WHERE g.id = ? LIMIT 1`, [Number(id)]);
  return baris[0] ?? null;
}

export async function buatGaleri({ judul, deskripsi = null, jenis = 'foto', berkas, thumbnail = null, kategori, wilayahId = null, lokasi = null, tanggalKegiatan = null }) {
  const hasil = await kueri(
    `INSERT INTO galeri (judul, deskripsi, jenis, berkas, thumbnail, kategori, wilayah_id, lokasi, tanggal_kegiatan, dibuat_pada)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [judul, deskripsi, jenis, berkas, thumbnail, kategori, wilayahId, lokasi, tanggalKegiatan, waktuSekarang()],
  );
  return hasil.insertId;
}

export async function perbaruiGaleri(id, { judul, deskripsi = null, jenis = 'foto', berkas, thumbnail = null, kategori, wilayahId = null, lokasi = null, tanggalKegiatan = null }) {
  const hasil = await kueri(
    `UPDATE galeri SET judul = ?, deskripsi = ?, jenis = ?, berkas = ?, thumbnail = ?, kategori = ?, wilayah_id = ?, lokasi = ?, tanggal_kegiatan = ? WHERE id = ?`,
    [judul, deskripsi, jenis, berkas, thumbnail, kategori, wilayahId, lokasi, tanggalKegiatan, Number(id)],
  );
  return hasil.affectedRows;
}

export async function hapusGaleri(id) {
  const hasil = await kueri(`DELETE FROM galeri WHERE id = ?`, [Number(id)]);
  return hasil.affectedRows;
}

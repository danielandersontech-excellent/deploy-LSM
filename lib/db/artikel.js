// lib/db/artikel.js — seluruh SQL artikel, kategori_artikel, tag, artikel_tag.
// Penyaringan wilayah dan kepemilikan dilakukan di klausa WHERE (SQL), bukan di JavaScript.
import { kueri, transaksi } from './index.js';
import { waktuSekarang, buatSlug } from '../utils.js';

const KOLOM_DAFTAR = `a.id, a.judul, a.slug, a.ringkasan, a.gambar_utama, a.status, a.jumlah_dibaca,
  a.terbit_pada, a.dibuat_pada, a.diperbarui_pada,
  k.id AS kategori_id, k.nama AS kategori_nama, k.slug AS kategori_slug,
  u.id AS penulis_id, u.nama AS penulis_nama,
  w.id AS wilayah_id, w.nama AS wilayah_nama`;
const GABUNG = `FROM artikel a
  JOIN kategori_artikel k ON k.id = a.kategori_id
  JOIN users u ON u.id = a.penulis_id
  LEFT JOIN wilayah w ON w.id = a.wilayah_id`;

function batasHalaman(halaman, perHalaman) {
  const per = Math.max(1, Math.min(50, Number(perHalaman) || 9));
  const hal = Math.max(1, Number(halaman) || 1);
  return { per, hal, offset: (hal - 1) * per };
}

// ------------------------------------------------------------------ publik

/** Daftar artikel TERBIT untuk publik; filter kategori (slug) dan kata kunci. */
export async function ambilArtikelTerbit({ halaman = 1, perHalaman = 9, kategoriSlug = null, q = null } = {}) {
  const { per, hal, offset } = batasHalaman(halaman, perHalaman);
  const syarat = [`a.status = 'terbit'`];
  const params = [];
  if (kategoriSlug) { syarat.push(`k.slug = ?`); params.push(kategoriSlug); }
  if (q) { syarat.push(`(a.judul LIKE ? OR a.ringkasan LIKE ?)`); params.push(`%${q}%`, `%${q}%`); }
  const where = `WHERE ${syarat.join(' AND ')}`;
  const [totalBaris, baris] = await Promise.all([
    kueri(`SELECT COUNT(*) AS jumlah ${GABUNG} ${where}`, params),
    kueri(`SELECT ${KOLOM_DAFTAR} ${GABUNG} ${where} ORDER BY a.terbit_pada DESC, a.id DESC LIMIT ? OFFSET ?`, [...params, per, offset]),
  ]);
  const total = Number(totalBaris[0].jumlah);
  return { baris, total, halaman: hal, perHalaman: per, totalHalaman: Math.max(1, Math.ceil(total / per)) };
}

/** Detail artikel berdasarkan slug. hanyaTerbit=true untuk publik. */
export async function ambilArtikelBySlug(slug, { hanyaTerbit = true } = {}) {
  const baris = await kueri(
    `SELECT ${KOLOM_DAFTAR}, a.isi ${GABUNG} WHERE a.slug = ? ${hanyaTerbit ? `AND a.status = 'terbit'` : ''} LIMIT 1`,
    [String(slug)],
  );
  return baris[0] ?? null;
}

/** Artikel terbit lain dalam kategori yang sama (bagian "Artikel Terkait"). */
export async function ambilArtikelTerkait(artikelId, kategoriId, batas = 3) {
  return kueri(
    `SELECT ${KOLOM_DAFTAR} ${GABUNG}
     WHERE a.status = 'terbit' AND a.kategori_id = ? AND a.id <> ?
     ORDER BY a.terbit_pada DESC LIMIT ?`,
    [Number(kategoriId), Number(artikelId), Math.max(1, Math.min(10, Number(batas) || 3))],
  );
}

/** Artikel terbit terbaru (sorotan beranda). */
export async function ambilArtikelSorotan(batas = 3) {
  return kueri(
    `SELECT ${KOLOM_DAFTAR} ${GABUNG} WHERE a.status = 'terbit' ORDER BY a.terbit_pada DESC, a.id DESC LIMIT ?`,
    [Math.max(1, Math.min(10, Number(batas) || 3))],
  );
}

export async function naikkanJumlahDibaca(id) {
  await kueri(`UPDATE artikel SET jumlah_dibaca = jumlah_dibaca + 1 WHERE id = ?`, [Number(id)]);
}

export async function ambilKategoriArtikel() {
  return kueri(`SELECT id, nama, slug, deskripsi, urutan FROM kategori_artikel ORDER BY urutan, nama`);
}

export async function ambilTagArtikel(artikelId) {
  return kueri(
    `SELECT t.id, t.nama, t.slug FROM tag t JOIN artikel_tag at ON at.tag_id = t.id WHERE at.artikel_id = ? ORDER BY t.nama`,
    [Number(artikelId)],
  );
}

// ------------------------------------------------------------------ staf

/**
 * Daftar artikel untuk ruang staf. Pembatasan menurut peran ada di SQL:
 *  - penulis          : hanya miliknya (a.penulis_id = userId)
 *  - pimpinan_wilayah : hanya wilayahnya (a.wilayah_id = wilayahId)
 *  - redaktur/superadmin: semua
 */
export async function ambilArtikelStaf({ peran, userId, wilayahId = null, status = null, q = null, halaman = 1, perHalaman = 10 }) {
  const { per, hal, offset } = batasHalaman(halaman, perHalaman);
  const syarat = [];
  const params = [];
  if (peran === 'penulis') { syarat.push(`a.penulis_id = ?`); params.push(Number(userId)); }
  if (peran === 'pimpinan_wilayah') { syarat.push(`a.wilayah_id = ?`); params.push(wilayahId == null ? -1 : Number(wilayahId)); }
  if (status) { syarat.push(`a.status = ?`); params.push(status); }
  if (q) { syarat.push(`a.judul LIKE ?`); params.push(`%${q}%`); }
  const where = syarat.length ? `WHERE ${syarat.join(' AND ')}` : '';
  const [totalBaris, baris] = await Promise.all([
    kueri(`SELECT COUNT(*) AS jumlah ${GABUNG} ${where}`, params),
    kueri(`SELECT ${KOLOM_DAFTAR} ${GABUNG} ${where} ORDER BY a.diperbarui_pada DESC, a.id DESC LIMIT ? OFFSET ?`, [...params, per, offset]),
  ]);
  const total = Number(totalBaris[0].jumlah);
  return { baris, total, halaman: hal, perHalaman: per, totalHalaman: Math.max(1, Math.ceil(total / per)) };
}

export async function ambilArtikelById(id) {
  const baris = await kueri(`SELECT ${KOLOM_DAFTAR}, a.isi ${GABUNG} WHERE a.id = ? LIMIT 1`, [Number(id)]);
  return baris[0] ?? null;
}

/** Slug unik: tambah akhiran -2, -3, … bila sudah dipakai artikel lain. */
async function slugUnik(dasar, kecualiId = null, koneksi = null) {
  let kandidat = dasar || 'artikel';
  for (let i = 2; i < 1000; i++) {
    const ada = await kueri(`SELECT id FROM artikel WHERE slug = ? AND id <> ? LIMIT 1`, [kandidat, kecualiId == null ? -1 : Number(kecualiId)], koneksi);
    if (ada.length === 0) return kandidat;
    kandidat = `${dasar}-${i}`;
  }
  throw new Error('Tidak dapat membuat slug unik');
}

async function simpanTag(artikelId, daftarTag, koneksi) {
  await kueri(`DELETE FROM artikel_tag WHERE artikel_id = ?`, [Number(artikelId)], koneksi);
  for (const nama of daftarTag) {
    const bersih = String(nama).trim();
    if (!bersih) continue;
    const slug = buatSlug(bersih, 60);
    await kueri(`INSERT IGNORE INTO tag (nama, slug) VALUES (?, ?)`, [bersih, slug], koneksi);
    const t = await kueri(`SELECT id FROM tag WHERE slug = ? LIMIT 1`, [slug], koneksi);
    if (t[0]) await kueri(`INSERT IGNORE INTO artikel_tag (artikel_id, tag_id) VALUES (?, ?)`, [Number(artikelId), t[0].id], koneksi);
  }
}

/** Membuat artikel (status awal draf). Mengembalikan id. Aturan 7: kategori wajib. */
export async function buatArtikel({ judul, ringkasan = null, isi, gambarUtama = null, kategoriId, penulisId, wilayahId = null, tag = [] }) {
  return transaksi(async (koneksi) => {
    const sekarang = waktuSekarang();
    const slug = await slugUnik(buatSlug(judul), null, koneksi);
    const hasil = await kueri(
      `INSERT INTO artikel (judul, slug, ringkasan, isi, gambar_utama, kategori_id, penulis_id, wilayah_id, status, jumlah_dibaca, terbit_pada, dibuat_pada, diperbarui_pada)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draf', 0, NULL, ?, ?)`,
      [judul, slug, ringkasan, isi, gambarUtama, Number(kategoriId), Number(penulisId), wilayahId, sekarang, sekarang],
      koneksi,
    );
    if (tag.length) await simpanTag(hasil.insertId, tag, koneksi);
    return hasil.insertId;
  });
}

/** Memperbarui isi artikel (tidak menyentuh status — lihat terbitkanArtikel/arsipkanArtikel). */
export async function perbaruiArtikel(id, { judul, ringkasan = null, isi, gambarUtama = null, kategoriId, wilayahId = null, tag = null }) {
  return transaksi(async (koneksi) => {
    const slug = await slugUnik(buatSlug(judul), id, koneksi);
    const hasil = await kueri(
      `UPDATE artikel SET judul = ?, slug = ?, ringkasan = ?, isi = ?, gambar_utama = ?, kategori_id = ?, wilayah_id = ?, diperbarui_pada = ?
       WHERE id = ?`,
      [judul, slug, ringkasan, isi, gambarUtama, Number(kategoriId), wilayahId, waktuSekarang(), Number(id)],
      koneksi,
    );
    if (Array.isArray(tag)) await simpanTag(id, tag, koneksi);
    return hasil.affectedRows;
  });
}

/** Menerbitkan: status -> terbit, terbit_pada diisi (hanya bila belum pernah terbit). */
export async function terbitkanArtikel(id) {
  const sekarang = waktuSekarang();
  const hasil = await kueri(
    `UPDATE artikel SET status = 'terbit', terbit_pada = COALESCE(terbit_pada, ?), diperbarui_pada = ? WHERE id = ?`,
    [sekarang, sekarang, Number(id)],
  );
  return hasil.affectedRows;
}

export async function arsipkanArtikel(id) {
  const hasil = await kueri(`UPDATE artikel SET status = 'arsip', diperbarui_pada = ? WHERE id = ?`, [waktuSekarang(), Number(id)]);
  return hasil.affectedRows;
}

export async function kembalikanKeDraf(id) {
  const hasil = await kueri(`UPDATE artikel SET status = 'draf', diperbarui_pada = ? WHERE id = ?`, [waktuSekarang(), Number(id)]);
  return hasil.affectedRows;
}

export async function hapusArtikel(id) {
  const hasil = await kueri(`DELETE FROM artikel WHERE id = ?`, [Number(id)]);
  return hasil.affectedRows;
}

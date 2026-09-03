// lib/db/program.js — seluruh SQL tabel program.
import { kueri } from './index.js';
import { waktuSekarang, buatSlug } from '../utils.js';

const KOLOM = `p.id, p.judul, p.slug, p.ringkasan, p.isi, p.gambar, p.kategori, p.status, p.wilayah_id, w.nama AS wilayah_nama,
  p.mulai_pada, p.selesai_pada, p.dibuat_pada`;
const GABUNG = `FROM program p LEFT JOIN wilayah w ON w.id = p.wilayah_id`;

/** Daftar program publik: filter kategori & status, urut terbaru/terlama. */
export async function ambilProgram({ kategori = null, status = null, urut = 'terbaru', halaman = 1, perHalaman = 9 } = {}) {
  const per = Math.max(1, Math.min(50, Number(perHalaman) || 9));
  const hal = Math.max(1, Number(halaman) || 1);
  const syarat = [];
  const params = [];
  if (kategori) { syarat.push(`p.kategori = ?`); params.push(kategori); }
  if (status) { syarat.push(`p.status = ?`); params.push(status); }
  const where = syarat.length ? `WHERE ${syarat.join(' AND ')}` : '';
  const arah = urut === 'terlama' ? 'ASC' : 'DESC';
  const [totalBaris, baris] = await Promise.all([
    kueri(`SELECT COUNT(*) AS jumlah ${GABUNG} ${where}`, params),
    kueri(`SELECT ${KOLOM} ${GABUNG} ${where} ORDER BY p.mulai_pada ${arah}, p.id ${arah} LIMIT ? OFFSET ?`, [...params, per, (hal - 1) * per]),
  ]);
  const total = Number(totalBaris[0].jumlah);
  return { baris, total, halaman: hal, perHalaman: per, totalHalaman: Math.max(1, Math.ceil(total / per)) };
}

export async function ambilProgramBySlug(slug) {
  const baris = await kueri(`SELECT ${KOLOM} ${GABUNG} WHERE p.slug = ? LIMIT 1`, [String(slug)]);
  return baris[0] ?? null;
}

export async function ambilProgramById(id) {
  const baris = await kueri(`SELECT ${KOLOM} ${GABUNG} WHERE p.id = ? LIMIT 1`, [Number(id)]);
  return baris[0] ?? null;
}

async function slugUnik(dasar, kecualiId = null) {
  let kandidat = dasar || 'program';
  for (let i = 2; i < 1000; i++) {
    const ada = await kueri(`SELECT id FROM program WHERE slug = ? AND id <> ? LIMIT 1`, [kandidat, kecualiId == null ? -1 : Number(kecualiId)]);
    if (ada.length === 0) return kandidat;
    kandidat = `${dasar}-${i}`;
  }
  throw new Error('Tidak dapat membuat slug unik');
}

export async function buatProgram({ judul, ringkasan = null, isi = null, gambar = null, kategori, status = 'berjalan', wilayahId = null, mulaiPada = null, selesaiPada = null }) {
  const slug = await slugUnik(buatSlug(judul));
  const hasil = await kueri(
    `INSERT INTO program (judul, slug, ringkasan, isi, gambar, kategori, status, wilayah_id, mulai_pada, selesai_pada, dibuat_pada)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [judul, slug, ringkasan, isi, gambar, kategori, status, wilayahId, mulaiPada, selesaiPada, waktuSekarang()],
  );
  return hasil.insertId;
}

export async function perbaruiProgram(id, { judul, ringkasan = null, isi = null, gambar = null, kategori, status = 'berjalan', wilayahId = null, mulaiPada = null, selesaiPada = null }) {
  const slug = await slugUnik(buatSlug(judul), id);
  const hasil = await kueri(
    `UPDATE program SET judul = ?, slug = ?, ringkasan = ?, isi = ?, gambar = ?, kategori = ?, status = ?, wilayah_id = ?, mulai_pada = ?, selesai_pada = ? WHERE id = ?`,
    [judul, slug, ringkasan, isi, gambar, kategori, status, wilayahId, mulaiPada, selesaiPada, Number(id)],
  );
  return hasil.affectedRows;
}

export async function hapusProgram(id) {
  const hasil = await kueri(`DELETE FROM program WHERE id = ?`, [Number(id)]);
  return hasil.affectedRows;
}

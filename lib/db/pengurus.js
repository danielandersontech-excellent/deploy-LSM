// lib/db/pengurus.js — seluruh SQL tabel pengurus.
import { kueri, transaksi } from './index.js';

/** Simpan urutan tampil (Tahap 7): daftar id berurutan -> urutan 1..n dalam satu transaksi. */
export async function simpanUrutanPengurus(daftarId) {
  return transaksi(async (koneksi) => {
    let n = 0;
    for (const id of daftarId) {
      n += 1;
      await kueri(`UPDATE pengurus SET urutan = ? WHERE id = ?`, [n, Number(id)], koneksi);
    }
    return n;
  });
}

const KOLOM = `p.id, p.nama, p.jabatan, p.tingkat, p.kelompok, p.wilayah_id, w.nama AS wilayah_nama, p.foto, p.deskripsi,
  p.aktif_sejak, p.urutan, p.aktif`;
const GABUNG = `FROM pengurus p LEFT JOIN wilayah w ON w.id = p.wilayah_id`;

/** Untuk halaman publik Struktur: hanya yang aktif, urut tingkat lalu urutan. */
export async function ambilPengurusAktif(tingkat = null) {
  if (tingkat) return kueri(`SELECT ${KOLOM} ${GABUNG} WHERE p.aktif = 1 AND p.tingkat = ? ORDER BY p.urutan, p.nama`, [tingkat]);
  return kueri(`SELECT ${KOLOM} ${GABUNG} WHERE p.aktif = 1 ORDER BY FIELD(p.tingkat, 'pusat', 'wilayah'), p.urutan, p.nama`);
}

export async function ambilSemuaPengurus() {
  return kueri(`SELECT ${KOLOM} ${GABUNG} ORDER BY FIELD(p.tingkat, 'pusat', 'wilayah'), p.urutan, p.nama`);
}

export async function ambilPengurus(id) {
  const baris = await kueri(`SELECT ${KOLOM} ${GABUNG} WHERE p.id = ? LIMIT 1`, [Number(id)]);
  return baris[0] ?? null;
}

export async function buatPengurus({ nama, jabatan, tingkat, kelompok = null, wilayahId = null, foto = null, deskripsi = null, aktifSejak = null, urutan = 0, aktif = 1 }) {
  const hasil = await kueri(
    `INSERT INTO pengurus (nama, jabatan, tingkat, kelompok, wilayah_id, foto, deskripsi, aktif_sejak, urutan, aktif) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nama, jabatan, tingkat, kelompok, wilayahId, foto, deskripsi, aktifSejak, Number(urutan) || 0, aktif ? 1 : 0],
  );
  return hasil.insertId;
}

export async function perbaruiPengurus(id, { nama, jabatan, tingkat, kelompok = null, wilayahId = null, foto = null, deskripsi = null, aktifSejak = null, urutan = 0, aktif = 1 }) {
  const hasil = await kueri(
    `UPDATE pengurus SET nama = ?, jabatan = ?, tingkat = ?, kelompok = ?, wilayah_id = ?, foto = ?, deskripsi = ?, aktif_sejak = ?, urutan = ?, aktif = ? WHERE id = ?`,
    [nama, jabatan, tingkat, kelompok, wilayahId, foto, deskripsi, aktifSejak, Number(urutan) || 0, aktif ? 1 : 0, Number(id)],
  );
  return hasil.affectedRows;
}

export async function hapusPengurus(id) {
  const hasil = await kueri(`DELETE FROM pengurus WHERE id = ?`, [Number(id)]);
  return hasil.affectedRows;
}

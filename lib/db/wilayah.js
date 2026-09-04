// lib/db/wilayah.js — seluruh SQL tabel wilayah.
import { kueri } from './index.js';

/** Daftar provinsi (untuk <select> wilayah di formulir). */
export async function ambilProvinsi() {
  return kueri(`SELECT id, nama, kode FROM wilayah WHERE jenis = 'provinsi' ORDER BY nama`);
}

/**
 * RUN QA-3 A3: daftar kabupaten/kota beserta provinsi induknya, untuk <select> Koordinator Daerah
 * yang dikelompokkan per provinsi (<optgroup>).
 */
export async function ambilKabupatenKota() {
  return kueri(
    `SELECT w.id, w.nama, w.induk_id, p.nama AS provinsi_nama
       FROM wilayah w
       JOIN wilayah p ON p.id = w.induk_id
      WHERE w.jenis = 'kabupaten_kota'
      ORDER BY p.nama, w.nama`,
  );
}

/** Satu baris wilayah (dipakai route pengurus untuk memastikan jenis wilayah cocok dengan kelompok). */
export async function ambilWilayah(id) {
  const baris = await kueri(`SELECT id, nama, jenis, induk_id FROM wilayah WHERE id = ? LIMIT 1`, [Number(id)]);
  return baris[0] ?? null;
}

export async function ambilWilayahByKode(kode) {
  const baris = await kueri(`SELECT id, nama, jenis, induk_id, kode FROM wilayah WHERE kode = ? LIMIT 1`, [String(kode)]);
  return baris[0] ?? null;
}

// lib/db/wilayah.js — seluruh SQL tabel wilayah.
import { kueri } from './index.js';

/** Daftar provinsi (untuk <select> wilayah di formulir). */
export async function ambilProvinsi() {
  return kueri(`SELECT id, nama, kode FROM wilayah WHERE jenis = 'provinsi' ORDER BY nama`);
}

export async function ambilWilayahByKode(kode) {
  const baris = await kueri(`SELECT id, nama, jenis, induk_id, kode FROM wilayah WHERE kode = ? LIMIT 1`, [String(kode)]);
  return baris[0] ?? null;
}

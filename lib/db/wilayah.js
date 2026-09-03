// lib/db/wilayah.js — seluruh SQL tabel wilayah.
import { kueri } from './index.js';

export async function ambilSemuaWilayah(jenis = null) {
  if (jenis) {
    return kueri(`SELECT id, nama, jenis, induk_id, kode FROM wilayah WHERE jenis = ? ORDER BY kode, nama`, [jenis]);
  }
  return kueri(`SELECT id, nama, jenis, induk_id, kode FROM wilayah ORDER BY jenis, kode, nama`);
}

/** Daftar provinsi (untuk <select> wilayah di formulir). */
export async function ambilProvinsi() {
  return kueri(`SELECT id, nama, kode FROM wilayah WHERE jenis = 'provinsi' ORDER BY nama`);
}

export async function ambilWilayah(id) {
  const baris = await kueri(`SELECT id, nama, jenis, induk_id, kode FROM wilayah WHERE id = ? LIMIT 1`, [Number(id)]);
  return baris[0] ?? null;
}

export async function ambilWilayahByKode(kode) {
  const baris = await kueri(`SELECT id, nama, jenis, induk_id, kode FROM wilayah WHERE kode = ? LIMIT 1`, [String(kode)]);
  return baris[0] ?? null;
}

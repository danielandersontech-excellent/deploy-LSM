// lib/validasi/wilayahPengurus.js — RUN QA-3 A3: penjaga jenis wilayah untuk kelompok pengurus.
// Dipisah dari lib/validasi/konten.js karena butuh basis data (konten.js sengaja murni/sinkron).
import { GalatHttp } from '../auth/penjaga.js';
import { ambilWilayah } from '../db/wilayah.js';
import { jenisWilayahKelompok } from '../kelompokPengurus.js';

/**
 * QA-3 A3: memastikan JENIS wilayah cocok dengan kelompok (DPW -> provinsi, Koordinator Daerah ->
 * kabupaten/kota). Pemeriksaan ini butuh basis data sehingga tidak bisa dilakukan di lib/validasi.
 */
export async function periksaWilayahKelompok(m) {
  const jenisDiharap = jenisWilayahKelompok(m.kelompok);
  if (!jenisDiharap || !m.wilayahId) return;
  const w = await ambilWilayah(m.wilayahId);
  if (!w) throw new GalatHttp(422, 'Wilayah tidak ditemukan', 'WILAYAH_TIDAK_SAH');
  if (w.jenis !== jenisDiharap) {
    throw new GalatHttp(422, jenisDiharap === 'provinsi' ? 'DPW harus memilih PROVINSI' : 'Koordinator Daerah harus memilih KABUPATEN/KOTA', 'WILAYAH_JENIS_TIDAK_COCOK');
  }
}

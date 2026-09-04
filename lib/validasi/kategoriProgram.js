// lib/validasi/kategoriProgram.js — RUN QA-3 F: penjaga kategori program di sisi route (butuh basis data).
// Menerima `kategori` (slug yang sudah ada) ATAU `kategori_baru` (nama kategori yang diketik pemilik
// lewat pilihan "Kategori Lainnya..."). Nama baru divalidasi wajar, di-slug otomatis, dan tidak boleh
// menghasilkan duplikat: bila slugnya sudah ada, kategori yang ada itulah yang dipakai.
import { GalatHttp } from '../auth/penjaga.js';
import { ambilKategoriProgramBySlug, pastikanKategoriProgram, slugKategoriProgram } from '../db/kategoriProgram.js';

const NAMA_MIN = 3;
const NAMA_MAKS = 60;

/**
 * @returns {{slug: string, baru: boolean, nama: string}} kategori yang harus dipakai baris program.
 */
export async function tentukanKategoriProgram(body, kategoriTervalidasi) {
  const namaBaru = String(body?.kategori_baru ?? body?.kategoriBaru ?? '').replace(/\s+/g, ' ').trim();
  if (namaBaru) {
    if (namaBaru.length < NAMA_MIN) throw new GalatHttp(422, `Nama kategori baru minimal ${NAMA_MIN} karakter`, 'KATEGORI_BARU_PENDEK');
    if (namaBaru.length > NAMA_MAKS) throw new GalatHttp(422, `Nama kategori baru maksimal ${NAMA_MAKS} karakter`, 'KATEGORI_BARU_PANJANG');
    if (/<[a-z/!][^>]*>/i.test(namaBaru)) throw new GalatHttp(422, 'Nama kategori tidak boleh memuat tag HTML', 'KATEGORI_BARU_HTML');
    if (!/[A-Za-z]/.test(namaBaru)) throw new GalatHttp(422, 'Nama kategori harus memuat huruf', 'KATEGORI_BARU_TIDAK_WAJAR');
    if (!slugKategoriProgram(namaBaru)) throw new GalatHttp(422, 'Nama kategori tidak menghasilkan slug yang sah', 'KATEGORI_BARU_TIDAK_WAJAR');
    const { baris, baru } = await pastikanKategoriProgram(namaBaru);
    return { slug: baris.slug, baru, nama: baris.nama };
  }
  const ada = await ambilKategoriProgramBySlug(kategoriTervalidasi);
  if (!ada) throw new GalatHttp(422, 'Kategori program wajib dipilih dari daftar', 'KATEGORI_TIDAK_SAH');
  return { slug: ada.slug, baru: false, nama: ada.nama };
}

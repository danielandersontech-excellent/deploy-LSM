// lib/validasi/kategoriArtikel.js — RUN QA-4 A: penjaga kategori artikel di sisi route (butuh basis data).
// Kategori harus ADA dan AKTIF. Sebelumnya id yang tidak ada baru gagal di kunci asing (galat 500 tanpa
// pesan), dan kategori nonaktif (kategori lama yang dipensiunkan) masih bisa dipilih lewat API.
import { GalatHttp } from '../auth/penjaga.js';
import { ambilKategoriArtikelById } from '../db/artikel.js';

export async function pastikanKategoriArtikelAktif(kategoriId) {
  const k = await ambilKategoriArtikelById(kategoriId);
  if (!k) throw new GalatHttp(422, 'Kategori tidak ditemukan', 'KATEGORI_TIDAK_SAH');
  if (Number(k.aktif) !== 1) throw new GalatHttp(422, `Kategori "${k.nama}" sudah tidak dipakai; pilih kategori yang aktif`, 'KATEGORI_NONAKTIF');
  return k;
}

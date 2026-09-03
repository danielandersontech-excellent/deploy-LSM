// lib/validasi/artikel.js — validasi muatan artikel DI SERVER (bukan hanya peramban).
// Dipakai POST /api/staf/artikel dan PATCH /api/staf/artikel/[id].
// Aturan 7: kategori WAJIB (ditegakkan di sini, sebelum SQL). Isi disanitasi lewat lib/sanitasi.js.
import { sanitasiIsiArtikel, teksPolos } from '../sanitasi.js';

export const BATAS = Object.freeze({ judul: 255, ringkasan: 600, isi: 500_000, tag: 10, panjangTag: 40, gambar: 255 });

export class GalatValidasi extends Error {
  constructor(pesan, kode = 'VALIDASI', bidang = null) { super(pesan); this.kode = kode; this.bidang = bidang; this.status = 422; }
}

function teks(nilai, maks) {
  if (nilai == null) return '';
  return String(nilai).trim().slice(0, maks);
}

/**
 * Memvalidasi dan menormalkan muatan artikel dari JSON body.
 * @returns {{judul, ringkasan, isi, gambarUtama, kategoriId, wilayahId, tag}}
 */
export function validasiMuatanArtikel(body) {
  if (!body || typeof body !== 'object') throw new GalatValidasi('Muatan harus JSON', 'MUATAN_TIDAK_SAH');
  const judul = teks(body.judul, BATAS.judul);
  if (judul.length < 5) throw new GalatValidasi('Judul wajib diisi (minimal 5 karakter)', 'JUDUL_WAJIB', 'judul');

  const kategoriId = Number(body.kategori_id ?? body.kategoriId);
  if (!Number.isInteger(kategoriId) || kategoriId <= 0) throw new GalatValidasi('Kategori wajib dipilih (aturan 7: tidak ada artikel tanpa kategori)', 'KATEGORI_WAJIB', 'kategori_id');

  const wilayahMentah = body.wilayah_id ?? body.wilayahId;
  let wilayahId = null;
  if (wilayahMentah !== null && wilayahMentah !== undefined && wilayahMentah !== '') {
    wilayahId = Number(wilayahMentah);
    if (!Number.isInteger(wilayahId) || wilayahId <= 0) throw new GalatValidasi('Wilayah tidak sah', 'WILAYAH_TIDAK_SAH', 'wilayah_id');
  }

  const isiMentah = String(body.isi ?? '');
  if (isiMentah.length > BATAS.isi) throw new GalatValidasi('Isi artikel terlalu panjang', 'ISI_TERLALU_PANJANG', 'isi');
  const isi = sanitasiIsiArtikel(isiMentah);            // SANITASI DI SERVER, SEBELUM DISIMPAN
  if (teksPolos(isi, 50).length < 10) throw new GalatValidasi('Isi artikel wajib diisi (minimal 10 karakter teks)', 'ISI_WAJIB', 'isi');

  let ringkasan = teks(body.ringkasan, BATAS.ringkasan);
  if (!ringkasan) ringkasan = teksPolos(isi, 200);
  ringkasan = ringkasan.replace(/<[^>]+>/g, '');           // ringkasan selalu teks polos

  let gambarUtama = teks(body.gambar_utama ?? body.gambarUtama, BATAS.gambar) || null;
  // Gambar utama hanya jalur lokal (unggahan/penampung) atau https — bukan javascript:/data:
  if (gambarUtama && !(gambarUtama.startsWith('/') || /^https:\/\//i.test(gambarUtama))) {
    throw new GalatValidasi('Gambar utama harus jalur unggahan atau URL https', 'GAMBAR_TIDAK_SAH', 'gambar_utama');
  }

  let tag = [];
  if (Array.isArray(body.tag)) tag = body.tag;
  else if (typeof body.tag === 'string') tag = body.tag.split(',');
  tag = [...new Set(tag.map((t) => teks(t, BATAS.panjangTag)).filter(Boolean))].slice(0, BATAS.tag);

  return { judul, ringkasan, isi, gambarUtama, kategoriId, wilayahId, tag };
}

// lib/validasi/konten.js — validasi DI SERVER untuk pengurus, program, galeri (Tahap 7, REFERENSI 10).
// Dipakai route /api/staf/{pengurus,program,galeri}. Masukan divalidasi di server, bukan hanya peramban.
import { kategoriProgramValid, STATUS_PROGRAM } from '../kategoriProgram.js';
import { kategoriGaleriValid } from '../kategoriGaleri.js';

export class GalatValidasiKonten extends Error {
  constructor(pesan, kode = 'VALIDASI', bidang = null) { super(pesan); this.kode = kode; this.bidang = bidang; this.status = 422; }
}

const teks = (v, maks) => (v == null ? '' : String(v).trim().slice(0, maks));
const teksPanjang = (v, maks) => (v == null ? '' : String(v).replace(/\r\n/g, '\n').trim().slice(0, maks));
function idOpsional(v, bidang, label) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new GalatValidasiKonten(`${label} tidak sah`, 'ID_TIDAK_SAH', bidang);
  return n;
}
function jalurGambar(v, bidang) {
  const j = teks(v, 255);
  if (!j) return null;
  if (!(j.startsWith('/') || /^https:\/\//i.test(j))) throw new GalatValidasiKonten('Jalur gambar harus jalur unggahan atau URL https', 'GAMBAR_TIDAK_SAH', bidang);
  return j;
}
function tanggal(v, bidang, label) {
  const t = teks(v, 10);
  if (!t) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t) || Number.isNaN(Date.parse(`${t}T00:00:00Z`))) throw new GalatValidasiKonten(`${label} harus berformat YYYY-MM-DD`, 'TANGGAL_TIDAK_SAH', bidang);
  return t;
}
const benar = (v) => v === true || v === 1 || v === '1' || v === 'true' || v === 'on';

/** pengurus: nama, jabatan, tingkat, wilayah_id, foto, deskripsi, aktif_sejak (tahun), urutan, aktif */
export function validasiPengurus(body) {
  if (!body || typeof body !== 'object') throw new GalatValidasiKonten('Muatan harus JSON', 'MUATAN_TIDAK_SAH');
  const nama = teks(body.nama, 150);
  if (nama.length < 3) throw new GalatValidasiKonten('Nama wajib diisi (minimal 3 karakter)', 'NAMA_WAJIB', 'nama');
  const jabatan = teks(body.jabatan, 150);
  if (jabatan.length < 2) throw new GalatValidasiKonten('Jabatan wajib diisi', 'JABATAN_WAJIB', 'jabatan');
  const tingkat = teks(body.tingkat, 10);
  if (!['pusat', 'wilayah'].includes(tingkat)) throw new GalatValidasiKonten("Tingkat harus 'pusat' atau 'wilayah'", 'TINGKAT_TIDAK_SAH', 'tingkat');
  const wilayahId = idOpsional(body.wilayah_id ?? body.wilayahId, 'wilayah_id', 'Wilayah');
  if (tingkat === 'wilayah' && !wilayahId) throw new GalatValidasiKonten('Pengurus tingkat wilayah wajib memilih wilayah', 'WILAYAH_WAJIB', 'wilayah_id');
  let aktifSejak = null;
  const as = body.aktif_sejak ?? body.aktifSejak;
  if (as !== null && as !== undefined && as !== '') {
    aktifSejak = Number(as);
    if (!Number.isInteger(aktifSejak) || aktifSejak < 1900 || aktifSejak > 2100) throw new GalatValidasiKonten('Aktif sejak harus tahun (mis. 2021)', 'TAHUN_TIDAK_SAH', 'aktif_sejak');
  }
  const urutan = Math.max(0, Math.min(9999, Number(body.urutan) || 0));
  return {
    nama, jabatan, tingkat, wilayahId, foto: jalurGambar(body.foto, 'foto'), deskripsi: teksPanjang(body.deskripsi, 2000) || null,
    aktifSejak, urutan, aktif: body.aktif === undefined ? 1 : (benar(body.aktif) ? 1 : 0),
  };
}

/** program: judul, ringkasan, isi, gambar, kategori (lib/kategoriProgram), status, wilayah_id, mulai_pada, selesai_pada */
export function validasiProgram(body) {
  if (!body || typeof body !== 'object') throw new GalatValidasiKonten('Muatan harus JSON', 'MUATAN_TIDAK_SAH');
  const judul = teks(body.judul, 255);
  if (judul.length < 5) throw new GalatValidasiKonten('Judul wajib diisi (minimal 5 karakter)', 'JUDUL_WAJIB', 'judul');
  const kategori = teks(body.kategori, 50);
  if (!kategoriProgramValid(kategori)) throw new GalatValidasiKonten('Kategori program wajib dipilih dari daftar', 'KATEGORI_TIDAK_SAH', 'kategori');
  const status = teks(body.status, 20) || 'berjalan';
  if (!STATUS_PROGRAM.some((s) => s.slug === status)) throw new GalatValidasiKonten("Status harus 'berjalan' atau 'selesai'", 'STATUS_TIDAK_SAH', 'status');
  const mulaiPada = tanggal(body.mulai_pada ?? body.mulaiPada, 'mulai_pada', 'Tanggal mulai');
  const selesaiPada = tanggal(body.selesai_pada ?? body.selesaiPada, 'selesai_pada', 'Tanggal selesai');
  if (mulaiPada && selesaiPada && selesaiPada < mulaiPada) throw new GalatValidasiKonten('Tanggal selesai tidak boleh sebelum tanggal mulai', 'RENTANG_TIDAK_SAH', 'selesai_pada');
  return {
    judul, ringkasan: teksPanjang(body.ringkasan, 600) || null, isi: teksPanjang(body.isi, 20000) || null, gambar: jalurGambar(body.gambar, 'gambar'),
    kategori, status, wilayahId: idOpsional(body.wilayah_id ?? body.wilayahId, 'wilayah_id', 'Wilayah'), mulaiPada, selesaiPada,
  };
}

/** galeri: judul, deskripsi, jenis (foto/video), berkas, thumbnail, kategori (lib/kategoriGaleri), wilayah_id, lokasi, tanggal_kegiatan */
export function validasiGaleri(body, { berkasWajib = true } = {}) {
  if (!body || typeof body !== 'object') throw new GalatValidasiKonten('Muatan tidak sah', 'MUATAN_TIDAK_SAH');
  const judul = teks(body.judul, 255);
  if (judul.length < 3) throw new GalatValidasiKonten('Judul wajib diisi (minimal 3 karakter)', 'JUDUL_WAJIB', 'judul');
  const jenis = teks(body.jenis, 10) || 'foto';
  if (!['foto', 'video'].includes(jenis)) throw new GalatValidasiKonten("Jenis harus 'foto' atau 'video'", 'JENIS_TIDAK_SAH', 'jenis');
  const kategori = teks(body.kategori, 50);
  if (!kategoriGaleriValid(kategori)) throw new GalatValidasiKonten('Kategori galeri wajib dipilih dari daftar', 'KATEGORI_TIDAK_SAH', 'kategori');
  const berkas = jalurGambar(body.berkas, 'berkas');
  if (berkasWajib && !berkas) throw new GalatValidasiKonten('Berkas foto/video wajib diunggah', 'BERKAS_WAJIB', 'berkas');
  return {
    judul, deskripsi: teksPanjang(body.deskripsi, 2000) || null, jenis, berkas, thumbnail: jalurGambar(body.thumbnail, 'thumbnail'),
    kategori, wilayahId: idOpsional(body.wilayah_id ?? body.wilayahId, 'wilayah_id', 'Wilayah'), lokasi: teks(body.lokasi, 200) || null,
    tanggalKegiatan: tanggal(body.tanggal_kegiatan ?? body.tanggalKegiatan, 'tanggal_kegiatan', 'Tanggal kegiatan'),
  };
}

// lib/auth/hakAkses.js — MATRIKS PERAN, acuan tunggal (REFERENSI 11).
// Setiap route API dan layout membaca dari sini; jangan menulis daftar peran di tempat lain.

export const PERAN = Object.freeze(['superadmin', 'redaktur', 'penulis', 'verifikator', 'pimpinan_wilayah']);
export const SEMUA_PERAN = PERAN;

/**
 * Hak -> peran yang memilikinya.
 *   superadmin        : penuh
 *   redaktur          : artikel penuh (termasuk terbitkan), pengurus/program/galeri penuh
 *   penulis           : artikel miliknya sendiri, draf saja, tidak bisa menerbitkan
 *   verifikator       : pengaduan (lihat, proses, ubah status, catatan) + identitas pelapor
 *   pimpinan_wilayah  : baca-saja artikel & pengaduan WILAYAHNYA (tanpa identitas), baca-saja konten
 */
export const HAK = Object.freeze({
  // artikel
  artikel_lihat:      ['superadmin', 'redaktur', 'penulis', 'pimpinan_wilayah'],
  artikel_buat:       ['superadmin', 'redaktur', 'penulis'],
  artikel_sunting:    ['superadmin', 'redaktur', 'penulis'],   // penulis: hanya miliknya (diperiksa di route)
  artikel_hapus:      ['superadmin', 'redaktur'],
  artikel_terbitkan:  ['superadmin', 'redaktur'],
  // pengaduan
  pengaduan_lihat:        ['superadmin', 'verifikator', 'pimpinan_wilayah'],
  pengaduan_ubah_status:  ['superadmin', 'verifikator'],
  pengaduan_identitas:    ['superadmin', 'verifikator'],       // satu-satunya yang boleh melihat identitas pelapor
  // pengurus / program / galeri
  konten_lihat:   ['superadmin', 'redaktur', 'pimpinan_wilayah'],
  konten_kelola:  ['superadmin', 'redaktur'],
  // pengguna & pengaturan
  pengguna_kelola:   ['superadmin'],
  pengaturan_kelola: ['superadmin'],
  // lain-lain
  unggah:     ['superadmin', 'redaktur', 'penulis', 'verifikator'],
  statistik:  SEMUA_PERAN,
  ruang_staf: SEMUA_PERAN,
});

export function peranValid(peran) {
  return PERAN.includes(peran);
}

/** Apakah peran memiliki hak tertentu. */
export function bolehAkses(peran, hak) {
  const daftar = HAK[hak];
  if (!daftar) throw new Error(`Hak tidak dikenal: ${hak}`);
  return daftar.includes(peran);
}

/** Identitas pelapor: hanya superadmin dan verifikator. Dihitung dari PERAN, bukan dari permintaan. */
export function bolehLihatIdentitas(peran) {
  return HAK.pengaduan_identitas.includes(peran);
}

/**
 * Pembatasan wilayah untuk pimpinan_wilayah: mengembalikan wilayah_id yang WAJIB
 * diteruskan ke lib/db (disaring di SQL). Peran lain -> null (tidak dibatasi).
 * pimpinan_wilayah tanpa wilayah_id -> -1 (tidak melihat apa pun, bukan semuanya).
 */
export function wilayahTerbatas(pengguna) {
  if (pengguna?.peran !== 'pimpinan_wilayah') return null;
  return pengguna.wilayah_id == null ? -1 : Number(pengguna.wilayah_id);
}

/** Halaman awal yang berhak diakses suatu peran (untuk tautan "kembali" di halaman 403). */
export function halamanAwalPeran(peran) {
  return peranValid(peran) ? '/staf/dashboard' : '/login';
}

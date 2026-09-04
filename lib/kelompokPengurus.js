// lib/kelompokPengurus.js — SATU SUMBER susunan organisasi WARKOP NUSANTARA.
// Kolom `pengurus.kelompok` (migrasi 20260904-1500) dan `pengurus.bagian` (migrasi 20260905-0900).
//
// RUN QA-3 A1 (PERINTAH PEMILIK): susunan final di bawah ini. DIHAPUS dari sistem: `dpc`
// (Dewan Pimpinan Cabang) dan `direktorat_eksekutif`. Kelompok lama `dpd` dipetakan menjadi
// `korda` (Koordinator Daerah). Baris pengurus yang kelompoknya tidak ada di daftar ini
// DINONAKTIFKAN oleh migrasi (tidak dihapus) dan orangnya didaftarkan untuk ditempatkan ulang.
//
// Urutan array = urutan blok pada bagan /struktur DAN urutan baris kepala kelompok di
// Kelola Pengurus (RUN QA-3 B).
export const NAMA_BELUM_TERISI = '(Belum terisi)';

export const KELOMPOK_PENGURUS = Object.freeze([
  { slug: 'dewan_pembina',   label: 'Dewan Pembina',            tingkat: 'pusat',   tingkatLabel: 'Dewan Pimpinan Pusat', tahap: 'dewan',      ikon: 'verified_user' },
  { slug: 'dewan_penasehat', label: 'Dewan Penasehat',          tingkat: 'pusat',   tingkatLabel: 'Dewan Pimpinan Pusat', tahap: 'dewan',      ikon: 'verified_user' },
  { slug: 'dewan_pengawas',  label: 'Dewan Pengawas',           tingkat: 'pusat',   tingkatLabel: 'Dewan Pimpinan Pusat', tahap: 'dewan',      ikon: 'verified_user' },
  { slug: 'pengurus_dpp',    label: 'Pengurus DPP',             tingkat: 'pusat',   tingkatLabel: 'Dewan Pimpinan Pusat', tahap: 'pengurus',   ikon: 'gavel' },
  { slug: 'direktorat',      label: 'Direktorat',               tingkat: 'pusat',   tingkatLabel: 'Dewan Pimpinan Pusat', tahap: 'direktorat', ikon: 'account_circle', berbagian: true },
  { slug: 'satgas',          label: 'Satuan Tugas (Satgas)',    tingkat: 'pusat',   tingkatLabel: 'Dewan Pimpinan Pusat', tahap: 'satgas',     ikon: 'campaign' },
  { slug: 'dpw',             label: 'DPW',                      tingkat: 'wilayah', tingkatLabel: 'Dewan Pimpinan Wilayah (Provinsi)', tahap: 'wilayah', ikon: 'location_on', wilayahJenis: 'provinsi' },
  { slug: 'korda',           label: 'Koordinator Daerah',       tingkat: 'wilayah', tingkatLabel: 'Kabupaten/Kota, di bawah DPW',      tahap: 'wilayah', ikon: 'location_on', wilayahJenis: 'kabupaten_kota' },
]);

/**
 * RUN QA-3 A2: Direktorat terdiri atas 12 BAGIAN; satu bagian boleh berisi beberapa jabatan
 * (Direktur, Wakil Direktur, anggota). `jabatanBawaan` hanya usulan isian formulir, bukan paksaan.
 */
export const BAGIAN_DIREKTORAT = Object.freeze([
  { slug: 'hukum-advokasi',              label: 'Hukum dan Advokasi' },
  { slug: 'investigasi',                 label: 'Investigasi' },
  { slug: 'pengawasan-kebijakan-publik', label: 'Pengawasan Kebijakan Publik' },
  { slug: 'organisasi-kaderisasi',       label: 'Organisasi dan Kaderisasi' },
  { slug: 'sosial-kemanusiaan',          label: 'Sosial dan Kemanusiaan' },
  { slug: 'lingkungan-hidup',            label: 'Lingkungan Hidup' },
  { slug: 'media',                       label: 'Media' },
  { slug: 'humas-kerja-sama',            label: 'Humas dan Kerja Sama Antar Lembaga' },
  { slug: 'pemberdayaan-masyarakat-umkm', label: 'Pemberdayaan Masyarakat dan UMKM' },
  { slug: 'ketenagakerjaan-buruh-pekerja', label: 'Ketenagakerjaan, Buruh, dan Pekerja' },
  { slug: 'perlindungan-perempuan-anak', label: 'Perlindungan Perempuan dan Anak (PPA)' },
  { slug: 'penyuluhan-sosialisasi',      label: 'Penyuluhan dan Sosialisasi' },
]);

export const SLUG_KELOMPOK = Object.freeze(KELOMPOK_PENGURUS.map((k) => k.slug));
export const SLUG_BAGIAN = Object.freeze(BAGIAN_DIREKTORAT.map((b) => b.slug));

export function kelompokPengurus(slug) {
  return KELOMPOK_PENGURUS.find((k) => k.slug === slug) || null;
}

export function kelompokValid(slug) {
  return SLUG_KELOMPOK.includes(slug);
}

export function bagianDirektorat(slug) {
  return BAGIAN_DIREKTORAT.find((b) => b.slug === slug) || null;
}

export function bagianValid(slug) {
  return SLUG_BAGIAN.includes(slug);
}

export function labelBagian(slug) {
  return bagianDirektorat(slug)?.label ?? slug;
}

/** Jabatan bawaan yang diusulkan formulir untuk bagian direktorat (pemilik bebas mengubah). */
export function jabatanBawaanBagian(slug) {
  const b = bagianDirektorat(slug);
  return b ? `Direktur ${b.label}` : '';
}

/** Kelompok yang anggotanya memilih WILAYAH, beserta jenis wilayah yang boleh dipilih. */
export function jenisWilayahKelompok(slug) {
  return kelompokPengurus(slug)?.wilayahJenis ?? null;
}

/** true bila kelompok memakai pembagian bagian (saat ini hanya Direktorat). */
export function kelompokBerbagian(slug) {
  return Boolean(kelompokPengurus(slug)?.berbagian);
}

export function belumTerisi(nama) {
  return !nama || String(nama).trim() === NAMA_BELUM_TERISI;
}

// lib/kelompokPengurus.js — KELOMPOK struktur organisasi (RUN QA-2 A2: struktur DPP asli pemilik).
// Kolom `pengurus.kelompok` (migrasi 20260904-1500). Urutan tampil bagan /struktur mengikuti urutan array ini:
// Dewan (Pembina, Penasehat, Pengawas) -> Pengurus DPP -> Direktorat Eksekutif -> Direktorat -> Satgas -> kerangka DPW/DPD/DPC.
// Posisi kosong disimpan sebagai baris dengan nama '(Belum terisi)' agar bagan tetap utuh dan pemilik tinggal mengisi lewat
// Kelola Pengurus (aturan K3). Kelompok `dpw`/`dpd`/`dpc` = template posisi (tingkat 'wilayah') yang boleh tanpa wilayah.
export const NAMA_BELUM_TERISI = '(Belum terisi)';

export const KELOMPOK_PENGURUS = Object.freeze([
  { slug: 'dewan_pembina', label: 'Dewan Pembina', tingkat: 'pusat', tahap: 'dewan', ikon: 'verified_user' },
  { slug: 'dewan_penasehat', label: 'Dewan Penasehat', tingkat: 'pusat', tahap: 'dewan', ikon: 'verified_user' },
  { slug: 'dewan_pengawas', label: 'Dewan Pengawas', tingkat: 'pusat', tahap: 'dewan', ikon: 'verified_user' },
  { slug: 'pengurus_dpp', label: 'Pengurus DPP', tingkat: 'pusat', tahap: 'pengurus', ikon: 'gavel' },
  { slug: 'direktorat_eksekutif', label: 'Direktorat Eksekutif', tingkat: 'pusat', tahap: 'direktorat', ikon: 'gavel' },
  { slug: 'direktorat', label: 'Direktorat', tingkat: 'pusat', tahap: 'direktorat', ikon: 'account_circle' },
  { slug: 'satgas', label: 'Satuan Tugas (Satgas)', tingkat: 'pusat', tahap: 'satgas', ikon: 'campaign' },
  { slug: 'dpw', label: 'Dewan Pimpinan Wilayah (DPW)', tingkat: 'wilayah', tahap: 'kerangka', ikon: 'location_on', template: true },
  { slug: 'dpd', label: 'Dewan Pimpinan Daerah (DPD)', tingkat: 'wilayah', tahap: 'kerangka', ikon: 'location_on', template: true },
  { slug: 'dpc', label: 'Dewan Pimpinan Cabang (DPC)', tingkat: 'wilayah', tahap: 'kerangka', ikon: 'location_on', template: true },
]);

export const SLUG_KELOMPOK = Object.freeze(KELOMPOK_PENGURUS.map((k) => k.slug));

export function kelompokPengurus(slug) {
  return KELOMPOK_PENGURUS.find((k) => k.slug === slug) || null;
}

export function kelompokValid(slug) {
  return SLUG_KELOMPOK.includes(slug);
}

/** Kelompok template (DPW/DPD/DPC): posisi tanpa nama & tanpa wilayah diperbolehkan. */
export function kelompokTemplate(slug) {
  return !!kelompokPengurus(slug)?.template;
}

export function belumTerisi(nama) {
  return !nama || String(nama).trim() === NAMA_BELUM_TERISI;
}

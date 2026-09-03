// lib/kategoriProgram.js — SATU SUMBER kategori program (REFERENSI 10).
// Label persis dari filter di program_kegiatan/code.html; `ikon` = nama Material
// yang dipakai kartu program di layar yang sama.

export const KATEGORI_PROGRAM = Object.freeze([
  { slug: 'pengawasan-dana',    label: 'Pengawasan Dana',    ikon: 'account_balance' },
  { slug: 'observasi-kebijakan', label: 'Observasi Kebijakan', ikon: 'policy' },
  { slug: 'bantuan-hukum',      label: 'Bantuan Hukum',      ikon: 'gavel' },
]);

export const SLUG_KATEGORI_PROGRAM = Object.freeze(KATEGORI_PROGRAM.map((k) => k.slug));

export function labelKategoriProgram(slug) {
  return KATEGORI_PROGRAM.find((k) => k.slug === slug)?.label ?? slug;
}

export function kategoriProgramValid(slug) {
  return SLUG_KATEGORI_PROGRAM.includes(slug);
}

export const STATUS_PROGRAM = Object.freeze([
  { slug: 'berjalan', label: 'Berjalan' },
  { slug: 'selesai',  label: 'Selesai' },
]);

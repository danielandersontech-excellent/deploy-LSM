// lib/kategoriGaleri.js — SATU SUMBER kategori galeri (REFERENSI 10).
// Label persis dari galeri_dokumentasi/code.html; `lencana` = deskripsi warna
// lencana di layar itu (kelas persisnya diambil dari code.html di Tahap 4).

export const KATEGORI_GALERI = Object.freeze([
  { slug: 'investigasi-lapangan', label: 'Investigasi Lapangan', lencana: 'merah' },
  { slug: 'sosialisasi',          label: 'Sosialisasi',          lencana: 'abu' },
  { slug: 'audiensi-publik',      label: 'Audiensi Publik',      lencana: 'emas' },
]);

export const SLUG_KATEGORI_GALERI = Object.freeze(KATEGORI_GALERI.map((k) => k.slug));

export function labelKategoriGaleri(slug) {
  return KATEGORI_GALERI.find((k) => k.slug === slug)?.label ?? slug;
}

export function kategoriGaleriValid(slug) {
  return SLUG_KATEGORI_GALERI.includes(slug);
}

// lib/kategoriPengaduan.js — SATU SUMBER kategori pengaduan (REFERENSI 10).
// Dipakai oleh <select> formulir, validasi route API, dan label tampilan.
// Nilai `slug` yang disimpan di pengaduan.kategori_masalah (VARCHAR, bukan ENUM).
// Label persis dari <option> di kontak_pengaduan_warkop_nusantara_updated_logo/code.html
// ditambah dua kategori yang muncul di layar lain (ketenagakerjaan, pungli).

export const KATEGORI_PENGADUAN = Object.freeze([
  { slug: 'korupsi',          label: 'Tindak Pidana Korupsi' },
  { slug: 'pelayanan-publik', label: 'Buruknya Pelayanan Publik' },
  { slug: 'agraria',          label: 'Sengketa Agraria / Tanah' },
  { slug: 'infrastruktur',    label: 'Kerusakan Infrastruktur' },
  { slug: 'lingkungan',       label: 'Pencemaran Lingkungan' },
  { slug: 'ketenagakerjaan',  label: 'Ketenagakerjaan' },
  { slug: 'pungli',           label: 'Pungutan Liar' },
  { slug: 'lainnya',          label: 'Lainnya' },
]);

const SLUG_KATEGORI_PENGADUAN = Object.freeze(KATEGORI_PENGADUAN.map((k) => k.slug));

export function labelKategoriPengaduan(slug) {
  return KATEGORI_PENGADUAN.find((k) => k.slug === slug)?.label ?? slug;
}

export function kategoriPengaduanValid(slug) {
  return SLUG_KATEGORI_PENGADUAN.includes(slug);
}

// Status pengaduan + label (REFERENSI 10). Kelas lencana ada di components/ui/Lencana.js.
export const STATUS_PENGADUAN = Object.freeze([
  { slug: 'baru',         label: 'Baru' },
  { slug: 'diverifikasi', label: 'Diverifikasi' },
  { slug: 'diproses',     label: 'Diproses' },
  { slug: 'selesai',      label: 'Selesai' },
  { slug: 'ditolak',      label: 'Ditolak' },
]);

export const SLUG_STATUS_PENGADUAN = Object.freeze(STATUS_PENGADUAN.map((s) => s.slug));

export function labelStatusPengaduan(slug) {
  return STATUS_PENGADUAN.find((s) => s.slug === slug)?.label ?? slug;
}

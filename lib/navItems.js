// lib/navItems.js — SATU SUMBER KEBENARAN menu (cetak biru bagian 3, REFERENSI 6).
// Menambah halaman = menambah satu baris di sini, bukan menyunting banyak layout.
//
// Perhatikan awalan /staf pada menu staf — konsekuensi segmen bersarang
// app/(staf)/staf/... agar /program (publik) dan /staf/program tidak menabrak.

export const menuPublik = [
  { label: 'Beranda', href: '/' },
  { label: 'Tentang Kami', href: '/tentang' },
  { label: 'Struktur', href: '/struktur' },
  { label: 'Program', href: '/program' },
  { label: 'Galeri', href: '/galeri' },
  { label: 'Kontak & Pengaduan', href: '/kontak' },
  { label: 'Berita', href: '/berita' },
];

// Nama `ikon` memakai nama Material Symbols persis seperti di
// dashboard_staff_warkop/code.html (dashboard, edit_document, gavel, settings)
// sehingga bisa langsung diberikan ke <Ikon nama={item.ikon} /> — KEPUTUSAN BARU
// Tahap 0 (contoh di TAHAP-00 memakai alias 'artikel'/'palu' yang tidak ada di Ikon.js).
// Kolom `peran` mengikuti matriks REFERENSI 11.
export const menuStaf = [
  {
    label: 'Dashboard',
    href: '/staf/dashboard',
    ikon: 'dashboard',
    peran: ['superadmin', 'redaktur', 'penulis', 'verifikator', 'pimpinan_wilayah'],
  },
  {
    label: 'Kelola Artikel',
    href: '/staf/artikel',
    ikon: 'edit_document',
    peran: ['superadmin', 'redaktur', 'penulis', 'pimpinan_wilayah'],
  },
  {
    label: 'Kelola Pengaduan',
    href: '/staf/pengaduan',
    ikon: 'gavel',
    peran: ['superadmin', 'verifikator', 'pimpinan_wilayah'],
  },
  {
    label: 'Pengurus',
    href: '/staf/pengurus',
    ikon: 'badge',
    peran: ['superadmin', 'redaktur', 'pimpinan_wilayah'],
  },
  {
    label: 'Program',
    href: '/staf/program',
    ikon: 'campaign',
    peran: ['superadmin', 'redaktur', 'pimpinan_wilayah'],
  },
  {
    label: 'Galeri',
    href: '/staf/galeri',
    ikon: 'photo_library',
    peran: ['superadmin', 'redaktur', 'pimpinan_wilayah'],
  },
  {
    label: 'Pengguna',
    href: '/staf/pengguna',
    ikon: 'group',
    peran: ['superadmin'],
  },
  {
    label: 'Pengaturan',
    href: '/staf/pengaturan',
    ikon: 'settings',
    peran: ['superadmin'],
  },
];

/** Menu staf yang boleh dilihat suatu peran. */
export function menuUntukPeran(peran) {
  return menuStaf.filter((item) => item.peran.includes(peran));
}

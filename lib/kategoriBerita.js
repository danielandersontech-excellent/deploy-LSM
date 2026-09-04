// lib/kategoriBerita.js — RUN QA-4 A: SUSUNAN KATEGORI BERITA FINAL (11, urutan tetap, PERINTAH PEMILIK).
//
// Sumber tunggal untuk: migrasi 20260905-1100 (nilai bawaan), seed instalasi baru, dan ikon
// cadangan bila kolom `kategori_artikel.ikon` kosong. Data yang TAMPIL tetap dibaca dari tabel
// kategori_artikel (aturan K3: nama/urutan/ikon boleh diubah pemilik lewat basis data).
//
// IKON: BUKAN emoji. Semua nama diambil dari 77 ikon resmi proyek (components/ui/Ikon.js);
// alasan tiap pilihan ada di kolom `alasan` dan di LAPORAN-QA-4.md. Beberapa tema (lingkungan,
// UMKM, pekerja) tidak punya ikon literal di daftar resmi, jadi dipilih yang paling dekat maknanya
// daripada menambah berkas ikon dari luar (aturan K1 + larangan mengubah paket-pendukung).
//
// "Podcash": ejaan PERSIS dari pemilik. Dipertahankan apa adanya; kemungkinan yang dimaksud
// "Podcast" dicatat di MENUNGGU PEMILIK, tidak ditebak.
export const KATEGORI_BERITA = Object.freeze([
  { id: 6,  slug: 'nasional',         nama: 'Nasional',         urutan: 1,  ikon: 'account_balance',   alasan: 'gedung negara: isu tingkat nasional/lembaga pusat' },
  { id: 7,  slug: 'daerah',           nama: 'Daerah',           urutan: 2,  ikon: 'location_on',       alasan: 'penanda lokasi: liputan kabupaten/kota/provinsi' },
  { id: 8,  slug: 'hukum',            nama: 'Hukum',            urutan: 3,  ikon: 'gavel',             alasan: 'palu hakim: penegakan dan bantuan hukum' },
  { id: 9,  slug: 'kebijakan-publik', nama: 'Kebijakan Publik', urutan: 4,  ikon: 'policy',            alasan: 'ikon kebijakan: regulasi dan pelayanan publik' },
  { id: 1,  slug: 'investigasi',      nama: 'Investigasi',      urutan: 5,  ikon: 'zoom_in',           alasan: 'kaca pembesar: penelusuran mendalam (id 1 dipertahankan, relasi artikel lama tetap)' },
  { id: 10, slug: 'lingkungan',       nama: 'Lingkungan',       urutan: 6,  ikon: 'explore',           alasan: 'kompas: alam dan wilayah; daftar resmi tidak punya ikon daun/alam' },
  { id: 11, slug: 'pekerja',          nama: 'Pekerja',          urutan: 7,  ikon: 'badge',             alasan: 'kartu identitas pegawai: buruh dan ketenagakerjaan' },
  { id: 12, slug: 'umkm',             nama: 'UMKM',             urutan: 8,  ikon: 'sell',              alasan: 'label harga: usaha dan perdagangan kecil' },
  { id: 13, slug: 'sosial',           nama: 'Sosial',           urutan: 9,  ikon: 'forum',             alasan: 'percakapan komunitas: isu kemasyarakatan' },
  { id: 14, slug: 'ppa',              nama: 'PPA',              urutan: 10, ikon: 'shield',            alasan: 'perisai: perlindungan perempuan dan anak' },
  { id: 15, slug: 'podcash',          nama: 'Podcash',          urutan: 11, ikon: 'record_voice_over', alasan: 'orang berbicara: konten suara/siniar (ejaan persis pemilik)' },
]);

export const SLUG_KATEGORI_BERITA = Object.freeze(KATEGORI_BERITA.map((k) => k.slug));

/** Pemetaan kategori LAMA (di luar daftar final) -> kategori baru terdekat, dipakai migrasi & laporan. */
export const PEMETAAN_KATEGORI_LAMA = Object.freeze([
  { lama: 'siaran-pers',     baru: 'nasional',         alasan: 'pernyataan resmi lembaga pusat = berita nasional/lembaga' },
  { lama: 'opini-publik',    baru: 'kebijakan-publik', alasan: 'opini dan analisis kebijakan = Kebijakan Publik' },
  { lama: 'kegiatan-daerah', baru: 'daerah',           alasan: 'kegiatan kantor regional = Daerah' },
  { lama: 'fasilitas-umum',  baru: 'kebijakan-publik', alasan: 'kondisi fasilitas & layanan publik = Kebijakan Publik' },
]);

export function ikonKategoriBerita(slug, ikonDb = null) {
  return ikonDb || KATEGORI_BERITA.find((k) => k.slug === slug)?.ikon || 'article';
}

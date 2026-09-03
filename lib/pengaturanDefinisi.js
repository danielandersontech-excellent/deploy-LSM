// lib/pengaturanDefinisi.js — SUMBER TUNGGAL setelan (aturan 8, REFERENSI 14).
// Dipakai oleh: seed (nilai bawaan), formulir /staf/pengaturan (daftar field),
// dan DAFTAR PUTIH kunci di route API /api/staf/pengaturan. Menambah setelan =
// menambah SATU entri di sini; jangan menulis daftar kunci di tempat lain.
//
// tipe: 'teks' | 'angka' | 'teks_panjang'
// Nilai bawaan diambil dari angka/teks yang TAMPAK di layar desain
// (beranda_warkop_nusantara, kontak_pengaduan_..._updated_logo).

export const PENGATURAN_DEFINISI = Object.freeze([
  // --- Statistik beranda (beranda_warkop_nusantara/screen.png) ---
  { kunci: 'statistik_laporan_ditangani', label: 'Laporan ditangani',  tipe: 'angka', kelompok: 'statistik', bawaan: '12000',
    deskripsi: 'Angka "12,000+ Laporan Ditangani" di beranda' },
  { kunci: 'statistik_provinsi_tercover', label: 'Provinsi tercover',  tipe: 'angka', kelompok: 'statistik', bawaan: '38',
    deskripsi: 'Angka "38 Provinsi Tercover" di beranda' },
  { kunci: 'statistik_tahun_mengawasi',   label: 'Tahun mengawasi',    tipe: 'angka', kelompok: 'statistik', bawaan: '15',
    deskripsi: 'Angka "15 Tahun Mengawasi" di beranda' },

  // --- Kontak (kartu "Hubungi Kami" di layar kontak; email/hotline juga di footer) ---
  { kunci: 'kontak_email',          label: 'Email resmi',            tipe: 'teks', kelompok: 'kontak', bawaan: 'pengaduan@warkopnusantara.id',
    deskripsi: 'Email pengaduan di footer dan halaman kontak' },
  { kunci: 'kontak_hotline',        label: 'Hotline pengaduan',      tipe: 'teks', kelompok: 'kontak', bawaan: '0800-1-WARKOP (927567)',
    deskripsi: 'Hotline 24/7 di halaman kontak dan footer' },
  { kunci: 'kontak_alamat_gedung',  label: 'Nama gedung kantor',     tipe: 'teks', kelompok: 'kontak', bawaan: 'Gedung Aspirasi Rakyat',
    deskripsi: 'Baris pertama alamat kantor pusat' },
  { kunci: 'kontak_alamat_jalan',   label: 'Alamat jalan',           tipe: 'teks', kelompok: 'kontak', bawaan: 'Jl. Kebenaran No. 1, Jakarta Pusat',
    deskripsi: 'Baris kedua alamat kantor pusat' },
  { kunci: 'kontak_alamat_kota',    label: 'Kota & kode pos',        tipe: 'teks', kelompok: 'kontak', bawaan: 'DKI Jakarta, 10110',
    deskripsi: 'Baris ketiga alamat kantor pusat' },

  // --- Profil lembaga (halaman Tentang) ---
  { kunci: 'visi', label: 'Visi', tipe: 'teks_panjang', kelompok: 'profil',
    bawaan: 'Terwujudnya tata kelola pemerintahan dan pelayanan publik yang transparan, adil, dan akuntabel melalui pengawasan sipil yang independen di seluruh Nusantara.',
    deskripsi: 'Visi lembaga di halaman Tentang Kami' },
  { kunci: 'misi', label: 'Misi', tipe: 'teks_panjang', kelompok: 'profil',
    bawaan: '1. Menjadi wadah aspirasi rakyat yang aman dan terpercaya.\n2. Melakukan kontrol sosial dan observasi kebijakan publik berbasis fakta dan hukum.\n3. Mengawasi penggunaan anggaran dan pelayanan publik di pusat maupun daerah.\n4. Mendampingi masyarakat menempuh jalur hukum yang resmi.\n5. Menerbitkan laporan investigasi yang objektif dan dapat dipertanggungjawabkan.',
    deskripsi: 'Misi lembaga di halaman Tentang Kami (satu butir per baris)' },

  // --- Halaman teks statis (tautan footer; REFERENSI 18.3) ---
  { kunci: 'teks_kebijakan_privasi', label: 'Kebijakan Privasi', tipe: 'teks_panjang', kelompok: 'halaman_statis',
    bawaan: 'WARKOP NUSANTARA menghormati privasi setiap pelapor dan pengunjung. Identitas pelapor (nama, NIK, telepon, email) hanya dapat diakses oleh petugas yang berwenang, tidak pernah dipublikasikan, dan setiap pembukaannya tercatat dalam jejak audit.\n\nData pengaduan disimpan di server yang dikelola lembaga dan tidak dibagikan kepada pihak ketiga tanpa dasar hukum yang sah. Pelapor dapat memilih untuk sepenuhnya anonim.\n\nHalaman ini adalah teks penampung dan akan disempurnakan oleh pengurus lembaga.',
    deskripsi: 'Isi halaman /kebijakan-privasi' },
  { kunci: 'teks_pedoman_komunitas', label: 'Pedoman Komunitas', tipe: 'teks_panjang', kelompok: 'halaman_statis',
    bawaan: 'Setiap laporan yang disampaikan melalui kanal WARKOP NUSANTARA diharapkan jujur, berbasis fakta, dan disertai bukti sejauh memungkinkan. Laporan yang bersifat fitnah, ujaran kebencian, atau menyerang pribadi tanpa dasar akan ditolak.\n\nTim verifikator menindaklanjuti laporan sesuai urutan masuk dan tingkat urgensinya. Pelapor dapat memantau status lewat nomor kasus yang diberikan.\n\nHalaman ini adalah teks penampung dan akan disempurnakan oleh pengurus lembaga.',
    deskripsi: 'Isi halaman /pedoman-komunitas' },
  { kunci: 'teks_faq', label: 'FAQ', tipe: 'teks_panjang', kelompok: 'halaman_statis',
    bawaan: 'Apakah saya bisa melapor tanpa menyebut identitas?\nBisa. Pilih "Sembunyikan Identitas Saya" pada formulir; tidak ada data pribadi yang disimpan.\n\nBagaimana cara memantau laporan saya?\nGunakan nomor kasus (format WRP-XXXXXX) pada halaman Lacak Pengaduan.\n\nBerapa lama laporan ditindaklanjuti?\nVerifikasi awal dilakukan dalam beberapa hari kerja; durasi selanjutnya bergantung pada kompleksitas kasus.\n\nHalaman ini adalah teks penampung dan akan disempurnakan oleh pengurus lembaga.',
    deskripsi: 'Isi halaman /faq (pasangan tanya-jawab dipisah baris kosong)' },
]);

/** Daftar putih kunci — satu-satunya yang boleh dibaca/ditulis lewat API pengaturan. */
export const KUNCI_PENGATURAN = Object.freeze(PENGATURAN_DEFINISI.map((d) => d.kunci));

export function definisiPengaturan(kunci) {
  return PENGATURAN_DEFINISI.find((d) => d.kunci === kunci) ?? null;
}

export function kunciPengaturanValid(kunci) {
  return KUNCI_PENGATURAN.includes(kunci);
}

/** Nilai bawaan seluruh setelan sebagai objek {kunci: nilai}. */
export function pengaturanBawaan() {
  return Object.fromEntries(PENGATURAN_DEFINISI.map((d) => [d.kunci, d.bawaan]));
}

-- =====================================================================
--  database/seed.sql — WARKOP NUSANTARA. Data awal. Salinan identik: sql/02-seed.sql
--
--  IDEMPOTEN: seluruh INSERT memakai INSERT IGNORE pada kunci unik
--  (kode wilayah, slug, email, nomor_kasus, kunci pengaturan) atau
--  INSERT ... SELECT ... WHERE NOT EXISTS. Dijalankan dua kali = tidak berganda,
--  dan suntingan redaksi tidak ditimpa.
--
--  TIDAK ADA KATA SANDI di berkas ini. Akun superadmin dibuat oleh
--  scripts/seed.js dari SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD (hash bcrypt).
--  Lima akun staf contoh di bawah diberi hash '!' (tidak mungkin cocok) dan
--  aktif = 0; scripts/seed.js mengaktifkannya hanya bila SEED_STAF_PASSWORD diisi.
--
--  SELURUH ARTIKEL, PENGADUAN, PROGRAM, GALERI, DAN PENGURUS DI SINI ADALAH
--  KONTEN CONTOH — wajib ditinjau/diganti redaksi sebelum peluncuran publik.
--  Judul/kutipan artikel pertama disalin verbatim dari layar desain; isi lengkap
--  ditulis orisinal, tanpa nama orang/pejabat/perusahaan/instansi nyata dan
--  tanpa tuduhan kasus nyata.
--
--  Seluruh nilai waktu ditulis eksplisit dalam WIB (tidak memakai NOW()).
-- =====================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+07:00';

-- ---------------------------------------------------------------------
-- WILAYAH: pusat + 38 provinsi (kode BPS)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO wilayah (nama, jenis, induk_id, kode) VALUES ('Pusat', 'pusat', NULL, '00');

INSERT IGNORE INTO wilayah (nama, jenis, induk_id, kode)
SELECT v.nama, 'provinsi', (SELECT id FROM wilayah WHERE kode = '00'), v.kode FROM (
  SELECT 'Aceh' AS nama, '11' AS kode UNION ALL
  SELECT 'Sumatera Utara', '12' UNION ALL
  SELECT 'Sumatera Barat', '13' UNION ALL
  SELECT 'Riau', '14' UNION ALL
  SELECT 'Jambi', '15' UNION ALL
  SELECT 'Sumatera Selatan', '16' UNION ALL
  SELECT 'Bengkulu', '17' UNION ALL
  SELECT 'Lampung', '18' UNION ALL
  SELECT 'Kepulauan Bangka Belitung', '19' UNION ALL
  SELECT 'Kepulauan Riau', '21' UNION ALL
  SELECT 'DKI Jakarta', '31' UNION ALL
  SELECT 'Jawa Barat', '32' UNION ALL
  SELECT 'Jawa Tengah', '33' UNION ALL
  SELECT 'DI Yogyakarta', '34' UNION ALL
  SELECT 'Jawa Timur', '35' UNION ALL
  SELECT 'Banten', '36' UNION ALL
  SELECT 'Bali', '51' UNION ALL
  SELECT 'Nusa Tenggara Barat', '52' UNION ALL
  SELECT 'Nusa Tenggara Timur', '53' UNION ALL
  SELECT 'Kalimantan Barat', '61' UNION ALL
  SELECT 'Kalimantan Tengah', '62' UNION ALL
  SELECT 'Kalimantan Selatan', '63' UNION ALL
  SELECT 'Kalimantan Timur', '64' UNION ALL
  SELECT 'Kalimantan Utara', '65' UNION ALL
  SELECT 'Sulawesi Utara', '71' UNION ALL
  SELECT 'Sulawesi Tengah', '72' UNION ALL
  SELECT 'Sulawesi Selatan', '73' UNION ALL
  SELECT 'Sulawesi Tenggara', '74' UNION ALL
  SELECT 'Gorontalo', '75' UNION ALL
  SELECT 'Sulawesi Barat', '76' UNION ALL
  SELECT 'Maluku', '81' UNION ALL
  SELECT 'Maluku Utara', '82' UNION ALL
  SELECT 'Papua', '91' UNION ALL
  SELECT 'Papua Barat', '92' UNION ALL
  SELECT 'Papua Selatan', '93' UNION ALL
  SELECT 'Papua Tengah', '94' UNION ALL
  SELECT 'Papua Pegunungan', '95' UNION ALL
  SELECT 'Papua Barat Daya', '96'
) AS v;

-- ---------------------------------------------------------------------
-- KATEGORI ARTIKEL (REFERENSI 10)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO kategori_artikel (nama, slug, deskripsi, urutan) VALUES
  ('Investigasi',     'investigasi',     'Laporan investigasi lapangan tim pengawas', 1),
  ('Siaran Pers',     'siaran-pers',     'Pernyataan resmi lembaga',                  2),
  ('Opini Publik',    'opini-publik',    'Analisis dan pandangan redaksi',             3),
  ('Kegiatan Daerah', 'kegiatan-daerah', 'Kegiatan dan observasi kantor regional',     4),
  ('Fasilitas Umum',  'fasilitas-umum',  'Laporan kondisi fasilitas dan layanan publik', 5);

-- ---------------------------------------------------------------------
-- AKUN STAF CONTOH (nonaktif, hash '!' tidak pernah cocok). Nama mengikuti
-- penulis yang tampak di layar desain. Diaktifkan oleh scripts/seed.js.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO users (nama, email, kata_sandi_hash, peran, wilayah_id, aktif, token_version, dibuat_pada, diperbarui_pada) VALUES
  ('Budi Santoso',   'budi.santoso@warkopnusantara.id',   '!', 'penulis',          NULL, 0, 0, '2026-06-01 09:00:00', '2026-06-01 09:00:00'),
  ('Siti Rahma',     'siti.rahma@warkopnusantara.id',     '!', 'redaktur',         NULL, 0, 0, '2026-06-01 09:00:00', '2026-06-01 09:00:00'),
  ('Siti Aminah',    'siti.aminah@warkopnusantara.id',    '!', 'verifikator',      NULL, 0, 0, '2026-06-01 09:00:00', '2026-06-01 09:00:00'),
  ('Redaksi Warkop', 'redaksi@warkopnusantara.id',        '!', 'redaktur',         NULL, 0, 0, '2026-06-01 09:00:00', '2026-06-01 09:00:00'),
  ('Rahmat Siregar', 'rahmat.siregar@warkopnusantara.id', '!', 'pimpinan_wilayah', (SELECT id FROM wilayah WHERE kode = '12'), 0, 0, '2026-06-01 09:00:00', '2026-06-01 09:00:00');

-- ---------------------------------------------------------------------
-- PENGATURAN — nilai bawaan (sinkron dengan lib/pengaturanDefinisi.js)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO pengaturan (kunci, nilai, deskripsi, diperbarui_pada) VALUES
  ('statistik_laporan_ditangani', '12000', 'Angka "12,000+ Laporan Ditangani" di beranda', '2026-06-01 09:00:00'),
  ('statistik_provinsi_tercover', '38',    'Angka "38 Provinsi Tercover" di beranda',      '2026-06-01 09:00:00'),
  ('statistik_tahun_mengawasi',   '15',    'Angka "15 Tahun Mengawasi" di beranda',        '2026-06-01 09:00:00'),
  ('kontak_email',         'pengaduan@warkopnusantara.id',     'Email pengaduan di footer dan halaman kontak', '2026-06-01 09:00:00'),
  ('kontak_hotline',       '0800-1-WARKOP (927567)',           'Hotline 24/7 di halaman kontak dan footer',   '2026-06-01 09:00:00'),
  ('kontak_alamat_gedung', 'Gedung Aspirasi Rakyat',           'Baris pertama alamat kantor pusat',           '2026-06-01 09:00:00'),
  ('kontak_alamat_jalan',  'Jl. Kebenaran No. 1, Jakarta Pusat', 'Baris kedua alamat kantor pusat',           '2026-06-01 09:00:00'),
  ('kontak_alamat_kota',   'DKI Jakarta, 10110',               'Baris ketiga alamat kantor pusat',            '2026-06-01 09:00:00'),
  ('visi', 'Terwujudnya tata kelola pemerintahan dan pelayanan publik yang transparan, adil, dan akuntabel melalui pengawasan sipil yang independen di seluruh Nusantara.', 'Visi lembaga di halaman Tentang Kami', '2026-06-01 09:00:00'),
  ('misi', '1. Menjadi wadah aspirasi rakyat yang aman dan terpercaya.\n2. Melakukan kontrol sosial dan observasi kebijakan publik berbasis fakta dan hukum.\n3. Mengawasi penggunaan anggaran dan pelayanan publik di pusat maupun daerah.\n4. Mendampingi masyarakat menempuh jalur hukum yang resmi.\n5. Menerbitkan laporan investigasi yang objektif dan dapat dipertanggungjawabkan.', 'Misi lembaga di halaman Tentang Kami (satu butir per baris)', '2026-06-01 09:00:00'),
  ('teks_kebijakan_privasi', 'WARKOP NUSANTARA menghormati privasi setiap pelapor dan pengunjung. Identitas pelapor (nama, NIK, telepon, email) hanya dapat diakses oleh petugas yang berwenang, tidak pernah dipublikasikan, dan setiap pembukaannya tercatat dalam jejak audit.\n\nData pengaduan disimpan di server yang dikelola lembaga dan tidak dibagikan kepada pihak ketiga tanpa dasar hukum yang sah. Pelapor dapat memilih untuk sepenuhnya anonim.\n\nHalaman ini adalah teks penampung dan akan disempurnakan oleh pengurus lembaga.', 'Isi halaman /kebijakan-privasi', '2026-06-01 09:00:00'),
  ('teks_pedoman_komunitas', 'Setiap laporan yang disampaikan melalui kanal WARKOP NUSANTARA diharapkan jujur, berbasis fakta, dan disertai bukti sejauh memungkinkan. Laporan yang bersifat fitnah, ujaran kebencian, atau menyerang pribadi tanpa dasar akan ditolak.\n\nTim verifikator menindaklanjuti laporan sesuai urutan masuk dan tingkat urgensinya. Pelapor dapat memantau status lewat nomor kasus yang diberikan.\n\nHalaman ini adalah teks penampung dan akan disempurnakan oleh pengurus lembaga.', 'Isi halaman /pedoman-komunitas', '2026-06-01 09:00:00'),
  ('teks_faq', 'Apakah saya bisa melapor tanpa menyebut identitas?\nBisa. Pilih "Sembunyikan Identitas Saya" pada formulir; tidak ada data pribadi yang disimpan.\n\nBagaimana cara memantau laporan saya?\nGunakan nomor kasus (format WRP-XXXXXX) pada halaman Lacak Pengaduan.\n\nBerapa lama laporan ditindaklanjuti?\nVerifikasi awal dilakukan dalam beberapa hari kerja; durasi selanjutnya bergantung pada kompleksitas kasus.\n\nHalaman ini adalah teks penampung dan akan disempurnakan oleh pengurus lembaga.', 'Isi halaman /faq (pasangan tanya-jawab dipisah baris kosong)', '2026-06-01 09:00:00');

-- ---------------------------------------------------------------------
-- ARTIKEL — 12 KONTEN CONTOH (judul/kutipan verbatim dari layar desain;
-- isi orisinal). Tanggal tersebar Juni–September 2026; campuran status.
-- gambar_utama = penampung lokal (dibuat Tahap 4/5 di public/penampung/).
-- ---------------------------------------------------------------------
INSERT IGNORE INTO artikel (judul, slug, ringkasan, isi, gambar_utama, kategori_id, penulis_id, wilayah_id, status, jumlah_dibaca, terbit_pada, dibuat_pada, diperbarui_pada) VALUES
(
  'Dugaan Penyelewengan Dana Desa di Sektor Infrastruktur Terungkap',
  'dugaan-penyelewengan-dana-desa-di-sektor-infrastruktur-terungkap',
  'Tim investigasi kami menemukan ketidaksesuaian laporan alokasi dana desa dengan realisasi fisik pembangunan jalan di tiga kecamatan. Bukti awal telah diserahkan ke pihak berwenang.',
  '<p>Tim investigasi kami menemukan ketidaksesuaian laporan alokasi dana desa dengan realisasi fisik pembangunan jalan di tiga kecamatan. Bukti awal telah diserahkan ke pihak berwenang.</p><p>Observasi dilakukan selama delapan minggu dengan membandingkan dokumen rencana anggaran, laporan realisasi, dan kondisi fisik di lapangan. Pada beberapa ruas, panjang jalan yang tercatat selesai berbeda dari hasil pengukuran ulang relawan pengawas, sementara spesifikasi material yang dipakai tidak sesuai dengan yang tertulis dalam rencana.</p><h2>Metode pemeriksaan</h2><p>Relawan mendokumentasikan setiap titik dengan foto berkoordinat, lalu mencocokkannya dengan peta rencana kerja. Warga sekitar diwawancarai untuk memastikan kapan pekerjaan dimulai dan berhenti. Seluruh temuan dicatat dalam berita acara yang ditandatangani saksi setempat.</p><p>Kami menegaskan bahwa temuan ini berstatus dugaan. Penilaian akhir menjadi wewenang aparat pengawas fungsional dan penegak hukum. Laporan lengkap beserta lampiran telah diserahkan melalui jalur resmi, dan kami akan memublikasikan perkembangannya di kanal ini.</p><p>Masyarakat yang memiliki informasi tambahan dapat menyampaikannya melalui kanal pengaduan WARKOP NUSANTARA. Identitas pelapor dilindungi.</p>',
  '/penampung/artikel-1.jpg',
  (SELECT id FROM kategori_artikel WHERE slug = 'investigasi'),
  (SELECT id FROM users WHERE email = 'budi.santoso@warkopnusantara.id'),
  (SELECT id FROM wilayah WHERE kode = '31'),
  'terbit', 1248, '2026-08-12 09:30:00', '2026-08-10 14:00:00', '2026-08-12 09:30:00'
),
(
  'Fasilitas Kesehatan Mangkrak di Daerah Pelosok',
  'fasilitas-kesehatan-mangkrak-di-daerah-pelosok',
  'Laporan warga terkait puskesmas pembantu yang tidak beroperasi selama 6 bulan meski pembangunan telah selesai.',
  '<p>Laporan warga terkait puskesmas pembantu yang tidak beroperasi selama 6 bulan meski pembangunan telah selesai.</p><p>Bangunan berdiri lengkap dengan papan nama, namun pintunya terkunci sejak serah terima. Warga harus menempuh perjalanan lebih dari satu jam untuk mencapai fasilitas kesehatan terdekat, padahal fasilitas baru ini hanya berjarak beberapa ratus meter dari permukiman.</p><h2>Yang kami temukan</h2><p>Dari penelusuran dokumen, pembangunan fisik memang telah dinyatakan selesai. Yang belum tersedia adalah tenaga kesehatan, perabot medis, dan sambungan listrik. Ketiganya berada di bawah pos anggaran yang berbeda dan belum terealisasi.</p><p>WARKOP NUSANTARA mengirimkan surat permintaan informasi kepada instansi terkait dan mendampingi warga menyusun pengaduan resmi. Kami akan memperbarui laporan ini begitu ada tanggapan.</p>',
  '/penampung/artikel-2.jpg',
  (SELECT id FROM kategori_artikel WHERE slug = 'fasilitas-umum'),
  (SELECT id FROM users WHERE email = 'budi.santoso@warkopnusantara.id'),
  (SELECT id FROM wilayah WHERE kode = '33'),
  'terbit', 863, '2026-08-08 10:00:00', '2026-08-07 16:20:00', '2026-08-08 10:00:00'
),
(
  'Evaluasi Proyek Jalan Trans-Sumatera Sektor Selatan',
  'evaluasi-proyek-jalan-trans-sumatera-sektor-selatan',
  'Tim observasi Warkop Nusantara menemukan adanya keterlambatan distribusi material yang berpotensi menunda penyelesaian target kuartal ketiga. Laporan warga setempat menguatkan temuan ini.',
  '<p>Tim observasi Warkop Nusantara menemukan adanya keterlambatan distribusi material yang berpotensi menunda penyelesaian target kuartal ketiga. Laporan warga setempat menguatkan temuan ini.</p><p>Observasi dilakukan pada beberapa segmen pekerjaan yang dapat diakses publik. Pada titik-titik tersebut, tumpukan material yang seharusnya sudah terpasang masih tertahan di lokasi penyimpanan, sementara alat berat tidak beroperasi pada jam kerja normal.</p><h2>Dampak bagi warga</h2><p>Warga mengeluhkan debu dan akses jalan alternatif yang rusak akibat lalu lintas kendaraan proyek. Beberapa pelaku usaha kecil di sepanjang jalur melaporkan penurunan pendapatan karena akses ke tempat usaha terganggu lebih lama dari jadwal yang diumumkan.</p><p>Kami merekomendasikan agar pengelola proyek menyampaikan jadwal ulang secara terbuka kepada masyarakat terdampak dan menyediakan jalur pengaduan yang mudah dijangkau.</p>',
  '/penampung/artikel-3.jpg',
  (SELECT id FROM kategori_artikel WHERE slug = 'fasilitas-umum'),
  (SELECT id FROM users WHERE email = 'budi.santoso@warkopnusantara.id'),
  (SELECT id FROM wilayah WHERE kode = '16'),
  'terbit', 540, '2026-08-12 15:00:00', '2026-08-11 09:00:00', '2026-08-12 15:00:00'
),
(
  'Rapat Dengar Pendapat Mengenai Kualitas Air Bersih Regional',
  'rapat-dengar-pendapat-mengenai-kualitas-air-bersih-regional',
  'Dokumentasi lengkap hasil dengar pendapat antara perwakilan masyarakat dan PDAM terkait penurunan kualitas air selama musim kemarau. Komitmen perbaikan dicatat secara resmi.',
  '<p>Dokumentasi lengkap hasil dengar pendapat antara perwakilan masyarakat dan PDAM terkait penurunan kualitas air selama musim kemarau. Komitmen perbaikan dicatat secara resmi.</p><p>Pertemuan berlangsung di balai pertemuan wilayah dan dihadiri perwakilan warga dari beberapa kelurahan, pengelola layanan air, serta tim pemantau WARKOP NUSANTARA sebagai fasilitator.</p><h2>Poin kesepakatan</h2><p>Pengelola layanan berkomitmen melakukan pengujian kualitas air berkala dan mengumumkan hasilnya secara terbuka. Warga sepakat membentuk kelompok pemantau mandiri yang akan melaporkan setiap gangguan melalui kanal resmi.</p><p>Seluruh notulen pertemuan dapat diminta oleh warga melalui kantor regional kami. Tindak lanjut akan kami pantau dan laporkan pada kegiatan berikutnya.</p>',
  '/penampung/artikel-4.jpg',
  (SELECT id FROM kategori_artikel WHERE slug = 'kegiatan-daerah'),
  (SELECT id FROM users WHERE email = 'siti.rahma@warkopnusantara.id'),
  (SELECT id FROM wilayah WHERE kode = '32'),
  'terbit', 412, '2026-08-10 11:00:00', '2026-08-09 13:30:00', '2026-08-10 11:00:00'
),
(
  'Analisis Dokumen AMDAL Kawasan Industri Baru',
  'analisis-dokumen-amdal-kawasan-industri-baru',
  'Tinjauan kritis terhadap kelengkapan dokumen Analisis Mengenai Dampak Lingkungan yang diajukan untuk perluasan zona industri di wilayah pesisir.',
  '<p>Tinjauan kritis terhadap kelengkapan dokumen Analisis Mengenai Dampak Lingkungan yang diajukan untuk perluasan zona industri di wilayah pesisir.</p><p>Tim advokasi menelaah dokumen yang tersedia untuk publik dan membandingkannya dengan ketentuan yang berlaku. Beberapa bagian, seperti rencana pengelolaan limbah cair dan konsultasi publik, ditemukan kurang rinci dibandingkan standar yang biasanya disyaratkan.</p><h2>Catatan untuk konsultasi publik</h2><p>Kami mendorong agar masyarakat pesisir dilibatkan secara bermakna, bukan sekadar formalitas. Daftar hadir dan notulen konsultasi seharusnya dapat diakses warga.</p><p>Artikel ini masih dalam penyuntingan redaksi dan akan diterbitkan setelah verifikasi dokumen selesai.</p>',
  '/penampung/artikel-5.jpg',
  (SELECT id FROM kategori_artikel WHERE slug = 'investigasi'),
  (SELECT id FROM users WHERE email = 'redaksi@warkopnusantara.id'),
  (SELECT id FROM wilayah WHERE kode = '36'),
  'draf', 0, NULL, '2026-08-05 08:45:00', '2026-08-05 08:45:00'
),
(
  'Membongkar Tabir Ketidakadilan: Laporan Khusus Dari Garis Depan',
  'membongkar-tabir-ketidakadilan-laporan-khusus-dari-garis-depan',
  'Sebuah tinjauan mendalam mengenai praktik penyimpangan yang meresahkan masyarakat, dan langkah konkrit yang diambil oleh tim observasi kami di lapangan.',
  '<p>Dalam kegelapan birokrasi, seringkali suara rakyat kecil tenggelam oleh deru mesin kekuasaan. Namun, observasi terbaru yang dilakukan oleh tim Warkop Nusantara di beberapa wilayah krusial menunjukkan pergeseran paradigma. Dokumen-dokumen yang sebelumnya tertutup rapat kini mulai terkuak, membawa secercah harapan bagi tegaknya keadilan di tingkat akar rumput.</p><p>Investigasi yang berlangsung selama tiga bulan terakhir ini memfokuskan pada ketimpangan distribusi bantuan sosial dan manipulasi data penerima. Melalui metode pengawasan partisipatif, ribuan data berhasil diverifikasi secara silang dengan kenyataan di lapangan. Hasilnya mengejutkan, sekaligus memvalidasi kecurigaan yang selama ini disuarakan secara senyap.</p><h2>Metodologi Pengawasan Partisipatif</h2><p>Pendekatan yang kami gunakan tidak semata-mata mengandalkan audit formal. Kami turun ke bawah, duduk bersama warga di kedai-kedai kopi, mendengarkan keluh kesah yang tidak pernah tercatat dalam laporan resmi. Kebenaran, seringkali, ditemukan dalam dialog-dialog informal ini.</p><blockquote>"Kami tidak akan mundur selama rakyat masih dizalimi."</blockquote><p>Kutipan di atas bukan sekadar retorika kosong. Ia adalah manifesto yang menggerakkan puluhan relawan kami setiap harinya. Tantangan yang dihadapi tidaklah mudah; mulai dari intimidasi halus hingga upaya delegitimasi data. Namun, transparansi adalah senjata terbaik melawan ketidakbenaran.</p><p>Kami mengajak seluruh lapisan masyarakat untuk terus bersikap kritis. Platform Warkop Nusantara didesain tepat untuk tujuan ini: menyediakan wadah yang aman, terpercaya, dan kredibel untuk melaporkan temuan-temuan di lapangan.</p>',
  '/penampung/artikel-6.jpg',
  (SELECT id FROM kategori_artikel WHERE slug = 'investigasi'),
  (SELECT id FROM users WHERE email = 'budi.santoso@warkopnusantara.id'),
  (SELECT id FROM wilayah WHERE kode = '00'),
  'terbit', 2310, '2026-08-24 08:00:00', '2026-08-20 10:00:00', '2026-08-24 08:00:00'
),
(
  'Audit Dana Desa Kuartal III: Temuan Awal',
  'audit-dana-desa-kuartal-iii-temuan-awal',
  'Rangkuman hasil observasi tim regional terhadap alokasi dana desa di wilayah timur.',
  '<p>Rangkuman hasil observasi tim regional terhadap alokasi dana desa di wilayah timur.</p><p>Pada kuartal ini tim regional memeriksa laporan realisasi dari sejumlah desa yang dipilih secara acak. Fokus pemeriksaan adalah kesesuaian antara pos anggaran, bukti pembayaran, dan keluaran fisik yang dapat diverifikasi warga.</p><h2>Temuan umum</h2><p>Sebagian besar desa telah memasang papan informasi anggaran di tempat umum, meskipun beberapa di antaranya belum diperbarui. Laporan pertanggungjawaban umumnya tersedia, namun tidak semua warga mengetahui haknya untuk membacanya.</p><p>Laporan ini bersifat awal dan telah digantikan oleh laporan kuartal berikutnya. Diarsipkan sebagai rujukan.</p>',
  '/penampung/artikel-7.jpg',
  (SELECT id FROM kategori_artikel WHERE slug = 'kegiatan-daerah'),
  (SELECT id FROM users WHERE email = 'siti.rahma@warkopnusantara.id'),
  (SELECT id FROM wilayah WHERE kode = '81'),
  'arsip', 305, '2026-07-15 09:00:00', '2026-07-14 09:00:00', '2026-08-30 09:00:00'
),
(
  'Cara Aman Menyampaikan Laporan Pengaduan',
  'cara-aman-menyampaikan-laporan-pengaduan',
  'Langkah demi langkah menggunakan platform kami untuk memastikan keamanan identitas pelapor.',
  '<p>Langkah demi langkah menggunakan platform kami untuk memastikan keamanan identitas pelapor.</p><h2>1. Putuskan apakah Anda ingin anonim</h2><p>Formulir pengaduan menyediakan pilihan untuk menyembunyikan identitas. Bila dipilih, tidak ada nama, NIK, telepon, atau email yang disimpan. Anda tetap mendapat nomor kasus untuk memantau perkembangan.</p><h2>2. Tulis kronologi secara runtut</h2><p>Sebutkan apa yang terjadi, kapan, di mana, dan siapa saja pihak yang terlibat sejauh Anda ketahui. Hindari menyertakan data pribadi orang lain yang tidak relevan.</p><h2>3. Lampirkan bukti seperlunya</h2><p>Foto, dokumen, atau video pendukung membantu verifikasi. Pastikan berkas tidak memuat informasi pribadi Anda bila Anda memilih anonim.</p><h2>4. Simpan nomor kasus Anda</h2><p>Nomor kasus berformat WRP-XXXXXX. Gunakan pada halaman Lacak Pengaduan. Jangan membagikannya kepada orang yang tidak Anda percaya.</p><p>Identitas pelapor hanya dapat dibuka oleh petugas berwenang, dan setiap pembukaan tercatat dalam jejak audit.</p>',
  '/penampung/artikel-8.jpg',
  (SELECT id FROM kategori_artikel WHERE slug = 'siaran-pers'),
  (SELECT id FROM users WHERE email = 'redaksi@warkopnusantara.id'),
  (SELECT id FROM wilayah WHERE kode = '00'),
  'terbit', 1975, '2026-06-20 08:00:00', '2026-06-18 15:00:00', '2026-06-20 08:00:00'
),
(
  'Pentingnya Pengawasan Sipil Dalam Demokrasi',
  'pentingnya-pengawasan-sipil-dalam-demokrasi',
  'Analisis peran aktif masyarakat sipil dalam menjaga keseimbangan kekuasaan pemerintahan lokal.',
  '<p>Analisis peran aktif masyarakat sipil dalam menjaga keseimbangan kekuasaan pemerintahan lokal.</p><p>Demokrasi tidak berhenti di bilik suara. Setelah pemilihan usai, kekuasaan yang dititipkan rakyat perlu diawasi setiap hari: bagaimana anggaran dibelanjakan, bagaimana layanan diberikan, dan bagaimana keputusan diambil.</p><h2>Hak atas informasi publik</h2><p>Undang-undang keterbukaan informasi memberi setiap warga hak untuk meminta dokumen publik. Hak ini adalah alat pengawasan paling dasar, namun masih jarang dipakai. Lembaga swadaya seperti kami berperan mendampingi warga menggunakannya.</p><h2>Pengawasan yang beradab</h2><p>Pengawasan sipil bukan berarti curiga pada semua orang. Ia berarti meminta bukti, membaca dokumen, dan menyampaikan temuan melalui jalur yang sah. Keberanian yang lahir dari kebenaran, bukan dari prasangka.</p>',
  '/penampung/artikel-9.jpg',
  (SELECT id FROM kategori_artikel WHERE slug = 'opini-publik'),
  (SELECT id FROM users WHERE email = 'redaksi@warkopnusantara.id'),
  (SELECT id FROM wilayah WHERE kode = '00'),
  'terbit', 688, '2026-07-02 09:00:00', '2026-07-01 11:00:00', '2026-07-02 09:00:00'
),
(
  'Indikasi Penyelewengan Dana Desa Mekarsari',
  'indikasi-penyelewengan-dana-desa-mekarsari',
  'Hasil pemeriksaan awal relawan pengawas terhadap laporan realisasi anggaran sebuah desa yang dalam artikel ini disebut Mekarsari.',
  '<p>Hasil pemeriksaan awal relawan pengawas terhadap laporan realisasi anggaran sebuah desa yang dalam artikel ini disebut Mekarsari (nama samaran).</p><p>Warga melaporkan bahwa beberapa kegiatan yang tercantum dalam laporan realisasi tidak pernah mereka saksikan. Relawan kemudian membandingkan dokumen dengan kondisi lapangan dan mewawancarai warga di sekitar lokasi kegiatan.</p><h2>Indikasi yang dicatat</h2><p>Terdapat selisih antara volume pekerjaan yang dilaporkan dan yang terukur, serta bukti pembayaran yang tidak lengkap. Seluruh catatan telah disusun dalam berita acara.</p><p>Laporan ini telah diserahkan ke aparat pengawas fungsional. Sesuai prinsip praduga tak bersalah, kami tidak menyebut nama perorangan sampai proses resmi memberikan kesimpulan.</p>',
  '/penampung/artikel-10.jpg',
  (SELECT id FROM kategori_artikel WHERE slug = 'investigasi'),
  (SELECT id FROM users WHERE email = 'budi.santoso@warkopnusantara.id'),
  (SELECT id FROM wilayah WHERE kode = '32'),
  'terbit', 97, '2026-09-01 08:30:00', '2026-08-31 17:00:00', '2026-09-01 08:30:00'
),
(
  'Laporan Infrastruktur Jalan Rusak di Kab. Bandung',
  'laporan-infrastruktur-jalan-rusak-di-kab-bandung',
  'Kompilasi laporan warga tentang ruas jalan kabupaten yang rusak berat dan belum tersentuh perbaikan selama dua musim hujan.',
  '<p>Kompilasi laporan warga tentang ruas jalan kabupaten yang rusak berat dan belum tersentuh perbaikan selama dua musim hujan.</p><p>Relawan memetakan titik-titik kerusakan dengan foto berkoordinat dan mengelompokkannya menurut tingkat bahaya bagi pengguna jalan. Beberapa titik berada di jalur yang dilalui angkutan anak sekolah.</p><h2>Langkah berikutnya</h2><p>Kami akan menyampaikan peta kerusakan kepada instansi terkait dan meminta jadwal perbaikan yang dapat dipantau publik.</p><p>Artikel ini masih berupa draf dan menunggu verifikasi data lapangan.</p>',
  '/penampung/artikel-11.jpg',
  (SELECT id FROM kategori_artikel WHERE slug = 'fasilitas-umum'),
  (SELECT id FROM users WHERE email = 'siti.aminah@warkopnusantara.id'),
  (SELECT id FROM wilayah WHERE kode = '32'),
  'draf', 0, NULL, '2026-08-28 10:10:00', '2026-08-28 10:10:00'
),
(
  'Opini: Transparansi Anggaran Pendidikan 2025',
  'opini-transparansi-anggaran-pendidikan-2025',
  'Mengapa rincian belanja pendidikan daerah harus mudah dibaca orang tua murid, bukan hanya auditor.',
  '<p>Mengapa rincian belanja pendidikan daerah harus mudah dibaca orang tua murid, bukan hanya auditor.</p><p>Anggaran pendidikan adalah salah satu pos terbesar dalam belanja daerah. Namun, dokumen anggaran umumnya disajikan dalam format yang sulit dipahami warga awam. Akibatnya, pengawasan hanya bergantung pada auditor resmi yang jumlahnya terbatas.</p><h2>Usulan kami</h2><p>Setiap sekolah negeri sebaiknya memasang ringkasan anggaran dan realisasinya di papan pengumuman dan situs resmi. Komite sekolah perlu dilibatkan dalam pembahasan anggaran sejak awal, bukan hanya saat pengesahan.</p><p>Transparansi bukan ancaman bagi pengelola yang bekerja dengan benar. Ia justru melindungi mereka dari prasangka.</p>',
  '/penampung/artikel-12.jpg',
  (SELECT id FROM kategori_artikel WHERE slug = 'opini-publik'),
  (SELECT id FROM users WHERE email = 'redaksi@warkopnusantara.id'),
  (SELECT id FROM wilayah WHERE kode = '00'),
  'terbit', 421, '2026-07-28 09:00:00', '2026-07-27 14:00:00', '2026-07-28 09:00:00'
);

-- Tag artikel utama (tampak di detail_artikel_investigasi: Investigasi | Keadilan Sosial | Transparansi)
INSERT IGNORE INTO tag (nama, slug) VALUES ('Investigasi', 'investigasi'), ('Keadilan Sosial', 'keadilan-sosial'), ('Transparansi', 'transparansi'), ('Dana Desa', 'dana-desa'), ('Pelayanan Publik', 'pelayanan-publik');
INSERT IGNORE INTO artikel_tag (artikel_id, tag_id)
SELECT a.id, t.id FROM artikel a JOIN tag t ON t.slug IN ('investigasi', 'keadilan-sosial', 'transparansi')
WHERE a.slug = 'membongkar-tabir-ketidakadilan-laporan-khusus-dari-garis-depan';
INSERT IGNORE INTO artikel_tag (artikel_id, tag_id)
SELECT a.id, t.id FROM artikel a JOIN tag t ON t.slug IN ('investigasi', 'dana-desa')
WHERE a.slug IN ('dugaan-penyelewengan-dana-desa-di-sektor-infrastruktur-terungkap', 'indikasi-penyelewengan-dana-desa-mekarsari', 'audit-dana-desa-kuartal-iii-temuan-awal');
INSERT IGNORE INTO artikel_tag (artikel_id, tag_id)
SELECT a.id, t.id FROM artikel a JOIN tag t ON t.slug IN ('pelayanan-publik')
WHERE a.slug IN ('fasilitas-kesehatan-mangkrak-di-daerah-pelosok', 'rapat-dengar-pendapat-mengenai-kualitas-air-bersih-regional');

-- ---------------------------------------------------------------------
-- PENGADUAN CONTOH — 3 laporan (1 anonim, 2 bernama) berstatus awal 'baru'
-- dengan baris riwayat pertama. Perpindahan status berikutnya dilakukan oleh
-- scripts/seed.js melalui ubahStatusPengaduan() (satu-satunya jalan sah).
-- Nomor dari layar desain (#WRP-9021 dst.) dilengkapi menjadi 6 digit.
-- Identitas pelapor bernama = data fiktif.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO pengaduan (nomor_kasus, anonim, nama_pelapor, nik_pelapor, telepon_pelapor, email_pelapor, kategori_masalah, wilayah_id, lokasi_kejadian, deskripsi, status, petugas_id, dibuat_pada, diperbarui_pada) VALUES
(
  'WRP-009021', 1, NULL, NULL, NULL, NULL, 'pungli',
  (SELECT id FROM wilayah WHERE kode = '32'), 'Jawa Barat, Kab. Bogor',
  'Terdapat praktik pungutan liar yang dilakukan oleh oknum berseragam preman di perempatan jalan raya utama menuju pasar induk. Mereka memaksa setiap truk pengangkut sayur untuk membayar sejumlah uang tanpa memberikan karcis resmi. Kejadian ini terpantau rutin setiap pagi hari antara pukul 04:00 hingga 06:00 WIB.',
  'baru', NULL, '2026-09-02 14:30:00', '2026-09-02 14:30:00'
),
(
  'WRP-009018', 0, 'Pelapor Contoh Satu', '3201010101010001', '081200000001', 'pelapor.satu@example.com', 'pelayanan-publik',
  (SELECT id FROM wilayah WHERE kode = '31'), 'DKI Jakarta, Jakarta Timur',
  'Pelayanan pengurusan dokumen kependudukan di kantor kelurahan memakan waktu lebih dari tiga minggu tanpa kejelasan, dan petugas meminta warga datang berulang kali dengan alasan yang berubah-ubah.',
  'baru', NULL, '2026-08-30 10:15:00', '2026-08-30 10:15:00'
),
(
  'WRP-008994', 0, 'Pelapor Contoh Dua', '3301010101010002', '081200000002', 'pelapor.dua@example.com', 'infrastruktur',
  (SELECT id FROM wilayah WHERE kode = '33'), 'Jawa Tengah, Kab. Semarang',
  'Jembatan penghubung dua dusun mengalami kerusakan pada bagian lantai sejak banjir tiga bulan lalu. Warga memasang papan seadanya dan sudah dua kali melapor ke pemerintah desa tanpa tindak lanjut.',
  'baru', NULL, '2026-08-08 09:00:00', '2026-08-08 09:00:00'
);

INSERT INTO pengaduan_riwayat (pengaduan_id, status_sebelum, status_sesudah, catatan, oleh_user_id, dibuat_pada)
SELECT p.id, NULL, 'baru', 'Laporan diterima', NULL, p.dibuat_pada
FROM pengaduan p
WHERE p.nomor_kasus IN ('WRP-009021', 'WRP-009018', 'WRP-008994')
  AND NOT EXISTS (SELECT 1 FROM pengaduan_riwayat r WHERE r.pengaduan_id = p.id);

-- ---------------------------------------------------------------------
-- PENGURUS — dari struktur_organisasi/code.html (foto = penampung lokal).
-- KEPUTUSAN BARU: nama pengurus regional Papua & Maluku pada export desain
-- adalah nama pejabat nyata; diganti nama fiktif.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO pengurus (id, nama, jabatan, tingkat, wilayah_id, foto, deskripsi, aktif_sejak, urutan, aktif) VALUES
  (1, 'Bpk. H. Soedirman',   'Ketua Umum',         'pusat',   NULL, '/penampung/pengurus-1.jpg', 'Memimpin dan mengarahkan seluruh visi serta misi pengawasan nasional.', 2011, 1, 1),
  (2, 'Ibu Hj. Ratna Sari',  'Sekretaris Jenderal', 'pusat',   NULL, '/penampung/pengurus-2.jpg', 'Mengoordinasikan dewan eksekutif dan administrasi lembaga.',         2015, 2, 1),
  (3, 'Ir. Rahmat Siregar',  'Kepala Regional',    'wilayah', (SELECT id FROM wilayah WHERE kode = '12'), '/penampung/pengurus-3.jpg', 'Kepala Regional Sumatera Utara.', 2021, 1, 1),
  (4, 'Dr. Budi Santoso',    'Kepala Regional',    'wilayah', (SELECT id FROM wilayah WHERE kode = '35'), '/penampung/pengurus-4.jpg', 'Kepala Regional Jawa & Bali.',     2019, 2, 1),
  (5, 'Yohanes Rumbiak, S.H.', 'Kepala Regional',  'wilayah', (SELECT id FROM wilayah WHERE kode = '91'), '/penampung/pengurus-5.jpg', 'Kepala Regional Papua & Maluku.',  2022, 3, 1);

-- ---------------------------------------------------------------------
-- PROGRAM — 3 (satu per kategori), dari program_kegiatan/code.html
-- ---------------------------------------------------------------------
INSERT IGNORE INTO program (judul, slug, ringkasan, isi, gambar, kategori, status, wilayah_id, mulai_pada, selesai_pada, dibuat_pada) VALUES
  ('Pengawasan Alokasi Dana Desa Regional III', 'pengawasan-alokasi-dana-desa-regional-iii',
   'Pemantauan implementasi dan distribusi dana desa untuk proyek infrastruktur jalan dan fasilitas sanitasi. Memastikan tidak ada penyelewengan anggaran publik.',
   '<p>Pemantauan implementasi dan distribusi dana desa untuk proyek infrastruktur jalan dan fasilitas sanitasi. Memastikan tidak ada penyelewengan anggaran publik.</p><p>Program ini melatih relawan desa membaca dokumen anggaran dan memverifikasi keluaran fisik, lalu menyalurkan temuan melalui kanal pengaduan resmi.</p>',
   '/penampung/program-1.jpg', 'pengawasan-dana', 'berjalan', (SELECT id FROM wilayah WHERE kode = '35'), '2023-10-01', NULL, '2026-06-01 09:00:00'),
  ('Evaluasi Kebijakan Parkir Elektronik Kota', 'evaluasi-kebijakan-parkir-elektronik-kota',
   'Studi lapangan dan pengumpulan data terkait keluhan masyarakat terhadap implementasi sistem parkir elektronik baru yang dianggap memberatkan UMKM sekitar.',
   '<p>Studi lapangan dan pengumpulan data terkait keluhan masyarakat terhadap implementasi sistem parkir elektronik baru yang dianggap memberatkan UMKM sekitar.</p><p>Hasil observasi telah disampaikan kepada pemangku kebijakan dalam bentuk rekomendasi tertulis.</p>',
   '/penampung/program-2.jpg', 'observasi-kebijakan', 'selesai', (SELECT id FROM wilayah WHERE kode = '31'), '2023-01-01', '2023-06-30', '2026-06-01 09:00:00'),
  ('Advokasi Sengketa Lahan Warga Bantaran', 'advokasi-sengketa-lahan-warga-bantaran',
   'Pendampingan hukum bagi 45 kepala keluarga yang mengalami penggusuran paksa tanpa prosedur ganti rugi yang sesuai standar operasional yang berlaku.',
   '<p>Pendampingan hukum bagi 45 kepala keluarga yang mengalami penggusuran paksa tanpa prosedur ganti rugi yang sesuai standar operasional yang berlaku.</p><p>Tim bantuan hukum mendampingi warga menempuh jalur resmi: mediasi, pengaduan ke lembaga pengawas, dan bila perlu, gugatan.</p>',
   '/penampung/program-3.jpg', 'bantuan-hukum', 'berjalan', (SELECT id FROM wilayah WHERE kode = '32'), '2023-11-01', NULL, '2026-06-01 09:00:00');

-- ---------------------------------------------------------------------
-- GALERI — 6 (dua per kategori), dari galeri_dokumentasi/code.html
-- ---------------------------------------------------------------------
INSERT IGNORE INTO galeri (id, judul, deskripsi, jenis, berkas, thumbnail, kategori, wilayah_id, lokasi, tanggal_kegiatan, dibuat_pada) VALUES
  (1, 'Dialog Terbuka: Transparansi Dana Desa',
      'Perwakilan warga berdiskusi langsung dengan perangkat desa terkait alokasi anggaran infrastruktur tahun berjalan, difasilitasi oleh tim Warkop Nusantara.',
      'foto', '/penampung/galeri-1.jpg', NULL, 'audiensi-publik', (SELECT id FROM wilayah WHERE kode = '32'), 'Balai Desa, Kab. Bogor', '2023-10-12', '2026-06-01 09:00:00'),
  (2, 'Pengecekan Proyek Irigasi', 'Relawan memeriksa saluran irigasi yang dilaporkan tidak berfungsi.',
      'foto', '/penampung/galeri-2.jpg', NULL, 'investigasi-lapangan', (SELECT id FROM wilayah WHERE kode = '33'), 'Kab. Klaten', '2023-10-05', '2026-06-01 09:00:00'),
  (3, 'Kampanye Hak Lapor Warga', 'Sosialisasi kanal pengaduan dan hak atas informasi publik di pasar rakyat.',
      'video', '/penampung/galeri-3.mp4', '/penampung/galeri-3.jpg', 'sosialisasi', (SELECT id FROM wilayah WHERE kode = '31'), 'Jakarta Timur', '2023-10-01', '2026-06-01 09:00:00'),
  (4, 'Kajian Dokumen AMDAL', 'Tim advokasi menelaah dokumen lingkungan bersama warga pesisir.',
      'foto', '/penampung/galeri-4.jpg', NULL, 'investigasi-lapangan', (SELECT id FROM wilayah WHERE kode = '36'), 'Kab. Serang', '2023-09-28', '2026-06-01 09:00:00'),
  (5, 'Pelatihan Relawan Pengawas', 'Pelatihan membaca dokumen anggaran bagi relawan pengawas desa.',
      'foto', '/penampung/galeri-5.jpg', NULL, 'sosialisasi', (SELECT id FROM wilayah WHERE kode = '35'), 'Kota Malang', '2023-09-20', '2026-06-01 09:00:00'),
  (6, 'Pemetaan Kawasan Sengketa', 'Relawan memetakan batas lahan yang disengketakan bersama warga bantaran.',
      'foto', '/penampung/galeri-6.jpg', NULL, 'investigasi-lapangan', (SELECT id FROM wilayah WHERE kode = '32'), 'Kab. Bekasi', '2023-09-15', '2026-06-01 09:00:00');

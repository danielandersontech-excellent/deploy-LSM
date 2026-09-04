-- =====================================================================
--  database/migrations/20260904-1510-pengurus-dpp-data.sql — RUN QA-2 A2: STRUKTUR DPP asli pemilik (sumber: perintah
--  pemilik 4 Sep 2026; rujukan visual aset-pemilik/struktur-dpp.jpg TIDAK ADA di repo -> teks perintah = sumber kebenaran).
--  Mengganti SELURUH pengurus contoh (Tahap 4/5) dengan susunan DPP. Posisi kosong = nama '(Belum terisi)'. Foto = siluet
--  penampung. JALANKAN SEKALI (idempoten karena id tetap & INSERT ... ON DUPLICATE KEY UPDATE), SETELAH 20260904-1500.
--  Perhatian: menjalankan ulang mengembalikan nama/jabatan ke nilai di sini (perubahan pemilik lewat Kelola Pengurus akan
--  tertimpa untuk id 1-45); id di luar itu tidak disentuh. Pengurus contoh lama (id 1-5 Tahap 4) dihapus dulu (SELECT dulu).
-- =====================================================================
DELETE FROM pengurus WHERE id BETWEEN 1 AND 5 AND nama IN ('Bpk. H. Soedirman','Ibu Hj. Ratna Sari','Ir. Rahmat Siregar','Dr. Budi Santoso','Yohanes Rumbiak, S.H.');

INSERT INTO pengurus (id, nama, jabatan, tingkat, kelompok, wilayah_id, foto, deskripsi, aktif_sejak, urutan, aktif) VALUES
  -- DEWAN PEMBINA
  (1,  'Jonni Tan',                    'Ketua',   'pusat', 'dewan_pembina',   NULL, '/penampung/pengurus-1.jpg', NULL, NULL, 1, 1),
  (2,  'Florida Herawati',             'Wakil',   'pusat', 'dewan_pembina',   NULL, '/penampung/pengurus-2.jpg', NULL, NULL, 2, 1),
  (3,  'Sukri Tambusai',               'Anggota', 'pusat', 'dewan_pembina',   NULL, '/penampung/pengurus-3.jpg', NULL, NULL, 3, 1),
  -- DEWAN PENASEHAT
  (4,  '(Belum terisi)',               'Ketua',   'pusat', 'dewan_penasehat', NULL, '/penampung/pengurus-4.jpg', NULL, NULL, 1, 1),
  (5,  '(Belum terisi)',               'Wakil',   'pusat', 'dewan_penasehat', NULL, '/penampung/pengurus-5.jpg', NULL, NULL, 2, 1),
  (6,  '(Belum terisi)',               'Anggota', 'pusat', 'dewan_penasehat', NULL, '/penampung/pengurus-1.jpg', NULL, NULL, 3, 1),
  -- DEWAN PENGAWAS
  (7,  '(Belum terisi)',               'Ketua',   'pusat', 'dewan_pengawas',  NULL, '/penampung/pengurus-2.jpg', NULL, NULL, 1, 1),
  (8,  '(Belum terisi)',               'Wakil',   'pusat', 'dewan_pengawas',  NULL, '/penampung/pengurus-3.jpg', NULL, NULL, 2, 1),
  (9,  '(Belum terisi)',               'Anggota', 'pusat', 'dewan_pengawas',  NULL, '/penampung/pengurus-4.jpg', NULL, NULL, 3, 1),
  -- PENGURUS DPP
  (10, 'Boy Juan',                     'Ketua Umum',          'pusat', 'pengurus_dpp', NULL, '/penampung/pengurus-5.jpg', NULL, NULL, 1, 1),
  (11, '(Belum terisi)',               'Wakil Ketua Umum',    'pusat', 'pengurus_dpp', NULL, '/penampung/pengurus-1.jpg', NULL, NULL, 2, 1),
  (12, 'Johan Elvianus Hondro',        'Sekretaris Jenderal', 'pusat', 'pengurus_dpp', NULL, '/penampung/pengurus-2.jpg', NULL, NULL, 3, 1),
  (13, 'Sonia',                        'Bendahara Umum',      'pusat', 'pengurus_dpp', NULL, '/penampung/pengurus-3.jpg', NULL, NULL, 4, 1),
  -- DIREKTORAT EKSEKUTIF
  (14, 'Andreas Reynaldho, S.H., M.H.', 'Direktur',       'pusat', 'direktorat_eksekutif', NULL, '/penampung/pengurus-4.jpg', NULL, NULL, 1, 1),
  (15, '(Belum terisi)',               'Wakil Direktur', 'pusat', 'direktorat_eksekutif', NULL, '/penampung/pengurus-5.jpg', NULL, NULL, 2, 1),
  -- DIREKTORAT (bidang)
  (16, 'Dian',                         'Direktorat Hukum dan Advokasi',                       'pusat', 'direktorat', NULL, '/penampung/pengurus-1.jpg', NULL, NULL, 1, 1),
  (17, 'Sopan Pangabean, S.H.',        'Direktorat Investigasi',                              'pusat', 'direktorat', NULL, '/penampung/pengurus-2.jpg', NULL, NULL, 2, 1),
  (18, 'Arsyad',                       'Direktorat Pengawasan Kebijakan Publik',              'pusat', 'direktorat', NULL, '/penampung/pengurus-3.jpg', NULL, NULL, 3, 1),
  (19, 'Jasrivai Manulang, S.H.',      'Direktorat Organisasi dan Kaderisasi',                'pusat', 'direktorat', NULL, '/penampung/pengurus-4.jpg', NULL, NULL, 4, 1),
  (20, 'Kak Utet',                     'Direktorat Sosial dan Kemanusiaan',                   'pusat', 'direktorat', NULL, '/penampung/pengurus-5.jpg', NULL, NULL, 5, 1),
  (21, 'Ronald Eldiner, S.H.',         'Direktorat Lingkungan Hidup',                         'pusat', 'direktorat', NULL, '/penampung/pengurus-1.jpg', NULL, NULL, 6, 1),
  (22, 'Roy Jensen Sidabutar, S.Kom.', 'Direktorat Media',                                    'pusat', 'direktorat', NULL, '/penampung/pengurus-2.jpg', NULL, NULL, 7, 1),
  (23, 'Yefrizal, S.E.',               'Direktorat Humas dan Kerja Sama Antar Lembaga',       'pusat', 'direktorat', NULL, '/penampung/pengurus-3.jpg', NULL, NULL, 8, 1),
  (24, 'Dedek',                        'Direktorat Pemberdayaan Masyarakat dan UMKM',         'pusat', 'direktorat', NULL, '/penampung/pengurus-4.jpg', NULL, NULL, 9, 1),
  -- SATGAS
  (25, 'Kanisius',                     'Kepala Satgas (Kasatgas)', 'pusat', 'satgas', NULL, '/penampung/pengurus-5.jpg', NULL, NULL, 1, 1),
  (26, '(Belum terisi)',               'Wakil Kasatgas',           'pusat', 'satgas', NULL, '/penampung/pengurus-1.jpg', NULL, NULL, 2, 1),
  (27, '(Belum terisi)',               'Komandan Wilayah',         'pusat', 'satgas', NULL, '/penampung/pengurus-2.jpg', NULL, NULL, 3, 1),
  (28, '(Belum terisi)',               'Komandan Daerah',          'pusat', 'satgas', NULL, '/penampung/pengurus-3.jpg', NULL, NULL, 4, 1),
  (29, '(Belum terisi)',               'Komandan Rayon',           'pusat', 'satgas', NULL, '/penampung/pengurus-4.jpg', NULL, NULL, 5, 1),
  (30, '(Belum terisi)',               'Anggota',                  'pusat', 'satgas', NULL, '/penampung/pengurus-5.jpg', NULL, NULL, 6, 1),
  -- KERANGKA DPW / DPD / DPC (template posisi tanpa nama, tanpa wilayah)
  (31, '(Belum terisi)', 'Ketua DPW',      'wilayah', 'dpw', NULL, NULL, NULL, NULL, 1, 1),
  (32, '(Belum terisi)', 'Sekretaris DPW', 'wilayah', 'dpw', NULL, NULL, NULL, NULL, 2, 1),
  (33, '(Belum terisi)', 'Bendahara DPW',  'wilayah', 'dpw', NULL, NULL, NULL, NULL, 3, 1),
  (34, '(Belum terisi)', 'Ketua DPD',      'wilayah', 'dpd', NULL, NULL, NULL, NULL, 1, 1),
  (35, '(Belum terisi)', 'Sekretaris DPD', 'wilayah', 'dpd', NULL, NULL, NULL, NULL, 2, 1),
  (36, '(Belum terisi)', 'Bendahara DPD',  'wilayah', 'dpd', NULL, NULL, NULL, NULL, 3, 1),
  (37, '(Belum terisi)', 'Ketua DPC',      'wilayah', 'dpc', NULL, NULL, NULL, NULL, 1, 1),
  (38, '(Belum terisi)', 'Sekretaris DPC', 'wilayah', 'dpc', NULL, NULL, NULL, NULL, 2, 1),
  (39, '(Belum terisi)', 'Bendahara DPC',  'wilayah', 'dpc', NULL, NULL, NULL, NULL, 3, 1)
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jabatan = VALUES(jabatan), tingkat = VALUES(tingkat), kelompok = VALUES(kelompok),
  wilayah_id = VALUES(wilayah_id), foto = VALUES(foto), urutan = VALUES(urutan), aktif = VALUES(aktif);

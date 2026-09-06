-- RUN QA-5 — data uji LOKAL untuk bagan piramida /struktur. HANYA untuk basis data lokal (warkop-mariadb),
-- TIDAK PERNAH dijalankan di produksi. Idempoten (INSERT ... ON DUPLICATE KEY UPDATE).
-- Bagian 1 = salinan 20 baris tingkat pusat produksi (SELECT 5 Sep 2026; foto unggahan Ketua Umum diganti penampung
--            karena berkasnya tidak ada di laptop). Bagian 2 = baris uji tambahan id 900+ untuk kasus piramida:
--   dewan_penasehat 5 orang (puncak, wakil, baris 3 kartu), dewan_pengawas celah urutan (1, 3, 4 -> baris kedua dilewati),
--   direktorat investigasi 5 orang (puncak, wakil, 2 + 1 berjajar di lebar lg), satgas 6 orang (3 + 1).
SET NAMES utf8mb4;
-- baris pusat lokal lama yang tidak ada di produksi dinonaktifkan supaya bagan hanya berisi data uji yang disengaja
UPDATE pengurus SET aktif = 0 WHERE tingkat = 'pusat' AND id NOT IN (1,2,3,10,12,14,16,19,21,22,23,24,25,43,44,45,46,47,48,50) AND id < 900;

INSERT INTO pengurus (id, nama, jabatan, tingkat, kelompok, bagian, wilayah_id, foto, deskripsi, aktif_sejak, urutan, aktif) VALUES
 (1,  'Jonni Tan',                        'Ketua Dewan Pembina DPP Warkop Nusantara',                      'pusat', 'dewan_pembina',   NULL, NULL, '/penampung/pengurus-1.jpg', NULL, 2026, 1, 1),
 (2,  'Florida Herawati, S.H.',           'Wakil Ketua Dewan Pembina DPP Warkop Nusantara',                'pusat', 'dewan_pembina',   NULL, NULL, '/penampung/pengurus-2.jpg', NULL, 2026, 2, 1),
 (45, 'Azwir Irvananda, S.Kom.',          'Ketua Dewan Penasehat DPP Warkop Nusantara',                    'pusat', 'dewan_penasehat', NULL, NULL, NULL, NULL, 2026, 1, 1),
 (44, 'Jhon Arifin',                      'Ketua Dewan Pengawas DPP Warkop Nusantara',                     'pusat', 'dewan_pengawas',  NULL, NULL, NULL, NULL, 2026, 1, 1),
 (10, 'Boy Joean',                        'Ketua Umum DPP Warkop Nusantara',                               'pusat', 'pengurus_dpp',    NULL, NULL, '/penampung/pengurus-5.jpg', NULL, 2026, 1, 1),
 (3,  'Sukri Tambusai, S.H.',             'Wakil Ketua Umum DPP Warkop Nusantara',                         'pusat', 'pengurus_dpp',    NULL, NULL, '/penampung/pengurus-3.jpg', NULL, 2026, 2, 1),
 (14, 'Andreas Reynaldho, S.H., M.H.',    'Sekretaris Jenderal DPP Warkop Nusantara',                      'pusat', 'pengurus_dpp',    NULL, NULL, '/penampung/pengurus-4.jpg', NULL, 2026, 3, 1),
 (43, 'Soni',                             'Bendahara Umum DPP Warkop Nusantara',                           'pusat', 'pengurus_dpp',    NULL, NULL, NULL, NULL, 2026, 4, 1),
 (16, 'Dian Lestari Gultom, S.H.',        'Direktur Hukum dan Advokasi DPP Warkop Nusantara',              'pusat', 'direktorat', 'hukum-advokasi',               NULL, '/penampung/pengurus-1.jpg', NULL, 2026, 1, 1),
 (12, 'Johan Elvianus Hondro',            'Direktur Humas dan Kerjasama Antar Lembaga DPP Warkop Nusantara', 'pusat', 'direktorat', 'humas-kerja-sama',           NULL, '/penampung/pengurus-2.jpg', NULL, 2026, 1, 1),
 (23, 'Yefrizal, S.E.',                   'Wakil Direktur Humas dan Kerja Sama Antar Lembaga DPP Warkop Nusantara', 'pusat', 'direktorat', 'humas-kerja-sama', NULL, '/penampung/pengurus-3.jpg', NULL, 2026, 2, 1),
 (21, 'Ronald Eldiner, S.H.',             'Direktur Lingkungan Hidup DPP Warkop Nusantara',                'pusat', 'direktorat', 'lingkungan-hidup',             NULL, '/penampung/pengurus-1.jpg', NULL, 2026, 1, 1),
 (22, 'Roy Jensen Sidabutar, S.Kom.',     'Direktur Media DPP Warkop Nusantara',                           'pusat', 'direktorat', 'media',                        NULL, '/penampung/pengurus-2.jpg', NULL, 2026, 1, 1),
 (48, 'Arpan Damanik, S.H., M.H.',        'Direktur Organisasi dan Kaderisasi DPP Warkop Nusantara',       'pusat', 'direktorat', 'organisasi-kaderisasi',        NULL, NULL, NULL, 2026, 1, 1),
 (24, 'Dedek Kurniati',                   'Direktur Pemberdayaan Masyarakat dan UMKM DPP Warkop Nusantara', 'pusat', 'direktorat', 'pemberdayaan-masyarakat-umkm', NULL, '/penampung/pengurus-4.jpg', NULL, 2026, 1, 1),
 (50, 'Arsyad',                           'Direktur Pengawasan Kebijakan Publik DPP Warkop Nusantara',     'pusat', 'direktorat', 'pengawasan-kebijakan-publik',  NULL, NULL, NULL, 2026, 1, 1),
 (19, 'Jasrivai Manulang, S.H.',          'Direktur Penyuluhan dan Sosialisasi DPP Warkop Nusantara',      'pusat', 'direktorat', 'penyuluhan-sosialisasi',       NULL, '/penampung/pengurus-4.jpg', NULL, 2026, 1, 1),
 (46, 'Edy Susanto',                      'Direktur Perlindungan Perempuan dan Anak (PPA) DPP Warkop Nusantara', 'pusat', 'direktorat', 'perlindungan-perempuan-anak', NULL, NULL, NULL, 2026, 1, 1),
 (47, 'Rahmaida Br. Sihombing',           'Direktur Sosial dan Kemanusiaan DPP Warkop Nusantara',          'pusat', 'direktorat', 'sosial-kemanusiaan',           NULL, NULL, NULL, 2026, 1, 1),
 (25, 'Kanisius Emi Ujan',                'Kasatgas DPP Warkop Nusantara',                                 'pusat', 'satgas',          NULL, NULL, '/penampung/pengurus-5.jpg', NULL, 2026, 1, 1),
 -- Bagian 2: baris uji tambahan (nama fiktif uji, K1: bukan orang sungguhan)
 (901, 'Uji Wakil Penasehat',   'Wakil Ketua Dewan Penasehat',   'pusat', 'dewan_penasehat', NULL, NULL, '/penampung/pengurus-2.jpg', NULL, 2026, 2, 1),
 (902, 'Uji Anggota Penasehat A', 'Anggota Dewan Penasehat',     'pusat', 'dewan_penasehat', NULL, NULL, NULL, NULL, 2026, 3, 1),
 (903, 'Uji Anggota Penasehat B', 'Anggota Dewan Penasehat',     'pusat', 'dewan_penasehat', NULL, NULL, '/penampung/pengurus-3.jpg', NULL, 2026, 4, 1),
 (904, 'Uji Anggota Penasehat C', 'Anggota Dewan Penasehat',     'pusat', 'dewan_penasehat', NULL, NULL, NULL, NULL, 2026, 5, 1),
 (905, 'Uji Anggota Pengawas A', 'Anggota Dewan Pengawas',       'pusat', 'dewan_pengawas',  NULL, NULL, NULL, NULL, 2026, 3, 1),
 (906, 'Uji Anggota Pengawas B', 'Anggota Dewan Pengawas',       'pusat', 'dewan_pengawas',  NULL, NULL, '/penampung/pengurus-4.jpg', NULL, 2026, 4, 1),
 (907, 'Uji Direktur Investigasi', 'Direktur Investigasi',       'pusat', 'direktorat', 'investigasi', NULL, '/penampung/pengurus-1.jpg', NULL, 2026, 1, 1),
 (908, 'Uji Wakil Investigasi',  'Wakil Direktur Investigasi',   'pusat', 'direktorat', 'investigasi', NULL, NULL, NULL, 2026, 2, 1),
 (909, 'Uji Anggota Investigasi A', 'Anggota Direktorat Investigasi', 'pusat', 'direktorat', 'investigasi', NULL, '/penampung/pengurus-5.jpg', NULL, 2026, 3, 1),
 (910, 'Uji Anggota Investigasi B', 'Anggota Direktorat Investigasi', 'pusat', 'direktorat', 'investigasi', NULL, NULL, NULL, 2026, 4, 1),
 (911, 'Uji Anggota Investigasi C', 'Anggota Direktorat Investigasi', 'pusat', 'direktorat', 'investigasi', NULL, NULL, NULL, 2026, 5, 1),
 (912, 'Uji Wakasatgas',          'Wakil Kepala Satgas',          'pusat', 'satgas', NULL, NULL, '/penampung/pengurus-2.jpg', NULL, 2026, 2, 1),
 (913, 'Uji Komandan Wilayah',    'Komandan Wilayah',             'pusat', 'satgas', NULL, NULL, NULL, NULL, 2026, 3, 1),
 (914, 'Uji Komandan Daerah',     'Komandan Daerah',              'pusat', 'satgas', NULL, NULL, '/penampung/pengurus-3.jpg', NULL, 2026, 4, 1),
 (915, 'Uji Komandan Rayon',      'Komandan Rayon',               'pusat', 'satgas', NULL, NULL, NULL, NULL, 2026, 5, 1),
 (916, 'Uji Anggota Satgas',      'Anggota Satgas',               'pusat', 'satgas', NULL, NULL, '/penampung/pengurus-4.jpg', NULL, 2026, 6, 1)
ON DUPLICATE KEY UPDATE nama = VALUES(nama), jabatan = VALUES(jabatan), tingkat = VALUES(tingkat), kelompok = VALUES(kelompok),
 bagian = VALUES(bagian), wilayah_id = VALUES(wilayah_id), foto = VALUES(foto), deskripsi = VALUES(deskripsi),
 aktif_sejak = VALUES(aktif_sejak), urutan = VALUES(urutan), aktif = VALUES(aktif);

SELECT id, kelompok, bagian, urutan, jabatan, nama FROM pengurus WHERE tingkat = 'pusat' AND aktif = 1
ORDER BY FIELD(kelompok,'dewan_pembina','dewan_penasehat','dewan_pengawas','pengurus_dpp','direktorat','satgas'), bagian, urutan, nama;

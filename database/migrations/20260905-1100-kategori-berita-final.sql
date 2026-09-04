-- =====================================================================
--  database/migrations/20260905-1100-kategori-berita-final.sql — RUN QA-4 butir A (PERINTAH PEMILIK)
--  Kategori berita FINAL: 11 kategori dengan urutan tetap (lib/kategoriBerita.js):
--    Nasional; Daerah; Hukum; Kebijakan Publik; Investigasi; Lingkungan; Pekerja; UMKM; Sosial; PPA; Podcash.
--
--  PRINSIP:
--    * id lama dan relasi artikel AMAN: Investigasi (id 1) dipertahankan apa adanya; kategori baru
--      memakai id eksplisit 6-15 (auto_increment produksi sudah di 6) dan kunci unik slug menjaga
--      pengulangan (ON DUPLICATE KEY UPDATE hanya menyentuh nama/urutan/ikon/aktif).
--    * kategori lama di luar daftar TIDAK DIHAPUS: artikelnya DIPETAKAN ke kategori baru terdekat,
--      lalu kategori lamanya DINONAKTIFKAN (kolom baru `aktif`). Pemetaan:
--        siaran-pers     -> nasional         (pernyataan resmi lembaga pusat)
--        opini-publik    -> kebijakan-publik (opini/analisis kebijakan)
--        kegiatan-daerah -> daerah           (kegiatan kantor regional)
--        fasilitas-umum  -> kebijakan-publik (kondisi fasilitas & layanan publik)
--    * ikon = nama Material Symbols dari 77 ikon resmi proyek (BUKAN emoji); kolom baru `ikon`.
--  Idempoten: ADD COLUMN IF NOT EXISTS, INSERT ... ON DUPLICATE KEY UPDATE, UPDATE bersyarat.
-- =====================================================================

-- kolom baru
ALTER TABLE kategori_artikel ADD COLUMN IF NOT EXISTS ikon  VARCHAR(40) NOT NULL DEFAULT 'article' AFTER urutan;
ALTER TABLE kategori_artikel ADD COLUMN IF NOT EXISTS aktif TINYINT(1) NOT NULL DEFAULT 1 AFTER ikon;

-- 11 kategori final (Investigasi tetap id 1; sisanya id 6-15)
INSERT INTO kategori_artikel (id, nama, slug, deskripsi, urutan, ikon, aktif) VALUES
  (6,  'Nasional',         'nasional',         'Berita dan sikap lembaga pada isu tingkat nasional',          1,  'account_balance',   1),
  (7,  'Daerah',           'daerah',           'Liputan dan kegiatan pengawasan di kabupaten/kota/provinsi',   2,  'location_on',       1),
  (8,  'Hukum',            'hukum',            'Penegakan hukum, advokasi, dan bantuan hukum',                3,  'gavel',             1),
  (9,  'Kebijakan Publik', 'kebijakan-publik', 'Regulasi, anggaran, dan pelayanan publik',                    4,  'policy',            1),
  (1,  'Investigasi',      'investigasi',      'Laporan investigasi lapangan tim pengawas',                   5,  'zoom_in',           1),
  (10, 'Lingkungan',       'lingkungan',       'Lingkungan hidup dan sumber daya alam',                       6,  'explore',           1),
  (11, 'Pekerja',          'pekerja',          'Buruh, pekerja, dan ketenagakerjaan',                         7,  'badge',             1),
  (12, 'UMKM',             'umkm',             'Usaha mikro, kecil, dan menengah',                            8,  'sell',              1),
  (13, 'Sosial',           'sosial',           'Isu kemasyarakatan dan kemanusiaan',                          9,  'forum',             1),
  (14, 'PPA',              'ppa',              'Perlindungan perempuan dan anak',                             10, 'shield',            1),
  (15, 'Podcash',          'podcash',          'Konten suara dan siniar WARKOP NUSANTARA',                    11, 'record_voice_over', 1)
ON DUPLICATE KEY UPDATE nama = VALUES(nama), urutan = VALUES(urutan), ikon = VALUES(ikon), aktif = 1;

-- pemetaan artikel dari kategori lama ke kategori baru terdekat (hanya bila kategori lamanya ada)
UPDATE artikel a JOIN kategori_artikel l ON l.id = a.kategori_id AND l.slug = 'siaran-pers'
   SET a.kategori_id = (SELECT id FROM kategori_artikel WHERE slug = 'nasional');
UPDATE artikel a JOIN kategori_artikel l ON l.id = a.kategori_id AND l.slug = 'opini-publik'
   SET a.kategori_id = (SELECT id FROM kategori_artikel WHERE slug = 'kebijakan-publik');
UPDATE artikel a JOIN kategori_artikel l ON l.id = a.kategori_id AND l.slug = 'kegiatan-daerah'
   SET a.kategori_id = (SELECT id FROM kategori_artikel WHERE slug = 'daerah');
UPDATE artikel a JOIN kategori_artikel l ON l.id = a.kategori_id AND l.slug = 'fasilitas-umum'
   SET a.kategori_id = (SELECT id FROM kategori_artikel WHERE slug = 'kebijakan-publik');

-- kategori lama dinonaktifkan (tidak dihapus); urutan digeser ke belakang agar tidak menyela urutan final
UPDATE kategori_artikel SET aktif = 0, urutan = 90 + id
 WHERE slug IN ('siaran-pers', 'opini-publik', 'kegiatan-daerah', 'fasilitas-umum');

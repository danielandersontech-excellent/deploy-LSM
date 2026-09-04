-- =====================================================================
--  database/migrations/20260905-1000-pengaturan-sosial-peta.sql — RUN QA-3 D2 + E
--  Menambah kunci pengaturan BARU (tanpa menyentuh nilai kunci yang sudah ada, termasuk yang
--  sudah disunting pemilik): tautan peta kantor pusat dan empat kanal media sosial.
--  Nilai bawaan mengikuti lib/pengaturanDefinisi.js. Idempoten (INSERT IGNORE).
--  Kunci sosial selain TikTok sengaja KOSONG: footer hanya menampilkan yang terisi.
-- =====================================================================
INSERT IGNORE INTO pengaturan (kunci, nilai, deskripsi, diperbarui_pada) VALUES
  ('kontak_peta_url',  'https://www.google.com/maps/dir/?api=1&destination=0.504192,101.427052', 'Tautan petunjuk arah ke kantor pusat (footer, tab baru)', UTC_TIMESTAMP()),
  ('sosial_tiktok',    'https://www.tiktok.com/@warkop.nusantara_media', 'Akun TikTok resmi', UTC_TIMESTAMP()),
  ('sosial_instagram', '', 'Akun Instagram resmi (kosong = tidak ditampilkan)', UTC_TIMESTAMP()),
  ('sosial_youtube',   '', 'Kanal YouTube resmi (kosong = tidak ditampilkan)', UTC_TIMESTAMP()),
  ('sosial_facebook',  '', 'Halaman Facebook resmi (kosong = tidak ditampilkan)', UTC_TIMESTAMP());

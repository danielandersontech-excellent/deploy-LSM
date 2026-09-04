-- =====================================================================
--  database/migrations/20260905-1030-kategori-program.sql — RUN QA-3 butir F
--  Kategori program menjadi DINAMIS (bisa ditambah pemilik lewat ruang staf, aturan K3).
--
--  Yang TIDAK berubah, supaya relasi lama aman:
--    * kolom program.kategori TETAP VARCHAR berisi SLUG (bukan diganti foreign key), sehingga
--      seluruh baris program yang sudah ada, tautan filter publik /program?kategori=<slug>,
--      dan indeks idx_program_kategori tetap berlaku apa adanya;
--    * tabel baru di bawah hanyalah DAFTAR kategori yang boleh dipakai + labelnya.
--
--  Idempoten: CREATE TABLE IF NOT EXISTS + INSERT IGNORE.
--  Seed awal = tiga kategori yang sudah dipakai (lib/kategoriProgram.js sebelum QA-3), ditambah
--  kategori apa pun yang sudah terlanjur ada di tabel program (tidak mungkin ada yang tertinggal).
-- =====================================================================
CREATE TABLE IF NOT EXISTS kategori_program (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama    VARCHAR(80) NOT NULL,
  slug    VARCHAR(50) NOT NULL,
  ikon    VARCHAR(40) NOT NULL DEFAULT 'explore',
  urutan  INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kategori_program_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO kategori_program (nama, slug, ikon, urutan) VALUES
  ('Pengawasan Dana',     'pengawasan-dana',     'account_balance', 1),
  ('Observasi Kebijakan', 'observasi-kebijakan', 'policy',          2),
  ('Bantuan Hukum',       'bantuan-hukum',       'gavel',           3);

-- Kategori yang sudah dipakai baris program tetapi belum terdaftar (aman bila tidak ada).
INSERT IGNORE INTO kategori_program (nama, slug, ikon, urutan)
SELECT p.kategori, p.kategori, 'explore', 90
  FROM (SELECT DISTINCT kategori FROM program) p
 WHERE p.kategori IS NOT NULL AND p.kategori <> '';

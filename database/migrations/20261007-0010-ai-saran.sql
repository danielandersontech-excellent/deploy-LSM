-- =====================================================================
--  database/migrations/20261007-0010-ai-saran.sql — RUN AI-1 (Asisten Berita AI)
--  Tabel baru `ai_saran`: hasil riset + draf yang ditulis AI (Claude + web search) untuk REDAKSI.
--    * muatan JSON  : {judul, ringkasan, isiHtml, kategoriSlug, tag[], kueriGambar[], catatanVerifikasi[], sumberRiset[]}
--                     -> sumberRiset dan catatanVerifikasi HANYA untuk staf; tidak pernah masuk badan artikel/publik.
--    * gambar_*     : foto berlisensi (Pexels/Pixabay/Openverse/Wikimedia CC0-PD) yang diunduh saat "Gunakan draf ini";
--                     gambar_sumber = asal foto INTERNAL (penyedia, judul/pembuat, lisensi, url asal) — tidak tampil ke publik.
--    * status       : baru -> dipakai (artikel draf dibuat) | dibersihkan (>7 hari tidak dipakai: berkas gambar dihapus).
--    * kelompok     : satu panggilan API menghasilkan 2-3 saran; token_masuk/keluar/jumlah_pencarian dicatat sama pada
--                     tiap baris satu kelompok (biaya per panggilan = DISTINCT kelompok). Kuota 10 panggilan/pengguna/hari
--                     dihitung dari DISTINCT kelompok per hari (WIB).
--  Kolom penanda `artikel.ai_saran_id`: artikel yang lahir dari saran AI (pita "Draf AI" di editor + panel sumber riset).
--  Idempoten: CREATE TABLE IF NOT EXISTS, ADD COLUMN/INDEX IF NOT EXISTS, kunci asing lewat pemeriksaan information_schema.
-- =====================================================================

CREATE TABLE IF NOT EXISTS ai_saran (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  kelompok          CHAR(32)     NOT NULL,
  topik             VARCHAR(120) NOT NULL,
  muatan            JSON         NOT NULL,
  gambar_jalur      VARCHAR(255) NULL,
  gambar_sumber     JSON         NULL,
  status            ENUM('baru','dipakai','dibersihkan') NOT NULL DEFAULT 'baru',
  pemakai_id        INT UNSIGNED NOT NULL,
  artikel_id        INT UNSIGNED NULL,
  model             VARCHAR(60)  NOT NULL,
  token_masuk       INT UNSIGNED NOT NULL DEFAULT 0,
  token_keluar      INT UNSIGNED NOT NULL DEFAULT 0,
  jumlah_pencarian  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  dibuat_pada       DATETIME NOT NULL,
  diperbarui_pada   DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_ai_saran_pemakai_waktu (pemakai_id, dibuat_pada),
  KEY idx_ai_saran_status_waktu (status, dibuat_pada),
  KEY idx_ai_saran_kelompok (kelompok),
  CONSTRAINT fk_ai_saran_pemakai FOREIGN KEY (pemakai_id) REFERENCES users (id)   ON DELETE RESTRICT,
  CONSTRAINT fk_ai_saran_artikel FOREIGN KEY (artikel_id) REFERENCES artikel (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE artikel ADD COLUMN IF NOT EXISTS ai_saran_id INT UNSIGNED NULL AFTER wilayah_id;
ALTER TABLE artikel ADD INDEX IF NOT EXISTS idx_artikel_ai_saran (ai_saran_id);

-- kunci asing artikel.ai_saran_id -> ai_saran.id (SET NULL bila saran dihapus); dipasang hanya bila belum ada
SET @ada_fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'artikel' AND CONSTRAINT_NAME = 'fk_artikel_ai_saran');
SET @sql := IF(@ada_fk = 0,
  'ALTER TABLE artikel ADD CONSTRAINT fk_artikel_ai_saran FOREIGN KEY (ai_saran_id) REFERENCES ai_saran (id) ON DELETE SET NULL',
  'SELECT "fk_artikel_ai_saran sudah ada"');
PREPARE p FROM @sql;
EXECUTE p;
DEALLOCATE PREPARE p;

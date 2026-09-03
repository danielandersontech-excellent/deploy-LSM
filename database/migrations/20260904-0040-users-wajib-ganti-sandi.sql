-- =====================================================================
--  sql/03-users-wajib-ganti-sandi.sql — Tahap 7 (kelola pengguna)
--  Salinan identik: database/migrations/20260904-0040-users-wajib-ganti-sandi.sql
--
--  Menambah kolom users.wajib_ganti_sandi: 1 = pengguna WAJIB mengganti kata sandi pada
--  login berikutnya (disetel superadmin saat reset kata sandi; dihapus setelah pengguna
--  mengganti sandinya sendiri lewat /staf/ganti-sandi). Idempoten (IF NOT EXISTS).
--  Jalankan SADAR lewat docker exec (ALUR 5), tidak otomatis saat aplikasi menyala.
-- =====================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS wajib_ganti_sandi TINYINT(1) NOT NULL DEFAULT 0 AFTER token_version;

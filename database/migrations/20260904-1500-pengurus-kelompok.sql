-- =====================================================================
--  database/migrations/20260904-1500-pengurus-kelompok.sql — RUN QA-2 A2 (struktur DPP asli pemilik)
--  Menambah kolom pengurus.kelompok (slug dari lib/kelompokPengurus.js): dewan_pembina, dewan_penasehat,
--  dewan_pengawas, pengurus_dpp, direktorat_eksekutif, direktorat, satgas, dpw, dpd, dpc.
--  Idempoten (IF NOT EXISTS). Jalankan SADAR lewat docker exec (PENERAPAN G.2), lokal & produksi.
--  Isi data DPP ada di migrasi berikutnya (20260904-1510-pengurus-dpp-data.sql).
-- =====================================================================
ALTER TABLE pengurus ADD COLUMN IF NOT EXISTS kelompok VARCHAR(40) NULL AFTER tingkat;
ALTER TABLE pengurus ADD INDEX IF NOT EXISTS idx_pengurus_kelompok_urutan (kelompok, urutan);

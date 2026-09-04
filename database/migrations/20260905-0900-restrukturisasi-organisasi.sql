-- =====================================================================
--  database/migrations/20260905-0900-restrukturisasi-organisasi.sql — RUN QA-3 butir A1 + A2
--  (PERINTAH PEMILIK 4 September 2026).
--
--  A1. Susunan kelompok final (lib/kelompokPengurus.js):
--        dewan_pembina, dewan_penasehat, dewan_pengawas, pengurus_dpp, direktorat, satgas,
--        dpw (tingkat provinsi), korda (Koordinator Daerah, tingkat kabupaten/kota).
--      DIHAPUS dari sistem: dpc dan direktorat_eksekutif. Kelompok lama dpd -> korda.
--  A2. Direktorat dibagi menjadi 12 BAGIAN; kolom baru `pengurus.bagian` menyimpan slug bagian.
--
--  PRINSIP MIGRASI INI (pemilik baru saja menyunting data pengurus di produksi):
--    * IDEMPOTEN: aman dijalankan berulang.
--    * TIDAK PERNAH MENIMPA nama, jabatan, urutan, foto, atau deskripsi baris mana pun.
--    * Hanya tiga jenis perubahan yang dilakukan:
--        (a) menambah kolom `bagian` + indeks;
--        (b) memetakan kelompok lama yang sudah tidak ada (dpd -> korda);
--        (c) mengisi `bagian` untuk baris direktorat yang belum punya, DITEBAK DARI TEKS JABATAN
--            yang ditulis pemilik sendiri (hanya bila bagian masih NULL);
--        (d) MENONAKTIFKAN (aktif = 0, TIDAK menghapus) baris yang kelompoknya tidak ada di
--            susunan final, termasuk baris tanpa kelompok. Orangnya dilaporkan ke pemilik untuk
--            ditempatkan ulang lewat Kelola Pengurus.
--    * Baris kerangka "(Belum terisi)" TIDAK dibuat: kerangka bagan dirender dari definisi
--      lib/kelompokPengurus.js, sehingga Kelola Pengurus tidak penuh baris kosong.
--
--  Jalankan SADAR lewat docker exec (PENERAPAN G.2), lokal lalu produksi.
-- =====================================================================

-- (a) kolom bagian + indeks -------------------------------------------------------------------
ALTER TABLE pengurus ADD COLUMN IF NOT EXISTS bagian VARCHAR(60) NULL AFTER kelompok;
ALTER TABLE pengurus ADD INDEX IF NOT EXISTS idx_pengurus_kelompok_bagian (kelompok, bagian, urutan);

-- (b) kelompok lama dpd (Dewan Pimpinan Daerah) menjadi korda (Koordinator Daerah) -------------
UPDATE pengurus SET kelompok = 'korda' WHERE kelompok = 'dpd';

-- (c) memetakan baris Direktorat ke bagian, hanya bila `bagian` masih NULL --------------------
--     Cocokkan dari teks jabatan yang ditulis pemilik. Tidak ada teks jabatan yang diubah.
UPDATE pengurus SET bagian = 'hukum-advokasi'                WHERE kelompok = 'direktorat' AND bagian IS NULL AND jabatan LIKE '%Hukum%';
UPDATE pengurus SET bagian = 'investigasi'                   WHERE kelompok = 'direktorat' AND bagian IS NULL AND jabatan LIKE '%Investigasi%';
UPDATE pengurus SET bagian = 'pengawasan-kebijakan-publik'   WHERE kelompok = 'direktorat' AND bagian IS NULL AND jabatan LIKE '%Kebijakan%';
UPDATE pengurus SET bagian = 'organisasi-kaderisasi'         WHERE kelompok = 'direktorat' AND bagian IS NULL AND (jabatan LIKE '%Kaderisasi%' OR jabatan LIKE '%Organisasi%');
UPDATE pengurus SET bagian = 'sosial-kemanusiaan'            WHERE kelompok = 'direktorat' AND bagian IS NULL AND (jabatan LIKE '%Kemanusiaan%' OR jabatan LIKE '%Sosial dan%');
UPDATE pengurus SET bagian = 'lingkungan-hidup'              WHERE kelompok = 'direktorat' AND bagian IS NULL AND jabatan LIKE '%Lingkungan%';
UPDATE pengurus SET bagian = 'humas-kerja-sama'              WHERE kelompok = 'direktorat' AND bagian IS NULL AND (jabatan LIKE '%Humas%' OR jabatan LIKE '%Kerja Sama%' OR jabatan LIKE '%Kerjasama%');
UPDATE pengurus SET bagian = 'pemberdayaan-masyarakat-umkm'  WHERE kelompok = 'direktorat' AND bagian IS NULL AND (jabatan LIKE '%UMKM%' OR jabatan LIKE '%Pemberdayaan%');
UPDATE pengurus SET bagian = 'ketenagakerjaan-buruh-pekerja' WHERE kelompok = 'direktorat' AND bagian IS NULL AND (jabatan LIKE '%Ketenagakerjaan%' OR jabatan LIKE '%Buruh%' OR jabatan LIKE '%Pekerja%');
UPDATE pengurus SET bagian = 'perlindungan-perempuan-anak'   WHERE kelompok = 'direktorat' AND bagian IS NULL AND (jabatan LIKE '%Perempuan%' OR jabatan LIKE '%PPA%');
UPDATE pengurus SET bagian = 'penyuluhan-sosialisasi'        WHERE kelompok = 'direktorat' AND bagian IS NULL AND (jabatan LIKE '%Penyuluhan%' OR jabatan LIKE '%Sosialisasi%');
-- 'media' diperiksa TERAKHIR: kata "Media" juga muncul di frasa lain (mis. "Media Sosial").
UPDATE pengurus SET bagian = 'media'                         WHERE kelompok = 'direktorat' AND bagian IS NULL AND jabatan LIKE '%Media%';

-- Bagian hanya bermakna untuk kelompok direktorat; kelompok lain dikosongkan.
UPDATE pengurus SET bagian = NULL WHERE kelompok <> 'direktorat' AND bagian IS NOT NULL;

-- (d) nonaktifkan baris di luar susunan final (TIDAK DIHAPUS) ---------------------------------
--     Termasuk: kelompok dpc / direktorat_eksekutif yang ditiadakan, dan baris tanpa kelompok
--     (mis. kartu "Sekjen DPP" yang tampil nyasar di bagian Pimpinan Regional).
UPDATE pengurus
   SET aktif = 0
 WHERE aktif = 1
   AND (kelompok IS NULL OR kelompok = ''
        OR kelompok NOT IN ('dewan_pembina','dewan_penasehat','dewan_pengawas','pengurus_dpp','direktorat','satgas','dpw','korda'));

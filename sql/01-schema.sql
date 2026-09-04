-- =====================================================================
--  database/schema.sql — WARKOP NUSANTARA (MariaDB 11)
--  Struktur basis data, REFERENSI bagian 10. Salinan identik: sql/01-schema.sql
--
--  ATURAN (REFERENSI 10, 14):
--   * Kolom waktu bertipe DATETIME, TIDAK memakai DEFAULT CURRENT_TIMESTAMP —
--     seluruh nilai waktu diisi dari aplikasi (lib/utils.js waktuSekarang()) dalam WIB.
--   * Charset utf8mb4_unicode_ci.
--   * Idempoten: seluruh CREATE memakai IF NOT EXISTS, aman dijalankan dua kali.
--   * Jangan pernah mengubah berkas ini untuk basis data yang sudah berjalan;
--     buat berkas di database/migrations/ (lihat README di sana).
--
--  KEPUTUSAN ON DELETE (dijelaskan di DATABASE.md):
--   * pengaduan_riwayat.pengaduan_id  -> RESTRICT  (buku besar tidak boleh lenyap;
--     pengaduan memakai penghapusan lunak lewat kolom dihapus_pada)
--   * pengaduan_lampiran.pengaduan_id -> RESTRICT  (bukti tidak ikut lenyap)
--   * artikel.penulis_id              -> RESTRICT  (akun dinonaktifkan, bukan dihapus;
--     artikel tidak boleh lenyap bersama akun)
--   * artikel.kategori_id             -> RESTRICT  (aturan 7: tidak ada artikel tanpa kategori)
--   * *.wilayah_id, users.wilayah_id  -> SET NULL  (wilayah dihapus = data tetap ada, tanpa wilayah)
--   * pengaduan.petugas_id, pengaduan_riwayat.oleh_user_id, audit_log.user_id -> SET NULL
--   * artikel_tag.*                   -> CASCADE   (relasi murni)
-- =====================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+07:00';

-- ---------------------------------------------------------------------
-- wilayah — pusat, provinsi, kabupaten/kota (hierarki lewat induk_id)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wilayah (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama       VARCHAR(100) NOT NULL,
  jenis      ENUM('pusat','provinsi','kabupaten_kota') NOT NULL,
  induk_id   INT UNSIGNED NULL,
  kode       VARCHAR(10)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wilayah_kode (kode),
  KEY idx_wilayah_induk (induk_id),
  KEY idx_wilayah_jenis (jenis),
  CONSTRAINT fk_wilayah_induk FOREIGN KEY (induk_id) REFERENCES wilayah (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- users — staf. Peran terkunci sebagai ENUM (keputusan pemilik, 5 peran).
-- token_version WAJIB: dinaikkan = seluruh JWT lama pengguna itu batal.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama             VARCHAR(100) NOT NULL,
  email            VARCHAR(190) NOT NULL,
  kata_sandi_hash  VARCHAR(100) NOT NULL,
  peran            ENUM('superadmin','redaktur','penulis','verifikator','pimpinan_wilayah') NOT NULL,
  wilayah_id       INT UNSIGNED NULL,
  aktif            TINYINT(1) NOT NULL DEFAULT 1,
  token_version    INT UNSIGNED NOT NULL DEFAULT 0,
  -- Tahap 7/9: 1 = wajib ganti kata sandi pada login berikutnya (disetel saat reset oleh superadmin).
  -- Instalasi lama: jalankan database/migrations/20260904-0040-users-wajib-ganti-sandi.sql (idempoten).
  wajib_ganti_sandi TINYINT(1) NOT NULL DEFAULT 0,
  terakhir_masuk   DATETIME NULL,
  dibuat_pada      DATETIME NOT NULL,
  diperbarui_pada  DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_peran (peran),
  KEY idx_users_wilayah (wilayah_id),
  CONSTRAINT fk_users_wilayah FOREIGN KEY (wilayah_id) REFERENCES wilayah (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- kategori_artikel
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kategori_artikel (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama       VARCHAR(80)  NOT NULL,
  slug       VARCHAR(80)  NOT NULL,
  deskripsi  VARCHAR(255) NULL,
  urutan     INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kategori_artikel_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- artikel
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artikel (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  judul            VARCHAR(255) NOT NULL,
  slug             VARCHAR(255) NOT NULL,
  ringkasan        TEXT NULL,
  isi              LONGTEXT NOT NULL,
  gambar_utama     VARCHAR(255) NULL,
  kategori_id      INT UNSIGNED NOT NULL,
  penulis_id       INT UNSIGNED NOT NULL,
  wilayah_id       INT UNSIGNED NULL,
  status           ENUM('draf','terbit','arsip') NOT NULL DEFAULT 'draf',
  jumlah_dibaca    INT UNSIGNED NOT NULL DEFAULT 0,
  terbit_pada      DATETIME NULL,
  dibuat_pada      DATETIME NOT NULL,
  diperbarui_pada  DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_artikel_slug (slug),
  KEY idx_artikel_status_terbit (status, terbit_pada DESC),
  KEY idx_artikel_kategori (kategori_id),
  KEY idx_artikel_penulis (penulis_id),
  KEY idx_artikel_wilayah (wilayah_id),
  CONSTRAINT fk_artikel_kategori FOREIGN KEY (kategori_id) REFERENCES kategori_artikel (id) ON DELETE RESTRICT,
  CONSTRAINT fk_artikel_penulis  FOREIGN KEY (penulis_id)  REFERENCES users (id)            ON DELETE RESTRICT,
  CONSTRAINT fk_artikel_wilayah  FOREIGN KEY (wilayah_id)  REFERENCES wilayah (id)          ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- tag, artikel_tag — relasi banyak-ke-banyak
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tag (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama  VARCHAR(60) NOT NULL,
  slug  VARCHAR(60) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tag_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS artikel_tag (
  artikel_id INT UNSIGNED NOT NULL,
  tag_id     INT UNSIGNED NOT NULL,
  PRIMARY KEY (artikel_id, tag_id),
  KEY idx_artikel_tag_tag (tag_id),
  CONSTRAINT fk_artikel_tag_artikel FOREIGN KEY (artikel_id) REFERENCES artikel (id) ON DELETE CASCADE,
  CONSTRAINT fk_artikel_tag_tag     FOREIGN KEY (tag_id)     REFERENCES tag (id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- pengaduan — DATA SENSITIF. Empat kolom identitas NULLABLE (anonim = semua NULL).
-- Identitas hanya boleh di-SELECT untuk superadmin/verifikator (lib/db/pengaduan.js).
-- kategori_masalah = slug dari lib/kategoriPengaduan.js (VARCHAR, bukan ENUM).
-- dihapus_pada = penghapusan lunak (KEPUTUSAN BARU Tahap 1); tidak ada DELETE fisik.
-- lokasi_kejadian = teks bebas "Wilayah Kejadian" dari formulir (KEPUTUSAN BARU Tahap 1),
--   melengkapi wilayah_id (provinsi) untuk penyaringan pimpinan_wilayah.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pengaduan (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nomor_kasus       VARCHAR(16) NOT NULL,
  anonim            TINYINT(1) NOT NULL DEFAULT 0,
  nama_pelapor      VARCHAR(150) NULL,
  nik_pelapor       VARCHAR(16)  NULL,
  telepon_pelapor   VARCHAR(30)  NULL,
  email_pelapor     VARCHAR(190) NULL,
  kategori_masalah  VARCHAR(50)  NOT NULL,
  wilayah_id        INT UNSIGNED NULL,
  lokasi_kejadian   VARCHAR(200) NULL,
  deskripsi         TEXT NOT NULL,
  status            ENUM('baru','diverifikasi','diproses','selesai','ditolak') NOT NULL DEFAULT 'baru',
  petugas_id        INT UNSIGNED NULL,
  dihapus_pada      DATETIME NULL,
  dibuat_pada       DATETIME NOT NULL,
  diperbarui_pada   DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pengaduan_nomor (nomor_kasus),
  KEY idx_pengaduan_status_dibuat (status, dibuat_pada DESC),
  KEY idx_pengaduan_wilayah (wilayah_id),
  KEY idx_pengaduan_petugas (petugas_id),
  KEY idx_pengaduan_kategori (kategori_masalah),
  CONSTRAINT fk_pengaduan_wilayah FOREIGN KEY (wilayah_id) REFERENCES wilayah (id) ON DELETE SET NULL,
  CONSTRAINT fk_pengaduan_petugas FOREIGN KEY (petugas_id) REFERENCES users (id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- pengaduan_lampiran — bukti; nama berkas diganti acak oleh aplikasi (Tahap 6)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pengaduan_lampiran (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pengaduan_id  INT UNSIGNED NOT NULL,
  nama_berkas   VARCHAR(255) NOT NULL,
  path          VARCHAR(255) NOT NULL,
  tipe_mime     VARCHAR(100) NOT NULL,
  ukuran        INT UNSIGNED NOT NULL,
  dibuat_pada   DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_lampiran_pengaduan (pengaduan_id),
  CONSTRAINT fk_lampiran_pengaduan FOREIGN KEY (pengaduan_id) REFERENCES pengaduan (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- pengaduan_riwayat — TABEL BUKU BESAR (cetak biru bagian 7).
-- Setiap perpindahan status: status_sebelum (NULL saat laporan dibuat) -> status_sesudah.
-- Ditulis HANYA oleh lib/db/pengaduan.js ubahStatusPengaduan() dalam satu transaksi
-- bersama UPDATE pengaduan.status. Tidak boleh ada jalan lain.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pengaduan_riwayat (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pengaduan_id    INT UNSIGNED NOT NULL,
  status_sebelum  ENUM('baru','diverifikasi','diproses','selesai','ditolak') NULL,
  status_sesudah  ENUM('baru','diverifikasi','diproses','selesai','ditolak') NOT NULL,
  catatan         TEXT NULL,
  oleh_user_id    INT UNSIGNED NULL,
  dibuat_pada     DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_riwayat_pengaduan_waktu (pengaduan_id, dibuat_pada),
  KEY idx_riwayat_oleh (oleh_user_id),
  CONSTRAINT fk_riwayat_pengaduan FOREIGN KEY (pengaduan_id) REFERENCES pengaduan (id) ON DELETE RESTRICT,
  CONSTRAINT fk_riwayat_oleh      FOREIGN KEY (oleh_user_id) REFERENCES users (id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- pengurus — struktur organisasi (pusat & wilayah)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pengurus (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama         VARCHAR(150) NOT NULL,
  jabatan      VARCHAR(100) NOT NULL,
  tingkat      ENUM('pusat','wilayah') NOT NULL,
  -- QA-2 A2: kelompok bagan (lib/kelompokPengurus.js); instalasi lama: migrasi 20260904-1500
  kelompok     VARCHAR(40) NULL,
  -- QA-3 A2: bagian direktorat (lib/kelompokPengurus.js); instalasi lama: migrasi 20260905-0900
  bagian       VARCHAR(60) NULL,
  wilayah_id   INT UNSIGNED NULL,
  foto         VARCHAR(255) NULL,
  deskripsi    TEXT NULL,
  aktif_sejak  SMALLINT UNSIGNED NULL,
  urutan       INT NOT NULL DEFAULT 0,
  aktif        TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_pengurus_tingkat_urutan (tingkat, urutan),
  KEY idx_pengurus_kelompok_urutan (kelompok, urutan),
  KEY idx_pengurus_kelompok_bagian (kelompok, bagian, urutan),
  KEY idx_pengurus_wilayah (wilayah_id),
  CONSTRAINT fk_pengurus_wilayah FOREIGN KEY (wilayah_id) REFERENCES wilayah (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- program — kategori = slug dari lib/kategoriProgram.js
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS program (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  judul         VARCHAR(255) NOT NULL,
  slug          VARCHAR(255) NOT NULL,
  ringkasan     TEXT NULL,
  isi           LONGTEXT NULL,
  gambar        VARCHAR(255) NULL,
  kategori      VARCHAR(50) NOT NULL,
  status        ENUM('berjalan','selesai') NOT NULL DEFAULT 'berjalan',
  wilayah_id    INT UNSIGNED NULL,
  mulai_pada    DATE NULL,
  selesai_pada  DATE NULL,
  dibuat_pada   DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_program_slug (slug),
  KEY idx_program_status_mulai (status, mulai_pada DESC),
  KEY idx_program_kategori (kategori),
  KEY idx_program_wilayah (wilayah_id),
  CONSTRAINT fk_program_wilayah FOREIGN KEY (wilayah_id) REFERENCES wilayah (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- galeri — kategori = slug dari lib/kategoriGaleri.js
-- lokasi = teks lokasi kegiatan seperti "Balai Desa, Kab. Bogor" (KEPUTUSAN BARU Tahap 1)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS galeri (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  judul             VARCHAR(255) NOT NULL,
  deskripsi         TEXT NULL,
  jenis             ENUM('foto','video') NOT NULL DEFAULT 'foto',
  berkas            VARCHAR(255) NOT NULL,
  thumbnail         VARCHAR(255) NULL,
  kategori          VARCHAR(50) NOT NULL,
  wilayah_id        INT UNSIGNED NULL,
  lokasi            VARCHAR(150) NULL,
  tanggal_kegiatan  DATE NULL,
  dibuat_pada       DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_galeri_tanggal (tanggal_kegiatan DESC),
  KEY idx_galeri_kategori (kategori),
  KEY idx_galeri_wilayah (wilayah_id),
  CONSTRAINT fk_galeri_wilayah FOREIGN KEY (wilayah_id) REFERENCES wilayah (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- pengaturan — kunci-nilai; daftar putih kunci ada di lib/pengaturanDefinisi.js (aturan 8)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pengaturan (
  kunci            VARCHAR(64) NOT NULL,
  nilai            TEXT NULL,
  deskripsi        VARCHAR(255) NULL,
  diperbarui_pada  DATETIME NOT NULL,
  PRIMARY KEY (kunci)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- audit_log — jejak tindakan staf (termasuk setiap pembukaan identitas pelapor)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED NULL,
  aksi           VARCHAR(60) NOT NULL,
  tabel_terkait  VARCHAR(40) NULL,
  id_terkait     INT UNSIGNED NULL,
  detail         JSON NULL,
  ip             VARCHAR(45) NULL,
  dibuat_pada    DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_audit_user_waktu (user_id, dibuat_pada),
  KEY idx_audit_terkait (tabel_terkait, id_terkait),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

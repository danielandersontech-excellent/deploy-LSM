# DATABASE.md — Basis data WARKOP NUSANTARA

MariaDB 11, charset `utf8mb4_unicode_ci`, engine InnoDB. Struktur di
`database/schema.sql` (salinan identik `sql/01-schema.sql`), data awal di
`database/seed.sql` (`sql/02-seed.sql`) + `scripts/seed.js`. Perubahan setelah
basis data berjalan hanya lewat `database/migrations/`.

## Prinsip yang ditegakkan (REFERENSI 10, 14)

1. **Waktu = DATETIME dalam WIB, diisi aplikasi.** Tidak ada `DEFAULT
   CURRENT_TIMESTAMP`. Setiap koneksi pool menjalankan `SET time_zone='+07:00'`
   dan `lib/utils.js waktuSekarang()` menghasilkan WIB dari UTC+7 (tidak
   bergantung zona waktu mesin). Server DB sendiri boleh UTC.
2. **Seluruh SQL di `lib/db/`**, prepared statement (`execute` + `?`) tanpa
   kecuali. Route API dan skrip tidak menulis SQL.
3. **Identitas pelapor** (`nama_pelapor`, `nik_pelapor`, `telepon_pelapor`,
   `email_pelapor`) hanya ikut di-`SELECT` bila pemanggil berhak
   (`bolehLihatIdentitas: true`) — penyaringan di SQL, bukan di JavaScript.
4. **Pembatasan wilayah** untuk `pimpinan_wilayah` = klausa `WHERE wilayah_id = ?`.
5. **Buku besar**: `pengaduan.status` hanya berubah lewat
   `ubahStatusPengaduan()` yang menulis `pengaduan_riwayat` dalam satu transaksi.

## Diagram relasi

```
wilayah ──┬──< users            (users.wilayah_id, SET NULL)
          ├──< artikel          (artikel.wilayah_id, SET NULL)
          ├──< pengaduan        (pengaduan.wilayah_id, SET NULL)
          ├──< pengurus / program / galeri  (wilayah_id, SET NULL)
          └──< wilayah          (induk_id, hierarki pusat > provinsi > kab/kota)

kategori_artikel ──< artikel >── users (penulis_id, RESTRICT)
                        │
                        └──< artikel_tag >── tag        (CASCADE dua arah)

pengaduan ──< pengaduan_riwayat   (RESTRICT; oleh_user_id -> users SET NULL)
          ──< pengaduan_lampiran  (RESTRICT)
          ──  users (petugas_id, SET NULL)

users ──< audit_log (SET NULL)
pengaturan (kunci-nilai, mandiri)
```

## Tabel

### `wilayah`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INT UNSIGNED PK | |
| nama | VARCHAR(100) | |
| jenis | ENUM pusat/provinsi/kabupaten_kota | |
| induk_id | INT UNSIGNED NULL → wilayah.id | hierarki |
| kode | VARCHAR(10) UNIQUE | kode BPS provinsi; `00` = Pusat |

Seed: 1 pusat + 38 provinsi.

### `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | PK | |
| nama, email (UNIQUE) | | email disimpan huruf kecil |
| kata_sandi_hash | VARCHAR(100) | bcrypt biaya 12; `'!'` = penampung, tidak bisa masuk |
| peran | ENUM superadmin/redaktur/penulis/verifikator/pimpinan_wilayah | terkunci (keputusan pemilik) |
| wilayah_id | NULL → wilayah | wajib bermakna untuk pimpinan_wilayah |
| aktif | TINYINT(1) | akun **tidak pernah dihapus fisik**, dinonaktifkan |
| token_version | INT UNSIGNED | dinaikkan = seluruh JWT lama batal |
| terakhir_masuk, dibuat_pada, diperbarui_pada | DATETIME | diisi aplikasi |

### `kategori_artikel` — id, nama, slug (UNIQUE), deskripsi, urutan. Seed 5 kategori.

### `artikel`
id, judul, slug (UNIQUE), ringkasan, isi (LONGTEXT, HTML tersanitasi di Tahap 5),
gambar_utama, kategori_id (RESTRICT — aturan 7), penulis_id (RESTRICT),
wilayah_id (SET NULL), status ENUM draf/terbit/arsip, jumlah_dibaca,
terbit_pada, dibuat_pada, diperbarui_pada.
Indeks: `(status, terbit_pada DESC)`, `slug`, `kategori_id`, `penulis_id`, `wilayah_id`.

### `tag`, `artikel_tag` — banyak-ke-banyak, CASCADE.

### `pengaduan` — DATA SENSITIF
| Kolom | Keterangan |
|---|---|
| nomor_kasus VARCHAR(16) UNIQUE | `WRP-` + 6 digit acak kriptografis |
| anonim TINYINT(1) | 1 = keempat kolom identitas dipaksa NULL |
| nama_pelapor, nik_pelapor, telepon_pelapor, email_pelapor | **NULLABLE**; hanya superadmin/verifikator |
| kategori_masalah VARCHAR(50) | slug dari `lib/kategoriPengaduan.js` (bukan ENUM: tambah kategori tanpa migrasi) |
| wilayah_id | provinsi, untuk penyaringan pimpinan_wilayah |
| lokasi_kejadian VARCHAR(200) | teks bebas "Wilayah Kejadian" dari formulir (KEPUTUSAN BARU Tahap 1) |
| deskripsi TEXT | |
| status ENUM baru/diverifikasi/diproses/selesai/ditolak | hanya lewat `ubahStatusPengaduan()` |
| petugas_id | SET NULL |
| dihapus_pada DATETIME NULL | penghapusan lunak (KEPUTUSAN BARU Tahap 1) |
| dibuat_pada, diperbarui_pada | |

Indeks: `(status, dibuat_pada DESC)`, `nomor_kasus`, `wilayah_id`, `petugas_id`, `kategori_masalah`.

### `pengaduan_lampiran` — id, pengaduan_id (RESTRICT), nama_berkas, path, tipe_mime, ukuran, dibuat_pada.

### `pengaduan_riwayat` — BUKU BESAR
id, pengaduan_id (RESTRICT), status_sebelum (NULL saat laporan dibuat),
status_sesudah, catatan, oleh_user_id (NULL = sistem/pelapor; SET NULL), dibuat_pada.
Indeks `(pengaduan_id, dibuat_pada)`. Invarian: `status_sesudah` baris N =
`status_sebelum` baris N+1; baris terakhir = `pengaduan.status`.

### `pengurus` — id, nama, jabatan, tingkat ENUM pusat/wilayah, wilayah_id, foto, deskripsi, aktif_sejak (tahun), urutan, aktif.

### `program` — id, judul, slug (UNIQUE), ringkasan, isi, gambar, kategori (slug `lib/kategoriProgram.js`), status ENUM berjalan/selesai, wilayah_id, mulai_pada DATE, selesai_pada DATE, dibuat_pada.

### `galeri` — id, judul, deskripsi, jenis ENUM foto/video, berkas, thumbnail, kategori (slug `lib/kategoriGaleri.js`), wilayah_id, lokasi (KEPUTUSAN BARU Tahap 1), tanggal_kegiatan DATE, dibuat_pada.

### `pengaturan` — kunci (PK), nilai TEXT, deskripsi, diperbarui_pada. Daftar putih kunci = `lib/pengaturanDefinisi.js`.

### `audit_log` — id BIGINT, user_id (SET NULL), aksi, tabel_terkait, id_terkait, detail JSON, ip, dibuat_pada. Indeks `(user_id, dibuat_pada)`, `(tabel_terkait, id_terkait)`. Setiap pembukaan identitas pelapor dicatat di sini (Tahap 6).

## Keputusan `ON DELETE` dan alasannya

| FK | Aturan | Alasan |
|---|---|---|
| `pengaduan_riwayat.pengaduan_id` | RESTRICT | Buku besar lembaga pengawasan tidak boleh lenyap. Pengaduan dihapus **lunak** (`dihapus_pada`); DELETE fisik ditolak DB selama riwayat ada |
| `pengaduan_lampiran.pengaduan_id` | RESTRICT | Bukti mengikuti aturan yang sama |
| `artikel.penulis_id` | RESTRICT | Akun dinonaktifkan (`aktif=0`, token dibatalkan), bukan dihapus; artikel dan atribusi penulis tetap ada |
| `artikel.kategori_id` | RESTRICT | Aturan 7: tidak ada artikel tanpa kategori |
| `artikel_tag.*` | CASCADE | Relasi murni tanpa makna sendiri |
| `*.wilayah_id`, `wilayah.induk_id` | SET NULL | Wilayah dihapus/digabung: data tetap ada tanpa wilayah |
| `pengaduan.petugas_id`, `pengaduan_riwayat.oleh_user_id`, `audit_log.user_id` | SET NULL | Jejak tetap ada walau akun hilang (akun memang tidak dihapus fisik) |

## Nomor kasus

`WRP-` + 6 digit dari `crypto.randomInt(0, 1e6)` (CSPRNG). Tidak berurutan
dan tidak bisa ditebak dari nomor lain; ruang 1.000.000 nomor. Keunikan
dijamin `UNIQUE KEY` + percobaan ulang saat tabrakan (di dalam transaksi
`buatPengaduan`). Halaman pelacakan publik akan dibatasi laju (Tahap 6)
sehingga penjelajahan brute-force tidak praktis.

## Menjalankan

Lihat `PENERAPAN.md` bagian basis data. Ringkas (lokal):

```powershell
Get-Content sql\01-schema.sql -Raw | docker exec -i warkop-mariadb mariadb -uwarkop -p"<sandi>" warkop_nusantara
npm run seed     # butuh SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (+ opsional SEED_STAF_PASSWORD) di .env
```

Seluruh artikel/pengaduan/program/galeri/pengurus seed adalah **konten contoh**
yang wajib ditinjau redaksi sebelum peluncuran publik.

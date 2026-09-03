# Migrasi basis data

Jangan pernah mengubah `schema.sql` untuk basis data yang sudah berjalan.
Buat berkas migrasi baru: `YYYYMMDD-HHmm-penjelasan-singkat.sql`

Setiap migrasi:

- Bisa dijalankan ulang tanpa merusak (`IF NOT EXISTS` bila memungkinkan)
- Menyertakan komentar tentang apa yang diubah dan mengapa
- Diuji di salinan basis data, bukan langsung di produksi

Di server (cetak biru bagian 10):

```bash
sudo docker exec -i <container_db> mariadb -u<user> -p'<sandi>' <db> \
  < migrations/nama-berkas.sql
```

Lokal (Docker Desktop, container `warkop-mariadb`):

```powershell
Get-Content database\migrations\nama-berkas.sql -Raw | docker exec -i warkop-mariadb mariadb -uwarkop -p"<sandi>" warkop_nusantara
```

SELALU jalankan SELECT pemeriksaan sebelum UPDATE atau DELETE.

Catatan: `sql/01-schema.sql` dan `sql/02-seed.sql` adalah salinan identik dari
`database/schema.sql` dan `database/seed.sql` (diverifikasi `cmp` di uji tahap).
Bila mengubah salah satunya sebelum basis data berjalan, salin ulang keduanya.

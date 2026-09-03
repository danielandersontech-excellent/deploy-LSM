# PENERAPAN.md — WARKOP NUSANTARA

Dokumen ini dilengkapi bertahap: Tahap 1 (basis data), Tahap 3 (Docker,
Coolify), Tahap 9 (daftar periksa produksi).

## 1. Basis data (Tahap 1)

Perubahan skema **selalu dijalankan sadar** — tidak pernah otomatis saat
aplikasi menyala (ALUR bagian 5).

### 1.1 Lokal (Docker Desktop)

Kontainer MariaDB 11 (sekali saja; nilai sandi simpan di `.env`, jangan di-commit):

```powershell
docker run -d --name warkop-mariadb `
  -e MARIADB_ROOT_PASSWORD="<sandi-root>" `
  -e MARIADB_DATABASE=warkop_nusantara `
  -e MARIADB_USER=warkop -e MARIADB_PASSWORD="<sandi>" `
  -e TZ=UTC -p 127.0.0.1:3306:3306 `
  -v warkop-mariadb-data:/var/lib/mysql mariadb:11
```

`TZ=UTC` disengaja: server DB boleh UTC — aplikasi menyetel `+07:00` per
koneksi dan mengisi kolom waktu sendiri (aturan 1). Port hanya terikat ke
`127.0.0.1`.

Skema, lalu seed:

```powershell
Get-Content sql\01-schema.sql -Raw | docker exec -i warkop-mariadb mariadb -uwarkop -p"<sandi>" warkop_nusantara
npm run seed
```

`npm run seed` membutuhkan di `.env`: `DB_*`, `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD`; opsional `SEED_STAF_PASSWORD` (mengaktifkan 5 akun
staf contoh — **jangan** diisi di produksi) dan `SEED_RESET_ADMIN=1` (menyetel
ulang kata sandi superadmin yang sudah ada). Keduanya idempoten.

`sql/02-seed.sql` juga bisa dijalankan langsung seperti skema (data statis
saja; superadmin tetap hanya lewat `npm run seed`).

### 1.2 Server (Coolify, container MariaDB terpisah)

```bash
# skema (sekali, pada basis data kosong)
sudo docker exec -i <container_db> mariadb -u<user> -p'<sandi>' warkop_nusantara < sql/01-schema.sql

# seed: dari container aplikasi (ENV rahasia sudah Runtime only di Coolify)
sudo docker exec -i <container_app> node scripts/seed.js
```

Selalu jalankan `SELECT` pemeriksaan sebelum `UPDATE`/`DELETE` manual.
Migrasi berikutnya: `database/migrations/README.md`.

### 1.3 Memeriksa zona waktu di server

```bash
sudo docker exec -i <container_db> mariadb -u<user> -p'<sandi>' warkop_nusantara \
  -e "SELECT @@system_time_zone, NOW();"
curl -s https://<domain>/api/health   # "waktu" harus WIB (+07:00)
```

`NOW()` pada sesi CLI boleh UTC; yang wajib WIB adalah nilai yang ditulis
aplikasi dan `waktu` di `/api/health`.

## 2. Docker & Coolify — Tahap 3

_(diisi di Tahap 3)_

## 3. Daftar periksa produksi — Tahap 9

_(diisi di Tahap 9)_

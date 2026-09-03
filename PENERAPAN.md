# PENERAPAN.md — WARKOP NUSANTARA

Cara menerapkan sistem ke server produksi (Coolify) dan mengelolanya. Bagian
basis data (F) dan lokal (bagian 1) sudah dipakai sejak Tahap 1; bagian
Docker/Coolify dari Tahap 3; daftar periksa produksi dilengkapi Tahap 9.

> **Status (3 September 2026):** domain dan server Coolify **belum ditetapkan
> pemilik**. Seluruh langkah yang menyebut `<domain>`, Coolify, atau `git push`
> menunggu pemilik (lihat `laporan/STATUS.md`). Seluruh bagian lokal sudah diuji.

## Repositori

```
https://github.com/danielandersontech-excellent/deploy-LSM
```

Alur perubahan: kerja langsung di repo, satu commit per tahap, `git push` hanya
atas perintah pemilik (ALUR bagian 4).

---

## A. Persiapan server (cetak biru bagian 2)

Asumsi: Ubuntu + Coolify sudah terpasang.

1. **SSH hanya dengan kunci.** Di `/etc/ssh/sshd_config`:
   `PasswordAuthentication no`, lalu `sudo systemctl restart ssh`.
2. **Panel Coolify tidak terbuka ke internet.** Port 8000 JANGAN dibuka. Akses
   lewat terowongan SSH:
   ```bash
   ssh -i ~/.ssh/id_ed25519 -L 8000:localhost:8000 pengguna@IP_SERVER
   # lalu buka http://localhost:8000
   ```
3. **Buat container MariaDB 11 lebih dulu** lewat Coolify, di *project* yang
   sama dengan aplikasi. **Catat nama containernya** — nama itulah `DB_HOST`.
   Jangan memetakan port 3306 ke publik. Zona waktu container DB boleh UTC.
4. **Arahkan domain** ke IP server (Cloudflare: DNS + proxy), lalu daftarkan
   **kedua** host pada aplikasi di Coolify agar Traefik menerbitkan sertifikat:
   `<domain>` dan `staf.<domain>`.
5. **Buat aplikasi** di Coolify: sumber = repositori Git di atas, *build pack*
   = Dockerfile, port 3000, healthcheck `/api/health`. Isi ENV (bagian B).

## B. Variabel lingkungan (REFERENSI bagian 13)

Di Coolify setiap variabel punya pilihan **Available at Buildtime** /
**Runtime**. Aturannya (pelajaran Cap Jiki nomor 2): **rahasia = Runtime only**;
hanya `NEXT_PUBLIC_*` yang boleh ikut waktu build. Bila rahasia ikut build,
nilainya tercetak terbuka di log build.

> **TEMUAN TAHAP 9 (4 Sep 2026) — KRITIS, TINDAKAN PEMILIK.** `docker history`
> image produksi (commit 3c64be4) menunjukkan Coolify menyuntikkan SELURUH
> variabel yang berstatus *Available at Buildtime* sebagai build-arg pada tiga
> layer `RUN`, termasuk `DB_PASSWORD`, `JWT_SECRET`, `SEED_ADMIN_PASSWORD`
> (bukti: `laporan/bukti-tahap-09/c2-log-build-coolify.txt`, nilai tidak dicetak).
> Artinya di produksi saat ini rahasia itu **belum** Runtime only. Lakukan:
> (1) Coolify → aplikasi → Environment Variables → untuk setiap rahasia matikan
> *Available at Buildtime* (sisakan hanya `NEXT_PUBLIC_*`); (2) Redeploy;
> (3) verifikasi `docker history --no-trunc <image baru> | grep -c DB_PASSWORD`
> = 0; (4) ROTASI ketiga rahasia (rahasia yang pernah masuk layer image dianggap
> bocor) lalu Redeploy lagi. Dockerfile repo tidak mendeklarasikan ARG rahasia —
> ini murni setelan Coolify.

| Nama | Contoh | Waktu | Keterangan |
|---|---|---|---|
| **`DB_HOST`** | `mariadb-xyz` (nama container) | **Runtime only** | rahasia infrastruktur |
| **`DB_PORT`** | `3306` | Runtime only | |
| **`DB_USER`** | `warkop` | **Runtime only** | |
| **`DB_PASSWORD`** | `<kata sandi kuat>` | **RUNTIME ONLY — RAHASIA** | tidak pernah ARG/Buildtime |
| **`DB_NAME`** | `warkop_nusantara` | Runtime only | |
| `DB_POOL_LIMIT` | `10` | Runtime only | |
| **`JWT_SECRET`** | `openssl rand -hex 48` | **RUNTIME ONLY — RAHASIA** | ≥ 32 karakter; mengganti = seluruh sesi keluar |
| `JWT_EXPIRY` | `8h` | Runtime only | |
| **`SEED_ADMIN_EMAIL`** | `admin@<domain>` | **RUNTIME ONLY — RAHASIA** | hanya dipakai `node scripts/seed.js` |
| **`SEED_ADMIN_PASSWORD`** | `<kata sandi kuat>` | **RUNTIME ONLY — RAHASIA** | ganti lewat aplikasi setelah masuk pertama |
| `SEED_STAF_PASSWORD` | *(kosong)* | Runtime only | **JANGAN diisi di produksi** (mengaktifkan 5 akun contoh) |
| `NODE_ENV` | `production` | Runtime | sudah diset Dockerfile |
| `PORT` / `HOSTNAME` | `3000` / `0.0.0.0` | Runtime | sudah diset Dockerfile |
| `TZ` | `Asia/Jakarta` | Runtime | sudah diset Dockerfile |
| `NEXT_TELEMETRY_DISABLED` | `1` | Runtime | |
| `NEXT_PUBLIC_APP_URL` | `https://<domain>` | **Buildtime + Runtime** | publik, tertanam di JS |
| `NEXT_PUBLIC_WS_URL` | *(kosong)* | Buildtime + Runtime | opsional; klien socket menyambung same-origin |
| **`STAF_HOST`** | `staf.<domain>` | Runtime only | **wajib terisi** di produksi; kosong = pemisahan host nonaktif |
| `UPLOAD_DIR` | `/app/public/unggahan` | Runtime only | titik pasang volume (bagian D) |
| `UPLOAD_MAX_MB` | `20` | Runtime only | |
| `UPLOAD_PRIVATE_DIR` | `/app/unggahan-terjaga` | Runtime only | **Tahap 6.** Direktori lampiran PENGADUAN — WAJIB di luar `public/` (berkas di bawah `public/` dilayani statis Next.js, melewati pagar peran). Pasang volume terpisah `warkop-lampiran` → `/app/unggahan-terjaga` di Coolify (Storages). Tanpa volume ini lampiran hilang saat redeploy |

## C. Subdomain

```
<domain>          -> situs publik (beranda, berita, kontak/pengaduan, lacak)
staf.<domain>     -> ruang kerja staf (/login, /staf/*)
```

`proxy.js` mengalihkan `/staf/*` dan `/login` yang datang ke `<domain>` menuju
`https://staf.<domain>…`, dan permintaan non-staf yang datang ke `staf.<domain>`
menuju `/staf/dashboard`. `/api/*` dilayani di kedua host. Cookie sesi terbit
di `staf.<domain>` (httpOnly, Secure, SameSite=Lax) dan tidak dikirim ke host lain.

### C.1 WebSocket (Socket.io, Tahap 8)

Realtime memakai Socket.io pada `server.js` yang sama (path `/socket.io`).
Klien menyambung **same-origin** (`window.location.origin`, jadi `wss://` di
balik HTTPS); `NEXT_PUBLIC_WS_URL` boleh dikosongkan — isi hanya bila socket
dilayani di origin lain (cookie httpOnly `warkop_token` harus tetap terkirim).

- **Traefik/Coolify**: meneruskan `Upgrade: websocket` secara bawaan; tidak
  ada label tambahan. Bila di lain waktu Traefik dipasang manual, pastikan
  router HTTPS untuk `staf.<domain>` tidak menyaring header `Upgrade`/`Connection`.
- **Cloudflare (proxy oranye)**: WebSocket diteruskan pada paket gratis; batas
  waktu idle 100 s > `pingInterval` 25 s Socket.io, sehingga sambungan tetap hidup.
- Tanpa WebSocket (proxy memutus), klien jatuh ke `polling` (`/socket.io/?transport=polling`)
  — jangan memblokir jalur itu. Tanpa socket sama sekali, ruang staf tetap
  berfungsi (realtime = penyempurna); yang tampak hanya penanda kecil
  "Sambungan langsung terputus".
- Verifikasi: buka `staf.<domain>/staf/dashboard` → tab Network → WS →
  `wss://staf.<domain>/socket.io/?EIO=4&transport=websocket` berstatus 101.

## D. Volume unggahan (KEPUTUSAN PEMILIK: volume lokal)

Lampiran pengaduan disimpan di `/app/public/unggahan` **di dalam container**.
Tanpa volume, redeploy = seluruh lampiran hilang.

Di Coolify: aplikasi → **Storages** → *Add volume*:

| Field | Nilai |
|---|---|
| Name | `warkop-unggahan` |
| Destination path | `/app/public/unggahan` |

Container berjalan sebagai user `nextjs` (uid 1001). Folder tujuan di image
sudah dimiliki `nextjs` sehingga volume kosong mewarisi kepemilikannya. Bila
memakai *bind mount* ke folder host, jalankan sekali di server:
`sudo chown -R 1001:1001 /jalur/folder/host`.

Cadangkan volume ini bersama basis data (bagian G).

## E. Firewall

| Port | Untuk | Status |
|---|---|---|
| 22 | SSH | Buka (kunci saja) |
| 80, 443 | Web (Traefik) | Buka |
| 3306 | Basis data | **TIDAK PERNAH dibuka** — antar container lewat jaringan internal Docker |
| 8000 | Panel Coolify | **TIDAK dibuka** — lewat terowongan SSH |

## F. Alur redeploy (cetak biru bagian 10)

```
ubah kode di lokal
   -> git add -A ; git commit ; git push        (push hanya atas perintah pemilik)
   -> buka terowongan SSH ke server (bagian A.2)
   -> Coolify: aplikasi -> Deployments -> Redeploy
   -> tunggu "Rolling update completed"
```

**Rolling update:** Coolify menjalankan container baru, menunggu
`HEALTHCHECK` (`/api/health`, start-period 40 s, 3 percobaan) hijau, baru
menghentikan container lama. Bila healthcheck gagal, versi lama tetap melayani
dan deploy dinyatakan gagal — periksa log build/runtime di Coolify.

`/api/health` membalas **503** bila basis data terputus, sehingga container
tanpa akses DB tidak akan pernah dinyatakan sehat.

## G. Basis data di server

### G.1 Skema dan seed pertama

```bash
# skema (sekali, pada basis data kosong) — dari salinan repo di server atau lewat scp
sudo docker exec -i <container_db> mariadb -u<user> -p'<sandi>' warkop_nusantara < sql/01-schema.sql

# superadmin + data awal (memakai ENV runtime container aplikasi; idempoten)
sudo docker exec -i <container_app> node scripts/seed.js
```

`sql/02-seed.sql` berisi **konten contoh** (12 artikel, 3 pengaduan, program,
galeri, pengurus) — `scripts/seed.js` menjalankannya; tinjau/ganti lewat ruang
staf sebelum peluncuran publik.

**Migrasi setelah skema awal.** `database/schema.sql` sudah memuat seluruh kolom
terkini (termasuk `users.wajib_ganti_sandi`). Basis data yang dibuat SEBELUM
4 Sep 2026 wajib menjalankan setiap berkas `database/migrations/*.sql` berurutan
(idempoten, `IF NOT EXISTS`) lewat G.2 — aplikasi tidak menjalankan migrasi
otomatis (ALUR 5). Periksa: `SHOW COLUMNS FROM users LIKE 'wajib_ganti_sandi'`.

### G.2 Menjalankan SQL manual

```bash
sudo docker exec -i <container_db> mariadb -u<user> -p'<sandi>' warkop_nusantara << 'SQL'
  SELECT id, nomor_kasus, status FROM pengaduan WHERE nomor_kasus = 'WRP-000000';
SQL
```

**SELALU jalankan SELECT pemeriksaan dulu sebelum UPDATE atau DELETE.**
Perubahan skema hanya lewat `database/migrations/` (lihat README di sana).
`pengaduan.status` **tidak boleh** diubah lewat SQL manual — riwayat buku besar
harus lewat aplikasi (`ubahStatusPengaduan`).

### G.3 Cadangan

```bash
DB_CONTAINER=<container_db> DB_USER=warkop DB_PASSWORD='<sandi>' \
  sh scripts/cadangkan-db.sh /var/backups/warkop
```

Menghasilkan `warkop_nusantara-YYYYMMDD-HHMM.sql.gz`. Jadwalkan lewat cron dan
**uji pemulihan** ke basis data kosong secara berkala (perintah pemulihan ada di
komentar skrip). Cadangkan juga volume `warkop-unggahan`.

### G.4 Memeriksa zona waktu

```bash
sudo docker exec <container_app> date                       # WIB
curl -s https://<domain>/api/health                         # "waktu": "...+07:00"
sudo docker exec -i <container_db> mariadb -u<user> -p'<sandi>' -e "SELECT @@system_time_zone, NOW();"   # boleh UTC
```

## H. Rollback

1. **Lewat git:** `git revert <hash>` di lokal → commit → push → Redeploy.
   Setiap tahap adalah satu commit yang utuh dan build hijau, sehingga
   `git revert` selalu aman (aturan 14).
2. **Cepat lewat Coolify:** aplikasi → Deployments → pilih deployment sebelumnya
   yang sukses → *Redeploy* (image lama dipakai ulang).
3. Perubahan skema **tidak** otomatis ikut mundur — tulis migrasi pembalik bila
   perlu, uji di salinan basis data.

---

## 1. Pengujian lokal (Docker Desktop)

### 1.1 Kontainer MariaDB mandiri (dipakai `npm run dev`)

```powershell
docker run -d --name warkop-mariadb `
  -e MARIADB_ROOT_PASSWORD="<sandi-root>" -e MARIADB_DATABASE=warkop_nusantara `
  -e MARIADB_USER=warkop -e MARIADB_PASSWORD="<sandi>" -e TZ=UTC `
  -p 127.0.0.1:3306:3306 -v warkop-mariadb-data:/var/lib/mysql mariadb:11
Get-Content sql\01-schema.sql -Raw | docker exec -i warkop-mariadb mariadb -uwarkop -p"<sandi>" warkop_nusantara
npm run seed
```

### 1.2 Compose (uji image produksi secara utuh)

`docker-compose.yml` **hanya untuk uji lokal**. Membangun image dari
`Dockerfile`, menjalankan MariaDB tanpa port host, memasang volume DB dan
unggahan. Nilai `${...}` dibaca dari `.env`.

```powershell
docker compose up -d --build            # skema+seed statis dijalankan MariaDB saat volume kosong
docker compose exec app node scripts/seed.js   # superadmin (+ akun contoh bila SEED_STAF_PASSWORD)
curl.exe -i http://localhost:3000/api/health
docker compose down                     # -v untuk menghapus volume
```

Hentikan `npm run dev` dulu — keduanya memakai port 3000.

---

## 2. Yang harus dilakukan MANUAL di Coolify oleh pemilik (menunggu domain/server)

1. Buat project + container MariaDB 11; catat nama container → `DB_HOST`.
2. Buat aplikasi dari repositori (Dockerfile), port 3000.
3. Isi ENV bagian B; tandai rahasia **Runtime only**; `NEXT_PUBLIC_APP_URL`
   Buildtime + Runtime.
4. Tambahkan domain `<domain>` **dan** `staf.<domain>`; isi `STAF_HOST`.
5. Tambahkan volume `/app/public/unggahan` (bagian D).
6. `git push` (atas perintah pemilik) → Deploy pertama → tunggu healthy.
7. Jalankan skema + `node scripts/seed.js` (bagian G.1).
8. Masuk di `https://staf.<domain>/login`, ganti kata sandi superadmin,
   nonaktifkan/ganti konten contoh.
9. Jadwalkan cadangan (G.3) dan uji pemulihannya.

## 3. Daftar periksa produksi — Tahap 9

Diisi 4 Sep 2026 dari bukti `laporan/bukti-tahap-09/` (rincian di
`laporan/LAPORAN-TAHAP-09-KESIAPAN.md` bagian 7). ✅ = terbukti; ⚠️ = butuh
tindakan pemilik; ❌ = belum terpenuhi.

| # | Butir (cetak biru 15) | Status | Bukti / tindakan |
|---|---|---|---|
| 1 | `JWT_SECRET` acak ≥ 48 byte, Runtime only | ⚠️ | panjang 96 karakter hex (48 byte) ✅ (`g-panjang-rahasia.txt`); **belum Runtime only** — ikut layer image (`c2-log-build-coolify.txt`) → matikan Buildtime + rotasi |
| 2 | Kata sandi DB kuat, port 3306 tidak terbuka | ✅/⚠️ | 96 karakter; 3306 dari internet: timeout ✅ (`c11-g-proxy-port-ssh-produksi.txt`); nilai ikut layer image → rotasi |
| 3 | SSH hanya kunci | ❌ | sshd masih menawarkan `password` (`Permission denied (publickey,password)`) → set `PasswordAuthentication no` (pemilik, butuh sudo) |
| 4 | Panel Coolify tidak dapat diakses dari internet | ❌ | `http://31.97.106.106:8000` menjawab 302 dari internet (juga :5050, :3000 milik sistem lain) → firewall/binding (pemilik) |
| 5 | Firewall hanya 22, 80, 443 | ❌ | lihat butir 4 |
| 6 | `/api/health` ada, healthcheck hijau | ✅ | `docker inspect` healthy, gagal beruntun 0 (`c1-c7-b7-server-produksi.txt`) |
| 7 | Zona waktu selaras OS/container/sesi DB | ✅ | host & container WIB; sesi pool aplikasi `+07:00` (`c1-sesi-db-produksi.txt`); server MariaDB global UTC (disengaja: aplikasi menyetel sesi) |
| 8 | Setiap route API memeriksa peran | ✅ | 47 metode, 246 pemeriksaan curl 0 gagal (`b1-*.md/.txt`) |
| 9 | Cadangan berkala, sudah diuji pulih | ✅ (lokal) / ⚠️ | dump→pulih→checksum sama→aplikasi jalan (`d5-e-pemulihan-cadangan.txt`); jadwal cron di server BELUM dipasang (pemilik, bagian G.3) |
| 10 | Rollback `git revert` + Redeploy sudah dicoba | ✅ | revert 2 commit + build hijau (`c14-git-revert.txt`); rollback image di server tersedia 6 tag (`c1-c7-b7-server-produksi.txt`) |
| 11 | `proxy.js` di image & terbukti berjalan | ✅ | `/app/proxy.js` ada; Location tanpa `0.0.0.0`, pemisahan host 307 (`c11-g-proxy-port-ssh-produksi.txt`) |
| 12 | Tidak ada `cookies()/headers()/params/searchParams` tanpa `await` | ✅ | 30 berkas diperiksa, 0 masalah (`c12-await-params.txt`) |
| 13 | Versi Next.js didukung, advisori diperiksa | ✅ | Next 16.3.4 = `latest` registry; `npm audit` 0 kerentanan (`b8-npm-audit.txt`) |
| 14 | `npm run build` hijau (Turbopack) | ✅ | `build-produksi.txt` exit 0 |
| 15 | Laporan anonim tidak menyimpan identitas | ✅ | produksi: anonim=1 → 0 baris beridentitas; lokal: uji C13 |
| 16 | Halaman publik & `/lacak` tanpa identitas | ✅ | C13-1..3 (`b2-b4-b5-b6-c8-c13-keamanan.txt`) |
| 17 | Muatan socket tanpa identitas | ✅ | Tahap 8 b + `siaran.js` daftar putih |
| 18 | Setiap perubahan status punya baris riwayat | ✅ | yatim 0, rantai putus 0 (lokal & produksi) |
| 19 | Lampiran tidak bisa dijelajahi dengan menebak URL | ✅ | B6-1..6 |
| 20 | Volume unggahan bertahan melewati redeploy | ✅/⚠️ | `warkop-unggahan` → `/app/public/unggahan` ✅; **`/app/unggahan-terjaga` (lampiran pengaduan) BELUM bervolume** → tambah `warkop-lampiran` (pemilik) |

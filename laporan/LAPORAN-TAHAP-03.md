# LAPORAN TAHAP 03 — DOCKER DAN PENERAPAN PERTAMA

Tanggal: 3 September 2026 (dua sesi: berkas dan uji statis pukul ±13:00 WIB;
gerbang container + server pukul ±22:20–22:35 WIB setelah disk C: dibereskan
pemilik) · Mode: OTONOM · Bukti: `laporan/bukti-tahap-03/` dan
`laporan/bukti-server/`.

## Ringkasan — bacalah ini dulu

Seluruh berkas tahap ini (`Dockerfile` tiga tahap, `.dockerignore`,
`docker-compose.yml` uji lokal, `scripts/cadangkan-db.sh`, `PENERAPAN.md`)
sudah ada sejak commit `2ab6814`. Yang tertunda adalah **gerbang**: build image
dan uji container gagal karena disk C: penuh. Setelah pemilik mengosongkan disk
(sisa 7,4 GB saat run dilanjutkan), **kedua belas butir uji a–l LULUS** dengan
bukti berkas, termasuk uji log build bersih, healthcheck sungguhan
(healthy → unhealthy → healthy), proxy + pemisahan host di container, zona
waktu selaras, user non-root, volume bertahan, dan rollback.

Di sisi produksi (perintah pemilik, `dokumen/PERINTAH-PEMILIK-SERVER.md`):
domain `warkopnusantara.id` + `staf.warkopnusantara.id` aktif dengan HTTPS,
image dari commit `c97e255` HEALTHY di Coolify, **skema 14 tabel dan seed
dijalankan di basis data produksi**, login superadmin di host staf berhasil,
pemisahan host terbukti dengan `Location` tanpa `0.0.0.0`.

Satu **temuan penting** untuk Tahap 5/6: Next.js produksi tidak melayani berkas
yang ditambahkan ke `public/unggahan` setelah server menyala (404 sampai
restart). Unggahan wajib dilayani route handler sendiri dari `UPLOAD_DIR`.

## 1. Dockerfile dan penjelasan tiap tahap

| Tahap | Isi | Catatan |
|---|---|---|
| `deps` (`node:22-alpine`) | `libc6-compat`, `COPY package.json package-lock.json*`, `npm ci --include=dev` | dev-deps dibutuhkan build (tailwind, eslint-config-next) |
| `builder` | `COPY --from=deps node_modules`, `COPY . .` (dibatasi `.dockerignore`), **hanya** `ARG NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_WS_URL`, `ENV NODE_ENV=production`, `npm run build`, `npm prune --omit=dev` | tidak ada rahasia sebagai ARG — pelajaran nomor 2 |
| `runner` | `tzdata`+`wget`, `/etc/localtime` Asia/Jakarta, user `nextjs:nodejs` 1001, `COPY --chown` `node_modules` **penuh**, `.next`, `public`, `package.json`, `next.config.mjs`, `server.js`, **`proxy.js`**, `lib`, `database`, `scripts`; `mkdir public/unggahan` milik nextjs; `USER nextjs`; `HEALTHCHECK` `/api/health` start-period 40 s; `CMD node server.js` | tanpa `output: 'standalone'` (aturan 10); `proxy.js` di daftar COPY (aturan 11) |

## 2. Bukti log build bersih (butir b) — LULUS

`a-build-log.txt` (150 baris, build lengkap sampai `exporting to image`).
`skrip/uji-b-log-build-bersih.sh` → `b-log-build-bersih.txt`:

```
## 1. nilai rahasia .env lokal di log (harus 0 semua)
  DB_PASSWORD                  kemunculan nilai: 0
  JWT_SECRET                   kemunculan nilai: 0
  SEED_ADMIN_PASSWORD          kemunculan nilai: 0
  SEED_STAF_PASSWORD           kemunculan nilai: 0
  MARIADB_ROOT_PASSWORD_LOKAL  kemunculan nilai: 0
## 2. nama variabel di log build
  DB_PASSWORD 0 · JWT_SECRET 0 · SEED_ADMIN_PASSWORD 0
## 3. baris ARG/ENV yang tercetak: (tidak ada — BuildKit tidak mencetak ARG/ENV)
## 4. 54: ▲ Next.js 16.3.4 (Turbopack) · 58: ✓ Compiled successfully in 5.2s · 85: ƒ Proxy (Middleware) · 97: npm prune --omit=dev
HASIL: LULUS — log build bersih dari nilai maupun nama rahasia
```

Baris 85 `ƒ Proxy (Middleware)` membuktikan `proxy.js` dikompilasi ke dalam
image (aturan 11).

## 3. Bukti healthcheck hijau dan uji unhealthy (butir d) — LULUS

`c-j-container.txt`:

```
status awal: healthy
$ docker compose stop db
$ curl /api/health (db mati) -> HTTP 503
  -> 'unhealthy' setelah 80s          (interval 30 s × 3 gagal, sesuai HEALTHCHECK)
$ docker compose start db
  -> 'healthy' setelah 25s
$ curl /api/health (db hidup) -> HTTP 200
```

Healthcheck benar-benar memeriksa koneksi basis data, bukan sekadar port.

## 4. Bukti proxy berjalan di container (butir f) — LULUS

`c-j-container.txt` + `c-j-suplemen.txt`:

- `/app/proxy.js` (4118 B), `/app/server.js`, `/app/lib/socket/server.js`,
  `/app/next.config.mjs` ada di image, milik `nextjs:nodejs`.
- `/staf/dashboard` tanpa cookie → `307` ke `/login?lanjut=%2Fstaf%2Fdashboard`.
- Header palsu `x-user-role: superadmin` tanpa cookie → `/api/staf/statistik`
  **401** (proxy menghapus header).
- Container kedua dari image yang sama dengan `STAF_HOST=staf.warkop.test`:

| Permintaan | Location |
|---|---|
| `warkop.test/staf/dashboard` | `https://staf.warkop.test/staf/dashboard` |
| `warkop.test/login` | `https://staf.warkop.test/login` |
| `staf.warkop.test/tentang` | `https://staf.warkop.test/staf/dashboard` |
| `staf.warkop.test/staf/dashboard` | `https://staf.warkop.test/login?lanjut=%2Fstaf%2Fdashboard` |
| `warkop.test/api/health` | 200 (tidak dialihkan) |

Pemeriksaan terprogram: `0.0.0.0` di Location = **0**, `localhost` = **0**.

Di **produksi** (`bukti-server/02-health-login-pemisahan-host.txt`) hasilnya
identik dengan domain sungguhan: `https://warkopnusantara.id/staf/dashboard` →
`Location: https://staf.warkopnusantara.id/staf/dashboard`; `0.0.0.0` = 0.

## 5. Bukti zona waktu selaras di container (butir g) — LULUS

```
$ docker compose exec app date            -> Thu Sep  3 22:27:58 WIB 2026
$ cat /etc/timezone                       -> Asia/Jakarta        (suplemen)
$ curl /api/health -> "waktu":"2026-09-03T22:27:59+07:00"
  WIB sebenarnya (UTC+7 dari JS) : 2026-09-03 22:27:59
  NOW() lewat pool aplikasi      : 2026-09-03 22:27:59 | @@session.time_zone = +07:00 | server DB = UTC
  dibuat_pada tersimpan (id 3)   : 2026-09-03 22:27:59
  HASIL: SELARAS (WIB ketiganya)
```

Server MariaDB sengaja UTC; aplikasi menyetel `+07:00` per koneksi (aturan 1).
Produksi: `/api/health` juga `+07:00`, `@@system_time_zone` MariaDB produksi =
UTC (`bukti-server/01-skema-seed-produksi.txt`, pemeriksaan awal).

## 6. Hasil kedua belas butir UJI TAHAP 3

| Butir | Hasil | Bukti |
|---|---|---|
| a. Build | **LULUS** — exit 0; image `warkop-nusantara:lokal` **998 MB** (node_modules 483 MB, node:22-alpine 160 MB, .next 81,5 MB); jumlah durasi langkah 80,8 s (deps di-cache dari percobaan sebelumnya; `npm run build` 12,5 s, prune 4,2 s, export 29,8 s) | `a-build-log.txt`, `a-hasil-build.txt` |
| b. Log build bersih | **LULUS** — 0 nilai, 0 nama rahasia | `b-log-build-bersih.txt` |
| c. Container menyala | **LULUS** — healthy setelah 6 s; log awal: Socket.io terpasang, `siap di http://0.0.0.0:3000 mode=produksi`; `/api/health` 200 `basisData: terhubung` | `c-j-container.txt` |
| d. Healthcheck | **LULUS** — healthy → unhealthy (80 s setelah db mati) → healthy (25 s) | idem |
| e. Login di container | **LULUS** — seed di container; login 200 + cookie; `/api/auth/saya` 200; `/staf/dashboard` 200; sandi salah 401; `/login` dengan cookie → 307 dashboard | idem |
| f. Proxy di container | **LULUS** — lihat bagian 4 | `c-j-container.txt`, `c-j-suplemen.txt` |
| g. Zona waktu | **LULUS** — lihat bagian 5 | idem |
| h. User non-root | **LULUS** — `whoami` → `nextjs`, `uid=1001(nextjs)` | `c-j-container.txt` |
| i. Volume unggahan | **LULUS** — berkas ditulis, container app di-`down`/`up` (Created baru `15:28:05Z`), berkas **masih ada**; volume `warkop-lokal_warkop-compose-unggahan`. **Temuan i2** di bagian 8 | `c-j-suplemen.txt` |
| j. Rollback | **LULUS** — rilis-2 (image turunan, id berbeda) jalan → dihapus → koneksi putus → rilis-1 dijalankan: health 200, login 200, volume terbaca dari rilis-1 | `c-j-container.txt`, `c-j-suplemen.txt` |
| k. Ukuran konteks | **LULUS** — SEBELUM `.dockerignore`: **764,16 MB**; SESUDAH: **2,77 MB** (`FROM scratch + COPY . /`; terbesar `public` 2,6 MB = font/logo, `package-lock.json` 250 kB) | `k-konteks-sebelum.txt`, `k-konteks-sesudah.txt` |
| l. Larangan | **LULUS** — tidak ada `output: standalone`, ARG hanya `NEXT_PUBLIC_*`, `proxy.js` di COPY, `USER nextjs`, port 3306/8000 tidak dipetakan | `l-larangan.txt` |

`npm run build` dan `npm run lint` di host hijau: `n-build-hijau.txt`.

Catatan jujur: pada jalannya `c-j-container.txt`, empat perintah
`docker compose exec ... /app/...` dan `cat /etc/timezone` gagal karena Git
Bash mengubah `/app` menjadi `C:/Program Files/Git/app` (konversi jalur MSYS).
Perintah-perintah itu diulang dengan `MSYS_NO_PATHCONV=1` di
`c-j-suplemen.txt` — hasil aslinya tidak dihapus dari bukti.

## 7. `PENERAPAN.md`

Lengkap (A–H + uji lokal + daftar tindakan manual Coolify + daftar periksa
Tahap 9). Yang kini sudah terjadi di produksi:

- **G.1 dijalankan** 3 Sep 2026 22:23 WIB (`bukti-server/01-skema-seed-produksi.txt`):
  `docker exec <app> cat /app/database/schema.sql | docker exec -i <db> mariadb …`
  (sha256 skema di image = sha256 `sql/01-schema.sql` repo:
  `6312f2ef…52b60f`), `SHOW TABLES` = 14 tabel, lalu
  `docker exec <app> node scripts/seed.js` → superadmin id 1 dibuat, 12
  artikel, 3 pengaduan (8 riwayat lewat buku besar), 39 wilayah, 13 setelan.
  `SEED_STAF_PASSWORD` kosong di produksi → 5 akun staf contoh **nonaktif**.
- **Domain**: `warkopnusantara.id` publik, `staf.warkopnusantara.id` staf,
  keduanya HTTPS (Traefik). ENV runtime container produksi memuat DB_*, JWT_*,
  SEED_ADMIN_*, STAF_HOST, TZ, UPLOAD_DIR — nama saja diperiksa, nilai tidak
  pernah dicetak.
- **Volume** `warkop-unggahan` → `/app/public/unggahan` terpasang di container
  produksi.

## 8. KEPUTUSAN BARU

1. **Volume unggahan = named volume Docker** `/app/public/unggahan` (Coolify:
   `warkop-unggahan`). Folder di image dibuat dan di-`chown` ke `nextjs`.
2. **`scripts/` ikut disalin ke image** agar `node scripts/seed.js` bisa
   dijalankan di container — terbukti dipakai di produksi (G.1).
3. **Compose lokal memasang `./sql` ke `/docker-entrypoint-initdb.d`** (uji
   lokal saja; di server skema dijalankan sadar lewat `docker exec`).
4. **Compose tidak memetakan port DB**; app hanya `127.0.0.1:3000`; rahasia
   lewat interpolasi `${…}` dari `.env`.
5. **`cadangkan-db.sh`**: `mariadb-dump --single-transaction`, sandi lewat
   `MYSQL_PWD`, stempel WIB, tolak dump < 1 KB.
6. **`.dockerignore`** mengecualikan `*.md` kecuali README, `laporan`,
   `dokumen`, `desain`, `paket-pendukung`, zip/PNG asli, `.env*` (kecuali
   `.env.example`), `_backup*`, `node_modules`, `.next`. Konteks 764 MB →
   2,77 MB.
7. **Skema produksi dijalankan dari salinan di image** (`/app/database/schema.sql`,
   identik byte-per-byte dengan `sql/01-schema.sql`) karena container app tidak
   punya klien MariaDB dan repo tidak di-checkout di server: pola
   `docker exec <app> cat … | docker exec -i <db> mariadb …`. Sandi DB diambil
   dari env `MARIADB_PASSWORD` di dalam container DB, tidak lewat argumen.
8. **Temuan i2 — unggahan tidak dilayani sampai restart.** Next.js 16 produksi
   mendaftar isi `public/` saat server mulai; berkas baru di
   `public/unggahan` 404 sampai container di-restart (bukti: 404 saat baru
   ditulis, 200 setelah container diganti). Keputusan: Tahap 5/6 membuat route
   handler `app/unggahan/[...jalur]/route.js` yang membaca dari `UPLOAD_DIR`
   (dengan pemeriksaan jalur dan tipe). Volume tetap seperti keputusan 1.
9. **Uji butir k memakai image `FROM scratch + COPY . /`** untuk mengukur
   konteks sesudah `.dockerignore`, karena transfer BuildKit inkremental
   (7,39 kB di log) tidak mewakili ukuran konteks sesungguhnya.
10. Bukti login memakai penyamaran: email superadmin → `<email-disembunyikan>`,
    cookie → `<token-disembunyikan>` (aturan 9 CLAUDE.md).

## 9. Yang harus dilakukan pemilik / manual di Coolify

Sudah dilakukan pemilik (terverifikasi): project + MariaDB, aplikasi
Dockerfile, ENV runtime, dua domain + `STAF_HOST`, volume unggahan, deploy
pertama HEALTHY. Yang masih di tangan pemilik (dicantumkan ulang di STATUS.md
penutup): ganti sandi superadmin, tinjau konten seed, rotasi rahasia, proxy
Cloudflare, webhook GitHub, pengerasan firewall 8000/5050, jadwal cadangan.

## 10. Cara menguji ulang

```powershell
cd D:\Deploy\LSM
docker build --progress=plain --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 -t warkop-nusantara:lokal . 2>&1 | Tee-Object laporan\bukti-tahap-03\a-build-log.txt
bash laporan/bukti-tahap-03/skrip/uji-b-log-build-bersih.sh
$env:MSYS_NO_PATHCONV=1; bash laporan/bukti-tahap-03/skrip/uji-container-tahap-03.sh
docker compose down
# produksi
curl.exe -i https://warkopnusantara.id/api/health
curl.exe -i https://warkopnusantara.id/staf/dashboard      # Location: https://staf.warkopnusantara.id/...
```

## 11. Sengaja belum dikerjakan

Uji pemulihan cadangan dan daftar periksa produksi (Tahap 9); route handler
unggahan (Tahap 5/6, keputusan 8).

`package.json` **tidak berubah** di tahap ini.

# LAPORAN TAHAP 03 — DOCKER DAN PENERAPAN PERTAMA (SEBAGIAN — BLOKIR)

Tanggal: 3 September 2026 · Mode: OTONOM · Bukti: `laporan/bukti-tahap-03/`

## Ringkasan — bacalah ini dulu

Seluruh **berkas** tahap ini selesai: `Dockerfile` tiga tahap, `.dockerignore`,
`docker-compose.yml` (uji lokal), `scripts/cadangkan-db.sh`, `PENERAPAN.md`
lengkap (A–H + daftar tindakan manual Coolify). Uji statis lulus (l, k-sebelum).

**Build image TIDAK dapat diselesaikan di mesin ini** setelah tiga upaya
berbeda: setiap build mematikan engine Docker Desktop (`rpc error: Unavailable
… EOF`, WSL `0x80072746`). Akar masalahnya di luar repo: **drive C: penuh 100 %
(sisa 1,1 GB)** dan vhdx WSL2 Docker (13 GB) berada di C:, sehingga penulisan
layer build menghabiskan disk dan VM ditutup paksa. Ini kondisi berhenti 7.3
("disk penuh") — untuk butir a–k yang membutuhkan image/container tahap ini
**BLOKIR / MENUNGGU PEMILIK**. Butir yang butuh domain/Coolify/push juga
MENUNGGU PEMILIK (keputusan pemilik). Sesuai ALUR 7.4, pembangunan **lanjut ke
Tahap 4** — tahap 4–9 hanya membutuhkan container MariaDB lokal yang tetap
berjalan (tidak memerlukan build image).

Skrip uji sudah disiapkan agar pemilik tinggal menjalankannya setelah disk
dikosongkan (bagian 9).

## 1. Dockerfile dan penjelasan tiap tahap

| Tahap | Isi | Catatan |
|---|---|---|
| `deps` (`node:22-alpine`) | `libc6-compat`, `COPY package.json package-lock.json*`, `npm ci --include=dev` | dev-deps dibutuhkan build (tailwind, eslint-config-next) |
| `builder` | `COPY --from=deps node_modules`, `COPY . .` (dibatasi `.dockerignore`), **hanya** `ARG NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_WS_URL`, `ENV NODE_ENV=production`, `npm run build`, `npm prune --omit=dev` | tidak ada rahasia sebagai ARG — pelajaran nomor 2 |
| `runner` | `tzdata`+`wget`, `/etc/localtime` Asia/Jakarta, user `nextjs:nodejs` 1001, `COPY --chown` `node_modules` **penuh**, `.next`, `public`, `package.json`, `next.config.mjs`, `server.js`, **`proxy.js`**, `lib`, `database`, `scripts`; `mkdir public/unggahan` milik nextjs; `USER nextjs`; `HEALTHCHECK` `/api/health` start-period 40 s; `CMD node server.js` | tanpa `output: 'standalone'` (aturan 10); `proxy.js` di daftar COPY (aturan 11) |

Log percobaan 1 (`a-build-log-percobaan-1-gagal.txt`) menunjukkan tahap `deps`
berjalan normal: `apk` ok, `npm ci` **425 paket, 0 kerentanan, 50 s**; tahap
`runner` `apk add tzdata wget` dan pembuatan user ok; crash terjadi tepat di
`[builder 3/6] COPY --from=deps /app/node_modules` (±450 MB) — langkah tulis
disk terbesar pertama.

## 2. Bukti log build bersih (butir b) — TIDAK BISA SELESAI

Build tidak pernah mencapai tahap `builder` yang mencetak `Environments`/ENV,
sehingga pemeriksaan penuh belum bisa dilakukan. Yang **bisa** dibuktikan dari
log yang ada (`a-build-log*.txt`): tidak ada nama maupun nilai `DB_PASSWORD`,
`JWT_SECRET`, `SEED_ADMIN_PASSWORD` (skrip `uji-b-log-build-bersih.sh`
dijalankan pemilik setelah build sukses; skrip memeriksa nilai dari `.env`
lokal terhadap log, nama variabel, dan baris ARG/ENV).

## 3–5. Healthcheck, proxy di container, zona waktu di container

**TIDAK BISA** — container tidak dapat dibangun. Skrip
`uji-container-tahap-03.sh` sudah menulis seluruh langkah c–j (compose up,
healthy → stop db → unhealthy → start db → healthy, login, proxy + pemisahan
host lewat container kedua `STAF_HOST=staf.warkop.test`, zona waktu lewat
`lib/db` di dalam container, `whoami`, volume bertahan, rollback rilis-1/rilis-2).

## 6. Hasil kedua belas butir UJI TAHAP 3

| Butir | Hasil | Bukti |
|---|---|---|
| a. Build | **BLOKIR** — 3 upaya, engine Docker mati setiap kali (disk C: penuh) | `a-build-log.txt`, `a-build-log-percobaan-1-gagal.txt`, `00-BLOKIR-docker-disk-penuh.txt` |
| b. Log build bersih | TIDAK BISA (bergantung a); skrip siap | `skrip/uji-b-log-build-bersih.sh` |
| c. Container menyala | TIDAK BISA (a) | `skrip/uji-container-tahap-03.sh` |
| d. Healthcheck healthy/unhealthy | TIDAK BISA (a) | idem |
| e. Login di container | TIDAK BISA (a) | idem |
| f. Proxy di container | TIDAK BISA (a) | idem |
| g. Zona waktu di container | TIDAK BISA (a) | idem |
| h. User non-root | TIDAK BISA (a); statis: `USER nextjs` di Dockerfile baris 63 | `l-larangan.txt` |
| i. Volume unggahan | TIDAK BISA (a); rancangan: named volume `/app/public/unggahan`, folder milik uid 1001 | `docker-compose.yml`, `PENERAPAN.md` D |
| j. Rollback | TIDAK BISA (a) | skrip |
| k. Ukuran konteks | **SEBELUM** `.dockerignore`: **764,16 MB** (95,9 s transfer; `du`: node_modules 457 M, .next 281 M, desain 9,1 M, zip 8,6 M, PNG 5,5 M). **SESUDAH**: transfer inkremental di log percobaan 2/3 hanya 7,39 kB (BuildKit menyalin selisih); angka penuh sesudah `.dockerignore` diperoleh saat build pertama yang berhasil | `k-konteks-sebelum.txt` |
| l. Larangan | LULUS — tidak ada `output: standalone` aktif, ARG hanya `NEXT_PUBLIC_*`, `proxy.js` di COPY, `USER nextjs`, port 3306/8000 tidak dipetakan | `l-larangan.txt` |

`npm run build` dan `npm run lint` di host tetap hijau (tidak ada perubahan
kode aplikasi di tahap ini).

## 7. `PENERAPAN.md`

Lengkap: A persiapan server, B tabel ENV (Runtime only vs Buildtime, rahasia
ditebalkan), C subdomain, D volume unggahan, E firewall, F alur redeploy +
penjelasan rolling update, G basis data (skema/seed pertama, SQL manual dengan
pengingat SELECT dulu, cadangan, zona waktu), H rollback, bagian 1 uji lokal,
bagian 2 daftar tindakan manual Coolify.

## 8. KEPUTUSAN BARU

1. **Volume unggahan = named volume Docker** `/app/public/unggahan` (Coolify:
   Storages → volume `warkop-unggahan`). Folder di image dibuat dan di-`chown`
   ke `nextjs` sehingga volume kosong mewarisi kepemilikannya; bind mount host
   perlu `chown 1001:1001`. Berkas yang ditaruh di folder itu setelah build
   tetap dilayani Next.js dari `public/` (diuji di butir i saat build tersedia).
2. **`scripts/` ikut disalin ke image** agar `node scripts/seed.js` bisa
   dijalankan di container (PENERAPAN G.1); tidak ada di daftar cetak biru 6.
3. **Compose lokal memasang `./sql` ke `/docker-entrypoint-initdb.d`** sehingga
   MariaDB menjalankan skema + seed statis **sekali** saat volume kosong —
   hanya untuk uji lokal (di server tetap sadar lewat `docker exec`, ALUR 5).
   Superadmin tetap lewat `node scripts/seed.js`.
4. **Compose tidak memetakan port DB** ke host (jaringan internal); app hanya
   di `127.0.0.1:3000`. Nilai rahasia dari `.env` lewat interpolasi `${…}`
   pada `environment:` — tidak ada rahasia di berkas compose.
5. **`cadangkan-db.sh`**: `mariadb-dump --single-transaction`, sandi lewat
   `MYSQL_PWD` env container (tidak muncul di daftar proses), stempel waktu
   WIB, tolak berkas < 1 KB (deteksi dump kosong), perintah pemulihan di komentar.
6. **`.dockerignore`** mengecualikan `*.md` kecuali README, `laporan`,
   `dokumen`, `desain`, `paket-pendukung`, zip/PNG asli, `.env*`, `_backup*`,
   `node_modules`, `.next`.
7. **Docker Desktop dinyalakan ulang oleh Claude Code** (dua kali, termasuk
   `wsl --shutdown`) sebagai upaya perbaikan prasyarat yang pemilik tetapkan
   harus menyala; tidak ada berkas di luar repo yang diubah. Pembersihan disk C:
   / `docker system prune` **tidak** dilakukan (data proyek lain; aturan 8).

## 9. Yang harus dilakukan pemilik

**A. Agar uji Tahap 3 bisa diselesaikan (mesin ini):**
1. Kosongkan ≥ 10 GB di C: (atau pindahkan *Disk image location* Docker
   Desktop ke D:), opsional `docker builder prune` / `docker system prune`
   (7,5 GB image + 6,3 GB cache build proyek lain reclaimable).
2. Hentikan `npm run dev`, lalu:
   ```powershell
   cd D:\Deploy\LSM
   docker build --progress=plain --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 -t warkop-nusantara:lokal . 2>&1 | Tee-Object laporan\bukti-tahap-03\a-build-log.txt
   bash laporan/bukti-tahap-03/skrip/uji-b-log-build-bersih.sh
   bash laporan/bukti-tahap-03/skrip/uji-container-tahap-03.sh | Tee-Object laporan\bukti-tahap-03\c-j-container.txt
   ```
   (atau kirim ulang prompt MODE OTONOM setelah disk lega — Claude Code akan
   mengulang butir a–k Tahap 3 dari STATUS.md.)

**B. Manual di Coolify (menunggu domain/server):** daftar di `PENERAPAN.md`
bagian 2 — project + MariaDB, aplikasi Dockerfile, ENV Runtime only, dua
domain + `STAF_HOST`, volume unggahan, `git push` + deploy pertama, skema +
seed, ganti sandi superadmin, jadwal cadangan.

## 10. Sengaja belum dikerjakan

Uji pemulihan cadangan (Tahap 9), daftar periksa produksi (Tahap 9), deploy
pertama & healthcheck di Coolify (menunggu pemilik).

`package.json` **tidak berubah**.

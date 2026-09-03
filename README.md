# WARKOP NUSANTARA — Sistem Portal, Berita, dan Pengaduan

Sistem produksi LSM **WARKOP NUSANTARA** (Wadah Aspirasi Rakyat, Kontrol,
Observasi dan Pengawasan Nusantara). Satu aplikasi Next.js 16 dengan dua fungsi:

- **A. Portal publik + kanal berita/investigasi** — profil lembaga, struktur
  pengurus, program, galeri, FAQ, dan berita kelas ruang redaksi.
- **B. Kanal pengaduan masyarakat + ruang kerja staf** — pelapor boleh
  **anonim**, identitas dilindungi berlapis, setiap perubahan status terekam
  permanen di tabel buku besar (`pengaduan_riwayat`), pelapor melacak lewat
  nomor kasus `WRP-xxxxxx`.

Pengaduan bisa menyangkut dugaan korupsi — **kesalahan di sistem ini
membahayakan orang sungguhan**. Aturan kerja ada di `CLAUDE.md`.

## Dokumentasi

| Berkas | Isi |
|---|---|
| `PENERAPAN.md` | penerapan produksi (Coolify), ENV, volume, redeploy, rollback, cadangan |
| `DATABASE.md` | 14 tabel, relasi, enum, zona waktu, migrasi, pencadangan/pemulihan |
| `API.md` | seluruh endpoint HTTP (30 route, 47 metode) dan event Socket.io |
| `PANDUAN-STAF.md` | panduan pemakaian ruang staf per peran (Tahap 9 F) |
| `laporan/LAPORAN-TAHAP-09-KESIAPAN.md` | daftar periksa kesiapan produksi Tahap 9 |
| `laporan/STATUS.md` | posisi tahap terkini + laporan/bukti tiap tahap di `laporan/` |
| `dokumen/CETAK-BIRU-SISTEM.md` | hukum arsitektur |
| `dokumen/REFERENSI.md` | seluruh keputusan: skema, token desain, peran (bag. 11), protokol konversi layar (bag. 18) |
| `dokumen/ALUR-KERJA-CLAUDE-CODE.md` | alur kerja per tahap |

### Lima peran staf (`lib/auth/hakAkses.js`, REFERENSI bagian 11)

| Peran | Hak |
|---|---|
| `superadmin` | penuh, termasuk pengguna, pengaturan, dan identitas pelapor |
| `redaktur` | artikel penuh (termasuk menerbitkan); pengurus/program/galeri penuh |
| `penulis` | artikel miliknya sendiri, draf saja, tidak bisa menerbitkan |
| `verifikator` | pengaduan: lihat, proses, ubah status, catatan + identitas pelapor |
| `pimpinan_wilayah` | baca-saja artikel dan pengaduan **wilayahnya saja**, tanpa identitas |

### Prinsip yang tidak bisa ditawar

- **Identitas pelapor** (nama/NIK/telepon/email) hanya untuk `superadmin`
  dan `verifikator`; tidak pernah ke publik, socket, log, atau balasan API
  peran lain. Setiap pembukaan identitas ditulis ke `audit_log`.
- Pembatasan wilayah disaring **di lapisan SQL**, bukan di frontend.
- **Realtime adalah penyempurna.** Tanpa Socket.io ruang staf tetap berfungsi
  penuh; yang tampak hanya penanda "Sambungan langsung terputus".
- Tampilan mengikuti desain final di `desain/` apa adanya — dilarang
  mendesain ulang.

## Prasyarat

- **Node.js 22+** (`engines.node >= 22`; proyek diuji di Node 24) dan npm 10+
- **Docker Desktop** — MariaDB 11 lokal untuk pengembangan
- **Git**
- Windows/PowerShell: uji HTTP pakai **`curl.exe`** (alias `curl` di
  PowerShell = `Invoke-WebRequest`, keluarannya berbeda). Pencarian teks pakai
  `Select-String` bila `grep` tidak ada.

## Menjalankan lokal

### 1. Ambil kode dan pasang dependensi

```powershell
git clone https://github.com/danielandersontech-excellent/deploy-LSM D:\Deploy\LSM
cd D:\Deploy\LSM
npm install
```

Paket npm yang dipakai hanya yang tercantum di cetak biru bagian 4 +
`slugify`, `sharp`, `isomorphic-dompurify`. Menambah paket = izin pemilik.

### 2. Salin `.env.example` menjadi `.env`

```powershell
Copy-Item .env.example .env
```

`.env` tidak pernah di-commit. Variabel utama (nama saja; nilai diisi sendiri):

| Kelompok | Variabel | Catatan |
|---|---|---|
| Basis data (RAHASIA) | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_POOL_LIMIT` | lokal: `DB_HOST=127.0.0.1`; produksi: nama container MariaDB |
| Autentikasi (RAHASIA) | `JWT_SECRET` (`openssl rand -hex 48`), `JWT_EXPIRY` | mengganti `JWT_SECRET` = seluruh sesi keluar |
| Seed (RAHASIA) | `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`; opsional `SEED_STAF_PASSWORD` | `SEED_STAF_PASSWORD` mengaktifkan 5 akun staf contoh — **jangan diisi di produksi** |
| Aplikasi | `NODE_ENV`, `PORT`, `HOSTNAME`, `TZ`, `NEXT_TELEMETRY_DISABLED`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_WS_URL` | hanya `NEXT_PUBLIC_*` yang boleh ikut waktu build |
| Pemisahan host | `STAF_HOST` | kosong = nonaktif (lokal); produksi wajib `staf.<domain>` |
| Unggahan | `UPLOAD_DIR`, `UPLOAD_PRIVATE_DIR`, `UPLOAD_MAX_MB` | `UPLOAD_PRIVATE_DIR` (lampiran pengaduan) **wajib di luar `public/`** |

Rincian per variabel: `PENERAPAN.md` bagian B dan `dokumen/REFERENSI.md`
bagian 13. **Jangan pernah** menandai rahasia sebagai "Available at Buildtime"
di Coolify — nilainya tercetak di log build.

### 3. Jalankan MariaDB 11 lokal (Docker Desktop)

Container mandiri, dipakai `npm run dev` (`PENERAPAN.md` bagian 1.1):

```powershell
docker run -d --name warkop-mariadb `
  -e MARIADB_ROOT_PASSWORD="<sandi-root>" -e MARIADB_DATABASE=warkop_nusantara `
  -e MARIADB_USER=warkop -e MARIADB_PASSWORD="<sandi>" -e TZ=UTC `
  -p 127.0.0.1:3306:3306 -v warkop-mariadb-data:/var/lib/mysql mariadb:11
```

Server DB sengaja UTC — aplikasi menyetel `+07:00` pada setiap koneksi
(`lib/db/index.js`); nilai kolom `DATETIME` adalah jam dinding WIB.

### 4. Buat skema, jalankan migrasi, isi data awal

```powershell
# skema (sekali, pada basis data kosong) — sql/01-schema.sql identik dengan database/schema.sql
Get-Content sql\01-schema.sql -Raw | docker exec -i warkop-mariadb mariadb -uwarkop -p"<sandi>" warkop_nusantara

# migrasi (idempoten, IF NOT EXISTS) — hanya untuk basis data yang dibuat sebelum skema terkini
Get-Content database\migrations\20260904-0040-users-wajib-ganti-sandi.sql -Raw | docker exec -i warkop-mariadb mariadb -uwarkop -p"<sandi>" warkop_nusantara

# superadmin dari SEED_ADMIN_* + database/seed.sql (konten contoh); idempoten, aman diulang
npm run seed          # = node scripts/seed.js
```

`database/schema.sql` terkini sudah memuat seluruh kolom (termasuk
`users.wajib_ganti_sandi`); aturan migrasi ada di `database/migrations/README.md`.
Gambar penampung konten contoh dibuat dengan `node scripts/buat-penampung.mjs`
(idempoten; menulis ke `public/penampung/`).

### 5. Jalankan server pengembangan

```powershell
npm run dev           # = node server.js  (custom server; BUKAN next dev / next start)
```

- Situs publik: `http://localhost:3000`
- Ruang staf: `http://localhost:3000/login` → `/staf/dashboard`
  (dengan `STAF_HOST` kosong, pemisahan host nonaktif sehingga keduanya
  dilayani di host yang sama)
- Kesehatan: `curl.exe -i http://localhost:3000/api/health` → `200` bila
  basis data terhubung, `503` bila terputus

Saat menguji dengan curl, jalankan dev server sebagai proses latar dan
matikan setelah selesai. Jangan menjalankan `npm run build` selagi dev server
hidup (cache `.next/` bisa rusak).

### 6. Build produksi, lint

```powershell
npm run build         # next build
npm start             # cross-env NODE_ENV=production node server.js
npm run lint          # eslint .  (next lint sudah dihapus di Next.js 16)
```

### 7. Alternatif: Compose (uji image produksi secara utuh)

`docker-compose.yml` **hanya untuk uji lokal** — membangun image dari
`Dockerfile`, MariaDB tanpa port host, volume DB + unggahan + lampiran.
Nilai `${...}` dibaca dari `.env`. Hentikan `npm run dev` dulu (port 3000).

```powershell
docker compose up -d --build
docker compose exec app node scripts/seed.js
curl.exe -i http://localhost:3000/api/health
docker compose down       # -v untuk menghapus volume
```

## Struktur folder

```
app/
  (auth)/login/, (auth)/tanpa-akses/   halaman masuk staf dan halaman 403
  (publik)/                             beranda, berita/[slug], tentang, struktur, program,
                                        galeri, kontak (formulir pengaduan), lacak, faq,
                                        kebijakan-privasi, pedoman-komunitas
  (staf)/staf/                          ruang kerja staf — segmen bersarang /staf/*
                                        (dashboard, artikel, pengaduan, pengurus, program,
                                        galeri, pengguna, pengaturan, ganti-sandi); layout.js = requireUser
  api/                                  SELURUH backend (route handler): auth, health, artikel,
                                        pengaduan (+lacak), staf/* (artikel, pengaduan, pengurus,
                                        program, galeri, pengguna, pengaturan, ganti-sandi,
                                        unggah, statistik)
  unggahan/[...jalur]/                  penyaji berkas unggahan publik (bukan static public/)
  layout.js, globals.css, font.js       kerangka, Tailwind, next/font/local (Fira Sans woff2)
components/
  ui/        Ikon (77 ikon Material), Tombol, Dialog, Lencana, Paginasi, KeadaanKosong
  publik/    HeaderPublik, NavPublik, FooterPublik, FormulirPengaduan, ...
  staf/      KerangkaStaf, SidebarStaf, EditorArtikel, PanelStatusPengaduan, PemantauRealtime, ...
hooks/       useSocket, useViewportTinggi
lib/
  auth/      jwt, sesi (cookie httpOnly), penjaga (requireUser/requireRole/denganPeran),
             hakAkses (matriks peran — acuan tunggal), pembatasLaju (login)
  db/        pool mysql2 + SELURUH kueri SQL (route API tidak menulis SQL); pengaduan.js = buku besar
  socket/    server.js (Socket.io + autentikasi socket + room), siaran.js (pembantu siaran untuk route)
  validasi/  validasi masukan per modul (artikel, pengaduan, pengguna, pengaturan, konten)
  unggahan.js, sanitasi.js, tokenFormulir.js, pembatasLajuUmum.js, navItems.js, utils.js
database/    schema.sql, seed.sql, migrations/ (+ README aturan migrasi)
sql/         01-schema.sql, 02-seed.sql (salinan identik database/), 03-... (salinan migrasi);
             dipasang ke /docker-entrypoint-initdb.d oleh compose lokal
scripts/     seed.js, cadangkan-db.sh, buat-penampung.mjs
public/      logo, favicon, og-default, fonts/ (woff2), penampung/, unggahan/ (volume runtime)
unggahan-terjaga/   lampiran pengaduan lokal (UPLOAD_PRIVATE_DIR) — gitignored, di luar public/
desain/      desain UI final Stitch (17 layar) — BACA-SAJA, gitignored, tetap ada di disk
paket-pendukung/    ASET (font, ikon, logo, kerangka terverifikasi) + UJI/uji-kesetiaan.mjs — BACA-SAJA
dokumen/     cetak biru, REFERENSI, alur kerja, perintah TAHAP-00..09
laporan/     LAPORAN-TAHAP-XX.md, STATUS.md, bukti-tahap-XX/ (bukti + skrip uji), bukti-server/
server.js    Next.js + Socket.io dalam satu proses
proxy.js     lapisan 2 penjaga (Next.js 16; bukan middleware.js)
next.config.mjs, tailwind.config.js, postcss.config.js, eslint.config.mjs, jsconfig.json
Dockerfile, docker-compose.yml, .env.example
```

Aturan yang menjaga proyek rapi: semua SQL di `lib/db/`; menu di satu berkas
`lib/navItems.js`; halaman staf selalu bersarang di segmen `staf/` agar tidak
bertabrakan path dengan halaman publik bernama sama.

## Arsitektur singkat

```
Internet -> Cloudflare (DNS + proxy) -> Traefik v3 (Coolify)
   -> satu container Next.js 16: server.js = Next.js + Socket.io
        <domain>        situs publik
        staf.<domain>   ruang kerja staf (STAF_HOST)
   -> MariaDB 11 (container terpisah; port 3306 tidak pernah terbuka)
```

- **Custom `server.js`.** Next.js dan Socket.io menumpang satu `http.Server`;
  karena itu `next start` dan `output: 'standalone'` **tidak dipakai**.
  Instance `io` disimpan di `globalThis`; route API menyiarkan lewat
  `lib/socket/siaran.js`, tidak pernah menyentuh `io` langsung.
- **`proxy.js` (Next.js 16, pengganti middleware).** Pemisahan host bila
  `STAF_HOST` terisi (`/staf/*` dan `/login` di domain utama dialihkan ke host
  staf; host staf hanya melayani ruang staf; `/api/*` dilayani di kedua host),
  verifikasi tanda tangan JWT dari cookie → header `x-user-id`/`x-user-role`,
  halaman staf tanpa token → `/login`. Jebakan terbukti: di custom server
  `request.url` = `0.0.0.0:3000`, jadi semua pengalihan lewat `urlDariHeader()`.
- **Empat lapisan penjaga** (REFERENSI 11): (1) `POST /api/auth/login` —
  bcrypt + JWT HS256 di cookie `warkop_token` httpOnly/SameSite=Lax/Secure;
  (2) `proxy.js` — kenyamanan, **bukan pagar**; (3) `app/(staf)/staf/layout.js`
  — `requireUser`; (4) **setiap** route API — `requireRole`/`denganPeran`,
  pagar utama. Sesi diperiksa ke DB tiap permintaan (akun aktif +
  `token_version`), sehingga paksa keluar / reset sandi / ganti peran
  membatalkan token yang masih sah tanda tangannya.
- **Socket.io terautentikasi.** Handshake membaca cookie yang sama, verifikasi
  jose + DB; tanpa token sah = ditolak. Room: `global`, `user:<id>`, `staf`,
  `wilayah:<id>` (pimpinan wilayah hanya wilayahnya). Muatan siaran tidak
  pernah memuat identitas pelapor. Klien menyambung same-origin.
- **Basis data.** `mysql2/promise`, pool tunggal, **prepared statement**
  (`execute` dengan placeholder `?`) sebagai satu-satunya jalan menjalankan
  SQL; transaksi dengan rollback penuh; buku besar pengaduan hanya lewat
  `ubahStatusPengaduan()`. Zona waktu: server UTC, sesi `+07:00`, tampil WIB —
  tidak bergantung zona waktu mesin.
- **Unggahan.** Gambar artikel/galeri di `UPLOAD_DIR` (`public/unggahan`,
  volume) disajikan `app/unggahan/[...jalur]/route.js`; lampiran pengaduan di
  `UPLOAD_PRIVATE_DIR` **di luar `public/`** dan hanya lewat route berpagar
  peran. Tipe diperiksa lewat magic bytes, nama diganti acak, gambar dikompres
  ulang dengan `sharp`, batas `UPLOAD_MAX_MB`.
- **Header keamanan** (`next.config.mjs`): CSP (`default-src 'self'`,
  `frame-ancestors 'none'`, `object-src 'none'`, `connect-src 'self'` mencakup
  wss same-origin), HSTS 2 tahun + preload (produksi saja), `nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP;
  `poweredByHeader: false`; `images.remotePatterns: []` (semua gambar lokal).
  XSS: sanitasi server (`isomorphic-dompurify`) + escaping React.
- **Rate limit** di memori proses (satu container): login per IP dan per akun
  (15 menit, tanpa kunci permanen); pengaduan 10/60 menit per IP; lacak 60/15
  menit per IP; unggah staf 60/jam per akun. Tanpa CAPTCHA pihak ketiga —
  honeypot + token formulir bertanda waktu (`lib/tokenFormulir.js`).

## Pengujian

Tidak ada kerangka uji unit; setiap tahap punya **skrip bukti** yang
menjalankan sistem sungguhan dan menyimpan keluarannya di
`laporan/bukti-tahap-XX/`. Aturan: uji tanpa berkas bukti = belum dikerjakan;
jangan melaporkan lulus tanpa benar-benar menjalankannya.

Skrip Tahap 9 (`laporan/bukti-tahap-09/skrip/`, dijalankan dari akar repo,
membaca kredensial dari `.env`, tidak pernah mencetak kata sandi):

| Skrip | Menguji | Prasyarat |
|---|---|---|
| `uji-b1-semua-route-semua-peran.mjs` | seluruh route API × setiap peran + tanpa login (403/401) | dev server `127.0.0.1:3000`, akun contoh (`SEED_STAF_PASSWORD`) |
| `uji-keamanan-tahap-09.mjs` | injeksi SQL, CSRF Origin, lampiran (tebak URL), daftar putih pengaturan, identitas pelapor tidak bocor, rate limit | dev server; B4 rate limit dijalankan terakhir (menghabiskan kuota IP) |
| `uji-b3-header-csp.mjs [URL] [URL-staf]` | header keamanan + pelanggaran CSP di Chrome headless | server dev atau produksi lokal |
| `uji-d1-alur-per-peran.mjs [URL]` | lima alur ujung ke ujung per peran, data uji dibersihkan | server lokal |
| `uji-d2-beban.mjs [URL] [pengguna=50] [putaran=10]` | beban 50 pengguna bersamaan, p50/p95, RSS server | build produksi lokal |
| `uji-d4b-kesetiaan-14-layar.mjs [URL]` | kesetiaan 14 layar desain vs render (memanggil `uji-kesetiaan.mjs`) | build produksi lokal (`npm run build` + `npm start`), `desain/` ada di disk |
| `uji-d5-e-pemulihan-cadangan.sh` | pemulihan saat DB mati; cadangan + pemulihan ke DB kosong | bash, container `warkop-mariadb`, server produksi lokal |
| `uji-d6-aksesibilitas.mjs [URL]` | navigasi keyboard, fokus, label/aria, landmark (Chrome headless) | server lokal |
| `cek-await-params.mjs` | setiap `params`/`searchParams` di-await (Next 16) | statis |

Contoh:

```powershell
npm run build; npm start                      # terminal 1 (produksi lokal)
node laporan\bukti-tahap-09\skrip\uji-d4b-kesetiaan-14-layar.mjs http://localhost:3000
node laporan\bukti-tahap-09\skrip\uji-b1-semua-route-semua-peran.mjs
node laporan\bukti-tahap-09\skrip\uji-keamanan-tahap-09.mjs
node laporan\bukti-tahap-09\skrip\uji-d1-alur-per-peran.mjs http://127.0.0.1:3000
```

Pembanding desain vs render satu layar (`paket-pendukung/UJI/uji-kesetiaan.mjs`):

```powershell
node paket-pendukung\UJI\uji-kesetiaan.mjs desain\stitch_portal_berita_inklusif\beranda_warkop_nusantara\code.html http://localhost:3000/
```

Melaporkan kelas Tailwind yang hilang, teks yang hilang, sisa cacat export
(exit 1 bila ada), dan token desain yang tidak dipakai. Cakupan 100% tidak
diminta — tiap kelas hilang harus punya alasan (REFERENSI bagian 18).
Halaman staf: ambil HTML dengan cookie login lalu berikan berkasnya.

## Penerapan produksi (ringkas)

Rincian lengkap di **`PENERAPAN.md`**. Ringkasannya:

1. Server Ubuntu + Coolify; SSH hanya kunci; panel Coolify (8000) lewat
   terowongan SSH, tidak dibuka ke internet; 3306 tidak pernah dibuka.
2. Container MariaDB 11 dibuat lebih dulu di Coolify — nama container = `DB_HOST`.
3. Aplikasi dari repositori Git, *build pack* Dockerfile (tiga tahap:
   deps → build → runtime non-root `nextjs`, healthcheck `/api/health`),
   port 3000, dua domain: `<domain>` dan `staf.<domain>`.
4. ENV: rahasia **Runtime only**; hanya `NEXT_PUBLIC_*` Buildtime + Runtime;
   `STAF_HOST` wajib terisi.
5. Volume: `warkop-unggahan` → `/app/public/unggahan` dan `warkop-lampiran`
   → `/app/unggahan-terjaga` (tanpa volume, berkas hilang saat redeploy).
6. Skema + seed pertama lewat `docker exec` (PENERAPAN bagian G.1); migrasi
   dijalankan manual, tidak otomatis oleh aplikasi.
7. Redeploy: commit → `git push` (hanya atas perintah pemilik) → Coolify
   Redeploy; rolling update menunggu healthcheck hijau. Rollback lewat
   `git revert` atau deployment sebelumnya di Coolify.
8. Cadangan: `scripts/cadangkan-db.sh` (dump bertanggal WIB, gzip; jadwalkan
   cron, uji pemulihan berkala) + volume unggahan.

`git push`, deploy Coolify, atau menyentuh apa pun di luar `D:\Deploy\LSM`
hanya atas perintah eksplisit pemilik.

## Pemilik dan hak cipta

Sistem ini dibangun untuk dan dimiliki oleh **LSM WARKOP NUSANTARA**. Hak cipta
pemilik sistem. Desain UI di `desain/`, logo, dan aset di `paket-pendukung/`
adalah sumber baca-saja yang tidak boleh diubah, dipindah, atau dihapus.

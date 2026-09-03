# LAPORAN TAHAP 00 — FONDASI PROYEK

Tanggal: 3 September 2026 · Mode: OTONOM (ALUR bagian 7) · Bukti: `laporan/bukti-tahap-00/`

## Ringkasan

Kerangka proyek Next.js 16 + custom server + Socket.io berdiri dan membangun
hijau. Seluruh 15 butir UJI TAHAP 0 (a–n termasuk h2) dijalankan sungguhan
dengan berkas bukti. Temuan terpenting: **proxy.js terbukti berjalan di
custom server** pada Next.js **16.3.4** (dev dan produksi), dan jebakan
`request.url` = `0.0.0.0:3000` **terkonfirmasi** (bukti h2). Satu temuan
negatif satu-kali pada dev server dicatat di bagian 8.

## 1. Berkas yang dibuat (menurut fungsi)

**Persiapan repo (langkah 0):** `desain/` diekstrak dari `Warkop_Nusantara.zip`
(17 folder layar, 17 `code.html` — terverifikasi), `git init -b main`, commit
pertama `Persiapan: dokumen + paket pendukung` (82806d3), remote `origin`
dipasang, **tidak di-push**.

| Fungsi | Berkas |
|---|---|
| Konfigurasi proyek | `package.json`, `package-lock.json`, `next.config.mjs`, `eslint.config.mjs`, `jsconfig.json`*, `.env.example`, `.dockerignore`, `.gitattributes` (baru — lihat KEPUTUSAN BARU 3), `README.md` |
| Tailwind & font | `tailwind.config.js`*, `postcss.config.js`*, `app/font.js`*, `app/globals.css`, `public/fonts/` (5 woff2 + 2 OFL)* |
| Server & proxy | `server.js`*, `proxy.js`*, `lib/socket/server.js` (`initSocket`, `ambilIo`) |
| Aplikasi | `app/layout.js`, `app/api/health/route.js`, `lib/db/index.js`, `lib/utils.js` (`waktuSekarang`, `waktuISOWIB`), `lib/navItems.js` |
| Ikon & logo | `components/ui/Ikon.js`*, `public/logo-warkop.png`*, `public/logo-warkop-besar.png`*, `public/favicon.ico`*, `public/apple-touch-icon.png`*, `public/og-default.png`* |
| Halaman sementara | `app/uji-desain/page.js` (dihapus Tahap 9), `app/uji-proxy/page.js` (dihapus Tahap 2) |
| Struktur folder | seluruh folder REFERENSI 6 dibuat; folder tanpa halaman diisi `.gitkeep` (bukan `page.js` kosong) |

`*` = disalin **apa adanya** dari `paket-pendukung/ASET/` (diverifikasi `cmp` identik: tailwind.config.js, server.js, proxy.js, font.js, Ikon.js, ketiga logo utama).

`.gitignore` yang disediakan **tidak diubah**; isinya sudah memuat `.env`/varian,
`node_modules/`, `.next/`, `_backup*`, `desain/`, zip, PNG asli, dan
`public/unggahan/*` + `!.gitkeep` (bukti `j-rahasia.txt`).

## 2. Versi terpasang & `npm audit`

Bukti: `a-npm-audit-versi.txt`

| Paket | Versi | Paket | Versi |
|---|---|---|---|
| Node | **v24.12.0** (≥22) | next | **16.3.4** |
| react / react-dom | 19.2.8 | mysql2 | 3.24.3 |
| bcryptjs | 2.4.3 | jose | 5.10.0 |
| socket.io / -client | 4.8.3 | dotenv | 16.6.1 |
| cross-env | 7.0.3 | tailwindcss | 3.4.19 |
| @tailwindcss/forms | 0.5.11 | postcss / autoprefixer | 8.5.26 / 10.5.4 |
| eslint | 9.39.5 | eslint-config-next | 16.3.4 |

`npm audit`: **found 0 vulnerabilities**. Catatan: npm mencetak peringatan
*deprecated* untuk `eslint@9.39.5` (rangkaian 9.x sudah tidak didukung; 10.x
tersedia). Rentang `^9.0.0` dipertahankan sesuai cetak biru bagian 4 —
`eslint-config-next` menerima `eslint >=9`, jadi kenaikan ke 10 bisa dilakukan
pemilik kapan saja (bukan cacat keamanan; audit 0).

Next.js 16.3.4 (bukan 16.3.3 seperti saat kerangka diverifikasi) — hasil uji
proxy **sama**.

## 3. Hasil UJI TAHAP 0

| Butir | Hasil | Bukti |
|---|---|---|
| a. Pemasangan + audit | LULUS — 420 paket, 0 kerentanan | `a-npm-audit-versi.txt` |
| b. Dev menyala, Socket.io terpasang | LULUS — `[warkop] Socket.io terpasang di path /socket.io`, siap di `0.0.0.0:3000 mode=dev`; handshake `0{"sid":…}` di produksi | `b-log-dev.txt`, `b2-socket-handshake-prod.txt`, `b3-log-prod.txt` |
| c. Healthcheck 200 → 503 → 200 | LULUS — DB menyala 200 `basisData:terhubung`; `docker stop` → **503** `terputus`; `docker start` → 200 | `c-health-200-503-200.txt` |
| d. Token desain | LULUS (tanpa peramban, diganti verifikasi numerik — rincian bagian 4) | `d1-…`, `d2-…`, `d3-…` |
| e. Font lokal | LULUS — `grep -c "fonts.g"` = **0**; 5 `<link rel="preload" … woff2>` ada di HTML produksi; tidak ada rujukan googleapis/gstatic di `.next/` | `e-font-lokal.txt` |
| f. Build | LULUS — `next build` hijau (Turbopack), tanpa peringatan bundler; `ƒ Proxy (Middleware)` tercetak | `f-build.txt` |
| g. Lint | LULUS — `eslint .` exit 0, 0 masalah; tidak ada `next lint` | `g-lint.txt` |
| h. Proxy di custom server (dev & produksi) | **LULUS** — halaman menampilkan `x-uji-proxy: proxy-berjalan` di keduanya | `h-curl-dev-uji-proxy.txt`, `h-curl-prod-uji-proxy.txt` |
| h2. Jebakan `request.url` | **TERKONFIRMASI** — `x-diag-url: http://0.0.0.0:3000/uji-proxy` walau `Host: staf.warkop.test` | `h2-curl-diag-url.txt` |
| i. Penelusuran larangan | LULUS — nihil di kode; kemunculan hanya di **komentar** yang menyebut larangan (dicantumkan apa adanya) | `i-penelusuran-larangan.txt` |
| j. Rahasia | LULUS — `.env`, `.env.local`, `_backup*` diabaikan; nilai `DB_PASSWORD`/`JWT_SECRET` lokal: 0 kemunculan di berkas yang di-commit | `j-rahasia.txt` |
| k. Logo | LULUS — 5 berkas 200 (`image/png`, `image/x-icon`); logo utama 390.742 byte (< 400 KB); identik dengan ASET | `k-logo-favicon.txt` |
| l. Struktur rute | LULUS — `app/(staf)/staf/…` bersarang; `/program` vs `/staf/program` tidak menabrak | `l-struktur-rute.txt` |
| m. Ikon | LULUS — **308** SVG `viewBox="0 -960 960 960"` (77 nama × 4 varian); `material-symbols-outlined` = **0** | `m-ikon.txt`, `m-uji-desain-render.html` |
| n. Plugin forms | LULUS — `input:where` di CSS produksi = 1 (reset forms aktif) | `n-plugin-forms.txt` |

Catatan uji e: Tahap 0 belum punya halaman `/` (`app/(publik)/page.js` dibuat
Tahap 4), sehingga `.next/server/app/index.html` tidak ada; grep dilakukan pada
halaman statis yang ada, `.next/server/app/uji-desain.html`, dan seluruh `.next/`.

## 4. UJI d — token desain tanpa peramban

Lingkungan ini tidak punya peramban, jadi perbandingan mata `/uji-desain` vs
`screen.png` **tidak dilakukan** (pemilik bisa membukanya sendiri — bagian 9).
Penggantinya tiga verifikasi numerik:

1. **`d1-banding-token.txt`** — skrip mengekstrak blok `tailwind.config` dari
   `beranda_warkop_nusantara/code.html` dan membandingkannya dengan
   `tailwind.config.js`: colors **47/47 identik**, borderRadius 4/4, spacing
   5/5, fontSize 8/8 (nilai persis), fontFamily 8/8 keluarga sama (desain
   menunjuk nama Google Font, proyek menunjuk `var(--font-*)`; alias `serif`/
   `sans` hanya di proyek — bagian dari kerangka), `darkMode: 'class'` sama.
2. **`d2-css-produksi-token.txt`** — CSS produksi (`.next/static/chunks/*.css`,
   21.179 byte) memuat kelas `.bg-<token>` untuk **47/47** warna dengan nilai
   rgb yang sama, 8/8 tipografi (ukuran + tinggi baris + berat + jarak huruf),
   5/5 spacing, 4/4 radius, variabel `--font-domine`/`--font-fira-sans`, dan
   reset `@tailwindcss/forms`. (`.font-serif`/`.font-sans` tidak muncul karena
   tidak dipakai halaman uji — perilaku normal Tailwind.)
3. **`d3-piksel-screen-png.txt`** — dekoder PNG minimal (zlib bawaan Node)
   menghitung piksel `beranda_warkop_nusantara/screen.png` (830×1600):
   `#ffffff` 30,63 %, `#faf9f5` (background) 24,58 %, `#271310` (primary)
   22,77 %, `#f4f4f0` (surface-container-low) 3,40 % — empat warna terbanyak di
   gambar rujukan **persis** hex token desain, menegaskan token yang dipakai
   `code.html` memang yang ter-render di screen.png.

## 5. UJI PROXY — keluaran apa adanya (butir h dan h2)

**Dev** (`node server.js`, Next.js 16.3.4) — `h-curl-dev-uji-proxy.txt`:

```
HTTP/1.1 200 OK
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
x-diag-url: http://0.0.0.0:3000/uji-proxy
…
<p>x-uji-proxy: proxy-berjalan</p>
```

**Produksi** (`next build` → `NODE_ENV=production node server.js`) —
`h-curl-prod-uji-proxy.txt`: `HTTP/1.1 200 OK … <p>x-uji-proxy: proxy-berjalan</p>`;
`f-build.txt` baris 26: `ƒ Proxy (Middleware)`.

**h2** — `h2-curl-diag-url.txt`:

```
$ curl.exe -i -H "Host: staf.warkop.test" http://localhost:3000/uji-proxy
HTTP/1.1 200 OK
…
x-diag-url: http://0.0.0.0:3000/uji-proxy
```

Nilai `request.url` = `http://0.0.0.0:3000/…`, **bukan** `staf.warkop.test` —
persis REFERENSI 16.8. Pengingat untuk Tahap 2: semua pengalihan lewat
`urlDariHeader()`. Header diagnosa sudah dihapus; `proxy.js` dikembalikan
identik dengan kerangka (`cmp` sama).

## 6. KEPUTUSAN BARU

1. **`connectTimeout: 5000` pada pool mysql2** (`lib/db/index.js`) — tidak ada
   di pola cetak biru bagian 7. Alasan: healthcheck Docker/Coolify memakai
   timeout 10 s; tanpa batas, `/api/health` bisa menggantung lebih lama saat DB
   mati. Diuji: 503 kembali dalam < 1 s.
2. **Nama `ikon` di `lib/navItems.js` memakai nama Material Symbols**
   (`dashboard`, `edit_document`, `gavel`, `badge`, `campaign`, `photo_library`,
   `group`, `settings`) — contoh di TAHAP-00 memakai alias `artikel`/`palu` yang
   tidak ada di `Ikon.js`. Tiga pertama persis dari sidebar
   `dashboard_staff_warkop/code.html`; lima menu lain (pengurus, program,
   galeri, pengguna, pengaturan) tidak digambar di sidebar desain, ikonnya
   dipilih dari 77 nama yang tersedia di `Ikon.js`. `menuUntukPeran(peran)`
   ditambahkan sebagai pembantu. Kolom `peran` mengikuti REFERENSI 11.
3. **`.gitattributes`** (`* text=auto eol=lf`, `*.sh eol=lf`, biner) dan
   `core.autocrlf=false` **lokal repo** — Git di mesin ini memakai
   `autocrlf=true` global, sehingga skrip `.sh` (Tahap 1: `cadangkan-db.sh`)
   akan ter-checkout CRLF dan gagal di container Alpine.
4. **`metadataBase`** di `app/layout.js` dari `NEXT_PUBLIC_APP_URL`
   (bawaan `http://localhost:3000`) — menghilangkan peringatan Next.js dan
   membuat URL `og:image` absolut benar di produksi.
5. **Override ESLint** untuk `tailwind.config.js` dan `postcss.config.js`
   (`import/no-anonymous-default-export: off`) — kedua berkas adalah salinan
   kerangka baca-saja; aturan dimatikan di `eslint.config.mjs`, berkasnya tidak
   diubah.
6. **Kontainer MariaDB lokal** dibuat lebih awal (dibutuhkan UJI c) — belum
   ada perintahnya di TAHAP-01: `docker run -d --name warkop-mariadb
   -e MARIADB_ROOT_PASSWORD=… -e MARIADB_DATABASE=warkop_nusantara
   -e MARIADB_USER=warkop -e MARIADB_PASSWORD=… -e TZ=UTC
   -p 127.0.0.1:3306:3306 -v warkop-mariadb-data:/var/lib/mysql mariadb:11`
   (MariaDB **11.8.9**). Port hanya terikat ke `127.0.0.1`. `TZ=UTC` sengaja,
   agar uji zona waktu Tahap 1 menguji kondisi sebenarnya (server DB UTC).
   Kredensial hanya di `.env` lokal (diabaikan git).
7. **`.env` lokal** dibuat dengan nilai acak (`openssl rand`) untuk DB, JWT,
   dan seed — tidak di-commit (bukti j).
8. **`lib/utils.js`** sudah memuat `waktuSekarang()` (format
   `YYYY-MM-DD HH:mm:ss` WIB) yang diminta TAHAP-01, karena `/api/health`
   memerlukan pemformat WIB yang sama (`waktuISOWIB`). Perhitungan dari UTC+7,
   tidak bergantung zona waktu mesin.
9. **Kelas `<body>`** di layout akar disalin persis dari `<body>`
   `beranda_warkop_nusantara/code.html` (bukan dirancang sendiri).
10. **Header keamanan awal** di `next.config.mjs` (`X-Content-Type-Options`,
    `X-Frame-Options: DENY`, `Referrer-Policy`) — kerangka yang dilengkapi
    Tahap 9.

## 7. Sengaja belum dikerjakan

| Hal | Tahap |
|---|---|
| Skema/seed DB, modul `lib/db/*.js` domain, `lib/kategori*.js` | 1 |
| Logika proxy (pemisahan host, JWT), hapus `app/uji-proxy/` | 2 |
| `Dockerfile`, `docker-compose.yml`, `PENERAPAN.md` | 3 |
| Halaman publik, `HeaderPublik`/`FooterPublik`, `hooks/useViewportTinggi.js` | 4 |
| Event Socket.io, `lib/socket/siaran.js`, `hooks/useSocket.js` | 8 |
| CSP/HSTS lengkap, hapus `app/uji-desain/`, penelusuran kode mati | 9 |
| `git push` ke `origin` | hanya atas perintah pemilik |

## 8. Temuan & pertentangan dokumen

1. **Temuan satu-kali (dev saja):** pada start **pertama** dev server dengan
   cache Turbopack dingin, permintaan yang datang saat proxy masih dikompilasi
   (`○ Compiling proxy …`, 16,6 s) mendapat **404** — dan 404 itu **menetap**
   untuk semua rute (`/api/health`, `/uji-proxy`) sampai server dimulai ulang.
   Setelah mulai ulang bersih (`.next` dihapus) hasilnya 200 dan tidak terulang
   pada tiga percobaan berikutnya, termasuk dengan permintaan 6 detik setelah
   start. Tanpa `proxy.js`, tidak terjadi. Produksi tidak mengompilasi saat
   runtime sehingga tidak terdampak. Dicatat agar tidak disalahartikan sebagai
   "proxy tidak berjalan" bila muncul lagi; obatnya mulai ulang `npm run dev`.
2. **Peringatan Next.js "Slow filesystem detected"** (206–212 ms) untuk
   `.next/dev` di `D:` — hanya kinerja dev, bukan galat.
3. **TAHAP-00 vs REFERENSI/Ikon.js:** contoh `navItems` di TAHAP-00 memakai
   `ikon: 'artikel'`/`'palu'`, sedangkan REFERENSI 9 cacat 4 mewajibkan nama
   Material dari `Ikon.js`. Dipilih nama Material (KEPUTUSAN BARU 2).
4. **CLAUDE.md ("simpan UTC, tampilkan WIB") vs cetak biru bagian 7
   (`timezone: '+07:00'` + `SET time_zone='+07:00'`)** — untuk Tahap 0 pola
   cetak biru disalin persis (wajib). Tahap 1 (UJI c zona waktu) akan
   menunjukkan perilaku aktualnya; bila bertentangan, dilaporkan di sana,
   tidak diputuskan diam-diam.
5. **Ikon.js: 77 nama + 15 varian terisi = 92 kunci** (BACA-INI menyebut
   "77 + 15"); `DAFTAR_IKON` = 77 sesuai dokumen.
6. `.next/static/chunks/*.css` di Next 16 hanya satu berkas (`3w84k0pz05vr9.css`) —
   pola grep di TAHAP-00 tetap berlaku.

## 9. Cara menguji ulang (pemilik)

```powershell
cd D:\Deploy\LSM
npm install ; npm audit
npm run lint ; npm run build            # harus ada baris "ƒ Proxy (Middleware)"
npm run dev                             # jendela lain:
curl.exe -i http://localhost:3000/uji-proxy | Select-String "proxy-berjalan"
curl.exe -i http://localhost:3000/api/health
docker stop warkop-mariadb ; curl.exe -i http://localhost:3000/api/health   # 503
docker start warkop-mariadb ; Start-Sleep 8 ; curl.exe -i http://localhost:3000/api/health   # 200
# token desain: buka http://localhost:3000/uji-desain dan sandingkan dengan
#   desain\stitch_portal_berita_inklusif\beranda_warkop_nusantara\screen.png
```

## 10. `package.json`

**Berubah (dibuat baru).** Dependensi persis cetak biru bagian 4; tidak ada
paket di luar daftar (`slugify`, `sharp`, `isomorphic-dompurify` belum
dibutuhkan, belum dipasang). Skrip: `dev`, `build`, `start`, `seed`, `lint`.

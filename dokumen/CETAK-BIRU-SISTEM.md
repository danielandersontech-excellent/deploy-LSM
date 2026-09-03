# CETAK BIRU SISTEM v2.1 (pola Cap Jiki, disesuaikan Next.js 16)

Panduan lengkap membangun sistem baru dengan arsitektur yang sama seperti
Cap Jiki Live: Next.js sebagai frontend DAN backend, MariaDB sebagai basis
data, dijalankan dengan Docker di atas Coolify.

Dokumen ini disusun dari sistem Cap Jiki yang sudah berjalan di produksi,
termasuk kesalahan yang pernah terjadi dan cara menghindarinya.

---

## APA YANG BERUBAH DARI v1

v1 disusun saat Next.js 14 masih didukung. Sejak itu tiga hal berubah dan
memaksa pembaruan dokumen ini.

| Hal | v1 | v2 | Alasan |
|---|---|---|---|
| Next.js | `14.2.15` dipatok | `16.3.x` | Next.js 14 berakhir masa dukungannya 26 Oktober 2025 (patch terakhir 14.2.35, 11 Desember 2025). CVE-2025-29927 (CVSS 9.1) — middleware authorization bypass — baru ditambal di 14.2.25, dan rangkaian advisori Mei 2026 tidak lagi menyentuh cabang 14.x |
| Lapisan penjaga ke-2 | `middleware.js` | `proxy.js` | Next.js 16 mengganti nama konvensinya. Bukan sekadar ganti nama — lihat bagian 8 |
| Alur penerapan | ZIP proyek utuh | **kerja langsung di repo + satu commit per tahap (Claude Code)** | Bagian 13 |

Sepuluh pelajaran di bagian 11 **tidak berubah**. Itu bagian paling berharga
dokumen ini, dan seluruhnya masih berlaku.

**v2.1 (31 Agustus 2026):** dua hal yang di v2 masih andaian kini **terbukti
dengan percobaan** pada Next.js 16.3.3 — proxy berjalan di custom server
(bagian 8), dan `request.url` di proxy **bukan** host asli di bawah custom
server (Pelajaran nomor 15, bagian 12). Dependensi bertambah satu:
`@tailwindcss/forms` (bagian 4).

---

## 1. Gambaran Arsitektur

```
                    Internet
                       |
                 Cloudflare (DNS + proxy)
                       |
              Traefik v3 (dikelola Coolify)
                       |
             aplikasi Next.js 16 (satu container)
             custom server.js = Next.js + Socket.io
                 |            |
          domain utama    subdomain peran
          (publik)        (ruang kerja)
                       |
              MariaDB 11 (container terpisah)
```

Ciri khas pola ini:

- **Satu aplikasi, banyak peran.** Frontend dan backend berada di satu proyek
  Next.js. Tidak ada server API terpisah.
- **Satu peran, satu subdomain.** Tiap peran dilayani di subdomainnya sendiri.
  `proxy.js` yang mengaturnya.
- **Custom server.** Karena butuh Socket.io, aplikasi TIDAK memakai
  `next start` melainkan `server.js` buatan sendiri yang menggabungkan
  Next.js + Socket.io.
- **Basis data di container terpisah**, tidak pernah terekspos ke internet.

---

## 2. Persiapan Server

Mengasumsikan server sudah berjalan dengan **Ubuntu + Coolify**.

**Daftar periksa server:**

1. **Login SSH hanya dengan kunci.** `PasswordAuthentication no` di
   `/etc/ssh/sshd_config`, lalu `sudo systemctl restart ssh`.
2. **Panel Coolify tidak boleh terbuka ke internet.** Port 8000 JANGAN dibuka.
   Akses lewat terowongan SSH:
   `ssh -i ~/.ssh/id_ed25519 -L 8000:localhost:8000 pengguna@IP_SERVER`
   lalu buka `http://localhost:8000`.
3. **Buat container basis data lebih dulu** (MariaDB 11) lewat Coolify, di
   project yang sama dengan aplikasi. Catat nama containernya — nama itu yang
   dipakai sebagai `DB_HOST`.
4. **Arahkan domain** ke IP server, lalu daftarkan seluruh subdomain pada
   aplikasi di Coolify agar Traefik menerbitkan sertifikat HTTPS-nya.
5. **Buat aplikasi** di Coolify dengan sumber repositori Git, lalu isi variabel
   lingkungan (bagian 5). Rahasia ditandai **Runtime only**.

**Soal ukuran server:** yang paling menentukan adalah jumlah pengguna
bersamaan. Bila terasa berat, yang biasanya lebih dulu penuh adalah **RAM**,
bukan CPU.

**Firewall**, buka seperlunya saja:

| Port | Untuk |
|---|---|
| 22 | SSH |
| 80, 443 | web (Traefik) |

Port basis data (3306) **tidak pernah** dibuka. Antar container sudah saling
terhubung lewat jaringan internal Docker.

---

## 3. Struktur Proyek

```
proyek/
  app/
    (auth)/login/            halaman masuk
    (peran)/                 area berperan
      peran/                 SEGMEN BERSARANG — lihat catatan di bawah
        layout.js            penjaga peran + navigasi
        ...
    (publik)/                halaman publik tanpa login
    api/                     SELURUH backend ada di sini
      auth/login/route.js
      health/route.js
      ...
    layout.js
    globals.css
  components/                komponen bersama
    ui/                      komponen dasar
  hooks/                     hook React
  lib/
    auth/                    JWT, cookie, sesi, penjaga peran
    db/                      koneksi + SELURUH kueri SQL
    socket/                  server Socket.io + pembantu siaran
    navItems.js              daftar menu per peran (satu sumber kebenaran)
  database/
    schema.sql
    seed.sql
    migrations/
  scripts/seed.js
  public/
  server.js                  Next.js + Socket.io
  proxy.js                   (v1: middleware.js)
  next.config.mjs
  Dockerfile
  .env.example
```

Aturan yang membuat proyek tetap rapi:

- **Semua SQL di `lib/db/`.** Route API tidak pernah menulis SQL sendiri.
  Ini yang membuat perubahan skema mudah ditelusuri.
- **Menu di satu berkas** (`lib/navItems.js`). Menambah halaman berarti
  menambah satu baris, bukan menyunting banyak layout.
- **Tiap area punya `layout.js` dengan penjaga peran.** Ini lapisan pertama
  di aplikasi; lapisan berikutnya ada di tiap route API.

**CATATAN PENTING — segmen bersarang.** Route group `(nama)` **tidak ikut
membentuk URL**. Bila area publik dan area peran sama-sama punya halaman
bernama sama (`program`, `galeri`), keduanya mengarah ke path yang sama dan
**build gagal**. Karena itu halaman berperan selalu bersarang di segmen
bernama: `app/(staf)/staf/program/page.js` → `/staf/program`.

Cap Jiki memakai pola ini sejak awal (`(owner)/owner/...`). Jangan
menghilangkan segmen bersarangnya.

---

## 4. Dependensi (package.json)

```json
{
  "type": "module",
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "cross-env NODE_ENV=production node server.js",
    "seed": "node scripts/seed.js",
    "lint": "eslint ."
  },
  "dependencies": {
    "next": "^16.3.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "mysql2": "^3.11.3",
    "bcryptjs": "^2.4.3",
    "jose": "^5.9.6",
    "socket.io": "^4.8.0",
    "socket.io-client": "^4.8.0",
    "dotenv": "^16.4.5",
    "cross-env": "^7.0.3"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.13",
    "@tailwindcss/forms": "^0.5.9",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.3.0"
  },
  "engines": { "node": ">=22" }
}
```

**Perubahan dari v1 dan alasannya:**

| Perubahan | Alasan |
|---|---|
| `next` 14.2.15 → ^16.3.0 | Cabang 14 sudah EOL. 16.x adalah Active LTS |
| `react` 18 → ^19.2 | Next.js 16 App Router mensyaratkan React 19.2 |
| `node` >=20 → **>=22** | Next.js 16 mensyaratkan minimal Node 20.9. Node 22 dipakai untuk kelonggaran, bukan menempel di batas minimum |
| `jsonwebtoken` **dihapus** | `jose` sudah cukup dan bekerja di kedua runtime. Satu paket lebih sedikit = permukaan serangan lebih kecil |
| Script `lint` ditambahkan | `next lint` **dihapus** di Next.js 16; panggil ESLint langsung |
| `@tailwindcss/forms` ditambahkan (v2.1) | Export desain memuat plugin `forms` lewat CDN; tanpa plugin ini gaya bawaan `input`/`select` berbeda dari `screen.png` |

Tambahan bila diperlukan: `slugify`, `sharp`, `isomorphic-dompurify`,
`next-pwa`, `web-push`, `pdfkit`, `archiver`, `ioredis`.

**Selalu periksa rilis keamanan terbaru sebelum memasang versi.** Angka di atas
benar per akhir Agustus 2026 dan akan berubah. Versi yang **terverifikasi
membangun dan berjalan bersama** pada 31 Agustus 2026: `next 16.3.3`,
`react 19.2.8`, `socket.io 4.8.3`, `tailwindcss 3.4.19`,
`@tailwindcss/forms 0.5.11`, Node 22.22.2 (`npm audit`: 0 kerentanan).

---

## 5. Variabel Lingkungan (ENV)

Yang berawalan `NEXT_PUBLIC_` **ikut terkirim ke peramban** — jangan pernah
menaruh rahasia di sana.

### Basis data (rahasia, hanya server)
```
DB_HOST=nama_container_database
DB_PORT=3306
DB_USER=nama_pengguna
DB_PASSWORD=kata_sandi_kuat
DB_NAME=nama_basis_data
DB_POOL_LIMIT=10
```

### Autentikasi (rahasia)
```
JWT_SECRET=<hasil: openssl rand -hex 48>
JWT_EXPIRY=8h
```

### Aplikasi
```
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
TZ=Asia/Jakarta
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_URL=https://domain-anda.net
NEXT_PUBLIC_WS_URL=wss://domain-anda.net
```

### Pemisahan peran per subdomain
```
STAF_HOST=staf.domain-anda.net
```
Domain utama untuk halaman publik.

### Aturan penting di Coolify

Tandai variabel rahasia sebagai **Runtime only**, JANGAN "Available at
Buildtime". Bila ikut waktu build, nilainya tercetak terbuka di log build.
Ini terjadi di Cap Jiki dan menjadi utang keamanan yang harus dibereskan
belakangan.

---

## 6. Dockerfile

Pola tiga tahap. Perhatikan komentarnya, terutama soal rahasia.

```dockerfile
# --- Tahap 1: dependensi ---
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# --- Tahap 2: build ---
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# HANYA variabel publik yang boleh jadi ARG. Nilai NEXT_PUBLIC_* memang
# tertanam ke berkas JavaScript saat build, jadi wajar ada di sini.
# JANGAN pernah menaruh DB_PASSWORD / JWT_SECRET sebagai ARG.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NODE_ENV=production
RUN npm run build
RUN npm prune --omit=dev

# --- Tahap 3: runtime ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Asia/Jakarta
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache tzdata wget && \
    cp /usr/share/zoneinfo/Asia/Jakarta /etc/localtime && \
    echo "Asia/Jakarta" > /etc/timezone

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Custom server butuh source, bukan hanya .next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next        ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public       ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=nextjs:nodejs /app/server.js    ./server.js
COPY --from=builder --chown=nextjs:nodejs /app/proxy.js     ./proxy.js
COPY --from=builder --chown=nextjs:nodejs /app/lib          ./lib
COPY --from=builder --chown=nextjs:nodejs /app/database     ./database

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

Tiga hal yang WAJIB diingat:

1. **Jangan pakai `output: 'standalone'`** bila memakai custom server. Runtime
   harus membawa `node_modules` penuh dan berkas sumber (`server.js`, `lib/`).
   Di Next.js 16 ini makin penting: dengan `output: 'standalone'`, perintah
   `next start` tidak lagi melayani aplikasi.
2. **Sediakan `/api/health`** yang mengembalikan 200. Tanpa itu, Coolify tidak
   tahu container sudah siap dan pergantian versi jadi berisiko.
3. **Salin `proxy.js`**, bukan `middleware.js` (v1). Bila berkas ini tidak ada
   di image, Next.js **tidak melempar galat** — ia hanya berjalan tanpa proxy.
   Kesalahan ini tidak terlihat sampai ada yang mengaksesnya.

---

## 7. Basis Data

Jalankan MariaDB 11 sebagai container terpisah di Coolify. Jangan buka portnya
ke internet; cukup panggil lewat nama containernya dari `DB_HOST`.

Konvensi tabel yang dipakai Cap Jiki dan terbukti nyaman:

- `users` dengan kolom `role` bertipe enum, plus kolom relasi antar peran.
- Tabel **buku besar** untuk setiap perpindahan keadaan penting, berisi nilai
  **sebelum** dan **sesudah**. Ini menyelamatkan banyak waktu saat menelusuri
  sengketa.
- `pengaturan` (kunci-nilai) untuk setelan yang boleh diubah tanpa deploy.
- Kolom waktu memakai `DATETIME`, dan **selalu diisi dari aplikasi**, bukan
  `CURRENT_TIMESTAMP`. Alasannya di Pelajaran nomor 1.

Pola koneksi (`lib/db/index.js`):

```js
pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
  timezone: '+07:00',
  charset: 'utf8mb4_unicode_ci',
});

// WAJIB: samakan zona waktu sesi, agar NOW() dan CURRENT_TIMESTAMP
// menghasilkan waktu lokal, bukan UTC.
pool.on('connection', (conn) => {
  conn.query("SET time_zone = '+07:00'");
});
```

Sediakan tiga berkas: `schema.sql` (struktur), `seed.sql` (data awal), dan
folder `migrations/` untuk perubahan berikutnya. Jangan pernah mengubah
`schema.sql` untuk basis data yang sudah berjalan; buat migrasi baru.

---

## 8. Autentikasi dan Peran

Lapisan yang dipakai:

1. **Login** memeriksa kata sandi dengan `bcryptjs`, lalu menerbitkan JWT dan
   menyimpannya di cookie `httpOnly`.
2. **`proxy.js`** membaca cookie, memverifikasi token, lalu:
   - mengarahkan pengguna ke subdomain yang sesuai perannya,
   - meneruskan identitas ke halaman lewat header `x-user-id` / `x-user-role`.
3. **`requireUser([...peran])`** di tiap `layout.js` area.
4. **`requireRole(user, [...peran])`** di **setiap** route API.

Lapisan ke-4 adalah yang paling sering dilupakan. Menyembunyikan menu tidak
mengamankan apa pun; yang mengamankan adalah penjaga di route API.

### Yang berubah di Next.js 16, dan mengapa itu penting

`middleware.js` diganti menjadi `proxy.js`, dengan fungsi bernama `proxy`.
API-nya hampir identik — `config.matcher` tetap sama. Tetapi penggantian nama
ini **bukan sekadar kosmetik**.

Dokumentasi Next.js 16 menyatakan secara eksplisit bahwa proxy **tidak
dimaksudkan sebagai solusi manajemen sesi atau otorisasi yang utuh**. Ia berguna
untuk pemeriksaan optimistis seperti pengalihan berbasis izin, bukan sebagai
pagar. Dokumentasi yang sama menganjurkan agar autentikasi dan otorisasi selalu
diverifikasi **di dalam setiap Server Function**, bukan mengandalkan proxy.

Latar belakangnya adalah CVE-2025-29927: sebuah header internal
(`x-middleware-subrequest`) memungkinkan penyerang melewati seluruh pemeriksaan
di lapisan itu.

**Untuk kita, ini bukan kabar buruk — ini penegasan.** Lapisan 3 dan 4 sudah
menjadi pagar sungguhan sejak v1, dan lapisan 2 memang selalu diperlakukan
sebagai kenyamanan. Yang berubah hanya penegasannya: **jangan pernah menaruh
keputusan otorisasi hanya di `proxy.js`.**

Tiga aturan tambahan untuk `proxy.js`:

- Fungsi wajib bernama `proxy` (atau default export). Bila hanya berkasnya yang
  diganti nama tanpa mengganti nama fungsinya, Next.js melempar galat.
- Proxy berjalan di **runtime Node.js**; opsi `runtime` tidak tersedia dan akan
  melempar galat bila diisi.
- Proxy tidak boleh bergantung pada modul bersama atau variabel global.
  Sampaikan informasi ke aplikasi lewat header, cookie, rewrite, atau URL.

**Sudah dibuktikan (v2.1, 31 Agustus 2026):** dokumentasi hanya menyebut proxy
bekerja dengan `next start`; kita memakai **custom server**. Diuji langsung pada
Next.js 16.3.3 dengan `server.js` pola bagian 9: `proxy.js` **berjalan** di dev
maupun produksi — header yang diset proxy sampai ke halaman, pengalihan host
bekerja, `next build` menampilkan `ƒ Proxy (Middleware)`. Tahap 0 tetap
mengulang uji ini sebagai konfirmasi di lingkungan pelaksana.

**Jebakan yang ditemukan saat membuktikannya:** di bawah custom server,
`request.url` dan `request.nextUrl.host` di proxy berisi `hostname:port` yang
diberikan ke `next()` (`0.0.0.0:3000`), bukan host yang diminta pengguna.
`NextResponse.redirect(new URL('/x', request.url))` — pola dokumentasi resmi —
mengalihkan ke `https://0.0.0.0:3000/x` di produksi. Susun URL pengalihan dari
header `x-forwarded-host`/`host` + `x-forwarded-proto` (fungsi `urlDariHeader`
di kerangka `proxy.js` PAKET-PENDUKUNG). Pelajaran nomor 15.

Tambahan yang berguna: kolom `token_version` pada `users`. Menaikkan angkanya
membuat seluruh token lama pengguna tersebut tidak berlaku.

---

## 9. Realtime (Socket.io)

`server.js` menggabungkan Next.js dan Socket.io dalam satu proses:

```js
const app = next({ dev, hostname, port });
await app.prepare();
const handle = app.getRequestHandler();
const server = createServer((req, res) => handle(req, res));
initSocket(server);          // pasang Socket.io
server.listen(port, hostname);
```

Pola siaran yang dipakai:

- Setiap socket yang lolos autentikasi masuk room `global` (semua orang),
  room `user:<id>` (pribadi), dan room peran untuk pengelola.
- Instance `io` disimpan di `globalThis` agar route API bisa memakainya
  walaupun berada di bundle yang berbeda.
- Route API memanggil pembantu seperti `siarkanX(...)`, tidak pernah menyentuh
  `io` secara langsung.

**Catatan Next.js 16:** Turbopack kini menjadi bundler bawaan. Custom server
tetap didukung, tetapi pastikan `npm run dev` dan `npm run build` diuji
keduanya sejak Tahap 0 — jangan menemukan ketidakcocokan bundler setelah
aplikasi besar.

---

## 10. Alur Kerja Penerapan

```
ubah kode di lokal
   -> git add -A && git commit && git push
   -> buka terowongan SSH ke server
   -> Coolify: aplikasi -> Deployments -> Redeploy
   -> tunggu "Rolling update completed"
```

Coolify melakukan rolling update: container baru dijalankan, diperiksa
kesehatannya, baru container lama dihentikan. Bila healthcheck gagal, versi
lama tetap melayani.

Untuk perubahan basis data, jalankan SQL lewat SSH:

```bash
sudo docker exec -i <container_db> mariadb -u<user> -p'<sandi>' <nama_db> << 'SQL'
  ... perintah SQL ...
SQL
```

Selalu jalankan SELECT pemeriksaan lebih dulu sebelum UPDATE atau DELETE.

---

## 11. Pelajaran dari Cap Jiki (bagian paling berharga)

Kesalahan nyata yang pernah terjadi, beserta pencegahannya.
**Bagian ini tidak berubah dari v1.**

### 1. Zona waktu basis data adalah UTC
Server database berjalan pada UTC, sedangkan aplikasi memakai WIB. Kolom yang
diisi `CURRENT_TIMESTAMP` tertinggal 7 jam, sehingga penyaringan laporan
"hari ini" salah dan jam hasil tampak acak.

**Cegah:** setel `SET time_zone='+07:00'` pada setiap koneksi, dan isi kolom
waktu penting dari aplikasi, bukan dari `NOW()`.

### 2. Rahasia bocor lewat log build
`JWT_SECRET` dan `DB_PASSWORD` ditandai tersedia saat build, sehingga tercetak
terbuka di log build Coolify.

**Cegah:** tandai rahasia sebagai **Runtime only**. Hanya `NEXT_PUBLIC_*` yang
boleh ikut waktu build.

### 3. Menyembunyikan menu bukan pengamanan
Menu pemilik disembunyikan, tetapi route API-nya masih mengizinkan peran itu.
Siapa pun yang tahu alamatnya masih bisa memakainya.

**Cegah:** setiap route API memeriksa peran sendiri. Anggap menu hanya
kenyamanan, bukan pagar.

### 4. Aturan CSS `!important` merusak layar penuh
Ada aturan `.gc-video > div { height: ... !important }` untuk layar kecil.
Karena `!important` mengalahkan gaya sebaris, kotak layar penuh ikut dipaksa
setinggi 200px: tampilan menghitam dan terpotong.

**Cegah:** hindari `!important`. Untuk hamparan layar penuh, pindahkan
elemennya ke `<body>` memakai React Portal agar bebas dari aturan induk.

### 5. Satuan `100vh` tidak dapat dipercaya di iOS
Safari iOS menghitung `100vh` termasuk area di balik bilah alamat, sehingga
konten terpotong dan tombol tertutup.

**Cegah:** ukur dengan `window.visualViewport` lalu pasang dalam piksel, dan
ukur ulang saat layar berputar.

### 6. Meminta fullscreen pada elemen yang sudah dilepas
Saat elemen dipindah ke portal, kode masih memanggil `requestFullscreen()`
pada elemen lama. Di Android hasilnya layar hitam.

**Cegah:** bila memakai hamparan berbasis CSS, cukup pakai itu untuk semua
perangkat. Konsistensi lebih berharga daripada fullscreen bawaan.

### 7. Data tanpa induk merusak laporan
Ronde yang dibuka manual tidak tertaut jadwal, sehingga stempel waktunya
memakai detik pengisian dan hasilnya masuk kolom "Lainnya", sekaligus
memblokir slot berikutnya.

**Cegah:** tetapkan aturan tegas sejak awal, lalu paksakan di route API. Untuk
kebutuhan di luar aturan, sediakan cara resmi menambahnya, bukan membuka pintu
bebas.

### 8. Daftar putih setelan yang terlupakan
Setelan baru ditambahkan ke tampilan, tetapi kuncinya belum masuk daftar putih
di route API. Nilainya ditolak diam-diam: tampak tersimpan padahal tidak.

**Cegah:** setiap menambah setelan, ubah dua tempat sekaligus (daftar field di
tampilan dan daftar putih di API), lalu uji simpan-muat ulang.

### 9. Kode mati menumpuk
Ditemukan enam route API yang tidak pernah dipanggil dan tiga komponen yang
tidak pernah diimpor.

**Cegah:** telusuri berkala. Route yang menganggur tetap dapat diakses dan
menambah permukaan serangan tanpa memberi manfaat.

### 10. DHCP pada perangkat tetap
IP perangkat berubah sendiri setelah listrik mati, dan layanan mati tanpa sebab
yang jelas.

**Cegah:** kunci IP untuk seluruh perangkat tetap.

---

## 12. Pelajaran Tambahan v2 (khas Next.js 16)

Empat jebakan yang belum ada di v1.

### 11. Build hijau bukan berarti sistem jalan
Beberapa perubahan Next.js 16 tidak melempar galat saat build. `proxy.js` yang
tidak ditemukan **tidak** menghentikan build — Next.js hanya berjalan tanpa
proxy. Bila proxy itu yang menjaga pemisahan host, kamu baru tahu setelah ada
yang mengaksesnya.

**Cegah:** setiap perubahan yang menyentuh proxy diuji dengan permintaan
sungguhan, bukan dengan melihat build hijau.

### 12. API permintaan kini asinkron sepenuhnya
`cookies()`, `headers()`, `params`, dan `searchParams` hanya memberi peringatan
di Next.js 15. Di 16 mereka **tidak berfungsi lagi** bila dibaca secara sinkron.

**Cegah:** `await` semuanya, tanpa kecuali. Telusuri seluruh proyek sebelum
menerapkan.

### 13. Turbopack menjadi bawaan
Bundler berganti. Konfigurasi yang mengandalkan perilaku webpack bisa gagal
tanpa penjelasan yang jelas.

**Cegah:** uji `npm run dev` dan `npm run build` sejak Tahap 0, selagi proyek
masih kosong dan penyebabnya mudah ditemukan.

### 14. `next lint` dihapus
Perintahnya tidak ada lagi. Skrip CI yang memanggilnya akan gagal.

**Cegah:** panggil `eslint` langsung lewat skrip `lint` di `package.json`.

### 15. `request.url` di proxy bukan host asli (khas custom server)
Ditemukan saat membuktikan bagian 8. Di bawah `server.js`, `request.url` di
`proxy()` berisi `0.0.0.0:3000`, bukan `staf.<domain>`, meski header `Host`
benar. Pengalihan yang disusun dari `request.url` mengirim pengguna ke alamat
yang tidak bisa dibuka.

**Cegah:** susun URL absolut dari header `x-forwarded-host` / `host` dan
`x-forwarded-proto`. Uji pengalihan dengan curl memakai header `Host` yang
sesungguhnya, dan periksa nilai `Location` — bukan hanya kode 307.

---

## 13. Alur Perubahan Kode (edisi Claude Code)

Claude Code bekerja **langsung di repo** `D:\Deploy\LSM`. Yang menggantikan
paket perubahan adalah disiplin git per tahap:

```
kerjakan dokumen/TAHAP-XX          langsung di repo
jalankan seluruh UJI TAHAP         bukti disimpan di laporan/bukti-tahap-XX/
tulis laporan/LAPORAN-TAHAP-XX.md
npm run build                      WAJIB hijau sebelum commit
git add -A ; git commit -m "Tahap XX: <ringkasan>"
BERHENTI                           pemilik memeriksa laporan + git diff/show
                                   sebelum mengetik "lanjut"
```

Aturan yang mempertahankan manfaat alur lama:

- **Satu tahap = satu commit** (boleh lebih bila tahapnya besar, tetapi tiap
  commit utuh dan build hijau). `git show --stat` per commit = daftar berkas
  yang berubah.
- **`git push` dan penerapan di Coolify hanya atas perintah pemilik.**
- Perubahan skema basis data ditulis sebagai berkas `sql/` bernomor dan
  dijalankan sadar (lokal oleh Claude Code lewat `docker exec`; di server oleh
  pemilik) — jangan pernah otomatis saat aplikasi menyala.
- Bila rusak sebelum commit: `git checkout -- .` / `git clean -fd` (jangan
  menyentuh `desain/`, `paket-pendukung/`, `dokumen/`). Bila sudah ter-commit:
  `git revert`.

Alasannya tetap sama seperti v2: `git diff` tiap tahap bersih dan bisa
ditinjau, riwayat git menjadi catatan yang jujur.

Rinciannya di `dokumen/ALUR-KERJA-CLAUDE-CODE.md`.

---

## 14. Urutan Membangun yang Disarankan

1. Siapkan server, Coolify, dan domain.
2. Buat repositori: struktur folder, `package.json`, `.env.example`.
3. Basis data: `schema.sql` dan `seed.sql`, jalankan di container MariaDB.
4. Autentikasi: login, JWT, cookie, `proxy.js`, penjaga peran.
5. Kerangka satu peran dari ujung ke ujung (halaman + API + kueri).
6. Dockerfile dan penerapan pertama. Pastikan healthcheck hijau.
7. Baru tambahkan peran dan fitur berikutnya, satu per satu.

Langkah 6 sengaja diletakkan lebih awal. Menerapkan lebih dulu selagi sistem
masih kecil membuat masalah penerapan mudah ditemukan, dibandingkan menemukan
puluhan masalah sekaligus setelah aplikasi besar.

---

## 15. Daftar Periksa Sebelum Produksi

- [ ] `JWT_SECRET` acak minimal 48 byte, ditandai Runtime only
- [ ] Kata sandi basis data kuat, port 3306 tidak terbuka
- [ ] Login SSH hanya dengan kunci
- [ ] Panel Coolify tidak dapat diakses dari internet
- [ ] Firewall hanya membuka port yang benar-benar dipakai
- [ ] `/api/health` ada dan healthcheck hijau
- [ ] Zona waktu selaras: OS, container, sesi basis data
- [ ] Setiap route API memeriksa peran
- [ ] Rencana pencadangan basis data berkala, **sudah diuji pulih**
- [ ] Percobaan rollback: `git revert` lalu Redeploy

Tambahan v2:

- [ ] `proxy.js` ada di image, dan **terbukti berjalan** di bawah custom server
- [ ] Setiap pengalihan di `proxy.js` menghasilkan `Location` dengan host asli, bukan `0.0.0.0:3000`
- [ ] Tidak ada `cookies()`, `headers()`, `params`, `searchParams` yang dibaca
      tanpa `await`
- [ ] Versi Next.js masih dalam masa dukungan, dan advisori terbaru sudah
      diperiksa
- [ ] `npm run build` hijau dengan Turbopack

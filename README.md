# WARKOP NUSANTARA — Sistem Portal, Berita, dan Pengaduan

Sistem produksi LSM **WARKOP NUSANTARA** (Wadah Aspirasi Rakyat, Kontrol,
Observasi dan Pengawasan Nusantara). Dua fungsi utama:

- **A. Portal publik + kanal berita/investigasi** — profil lembaga, struktur,
  program, galeri, dan blog kelas ruang redaksi.
- **B. Kanal pengaduan masyarakat + ruang kerja staf** — pelapor boleh anonim,
  identitas dilindungi berlapis, setiap perubahan status terekam permanen di
  tabel buku besar.

Arsitektur mengikuti `dokumen/CETAK-BIRU-SISTEM.md`: satu aplikasi Next.js 16
(frontend + backend) dengan custom `server.js` (Next.js + Socket.io) dan
MariaDB 11 di container terpisah, diterapkan lewat **Coolify** (Traefik v3,
Cloudflare di depan).

## Prasyarat

- Node.js **22+** (`node -v`)
- npm 10+
- Docker Desktop (MariaDB 11 lokal untuk pengembangan)
- Git

## Menjalankan lokal

```bash
npm install
cp .env.example .env        # isi nilainya, lihat bagian ENV
npm run dev                 # custom server: node server.js (BUKAN next dev / next start)
```

Aplikasi menyala di `http://localhost:3000`. Periksa kesehatan:

```bash
curl.exe -i http://localhost:3000/api/health
```

Membalas `200` bila basis data terhubung, `503` bila terputus.

Build produksi:

```bash
npm run build
npm start                   # NODE_ENV=production node server.js
```

Lint:

```bash
npm run lint                # eslint . (next lint sudah dihapus di Next.js 16)
```

## Mengisi `.env`

Salin `.env.example` menjadi `.env`. Kelompok variabel:

| Kelompok | Variabel | Catatan |
|---|---|---|
| Basis data (RAHASIA) | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_POOL_LIMIT` | Runtime only di Coolify |
| Autentikasi (RAHASIA) | `JWT_SECRET` (`openssl rand -hex 48`), `JWT_EXPIRY` | Runtime only |
| Seed (RAHASIA) | `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Runtime only |
| Aplikasi | `NODE_ENV`, `PORT`, `HOSTNAME`, `TZ`, `NEXT_TELEMETRY_DISABLED`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_WS_URL` | hanya `NEXT_PUBLIC_*` yang boleh ikut waktu build |
| Pemisahan host | `STAF_HOST` | kosong = nonaktif (lokal); produksi wajib terisi |
| Unggahan | `UPLOAD_DIR`, `UPLOAD_MAX_MB` | volume lokal |

**Jangan pernah** menandai rahasia sebagai "Available at Buildtime" di Coolify —
nilainya akan tercetak di log build.

## Struktur folder (ringkas)

```
app/
  (auth)/login/          halaman masuk staf
  (staf)/staf/...        ruang kerja staf — segmen bersarang /staf/*
  (publik)/...           halaman publik
  api/...                SELURUH backend (route handler)
  layout.js, globals.css, font.js
components/  ui/ publik/ staf/
hooks/
lib/
  auth/    JWT, sesi, penjaga peran
  db/      pool + SELURUH kueri SQL (route API tidak menulis SQL)
  socket/  server Socket.io + pembantu siaran
  navItems.js            satu sumber kebenaran menu
database/  schema.sql, seed.sql, migrations/
scripts/   seed.js
public/    logo, favicon, fonts/, unggahan/ (volume)
server.js  Next.js + Socket.io dalam satu proses
proxy.js   lapisan 2 penjaga (Next.js 16; bukan middleware.js)
```

Sumber baca-saja yang tidak boleh diubah: `desain/` (desain UI final, tidak
ikut repo), `paket-pendukung/` (font, ikon, logo turunan, kerangka
terverifikasi).

## Penerapan

Penerapan memakai **Coolify** dengan `Dockerfile` tiga tahap (Tahap 3).
Rincian di `PENERAPAN.md` setelah tahap itu selesai. `git push` dan deploy
hanya atas perintah pemilik.

## Dokumentasi

- `dokumen/CETAK-BIRU-SISTEM.md` — hukum arsitektur
- `dokumen/REFERENSI.md` — seluruh keputusan (skema, token desain, peran, protokol konversi layar)
- `dokumen/ALUR-KERJA-CLAUDE-CODE.md` — alur kerja per tahap
- `laporan/` — laporan dan bukti uji tiap tahap

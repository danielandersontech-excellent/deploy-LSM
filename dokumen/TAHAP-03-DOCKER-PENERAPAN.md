# TAHAP 3 — DOCKER DAN PENERAPAN PERTAMA

> **Sumber di repo ini:** `CLAUDE.md`, `dokumen/CETAK-BIRU-SISTEM.md`,
> `dokumen/REFERENSI.md`, `dokumen/ALUR-KERJA-CLAUDE-CODE.md`,
> `desain/stitch_portal_berita_inklusif/` (ekstrak `Warkop_Nusantara.zip`),
> `LSM_WARKOP.png`, `paket-pendukung/`
>
> **Bergantung pada:** Tahap 0, 1, 2
> **Rujukan cetak biru:** bagian 2, 6, 10, dan Pelajaran nomor 2
> **Rujukan REFERENSI:** 4 (arsitektur), 13 (ENV), 14 (aturan 2 dan 10)

---

> **MODE OTONOM tanpa domain/server:** kerjakan seluruh bagian lokal tahap ini
> (Dockerfile, .dockerignore, compose, build image, container + seluruh UJI
> a–l yang bersifat lokal, PENERAPAN.md). Butir yang butuh domain, Coolify,
> atau `git push` → tandai `MENUNGGU PEMILIK` di `laporan/STATUS.md`, lalu
> **lanjut ke Tahap 4** (ALUR bagian 7.4).


## PROMPT INDUK

```
Kamu adalah arsitek dan pengembang senior yang membangun sistem produksi untuk
LSM WARKOP NUSANTARA — lembaga swadaya masyarakat Indonesia yang menjalankan
fungsi kontrol sosial, observasi, dan pengawasan publik, sekaligus menerbitkan
portal berita dan laporan investigasi.

DOKUMEN WAJIB DIPATUHI — semua sudah ada di repo ini, baca dari jalurnya:

1. dokumen/CETAK-BIRU-SISTEM.md — HUKUM ARSITEKTUR. Bila perlu menyimpang,
   HENTIKAN dan tanyakan lebih dulu.
2. desain/stitch_portal_berita_inklusif/ — desain UI final (hasil ekstrak
   Warkop_Nusantara.zip). Tampilan HARUS mengikuti berkas ini: tata letak,
   warna, tipografi, komponen, susunan setiap layar. Jangan mendesain ulang,
   jangan "memperbaiki" gaya visualnya, jangan mengganti palet. Tugasmu
   mengubahnya menjadi kode Next.js yang hidup, lewat REFERENSI bagian 18.
3. LSM_WARKOP.png — logo resmi. Pakai turunannya di paket-pendukung/ASET/logo.
4. dokumen/REFERENSI.md — keputusan yang sudah ditetapkan.
5. dokumen/ALUR-KERJA-CLAUDE-CODE.md — cara kerja dan bentuk keluaran.
6. paket-pendukung/ — Ikon.js, font, logo turunan, kerangka terverifikasi.
   Pakai apa adanya. Bila salah satu jalur di atas tidak ada, HENTIKAN dan
   beri tahu pemilik — jangan mengarang penggantinya.

ATURAN KERJA:

- Kerjakan HANYA tahap ini.
- Jalankan seluruh butir UJI TAHAP dan laporkan apa adanya.
- Bahasa Indonesia untuk komentar kode dan dokumentasi.
- Tandai KEPUTUSAN BARU secara eksplisit.
- Bila menemukan cacat pada tahap sebelumnya, laporkan.
- Kerjakan LANGSUNG di repo ini. Keluaranmu adalah berkas yang sudah ada di
  tempatnya + laporan/LAPORAN-TAHAP-XX.md + satu commit git. Bukan ZIP.
- desain/ dan paket-pendukung/ adalah SUMBER BACA-SAJA — jangan pernah
  mengubah, memindah, atau menghapus isinya.
- Jangan git push, jangan menyentuh berkas di luar repo ini, jangan memasang
  perangkat global, tanpa diminta pemilik.
```

---

## MENGAPA TAHAP INI DI SINI, BUKAN DI AKHIR

Urutan ini **disengaja**, diambil dari cetak biru bagian 14 langkah 6:

> *Menerapkan lebih dulu selagi sistem masih kecil membuat masalah penerapan
> mudah ditemukan, dibandingkan menemukan puluhan masalah sekaligus setelah
> aplikasi besar.*

Sistem saat ini baru berisi kerangka, basis data, dan login. Bila ada yang
salah dengan Dockerfile, zona waktu container, healthcheck, atau variabel
lingkungan, sekarang saat termurah menemukannya.

**Jangan melewati tahap ini** dengan alasan "nanti saja setelah fiturnya jadi".

---

## PEKERJAAN

### 1. Dockerfile tiga tahap

Pola **cetak biru bagian 6**, dengan `node:22-alpine` (Next.js 16 mensyaratkan
minimal Node 20.9; kita pakai 22 untuk kelonggaran).

**Tahap `deps`** — `libc6-compat`, salin `package.json` dan `package-lock.json`,
`npm ci --include=dev`.

**Tahap `builder`** — di sinilah jebakan keamanan:

```dockerfile
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
```

Pelajaran nomor 2 lahir dari sini: di Cap Jiki, `JWT_SECRET` dan `DB_PASSWORD`
ditandai tersedia saat build sehingga tercetak terbuka di log Coolify.

**Tahap `runner`:**

- `tzdata`, salin `Asia/Jakarta` ke `/etc/localtime`, tulis `/etc/timezone`
- User non-root `nextjs:nodejs` (uid/gid 1001)
- Salin dengan `--chown=nextjs:nodejs`: `node_modules` **penuh**, `.next`,
  `public`, `package.json`, `next.config.mjs`, `server.js`, **`proxy.js`**,
  `lib`, `database`
- `USER nextjs`, `EXPOSE 3000`
- `HEALTHCHECK` ke `/api/health`, `--start-period=40s`
- `CMD ["node", "server.js"]`

**Tiga hal yang WAJIB:**

1. **Jangan `output: 'standalone'`.** Custom server butuh `node_modules` penuh
   dan berkas sumber. Di Next.js 16 ini makin penting: dengan `standalone`,
   `next start` tidak lagi melayani aplikasi.
2. **`/api/health` wajib ada** dan mengembalikan 200.
3. **`proxy.js` wajib ikut tersalin.** Bila berkas ini tidak ada di image,
   Next.js **tidak melempar galat** — ia hanya berjalan tanpa proxy. Kesalahan
   ini tidak terlihat sampai ada yang mengaksesnya. Ini aturan 11.

### 2. .dockerignore

Kecualikan `node_modules`, `.next`, `.git`, `.env*`, `_backup*`, `*.md`
(kecuali yang perlu ikut), berkas desain, hasil uji, tangkapan layar.

Laporkan ukuran konteks build sebelum dan sesudah.

### 3. docker-compose.yml — uji lokal saja

Dua layanan: aplikasi + MariaDB 11. Volume untuk data DB dan
`public/unggahan`.

Komentar mencolok di atas berkas:
```yaml
# BERKAS INI HANYA UNTUK PENGUJIAN LOKAL.
# Di produksi, sistem dijalankan lewat Coolify (lihat PENERAPAN.md).
```

### 4. Volume unggahan

Berkas unggahan **tidak boleh hilang saat redeploy**. Rancang volume terpasang
dan dokumentasikan cara mendaftarkannya di Coolify.

Ini mudah terlewat sampai deploy pertama menghapus seluruh lampiran pengaduan.

### 5. PENERAPAN.md

**A. Persiapan server** (cetak biru bagian 2)
1. SSH hanya dengan kunci: `PasswordAuthentication no`, restart ssh
2. Panel Coolify **tidak terbuka ke internet**. Akses lewat terowongan:
   `ssh -i ~/.ssh/id_ed25519 -L 8000:localhost:8000 pengguna@IP_SERVER`
3. **Buat container MariaDB 11 lebih dulu**, project sama, **catat nama
   containernya** untuk `DB_HOST`
4. Arahkan domain, daftarkan subdomain agar Traefik menerbitkan sertifikat

**B. Daftar ENV** — tabel dari REFERENSI bagian 13, dengan kolom: nama, contoh,
**Runtime only atau Buildtime**, penjelasan. Beri penekanan pada baris rahasia.

**C. Subdomain**
```
<domain>          -> situs publik
staf.<domain>     -> ruang kerja staf
```

**D. Firewall**

| Port | Untuk | Status |
|---|---|---|
| 22 | SSH | Buka |
| 80, 443 | Web (Traefik) | Buka |
| 3306 | Basis data | **TIDAK PERNAH dibuka** |
| 8000 | Panel Coolify | **TIDAK dibuka**, lewat terowongan SSH |

**E. Alur redeploy** (cetak biru bagian 10) — push, terowongan SSH, Redeploy,
tunggu "Rolling update completed". Jelaskan rolling update: container baru
diperiksa kesehatannya dulu; bila healthcheck gagal, versi lama tetap melayani.

**F. Menjalankan SQL di server**
```bash
sudo docker exec -i <container_db> mariadb -u<user> -p'<sandi>' <db> << 'SQL'
  ... perintah SQL ...
SQL
```
Dengan pengingat tebal: **selalu SELECT pemeriksaan dulu sebelum UPDATE atau
DELETE.**

**G. Rollback** — `git revert` lalu Redeploy, dan cara cepat lewat daftar
deployment di Coolify.

**H. Repositori**
```
https://github.com/danielandersontech-excellent/deploy-LSM
```

### 6. scripts/cadangkan-db.sh

Dump basis data bertanggal, dengan perintah pemulihan di komentar. Pengujian
pemulihannya di Tahap 9, tetapi skripnya dibuat sekarang.

---

## LARANGAN KERAS

| Larangan | Sumber |
|---|---|
| `DB_PASSWORD`/`JWT_SECRET` sebagai `ARG` | Aturan 2 |
| Menandai rahasia "Available at Buildtime" | Aturan 2 |
| `output: 'standalone'` | Aturan 10 |
| Container berjalan sebagai root | Praktik dasar |
| Membuka port 3306 atau 8000 | Cetak biru bagian 2 |
| `docker-compose.yml` di produksi | Produksi memakai Coolify |
| Lupa menyalin `proxy.js` ke image | Aturan 11 |

---

## UJI TAHAP 3

**a. Build** — `docker build` selesai tanpa error. Laporkan ukuran image dan
waktu build.

**b. UJI LOG BUILD BERSIH — wajib, inti tahap ini.**

Periksa log build **baris per baris**. Tidak boleh ada `DB_PASSWORD`,
`JWT_SECRET`, atau `SEED_ADMIN_PASSWORD` tercetak. Lampirkan potongan log,
terutama bagian yang menampilkan variabel lingkungan.

**c. Container menyala** — `docker compose up`, terhubung ke MariaDB. Lampirkan
log awal.

**d. Healthcheck** — `docker inspect` → status **"healthy"**. Lalu matikan
MariaDB → harus berubah **"unhealthy"**. Nyalakan lagi → kembali "healthy".
Ini membuktikan healthcheck benar-benar memeriksa sesuatu.

**e. Login di container** — alur login Tahap 2 berjalan penuh.

**f. UJI PROXY DI CONTAINER — wajib.** Ulangi uji proxy Tahap 0 dan pemisahan
host Tahap 2, kali ini **di dalam container hasil build**. Ini menangkap
kesalahan penyalinan `proxy.js` di Dockerfile, yang tidak menghentikan build.

**g. UJI ZONA WAKTU DI CONTAINER**
1. `docker exec <app> date` → WIB
2. `SELECT NOW(), @@session.time_zone` dari aplikasi → WIB
3. Sisipkan satu baris, periksa `dibuat_pada` → WIB

Ketiganya selaras. Lampirkan seluruh keluaran.

**h. User non-root** — `docker exec <app> whoami` → `nextjs`.

**i. Volume unggahan bertahan** — letakkan berkas di `public/unggahan`,
hentikan dan jalankan ulang container, berkas **masih ada**.

**j. Rollback** — hentikan container, jalankan image versi sebelumnya, sistem
pulih.

**k. Ukuran konteks build** — sebelum dan sesudah `.dockerignore`.

**l. Penelusuran larangan** — tidak ada `output: 'standalone'`, tidak ada
rahasia sebagai `ARG`, `proxy.js` ada di daftar `COPY`.

---

## BENTUK KELUARAN (Claude Code)

Kerjakan **langsung di repo ini** — tidak ada paket perubahan, tidak ada
apply.ps1. Di akhir tahap:

1. Seluruh berkas tahap ini sudah ada di tempatnya dan `npm run build` hijau.
2. Tulis `laporan/LAPORAN-TAHAP-03.md` (isi sesuai bagian LAPORAN di bawah).
   Bukti uji (keluaran curl, keluaran uji-kesetiaan, tangkapan bila ada) masuk
   `laporan/bukti-tahap-03/` dan dirujuk dari laporan.
3. `git add -A` lalu `git commit -m "Tahap 03: <ringkasan satu baris>"`.
   Jangan push tanpa diminta pemilik.
4. MODE GERBANG: berhenti, tunggu pemilik memeriksa laporan. MODE OTONOM:
   verifikasi gerbang-mandiri (ALUR bagian 7.2), perbarui laporan/STATUS.md,
   lalu langsung lanjut tahap berikutnya.

## LAPORAN — isi `laporan/LAPORAN-TAHAP-03.md`

1. `Dockerfile` beserta penjelasan tiap tahapnya
2. **Bukti log build bersih (butir b)**
3. **Bukti healthcheck hijau dan uji unhealthy (butir d)**
4. **Bukti proxy berjalan di container (butir f)**
5. **Bukti zona waktu selaras di container (butir g)**
6. Hasil kedua belas butir UJI TAHAP
7. `PENERAPAN.md` lengkap
8. **KEPUTUSAN BARU**: strategi volume unggahan, dan lainnya
9. Daftar hal yang perlu dilakukan **manual di Coolify** oleh pemilik sistem

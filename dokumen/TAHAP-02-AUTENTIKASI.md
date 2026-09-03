# TAHAP 2 — AUTENTIKASI DAN PERAN

> **Sumber di repo ini:** `CLAUDE.md`, `dokumen/CETAK-BIRU-SISTEM.md`,
> `dokumen/REFERENSI.md`, `dokumen/ALUR-KERJA-CLAUDE-CODE.md`,
> `desain/stitch_portal_berita_inklusif/` (ekstrak `Warkop_Nusantara.zip`),
> `LSM_WARKOP.png`, `paket-pendukung/`
>
> **Bergantung pada:** Tahap 0, 1
> **Rujukan cetak biru:** bagian 8, dan bagian 11 Pelajaran nomor 3
> **Rujukan REFERENSI:** 11 (matriks peran), 12 (route), 16 (Next.js 16)
> **Layar desain:** `login_staff_warkop_nusantara/`

---

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
- Bahasa Indonesia untuk komentar kode, nama fungsi, dan variabel domain.
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

## TUJUAN

Empat lapisan penjaga sesuai cetak biru bagian 8.

Cetak biru menyebut lapisan keempat sebagai **yang paling sering dilupakan**,
dan Pelajaran nomor 3 menceritakan akibatnya: menu disembunyikan, tetapi route
API-nya masih mengizinkan peran itu.

**Dokumentasi Next.js 16 kini mengatakan hal yang sama.** Proxy tidak
dimaksudkan sebagai solusi manajemen sesi atau otorisasi yang utuh; ia berguna
untuk pemeriksaan optimistis seperti pengalihan berbasis izin. Dokumentasi yang
sama menganjurkan verifikasi autentikasi dan otorisasi **di dalam setiap Server
Function**.

Kerjakan tahap ini dengan sikap itu: **`proxy.js` adalah kenyamanan, bukan
pagar.**

---

## BACA DULU: DUA FAKTA DARI PEMBUKTIAN (REFERENSI 16.7 dan 16.8)

1. `proxy.js` **berjalan** di custom server Next.js 16.3.3, dev dan produksi.
   Tahap 0 sudah mengonfirmasinya di lingkunganmu (LAPORAN.md Tahap 0, butir h).
   Kerjakan lapisan 2 seperti rencana di bawah.

2. **`request.url` di proxy BUKAN host asli.** Di bawah custom server ia berisi
   `0.0.0.0:3000`. Setiap pengalihan **wajib** memakai `urlDariHeader()` yang
   sudah ada di `proxy.js` sejak Tahap 0 — jangan `new URL(path, request.url)`.
   UJI (f) memeriksa nilai `Location` secara harfiah, bukan hanya kode 307.

---

## PEKERJAAN

### 1. Lapisan 1 — Login

**`POST /api/auth/login`**

- Verifikasi kata sandi dengan `bcryptjs`
- Terbitkan JWT dengan `jose` berisi `id`, `peran`, `wilayah_id`,
  `token_version`
- Simpan di cookie **`httpOnly` + `secure` + `sameSite=lax`**, masa berlaku
  dari `JWT_EXPIRY`
- Perbarui `users.terakhir_masuk` (dari aplikasi, bukan `NOW()`)
- Tulis `audit_log`

**Pesan galat wajib netral.** Jangan membedakan "email tidak ditemukan" dan
"kata sandi salah" — perbedaan itu memberi tahu penyerang email mana yang
terdaftar.

**Rate limit** pada dua sumbu: per IP (satu penyerang mencoba banyak akun) dan
per akun (banyak IP membobol satu akun). Rancang agar akun yang sedang diserang
tidak jadi terkunci untuk pemiliknya sendiri. Jelaskan pendekatanmu.

**`POST /api/auth/logout`** — hapus cookie, tulis `audit_log`.
**`GET /api/auth/saya`** — identitas pengguna aktif, tanpa `kata_sandi_hash`.

**Ingat Next.js 16:** `cookies()` dan `headers()` **wajib di-`await`**.

### 2. Lapisan 2 — proxy.js

Fungsi bernama `proxy`. Tugasnya **tipis**:

1. Baca cookie, verifikasi token dengan `jose`
2. **Pemisahan host** (aktif hanya bila `STAF_HOST` terisi — bila kosong,
   mode pengembangan lokal: kedua area dilayani di host yang sama, dan
   `server.js` mencetak peringatan saat start):
   - `/staf/*` dan `/login` yang datang ke **domain utama** → alihkan ke
     `https://STAF_HOST<path>` (bukan 404, agar tombol "Masuk Staff" dan
     tautan lama tetap sampai)
   - Permintaan ke `STAF_HOST` selain `/staf/*`, `/login`, `/api/*` → alihkan
     ke `/staf/dashboard`
   - Host asli dibaca dari `x-forwarded-host`, lalu `host`
3. Teruskan identitas lewat header `x-user-id` dan `x-user-role`
4. Halaman staf tanpa token → alihkan ke `/login` (lewat `urlDariHeader`)

**Yang TIDAK boleh dilakukan di sini:**

- Keputusan otorisasi yang menentukan (itu lapisan 3 dan 4)
- Kueri basis data berat
- Bergantung pada modul bersama atau variabel global — dokumentasi Next.js 16
  melarangnya secara eksplisit

`/api/health` harus tetap lolos tanpa token; Coolify memanggilnya tanpa cookie.

**Pemeriksaan `token_version`** perlu perhatian: memeriksa basis data di setiap
permintaan itu mahal, dan proxy tidak boleh melakukan kueri berat. Rancang agar
pemeriksaan ini terjadi di lapisan 3 dan 4, bukan di proxy. Jelaskan pilihanmu
sebagai KEPUTUSAN BARU.

**Hapus** `app/uji-proxy/page.js` dan header `x-uji-proxy` dari Tahap 0 —
hapus berkasnya langsung dan catat di laporan. Pertahankan `urlDariHeader()`.

**Tombol "Masuk Staff"** di navbar kanonik (REFERENSI 18.3) mengarah ke
`https://<STAF_HOST>/login`; bila `STAF_HOST` kosong, ke `/login`.

### 3. Lapisan 3 — requireUser

`lib/auth/penjaga.js` → `requireUser([...peran])`, dipakai di
`app/(staf)/staf/layout.js`.

Di sinilah `token_version` diperiksa terhadap basis data. Bila tidak cocok,
sesi berakhir.

Bila pengguna tidak berhak: alihkan ke `/login` atau tampilkan halaman 403 yang
rapi, bukan halaman kosong.

### 4. Lapisan 4 — requireRole di SETIAP route API

`lib/auth/penjaga.js` → `requireRole(user, [...peran])`.

Setiap route API memanggilnya. Pengecualian hanya route publik yang memang
dirancang tanpa login: `/api/health`, `/api/artikel`, `POST /api/pengaduan`,
`/api/pengaduan/lacak/[nomor]`.

**Rancang agar lupa memanggilnya menjadi sulit.** Dua pendekatan:

- Pembungkus `denganPeran([...peran], handler)` yang membungkus setiap handler
- **Uji otomatis** yang menelusuri seluruh berkas `route.js` dan gagal bila ada
  yang tidak memanggil penjaga

Pendekatan kedua lebih kuat karena menangkap kelalaian di masa depan, bukan
hanya hari ini. Pilih salah satu atau keduanya, dan jelaskan.

### 5. Matriks hak akses

`lib/auth/hakAkses.js`, isinya **REFERENSI bagian 11**. Acuan tunggal, bukan
tersebar.

Dua aturan yang mudah terlewat:

1. Pembatasan wilayah difilter **di SQL**. Modul `lib/db` dari Tahap 1 sudah
   menerima `wilayahId` — pastikan route API meneruskannya, bukan mengambil
   semua lalu menyaring.
2. Identitas pelapor hanya untuk `superadmin` dan `verifikator`. Route yang
   mengembalikan pengaduan menghitung `bolehLihatIdentitas` dari peran, lalu
   meneruskannya ke `lib/db`.

### 6. Halaman login

`app/(auth)/login/page.js` — jalankan **PROTOKOL KONVERSI LAYAR (REFERENSI 18)**
pada `login_staff_warkop_nusantara/code.html`: salin DOM dan kelasnya, ikon
lewat `<Ikon />`, logo dari `/logo-warkop.png`. Ringkasan layarnya:

- Latar krem `#faf9f5` dengan watermark logo samar
- Kartu tengah, sudut membulat
- Kepala kartu berlatar `#271310`: "WARKOP NUSANTARA" (Domine, putih) dan
  "Portal Staff Khusus" (emas `#e9c349`, lebih kecil)
- Badan: judul "Autentikasi", teks "Silakan masukkan kredensial resmi Anda
  untuk mengakses sistem pengawasan."
- Label "ID Staff / Email Resmi", placeholder `Contoh: WN-2024-001`
- Label "Kata Sandi" dengan "Lupa Kata Sandi?" di kanan atasnya
- Tombol masuk berlatar cokelat tua

`screen.png` layar ini terpotong di bawah — untuk bagian yang tidak terlihat,
ikuti `code.html` dan pertahankan konsistensi.

**Keadaan yang wajib ditangani:** sedang memuat, galat kredensial, akun
nonaktif, terlalu banyak percobaan.

### 7. Halaman 403

Rapi dan sesuai identitas visual, bukan halaman galat bawaan. Sertakan tautan
kembali ke area yang berhak diakses pengguna itu.

---

## LARANGAN KERAS

| Larangan | Alasan |
|---|---|
| Token di `localStorage` | Rentan XSS. Wajib cookie `httpOnly` |
| Membedakan pesan "email salah" dan "sandi salah" | Membocorkan email terdaftar |
| Keputusan otorisasi hanya di `proxy.js` | Aturan 3 + dokumentasi Next.js 16 |
| Route API tanpa `requireRole` | Aturan 3 |
| Mengirim `kata_sandi_hash` ke frontend | Kebocoran tidak perlu |
| Menyaring wilayah di JavaScript | Harus di SQL |
| `cookies()`/`headers()` tanpa `await` | Aturan 12 — tidak berfungsi di Next.js 16 |
| Kueri DB berat di `proxy.js` | Dokumentasi Next.js 16 |

---

## UJI TAHAP 2

**a. Login berhasil** — cookie `httpOnly` terbit, dialihkan ke dashboard staf.
Periksa di tab Application bahwa cookie **tidak bisa dibaca JavaScript**.

**b. Login gagal** — email salah dan sandi salah menghasilkan **pesan
identik**. Lampirkan keduanya.

**c. UJI LAPISAN 4 — wajib, inti tahap ini.**

Panggil **setiap** route API staf memakai token peran yang **tidak berhak**,
langsung lewat `curl`, **tanpa membuka UI sama sekali**. Membuka UI tidak
membuktikan apa pun, karena UI memang menyembunyikan menunya.

Semua harus membalas **403**. Lampirkan tabel:

| Route | Metode | Peran penguji | Kode | Lulus |
|---|---|---|---|---|

Route yang belum dibuat ditandai "menyusul"; yang sudah ada **wajib diuji
seluruhnya**.

**d. UJI token_version** — login, simpan token, naikkan `token_version` di DB,
pakai token lama → **harus ditolak**. Lampirkan bukti.

**e. Halaman staf tanpa cookie** — akses `/staf/dashboard` tanpa login →
dialihkan ke `/login`.

**f. UJI PEMISAHAN HOST** — lewat curl dengan header `Host` **dan**
`X-Forwarded-Host`/`X-Forwarded-Proto: https` (meniru Traefik), jalankan
dengan `STAF_HOST=staf.<domain>`. **Periksa nilai header `Location` secara
harfiah** — ini yang menangkap jebakan `request.url`:

| Uji | Harapan |
|---|---|
| `Host: <domain>` → `/staf/dashboard` | 307, `Location: https://staf.<domain>/staf/dashboard` |
| `Host: <domain>` → `/login` | 307, `Location: https://staf.<domain>/login` |
| `Host: staf.<domain>` → `/tentang` | 307, `Location: https://staf.<domain>/staf/dashboard` |
| `Host: staf.<domain>` → `/staf/dashboard` tanpa token | 307, `Location: https://staf.<domain>/login` |
| `Host: <domain>` → `/api/health` | 200 tanpa token |
| `STAF_HOST` kosong, `/staf/dashboard` di localhost tanpa token | 307 ke `http://localhost:3000/login` |

**Tidak boleh ada `Location` yang memuat `0.0.0.0` atau `localhost` saat
`STAF_HOST` terisi.** Lampirkan keluaran `curl -i` apa adanya.

**g. UJI PENYARINGAN WILAYAH** — dua `pimpinan_wilayah` di wilayah berbeda.
Tidak boleh ada kebocoran silang. Periksa juga **kueri SQL yang dijalankan**.

**h. UJI IDENTITAS PELAPOR** — `pimpinan_wilayah` dan `redaktur` memanggil route
pengaduan → identitas **tidak ikut di balasan**. Periksa JSON mentahnya.

**i. Rate limit** — 20 percobaan login gagal → dibatasi, tanpa mengunci akun
permanen bagi pemilik sahnya.

**j. Cookie aman** — periksa `httpOnly`, `secure`, `sameSite`.

**k. Kesetiaan halaman login** — `uji-kesetiaan.mjs` terhadap
`login_staff_warkop_nusantara/code.html` (REFERENSI 18.5): sisa cacat export
nol, setiap kelas hilang beralasan. Bila peramban tersedia, tambahkan
perbandingan berdampingan dengan `screen.png` pada 375px, 768px, 1280px.

**l. Route tanpa penjaga** — telusuri seluruh `route.js`, laporkan mana yang
memanggil `requireRole` dan mana yang tidak beserta alasannya.

**m. `await` lengkap** — telusuri `cookies()`, `headers()`, `params`,
`searchParams` yang dibaca tanpa `await`. Harus nihil.

**n. Build hijau** — `npm run build` dan `npm run lint` berhasil.

---

## BENTUK KELUARAN (Claude Code)

Kerjakan **langsung di repo ini** — tidak ada paket perubahan, tidak ada
apply.ps1. Di akhir tahap:

1. Seluruh berkas tahap ini sudah ada di tempatnya dan `npm run build` hijau.
2. Tulis `laporan/LAPORAN-TAHAP-02.md` (isi sesuai bagian LAPORAN di bawah).
   Bukti uji (keluaran curl, keluaran uji-kesetiaan, tangkapan bila ada) masuk
   `laporan/bukti-tahap-02/` dan dirujuk dari laporan.
3. `git add -A` lalu `git commit -m "Tahap 02: <ringkasan satu baris>"`.
   Jangan push tanpa diminta pemilik.
4. MODE GERBANG: berhenti, tunggu pemilik memeriksa laporan. MODE OTONOM:
   verifikasi gerbang-mandiri (ALUR bagian 7.2), perbarui laporan/STATUS.md,
   lalu langsung lanjut tahap berikutnya.

## LAPORAN — isi `laporan/LAPORAN-TAHAP-02.md`

1. Penjelasan keempat lapisan dan letaknya di kode
2. **Tabel hasil uji hak akses (butir c)** — bagian paling penting, lengkap
3. **Hasil uji pemisahan host (butir f)**
4. Hasil keempat belas butir UJI TAHAP
5. Keluaran `uji-kesetiaan.mjs` halaman login (butir k)
6. **KEPUTUSAN BARU**: strategi `token_version`, strategi rate limit, dan
   mekanisme agar `requireRole` sulit terlupa
7. Route yang belum ada penjaganya karena belum dibuat, beserta tahapnya

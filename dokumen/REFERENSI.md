# REFERENSI SISTEM — WARKOP NUSANTARA (v2.1 — edisi Claude Code)

> Dokumen rujukan induk. Dibaca dari `dokumen/REFERENSI.md` di **SETIAP
> tahap**, bersama `CLAUDE.md`, `dokumen/CETAK-BIRU-SISTEM.md`,
> `dokumen/ALUR-KERJA-CLAUDE-CODE.md`, `desain/`, dan `paket-pendukung/`.
>
> Berisi seluruh keputusan yang sudah ditetapkan: arsitektur, skema basis data,
> token desain, matriks peran, dan aturan yang tidak boleh dilanggar. Tahap 0
> sampai 9 merujuk ke dokumen ini, sehingga tidak ada keputusan yang perlu
> diulang atau ditebak di tengah jalan.

**Versi:** 2.1 · **Tanggal:** 31 Agustus 2026
**Perubahan dari v1:** Next.js 16, `proxy.js` menggantikan `middleware.js`,
struktur folder bersarang untuk mencegah tabrakan rute, dan alur paket
perubahan dengan `apply.ps1`.
**Perubahan dari v2 (2.1):** proxy di custom server **sudah dibuktikan**
(bagian 16.7), jebakan `request.url` (16.8), **Protokol Konversi Layar**
(bagian 18) dengan navbar/footer kanonik, `paket-pendukung/` berisi font,
ikon, logo turunan, dan kerangka terverifikasi, daftar kategori pengaduan/
program/galeri (10), dan plugin Tailwind `forms` (7).

---

## DAFTAR ISI

1. [Identitas Organisasi](#1-identitas-organisasi)
2. [Lampiran Wajib](#2-lampiran-wajib)
3. [Prompt Induk](#3-prompt-induk)
4. [Arsitektur dan Repositori](#4-arsitektur-dan-repositori)
5. [Urutan Sepuluh Tahap](#5-urutan-sepuluh-tahap)
6. [Struktur Folder Proyek](#6-struktur-folder-proyek)
7. [Token Desain](#7-token-desain)
8. [Peta Layar dari ZIP Desain](#8-peta-layar-dari-zip-desain)
9. [Cacat Export yang Harus Diperbaiki](#9-cacat-export-yang-harus-diperbaiki)
10. [Skema Basis Data](#10-skema-basis-data)
11. [Matriks Peran dan Hak Akses](#11-matriks-peran-dan-hak-akses)
12. [Daftar Route API](#12-daftar-route-api)
13. [Variabel Lingkungan](#13-variabel-lingkungan)
14. [Aturan Pantang Dilanggar](#14-aturan-pantang-dilanggar)
15. [Standar Mutu Setiap Tahap](#15-standar-mutu-setiap-tahap)
16. [Catatan Khusus Next.js 16](#16-catatan-khusus-nextjs-16)
17. [Penyesuaian dari Cap Jiki](#17-penyesuaian-dari-cap-jiki)
18. [**Protokol Konversi Layar**](#18-protokol-konversi-layar-wajib-untuk-setiap-halaman) — wajib dibaca sebelum menulis halaman apa pun

---

## 1. IDENTITAS ORGANISASI

| | |
|---|---|
| **Nama** | WARKOP NUSANTARA |
| **Kepanjangan** | Wadah Aspirasi Rakyat, Kontrol, Observasi dan Pengawasan Nusantara |
| **Jenis** | Lembaga Swadaya Masyarakat (LSM) pengawasan publik |
| **Motto** | *Berani Karena Benar* |
| **Sifat** | Independen, objektif, berbasis fakta dan hukum |

**Akronim WARKOP:**

| Huruf | Makna |
|---|---|
| W | Wadah |
| AR | Aspirasi Rakyat |
| K | Kontrol |
| O | Observasi |
| P | Pengawasan |

**Filosofi logo** — sembilan unsur. Halaman Tentang wajib memuat kesembilannya.

| Unsur | Makna |
|---|---|
| Lingkaran | Persatuan, kebersamaan, pengawasan menyeluruh tanpa batas wilayah |
| Burung hantu | Kebijaksanaan, kecerdasan analisis, ketelitian, kewaspadaan, melihat dalam gelap |
| Peta Nusantara | Cakupan seluruh Indonesia, Sabang sampai Merauke, tanpa membedakan SARA |
| Timbangan | Keadilan, objektivitas, kesetaraan di hadapan hukum, keputusan berbasis bukti |
| Palu hukum | Penegakan hukum, kepastian hukum, penyelesaian lewat jalur resmi |
| Tulisan nama | Identitas sekaligus akronim organisasi |
| Tulisan kepanjangan | Penegasan empat fungsi utama |
| Motto | Keberanian yang lahir dari keyakinan pada kebenaran dan hukum |
| Cokelat & emas | Cokelat: kesederhanaan, kedewasaan, kedekatan dengan rakyat. Emas: integritas, kehormatan, kepercayaan, profesionalisme |

**Dua fungsi utama sistem:**

- **A. Portal publik + kanal berita/investigasi** — blog kelas ruang redaksi.
- **B. Kanal pengaduan masyarakat + ruang kerja staf.**

Fungsi B adalah inti organisasi. Pengaduan adalah **data sensitif**: pelapor
boleh anonim, identitasnya dilindungi berlapis, dan setiap perubahan status
terekam permanen.

---

## 2. SUMBER WAJIB DI REPO

Semua sumber sudah ada di repo (`D:\Deploy\LSM`). Baca dari jalurnya; bila
salah satu tidak ada, HENTIKAN dan beri tahu pemilik.

| Jalur | Peran |
|---|---|
| `CLAUDE.md` | Aturan tetap Claude Code — dibaca otomatis tiap sesi |
| `dokumen/CETAK-BIRU-SISTEM.md` | Hukum arsitektur. Menyimpang wajib izin lebih dulu |
| `dokumen/REFERENSI.md` | Dokumen ini |
| `dokumen/ALUR-KERJA-CLAUDE-CODE.md` | Cara kerja dan bentuk keluaran per tahap |
| `desain/stitch_portal_berita_inklusif/` | Desain UI final (hasil ekstrak `Warkop_Nusantara.zip`). **Baca-saja.** Dilarang mendesain ulang |
| `LSM_WARKOP.png` | Logo resmi. Dilarang menggambar ulang |
| `paket-pendukung/` | `ASET/` (font woff2, `Ikon.js`, logo turunan, `tailwind.config.js`, `font.js`, `server.js`, `proxy.js` terverifikasi), `UJI/uji-kesetiaan.mjs`. **Baca-saja; pakai isinya, jangan membuat ulang** |
| `dokumen/TAHAP-XX-....md` | Perintah tahapnya |

---

## 3. PROMPT INDUK

Sudah tertanam di setiap berkas tahap. Dicantumkan di sini sebagai rujukan
tunggal bila perlu diperbarui.

```
Kamu adalah arsitek dan pengembang senior yang membangun sistem produksi untuk
LSM WARKOP NUSANTARA — lembaga swadaya masyarakat Indonesia yang menjalankan
fungsi kontrol sosial, observasi, dan pengawasan publik, sekaligus menerbitkan
portal berita dan laporan investigasi.

DOKUMEN WAJIB DIPATUHI — semua sudah ada di repo ini, baca dari jalurnya:

1. dokumen/CETAK-BIRU-SISTEM.md — HUKUM ARSITEKTUR. Bukan referensi, bukan
   saran. Setiap keputusan teknis harus bisa ditelusuri ke dokumen ini. Bila
   perlu menyimpang, HENTIKAN dan tanyakan lebih dulu, sebutkan bagian mana
   yang diusulkan disimpangi beserta alasannya.

2. desain/stitch_portal_berita_inklusif/ — desain UI final (export Stitch AI,
   hasil ekstrak Warkop_Nusantara.zip). Tampilan sistem HARUS mengikuti berkas
   ini: tata letak, warna, tipografi, komponen, dan susunan setiap layar.
   Jangan mendesain ulang, jangan "memperbaiki" gaya visualnya, jangan
   mengganti palet. Tugasmu mengubahnya menjadi kode Next.js yang hidup,
   bukan menciptakan desain baru.

3. LSM_WARKOP.png — logo resmi. Pakai turunannya di paket-pendukung/ASET/logo.
   Jangan menggambar ulang, jangan memakai emoji atau ikon pengganti.

4. dokumen/REFERENSI.md — seluruh keputusan yang sudah ditetapkan. Jangan
   menebak hal yang sudah tertulis di sana.

5. dokumen/ALUR-KERJA-CLAUDE-CODE.md — cara kerja: langsung di repo, laporan
   per tahap di laporan/, satu commit per tahap.

6. paket-pendukung/ — font woff2, Ikon.js (77 ikon Material
   Symbols resmi), logo turunan, dan kerangka yang SUDAH TERVERIFIKASI di
   Next.js 16.3.3. Pakai apa adanya; jangan menggambar ikon sendiri, jangan
   mengunduh font.

ATURAN KERJA:

- Untuk setiap halaman: jalankan PROTOKOL KONVERSI LAYAR (REFERENSI bagian
  18). Baca code.html-nya utuh, salin DOM dan kelas Tailwind apa adanya,
  ganti hanya enam hal yang diizinkan, pakai navbar/footer/sidebar kanonik,
  lalu buktikan dengan uji-kesetiaan.mjs.
- Kerjakan HANYA tahap yang diminta. Jangan melompat, jangan "sekalian"
  mengerjakan tahap lain.
- Sebelum mulai, baca bagian cetak biru yang disebut di tahap ini dan bagian
  REFERENSI.md yang relevan. Bila keduanya bertentangan, cetak biru menang,
  dan laporkan pertentangannya.
- Di akhir, jalankan seluruh butir UJI TAHAP dan laporkan hasilnya apa adanya.
  Dilarang melaporkan lulus untuk uji yang belum benar-benar dijalankan. Bila
  suatu uji tidak bisa dijalankan di lingkunganmu, katakan tidak bisa dan
  jelaskan alasannya — jangan menuliskan hasil yang diasumsikan.
- Bahasa Indonesia untuk komentar kode, pesan commit, nama tabel, nama kolom,
  nama fungsi, dan nama variabel domain.
- Dilarang mengarang isi cetak biru atau REFERENSI.md. Bila sesuatu tidak
  diatur di sana dan kamu harus memutuskan, tandai eksplisit dengan label
  KEPUTUSAN BARU agar bisa ditinjau.
- Bila menemukan cacat pada desain, cetak biru, atau tahap sebelumnya,
  laporkan. Jangan menambal diam-diam.
- Kerjakan LANGSUNG di repo ini; keluaran = berkas di tempatnya +
  laporan/LAPORAN-TAHAP-XX.md + satu commit git. desain/ dan paket-pendukung/
  baca-saja. Jangan git push tanpa perintah pemilik.
```

---

## 4. ARSITEKTUR DAN REPOSITORI

**Repositori:** `https://github.com/danielandersontech-excellent/deploy-LSM`
**Folder kerja lokal:** `D:\Deploy\LSM`

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
              domain utama    STAF_HOST
              (publik)        (ruang kerja staf)
                          |
                  MariaDB 11 (container terpisah)
                  port 3306 TIDAK PERNAH terbuka
```

**Yang TIDAK dipakai:** MediaMTX dan streaming video. Cetak biru menandainya
opsional dan sistem ini tidak membutuhkannya. Jangan memasang paket streaming
apa pun.

---

## 5. URUTAN SEPULUH TAHAP

| Tahap | Berkas | Isi | Butuh |
|---|---|---|---|
| 0 | `TAHAP-00-FONDASI.md` | Kerangka, package.json, ENV, Tailwind, navItems, /api/health, uji proxy | — |
| 1 | `TAHAP-01-BASIS-DATA.md` | schema.sql, seed.sql, lib/db, zona waktu | 0 |
| 2 | `TAHAP-02-AUTENTIKASI.md` | Login, JWT, proxy.js, empat lapisan penjaga | 0, 1 |
| 3 | `TAHAP-03-DOCKER-PENERAPAN.md` | Dockerfile, healthcheck, penerapan pertama | 0–2 |
| 4 | `TAHAP-04-SITUS-PUBLIK.md` | Konversi layar publik dari ZIP | 0–3 |
| 5 | `TAHAP-05-MODUL-BERITA.md` | Blog publik + CRUD artikel | 0–4 |
| 6 | `TAHAP-06-MODUL-PENGADUAN.md` | Formulir pengaduan + buku besar | 0–4 |
| 7 | `TAHAP-07-RUANG-STAF.md` | Dashboard, sidebar, lima modul | 0–6 |
| 8 | `TAHAP-08-REALTIME.md` | Socket.io, siaran pengaduan | 0–7 |
| 9 | `TAHAP-09-PENGERASAN-PRODUKSI.md` | Audit, uji menyeluruh, dokumentasi | 0–8 |

**Aturan gerbang:** tahap berikutnya baru dimulai setelah seluruh butir UJI
TAHAP sebelumnya dilaporkan lulus beserta buktinya, paketnya terpasang, dan
`npm run build` hijau.

Tahap 3 sengaja sebelum fitur besar — cetak biru bagian 14 langkah 6.

---

## 6. STRUKTUR FOLDER PROYEK

**Perhatikan segmen bersarang `staf`.** Route group `(nama)` tidak ikut
membentuk URL, sehingga `app/(publik)/program/page.js` dan
`app/(staf)/program/page.js` akan menabrak path yang sama dan **menggagalkan
build**. Cap Jiki menghindarinya dengan `(owner)/owner/...`; kita memakai pola
yang sama.

```
D:\Deploy\LSM\
  app/
    (auth)/
      login/page.js                    -> /login
    (staf)/
      staf/
        layout.js                      penjaga peran + sidebar
        dashboard/page.js              -> /staf/dashboard
        artikel/
          page.js                      -> /staf/artikel
          baru/page.js                 -> /staf/artikel/baru
          [id]/page.js                 -> /staf/artikel/[id]
        pengaduan/
          page.js                      -> /staf/pengaduan
          [id]/page.js                 -> /staf/pengaduan/[id]
        pengurus/page.js               -> /staf/pengurus
        program/page.js                -> /staf/program
        galeri/page.js                 -> /staf/galeri
        pengguna/page.js               -> /staf/pengguna
        pengaturan/page.js             -> /staf/pengaturan
    (publik)/
      layout.js
      page.js                          -> /
      tentang/page.js
      struktur/page.js
      program/page.js
      galeri/page.js
      kontak/page.js
      lacak/page.js
      berita/
        page.js
        [slug]/page.js
    api/
      health/route.js
      auth/{login,logout,saya}/route.js
      artikel/route.js
      artikel/[slug]/route.js
      pengaduan/route.js
      pengaduan/lacak/[nomor]/route.js
      staf/
        artikel/route.js
        artikel/[id]/route.js
        artikel/[id]/terbitkan/route.js
        pengaduan/route.js
        pengaduan/[id]/route.js
        pengaduan/[id]/status/route.js
        pengurus/route.js
        program/route.js
        galeri/route.js
        pengguna/route.js
        pengaturan/route.js
        unggah/route.js
        statistik/route.js
    layout.js
    globals.css
    sitemap.js
    robots.js
  components/
    ui/                Ikon (dari ASET), Lencana (status), Tombol, Kartu, Input, Select, Paginasi,
                       KeadaanKosong, Dialog, Tabel, Pemuat
    publik/            HeaderPublik, FooterPublik, KartuArtikel,
                       FormulirPengaduan, KartuPengurus
    staf/              SidebarStaf, TabelData, KartuAngka, GrafikTren,
                       LinimasaRiwayat, EditorTeks
  hooks/
    useSocket.js
    useViewportTinggi.js               pengganti 100vh
  lib/
    auth/
      jwt.js
      sesi.js
      penjaga.js                       requireUser, requireRole
      hakAkses.js                      matriks peran (acuan tunggal)
    db/
      index.js                         pool + zona waktu
      users.js, artikel.js, pengaduan.js, pengurus.js, program.js,
      galeri.js, pengaturan.js, wilayah.js, audit.js, statistik.js
    socket/
      server.js
      siaran.js
    validasi/
    navItems.js                        SATU SUMBER KEBENARAN menu
    kategoriPengaduan.js               8 kategori (bagian 10) — formulir, validasi, label
    kategoriProgram.js                 3 kategori program
    kategoriGaleri.js                  3 kategori galeri
    pengaturanDefinisi.js              sumber tunggal setelan (lihat aturan 8)
    utils.js
  database/
    schema.sql
    seed.sql
    migrations/README.md
  scripts/
    seed.js
    cadangkan-db.sh
  public/
    logo-warkop.png, logo-warkop-besar.png, favicon.ico,
    apple-touch-icon.png, og-default.png        <- dari ASET/logo
    fonts/                                       <- woff2 + OFL dari ASET/fonts
    unggahan/                          volume terpasang
  server.js                            Next.js + Socket.io
  proxy.js                             (BUKAN middleware.js)
  next.config.mjs
  tailwind.config.js
  eslint.config.mjs
  Dockerfile
  .dockerignore
  docker-compose.yml                   uji lokal saja
  .env.example
  README.md, PENERAPAN.md, DATABASE.md, API.md, PANDUAN-STAF.md
```

**Tiga aturan kerapian** (cetak biru bagian 3):

1. Semua SQL di `lib/db/`. Route API tidak pernah menulis SQL sendiri.
2. Menu di satu berkas (`lib/navItems.js`).
3. Tiap area punya `layout.js` dengan penjaga peran.

**`.gitignore` wajib memuat** (selain bawaan Next.js):
```
_backup*
.env
.env.local
public/unggahan/*
!public/unggahan/.gitkeep
```

---

## 7. TOKEN DESAIN

Diambil PERSIS dari `Warkop_Nusantara.zip`. **Bila `DESIGN.md` dan `code.html`
bertentangan, `code.html` menang** — berkas itulah yang benar-benar merender
`screen.png`.

Tabel di bawah adalah token yang paling sering dipakai. `code.html` memuat 47
token; salin **seluruhnya** ke `tailwind.config.js`, jangan hanya yang
tercantum di sini.

### Warna

| Token | Hex | Dipakai untuk |
|---|---|---|
| `primary` | `#271310` | Header, footer, tombol utama, kepala panel |
| `primary-container` | `#3e2723` | Varian cokelat lebih terang |
| `on-primary` | `#ffffff` | Teks di atas cokelat tua |
| `on-primary-container` | `#ae8d87` | Teks sekunder di atas cokelat |
| `secondary` | `#735c00` | Emas tua — teks aksen |
| `secondary-container` | `#fed65b` | Emas — tombol, lencana |
| `on-secondary-container` | `#745c00` | Teks di atas emas |
| `secondary-fixed` | `#ffe088` | Emas muda — sorotan, kotak catatan |
| `secondary-fixed-dim` | `#e9c349` | Emas terang — tautan aktif, garis bawah |
| `on-secondary-fixed` | `#241a00` | Teks di atas emas muda |
| `background` / `surface` | `#faf9f5` | Latar utama (krem kertas) |
| `surface-container-lowest` | `#ffffff` | Kartu |
| `surface-container-low` | `#f4f4f0` | Latar berselang |
| `surface-container` | `#efeeea` | Panel |
| `surface-container-high` | `#e9e8e4` | Panel menonjol |
| `surface-container-highest` | `#e3e2df` | Pembatas blok |
| `on-surface` | `#1b1c1a` | Teks utama |
| `on-surface-variant` | `#504442` | Teks sekunder |
| `outline` | `#827472` | Garis tepi |
| `outline-variant` | `#d3c3c0` | Garis tepi halus |
| `inverse-surface` | `#2f312e` | Latar terbalik |
| `inverse-on-surface` | `#f2f1ed` | Teks di atas latar terbalik |
| `error` | `#ba1a1a` | Galat, lencana "Baru" |
| `on-error` | `#ffffff` | Teks di atas galat |
| `error-container` | `#ffdad6` | Latar galat lembut |
| `on-error-container` | `#93000a` | Teks galat |

### Tipografi

**Domine** (serif) untuk seluruh judul, headline, dan motto.
**Fira Sans** (sans-serif) untuk body, label, dan seluruh elemen UI.

| Token | Ukuran | Tinggi baris | Berat | Jarak huruf |
|---|---|---|---|---|
| `headline-xl` | 48px | 56px | 700 | -0.02em |
| `headline-lg` | 32px | 40px | 700 | — |
| `headline-lg-mobile` | 28px | 36px | 700 | — |
| `headline-md` | 24px | 32px | 600 | — |
| `body-lg` | 18px | 28px | 400 | — |
| `body-md` | 16px | 24px | 400 | — |
| `label-md` | 14px | 20px | 600 | 0.05em |
| `motto` | 16px | 24px | 500 | — |

Muat font lewat `next/font/local` — **bukan** tag `<link>` ke Google Fonts,
**bukan** `next/font/google` (mengunduh saat build; gagal di sandbox tanpa
akses ke fonts.gstatic.com), **bukan** CDN Tailwind seperti pada berkas export.

**Berkas font sudah disediakan** di `paket-pendukung/ASET/fonts/` (diambil dari
repo resmi google/fonts, lisensi OFL, dikonversi ke woff2): `Domine[wght].woff2`
(variabel 400–700) dan `FiraSans-{Regular,Italic,Medium,SemiBold}.woff2` — berat
yang sama persis dengan yang diminta export (`Domine 400;500;600;700`,
`Fira Sans 400;500;600`). `font-bold` pada Fira Sans jatuh ke 600, sama seperti
di export. Domine tidak punya italic (juga di Google Fonts); `italic` pada motto
dimiringkan peramban, sama seperti di export.

`ASET/kerangka/font.js` (`next/font/local`, variabel `--font-domine` dan
`--font-fira-sans`) dan `ASET/kerangka/tailwind.config.js` (dibangkitkan
langsung dari blok `tailwind.config` di `code.html`, 47 warna, plugin
`@tailwindcss/forms`) **sudah terverifikasi membangun dan me-render token dengan
benar** di Next.js 16.3.3 + Tailwind 3.4.19. Salin, jangan tulis ulang.

**Plugin Tailwind:** export memuat `cdn.tailwindcss.com?plugins=forms,container-queries`.
Plugin `forms` mengatur ulang gaya bawaan `input`/`select`/`textarea`/`checkbox`
secara global — tanpa itu, formulir pengaduan dan editor tampak berbeda dari
`screen.png`. `@tailwindcss/forms` **wajib** dipasang. `container-queries`
tidak dipakai satu pun layar (tidak ada kelas `@container`); tidak perlu.

### Radius dan Jarak

| Token | Nilai |
|---|---|
| `borderRadius.DEFAULT` | 0.25rem |
| `borderRadius.lg` | 0.5rem |
| `borderRadius.xl` | 0.75rem |
| `borderRadius.full` | 9999px |
| `spacing.container-max` | 1280px |
| `spacing.margin-mobile` | 16px |
| `spacing.margin-desktop` | 40px |
| `spacing.unit` | 8px |
| `spacing.gutter` | 24px |

### Titik Henti Responsif

Wajib diuji pada **375px**, **768px**, **1280px**.

---

## 8. PETA LAYAR DARI ZIP DESAIN

Isi `Warkop_Nusantara.zip` → `stitch_portal_berita_inklusif/`.
Tiap folder berisi `code.html` (tata letak) dan `screen.png` (rujukan visual).

### Layar publik

| Folder di ZIP | Menjadi | Tahap |
|---|---|---|
| `beranda_warkop_nusantara/` | `app/(publik)/page.js` | 4 |
| `tentang_kami_warkop_nusantara/` | `app/(publik)/tentang/page.js` | 4 |
| `struktur_organisasi/` | `app/(publik)/struktur/page.js` | 4 |
| `program_kegiatan/` | `app/(publik)/program/page.js` | 4 |
| `galeri_dokumentasi/` | `app/(publik)/galeri/page.js` | 4 |
| `kontak_pengaduan_warkop_nusantara_updated_logo/` | `app/(publik)/kontak/page.js` | 6 |
| `portal_berita_beranda/` | rujukan tambahan `/berita` | 5 |
| `daftar_berita_investigasi/` | `app/(publik)/berita/page.js` | 5 |
| `detail_artikel_investigasi/` | `app/(publik)/berita/[slug]/page.js` | 5 |

### Layar staf

| Folder di ZIP | Menjadi | Tahap |
|---|---|---|
| `login_staff_warkop_nusantara/` | `app/(auth)/login/page.js` | 2 |
| `dashboard_staff_warkop/` | `app/(staf)/staf/dashboard/page.js` | 7 |
| `kelola_artikel_admin/` | `app/(staf)/staf/artikel/page.js` | 5 |
| `editor_artikel_admin/` | `app/(staf)/staf/artikel/[id]/page.js` | 5 |
| `kelola_pengaduan_admin/` | `app/(staf)/staf/pengaduan/page.js` | 6 |

### Berkas pendukung

`warkop_nusantara/DESIGN.md` — token desain. `public_discourse/DESIGN.md` —
varian, abaikan bila bertentangan. `logo_kecil.png/screen.png` — rujukan logo
versi kecil.

---

## 9. CACAT EXPORT YANG HARUS DIPERBAIKI

Enam cacat nyata pada ZIP. Jangan menyalinnya menjadi bug.

**1. Folder `tentang_kami/` salah merek — ABAIKAN SEPENUHNYA.**
Bermerek "Portal Berita" dengan palet biru (`primary #000000`), sisa iterasi
lama. Yang benar: `tentang_kami_warkop_nusantara/`.

**2. Folder `daftar_berita/` dan `detail_artikel/` juga iterasi lama**
dengan token berbeda. Yang dipakai adalah `daftar_berita_investigasi/` dan
`detail_artikel_investigasi/` sesuai bagian 8.

**3. Tiga `screen.png` rusak** — di `portal_berita_beranda/`,
`program_kegiatan/`, dan `tentang_kami_warkop_nusantara/`, berkasnya berisi
teks, bukan gambar. Pakai `code.html` sebagai sumber kebenaran tata letak.

**4. Nama ikon Material bocor sebagai teks.** Pada beberapa layar staf, ikon
tampil sebagai teks mentah: `edit_document`, `gavel`, `settings`, `logout`,
`dashboard`. Export memakai font ikon Material Symbols yang gagal dimuat
perender Stitch. **Ganti seluruh `<span class="material-symbols-outlined">nama</span>`
dengan `<Ikon nama="nama" />` dari `paket-pendukung/ASET/ikon/Ikon.js`** —
berisi jalur SVG resmi Material Symbols Outlined untuk **tepat 77 ikon** yang
dipakai ZIP (plus 15 varian terisi/`FILL 1`), jadi bentuknya identik dengan
maksud desain. Jangan menggambar ikon sendiri, jangan memakai paket ikon lain
(bentuknya berbeda), jangan memakai font ikon (bisa bocor lagi).

**5. Seluruh gambar menunjuk ke googleusercontent.** Ganti dengan berkas lokal
atau data dari basis data. Logo memakai `LSM_WARKOP.png`.

**6. Export memakai CDN Tailwind** (`cdn.tailwindcss.com?plugins=forms,container-queries`).
Itu hanya pratinjau. Tailwind 3.4 dipasang sebagai dependensi build **beserta
`@tailwindcss/forms`** (bagian 7).

**7. Navbar dan footer berbeda di tiap layar.** Logo `h-8`/`h-12`/`h-16`/tanpa
gambar, kotak cari ada di 4 dari 9 layar publik, tombol "Masuk Staff" berganti
gaya. Artefak Stitch, bukan desain. **Satu navbar, satu footer, satu sidebar
kanonik** ditetapkan verbatim di bagian 18.3 — jangan memilih ulang per tahap.

**8. Rujukan token yang tidak ada.** Satu layar memakai `font-label-sm` yang tidak
didefinisikan config. Abaikan (jatuh ke font bawaan Fira Sans lewat alias `sans`).

**Catatan logo:** `LSM_WARKOP.png` berukuran 1984×1990 (tidak persegi
sempurna). Pusatkan saat menurunkan ikon. Untuk favicon 32px, segel penuh
tidak terbaca — gunakan potongan terpusat pada burung hantu. Logo penuh tetap
dipakai di header, footer, halaman login, dan open-graph.

---

## 10. SKEMA BASIS DATA

MariaDB 11, container terpisah.

### Aturan untuk SELURUH tabel

- Kolom waktu bertipe **`DATETIME`**, bukan `TIMESTAMP`.
- **Jangan** memakai `DEFAULT CURRENT_TIMESTAMP` untuk kolom waktu penting.
  Isi dari aplikasi. (Aturan 1.)
- Charset `utf8mb4_unicode_ci`.
- Prepared statement tanpa kecuali.

### Tabel

**`users`**
```
id, nama, email (UNIK), kata_sandi_hash, peran ENUM, wilayah_id (nullable),
aktif, token_version, terakhir_masuk, dibuat_pada, diperbarui_pada
```
Peran: `superadmin` | `redaktur` | `penulis` | `verifikator` | `pimpinan_wilayah`

`token_version` **WAJIB** — menaikkan angkanya membatalkan seluruh token lama
pengguna itu (cetak biru bagian 8).

**`wilayah`** — `id, nama, jenis ENUM('pusat','provinsi','kabupaten_kota'), induk_id, kode`

**`kategori_artikel`** — `id, nama, slug, deskripsi, urutan`
Seed: Investigasi, Siaran Pers, Opini Publik, Kegiatan Daerah, Fasilitas Umum

**`artikel`**
```
id, judul, slug (UNIK), ringkasan, isi LONGTEXT, gambar_utama,
kategori_id, penulis_id, wilayah_id, status ENUM('draf','terbit','arsip'),
jumlah_dibaca, terbit_pada DATETIME, dibuat_pada, diperbarui_pada
```

**`tag`**, **`artikel_tag`** — relasi banyak-ke-banyak.

**`pengaduan`**
```
id, nomor_kasus (UNIK, format WRP-XXXX), anonim BOOLEAN,
nama_pelapor, nik_pelapor, telepon_pelapor, email_pelapor   <- semua NULLABLE
kategori_masalah VARCHAR(50), wilayah_id, deskripsi TEXT,
status ENUM('baru','diverifikasi','diproses','selesai','ditolak'),
petugas_id (nullable), dibuat_pada, diperbarui_pada
```

`kategori_masalah` menyimpan **slug** dari daftar tetap di
`lib/kategoriPengaduan.js` — satu sumber untuk `<select>` formulir, validasi
route API, dan label tampilan (pola sama dengan `pengaturanDefinisi.js`).
Daftarnya diambil dari `<option>` formulir di ZIP, ditambah dua kategori yang
muncul di layar lain:

| slug | Label (persis dari ZIP) |
|---|---|
| `korupsi` | Tindak Pidana Korupsi |
| `pelayanan-publik` | Buruknya Pelayanan Publik |
| `agraria` | Sengketa Agraria / Tanah |
| `infrastruktur` | Kerusakan Infrastruktur |
| `lingkungan` | Pencemaran Lingkungan |
| `ketenagakerjaan` | Ketenagakerjaan |
| `pungli` | Pungutan Liar |
| `lainnya` | Lainnya |

**Label dan lencana status pengaduan** (kelas verbatim dari
`kelola_pengaduan_admin/code.html`; dua yang tidak digambar ditandai):

| status | Label | Kelas lencana |
|---|---|---|
| `baru` | Baru | `bg-error-container text-on-error-container border border-error/20` |
| `diverifikasi` | Diverifikasi | `bg-secondary-fixed text-on-secondary-fixed border border-secondary/20` — **KEPUTUSAN BARU** (tidak digambar) |
| `diproses` | Diproses | `bg-secondary-container text-on-secondary-container border border-secondary/20` |
| `selesai` | Selesai | `bg-surface-container-highest text-on-surface border border-outline-variant` |
| `ditolak` | Ditolak | `bg-inverse-surface text-inverse-on-surface border border-outline` — **KEPUTUSAN BARU** (tidak digambar) |

Pembungkusnya selalu `inline-flex items-center px-2.5 py-0.5 rounded-full font-label-md text-xs`.
Wujudkan sebagai `components/ui/Lencana.js` dengan prop `status`; jangan
menulis kelas ini berulang di tiap halaman.

**`pengaduan_lampiran`** — `id, pengaduan_id, nama_berkas, path, tipe_mime, ukuran, dibuat_pada`

**`pengaduan_riwayat`** — **TABEL BUKU BESAR**
```
id, pengaduan_id, status_sebelum, status_sesudah, catatan,
oleh_user_id, dibuat_pada
```
Cetak biru bagian 7 menganjurkan tabel buku besar untuk setiap perpindahan
keadaan, berisi nilai sebelum dan sesudah. Di Cap Jiki itu `mutasi_saldo`; di
sini padanannya status pengaduan.

**Setiap perubahan status WAJIB menulis baris di sini, dalam SATU TRANSAKSI
bersama perubahan statusnya.** Bila penulisan riwayat gagal, perubahan status
ikut dibatalkan.

**`pengurus`** — `id, nama, jabatan, tingkat ENUM('pusat','wilayah'), wilayah_id, foto, deskripsi, aktif_sejak, urutan, aktif`

**`program`** — `id, judul, slug, ringkasan, isi, gambar, kategori VARCHAR(50), status ENUM('berjalan','selesai'), wilayah_id, mulai_pada, selesai_pada, dibuat_pada`

`kategori` (baru di v2.1 — filter di `program_kegiatan/code.html` membutuhkannya)
dari `lib/kategoriProgram.js`: `pengawasan-dana` "Pengawasan Dana",
`observasi-kebijakan` "Observasi Kebijakan", `bantuan-hukum` "Bantuan Hukum".

**`galeri`** — `id, judul, deskripsi, jenis ENUM('foto','video'), berkas, thumbnail, kategori VARCHAR(50), wilayah_id, tanggal_kegiatan, dibuat_pada`

`kategori` dari `lib/kategoriGaleri.js`, label dan lencana persis
`galeri_dokumentasi/code.html`: `investigasi-lapangan` "Investigasi Lapangan"
(lencana merah), `sosialisasi` "Sosialisasi" (abu), `audiensi-publik`
"Audiensi Publik" (emas).

**`pengaturan`** — `kunci (PK), nilai, deskripsi, diperbarui_pada`
Untuk statistik beranda, kontak, hotline, alamat kantor, visi-misi.
**Daftar putih kunci WAJIB ada di route API** (aturan 8).

**`audit_log`** — `id, user_id, aksi, tabel_terkait, id_terkait, detail JSON, ip, dibuat_pada`

### Pola koneksi

Salin PERSIS dari cetak biru bagian 7, termasuk `timezone: '+07:00'` dan hook
`pool.on('connection')` yang menjalankan `SET time_zone = '+07:00'`.
Hook itu **tidak boleh dilewat**.

### Aturan migrasi

`schema.sql` (struktur), `seed.sql` (data awal), `migrations/` untuk perubahan
berikutnya. **Jangan pernah mengubah `schema.sql` untuk basis data yang sudah
berjalan.**

---

## 11. MATRIKS PERAN DAN HAK AKSES

Wujudkan sebagai tabel di `lib/auth/hakAkses.js` — acuan tunggal.

| Peran | Artikel | Pengaduan | Pengurus/Program/Galeri | Pengguna | Pengaturan |
|---|---|---|---|---|---|
| `superadmin` | penuh | penuh + identitas pelapor | penuh | penuh | penuh |
| `redaktur` | penuh, termasuk menerbitkan | — | penuh | — | — |
| `penulis` | buat/sunting **miliknya sendiri**, draf saja, **tidak bisa menerbitkan** | — | — | — | — |
| `verifikator` | — | lihat, proses, ubah status, catatan + identitas pelapor | — | — | — |
| `pimpinan_wilayah` | baca-saja, **wilayahnya saja** | baca-saja **wilayahnya saja**, tanpa identitas | baca-saja | — | — |

**Dua catatan:**

1. Pembatasan wilayah difilter **di lapisan SQL**, bukan disaring di frontend.
2. Identitas pelapor hanya untuk `superadmin` dan `verifikator`. Setiap kali
   dibuka, tulis `audit_log`.

### Empat lapisan penjaga

| Lapisan | Letak | Fungsi | Kekuatan |
|---|---|---|---|
| 1 | `POST /api/auth/login` | Verifikasi bcrypt, terbitkan JWT di cookie httpOnly | gerbang masuk |
| 2 | `proxy.js` | Baca cookie, arahkan host, teruskan `x-user-id` / `x-user-role` | **kenyamanan, BUKAN pagar** |
| 3 | `app/(staf)/staf/layout.js` | `requireUser([...peran])` | pagar |
| 4 | **setiap** route API | `requireRole(user, [...peran])` | **pagar utama** |

Lapisan 4 yang paling sering dilupakan. Dokumentasi Next.js 16 sendiri
menegaskan hal yang sama: proxy tidak dimaksudkan sebagai solusi otorisasi
utuh, dan verifikasi harus dilakukan di setiap Server Function. Lihat bagian 16.

---

## 12. DAFTAR ROUTE API

### Publik (tanpa login)

| Metode | Route | Keterangan |
|---|---|---|
| GET | `/api/health` | Status aplikasi + koneksi DB |
| GET | `/api/artikel` | Daftar artikel, hanya status `terbit` |
| GET | `/api/artikel/[slug]` | Detail artikel terbit |
| POST | `/api/pengaduan` | Kirim pengaduan; rate-limited |
| GET | `/api/pengaduan/lacak/[nomor]` | Status + riwayat; **tanpa identitas** |

### Autentikasi

| Metode | Route | Keterangan |
|---|---|---|
| POST | `/api/auth/login` | Rate-limited per IP dan per akun |
| POST | `/api/auth/logout` | Hapus cookie |
| GET | `/api/auth/saya` | Identitas pengguna aktif |

### Staf

| Metode | Route | Peran |
|---|---|---|
| GET | `/api/staf/artikel` | redaktur, penulis, superadmin, pimpinan_wilayah |
| POST | `/api/staf/artikel` | penulis, redaktur, superadmin |
| PATCH | `/api/staf/artikel/[id]` | penulis (miliknya), redaktur, superadmin |
| DELETE | `/api/staf/artikel/[id]` | redaktur, superadmin |
| POST | `/api/staf/artikel/[id]/terbitkan` | redaktur, superadmin **SAJA** |
| GET | `/api/staf/pengaduan` | verifikator, superadmin, pimpinan_wilayah |
| GET | `/api/staf/pengaduan/[id]` | verifikator, superadmin, pimpinan_wilayah |
| POST | `/api/staf/pengaduan/[id]/status` | verifikator, superadmin |
| GET/POST/PATCH/DELETE | `/api/staf/pengurus` | redaktur, superadmin |
| GET/POST/PATCH/DELETE | `/api/staf/program` | redaktur, superadmin |
| GET/POST/PATCH/DELETE | `/api/staf/galeri` | redaktur, superadmin |
| GET/POST/PATCH/DELETE | `/api/staf/pengguna` | superadmin **SAJA** |
| GET/PATCH | `/api/staf/pengaturan` | superadmin **SAJA**, daftar putih kunci |
| POST | `/api/staf/unggah` | penulis, redaktur, verifikator, superadmin |
| GET | `/api/staf/statistik` | seluruh peran staf, disaring menurut peran |

Route yang tidak dipanggil frontend **dihapus di Tahap 9** (aturan 9).

---

## 13. VARIABEL LINGKUNGAN

### Basis data — RAHASIA, Runtime only
```
DB_HOST=nama_container_mariadb
DB_PORT=3306
DB_USER=warkop
DB_PASSWORD=<kata sandi kuat>
DB_NAME=warkop_nusantara
DB_POOL_LIMIT=10
```

### Autentikasi — RAHASIA, Runtime only
```
JWT_SECRET=<openssl rand -hex 48>
JWT_EXPIRY=8h
```

### Aplikasi
```
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
TZ=Asia/Jakarta
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_URL=https://<domain>
NEXT_PUBLIC_WS_URL=wss://<domain>
```

### Pemisahan host
```
STAF_HOST=staf.<domain>
```
Bila **kosong** (pengembangan lokal di `localhost:3000`), pemisahan host
**nonaktif**: area publik dan staf dilayani di host yang sama, dan `server.js`
mencetak peringatan saat start. Di produksi wajib terisi.

**`NEXT_PUBLIC_WS_URL` bersifat opsional.** Klien Socket.io **menyambung ke
origin yang sama** (`window.location.origin`) secara bawaan — cookie
`httpOnly` yang diterbitkan di `staf.<domain>` tidak akan dikirim ke
`wss://<domain>`, sehingga sambungan ke domain utama pasti ditolak autentikasi
socket (Tahap 8). Isi variabel ini hanya bila server socket sengaja dipisah.

### Unggahan
```
UPLOAD_DIR=/app/public/unggahan
UPLOAD_MAX_MB=20
```

### Seed — RAHASIA
```
SEED_ADMIN_EMAIL=<email>
SEED_ADMIN_PASSWORD=<kata sandi kuat>
```

**Aturan Coolify:** rahasia = **Runtime only**, JANGAN "Available at
Buildtime". Hanya `NEXT_PUBLIC_*` yang boleh ikut waktu build.

> **BELUM DITETAPKAN — isi sebelum Tahap 0:** nama domain sebenarnya.
> Ganti `<domain>` di seluruh dokumen ini dan di `.env.example`.

---

## 14. ATURAN PANTANG DILANGGAR

Empat belas aturan. Tahap 9 memeriksa seluruhnya dengan bukti.

**1. Zona waktu WIB di tiga tempat.** Setel `SET time_zone='+07:00'` pada
setiap koneksi; isi kolom waktu penting dari aplikasi, bukan `NOW()`.

**2. Rahasia tidak boleh bocor ke log build.** Rahasia = Runtime only. Hanya
`NEXT_PUBLIC_*` yang boleh jadi `ARG` di Dockerfile.

**3. Menyembunyikan menu bukan pengamanan.** Setiap route API memeriksa peran
sendiri.

**4. Jangan pakai `!important`.** Untuk hamparan layar penuh, pakai React
Portal.

**5. Jangan pakai `100vh`.** Ukur dengan `window.visualViewport`. Sediakan
`hooks/useViewportTinggi.js`.

**6. Konsisten satu pendekatan untuk hamparan layar penuh.**

**7. Jangan biarkan data tanpa induk.** Tidak ada pengaduan tanpa riwayat,
tidak ada artikel tanpa kategori. Tegakkan di route API.

**8. Daftar putih setelan jangan terlupakan.** Rancang `lib/pengaturanDefinisi.js`
sebagai sumber tunggal bagi tampilan **dan** daftar putih API, sehingga
menambah setelan hanya perlu satu perubahan.

**9. Jangan biarkan kode mati menumpuk.** Telusuri di Tahap 9.

**10. Jangan pakai `output: 'standalone'`.** Custom server butuh `node_modules`
penuh dan berkas sumber. Sediakan `/api/health`.

**11. Build hijau bukan berarti sistem jalan.** `proxy.js` yang tidak ditemukan
tidak menghentikan build — Next.js hanya berjalan tanpa proxy. Uji dengan
permintaan sungguhan.

**12. `await` semua API permintaan.** `cookies()`, `headers()`, `params`,
`searchParams` tidak berfungsi lagi bila dibaca sinkron di Next.js 16.

**13. Identitas pelapor tidak pernah keluar.** Tidak di halaman publik, tidak
di `/lacak`, tidak di muatan socket, tidak ke peran yang tidak berhak.
Penyaringan di **SQL**, bukan JavaScript.

**14. Setiap perubahan bisa dibatalkan.** Satu tahap = satu commit yang utuh;
berkas yang dihapus/dipindah tercatat di laporan tahap. `npm run build` hijau
sebelum commit, sehingga `git revert` selalu aman.

---

## 15. STANDAR MUTU SETIAP TAHAP

Tahap **belum selesai** bila salah satu tidak terpenuhi.

### Kode
- [ ] Tidak ada `!important`, tidak ada `100vh`
- [ ] Tidak ada SQL di luar `lib/db/`
- [ ] Seluruh kueri prepared statement
- [ ] Seluruh kolom waktu diisi dari aplikasi
- [ ] Tidak ada rahasia ter-commit
- [ ] Tidak ada nama ikon bocor sebagai teks
- [ ] Menu hanya dari `lib/navItems.js`
- [ ] Seluruh `cookies()`/`headers()`/`params`/`searchParams` di-`await`
- [ ] Berkas proxy bernama `proxy.js` dengan fungsi bernama `proxy`

### Keamanan
- [ ] Setiap route API baru memanggil `requireRole`
- [ ] Diuji dengan curl memakai peran tidak berhak → 403
- [ ] Masukan divalidasi di server, bukan hanya peramban
- [ ] Unggahan dibatasi tipe dan ukuran, nama diganti acak, magic bytes diperiksa

### Tampilan
- [ ] Dibandingkan berdampingan dengan `screen.png`
- [ ] Diuji pada 375px, 768px, 1280px
- [ ] Kontras lulus WCAG AA
- [ ] Seluruh gambar ber-`alt`, seluruh input ber-`label`
- [ ] Navigasi keyboard berfungsi

### Penutupan tahap
- [ ] Tahap ditutup sesuai `ALUR-KERJA-CLAUDE-CODE.md`: laporan ditulis, build hijau, satu commit, berhenti menunggu "lanjut"
- [ ] Commit tahap ini hanya berisi berkas yang benar-benar berubah (periksa `git show --stat`)
- [ ] Berkas yang dihapus/dipindah tercatat di laporan tahap
- [ ] Laporan memuat bagian "Cara menguji ulang" yang bisa dijalankan pemilik sendiri
- [ ] Disebutkan di laporan bila `package.json` berubah (pemilik perlu tahu ada dependensi baru)

### Pelaporan
- [ ] Seluruh butir UJI TAHAP dijalankan sungguhan
- [ ] Hasil dilaporkan apa adanya, termasuk yang gagal
- [ ] KEPUTUSAN BARU ditandai eksplisit

---

## 16. CATATAN KHUSUS NEXT.JS 16

Enam hal yang berbeda dari Next.js 14, dan berdampak langsung ke proyek ini.

### 16.1 `middleware.js` menjadi `proxy.js`

Berkas di akar proyek, fungsi bernama `proxy` (atau default export).
`config.matcher` tetap sama.

```js
// proxy.js
import { NextResponse } from 'next/server';

export function proxy(request) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|unggahan).*)'],
};
```

Bila hanya berkasnya diganti nama tanpa mengganti nama fungsinya, Next.js
melempar galat. Bila berkasnya **tidak ada**, Next.js **tidak** melempar galat
— ia hanya berjalan tanpa proxy.

### 16.2 Proxy bukan pagar otorisasi

Dokumentasi Next.js 16 menyatakan bahwa proxy tidak dimaksudkan sebagai solusi
manajemen sesi atau otorisasi yang utuh; ia berguna untuk pemeriksaan
optimistis seperti pengalihan berbasis izin. Dokumentasi yang sama menganjurkan
verifikasi autentikasi dan otorisasi **di dalam setiap Server Function**.

Latar belakangnya CVE-2025-29927, yang memungkinkan pelewatan seluruh
pemeriksaan di lapisan itu lewat satu header.

Untuk kita ini penegasan, bukan perubahan: lapisan 3 dan 4 memang sudah menjadi
pagar sejak awal.

### 16.3 Proxy berjalan di runtime Node.js

Opsi `runtime` tidak tersedia di berkas proxy dan akan melempar galat bila
diisi. Konsekuensinya, `jose` bekerja normal di sana.

### 16.4 API permintaan sepenuhnya asinkron

```js
const cookieStore = await cookies();
const h = await headers();
const { slug } = await params;
const sp = await searchParams;
```

Di Next.js 15 pembacaan sinkron hanya memberi peringatan; di 16 tidak berfungsi
lagi.

### 16.5 Turbopack menjadi bundler bawaan

Uji `npm run dev` **dan** `npm run build` sejak Tahap 0, selagi proyek masih
kosong dan penyebab masalah mudah ditemukan.

### 16.6 `next lint` dihapus

Panggil ESLint langsung lewat skrip `lint` di `package.json`. `eslint.config.mjs`
(flat config) menggantikan `.eslintrc.json`.

### 16.7 SUDAH DIBUKTIKAN: proxy berjalan di custom server

Diuji **31 Agustus 2026** pada Next.js **16.3.3**, React 19.2.8, Node 22.22,
dengan `server.js` custom (`next()` + `createServer` + Socket.io 4.8.3):

| Uji | Dev (`node server.js`) | Produksi (`next build` → `NODE_ENV=production node server.js`) |
|---|---|---|
| Header yang diset di `proxy.js` sampai ke halaman (`await headers()`) | ✅ | ✅ |
| Header respons dari proxy sampai ke klien | ✅ | ✅ |
| Host publik → `/staf/dashboard` ditolak (404) | ✅ | ✅ |
| Host staf → `/tentang` dialihkan (307) ke `/staf/dashboard` | ✅ | ✅ |
| Host publik → `/api/health` 200 tanpa token | ✅ | ✅ |
| Socket.io handshake di proses yang sama | ✅ | ✅ |
| `next build` menampilkan `ƒ Proxy (Middleware)` | — | ✅ |

Tahap 0 tetap **mengulang** uji ini di lingkungan pelaksana sebagai konfirmasi
(hasilnya harus sama; bila berbeda, laporkan — versi Next.js bisa berbeda).
Cabang "bila proxy tidak berjalan" di Tahap 2 **tidak diperlukan lagi**.

### 16.8 JEBAKAN yang ditemukan saat pembuktian: `request.url` bukan host asli

Di bawah custom server, `request.url` dan `request.nextUrl.host` di dalam
`proxy()` berisi **hostname:port yang diberikan ke `next()`** — yaitu
`0.0.0.0:3000` — bukan host yang diminta pengguna, **walaupun** header `Host`
dan `X-Forwarded-Host` berisi `staf.<domain>`. Skema (`https`) diambil dari
`X-Forwarded-Proto`, tetapi host-nya tidak.

Akibatnya pola dari dokumentasi Next.js:

```js
return NextResponse.redirect(new URL('/staf/dashboard', request.url));   // SALAH di custom server
```

mengalihkan pengguna ke `https://0.0.0.0:3000/staf/dashboard` di produksi.
Terbukti dengan curl.

**Aturan:** setiap URL absolut di `proxy.js` (pengalihan, tautan) disusun dari
header, memakai `urlDariHeader()` yang sudah ada di
`paket-pendukung/ASET/kerangka/proxy.js`:

```js
function urlDariHeader(request, path) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return new URL(path, `${proto}://${host}`);
}
```

Terbukti menghasilkan `https://staf.warkop.test/staf/dashboard`. Pembacaan
`pathname` dari `request.nextUrl` **tetap benar** — hanya host-nya yang salah.

---

## 17. PENYESUAIAN DARI CAP JIKI

| Cap Jiki | Warkop Nusantara | Alasan |
|---|---|---|
| 4 subdomain peran | 2 host: domain utama + `STAF_HOST` | Peran staf cukup dipisah lewat peran di lapisan 3 dan 4 |
| `mutasi_saldo` (`saldo_sebelum`/`saldo_sesudah`) | `pengaduan_riwayat` (`status_sebelum`/`status_sesudah`) | Pola buku besar dipindahkan ke perubahan status pengaduan |
| MediaMTX, RTMP, WebRTC, HLS | **Dihapus seluruhnya** | Opsional di cetak biru; tidak dibutuhkan |
| Socket.io untuk hasil ronde | Socket.io untuk notifikasi pengaduan | Kerangka sama, kegunaan disesuaikan |
| Next.js 14 + `middleware.js` | Next.js 16 + `proxy.js` | Cabang 14 EOL; lihat cetak biru v2 |

**Versi yang terverifikasi 31 Agustus 2026** (dipakai kerangka di
`PAKET-PENDUKUNG`): `next 16.3.3`, `react 19.2.8`, `react-dom 19.2.8`,
`socket.io 4.8.3`, `tailwindcss 3.4.19`, `@tailwindcss/forms 0.5.11`,
`postcss 8.5.26`, `autoprefixer 10.5.4`, Node `22.22.2`. `npm audit`: 0
kerentanan pada saat itu. Tahap 0 tetap menjalankan `npm audit` ulang.

**Yang TIDAK berubah:** pola satu aplikasi Next.js sebagai frontend dan
backend, custom `server.js`, MariaDB di container terpisah, Dockerfile tiga
tahap, empat lapisan autentikasi, seluruh SQL di `lib/db/`, menu di satu
berkas, dan kesepuluh pelajaran Cap Jiki.

---

## 18. PROTOKOL KONVERSI LAYAR (WAJIB untuk setiap halaman)

Bagian ini ada karena satu alasan: **tampilan harus benar-benar mirip dengan
`Warkop_Nusantara.zip`**, bukan "terinspirasi" olehnya. Deskripsi layar di
berkas tahap hanya ringkasan; **sumber kebenaran tata letak adalah `code.html`**
di ZIP. Protokol ini berlaku di Tahap 2, 4, 5, 6, dan 7, untuk setiap halaman
tanpa kecuali.

### 18.1 Sebelum menulis kode halaman

1. **Baca `code.html` layar itu UTUH** dari
   `desain/stitch_portal_berita_inklusif/<layar>/code.html`.
   Jangan menulis halaman dari ingatan deskripsi tahap.
2. **Lihat `screen.png`-nya dengan alat `view`** (kecuali tiga yang rusak,
   bagian 9 cacat 3). Perhatikan proporsi, jarak, dan warna yang sebenarnya.
3. Catat lebar `screen.png` (`file screen.png`) — itu lebar viewport rujukan
   untuk perbandingan.

### 18.2 Aturan port DOM 1:1

Struktur DOM dan **string kelas Tailwind disalin apa adanya** dari `code.html`.
Hanya **enam jenis perubahan** yang diizinkan:

| # | Di `code.html` | Menjadi | Catatan |
|---|---|---|---|
| a | `<span class="material-symbols-outlined">nama</span>` | `<Ikon nama="nama" />` | Dari `paket-pendukung/ASET/ikon/Ikon.js`. Kelas ukuran/warna pada span (`text-sm`, `text-secondary`) dipindah ke prop `className`. Bila span punya `style="font-variation-settings:'FILL' 1"` → tambahkan prop `terisi` |
| b | `<img src="https://lh3.googleusercontent...">` | `next/image` dengan berkas lokal, atau URL dari basis data | Logo → `/logo-warkop.png`. Foto contoh → placeholder lokal bertema (bukan googleusercontent) sampai ada data |
| c | `href="#"` | rute sungguhan dari `lib/navItems.js` atau data | Tidak boleh ada `href="#"` tersisa |
| d | Teks/angka contoh di bagian yang **ditandai dinamis** oleh berkas tahap | data dari basis data | Teks lain (judul bagian, label, keterangan, placeholder) disalin **verbatim** |
| e | Elemen berulang (kartu, baris tabel, item daftar) | satu elemen di dalam `.map()` | Kelas elemen pertama di desain yang dipakai; keadaan kosong memakai `KeadaanKosong` |
| f | `class=` | `className=`; `for=` → `htmlFor=`; `tabindex` → `tabIndex`; atribut boolean & self-closing tag | Sintaks JSX saja, bukan perubahan tampilan |

Di luar keenam itu, **kelas dan struktur TIDAK diubah** — termasuk yang terasa
aneh, berlebihan, atau "bisa dirapikan". Kelas `dark:*` dibiarkan; ia tidak
aktif karena tidak ada pengalih tema (`darkMode: 'class'` tanpa kelas `dark`
di `<html>`). Kelas non-Tailwind sisa Stitch (`docked`, `full-width`, `flat`,
`texture-paper`) juga dibiarkan; ia tidak berpengaruh.

**Yang tidak boleh dilakukan:** mengganti nilai jarak (`gap-6` → `gap-4`),
mengganti warna (`text-secondary-fixed-dim` → `text-secondary`), mengganti
radius, menambah bayangan/animasi, mengganti urutan bagian, atau "menyeragamkan"
gaya antar layar di luar komponen kanonik (18.3).

### 18.3 Komponen kanonik — navbar dan footer

**Cacat export 7 (bagian 9):** navbar dan footer **berbeda di tiap layar** pada
export — ukuran logo (h-8 / h-12 / h-16 / tanpa gambar), ada-tidaknya kotak
cari, dan gaya tombol "Masuk Staff". Ini artefak Stitch yang membuat layar per
layar, bukan keputusan desain. Situs sungguhan harus memakai **satu** navbar dan
**satu** footer. Keputusannya ditetapkan di sini agar tidak dipilih ulang di
tiap tahap:

**Navbar kanonik** = header
`kontak_pengaduan_warkop_nusantara_updated_logo/code.html` (iterasi terakhir,
folder bernama `updated_logo`, satu-satunya yang memperlakukan logo segel dengan
benar: `h-16 w-16 object-contain`) **ditambah** kotak cari dari
`beranda_warkop_nusantara/code.html` (satu-satunya elemen varian yang punya
fungsi: mengirim ke `/berita?q=`). Markup verbatim:

```html
<header class="bg-primary dark:bg-primary-container docked full-width top-0 border-b border-outline-variant dark:border-outline shadow-sm z-50 sticky">
<div class="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-unit max-w-container-max mx-auto">
<div class="font-headline-md text-headline-md font-bold text-on-primary uppercase tracking-tight flex items-center gap-2"><img alt="WARKOP NUSANTARA Logo" class="h-16 w-16 object-contain rounded-full" src="/logo-warkop.png"/>
<span class="font-headline-md text-headline-md font-bold text-on-primary uppercase tracking-tight">WARKOP NUSANTARA</span></div>
<nav class="hidden md:flex items-center gap-6 mt-4 md:mt-0">
<a class="font-label-md text-label-md text-on-primary opacity-80 hover:opacity-100 transition-opacity hover:text-secondary-container transition-colors duration-200" href="#">Beranda</a>
<a class="font-label-md text-label-md text-on-primary opacity-80 hover:opacity-100 transition-opacity hover:text-secondary-container transition-colors duration-200" href="#">Tentang Kami</a>
<a class="font-label-md text-label-md text-on-primary opacity-80 hover:opacity-100 transition-opacity hover:text-secondary-container transition-colors duration-200" href="#">Struktur</a>
<a class="font-label-md text-label-md text-on-primary opacity-80 hover:opacity-100 transition-opacity hover:text-secondary-container transition-colors duration-200" href="#">Program</a>
<a class="font-label-md text-label-md text-on-primary opacity-80 hover:opacity-100 transition-opacity hover:text-secondary-container transition-colors duration-200" href="#">Galeri</a>
<a class="font-label-md text-label-md text-secondary-fixed-dim font-bold border-b-2 border-secondary-fixed-dim pb-1 opacity-90 transition-all duration-150" href="#">Kontak &amp; Pengaduan</a>
<a class="font-label-md text-label-md text-on-primary opacity-80 hover:opacity-100 transition-opacity hover:text-secondary-container transition-colors duration-200" href="#">Berita</a>
</nav>
<div class="flex items-center gap-4">
<div class="relative hidden lg:block">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
<input class="pl-9 pr-3 py-1.5 rounded-full bg-surface text-on-surface text-sm border border-outline-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary w-48 transition-all" placeholder="Cari..." type="text">
</div>
<button class="hidden md:flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-secondary-container hover:text-on-secondary-container transition-colors">
                Masuk Staff
                <span class="material-symbols-outlined">login</span>
</button>
</div>
</div>
</header>
```

Aturan turunan untuk `components/publik/HeaderPublik.js`:

- Tautan aktif memakai **persis** kelas tautan "Kontak &amp; Pengaduan" di atas
  (`text-secondary-fixed-dim font-bold border-b-2 border-secondary-fixed-dim pb-1 opacity-90`);
  tautan lain memakai kelas "Beranda". Ditentukan dari `usePathname()`.
- Menu dari `lib/navItems.js` → `menuPublik`, urutan sama seperti di atas.
- Kotak cari adalah `<form action="/berita" method="get">` dengan `name="q"`.
- "Masuk Staff" adalah `<a>` ke `https://<STAF_HOST>/login` (server component
  membaca `process.env.STAF_HOST`; bila kosong, `/login`).
- Di bawah `md`, `<nav>` dan tombol tersembunyi oleh desain (`hidden md:flex`).
  Tambahkan **tombol hamburger** (`<Ikon nama="menu" />`) yang membuka laci
  berisi menu yang sama — desain tidak menggambar lacinya, jadi ini
  **KEPUTUSAN BARU** wajib: laci berlatar `bg-primary`, tautan dengan kelas yang
  sama seperti navbar, ditumpuk vertikal, `gap-4`, tanpa animasi rumit.

**Footer kanonik** = footer `beranda_warkop_nusantara/code.html` (yang paling
lengkap: kolom Tautan Cepat dan Hubungi Kami), dengan logo memakai perlakuan
segel yang sama seperti navbar. Markup verbatim:

```html
<footer class="bg-primary dark:bg-primary-container text-on-primary dark:text-on-primary-container w-full px-margin-mobile md:px-margin-desktop py-12 flex flex-col md:flex-row justify-between items-start gap-gutter max-w-container-max mx-auto border-t border-outline flat">
<div class="flex flex-col gap-4 w-full md:w-1/3">
<div class="font-headline-md text-headline-md text-secondary-fixed flex items-center gap-2"><img src="/logo-warkop.png" alt="Warkop Nusantara Logo" class="h-12 w-12 object-contain rounded-full">
<span class="">WARKOP NUSANTARA</span></div>
<p class="font-motto text-motto text-on-primary/90 mt-2">
                © 2024 Warkop Nusantara. Wadah Aspirasi Rakyat, Kontrol, Observasi dan Pengawasan Nusantara. Berani Karena Benar.
            </p>
</div>
<div class="flex flex-col sm:flex-row gap-12 w-full md:w-auto mt-8 md:mt-0">
<div class="flex flex-col gap-3">
<h4 class="font-label-md text-label-md text-secondary-fixed mb-2 uppercase tracking-wider">Tautan Cepat</h4>
<a class="font-label-md text-label-md text-surface-variant hover:text-on-primary transition-colors duration-300 hover:underline" href="#">Kantor Regional</a>
<a class="font-label-md text-label-md text-surface-variant hover:text-on-primary transition-colors duration-300 hover:underline" href="#">Kebijakan Privasi</a>
<a class="font-label-md text-label-md text-surface-variant hover:text-on-primary transition-colors duration-300 hover:underline" href="#">Pedoman Komunitas</a>
<a class="font-label-md text-label-md text-surface-variant hover:text-on-primary transition-colors duration-300 hover:underline" href="#">FAQ</a>
<a class="font-label-md text-label-md text-surface-variant hover:text-on-primary transition-colors duration-300 hover:underline" href="#">Kontak Media</a>
</div>
<div class="flex flex-col gap-3">
<h4 class="font-label-md text-label-md text-secondary-fixed mb-2 uppercase tracking-wider">Hubungi Kami</h4>
<p class="font-body-md text-body-md text-surface-variant flex items-center gap-2">
<span class="material-symbols-outlined text-sm" data-icon="mail">mail</span>
                    pengaduan@warkopnusantara.id
                </p>
<p class="font-body-md text-body-md text-surface-variant flex items-center gap-2">
<span class="material-symbols-outlined text-sm" data-icon="call">call</span>
                    1500-WAP
                </p>
</div>
</div>
</footer>
```

Aturan turunan untuk `components/publik/FooterPublik.js`:

- Tahun hak cipta dari `new Date().getFullYear()` (server component).
- Email dan hotline dari tabel `pengaturan` (`kontak_email`, `kontak_hotline`);
  teks di atas hanya contoh.
- Tautan "Kantor Regional" → `/struktur#regional`, "Kontak Media" → `/kontak`.
  "Kebijakan Privasi", "Pedoman Komunitas", "FAQ" → halaman statis
  `/kebijakan-privasi`, `/pedoman-komunitas`, `/faq` yang isinya diambil dari
  `pengaturan` (kunci `teks_kebijakan_privasi`, `teks_pedoman_komunitas`,
  `teks_faq`) — dibuat di Tahap 4 sebagai halaman teks sederhana bergaya
  `detail_artikel_investigasi`. **KEPUTUSAN BARU** yang sudah ditetapkan di sini.

**Sidebar staf kanonik** = sidebar `dashboard_staff_warkop/code.html`
(ikon ter-render benar, item aktif berlatar emas). Layar staf lain
(`kelola_artikel_admin`, `kelola_pengaduan_admin`, `editor_artikel_admin`)
memakai sidebar yang **sama**; perbedaan kecil di export diabaikan.

### 18.4 Halaman yang tidak ada di ZIP

Detail pengaduan, kelola pengurus/program/galeri/pengguna/pengaturan, halaman
lacak, 403, 404, dan halaman teks statis **tidak digambar** Stitch. Untuk ini:

- Ambil layar yang **paling dekat fungsinya** sebagai cetakan (tabel → 
  `kelola_artikel_admin`; formulir → `editor_artikel_admin`; halaman teks →
  `detail_artikel_investigasi`; konfirmasi/pelacakan → kartu di
  `kontak_pengaduan_warkop_nusantara_updated_logo`).
- Susun dari komponen `components/ui/` yang kelasnya sudah diambil dari layar
  cetakan itu. Jangan memperkenalkan kelas warna, radius, atau tipografi yang
  tidak muncul di ZIP.
- Tandai sebagai **KEPUTUSAN BARU** dan sebutkan layar cetakannya.

### 18.5 Uji kesetiaan — wajib per halaman, bisa tanpa peramban

`paket-pendukung/UJI/uji-kesetiaan.mjs` membandingkan `code.html` desain dengan
HTML hasil render:

```powershell
# halaman publik
node paket-pendukung/UJI/uji-kesetiaan.mjs desain/stitch_portal_berita_inklusif/beranda_warkop_nusantara/code.html http://localhost:3000/ --teks

# halaman staf: ambil HTML render dengan cookie login lebih dulu (pakai curl.exe, bukan alias curl PowerShell)
curl.exe -s -b "warkop_token=<jwt>" http://localhost:3000/staf/pengaduan > render.html
node paket-pendukung/UJI/uji-kesetiaan.mjs desain/stitch_portal_berita_inklusif/kelola_pengaduan_admin/code.html render.html --teks
```

Yang dilaporkan: kelas desain yang hilang di render, token desain yang hilang,
teks tampak yang hilang, dan sisa cacat export (nama ikon sebagai teks,
googleusercontent, CDN, `href="#"`, `!important`, `100vh`) — yang terakhir ini
**wajib nol**.

Cakupan kelas 100% tidak diminta (navbar/footer kanonik dan `.map()` memang
berbeda). Yang diminta: **setiap kelas yang hilang punya alasan** yang tertulis
di LAPORAN.md, mengacu ke salah satu dari enam perubahan yang diizinkan di 18.2
atau ke komponen kanonik 18.3. Kelas hilang tanpa alasan = tampilan menyimpang.

Bila peramban tersedia, tambahkan tangkapan layar pada **lebar yang sama dengan
`screen.png`** dan sandingkan. Bila tidak, katakan tidak tersedia dan andalkan
uji di atas — jangan menulis "sudah dibandingkan secara visual" tanpa peramban.

### 18.6 Ringkasan satu kalimat

**Salin `code.html`, jangan tafsirkan; ganti hanya enam hal; navbar, footer,
dan sidebar dari satu sumber kanonik; buktikan dengan `uji-kesetiaan.mjs`.**

---

## LAMPIRAN: KEPUTUSAN PEMILIK SISTEM

| | Keputusan | Status |
|---|---|---|
| 1 | **Repositori** | ✅ `https://github.com/danielandersontech-excellent/deploy-LSM` |
| 2 | **Folder kerja lokal** | ✅ `D:\Deploy\LSM` |
| 3 | **Versi Next.js** | ✅ Next.js 16 (`^16.3.0`), React 19.2, Node 22 |
| 4 | **Alur perubahan** | ✅ Kerja langsung di repo lewat Claude Code, satu commit per tahap (bagian 13 cetak biru) |
| 5 | **Nama domain** | ⬜ **BELUM** — MODE OTONOM: Tahap 3 dikerjakan sebagian (butir server `MENUNGGU PEMILIK`), pembangunan jalan terus |
| 6 | **Daftar peran staf** | ✅ **DIKONFIRMASI pemilik (3 Sep 2026)**: lima peran di bagian 11 dipakai apa adanya, terkunci sebagai ENUM `users.peran` di Tahap 1 |
| 7 | **Penyimpanan unggahan** | ✅ **DIKONFIRMASI: volume lokal** — volume lokal atau object storage. Lampiran boleh MP4 sampai 20MB; memindahkan penyimpanan setelah sistem berjalan jauh lebih mahal. **Bila belum diputuskan saat Tahap 0–2, pakai volume lokal** (`UPLOAD_DIR=/app/public/unggahan`, dipasang sebagai volume Coolify di Tahap 3) — ini pilihan bawaan cetak biru dan bisa dipindah ke object storage lewat satu modul `lib/penyimpanan.js` bila nanti diperlukan |
| 8 | **Proxy di custom server** | ✅ Terbukti berjalan (bagian 16.7). Bukan lagi keputusan terbuka |
| 9 | **Navbar / footer / sidebar kanonik** | ✅ Ditetapkan verbatim di bagian 18.3 |
| 10 | **Kategori pengaduan, program, galeri** | ✅ Ditetapkan di bagian 10 dari `<option>` di ZIP |

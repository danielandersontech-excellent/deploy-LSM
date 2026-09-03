# LAPORAN TAHAP 04 — SITUS PUBLIK

Tanggal: 3 September 2026 (22:50 – 23:35 WIB) · Mode: OTONOM · Bukti:
`laporan/bukti-tahap-04/` (uji kesetiaan per halaman, tangkapan layar 3 lebar,
Lighthouse, kontras, keyboard, keadaan kosong, build hijau).

## Ringkasan — bacalah ini dulu

Lima layar publik dikonversi dari `code.html` (beranda, tentang, struktur,
program, galeri) lewat protokol REFERENSI 18, ditambah navbar + footer kanonik,
laci menu seluler, sepuluh komponen `components/ui/`, `hooks/useViewportTinggi`,
tiga halaman teks statis dari `pengaturan`, `not-found`/`error`/`sitemap`/
`robots`, dan 26 gambar penampung lokal bertema. **Sisa cacat export = 0 pada
kelima halaman** (build produksi), setiap kelas hilang beralasan (bagian 9),
identitas pelapor tidak bocor, kontras WCAG 28 pasangan lulus, build + lint
hijau. **Lighthouse Performance masih < 90** (69–80) — penyebab terukur: font
Fira Sans dari paket pendukung tidak disubset (±570 KB) sehingga LCP teks
tertunda pada jaringan tersimulasi; perbaikan yang bisa dilakukan tanpa
menyentuh aset (matikan preload) sudah diterapkan, subset font menunggu
keputusan pemilik (bagian 3).

**Dua temuan desain penting** (bagian 6): (1) navbar kanonik 18.3 (header
kontak + kotak cari) tidak muat dalam kontainer 1280 px — tautan "Berita"
menimpa kotak cari; cacat yang sama terlihat di `screen.png` beranda; (2)
`min-h-screen` pada `<body>` desain menghasilkan `100vh` di CSS Tailwind.

## 1. Halaman dan komponen yang dibuat

| Kelompok | Berkas |
|---|---|
| Kerangka publik | `app/(publik)/layout.js` (navbar + footer kanonik, tautan lewati-ke-konten, `force-dynamic`) |
| Navbar/footer kanonik | `components/publik/HeaderPublik.js` (server, STAF_HOST), `NavPublik.js` (client: tautan aktif, kotak cari `/berita?q=`, laci hamburger), `FooterPublik.js` (tahun, email/hotline dari `pengaturan`) |
| Halaman | `app/(publik)/page.js` (beranda), `tentang/page.js`, `struktur/page.js`, `program/page.js`, `galeri/page.js`, `kebijakan-privasi/`, `pedoman-komunitas/`, `faq/` (cetakan `components/publik/HalamanTeks.js`) |
| Halaman sistem | `app/not-found.js`, `app/error.js`, `app/sitemap.js`, `app/robots.js` |
| Komponen UI | `components/ui/Tombol.js`, `Kartu.js`, `Lencana.js`, `Input.js`, `Select.js`, `Paginasi.js`, `KeadaanKosong.js`, `Dialog.js`, `Tabel.js`, `Pemuat.js` — kelas verbatim dari layar ZIP, sumbernya tercatat di kepala tiap berkas |
| Hook | `hooks/useViewportTinggi.js` (pengganti `100vh`, `window.visualViewport`) |
| Data | `lib/db/pengaduan.js` + `ambilKasusBerjalanPublik()` (SQL tanpa kolom identitas) |
| Aset | `scripts/buat-penampung.mjs` → `public/penampung/*.jpg` (26 berkas, 1 MB) |
| Gaya | `app/globals.css` + kelas non-Tailwind dari `<style>` layar (`form-input-focus`, `pressed-paper-shadow`, `texture-paper`, `drop-cap`) |
| Font | `app/font.js`: `preload: false` untuk Fira Sans (bagian 3) |
| Dihapus | `.gitkeep` di `app/(publik)/{tentang,struktur,program,galeri}` |

**`package.json` berubah**: `sharp ^0.35.4` ditambahkan (daftar paket yang
diizinkan CLAUDE.md aturan 4) — dipakai `scripts/buat-penampung.mjs`; Tahap 6
memakainya untuk unggahan.

## 2. Perbandingan visual (butir a2/b)

Peramban tersedia: Chrome headless. Tangkapan layar build produksi pada
375/768/1280 px untuk beranda, tentang, struktur, program, galeri, faq, 404
(`bukti-tahap-04/tangkapan/*.png`, daftar di `b-tangkapan-tiga-lebar.txt`),
plus `beranda-830.png` (lebar `screen.png` beranda) dan `navbar-{830,1024,1280}.png`.
Disandingkan dengan `screen.png` (beranda 830, struktur 1280, galeri 1280);
tentang & program `screen.png` rusak → dibandingkan dengan `code.html`.
Hasil: tata letak, warna, tipografi, dan susunan bagian sama; perbedaan yang
ada = isi data DB (judul artikel, nama pengurus, foto penampung) dan navbar
kanonik (temuan 6.1). Tangkapan lebar 375 memperlihatkan laci hamburger
tertutup, pita statistik satu kolom, kartu bertumpuk.

## 3. Skor Lighthouse (butir c)

Lighthouse 12 (mobile, throttling tersimulasi) pada build produksi lokal —
tabel final di `c-lighthouse.md`, laporan HTML/JSON di `lighthouse/final/`,
eksperimen di `c-lighthouse-eksperimen.txt`:

| Halaman | Performance (awal → final) | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/` | 69 → **70** (LCP 6,0 s, FCP 3,5 s, TBT 120 ms, CLS 0) | 100 | 96 | 100 |
| `/struktur` | 73 → **80** (LCP 4,3 s, FCP 2,7 s, TBT 110 ms, CLS 0,02) | 98 | 96 | 100 |
| `/galeri` | 78 → **77** (LCP 4,9 s, FCP 2,7 s, TBT 80 ms, CLS 0,002) | 100 | 96 | 100 |

**Penyebab Performance < 90 (diukur, bukan diduga):** fase LCP struktur =
TTFB 463 ms, *Render Delay* 5.834 ms (93 %); LCP elemen adalah `<p>`/`<h1>`
teks. Lighthouse memperbarui kandidat LCP saat font web final ter-render;
halaman mengunduh Domine 41 KB + empat berkas Fira Sans 138–147 KB (±615 KB,
semua di-preload oleh `next/font`). Pada 4G tersimulasi itu ±4–5 s.
Eksperimen `preload: false` untuk Fira Sans: struktur 73 → 80, LCP 6,3 → 4,3 s
— diterapkan (KEPUTUSAN BARU 7.9); FCP memburuk 1,1–1,3 → 2,7–3,5 s tetapi skor total naik. Eksperimen kedua (watermark hero beranda tanpa `priority`) tidak mengubah apa pun (LCP tetap gambar watermark, 6,1 s) — `priority` dikembalikan. Sisa: berkas Fira Sans di
`paket-pendukung/ASET/fonts/` adalah glyph penuh (Latin+Cyrillic+Greek+…);
subset Latin akan ±25 KB per berat, tetapi (a) aset paket pendukung
baca-saja dan (b) alat subset (`fonttools`) tidak terpasang dan pemasangannya
= perangkat global (dilarang tanpa pemilik). **Butuh keputusan pemilik**:
izinkan subset font (glyph sama, cakupan Latin) di `public/fonts/`.
Best Practices 96: dua `404` di konsol dari *prefetch* `/kontak` dan `/berita`
(halaman Tahap 5/6, belum ada) — hilang sendiri di tahap itu; bf-cache
dinonaktifkan karena `Cache-Control: no-store` halaman dinamis (perilaku Next).
Accessibility 98 struktur: `heading-order` (`<h4>` nama regional setelah
`<h2>`) — struktur heading persis desain, dilaporkan, tidak diubah.

## 4. Tabel kontras WCAG (butir g)

`g-kontras-wcag.md`: 28 pasangan teks/latar yang benar-benar dipakai
(termasuk yang berisiko: emas `#e9c349` di cokelat `#271310` = 10,42:1; abu
`#504442` di krem `#faf9f5` = 8,87:1; `on-primary-container #ae8d87` di
cokelat = 5,86:1; `on-secondary-container` di `secondary-container` = 4,58:1;
lencana abu galeri = 4,56:1). **Semua lulus** ≥ 4,5:1 teks biasa / ≥ 3:1
teks besar. Dihitung terprogram dari nilai token (luminansi WCAG), opacity
`/80`/`/90` dicampur dengan latar.

## 5. Hasil keempat belas butir UJI TAHAP 4

| Butir | Hasil | Bukti |
|---|---|---|
| a. Uji kesetiaan per halaman | **LULUS** — cacat export 0/0/0/0/0; cakupan kelas beranda 97 %, tentang 89 %, struktur 91 %, program 81 % (paginasi tersembunyi: 27 kelas saat paginasi tampil), galeri 93 %; seluruh kelas hilang beralasan (bagian 9) | `a-kesetiaan-*.txt`, `a-kesetiaan-produksi-semua.txt` |
| a2. Perbandingan visual | **LULUS** (Chrome headless; bagian 2) | `tangkapan/` |
| b. 375/768/1280 | **LULUS** — 21 tangkapan build produksi | `b-tangkapan-tiga-lebar.txt` |
| c. Lighthouse | **SEBAGIAN** — A11y 98–100, BP 96, SEO 100 lulus; Performance 69–80 < 90, penyebab & perbaikan di bagian 3, sisa menunggu izin subset font | `c-lighthouse.md`, `lighthouse/` |
| d. Nama ikon | **LULUS** — 0 di kelima halaman (juga `material-symbols-outlined` 0) | `d-e-j-k-produksi-semua.txt` |
| e. Larangan CSS | **LULUS** untuk kode tahap ini (0 `!important`, 0 `100vh` di sumber selain komentar). **Temuan**: CSS build memuat `.min-h-screen{min-height:100vh}` dari kelas `<body>` desain (Tahap 0) | idem, bagian 6.2 |
| f. Tanpa JavaScript | **LULUS** — seluruh konten dirender server (h1 + paragraf ada di HTML mentah); filter program/galeri = `<form method="get">`; laci hamburger butuh JS (menu tetap ada di DOM, `hidden`) | `d-e-j-k-m-f-beranda-statis.txt` |
| g. Kontras | **LULUS** 28/28 | `g-kontras-wcag.md` |
| h. Keyboard | **LULUS (terprogram)** — lewati-ke-konten = fokus pertama, 0 tabindex positif, 0 `div onclick`, `outline-none` selalu berpasangan `focus:ring/border/underline`, hamburger `aria-expanded/controls`; penekanan Tab sungguhan tidak bisa diotomasi headless | `h-keyboard.txt` |
| i. Isi dinamis | **LULUS** — `statistik_laporan_ditangani` 12000→54321 tampil "54.321+" tanpa deploy, dikembalikan | `i-pengaturan-dinamis.txt` |
| j. Kebocoran identitas | **LULUS** — 0 nilai `nama/nik/telepon/email_pelapor` di HTML mentah kelima halaman; Status Advokasi hanya nomor, kategori, wilayah, status (SQL tanpa kolom identitas) | `d-e-j-k-*`, `lib/db/pengaduan.js` |
| k. Font | **LULUS** — 0 `fonts.googleapis`; `next/font/local`, woff2 dari `/_next/static/media/` | idem |
| l. Keadaan kosong | **LULUS** — artikel/pengurus/galeri/program dikosongkan → 5 halaman 200 dengan `KeadaanKosong`, 0 galat; data dipulihkan `seed.js` | `l-keadaan-kosong.txt`, `skrip/uji-l-keadaan-kosong.sh` |
| m. `await` lengkap | **LULUS** — 0 `params/searchParams` sinkron di `app/` | `d-e-j-k-m-f-beranda-statis.txt` |
| n. Build hijau | **LULUS** — `npm run build` + `npm run lint` exit 0 | `n-build-hijau.txt` |

## 6. Cacat export / temuan desain

1. **Navbar kanonik tidak muat (TEMUAN UTAMA, butuh keputusan pemilik).**
   Perhitungan lebar pada kontainer maks 1280 px (isi 1200 px): merek h-16 +
   "WARKOP NUSANTARA" headline-md ≈ 350 px, 7 tautan label-md ≈ 680 px, kotak
   cari 192 px + tombol "Masuk Staff" ≈ 170 px → ≈ 1390 px. Tanpa kotak cari
   ≈ 1200 px (pas — sesuai `screen.png` kontak yang tanpa kotak cari). Karena
   `max-w-container-max`, ini terjadi di **semua** lebar desktop. Pada
   `screen.png` beranda (yang punya kotak cari) cacat yang sama terlihat:
   "Berita" menempel kotak cari, "Tentang Kami"/"Kontak & Pengaduan" membungkus.
   Yang dilakukan: **hanya** menambah `shrink-0 whitespace-nowrap` pada merek
   (agar merek tidak membungkus dua baris dan ditimpa tautan — semua
   `screen.png` menampilkan merek satu baris). Kotak cari tetap tampil sesuai
   18.3. Pilihan pemilik: (a) kotak cari hanya di laci seluler + pencarian di
   `/berita` (Tahap 5), (b) logo `h-12`, atau (c) biarkan.
   Bukti: `tangkapan/navbar-{830,1024,1280}.png`.
2. **`min-h-screen` = `100vh`.** Kelas `<body>` verbatim beranda (dipasang
   Tahap 0) dikompilasi Tailwind menjadi `min-height: 100vh`. Aturan 5
   ditujukan pada hamparan layar penuh iOS; `min-height` body tidak memicu
   bug itu, tetapi grep `100vh` di CSS build tidak nol. Tidak diubah (kelas
   desain) — pemilik memutuskan (`min-h-[100dvh]`/`min-h-full`).
3. `screen.png` tentang & program rusak (cacat 3) → dikonversi dari `code.html`.
4. Struktur: `<h3>` memakai `text-headline-md` **dan** `text-xl`; `<h4>`
   `font-label-md text-label-md` + `text-base font-bold`; nama wilayah desain
   ("Jawa & Bali") tidak cocok dengan tabel provinsi BPS.
5. Program: kelas `bg-surface-lowest` tidak ada di config (kartu transparan);
   `border-tertiary` hampir hitam; satu `<select>` mencampur urutan dan status.
6. Galeri: satu input teks untuk rentang tanggal tanpa `name`; `<option>`
   bernilai `all/investigasi/audiensi` ≠ slug; ukuran lencana terikat warna,
   bukan slot; kartu video tanpa baris tanggal; kartu foto tanpa tautan.
7. Tentang: `code.html` hanya memuat 4 dari 9 unsur filosofi dan tidak memuat
   Visi/Misi/Motto (diwajibkan berkas tahap); hero adalah `<header>` kedua
   (dua landmark banner); judul kartu akronim emas terang di kartu putih.
8. Seed menautkan `/penampung/galeri-3.mp4` yang tidak ada (tidak ada ffmpeg
   untuk membangkitkan video penampung) → tombol putar 404 sampai pemilik
   mengganti berkas/seed.
9. `font-label-sm` (cacat 8) dibiarkan; `antialiased` pada `<body>` beberapa
   layar tidak dipakai (body dari beranda).

## 7. KEPUTUSAN BARU

1. **Merek navbar = tautan ke `/`** (varian beranda) + `shrink-0
   whitespace-nowrap` (temuan 6.1). Laci hamburger: `bg-primary`, tautan kelas
   sama, vertikal `gap-4`, `aria-expanded/controls`, tertutup saat rute
   berganti; tombol hamburger di div aksi (md:hidden).
2. Kotak cari = `<form action="/berita" method="get" role="search">` dengan
   `<label class="sr-only">`.
3. Tautan hero: "Sampaikan Pengaduan" → `/kontak`, "Pelajari Prosedur" →
   `/faq`; "Pantau Semua Kasus" → `/lacak`; "Lihat Semua Berita" → `/berita`.
4. Beranda: lencana kartu besar = `kategori_nama` artikel (bukan teks tetap
   "Investigasi Khusus"); angka laporan `formatAngkaID + '+'`; Status
   Advokasi memakai `Lencana status` (mini-lencana desain diganti sesuai
   TAHAP-04), baris kedua = nama wilayah (tidak ada judul pengaduan publik);
   watermark hero = `/logo-warkop-besar.png` (tidak ada aset peta).
5. Gambar penampung: `sharp` membangkitkan 26 JPG bertema (cokelat/emas +
   segel logo + label "GAMBAR PENAMPUNG") sesuai jalur seed; idempoten;
   pemilik tinggal menimpa berkasnya.
6. Komponen UI: kelas dari layar sumber (kepala berkas). `KeadaanKosong`,
   `Dialog` (Portal + `useViewportTinggi`), `Pemuat` (ikon `pending` +
   `animate-spin`) tidak digambar Stitch — disusun dari kelas yang ada di ZIP.
   `pressed-paper-shadow` satu definisi (rgba 115,92,0) untuk tiga varian
   yang identik secara visual.
7. Halaman statis: cetakan `detail_artikel_investigasi` tanpa byline/gambar;
   FAQ = baris pertama blok → `<h2>`, sisanya jawaban.
8. `not-found`/`error`: kartu login/kontak; `error.js` tidak menampilkan pesan
   teknis, hanya `digest`. `sitemap.js` `force-dynamic` (baca DB saat
   permintaan; aman untuk build Docker tanpa DB), tahan galat DB.
9. `app/font.js`: Fira Sans `preload: false` (bagian 3); Domine tetap preload.
10. Tentang: 5 unsur filosofi ditambahkan dengan kelas item pertama; Visi/Misi
    dari `pengaturan` dengan kelas kartu akronim; ikon `gavel`, `badge`,
    `article`, `campaign`, `verified`, `explore`, `check_circle`, `shield`.
11. Struktur: filter wilayah = tautan `?wilayah=<id>#regional` pada lencana
    wilayah (bukan `<select>`); tombol peta = `?tampilan=peta`; "Profil →" →
    `#pengurus-<id>`; Dewan Eksekutif = pengurus pusat setelah yang pertama.
12. Program: chip kategori = tautan `?kategori=`; `<select>` desain dipecah
    `urut` + `status`; tombol "Terapkan" (`KELAS_TOMBOL.ringkas`); tautan
    kartu `#program-<slug>`; paginasi diport dari `code.html` program (bukan
    `Paginasi.js`, markup berbeda); perHalaman 9.
13. Galeri: dua `<input type="date">` (`dari`, `sampai`) di kotak rentang
    tanggal; slot masonry: kartu 1 kelas besar, sisanya kelas kartu kecil;
    "Muat Lebih Banyak" = tautan `?halaman=` (tanpa JS); lencana via
    `varianLencanaGaleri`; perHalaman 6; satu kelas di luar ZIP
    `[&::-webkit-calendar-picker-indicator]:opacity-0` pada input `sampai`.
14. `ambilKasusBerjalanPublik()` — kolom identitas tidak pernah di-SELECT.
15. Uji Lighthouse memakai `npx lighthouse@12` (cache npx, bukan dependensi
    proyek, bukan pemasangan global); tangkapan layar Chrome headless.

## 8. Sengaja belum dikerjakan

Kontak & formulir pengaduan (Tahap 6), berita & detail artikel (Tahap 5 — tautan
`/berita*` sudah dipasang), halaman `/lacak` (Tahap 6), route handler unggahan
(Tahap 5/6, temuan Tahap 3), halaman `/uji-desain` dihapus di Tahap 9,
subset font (menunggu pemilik).

## 9. Keluaran `uji-kesetiaan.mjs` per halaman + alasan kelas hilang

Keluaran lengkap: `a-kesetiaan-{beranda,tentang,struktur,program,galeri}.txt`
(dev) dan `a-kesetiaan-produksi-semua.txt` (build produksi, angka identik).
Alasan mengacu REFERENSI 18.2 (a–f) / 18.3 (kanonik):

**Beranda (7 hilang):** `bg-secondary-container/30`, `bg-surface-variant`,
`w-1.5`, `h-1.5`, `bg-outline` → mini-lencana Status Advokasi diganti
`Lencana status` (TAHAP-04 §2, 18.2d); `hover:text-primary`, `md:gap-0` →
navbar varian beranda (18.3). Teks hilang 5: 2 judul artikel contoh (18.2d,
dinamis), 3 teks berisi nama ikon (`arrow_forward`, `campaign`, `menu_book`
— 18.2a; teks tombolnya ada).

**Tentang (18 hilang):** `flex-wrap`, `justify-center`, `md:mb-0`,
`hover:text-secondary-fixed`, `w-auto`, `rounded`, `hover:bg-secondary-fixed`,
`bg-secondary-fixed-dim`, `text-on-secondary-fixed-variant`,
`px-margin-desktop`, `max-w-md`, `italic`, `bottom-0`,
`border-outline-variant/30`, `py-4`, `text-surface-variant/80` → navbar/footer
varian layar (18.3); `bg-surface-variant`, `bg-secondary-fixed-dim`/
`text-on-secondary-fixed-variant` (bulatan ikon item ke-3/4) → `.map()` kelas
item pertama (18.2e); `antialiased` → kelas `<body>` (layout akar). Teks hilang 0.

**Struktur (16 hilang):** semuanya header/footer/body varian layar (18.3):
`antialiased`, `bg-primary-container`, `pl-10`, `pr-4`, `placeholder:*`,
`focus:*-secondary-fixed-dim`, `hover:bg-tertiary-container`, `flex-wrap`,
`justify-center`, `md:gap-8`, `md:mb-0`, `bottom-0`, `opacity-60`,
`px-margin-desktop`. Teks hilang 2: nama pengurus contoh (18.2d), "Profil
arrow_forward" (18.2a).

**Program (33 hilang):** 26 navbar/footer/body varian (18.3): `antialiased`,
`bg-primary-container`, `bottom-0`, `flex-1`, `focus:border-secondary-fixed-dim`,
`hide-scrollbar`, `hover:bg-secondary-fixed-dim`, `justify-start`, `md:gap-8`,
`md:justify-center`, `md:justify-end`, `md:mb-0`, `md:pb-0`, `md:px-0`,
`min-w-max`, `opacity-70`, `overflow-x-auto`, `pb-2`, `pl-10`,
`placeholder-on-primary-container`, `pointer-events-none`, `pr-4`, `px-2`,
`text-on-primary-container`, `text-on-secondary-fixed`, `text-secondary`;
7 paginasi yang hanya tampil bila > 1 halaman (18.2d/e): `border-primary`,
`disabled:opacity-50`, `h-10`, `w-10`, `justify-center`, `mt-12`, `p-2` —
terbukti muncul di `a-kesetiaan-program-paginasi.txt`. Teks hilang 3: dua
teks tombol + nama ikon (18.2a), "Tautan Penting" = judul kolom footer varian
(kanonik "Tautan Cepat").

**Galeri (12 hilang):** `flex-wrap`, `p-2`, `px-margin-desktop`, `max-w-sm`,
`mb-8`, `md:mb-0`, `md:gap-8`, `mt-auto` → navbar/footer varian (18.3);
`mt-12`, `hover:border-primary`, `px-8`, `py-3` → tombol "Muat Lebih Banyak"
disembunyikan di halaman terakhir (18.2d; markup ada). Teks hilang 2: "Muat
Lebih Banyak" (sama), "filter_list Terapkan Filter" (18.2a).

## 10. Cara menguji ulang

```powershell
cd D:\Deploy\LSM
npm run build; $env:NODE_ENV="production"; Start-Process node server.js
node paket-pendukung/UJI/uji-kesetiaan.mjs desain/stitch_portal_berita_inklusif/beranda_warkop_nusantara/code.html http://localhost:3000/ --teks
node paket-pendukung/UJI/uji-kesetiaan.mjs desain/stitch_portal_berita_inklusif/galeri_dokumentasi/code.html http://localhost:3000/galeri --teks
curl.exe -s http://localhost:3000/ | Select-String "nama_pelapor|nik_pelapor"      # harus kosong
bash laporan/bukti-tahap-04/skrip/uji-l-keadaan-kosong.sh                          # dev server
npx lighthouse@12 http://localhost:3000/ --view
```

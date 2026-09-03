# LAPORAN TAHAP 05 — MODUL BERITA

Tanggal: 3–4 September 2026 (23:20 – 00:05 WIB) · Mode: OTONOM · Bukti:
`laporan/bukti-tahap-05/` (uji API b–g, alur penuh a, kesetiaan i, tangkapan j,
Lighthouse k, l–o).

## Ringkasan — bacalah ini dulu

Kanal berita selesai dua sisi. **Publik**: `/berita` (sorotan, grid, filter
kategori, pencarian judul+isi, rentang waktu, paginasi, "Paling Banyak Dibaca")
dan `/berita/[slug]` (detail dengan hierarki tipografi, byline, tag, artikel
terkait, bagikan, `jumlah_dibaca` tanpa bot, metadata + JSON-LD). **Staf**:
sidebar kanonik + kerangka ruang staf, `/staf/artikel` (tabel berperan,
pencarian, filter, hapus dengan dialog), editor `/staf/artikel/baru` dan
`/staf/artikel/[id]` (teks kaya, unggah gambar, tag, Terbitkan hanya
redaktur/superadmin). **Keamanan**: isi disanitasi di server sebelum disimpan
(daftar putih DOMPurify), unggahan diverifikasi magic bytes + dikompres sharp +
nama acak + disajikan route handler tanpa eksekusi, slug unik & beku setelah
terbit, kategori wajib, `terbit_pada` WIB, audit setiap aksi. Seluruh uji
peran lewat curl = 403 sesuai matriks; XSS bersih di DB dan di render; cacat
export 0 pada kelima layar. Lighthouse Accessibility/SEO ≥ 90; Performance
masih di bawah 90 karena sebab yang sama dengan Tahap 4 (font, menunggu
keputusan pemilik).

## 1. Halaman, komponen, dan route API yang dibuat

| Kelompok | Berkas |
|---|---|
| Publik | `app/(publik)/berita/page.js`, `app/(publik)/berita/[slug]/page.js`, `components/publik/TombolBagikan.js`, `lib/bot.js` |
| Staf | `app/(staf)/staf/layout.js` (kerangka), `components/staf/KerangkaStaf.js`, `components/staf/SidebarStaf.js` (sidebar kanonik 18.3), `app/(staf)/staf/artikel/page.js`, `components/staf/AksiArtikel.js`, `app/(staf)/staf/artikel/baru/page.js`, `app/(staf)/staf/artikel/[id]/page.js`, `components/staf/EditorArtikel.js` |
| Keamanan isi & unggahan | `lib/sanitasi.js` (DOMPurify server), `lib/validasi/artikel.js`, `lib/unggahan.js` (magic bytes, sharp, nama acak, jalur aman), `app/unggahan/[...jalur]/route.js` (penyaji unggahan — temuan Tahap 3) |
| Route API | `GET /api/artikel`, `GET /api/artikel/[slug]`, `GET+POST /api/staf/artikel`, `GET+PATCH+DELETE /api/staf/artikel/[id]`, `POST /api/staf/artikel/[id]/terbitkan`, `POST /api/staf/unggah` — semua staf lewat `denganPeran(HAK.*)`; `bacaJson` ditambah di `lib/auth/penjaga.js` |
| Data | `lib/db/artikel.js`: pencarian judul+ringkasan+isi, `ambilArtikelPalingDibaca`, pencarian staf judul/penulis, slug beku setelah terbit, parameter `rentang` (30/90 hari/tahun ini); `lib/utils.js` `buatSlug` → paket `slugify` |
| Dihapus | `.gitkeep` di folder-folder di atas |

**`package.json` berubah**: `slugify ^1.6.9`, `isomorphic-dompurify ^3.19.0`
(keduanya dalam daftar yang diizinkan CLAUDE.md aturan 4).

## 2. Tabel hasil uji peran (butir b) — `b-c-d-e-f-g-api.txt`

| Uji (curl, tanpa UI) | Harapan | Hasil |
|---|---|---|
| `penulis` POST `/api/staf/artikel/[id]/terbitkan` (miliknya) | 403 | **403** `TIDAK_BERHAK` |
| `penulis` PATCH artikel milik orang lain (id 41) | 403 | **403** `BUKAN_MILIK` |
| `penulis` DELETE artikel miliknya / orang lain | 403 | **403 / 403** |
| `verifikator` GET `/api/staf/artikel` | 403 | **403** |
| `verifikator` POST `/api/staf/artikel` | 403 | **403** |
| `pimpinan_wilayah` POST `/api/staf/artikel` | 403 | **403** |
| `pimpinan_wilayah` PATCH `/api/staf/artikel/41` | 403 | **403** |
| `pimpinan_wilayah` (wil 3) GET daftar | wilayah lain tidak ada | **total 0** (seed tak punya artikel wil 3; artikel wil 12/13/14 tidak muncul); akun uji wil 13 → 3 baris = persis `wilayah_id=13` |
| `pimpinan_wilayah` GET `/api/staf/artikel/41` (wil 13) | tidak terlihat | **404** (keberadaan tidak bocor) |
| `penulis` GET daftar | hanya miliknya | **7 baris, semua `penulis_id=2`** |
| tanpa cookie POST; cookie kosong + `x-user-role: superadmin` palsu | 401 | **401 / 401** |
| halaman: penulis buka editor artikel orang lain; verifikator buka `/staf/artikel`; pimpinan_wilayah `/baru` | 403 | **307 → /tanpa-akses** (`a-editor-akses-peran.txt`, `a-kelola-artikel-peran.txt`) |

## 3. Hasil uji XSS (butir c)

Muatan dikirim lewat API langsung (PATCH oleh `penulis`):
`<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`,
`<a href="javascript:alert(1)">`, `<p onclick style>`, `<iframe>`, `<svg onload>`.

**Isi tersimpan di DB** (SELECT `isi`):
```
<h2>Judul aman</h2><p>Teks aman</p><img alt=""><a>tautan</a><p>para</p><a href="https://contoh.id/aman" target="_blank" rel="noopener noreferrer">aman</a><img src="/penampung/artikel-1.jpg" alt="ok">
```
Sisa `<script`/`onerror`/`javascript:`/`onclick`/`<iframe`/`<svg`/`onload`/
`style=` = **NIHIL** — bersih sebelum disimpan, bukan hanya saat ditampilkan.
Halaman detail hasil alur penuh (`a-alur-penuh.txt` langkah 5): `<script>alert`
0, `onerror=` 0, `javascript:` 0, sedangkan `<h2>` dan `<blockquote>` yang sah
tetap ada.

## 4. Hasil uji unggahan (butir d)

| Uji | Harapan | Hasil |
|---|---|---|
| `.php` diganti nama `.jpg` (Content-Type image/jpeg) | ditolak magic bytes | **415** `TIPE_TIDAK_SAH` |
| 6 MB (batas gambar 5 MB) | ditolak, pesan jelas | **413** "Ukuran berkas melebihi batas 5 MB" |
| nama `../../evil.jpg` (JPG asli) | nama acak, tidak keluar folder | **201** → `/unggahan/artikel/706f08c3…388.jpg`, tersimpan di `UPLOAD_DIR/artikel/`, `-rw-r--r--` |
| `.svg` berisi script | ditolak | **415** |
| PNG dikirim dengan Content-Type `image/jpeg` | dikenali dari isi | **201** `.png` (magic bytes menang atas header) |
| `GET /unggahan/..%2F.env` | tidak bisa keluar folder | **404** |
| berkas tersaji | tanpa eksekusi | `200 image/jpeg`, `nosniff`, `Content-Disposition: inline` |
| verifikator / pimpinan_wilayah unggah | 201 / 403 | **201 / 403** |

## 5. Tangkapan layar perbandingan (butir i/j)

`tangkapan/berita-{375,768,1280}.png`, `detail-{375,768,1280}.png` (build
produksi), `a-4-berita-terbit.png`, `a-5-detail-terbit.png`,
`a-6-detail-arsip-404.png` (alur penuh). Dibandingkan dengan
`daftar_berita_investigasi/screen.png` dan `detail_artikel_investigasi/
screen.png` (703 px): susunan bagian, kartu, byline, tag, artikel terkait sama.
**Halaman staf tidak ada tangkapannya**: Chrome headless tanpa otomasi tidak
bisa membawa cookie login; buktinya adalah HTML render + uji kesetiaan
(`i-kesetiaan-produksi-semua.txt`).

## 6. Skor Lighthouse (butir k) — `k-lighthouse.md`

| Halaman | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/berita` | **78** (LCP 4,5 s, FCP 2,9 s, TBT 110 ms) | 98 (`heading-order`, verbatim desain) | 96 (prefetch `/kontak` 404 — Tahap 6) | 100 |
| `/berita/[slug]` | **73** (LCP 5,1 s, FCP 3,5 s, TBT 90 ms) | 100 | 96 | 100 |

Performance < 90 dengan penyebab yang sama seperti Tahap 4 (Fira Sans ±570 KB
tidak disubset, LCP menunggu font; menunggu keputusan pemilik). Accessibility
dan SEO ≥ 90 (syarat butir k selain Performance).

## 7. Hasil kelima belas butir UJI TAHAP 5

| Butir | Hasil | Bukti |
|---|---|---|
| a. Alur penuh | **LULUS** — draf (201, tidak ada di publik: 404/404) → sunting (200) → penulis terbitkan 403 → redaktur terbitkan 200 (`terbit_pada` terisi) → ada di `/api/artikel` & `/berita` → detail 200 → arsip → 404/404, hilang dari `/berita`; audit `artikel_buat/sunting/terbit/arsip` | `a-alur-penuh.txt`, `tangkapan/a-*.png` |
| b. Peran via curl | **LULUS** — tabel bagian 2 | `b-c-d-e-f-g-api.txt` |
| c. XSS | **LULUS** — bagian 3 | idem, `a-alur-penuh.txt` |
| d. Unggahan | **LULUS** — bagian 4 | idem |
| e. Slug | **LULUS** — judul sama → `…-tahap-5` dan `…-tahap-5-2`; ubah judul artikel terbit → slug tetap | idem |
| f. Kategori wajib | **LULUS** — POST tanpa `kategori_id` → 422 `KATEGORI_WAJIB` | idem |
| g. Zona waktu | **LULUS** — `terbit_pada` = WIB aplikasi (selisih 1 s), `@@session.time_zone +07:00` | idem |
| h. Jumlah dibaca | **LULUS** — 5× UA Mozilla: +5; 5× Googlebot, curl, UA kosong, WhatsApp: +0 | `h-jumlah-dibaca.txt` |
| i. Kesetiaan 5 layar | **LULUS** — cacat export 0/0/0/0/0 (build produksi); cakupan berita 94 %, detail 87 %, kelola 89 %, editor 91–92 %; alasan kelas hilang di bagian 9 | `a-kesetiaan-*.txt`, `i-kesetiaan-produksi-semua.txt` |
| j. Tiga lebar | **LULUS** — 6 tangkapan | `j-tangkapan-tiga-lebar.txt` |
| k. Lighthouse | **SEBAGIAN** — A11y/SEO lulus, Performance < 90 (bagian 6) | `k-lighthouse.md` |
| l. Nama ikon | **LULUS** — 0 di kelima render | `l-n-ikon-await.txt` |
| m. Keadaan kosong | **LULUS** — artikel dikosongkan (12→0): `/berita` 200 + KeadaanKosong "Belum ada berita", `/berita?q=x` "Tidak ada berita yang cocok", `/` "Belum ada sorotan investigasi", `/staf/artikel` "Belum ada artikel", 0 galat; seed dipulihkan | `m-keadaan-kosong.txt` |
| n. `await` | **LULUS** — 0 pembacaan sinkron | `l-n-ikon-await.txt` |
| o. Build hijau | **LULUS** — build + lint exit 0 (5 peringatan Turbopack "dynamic filesystem access" dari `lib/unggahan.js` — wajar untuk `UPLOAD_DIR` dinamis, tidak memakai standalone) | `o-build-hijau.txt` |

## 8. KEPUTUSAN BARU

1. **Daftar putih HTML** (`lib/sanitasi.js`): tag `p br strong b em i u s sub
   sup h1–h4 blockquote ul ol li a img figure figcaption hr pre code table
   thead tbody tr th td`; atribut `href src alt title target rel width height
   colspan rowspan start`; skema `http(s)/mailto/tel` + jalur relatif; tag
   `script style iframe object embed form input svg math link meta base`
   dilarang; atribut `style class id on* srcset formaction` dilarang. Tautan
   luar dipaksa `target=_blank rel=noopener noreferrer`; `img` hanya jalur
   lokal atau `https`. Alasan: persis kemampuan toolbar editor desain +
   struktur artikel; `svg/math` = vektor XSS; `class/style` tampilan
   ditentukan komponen render.
2. **Membedakan bot** (`lib/bot.js`): regex User-Agent
   `(bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|lighthouse|headless|curl|wget|python-requests|Go-http-client)`,
   UA kosong = bot. Murah dan tanpa cookie; batasan jujur: bot yang memalsukan
   UA peramban ikut terhitung. Kenaikan dibungkus try/catch.
3. **Bentrok slug**: `slugify` (`lower, strict, locale id`) + `slugUnik()` di
   `lib/db` menambah `-2, -3, …`; slug mengikuti judul hanya selama
   `terbit_pada` NULL, setelah terbit dibekukan (SELECT … FOR UPDATE).
4. **Unggahan**: gambar dibatasi 5 MB (teks desain) walau `UPLOAD_MAX_MB`
   20; selalu dikompres ulang sharp (metadata dibuang, lebar maks 1920);
   nama = 16 byte acak; disajikan `app/unggahan/[...jalur]/route.js` dari
   `UPLOAD_DIR` (bukan `public/` — temuan Tahap 3), cache immutable, nosniff.
   Magic bytes PDF/MP4 disiapkan untuk lampiran Tahap 6.
5. **Kerangka staf**: `h-screen` (=100vh) desain → `h-dvh`; di bawah `md`
   sidebar menjadi laci + bilah atas hamburger; tombol aksi utama sidebar
   bergantung peran ("Tulis Artikel Baru" / "Proses Pengaduan" / tidak ada);
   avatar → logo; "Keluar" = POST logout. Item "Pengaturan" hanya superadmin
   (menu dari `navItems`).
6. **PATCH status**: `{status:'arsip'|'draf'}` (redaktur/superadmin) untuk
   arsip/kembalikan draf; menerbitkan hanya lewat `/terbitkan`. Artikel yang
   tidak terjangkau peran → 404 (bukan 403) agar keberadaannya tidak bocor;
   penulis bukan pemilik → 403 `BUKAN_MILIK`.
7. **Editor**: `contentEditable` + `execCommand` (tanpa paket editor; sanitasi
   di server); ringkasan diturunkan server dari isi; toggle Draf/Publik hanya
   indikator; tanggal terbit & penulis baca-saja (ditentukan server); pratinjau
   gambar utama; tag Enter/koma; pesan sukses lewat `?tersimpan=1|terbit=1`.
8. **Daftar berita**: komposisi dua layar (daftar + sorotan/aside dari portal),
   sorotan = artikel pertama tampilan bawaan, `PER_HALAMAN=6`, filter rentang
   waktu difungsikan, sub-nav sticky portal tidak dipakai.
9. **Detail**: hierarki tipografi isi editor lewat selector turunan `[&_h2]:…`
   dengan kelas elemen setara desain; paragraf pertama `drop-cap`; foto
   penulis → logo; baris kedua byline = wilayah | tanggal; lencana gambar =
   kategori; tag → tautan `/berita?q=`; bagikan = Web Share / WhatsApp,
   salin tautan.
10. **Kelola artikel**: label lencana desain "Published"/"Draft"
    dipertahankan + "Arsip"; `Tabel.js` tidak dipakai (markup verbatim
    lebih setia); paginasi kaki tabel kelas desain; zebra baris ke-2 tidak
    direplikasi (18.2e).
11. Bug ditemukan & diperbaiki agen: `ambilArtikelPalingDibaca` `'terbit'`
    tanpa kutip (ditulis induk, galat SQL) — diperbaiki sebelum dipakai.

## 9. Keluaran `uji-kesetiaan.mjs` dan alasan kelas hilang

Lengkap di `a-kesetiaan-{berita,detail,kelola-artikel,editor}.txt` (dev) dan
`i-kesetiaan-produksi-semua.txt` (produksi, angka sama). Ringkasan alasan:

- **Berita (10)**: `antialiased`, `light` (body/html), `px-margin-desktop`,
  `text-secondary`, `max-w-sm` (header/footer varian) → 18.3;
  `bg-surface-variant`, `bg-primary-container`, `text-on-primary-container`,
  `border-primary-fixed-dim` (lencana kartu ke-2/3) → `.map()` kelas kartu
  pertama (18.2e); `mx-1` (elipsis paginasi > 7 halaman). Teks: judul contoh
  & opsi kategori contoh → data DB (18.2d).
- **Detail (21)**: `antialiased`, `bg-white/10`, `hover:bg-white/20`,
  `rounded`, `bottom-0`, `max-w-sm`, `px-margin-desktop` → navbar/footer
  varian; `mb-4`, `my-10`, `p-6`, `bg-surface-container-low`, `border-l-4`,
  `border-secondary`, `pl-6`, `z-10`, `top-2`, `left-2`, `text-4xl`,
  `text-outline-variant`, `opacity-30`, `text-right` → isi artikel datang dari
  editor (kelas dipakai sebagai selector turunan `[&_h2]:mb-4` dst.; ikon
  kutip dekoratif dan keterangan foto tidak ada di data) — 18.2d. Teks: tiga
  kartu terkait contoh → DB.
- **Kelola artikel (14)**: `flex-shrink-0 h-screen justify-center mb-1 mt-4
  mt-auto no pt-4 shadows space-y-2 z-10 ml-64` → sidebar kanonik / kerangka
  layout; `bg-surface-container-highest bg-opacity-20` → zebra baris ke-2
  (18.2e). Teks: item sidebar & nama ikon.
- **Editor (14–15)**: `bg-tertiary border-t h-screen leading-none mt-4 mt-auto
  pt-4 text-[18px] px-2 ml-64 light` → sidebar/kerangka; `bg-surface-variant`
  (chip ke-2), `bg-secondary-fixed-dim inline-flex py-1
  hover:text-on-error-container` (chip tag — artikel baru tanpa tag; ada di
  render artikel 47); `w-12 h-12 text-[24px]` (ikon unggah diganti pratinjau
  bila gambar sudah ada). Teks: opsi select contoh → DB, nama ikon bocor.

## 10. Cacat/temuan desain (dilaporkan)

Sidebar/`<main>` desain memakai `h-screen`/`min-h-screen` (100vh); avatar &
`href="#"` di sidebar; label Inggris ("Published", "Draft", "Share on
Facebook", judul toolbar); tag `<span cursor-pointer>` tanpa tautan; kolom
kanan editor `w-[320px]` tanpa breakpoint; satu `<select>` filter rentang di
daftar berita; `screen.png` detail hanya 703 px; sorotan/aside hanya ada di
`portal_berita_beranda` yang `screen.png`-nya rusak.

## 11. Sengaja belum dikerjakan

Dashboard staf sesungguhnya (Tahap 7), halaman kontak/pengaduan/lacak (Tahap
6), lampiran PDF/MP4 (Tahap 6 memakai `simpanLampiran`), subset font
(pemilik), tangkapan halaman staf lewat peramban (butuh otomasi login).

## 12. Cara menguji ulang

```powershell
cd D:\Deploy\LSM   # dev server: node server.js
bash laporan/bukti-tahap-05/skrip/uji-api-tahap-05.sh     # b c d e f g
bash laporan/bukti-tahap-05/skrip/uji-a-alur-penuh.sh      # a + c (render)
node paket-pendukung/UJI/uji-kesetiaan.mjs desain/stitch_portal_berita_inklusif/daftar_berita_investigasi/code.html http://localhost:3000/berita --teks
```

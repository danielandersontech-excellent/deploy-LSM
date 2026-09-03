# TAHAP 4 — SITUS PUBLIK

> **Sumber di repo ini:** `CLAUDE.md`, `dokumen/CETAK-BIRU-SISTEM.md`,
> `dokumen/REFERENSI.md`, `dokumen/ALUR-KERJA-CLAUDE-CODE.md`,
> `desain/stitch_portal_berita_inklusif/` (ekstrak `Warkop_Nusantara.zip`),
> `LSM_WARKOP.png`, `paket-pendukung/`
>
> **Bergantung pada:** Tahap 0–3
> **Rujukan cetak biru:** bagian 3, Pelajaran nomor 4, 5, 6, 12
> **Rujukan REFERENSI:** 1 (filosofi logo), 7 (token), 8 (peta layar),
> 9 (cacat export), 14 (aturan 4, 5, 12), **18 (protokol konversi — wajib)**
> **Layar:** `beranda_warkop_nusantara/`, `tentang_kami_warkop_nusantara/`,
> `struktur_organisasi/`, `program_kegiatan/`, `galeri_dokumentasi/`

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
- Bahasa Indonesia untuk komentar kode dan nama komponen domain.
- Tandai KEPUTUSAN BARU secara eksplisit.
- Bila menemukan cacat pada desain, laporkan. Jangan menambal diam-diam.
- Kerjakan LANGSUNG di repo ini. Keluaranmu adalah berkas yang sudah ada di
  tempatnya + laporan/LAPORAN-TAHAP-XX.md + satu commit git. Bukan ZIP.
- desain/ dan paket-pendukung/ adalah SUMBER BACA-SAJA — jangan pernah
  mengubah, memindah, atau menghapus isinya.
- Jangan git push, jangan menyentuh berkas di luar repo ini, jangan memasang
  perangkat global, tanpa diminta pemilik.
```

---

## SIFAT PEKERJAAN INI

Ini pekerjaan **konversi**, bukan desain. Desainnya sudah final.

**Cara kerjanya sudah ditetapkan di REFERENSI bagian 18 (Protokol Konversi
Layar). Baca itu dulu, seluruhnya.** Ringkasnya: untuk setiap halaman, ekstrak
dan baca `code.html`-nya utuh, lihat `screen.png`-nya, salin DOM dan kelas
Tailwind apa adanya, ganti hanya enam hal yang diizinkan (ikon → `<Ikon />`,
gambar → lokal/DB, `href="#"` → rute, teks dinamis → DB, elemen berulang →
`.map()`, sintaks JSX), pakai navbar/footer kanonik dari 18.3, lalu buktikan
dengan `uji-kesetiaan.mjs`. Deskripsi layar di bawah ini hanya ringkasan —
**`code.html` yang menang**.

Godaan terbesar di tahap ini adalah "memperbaiki" desain — menggeser jarak,
mengganti warna yang terasa kurang pas, menambah animasi. **Jangan.** Bila
menemukan sesuatu yang benar-benar salah (bukan selera), laporkan sebagai
temuan, jangan diubah diam-diam.

---

## BACA DULU: CACAT EXPORT

Delapan cacat nyata. Rinciannya di **REFERENSI bagian 9**. Ringkasnya:

1. **`tentang_kami/` salah merek — ABAIKAN.** Yang benar
   `tentang_kami_warkop_nusantara/`.
2. **`daftar_berita/` dan `detail_artikel/` juga iterasi lama.** Yang dipakai
   adalah versi `_investigasi`.
3. **Tiga `screen.png` rusak** (`portal_berita_beranda/`, `program_kegiatan/`,
   `tentang_kami_warkop_nusantara/`) — berisi teks, bukan gambar. Pakai
   `code.html`.
4. **Nama ikon Material bocor sebagai teks** — seluruhnya menjadi
   `<Ikon nama="..." />` dari `components/ui/Ikon.js` (Tahap 0).
5. **Gambar menunjuk googleusercontent** — ganti dengan berkas lokal atau data
   dari basis data.
6. **CDN Tailwind** — hanya pratinjau; Tailwind + plugin `forms` sudah jadi
   dependensi build.
7. **Navbar dan footer berbeda di tiap layar** — pakai yang kanonik
   (REFERENSI 18.3), bukan yang ada di layar masing-masing.
8. **`font-label-sm` tidak didefinisikan** — abaikan.

---

## PEKERJAAN

### 1. Komponen bersama — buat lebih dulu

**`components/publik/HeaderPublik.js`** dan **`FooterPublik.js`**
Markup **verbatim** ada di **REFERENSI 18.3** (navbar = header
`kontak_pengaduan_warkop_nusantara_updated_logo` + kotak cari beranda; footer =
footer beranda dengan logo segel `h-12`). Port keduanya persis dari markup itu,
berikut aturan turunannya (tautan aktif, kotak cari → `/berita?q=`, "Masuk
Staff" → `STAF_HOST`, laci hamburger di bawah `md`, email/hotline dari
`pengaturan`). Navbar/footer **tidak** diambil dari layar masing-masing —
mereka berbeda-beda di export (cacat 7).

**Halaman teks statis** (`/kebijakan-privasi`, `/pedoman-komunitas`, `/faq`)
yang dirujuk footer: buat di tahap ini sesuai REFERENSI 18.3 (isi dari
`pengaturan`, cetakan `detail_artikel_investigasi`).

**`components/ui/`** — `Tombol`, `Kartu`, `Lencana`, `Input`, `Select`,
`Paginasi`, `KeadaanKosong`, `Dialog`, `Tabel`, `Pemuat`.

Bangun ini sungguh-sungguh — Tahap 5, 6, dan 7 memakainya terus. Komponen yang
dirancang asal akan menular ke seluruh sistem.

**`hooks/useViewportTinggi.js`** — pengganti `100vh`. Ukur dengan
`window.visualViewport`, pasang dalam piksel, ukur ulang saat layar berputar
(aturan 5).

### 2. Beranda — `app/(publik)/page.js`

Ikuti `beranda_warkop_nusantara/screen.png`, dari atas:

**Hero** — lencana "Pengawasan Sipil Independen" dengan ikon perisai. Judul tiga
baris: "Wadah Aspirasi Rakyat," (gelap) / "Kontrol, Observasi dan" (emas) /
"Pengawasan Nusantara" (emas), Domine `headline-xl`. Motto
`"Berani Karena Benar."` dengan garis vertikal emas di kirinya. Paragraf
pembuka. Dua tombol: "Sampaikan Pengaduan" (cokelat tua), "Pelajari Prosedur"
(garis tepi). Watermark peta Nusantara samar di latar.

**Pita statistik** — latar `#271310`, tiga kolom:
```
12,000+  LAPORAN DITANGANI
38       PROVINSI TERCOVER
15       TAHUN MENGAWASI
```
Angka besar emas, label huruf besar kecil, keterangan di bawahnya.

**Sorotan Investigasi** — judul + keterangan + "Lihat Semua Berita →". Kartu
besar di kiri (gambar, lencana "Investigasi Khusus" merah, tanggal, lokasi,
judul, ringkasan, penulis). Kartu kecil kanan atas (lencana "Pelayanan Publik",
"Baca Selengkapnya →"). **Kartu "Status Advokasi"** kanan bawah: daftar kasus
berjalan dengan nomor kasus, kategori, judul, lencana status berwarna, tombol
"Pantau Semua Kasus".

**Yang dinamis dari basis data** — tiga bagian berikut. Teks lainnya (lencana
"Pengawasan Sipil Independen", judul tiga baris, motto, paragraf pembuka, label
tombol, judul bagian dan keterangannya) **disalin verbatim dari `code.html`**
— bukan dipaku secara sembarangan, tetapi juga bukan dipindah ke `pengaturan`:

| Bagian | Sumber |
|---|---|
| Tiga angka statistik + label + keterangannya | tabel `pengaturan` |
| Sorotan Investigasi (kartu besar + kartu kecil) | `artikel` status `terbit`, terbaru |
| Status Advokasi | `pengaduan` yang sedang berjalan (`diverifikasi`/`diproses`) |

Lencana status di Status Advokasi memakai `components/ui/Lencana.js`
(REFERENSI 10) — teks contoh "Sedang Berjalan"/"Menunggu Mediasi" di desain
digantikan label status sesungguhnya.

**Aturan mutlak Status Advokasi:** tampilkan **hanya** nomor kasus, kategori,
wilayah, status. **Tidak pernah** identitas pelapor. Ini halaman publik
(aturan 13).

### 3. Tentang Kami — `app/(publik)/tentang/page.js`

`screen.png` rusak — pakai `code.html`.

**Wajib memuat kesembilan unsur filosofi logo** dari REFERENSI bagian 1. Ini
halaman paling khas organisasi ini.

Susunan yang disarankan: judul + pengantar; **akronim WARKOP** dijabarkan
secara visual (bukan daftar biasa); **filosofi logo** kesembilan unsur dengan
ilustrasi/ikon — pertimbangkan menampilkan logo asli dengan penanda ke tiap
unsurnya; Visi dan Misi dari tabel `pengaturan`; motto beserta maknanya.

### 4. Struktur Organisasi — `app/(publik)/struktur/page.js`

Ikuti `struktur_organisasi/screen.png`: kartu **Pimpinan Pusat** di tengah
(lencana emas, foto bulat berbingkai emas, nama Domine, jabatan emas huruf
besar kecil, deskripsi), garis penghubung vertikal, kartu **Dewan Eksekutif**,
lalu bagian **"Pimpinan Regional"** dengan tombol filter dan tampilan peta di
kanan, grid kartu (foto kecil, nama, jabatan, lencana wilayah, "Aktif sejak
YYYY", "Profil →").

Data dari `pengurus`, diurutkan menurut kolom `urutan`.

### 5. Program & Kegiatan — `app/(publik)/program/page.js`

`screen.png` rusak — pakai `code.html`. Grid kartu dengan lencana status
(Berjalan/Selesai), filter kategori (Pengawasan Dana / Observasi Kebijakan /
Bantuan Hukum dari `lib/kategoriProgram.js`, REFERENSI 10), urutan
Terbaru/Terlama, paginasi. Filter mengubah URL (`?kategori=`, `?status=`,
`?urut=`). Data dari `program`.

### 6. Galeri — `app/(publik)/galeri/page.js`

Ikuti `galeri_dokumentasi/screen.png`: judul "Dokumentasi & Arsip Visual",
panel filter (Kategori Kegiatan, Rentang Tanggal, tombol "Terapkan Filter"
cokelat tua), grid **masonry** tidak beraturan (satu kartu besar kiri, dua
sedang kanan, tiga di baris bawah). Tiap kartu: gambar, lencana kategori (emas
"Audiensi Publik", merah "Investigasi Lapangan", abu "Sosialisasi"), judul,
tanggal, lokasi. Kartu video punya tombol putar bulat emas. Tombol "Muat Lebih
Banyak".

### 7. Halaman sistem

`app/not-found.js`, `app/error.js` (sesuai identitas visual, bukan bawaan
Next.js), `app/sitemap.js`, `app/robots.js`.

---

## NEXT.JS 16 — YANG BERBEDA DI TAHAP INI

Halaman berparameter dan yang membaca query wajib `await`:

```js
export default async function Halaman({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  ...
}
```

Di Next.js 15 pembacaan sinkron hanya memberi peringatan; di 16 **tidak
berfungsi lagi** (aturan 12).

---

## RESPONSIF, SEO, AKSESIBILITAS

**Wajib diuji pada 375px, 768px, 1280px.** Header menjadi laci geser di layar
kecil. Tipografi memakai `headline-lg-mobile` (28px) menggantikan
`headline-lg` (32px).

**Jangan `100vh`** — pakai `hooks/useViewportTinggi.js`.

Metadata per halaman, open-graph memakai logo, `lang="id"`, JSON-LD untuk
organisasi.

**Kontras wajib lulus WCAG AA.** Perhatikan kombinasi berisiko: emas `#e9c349`
di atas cokelat `#271310`, dan teks abu `#504442` di atas krem `#faf9f5`.
Ukur, jangan mengira-ngira.

Seluruh gambar ber-`alt` bermakna (bukan "gambar" atau nama berkas), seluruh
input ber-`label`, navigasi keyboard berfungsi dengan fokus terlihat, sediakan
lewati-ke-konten.

---

## LARANGAN KERAS

| Larangan | Sumber |
|---|---|
| Mengubah warna, jarak, atau tipografi dari desain | REFERENSI bagian 7 |
| `!important` | Aturan 4 |
| `100vh` | Aturan 5 |
| Menampilkan nama ikon sebagai teks | Cacat export 4 |
| Memakai folder `tentang_kami/` yang salah merek | Cacat export 1 |
| Menampilkan identitas pelapor di halaman publik | Aturan 13 |
| Memaku angka statistik di kode | Harus dari `pengaturan` |
| `params`/`searchParams` tanpa `await` | Aturan 12 |

---

## UJI TAHAP 4

**a. UJI KESETIAAN — wajib per halaman.** Jalankan
`paket-pendukung/UJI/uji-kesetiaan.mjs` untuk setiap halaman terhadap
`code.html` layarnya (REFERENSI 18.5). Lampirkan keluaran lengkapnya per
halaman. Sisa cacat export **nol**. Untuk setiap kelas yang hilang, tulis
alasannya (salah satu dari enam perubahan 18.2 atau komponen kanonik 18.3).
Kelas hilang tanpa alasan = belum selesai.

**a2. Perbandingan visual** — bila peramban tersedia, setiap halaman
disandingkan dengan `screen.png` pada lebar yang sama dengan `screen.png`. Untuk
tiga halaman yang `screen.png`-nya rusak, bandingkan dengan hasil render
`code.html` (buka `code.html` langsung di peramban — CDN-nya masih berfungsi
untuk pratinjau). Bila peramban tidak tersedia, katakan begitu.

**b. Tiga lebar layar** — 375px, 768px, 1280px per halaman.

**c. Lighthouse** — beranda, struktur, galeri. Performance ≥ 90,
Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90. Bila ada yang di bawah,
jelaskan penyebab dan perbaiki.

**d. Nama ikon** — telusuri keluaran render untuk `edit_document`, `gavel`,
`settings`, `logout`, `dashboard`. Harus **nihil**.

**e. Larangan CSS** — telusuri `!important` dan `100vh`. Nihil.

**f. Tanpa JavaScript** — matikan JS, konten utama seluruh halaman tetap
terbaca.

**g. Kontras WCAG** — ukur seluruh kombinasi teks/latar. Lampirkan tabel. ≥
4.5:1 untuk teks biasa, ≥ 3:1 untuk teks besar.

**h. Navigasi keyboard** — telusuri seluruh halaman hanya dengan Tab dan Enter.
Fokus selalu terlihat, tidak ada jebakan fokus.

**i. Isi dinamis** — ubah nilai di `pengaturan` → angka statistik beranda ikut
berubah tanpa deploy.

**j. UJI KEBOCORAN IDENTITAS** — periksa **HTML mentah** beranda (View Source,
bukan tampilannya). Tidak ada identitas pelapor di Status Advokasi.

**k. Font** — Domine dan Fira Sans lewat `next/font`, bukan
fonts.googleapis.com.

**l. Keadaan kosong** — kosongkan `artikel`, `pengurus`, `galeri`, `program` →
setiap halaman menampilkan keadaan kosong yang rapi, bukan galat.

**m. `await` lengkap** — telusuri `params`/`searchParams` tanpa `await`. Nihil.

**n. Build hijau** — `npm run build` dan `npm run lint` berhasil.

---

## BENTUK KELUARAN (Claude Code)

Kerjakan **langsung di repo ini** — tidak ada paket perubahan, tidak ada
apply.ps1. Di akhir tahap:

1. Seluruh berkas tahap ini sudah ada di tempatnya dan `npm run build` hijau.
2. Tulis `laporan/LAPORAN-TAHAP-04.md` (isi sesuai bagian LAPORAN di bawah).
   Bukti uji (keluaran curl, keluaran uji-kesetiaan, tangkapan bila ada) masuk
   `laporan/bukti-tahap-04/` dan dirujuk dari laporan.
3. `git add -A` lalu `git commit -m "Tahap 04: <ringkasan satu baris>"`.
   Jangan push tanpa diminta pemilik.
4. MODE GERBANG: berhenti, tunggu pemilik memeriksa laporan. MODE OTONOM:
   verifikasi gerbang-mandiri (ALUR bagian 7.2), perbarui laporan/STATUS.md,
   lalu langsung lanjut tahap berikutnya.

## LAPORAN — isi `laporan/LAPORAN-TAHAP-04.md`

1. Daftar halaman dan komponen yang dibuat
2. **Tangkapan layar perbandingan berdampingan (butir a)** untuk setiap halaman
3. **Skor Lighthouse (butir c)**
4. **Tabel kontras WCAG (butir g)**
5. Hasil keempat belas butir UJI TAHAP
6. Cacat export yang ditemukan dan cara memperbaikinya
7. **KEPUTUSAN BARU**: penggantian ikon yang dipilih, penanganan bagian desain
   yang tidak jelas dari `code.html`
8. Hal yang sengaja belum dikerjakan (kontak → Tahap 6, berita → Tahap 5)
9. **Keluaran `uji-kesetiaan.mjs` per halaman (butir a)** beserta alasan tiap
   kelas yang hilang

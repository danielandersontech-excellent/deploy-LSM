# TAHAP 5 — MODUL BERITA

> **Sumber di repo ini:** `CLAUDE.md`, `dokumen/CETAK-BIRU-SISTEM.md`,
> `dokumen/REFERENSI.md`, `dokumen/ALUR-KERJA-CLAUDE-CODE.md`,
> `desain/stitch_portal_berita_inklusif/` (ekstrak `Warkop_Nusantara.zip`),
> `LSM_WARKOP.png`, `paket-pendukung/`
>
> **Bergantung pada:** Tahap 0–4
> **Rujukan cetak biru:** bagian 3, 8, Pelajaran nomor 1, 3, 7
> **Rujukan REFERENSI:** 10 (tabel artikel), 11 (peran), 12 (route), 14,
> **18 (protokol konversi — wajib untuk kelima layar)**
> **Layar:** `daftar_berita_investigasi/`, `detail_artikel_investigasi/`,
> `portal_berita_beranda/`, `kelola_artikel_admin/`, `editor_artikel_admin/`

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

Kanal berita dan investigasi — sisi publik untuk pembaca, sisi staf untuk
redaksi.

Dua hal menentukan mutu tahap ini:

**Keamanan isi artikel.** Editor teks kaya menerima HTML dari pengguna. Tanpa
sanitasi di sisi server, ini pintu masuk XSS paling lebar di seluruh sistem.

**Penegakan peran yang halus.** `penulis` boleh menyunting artikel, tetapi
hanya miliknya sendiri, dan tidak boleh menerbitkan. Aturan seperti ini mudah
benar di UI tetapi bocor di route API — persis Pelajaran nomor 3.

---

## PEKERJAAN

Untuk kelima layar: **PROTOKOL KONVERSI LAYAR (REFERENSI 18)** — baca
`code.html` utuh, salin DOM dan kelas apa adanya, enam perubahan saja,
navbar/footer/sidebar kanonik, `uji-kesetiaan.mjs` per halaman. Deskripsi di
bawah adalah ringkasan, bukan pengganti `code.html`.

### 1. Daftar berita — `app/(publik)/berita/page.js`

Ikuti `daftar_berita_investigasi/` dan `portal_berita_beranda/`:

- **Sorotan utama** (artikel terbaru, kartu besar)
- **Grid artikel**: gambar, lencana kategori, tanggal, judul, ringkasan
- **Filter kategori**: Investigasi, Siaran Pers, Opini Publik, Kegiatan Daerah,
  Fasilitas Umum
- **Pencarian** judul dan isi
- **Paginasi**
- **Modul "Paling Banyak Dibaca"** di sisi kanan

Filter dan pencarian mengubah URL (`/berita?kategori=investigasi`) agar bisa
dibagikan dan diindeks mesin pencari.

**Next.js 16:** `searchParams` wajib di-`await`.

### 2. Detail artikel — `app/(publik)/berita/[slug]/page.js`

Ikuti `detail_artikel_investigasi/`: gambar utama, lencana kategori, tanggal
terbit, lokasi/wilayah, judul (Domine `headline-xl`), **byline penulis** dengan
foto kecil, isi dengan hierarki tipografi jelas (H2, H3, paragraf, kutipan,
daftar, gambar sisipan), **artikel terkait**, tombol bagikan.

**`params` wajib di-`await`.**

Hitung `jumlah_dibaca`, tetapi jangan menaikkan angka untuk perayap/bot.
Jelaskan cara membedakannya.

### 3. Kelola artikel — `app/(staf)/staf/artikel/page.js`

Ikuti `kelola_artikel_admin/screen.png`:

- Judul "Kelola Artikel" + "Daftar publikasi dan laporan hasil investigasi
  warga."
- Tombol "Tulis Artikel Baru" (cokelat tua, kanan atas)
- Pencarian "Cari judul artikel atau penulis..."
- "Filter Status: Semua Status"
- **Tabel** dengan kepala berlatar `#271310` teks putih. Kolom: Judul Artikel,
  Kategori, Penulis, Tanggal Publikasi, Status, Aksi
- Lencana status: **Published** (emas `#fed65b`), **Draft** (abu)
- Kolom Aksi: ikon lihat, sunting, hapus — **SVG sungguhan**, bukan teks
- Kaki: "Menampilkan 1-3 dari 45 artikel" + paginasi

**Ingat cacat export 4:** pada `screen.png` layar ini, sidebar menampilkan
`edit_document` dan `gavel` sebagai teks. Ganti dengan SVG.

**Penyaringan menurut peran:** `penulis` hanya melihat artikel miliknya,
`pimpinan_wilayah` hanya wilayahnya dan baca-saja. Penyaringan **di SQL**.

### 4. Editor artikel — `app/(staf)/staf/artikel/[id]/page.js` dan `baru/page.js`

Ikuti `editor_artikel_admin/screen.png`:

**Kepala** — remah roti "Kelola Artikel › Editor Artikel", judul "Tulis Artikel
Baru" (Domine), tombol "Simpan Draf" (garis tepi) dan "Terbitkan" (cokelat tua).

**Kolom kiri** — input judul besar (placeholder "Masukkan Judul Artikel..."),
dua select "Kategori" dan "Wilayah", area unggah gambar utama (kotak bergaris
putus-putus, ikon gambar bulat, "Unggah Gambar Utama", "Format JPG, PNG, atau
WEBP. Maks 5MB."), toolbar teks kaya (B, I, U, H1, H2, kutipan, daftar tak
berurut, daftar berurut, tautan, sisip gambar), area tulis (placeholder "Mulai
menulis isi artikel di sini...").

**Kolom kanan** — panel "Pengaturan Publikasi" (tombol beralih Draf/Publik,
"Tanggal Publikasi" datetime, "Penulis (Opsional)"), panel "Label & Kata Kunci"
(chip tag emas dengan tombol hapus, input "Tambah tag..."), **kotak "Catatan
Verifikasi"** berlatar emas muda `#ffe088` dengan ikon perisai: "Artikel yang
diterbitkan akan masuk log pengawasan resmi Warkop Nusantara."

**Tombol "Terbitkan" hanya muncul dan hanya berfungsi untuk `redaktur` dan
`superadmin`.** Untuk `penulis`, tombolnya tidak ada — dan route API-nya tetap
menolak walau tombolnya dipaksa muncul.

### 5. Route API

Seluruhnya memanggil `requireRole`. Daftar di **REFERENSI bagian 12**.

| Metode | Route | Peran |
|---|---|---|
| GET | `/api/artikel` | publik, hanya `terbit` |
| GET | `/api/artikel/[slug]` | publik |
| GET | `/api/staf/artikel` | redaktur, penulis, superadmin, pimpinan_wilayah |
| POST | `/api/staf/artikel` | penulis, redaktur, superadmin |
| PATCH | `/api/staf/artikel/[id]` | penulis (**miliknya saja**), redaktur, superadmin |
| DELETE | `/api/staf/artikel/[id]` | redaktur, superadmin |
| POST | `/api/staf/artikel/[id]/terbitkan` | redaktur, superadmin **SAJA** |
| POST | `/api/staf/unggah` | penulis, redaktur, verifikator, superadmin |

Route berparameter: `params` wajib di-`await`.

### 6. Aturan wajib

**Slug** — dibangkitkan otomatis dengan `slugify`, dijamin unik (akhiran bila
bentrok), **tidak berubah setelah terbit** (mengubahnya memutus tautan yang
sudah tersebar).

**Sanitasi isi — di SERVER.** Isi artikel disanitasi **sebelum disimpan**
dengan `isomorphic-dompurify`. Jangan mengandalkan sanitasi di peramban —
penyerang memanggil API langsung, tidak lewat editor. Tetapkan daftar putih tag
dan atribut, jelaskan pilihannya.

**Unggahan** — tipe `jpg`/`png`/`webp` saja; ukuran dari `UPLOAD_MAX_MB`;
**periksa magic bytes**, bukan ekstensi atau `Content-Type` (keduanya mudah
dipalsukan); **ganti nama berkas secara acak** (jangan pernah mempercayai nama
dari pengguna, mis. `../../etc/passwd`); kompres dengan `sharp`; simpan di
`UPLOAD_DIR`, sajikan **tanpa hak eksekusi**.

**Waktu** — `terbit_pada` diisi dari aplikasi lewat `waktuSekarang()`, bukan
`NOW()` (aturan 1).

**Artikel wajib punya kategori** (aturan 7). Tegakkan di route API, bukan hanya
di UI.

**Audit** — setiap pembuatan, penyuntingan, penerbitan, penghapusan menulis
`audit_log`.

---

## LARANGAN KERAS

| Larangan | Alasan |
|---|---|
| Menyimpan HTML tanpa sanitasi server | Risiko XSS |
| Mempercayai ekstensi atau `Content-Type` unggahan | Mudah dipalsukan |
| Memakai nama berkas dari pengguna | Path traversal |
| `penulis` bisa menerbitkan | Matriks peran |
| `penulis` menyunting artikel orang lain | Matriks peran |
| Menyaring hak akses hanya di UI | Aturan 3 |
| `terbit_pada` diisi `NOW()` | Aturan 1 |
| Artikel tanpa kategori | Aturan 7 |
| Mengubah slug setelah terbit | Memutus tautan |
| `params` tanpa `await` | Aturan 12 |

---

## UJI TAHAP 5

**a. Alur penuh** — buat draf → sunting → terbitkan → muncul di `/berita` →
buka detail → arsipkan → hilang dari publik. Lampirkan tangkapan tiap langkah.

**b. UJI PERAN LEWAT CURL — wajib.** Tanpa membuka UI sama sekali:

| Uji | Harapan |
|---|---|
| `penulis` POST `/api/staf/artikel/[id]/terbitkan` | 403 |
| `penulis` PATCH artikel milik orang lain | 403 |
| `penulis` DELETE artikel apa pun | 403 |
| `verifikator` GET `/api/staf/artikel` | 403 |
| `pimpinan_wilayah` POST `/api/staf/artikel` | 403 |
| `pimpinan_wilayah` GET artikel wilayah lain | tidak ada di hasil |

**c. UJI XSS** — sisipkan ke isi artikel, **lewat API langsung** (bukan lewat
editor):
```html
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<a href="javascript:alert(1)">tautan</a>
```
Buka halaman detail → tidak ada yang dieksekusi. Periksa juga **isi yang
tersimpan di basis data** — harus sudah bersih, bukan bersih hanya saat
ditampilkan.

**d. UJI UNGGAHAN**

| Uji | Harapan |
|---|---|
| `.php` diganti nama jadi `.jpg` | Ditolak (magic bytes) |
| Berkas melebihi `UPLOAD_MAX_MB` | Ditolak, pesan jelas |
| Nama `../../evil.jpg` | Nama diganti acak, tidak keluar folder |
| `.svg` berisi script | Ditolak atau disanitasi |

**e. Slug** — dua artikel berjudul sama → slug kedua diberi akhiran, tidak
menimpa. Ubah judul artikel terbit → slug **tidak berubah**.

**f. Kategori wajib** — POST artikel tanpa `kategori_id` lewat API langsung →
ditolak.

**g. Zona waktu** — terbitkan artikel, periksa `terbit_pada` di DB → WIB.

**h. Jumlah dibaca** — buka detail 5 kali → naik 5. Akses dengan User-Agent bot
→ tidak naik.

**i. UJI KESETIAAN** — `uji-kesetiaan.mjs` untuk kelima layar (REFERENSI
18.5); sisa cacat export nol; setiap kelas hilang beralasan. Bila peramban
tersedia, tambahkan perbandingan berdampingan dengan `screen.png`.

**j. Tiga lebar layar** — 375px, 768px, 1280px untuk daftar dan detail berita.

**k. Lighthouse** — daftar berita dan detail artikel. Performance ≥ 90,
Accessibility ≥ 90, SEO ≥ 90.

**l. Nama ikon** — telusuri `edit_document`, `gavel`, `settings`, `logout`.
Nihil.

**m. Keadaan kosong** — kosongkan tabel artikel → `/berita` menampilkan keadaan
kosong yang rapi.

**n. `await` lengkap** — telusuri `params`/`searchParams` tanpa `await`. Nihil.

**o. Build hijau** — `npm run build` dan `npm run lint`.

---

## BENTUK KELUARAN (Claude Code)

Kerjakan **langsung di repo ini** — tidak ada paket perubahan, tidak ada
apply.ps1. Di akhir tahap:

1. Seluruh berkas tahap ini sudah ada di tempatnya dan `npm run build` hijau.
2. Tulis `laporan/LAPORAN-TAHAP-05.md` (isi sesuai bagian LAPORAN di bawah).
   Bukti uji (keluaran curl, keluaran uji-kesetiaan, tangkapan bila ada) masuk
   `laporan/bukti-tahap-05/` dan dirujuk dari laporan.
3. `git add -A` lalu `git commit -m "Tahap 05: <ringkasan satu baris>"`.
   Jangan push tanpa diminta pemilik.
4. MODE GERBANG: berhenti, tunggu pemilik memeriksa laporan. MODE OTONOM:
   verifikasi gerbang-mandiri (ALUR bagian 7.2), perbarui laporan/STATUS.md,
   lalu langsung lanjut tahap berikutnya.

## LAPORAN — isi `laporan/LAPORAN-TAHAP-05.md`

1. Daftar halaman, komponen, dan route API yang dibuat
2. **Tabel hasil uji peran (butir b)** — lengkap
3. **Hasil uji XSS (butir c)** — termasuk isi tersimpan di basis data
4. **Hasil uji unggahan (butir d)**
5. Tangkapan layar perbandingan kelima layar
6. Skor Lighthouse
7. Hasil kelima belas butir UJI TAHAP
8. **KEPUTUSAN BARU**: daftar putih tag HTML, cara membedakan bot dari pembaca,
   penanganan bentrok slug

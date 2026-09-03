# TAHAP 7 — RUANG KERJA STAF

> **Sumber di repo ini:** `CLAUDE.md`, `dokumen/CETAK-BIRU-SISTEM.md`,
> `dokumen/REFERENSI.md`, `dokumen/ALUR-KERJA-CLAUDE-CODE.md`,
> `desain/stitch_portal_berita_inklusif/` (ekstrak `Warkop_Nusantara.zip`),
> `LSM_WARKOP.png`, `paket-pendukung/`
>
> **Bergantung pada:** Tahap 0–6
> **Rujukan cetak biru:** bagian 3 (navItems), 8, Pelajaran nomor 3 dan 8
> **Rujukan REFERENSI:** 10, 11, 12, 14 (aturan 8), **18 (protokol konversi;
> 18.3 sidebar kanonik; 18.4 halaman yang tidak ada di ZIP)**
> **Layar:** `dashboard_staff_warkop/`, dan sidebar pada layar staf lain

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

Melengkapi ruang kerja staf: dashboard, sidebar, dan lima modul pengelolaan.

Satu jebakan khusus menanti di sini — **daftar putih pengaturan** (aturan 8).
Di Cap Jiki, setelan baru ditambahkan ke tampilan tetapi kuncinya belum masuk
daftar putih di route API. Nilainya ditolak diam-diam: **tampak tersimpan
padahal tidak.** Bug seperti ini sulit ditemukan karena tidak menimbulkan galat
apa pun.

---

## PEKERJAAN

### 1. Sidebar staf — `components/staf/SidebarStaf.js`

Sidebar kanonik = `dashboard_staff_warkop/code.html` (REFERENSI 18.3). Salin
markupnya apa adanya lewat protokol konversi; layar staf lain memakai komponen
yang sama. Ringkasannya:

**Atas** — foto profil bulat, nama pengguna (Domine, tebal), perannya di
bawahnya dengan warna lebih redup. Pada desain tertulis "Staff Warkop /
Vigilance Officer" — ganti dengan nama dan peran sungguhan dari sesi.

**Menu** — dari `lib/navItems.js` → `menuStaf`, **disaring menurut peran**. Item
aktif berlatar emas `#fed65b` dengan sudut membulat penuh; item lain
transparan.

**Tombol utama** di bawah menu: "Buat Laporan Baru" (cokelat tua).

**Bawah** — Pengaturan dan Keluar, dipisah garis tipis.

Latar sidebar krem `#faf9f5`, garis pemisah vertikal di kanan.

**Ingat cacat export 4:** pada `kelola_artikel_admin/screen.png` dan
`kelola_pengaduan_admin/screen.png`, sidebar menampilkan `dashboard`,
`edit_document`, `gavel`, `settings`, `logout` sebagai **teks mentah**. Ganti
dengan ikon SVG sungguhan.

**Perhatikan `href`** memakai awalan `/staf` — konsekuensi segmen bersarang.

Di layar kecil, sidebar menjadi laci geser dengan tombol pembuka.

### 2. Dashboard — `app/(staf)/staf/dashboard/page.js`

**PROTOKOL KONVERSI LAYAR** pada `dashboard_staff_warkop/code.html`. Grafik
batang dibuat dengan elemen `div` berkelas Tailwind persis seperti di
`code.html` (bukan pustaka grafik — tidak ada di daftar paket yang dibolehkan).
Ringkasannya:

**Kepala** — "Tinjauan Pengawasan" (Domine) dengan "Status pelaporan dan
operasional hari ini."

**Tiga kartu angka:**

| Kartu | Angka | Keterangan | Sorotan |
|---|---|---|---|
| Total Artikel | 145 | "+12 bulan ini" | ikon dokumen abu |
| Pengaduan Masuk | 24 | "Menunggu Verifikasi" (emas, tebal) | **kartu bergaris tepi emas, ikon emas** |
| Laporan Selesai | 89 | "Resolusi tuntas" | ikon centang abu |

Angka besar memakai Domine.

**Grafik "Tren Laporan Bulanan"** — batang emas `#e9c349`, 12 bulan terakhir,
batang bulan berjalan sedikit lebih gelap, garis kisi horizontal tipis.

**Panel "Aktivitas Staf"** — dari `audit_log`: ikon bulat, teks aksi dengan
nomor rujukan tebal, waktu relatif ("10 mnt lalu", "1 jam lalu").

**Tabel "Pengaduan Terbaru"** — kepala cokelat tua dengan kolom Region berwarna
emas. Kolom: ID, Region, Tanggal, Status, Tindakan. Lencana status berwarna.
"Lihat Semua →" di kanan atas.

**Seluruh angka dihitung dari basis data.** Tidak ada yang dipaku.

**Isi menyesuaikan peran:** `verifikator` → pengaduan lebih menonjol;
`redaktur` dan `penulis` → artikel; `pimpinan_wilayah` → hanya angka
wilayahnya; `superadmin` → seluruhnya. Rancang agar penyesuaian ini rapi, bukan
tumpukan kondisi bercabang.

### 3. Kelola pengurus — `app/(staf)/staf/pengurus/page.js`

Tidak ada di ZIP — REFERENSI 18.4: cetakan `kelola_artikel_admin` (tabel) dan
`editor_artikel_admin` (formulir). Tandai sebagai KEPUTUSAN BARU.

CRUD `pengurus`: nama, jabatan, tingkat (pusat/wilayah), wilayah, foto,
deskripsi, aktif sejak, **urutan** (bisa diseret), aktif.

Urutan menentukan tampilan di `/struktur` — perubahannya harus langsung
terlihat.

### 4. Kelola program — `app/(staf)/staf/program/page.js`

CRUD `program`: judul, slug, ringkasan, isi, gambar, status
(berjalan/selesai), wilayah, tanggal mulai dan selesai.

### 5. Kelola galeri — `app/(staf)/staf/galeri/page.js`

CRUD `galeri`: unggah foto/video, judul, deskripsi, kategori (dari
`lib/kategoriGaleri.js`), wilayah, tanggal kegiatan. Untuk video, bangkitkan thumbnail. Untuk foto, kompres dengan
`sharp`.

Aturan unggahan sama ketatnya dengan Tahap 5 dan 6: magic bytes, nama acak,
tanpa hak eksekusi.

Tampilkan sebagai grid dengan pratinjau, bukan tabel — ini konten visual.

### 6. Kelola pengguna — `app/(staf)/staf/pengguna/page.js`

**`superadmin` SAJA.** CRUD `users`: nama, email, peran, wilayah, aktif.

Tiga hal yang wajib ada:

1. **Tombol "Paksa Keluar"** yang menaikkan `token_version` — membatalkan
   seluruh token lama pengguna itu. Berguna saat akun diduga dibobol
2. **Reset kata sandi** oleh superadmin, dengan pemaksaan ganti saat login
   berikutnya
3. **Larangan menghapus atau menonaktifkan diri sendiri**, dan larangan
   menghapus superadmin terakhir — jangan sampai sistem terkunci

Setiap tindakan menulis `audit_log`.

### 7. Pengaturan — `app/(staf)/staf/pengaturan/page.js`

**`superadmin` SAJA.** Kunci-nilai dari tabel `pengaturan`, dikelompokkan:
statistik beranda (laporan ditangani, provinsi tercover, tahun mengawasi),
kontak (alamat pusat, hotline, email), teks organisasi (visi, misi).

**ATURAN DAFTAR PUTIH — aturan 8**

Route `PATCH /api/staf/pengaturan` **wajib** punya daftar putih kunci. Kunci di
luar daftar **ditolak dengan pesan jelas**, bukan diabaikan diam-diam.

Cetak biru menyebut: setiap menambah setelan, ubah **dua tempat sekaligus** —
daftar field di tampilan dan daftar putih di API — lalu uji simpan-muat ulang.

**Rancang agar kelalaian ini tidak mungkin terjadi lagi.** Buat
`lib/pengaturanDefinisi.js` sebagai sumber tunggal bagi tampilan **dan** daftar
putih API sekaligus, sehingga menambah setelan hanya perlu satu perubahan.
Jelaskan pendekatanmu.

Tambahkan **validasi tipe** per kunci: angka harus angka, email harus email.
Nilai tidak valid ditolak dengan pesan jelas.

### 8. Route API

| Metode | Route | Peran |
|---|---|---|
| GET/POST/PATCH/DELETE | `/api/staf/pengurus` | redaktur, superadmin |
| GET/POST/PATCH/DELETE | `/api/staf/program` | redaktur, superadmin |
| GET/POST/PATCH/DELETE | `/api/staf/galeri` | redaktur, superadmin |
| GET/POST/PATCH/DELETE | `/api/staf/pengguna` | superadmin **SAJA** |
| GET/PATCH | `/api/staf/pengaturan` | superadmin **SAJA**, daftar putih |
| GET | `/api/staf/statistik` | seluruh peran staf, disaring menurut peran |

---

## LARANGAN KERAS

| Larangan | Sumber |
|---|---|
| Menampilkan nama ikon sebagai teks | Cacat export 4 |
| Memaku angka dashboard di kode | Harus dari basis data |
| Menerima kunci pengaturan di luar daftar putih | Aturan 8 |
| Menolak kunci diam-diam tanpa pesan | Aturan 8 |
| Menyaring menu tanpa menjaga route API | Aturan 3 |
| Superadmin bisa menghapus dirinya sendiri | Bisa mengunci sistem |
| Menyaring wilayah di JavaScript | Harus di SQL |

---

## UJI TAHAP 7

**a. Angka dashboard akurat** — hitung manual di basis data dengan kueri
terpisah, bandingkan dengan yang tampil. Lampirkan kedua angkanya
berdampingan.

**b. Grafik 12 bulan** — menampilkan 12 bulan berturut-turut, **termasuk bulan
bernilai nol** (jangan sampai bulan kosong dilewati sehingga sumbu bergeser).
Uji dengan data yang sengaja bolong.

**c. Dashboard per peran** — buka sebagai kelima peran. Lampirkan tangkapan
kelimanya.

**d. Sidebar per peran** — lampirkan tangkapan sidebar untuk kelima peran. Menu
sesuai matriks REFERENSI bagian 11.

**e. UJI SIDEBAR BUKAN PAGAR** — untuk setiap menu yang **disembunyikan** dari
suatu peran, panggil route API-nya langsung dengan curl memakai peran itu →
**403**. Lampirkan tabelnya.

**f. CRUD lengkap** — setiap modul (pengurus, program, galeri, pengguna,
pengaturan) diuji penuh: buat, baca, ubah, hapus.

**g. UJI DAFTAR PUTIH PENGATURAN — wajib.**

1. Simpan **setiap** setelan satu per satu
2. **Muat ulang halaman**
3. Periksa nilainya benar-benar tersimpan
4. Kirim kunci yang **tidak terdaftar** lewat API langsung → **ditolak dengan
   pesan jelas**, bukan diam-diam
5. Kirim nilai bertipe salah (huruf untuk kolom angka) → ditolak

Lampirkan hasil kelimanya. Ini uji yang menangkap aturan 8.

**h. Pengaturan mempengaruhi halaman publik** — ubah angka statistik → beranda
ikut berubah tanpa deploy.

**i. Paksa keluar** — login pengguna A di satu peramban; sebagai superadmin di
peramban lain, tekan "Paksa Keluar" untuk A; sesi A **langsung berakhir**.

**j. Perlindungan diri sendiri** — superadmin mencoba menghapus atau
menonaktifkan akunnya sendiri → ditolak. Menghapus superadmin terakhir →
ditolak.

**k. Urutan pengurus** — ubah urutan di ruang staf → `/struktur` ikut berubah.

**l. Unggahan galeri** — magic bytes, ukuran, nama berkas, hak eksekusi.

**m. Nama ikon** — telusuri `dashboard`, `edit_document`, `gavel`, `settings`,
`logout` di keluaran render. **Nihil**.

**n. UJI KESETIAAN** — `uji-kesetiaan.mjs` untuk dashboard terhadap
`dashboard_staff_warkop/code.html` (REFERENSI 18.5); sisa cacat export nol.
Bila peramban tersedia, tambahkan perbandingan berdampingan dengan
`screen.png`.

**o. Tiga lebar layar** — 375px, 768px, 1280px. Perhatikan tabel data di layar
kecil — harus tetap terbaca, bukan terpotong.

**p. Keadaan kosong** — kosongkan setiap tabel → setiap modul menampilkan
keadaan kosong yang rapi.

**q. Build hijau** — `npm run build` dan `npm run lint`.

---

## BENTUK KELUARAN (Claude Code)

Kerjakan **langsung di repo ini** — tidak ada paket perubahan, tidak ada
apply.ps1. Di akhir tahap:

1. Seluruh berkas tahap ini sudah ada di tempatnya dan `npm run build` hijau.
2. Tulis `laporan/LAPORAN-TAHAP-07.md` (isi sesuai bagian LAPORAN di bawah).
   Bukti uji (keluaran curl, keluaran uji-kesetiaan, tangkapan bila ada) masuk
   `laporan/bukti-tahap-07/` dan dirujuk dari laporan.
3. `git add -A` lalu `git commit -m "Tahap 07: <ringkasan satu baris>"`.
   Jangan push tanpa diminta pemilik.
4. MODE GERBANG: berhenti, tunggu pemilik memeriksa laporan. MODE OTONOM:
   verifikasi gerbang-mandiri (ALUR bagian 7.2), perbarui laporan/STATUS.md,
   lalu langsung lanjut tahap berikutnya.

## LAPORAN — isi `laporan/LAPORAN-TAHAP-07.md`

1. Daftar halaman, komponen, dan route API yang dibuat
2. **Tangkapan dashboard dan sidebar untuk kelima peran (butir c dan d)**
3. **Tabel hasil uji "sidebar bukan pagar" (butir e)**
4. **Hasil uji daftar putih pengaturan (butir g)** — kelima langkahnya
5. Perbandingan angka dashboard manual vs tampil (butir a)
6. Hasil ketujuh belas butir UJI TAHAP
7. **KEPUTUSAN BARU**: susunan halaman pengurus/program/galeri (tidak ada di
   ZIP), pendekatan agar daftar putih pengaturan tidak mungkin terlupa lagi,
   cara menyesuaikan dashboard per peran

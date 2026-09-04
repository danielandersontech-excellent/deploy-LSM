# LAPORAN RUN QA-3 — WARKOP NUSANTARA

> Restrukturisasi organisasi (susunan kelompok final, Direktorat 12 bagian, wilayah dua
> tingkat) dan tujuh permintaan pemilik pada tampilan publik serta ruang staf.
> Ditulis Claude Code, 4 September 2026. Setiap angka punya berkas bukti di
> `laporan/bukti-qa-3/`; skrip yang menghasilkannya di `laporan/bukti-qa-3/skrip/`.

## 1. Ringkasan

Seluruh butir A sampai G SELESAI dan sudah tayang di produksi
(image `4f95751`, HEALTHY). Verifikasi akhir di domain produksi LULUS 10 langkah, 0 gagal.

Satu **bug lama ditemukan dan diperbaiki** dalam perjalanan, dan bug itulah akar masalah yang
pemilik lihat sebagai kartu "Sekjen DPP" nyasar di bagian Pimpinan Regional:

> **Setiap penyuntingan pengurus diam-diam menghapus kelompoknya.**
> `app/(staf)/staf/pengurus/page.js` tidak pernah mengirim kolom `kelompok` ke komponen formulir,
> sehingga tombol "Ubah" selalu membukanya kosong dan setiap penyimpanan mengirim `kelompok: null`.
> Pengurus yang disunting langsung jatuh ke luar seluruh blok bagan. Kini `kelompok` dan `bagian`
> ikut dikirim, dan `kelompok` menjadi WAJIB di validasi server (422 `KELOMPOK_WAJIB`) sehingga
> tidak bisa hilang lagi, bahkan bila ada klien lain yang mengirim null.

Ringkasan hasil uji:

| Butir | Uji | Hasil |
|---|---|---|
| A1 A2 A3 + B | `uji-a-struktur-pengurus.mjs` | 11 langkah LULUS |
| C D E F | `uji-cdef.mjs` | 15 langkah LULUS |
| C D1 | `tangkap-navbar-footer.mjs` (375/768/1280/1366/1440/1920) | LULUS lokal dan produksi |
| G | pagar peran `uji-b1` | 246 pemeriksaan, 0 gagal |
| G | kesetiaan 14 layar | 14 layar HTTP 200, sisa cacat export 0 |
| G | sapu konsol halaman tersentuh | lokal 28 sel 0 gagal; produksi 22 sel 0 gagal |
| G | penjaga dash, lint, build | bersih semua |
| G | verifikasi akhir produksi | 10 langkah, 0 gagal |

## 2. Diagnosa CLI (permintaan pemilik, hanya membaca)

`laporan/bukti-qa-3/0-diagnosa-cli.txt`

```
claude --version : 2.1.260 (Claude Code)
claude doctor    : native (2.1.260), platform win32-x64, config install method: native
                   Search: OK (bundled)
                   Auto-updates: enabled, channel latest
                   Last update attempt: FAILED (install_failed) - 2026-09-04
                   Managed settings (remote): not fetched (butuh langganan Enterprise/Team)
                   "No installation issues found."
```

**Untuk pemilik:** pembaruan otomatis CLI GAGAL dengan `install_failed` pada 4 September 2026.
Tidak ada yang dipasang atau diperbarui selama run ini sesuai perintah. Bila ingin memperbarui,
jalankan sendiri di luar sesi ini; versi sekarang berjalan normal dan tidak menghambat apa pun.

## 3. Data produksi sebagai sumber kebenaran

Pemilik menyunting data pengurus di produksi tepat sebelum run ini. Yang dilakukan:

1. SELECT seluruh tabel pengurus, wilayah, pengaturan, dan kategori program di produksi
   (`a-pengurus-produksi-sebelum.txt`, `a-basis-produksi-sebelum.txt`);
2. salinan data pengurus produksi diterapkan ke basis data lokal, sehingga migrasi diuji pada
   keadaan yang persis sama dengan produksi, bukan pada data contoh;
3. migrasi ditulis agar **tidak pernah menyentuh** nama, jabatan, urutan, foto, atau deskripsi
   baris mana pun. Yang diubah hanya: menambah kolom, memetakan kelompok yang ditiadakan,
   mengisi `bagian` yang masih kosong, dan menonaktifkan baris di luar susunan.

**Temuan penting saat memetakan:** tabel `wilayah` TERNYATA SUDAH bertingkat sejak Tahap 01
(kolom `jenis` enum `pusat/provinsi/kabupaten_kota` dan `induk_id`). Jadi butir A3 tidak
membutuhkan perubahan skema sama sekali; yang kurang hanyalah baris kabupaten/kotanya.

## 4. Butir A — restrukturisasi organisasi

### A1 susunan kelompok final
`lib/kelompokPengurus.js` kini memuat delapan kelompok, dan urutan array itulah urutan blok
pada bagan `/struktur` maupun urutan baris kepala di Kelola Pengurus:

Dewan Pembina, Dewan Penasehat, Dewan Pengawas, Pengurus DPP, Direktorat, Satuan Tugas (Satgas),
DPW (tingkat provinsi), Koordinator Daerah (tingkat kabupaten/kota, di bawah DPW).

DIHAPUS dari sistem: **DPC** dan **Direktorat Eksekutif**. Kelompok lama `dpd` dipetakan menjadi
`korda`. API menolak ketiganya dengan 422 (dibuktikan pada uji langkah 2).

### A2 Direktorat 12 bagian
Kolom baru `pengurus.bagian` menyimpan slug bagian. Satu bagian boleh berisi beberapa jabatan
(Direktur, Wakil Direktur, anggota) sesuai perintah. Bagian wajib untuk kelompok Direktorat
(422 `BAGIAN_WAJIB`), dan bagian yang tidak dikenal ditolak (422 `BAGIAN_TIDAK_SAH`).
Halaman `/struktur` menampilkan 12 kartu bagian; bagian yang belum ada pejabatnya tertulis
"(Belum terisi)". Formulir pengurus memunculkan pilihan Bagian hanya saat kelompok = Direktorat,
dan mengusulkan teks jabatan ("Direktur <nama bagian>") bila kolom jabatan masih kosong.

### A3 wilayah dua tingkat
Migrasi `20260905-0930-wilayah-kabupaten-kota.sql` **hanya menambah** 514 baris kabupaten/kota.
39 baris lama (id 1 sampai 39, dipakai `pengaduan.wilayah_id`, `program.wilayah_id`,
`users.wilayah_id`) tidak disentuh sama sekali; `induk_id` tidak ditulis tangan melainkan diambil
lewat JOIN ke baris provinsi berdasarkan kode, sehingga mustahil salah pasang.
Diverifikasi di produksi: 1 pusat + 38 provinsi + 514 kabupaten/kota, 0 kabupaten tanpa induk,
39 baris lama utuh.

Formulir pengurus: kelompok DPW memunculkan dropdown **provinsi**; Koordinator Daerah memunculkan
dropdown **kabupaten/kota** yang dikelompokkan per provinsi (`<optgroup>`) dengan kotak cari,
karena daftarnya ratusan baris. Pasangan yang salah ditolak server: DPW dengan kabupaten dan
Koordinator Daerah dengan provinsi keduanya 422 `WILAYAH_JENIS_TIDAK_COCOK`.

### Baris pengurus yang dipindah atau dinonaktifkan

Migrasi memetakan tujuh baris Direktorat ke bagiannya (dari teks jabatan yang ditulis pemilik
sendiri; tidak ada teks yang diubah) dan menonaktifkan satu baris:

| id | Nama | Perubahan oleh migrasi |
|---|---|---|
| 12 | Johan Elvianus Hondro | bagian -> `humas-kerja-sama` |
| 17 | Sopan Pangabean, S.H. | bagian -> `investigasi` |
| 19 | Jasrivai Manulang, S.H. | bagian -> `organisasi-kaderisasi` |
| 21 | Ronald Eldiner, S.H. | bagian -> `lingkungan-hidup` |
| 22 | Roy Jensen Sidabutar, S.Kom. | bagian -> `media` |
| 23 | Yefrizal, S.E. | bagian -> `humas-kerja-sama` (bagian ini berisi dua orang, diizinkan A2) |
| 24 | Dedek | bagian -> `pemberdayaan-masyarakat-umkm` |
| **14** | **Andreas Reynaldho, S.H., M.H.** | **aktif 1 -> 0** (kelompok NULL, kartu "Sekjen DPP" yang nyasar). TIDAK dihapus |

Tidak disentuh sama sekali: id 10, 3, 43, 1, 16, 25, 2.

**Sudah diselesaikan pemilik sendiri.** Setelah butir A tayang, pemilik langsung memakai formulir
yang sudah diperbaiki: Andreas Reynaldho kini aktif kembali sebagai **Sekretaris Jenderal DPP**
di kelompok Pengurus DPP, Dian Lestari Gultom dipindah ke Direktorat bagian Hukum dan Advokasi,
Jasrivai Manulang dipindah ke bagian Penyuluhan dan Sosialisasi, Yefrizal menjadi Wakil Direktur
Humas, serta dua orang baru ditambahkan (Dewan Penasehat dan Dewan Pengawas).
Keadaan akhir: **17 pengurus aktif, semuanya berkelompok sah, seluruh baris Direktorat punya
bagian, 0 baris tanpa kelompok** (`g-pengurus-produksi-sesudah.txt`).

## 5. Butir B — Kelola Pengurus berkepala kelompok

Tabel Kelola Pengurus kini menampilkan **baris kepala kelompok** bergaya kepala tabel desain
(`bg-primary` / `text-on-primary`, `colspan` penuh) bertuliskan "<Kelompok> - <tingkat>",
misalnya "Dewan Pembina - Dewan Pimpinan Pusat", lalu baris anggotanya urut kolom `urutan`.
Untuk Direktorat ada **sub-kepala per bagian** ("Bagian: Media"). Urutan kelompok mengikuti
urutan bagan A1, dan baris yang kelompoknya di luar susunan jatuh ke paling bawah dengan kepala
"Di luar susunan resmi - perlu ditempatkan ulang oleh pengelola" supaya langsung terlihat.

Tombol naik/turun kini hanya bertukar **di dalam kelompok (dan bagian) yang sama**, karena
tabelnya sudah dikelompokkan. Kelola Pengurus tidak punya filter/pencarian sebelumnya, jadi
tidak ada yang perlu dipertahankan di sana.

## 6. Butir C — navbar tanpa "Masuk Staff"

KEPUTUSAN PEMILIK, menyimpang dari desain. Tombol "Masuk Staff" dihapus dari navbar desktop dan
laci seluler; `HeaderPublik` tidak lagi membaca `STAF_HOST`. Diuji: 11 halaman publik tidak
memuat teks "Masuk Staff", tidak memuat tautan ke `/login`, dan tidak menyebut alamat host staf.
Halaman masuk tetap hidup lewat URL langsung (`staf.warkopnusantara.id/login` 200 dengan formulir;
di host publik `/login` memang dialihkan 307 ke host staf sesuai pemisahan host).

Ruang kosongnya dipakai melegakan menu: jarak antaritem `gap-5` (2xl `gap-8`) dan kotak cari
`w-48` (2xl `w-64`). Diukur pada 1280, 1366, 1440, 1920 (dan 375, 768): tanpa gulir mendatar,
menu tetap satu baris, tanpa kontrol tumpang tindih, dan tepi kanan menu selalu di kiri kotak cari.

## 7. Butir D — footer

**D1 latar membentang penuh.** Kelas latar dan garis dipindah ke elemen `<footer>` yang `w-full`,
sedangkan kelas kontainer (`max-w-container-max mx-auto`, padding, flex) pindah ke `<div>` di
dalamnya. Tidak ada kelas desain yang dibuang, hanya dipisah. Diukur pada 375/768/1280/1366/1440/1920:
lebar footer selalu sama dengan lebar layar dan mulai di x=0, sedangkan isinya tetap punya padding
(16 px di 375, 40 px sejak 768) dan tidak pernah melebihi kontainer 1280 px.

**D2 Kantor Pusat.** Tautan cepat "Kantor Regional" diganti "Kantor Pusat" yang membuka tab baru
(`rel="noopener noreferrer"`) ke
`https://www.google.com/maps/dir/?api=1&destination=0.504192,101.427052`, yaitu petunjuk arah dari
lokasi pengguna ke titik kantor pusat. Alamatnya disimpan sebagai pengaturan `kontak_peta_url`
sehingga bisa diubah lewat ruang staf (K3); dibuktikan dengan mengubahnya lewat API, memastikan
footer memakai nilai baru, lalu memulihkannya. Bila dikosongkan, tautannya tidak dirender.

## 8. Butir E — media sosial

Empat kunci pengaturan baru: `sosial_tiktok`, `sosial_instagram`, `sosial_youtube`,
`sosial_facebook`, memakai **tipe pengaturan baru `url`** yang boleh kosong tetapi bila diisi
wajib diawali `https://` (menolak `http://`, `javascript:`, dan teks bebas; ketiganya diuji dan
ditolak 422 `TIPE_URL`). Footer hanya menampilkan ikon untuk kanal yang terisi, tab baru,
`rel="noopener noreferrer"`, dengan label aksesibilitas "TikTok WARKOP NUSANTARA (tab baru)".

Ikon adalah **SVG inline yang digambar sendiri** (`components/publik/IkonSosial.js`), satu warna
`currentColor`, kotak 24x24, hanya mengisyaratkan jenis kanalnya. Bukan unduhan dari internet dan
bukan salinan logo resmi (aturan K1 dan pertimbangan hak merek); catatan itu ditulis di berkasnya.
Isi sekarang: TikTok `https://www.tiktok.com/@warkop.nusantara_media`, tiga lainnya kosong.
Dibuktikan: mengisi Instagram lewat Pengaturan langsung memunculkan ikonnya, dikosongkan lagi
ikonnya hilang.

## 9. Butir F — kategori program dinamis

Tabel baru `kategori_program` (id, nama, slug, ikon, urutan) di-seed dari tiga kategori yang sudah
dipakai. **Kolom `program.kategori` sengaja tetap VARCHAR berisi slug**, bukan diganti foreign key,
sehingga seluruh baris program lama, tautan filter publik `/program?kategori=<slug>`, dan indeks
`idx_program_kategori` tetap berlaku apa adanya. Migrasi juga mendaftarkan kategori apa pun yang
sudah terlanjur dipakai baris program, sehingga tidak mungkin ada yang tertinggal (diverifikasi:
0 program tanpa kategori terdaftar, di lokal maupun produksi).

Di Tambah/Ubah Program, select kategori mendapat pilihan **"Kategori Lainnya..."** yang memunculkan
kolom "Nama Kategori Baru". Server memvalidasi namanya (3 sampai 60 karakter, tidak boleh memuat
tag HTML, harus memuat huruf), membuat slug otomatis, dan **tidak membuat duplikat**: nama yang
menghasilkan slug sama memakai kategori yang sudah ada. Kategori baru langsung muncul di filter
publik `/program` dan di ruang staf. Semuanya diuji, termasuk klik sungguhan di Chrome untuk
memastikan memilih "Kategori Lainnya..." benar-benar memunculkan kolom isian tanpa galat konsol.

## 10. Butir G — regresi dan verifikasi akhir

### Kesetiaan 14 layar dengan dasar yang diperbarui
14 layar HTTP 200, **sisa cacat export 0**. Selisih terhadap dasar RUN QA-2 dihitung dan
seluruhnya berasal dari perubahan yang diperintahkan pemilik
(`g-selisih-kesetiaan-qa2-qa3.md`):

| Yang hilang dari desain | Layar | Butir | Alasan |
|---|---|---|---|
| teks "Masuk Staff" | 8 layar publik | C | tombol masuk staf dihapus dari situs publik |
| kelas `bg-secondary`, `text-on-secondary`, `hover:bg-secondary-container`, `hover:text-on-secondary-container` | beranda, galeri, daftar berita, kontak | C | kelas milik tombol "Masuk Staff" yang dihapus |
| teks "Kantor Regional" | 8 layar publik | D2 | diganti "Kantor Pusat" menuju petunjuk arah peta |
| kelas `mb-24` | struktur_organisasi | A1 | milik blok kerangka DPW/DPD/DPC yang ditiadakan |

Dua kelas justru **kembali cocok** dengan desain: `w-48` (kotak cari melebar mengisi ruang bekas
tombol) dan `hover:text-primary` (nama provinsi pada blok DPW kini tautan ber-hover).
Perubahan footer D1 tidak menghilangkan satu kelas desain pun karena kelasnya hanya dipindah.

### Sisanya
- **Pagar peran** `uji-b1`: 47 metode API x 6 identitas = 246 pemeriksaan, 0 gagal.
- **Sapu konsol** halaman yang tersentuh (11 halaman publik + 3 halaman staf, pada 375 dan 1280):
  lokal 28 sel 0 gagal; produksi 22 sel 0 gagal (halaman staf produksi diperiksa terpisah lewat
  akun uji sementara). Tidak ada galat konsol, tidak ada permintaan >= 400, tanpa gulir mendatar,
  tanpa kontrol tumpang tindih.
- **Penjaga em/en dash**: bersih di kode, seed, migrasi, DB lokal, DAN DB produksi (tujuh tabel
  termasuk `kategori_program` yang baru: 0 baris).
- **`npm run lint`** bersih (termasuk aturan `no-undef` yang dipasang pada RUN QA-2),
  **`npm run build`** hijau.

### Verifikasi akhir di domain produksi (`g-verifikasi-produksi.txt`, 10 langkah 0 gagal)
`/struktur` menampilkan 12 bagian direktorat, blok DPW lalu Koordinator Daerah, dan DPC maupun
Direktorat Eksekutif sudah hilang; 17 pengurus aktif semuanya berkelompok sah; wilayah 38 provinsi
+ 514 kabupaten/kota dengan 39 baris lama utuh; Kelola Pengurus menampilkan kepala kelompok dan
sub-kepala bagian; 11 halaman publik bersih dari "Masuk Staff"; footer membentang penuh dengan
tautan Kantor Pusat dan ikon TikTok saja; tabel kategori program terisi dan filter publik bekerja.
Akun uji sementara dinonaktifkan kembali dan sesinya dipaksa keluar (login 401, sesi lama 401).

## 11. Yang TIDAK diuji atau perlu perhatian (jujur)

- **Daftar 514 kabupaten/kota disusun dari pengetahuan umum, BUKAN salinan basis data resmi.**
  Pemekaran dan perubahan nama daerah terjadi berkala, jadi daftar ini bisa tidak mutakhir.
  Kodenya sengaja INTERNAL (awalan "K", misalnya `K1401`) supaya tidak dikira kode resmi BPS atau
  Kemendagri. Pemilik perlu meninjau, terutama untuk daerah yang akan benar-benar dipakai.
- **Bagian "Koordinator Daerah" hanya menampilkan provinsi yang sudah punya koordinator.**
  Menampilkan seluruh 514 kabupaten/kota sebagai kerangka akan membuat halaman berisi ratusan
  kartu kosong. Kerangka penuh hanya dirender untuk DPW (38 provinsi). Ini KEPUTUSAN BARU dengan
  alasan keterbacaan; bila pemilik ingin kerangka kabupaten/kota penuh, cukup beri tahu.
- **Safari (iOS/macOS), Firefox, dan Chrome Android tidak diuji** (tidak tersedia di lingkungan
  ini). Seluruh uji peramban memakai Chrome headless dengan emulasi lebar layar.
- **Lighthouse tidak dijalankan ulang** pada run ini; temuan Tahap 9 (Performance 70 sampai 77
  karena font Fira Sans belum disubset) masih berlaku.
- **Ikon media sosial adalah gambar buatan sendiri, bukan logo resmi.** Bila pemilik ingin logo
  resmi tiap platform, itu keputusan pemilik beserta kewajiban lisensinya; berkasnya cukup
  diletakkan di `public/` dan komponen ikonnya diarahkan ke sana.

## 12. MENUNGGU PEMILIK

1. **Tinjau daftar kabupaten/kota** (514 baris) untuk daerah yang akan dipakai, terutama nama dan
   pemekaran terbaru. Perbaikan cukup lewat basis data; strukturnya sudah benar.
2. **Putuskan kerangka Koordinator Daerah**: tetap hanya menampilkan daerah yang sudah terisi
   (sekarang), atau menampilkan seluruh kabupaten/kota sebagai kerangka kosong.
3. **Isi kanal media sosial lain** (Instagram, YouTube, Facebook) lewat Pengaturan bila sudah ada;
   ikonnya otomatis muncul. Kosongkan untuk menyembunyikan.
4. **Pembaruan otomatis Claude Code CLI gagal** (`install_failed`, 4 September 2026). Tidak
   menghambat apa pun; perbarui sendiri bila diinginkan.
5. Butir MENUNGGU PEMILIK dari RUN QA-1, QA-2, dan DAFTAR TINDAKAN PEMILIK Tahap 9 tetap berlaku
   (foto sungguhan, subset font, volume lampiran Coolify, pengerasan firewall, rotasi rahasia,
   proxy Cloudflare, cadangan berkala).

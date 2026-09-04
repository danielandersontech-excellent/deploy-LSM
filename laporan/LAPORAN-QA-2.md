# LAPORAN RUN QA-2 — WARKOP NUSANTARA

> Perburuan bug total atas seluruh sistem sesudah batch perbaikan konten & tampilan
> (K2, A1, A2, B0–B8), ditutup dengan regresi dan verifikasi di domain produksi.
> Ditulis Claude Code, 4 September 2026. Semua angka di bawah punya berkas bukti di
> `laporan/bukti-qa-2/`; skrip yang menghasilkannya ada di `laporan/bukti-qa-2/skrip/`.

## 1. Ringkasan sejujurnya

**Lima cacat ditemukan dan diperbaiki dalam tahap C1–C5.** Dua di antaranya sudah
tayang di produksi sejak batch sebelumnya dan berdampak langsung ke pemakaian nyata:

| # | Cacat | Dampak sebelum diperbaiki | Ditemukan oleh |
|---|---|---|---|
| 1 | Formulir **Kelola Pengurus crash** (`disabled={memuat}`, variabelnya bernama `sibuk`) | Pemilik **tidak bisa menambah atau mengubah pengurus sama sekali** — menekan "Tambah Pengurus" melempar `ReferenceError` dan halaman jatuh ke batas galat. Melanggar aturan K3 tepat pada modul yang baru diisi struktur DPP | C2 (klik semua elemen) |
| 2 | **Lampiran 10–20 MB ditolak** `400 "Muatan tidak sah"` | Pelapor yang melampirkan foto/rekaman bukti lebih dari 10 MB ditolak dengan pesan yang tidak menjelaskan apa pun, padahal antarmuka menjanjikan 20 MB/berkas dan 40 MB total. Unggahan video galeri (sampai 20 MB) terkena hal yang sama | C3 (uji batas lampiran) |
| 3 | Pengurus **"Tanpa kelompok" hilang** dari seluruh halaman publik | Data yang dimasukkan pemilik lewat ruang staf tersimpan tetapi tidak pernah tampil, tanpa peringatan apa pun. Laten pada data sekarang, muncul begitu pemilik menambah pengurus baru | C4 (telaah kode + reproduksi) |
| 4 | **Satu galat di jalur permintaan mematikan seluruh peladen** | `uncaughtException` menjatuhkan proses: situs publik dan ruang staf mati serentak, pengaduan yang sedang diunggah hilang | Peladen lokal mati sendiri saat C2 berjalan |
| 5 | **Penjaga em-dash memberi 18 peringatan palsu** pada berkas berakhiran CRLF | Penjaga regresi K2 yang selalu merah akan diabaikan orang, sehingga pelanggaran sungguhan bisa lolos | C5 (regresi penutup) |

Penyebab sistemik cacat 1 juga diperbaiki: `npm run lint` **tidak** memeriksa nama
variabel yang tidak pernah dideklarasikan. `eslint.config.mjs` kini menyalakan
`no-undef`; dibuktikan menangkap bug yang sama bila dikembalikan.

Sesudah perbaikan: **C1 579 sel LULUS, C2 24 pemeriksaan LULUS, C3 59 langkah LULUS,
C4 16 langkah LULUS, C5 (regresi + produksi) LULUS.** Produksi menjalankan image
`f3e2833`, HEALTHY, dan seluruh perbaikan diverifikasi langsung di domain.

## 2. Verifikasi batch sebelumnya (prasyarat run ini)

Sebelum C1–C5, batch K2/A1/A2/B1–B8 (commit `c024580`) diperiksa ulang bahwa benar-benar
tuntas di produksi. Pemeriksaan bersifat idempoten (hanya SELECT dan curl):

- container produksi menjalankan image `c024580`, HEALTHY, `/api/health` 200
  (`bukti-server/14-redeploy-qa2-batch2.txt`);
- migrasi `20260904-1500` + `20260904-1510` tuntas: kolom `kelompok` dan indeks ada,
  39 posisi DPP per kelompok (3/3/3/4/2/9/6/3/3/3), **0** sisa pengurus contoh Tahap 4;
- alamat resmi Pekanbaru terpasang di `pengaturan`; galeri butir 3 berjenis `foto`;
- DB produksi **0 baris** em/en dash pada tujuh tabel teks tampil;
- halaman `/struktur` dan footer produksi benar-benar menampilkan data baru
  (`bukti-qa-2/a2-migrasi-produksi.txt`).

## 3. C1 — inventaris halaman × identitas × lebar

`skrip/uji-c1-inventaris.mjs` → `c1-inventaris-lokal.txt`

32 halaman (17 publik termasuk halaman 404, 15 jalur staf) × 6 identitas (tamu +
superadmin, redaktur, penulis, verifikator, pimpinan wilayah) × 3 lebar (375 / 768 /
1280) = **576 sel**, ditambah 3 pemeriksaan isolasi wilayah = **579 pemeriksaan, 0 gagal**.

Tiap sel memeriksa: galat konsol dan exception, permintaan jaringan ≥ 400, teks galat
di halaman, gulir mendatar (`scrollWidth` > lebar layar), elemen yang meluber ke luar
layar di luar wilayah `overflow-x-auto` yang disengaja, dan kontrol yang tumpang tindih
lebih dari seperempat luasnya.

Pengalihan yang tercatat sesuai pagar peran (contoh, daftar lengkap ada di berkas bukti):
tamu pada 13 jalur staf → `/login`; redaktur pada pengaduan/pengguna/pengaturan →
`/tanpa-akses`; penulis pada 9 jalur → `/tanpa-akses`; verifikator pada 9 jalur →
`/tanpa-akses`; pimpinan wilayah pada artikel baru/pengguna/pengaturan → `/tanpa-akses`.

**Isolasi wilayah** diuji terpisah: pimpinan wilayah dari wilayah lain membuka artikel,
pratinjau artikel, dan pengaduan milik wilayah 13 → ketiganya **404 netral tanpa isi**
(bukan 403, agar keberadaan berkas tidak bocor).

## 4. C2 — interaksi: klik semua elemen, ketik penuh semua kolom

`skrip/uji-c2-interaksi.mjs` → `c2-interaksi-lokal.txt` — **24 pemeriksaan, 0 gagal**

22 halaman (10 publik, 12 staf). Di tiap halaman setiap tautan internal, tombol,
tab/pil, dan `summary` yang tampak diklik sungguhan lewat peristiwa tetikus; tautan
navbar/footer/sidebar yang berulang cukup diklik sekali. Tombol destruktif
(Hapus/Keluar/Paksa keluar/Reset/Terbitkan/Kirim/Simpan/Arsipkan) **tidak** dijalankan
dan dicatat sebagai dilewati. Setiap kolom teks diketik penuh 40 karakter berisi tanda
kutip, `<b>`, `&`, `%`, dan angka; nilai dan fokus diperiksa setiap 8 karakter.

Hasil penting:
- **`/staf/pengurus`: 118 klik, 40 tombol destruktif dilewati, 0 galat konsol** —
  inilah halaman yang sebelum diperbaiki crash pada klik pertama;
- 44 kolom di seluruh halaman menerima ketikan utuh, fokus tidak pernah lepas
  (gejala "input satu huruf" yang dilaporkan pemilik tidak tereproduksi di mana pun);
- editor artikel (area `contentEditable`): ketikan menyambung di akhir isi lama tanpa
  merusaknya; paragraf penampung memang diganti saat kolom difokuskan, sesuai rancangan;
- **tombol kirim dinonaktifkan saat proses** dan **klik ganda cepat hanya menghasilkan
  satu permintaan**, dibuktikan pada dua formulir yang benar-benar mengirim: login
  (1 permintaan, pesan galat netral tampil) dan pengaduan (1 POST, satu nomor kasus).

## 5. C3 — alur ujung ke ujung

| Berkas | Cakupan | Hasil |
|---|---|---|
| `c3a-lampiran-lokal.txt` | Lima jenis lampiran yang dijanjikan (JPG, PNG, WebP, PDF, MP4); batas 5 berkas, 20 MB/berkas, 40 MB total; berkas palsu (EXE & SVG bernama .jpg/.png); pembatas laju 10 kiriman/jam per IP | 12 langkah LULUS |
| `c3b-kembali-muatulang-lokal.txt` | Tombol kembali dan muat ulang di tengah formulir | 11 langkah LULUS |
| `c3c-alur-qa2-lokal.txt` | Alur untuk yang baru di QA-2: kelompok pengurus, pratinjau artikel, alamat lewat Pengaturan, galeri foto, aturan K2 pada halaman terender | 11 langkah LULUS |
| `c3d-aksi-end-to-end-lokal.txt` | 25 aksi utama: login 5 peran + keluar, pengaduan anonim/bernama/berlampiran, lacak, CRUD artikel–pengurus–program–galeri, siklus pengguna, pengaturan | 25 langkah LULUS |

Rincian yang layak disebut:

- **Lampiran.** Tiap lampiran yang tersimpan dibuka kembali oleh verifikator: 200,
  `content-type` benar, `nosniff`; tanpa sesi **401**. Lima berkas sekaligus diterima;
  berkas keenam ditolak 422 **tanpa membuat pengaduan baru** (jumlah pengaduan tetap).
  Berkas 21 MB → 413; total 45 MB → 413; EXE dan SVG yang menyamar → 415 (magic bytes).
- **Pembatas laju.** 10 kiriman dari satu IP semuanya 201, kiriman ke-11 → 429 dengan
  pesan yang **tidak menyalahkan pelapor** ("Ini pengaman otomatis, bukan penolakan
  laporan Anda…") beserta sisa waktu; IP lain **tidak** ikut terkunci.
- **Tombol kembali.** Mengganti filter memakai `router.replace` (sengaja: agar mencoba
  beberapa filter tidak menumpuk puluhan entri riwayat). Yang penting dan terbukti
  benar: gulir tidak melompat saat filter berlaku (300 → 300, 400 → 400, 0 → 0), dan
  membuka halaman rinci **dari daftar yang tersaring** lalu menekan kembali
  mengembalikan daftar **lengkap dengan filternya** — di `/berita`
  (`?kategori=investigasi`), `/staf/artikel` (`?status=terbit`), dan `/staf/pengaduan`
  (`?status=baru`).
- **Muat ulang di tengah formulir.** Formulir pengaduan diisi separuh lalu dimuat ulang:
  halaman utuh, token formulir **diperbarui**, kolom bersih, konsol bersih. Setelah
  kiriman berhasil, menekan tombol kembali **tidak** mengirim ulang (jumlah pengaduan
  tetap). Editor artikel diisi lalu dimuat ulang: pulih utuh tanpa galat.
- **Pratinjau artikel.** Draf 200 untuk penulisnya dan untuk redaktur, **307 ke
  `/tanpa-akses`** untuk penulis lain, **307 ke `/login`** tanpa sesi (Location tanpa
  `0.0.0.0`), dan **404 di jalur publik** — draf tidak pernah bocor.

## 6. C4 — daftar bug ditemukan → diperbaiki → diuji regresi

Bukti rinci: `c4-temuan-kelola-pengurus-crash.txt`, `c3-temuan-badan-permintaan-10mb.txt`,
`c4-temuan-struktur-tanpa-kelompok.txt`, `c4-xff-pembatas-laju-produksi.txt`.
Regresi: `c4-regresi-bug-lokal.txt` (11 langkah LULUS) dan
`c4-ketahanan-peladen-lokal.txt` (5 langkah LULUS).

### Bug 1 — formulir Kelola Pengurus crash (KRITIS)
`components/staf/KelolaPengurus.js` baris 309 memakai `disabled={memuat}`, padahal state
di komponen itu bernama `sibuk`. Salah nama hanya meledak **saat formulir dirender**,
yaitu ketika "Tambah Pengurus" atau "Ubah" ditekan — jadi lolos build, lolos lint, dan
lolos seluruh uji yang tidak menekan tombol itu.
**Perbaikan:** `disabled={sibuk}`.
**Perbaikan penyebab:** `eslint.config.mjs` menyalakan `no-undef` untuk `app/`,
`components/`, `lib/`, `scripts/`, `server.js`, `proxy.js`, dengan daftar global ditulis
tangan supaya **tidak menambah paket npm** di luar cetak biru bagian 4. Dibuktikan dua
arah: dengan bug dikembalikan lint melaporkan
`components/staf/KelolaPengurus.js 309:180 error 'memuat' is not defined no-undef`;
setelah diperbaiki lint bersih (exit 0).
**Regresi:** C2 dijalankan ulang — 118 klik di `/staf/pengurus`, 0 galat; dan di
**produksi** tombol "Tambah Pengurus" diklik lewat Chrome: formulir terbuka lengkap
dengan kolom nama dan select "Kelompok Bagan", 0 galat konsol.
**Bukti pemakaian nyata:** `audit_log` produksi menunjukkan **pemilik sendiri** masuk sore
itu juga dan benar-benar memakai Kelola Pengurus sesudah perbaikan dipasang —
`pengurus_ubah` 17:46:37, 17:47:52, 17:49:03; `pengurus_hapus` 17:43:20; delapan
`pengurus_urutan` (menyusun ulang bagan) antara 17:41 dan 17:46 WIB. Sebelum perbaikan
seluruh aksi itu mustahil dilakukan karena formulirnya tidak pernah terbuka.

### Bug 2 — lampiran dan unggahan 10–20 MB ditolak "Muatan tidak sah"
Next.js 16 memotong badan permintaan yang melewati `proxy.js` pada 10 MB (bawaan
`experimental.proxyClientMaxBodySize`). Karena `proxy.js` berjalan untuk seluruh `/api/*`,
badan multipart terpotong sebelum route membacanya, `request.formData()` gagal, dan route
membalas 400 generik. Reproduksi: JPEG **sah** 16,04 MB → `400 MUATAN_TIDAK_SAH`.
**Perbaikan:** `next.config.mjs` → `experimental.proxyClientMaxBodySize = '44mb'`, sedikit
di atas batas aplikasi sendiri (40 MB total + 2 MB kelonggaran yang sudah diperiksa route
lewat `Content-Length`), sehingga penolakan berkas terlalu besar tetap datang dari route
dengan 413 dan pesan jelas, bukan pemotongan diam-diam.
Alternatif "keluarkan `/api/pengaduan` dari matcher proxy" **ditolak**: `proxy.js`
menghapus header `x-user-id`/`x-user-role` kiriman klien (pertahanan berlapis) dan
menyetel `x-jalur`; melubangi matcher pada jalur yang menerima unggahan publik
menghilangkan lapisan itu.
**Regresi (lokal):** JPG 16 MB → 201, tersimpan sebagai gambar sah 1920×1440 (dikompres
ulang sharp sesuai rancangan Tahap 5); MP4 15 MB dan PDF 14 MB → 201, tersimpan
**byte per byte identik**; galeri video MP4 15 MB → 201; batas atas tetap dijaga route
(21 MB → 413, total 45 MB → 413); unggahan gambar artikel 2,5 MB → 201 dan 16 MB → 413
"Ukuran berkas melebihi batas 5 MB" (batas 5 MB untuk gambar artikel memang disengaja
dan tertulis di desain, bukan akibat pemotongan).
**Regresi (produksi):** pengaduan anonim dengan JPG 16 MB + MP4 15 MB → 201, staf membuka
keduanya (0,92 MB hasil kompresi + 15,00 MB utuh), tanpa sesi 401, `anonim=1` dengan
empat kolom identitas NULL.

### Bug 3 — pengurus "Tanpa kelompok" hilang dari halaman publik
`app/(publik)/struktur/page.js` menyaring bagian Pimpinan Regional dengan
`p.tingkat === 'wilayah'`, padahal komentar di baris itu sendiri berbunyi "+ pengurus
tanpa kelompok" dan pilihan di Kelola Pengurus berlabel "Tanpa kelompok (Pimpinan
Regional)". Pengurus tingkat pusat tanpa kelompok karena itu tidak masuk blok kelompok
mana pun **dan** tidak masuk Pimpinan Regional.
**Perbaikan:** saringan menjadi
`!/^dp[wdc]$/.test(p.kelompok || '') && (p.tingkat === 'wilayah' || !p.kelompok)`.
**Regresi:** pengurus pusat tanpa kelompok tampil di bagian Pimpinan Regional; pengurus
wilayah tanpa kelompok tetap tampil (perilaku lama tidak berubah); kerangka DPW/DPD/DPC
tidak bocor ke bagian regional; filter `?wilayah=` dan `?tampilan=peta` tetap bekerja;
keadaan kosong benar saat belum ada pengurus berwilayah. Diverifikasi juga di produksi.

### Bug 4 — satu galat di jalur permintaan mematikan seluruh peladen
Saat C2 berjalan, peladen lokal mati sendiri:
`⨯ uncaughtException: TypeError: Invalid state: Controller is already closed
(ERR_INVALID_STATE)`. `server.js` tidak memasang penjaga proses sama sekali, jadi satu
galat aliran yang sebenarnya tidak berbahaya (aliran balasan memang sudah selesai)
menjatuhkan situs publik dan ruang staf sekaligus. `next start` memasang penjaga serupa;
peladen kustom ini tidak.
**Perbaikan (`server.js`):**
`uncaughtException`/`unhandledRejection` — galat aliran/koneksi yang sudah diketahui aman
(`ERR_INVALID_STATE`, `ERR_STREAM_PREMATURE_CLOSE`, `ERR_STREAM_DESTROYED`, `ECONNRESET`,
`EPIPE`, `ERR_HTTP_HEADERS_SENT`) **dicatat lalu peladen terus melayani**; galat lain
dicatat lalu keluar dengan kode 1 supaya Docker/Coolify menyalakan ulang container dalam
keadaan bersih. Ditambah penjaga `clientError` (permintaan HTTP cacat tidak menjatuhkan
peladen) dan penutupan rapi `SIGTERM`/`SIGINT` (permintaan yang sedang berjalan, misalnya
pengaduan 20 MB, diberi waktu sampai 20 detik saat redeploy). Pesan galat hanya memuat
nama, kode, dan baris pertama tumpukan — **tidak pernah isi permintaan**.
**Regresi (lokal, `c4-ketahanan-peladen-lokal.txt`):** badan 50 MB dan 60 MB → 413,
peladen hidup; unggahan sah 15 MB diputus klien pada 60/150/400/900 ms → peladen hidup di
setiap kasus; empat bentuk permintaan HTTP cacat lewat soket mentah (baris permintaan
rusak, header rusak, `Content-Length` bohong, badan terpotong) → dua dibalas
`400 Bad Request`, dua ditutup, peladen hidup; 40 permintaan serentak → semua terjawab.
**Bukti di PRODUKSI** (`c5-verifikasi-produksi.txt`): log container menunjukkan penjaga
bekerja — `[warkop] clientError kode=ECONNRESET`, `[warkop] clientError
kode=HPE_INVALID_EOF_STATE` — dan container tetap `Up … (healthy)`, `/api/health` sehat,
`staf.warkopnusantara.id/login` 200.

### Bug 5 — penjaga em-dash memberi peringatan palsu pada berkas CRLF
`scripts/penjaga-dash.mjs` membuang komentar SQL dengan `/--.*$/`. Pada berkas berakhiran
CRLF, titik dalam regex JavaScript tidak pernah cocok dengan carriage return, sehingga
komentar tidak terbuang dan 18 baris komentar SQL yang memang boleh memuat em dash
dilaporkan sebagai pelanggaran.
**Perbaikan:** `\r` dibuang lebih dulu. **Dibuktikan masih menangkap pelanggaran
sungguhan** pada berkas CRLF yang sama (`('kontak_email_uji—dash', …` → exit 1), dan
bersih setelah berkas dipulihkan.

### Bukan cacat, sudah diperiksa
- **Pembatas laju vs `X-Forwarded-For` palsu di produksi.** Dugaan: pembatas laju
  memercayai header kiriman klien, sehingga bisa dilewati. 61 permintaan baca-saja dengan
  XFF berbeda-beda, satu kontrol tanpa header, lalu XFF palsu baru sesudah kuota habis →
  tetap 429. Traefik menimpa `X-Forwarded-For`, **tidak bisa dilewati dari internet**.
  Syarat yang harus dijaga: port aplikasi (3000) tidak boleh terbuka langsung ke internet
  — sudah ada di daftar tindakan pemilik.
- **Penghapusan akun staf ditolak `409` bila akun sudah punya jejak audit** — disengaja
  demi keutuhan buku besar; akun dinonaktifkan, bukan dihapus.
- **Kiriman jauh di atas batas berakhir 499/504 di produksi**, bukan 413 seperti di
  lokal: route sudah menolak sementara klien masih mengirim badan. Formulir pengaduan
  sudah memvalidasi ukuran di sisi klien, jadi pelapor lewat antarmuka tidak akan sampai
  ke keadaan ini.

## 7. C5 — regresi penutup dan verifikasi produksi

| Uji | Berkas | Hasil |
|---|---|---|
| Pagar peran: 47 metode API × 6 identitas | `c5-regresi-b1.txt` | **246 pemeriksaan, 0 gagal** |
| Kesetiaan 14 layar desain | `c5-regresi-kesetiaan-14-layar.md` | 14 layar HTTP 200, **sisa cacat export 0** |
| Penjaga em/en dash (kode, seed, migrasi, DB lokal) | `c5-penjaga-dash.txt` | bersih, exit 0 |
| `npm run lint` (kini termasuk `no-undef`) | `c5-lint.txt` | bersih, exit 0 |
| `npm run build` | `c5-build.txt` | Compiled successfully |
| Verifikasi akhir di domain produksi | `c5-verifikasi-produksi.txt` | **9 langkah, 0 gagal** |

**Selisih kesetiaan terhadap RUN QA-1** (semuanya akibat perubahan yang diperintahkan
pemilik, cacat export tetap 0 di seluruh layar):

| Layar | QA-1 | QA-2 | Sebab |
|---|---|---|---|
| beranda | 97 % | 96 % | kolom segel hero (B2) menambah markup di luar desain |
| struktur | 90 % | 84 % | halaman ditulis ulang mengikuti struktur DPP asli pemilik (B5); kelas kartu desain lama tidak lagi dipakai seluruhnya |
| galeri | 93 % | 88 % | butir video diubah menjadi foto (B7), sehingga markup pemutar video pada desain tidak lagi dirender |

Sebelas layar lain tidak berubah.

**Verifikasi akhir di domain produksi** (uji lengkap yang menulis data dijalankan pada
image `3c34e9d`; pemeriksaan penutup baca-saja diulang pada image final `f3e2833`,
`c5-verifikasi-produksi-final.txt` — uji yang menulis TIDAK diulang karena audit_log
menunjukkan pemilik sedang bekerja di ruang staf saat itu):
`/api/health` sehat dengan zona waktu `+07:00`; pemisahan host dua arah dengan `Location`
tanpa `0.0.0.0`; CSP tanpa `unsafe-eval`, HSTS `preload`, `X-Frame-Options: DENY`,
`nosniff`; formulir Kelola Pengurus terbuka tanpa galat; lampiran 16 MB dan 15 MB
diterima dan terbaca staf sementara jalur publiknya 401; pengurus tanpa kelompok tampil
di bagian Pimpinan Regional; situs tetap hidup sesudah kiriman raksasa, unggahan terputus,
dan soket HTTP cacat; 11 halaman publik 0 em/en dash. Seluruh data uji dibersihkan:
pengaduan uji dihapus lunak (dilacak → 404), akun staf sementara dinonaktifkan dan
sesinya dipaksa keluar (login → 401, sesi lama → 401).

## 8. Yang TIDAK diuji (jujur)

- **Safari (iOS/macOS), Firefox, Chrome Android**: tidak tersedia di lingkungan ini.
  Seluruh uji peramban memakai Chrome headless dengan emulasi 375/768/1280.
- **Lighthouse Performance** tidak dijalankan ulang pada run ini; temuan Tahap 9 masih
  berlaku (70–77, di bawah 90, karena font Fira Sans belum disubset — keputusan pemilik).
- **Penjaga `uncaughtException`** tidak berhasil dipicu sesuai permintaan (satu-satunya bagian penjaga proses yang belum terbukti langsung): kejadian aslinya
  tidak dapat direproduksi. Yang terbukti adalah jalur `clientError` (di lokal **dan** di
  log produksi) serta ketahanan peladen terhadap seluruh pemicu nyata yang dicoba.
  Penutupan rapi `SIGTERM` **sudah terbukti di produksi** pada redeploy berikutnya: log
  container lama diikuti dengan `docker logs -f` sehingga baris terakhirnya sempat terbaca
  sebelum Coolify membuang container:
  `[warkop] SIGTERM diterima: menutup peladen, menunggu permintaan berjalan selesai (maks 20 s)`
  lalu `[warkop] peladen ditutup rapi`, sementara container baru naik HEALTHY dan
  `/api/health` 200.
- **Bagian "Pimpinan Regional" di /struktur sekarang kosong** karena susunan DPP belum
  memuat pengurus dengan wilayah. Filter wilayah dan tampilan peta tetap diuji dengan
  membuat satu pengurus berwilayah sementara, lalu dihapus.

## 9. MENUNGGU PEMILIK (baru dari RUN QA-2)

1. ~~Selesaikan pemulihan akun superadmin (B0d).~~ **SUDAH SELESAI oleh pemilik** saat
   run ini berlangsung: `users` id 1 kini `wajib_ganti_sandi=0`, `token_version=3`,
   terakhir masuk 4 Sep 2026 17:37:59 WIB, dan sandi sementara di `.env.produksi` sudah
   tidak berlaku (login dengan nilai itu → 401). Nilai `SEED_ADMIN_PASSWORD` di
   `.env.produksi` boleh dihapus/diganti agar tidak menyesatkan.
2. **Isi DPW/DPD/DPC beserta wilayahnya** lewat Kelola Pengurus agar bagian "Pimpinan
   Regional" dan tampilan peta di `/struktur` terisi. Perlu keputusan: apakah pengurus
   DPW/DPD/DPC yang sudah punya wilayah juga ingin muncul di bagian Pimpinan Regional dan
   di peta, atau cukup di blok kerangkanya masing-masing (perilaku sekarang).
3. **Akun staf seed di produksi semuanya nonaktif** (redaktur, penulis, verifikator,
   pimpinan wilayah). Aktifkan dan setel sandinya bila pengurus sungguhan akan memakainya.
4. Butir yang masih terbuka dari RUN QA-1 dan Tahap 9 tetap berlaku: foto sungguhan
   pengganti penampung, subset font (Performance ≥ 90), volume Coolify untuk lampiran
   pengaduan, pengerasan firewall, rotasi rahasia, proxy Cloudflare, dan cadangan berkala.
   Daftar lengkapnya ada di `laporan/STATUS.md`.

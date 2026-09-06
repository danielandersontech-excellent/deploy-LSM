# LAPORAN RUN QA-5 (mini) - WARKOP NUSANTARA

Mode: OTONOM. Perintah: "TATA LETAK PIRAMIDA BAGAN /struktur" (KEPUTUSAN PEMILIK, dasar kesetiaan diperbarui + alasan).
Mulai 6 September 2026 sekitar 10:05 WIB, selesai 6 September 2026 (jam penutupan di STATUS.md).
Produksi akhir: lihat bagian RUN QA-5 di `laporan/STATUS.md` (hash image + bukti redeploy `laporan/bukti-server/24-*`).
Semua bukti ada di `laporan/bukti-qa-5/` (skrip di `skrip/`, tangkapan di `tangkapan/`).

## 1. Ringkasan

| Butir | Hasil | Bukti utama |
|---|---|---|
| 1 Piramida per blok berdasarkan kolom urutan | SELESAI: komponen `Piramida` + `susunPiramida` di `app/(publik)/struktur/page.js`; Pengurus DPP = Ketua Umum puncak (kartu Pimpinan Pusat desain), Wakil tengah di bawahnya, Sekjen kiri + Bendahara kanan | `4-uji-piramida-lokal.txt`, `tangkapan/sesudah-dpp-1280.png` |
| 2 Berlaku untuk semua blok + tiap bagian Direktorat; blok 1-2 kartu wajar; celah urutan dilewati; "(Belum terisi)" ikut aturan | SELESAI: Dewan Pembina/Penasehat/Pengawas, Pengurus DPP, Satgas, 12 bagian Direktorat; kasus uji lokal Penasehat 5 orang (1-1-3), Pengawas urutan 1,3,4 (1-2, baris kedua dilewati), Investigasi 5 orang (1-1-2-1), Satgas 6 orang (1-1-3-1), bagian kosong (1) | `4-uji-piramida-lokal.txt` (201 butir LULUS), `tangkapan/sesudah-*-1280.png` |
| 3 Responsif: < md menumpuk urut; tanpa gulir mendatar 375/768/1280; token/kelas desain yang sudah ada | SELESAI: 375 satu kolom urut + garis tersembunyi (diperiksa terprogram); gulir mendatar 0 pada 3 lebar; hanya kelas yang sudah ada di desain/halaman | `4-uji-piramida-lokal.txt`, `tangkapan/sesudah-*-375.png` |
| Penutup: tangkapan sebelum/sesudah per kelompok 1280 + 375 | ADA: 4 kelompok x 2 lebar x sebelum/sesudah (+ DPP 768) | `1-tangkapan-sebelum-lokal.txt`, `tangkapan/` |
| Penutup: sapu konsol /struktur 3 lebar | LULUS: galat konsol 0, permintaan >= 400 0, gulir mendatar 0, tumpang tindih 0, dash 0 pada 375/768/1280; regresi sapu QA-4 69 sel 0 gagal | `4-uji-piramida-lokal.txt`, `7-sapu-konsol-regresi-lokal.txt` |
| Penutup: penjaga dash, build, lint | bersih / EXIT 0 / EXIT 0 | `3-penjaga-dash.txt`, `2-build-sesudah.txt`, `6-lint.txt` |
| Penutup: kesetiaan layar struktur (dasar diperbarui + alasan) | 14 layar HTTP 200, cacat export 0; struktur_organisasi 84% (146/173), 27 kelas hilang, IDENTIK dengan dasar QA-4 (susunan berubah tanpa kelas desain baru/hilang); alasan struktural di bagian 5 | `5-kesetiaan-14-layar.md`, `5-kesetiaan-selisih-qa4-qa5.txt` |
| Penutup: commit, push, redeploy, verifikasi produksi, STATUS | lihat STATUS.md bagian RUN QA-5 | `laporan/bukti-server/24-*`, `8-uji-piramida-produksi.txt` |

## 2. Berkas dibuat/diubah

Kode (satu berkas):
- `app/(publik)/struktur/page.js` — komponen `Piramida`, fungsi `susunPiramida`, kelas susunan/baris piramida; blok Dewan
  menjadi satu kolom penuh, blok bagian Direktorat dua kolom di `lg`, Satgas dari grid menjadi piramida, Pengurus DPP
  memakai piramida (puncak = kartu Pimpinan Pusat desain) dan tidak lagi menebak Ketua Umum dari teks jabatan;
  `KartuAnggota` menerima `kelasTambahan`; atribut `data-piramida`/`data-per-baris`/`data-baris`/`data-garis`/`data-urutan`
  untuk uji. DPW, Koordinator Daerah, filter wilayah, tampilan peta tidak disentuh.

Bukti (`laporan/bukti-qa-5/`):
- `skrip/data-uji-lokal.sql` — data uji LOKAL (salinan 20 baris pusat produksi + 16 baris uji id 901-916, nama fiktif "Uji ...").
- `skrip/uji-qa5-struktur.mjs` — tangkapan per kelompok, pemeriksaan geometri piramida (bentuk baris dibandingkan HARAPAN per
  data, bukan dengan kode itu sendiri), sapu konsol 3 lebar. Dipakai lokal (`--harapan=lokal`) dan produksi (`--harapan=produksi`).
- `skrip/selisih-kesetiaan.mjs` — selisih dua keluaran uji kesetiaan 14 layar.
- `0-build-sebelum.txt`, `0-data-uji-lokal.txt`, `1-tangkapan-sebelum-lokal.txt`, `2-build-sesudah.txt`, `3-penjaga-dash.txt`,
  `4-uji-piramida-lokal.txt`, `5-kesetiaan-14-layar.md`, `5-kesetiaan-selisih-qa4-qa5.txt`, `6-lint.txt`,
  `7-sapu-konsol-regresi-lokal.txt`, `8-uji-piramida-produksi.txt`, `tangkapan/{sebelum,sesudah,produksi}-{dewan,dpp,direktorat,satgas}-{1280,375}.png` (+ dpp-768).

`package.json` TIDAK berubah. Tidak ada migrasi basis data; data produksi tidak disentuh (hanya SELECT).

## 3. Aturan piramida yang diterapkan (`susunPiramida`)

Anggota satu blok diurutkan menurut kolom `urutan` lalu nama, dan peringkat dihitung **di dalam blok**:

1. kartu pertama = puncak, sendiri di baris pertama, di tengah;
2. kartu kedua = sendiri di baris kedua, di tengah, tepat di bawah puncak, **hanya bila nomor urutannya persis puncak + 1**;
   celah nomor (contoh Pengawas uji: 1, 3, 4) berarti posisi kedua kosong, baris kedua dilewati dan 3, 4 berjajar;
3. sisanya berjajar kiri ke kanan urut nomor, 3 kartu per baris pada blok selebar kontainer (Dewan, Pengurus DPP, Satgas) dan
   2 kartu per baris pada blok bagian Direktorat (dua blok berdampingan di `lg`); baris terakhir yang tidak penuh tetap di tengah;
4. antar baris ada garis penghubung desain `w-px h-12 bg-outline-variant hidden md:block` (tersembunyi di bawah `md`).

Blok 1 kartu = puncak saja; 2 kartu = puncak + tengah bawah. Bagian Direktorat tanpa pejabat dirender "(Belum terisi)" sebagai
puncak (aturan sama). Di bawah `md` setiap baris menjadi kolom sehingga seluruh kartu menumpuk urut nomor.

Mengapa peringkat dalam blok dan bukan nilai harfiah 1/2: Kelola Pengurus menomori kolom `urutan` secara **global se-tingkat**
(tombol ▲▼ menyimpan 1..n untuk seluruh daftar; urutan bawaan pengurus baru = terbesar se-tingkat + 1), sedangkan pemilik
mengisi nomor per kelompok di produksi (DPP 1-4, Pembina 1-2, Humas 1-2). Aturan "puncak + 1" bekerja pada kedua pola.

## 4. Hasil uji

### 4.1 Geometri piramida lokal (`4-uji-piramida-lokal.txt`) — 201 butir LULUS, 0 GAGAL

Pada 1280 dan 768 untuk 18 blok (3 Dewan + DPP + 12 bagian + Satgas): urutan kartu dalam DOM menaik; bentuk baris = harapan
data (Pembina [1,1], Penasehat [1,1,3], Pengawas [1,2], DPP [1,1,2], Hukum [1], Investigasi [1,1,2,1], Humas [1,1], Media [1],
Satgas [1,1,3,1]); baris menumpuk vertikal, tiap baris di tengah blok (toleransi 2 px), kartu kiri -> kanan tidak
bertumpuk dan sejajar atas, baris 1 satu kartu, baris 2 satu kartu tepat di bawah baris 1; garis penghubung = jumlah baris - 1,
tampak, tinggi 48 px, di tengah. Pada 375: semua kartu satu kolom urut, garis tersembunyi. Ketiga lebar: konsol 0, jaringan
>= 400 0, gulir mendatar 0, tumpang tindih 0, dash 0.

### 4.2 Tangkapan (`tangkapan/`)

| Kelompok | Sebelum 1280 | Sesudah 1280 | Sebelum 375 | Sesudah 375 |
|---|---|---|---|---|
| Dewan | 3 blok berdampingan, kartu berderet ke bawah | 3 blok bertumpuk, tiap blok piramida | satu kolom | satu kolom urut |
| Pengurus DPP | Ketua Umum + grid 3 rata | Ketua Umum, Wakil tengah, Sekjen kiri + Bendahara kanan | satu kolom | satu kolom urut |
| Direktorat | grid 3 kolom, kartu berderet | grid 2 kolom, tiap bagian piramida (Investigasi 1-1-2-1) | satu kolom | satu kolom urut |
| Satgas | grid 3 rata | Kasatgas, Wakil, 3 komandan, anggota | satu kolom | satu kolom urut |

Tinggi halaman /struktur lokal (data uji, 37 kartu pusat) 1280: 7598 -> 10330 px; 375: 16920 -> 16884 px.

### 4.3 Regresi

- Kesetiaan 14 layar lokal (`5-kesetiaan-14-layar.md`): HTTP 200 semua, cacat export 0 semua; selisih terhadap dasar QA-4 =
  0 layar berubah (`5-kesetiaan-selisih-qa4-qa5.txt`).
- Sapu konsol QA-4 semua halaman (`7-sapu-konsol-regresi-lokal.txt`): 69 sel, 0 gagal.
- Penjaga dash bersih; lint EXIT 0; build EXIT 0 (`2-build-sesudah.txt`).

### 4.4 Produksi (`8-uji-piramida-produksi.txt`, `tangkapan/produksi-*`)

Dijalankan setelah redeploy dengan `--harapan=produksi` (data pemilik: Pembina [1,1], Penasehat [1], Pengawas [1], DPP [1,1,2],
Humas [1,1], Satgas [1]). Hasil di STATUS.md bagian RUN QA-5.

## 5. Kesetiaan layar struktur_organisasi — dasar diperbarui, alasan

Uji kesetiaan menghitung kelas desain yang ada/hilang; hasilnya identik dengan dasar QA-4 (84%, 27 kelas hilang dengan
alasan lama tetap berlaku, cacat export 0). Yang berubah adalah **susunan DOM**, dan dasar visual diperbarui dengan alasan:

| Bagian desain (`struktur_organisasi/code.html`) | Sebelum QA-5 | Sesudah QA-5 | Alasan |
|---|---|---|---|
| "Hierarchical Section": kartu Pimpinan Pusat -> garis `w-px h-12` -> kartu Dewan Eksekutif | dipakai untuk Pengurus DPP saja (kartu Ketua Umum + grid `md:grid-cols-3` kartu lain) | pola yang sama (kolom `flex flex-col items-center gap-12`, garis, kartu) menjadi komponen `Piramida` dan dipakai pada semua blok | KEPUTUSAN PEMILIK QA-5; markup dan kelas kartu, garis, kolom verbatim desain; perubahan 18.2 (e) elemen berulang lewat `.map()` |
| Grid kartu regional `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter` | dipakai untuk blok Dewan/bagian/Satgas dan DPW/Korda | tetap dipakai DPW/Korda; blok Dewan `grid-cols-1`, bagian Direktorat `lg:grid-cols-2`, Satgas piramida | agar tiap baris berjajar (2-3 kartu) punya ruang; kelas `grid-cols-1`, `lg:grid-cols-2`, `gap-gutter` semuanya sudah ada di desain |
| Baris kartu berjajar | grid rata | `flex flex-col items-center md:flex-row md:items-stretch md:justify-center gap-gutter w-full` dengan kartu `w-full max-w-md` | "seimbang": baris terakhir yang tidak penuh tetap di tengah; semua kelas sudah ada di desain (`flex`, `flex-col`, `items-center`, `md:flex-row`, `justify-center`, `gap-gutter`, `w-full`, `max-w-md`); `md:items-stretch` dan `md:justify-center` adalah varian responsif kelas desain yang sama |

## 6. KEPUTUSAN BARU

1. **Peringkat dalam blok + aturan "puncak + 1"** untuk baris kedua (bagian 3), karena kolom `urutan` bernomor global oleh
   Kelola Pengurus dan per kelompok oleh pemilik.
2. **Kartu puncak memakai jenis kartu bloknya** (kartu kecil di Dewan/Direktorat/Satgas; kartu Pimpinan Pusat hanya untuk
   puncak Pengurus DPP seperti desain). "Gaya kartu Pimpinan Pusat" dibaca sebagai penempatan (sendiri, di tengah, garis ke
   bawah), bukan mengganti semua kartu puncak menjadi kartu besar berlencana "Pimpinan Pusat" (lencana itu bermakna Ketua Umum).
3. **Lebar blok**: Dewan satu kolom penuh (3 per baris), bagian Direktorat dua kolom di `lg` (2 per baris), Satgas selebar
   kontainer (3 per baris). Tiga blok Dewan berdampingan (390 px) tidak cukup untuk 2-3 kartu sebaris.
4. **Jarak**: pada `md` ke atas semua piramida memakai `gap-12` + garis `h-12` verbatim bagian Pimpinan Pusat desain (konsisten
   antar kelompok); di bawah `md` blok berkotak tetap `gap-3` seperti daftar kartunya sebelumnya, Pengurus DPP tetap `gap-12`
   verbatim desain.
5. **Satgas kosong** kini memakai `KeadaanKosong` (sebelumnya grid kosong tanpa pesan); Dewan kosong memakai kartu "(Belum terisi)".
6. Atribut `data-*` pada DOM bagan untuk uji terprogram (tanpa pengaruh tampilan).

## 7. Hal yang sengaja tidak dikerjakan

- DPW dan Koordinator Daerah tetap grid (tidak termasuk perintah; per provinsi umumnya satu kartu).
- Ruang staf Kelola Pengurus tidak diubah; urutan tetap diatur di sana (K3).

## 8. Cara menguji ulang

```powershell
# data uji lokal (HANYA DB lokal)
docker exec -i -e MYSQL_PWD="<MARIADB_ROOT_PASSWORD_LOKAL>" warkop-mariadb mariadb -uroot warkop_nusantara < laporan/bukti-qa-5/skrip/data-uji-lokal.sql
npm run build ; $env:NODE_ENV="production"; Start-Process node server.js
node laporan/bukti-qa-5/skrip/uji-qa5-struktur.mjs http://localhost:3000 sesudah --periksa --harapan=lokal
# produksi
node laporan/bukti-qa-5/skrip/uji-qa5-struktur.mjs https://warkopnusantara.id produksi --periksa --harapan=produksi
node scripts/penjaga-dash.mjs ; npm run lint
```

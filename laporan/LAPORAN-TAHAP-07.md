# LAPORAN TAHAP 07 — RUANG KERJA STAF

Tanggal: 4 September 2026 (00:40 – 01:20 WIB) · Mode: OTONOM · Bukti:
`laporan/bukti-tahap-07/` (skrip yang bisa diulang di `skrip/`, tangkapan di
`tangkapan/`).

## Ringkasan — bacalah ini dulu

Ruang kerja staf lengkap: dashboard sesungguhnya (angka dari DB, grafik 12
bulan termasuk bulan nol, panel & tabel yang menyesuaikan peran lewat satu
peta konfigurasi), sidebar kanonik dengan menu tersaring peran, lima modul
pengelolaan (pengurus dengan urutan, program, galeri grid berpratinjau,
pengguna dengan paksa keluar/reset sandi/perlindungan diri, pengaturan
berdaftar-putih tunggal), halaman ganti sandi wajib, dan 16 route API
berpagar `requireRole`. **Seluruh 17 butir uji LULUS dengan bukti**; uji
"sidebar bukan pagar" 27 kombinasi peran × route = 403 semua; uji daftar
putih pengaturan 70 pemeriksaan lulus; angka dashboard identik dengan kueri
manual; keadaan kosong rapi di 14 halaman.

Migrasi skema pertama setelah produksi berjalan:
`sql/03-users-wajib-ganti-sandi.sql` (kolom `users.wajib_ganti_sandi`),
dijalankan sadar di lokal dan di produksi (`bukti-server/07-migrasi-produksi.txt`).

## 1. Halaman, komponen, dan route API

| Kelompok | Berkas |
|---|---|
| Dashboard | `app/(staf)/staf/dashboard/page.js` (ditulis ulang; `TAMPILAN_PERAN`, `KALIMAT_AUDIT`, waktu relatif) |
| Sidebar | `components/staf/SidebarStaf.js` (Tahap 5, kanonik) — ikon menu Galeri/Pengguna diganti `image`/`account_circle` di `lib/navItems.js` (`photo_library`/`group` tidak ada di 77 ikon) |
| Pengurus | `app/(staf)/staf/pengurus/page.js`, `components/staf/KelolaPengurus.js`; API `app/api/staf/pengurus/route.js`, `[id]/route.js`, `urutan/route.js`; `lib/db/pengurus.js` +`simpanUrutanPengurus` |
| Program | `app/(staf)/staf/program/page.js`, `components/staf/KelolaProgram.js`; API `app/api/staf/program/route.js`, `[id]/route.js` |
| Galeri | `app/(staf)/staf/galeri/page.js`, `components/staf/KelolaGaleri.js`; API `app/api/staf/galeri/route.js`, `[id]/route.js`; `lib/galeriUnggah.js` |
| Pengguna | `app/(staf)/staf/pengguna/page.js`, `components/staf/KelolaPengguna.js`; API `app/api/staf/pengguna/route.js`, `[id]/route.js`, `[id]/paksa-keluar/route.js`, `[id]/reset-sandi/route.js`; `lib/db/users.js` (+`setelUlangSandiOlehAdmin`, `gantiSandiSendiri`, `hitungSuperadminAktif`, `hapusUser`, `ubahEmailUser`, kolom `wajib_ganti_sandi`) |
| Ganti sandi | `app/(staf)/staf/ganti-sandi/page.js`, `components/staf/FormulirGantiSandi.js`, `app/api/staf/ganti-sandi/route.js`, pemaksaan di `components/staf/KerangkaStaf.js` + `app/(staf)/staf/layout.js` |
| Pengaturan | `app/(staf)/staf/pengaturan/page.js`, `components/staf/FormulirPengaturan.js`; API `app/api/staf/pengaturan/route.js`; `lib/validasi/pengaturan.js` |
| Validasi | `lib/validasi/konten.js` (pengurus/program/galeri), `lib/validasi/pengguna.js`, `lib/validasi/pengaturan.js` |
| Statistik | `lib/db/statistik.js` (+`artikelTerbaruDashboard`), `app/api/staf/statistik/route.js` (12 bulan, artikel terbaru, aktivitas) |
| Skema | `sql/03-users-wajib-ganti-sandi.sql` = `database/migrations/20260904-0040-users-wajib-ganti-sandi.sql` |

`package.json` **tidak berubah**.

## 2. Tangkapan dashboard dan sidebar kelima peran (butir c, d)

`tangkapan/dashboard-{superadmin,redaktur,penulis,verifikator,pimpinan_wilayah}.png`
(1280 px, CDP + cookie per peran; `c-d-o-tangkapan-lebar.txt`,
`c-dashboard-peran.txt`, `d-sidebar-peran.txt`):

| Peran | Menu sidebar | Aksi utama | Kartu (Artikel/Masuk/Selesai) | Panel samping | Tabel |
|---|---|---|---|---|---|
| superadmin | Dashboard, Kelola Artikel, Kelola Pengaduan, Pengurus, Program, Galeri, Pengguna, Pengaturan, Keluar | Tulis Artikel Baru | 12 / 5 / 2 | Aktivitas Staf (audit) | Pengaduan Terbaru |
| redaktur | Dashboard, Kelola Artikel, Pengurus, Program, Galeri, Keluar | Tulis Artikel Baru | 12 / 5 / 2 | Draf Menunggu Terbit | Artikel Terbaru |
| penulis | Dashboard, Kelola Artikel, Keluar | Tulis Artikel Baru | 5 (miliknya) / 5 / 2 | Draf Saya | Artikel Terbaru (miliknya) |
| verifikator | Dashboard, Kelola Pengaduan, Keluar | Proses Pengaduan | 12 / 5 / 2 | Menunggu Verifikasi | Pengaduan Terbaru |
| pimpinan_wilayah (13) | Dashboard, Kelola Artikel, Kelola Pengaduan, Pengurus, Program, Galeri, Keluar | — | 3 / 5 / 1 (wilayahnya, di SQL) | Artikel Terbaru wilayah | Pengaduan Terbaru wilayah, tanpa tombol proses |

Menu sesuai matriks REFERENSI 11 (`menuUntukPeran`).

## 3. Tabel uji "sidebar bukan pagar" (butir e) — `e-sidebar-bukan-pagar.md`

27 pasangan peran × route API dari menu yang disembunyikan (redaktur 5,
penulis 8, verifikator 6, pimpinan_wilayah 7 termasuk tulis pada modul
baca-saja) → **403 semua**; tanpa cookie 401; kontrol superadmin 200.

## 4. Uji daftar putih pengaturan (butir g) — `g-daftar-putih-pengaturan.txt`

1. 13 kunci disimpan satu per satu → 200, `tersimpan=[kunci]`.
2. Muat ulang: `GET /api/staf/pengaturan` dan render `/staf/pengaturan`
   memuat 13 nilai baru (8 `value=`, 5 isi `<textarea>`).
3. Nilai asli dipulihkan dan diverifikasi identik.
4. `{"warna_tema":"merah"}` → **422** "Kunci pengaturan 'warna_tema' tidak
   dikenal. Kunci yang diizinkan: …" — campuran kunci sah + asing juga 422
   tanpa simpan sebagian; GET/render sesudahnya tidak memuat kunci itu.
5. `{"statistik_tahun_mengawasi":"lima belas"}` → 422 `TIPE_ANGKA`;
   `{"kontak_email":"bukan-email"}` → 422 `TIPE_EMAIL`; `"3.5"`, `visi:""`,
   muatan `[]` → 422.
70 pemeriksaan LULUS. Uji h (`h-pengaturan-beranda.txt`): 12000 → 12345 →
beranda menampilkan "12.345+" tanpa deploy → dipulihkan.

## 5. Angka dashboard manual vs tampil (butir a) — `a-angka-manual.txt`

| Angka | Kueri manual | Dashboard |
|---|---|---|
| Total artikel | 12 | 12 |
| Artikel bulan ini | 0 | 0 |
| Pengaduan masuk (`status='baru'`, tidak dihapus) | 5 | 5 |
| Laporan selesai | 2 | 2 |

Butir b (`b-tren-12-bulan.txt`): 12 entri `2025-10 … 2026-09` berurutan, 10
bernilai nol tetap ada; wilayah 13: hanya `2026-09`.

## 6. Hasil ketujuh belas butir UJI TAHAP 7

| Butir | Hasil | Bukti |
|---|---|---|
| a. Angka akurat | **LULUS** | `a-angka-manual.txt` |
| b. Grafik 12 bulan | **LULUS** — bulan nol tidak dilewati | `b-tren-12-bulan.txt` |
| c. Dashboard per peran | **LULUS** — 5 tangkapan | `tangkapan/dashboard-*.png`, `c-dashboard-peran.txt` |
| d. Sidebar per peran | **LULUS** — menu = matriks | `d-sidebar-peran.txt` |
| e. Sidebar bukan pagar | **LULUS** — 27 × 403 | `e-sidebar-bukan-pagar.md` |
| f. CRUD lengkap | **LULUS** — pengurus (201/200/urutan/200), program (201/200/422 rentang/200), galeri multipart (201/200/200), pengguna (201/200/reset/paksa/200), pengaturan (13 simpan) | `f-*-crud.txt`, `f-*-render.txt` |
| g. Daftar putih | **LULUS** — bagian 4 | `g-daftar-putih-pengaturan.txt` |
| h. Pengaturan → publik | **LULUS** | `h-pengaturan-beranda.txt` |
| i. Paksa keluar | **LULUS** — cookie B 200 → paksa → 401, `/staf/dashboard` 307 | `i-paksa-keluar.txt` |
| j. Perlindungan diri | **LULUS** — hapus/nonaktif/turunkan diri 422; superadmin terakhir: cabang API ada (`hitungSuperadminAktif`), tidak dapat dipicu dengan sesi sah karena pemanggil selalu superadmin aktif (dicatat) | `j-perlindungan-diri.txt` |
| k. Urutan pengurus | **LULUS** — PATCH urutan → `/struktur` langsung berubah | `k-urutan-struktur.txt` |
| l. Unggahan galeri | **LULUS** — php→415, svg→415, 21 MB→413 (setelah perbaikan pra-cek Content-Length), nama acak hex-32, mode 0644 | `l-galeri-unggahan.txt` |
| m. Nama ikon | **LULUS** — 0 di 10 halaman staf | `m-nama-ikon.txt` |
| n. Kesetiaan dashboard | **LULUS** — cacat 0, 89 % kelas; modul lain informatif vs cetakan, cacat 0 | `n-kesetiaan-*.txt` |
| o. Tiga lebar | **LULUS** — 9 halaman staf × 3 lebar: 0 gulir mendatar halaman; tabel lebar berada di kontainer `overflow-x-auto` (terbaca dengan gulir dalam tabel, tidak terpotong) | `c-d-o-tangkapan-lebar.txt`, `tangkapan/*-375.png` |
| p. Keadaan kosong | **LULUS** — 6 tabel dikosongkan → 8 halaman staf + 6 publik 200 dengan KeadaanKosong, 0 galat; seed dipulihkan | `p-keadaan-kosong.txt` |
| q. Build hijau | **LULUS** | `q-build-hijau.txt` |

## 7. KEPUTUSAN BARU

1. **Halaman tanpa ZIP** (pengurus, program, galeri, pengguna, pengaturan,
   ganti-sandi): cetakan `kelola_artikel_admin` (header, tabel, tombol
   tambah, kaki) + `editor_artikel_admin` (kartu formulir, label mengambang,
   input/select/textarea, kotak unggah, tombol Simpan/Batal) + galeri
   `galeri_dokumentasi` (kartu grid) + checkbox kontak + kartu login
   (ganti-sandi). Formulir inline di atas daftar (bukan Dialog) karena bidang
   banyak; Dialog untuk konfirmasi hapus/paksa keluar/reset sandi.
2. **Urutan pengurus**: tombol ▲▼ per baris (tanpa pustaka drag-and-drop),
   pertukaran hanya dengan tetangga se-tingkat, tiap klik `PATCH /urutan`
   seluruh daftar; API menomori ulang 1..n global (tampilan `/struktur`
   tetap benar karena `ORDER BY tingkat, urutan`).
3. **Dashboard per peran**: satu peta `TAMPILAN_PERAN = {peran: {panel,
   tabel}}` + kamus `PANEL`/`TABEL` (judul, ikon, fungsi muat) — bukan
   tumpukan `if`; superadmin: audit + pengaduan; verifikator: "Menunggu
   Verifikasi" + pengaduan; redaktur: "Draf Menunggu Terbit" + artikel;
   penulis: "Draf Saya" + artikel miliknya; pimpinan_wilayah: artikel wilayah
   + pengaduan wilayah tanpa tombol proses. Pagar kedua di halaman (tabel
   pengaduan tanpa hak → `/tanpa-akses`). Grafik 12 batang `w-1/12` + label
   bulan; status pengaduan `<Lencana>` kanonik; audit → kalimat Indonesia +
   waktu relatif WIB.
4. **Daftar putih pengaturan tidak mungkin terlupa**: `PENGATURAN_DEFINISI`
   satu-satunya sumber — formulir dibangkitkan darinya (tidak ada nama kunci
   ditulis tangan di komponen), `KUNCI_PENGATURAN` = daftar putih di
   `validasiNilaiPengaturan` + lapisan kedua `simpanPengaturan`, tipe →
   validasi (`angka`, `teks` + email, `teks_panjang`), bawaan → seed &
   `ambilPengaturan`, GET memantulkan `definisi` & `daftarPutih` (uji g
   langkah 0 memverifikasi keduanya identik). Kunci asing ditolak 422 dengan
   pesan yang menyebut daftar yang diizinkan; satu kunci salah = seluruh
   kiriman ditolak.
5. **Reset kata sandi + wajib ganti**: kolom baru `users.wajib_ganti_sandi`
   (migrasi 03); reset menaikkan `token_version` (sesi lama batal);
   `KerangkaStaf` mengalihkan semua halaman staf ke `/staf/ganti-sandi`
   sampai pengguna mengganti sandi (`POST /api/staf/ganti-sandi`: sandi lama
   wajib, `token_version` naik, cookie baru diterbitkan).
6. **Perlindungan pengguna**: hapus/nonaktif/turunkan diri sendiri 422;
   superadmin aktif terakhir 422; DELETE dengan data terkait (FK RESTRICT)
   → 409 + saran nonaktifkan (UI menawarkan tombol "Nonaktifkan Saja");
   perubahan peran/nonaktif menaikkan `token_version`; paksa keluar boleh
   pada diri sendiri.
7. **Galeri**: thumbnail video tidak dibangkitkan otomatis (tanpa ffmpeg /
   paket video) — diunggah redaktur, penampung bila kosong; DELETE menghapus
   berkas di disk (perbaikan temuan agen); PATCH selalu mengirim seluruh
   bidang; tanggal DATE dikonversi WIB tanpa zona waktu mesin.
8. Ikon menu `photo_library`/`group` (Tahap 0) → `image`/`account_circle`.
9. Statistik: tren 12 bulan; route statistik menambah `artikelTerbaru` &
   `aktivitas`.

## 8. Temuan & catatan

- `perbaruiProgram` mengganti slug saat judul berubah → jangkar
  `/program#program-<slug>` ikut berubah (tidak ada halaman detail program;
  dicatat, tidak diubah).
- Cabang `SUPERADMIN_TERAKHIR` hanya terpicu bila superadmin lain mencoba
  menonaktifkan superadmin terakhir yang **bukan** dirinya — mustahil
  (pemanggil sendiri superadmin aktif) → pelindung utamanya `DIRI_SENDIRI`;
  cabang tetap dipertahankan untuk kasus DB dimanipulasi.
- Batas praktis `request.formData()` Next 16 ±10 MB: kiriman multipart di
  atasnya kini 413 (pra-cek Content-Length; di atas 9 MB saat urai gagal).
- Tangkapan 375 halaman staf: tabel berada di `overflow-x-auto` (elemen
  melewati tepi kontainer, bukan halaman) — 0 gulir mendatar halaman.
- Uji i "dua peramban" disimulasikan dua cookie (A = korban, B = superadmin).

## 9. Cara menguji ulang

```powershell
cd D:\Deploy\LSM   # dev server: node server.js
bash laporan/bukti-tahap-07/skrip/uji-e-sidebar-bukan-pagar.sh
node laporan/bukti-tahap-07/skrip/uji-g-pengaturan.mjs
bash laporan/bukti-tahap-07/skrip/uji-p-keadaan-kosong.sh
bash laporan/bukti-tahap-07/skrip/uji-cd-o-tangkapan.sh
```

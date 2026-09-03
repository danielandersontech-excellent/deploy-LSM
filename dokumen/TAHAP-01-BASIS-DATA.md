# TAHAP 1 — BASIS DATA

> **Sumber di repo ini:** `CLAUDE.md`, `dokumen/CETAK-BIRU-SISTEM.md`,
> `dokumen/REFERENSI.md`, `dokumen/ALUR-KERJA-CLAUDE-CODE.md`,
> `desain/stitch_portal_berita_inklusif/` (ekstrak `Warkop_Nusantara.zip`),
> `LSM_WARKOP.png`, `paket-pendukung/`
>
> **Bergantung pada:** Tahap 0
> **Rujukan cetak biru:** bagian 7, dan bagian 11 Pelajaran nomor 1 dan 7
> **Rujukan REFERENSI:** 10 (skema), 11 (peran), 14 (aturan 1 dan 7)

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
- Jalankan seluruh butir UJI TAHAP dan laporkan apa adanya. Dilarang
  melaporkan lulus untuk uji yang belum dijalankan.
- Bahasa Indonesia untuk komentar kode, nama tabel, kolom, dan fungsi.
- Tandai KEPUTUSAN BARU secara eksplisit.
- Bila menemukan cacat pada tahap sebelumnya, laporkan. Jangan menambal
  diam-diam.
- Kerjakan LANGSUNG di repo ini. Keluaranmu adalah berkas yang sudah ada di
  tempatnya + laporan/LAPORAN-TAHAP-XX.md + satu commit git. Bukan ZIP.
- desain/ dan paket-pendukung/ adalah SUMBER BACA-SAJA — jangan pernah
  mengubah, memindah, atau menghapus isinya.
- Jangan git push, jangan menyentuh berkas di luar repo ini, jangan memasang
  perangkat global, tanpa diminta pemilik.
```

---

## TUJUAN

Skema basis data dan seluruh lapisan akses data di `lib/db/`.

Dua hal menentukan keberhasilan tahap ini, keduanya dari kesalahan nyata di
Cap Jiki:

**Zona waktu.** Server DB berjalan UTC sedangkan aplikasi memakai WIB. Bila
tidak ditangani, kolom waktu tertinggal 7 jam dan seluruh laporan "hari ini"
salah. Kesalahan ini tidak terlihat sampai sistem berisi data sungguhan.

**Buku besar.** Setiap perpindahan keadaan penting terekam beserta nilai
sebelum dan sesudahnya. Tanpa ini, pertanyaan "kenapa laporan saya ditolak"
tidak bisa dijawab enam bulan kemudian.

---

## PEKERJAAN

### 1. schema.sql

Seluruh tabel sesuai **REFERENSI bagian 10**: `users`, `wilayah`,
`kategori_artikel`, `artikel`, `tag`, `artikel_tag`, `pengaduan`,
`pengaduan_lampiran`, `pengaduan_riwayat`, `pengurus`, `program`, `galeri`,
`pengaturan`, `audit_log`.

Perhatikan tiga kolom kategori (v2.1): `pengaduan.kategori_masalah`,
`program.kategori`, `galeri.kategori` — semuanya `VARCHAR(50)` berisi slug dari
`lib/kategoriPengaduan.js`, `lib/kategoriProgram.js`, `lib/kategoriGaleri.js`
(buat ketiganya di tahap ini; isinya persis tabel di REFERENSI 10). Bukan ENUM,
agar menambah kategori tidak butuh migrasi; validasi nilainya di route API
memakai daftar yang sama.

**Yang wajib ada dan sering terlupa:**

- `users.token_version` — menaikkan angkanya membatalkan seluruh token lama
  pengguna itu (cetak biru bagian 8)
- `pengaduan.anonim` beserta empat kolom identitas yang **semuanya NULLABLE**
- `pengaduan_riwayat.status_sebelum` dan `status_sesudah`

**Indeks yang dipikirkan sejak awal**, bukan menunggu lambat:

```
artikel           : (status, terbit_pada DESC), (slug), (kategori_id), (penulis_id)
pengaduan         : (status, dibuat_pada DESC), (nomor_kasus), (wilayah_id), (petugas_id)
pengaduan_riwayat : (pengaduan_id, dibuat_pada)
audit_log         : (user_id, dibuat_pada), (tabel_terkait, id_terkait)
```

**Foreign key dengan `ON DELETE` yang dipikirkan matang.** Dua yang butuh
keputusan sadar:

- `pengaduan_riwayat.pengaduan_id` — untuk lembaga pengawasan, riwayat yang
  hilang saat pengaduan dihapus adalah masalah serius. Pertimbangkan
  penghapusan lunak (`dihapus_pada`) alih-alih penghapusan sungguhan.
- `artikel.penulis_id` — apa yang terjadi bila akun penulis dihapus? Jangan
  sampai artikel ikut lenyap.

Tandai pilihanmu sebagai **KEPUTUSAN BARU** dengan alasannya.

### 2. Aturan waktu — aturan 1

Bagian paling penting di tahap ini.

- Kolom waktu bertipe **`DATETIME`**, bukan `TIMESTAMP`
- **Jangan** `DEFAULT CURRENT_TIMESTAMP` untuk kolom waktu penting
- `lib/utils.js` menyediakan `waktuSekarang()` yang mengembalikan WIB dalam
  format `YYYY-MM-DD HH:mm:ss`, dipakai di seluruh modul `lib/db/`
- Verifikasi ulang `lib/db/index.js` dari Tahap 0 masih memuat
  `timezone: '+07:00'` dan hook `pool.on('connection')`

### 3. Modul lib/db — satu berkas per domain

**Seluruh SQL di `lib/db/`. Route API tidak pernah menulis SQL sendiri.**

| Berkas | Contoh fungsi |
|---|---|
| `users.js` | `cariUserByEmail`, `ambilUser`, `buatUser`, `naikkanTokenVersion` |
| `artikel.js` | `ambilArtikelTerbit`, `ambilArtikelBySlug`, `buatArtikel`, `perbaruiArtikel`, `terbitkanArtikel`, `naikkanJumlahDibaca` |
| `pengaduan.js` | `buatPengaduan`, `ambilPengaduan`, `ambilPengaduanByNomor`, `ubahStatusPengaduan`, `ambilRiwayat` |
| `pengurus.js`, `program.js`, `galeri.js` | CRUD masing-masing |
| `pengaturan.js` | `ambilPengaturan`, `simpanPengaturan` |
| `wilayah.js` | `ambilSemuaWilayah`, `ambilWilayah` |
| `audit.js` | `catatAudit` |
| `statistik.js` | `hitungStatistikDashboard`, `trenLaporanBulanan` |

**Aturan untuk seluruh modul:**

- Prepared statement (`?`) tanpa kecuali. Tidak ada penggabungan string ke SQL
- Fungsi berwilayah menerima `wilayahId` dan memfilter **di SQL**, bukan
  menyaring hasil di JavaScript
- Fungsi yang mengembalikan pengaduan menerima `bolehLihatIdentitas`. Bila
  `false`, kolom identitas **tidak ikut di-SELECT** — bukan di-SELECT lalu
  dihapus di JavaScript

### 4. Fungsi buku besar — paling kritis

`ubahStatusPengaduan()` harus:

1. Membuka transaksi
2. Membaca status saat ini dengan `SELECT ... FOR UPDATE` (cegah balapan)
3. Memperbarui `pengaduan.status`
4. Menyisipkan `pengaduan_riwayat` berisi `status_sebelum`, `status_sesudah`,
   `catatan`, `oleh_user_id`, `dibuat_pada`
5. Commit — atau **rollback seluruhnya** bila salah satu gagal

**Tidak boleh ada jalan lain mengubah status.** Bila ada fungsi lain yang
menyentuh kolom `status`, itu cacat. Tulis komentar di atas fungsi yang
menjelaskan hal ini, agar pengembang berikutnya tidak tergoda membuat jalan
pintas.

### 5. Nomor kasus

Format `WRP-XXXX` (lihat `kelola_pengaduan_admin/screen.png`: `#WRP-9021`).

Rancang agar unik walau ada dua pengiriman bersamaan, **tidak mudah ditebak
berurutan** (jangan sekadar `id + 9000` — nomor yang bisa ditebak memungkinkan
orang menjelajah laporan orang lain lewat halaman pelacakan), dan tetap pendek
serta mudah dibacakan lewat telepon.

### 6. seed.sql dan scripts/seed.js

- **1 superadmin**, kata sandi dari ENV `SEED_ADMIN_PASSWORD`, di-hash bcrypt.
  **Jangan pernah** memaku kata sandi di kode atau `seed.sql`
- Kategori artikel: Investigasi, Siaran Pers, Opini Publik, Kegiatan Daerah,
  Fasilitas Umum
- Wilayah: seluruh provinsi Indonesia beserta baris `pusat`
- Pengaturan default sesuai angka di `beranda_warkop_nusantara/screen.png`:
  `statistik_laporan_ditangani=12000`, `statistik_provinsi_tercover=38`,
  `statistik_tahun_mengawasi=15`, kontak (`kontak_email`, `kontak_hotline`,
  `kontak_alamat_*` sesuai kartu "Hubungi Kami" di layar kontak), visi, misi,
  dan tiga teks halaman statis (`teks_kebijakan_privasi`,
  `teks_pedoman_komunitas`, `teks_faq`) berisi teks penampung yang sopan
- **12 artikel seed** (KEPUTUSAN PEMILIK, menggantikan "3 artikel contoh"):
  (a) judul, kutipan, kategori, dan label yang TAMPAK di layar desain
  (`beranda_warkop_nusantara`, `daftar_berita_investigasi`,
  `detail_artikel_investigasi`) dipakai **VERBATIM** dari `code.html` untuk
  artikel-artikel pertama — inilah yang membuat tampilan identik dengan ZIP;
  (b) sisanya artikel ORISINAL bergaya sama tentang topik pengawasan publik
  yang faktual secara umum (transparansi APBD, mekanisme lapor pungli, LHKPN,
  pengawasan dana desa, hak atas informasi publik) — **TANPA** nama orang,
  pejabat, perusahaan, atau instansi spesifik, dan TANPA tuduhan kasus nyata;
  (c) **DILARANG** menyalin atau menulis ulang artikel media lain;
  (d) isi utuh beberapa paragraf, gambar penampung lokal, tanggal tersebar
  tiga bulan terakhir, campuran status terbit/draf/arsip untuk kebutuhan uji
  Tahap 5; (e) tulis di laporan: seluruh artikel seed adalah KONTEN CONTOH
  yang wajib ditinjau/diganti redaksi sebelum peluncuran publik
- 3 pengaduan contoh **lengkap dengan riwayat statusnya**
  (satu anonim, dua bernama) — agar Tahap 6 punya data untuk diuji
- 3 program contoh (satu per kategori) dan 6 galeri contoh (dua per kategori)
  dengan gambar penampung lokal — agar Tahap 4 punya data untuk uji kesetiaan

`scripts/seed.js` harus **idempoten**: dijalankan dua kali tidak menggandakan
data.

### 7. database/migrations/README.md

```
Jangan pernah mengubah schema.sql untuk basis data yang sudah berjalan.
Buat berkas migrasi baru: YYYYMMDD-HHmm-penjelasan-singkat.sql

Setiap migrasi:
- Bisa dijalankan ulang tanpa merusak (IF NOT EXISTS bila memungkinkan)
- Menyertakan komentar tentang apa yang diubah dan mengapa
- Diuji di salinan basis data, bukan langsung di produksi

Di server (cetak biru bagian 10):
  sudo docker exec -i <container_db> mariadb -u<user> -p'<sandi>' <db> \
    < migrations/nama-berkas.sql

SELALU jalankan SELECT pemeriksaan sebelum UPDATE atau DELETE.
```

### 8. DATABASE.md

Penjelasan tiap tabel dan kolom, relasi, alasan keputusan penting (pilihan
`ON DELETE`, pola buku besar, format nomor kasus), dan diagram relasi
teks/ASCII.

### 9. Berkas SQL di paket

Taruh di `sql\`:
```
sql\01-schema.sql
sql\02-seed.sql
```
Jalankan keduanya sendiri ke MariaDB lokal (lewat `docker exec` atau klien
`mariadb`), lalu tulis di `PENERAPAN.md` cara menjalankannya di server. Simpan
perintah persisnya di laporan.

---

## UJI TAHAP 1

**a. Skema bersih** — jalankan `schema.sql` di MariaDB kosong, tanpa error.
Jalankan dua kali, laporkan perilakunya.

**b. Seed** — `npm run seed` masuk. Periksa di basis data bahwa kata sandi
**ter-hash bcrypt**, bukan teks polos. Jalankan dua kali, data tidak berganda.

**c. UJI ZONA WAKTU — paling penting.** Ini uji yang menangkap aturan 1.

1. Sisipkan satu baris **dari aplikasi** (lewat fungsi `lib/db`)
2. `SELECT NOW(), @@session.time_zone;`
3. `SELECT dibuat_pada FROM <tabel> ORDER BY id DESC LIMIT 1;`
4. Bandingkan ketiganya dengan jam WIB sebenarnya

Ketiganya harus sama. **Tidak boleh ada selisih 7 jam.** Lampirkan seluruh
keluaran kueri.

**d. UJI BUKU BESAR** — ubah status satu pengaduan tiga kali berturut-turut.
Periksa `pengaduan_riwayat`: ada tiga baris, dan `status_sesudah` baris ke-N
sama dengan `status_sebelum` baris ke-N+1. Lampirkan isi tabelnya.

**e. UJI TRANSAKSI** — simulasikan kegagalan saat menyisipkan riwayat. **Status
pengaduan harus ikut batal.** Lampirkan bukti status tetap seperti semula.

**f. UJI PENYARINGAN IDENTITAS** — panggil dengan `bolehLihatIdentitas: false`,
aktifkan log kueri, periksa **SQL yang benar-benar dijalankan**. Kolom identitas
tidak boleh ikut di-SELECT sama sekali.

**g. UJI PENYARINGAN WILAYAH** — penyaringan harus di klausa `WHERE`. Lampirkan
kueri yang dijalankan.

**h. SQL liar** — telusuri seluruh proyek: tidak boleh ada SQL di luar
`lib/db/`.

**i. Prepared statement** — telusuri template literal berisi variabel di dalam
kueri. Harus nihil. Uji juga aktif: kirim `' OR '1'='1` ke fungsi yang menerima
masukan.

**j. Nomor kasus** — bangkitkan 1000 berturut-turut: tidak ada yang berganda,
tidak mudah ditebak.

**k. Build tetap hijau** — `npm run build` dan `npm run lint` masih berhasil.

---

## BENTUK KELUARAN (Claude Code)

Kerjakan **langsung di repo ini** — tidak ada paket perubahan, tidak ada
apply.ps1. Di akhir tahap:

1. Seluruh berkas tahap ini sudah ada di tempatnya dan `npm run build` hijau.
2. Tulis `laporan/LAPORAN-TAHAP-01.md` (isi sesuai bagian LAPORAN di bawah).
   Bukti uji (keluaran curl, keluaran uji-kesetiaan, tangkapan bila ada) masuk
   `laporan/bukti-tahap-01/` dan dirujuk dari laporan.
3. `git add -A` lalu `git commit -m "Tahap 01: <ringkasan satu baris>"`.
   Jangan push tanpa diminta pemilik.
4. MODE GERBANG: berhenti, tunggu pemilik memeriksa laporan. MODE OTONOM:
   verifikasi gerbang-mandiri (ALUR bagian 7.2), perbarui laporan/STATUS.md,
   lalu langsung lanjut tahap berikutnya.

## LAPORAN — isi `laporan/LAPORAN-TAHAP-01.md`

1. Daftar tabel beserta jumlah kolom dan indeksnya
2. **Diagram relasi antar tabel** (teks/ASCII)
3. Hasil kesebelas butir UJI TAHAP dengan bukti kueri
4. **Bukti uji zona waktu (butir c)** — tampilkan lengkap
5. **Isi `pengaduan_riwayat` setelah uji buku besar (butir d)**
6. **KEPUTUSAN BARU**: pilihan `ON DELETE` per foreign key beserta alasannya,
   dan pendekatan pembangkitan nomor kasus
7. Hal yang sengaja belum dikerjakan

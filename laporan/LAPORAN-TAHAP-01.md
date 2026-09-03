# LAPORAN TAHAP 01 — BASIS DATA

Tanggal: 3 September 2026 · Mode: OTONOM · Bukti: `laporan/bukti-tahap-01/`
(skrip uji yang bisa dijalankan ulang pemilik ada di `laporan/bukti-tahap-01/skrip/`)

## Ringkasan

Skema 14 tabel (REFERENSI 10) berdiri di MariaDB 11.8.9 lokal, seed idempoten
terisi, seluruh lapisan akses data di `lib/db/` dengan prepared statement.
Kesebelas butir UJI TAHAP 1 dijalankan dan **lulus dengan bukti**; dua uji
terpenting: **zona waktu** (NOW(), `@@session.time_zone`, dan `dibuat_pada`
sama persis dengan WIB — selisih 0 detik, diulang dengan `TZ=UTC` pada proses)
dan **buku besar** (rantai `status_sesudah` N = `status_sebelum` N+1 utuh;
kegagalan tulis riwayat membatalkan perubahan status).

## 1. Berkas

| Fungsi | Berkas |
|---|---|
| Skema & seed | `database/schema.sql`, `database/seed.sql`, `sql/01-schema.sql`, `sql/02-seed.sql` (salinan identik, `cmp` di bukti a), `database/migrations/README.md`, `scripts/seed.js` |
| Lapisan data | `lib/db/index.js` (pool + `kueri()` + `transaksi()` + log kueri + pembantu seed), `users.js`, `artikel.js`, `pengaduan.js`, `pengurus.js`, `program.js`, `galeri.js`, `pengaturan.js`, `wilayah.js`, `audit.js`, `statistik.js` |
| Sumber tunggal | `lib/kategoriPengaduan.js` (8 kategori + 5 status), `lib/kategoriProgram.js`, `lib/kategoriGaleri.js`, `lib/pengaturanDefinisi.js` (13 kunci = daftar putih) |
| Pembantu | `lib/utils.js` (+ `tanggalSekarang`, `formatTanggalID`, `buatSlug`, `formatAngkaID`) |
| Dokumentasi | `DATABASE.md`, `PENERAPAN.md` (bagian 1 basis data) |
| Dihapus | `.gitkeep` di `scripts/`, `sql/`, `database/migrations/` (sudah berisi) |

`package.json` **tidak berubah**.

## 2. Tabel, kolom, indeks (bukti `a-skema.txt`)

| Tabel | Kolom | Indeks | Tabel | Kolom | Indeks |
|---|---|---|---|---|---|
| wilayah | 5 | 4 | pengaduan | 16 | 6 |
| users | 11 | 4 | pengaduan_lampiran | 7 | 2 |
| kategori_artikel | 5 | 2 | pengaduan_riwayat | 7 | 3 |
| artikel | 14 | 6 | pengurus | 10 | 3 |
| tag | 3 | 2 | program | 12 | 5 |
| artikel_tag | 2 | 2 | galeri | 11 | 4 |
| pengaturan | 4 | 1 | audit_log | 8 | 3 |

Indeks yang diminta TAHAP-01 semuanya ada: `artikel (status, terbit_pada DESC)`,
`slug`, `kategori_id`, `penulis_id`; `pengaduan (status, dibuat_pada DESC)`,
`nomor_kasus`, `wilayah_id`, `petugas_id`; `pengaduan_riwayat (pengaduan_id,
dibuat_pada)`; `audit_log (user_id, dibuat_pada)`, `(tabel_terkait, id_terkait)`.
16 foreign key dengan aturan `ON DELETE` tercetak di bukti a.

## 3. Diagram relasi

```
wilayah ──┬──< users            (wilayah_id, SET NULL)
          ├──< artikel          (wilayah_id, SET NULL)
          ├──< pengaduan        (wilayah_id, SET NULL)
          ├──< pengurus / program / galeri  (SET NULL)
          └──< wilayah          (induk_id: pusat > provinsi > kab/kota)

kategori_artikel ──< artikel >── users (penulis_id, RESTRICT)
                        └──< artikel_tag >── tag   (CASCADE)

pengaduan ──< pengaduan_riwayat  (RESTRICT; oleh_user_id -> users SET NULL)
          ──< pengaduan_lampiran (RESTRICT)
          ──  users (petugas_id, SET NULL)
users ──< audit_log (SET NULL)      pengaturan (kunci-nilai)
```

## 4. Hasil UJI TAHAP 1

| Butir | Hasil | Bukti |
|---|---|---|
| a. Skema bersih 2× | LULUS — kedua kali `exit=0` tanpa galat (`IF NOT EXISTS`); 14 tabel, semua InnoDB utf8mb4_unicode_ci | `a-skema.txt` |
| b. Seed 2× (3×) | LULUS — jumlah baris identik setelah tiap run (wilayah 39, users 6, artikel 12, pengaduan 3, riwayat 8, pengurus 5, program 3, galeri 6, pengaturan 13); seluruh hash `$2a$12$…` 60 karakter (`LIKE '$2a$12$%'` = 1); nilai kata sandi polos: 0 kemunculan | `b-seed.txt` |
| **c. Zona waktu** | **LULUS** — lihat bagian 5 | `c-zona-waktu.txt` |
| **d. Buku besar** | **LULUS** — 3 perubahan → 4 baris riwayat, rantai utuh, `pengaduan.status` = status_sesudah terakhir | `d-e-buku-besar-transaksi.txt` |
| e. Transaksi | LULUS — INSERT riwayat gagal (FK `oleh_user_id=999999`, `ER_NO_REFERENCED_ROW_2`) → status tetap `selesai`, jumlah riwayat tetap 4 | idem |
| f. Penyaringan identitas | LULUS — dengan `DB_LOG_KUERI=1`, SQL yang dijalankan untuk `bolehLihatIdentitas:false`, daftar, dan pelacakan publik **tidak memuat** `nama/nik/telepon/email_pelapor`; pembanding `true` memuatnya | `f-g-i-penyaringan.txt` |
| g. Penyaringan wilayah | LULUS — `WHERE … p.wilayah_id = ?` / `a.wilayah_id = ?` / `a.penulis_id = ?` terlihat di SQL; Sumut 0, Jabar 1 pengaduan; artikel Jabar 3, milik penulis 5 (sesuai seed) | idem |
| h. SQL liar | LULUS — grep pola SQL di luar `lib/db/`: nihil; `execute/query/createConnection` di luar `lib/db/index.js`: nihil | `h-sql-liar.txt` |
| i. Prepared statement | LULUS — statis: 71 interpolasi `${}` dalam SQL, **0 perlu diperiksa** (semuanya konstanta kolom/JOIN, potongan WHERE dari string tetap + `?`, daftar `?`, atau nama tabel daftar putih); aktif: `' OR '1'='1` pada 5 fungsi → 0 baris / null, terlihat di log sebagai **parameter** | `i-prepared-statis.txt`, `f-g-i-penyaringan.txt` |
| j. Nomor kasus | LULUS — 1000 `buatPengaduan()` berturut-turut: 1000 nomor unik di DB, 1000 riwayat awal, 501/999 naik (acak); generator murni: sebaran digit seragam, tidak monoton | `j-nomor-kasus.txt` |
| k. Build & lint | LULUS — `eslint .` 0 masalah; `next build` hijau, `ƒ Proxy (Middleware)` | `k-build-lint.txt` |

## 5. Bukti uji zona waktu (butir c) — lengkap

Server MariaDB berjalan **UTC** (`@@system_time_zone = UTC`, container `TZ=UTC`,
sengaja agar kondisi sama dengan produksi). Lewat pool aplikasi:

```
1) INSERT lewat lib/db/audit.js catatAudit() -> id 1 (dibuat_pada diisi aplikasi = 2026-09-03 13:14:06)
2) SELECT NOW(), @@session.time_zone (pool aplikasi):
   NOW()               = 2026-09-03 13:14:06
   @@session.time_zone = +07:00 | @@global.time_zone = SYSTEM | @@system_time_zone = UTC
3) SELECT dibuat_pada FROM audit_log ORDER BY id DESC LIMIT 1:
   tersimpan (CAST CHAR) = 2026-09-03 13:14:06 | dibaca driver -> 2026-09-03 13:14:06
4) Perbandingan dengan WIB sebenarnya 2026-09-03 13:14:06
   NOW() DB        : 2026-09-03 13:14:06 selisih 0 detik
   dibuat_pada     : 2026-09-03 13:14:06 selisih 0 detik
HASIL: LULUS — ketiganya sama dengan jam WIB (tidak ada selisih 7 jam)
```

Diulang dengan `TZ=UTC` pada proses Node (zona mesin sengaja dibuat berbeda):
hasil sama, selisih 0 detik — `waktuSekarang()` tidak bergantung zona mesin.
Pembanding: sesi klien CLI (tanpa hook) `NOW()` = `06:14:06` UTC sementara
nilai tersimpan `13:14:06` — membuktikan hook `SET time_zone` per koneksi dan
pengisian waktu oleh aplikasi bekerja.

## 6. Isi `pengaduan_riwayat` setelah uji buku besar (butir d)

```
id  nomor_kasus  status_sebelum  status_sesudah  oleh  dibuat_pada          catatan
 3  WRP-009021   NULL            baru            NULL  2026-09-02 14:30:00  Laporan diterima
 9  WRP-009021   baru            diverifikasi    4     2026-09-03 13:14:06  Bukti foto sesuai lokasi.
10  WRP-009021   diverifikasi    diproses        4     2026-09-03 13:14:06  Koordinasi dengan aparat setempat.
11  WRP-009021   diproses        selesai         4     2026-09-03 13:14:06  Pungli berhenti setelah patroli rutin.
 2  WRP-009018   NULL            baru            NULL  2026-08-30 10:15:00  Laporan diterima
 4  WRP-009018   baru            diverifikasi    4     2026-09-03 13:09:56  (seed, lewat ubahStatusPengaduan)
 5  WRP-009018   diverifikasi    diproses        4     2026-09-03 13:09:56
 1  WRP-008994   NULL            baru            NULL  2026-08-08 09:00:00  Laporan diterima
 6  WRP-008994   baru            diverifikasi    4     2026-09-03 13:09:56
 7  WRP-008994   diverifikasi    diproses        4     2026-09-03 13:09:56
 8  WRP-008994   diproses        selesai         4     2026-09-03 13:09:56
```

Rantai `status_sesudah` N = `status_sebelum` N+1: **YA** untuk seluruh pasangan.
Uji e sesudahnya: tabel tidak berubah (4 baris WRP-009021), status tetap `selesai`.

## 7. KEPUTUSAN BARU

1. **`ON DELETE` per FK** — tabel di `DATABASE.md`. Inti: `pengaduan_riwayat`
   dan `pengaduan_lampiran` **RESTRICT** + pengaduan **dihapus lunak**
   (`dihapus_pada`) sehingga buku besar tidak pernah lenyap; `artikel.penulis_id`
   **RESTRICT** + akun **dinonaktifkan** (`nonaktifkanUser`), bukan dihapus,
   sehingga artikel dan atribusinya tetap ada; `kategori_id` RESTRICT (aturan 7);
   `wilayah_id`/`petugas_id`/`oleh_user_id`/`audit_log.user_id` SET NULL;
   `artikel_tag` CASCADE.
2. **Nomor kasus `WRP-` + 6 digit acak kriptografis** (`crypto.randomInt`),
   bukan 4 digit seperti contoh `#WRP-9021` di layar: ruang 10.000 terlalu
   kecil untuk lembaga nasional dan mudah dijelajah lewat halaman pelacakan.
   Keunikan = UNIQUE KEY + percobaan ulang di dalam transaksi `buatPengaduan`.
   Nomor seed dilengkapi menjadi `WRP-009021` dst. Tahap 6 menambah pembatasan
   laju pada `/lacak`.
3. **Kolom tambahan**: `pengaduan.lokasi_kejadian VARCHAR(200)` (teks bebas
   "Wilayah Kejadian" dari formulir desain, mis. "Jawa Barat, Kab. Bogor" di
   layar kelola) dan `galeri.lokasi VARCHAR(150)` ("Balai Desa, Kab. Bogor").
   Keduanya tampak di desain dan tidak bisa diturunkan dari `wilayah_id`
   (provinsi). `pengaduan.dihapus_pada` untuk penghapusan lunak.
4. **`pengurus.aktif_sejak` bertipe SMALLINT (tahun)** — desain hanya
   menampilkan "Aktif sejak 2021"; REFERENSI tidak menetapkan tipenya.
5. **`lib/db/index.js` menyediakan `kueri()` (selalu `execute`) dan
   `transaksi()`**, plus log kueri lewat `DB_LOG_KUERI=1` — dipakai untuk uji f/g/i.
   Juga `hitungTabelAda`, `hitungBaris` (daftar putih nama tabel), dan
   `jalankanSkripSql` agar `scripts/seed.js` **tidak memuat SQL sama sekali**
   (uji h ketat: nihil di luar `lib/db/`).
6. **Akun contoh**: `seed.sql` membuat 5 akun staf (nama penulis dari layar
   desain: Budi Santoso/penulis, Siti Rahma/redaktur, Siti Aminah/verifikator,
   Redaksi Warkop/redaktur, Rahmat Siregar/pimpinan_wilayah Sumut) dengan hash
   penampung `'!'` dan `aktif=0`; `seed.js` mengaktifkannya hanya bila
   `SEED_STAF_PASSWORD` terisi (lokal: ya; produksi: **jangan**). Dibutuhkan
   agar artikel seed punya penulis dan uji peran Tahap 2 punya akun.
7. **Seed pengaduan contoh**: `seed.sql` hanya menyisipkan status awal `baru` +
   riwayat pertama; perpindahan status berikutnya dilakukan `seed.js` lewat
   `ubahStatusPengaduan()` — tidak ada jalan pintas ke kolom `status`, bahkan
   untuk seed.
8. **Idempotensi seed = `INSERT IGNORE` pada kunci unik**, sehingga suntingan
   redaksi tidak ditimpa saat seed diulang (bukan `ON DUPLICATE KEY UPDATE`).
   `pengaturan` sama; `seed.js` tidak mengubah kata sandi superadmin yang sudah
   ada kecuali `SEED_RESET_ADMIN=1`.
9. **`lib/pengaturanDefinisi.js` dibuat di Tahap 1** (REFERENSI menjadwalkannya
   untuk daftar putih Tahap 7) karena seed membutuhkan daftar kunci dan nilai
   bawaan dari sumber yang sama. 13 kunci: 3 statistik, 5 kontak, visi, misi,
   3 teks halaman statis. `kontak_hotline` memakai nilai layar kontak
   (`0800-1-WARKOP (927567)`); footer desain menulis `1500-WAP` — dua nilai
   berbeda di export, dipilih yang di halaman kontak (lebih lengkap).
10. **Pemetaan label kategori desain → 5 kategori REFERENSI**: label
    "Pelayanan Publik"/"Layanan Publik"/"Infrastruktur"/"Hukum"/"Laporan
    Rutin"/"Panduan" di kartu desain bukan kategori resmi; dipetakan ke
    Fasilitas Umum / Kegiatan Daerah / Investigasi / Siaran Pers. Akibatnya
    label kategori pada kartu beranda/daftar berita (Tahap 4/5) akan berbunyi
    nama kategori resmi, bukan teks contoh export — ini perubahan jenis (d)
    REFERENSI 18.2 (teks dinamis).
11. **Tanggal artikel seed Juni–September 2026** (instruksi "tiga bulan
    terakhir"), bukan "12 Okt 2024" seperti teks contoh export; status 9 terbit,
    2 draf, 1 arsip. Penulis "Tim Pengawas Regional 1"/"Tim Advokasi" dipetakan
    ke akun Budi Santoso / Redaksi Warkop.
12. **Nama pengurus regional Papua & Maluku diganti** ("Lukas Enembe, S.H."
    pada export adalah nama pejabat nyata yang pernah terjerat kasus hukum →
    diganti nama fiktif "Yohanes Rumbiak, S.H."). Nama lain dari export
    dipertahankan sebagai nama contoh.
13. **`kategori_masalah`, `program.kategori`, `galeri.kategori` = VARCHAR(50)**
    berisi slug (sesuai TAHAP-01), divalidasi lewat `lib/kategori*.js`.
14. **Kontainer lokal `warkop-mariadb` dengan `TZ=UTC`** (lihat Tahap 0) agar
    uji zona waktu menguji kondisi produksi yang sebenarnya.

## 8. Temuan & pertentangan dokumen

1. **CLAUDE.md "simpan UTC, tampilkan WIB" vs cetak biru 7 / TAHAP-01 uji c.**
   Uji c secara eksplisit menuntut `NOW()`, `@@session.time_zone`, dan
   `dibuat_pada` **sama dengan jam WIB** — artinya kolom DATETIME menyimpan
   WIB, bukan UTC. Diikuti cetak biru + TAHAP-01 (pola terverifikasi Cap Jiki);
   bagian "jangan percaya zona waktu mesin" dari CLAUDE.md dipenuhi (`waktuSekarang()`
   dihitung dari UTC+7, dibuktikan dengan `TZ=UTC`). Dicatat, tidak diputuskan
   diam-diam.
2. **Generator murni `nomorKasusAcak()` 1000× menghasilkan 1 nomor ganda**
   (paradoks ulang tahun pada ruang 10⁶ — 100.000× menghasilkan 4.682
   tabrakan). Karena itu uji j dijalankan lewat jalur sungguhan
   `buatPengaduan()` yang menangani tabrakan dengan UNIQUE KEY + percobaan
   ulang: **1000/1000 unik di DB**. Hasil generator murni tetap dilampirkan apa adanya.
3. **`ambilPengaduan`/`daftarPengaduan` dipanggil dengan `bolehLihatIdentitas`
   dari pemanggil** — Tahap 2/6 wajib menurunkannya dari `lib/auth/hakAkses.js`
   (superadmin, verifikator saja), bukan dari parameter permintaan.
4. Seed artikel/pengaduan/program/galeri/pengurus adalah **KONTEN CONTOH** yang
   wajib ditinjau/diganti redaksi sebelum peluncuran publik.
5. `TAHAP-01` menyebut `seed.sql` berisi "1 superadmin" — kata sandi tidak boleh
   di berkas, jadi superadmin hanya dibuat `seed.js` dari ENV; `seed.sql` tidak
   memuat superadmin. `sql/02-seed.sql` tetap bisa dijalankan sendiri (data statis).

## 9. Sengaja belum dikerjakan

| Hal | Tahap |
|---|---|
| `lib/auth/*` (JWT, sesi, `requireUser`, `requireRole`, `hakAkses.js`) | 2 |
| Route API yang memanggil modul `lib/db` | 2, 5, 6, 7 |
| Gambar penampung `/penampung/*.jpg` yang dirujuk seed | 4/5 (saat halaman dibuat) |
| Sanitasi HTML `artikel.isi` (isomorphic-dompurify) | 5 |
| `pengaduan_lampiran` alur unggah, rate limit `/lacak` | 6 |
| `scripts/cadangkan-db.sh` | 3/9 |
| `PENERAPAN.md` bagian Docker/Coolify | 3 |

## 10. Cara menguji ulang (pemilik)

```powershell
cd D:\Deploy\LSM
node laporan\bukti-tahap-01\skrip\uji-c-zona-waktu.mjs        # zona waktu (harus LULUS, selisih 0 detik)
$env:TZ='UTC'; node laporan\bukti-tahap-01\skrip\uji-c-zona-waktu.mjs; Remove-Item Env:TZ
node laporan\bukti-tahap-01\skrip\uji-fgi-penyaringan.mjs     # identitas/wilayah/injeksi, log SQL
node laporan\bukti-tahap-01\skrip\uji-i-statis.mjs            # interpolasi dalam SQL: perlu diperiksa = 0
node laporan\bukti-tahap-01\skrip\uji-j-nomor-kasus-db.mjs    # 1000 nomor unik (membersihkan sendiri)
npm run seed ; npm run seed                                    # jumlah baris tidak berubah
docker exec warkop-mariadb mariadb -uwarkop -p"<sandi>" warkop_nusantara -e "SELECT * FROM pengaduan_riwayat ORDER BY pengaduan_id, id"
```

Catatan: `uji-de-buku-besar.mjs` mengubah status WRP-009021 (sudah `selesai`
setelah run ini); untuk mengulang dari awal, hapus volume `warkop-mariadb-data`
lalu jalankan skema + seed lagi.

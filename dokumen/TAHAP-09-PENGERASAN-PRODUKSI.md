# TAHAP 9 — PENGERASAN DAN KESIAPAN PRODUKSI

> **Sumber di repo ini:** `CLAUDE.md`, `dokumen/` (cetak biru, REFERENSI, alur),
> `desain/stitch_portal_berita_inklusif/`, `LSM_WARKOP.png`, `paket-pendukung/`
>
> **Bergantung pada:** Tahap 0–8 (seluruhnya)
> **Rujukan cetak biru:** bagian 11 dan 12 (empat belas pelajaran), bagian 15
> **Rujukan REFERENSI:** 14 (aturan), 15 (standar mutu), 16 (Next.js 16)

---

## PROMPT INDUK

```
Kamu adalah arsitek dan pengembang senior yang membangun sistem produksi untuk
LSM WARKOP NUSANTARA.

DOKUMEN WAJIB DIPATUHI — semua sudah ada di repo ini, baca dari jalurnya:

1. dokumen/CETAK-BIRU-SISTEM.md — HUKUM ARSITEKTUR.
2. desain/stitch_portal_berita_inklusif/ — desain UI final.
3. LSM_WARKOP.png — logo resmi (turunannya di paket-pendukung/ASET/logo).
4. dokumen/REFERENSI.md — keputusan yang sudah ditetapkan.
5. dokumen/ALUR-KERJA-CLAUDE-CODE.md — cara kerja dan bentuk keluaran.
6. paket-pendukung/ — Ikon.js, font, kerangka, UJI/uji-kesetiaan.mjs.
   Bila salah satu jalur tidak ada, HENTIKAN dan beri tahu pemilik.

ATURAN KERJA TAHAP INI:

- Ini tahap audit dan pengerasan. Sikapnya berbeda dari tahap sebelumnya:
  tugasmu MENCARI CACAT pada pekerjaanmu sendiri, bukan menambah fitur.
- Laporkan setiap temuan apa adanya, termasuk yang memalukan. Cacat yang
  ditemukan sekarang jauh lebih murah daripada yang ditemukan setelah sistem
  dipakai pelapor sungguhan.
- Dilarang melaporkan lulus untuk uji yang belum benar-benar dijalankan. Bila
  suatu uji tidak bisa dijalankan, katakan tidak bisa dan jelaskan alasannya —
  jangan menuliskan hasil yang diasumsikan.
- Tandai KEPUTUSAN BARU secara eksplisit.
- Kerjakan LANGSUNG di repo ini; keluaran = perbaikan di tempat + laporan +
  satu commit. desain/ dan paket-pendukung/ baca-saja. Jangan git push tanpa
  diminta pemilik.
```

---

## SIFAT TAHAP INI

Delapan tahap sebelumnya membangun. Tahap ini **memeriksa**.

Cetak biru bagian 11 menyebut dirinya *"bagian paling berharga"* — kesepuluh
pelajaran itu bukan teori, melainkan kesalahan nyata di produksi Cap Jiki.
Bagian 12 menambahkan empat pelajaran khas Next.js 16.

Sikap yang diminta: **curiga pada pekerjaan sendiri.** Bila suatu bagian terasa
"pasti sudah benar", justru itu yang paling perlu diperiksa.

---

## A. TELUSUR KODE MATI

Aturan 9: di Cap Jiki ditemukan **enam route API yang tidak pernah dipanggil**
dan **tiga komponen yang tidak pernah diimpor**. Route menganggur tetap dapat
diakses dan menambah permukaan serangan tanpa memberi manfaat.

1. Daftar **seluruh** route API. Untuk masing-masing, tunjukkan di berkas mana
   frontend memanggilnya. Yang tidak ditemukan pemanggilnya → **hapus**
2. Hal yang sama untuk komponen di `components/` dan fungsi di `lib/`
3. Hapus `app/uji-desain/page.js` (Tahap 0)
4. Pastikan `app/uji-proxy/page.js` sudah terhapus (seharusnya di Tahap 2)
5. Hapus dependensi yang tidak terpakai dari `package.json`
6. Pastikan `desain/`, `paket-pendukung/`, `laporan/`, `dokumen/`, dan kedua
   berkas sumber (ZIP desain, logo asli) tercantum benar: `desain/` dan
   berkas sumber di `.gitignore` (tidak ikut repo), sisanya boleh ter-commit
   tetapi TIDAK boleh tersalin ke image Docker (periksa `.dockerignore`)

Hapus langsung dari repo. **Laporkan daftar lengkapnya**
beserta alasannya. Bila ada yang diragukan, jangan hapus — tandai dan jelaskan.

---

## B. AUDIT KEAMANAN

### B1. Tabel penjaga peran

Tabel berisi **seluruh** route API:

| Route | Metode | Peran diizinkan | Memanggil `requireRole`? | Berkas:baris |
|---|---|---|---|---|

Route publik tanpa penjaga (`/api/health`, `/api/artikel`,
`POST /api/pengaduan`, `/api/pengaduan/lacak/[nomor]`) ditandai jelas dengan
alasannya.

Lalu **uji seluruhnya dengan curl**: untuk setiap route, panggil dengan setiap
peran yang tidak berhak → semua 403. Ini pengulangan menyeluruh dari uji per
tahap, kali ini untuk sistem lengkap.

### B2. Prepared statement

Telusuri seluruh `lib/db/`: setiap kueri memakai parameter `?`. Tidak ada
penggabungan string ke SQL.

Uji aktif: kirim `' OR '1'='1` dan varian lain ke setiap kolom pencarian dan
filter → tidak ada yang lolos.

### B3. Header keamanan

Lengkapi `next.config.mjs` (kerangkanya dari Tahap 0):

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: <susun sesuai kebutuhan sungguhan>
Permissions-Policy: <matikan yang tidak dipakai>
```

CSP perlu disusun teliti agar tidak mematikan Socket.io dan `next/font`. **Uji
sungguhan**, jangan sekadar dipasang.

### B4. Rate limit

Ada dan berfungsi pada: login, pengiriman pengaduan, pelacakan kasus, unggahan.

### B5. CSRF

Seluruh route yang mengubah data terlindungi. Uji dengan permintaan lintas
asal.

### B6. Berkas unggahan

Disajikan **tanpa hak eksekusi**; path tidak mudah ditebak; magic bytes
diperiksa; nama diganti acak.

Uji: coba akses lampiran pengaduan orang lain dengan menebak URL.

### B7. Rahasia

Tidak ada rahasia ter-commit — periksa juga **riwayat git**, bukan hanya berkas
saat ini. `.env` dan `_backup*` masuk `.gitignore`. Log build bersih (ulangi
uji Tahap 3).

### B8. Versi dan advisori

Jalankan `npm audit`. Periksa apakah versi Next.js yang dipakai masih dalam
masa dukungan dan sudah memuat patch keamanan terbaru. Laporkan advisori yang
tersisa satu per satu — mana yang tidak berlaku untuk sistem ini dan mengapa.

---

## C. UJI SILANG EMPAT BELAS ATURAN

Periksa satu per satu. **Setiap butir wajib disertai bukti**, bukan pernyataan.

**1. Zona waktu** — OS container, sesi basis data, dan kolom waktu ketiganya
WIB.
*Bukti:* keluaran `date` di container, `SELECT NOW(), @@session.time_zone`, dan
satu baris data terbaru dari `pengaduan`.

**2. Rahasia tidak bocor ke log build** — *Bukti:* potongan log tahap builder.

**3. Setiap route API punya penjaga** — *Bukti:* tabel B1 beserta hasil curl.

**4. Tidak ada `!important`** — *Bukti:* hasil penelusuran seluruh CSS dan
komponen. Nihil.

**5. Tidak ada `100vh`** — *Bukti:* hasil penelusuran. Nihil, digantikan
`hooks/useViewportTinggi.js`.

**6. Konsistensi hamparan layar penuh** — *Bukti:* daftar seluruh
hamparan/modal, semuanya satu pendekatan.

**7. Tidak ada data tanpa induk** — *Bukti:* jalankan kueri pemeriksaan:
```sql
-- Pengaduan tanpa riwayat sama sekali
SELECT p.id, p.nomor_kasus FROM pengaduan p
LEFT JOIN pengaduan_riwayat r ON r.pengaduan_id = p.id
WHERE r.id IS NULL;

-- Artikel tanpa kategori
SELECT id, judul FROM artikel WHERE kategori_id IS NULL;

-- Rantai riwayat yang putus
-- (status_sesudah baris ke-N != status_sebelum baris ke-N+1)
```
Ketiganya harus mengembalikan nol baris.

**8. Daftar putih pengaturan lengkap** — *Bukti:* daftar seluruh kunci di
tampilan disandingkan dengan daftar putih di API. Harus identik. Lalu uji
simpan-muat ulang untuk setiap kunci.

**9. Tidak ada kode mati** — *Bukti:* hasil bagian A.

**10. Tidak pakai `output: 'standalone'`, `/api/health` ada** — *Bukti:* isi
`next.config.mjs` dan status healthcheck hijau.

**11. Build hijau bukan berarti sistem jalan** — *Bukti:* `proxy.js` ada di
image, dan permintaan sungguhan membuktikan ia berjalan. Ulangi uji proxy Tahap
0 dan pemisahan host Tahap 2 pada image produksi, **termasuk memeriksa nilai
`Location` tidak memuat `0.0.0.0`** (Pelajaran 15).

**12. `await` semua API permintaan** — *Bukti:* hasil penelusuran `cookies()`,
`headers()`, `params`, `searchParams` tanpa `await`. Nihil.

**13. Identitas pelapor tidak pernah keluar** — *Bukti:* HTML mentah beranda,
balasan JSON `/lacak`, muatan socket, dan balasan API untuk peran yang tidak
berhak. Keempatnya bersih.

**14. Setiap perubahan bisa dibatalkan** — *Bukti:* pilih satu commit tahap
sebelumnya, jalankan `git revert <hash>` di cabang percobaan, `npm run build`
tetap hijau, lalu buang cabangnya. Riwayat satu-commit-per-tahap yang membuat
ini mungkin — tunjukkan `git log --oneline`.

---

## D. PENGUJIAN MENYELURUH

### D1. Alur ujung ke ujung per peran

Tulis sebagai daftar langkah yang **bisa diulang orang lain**, bukan laporan
"sudah diuji". Lima alur:

- **Warga (tanpa login)** — beranda → baca artikel → kirim pengaduan anonim →
  lacak statusnya
- **Penulis** — login → tulis draf → simpan → tidak bisa menerbitkan
- **Redaktur** — login → tinjau draf → terbitkan → muncul di publik
- **Verifikator** — login → lihat pengaduan baru → buka identitas → ubah status
  dengan catatan → riwayat tercatat
- **Superadmin** — login → kelola pengguna → ubah pengaturan → paksa keluar
  pengguna → periksa audit log

### D2. Uji beban

50 pengguna bersamaan membaca beranda dan daftar berita. Laporkan waktu tanggap
dan penggunaan memori. Cetak biru bagian 2 mencatat: yang biasanya lebih dulu
penuh adalah **RAM**, bukan CPU.

### D3. Uji peramban

Chrome, Firefox, Safari, Chrome Android, **Safari iOS**.

Safari iOS **wajib** — aturan 5 lahir dari sana. Uji khusus: formulir pengaduan
yang panjang dengan keyboard terbuka, elemen setinggi layar, orientasi berputar
saat mengisi formulir.

### D4. Lighthouse

Beranda, daftar berita, detail artikel, formulir pengaduan.
**Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90.**

### D4b. Uji kesetiaan menyeluruh

Jalankan `uji-kesetiaan.mjs` untuk **seluruh 14 layar** ZIP terhadap halaman
sungguhannya (REFERENSI 18.5), pada build produksi. Tabel: layar, cakupan
kelas, jumlah kelas hilang, sisa cacat export (harus nol semua). Ini pemeriksaan
terakhir bahwa tampilan tidak menyimpang dari desain selama sembilan tahap.

### D5. Uji pemulihan

Matikan MariaDB saat aplikasi berjalan: aplikasi memberi pesan rapi tanpa
menampilkan jejak galat ke pengguna; `/api/health` balas 503; saat DB kembali,
aplikasi **pulih sendiri** tanpa restart.

### D6. Uji aksesibilitas

Navigasi keyboard penuh; pembaca layar bisa mengisi formulir pengaduan sampai
selesai; kontras lulus WCAG AA; fokus selalu terlihat.

---

## E. PENCADANGAN DAN PEMULIHAN

`scripts/cadangkan-db.sh` sudah dibuat di Tahap 3. Sekarang:

1. Jalankan pencadangan sungguhan
2. **Pulihkan ke basis data kosong**
3. Jalankan aplikasi terhadap basis data hasil pemulihan
4. Verifikasi seluruh data utuh: artikel, pengaduan, **riwayat pengaduan**,
   pengguna, pengaturan, lampiran

**Pencadangan yang belum pernah diuji pulih tidak dapat disebut pencadangan.**

Dokumentasikan: jadwal yang disarankan, tempat penyimpanan, berapa lama
disimpan, dan langkah pemulihan yang bisa diikuti orang lain saat panik.

---

## F. DOKUMENTASI AKHIR

| Berkas | Isi |
|---|---|
| `README.md` | Gambaran, cara jalan lokal, struktur folder, prasyarat (Node 22+) |
| `PENERAPAN.md` | Langkah Coolify, daftar ENV dengan penandaan Runtime only, firewall, rollback, cara menjalankan SQL |
| `DATABASE.md` | Penjelasan tiap tabel, relasi, diagram, aturan migrasi |
| `API.md` | Seluruh endpoint, peran yang diizinkan, contoh permintaan dan balasan |
| `PANDUAN-STAF.md` | Panduan berbahasa Indonesia untuk pengurus, dengan tangkapan layar |
| `LAPORAN-KESIAPAN.md` | Jawaban seluruh butir C dan G beserta buktinya |

`PANDUAN-STAF.md` sering diremehkan. Tulis untuk pengurus LSM yang mungkin baru
pertama memakai sistem seperti ini: cara menulis artikel, cara menindaklanjuti
pengaduan, arti setiap status, dan apa yang dilakukan bila lupa kata sandi.

---

## G. DAFTAR PERIKSA SEBELUM PRODUKSI

Dari **cetak biru bagian 15**. Jawab satu per satu dengan bukti, bukan centang
kosong.

- [ ] `JWT_SECRET` acak minimal 48 byte, ditandai **Runtime only**
- [ ] Kata sandi basis data kuat, port 3306 **tidak terbuka**
- [ ] Login SSH hanya dengan kunci
- [ ] Panel Coolify **tidak dapat diakses dari internet**
- [ ] Firewall hanya membuka 22, 80, 443
- [ ] `/api/health` ada dan healthcheck **hijau**
- [ ] Zona waktu selaras: OS, container, sesi basis data
- [ ] **Setiap** route API memeriksa peran
- [ ] Rencana pencadangan berkala, **sudah diuji pulih**
- [ ] Percobaan rollback: `git revert` lalu Redeploy, **sudah dicoba**

Tambahan Next.js 16:

- [ ] `proxy.js` ada di image dan **terbukti berjalan** di custom server
- [ ] Tidak ada `cookies()`/`headers()`/`params`/`searchParams` tanpa `await`
- [ ] Versi Next.js masih dalam masa dukungan, advisori terbaru diperiksa
- [ ] `npm run build` hijau dengan Turbopack

Tambahan khusus sistem ini:

- [ ] Laporan anonim benar-benar tidak menyimpan identitas
- [ ] Halaman publik dan `/lacak` tidak pernah menampilkan identitas pelapor
- [ ] Muatan socket tidak pernah membawa identitas pelapor
- [ ] Setiap perubahan status pengaduan punya baris riwayat
- [ ] Lampiran pengaduan tidak bisa dijelajahi dengan menebak URL
- [ ] Volume unggahan bertahan melewati redeploy

---

## BENTUK KELUARAN (Claude Code)

Kerjakan **langsung di repo ini** — tidak ada paket perubahan, tidak ada
apply.ps1. Di akhir tahap:

1. Seluruh berkas tahap ini sudah ada di tempatnya dan `npm run build` hijau.
2. Tulis `laporan/LAPORAN-TAHAP-09-KESIAPAN.md` (isi sesuai bagian LAPORAN di
   bawah). Bukti uji masuk `laporan/bukti-tahap-09/` dan dirujuk dari laporan.
3. `git add -A` lalu `git commit -m "Tahap 09: <ringkasan satu baris>"`.
   Jangan push tanpa diminta pemilik.
4. MODE GERBANG: berhenti, tunggu pemilik memeriksa laporan. MODE OTONOM:
   verifikasi gerbang-mandiri (ALUR bagian 7.2), perbarui laporan/STATUS.md,
   lalu langsung lanjut tahap berikutnya.

## LAPORAN — isi `laporan/LAPORAN-TAHAP-09-KESIAPAN.md`

1. **Hasil telusur kode mati (bagian A)** — daftar yang dihapus
2. **Tabel penjaga peran lengkap (B1)** beserta hasil uji curl
3. **Hasil `npm audit` dan status dukungan versi (B8)**
4. **Keempat belas aturan (bagian C)** — satu per satu dengan bukti
5. **Hasil pengujian menyeluruh (bagian D)** — termasuk Lighthouse dan catatan
   Safari iOS
6. **Bukti pencadangan sudah diuji pulih (bagian E)**
7. **Daftar periksa produksi (bagian G)** — dengan bukti per butir
8. **Daftar cacat yang ditemukan dan diperbaiki** selama tahap ini
9. **Daftar risiko yang tersisa** — hal yang belum sempurna dan perlu
   diperhatikan pemilik sistem
10. **Hal yang harus dilakukan manual** oleh pemilik sistem di server dan
    Coolify

Sebutkan juga: apa yang sengaja **tidak** dibangun, dan apa yang disarankan
sebagai pengembangan berikutnya.

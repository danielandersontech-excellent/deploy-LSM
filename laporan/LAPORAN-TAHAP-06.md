# LAPORAN TAHAP 06 — MODUL PENGADUAN

Tanggal: 3–4 September 2026 (23:50 – 00:35 WIB) · Mode: OTONOM · Bukti:
`laporan/bukti-tahap-06/` (uji API b–m + p, rate limit l, kesetiaan n, lebar o,
build q, tangkapan, skrip yang bisa diulang).

## Ringkasan — bacalah ini dulu

Modul pengaduan selesai: formulir publik `/kontak` (anonim = identitas **tidak
dikirim**, honeypot + token formulir, lampiran ≤ 5 berkas), konfirmasi nomor
kasus, pelacakan `/lacak` (tanpa identitas, pesan netral), `/staf/pengaduan`
(pil status berjumlah nyata, penyaringan wilayah di SQL, kolom Pelapor
Anonim/Dirahasiakan), detail `/staf/pengaduan/[id]` (panel identitas hanya
superadmin/verifikator + audit, lampiran lewat route terjaga, linimasa,
ubah status dengan catatan wajib, penugasan). Route API: kirim (rate limit
10/jam/IP), lacak (60/15 mnt/IP), status (buku besar), penugasan, lampiran
terjaga. **Seluruh 17 butir uji LULUS dengan bukti**, termasuk anonim via API
(keempat kolom `NULL`), buku besar 5 perubahan berantai, transaksi rollback
saat riwayat gagal, dan semua peran tak berhak 403.

**Temuan penting yang diperbaiki di tahap ini:** (1) berkas apa pun di bawah
`public/` dilayani statis oleh Next.js saat server mulai — lampiran pengaduan
yang disimpan di `UPLOAD_DIR` (di dalam `public/`) bisa diakses tanpa sesi
begitu container restart → lampiran dipindah ke direktori **terjaga di luar
`public/`** (`UPLOAD_PRIVATE_DIR=/app/unggahan-terjaga`, butuh volume baru di
Coolify — **tindakan pemilik**); (2) tiga cacat tata letak Tahap 4/5 yang baru
terlihat lewat pengukuran viewport sungguhan (laci seluler selalu terbuka,
navbar meluap mendatar di 375–1024 px, filter program/galeri dan kolom berita
meluap di 375/768 px) — diperbaiki dengan kelas tata letak minimal.

## 1. Halaman, komponen, dan route API

| Kelompok | Berkas |
|---|---|
| Publik | `app/(publik)/kontak/page.js`, `components/publik/FormulirPengaduan.js`, `lib/pengaduanFormulir.js` (logika muatan murni, diuji node), `app/(publik)/lacak/page.js` |
| Staf | `app/(staf)/staf/pengaduan/page.js`, `app/(staf)/staf/pengaduan/[id]/page.js`, `components/staf/PanelStatusPengaduan.js` |
| Route API | `POST /api/pengaduan`, `GET /api/pengaduan/lacak/[nomor]`, `GET+PATCH /api/staf/pengaduan/[id]` (PATCH = penugasan), `POST /api/staf/pengaduan/[id]/status`, `GET /api/staf/pengaduan/[id]/lampiran/[lampiranId]` |
| Pustaka | `lib/validasi/pengaduan.js` (anonim → NULL; pesan netral; `CATATAN_MIN`), `lib/pembatasLajuUmum.js`, `lib/tokenFormulir.js`, `lib/unggahan.js` (+`direktoriTerjaga`, `simpanLampiran({terjaga})`, `jalurDiskTerjaga`, subfolder bersarang), `lib/db/pengaduan.js` (+`ambilLampiranById`), `lib/db/users.js` (+`ambilPetugasKandidat`) |
| Penerapan | `Dockerfile` (`/app/unggahan-terjaga`, `ENV UPLOAD_PRIVATE_DIR`), `docker-compose.yml` (volume `warkop-compose-terjaga`), `.env.example`, `PENERAPAN.md` (baris ENV + volume), `.gitignore` |
| Perbaikan Tahap 4/5 | `components/publik/NavPublik.js` (laci dirender hanya saat terbuka; merek `max-w-full lg:shrink-0 lg:whitespace-nowrap`; nav `flex-wrap justify-center`), `app/(publik)/program/page.js` & `galeri/page.js` (`flex-wrap` pada baris filter), `app/(publik)/berita/page.js` (`min-w-0` kolom utama), `app/unggahan/[...jalur]/route.js` (menolak `pengaduan/*`) |
| Alat uji | `bukti-tahap-06/skrip/uji-api-tahap-06.sh`, `uji-l-rate-limit.sh`, `ukur-lebar.mjs` (CDP + emulasi perangkat: scrollWidth, elemen meluap, tangkapan) |

`package.json` **tidak berubah**.

## 2. Bukti uji anonim (butir a dan b) — bukti terpenting

**a. Formulir (klien).** Tidak ada peramban interaktif, jadi logika muatan
dipisah ke modul murni `lib/pengaduanFormulir.js` (`susunMuatan(state)`) dan
diuji dengan node (`a-muatan-anonim-klien.txt`, 20 pemeriksaan LULUS): state
terisi nama/NIK/telepon/email **lalu** `anonim=true` → daftar field yang
dikirim = `token_formulir, anonim=1, kategori_masalah, wilayah_id, deskripsi,
lampiran*` — **tanpa** satu pun field identitas; muatan itu diteruskan ke
`validasiKirimanPengaduan` server → keempat kolom `null`. Di komponen,
mencentang kotak menonaktifkan keempat input dan mengosongkan state
(`FormulirPengaduan.js`). Tangkapan Network sungguhan tidak dapat dibuat tanpa
peramban interaktif — dinyatakan apa adanya; penggantinya adalah bukti node di
atas + bukti b.

**b. API langsung** (`b-m-api.txt`): POST JSON `anonim:true` **beserta**
`nama_pelapor`, `nik_pelapor`, `telepon_pelapor`, `email_pelapor` terisi →
`201 {"nomorKasus":"WRP-110776","anonim":true}`; baris DB:
```
{"nomor_kasus":"WRP-110776","anonim":1,"nama_pelapor":null,"nik_pelapor":null,"telepon_pelapor":null,"email_pelapor":null,"status":"baru"}
HASIL b: LULUS — keempat kolom NULL, anonim=1
```
Lapisan ketiga: `buatPengaduan()` di `lib/db` juga memaksa NULL bila `anonim`.

## 3. Isi `pengaduan_riwayat` setelah uji buku besar (butir f)

Pengaduan uji WRP-280120 (bernama, verifikator Siti Aminah), lima perubahan
berantai `baru → diverifikasi → diproses → ditolak → diproses → selesai`:
```
{"id":1021,"status_sebelum":null,"status_sesudah":"baru","catatan":"Laporan diterima","oleh_user_id":null,"waktu":"2026-09-04 00:16:38"}
{"id":1022,"status_sebelum":"baru","status_sesudah":"diverifikasi","catatan":"Bukti foto jembatan cocok dengan laporan warga.","oleh_user_id":4,"oleh":"Siti Aminah","waktu":"2026-09-04 00:16:40"}
{"id":1023,"status_sebelum":"diverifikasi","status_sesudah":"diproses","catatan":"Diteruskan ke tim advokasi wilayah untuk klarifikasi.","oleh_user_id":4,...}
{"id":1024,"status_sebelum":"diproses","status_sesudah":"ditolak","catatan":"Uji cabang: sementara ditolak karena bukti tambahan diminta.","oleh_user_id":4,...}
{"id":1025,"status_sebelum":"ditolak","status_sesudah":"diproses","catatan":"Bukti tambahan diterima; kembali diproses.","oleh_user_id":4,...}
{"id":1026,"status_sebelum":"diproses","status_sesudah":"selesai","catatan":"Perbaikan jembatan dimulai; pelapor mengonfirmasi.","oleh_user_id":4,...}
HASIL f: LULUS — status_sesudah baris N = status_sebelum baris N+1, semua bercatatan & berpelaku, waktu WIB
```

## 4. Bukti uji transaksi (butir g)

Trigger sementara `BEFORE INSERT ON pengaduan_riwayat` yang `SIGNAL` bila
`catatan = 'GAGALKAN-UJI-G'`:
```
SEBELUM: status=selesai riwayat=6
POST status=baru catatan=GAGALKAN-UJI-G -> HTTP 500 {"galat":"Terjadi kesalahan di server"}
SESUDAH: status=selesai riwayat=6
HASIL g: LULUS — status & riwayat tidak berubah (rollback); trigger uji dihapus
```

## 5. Penelusuran jalan pintas (butir h)

`grep "UPDATE pengaduan"` + `SET status` di `app/ lib/ scripts/`: satu-satunya
kemunculan `UPDATE pengaduan SET status = ?` ada di
`lib/db/pengaduan.js:194` (di dalam `ubahStatusPengaduan`, setelah
`SELECT … FOR UPDATE`); di luar berkas itu **0**. `PATCH /api/staf/pengaduan/[id]`
menolak body yang memuat `status` (422 `STATUS_LEWAT_BUKU_BESAR`). Seed
`scripts/seed.js` memakai `ubahStatusPengaduan` (Tahap 1).

## 6. Tabel hasil uji peran (butir j)

| Uji | Harapan | Hasil |
|---|---|---|
| `penulis` GET `/api/staf/pengaduan` | 403 | **403** |
| `redaktur` GET `/api/staf/pengaduan` | 403 | **403** |
| `pimpinan_wilayah` POST status | 403 | **403** |
| `pimpinan_wilayah` (wil 3) GET daftar | pengaduan wilayah lain tidak ada | **total 0**, kolom identitas tidak ada di baris; akun wil 13 → hanya `wilayah=[13]` |
| `pimpinan_wilayah` (13) GET detail wil 13 | tanpa identitas di JSON | **200**, kunci `*_pelapor` = kosong, nilai identitas 0 |
| `pimpinan_wilayah` (3) GET detail wil 13 | tidak terlihat | **404** (bukan 403 — keberadaan tidak bocor) |
| `verifikator` GET detail | identitas + lampiran URL terjaga | 200, kunci identitas ada, `lampiran.url=/api/staf/pengaduan/<id>/lampiran/<lid>`, path disk tidak dibalas |
| Halaman staf: penulis → `/staf/pengaduan` | 403 | **307 → /tanpa-akses**; pimpinan_wilayah 13 hanya 4 baris wilayah 13, Pelapor = Anonim/Dirahasiakan, 0 kebocoran dari 11 nilai identitas (`j-kelola-peran.txt`); detail pimpinan_wilayah tanpa panel identitas (`j-detail-pimpinan-wilayah.txt`) |

## 7. Hasil uji lampiran (butir k)

| Uji | Harapan | Hasil |
|---|---|---|
| Unggah 25 MB (PDF asli) | ditolak | **413** "setiap lampiran maksimal 20 MB" (`k2-25mb-produksi.txt`; pra-cek Content-Length) |
| `.exe` bernama `.pdf` | ditolak magic bytes | **415** `LAMPIRAN_TIPE_TIDAK_SAH` |
| `.svg` berisi script | ditolak | **415** |
| 6 berkas (maks 5) | ditolak | **422**; kiriman yang ditolak **tidak** meninggalkan pengaduan setengah jadi (0 baris) |
| Tebak URL lampiran pengaduan lain | tidak bisa | jalur disk `/terjaga/pengaduan/<acak24>/<acak32>.jpg`: route publik `/unggahan/pengaduan/*` **404**; `/api/staf/pengaduan/<id>/lampiran/<lid>` tanpa cookie **401**, penulis **403**, pimpinan wilayah lain **404**, id pengaduan lain **404**; verifikator **200** `image/jpeg`, `nosniff`, `CSP default-src 'none'; sandbox`, `inline` (gambar) / `attachment` (pdf/mp4) |

## 8. Tangkapan layar dan tiga lebar (butir n/o)

- `tangkapan/kontak-{375,768,1280}.png`, `lacak-*`, `beranda-375.png`,
  `berita-375.png`, `navbar-{768,1024}.png`. Tangkapan 375 dibuat dengan
  **emulasi perangkat lewat CDP** (`skrip/ukur-lebar.mjs`) — tangkapan
  `--screenshot --window-size=375` yang dipakai Tahap 4/5 ternyata terpotong
  (jendela desktop Chrome minimum ±500 px); bukti Tahap 4/5 pada 375 px
  karenanya hanya mewakili ±500 px (dicatat sebagai koreksi).
- `o-lebar-emulasi.txt`: 9 halaman publik × 4 lebar (375/768/1024/1280) =
  **36/36 PAS** (`scrollWidth == clientWidth`, tidak ada elemen melewati tepi)
  setelah perbaikan. Sebelum perbaikan: navbar meluap 768–1024, `/program`
  375 (form filter), `/galeri` 375 (input tanggal), `/berita` 768 (aside).
- Keyboard ponsel menutupi input: tidak bisa diuji tanpa perangkat; formulir
  memakai input HTML standar dalam satu halaman (peramban menggulir ke input
  yang difokus), tanpa hamparan tetap yang menghalangi.
- Perbandingan dengan `screen.png` kontak (1067 px) dan kelola pengaduan: kartu
  kiri, kepala panel, indikator langkah, garis-bawah input, kotak unggah, tombol
  — sama. Indikator langkah pada tangkapan tinggi menunjukkan "Bukti" aktif
  karena pita pengamatan (40–50 % viewport) jatuh di bagian terakhir — artefak
  tangkapan, bukan cacat (pada viewport nyata langkah 1 aktif).

## 9. Hasil ketujuh belas butir UJI TAHAP 6

| Butir | Hasil | Bukti |
|---|---|---|
| a. Anonim (formulir) | **LULUS** (logika klien node) — tangkapan Network tidak tersedia, dinyatakan | `a-muatan-anonim-klien.txt` |
| b. Anonim via API | **LULUS** — 4 kolom NULL | `b-m-api.txt` |
| c. Laporan bernama | **LULUS** — 201 nomor kasus, lampiran tersimpan; konfirmasi = keadaan klien (`FormulirPengaduan`) | idem, `a-kesetiaan-kontak.txt` |
| d. Pelacakan | **LULUS** — JSON `lacak` tanpa identitas/catatan/petugas (0 kemunculan); HTML `/lacak` 0 kebocoran | idem, `d-lacak-tanpa-identitas.txt` |
| e. Nomor asing | **LULUS** — tiga balasan identik byte per byte | idem |
| f. Buku besar | **LULUS** — bagian 3 | idem |
| g. Transaksi | **LULUS** — bagian 4 | idem |
| h. Jalan pintas | **LULUS** — 0 di luar `ubahStatusPengaduan` | idem |
| i. Catatan wajib | **LULUS** — tanpa/‹10 karakter → 422 | idem, `i-catatan-wajib.txt` |
| j. Peran | **LULUS** — bagian 6 | idem, `j-*.txt` |
| k. Lampiran | **LULUS** — bagian 7 | idem, `k2-25mb-produksi.txt` |
| l. Rate limit | **LULUS** — 30 kiriman: 10 × 201 lalu 20 × 429 mulai ke-11, pesan netral; lacak 70 permintaan → 10 × 429 | `l-rate-limit.txt` |
| m. Audit identitas | **LULUS** — `lihat_identitas_pelapor` oleh verifikator (API & halaman), 0 untuk anonim/pimpinan_wilayah | `b-m-api.txt`, `m-audit-identitas.txt` |
| n. Kesetiaan | **LULUS** — kontak 97 % (5 hilang beralasan), kelola pengaduan cacat 0 (79 hilang: sidebar + overlay detail + zebra); lacak/detail = cetakan 18.4, cacat 0 | `n-kesetiaan-produksi-semua.txt`, `a-kesetiaan-*.txt` |
| o. Tiga lebar | **LULUS** — 36/36 PAS (setelah perbaikan) | `o-lebar-emulasi.txt`, `tangkapan/` |
| p. Zona waktu | **LULUS** — `dibuat_pada` = WIB (selisih 1 s), `+07:00` | `b-m-api.txt` |
| q. Build hijau | **LULUS** — build + lint exit 0 | `q-build-hijau.txt` |

## 10. KEPUTUSAN BARU

1. **Halaman detail pengaduan (tidak ada di ZIP)** — cetakan: kerangka +
   `<header>` + kartu putih `kelola_artikel_admin`; kartu ringkasan (baris
   ikon), panel identitas (kartu "Kerahasiaan Dijamin" `bg-secondary-fixed/20`,
   ikon `security`, ditandai DATA SENSITIF; anonim → `visibility_off`), butir
   berkas, lingkaran indikator langkah (linimasa), formulir bergaris bawah +
   kepala `bg-primary` dari `kontak_pengaduan_…_updated_logo`; tombol
   `KELAS_TOMBOL`. Grid `lg:grid-cols-12` (4: ringkasan, identitas, panel
   status; 8: deskripsi, bukti, linimasa). Satu kelas di luar cetakan:
   `whitespace-pre-line`. **Temuan**: `kelola_pengaduan_admin/code.html`
   ternyata memuat "Detail View Overlay" — pemilik dapat memutuskan apakah
   halaman detail dibangun ulang dari overlay itu.
2. **Rate limit tanpa CAPTCHA**: per IP 10 pengaduan/60 menit, lacak 60/15
   menit, honeypot `situs_web` + token HMAC bertanda waktu (≥ 3 s, ≤ 2 jam).
   Penyeimbangan IP bersama: ambang longgar untuk manusia (satu kantor desa
   yang mengirim 10 laporan/jam masih jarang), 429 netral menyebut sisa waktu
   dan hotline, tidak ada penyimpanan data pelapor, bot yang mengisi honeypot
   dibalas 202 semu tanpa disimpan.
3. **Pratinjau lampiran aman**: berkas pelapor tidak pernah dirender langsung
   ke DOM; gambar lewat `<img src="/api/staf/pengaduan/<id>/lampiran/<lid>">`
   (route berpagar peran + wilayah, `nosniff`, `CSP default-src 'none';
   sandbox`, `inline` hanya gambar), PDF/MP4 tautan unduh `attachment`;
   pembukaan dicatat `lihat_lampiran_pengaduan`.
4. **Direktori terjaga** `UPLOAD_PRIVATE_DIR` (bawaan `<cwd>/unggahan-terjaga`,
   produksi `/app/unggahan-terjaga`) untuk lampiran pengaduan; jalur DB
   berawalan `/terjaga/`; route publik `/unggahan/pengaduan/*` 404; jalur lama
   `/unggahan/…` tetap terbaca. Gambar di jalur terjaga tetap dikompres sharp.
   Magic bytes semua lampiran diperiksa **sebelum** pengaduan dibuat.
5. Pesan pelacakan netral tunggal untuk nomor tidak ada / format salah /
   dihapus; status balasan API `POST …/status` tanpa identitas (pembukaan
   identitas hanya lewat GET detail yang beraudit).
6. Formulir: "Simpan Draft" = `sessionStorage` untuk kategori/wilayah/
   deskripsi saja (identitas & lampiran tidak pernah disimpan); wilayah =
   `<select>` provinsi (desain: input teks); `lokasi_kejadian` dilewati
   (desain tak punya tempatnya); indikator langkah mengikuti bagian yang
   terlihat; pengiriman ditunda sampai token berumur ≥ 3 s.
7. Kelola pengaduan: pil Diverifikasi/Selesai/Ditolak ditambah dengan kelas
   pil pasif; kolom Pelapor "Dirahasiakan" untuk peran tanpa hak; tombol filter
   = submit (desain tanpa tempat `<select>` kategori).
8. Perbaikan Tahap 4/5 (bagian 11).

## 11. Cacat tahap sebelumnya yang ditemukan & diperbaiki di sini

- Laci menu seluler (Tahap 4) selalu tampak: atribut `hidden` dikalahkan
  kelas `.flex` → laci kini dirender hanya saat terbuka.
- Navbar kanonik meluap mendatar 375–1024 px setelah `whitespace-nowrap`
  (Tahap 4): nowrap/shrink-0 hanya `lg:`, `max-w-full`, nav `flex-wrap
  justify-center` (kelas nav layar tentang/struktur/program di ZIP).
- `/program` 375 (form urut/status), `/galeri` 375 (dua input tanggal),
  `/berita` 768 (kolom utama vs aside 320 px): `flex-wrap` / `min-w-0`.
- Tangkapan "375 px" Tahap 4/5 terpotong (jendela desktop minimum) — alat
  ukur baru `ukur-lebar.mjs` dipakai mulai tahap ini.
- Pencarian kelola pengaduan: placeholder "Cari ID Kasus atau Wilayah" tetapi
  `daftarPengaduan` mencari nomor/deskripsi saja — **belum** diubah (dicatat
  untuk Tahap 7/9).

## 12. Tindakan pemilik (produksi)

1. **Tambah volume Coolify** `warkop-lampiran` → `/app/unggahan-terjaga`
   (Storages) sebelum ada pengaduan berlampiran; tanpa itu lampiran hilang saat
   redeploy (image sudah membuat folder & `ENV UPLOAD_PRIVATE_DIR`).
2. Tinjau ambang rate limit setelah melihat lalu lintas nyata.

## 13. Cara menguji ulang

```powershell
cd D:\Deploy\LSM   # dev server: node server.js (restart mereset pembatas laju)
bash laporan/bukti-tahap-06/skrip/uji-api-tahap-06.sh     # b c d e f g h i j k m p
bash laporan/bukti-tahap-06/skrip/uji-l-rate-limit.sh      # l (habiskan kuota IP)
node laporan/bukti-tahap-06/skrip/ukur-lebar.mjs http://localhost:3000/kontak 375 tangkapan.png
```

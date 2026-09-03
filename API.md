# API.md — WARKOP NUSANTARA

Dokumentasi seluruh endpoint HTTP dan event Socket.io sistem WARKOP NUSANTARA
(Next.js 16, custom `server.js`). Setiap klaim di sini ditelusuri dari kode:
`app/api/**/route.js` (30 berkas, 47 metode), `app/unggahan/[...jalur]/route.js`,
`lib/auth/*`, `lib/validasi/*`, `lib/pembatasLajuUmum.js`, `lib/tokenFormulir.js`,
`lib/db/*`, `lib/socket/*`. Tabel peran per route sudah diverifikasi dengan curl
(`laporan/bukti-tahap-09/b1-tabel-penjaga-peran.md`, 246 pemeriksaan, 0 gagal).

Daftar isi

1. [Konvensi](#1-konvensi)
2. [Tabel ringkas seluruh endpoint](#2-tabel-ringkas-seluruh-endpoint)
3. [Rincian per endpoint](#3-rincian-per-endpoint)
   - 3.1 Kesehatan · 3.2 Autentikasi · 3.3 Artikel publik · 3.4 Pengaduan publik & pelacakan
   - 3.5 Staf: artikel · 3.6 Staf: pengaduan · 3.7 Staf: pengurus · 3.8 Staf: program
   - 3.9 Staf: galeri · 3.10 Staf: pengguna · 3.11 Staf: pengaturan · 3.12 Staf: ganti sandi
   - 3.13 Staf: unggah · 3.14 Staf: statistik · 3.15 Penyaji unggahan publik
4. [Event Socket.io](#4-event-socketio)
5. [Catatan keamanan](#5-catatan-keamanan)

---

## 1. Konvensi

### 1.1 URL dasar

| Lingkungan | Publik | Ruang staf |
|---|---|---|
| Produksi | `https://<domain>` | `https://staf.<domain>` (`STAF_HOST`) |
| Lokal (`node server.js`) | `http://localhost:3000` | sama (pemisahan host nonaktif bila `STAF_HOST` kosong) |

- `/api/*` **dilayani di kedua host** (`proxy.js`: jalur `/api/` termasuk `jalurBebasHost`).
  Halaman `/login` dan `/staf/*` yang diminta di domain publik dialihkan ke `staf.<domain>`.
- Cookie sesi diterbitkan oleh host tempat login terjadi (di produksi: `staf.<domain>`) dan
  tidak dikirim peramban ke host lain. Karena itu klien peramban untuk `/api/staf/*` harus
  memanggil dari `staf.<domain>`.
- Contoh di dokumen ini memakai `http://localhost:3000` dan `curl.exe` (PowerShell: alias
  `curl` = `Invoke-WebRequest`, keluarannya berbeda).

### 1.2 Autentikasi (sesi staf)

| Hal | Nilai (sumber) |
|---|---|
| Cookie | `warkop_token`; `httpOnly`, `sameSite=lax`, `path=/`, `secure` bila `NODE_ENV=production` atau `x-forwarded-proto: https` (`lib/auth/sesi.js`) |
| Isi | JWT HS256 (jose), issuer `warkop-nusantara`, `sub`=id pengguna, klaim `peran`, `wilayah_id`, `tv` (token_version). Tidak ada data lain (`lib/auth/jwt.js`) |
| Masa berlaku | `JWT_EXPIRY` (format jose `8h`/`30m`/`7d`), bawaan **8h**; `maxAge` cookie mengikuti nilai yang sama |
| Verifikasi per permintaan | tanda tangan + kedaluwarsa, **lalu** basis data: akun `aktif=1` dan `users.token_version` == `tv` (`ambilPenggunaSesi`). Token yang tanda tangannya sah tetapi versinya kadaluwarsa dianggap **tidak bersesi** |
| Pembatalan sesi | `token_version` naik saat: paksa keluar, reset sandi oleh superadmin, ganti sandi sendiri, perubahan peran / penonaktifan oleh superadmin |

Cara mendapatkan cookie untuk contoh curl:

```powershell
curl.exe -s -c cookie.txt -H "Content-Type: application/json" `
  -d "{\"email\":\"admin@contoh.id\",\"kataSandi\":\"<kata sandi>\"}" `
  http://localhost:3000/api/auth/login
# selanjutnya: curl.exe -b cookie.txt ...
```

### 1.3 Bentuk balasan

- Sukses: objek JSON (bentuk per endpoint di bagian 3). Kode 200, atau 201 untuk pembuatan.
- Galat: selalu `{ "galat": "<pesan Indonesia>", "kode": "<KODE_TETAP>" }`; beberapa endpoint
  menambah bidang: `bidang` (422 pengaduan), `cobaLagiDetik` (429 login), `sisaDetik`
  (429 pengaduan/lacak).
- Seluruh route yang dibungkus `denganPeran` (semua `/api/staf/*`) menyeragamkan galat
  (`lib/auth/penjaga.js`):

| Kode | `kode` | Kapan |
|---|---|---|
| 401 | `BELUM_MASUK` | tanpa cookie / token tidak sah / akun nonaktif / token_version beda |
| 403 | `TIDAK_BERHAK` | peran tidak termasuk daftar HAK route |
| 403 | `ASAL_TIDAK_SAH` | permintaan pengubah data dengan `Origin`/`Referer` lintas asal (1.5) |
| 400 | `JSON_TIDAK_SAH` | badan bukan JSON sah (`bacaJson`) |
| 400 | `ID_TIDAK_SAH` | parameter path `[id]` bukan bilangan bulat positif |
| 500 | `GALAT_SERVER` | galat tak terduga; detail tidak dibocorkan |

- Galat validasi = **422** dengan `kode` dari `lib/validasi/*.js` (dirinci per endpoint).

### 1.4 Header cache & kode status

- `cache-control: no-store` pada **semua** balasan API, kecuali:
  `GET /api/artikel`, `GET /api/artikel/[slug]` → `public, max-age=60`;
  `GET /unggahan/…` → `public, max-age=31536000, immutable`;
  `GET /api/staf/pengaduan/[id]/lampiran/[lampiranId]` → `private, no-store`.
  (Balasan 500 dari dua route artikel publik tidak menyetel header cache.)
- Kode status yang dipakai: 200, 201, 202 (honeypot), 304, 400, 401, 403, 404, 409, 413,
  415, 422, 429, 500, 503.

### 1.5 Syarat same-origin (CSRF, Tahap 9 B5)

`periksaAsal()` berjalan pada **setiap route `denganPeran`** (seluruh `/api/staf/*`) dan
`POST /api/auth/login`, untuk metode selain GET/HEAD/OPTIONS:

- bila header `Origin` (atau, bila tidak ada, `Referer`) dikirim, host-nya harus sama dengan
  `x-forwarded-host`/`host` permintaan → selain itu **403 `ASAL_TIDAK_SAH`**;
- tanpa `Origin`/`Referer` (curl, klien non-peramban) diizinkan;
- **tidak** diterapkan pada `POST /api/auth/logout` dan `POST /api/pengaduan` (keduanya tanpa `denganPeran`).

### 1.6 Pembatas laju

Penyimpanan di memori proses (satu container). IP dibaca dari `cf-connecting-ip`, lalu
`x-forwarded-for` (nilai pertama), lalu `x-real-ip`, bawaan `0.0.0.0`.

| Namespace | Sasaran | Ambang | Jendela | Yang dihitung | Balasan bila lewat |
|---|---|---|---|---|---|
| login (per IP) | `POST /api/auth/login` | 20 | 15 menit | **kegagalan** login | 429 `TERLALU_BANYAK_PERCOBAAN` + `cobaLagiDetik` |
| login (per akun/email) | `POST /api/auth/login` | 30 | 15 menit | kegagalan dari IP mana pun; login berhasil menghapus hitungan akun (hitungan IP tetap) | 429 idem |
| `pengaduan` (per IP) | `POST /api/pengaduan` | 10 | 60 menit | setiap permintaan (termasuk yang ditolak) | 429 `TERLALU_BANYAK` + `sisaDetik` |
| `lacak` (per IP) | `GET /api/pengaduan/lacak/[nomor]` (dan halaman `/lacak`) | 60 | 15 menit | setiap permintaan | 429 `TERLALU_BANYAK` + `sisaDetik` |
| `unggah_staf` (per akun `u:<id>`) | `POST /api/staf/unggah` | 60 | 60 menit | setiap permintaan | 429 `DIBATASI` |
| `unggah_publik` | — | 40 | 60 menit | **didefinisikan di `lib/pembatasLajuUmum.js` tetapi tidak dipakai route mana pun** | — |

Pesan 429 route publik netral (`pesanDibatasi`): "Terlalu banyak permintaan dari jaringan Anda
dalam waktu singkat. Ini pengaman otomatis, bukan penolakan laporan Anda — silakan coba lagi
dalam sekitar N menit, atau hubungi hotline kami."

### 1.7 Zona waktu

- Basis data menyimpan dan membaca WIB (pool mysql2 `timezone: '+07:00'` + `SET time_zone`);
  aplikasi mengisi kolom waktu dari `waktuSekarang()` (`YYYY-MM-DD HH:mm:ss` WIB), bukan `NOW()`.
- Stempel waktu yang **dibuat aplikasi di balasan** (`waktu` di `/api/health` dan muatan
  Socket.io) berformat ISO 8601 beroffset WIB: `2026-09-04T10:15:00+07:00` (`waktuISOWIB`).
- Kolom `*_pada` yang dibaca dari basis data tiba di route sebagai objek `Date` dan
  diserialisasi `NextResponse.json` sebagai ISO 8601 **UTC** (akhiran `Z`, mis.
  `2026-09-04T03:15:00.000Z`); itu instan yang sama (WIB = UTC + 7 jam). Klien harus
  menampilkannya dalam WIB, jangan mengandalkan zona waktu mesin.

---

## 2. Tabel ringkas seluruh endpoint

Peran: `superadmin`, `redaktur`, `penulis`, `verifikator`, `pimpinan_wilayah`
(`lib/auth/hakAkses.js`). "PUBLIK" = tanpa login. Batasan dalam kurung diperiksa di route/SQL.

| Metode | Jalur | Peran diizinkan | Rate limit | Ringkasan |
|---|---|---|---|---|
| GET | `/api/health` | PUBLIK | — | status aplikasi + koneksi DB (503 bila putus) |
| POST | `/api/auth/login` | PUBLIK | login 20/IP, 30/akun per 15 mnt | masuk, terbitkan cookie `warkop_token` |
| POST | `/api/auth/logout` | PUBLIK (audit bila bersesi) | — | hapus cookie sesi |
| GET | `/api/auth/saya` | semua peran bersesi | — | identitas pengguna aktif |
| GET | `/api/artikel` | PUBLIK | — | daftar artikel status `terbit` |
| GET | `/api/artikel/[slug]` | PUBLIK | — | detail artikel terbit + tag + terkait |
| POST | `/api/pengaduan` | PUBLIK | 10/IP per 60 mnt | kirim pengaduan (multipart/JSON), balas nomor kasus |
| GET | `/api/pengaduan/lacak/[nomor]` | PUBLIK | 60/IP per 15 mnt | lacak status kasus (kolom publik saja) |
| GET | `/api/staf/artikel` | superadmin, redaktur, penulis (miliknya), pimpinan_wilayah (wilayahnya) | — | daftar artikel staf |
| POST | `/api/staf/artikel` | superadmin, redaktur, penulis | — | buat artikel (draf) |
| GET | `/api/staf/artikel/[id]` | superadmin, redaktur, penulis (miliknya), pimpinan_wilayah (wilayahnya) | — | detail artikel + tag |
| PATCH | `/api/staf/artikel/[id]` | superadmin, redaktur, penulis (miliknya); `{status}` hanya superadmin/redaktur | — | sunting / draf / arsip |
| DELETE | `/api/staf/artikel/[id]` | superadmin, redaktur | — | hapus artikel |
| POST | `/api/staf/artikel/[id]/terbitkan` | superadmin, redaktur | — | terbitkan artikel |
| GET | `/api/staf/pengaduan` | superadmin, verifikator, pimpinan_wilayah (wilayahnya) | — | daftar pengaduan + hitungan per status |
| GET | `/api/staf/pengaduan/[id]` | superadmin, verifikator, pimpinan_wilayah (wilayahnya) | — | detail + riwayat + lampiran (identitas hanya superadmin/verifikator) |
| PATCH | `/api/staf/pengaduan/[id]` | superadmin, verifikator | — | tugaskan petugas (`petugas_id`) |
| POST | `/api/staf/pengaduan/[id]/status` | superadmin, verifikator | — | ubah status lewat buku besar (catatan wajib) |
| GET | `/api/staf/pengaduan/[id]/lampiran/[lampiranId]` | superadmin, verifikator, pimpinan_wilayah (wilayahnya) | — | unduh/lihat lampiran terjaga |
| GET | `/api/staf/pengurus` | superadmin, redaktur, pimpinan_wilayah | — | daftar pengurus |
| POST | `/api/staf/pengurus` | superadmin, redaktur | — | buat pengurus |
| GET | `/api/staf/pengurus/[id]` | superadmin, redaktur, pimpinan_wilayah | — | detail pengurus |
| PATCH | `/api/staf/pengurus/[id]` | superadmin, redaktur | — | ubah pengurus |
| DELETE | `/api/staf/pengurus/[id]` | superadmin, redaktur | — | hapus pengurus |
| PATCH | `/api/staf/pengurus/urutan` | superadmin, redaktur | — | simpan urutan tampil |
| GET | `/api/staf/program` | superadmin, redaktur, pimpinan_wilayah | — | daftar program |
| POST | `/api/staf/program` | superadmin, redaktur | — | buat program |
| GET | `/api/staf/program/[id]` | superadmin, redaktur, pimpinan_wilayah | — | detail program |
| PATCH | `/api/staf/program/[id]` | superadmin, redaktur | — | ubah program |
| DELETE | `/api/staf/program/[id]` | superadmin, redaktur | — | hapus program |
| GET | `/api/staf/galeri` | superadmin, redaktur, pimpinan_wilayah | — | daftar galeri |
| POST | `/api/staf/galeri` | superadmin, redaktur | — | buat item galeri (multipart) |
| GET | `/api/staf/galeri/[id]` | superadmin, redaktur, pimpinan_wilayah | — | detail galeri |
| PATCH | `/api/staf/galeri/[id]` | superadmin, redaktur | — | ubah galeri (multipart/JSON) |
| DELETE | `/api/staf/galeri/[id]` | superadmin, redaktur | — | hapus galeri + berkasnya |
| GET | `/api/staf/pengguna` | superadmin | — | daftar pengguna (tanpa hash) |
| POST | `/api/staf/pengguna` | superadmin | — | buat pengguna |
| GET | `/api/staf/pengguna/[id]` | superadmin | — | detail pengguna |
| PATCH | `/api/staf/pengguna/[id]` | superadmin | — | ubah pengguna |
| DELETE | `/api/staf/pengguna/[id]` | superadmin | — | hapus pengguna |
| POST | `/api/staf/pengguna/[id]/paksa-keluar` | superadmin | — | batalkan seluruh sesi pengguna |
| POST | `/api/staf/pengguna/[id]/reset-sandi` | superadmin | — | setel ulang sandi + wajib ganti |
| GET | `/api/staf/pengaturan` | superadmin | — | seluruh setelan + definisi |
| PATCH | `/api/staf/pengaturan` | superadmin | — | simpan setelan (daftar putih) |
| POST | `/api/staf/ganti-sandi` | semua peran staf | — | ganti sandi sendiri |
| POST | `/api/staf/unggah` | superadmin, redaktur, penulis, verifikator | 60/akun per 60 mnt | unggah gambar |
| GET | `/api/staf/statistik` | semua peran staf | — | angka dashboard (disaring per peran di SQL) |
| GET | `/unggahan/[...jalur]` | PUBLIK | — | penyaji berkas unggahan publik (bukan `/api`, bukan lampiran pengaduan) |

Total: 47 metode di `app/api` + 1 penyaji `/unggahan`.

---

## 3. Rincian per endpoint

Catatan umum untuk bagian 3.5–3.14 (route `denganPeran`): selain kode galat yang disebut per
endpoint, selalu mungkin 401 `BELUM_MASUK`, 403 `TIDAK_BERHAK`, 403 `ASAL_TIDAK_SAH`
(metode pengubah), 400 `JSON_TIDAK_SAH` (badan JSON rusak), 400 `ID_TIDAK_SAH` (path `[id]`),
500 `GALAT_SERVER`. Bidang badan JSON menerima nama `snake_case` **dan** `camelCase` di
tempat yang disebutkan (validator memakai `body.wilayah_id ?? body.wilayahId`, dst.).

### 3.1 Kesehatan

#### GET `/api/health` — PUBLIK

Memeriksa koneksi basis data (`SELECT 1`, batas sambung 5 detik).

```powershell
curl.exe -s -i http://localhost:3000/api/health
```

```json
{ "status": "sehat", "waktu": "2026-09-04T10:15:00+07:00", "basisData": "terhubung", "versi": "0.1.0" }
```

- 200 bila terhubung; **503** dengan `{"status":"terganggu","basisData":"terputus",…}` bila tidak.

### 3.2 Autentikasi

#### POST `/api/auth/login` — PUBLIK

Badan JSON:

| Bidang | Tipe | Wajib | Batas |
|---|---|---|---|
| `email` | string | ya | ≤ 190, di-trim & huruf kecil |
| `kataSandi` | string | ya | ≤ 200 |

```powershell
curl.exe -s -i -c cookie.txt -H "Content-Type: application/json" `
  -d "{\"email\":\"admin@contoh.id\",\"kataSandi\":\"<kata sandi>\"}" http://localhost:3000/api/auth/login
```

Balasan 200 (+ `Set-Cookie: warkop_token=…; HttpOnly; SameSite=Lax; Path=/; Max-Age=…`):

```json
{ "pengguna": { "id": 1, "nama": "Administrator", "email": "admin@contoh.id", "peran": "superadmin", "wilayah_id": null },
  "tujuan": "/staf/dashboard" }
```

Galat:

| Kode | `kode` | Keterangan |
|---|---|---|
| 400 | `BADAN_TIDAK_SAH` | badan bukan JSON |
| 400 | `MASUKAN_TIDAK_LENGKAP` | email/kata sandi kosong atau melebihi batas |
| 401 | `KREDENSIAL_TIDAK_SESUAI` | pesan **selalu sama** untuk email tidak terdaftar, sandi salah, dan akun nonaktif; bcrypt tetap dijalankan (hash penampung) agar durasi tidak membedakan |
| 403 | `ASAL_TIDAK_SAH` | Origin/Referer lintas asal |
| 429 | `TERLALU_BANYAK_PERCOBAAN` | + `cobaLagiDetik`; lihat 1.6 |

Audit: `login_gagal` (detail `alasan`: `email` / `sandi` / `nonaktif`) dan `login_berhasil`.

#### POST `/api/auth/logout` — PUBLIK

Tanpa badan. Selalu 200 `{ "keluar": true }` dan cookie dihapus (`Max-Age=0`). Bila ada sesi
sah, audit `logout`. Tidak menaikkan `token_version` (token lama yang masih tersimpan di luar
peramban tetap sah sampai kedaluwarsa — gunakan paksa-keluar bila perlu membatalkan).

#### GET `/api/auth/saya` — semua peran bersesi

```powershell
curl.exe -s -b cookie.txt http://localhost:3000/api/auth/saya
```

```json
{ "pengguna": { "id": 1, "nama": "Administrator", "email": "admin@contoh.id", "peran": "superadmin",
  "wilayah_id": null, "wilayah_nama": null, "token_version": 3, "wajib_ganti_sandi": 0 } }
```

401 `BELUM_MASUK` bila tidak bersesi. Tidak pernah memuat `kata_sandi_hash`.

### 3.3 Artikel publik

Bentuk baris artikel (dari `KOLOM_DAFTAR` `lib/db/artikel.js`, `penulis_id` dibuang untuk publik):
`id, judul, slug, ringkasan, gambar_utama, status, jumlah_dibaca, terbit_pada, dibuat_pada,
diperbarui_pada, kategori_id, kategori_nama, kategori_slug, penulis_nama, wilayah_id, wilayah_nama`.

#### GET `/api/artikel` — PUBLIK

Hanya `status = 'terbit'` (di SQL). Query:

| Parameter | Keterangan |
|---|---|
| `kategori` | slug kategori artikel (≤ 60) |
| `q` | kata kunci di judul/ringkasan/isi (≤ 100) |
| `halaman` | ≥ 1 (bawaan 1) |
| `perHalaman` | 1–50 (bawaan 9) |

```powershell
curl.exe -s "http://localhost:3000/api/artikel?kategori=investigasi&halaman=1&perHalaman=2"
```

```json
{ "baris": [ { "id": 12, "judul": "…", "slug": "…", "ringkasan": "…", "gambar_utama": "/unggahan/artikel/….jpg",
    "status": "terbit", "jumlah_dibaca": 41, "terbit_pada": "2026-08-30T02:00:00.000Z", "dibuat_pada": "…",
    "diperbarui_pada": "…", "kategori_id": 2, "kategori_nama": "Investigasi", "kategori_slug": "investigasi",
    "penulis_nama": "Redaksi", "wilayah_id": null, "wilayah_nama": null } ],
  "total": 1, "halaman": 1, "perHalaman": 2, "totalHalaman": 1 }
```

Galat: 500 `GALAT_SERVER`. Header `cache-control: public, max-age=60`.

#### GET `/api/artikel/[slug]` — PUBLIK

`slug` harus cocok `^[a-z0-9-]{1,255}$`. Balasan 200:

```json
{ "artikel": { "…kolom daftar…", "isi": "<p>HTML yang sudah disanitasi</p>" },
  "tag": [ { "id": 3, "nama": "Dana Desa", "slug": "dana-desa" } ],
  "terkait": [ "…maks 3 artikel terbit sekategori (tanpa isi)…" ] }
```

Galat: 400 `SLUG_TIDAK_SAH`, 404 `TIDAK_DITEMUKAN` (termasuk artikel draf/arsip), 500 `GALAT_SERVER`.

### 3.4 Pengaduan publik & pelacakan

#### POST `/api/pengaduan` — PUBLIK

Menerima **`multipart/form-data`** (formulir + lampiran) **atau `application/json`** (tanpa
lampiran). Pada multipart, semua bidang teks dibaca sebagai string; berkas dibaca dari field
`lampiran` atau `lampiran[]` (boleh berulang).

Urutan pemeriksaan (galat pertama yang kena dibalas):

1. Pembatas laju `pengaduan` 10/IP/60 mnt → 429 `TERLALU_BANYAK` + `sisaDetik`.
2. `Content-Length` > 42 MB (40 MB total lampiran + 2 MB) → **413** `LAMPIRAN_TOTAL_TERLALU_BESAR`.
3. Baca muatan. Gagal urai → 413 `LAMPIRAN_TERLALU_BESAR` bila `Content-Length` > batas per berkas, selain itu 400 `MUATAN_TIDAK_SAH`.
4. **Honeypot** `situs_web`: bila terisi (bukan string kosong) → **202** dengan nomor kasus palsu
   `{ "nomorKasus": "WRP-xxxxxx", "anonim": true, "diterima": false }` dan **tidak ada yang disimpan**.
5. **Token formulir** `token_formulir` (`lib/tokenFormulir.js`): format `<ms>.<HMAC-SHA256 hex 64>`
   (HMAC dari `JWT_SECRET`), umur **≥ 3 detik** dan **≤ 2 jam** → 400 `TOKEN_TIDAK_SAH`,
   `TERLALU_CEPAT`, atau `TOKEN_KEDALUWARSA`. Token dibuat saat halaman `/kontak` dirender di
   server dan disematkan di formulir; **tidak ada endpoint** untuk memintanya.
6. Validasi bidang (`lib/validasi/pengaduan.js`) → 422 `{galat, kode, bidang}`.
7. Lampiran: jumlah > 5 → 422 `LAMPIRAN_TERLALU_BANYAK`; per berkas > `UPLOAD_MAX_MB` (bawaan 20 MB)
   → 413 `LAMPIRAN_TERLALU_BESAR`; total > 40 MB → 413 `LAMPIRAN_TOTAL_TERLALU_BESAR`;
   **magic bytes** tidak cocok JPG/PNG/WebP/PDF/MP4 → 415 `LAMPIRAN_TIPE_TIDAK_SAH`. Semua
   diperiksa **sebelum** pengaduan dibuat (tidak ada pengaduan setengah jadi).
8. Simpan (satu transaksi: pengaduan + riwayat pertama `NULL → baru`), lampiran ke direktori
   **terjaga** `UPLOAD_PRIVATE_DIR/pengaduan/<acak 24 hex>/<acak 32 hex>.<ext>` (di luar `public/`,
   gambar dikompres ulang sharp, mode 0644), audit `pengaduan_masuk`, siaran `pengaduan:baru`.

Bidang badan:

| Bidang (alias) | Tipe | Wajib | Aturan |
|---|---|---|---|
| `token_formulir` | string | ya | lihat langkah 5 |
| `situs_web` | string | harus **kosong** | honeypot |
| `anonim` | `true`/`1`/`"1"`/`"true"`/`"on"`/`"ya"` | tidak | benar → seluruh bidang identitas **diabaikan dan disimpan NULL** apa pun isinya |
| `kategori_masalah` (`kategoriMasalah`, `kategori`) | slug | ya | salah satu: `korupsi`, `pelayanan-publik`, `agraria`, `infrastruktur`, `lingkungan`, `ketenagakerjaan`, `pungli`, `lainnya` → 422 `KATEGORI_TIDAK_SAH` |
| `wilayah_id` (`wilayahId`, `wilayah`) | int > 0 | tidak | 422 `WILAYAH_TIDAK_SAH` |
| `lokasi_kejadian` (`lokasiKejadian`) | string | tidak | ≤ 200 |
| `deskripsi` | string | ya | 30–10.000 karakter → 422 `DESKRIPSI_WAJIB` |
| `nama_pelapor` (`namaPelapor`, `nama`) | string | ya bila tidak anonim | 3–150 → 422 `NAMA_WAJIB` |
| `nik_pelapor` (`nikPelapor`, `nik`) | digit | tidak | bila diisi tepat 16 digit → 422 `NIK_TIDAK_SAH` |
| `telepon_pelapor` (`teleponPelapor`, `telepon`) | string | salah satu telepon/email wajib bila tidak anonim | ≤ 30, ≥ 8 digit → 422 `TELEPON_TIDAK_SAH`; keduanya kosong → 422 `KONTAK_WAJIB` |
| `email_pelapor` (`emailPelapor`, `email`) | string | idem | ≤ 190, pola email → 422 `EMAIL_TIDAK_SAH` |
| `lampiran` / `lampiran[]` | berkas | tidak | maks 5, 20 MB/berkas, total 40 MB, JPG/PNG/WebP/PDF/MP4 |

Contoh JSON (anonim, tanpa lampiran; `<token>` diambil dari HTML formulir `/kontak`):

```powershell
curl.exe -s -i -H "Content-Type: application/json" -d "{\"token_formulir\":\"<token>\",\"situs_web\":\"\",\"anonim\":true,\"kategori_masalah\":\"korupsi\",\"wilayah_id\":11,\"deskripsi\":\"Dugaan penyimpangan dana desa pada proyek jalan tahun 2026 …\"}" http://localhost:3000/api/pengaduan
```

Contoh multipart bernama dengan lampiran:

```powershell
curl.exe -s -i -F "token_formulir=<token>" -F "situs_web=" -F "kategori_masalah=pungli" `
  -F "nama_pelapor=Budi Santoso" -F "telepon_pelapor=081234567890" `
  -F "deskripsi=Petugas meminta biaya tambahan di luar tarif resmi saat mengurus dokumen …" `
  -F "lampiran=@bukti.jpg" -F "lampiran=@kuitansi.pdf" http://localhost:3000/api/pengaduan
```

Balasan **201** — hanya penanda, **tidak pernah memantulkan identitas**:

```json
{ "nomorKasus": "WRP-483920", "anonim": false, "lampiran": 2, "diterima": true }
```

Galat lain: 400 `BERKAS_KOSONG`, 413 `TERLALU_BESAR`, 415 `TIPE_TIDAK_SAH` / `GAMBAR_RUSAK`
(dari `GalatUnggahan`, pesan berawalan "Lampiran ditolak: "), 500 `GALAT_SERVER`
("Laporan belum dapat disimpan karena gangguan server …").

#### GET `/api/pengaduan/lacak/[nomor]` — PUBLIK

- Pembatas laju `lacak` 60/IP/15 mnt → 429 `TERLALU_BANYAK` + `sisaDetik`.
- `nomor` di-trim dan dihurufbesarkan; harus `WRP-` + 6 digit.
- Format salah **dan** nomor tidak ada dibalas **sama**: 404 `TIDAK_DITEMUKAN` dengan pesan
  netral "Nomor kasus tidak dikenali. Periksa kembali penulisannya (format WRP-XXXXXX)." —
  keberadaan kasus tidak bocor lewat perbedaan pesan.
- Hanya `KOLOM_PUBLIK` yang di-SELECT (`nomor_kasus, kategori_masalah, wilayah_nama, status,
  dibuat_pada, diperbarui_pada`) + riwayat status tanpa catatan/petugas. Tidak ada identitas,
  deskripsi, catatan internal, maupun nama petugas.

```powershell
curl.exe -s http://localhost:3000/api/pengaduan/lacak/WRP-483920
```

```json
{ "pengaduan": { "nomorKasus": "WRP-483920", "kategori": "pungli", "kategoriLabel": "Pungutan Liar",
    "wilayah": "Jawa Barat", "status": "diproses", "statusLabel": "Diproses",
    "dibuatPada": "2026-09-01T03:10:00.000Z", "diperbaruiPada": "2026-09-03T08:00:00.000Z" },
  "riwayat": [ { "statusSebelum": null, "statusSesudah": "baru", "statusLabel": "Baru", "pada": "…" },
               { "statusSebelum": "baru", "statusSesudah": "diverifikasi", "statusLabel": "Diverifikasi", "pada": "…" },
               { "statusSebelum": "diverifikasi", "statusSesudah": "diproses", "statusLabel": "Diproses", "pada": "…" } ] }
```

Status yang mungkin: `baru`, `diverifikasi`, `diproses`, `selesai`, `ditolak`. Galat: 500 `GALAT_SERVER`.

### 3.5 Staf: artikel

Bentuk `artikel` di balasan staf = `KOLOM_DAFTAR` (**termasuk `penulis_id`**) + `isi` pada detail.
Validasi (`lib/validasi/artikel.js`, semuanya 422):

| Bidang (alias) | Wajib | Aturan | `kode` |
|---|---|---|---|
| `judul` | ya | 5–255 | `JUDUL_WAJIB` |
| `kategori_id` (`kategoriId`) | ya | int > 0 (aturan 7: tidak ada artikel tanpa kategori) | `KATEGORI_WAJIB` |
| `wilayah_id` (`wilayahId`) | tidak | int > 0 atau kosong/null | `WILAYAH_TIDAK_SAH` |
| `isi` | ya | HTML ≤ 500.000 karakter mentah; disanitasi di server (`lib/sanitasi.js`); teks polos ≥ 10 | `ISI_TERLALU_PANJANG`, `ISI_WAJIB` |
| `ringkasan` | tidak | ≤ 600, tag HTML dibuang; kosong → 200 karakter pertama teks isi | — |
| `gambar_utama` (`gambarUtama`) | tidak | ≤ 255; harus diawali `/` (unggahan) atau `https://` | `GAMBAR_TIDAK_SAH` |
| `tag` | tidak | array atau string dipisah koma; unik, maks 10, tiap ≤ 40 | — |
| badan bukan objek | | | `MUATAN_TIDAK_SAH` |

#### GET `/api/staf/artikel`

Query: `status` (`draf`|`terbit`|`arsip`; lainnya diabaikan), `q` (≤ 100; judul atau nama
penulis), `halaman`, `perHalaman` (1–50, bawaan 10). Pembatasan di SQL: `penulis` hanya
`penulis_id = dirinya`; `pimpinan_wilayah` hanya `wilayah_id = wilayahnya` (tanpa wilayah → tidak ada baris).

```powershell
curl.exe -s -b cookie.txt "http://localhost:3000/api/staf/artikel?status=draf&perHalaman=5"
```

Balasan: `{ "baris": [...], "total", "halaman", "perHalaman", "totalHalaman" }` (urut `diperbarui_pada` DESC).

#### POST `/api/staf/artikel`

```powershell
curl.exe -s -i -b cookie.txt -H "Content-Type: application/json" -d "{\"judul\":\"Dana Desa Menguap\",\"kategori_id\":2,\"isi\":\"<p>Hasil penelusuran tim …</p>\",\"tag\":[\"dana desa\",\"audit\"]}" http://localhost:3000/api/staf/artikel
```

201 `{ "artikel": { …, "status": "draf", "slug": "dana-desa-menguap", "terbit_pada": null } }`. Slug otomatis unik
(akhiran `-2`, `-3`, …). Audit `artikel_buat`.

#### GET `/api/staf/artikel/[id]`

200 `{ "artikel": {...}, "tag": [ {id, nama, slug} ] }`. Galat: 404 `TIDAK_DITEMUKAN`; `penulis`
bukan pemilik → **403 `BUKAN_MILIK`**; `pimpinan_wilayah` wilayah lain → 404 (keberadaan tidak bocor).

#### PATCH `/api/staf/artikel/[id]`

Dua bentuk badan:

1. **Hanya** `{ "status": "draf" | "arsip" }` (tepat satu kunci) → perubahan status tanpa
   menerbitkan; hanya superadmin/redaktur (penulis → 403 `TIDAK_BERHAK`); nilai lain
   (termasuk `terbit`) → 422 `STATUS_TIDAK_SAH`. Audit `artikel_arsip` / `artikel_ke_draf`.
   Balasan `{ "artikel" }`.
2. Bidang artikel (tabel di atas): bidang yang tidak dikirim mengikuti nilai lama; `tag` hanya
   diganti bila dikirim (array/string). Slug **dibekukan** setelah artikel pernah terbit
   (`terbit_pada` terisi). Audit `artikel_sunting`. Balasan `{ "artikel", "tag" }`.

Pemeriksaan kepemilikan/wilayah sama dengan GET (403 `BUKAN_MILIK` / 404).

#### DELETE `/api/staf/artikel/[id]`

200 `{ "dihapus": true, "id": 12 }`; 404 `TIDAK_DITEMUKAN`. Audit `artikel_hapus`.

#### POST `/api/staf/artikel/[id]/terbitkan`

- 404 `TIDAK_DITEMUKAN`; 422 `KATEGORI_WAJIB` bila `kategori_id` kosong.
- Sudah terbit → 200 `{ "artikel", "sudahTerbit": true }` tanpa perubahan.
- Berhasil → 200 `{ "artikel" }` dengan `status: "terbit"`, `terbit_pada` diisi (WIB, hanya bila
  belum pernah terbit). Audit `artikel_terbit`; siaran `artikel:terbit`.

### 3.6 Staf: pengaduan

Bentuk `pengaduan` (staf): `KOLOM_UMUM` = `id, nomor_kasus, anonim, kategori_masalah, wilayah_id,
wilayah_nama, lokasi_kejadian, deskripsi, status, petugas_id, petugas_nama, dibuat_pada,
diperbarui_pada`; **hanya** untuk `superadmin`/`verifikator` ditambah `nama_pelapor, nik_pelapor,
telepon_pelapor, email_pelapor` (kolom tidak di-SELECT untuk peran lain — `kolomUntuk()`).
`pimpinan_wilayah` disaring `WHERE p.wilayah_id = ?` di SQL.

#### GET `/api/staf/pengaduan`

Query: `status` (salah satu 5 status), `kategori` (salah satu 8 slug), `q` (≤ 100; `nomor_kasus`
atau `deskripsi` LIKE), `halaman`, `perHalaman` (1–50, bawaan 10).

```powershell
curl.exe -s -b cookie.txt "http://localhost:3000/api/staf/pengaduan?status=baru"
```

```json
{ "baris": [ { "id": 7, "nomor_kasus": "WRP-483920", "anonim": 0, "kategori_masalah": "pungli", "wilayah_id": 11,
    "wilayah_nama": "Jawa Barat", "lokasi_kejadian": null, "deskripsi": "…", "status": "baru", "petugas_id": null,
    "petugas_nama": null, "dibuat_pada": "…", "diperbarui_pada": "…",
    "nama_pelapor": "…", "nik_pelapor": null, "telepon_pelapor": "…", "email_pelapor": null } ],
  "total": 1, "halaman": 1, "perHalaman": 10, "totalHalaman": 1,
  "perStatus": { "semua": 124, "baru": 12, "diverifikasi": 20, "diproses": 45, "selesai": 40, "ditolak": 7 } }
```

(Empat kolom identitas hanya ada untuk superadmin/verifikator; `perStatus` juga mengikuti wilayah.)

#### GET `/api/staf/pengaduan/[id]`

200:

```json
{ "pengaduan": { "…KOLOM_UMUM (+identitas bila berhak)…" },
  "riwayat": [ { "id": 1, "status_sebelum": null, "status_sesudah": "baru", "catatan": "Laporan diterima",
                 "oleh_user_id": null, "oleh_nama": null, "dibuat_pada": "…" } ],
  "lampiran": [ { "id": 3, "namaBerkas": "9f…c2.jpg", "tipeMime": "image/jpeg", "ukuran": 182331,
                  "dibuatPada": "…", "url": "/api/staf/pengaduan/7/lampiran/3" } ] }
```

- `path` disk lampiran **tidak** dibalas; klien memakai `url` terjaga.
- Bila peran berhak identitas **dan** pengaduan tidak anonim → audit `lihat_identitas_pelapor`.
- 404 `TIDAK_DITEMUKAN` (termasuk wilayah lain bagi pimpinan_wilayah).

#### PATCH `/api/staf/pengaduan/[id]` — penugasan petugas

Badan: `{ "petugas_id": 5 }` atau `{ "petugas_id": null }` (juga `""` = lepas).

| Kode | `kode` | Keterangan |
|---|---|---|
| 422 | `MUATAN_TIDAK_SAH` | tidak ada kunci `petugas_id` |
| 422 | `STATUS_LEWAT_BUKU_BESAR` | badan memuat `status` |
| 422 | `PETUGAS_TIDAK_SAH` | bukan int > 0, atau bukan akun aktif berperan verifikator/superadmin |
| 404 | `TIDAK_DITEMUKAN` | |

200 `{ "pengaduan": {…tanpa identitas…} }`. Audit `pengaduan_tugaskan` (detail `dari`, `ke`).

#### POST `/api/staf/pengaduan/[id]/status` — buku besar

Badan: `{ "status": "diverifikasi", "catatan": "Bukti kuitansi cocok dengan laporan" }`.

| Bidang | Aturan |
|---|---|
| `status` | `baru` / `diverifikasi` / `diproses` / `selesai` / `ditolak` → 422 `STATUS_TIDAK_SAH` |
| `catatan` | **wajib**, spasi dirapikan, ≥ 10 karakter, dipotong 2.000 → 422 `CATATAN_WAJIB` |

Galat lain: 404 `TIDAK_DITEMUKAN`; 422 `STATUS_SAMA` bila status sudah sama. Satu transaksi
(`SELECT … FOR UPDATE` → `UPDATE pengaduan` → `INSERT pengaduan_riwayat`).

```powershell
curl.exe -s -b cookie.txt -H "Content-Type: application/json" -d "{\"status\":\"diverifikasi\",\"catatan\":\"Bukti kuitansi cocok dengan laporan\"}" http://localhost:3000/api/staf/pengaduan/7/status
```

```json
{ "pengaduan": { "…tanpa identitas…", "status": "diverifikasi" },
  "riwayat": [ "…" ],
  "perubahan": { "statusSebelum": "baru", "statusSesudah": "diverifikasi", "riwayatId": 19 } }
```

Audit `pengaduan_ubah_status`; siaran `pengaduan:status`.

#### GET `/api/staf/pengaduan/[id]/lampiran/[lampiranId]` — lampiran terjaga

- Pengaduan harus terjangkau peran (pimpinan_wilayah: wilayahnya, selain itu 404) dan lampiran
  harus milik pengaduan itu (404 `TIDAK_DITEMUKAN`); berkas hilang di disk → 404 `BERKAS_HILANG`.
- Berkas dibaca dari `UPLOAD_PRIVATE_DIR` (path tersimpan `/terjaga/pengaduan/<acak>/<nama>`;
  data lama `/unggahan/…` masih dibaca dari `UPLOAD_DIR`).
- Balasan 200 berupa aliran berkas dengan header:
  `content-type` (dari ekstensi tervalidasi), `content-length`, `cache-control: private, no-store`,
  `x-content-type-options: nosniff`, `content-security-policy: default-src 'none'; sandbox`,
  `content-disposition: inline; filename="…"` untuk gambar, `attachment; filename="…"` untuk PDF/MP4.
- Setiap pembukaan diaudit `lihat_lampiran_pengaduan` (detail `pengaduanId`, `tipe`).

```powershell
curl.exe -s -b cookie.txt -o bukti.jpg -D - http://localhost:3000/api/staf/pengaduan/7/lampiran/3
```

### 3.7 Staf: pengurus

Bentuk `pengurus`: `id, nama, jabatan, tingkat, wilayah_id, wilayah_nama, foto, deskripsi,
aktif_sejak, urutan, aktif`. Validasi `validasiPengurus` (422):

| Bidang (alias) | Wajib | Aturan | `kode` |
|---|---|---|---|
| `nama` | ya | 3–150 | `NAMA_WAJIB` |
| `jabatan` | ya | 2–150 | `JABATAN_WAJIB` |
| `tingkat` | ya | `pusat` / `wilayah` | `TINGKAT_TIDAK_SAH` |
| `wilayah_id` (`wilayahId`) | wajib bila `tingkat=wilayah` | int > 0 | `ID_TIDAK_SAH`, `WILAYAH_WAJIB` |
| `foto` | tidak | ≤ 255, diawali `/` atau `https://` | `GAMBAR_TIDAK_SAH` |
| `deskripsi` | tidak | ≤ 2.000 | — |
| `aktif_sejak` (`aktifSejak`) | tidak | tahun 1900–2100 | `TAHUN_TIDAK_SAH` |
| `urutan` | tidak | 0–9999 (bawaan 0) | — |
| `aktif` | tidak | bawaan 1; `true/1/"1"/"true"/"on"` = 1 | — |

- **GET `/api/staf/pengurus`** → `{ "baris": [...], "total": n }` (urut tingkat pusat→wilayah, urutan, nama).
- **POST `/api/staf/pengurus`** → 201 `{ "pengurus" }`; audit `pengurus_buat`.
- **GET `/api/staf/pengurus/[id]`** → `{ "pengurus" }`; 404 `TIDAK_DITEMUKAN`.
- **PATCH `/api/staf/pengurus/[id]`** → bidang yang tidak dikirim mengikuti nilai lama; `{ "pengurus" }`; audit `pengurus_ubah`.
- **DELETE `/api/staf/pengurus/[id]`** → `{ "dihapus": true, "id" }`; audit `pengurus_hapus`.
- **PATCH `/api/staf/pengurus/urutan`** — badan `{ "urutan": [3, 1, 2] }` (id unik, semua harus ada):
  422 `URUTAN_TIDAK_SAH` / `ID_TIDAK_DIKENAL`; 200 `{ "tersimpan": 3, "baris": [...] }`; audit `pengurus_urutan`.

```powershell
curl.exe -s -i -b cookie.txt -H "Content-Type: application/json" -d "{\"nama\":\"Sri Wahyuni\",\"jabatan\":\"Ketua Umum\",\"tingkat\":\"pusat\",\"aktif_sejak\":2021}" http://localhost:3000/api/staf/pengurus
```

### 3.8 Staf: program

Bentuk `program`: `id, judul, slug, ringkasan, isi, gambar, kategori, status, wilayah_id,
wilayah_nama, mulai_pada, selesai_pada, dibuat_pada`. Validasi `validasiProgram` (422):

| Bidang (alias) | Wajib | Aturan | `kode` |
|---|---|---|---|
| `judul` | ya | 5–255; slug otomatis unik | `JUDUL_WAJIB` |
| `kategori` | ya | `pengawasan-dana` / `observasi-kebijakan` / `bantuan-hukum` | `KATEGORI_TIDAK_SAH` |
| `status` | tidak | `berjalan` (bawaan) / `selesai` | `STATUS_TIDAK_SAH` |
| `ringkasan` | tidak | ≤ 600 | — |
| `isi` | tidak | ≤ 20.000 | — |
| `gambar` | tidak | ≤ 255, `/` atau `https://` | `GAMBAR_TIDAK_SAH` |
| `wilayah_id` (`wilayahId`) | tidak | int > 0 | `ID_TIDAK_SAH` |
| `mulai_pada` / `selesai_pada` (`mulaiPada`/`selesaiPada`) | tidak | `YYYY-MM-DD`; selesai ≥ mulai | `TANGGAL_TIDAK_SAH`, `RENTANG_TIDAK_SAH` |

- **GET `/api/staf/program`** — query `kategori`, `status`, `urut` (`terbaru` bawaan / `terlama`,
  menurut `mulai_pada`), `halaman`, `perHalaman` (1–50, bawaan 50) → `{ baris, total, halaman, perHalaman, totalHalaman }`.
- **POST** → 201 `{ "program" }`; audit `program_buat`.
- **GET/PATCH/DELETE `/api/staf/program/[id]`** → `{ "program" }` / `{ "program" }` / `{ "dihapus": true, "id" }`;
  404 `TIDAK_DITEMUKAN`; audit `program_ubah` / `program_hapus`. PATCH mengganti slug mengikuti judul.

### 3.9 Staf: galeri

Bentuk `galeri`: `id, judul, deskripsi, jenis, berkas, thumbnail, kategori, wilayah_id,
wilayah_nama, lokasi, tanggal_kegiatan, dibuat_pada`.

Muatan (`lib/galeriUnggah.js`): **`multipart/form-data`** dengan bidang teks + berkas `berkas`
(foto JPG/PNG/WebP atau video MP4, menurut `jenis`) + `thumbnail` opsional (gambar); **JSON juga
diterima** (tanpa berkas — `berkas`/`thumbnail` sebagai jalur string, dipakai PATCH metadata).
Berkas: magic bytes, nama acak, sharp untuk gambar, disimpan di `UPLOAD_DIR/galeri/` dan
dibalas sebagai jalur `/unggahan/galeri/<acak>.<ext>`.

| Bidang | Wajib | Aturan | `kode` (422 kecuali disebut) |
|---|---|---|---|
| `judul` | ya | 3–255 | `JUDUL_WAJIB` |
| `jenis` | tidak | `foto` (bawaan) / `video` | `JENIS_TIDAK_SAH` |
| `kategori` | ya | `investigasi-lapangan` / `sosialisasi` / `audiensi-publik` | `KATEGORI_TIDAK_SAH` |
| `berkas` | ya saat POST | berkas unggahan, atau jalur `/`/`https://` | `BERKAS_WAJIB`, `GAMBAR_TIDAK_SAH` |
| `thumbnail` | tidak | gambar | `GAMBAR_TIDAK_SAH` |
| `deskripsi` | tidak | ≤ 2.000 | — |
| `wilayah_id` | tidak | int > 0 | `ID_TIDAK_SAH` |
| `lokasi` | tidak | ≤ 200 | — |
| `tanggal_kegiatan` (`tanggalKegiatan`) | tidak | `YYYY-MM-DD` | `TANGGAL_TIDAK_SAH` |
| ukuran | | `Content-Length` > `UPLOAD_MAX_MB`+2 MB, berkas > `UPLOAD_MAX_MB`, atau multipart gagal diurai > 9 MB | **413** `TERLALU_BESAR` |
| tipe | | magic bytes bukan JPG/PNG/WebP/MP4; video bukan MP4; foto bukan gambar | **415** `TIPE_TIDAK_SAH` |
| muatan | | bukan multipart/JSON sah | **400** `MUATAN_TIDAK_SAH` |

- **GET `/api/staf/galeri`** — query `kategori`, `halaman`, `perHalaman` (1–60, bawaan 60) → paginasi standar.
- **POST `/api/staf/galeri`** → 201 `{ "galeri" }`; audit `galeri_buat`.

```powershell
curl.exe -s -i -b cookie.txt -F "judul=Audiensi Warga Cianjur" -F "kategori=audiensi-publik" -F "jenis=foto" -F "tanggal_kegiatan=2026-08-20" -F "berkas=@foto.jpg" http://localhost:3000/api/staf/galeri
```

- **GET `/api/staf/galeri/[id]`** → `{ "galeri" }`; 404 `TIDAK_DITEMUKAN`.
- **PATCH `/api/staf/galeri/[id]`** → multipart atau JSON; `berkas`/`thumbnail` opsional (mengganti); bidang lain mengikuti nilai lama; `{ "galeri" }`; audit `galeri_ubah`.
- **DELETE `/api/staf/galeri/[id]`** → hapus baris **dan** berkas di disk (`/unggahan/galeri/…`); `{ "dihapus": true, "id" }`; audit `galeri_hapus`.

### 3.10 Staf: pengguna (superadmin saja)

Bentuk `pengguna` (`KOLOM_AMAN`, **tanpa hash**): `id, nama, email, peran, wilayah_id, wilayah_nama,
aktif, token_version, wajib_ganti_sandi, terakhir_masuk, dibuat_pada, diperbarui_pada`.

Validasi `validasiPengguna` / `validasiKataSandi` (422):

| Bidang (alias) | Wajib | Aturan | `kode` |
|---|---|---|---|
| `nama` | ya | 3–100 | `NAMA_WAJIB` |
| `email` | ya | ≤ 190, pola email, huruf kecil | `EMAIL_TIDAK_SAH` |
| `peran` | ya | salah satu 5 peran | `PERAN_TIDAK_SAH` |
| `wilayah_id` (`wilayahId`) | wajib bila `pimpinan_wilayah` | int > 0 | `WILAYAH_TIDAK_SAH`, `WILAYAH_WAJIB` |
| `aktif` | tidak | bawaan 1 | — |
| `kata_sandi` (`kataSandi`) — hanya POST | ya | 10–200 karakter, memuat huruf **dan** angka | `SANDI_LEMAH`, `SANDI_TERLALU_PANJANG` |

- **GET `/api/staf/pengguna`** → `{ "baris": [...], "total": n }`.
- **POST `/api/staf/pengguna`** → 201 `{ "pengguna" }`; 409 `EMAIL_DUPLIKAT`; hash bcrypt 12 putaran; audit `pengguna_buat`.

```powershell
curl.exe -s -i -b cookie.txt -H "Content-Type: application/json" -d "{\"nama\":\"Rina Verifikator\",\"email\":\"rina@contoh.id\",\"peran\":\"verifikator\",\"kata_sandi\":\"<sandi kuat>\"}" http://localhost:3000/api/staf/pengguna
```

- **GET `/api/staf/pengguna/[id]`** → `{ "pengguna" }`; 404.
- **PATCH `/api/staf/pengguna/[id]`** — `nama, email, peran, wilayah_id, aktif` (yang tidak dikirim mengikuti nilai lama):

| Kode | `kode` | Keterangan |
|---|---|---|
| 422 | `DIRI_SENDIRI` | menonaktifkan / menurunkan peran akun sendiri |
| 422 | `SUPERADMIN_TERAKHIR` | menonaktifkan / menurunkan superadmin aktif terakhir |
| 409 | `EMAIL_DUPLIKAT` | email dipakai pengguna lain |

  Perubahan peran atau penonaktifan menaikkan `token_version` (sesi pengguna itu batal). Audit `pengguna_ubah`.
- **DELETE `/api/staf/pengguna/[id]`** → `{ "dihapus": true, "id" }`; 422 `DIRI_SENDIRI` / `SUPERADMIN_TERAKHIR`;
  **409 `PUNYA_DATA`** bila punya artikel/riwayat (FK RESTRICT) — nonaktifkan saja. Audit `pengguna_hapus`.
- **POST `/api/staf/pengguna/[id]/paksa-keluar`** → `token_version` naik, seluruh token lama batal seketika;
  200 `{ "pengguna", "dipaksaKeluar": true }`; boleh pada diri sendiri. Audit `pengguna_paksa_keluar`.
- **POST `/api/staf/pengguna/[id]/reset-sandi`** — badan `{ "kata_sandi_baru": "…" }` (alias `kataSandiBaru`);
  hash baru + `wajib_ganti_sandi=1` + `token_version` naik; 200 `{ "pengguna", "wajibGantiSandi": true }`.
  Kata sandi **tidak** dicatat di audit (`pengguna_reset_sandi`, detail `{wajibGanti:true}`).

### 3.11 Staf: pengaturan (superadmin saja)

Daftar putih kunci = `lib/pengaturanDefinisi.js` (13 kunci): `statistik_laporan_ditangani`,
`statistik_provinsi_tercover`, `statistik_tahun_mengawasi` (angka); `kontak_email`,
`kontak_hotline`, `kontak_alamat_gedung`, `kontak_alamat_jalan`, `kontak_alamat_kota` (teks);
`visi`, `misi`, `teks_kebijakan_privasi`, `teks_pedoman_komunitas`, `teks_faq` (teks_panjang).

#### GET `/api/staf/pengaturan`

```json
{ "nilai": { "statistik_laporan_ditangani": "12000", "kontak_email": "pengaduan@warkopnusantara.id", "…": "…" },
  "definisi": [ { "kunci": "kontak_email", "label": "Email resmi", "tipe": "teks", "kelompok": "kontak", "bawaan": "…", "deskripsi": "…" } ],
  "daftarPutih": [ "statistik_laporan_ditangani", "…" ] }
```

Kunci yang belum ada di DB diisi nilai bawaan.

#### PATCH `/api/staf/pengaturan`

Badan `{ "<kunci>": "<nilai>", … }`. Semua kunci diperiksa dulu; **satu salah = seluruh kiriman
ditolak** (tidak ada simpan sebagian). Aturan per tipe (`lib/validasi/pengaturan.js`, 422):

| Tipe | Aturan | `kode` |
|---|---|---|
| kunci di luar daftar putih | pesan menyebut kunci salah + daftar yang diizinkan | `KUNCI_TIDAK_SAH` |
| `angka` | bilangan bulat 1–12 digit | `TIPE_ANGKA` |
| `teks` | tidak kosong, ≤ 255, tanpa tag HTML; `kontak_email` harus email | `WAJIB`, `TERLALU_PANJANG`, `HTML_DILARANG`, `TIPE_EMAIL` |
| `teks_panjang` | tidak kosong, ≤ 20.000, tanpa `<script|iframe|object|embed|style>` | `WAJIB`, `TERLALU_PANJANG`, `HTML_DILARANG` |
| badan | objek non-array, minimal satu kunci | `MUATAN_TIDAK_SAH`, `KOSONG` |

```powershell
curl.exe -s -b cookie.txt -X PATCH -H "Content-Type: application/json" -d "{\"kontak_hotline\":\"0800-1-927567\",\"statistik_tahun_mengawasi\":\"16\"}" http://localhost:3000/api/staf/pengaturan
```

200 `{ "tersimpan": ["kontak_hotline","statistik_tahun_mengawasi"], "nilai": { "kontak_hotline": "0800-1-927567", "statistik_tahun_mengawasi": "16" } }`.
Audit `pengaturan_simpan` (detail: daftar kunci).

### 3.12 Staf: ganti sandi

#### POST `/api/staf/ganti-sandi` — semua peran staf

Badan `{ "kata_sandi_lama": "…", "kata_sandi_baru": "…" }` (alias `kataSandiLama` / `kataSandiBaru`).

| Kode | `kode` | Keterangan |
|---|---|---|
| 422 | `SANDI_LEMAH` / `SANDI_TERLALU_PANJANG` | aturan 10–200 karakter, huruf + angka |
| 422 | `SANDI_SAMA` | baru == lama |
| 401 | `SANDI_LAMA_SALAH` | bcrypt tidak cocok |

200 `{ "diganti": true }` + **cookie sesi baru** (token lama batal karena `token_version` naik;
`wajib_ganti_sandi` → 0). Audit `ganti_sandi_sendiri`.

### 3.13 Staf: unggah

#### POST `/api/staf/unggah` — superadmin, redaktur, penulis, verifikator

`multipart/form-data`: field `berkas` (wajib) + `tujuan` opsional (`artikel` bawaan | `pengurus` |
`program` | `galeri`; nilai lain → `artikel`). Hanya **gambar** JPG/PNG/WebP (magic bytes), batas
`min(UPLOAD_MAX_MB, 5 MB)`, dikompres ulang sharp (lebar maks 1920, metadata dibuang), nama acak,
disimpan `UPLOAD_DIR/<tujuan>/`.

| Kode | `kode` |
|---|---|
| 429 | `DIBATASI` (60/akun/jam, sebelum berkas dibaca) |
| 400 | `FORM_TIDAK_SAH` (bukan multipart), `BERKAS_KOSONG` |
| 413 | `TERLALU_BESAR` |
| 415 | `TIPE_TIDAK_SAH`, `GAMBAR_RUSAK` |

```powershell
curl.exe -s -i -b cookie.txt -F "berkas=@sampul.png" -F "tujuan=artikel" http://localhost:3000/api/staf/unggah
```

201:

```json
{ "jalur": "/unggahan/artikel/3f9c…a1.png", "namaBerkas": "3f9c…a1.png", "tipeMime": "image/png", "ukuran": 184223, "lebar": 1600, "tinggi": 900 }
```

Audit `unggah_gambar` (detail `tujuan`, `namaBerkas`, `ukuran`, `tipe`).

### 3.14 Staf: statistik

#### GET `/api/staf/statistik` — semua peran staf

Seluruh angka disaring di SQL: `penulis` → artikel miliknya; `pimpinan_wilayah` → wilayahnya.

```json
{ "kartu": { "totalArtikel": 42, "artikelBulanIni": 3, "pengaduanMasuk": 12, "pengaduanSelesai": 40, "totalPengaduan": 124 },
  "tren": [ { "bulan": "2025-10", "jumlah": 4 }, "… 12 bulan, bulan kosong = 0 …" ],
  "pengaduanTerbaru": [ { "id": 7, "nomor_kasus": "WRP-483920", "kategori_masalah": "pungli", "wilayah_nama": "Jawa Barat", "status": "baru", "dibuat_pada": "…" } ],
  "artikelTerbaru": [ { "id": 12, "judul": "…", "slug": "…", "status": "draf", "diperbarui_pada": "…", "kategori_nama": "…", "penulis_nama": "…" } ],
  "aktivitas": [ { "id": 88, "aksi": "artikel_terbit", "tabel_terkait": "artikel", "id_terkait": 12, "dibuat_pada": "…", "nama_user": "…" } ],
  "jumlahSocket": 3 }
```

- `pengaduanTerbaru` (maks 5) hanya untuk peran `pengaduan_lihat`, selain itu `[]`; tanpa identitas/deskripsi.
- `artikelTerbaru` (maks 5) hanya untuk peran `artikel_lihat`, selain itu `[]`.
- `aktivitas` (10 baris `audit_log`, tanpa `detail`) dan `jumlahSocket` hanya superadmin
  (untuk peran lain `aktivitas: []` dan kunci `jumlahSocket` tidak ada).

### 3.15 Penyaji unggahan publik

#### GET `/unggahan/[...jalur]` — PUBLIK (bukan `/api`)

Menyajikan berkas dari `UPLOAD_DIR` (gambar artikel/pengurus/program/galeri, video galeri) karena
Next.js produksi tidak melayani berkas yang ditambah ke `public/` setelah server mulai.

- Segmen jalur hanya `[a-z0-9_.-]`, tidak diawali `.`, tidak boleh keluar dari `UPLOAD_DIR`.
- Prefiks `pengaduan/` **selalu 404** — lampiran pengaduan hanya lewat route terjaga 3.6.
- Ekstensi harus dikenal (`jpg, jpeg, png, webp, pdf, mp4`); selain itu 404.
- Balasan 200: `content-type` dari ekstensi, `content-length`, `cache-control: public, max-age=31536000, immutable`
  (nama acak 128-bit), `x-content-type-options: nosniff`, `content-disposition: inline; filename="…"`, `etag`.
  `If-None-Match` cocok → 304.
- 404 berupa teks polos `Tidak ditemukan` (bukan JSON).

---

## 4. Event Socket.io

Sumber: `lib/socket/server.js`, `lib/socket/siaran.js`, `hooks/useSocket.js`.

| Hal | Nilai |
|---|---|
| Path | `/socket.io` pada `http.Server` yang sama dengan Next.js (`server.js`) |
| Asal | **same-origin**; tidak ada konfigurasi CORS (cookie httpOnly tidak lintas subdomain). Klien memakai `window.location.origin` (`NEXT_PUBLIC_WS_URL` hanya bila diisi), `withCredentials: true`, transport `websocket` lalu `polling` |
| Autentikasi handshake | cookie `warkop_token` → verifikasi jose → DB (`aktif`, `token_version`). Gagal = handshake **ditolak** (`connect_error` dengan pesan `TANPA_TOKEN`, `TOKEN_TIDAK_SAH`, `AKUN_NONAKTIF`, `SESI_DIBATALKAN`, `GALAT_AUTENTIKASI`); klien berhenti mencoba ulang pada empat kode pertama |
| Room | `global`, `user:<id>` untuk semua; `staf` untuk semua peran **kecuali** `pimpinan_wilayah`; `wilayah:<wilayah_id>` hanya `pimpinan_wilayah` (sesuai wilayahnya) |
| Batas | `maxHttpBufferSize` 16 KB, `pingInterval` 25 s, `pingTimeout` 20 s, `serveClient: false` |
| Event dari klien | hanya `room:saya` (ack mengembalikan daftar room socket itu, diagnostik); event lain diabaikan |

Tiga event server → klien (muatan disusun **hanya** di `lib/socket/siaran.js`; route API tidak
menyentuh `io`):

| Event | Dipicu oleh | Room tujuan | Muatan |
|---|---|---|---|
| `pengaduan:baru` | `POST /api/pengaduan` (setelah tersimpan) | `staf` + `wilayah:<id>` bila ada wilayah | `{ nomorKasus, kategori, wilayahId, wilayah, status: "baru", waktu }` |
| `pengaduan:status` | `POST /api/staf/pengaduan/[id]/status` | `staf` + `wilayah:<id>` | `{ nomorKasus, kategori, wilayahId, wilayah, status, waktu, statusSebelum, statusSesudah }` |
| `artikel:terbit` | `POST /api/staf/artikel/[id]/terbitkan` | `staf` | `{ judul, slug, kategori, penulis, waktu }` |

`waktu` = `waktuISOWIB()` (`…+07:00`). **Larangan identitas**: muatan siaran tidak pernah memuat
`nama_pelapor, nik_pelapor, telepon_pelapor, email_pelapor, deskripsi, catatan, petugas_nama,
petugas, namaPelapor, nik, telepon, email` (`KUNCI_TERLARANG`, dipakai uji otomatis). Dashboard yang
butuh detail mengambil lewat API berpagar peran. Kegagalan siaran tidak menggagalkan permintaan
HTTP (dicatat ke log server saja). Event yang terjadi saat klien terputus hilang; klien memanggil
`onSambungUlang` untuk menyinkronkan ulang lewat API.

---

## 5. Catatan keamanan

1. **Identitas pelapor** (`nama_pelapor`, `nik_pelapor`, `telepon_pelapor`, `email_pelapor`) hanya
   untuk `superadmin` dan `verifikator` (`HAK.pengaduan_identitas`, dihitung dari peran, bukan dari
   permintaan). Untuk peran lain kolom **tidak di-SELECT** (`kolomUntuk()` di `lib/db/pengaduan.js`).
   Tidak pernah ke: `/api/pengaduan` (balasan hanya nomor kasus), `/api/pengaduan/lacak/*`
   (`KOLOM_PUBLIK`), balasan PATCH/POST status (dibaca ulang dengan `bolehLihatIdentitas: false`),
   statistik, Socket.io, `audit_log.detail`, maupun log server.
2. `anonim=true` → identitas **diabaikan** saat validasi dan **dipaksa NULL** saat INSERT
   (dua lapisan: `validasiKirimanPengaduan` dan `buatPengaduan`); formulir klien bahkan tidak
   mengirim bidangnya (`lib/pengaduanFormulir.js`).
3. **Tidak ada endpoint yang mengembalikan kata sandi atau hash.** `kata_sandi_hash` hanya
   dibaca `cariUserByEmail` untuk login/ganti sandi dan tidak pernah diserialisasi; `ambilUser*`
   memakai `KOLOM_AMAN`. Kata sandi baru tidak masuk audit.
4. **Empat lapisan penjaga**: cookie httpOnly → `proxy.js` (pemisahan host, tanda tangan JWT saja;
   kenyamanan, bukan pagar) → `requireUser` di layout `/staf` → `denganPeran`/`requireRole` di
   **setiap** route API dengan verifikasi DB (`aktif` + `token_version`). Uji otomatis Tahap 2
   gagal bila ada route non-publik tanpa penjaga.
5. **Same-origin** untuk semua metode pengubah data di route staf dan login (1.5), di atas
   `SameSite=Lax`.
6. **Unggahan**: magic bytes (bukan ekstensi/Content-Type), nama acak `crypto`, gambar dikompres
   ulang sharp (metadata/muatan tersembunyi dibuang), mode 0644, jalur tanpa `../`; lampiran
   pengaduan di direktori terjaga di luar `public/`, disajikan hanya lewat route berpagar peran
   dengan `nosniff` + CSP `default-src 'none'; sandbox` + `attachment` untuk non-gambar.
7. **Pembukaan lampiran pengaduan** dan **pembukaan identitas** selalu tercatat di `audit_log`.
8. **Buku besar status**: satu-satunya jalan mengubah `pengaduan.status` adalah
   `ubahStatusPengaduan()` (transaksi, `FOR UPDATE`, riwayat + catatan wajib ≥ 10 karakter);
   PATCH penugasan menolak kunci `status` (422 `STATUS_LEWAT_BUKU_BESAR`).
9. **Seluruh SQL** di `lib/db/*` lewat prepared statement (`execute`); route API tidak menulis SQL.
10. **Perlindungan akun**: tidak bisa menonaktifkan/menurunkan/menghapus diri sendiri atau
    superadmin aktif terakhir; pesan login seragam + bcrypt penampung; pembatas laju login dua sumbu
    tanpa kunci permanen.
11. **`audit_log`** (kolom `user_id, aksi, tabel_terkait, id_terkait, detail JSON, ip, dibuat_pada`;
    `lib/db/audit.js`). Aksi yang dicatat oleh pemanggil `catatAudit`:

| Kelompok | `aksi` |
|---|---|
| Autentikasi | `login_gagal` (detail `alasan`), `login_berhasil`, `logout`, `ganti_sandi_sendiri` |
| Pengaduan | `pengaduan_masuk` (user_id NULL; detail `anonim`, jumlah `lampiran`), `lihat_identitas_pelapor` (API detail **dan** halaman `/staf/pengaduan/[id]`), `lihat_lampiran_pengaduan`, `pengaduan_tugaskan`, `pengaduan_ubah_status` |
| Artikel | `artikel_buat`, `artikel_sunting`, `artikel_arsip`, `artikel_ke_draf`, `artikel_hapus`, `artikel_terbit` |
| Konten | `pengurus_buat`, `pengurus_ubah`, `pengurus_hapus`, `pengurus_urutan`, `program_buat`, `program_ubah`, `program_hapus`, `galeri_buat`, `galeri_ubah`, `galeri_hapus` |
| Pengguna & setelan | `pengguna_buat`, `pengguna_ubah`, `pengguna_hapus`, `pengguna_paksa_keluar`, `pengguna_reset_sandi`, `pengaturan_simpan` |
| Unggahan | `unggah_gambar` |

`detail` tidak pernah memuat identitas pelapor maupun kata sandi (aturan di `lib/db/audit.js`).

12. Catatan yang perlu diketahui pengelola (bukan cacat, tetapi perilaku aktual kode):
    - `GET /api/staf/pengaduan` (daftar) juga memuat kolom identitas untuk superadmin/verifikator;
      pencatatan `lihat_identitas_pelapor` hanya terjadi pada GET detail.
    - `POST /api/auth/logout` tidak menaikkan `token_version`; token yang disalin keluar peramban
      tetap berlaku sampai kedaluwarsa (gunakan paksa-keluar).
    - Namespace pembatas `unggah_publik` tersedia di `lib/pembatasLajuUmum.js` tetapi belum dipakai route mana pun.
    - `GET /api/artikel` tidak meneruskan parameter `rentang` yang didukung `ambilArtikelTerbit`
      (filter rentang waktu hanya dipakai halaman server).

# B1 — Tabel penjaga peran seluruh route API (hasil telusur kode, 4 Sep 2026)

Sumber: `lib/auth/hakAkses.js` (matriks HAK), `lib/auth/penjaga.js` (`denganPeran` → `ambilPenggunaSesi` ke DB (aktif + token_version) → `requireRole` → 401 `BELUM_MASUK` / 403 `TIDAK_BERHAK`). Uji curl menyeluruh: `b1-uji-curl-semua-peran.txt`.

## Matriks HAK

| Hak | Peran |
|---|---|
| artikel_lihat | superadmin, redaktur, penulis, pimpinan_wilayah |
| artikel_buat | superadmin, redaktur, penulis |
| artikel_sunting | superadmin, redaktur, penulis (penulis hanya miliknya — dicek di route) |
| artikel_hapus | superadmin, redaktur |
| artikel_terbitkan | superadmin, redaktur |
| pengaduan_lihat | superadmin, verifikator, pimpinan_wilayah |
| pengaduan_ubah_status | superadmin, verifikator |
| pengaduan_identitas | superadmin, verifikator |
| konten_lihat | superadmin, redaktur, pimpinan_wilayah |
| konten_kelola | superadmin, redaktur |
| pengguna_kelola | superadmin |
| pengaturan_kelola | superadmin |
| unggah | superadmin, redaktur, penulis, verifikator |
| statistik, ruang_staf | semua peran staf |

## Seluruh route API (30 berkas, 47 metode)

| Route | Metode | Pembungkus | Peran diizinkan | Berkas:baris |
|---|---|---|---|---|
| /api/health | GET | PUBLIK (healthcheck; 503 bila DB putus) | siapa saja | app/api/health/route.js:11 |
| /api/auth/login | POST | PUBLIK (titik masuk; rate limit IP+email, pesan seragam, audit login_gagal) | siapa saja | app/api/auth/login/route.js:19 |
| /api/auth/logout | POST | tanpa penjaga (hapus cookie; audit bila ada sesi) | siapa saja | app/api/auth/logout/route.js:8 |
| /api/auth/saya | GET | ambilPenggunaSesi manual → 401 | semua peran bersesi | app/api/auth/saya/route.js:8 |
| /api/artikel | GET | PUBLIK (hanya status terbit di SQL; penulis_id dibuang) | siapa saja | app/api/artikel/route.js:8 |
| /api/artikel/[slug] | GET | PUBLIK (hanyaTerbit; slug regex) | siapa saja | app/api/artikel/[slug]/route.js:9 |
| /api/pengaduan | POST | PUBLIK (pelapor anonim; rate limit 10/60 mnt, honeypot, token formulir, magic bytes) | siapa saja | app/api/pengaduan/route.js:34 |
| /api/pengaduan/lacak/[nomor] | GET | PUBLIK (rate limit 60/15 mnt; KOLOM_PUBLIK; 404 netral) | siapa saja | app/api/pengaduan/lacak/[nomor]/route.js:16 |
| /api/staf/artikel | GET | denganPeran(HAK.artikel_lihat) | superadmin, redaktur, penulis, pimpinan_wilayah | app/api/staf/artikel/route.js:19 |
| /api/staf/artikel | POST | denganPeran(HAK.artikel_buat) | superadmin, redaktur, penulis | app/api/staf/artikel/route.js:34 |
| /api/staf/artikel/[id] | GET | denganPeran(HAK.artikel_lihat) | superadmin, redaktur, penulis, pimpinan_wilayah | app/api/staf/artikel/[id]/route.js:39 |
| /api/staf/artikel/[id] | PATCH | denganPeran(HAK.artikel_sunting) (+ penulis hanya miliknya; status draf/arsip hanya artikel_terbitkan) | superadmin, redaktur, penulis | app/api/staf/artikel/[id]/route.js:46 |
| /api/staf/artikel/[id] | DELETE | denganPeran(HAK.artikel_hapus) | superadmin, redaktur | app/api/staf/artikel/[id]/route.js:75 |
| /api/staf/artikel/[id]/terbitkan | POST | denganPeran(HAK.artikel_terbitkan) | superadmin, redaktur | app/api/staf/artikel/[id]/terbitkan/route.js:14 |
| /api/staf/pengaduan | GET | denganPeran(HAK.pengaduan_lihat) (+ wilayahTerbatas, bolehLihatIdentitas) | superadmin, verifikator, pimpinan_wilayah | app/api/staf/pengaduan/route.js:12 |
| /api/staf/pengaduan/[id] | GET | denganPeran(HAK.pengaduan_lihat) (+ audit lihat_identitas_pelapor) | superadmin, verifikator, pimpinan_wilayah | app/api/staf/pengaduan/[id]/route.js:25 |
| /api/staf/pengaduan/[id] | PATCH | denganPeran(HAK.pengaduan_ubah_status) | superadmin, verifikator | app/api/staf/pengaduan/[id]/route.js:40 |
| /api/staf/pengaduan/[id]/status | POST | denganPeran(HAK.pengaduan_ubah_status) | superadmin, verifikator | app/api/staf/pengaduan/[id]/status/route.js:17 |
| /api/staf/pengaduan/[id]/lampiran/[lampiranId] | GET | denganPeran(HAK.pengaduan_lihat) (+ wilayah 404, audit lihat_lampiran_pengaduan) | superadmin, verifikator, pimpinan_wilayah | app/api/staf/pengaduan/[id]/lampiran/[lampiranId]/route.js:21 |
| /api/staf/pengurus | GET | denganPeran(HAK.konten_lihat) | superadmin, redaktur, pimpinan_wilayah | app/api/staf/pengurus/route.js:13 |
| /api/staf/pengurus | POST | denganPeran(HAK.konten_kelola) | superadmin, redaktur | app/api/staf/pengurus/route.js:18 |
| /api/staf/pengurus/[id] | GET | denganPeran(HAK.konten_lihat) | superadmin, redaktur, pimpinan_wilayah | app/api/staf/pengurus/[id]/route.js:18 |
| /api/staf/pengurus/[id] | PATCH | denganPeran(HAK.konten_kelola) | superadmin, redaktur | app/api/staf/pengurus/[id]/route.js:25 |
| /api/staf/pengurus/[id] | DELETE | denganPeran(HAK.konten_kelola) | superadmin, redaktur | app/api/staf/pengurus/[id]/route.js:37 |
| /api/staf/pengurus/urutan | PATCH | denganPeran(HAK.konten_kelola) | superadmin, redaktur | app/api/staf/pengurus/urutan/route.js:12 |
| /api/staf/program | GET | denganPeran(HAK.konten_lihat) | superadmin, redaktur, pimpinan_wilayah | app/api/staf/program/route.js:12 |
| /api/staf/program | POST | denganPeran(HAK.konten_kelola) | superadmin, redaktur | app/api/staf/program/route.js:18 |
| /api/staf/program/[id] | GET | denganPeran(HAK.konten_lihat) | superadmin, redaktur, pimpinan_wilayah | app/api/staf/program/[id]/route.js:18 |
| /api/staf/program/[id] | PATCH | denganPeran(HAK.konten_kelola) | superadmin, redaktur | app/api/staf/program/[id]/route.js:25 |
| /api/staf/program/[id] | DELETE | denganPeran(HAK.konten_kelola) | superadmin, redaktur | app/api/staf/program/[id]/route.js:37 |
| /api/staf/galeri | GET | denganPeran(HAK.konten_lihat) | superadmin, redaktur, pimpinan_wilayah | app/api/staf/galeri/route.js:16 |
| /api/staf/galeri | POST | denganPeran(HAK.konten_kelola) | superadmin, redaktur | app/api/staf/galeri/route.js:22 |
| /api/staf/galeri/[id] | GET | denganPeran(HAK.konten_lihat) | superadmin, redaktur, pimpinan_wilayah | app/api/staf/galeri/[id]/route.js:35 |
| /api/staf/galeri/[id] | PATCH | denganPeran(HAK.konten_kelola) | superadmin, redaktur | app/api/staf/galeri/[id]/route.js:42 |
| /api/staf/galeri/[id] | DELETE | denganPeran(HAK.konten_kelola) | superadmin, redaktur | app/api/staf/galeri/[id]/route.js:59 |
| /api/staf/pengguna | GET | denganPeran(HAK.pengguna_kelola) | superadmin | app/api/staf/pengguna/route.js:15 |
| /api/staf/pengguna | POST | denganPeran(HAK.pengguna_kelola) | superadmin | app/api/staf/pengguna/route.js:20 |
| /api/staf/pengguna/[id] | GET | denganPeran(HAK.pengguna_kelola) | superadmin | app/api/staf/pengguna/[id]/route.js:21 |
| /api/staf/pengguna/[id] | PATCH | denganPeran(HAK.pengguna_kelola) (+ larangan diri sendiri / superadmin terakhir) | superadmin | app/api/staf/pengguna/[id]/route.js:28 |
| /api/staf/pengguna/[id] | DELETE | denganPeran(HAK.pengguna_kelola) | superadmin | app/api/staf/pengguna/[id]/route.js:56 |
| /api/staf/pengguna/[id]/reset-sandi | POST | denganPeran(HAK.pengguna_kelola) | superadmin | app/api/staf/pengguna/[id]/reset-sandi/route.js:15 |
| /api/staf/pengguna/[id]/paksa-keluar | POST | denganPeran(HAK.pengguna_kelola) | superadmin | app/api/staf/pengguna/[id]/paksa-keluar/route.js:13 |
| /api/staf/pengaturan | GET | denganPeran(HAK.pengaturan_kelola) | superadmin | app/api/staf/pengaturan/route.js:19 |
| /api/staf/pengaturan | PATCH | denganPeran(HAK.pengaturan_kelola) | superadmin | app/api/staf/pengaturan/route.js:24 |
| /api/staf/ganti-sandi | POST | denganPeran(HAK.ruang_staf) (+ verifikasi sandi lama) | semua peran staf | app/api/staf/ganti-sandi/route.js:17 |
| /api/staf/unggah | POST | denganPeran(HAK.unggah) | superadmin, redaktur, penulis, verifikator | app/api/staf/unggah/route.js:17 |
| /api/staf/statistik | GET | denganPeran(HAK.statistik) (+ data per peran/wilayah di SQL) | semua peran staf | app/api/staf/statistik/route.js:13 |

Ringkasan: 41 metode `denganPeran`, 1 cek sesi manual (`/api/auth/saya`), 5 publik + `logout`.

## Penjaga di luar API

- `app/(staf)/staf/layout.js:20` — `requireUser(HAK.ruang_staf)` untuk seluruh `/staf/*` (sesi diverifikasi ke DB; tanpa sesi → `/login?lanjut=…`; peran asing → `/tanpa-akses`).
- `proxy.js:43` — pemisahan host (STAF_HOST), verifikasi tanda tangan JWT saja (bukan pagar), `/staf/*` tanpa token → `/login`, `/login` bertoken → dashboard; header identitas dari klien dihapus.
- `app/unggahan/[...jalur]/route.js:15` — publik sengaja (gambar artikel/galeri); prefiks `pengaduan/` ditolak 404; lampiran pengaduan hanya lewat route terjaga.

## Catatan auditor

- `scripts/seed.js` membaca `database/seed.sql`; `sql/02-seed.sql` adalah salinan identik — risiko divergensi (lihat laporan bagian A).
- `/api/auth/saya` satu-satunya route non-publik tanpa `denganPeran` (setara "peran apa pun bersesi"); tidak melanggar kebijakan.
- Akun seed staf (penulis/redaktur/verifikator/redaksi/pimpinan wilayah kode 12) tersimpan `aktif=0` dengan hash `'!'` sampai `SEED_STAF_PASSWORD` diisi; superadmin dari `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (tidak di repo).

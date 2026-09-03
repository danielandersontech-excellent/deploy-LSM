# Uji e — sidebar bukan pagar (2026-09-03T17:56:06Z). Baris = peran; kolom = route API dari menu yang TIDAK tampil untuk peran itu.
login: superadmin=200 redaktur=200 penulis=200 verifikator=200 pimpinan_wilayah=200

| Peran | Menu tersembunyi | Route API | HTTP (harapan) |
|---|---|---|---|
| redaktur | Kelola Pengaduan | GET /api/staf/pengaduan | 403 (403) |
| redaktur | Pengguna | GET /api/staf/pengguna | 403 (403) |
| redaktur | Pengguna | POST /api/staf/pengguna | 403 (403) |
| redaktur | Pengaturan | GET /api/staf/pengaturan | 403 (403) |
| redaktur | Pengaturan | PATCH /api/staf/pengaturan | 403 (403) |
| penulis | Kelola Pengaduan | GET /api/staf/pengaduan | 403 (403) |
| penulis | Pengurus | GET /api/staf/pengurus | 403 (403) |
| penulis | Pengurus | POST /api/staf/pengurus | 403 (403) |
| penulis | Program | POST /api/staf/program | 403 (403) |
| penulis | Galeri | GET /api/staf/galeri | 403 (403) |
| penulis | Pengguna | GET /api/staf/pengguna | 403 (403) |
| penulis | Pengaturan | PATCH /api/staf/pengaturan | 403 (403) |
| penulis | Terbitkan artikel | POST /api/staf/artikel/38/terbitkan | 403 (403) |
| verifikator | Kelola Artikel | GET /api/staf/artikel | 403 (403) |
| verifikator | Pengurus | GET /api/staf/pengurus | 403 (403) |
| verifikator | Program | GET /api/staf/program | 403 (403) |
| verifikator | Galeri | POST /api/staf/galeri | 403 (403) |
| verifikator | Pengguna | GET /api/staf/pengguna | 403 (403) |
| verifikator | Pengaturan | GET /api/staf/pengaturan | 403 (403) |
| pimpinan_wilayah | Pengguna | GET /api/staf/pengguna | 403 (403) |
| pimpinan_wilayah | Pengaturan | PATCH /api/staf/pengaturan | 403 (403) |
| pimpinan_wilayah | Pengurus (tulis) | POST /api/staf/pengurus | 403 (403) |
| pimpinan_wilayah | Program (tulis) | POST /api/staf/program | 403 (403) |
| pimpinan_wilayah | Galeri (tulis) | POST /api/staf/galeri | 403 (403) |
| pimpinan_wilayah | Artikel (tulis) | POST /api/staf/artikel | 403 (403) |
| pimpinan_wilayah | Pengaduan status | POST /api/staf/pengaduan/1/status | 403 (403) |
| (tanpa cookie) | semua | GET /api/staf/pengaturan | 401 (401) |
| superadmin (kontrol) | — | GET /api/staf/pengaturan | 200 (200) |

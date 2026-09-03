# LAPORAN TAHAP 09 — PENGERASAN DAN KESIAPAN PRODUKSI

Tanggal: 4 September 2026 (WIB). Mode: OTONOM (gerbang-mandiri ALUR 7.2).
Sikap tahap ini: mencari cacat pada pekerjaan sendiri. Setiap butir disertai bukti berkas di
`laporan/bukti-tahap-09/` (skrip yang bisa diulang di `skrip/`). Uji yang tidak bisa dijalankan
dinyatakan TIDAK DIUJI beserta alasannya — tidak ada hasil yang diasumsikan.

Ringkasan satu paragraf: kode mati dihapus (halaman uji, 5 komponen yatim, 13 fungsi/konstanta lib,
default export Tombol); audit keamanan aktif LULUS (47 metode × 6 identitas = 246 pemeriksaan peran 0 gagal;
154 payload injeksi tanpa satu pun lolos; CSRF same-origin ditambahkan; rate limit 4 titik; lampiran tak
tertebak; header CSP/HSTS/Permissions-Policy diuji di peramban); 14 aturan diperiksa dengan bukti; alur
5 peran 36 langkah LULUS; beban 50 pengguna 0 galat; Lighthouse A11y 98–100/BP 100/SEO 100 tetapi
**Performance 70–77 < 90** (font belum disubset — keputusan pemilik yang masih menunggu); kesetiaan 14 layar
cacat export 0; DB dimatikan → 503 + pesan rapi → pulih sendiri; cadangan dipulihkan ke DB kosong dengan
checksum identik. **Temuan kritis di sisi server: Coolify membakar rahasia (DB_PASSWORD, JWT_SECRET,
SEED_ADMIN_PASSWORD) ke layer image produksi karena variabel masih "Available at Buildtime"** — harus
diperbaiki pemilik lalu rahasia dirotasi (bagian 9–10). Firewall/SSH/panel Coolify juga belum sesuai daftar
periksa (butuh sudo — di luar wewenang akun deployer).

## 1. Hasil telusur kode mati (bagian A)

Bukti: `a-kode-mati-dihapus.txt` (inventaris lengkap oleh telusur ulang seluruh route/komponen/lib/deps).

Dihapus dari repo:

| Item | Alasan |
|---|---|
| `app/uji-desain/page.js` (+ entri `/uji-desain` di `app/robots.js`) | halaman uji Tahap 0, dijadwalkan hapus di Tahap 9 |
| `components/ui/Kartu.js`, `Pemuat.js`, `Tabel.js`, `Select.js`, `Input.js` | 0 importir (setiap formulir memakai konstanta kelas lokal); `Input` hanya diimpor `Select` yang juga mati |
| `components/ui/Tombol.js` — default export `<Tombol>` | tidak pernah diimpor; `KELAS_TOMBOL` (10 pemakai) dipertahankan |
| `lib/auth/hakAkses.js: bolehAkses`; `lib/auth/pembatasLaju.js: KONFIG_PEMBATAS, setelUlangPembatas`; `lib/db/pengaduan.js: hapusLunakPengaduan`; `lib/db/program.js: ambilProgramBySlug`; `lib/db/users.js: hitungUser, nonaktifkanUser, ubahKataSandi`; `lib/db/wilayah.js: ambilSemuaWilayah, ambilWilayah`; `lib/kategoriGaleri.js: labelKategoriGaleri`; `lib/pembatasLajuUmum.js: KONFIG_PEMBATAS_UMUM, setelUlangPembatasUmum, namespace unggah_publik` | 0 pemakai di kode aplikasi |
| 16 ekspor lib diturunkan menjadi konstanta/fungsi internal (`SEMUA_PERAN`, `masaBerlakuDetik`, `permintaanAman`, `nomorKasusAcak`, `SLUG_KATEGORI_PENGADUAN`, `menuStaf`, `BATAS_LAMPIRAN`, `DESKRIPSI_MIN`, `TAG_DIIZINKAN`, `ATRIBUT_DIIZINKAN`, `ambilCookie`, `roomUntuk`, `JENIS_GAMBAR`, `direktoriUnggahan`, `direktoriTerjaga`, `validasiNilaiPengaturan`) | dipakai hanya di berkasnya sendiri |

Diragukan — TIDAK dihapus, alasannya:

- 13 handler `GET` route staf CRUD (`/api/staf/{artikel,galeri,pengaduan,pengaturan,pengguna,pengurus,program}` dan `[id]`-nya): tidak ada pemanggil di antarmuka (halaman staf server component membaca `lib/db` langsung), tetapi merupakan kontrak API yang diwajibkan REFERENSI 12 / TAHAP-05 / TAHAP-07, dipakai skrip verifikasi tahap, dan seluruhnya berpagar peran identik dengan halamannya. Keputusan pemilik bila ingin dihapus.
- `/api/auth/saya`, `/api/artikel*`, `/api/pengaduan/lacak/[nomor]`, `/api/staf/statistik` (kontrak/diagnostik), `/api/health` (HEALTHCHECK).
- `ambilWilayahByKode`, `memuatIdentitas`, `FIELD_IDENTITAS`, `KUNCI_TERLARANG`: diimpor skrip bukti Tahap 2/6/8 (dipertahankan agar bukti bisa diulang).
- `components/ui/Ikon.js: DAFTAR_IKON`: aset resmi `paket-pendukung` (baca-saja) — tidak diubah.
- `dependencies`: semua terpakai (`dotenv` hanya `scripts/seed.js` + skrip uji; `cross-env` untuk `npm start` di Windows). Tidak ada yang dihapus dari `package.json`.
- `app/uji-proxy/`: sudah tidak ada sejak Tahap 2 (diverifikasi).
- `.gitignore`: `desain/`, ZIP, logo asli, `.env*`, `_backup*/`, `cadangan/` ✅; `.dockerignore`: `desain`, `paket-pendukung`, `dokumen`, `laporan`, `*.md` (kecuali README), `.env*` ✅ (`laporan/`, `dokumen/`, `paket-pendukung/` ikut repo secara sengaja — bukti & dokumen diversikan).

Lint dan build hijau setelah penghapusan (`build-produksi.txt`).

## 2. Tabel penjaga peran lengkap (B1) + hasil curl

Tabel: `b1-tabel-penjaga-peran.md` (30 berkas route, 47 metode: 41 `denganPeran`, 1 cek sesi manual
`/api/auth/saya`, 5 publik beralasan + `logout`). Uji: `b1-uji-curl-semua-peran.txt` —
`uji-b1-semua-route-semua-peran.mjs` memanggil **47 route × (tanpa login + 5 peran)**; peran tak berhak wajib
403, tanpa login wajib 401, peran berhak tidak boleh 401/403. **246 pemeriksaan, 0 gagal.**

Route publik tanpa penjaga dan kompensasinya: `/api/health` (tanpa data), `/api/artikel*` (hanya status
terbit di SQL, `penulis_id` dibuang), `POST /api/pengaduan` (rate limit 10/60 mnt, honeypot, token
formulir HMAC, magic bytes, anonim→NULL), `/api/pengaduan/lacak/[nomor]` (60/15 mnt, KOLOM_PUBLIK, 404
netral), `/api/auth/login` (rate limit dua sumbu, pesan seragam, audit), `/api/auth/logout`.

## 3. `npm audit` dan dukungan versi (B8)

`b8-npm-audit.txt`: **0 kerentanan**. Next.js 16.3.4 = dist-tag `latest` di registry (masa dukungan
aktif); React 19.2.8, socket.io 4.8.3, mysql2 3.24.3, jose 5.10.0, sharp 0.35.4, isomorphic-dompurify 3.19.0,
bcryptjs 2.4.3, slugify 1.6.9. Tidak ada advisori tersisa untuk dibahas.

## 4. Empat belas aturan (bagian C) — satu per satu dengan bukti

| # | Aturan | Hasil | Bukti |
|---|---|---|---|
| 1 | Zona waktu OS/container/sesi DB/kolom = WIB | ✅ host `Asia/Jakarta`, container `date` WIB, `TZ=Asia/Jakarta`; sesi pool aplikasi (dijalankan di dalam container produksi) `@@session.time_zone=+07:00`; baris `pengaduan` terbaru tersimpan WIB. Server MariaDB global = UTC (disengaja; aplikasi menyetel sesi per koneksi) | `c1-c7-b7-server-produksi.txt`, `c1-sesi-db-produksi.txt`, `c1-sesi-db-lokal.txt` |
| 2 | Rahasia tidak bocor ke log build | ❌ **GAGAL di produksi (sisi Coolify)**: `docker history` image 3c64be4 memuat `DB_PASSWORD=…`, `JWT_SECRET=…`, `SEED_ADMIN_PASSWORD=…` sebagai build-arg di 3 layer RUN (nilai dihitung, tidak dicetak). Dockerfile repo tidak mendeklarasikan ARG rahasia; Coolify menyuntikkan semua variabel ber-"Available at Buildtime". Log build via API tidak dapat diambil (token hanya izin deploy). | `c2-log-build-coolify.txt`, bagian 9–10 |
| 3 | Setiap route API punya penjaga | ✅ | bagian 2 |
| 4 | Tidak ada `!important` | ✅ 0 (2 kemunculan hanya di komentar) | `c4-c5-c12-penelusuran.txt` |
| 5 | Tidak ada `100vh` | ✅ 0 di kelas/style. **Cacat ditemukan & diperbaiki**: `min-h-screen` (=100vh) masih ada di `app/layout.js` (body), `/login`, `/tanpa-akses` → `min-h-dvh` (preseden `h-dvh` KerangkaStaf) | idem; `useViewportTinggi.js` |
| 6 | Hamparan layar penuh satu pendekatan | ✅ satu hamparan modal: `components/ui/Dialog.js` (portal, `role=dialog`, tinggi dari `useViewportTinggi`); laci sidebar seluler `fixed inset-0` sebagai tombol penutup (tanpa tinggi 100vh); `fixed inset-0 z-0` di login/not-found hanya latar dekoratif | `c6-hamparan.txt` |
| 7 | Tidak ada data tanpa induk | ✅ produksi: pengaduan tanpa riwayat 0, artikel tanpa kategori 0, rantai putus 0; lokal (DB hasil pemulihan): 0/0 | `c1-c7-b7-server-produksi.txt`, `d5-e-pemulihan-cadangan.txt` |
| 8 | Daftar putih pengaturan lengkap | ✅ 13 kunci API identik dengan `PENGATURAN_DEFINISI` (satu sumber, formulir dibangkitkan darinya); kunci asing → 422; simpan-muat ulang 13/13 kunci lalu dipulihkan | `b2-b4-b5-b6-c8-c13-keamanan.txt` C8 |
| 9 | Tidak ada kode mati | ✅ | bagian 1 |
| 10 | Tanpa `output:'standalone'`, `/api/health` ada | ✅ `next.config.mjs` tanpa standalone; healthcheck container `healthy`, gagal beruntun 0 | `next.config.mjs`, `c1-c7-b7-server-produksi.txt` |
| 11 | Build hijau ≠ sistem jalan: proxy di image & berjalan | ✅ `/app/proxy.js` di image produksi; `Location` 307 pemisahan host ke `https://staf.…` tanpa `0.0.0.0` (0 kemunculan); `/staf/*` tanpa token → `/login?lanjut=` | `c11-g-proxy-port-ssh-produksi.txt` |
| 12 | `await` semua API permintaan | ✅ 30 berkas diperiksa, 0 tanpa `await` (5 temuan awal skrip = `request.nextUrl.searchParams`, bukan prop) | `c12-await-params.txt`, `skrip/cek-await-params.mjs` |
| 13 | Identitas pelapor tidak pernah keluar | ✅ pengaduan BERNAMA diuji di 7 saluran: HTML beranda, JSON & HTML `/lacak`, API detail penulis (403), API detail & daftar pimpinan wilayah (0 identitas; kontrol verifikator 4/4), HTML dashboard pimpinan wilayah; muatan socket (Tahap 8) | `…keamanan.txt` C13 |
| 14 | Setiap perubahan bisa dibatalkan | ✅ cabang percobaan: `git revert` 35fe129 lalu 3c64be4 (Tahap 08 utuh) → berkas socket hilang → `npm run build` exit 0 → cabang dibuang. Catatan: revert satu commit tahap saja bentrok dengan commit STATUS sesudahnya; revert berurutan mundur bersih. `git log --oneline` satu commit per tahap terlampir | `c14-git-revert.txt` |

## 5. Hasil pengujian menyeluruh (bagian D)

**D1 alur ujung ke ujung** (`d1-alur-per-peran.txt`, `skrip/uji-d1-alur-per-peran.mjs` — setiap langkah dicetak
sebagai permintaan HTTP + hasil yang diharapkan sehingga bisa diulang): Warga (beranda → artikel → pengaduan
anonim 201 → lacak status baru) · Penulis (draf 201, sunting 200, terbitkan **403**, publik 404) · Redaktur
(tinjau draf, terbitkan 200, `/api/artikel/<slug>` & `/berita/<slug>` 200) · Verifikator (daftar baru, detail
anonim tanpa identitas, tanpa catatan 422, diverifikasi→diproses, riwayat 3 baris berantai, lacak publik tanpa
catatan internal) · Superadmin (buat pengguna 201, login pengguna baru, pengaturan simpan-pulih, paksa keluar →
sesi lama 401, aktivitas audit, hapus pengguna berjejak **409** → nonaktifkan 200). **36 langkah, 0 gagal**
(build produksi lokal).

**D2 beban** (`d2-beban.txt`): 50 pengguna bersamaan × 10 putaran (GET `/` + `/berita`) = 1000 permintaan
dalam 10,4 s (96,6 req/s), 0 galat. `/` p50 376 ms / p95 784 ms; `/berita` p50 551 ms / p95 1122 ms. RSS server:
180 MB → 546–564 MB saat beban → 342 MB 5 s kemudian (cetak biru: RAM yang lebih dulu penuh — benar; container
produksi perlu ≥ 1 GB untuk beban setara).

**D3 peramban** (`d3-peramban.txt`): Chrome 152 (seluruh uji CDP) ✅; Microsoft Edge 152 headless
menjalankan uji B3 (10 halaman publik+staf, CSP, font, hidrasi, socket) ✅ LULUS. **Firefox tidak terpasang;
Safari macOS, Chrome Android, Safari iOS TIDAK TERSEDIA → TIDAK DIUJI** (uji khusus iOS: keyboard terbuka,
elemen setinggi layar, rotasi — belum dilakukan). Mitigasi yang ada: tidak ada `100vh` (dvh + `useViewportTinggi`),
formulir standar HTML. Risiko tersisa di bagian 9.

**D4 Lighthouse 12** (mobile, build produksi lokal, CSP/HSTS aktif; `d4-lighthouse.md`, laporan HTML/JSON di
`lighthouse/`):

| Halaman | Performance | Accessibility | Best Practices | SEO | Kontras |
|---|---|---|---|---|---|
| `/` | **70** | 100 | 100 | 100 | lulus |
| `/berita` | **77** | 98 (heading-order) | 100 | 100 | lulus |
| `/berita/<slug>` | **73** | 100 | 100 | 100 | lulus |
| `/kontak` | **77** | 100 | 100 | 100 | lulus |

Target Performance ≥ 90 **TIDAK TERCAPAI** — sebab sama sejak Tahap 4: Fira Sans variabel ±570 KB tidak
disubset (izin subset = keputusan pemilik yang masih menunggu), LCP 4,6–5,9 s pada throttling mobile.
`heading-order` di `/berita` mengikuti struktur heading desain (h1 → h3 kartu). Tiga kategori lain ≥ 98.

**D4b kesetiaan 14 layar** (`d4b-kesetiaan-14-layar.md`, render disimpan di `render-kesetiaan/`, build produksi):

| # | Layar | Cakupan kelas | Kelas hilang | Cacat export |
|---|---|---|---|---|
| 1 | beranda_warkop_nusantara → / | 97 % | 8 | 0 |
| 2 | tentang_kami_warkop_nusantara → /tentang | 90 % | 16 | 0 |
| 3 | struktur_organisasi → /struktur | 91 % | 15 | 0 |
| 4 | program_kegiatan → /program | 81 % | 34 | 0 |
| 5 | galeri_dokumentasi → /galeri | 93 % | 12 | 0 |
| 6 | kontak_pengaduan_… → /kontak | 97 % | 6 | 0 |
| 7 | portal_berita_beranda → /berita (rujukan) | 83 % | 34 | 0 |
| 8 | daftar_berita_investigasi → /berita | 93 % | 11 | 0 |
| 9 | detail_artikel_investigasi → /berita/[slug] | 86 % | 22 | 0 |
| 10 | login_staff_warkop_nusantara → /login | 99 % | 1 | 0 |
| 11 | dashboard_staff_warkop → /staf/dashboard | 89 % | 16 | 0 |
| 12 | kelola_artikel_admin → /staf/artikel | 88 % | 15 | 0 |
| 13 | editor_artikel_admin → /staf/artikel/[id] | 88 % | 20 | 0 |
| 14 | kelola_pengaduan_admin → /staf/pengaduan | 63 % | 80 | 0 |

Sisa cacat export **0 pada 14/14 layar**. Kelas hilang berasal dari navbar/footer/sidebar kanonik (18.3),
`.map()` atas data, dan bagian desain yang sengaja tidak dibangun (overlay detail di kelola_pengaduan_admin —
keputusan pemilik Tahap 6, halaman detail terpisah); alasan per kelas tercatat di LAPORAN Tahap 4–7.

**D5 pemulihan** (`d5-e-pemulihan-cadangan.txt`): MariaDB di-stop saat aplikasi berjalan → `/api/health` **503**
`{"status":"terganggu","basisData":"terputus"}`; halaman `/berita`, `/`, `/lacak` HTTP 500 dengan tampilan
`app/error.js` "Halaman tidak dapat dimuat — Sistem mengalami gangguan sementara…" (dibuktikan di peramban;
tanpa jejak stack/SQL/ECONNREFUSED); `POST /api/auth/login` 500 JSON rapi. DB dinyalakan → health 200 setelah
±4 s, halaman & login normal **tanpa restart aplikasi**. Tangkapan `tangkapan/d5-berita-saat-db-mati.png`.

**D6 aksesibilitas** (`d6-aksesibilitas.txt`): 5 halaman — landmark header/nav/main/footer + `lang=id` + satu
h1; tautan "Lewati ke konten" ke `#konten-utama`; semua kontrol berlabel, tombol/tautan bernama, gambar ber-alt;
Tab menjangkau 23/23, 35/35, 28/29 (input berkas di balik zona seret), 18/18, 4/4 kontrol dengan fokus
terlihat pada semuanya; formulir pengaduan diisi & dikirim **hanya dengan keyboard** → nomor kasus tampil;
wilayah `aria-live` ada. Kontras WCAG AA: Lighthouse `color-contrast` lulus di 4 halaman. **Cacat diperbaiki**:
halaman `/login` & `/tanpa-akses` tidak punya landmark `<main>` → pembungkus `<div>` → `<main>` (kelas sama).

## 6. Pencadangan sudah diuji pulih (bagian E)

`d5-e-pemulihan-cadangan.txt`: `scripts/cadangkan-db.sh` (mariadb-dump `--single-transaction`, `MYSQL_PWD`
lewat env, tanpa sandi di log) → `warkop_nusantara-20260903-1957.sql.gz` (17,6 KB, `gunzip -t` utuh) →
`CREATE DATABASE warkop_pulih` (kosong) → pulih → **12 tabel jumlah baris identik** (users 7, artikel 12,
pengaduan 43, pengaduan_riwayat 94, pengaturan 13, audit_log 281, …) → `CHECKSUM TABLE` pengaduan/riwayat/
artikel/users/pengaturan **SAMA** → integritas riwayat di DB pulih 0/0 → aplikasi dijalankan terhadap DB pulih
(port 3001): health 200, halaman publik 200, login superadmin ok, API artikel/pengaduan/pengaturan mengembalikan
data → DB uji dihapus. Lampiran (berkas) tidak ada di dump: cadangkan volume `warkop-unggahan` dan
`/app/unggahan-terjaga` bersamaan (PENERAPAN G.3).

Rekomendasi jadwal (PENERAPAN G.3): cron tiap hari 02:00 WIB di host (`DB_CONTAINER=kwoz3jwjb037hw3oh669g9c4`),
simpan 14 hari lokal + salinan luar server mingguan; langkah pemulihan saat panik ditulis di `DATABASE.md` §6 dan
kepala `scripts/cadangkan-db.sh`. **Jadwal cron di server BELUM dipasang** (butuh akses cron pemilik).

## 7. Daftar periksa produksi (bagian G)

Diisi dengan bukti per butir di `PENERAPAN.md` bagian 3 (20 butir). Ringkasan: 14 ✅; ⚠️ JWT/DB/seed
rahasia kuat (96 karakter) tetapi ikut layer image; ⚠️ cadangan teruji tetapi cron belum; ⚠️ volume
`/app/unggahan-terjaga` belum ada; ❌ SSH masih menawarkan kata sandi; ❌ panel Coolify :8000 (dan :5050,
:3000 sistem lain) terjangkau dari internet; ❌ firewall belum hanya 22/80/443.

## 8. Cacat yang ditemukan dan diperbaiki selama tahap ini

1. `min-h-screen` (100vh) di body, `/login`, `/tanpa-akses` → `min-h-dvh` (aturan 5).
2. Header keamanan belum lengkap → CSP, Permissions-Policy, HSTS (produksi), COOP; diuji di Chrome & Edge
   (0 pelanggaran, font/gambar/socket berjalan). `b3-header-csp-dev.txt`, `b3-header-csp-build-produksi.txt`.
3. Tidak ada pertahanan CSRF lapis kedua → `periksaAsal()` (Origin/Referer wajib same-origin untuk
   POST/PATCH/DELETE) di `denganPeran` + login; diuji B5-1..6.
4. `/api/staf/unggah` tanpa rate limit → 60/jam per akun (B4).
5. `/login` & `/tanpa-akses` tanpa landmark `<main>` (D6).
6. Hapus pengguna dapat menghilangkan pelaku dari audit/riwayat (FK SET NULL) → ditolak 409 bila berjejak;
   nonaktifkan saja (D1 langkah 33–34).
7. Instalasi baru dari `schema.sql` tanpa kolom `wajib_ganti_sandi` (migrasi 03 tidak di jalur G.1) → kolom
   ditambahkan ke `database/schema.sql` & `sql/01-schema.sql`; PENERAPAN G.1 menyebut migrasi.
8. Kode mati (bagian 1); namespace pembatas `unggah_publik` tak terpakai.
9. Skrip uji D1 versi pertama merusak nilai `kontak_hotline` lokal (bug skrip) → dipulihkan ke nilai semula;
   skrip diperbaiki (bukan cacat aplikasi).

## 9. Risiko yang tersisa (perlu perhatian pemilik)

1. **KRITIS — rahasia di layer image produksi** (aturan 2): `DB_PASSWORD`, `JWT_SECRET`, `SEED_ADMIN_PASSWORD`
   berstatus *Available at Buildtime* di Coolify → tertanam di 3 layer image dan log build. Siapa pun yang bisa
   `docker history`/menarik image (atau membaca log deployment) mendapat rahasia. Perbaikan hanya bisa di panel
   Coolify (token API tanpa izin tulis/baca). Setelah diperbaiki, **wajib rotasi**.
2. **Server bersama**: port 8000 (panel Coolify), 5050, 3000 (aplikasi lain) terbuka ke internet; sshd masih
   menerima autentikasi kata sandi (`publickey,password`). Butuh sudo/firewall — di luar wewenang deployer.
3. **Lampiran pengaduan tanpa volume** (`/app/unggahan-terjaga`): hilang setiap redeploy sampai volume
   `warkop-lampiran` dipasang.
4. **Performance Lighthouse 70–77**: font Fira Sans belum disubset (keputusan pemilik); navbar kanonik meluap di
   1280 px; `galeri-3.mp4` seed tidak ada.
5. **Peramban tidak teruji**: Firefox, Safari macOS/iOS, Chrome Android. Aturan 5 dipenuhi secara kode, tetapi
   uji keyboard/rotasi iOS belum dilakukan.
6. **CSP memakai `'unsafe-inline'` untuk script** (tanpa nonce) — pertahanan XSS utama tetap sanitasi server +
   escaping React; nonce per permintaan = pengembangan berikutnya.
7. **Rate limit di memori proses**: hilang saat restart/redeploy dan per container (satu container sesuai cetak
   biru). Tidak ada CAPTCHA (disengaja: tanpa pelacak pihak ketiga).
8. `GET /api/staf/pengaduan` (daftar) memuat kolom identitas bagi superadmin/verifikator tanpa audit per baris;
   audit `lihat_identitas_pelapor` hanya saat membuka detail. Sesuai desain daftar (kolom Pelapor), tetapi layak
   ditinjau.
9. `pengaduan.dihapus_pada` hanya dapat diisi lewat SQL (tidak ada fitur hapus pengaduan di UI/API) — disengaja
   (jejak laporan tidak boleh hilang), didokumentasikan di DATABASE.md.
10. Halaman `/staf/ganti-sandi` belum punya tautan di sidebar kanonik (diakses lewat URL atau pengalihan wajib
    ganti sandi); tombol "Arsipkan" artikel hanya lewat API (PATCH status) — dicatat di PANDUAN-STAF.
11. `www.warkopnusantara.id` tidak menjawab (tanpa DNS/sertifikat) — putuskan: alihkan ke apex atau abaikan.
12. Beban: RSS naik ke ±560 MB pada 50 pengguna bersamaan; pastikan batas memori container ≥ 1 GB.

## 10. Yang harus dilakukan MANUAL oleh pemilik (server & Coolify)

Urut prioritas — juga dirangkum di `laporan/STATUS.md` (DAFTAR TINDAKAN PEMILIK):

1. Coolify → Environment Variables: matikan *Available at Buildtime* untuk SEMUA rahasia (sisakan
   `NEXT_PUBLIC_*`); Redeploy; verifikasi `docker history --no-trunc <image> | grep -c DB_PASSWORD` = 0.
2. Rotasi SEMUA rahasia yang pernah tertulis di chat/layer image: `DB_PASSWORD` (ubah di MariaDB + ENV),
   `JWT_SECRET` (`openssl rand -hex 48`; semua sesi keluar), `SEED_ADMIN_PASSWORD` (ganti sandi admin lewat
   aplikasi + ENV), token API Coolify (buat ulang; yang lama dicabut). Redeploy.
3. Ganti kata sandi admin segera lewat `/staf/ganti-sandi` (bila belum), tinjau/ganti artikel & konten seed.
4. Coolify → Storages: tambah volume `warkop-lampiran` → `/app/unggahan-terjaga`.
5. Firewall (ufw/NAT): hanya 22, 80, 443 terbuka; tutup 8000/5050/3000 dari internet (panel Coolify lewat
   terowongan SSH); sshd `PasswordAuthentication no`, `PermitRootLogin no`.
6. Cloudflare: proxy oranye untuk `@` dan `staf` (WebSocket didukung); atur SSL "Full (strict)".
7. GitHub → webhook auto-deploy Coolify (agar push memicu redeploy tanpa token di skrip).
8. Cron cadangan harian (PENERAPAN G.3) + salinan luar server + uji pulih berkala.
9. Keputusan desain yang menunggu: subset font Fira Sans (Performance), navbar 1280 px, `galeri-3.mp4`,
   overlay detail pengaduan.
10. Jalankan migrasi `database/migrations/*.sql` bila memulihkan DB lama ke instalasi baru (sudah dijalankan di
    produksi saat ini).

## 11. Yang sengaja TIDAK dibangun, dan saran pengembangan berikutnya

Tidak dibangun (di luar cetak biru / keputusan sadar): notifikasi email/SMS/WhatsApp ke pelapor atau staf;
CAPTCHA pihak ketiga; reset kata sandi mandiri lewat email; hapus pengaduan lewat UI; komentar publik;
pencarian teks penuh; penyimpanan objek eksternal (S3); multi-container/penskalaan horizontal (rate limit &
socket di memori proses); overlay detail pengaduan dari desain; nonce CSP.

Saran berikutnya (berurutan manfaat/risiko): (1) nonce CSP per permintaan di `proxy.js` untuk menghapus
`'unsafe-inline'`; (2) subset font + `preload` → Performance ≥ 90; (3) tautan "Ganti kata sandi" & tombol
"Arsipkan" di antarmuka staf (perlu keputusan desain); (4) uji Safari iOS nyata pada formulir pengaduan;
(5) pengarsipan audit_log berkala + laporan bulanan; (6) rate limit berbasis penyimpanan bersama bila kelak
lebih dari satu container; (7) pemantauan eksternal `/api/health` + peringatan.

## 12. Dokumentasi akhir (bagian F)

`README.md` (ditulis ulang), `PENERAPAN.md` (B: peringatan Buildtime; C.1 WebSocket; G.1 migrasi; bagian 3
daftar periksa), `DATABASE.md` (baru: 14 tabel, ERD mermaid, enum, migrasi, integritas, pemulihan; memuat
"Catatan ketidaksesuaian" yang ditindaklanjuti di bagian 8 butir 6–7), `API.md` (baru: 48 endpoint, rate
limit, CSRF, Socket.io, 33 aksi audit), `PANDUAN-STAF.md` (baru: 9 bagian, 16 tangkapan `dokumen/panduan/`),
laporan ini.

## KEPUTUSAN BARU tahap ini

- CSP tanpa nonce (`'unsafe-inline'` script/style) — alasan di komentar `next.config.mjs`; `connect-src 'self'`
  mencakup wss same-origin; HSTS hanya produksi; COOP `same-origin`.
- `periksaAsal()`: permintaan pengubah data wajib same-origin bila Origin/Referer ada; klien tanpa keduanya
  diizinkan (tidak membawa cookie diam-diam). Tidak dipasang di `POST /api/pengaduan` (tanpa cookie; token
  formulir) dan `logout`.
- Rate limit unggah staf per AKUN 60/jam.
- Pengguna berjejak tidak dapat dihapus (409), hanya dinonaktifkan.
- `<main>` sebagai pembungkus halaman mandiri login/tanpa-akses; `min-h-dvh` menggantikan `min-h-screen`.
- Kolom `wajib_ganti_sandi` masuk skema dasar; migrasi 03 tetap untuk DB lama.
- 13 GET route staf dipertahankan sebagai kontrak API (bukan dihapus).
- Uji peramban memakai `localhost` (bukan 127.0.0.1) untuk Next dev; produksi tidak terpengaruh.

# STATUS PEMBANGUNAN — WARKOP NUSANTARA

> Diperbarui Claude Code setiap kali mulai/selesai tahap (MODE OTONOM,
> ALUR bagian 7). Sumber kebenaran posisi bila sesi terputus: berkas ini +
> `git log --oneline`.

Status: `BELUM` / `SEDANG` / `LULUS` / `BLOKIR` / sebagian `MENUNGGU PEMILIK`

| Tahap | Status | Commit | Catatan |
|---|---|---|---|
| 00 Fondasi | LULUS | 75615ca | 15 butir uji a–n + h2, semua berbukti; proxy terbukti di Next 16.3.4 |
| 01 Basis data | LULUS | 62495b7 | 11 butir uji a–k berbukti; zona waktu selisih 0 detik; buku besar utuh |
| 02 Autentikasi | LULUS | 2356075 | 14 butir uji a–n berbukti; Location tanpa 0.0.0.0; 403 semua peran tak berhak |
| 03 Docker | LULUS | 1117749 | 12 butir a–l berbukti (image 998 MB, log bersih, healthy→unhealthy→healthy, proxy+pemisahan host di container, WIB selaras, non-root, volume, rollback, konteks 764 MB→2,77 MB); skema+seed PRODUKSI dijalankan, login & pemisahan host di domain terbukti (bukti-server/). Temuan: unggahan butuh route handler (Tahap 5/6) |
| 04 Situs publik | LULUS (catatan) | 7b075f8 | 14 butir a–n berbukti: kesetiaan 5 halaman cacat 0 (97/89/91/81/93 % kelas, semua beralasan), kontras 28/28, identitas 0 bocor, keadaan kosong, build+lint hijau. Uji c: A11y 98–100/BP 96/SEO 100 lulus, **Performance 70–80 < 90** (font Fira Sans ±570 KB tidak disubset; preload dimatikan; subset = keputusan pemilik). TEMUAN: navbar kanonik tidak muat di 1280 (kotak cari) — keputusan pemilik; `min-h-screen` body = 100vh |
| 05 Modul berita | LULUS (catatan) | 4409067 | 15 butir a–o berbukti: peran 403 semua, XSS bersih di DB & render, unggahan (php/svg/6MB ditolak, nama acak), slug unik+beku, kategori wajib 422, terbit_pada WIB, jumlah_dibaca tanpa bot, kesetiaan 5 layar cacat 0, keadaan kosong, build+lint hijau. Uji k: A11y 98–100/SEO 100, Performance 73–78 < 90 (sebab sama Tahap 4: font). Tangkapan halaman staf tidak ada (tanpa otomasi login) |
| 06 Modul pengaduan | LULUS | cd04e3a | 17 butir a–q berbukti: anonim via API 4 kolom NULL, buku besar 5 perubahan berantai, transaksi rollback, peran 403, lampiran (25MB 413, exe/svg 415, URL tebakan 404/401), rate limit 10→429, audit identitas, kesetiaan cacat 0, 36/36 lebar PAS, build hijau. TEMUAN diperbaiki: lampiran dipindah ke direktori terjaga di luar public/ (butuh volume Coolify /app/unggahan-terjaga — TINDAKAN PEMILIK); laci seluler & luapan navbar/filter Tahap 4-5 |
| 07 Ruang staf | LULUS | dafb001 | 17 butir a–q berbukti: angka dashboard = kueri manual, tren 12 bulan termasuk nol, 5 peran (tangkapan), sidebar bukan pagar 27×403, CRUD 5 modul, daftar putih pengaturan 70 pemeriksaan, paksa keluar/reset sandi/perlindungan diri, keadaan kosong 14 halaman, 32/32 lebar PAS, build hijau. Migrasi sql/03 (wajib_ganti_sandi) dijalankan lokal & produksi |
| 08 Realtime | LULUS | 3c64be4 | 13 butir a–m berbukti: muatan mentah 6/6 tanpa identitas (laporan bernama), socket tanpa/palsu/versi lama/kedaluwarsa ditolak, isolasi wilayah 2 vs 0, tanpa socket halaman tetap terhidrasi tanpa galat, pemulihan menyusul 1,5 s, route tanpa io (0), beban 1000/1000 pesan, pembersihan ke 0, gulir 300→300, penanda saat menyaring, build+lint hijau; **h di produksi**: wss:// 101 di balik Traefik, tanpa mixed content. Perbaikan: pimpinan_wilayah keluar dari room `staf`; penanda dibuat fixed |
| 09 Pengerasan | LULUS (catatan) | f9c78d5 | A: kode mati dihapus (uji-desain, 5 komponen ui, 13 fungsi lib, Tombol default); B1 47 metode × 6 identitas = 246 pemeriksaan 0 gagal; B2 154 payload injeksi 0 lolos; B3 CSP/HSTS/Permissions-Policy diuji Chrome+Edge 0 pelanggaran; B4 4 pembatas 429; B5 CSRF same-origin (baru); B6 lampiran tak tertebak; B7 riwayat git 0 rahasia; B8 audit 0, Next 16.3.4 latest; C1–C14 berbukti (C2 GAGAL di sisi Coolify: rahasia di layer image → TINDAKAN PEMILIK); D1 36 langkah, D2 1000 req 0 galat, D3 Chrome+Edge (Firefox/Safari/iOS TIDAK DIUJI), D4 A11y 98–100/BP 100/SEO 100 tetapi **Performance 70–77 < 90** (font, keputusan pemilik), D4b 14 layar cacat 0, D5 pulih sendiri, D6 keyboard penuh; E cadangan→pulih checksum identik; F 5 dokumen; G 14/20 ✅ (SSH sandi, firewall 8000/5050/3000, volume lampiran, cron cadangan, Buildtime rahasia = pemilik) |

## BLOKIR / MENUNGGU PEMILIK

### Keputusan pemilik yang menunggu (tidak menghalangi run)
- Tahap 6: **tambah volume Coolify** `warkop-lampiran` → `/app/unggahan-terjaga` (lampiran pengaduan; tanpa volume, lampiran hilang saat redeploy). Opsional: bangun ulang halaman detail pengaduan dari "Detail View Overlay" di kelola_pengaduan_admin/code.html.
- Tahap 4: (1) navbar kanonik 18.3 + kotak cari tidak muat di kontainer 1280 px (Berita menimpa kotak cari; juga tampak di screen.png beranda) — pilih: kotak cari hanya di laci seluler / logo h-12 / biarkan. (2) Izin subset font Fira Sans ke Latin di public/fonts/ (Lighthouse Performance 70–80 → target ≥ 90). (3) `min-h-screen` pada body desain = 100vh di CSS. (4) Seed menautkan /penampung/galeri-3.mp4 yang tidak ada.

(kosong — 3 Sep 2026 ±22:20 WIB: blokir disk C: DICABUT oleh pemilik; run
MODE OTONOM dilanjutkan. Perintah pemilik untuk server/produksi terangkum di
`dokumen/PERINTAH-PEMILIK-SERVER.md` — baca itu dulu bila sesi terputus.)

## Produksi (ringkas, tanpa rahasia)

- Domain: warkopnusantara.id / staf.warkopnusantara.id — HTTPS aktif,
  `/api/health` 200 dari laptop dan dari server (3 Sep 2026 22:20 WIB).
- Container app produksi: image tag = commit c97e255 (HEAD saat run dilanjutkan),
  HEALTHY, volume `warkop-unggahan`. DB `warkop_nusantara` KOSONG (belum ada
  tabel) sebelum tugas 5a.
- Push + redeploy via webhook diizinkan (PERINTAH-PEMILIK-SERVER 3). Webhook port 8000 TIDAK terjangkau dari internet → dipanggil dari dalam server lewat SSH (localhost:8000), token via stdin — KEPUTUSAN BARU. Redeploy Tahap 03 (a2dbb53) sukses 3 Sep 22:45 WIB; Tahap 04 (6e39a1b) 23:28 WIB; Tahap 07 (d38129e) 4 Sep 01:18 WIB; Tahap 08 (3c64be4) 4 Sep 02:12 WIB; **Tahap 09: push f9c78d5+f0696fb → Coolify membangun HEAD f0696fb, healthy 4 Sep 03:15 WIB** (bukti-server/09-redeploy-tahap-09.txt; catatan: skrip menunggu tag f9c78d5 sehingga menulis "perlu Redeploy manual" — tidak perlu, image f0696fb memuat seluruh Tahap 09), health 200 (bukti-server/0N-redeploy-tahap-0N.txt; skrip bukti-server/skrip/redeploy.sh). Socket.io wss:// terbukti di produksi (bukti-tahap-08/h-wss-produksi.txt).

## Posisi terakhir (bila sesi terputus di tengah tahap)
SELESAI. Seluruh tahap 00–09 LULUS dan ter-push; produksi menjalankan image f0696fb (HEAD) HEALTHY; verifikasi akhir di domain LULUS (di bawah). Run MODE OTONOM BERHENTI sesuai perintah — tidak ada tahap berikutnya. Bila prompt dikirim ulang: tidak ada yang perlu dilanjutkan kecuali tindakan pemilik di bawah.

## RINGKASAN PENUTUP (4 Sep 2026, ±03:25 WIB)

Sistem WARKOP NUSANTARA lengkap: situs publik (beranda, tentang, struktur, program, galeri, berita + detail, kontak/pengaduan, lacak, FAQ/privasi/pedoman), ruang staf lima peran (dashboard realtime, artikel + editor, pengaduan + buku besar, pengurus/program/galeri, pengguna, pengaturan, ganti sandi), API 48 endpoint berpagar peran, Socket.io terautentikasi, MariaDB 14 tabel, Docker/Coolify di warkopnusantara.id + staf.warkopnusantara.id (HTTPS, wss, pemisahan host).

Verifikasi akhir di DOMAIN PRODUKSI (image f0696fb; bukti `laporan/bukti-tahap-09/akhir-*`):
- Kesetiaan 14 layar pada build produksi: sisa cacat export 0/14; cakupan kelas 63–99 % (alasan tercatat) — `akhir-d4b-kesetiaan-14-layar-produksi.md`.
- Pemisahan host: `warkopnusantara.id/staf/*` & `/login` → 307 `https://staf.…`; `staf.…/berita` → dashboard; `/staf/*` tanpa sesi → `/login?lanjut=`; http → https 302; `Location` tanpa `0.0.0.0` — `akhir-produksi-host-header-port.txt`.
- Header keamanan (CSP tanpa unsafe-eval, HSTS preload, Permissions-Policy, X-Frame DENY, nosniff, COOP) dan 0 pelanggaran CSP di 10 halaman publik+staf di Chrome headless; socket `wss://staf.warkopnusantara.id/socket.io/` 101, realtime tersambung — `akhir-b3-header-csp-produksi.txt`, `akhir-h-wss-produksi.txt`.
- Pengaduan anonim ujung ke ujung: POST 201 → lacak API/halaman (kolom publik saja) → daftar & detail staf: anonim=1, empat kolom identitas NULL → dihapus lunak via SQL — `akhir-pengaduan-anonim-produksi.txt`.
- `/api/health` 200, container healthy, volume `warkop-unggahan` terpasang.

Yang TIDAK tercapai / TIDAK diuji (jujur): Lighthouse Performance 70–77 (< 90; font belum disubset — keputusan pemilik); Safari iOS/macOS, Chrome Android, Firefox tidak diuji (tidak tersedia); rahasia produksi tertanam di layer image (sisi Coolify — kritis, di bawah); firewall/SSH/panel Coolify belum sesuai daftar periksa (butuh sudo).

## DAFTAR TINDAKAN PEMILIK (urut prioritas)

1. **KRITIS — Coolify → Environment Variables: matikan "Available at Buildtime" untuk SEMUA rahasia** (DB_PASSWORD, JWT_SECRET, SEED_ADMIN_PASSWORD, DB_HOST/USER, STAF_HOST, dll.; sisakan hanya NEXT_PUBLIC_APP_URL/NEXT_PUBLIC_WS_URL). Bukti: `docker history` image f0696fb memuat `DB_PASSWORD=`/`JWT_SECRET=` di 4 layer (`laporan/bukti-tahap-09/c2-log-build-coolify.txt`). Redeploy, lalu cek `docker history --no-trunc <image> | grep -c DB_PASSWORD` = 0.
2. **Rotasi SEMUA rahasia yang pernah tertulis di chat / layer image**: `DB_PASSWORD` (ubah di MariaDB `ALTER USER 'warkop'@'%' IDENTIFIED BY …` + ENV), `JWT_SECRET` (`openssl rand -hex 48`; seluruh sesi keluar), `SEED_ADMIN_PASSWORD` (ganti sandi admin lewat aplikasi lalu ENV), **token API Coolify** (buat baru, cabut lama; beri izin `deploy` saja). Redeploy setelah tiap perubahan.
3. **Ganti kata sandi admin segera** lewat `https://staf.warkopnusantara.id/staf/ganti-sandi`; tinjau/ganti artikel, pengurus, program, galeri seed (konten contoh) sebelum diumumkan.
4. **Volume lampiran pengaduan**: Coolify → Storages → `warkop-lampiran` → `/app/unggahan-terjaga` (tanpa ini lampiran hilang saat redeploy).
5. **Pengerasan server (butuh sudo)**: firewall hanya 22/80/443 — tutup 8000 (panel Coolify; akses lewat terowongan SSH), 5050, 3000 (sistem lain di server yang sama); sshd `PasswordAuthentication no` + `PermitRootLogin no` (saat ini masih `publickey,password`).
6. **Cloudflare**: proxy oranye untuk `@` dan `staf` (WebSocket didukung), SSL "Full (strict)"; putuskan nasib `www` (saat ini tidak menjawab).
7. **Webhook GitHub → Coolify auto-deploy** (push = redeploy) sehingga skrip webhook + token tidak lagi diperlukan.
8. **Cadangan berkala**: cron harian `scripts/cadangkan-db.sh` (PENERAPAN G.3) + salinan luar server + uji pulih berkala (prosedur sudah teruji: `d5-e-pemulihan-cadangan.txt`).
9. Keputusan desain yang menunggu (tidak menghalangi): subset font Fira Sans (Performance ≥ 90), navbar kanonik meluap di 1280 px, `galeri-3.mp4` seed hilang, overlay detail pengaduan, tautan "Ganti kata sandi" & tombol "Arsipkan" di antarmuka staf; 13 GET route staf tanpa pemanggil (kontrak API) — hapus atau pertahankan.
10. Baca `PANDUAN-STAF.md` bersama pengurus; `PENERAPAN.md` bagian 3 = daftar periksa produksi dengan status per butir.


## RUN QA-1 — perbaikan & QA menyeluruh atas temuan pemilik (mulai 4 Sep 2026 ±09:40 WIB)

Perintah pemilik (dokumen/PERINTAH-PEMILIK-SERVER.md tetap berlaku). Ritme per butir: perbaiki → bukti sebelum/sesudah di `laporan/bukti-qa-1/` → build hijau → commit kecil → push → redeploy webhook → verifikasi produksi (health 200 + halaman yang diperbaiki di domain) → butir berikutnya. Akhir: `laporan/LAPORAN-QA-1.md` + STATUS ini, lalu BERHENTI.

| # | Butir | Status | Catatan |
|---|---|---|---|
| 1 | Berita tidak bisa diklik (beranda, /berita, terkait, dashboard) — reproduksi produksi+lokal, akar masalah, perbaikan semua kartu, bukti klik CDP berpindah | SELESAI (12d850f) | Akar: kartu bergaya klik tetapi hanya teks judul ber-`<a>`; gambar/ringkasan/badan tanpa tautan (produksi: 25 klik tidak berpindah, `bukti-qa-1/1-klik-kartu-sebelum-produksi.txt`). Perbaikan: `components/publik/TautanKartu.js` (tautan peregang, aria-hidden/tabIndex -1) di beranda 2 kartu, /berita unggulan+daftar+sidebar; artikel terkait sudah `<Link>` penuh; butir panel dashboard ber-tautan. Sesudah: lokal & produksi LULUS (`1-klik-kartu-sesudah-*.txt`). Redeploy 12d850f healthy |
| 2 | Kesetiaan visual menurut mata — 14 layar | SELESAI (6831eff) | code.html desain dirender Chrome vs halaman kita pada 1280/1600 px, disandingkan (`bukti-qa-1/tangkapan/visual/NN-*-{sebelum,sesudah,sesudah-produksi}.png`). Diperbaiki dari kode: navbar (logo h-8, tanpa flex-wrap → satu baris seperti desain), /berita grid 2 kolom di kolom utama (judul tak terpotong), filter select langsung berlaku tanpa tombol Terapkan (berita/program/kelola artikel; tombol hanya tanpa JS), program tanpa select status, tanggal galeri sejajar, panah kartu program 24 px, cap air hero/login lembut. 3 screen.png desain rusak (portal_berita_beranda, program_kegiatan, tentang_kami_warkop_nusantara) → rujukan = code.html. Sisanya di MENUNGGU PEMILIK |
| 3 | Gambar jelek & posisi buruk | SELESAI (6831eff) | `scripts/buat-penampung.mjs --paksa`: 28 penampung halus tanpa teks (gradasi krem token + lambang samar; rasio per slot 16:9/4:3/1:1; siluet pengurus; peta untuk kontak/struktur/hero program); rujukan logo besar sebagai gambar konten diganti (kontak, struktur, program hero, detail/terkait). Audit pemakaian gambar: semua object-cover + width/height/sizes (bukti `2-build.txt`, komposit visual). Daftar foto sungguhan → MENUNGGU PEMILIK |
| 4 | Fungsional total | SELESAI (3069d7d) | 4a rayapan: lokal 201 URL (publik + 5 peran) semua 200, 201 halaman dibuka di Chrome 0 error konsol; produksi 70 URL/halaman 0 error (`4a-rayapan-konsol-{lokal,produksi}.txt`). 4b 25 aksi end-to-end LULUS: login 5 peran + logout, pengaduan anonim/bernama/lampiran (multipart, nosniff, 401 tanpa login), lacak, status + petugas, unggah, artikel draf→terbit→arsip→hapus, pengurus/program/galeri CRUD, pengguna buat→reset→wajib ganti→ganti→paksa keluar→nonaktif, pengaturan (`4b-aksi-end-to-end-lokal.txt`). CACAT DIPERBAIKI: pengalihan wajib-ganti-sandi hanya di klien → kini di server (proxy `x-jalur` + layout). Temuan transien: saat rolling update Coolify, HTML container lama merujuk chunk CSS build baru (404 text/plain di /tentang) — hilang setelah swap selesai (risiko dicatat) |
| 5 | HP & laptop 375/768/1280 | SELESAI (3069d7d) | 26 halaman × 3 lebar: tanpa gulir mendatar, tanpa kontrol tumpang tindih; hamburger publik & laci staf di 375 berfungsi (klik tautan berpindah); formulir pengaduan 375 diisi penuh & terkirim (lokal & produksi, data uji dihapus lunak). DIPERBAIKI: tabel staf (artikel/pengurus/program) dibungkus `overflow-x-auto` (pola desain dashboard), dua kolom editor/program/pengaturan tersusun < lg, kepala editor membungkus. Emulasi Chrome (dpr 2); **Safari iOS/Android asli TIDAK tersedia — tidak diuji** (`5-responsif-{lokal,produksi}.txt`, tangkapan `tangkapan/responsif/`) |
| 6 | Regresi | SELESAI | uji-b1 246 pemeriksaan 0 gagal (`6-regresi-b1.txt`); kesetiaan 14 layar cacat export 0 (`6-regresi-kesetiaan-14-layar.md`; cakupan kelas turun ≤3 poin di program/tentang/berita karena kelas Terapkan/select status/lg:grid-cols-3 dihapus sesuai desain); build (`5-build.txt`) + lint hijau |
| 7 | LAPORAN-QA-1.md + STATUS, BERHENTI | SELESAI | `laporan/LAPORAN-QA-1.md` (ringkasan perbaikan, tabel selisih visual 14 layar, tangkapan sebelum/sesudah, MENUNGGU PEMILIK, risiko) |

### MENUNGGU PEMILIK (RUN QA-1)
- **Foto sungguhan** (penampung saat ini netral, tanpa teks): gambar utama 12 artikel seed, 6 galeri (+ video `galeri-3.mp4`), 5 foto pengurus, 3 gambar program, hero Program & Kegiatan (desain: ilustrasi peta Indonesia + kaca pembesar), peta kantor regional (kontak & struktur), foto latar hero beranda/tentang/login (desain: foto samar), foto stempel "Filosofi Lambang" (tentang), foto penulis artikel.
- **Navbar 1280 px**: kini persis desain (logo h-8, item membungkus teks) — desain sendiri membuat "Berita" menyentuh kotak cari di 1280 px; bila ingin rapi: kotak cari hanya di laci/hilangkan, atau kurangi jarak. Keputusan pemilik.
- **Tentang Kami**: filosofi lambang 9 butir (REFERENSI 1) vs 4 di desain; seksi Visi–Misi dan Motto tambahan (konten Tahap 4) tidak ada di desain — pertahankan atau buang?
- **/berita**: halaman menggabungkan dua desain (portal_berita_beranda: sorotan + sidebar; daftar_berita_investigasi: kepala + filter + kartu). Kini kartu 2 kolom dalam kolom utama (seperti "Berita Terkini" desain). Bila pemilik ingin persis daftar_berita_investigasi (3 kolom selebar penuh tanpa sidebar), beri tahu.
- **Detail artikel**: desain punya keterangan foto ("Foto: …") — tabel artikel belum punya kolom keterangan gambar; tambah bila diinginkan.
- **Kelola pengaduan**: overlay detail desain tidak dibangun (halaman detail terpisah, keputusan Tahap 6).

### Posisi terakhir RUN QA-1
RUN QA-1 SELESAI (4 Sep 2026 ±12:15 WIB). Produksi image 3069d7d HEALTHY; semua butir 1–7 SELESAI; laporan `laporan/LAPORAN-QA-1.md`. Run BERHENTI. Bila prompt dikirim ulang: tidak ada butir tersisa — hanya MENUNGGU PEMILIK di atas dan DAFTAR TINDAKAN PEMILIK Tahap 9.


## RUN QA-2 (FINAL) — bug kritis auth, perburuan bug total, data asli pemilik, perbaikan UI (mulai 4 Sep 2026 ±13:45 WIB)

Aturan konten: K1 tanpa foto internet & tanpa berita nyata; K2 tanpa em/en dash di teks tampil + DB (penjaga regresi); K3 semua data bisa diubah lewat ruang staf. Ritme per butir: perbaiki → bukti `laporan/bukti-qa-2/` → build → commit → push → redeploy → verifikasi produksi. Profil Chrome sementara dihapus tiap uji.

| # | Butir | Status | Catatan |
|---|---|---|---|
| B0a | Loop redirect /login (cookie basi) | SELESAI (e3b3238, produksi LULUS `b0a-sesi-produksi.txt`) | Reproduksi: ERR_TOO_MANY_REDIRECTS (`bukti-qa-2/b0a-sesi-sebelum.txt`). Akar: proxy mengalihkan /login → dashboard hanya karena tanda tangan JWT sah (token_version naik = sesi basi), lalu layout menendang balik ke /login. Perbaikan: proxy tidak mengalihkan /login; halaman /login memverifikasi sesi PENUH (DB) → dashboard / ganti-sandi; cookie ada tapi tak sah → `GET /api/auth/bersihkan-sesi` (hapus cookie, 307 ke /login); `requireUser` juga lewat pembersih. Uji 5 keadaan × 5 jalur (25 sel) + Chrome: nol loop, nol layar kosong (`b0a-sesi-sesudah-lokal.txt`) |
| B0b | Alur ganti sandi utuh end-to-end | SELESAI (produksi LULUS `b0b-ganti-sandi-ui-produksi.txt`) | Lewat UI (ketik sungguhan) desktop 1280 & ponsel 375: reset → login sandi sementara → dipaksa ke /staf/ganti-sandi → ganti (3 kolom ≥ 20 karakter, fokus bertahan) → dashboard sesi baru → Keluar → login sandi baru 200, lama 401 (`b0b-ganti-sandi-ui-lokal.txt`, tangkapan) |
| B0c | Bug input satu huruf + audit semua formulir | SELESAI (tidak tereproduksi) | Audit ketik CDP 44 kolom di 14 halaman/formulir (login, kontak, cari, lacak, ganti-sandi, editor, pengurus/program/galeri/pengguna, pengaturan, catatan status): nilai utuh, fokus bertahan, 0 error konsol (`b0c-ketik-sebelum.txt`); juga di produksi (halaman publik). Tidak ada pola komponen-dalam-render/key berubah. Dugaan gejala pemilik: efek loop B0a (halaman /login dimuat ulang berulang) — diverifikasi ulang di produksi setelah deploy |
| B0d | Pemulihan akun superadmin produksi | SELESAI | Temuan audit_log: pemilik me-reset sandinya sendiri 13:37 WIB (wajib_ganti_sandi=1), masuk 13:45, TIDAK ada `ganti_sandi_sendiri` → ganti sandi separuh jalan; sandi sementara pemilik tidak diketahui. Tindakan: sandi sementara ACAK baru disetel via node di container (bcrypt 12), `wajib_ganti_sandi=1`, `token_version` 1→2 (sesi lama batal), disimpan HANYA di `.env.produksi` `SEED_ADMIN_PASSWORD` (tidak dicetak); login 200 (`b0d-pemulihan-superadmin.txt`). **INSTRUKSI PEMILIK: masuk di https://staf.warkopnusantara.id/login dengan email admin + nilai SEED_ADMIN_PASSWORD di D:\Deploy\LSM\.env.produksi, Anda langsung diminta mengganti sandi; setelah itu sandi di .env.produksi tidak berlaku lagi.** |
| K2 | Sapu em/en dash | SELESAI | 42 pelanggaran di 26 berkas tampil diganti (judul ' - ', klausa ', ', placeholder '-', rentang 's.d.', label '(Belum ditugaskan)'); seed & migrasi bersih; DB lokal 0, DB produksi 0 baris (artikel/pengaturan/pengurus/program/galeri). Penjaga `scripts/penjaga-dash.mjs [--db]` (exit 1 bila ada) dipakai di regresi (`k2-dash-*.txt`) |
| A1 | Alamat resmi lewat pengaturan | SELESAI (kode) | Kunci `kontak_alamat_gedung/jalan/kota` (sudah ada, K3 bisa diubah di Pengaturan) diisi alamat resmi: Komplek Perkantoran CNN / Jl. Tuanku Tambusai No. B 15, Labuh Baru Tim., Payung Sekaki / Kota Pekanbaru, Riau 28123 (bawaan definisi + seed + UPDATE DB lokal; produksi saat deploy). Tampil di halaman kontak (sudah) dan footer (baris baru berikon location_on, kelas sama baris email/hotline) |
| A2 | Struktur DPP asli pemilik | SELESAI (kode+lokal) | Migrasi `20260904-1500-pengurus-kelompok.sql` (kolom `kelompok`) + `20260904-1510-pengurus-dpp-data.sql` (39 posisi: Dewan Pembina/Penasehat/Pengawas, Pengurus DPP, Direktorat Eksekutif, 9 Direktorat, Satgas, kerangka DPW/DPD/DPC; kosong = '(Belum terisi)'; foto siluet); `lib/kelompokPengurus.js`; validasi + select Kelompok di Kelola Pengurus (K3); seed.sql diselaraskan. `aset-pemilik/struktur-dpp.jpg` TIDAK ADA di repo → teks perintah = sumber. Produksi: dijalankan saat deploy |
| B1 | Navbar rapi 1280+ | SELESAI | Merek `lg:text-xl` satu baris, menu `gap-4` (2xl: gap-6) `lg:whitespace-nowrap`, cari `w-40` (2xl: w-48), wadah `md:gap-4` → 7 menu + cari + Masuk Staff tanpa tumpang tindih di 1280/1366/1440/1920 (`tangkapan/b1-navbar-komposit.png`) |
| B2 | Hero beranda segel kanan | SELESAI | Kolom kanan `hidden lg:flex w-80 xl:w-96` berisi logo segel besar (drop-shadow), teks hero tetap `max-w-3xl` (`tangkapan/b2-beranda-1280.png`) |
| B3 | Footer | SELESAI | Markup footer sudah verbatim desain (diverifikasi ulang); ditambah baris alamat A1 dari pengaturan |
| B4 | Tentang logo utuh | SELESAI | `object-cover` → `object-contain` + padding + latar surface-container-low pada kotak 500 px (`tangkapan/b4-tentang-375.png`) |
| B5 | Struktur bagan bertingkat | SELESAI | `app/(publik)/struktur/page.js` ditulis ulang: Dewan (3 kolom) → Pengurus DPP (Ketua Umum kartu Pimpinan Pusat + 3 kartu) → Direktorat Eksekutif → 9 Direktorat → Satgas → kerangka DPW/DPD/DPC → Pimpinan Regional (filter/peta tetap); kelas kartu desain; 1/2/3 kolom (`tangkapan/b5-struktur-{1280,375}.png`) |
| B6 | Filter/paginasi tidak melompat | SELESAI | `KirimOtomatis` → `router.replace(url, {scroll:false})` (change & submit; tanpa JS tetap GET), `scroll={false}` pada 16 tautan paginasi/pil (Paginasi, program, galeri, staf artikel/pengaduan), galeri ikut KirimOtomatis; uji CDP 8 skenario gulir tetap (`b6-gulir-filter-lokal.txt`) |
| B7 | galeri-3 video → foto | SELESAI (lokal+seed) | seed.sql & sql/02-seed.sql: butir 3 jenis foto `/penampung/galeri-3.jpg`; UPDATE DB lokal 1 baris; produksi saat deploy (SELECT dulu) |
| B8 | Pratinjau artikel | SELESAI | `components/publik/BadanArtikel.js` (markup <article> detail publik dipindah, sanitasi lapisan kedua) dipakai /berita/[slug] dan `/staf/artikel/[id]/pratinjau` (pita status, hak = editor: penulis miliknya, wilayah); tombol Pratinjau di kepala editor (tab baru; artikel baru: simpan dulu). Uji: pratinjau 200 ber-sesi, 307 tanpa sesi, draf publik 404, detail terbit 200 |
| C1 | Inventaris halaman × 6 identitas × 3 lebar: konsol & jaringan bersih, tanpa gulir mendatar/tumpang tindih | BELUM | |
| C2 | Interaksi: klik semua elemen, ketik penuh semua kolom, klik ganda, tombol kirim dinonaktifkan | BELUM | |
| C3 | Alur end-to-end lengkap (lampiran jpg/png/pdf/mp4 + batas, tombol kembali, muat ulang di tengah formulir) | BELUM | |
| C4 | Daftar bug ditemukan-diperbaiki + uji regresi | BELUM | |
| C5 | Regresi (b1, kesetiaan 14 layar, penjaga dash, build, lint) + verifikasi akhir produksi + LAPORAN-QA-2.md + STATUS, BERHENTI | BELUM | |

### MENUNGGU PEMILIK (RUN QA-2)
(diisi selama run)

### Posisi terakhir RUN QA-2
K2, A1, A2, B1–B8 selesai di lokal; berikutnya build + commit + migrasi DB produksi + redeploy + verifikasi, lalu C1–C5.

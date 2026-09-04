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
| 1 | Berita tidak bisa diklik (beranda, /berita, terkait, dashboard) — reproduksi produksi+lokal, akar masalah, perbaikan semua kartu, bukti klik CDP berpindah | SEDANG | |
| 2 | Kesetiaan visual menurut mata — 14 layar: tangkapan pada lebar code.html vs screen.png, tabel selisih per layar, perbaiki yang dari kode, sisanya MENUNGGU PEMILIK | BELUM | |
| 3 | Gambar jelek & posisi buruk — penampung dibangkitkan ulang, object-cover + posisi seragam, dimensi next/image benar; daftar foto sungguhan → MENUNGGU PEMILIK | BELUM | |
| 4 | Fungsional total (build produksi lokal + spot-check produksi): rayapan semua tautan internal, semua aksi utama end-to-end, konsol CDP bersih | BELUM | |
| 5 | HP & laptop 375/768/1280: tanpa gulir mendatar, hamburger & laci, formulir 375, sentuh tak tumpang tindih (emulasi Chrome; Safari/Android asli tidak tersedia) | BELUM | |
| 6 | Regresi: uji-b1 route×peran + kesetiaan 14 layar + build + lint | BELUM | |
| 7 | LAPORAN-QA-1.md + STATUS, BERHENTI | BELUM | |

### MENUNGGU PEMILIK (RUN QA-1)
(diisi selama run)

### Posisi terakhir RUN QA-1
Butir 1 dimulai (reproduksi di produksi).

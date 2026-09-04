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
| verifikasi batch | Migrasi DB produksi + redeploy c024580 diperiksa ulang (idempoten) | SELESAI (b54e10f) | Container produksi menjalankan c024580 HEALTHY; kolom `kelompok` + indeks + 39 posisi DPP (3/3/3/4/2/9/6/3/3/3), 0 sisa pengurus contoh; alamat Pekanbaru; galeri-3 foto; DB produksi 0 em/en dash pada 7 tabel; /struktur & footer produksi memuat data baru (`bukti-qa-2/a2-migrasi-produksi.txt`, `bukti-server/14-redeploy-qa2-batch2.txt`) |
| C1 | Inventaris halaman × 6 identitas × 3 lebar: konsol & jaringan bersih, tanpa gulir mendatar/tumpang tindih | SELESAI | 32 halaman × 6 identitas × 3 lebar = 576 sel + 3 pemeriksaan isolasi wilayah = **579, 0 gagal** (`c1-inventaris-lokal.txt`). Pengalihan pagar peran tercatat lengkap; pimpinan wilayah dari wilayah lain: artikel/pratinjau/pengaduan milik wilayah lain -> 404 netral tanpa isi |
| C2 | Interaksi: klik semua elemen, ketik penuh semua kolom, klik ganda, tombol kirim dinonaktifkan | SELESAI | 22 halaman, **24 pemeriksaan 0 gagal** (`c2-interaksi-lokal.txt`). Menemukan BUG KRITIS Kelola Pengurus crash. Sesudah perbaikan: /staf/pengurus 118 klik 0 galat; 44 kolom utuh, fokus tidak lepas; tombol kirim disabled saat proses & klik ganda = 1 permintaan (login & pengaduan) |
| C3 | Alur end-to-end lengkap (lampiran jpg/png/pdf/mp4 + batas, tombol kembali, muat ulang di tengah formulir) | SELESAI | C3a lampiran 5 jenis + semua batas + pembatas laju **12 LULUS**; C3b tombol kembali & muat ulang **11 LULUS**; C3c alur baru QA-2 **11 LULUS**; C3d 25 aksi end-to-end **LULUS**. Menemukan BUG lampiran di atas 10 MB ditolak |
| C4 | Daftar bug ditemukan-diperbaiki + uji regresi | SELESAI (3c34e9d) | **5 cacat diperbaiki**: (1) Kelola Pengurus crash `memuat`->`sibuk`; (2) `proxyClientMaxBodySize: '44mb'` (lampiran 10-20 MB); (3) /struktur memuat pengurus tanpa kelompok; (4) penjaga proses di server.js (uncaughtException/clientError/SIGTERM); (5) penjaga-dash rapuh terhadap CRLF. Penyebab sistemik (1) diperbaiki: eslint `no-undef` menyala, dibuktikan dua arah. Regresi bug **11 LULUS**, ketahanan peladen **5 LULUS**. Bukan cacat: XFF palsu tidak bisa melewati pembatas laju di produksi |
| C5 | Regresi (b1, kesetiaan 14 layar, penjaga dash, build, lint) + verifikasi akhir produksi + LAPORAN-QA-2.md + STATUS, BERHENTI | SELESAI | b1 **246/0**; kesetiaan 14 layar cacat export **0** (beranda -1, struktur -6, galeri -5 poin, sebab tercatat); penjaga dash bersih; lint bersih (kini termasuk no-undef); build hijau; verifikasi produksi **9 langkah 0 gagal** (`c5-verifikasi-produksi.txt`); `laporan/LAPORAN-QA-2.md` |

### MENUNGGU PEMILIK (RUN QA-2)
1. ~~Pemulihan akun superadmin (B0d)~~ **SUDAH SELESAI oleh pemilik** 4 Sep 2026 17:37:59 WIB saat run ini berlangsung: `users` id 1 kini `wajib_ganti_sandi=0`, `token_version=3`; sandi sementara di `.env.produksi` tidak berlaku lagi (login dengan nilai itu -> 401). Nilai `SEED_ADMIN_PASSWORD` di `.env.produksi` boleh dihapus/diganti agar tidak menyesatkan. Audit produksi juga menunjukkan pemilik langsung memakai Kelola Pengurus (pengurus_ubah/urutan/hapus 17:41-17:49 WIB) - modul yang sebelum perbaikan C4 tidak bisa dibuka sama sekali.
2. **Isi DPW/DPD/DPC beserta wilayahnya** lewat Kelola Pengurus agar bagian "Pimpinan Regional" dan tampilan peta di `/struktur` terisi (sekarang kosong; keadaan kosong tampil benar). KEPUTUSAN yang dibutuhkan: apakah pengurus DPW/DPD/DPC yang sudah punya wilayah juga ingin muncul di bagian Pimpinan Regional dan di peta, atau cukup di blok kerangkanya masing-masing (perilaku sekarang).
3. **Akun staf seed di produksi semuanya nonaktif** (redaktur, penulis, verifikator, pimpinan wilayah; `aktif=0`). Aktifkan dan setel sandinya bila pengurus sungguhan akan memakainya. Ada satu akun uji `qa2.verifikasi.*` (id 10) yang sengaja ditinggalkan NONAKTIF: route hapus menolak akun yang sudah punya jejak audit (disengaja demi keutuhan buku besar).
4. Butir MENUNGGU PEMILIK dari RUN QA-1 dan DAFTAR TINDAKAN PEMILIK Tahap 9 tetap berlaku seluruhnya.

### Posisi terakhir RUN QA-2
RUN QA-2 SELESAI (4 Sep 2026 sekitar 17:30 WIB). Seluruh butir B0, K2, A1, A2, B1-B8, dan C1-C5 SELESAI.
Produksi menjalankan image `7d6a46e` HEALTHY (commit terakhir hanya menambah bukti & laporan, tidak mengubah kode aplikasi). Verifikasi akhir di domain LULUS: 9 langkah 0 gagal pada image 3c34e9d, pemeriksaan penutup baca-saja diulang pada f3e2833, dan penutupan rapi SIGTERM terbukti di log container saat redeploy 7d6a46e (`[warkop] SIGTERM diterima ... peladen ditutup rapi`).
Laporan: `laporan/LAPORAN-QA-2.md`. Run BERHENTI sesuai perintah.
Bila prompt dikirim ulang: tidak ada butir tersisa, hanya MENUNGGU PEMILIK di atas.

## RUN QA-3 (mulai 4 Sep 2026 sekitar 18:50 WIB) — RESTRUKTURISASI ORGANISASI + PERMINTAAN PEMILIK

Aturan lama berlaku penuh (PERINTAH-PEMILIK-SERVER, K1/K2/K3). Data produksi = sumber kebenaran:
pemilik menyunting pengurus tepat sebelum run, jadi seluruh migrasi ditulis agar TIDAK PERNAH
menimpa nama/jabatan/urutan/foto/deskripsi baris mana pun.

| # | Butir | Status | Catatan |
|---|---|---|---|
| 0 | Diagnosa CLI (baca-saja) | SELESAI | `claude --version` 2.1.260; `claude doctor` "No installation issues found" TETAPI **Auto-update terakhir GAGAL (install_failed) 4 Sep 2026**. Tidak ada instalasi/pembaruan dilakukan (`bukti-qa-3/0-diagnosa-cli.txt`) |
| A1 | Susunan kelompok final | SELESAI (5e3e90f) | 8 kelompok: dewan_pembina, dewan_penasehat, dewan_pengawas, pengurus_dpp, direktorat, satgas, dpw (provinsi), korda (kabupaten/kota). DIHAPUS: dpc, direktorat_eksekutif; dpd dipetakan ke korda. Ketiganya ditolak API 422 |
| A2 | Direktorat 12 bagian | SELESAI (5e3e90f) | Kolom baru `pengurus.bagian`; bagian wajib untuk Direktorat (422 BAGIAN_WAJIB); satu bagian boleh berisi beberapa jabatan; bagan menampilkan 12 kartu, yang kosong "(Belum terisi)" |
| A3 | Wilayah dua tingkat | SELESAI (5e3e90f) | Tabel wilayah TERNYATA sudah punya `jenis`+`induk_id` sejak Tahap 01 -> tanpa perubahan skema. Migrasi hanya MENAMBAH 514 kabupaten/kota (id 1-39 utuh, induk lewat JOIN kode). DPW wajib provinsi, Korda wajib kabupaten/kota (422 WILAYAH_JENIS_TIDAK_COCOK). Formulir: dropdown bertingkat + kotak cari |
| BUG | Kelompok pengurus hilang tiap disunting | SELESAI (5e3e90f) | AKAR MASALAH kartu "Sekjen DPP" nyasar: halaman staf tidak mengirim kolom `kelompok` ke formulir sehingga setiap PATCH mengirim null. Kini kelompok+bagian dikirim dan kelompok WAJIB di server |
| B | Kelola Pengurus berkepala kelompok | SELESAI (5e3e90f) | Baris kepala bg-primary/on-primary colspan penuh "<Kelompok> - <tingkat>", sub-kepala per bagian Direktorat, urutan mengikuti bagan; tombol naik/turun hanya bertukar dalam kelompok yang sama |
| C | Navbar tanpa "Masuk Staff" | SELESAI (4f95751) | Dihapus dari navbar + laci seluler + seluruh situs publik (11 halaman diperiksa: 0 teks, 0 tautan /login). Halaman masuk tetap hidup lewat URL langsung host staf. Menu dilegakan (gap-5/2xl gap-8, cari w-48/2xl w-64); diukur 1280-1920 tanpa tumpang tindih |
| D1 | Footer membentang penuh | SELESAI (4f95751) | Latar/garis ke <footer> w-full, kelas kontainer ke <div> di dalamnya; diukur 375/768/1280/1366/1440/1920: lebar footer = lebar layar, isi tetap berpadding dan maksimal 1280 |
| D2 | Tautan "Kantor Pusat" | SELESAI (4f95751) | Menggantikan "Kantor Regional"; tab baru + rel noopener ke petunjuk arah Google Maps 0.504192,101.427052; alamat disimpan di pengaturan `kontak_peta_url` (K3, dikosongkan = tautan hilang) |
| E | Media sosial | SELESAI (4f95751) | Kunci sosial_tiktok/instagram/youtube/facebook, tipe pengaturan baru `url` (wajib https, boleh kosong). Footer hanya menampilkan yang terisi. Ikon SVG inline buatan sendiri (bukan unduhan, bukan logo resmi). Isi sekarang: TikTok saja |
| F | Kategori program dinamis | SELESAI (4f95751) | Tabel `kategori_program`; `program.kategori` TETAP VARCHAR slug sehingga relasi lama aman. "Kategori Lainnya..." di formulir membuat kategori baru lewat server (3-60 karakter, tanpa HTML, harus ada huruf, slug otomatis, tanpa duplikat) dan langsung muncul di filter publik + ruang staf |
| G | Regresi + verifikasi akhir + laporan | SELESAI | b1 246/0; kesetiaan 14 layar cacat export 0 dengan dasar diperbarui + alasan tercatat; sapu konsol lokal 28/0 dan produksi 22/0; penjaga dash bersih (termasuk DB produksi, 7 tabel); lint + build hijau; verifikasi akhir produksi 10 langkah 0 gagal. `laporan/LAPORAN-QA-3.md` |

### Baris pengurus yang dipindah / dinonaktifkan (RUN QA-3)
Dipetakan ke bagian direktorat (nama/jabatan/urutan TIDAK diubah): 12, 17, 19, 21, 22, 23, 24.
DINONAKTIFKAN (aktif 1 -> 0, TIDAK dihapus): **14 Andreas Reynaldho** (kelompok NULL, kartu
"Sekjen DPP" yang nyasar di Pimpinan Regional). Tidak disentuh: 10, 3, 43, 1, 16, 25, 2.
**Sudah diselesaikan pemilik sendiri sesudah butir A tayang**: Andreas Reynaldho aktif kembali
sebagai Sekretaris Jenderal DPP di kelompok Pengurus DPP; Dian Lestari Gultom dipindah ke
Direktorat/Hukum dan Advokasi; Jasrivai Manulang ke Penyuluhan dan Sosialisasi; Yefrizal menjadi
Wakil Direktur Humas; dua orang baru (Dewan Penasehat, Dewan Pengawas). Keadaan akhir produksi:
17 pengurus aktif, semuanya berkelompok sah, seluruh Direktorat punya bagian, 0 tanpa kelompok.

### MENUNGGU PEMILIK (RUN QA-3)
1. **Tinjau daftar 514 kabupaten/kota**: disusun dari pengetahuan umum, BUKAN salinan basis data resmi, jadi bisa tidak mutakhir. Kode sengaja internal (awalan "K") agar tidak dikira kode resmi BPS/Kemendagri.
2. **Putuskan kerangka Koordinator Daerah**: sekarang hanya menampilkan provinsi yang SUDAH punya koordinator (menghindari ratusan kartu kosong); kerangka penuh hanya untuk DPW (38 provinsi). Bila ingin kerangka kabupaten/kota penuh, beri tahu.
3. **Isi kanal media sosial lain** (Instagram, YouTube, Facebook) lewat Pengaturan; ikon otomatis muncul saat diisi.
4. **Pembaruan otomatis Claude Code CLI GAGAL** (`install_failed`, 4 Sep 2026). Tidak menghambat apa pun; perbarui sendiri bila diinginkan.
5. Butir MENUNGGU PEMILIK RUN QA-1, QA-2, dan DAFTAR TINDAKAN PEMILIK Tahap 9 tetap berlaku.

### Posisi terakhir RUN QA-3
RUN QA-3 SELESAI (4 Sep 2026 sekitar 19:35 WIB). Seluruh butir A sampai G SELESAI dan tayang di
produksi (image `4f95751` HEALTHY). Verifikasi akhir di domain produksi LULUS 10 langkah 0 gagal.
Laporan: `laporan/LAPORAN-QA-3.md`. Run BERHENTI sesuai perintah.
Bila prompt dikirim ulang: tidak ada butir tersisa, hanya MENUNGGU PEMILIK di atas.

## RUN QA-4 (mulai 5 Sep 2026 sekitar 04:35 WIB) — BERITA-DULU + BILAH KATEGORI + HEADER SELULER + PERBURUAN BUG TOTAL

| # | Butir | Status | Catatan |
|---|---|---|---|
| P1 | Sinkron produksi | SELESAI | health 200; DB dari container OK; token webhook SAH (uuid palsu -> 404, bukan 401); seluruh kredensial .env.produksi = env container kecuali SEED_ADMIN_PASSWORD (wajar, sudah diganti pemilik); akun staf uji dipakai lalu dinonaktifkan (`bukti-qa-4/p1-sinkron-produksi.txt`) |
| P2 | Volume lampiran | MENUNGGU PEMILIK (tidak blokir) | `docker inspect`: hanya volume `warkop-unggahan` -> /app/public/unggahan; **TIDAK ADA mount /app/unggahan-terjaga** -> lampiran pengaduan tersimpan di layer container dan HILANG tiap redeploy (`p2-dampak-volume-lampiran.txt`: 6 baris lampiran uji di DB, 0 berkas di disk) |
| A | 11 kategori berita final | SELESAI (46ca511) | migrasi idempoten lokal+produksi; Investigasi tetap id 1; 4 kategori lama dinonaktifkan (bukan dihapus) setelah 8 artikelnya dipetakan; ikon Material dari 77 ikon resmi; route artikel menolak kategori nonaktif/tidak ada 422 (`a-migrasi-produksi.txt`) |
| B | Bilah kategori semua halaman publik | SELESAI (46ca511) | bg-primary/on-primary, 11 item urut, geser di 375/768, aktif emas, keyboard, tanpa lompat gulir; staf tidak diberi; diuji 6 halaman x 3 lebar lokal+produksi |
| C | Beranda = berita | SELESAI (46ca511) | KEPUTUSAN PEMILIK; statistik + Status Advokasi dipindah ke sisi beranda berita (KEPUTUSAN BARU); komponen bersama components/publik/berita/*; alur beranda->kategori->artikel->kembali LULUS |
| D | Header seluler sejajar | SELESAI (46ca511) | 320/375/414/767 merek kiri + hamburger kanan sebaris, laci berfungsi |
| F1 | Inventaris halaman x 6 identitas x 3 lebar | SELESAI | 633 sel LULUS (35 halaman x tamu + 5 peran x 375/768/1280): 0 galat konsol/jaringan, 0 gulir mendatar, 0 tumpang tindih (`f1-inventaris-lokal.txt`) |
| F2 | Interaksi semua elemen & kolom | SELESAI | 25 pemeriksaan LULUS: klik semua elemen 23 halaman, 47 kolom diketik penuh, anti klik ganda login + pengaduan (`f2-interaksi-lokal.txt`) |
| F3 | Alur end-to-end diulang semua | SELESAI | 9 suite 108 langkah LULUS: c3a lampiran+batas 12, c3b kembali/muat ulang 11, c3c 11, c3d 25 aksi, c4 regresi 11, QA-3 A+B 11, QA-3 C/D/E/F 15, realtime+lampiran terjaga+sosial 6 (`f3-ringkasan.txt`); C3b lari pertama menemukan BUG lompat gulir bilah (F5) |
| F4 | Server sehat | SELESAI (595e48f, terbukti 010e303) | restart 0, OOM tidak, disk 25%, log app bersih 24 jam, rotasi log 10m x3; TEMUAN: "Aborted connection" MariaDB tiap redeploy -> pool per-bundel + tidak ditutup saat SIGTERM; diperbaiki (lib/db globalThis + server.js tutupPool), tayang 595e48f; pembuktian log pada redeploy penutup (`f4-temuan-pool-redeploy.txt`, `bukti-server/23-*`) |
| F5 | Bug ditemukan-diperbaiki + regresi | SELESAI (595e48f) | 4 bug produk diperbaiki + regresi: (1) API artikel menerima kategori nonaktif/tidak ada -> 422; (2) kelas `hide-scrollbar` desain tidak pernah didefinisikan; (3) pool DB per-bundel + tidak ditutup saat SIGTERM; (4) bilah kategori membuat halaman melompat saat ganti kategori dalam keadaan tergulir (scrollIntoView -> scrollLeft ul saja). 2 temuan perangkat uji (ruang IP 429 palsu, suite lama pra-QA-3) diperbaiki. Rincian LAPORAN-QA-4.md bagian 9 |
| G | Regresi + verifikasi akhir + laporan | SELESAI | uji-b1 246/0; kesetiaan 14 layar HTTP 200 cacat export 0 (dasar diperbarui + alasan, `g-regresi-kesetiaan-selisih.txt`); penjaga dash bersih lokal + DB produksi; lint + build hijau; uji-abcd 18 langkah lokal + produksi LULUS; sapu konsol 69 sel lokal + 69 produksi 0 gagal; verifikasi produksi 10 langkah 0 gagal; `laporan/LAPORAN-QA-4.md` |

### MENUNGGU PEMILIK (RUN QA-4)
1. **Volume lampiran** (P2): pasang volume Coolify dengan mount path `/app/unggahan-terjaga` lalu redeploy; sampai itu, lampiran pengaduan hilang pada tiap redeploy (baris DB tetap, berkas 404).
2. **Ejaan "Podcash"** dipakai persis; konfirmasi bila maksudnya "Podcast" (cukup ubah nama di `lib/kategoriBerita.js` + baris id 15).
3. **Pemetaan 8 artikel kategori lama** (tabel di LAPORAN-QA-4.md bagian 4): pindahkan lewat ruang staf bila ada yang kurang pas.
4. Butir MENUNGGU PEMILIK RUN QA-1/QA-2/QA-3 dan DAFTAR TINDAKAN PEMILIK Tahap 9 tetap berlaku.

### Posisi terakhir RUN QA-4
RUN QA-4 SELESAI (5 Sep 2026 ±05:55 WIB). Produksi: image 010e303 HEALTHY, health 200; bukti tutupPool saat SIGTERM: log container lama "pool basis data ditutup", MariaDB 0 "Aborted connection" (`bukti-server/23-*`). Semua butir P1, A-D, F1-F5, G SELESAI; P2 MENUNGGU PEMILIK. Laporan `laporan/LAPORAN-QA-4.md`. Run BERHENTI. Bila prompt dikirim ulang: tidak ada butir tersisa, hanya MENUNGGU PEMILIK di atas.

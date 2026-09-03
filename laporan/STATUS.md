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
| 09 Pengerasan | BELUM | | |

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
- Push + redeploy via webhook diizinkan (PERINTAH-PEMILIK-SERVER 3). Webhook port 8000 TIDAK terjangkau dari internet → dipanggil dari dalam server lewat SSH (localhost:8000), token via stdin — KEPUTUSAN BARU. Redeploy Tahap 03 (a2dbb53) sukses 3 Sep 22:45 WIB; Tahap 04 (6e39a1b) 23:28 WIB; Tahap 07 (d38129e) 4 Sep 01:18 WIB; **Tahap 08 (3c64be4) 4 Sep 02:12 WIB**, health 200 (bukti-server/0N-redeploy-tahap-0N.txt; skrip bukti-server/skrip/redeploy.sh). Socket.io wss:// terbukti di produksi (bukti-tahap-08/h-wss-produksi.txt).

## Posisi terakhir (bila sesi terputus di tengah tahap)
Tahap 08 LULUS + commit 3c64be4, ter-push, produksi image 3c64be4 HEALTHY, uji h wss produksi LULUS. Berikutnya: Tahap 09 (pengerasan) dari awal — baca dokumen/TAHAP-09-*.md.

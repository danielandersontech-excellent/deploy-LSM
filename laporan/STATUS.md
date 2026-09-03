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
| 05 Modul berita | SEDANG | | mulai 3 Sep 2026 23:20 WIB: sanitasi server (isomorphic-dompurify), unggahan (magic bytes+sharp+nama acak) + route penyaji /unggahan, slugify, API artikel publik/staf/terbitkan/unggah, sidebar staf kanonik + layout; uji API b/c/d/e/f/g LULUS (bukti-tahap-05/b-c-d-e-f-g-api.txt); 4 halaman dikerjakan agen paralel |
| 06 Modul pengaduan | BELUM | | |
| 07 Ruang staf | BELUM | | |
| 08 Realtime | BELUM | | |
| 09 Pengerasan | BELUM | | |

## BLOKIR / MENUNGGU PEMILIK

### Keputusan pemilik yang menunggu (tidak menghalangi run)
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
- Push + redeploy via webhook diizinkan (PERINTAH-PEMILIK-SERVER 3). Webhook port 8000 TIDAK terjangkau dari internet → dipanggil dari dalam server lewat SSH (localhost:8000), token via stdin — KEPUTUSAN BARU. Redeploy Tahap 03 (a2dbb53) sukses 3 Sep 22:45 WIB; Tahap 04 (6e39a1b) sukses 23:28 WIB, health 200 (bukti-server/03-…, 04-redeploy-tahap-04.txt; skrip bukti-server/skrip/redeploy.sh).

## Posisi terakhir (bila sesi terputus di tengah tahap)
Tahap 05 SEDANG — fondasi (lib/sanitasi, lib/unggahan, route API, sidebar/layout staf) sudah ditulis, belum di-commit; halaman /berita, /berita/[slug], /staf/artikel, editor sedang dikonversi; sisa uji a,h,i–o, laporan, commit, push, redeploy.

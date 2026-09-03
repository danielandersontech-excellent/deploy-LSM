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
| 04 Situs publik | SEDANG | | mulai 3 Sep 2026 22:50 WIB: komponen bersama (navbar/footer kanonik, ui/*, hooks), beranda, halaman teks statis, not-found/error/sitemap/robots, penampung gambar; 4 halaman lain dikerjakan agen paralel |
| 05 Modul berita | BELUM | | |
| 06 Modul pengaduan | BELUM | | |
| 07 Ruang staf | BELUM | | |
| 08 Realtime | BELUM | | |
| 09 Pengerasan | BELUM | | |

## BLOKIR / MENUNGGU PEMILIK

(kosong — 3 Sep 2026 ±22:20 WIB: blokir disk C: DICABUT oleh pemilik; run
MODE OTONOM dilanjutkan. Perintah pemilik untuk server/produksi terangkum di
`dokumen/PERINTAH-PEMILIK-SERVER.md` — baca itu dulu bila sesi terputus.)

## Produksi (ringkas, tanpa rahasia)

- Domain: warkopnusantara.id / staf.warkopnusantara.id — HTTPS aktif,
  `/api/health` 200 dari laptop dan dari server (3 Sep 2026 22:20 WIB).
- Container app produksi: image tag = commit c97e255 (HEAD saat run dilanjutkan),
  HEALTHY, volume `warkop-unggahan`. DB `warkop_nusantara` KOSONG (belum ada
  tabel) sebelum tugas 5a.
- Push + redeploy via webhook diizinkan (PERINTAH-PEMILIK-SERVER 3). Webhook port 8000 TIDAK terjangkau dari internet → dipanggil dari dalam server lewat SSH (localhost:8000), token via stdin — KEPUTUSAN BARU. Redeploy Tahap 03 (a2dbb53) sukses 3 Sep 22:45 WIB, health 200 (bukti-server/03-redeploy-tahap-03.txt).

## Posisi terakhir (bila sesi terputus di tengah tahap)
Tahap 04 SEDANG — berkas komponen bersama + beranda + halaman statis sudah ditulis (belum di-commit); tentang/struktur/program/galeri sedang dikonversi; uji a–n Tahap 4 belum dijalankan.

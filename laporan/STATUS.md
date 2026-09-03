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
| 03 Docker | SEDANG (gerbang tertunda) | 2ab6814 | berkas lengkap; uji l & k-sebelum LULUS; butir a–k container diulang 3 Sep 2026 (disk C: dibereskan pemilik, sisa 7,4 GB); butir server dikerjakan via SSH sesuai `dokumen/PERINTAH-PEMILIK-SERVER.md` |
| 04 Situs publik | BELUM | | dimulai setelah gerbang Tahap 3 + tugas server 5a/5b |
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
- Push + redeploy via webhook diizinkan (PERINTAH-PEMILIK-SERVER 3).

## Posisi terakhir (bila sesi terputus di tengah tahap)
Tahap 03 — mengulang butir a–k (build image lokal + uji container) di laptop,
lalu tugas server 5a (skema+seed produksi) dan 5b (bukti `laporan/bukti-server/`),
lalu Tahap 4.

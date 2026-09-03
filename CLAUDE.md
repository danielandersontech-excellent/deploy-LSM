# CLAUDE.md — WARKOP NUSANTARA

Repo ini membangun sistem produksi untuk LSM WARKOP NUSANTARA: portal publik +
berita investigasi + kanal pengaduan masyarakat dengan ruang staf. Pengaduan
bisa anonim dan menyangkut dugaan korupsi — **kesalahan di sini membahayakan
orang sungguhan**. Kerjakan seperti sistem yang nyawanya dipertaruhkan, karena
memang begitu.

## Dokumen hukum — baca sebelum menulis kode

| Jalur | Isi |
|---|---|
| `dokumen/CETAK-BIRU-SISTEM.md` | HUKUM arsitektur. Menyimpang = berhenti dan tanya dulu |
| `dokumen/REFERENSI.md` | Seluruh keputusan: skema DB, token desain, peran, **bagian 18 = Protokol Konversi Layar (wajib untuk setiap halaman)** |
| `dokumen/ALUR-KERJA-CLAUDE-CODE.md` | Cara menutup tahap: uji → laporan → commit → BERHENTI |
| `dokumen/TAHAP-XX-*.md` | Perintah per tahap. Kerjakan hanya tahap yang diminta pemilik |

## Sumber baca-saja — JANGAN PERNAH diubah, dipindah, atau dihapus

- `desain/stitch_portal_berita_inklusif/` — desain UI final (17 layar, 14
  valid; cacat export ada di REFERENSI bagian 9). **Tampilan HARUS mengikuti
  `code.html` di sini**, lewat protokol REFERENSI 18: salin DOM + kelas
  Tailwind apa adanya, hanya enam jenis perubahan yang diizinkan, navbar/
  footer/sidebar dari markup kanonik 18.3.
- `paket-pendukung/ASET/` — font woff2, `ikon/Ikon.js` (77 ikon Material
  Symbols resmi), logo turunan, kerangka terverifikasi (`tailwind.config.js`,
  `font.js`, `server.js`, `proxy.js`). **Salin ke tempatnya, jangan tulis
  ulang, jangan ganti dengan buatan sendiri.**
- `paket-pendukung/UJI/uji-kesetiaan.mjs` — pembanding desain vs render.
- `Warkop_Nusantara.zip`, `LSM_WARKOP.png` — sumber asli.

## Aturan yang tidak bisa ditawar

1. **Dilarang mendesain ulang.** Jangan "memperbaiki" jarak, warna, radius,
   atau menambah animasi. Desain final ada di `desain/`. Temuan aneh →
   laporkan, jangan ubah diam-diam.
2. **Jangan pernah melaporkan uji lulus tanpa benar-benar menjalankannya.**
   Bila tak bisa dijalankan, tulis tidak bisa + alasannya. Hasil negatif
   adalah temuan berharga, bukan aib.
3. **Identitas pelapor** (nama/NIK/telepon/email di `pengaduan`) hanya untuk
   peran `superadmin` dan `verifikator`, tidak pernah ke publik, socket, log,
   atau balasan API peran lain.
4. **Paket npm**: hanya yang tercantum di cetak biru bagian 4 + `slugify`,
   `sharp`, `isomorphic-dompurify`. Paket lain = izin pemilik dulu.
5. Bahasa Indonesia untuk komentar, nama fungsi/variabel domain, teks UI,
   pesan galat, dan laporan.
6. Tandai setiap **KEPUTUSAN BARU** (hal yang tidak diatur dokumen) secara
   eksplisit di laporan.
7. **Dua mode kerja.** Bawaan = MODE GERBANG: satu tahap per perintah,
   selesai = uji + `laporan/LAPORAN-TAHAP-XX.md` + build hijau + satu commit
   → BERHENTI menunggu pemilik. Bila perintah pemilik secara eksplisit
   menyebut **MODE OTONOM**, ikuti bagian MODE OTONOM di
   `dokumen/ALUR-KERJA-CLAUDE-CODE.md`: gerbang diverifikasi sendiri dengan
   bukti berkas, `laporan/STATUS.md` diperbarui, lalu lanjut tahap berikutnya
   tanpa bertanya. Dalam mode apa pun, uji tanpa berkas bukti = belum
   dikerjakan.
8. `git push`, deploy Coolify, atau menyentuh apa pun di luar `D:\Deploy\LSM`
   — hanya atas perintah eksplisit pemilik.
9. Jangan pernah menulis rahasia (`.env`, kata sandi, JWT_SECRET) ke berkas
   yang ter-commit atau ke log.

## Lingkungan

- **Windows + PowerShell.** Uji HTTP pakai `curl.exe` (alias `curl` PowerShell
  = Invoke-WebRequest, keluarannya beda). Pencarian teks pakai
  `Select-String` atau `node`/skrip bila `grep` tidak ada.
- Node 22+, Next.js 16 (`proxy.js`, bukan middleware; `await cookies()` /
  `await headers()`; custom `server.js` + Socket.io — jangan `next start`).
- MariaDB 11 lokal lewat Docker Desktop (perintah di
  `dokumen/TAHAP-01-BASIS-DATA.md`). Zona waktu: simpan UTC, tampilkan WIB —
  jangan percaya zona waktu mesin.
- Dev server dijalankan sebagai proses latar saat menguji dengan curl;
  matikan setelah selesai.

## Jebakan yang sudah terbukti (jangan diulang)

- Di custom server, `request.url` di `proxy.js` = `0.0.0.0:3000`, bukan host
  asli → semua pengalihan wajib lewat `urlDariHeader()` (sudah ada di
  `paket-pendukung/ASET/kerangka/proxy.js`). Periksa nilai `Location` harfiah.
- `next/font/google` mengunduh saat build → pakai `next/font/local` dengan
  woff2 dari `paket-pendukung/ASET/fonts/`.
- Ikon font Material bisa bocor sebagai teks → selalu `<Ikon nama="..." />`
  dari `components/ui/Ikon.js`.
- Socket.io klien menyambung same-origin (cookie httpOnly tidak lintas
  subdomain).

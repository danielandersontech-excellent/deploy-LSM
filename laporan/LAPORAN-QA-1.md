# LAPORAN RUN QA-1 — PERBAIKAN & QA MENYELURUH ATAS TEMUAN PEMILIK

Tanggal: 4 September 2026 (09:40–12:10 WIB). Mode: OTONOM. Produksi akhir: image **3069d7d** (HEALTHY),
`https://warkopnusantara.id` / `https://staf.warkopnusantara.id`. Bukti di `laporan/bukti-qa-1/` (skrip yang bisa
diulang di `skrip/`, tangkapan di `tangkapan/`). Commit run ini: 12d850f (butir 1), 6831eff (butir 2–3),
3069d7d (butir 4–5), + commit laporan ini.

## 1. Ringkasan perbaikan

| # | Temuan pemilik / butir | Akar masalah | Perbaikan | Bukti |
|---|---|---|---|---|
| 1 | Berita tidak bisa diklik | Kartu bergaya klik (`cursor-pointer`, hover) tetapi hanya TEKS JUDUL yang ber-`<a>`; gambar, ringkasan, badan kartu tanpa tautan. Reproduksi produksi: 25 klik CDP (gambar/judul/ringkasan/badan) tidak berpindah | `components/publik/TautanKartu.js` — tautan peregang (`<Link>` absolut `inset-0 z-10`, `aria-hidden`/`tabIndex -1` agar tautan judul tetap satu-satunya tab-stop) di beranda (2 kartu), `/berita` (unggulan, daftar, sidebar "Paling Banyak Dibaca"); artikel terkait di detail sudah `<Link>` penuh; butir panel dashboard (artikel/pengaduan) ber-tautan | `1-klik-kartu-sebelum-produksi.txt` (25 gagal), `1-klik-kartu-sesudah-lokal.txt` & `-produksi.txt` (LULUS), `tangkapan/1-*.png` |
| 2 | Kesetiaan visual menurut mata (14 layar) | Lihat tabel §2 | Navbar (logo `h-8 w-8` seperti desain; nav tanpa `flex-wrap` → item membungkus teks, satu baris), `/berita` grid 2 kolom di kolom utama, filter `<select>` langsung berlaku tanpa tombol "Terapkan" (`KirimOtomatis`; tombol hanya di `<noscript>`) di berita/program/kelola artikel, program tanpa select status, tanggal galeri sejajar satu baris, panah kartu program 24 px, cap air hero/login/tentang lembut (`public/logo-warkop-cap-air.png`) | `tangkapan/visual/NN-<layar>-{sebelum,sesudah,sesudah-produksi}.png` (kiri desain code.html, kanan render) |
| 3 | Gambar jelek & posisi buruk | Penampung seed lama: logo pekat + teks "GAMBAR PENAMPUNG" yang terpotong di kartu; logo besar dipakai sebagai gambar konten (peta kontak/struktur, hero program, fallback artikel) | `scripts/buat-penampung.mjs --paksa`: 28 penampung halus (gradasi krem token + garis emas samar + lambang kecil 28 % opasitas, tanpa teks), rasio per slot (artikel/program 16:9, galeri 4:3 & 1:1, pengurus 1:1 siluet, peta 3:2, hero program 4:3); rujukan gambar konten diganti; audit semua `<Image>`/latar: `object-cover`, `width/height/sizes` sudah benar | komposit visual §2; `public/penampung/*` |
| 4 | Fungsional total | — | Rayapan tautan + konsol bersih + 25 aksi end-to-end. **Cacat ditemukan & diperbaiki**: pengalihan wajib-ganti-sandi hanya di klien (tanpa JS halaman staf lain terbaca) → kini di server (`proxy.js` header `x-jalur` + `app/(staf)/staf/layout.js` `redirect`) | `4a-rayapan-konsol-lokal.txt`, `4a-rayapan-konsol-produksi.txt`, `4b-aksi-end-to-end-lokal.txt` |
| 5 | HP & laptop 375/768/1280 | Tabel staf tanpa pembungkus gulir (artikel/pengurus/program), dua kolom formulir (`w-[320px]`) di editor/program/pengaturan tidak muat < lg, kepala editor tidak membungkus | `overflow-x-auto` (pola desain dashboard/kelola_pengaduan), `flex-col lg:flex-row` + `w-full lg:w-[320px]`, `flex-wrap` | `5-responsif-lokal.txt`, `5-responsif-produksi.txt`, `tangkapan/responsif/` |
| 6 | Regresi | — | uji-b1 246/0; kesetiaan 14 layar cacat export 0; build + lint hijau | `6-regresi-b1.txt`, `6-regresi-kesetiaan-14-layar.md`, `5-build.txt` |

Perbaikan sampingan: 162 profil `HeadlessChrome*` sementara (±100 MB/run skrip CDP) memenuhi disk C: laptop → dibersihkan; seluruh skrip CDP kini memakai `--user-data-dir` sementara yang dihapus saat keluar.

## 2. Tabel selisih visual per layar (desain `code.html` dirender Chrome vs halaman kita, lebar 1280 publik / 1600 staf)

Rujukan: `screen.png` desain ternyata render yang diperkecil (mis. beranda 830 px) dan **3 di antaranya rusak** (28 byte
"FIFE Image failed to fetch": portal_berita_beranda, program_kegiatan, tentang_kami_warkop_nusantara) → rujukan visual
yang dipakai adalah `code.html` desain yang dirender Chrome (Tailwind CDN + Google Fonts) pada lebar yang sama.
Komposit: `tangkapan/visual/NN-<layar>-sebelum.png` → `-sesudah.png` (lokal) → `-sesudah-produksi.png` (domain).

| # | Layar | Selisih yang terlihat (sebelum) | Sumber | Tindakan |
|---|---|---|---|---|
| 1 | beranda | Navbar: merek satu baris + menu turun ke baris kedua (desain: logo kecil, merek 2 baris, item membungkus teks, satu baris); cap air hero terlalu pekat; gambar sorotan = penampung berteks terpotong; Status Advokasi 1 kasus (desain 2) | kode / kode / aset / data | logo h-8, nav tanpa flex-wrap ✅; cap air lembut ✅; penampung baru ✅; data seed — MENUNGGU |
| 2 | tentang | Navbar layar desain ini varian non-kanonik (kita: kanonik 18.3 — wajar); latar hero desain foto samar (kita cap logo); Filosofi Lambang: desain foto stempel + 4 butir, kita logo + 9 butir (REFERENSI 1); seksi Visi–Misi & Motto tambahan tidak ada di desain | aset / konten Tahap 4 | cap air lembut ✅; foto & keputusan konten — MENUNGGU |
| 3 | struktur | Tata letak sesuai; foto pengurus = penampung logo gelap (desain foto asli) | aset | siluet netral ✅; foto asli — MENUNGGU |
| 4 | program | Filter: "Semua Status" + tombol "Terapkan" tidak ada di desain; hero = logo terpotong (desain ilustrasi peta); panah "Lihat Laporan Detail" lebih kecil; kartu = penampung berteks; paginasi tidak tampil (data 3 item) | kode / aset / kode / aset / data | select status dihapus, select urutan langsung berlaku ✅; peta penampung ✅; panah 24 px ✅; penampung baru ✅ |
| 5 | galeri | Filter tidak sejajar (dua input tanggal bertumpuk); gambar = penampung berteks | kode / aset | tanggal sejajar satu baris ✅; penampung baru ✅ |
| 6 | kontak | Sesuai; peta kantor regional = logo (desain foto peta) | aset | peta penampung ✅; foto — MENUNGGU |
| 7 | portal_berita_beranda (rujukan /berita) | Kartu daftar terjepit di kolom 2/3 (grid 3 kolom) → judul terpotong "…"; tombol "Terapkan" | kode | grid 2 kolom seperti "Berita Terkini" desain ✅; select langsung berlaku ✅ |
| 8 | daftar_berita_investigasi (/berita) | Kepala + filter sesuai; desain menampilkan kartu 3 kolom selebar penuh tanpa sidebar — kita menggabungkan dengan #7 (keputusan Tahap 5) | keputusan desain | tetap gabungan (kini kartu 2 kolom) — MENUNGGU bila ingin persis #8 |
| 9 | detail artikel | Sesuai (rasio gambar 16:9 sama); desain punya keterangan foto ("Foto: …") — tabel artikel belum punya kolom itu; artikel terkait 2 vs 3 (data) | konten/skema | MENUNGGU (kolom keterangan gambar bila diinginkan) |
| 10 | login | Sesuai; cap air latar lebih pekat | aset | cap air lembut ✅ |
| 11 | dashboard | Sesuai (grafik 12 bulan vs 6 batang desain — data) | — | — |
| 12 | kelola artikel | Sesuai; tombol "Terapkan" tidak ada di desain | kode | select langsung berlaku ✅ |
| 13 | editor artikel | Sesuai; pratinjau gambar = penampung berteks | aset | penampung baru ✅ |
| 14 | kelola pengaduan | Sesuai (sidebar desain layar ini varian; kita kanonik); overlay detail tidak dibangun (keputusan Tahap 6) | keputusan | MENUNGGU |

Cakupan kelas (uji kesetiaan regresi) tetap 63–99 % dengan cacat export 0/14; penurunan ≤ 3 poin pada program/tentang/
berita berasal dari kelas tombol "Terapkan"/select status/`lg:grid-cols-3` yang dihapus agar sesuai desain.

## 3. Gambar (butir 3)

Audit seluruh pemakaian gambar publik & staf (`grep <Image|role=img|backgroundImage|<img`): semuanya `object-cover`/
`object-contain` sesuai slot, `width/height` atau `fill`+`sizes` terisi, avatar bulat `rounded-full object-cover`, pratinjau
unggahan `unoptimized` + `max-h`. Penampung baru: `public/penampung/{artikel-1..12,galeri-1..6,pengurus-1..5,program-1..3}.jpg`
+ `peta-penampung.jpg` + `program-hero.jpg` (`scripts/buat-penampung.mjs --paksa`; tanpa `--paksa` berkas yang ada tidak
ditimpa agar foto asli pemilik aman). Video `galeri-3.mp4` tetap tidak ada (tanpa ffmpeg).

## 4. Fungsional (butir 4)

- **Rayapan** (`skrip/uji-4-rayapan-konsol.mjs`): BFS kedalaman 3 dari `/` (tanpa login) dan `/staf/dashboard` untuk 5 peran;
  lokal 30 + 55 + 44 + 29 + 10 + 33 = 201 URL semuanya 200; setiap halaman dibuka di Chrome headless: **0 halaman dengan
  error/exception konsol**. Produksi (publik + superadmin): 70 URL 200, 0 error.
- **Aksi end-to-end** (`skrip/uji-4-aksi-end-to-end.mjs`, 25 langkah, LULUS): login 5 peran + logout (cookie dihapus,
  dashboard → /login); pengaduan anonim, bernama (verifikator melihat identitas), dengan lampiran PNG multipart (lampiran
  terbuka verifikator 200 image/png nosniff, 401 tanpa login); lacak 3 nomor tanpa identitas + nomor palsu 404; status +
  penugasan petugas; unggah gambar; artikel draf → terbit (publik 200) → arsip (publik 404) → draf → hapus (penulis 403,
  redaktur 200); pengurus/program/galeri buat → ubah → tampil publik → hapus; pengguna buat → reset sandi → login sandi
  sementara → wajib ganti (server redirect 307) → ganti sandi → paksa keluar (sesi 401) → nonaktif (login 401); pengaturan
  simpan → tampil di footer → pulih. Data uji dibersihkan.
- **Temuan transien**: saat rolling update Coolify (container lama & baru bersamaan), HTML dari container lama merujuk chunk
  CSS yang hanya ada di build baru → 404 `text/plain` di konsol `/tentang`; hilang setelah swap. Dicatat sebagai risiko
  (§7).

## 5. HP & laptop (butir 5)

`skrip/uji-5-responsif.mjs`: 14 halaman publik + 12 halaman staf × {375 (mobile, dpr 2), 768 (mobile), 1280}: tanpa gulir
mendatar (elemen di dalam wilayah `overflow-x-auto` yang disengaja — tabel & pil status, pola desain — dan yang terpotong
rapi oleh induk `overflow-hidden` tidak dihitung), tanpa kontrol yang tumpang tindih (> 25 % irisan); hamburger publik
membuka laci (9 tautan, `aria-expanded=true`) dan klik "Kontak & Pengaduan" berpindah; laci staf membuka sidebar (9 tautan);
formulir pengaduan 375 diisi penuh (anonim, kategori, wilayah, lokasi, deskripsi) dan dikirim → nomor kasus (lokal &
produksi; dihapus lunak). Kontrol < 24 px (ikon aksi tabel 20 px, tautan "Profil") dilaporkan sebagai informasi, mengikuti
ukuran desain. **Catatan jujur: Safari iOS, Safari macOS, Chrome Android asli TIDAK tersedia — seluruhnya emulasi Chrome 152.**

## 6. MENUNGGU PEMILIK

1. **Foto sungguhan** (penampung netral sekarang): gambar utama 12 artikel seed, 6 galeri + video `galeri-3.mp4`, 5 foto
   pengurus, 3 gambar program, hero Program & Kegiatan (desain: ilustrasi peta + kaca pembesar), peta kantor regional
   (kontak & struktur), latar hero beranda/tentang/login (desain: foto samar), foto stempel "Filosofi Lambang", foto penulis.
2. **Navbar 1280 px**: kini persis desain; desain sendiri membuat "Berita" menyentuh kotak cari pada 1280 px. Pilihan:
   biarkan, kotak cari hanya di laci, atau jarak lebih rapat.
3. **Tentang Kami**: 9 butir filosofi (REFERENSI 1) vs 4 di desain; seksi Visi–Misi & Motto tidak ada di desain — pertahankan?
4. **/berita**: gabungan dua desain (sorotan + sidebar dari portal_berita_beranda; kepala + filter + kartu dari
   daftar_berita_investigasi). Bila ingin persis daftar_berita_investigasi (3 kolom penuh tanpa sidebar), beri tahu.
5. **Detail artikel**: kolom keterangan gambar ("Foto: …") belum ada di skema.
6. **Kelola pengaduan**: overlay detail desain tidak dibangun (halaman detail terpisah).
7. Data seed: Status Advokasi 1 kasus (desain 2), pagination program (3 item), artikel terkait 2 (desain 3).
8. Disk C: laptop pemilik: `%TEMP%\hktiwo3c` (2,6 GB, cache installer Visual Studio) dan `docker_data.vhdx` 13,6 GB — bukan
   milik run ini, tidak disentuh.

## 7. Risiko tersisa / catatan

- Rolling update Coolify: jendela singkat HTML lama + aset baru (404 chunk). Mitigasi: aset ber-hash tetap dilayani lintas
  versi butuh penyimpanan bersama/CDN — pengembangan berikutnya; dampak: satu muat ulang halaman.
- Emulasi peramban saja (tanpa perangkat iOS/Android).
- Tindakan pemilik dari Tahap 9 masih berlaku (rahasia di layer image Coolify, firewall, SSH, volume lampiran, cron cadangan).

## KEPUTUSAN BARU run ini

Tautan peregang `TautanKartu` (aria-hidden, tabIndex -1); `KirimOtomatis` (select/date mengirim formulir; tombol di `<noscript>`);
select status program tidak dirender (parameter URL tetap didukung); grid kartu /berita 2 kolom; logo navbar h-8 tanpa
flex-wrap; cap air = turunan logo lebih terang; penampung tanpa teks dengan rasio per slot; pengalihan wajib-ganti-sandi
di server lewat header `x-jalur`; tabel staf ber-`overflow-x-auto`; dua kolom formulir staf `lg:flex-row`; skrip CDP dengan
profil sementara.

# LAPORAN RUN AI-1 - ASISTEN BERITA AI - WARKOP NUSANTARA

Mode: OTONOM. Perintah pemilik: "RUN AI-1: ASISTEN BERITA AI (Claude API + web search + mesin gambar berlisensi multi-sumber)"
dengan AMANDEMEN K1 (draf boleh ditulis AI: status selalu DRAF, catatan verifikasi + sumber riset internal untuk redaksi,
badan artikel bersih dari tautan/daftar sumber, foto dari mesin berlisensi tanpa label/kredit, asal foto internal saja).
Mulai 7 Oktober 2026 sekitar 00:00 WIB. Semua bukti ada di `laporan/bukti-ai-1/` (skrip di `skrip/`, tangkapan di `tangkapan/`).
Bagian produksi (redeploy, verifikasi) dicatat di bagian 7 dan di `laporan/STATUS.md` bagian RUN AI-1.

## 1. Ringkasan

| Butir | Hasil | Bukti utama |
|---|---|---|
| P Prasyarat | SELESAI: `ANTHROPIC_API_KEY` + `PIXABAY_API_KEY` disalin dari `.env.produksi` ke `.env` lokal (nilai tidak pernah dicetak); kunci Anthropic sah lewat `GET /v1/models` (gratis): `claude-sonnet-5-5` ADA; Pixabay OK; Openverse + Wikimedia OK tanpa kunci; **Pexels tanpa kunci (penyedia nonaktif, dicatat)**. TEMUAN: container MariaDB lokal hilang, dibuat ulang di port 13306 (3306/3307 masuk rentang eksklusi port Windows) | `p-verifikasi-penyedia.txt`, `p-db-lokal.txt`, `p-produksi-pemeriksaan.txt` |
| A Backend `/api/staf/ai/saran` | SELESAI: POST (peran `artikel_buat`), topik 3-120 karakter tersanitasi, Claude `claude-sonnet-5-5` + tool `web_search_20250305` (max_uses 8, lokasi ID), instruksi sistem tahan prompt-injection, keluaran HANYA JSON, parser tahan-banting (pagar markdown, JSON terpotong diselamatkan), validasi ketat, sanitasi sempit + penjaga badan-bersih (tolak `<a>` / URL tampak), tabel `ai_saran` (migrasi idempoten, dijalankan 2x lokal + produksi), kuota 10 panggilan/pengguna/hari (dari DB, hari WIB) + 1 proses serentak/pengguna, audit `ai_saran_buat`, batas waktu + pesan galat ramah (saldo, laju, overload, timeout, kunci) | `a-migrasi-lokal.txt`, `e-unit-parse.txt` (20/20), `e-e2e-tiruan.txt` (19/19), `e-e2e-nyata-2.txt` (7/7) |
| B Mesin gambar + pakai | SELESAI: `lib/gambarBerlisensi.js` 4 adaptor API resmi (Pexels bila ada kunci, Pixabay, Openverse cc0+pdm, Wikimedia CC0/Public domain saja via extmetadata), semua penyedia x semua kueri paralel, saring lisensi + lebar >= 1200, skor relevansi (kata kueri pada judul/tag, awalan dua arah) x kekhususan kueri + resolusi + landscape + bonus stok, pilih 1 terbaik lintas penyedia, unduh (batas 20 MB, UA, timeout) lalu `simpanGambar` subfolder `ai`; POST `/api/staf/ai/saran/[id]/pakai` membuat ARTIKEL DRAF lewat `validasiMuatanArtikel` + `buatArtikel` (judul, ringkasan, isiHtml apa adanya tanpa kredit, kategori slug->id, tag, gambar_utama, penulis = pengguna, `ai_saran_id`), saran -> `dipakai`, balasan `{ artikelId, gambar }`; tanpa kandidat -> artikel tetap dibuat (gambar_utama NULL = penampung saat render) + catatan di balasan/UI | `e-unit-mesin-gambar.txt` (14/14; Wikimedia CC BY 11/11 + 7/7 terbuang), `e-e2e-tiruan.txt` langkah 10-13, `e-e2e-nyata-*.txt` langkah 4-5 |
| C Pembersihan | SELESAI: saran `baru` > 7 hari -> berkas gambar dihapus + status `dibersihkan`; malas (saat halaman asisten dibuka, maks sekali per 10 menit per proses) + tombol "Bersihkan sekarang" (superadmin, POST `/api/staf/ai/bersihkan`); saran `dipakai` dan artikel tidak pernah disentuh | `e-e2e-tiruan.txt` langkah 1-2 |
| D UI | SELESAI: `/staf/artikel/asisten` (form topik + tombol Cari nonaktif saat proses + indikator 30-90 detik; kartu per saran: judul, ringkasan, lencana kategori, kotak CATATAN VERIFIKASI, lipatan "Sumber riset (internal redaksi)" tautan tab baru, "Gunakan draf ini"; keadaan kosong + galat ramah; riwayat saran pengguna; sisa kuota), menu sidebar "Asisten AI", tombol "Asisten AI" di Kelola Artikel, editor artikel asal-AI berpita "Draf AI: verifikasi redaksi sebelum terbit" + panel lipat catatan/sumber riset/asal foto (internal). Render publik + pratinjau NOL jejak (uji eksplisit) | `e-ui-konsol-lokal.txt` (13 sel 0 gagal), `tangkapan/lokal-*.png`, `e-e2e-tiruan.txt` langkah 14-18 |
| E Uji | SELESAI, rincian bagian 4. Panggilan Anthropic nyata: 2 lokal (dari maksimal 4) + 1 produksi (bagian 7) | semua berkas `e-*.txt` |
| F Penutup | laporan ini + STATUS.md RUN AI-1 + biaya terukur (bagian 5) + MENUNGGU PEMILIK (bagian 8) | |

## 2. Berkas dibuat/diubah

Backend / pustaka (baru):
- `lib/ai/anthropic.js` - klien Messages API memakai `fetch` bawaan Node (tanpa paket npm baru, lihat KEPUTUSAN BARU 1): model utama `claude-sonnet-5-5` (404 -> `claude-sonnet-5`, dicatat), `output_config.effort` (400 -> dikirim ulang tanpa parameter), `pause_turn` dilanjutkan maks 2x, batas waktu AbortController, ulangan koneksi 2x (1 s, 3 s), pemetaan galat API -> pesan ramah + kode, penjumlahan usage (token masuk/keluar, cache, `web_search_requests`).
- `lib/ai/saranBerita.js` - instruksi sistem (konten web = DATA, bukan perintah; gaya jurnalis Indonesia; larangan tautan/URL/daftar sumber di badan; 11 kategori), `validasiTopik`, `ekstrakArrayJson` (pagar markdown, penyelamatan JSON terpotong), `sanitasiBadanAi` (daftar putih sempit: p/br/h2/h3/h4/blockquote/ul/ol/li/strong/em; tanpa atribut; tanpa a/img/table/pre/figure), `alasanBadanKotor` (penjaga badan-bersih), `normalkanDash` (K2), `validasiSaran`, `teksJawabanAkhir`, `hasilPencarianDari`, `buatSaranBerita`, mode tiruan (hanya bila `AI_TIRUAN=1` DAN `NEXT_PUBLIC_APP_URL` bukan domain produksi).
- `lib/ai/pembersihan.js` - `bersihkanSaranKadaluarsa`, `bersihkanMalas`, kunci proses per pengguna (`ambilKunciProses`/`lepasKunciProses`, maks 4 serentak global).
- `lib/gambarBerlisensi.js` - adaptor Pexels/Pixabay/Openverse/Wikimedia, `lisensiWikimediaBebas`, `skorRelevansi`, `skorKandidat`, `saringKandidat`, `kumpulkanKandidat`, `cariDanUnduhGambar`.
- `lib/db/aiSaran.js` - seluruh SQL `ai_saran` (simpan kelompok, ambil, riwayat, kuota harian, gambar, tandai dipakai/dibersihkan, asal AI artikel, ringkasan).
- `app/api/staf/ai/saran/route.js`, `app/api/staf/ai/saran/[id]/pakai/route.js`, `app/api/staf/ai/bersihkan/route.js`.

Basis data:
- `database/migrations/20261007-0010-ai-saran.sql` (idempoten: CREATE TABLE IF NOT EXISTS, ADD COLUMN/INDEX IF NOT EXISTS, FK lewat information_schema) + blok identik ditambahkan ke `sql/01-schema.sql` dan `database/schema.sql` (tetap `cmp` identik).
- `lib/db/index.js` - `ai_saran` masuk daftar tabel dikenal; `lib/db/artikel.js` - `buatArtikel` menerima `aiSaranId` (kolom `ai_saran_id` TIDAK ikut `KOLOM_DAFTAR` kueri publik).

UI:
- `app/(staf)/staf/artikel/asisten/page.js` (server: pagar peran, pembersihan malas, riwayat + kuota) + `components/staf/AsistenBerita.js` (client).
- `lib/navItems.js` (menu "Asisten AI", ikon `menu_book`), `components/staf/SidebarStaf.js` (item aktif = href terpanjang yang cocok), `app/(staf)/staf/artikel/page.js` (tombol "Asisten AI"), `app/(staf)/staf/artikel/[id]/page.js` + `components/staf/EditorArtikel.js` (pita + panel internal; pesan `?ai=1`).

Bukti (`laporan/bukti-ai-1/`): skrip `p-verifikasi-penyedia.mjs`, `uji-unit-parse.mjs`, `uji-unit-mesin-gambar.mjs`, `uji-e2e-lokal.mjs` (`tiruan`|`nyata`), `uji-ui-konsol.mjs`, `uji-b1-semua-route-semua-peran.mjs` (salinan Tahap 9 + 3 route AI), `diag-koneksi-anthropic.mjs`, `uji-produksi.mjs`, `migrasi-produksi.sh`, `jalankan-verifikasi-produksi.sh`; keluaran `p-*.txt`, `a-migrasi-lokal.txt`, `build*.txt`, `e-*.txt/json`, `f-*.txt`, `tangkapan/*.png`.

Lain: `.gitignore` + `lsm.zip` (arsip milik pemilik yang muncul di akar repo 6 Okt 2026; tidak disentuh, tidak ikut commit). `package.json` TIDAK berubah (tidak ada paket npm baru).

## 3. KEPUTUSAN BARU (hal yang tidak diatur dokumen)

1. **Anthropic dipanggil lewat `fetch` bawaan, bukan `@anthropic-ai/sdk`.** Aturan 4 CLAUDE.md melarang paket npm di luar daftar tanpa izin pemilik, dan perintah menyebut "Anthropic Messages API". Satu modul (`lib/ai/anthropic.js`) yang perlu diganti bila pemilik kelak mengizinkan SDK resmi.
2. **Parameter `thinking` tidak dikirim; `output_config.effort = 'medium'`, `max_tokens = 16000`.** Rencana awal `thinking: {type:'disabled'}` (hemat) DITOLAK `claude-sonnet-5-5` dengan 400 (tidak ditagih). Pengukuran 1 tanpa effort (max_tokens 12000) terpotong (draf ke-3 hilang, 109 ribu token masuk); pengukuran 2 dengan effort medium: 3 draf utuh, 37% lebih murah (bagian 5). Catatan: draf menjadi ~300-330 kata (di bawah target 350-600 instruksi) - masih layak sebagai draf redaksi; bisa dinaikkan ke `high` bila pemilik mau (biaya naik).
3. **Satu baris `ai_saran` per saran, dikelompokkan kolom `kelompok` per panggilan API**; token/jumlah pencarian dicatat sama di tiap baris kelompok; kuota harian = `COUNT(DISTINCT kelompok)` sejak 00:00 WIB. Panggilan yang gagal (galat API/jaringan) tidak membuat baris dan TIDAK mengurangi kuota.
4. **Penanda artikel = kolom `artikel.ai_saran_id` (FK SET NULL) + `ai_saran.artikel_id` (FK SET NULL)** - dua arah agar editor bisa menampilkan asal AI dan riwayat bisa menautkan artikel; hapus artikel -> `artikel_id` NULL, saran tetap `dipakai` (terbukti langkah 19 e2e tiruan).
5. **Penjaga badan-bersih**: `<a>` diperiksa pada HTML MENTAH (ditolak, bukan dibersihkan diam-diam); URL diperiksa pada HASIL sanitasi (tanpa atribut) = URL yang tampak sebagai teks; juga menolak bagian "Sumber:/Referensi:". URL yang hanya ada di atribut tag terlarang (mis. `src` iframe) hilang bersama tagnya. Saran yang ditolak dihitung dan disebut di UI (`ditolak`), tidak diam-diam.
6. **Kategori slug di luar 11 kategori final -> `nasional` + catatan verifikasi di urutan pertama** (tidak membuang draf).
7. **Mesin gambar berjalan saat "Gunakan draf ini" (sesuai butir B), bukan saat generasi**; pembersihan C tetap menghapus berkas bila pakai gagal di tengah jalan (berkas tersimpan, artikel belum dibuat). Pakai ulang saran yang sudah punya berkas memakai berkas itu lagi.
8. **Skor kandidat gambar**: relevansi (0-100) dikalikan bobot kekhususan kueri (1,0 / 0,8 / 0,6), + resolusi (0-20) + landscape (15) + bonus stok terkurasi (Pexels 12, Pixabay 10, Openverse 2, Wikimedia 0); Openverse/Wikimedia tanpa satu pun kata kueri -> tidak layak; judul/kategori bertema satelit/peta/diagram/logo/screenshot -> dilewati. TEMUAN yang mendasari: pengukuran 1 memilih citra satelit Wikimedia dari kueri paling umum "heavy rain flood" (`tangkapan/lokal-1280-artikel-20.png` sebelum perbaikan; artikel 21 sesudahnya memilih foto Pixabay dari kueri paling spesifik).
9. **Pixabay memakai `largeImageURL` (sisi terpanjang 1280 px)** karena `imageURL`/`fullHDURL` butuh akses penuh API; landscape 1280 px memenuhi syarat >= 1200. Pexels memakai `large2x` (1880 px). Wikimedia memakai thumb 1920 px bila asli lebih besar (hemat unduhan). Openverse hasil `width` null/kecil banyak terbuang (statistik bagian 6).
10. **Normalisasi em/en dash pada keluaran AI (K2)**: di antara angka -> `-`, selain itu -> `, ` (judul, ringkasan, isi, catatan, tag, kueri). Dua pengukuran nyata kebetulan 0 dash, penjaga tetap dipasang.
11. **Mode tiruan `AI_TIRUAN=1`** untuk uji lokal tanpa kredit (kunci serentak, sanitasi script/iframe di jalur route, pakai, UI): tidak mungkin aktif bila `NEXT_PUBLIC_APP_URL` memuat `warkopnusantara.id` (diuji unit 19 + container produksi tidak punya variabel itu).
12. **Penulis hanya boleh memakai saran miliknya; redaktur/superadmin boleh memakai saran siapa pun** (403 `BUKAN_MILIK`); pakai ganda -> 409 `SUDAH_DIPAKAI`; saran dibersihkan -> 409 `SUDAH_DIBERSIHKAN`.
13. **Kunci serentak global maks 4 proses AI per instance** (di luar 1/pengguna) agar server tidak tersumbat; kunci basi > 6 menit dilepas otomatis.
14. **UI halaman asisten (tidak digambar Stitch, REFERENSI 18.4)**: cetakan `editor_artikel_admin` (kepala kanvas, remah roti, kartu panel `bg-surface-container-lowest rounded-xl border border-tertiary p-6 shadow-sm`, judul panel, chip) + `kelola_artikel_admin` (kotak masukan, tombol utama, lencana Draft); kotak CATATAN VERIFIKASI dan pita editor memakai kelas pita pratinjau QA-2 (`bg-secondary-fixed/20 border border-secondary-fixed rounded-lg p-4`); tautan sumber memakai kelas tautan badan artikel (`text-secondary underline`); lipatan memakai `<details>` bawaan. Ikon menu `menu_book` (tidak ada ikon "AI" di 77 ikon resmi). Tombol "Asisten AI" di Kelola Artikel memakai kelas tombol garis editor dengan `py-3` agar setinggi tombol utama.
15. **`SidebarStaf` item aktif = href terpanjang yang cocok** (sebelumnya `startsWith` membuat "Kelola Artikel" ikut aktif di `/staf/artikel/asisten`).
16. **Audit**: `ai_saran_buat` (topik, jumlah, ditolak, model, token, pencarian, durasi, kelompok), `ai_saran_pakai` (artikelId, penyedia gambar, statistik), `ai_saran_bersihkan`, ditambah `artikel_buat` biasa saat pakai; tidak ada isi draf di audit.
17. **Sumber riset cadangan**: bila model tidak mengisi `sumberRiset`, dipakai URL hasil `web_search_tool_result` (maks 8). Kedua pengukuran nyata: model mengisi 4-6 sumber sendiri.
18. **`lsm.zip` di akar repo** (berkas pemilik, 6 Okt 2026) ditambahkan ke `.gitignore` agar tidak ikut commit; tidak dibuka selain daftar isinya (salinan sumber proyek).

## 4. Hasil uji (E)

| Uji | Hasil | Bukti |
|---|---|---|
| Unit mesin gambar per adaptor (kueri netral "flood river aerial" + 3 kueri banjir): filter lisensi Wikimedia 8 kasus murni; adaptor nyata Pixabay 12/12 lolos (Pixabay Content License), Openverse 12 mentah / 0 lolos (semua PDM, lebar < 1200 atau null), Wikimedia 1 PD diterima; **Wikimedia rinci: 11 dari 12 hasil CC BY 4.0 TERBUANG, kueri "Jakarta flood" 7 CC BY/BY-SA terbuang**; gabungan 3 kueri 41 kandidat, terbaik Pixabay 1280x853 "flood, village, street, buildings"; skor relevansi awalan dua arah; kueri umum kalah dari spesifik; satelit/peta -1; Pexels tanpa kunci -> [] | LULUS 14/14 | `e-unit-mesin-gambar.txt` |
| Unit parser/validasi/sanitasi: topik 2/121 karakter + HTML + kontrol; pagar markdown; JSON terpotong diselamatkan; `<script>/<iframe>/onerror/style/img/table` dibuang; `<a href>` DITOLAK; `https://` DITOLAK; `www.` DITOLAK; "Sumber:" DITOLAK; atribusi jurnalistik diterima; kategori ngawur -> nasional; tag > 5 dipotong; sumber `javascript:`/`ftp:`/duplikat dibuang; isi < 300 karakter ditolak; teks jawaban setelah tool result terakhir; K2 dash; mode tiruan tidak aktif di produksi | LULUS 20/20 | `e-unit-parse.txt` |
| E2E lokal TIRUAN (build produksi, tanpa kredit): pembersihan malas (8 hari -> dibersihkan + berkas hilang; 2 hari & dipakai utuh) + tombol (penulis/redaktur 403, superadmin 200 {dibersihkan 1, berkasDihapus 1}); 401/403/403; halaman -> /login, /tanpa-akses, 200; validasi 422 x3; **kuota 10/hari -> 429 `AI_KUOTA_HABIS` tanpa baris/audit baru**; **kunci serentak: 2 POST paralel -> 201 + 429 `AI_SEDANG_DIPROSES`, pengguna lain 201**; 2 saran diterima + 1 ditolak (`<a>`), script/iframe hilang, kategori ngawur -> nasional, model tiruan di DB; pakai: verifikator 403, bukan milik 403, 999999 404; pakai -> artikel draf penulis budi kategori lingkungan `ai_saran_id` terisi tag 2 gambar Pixabay 1280x853 + `gambar_sumber` (penyedia, lisensi, urlAsal, pembuat, statistik); pakai ganda 409; redaktur pakai 201; editor berpita + catatan + sumber + asal foto + pesan `?ai=1`; artikel seed TANPA pita; pratinjau 200 bocor 0; **publik 404 saat draf**; **terbit sementara lokal -> render publik 200 bocor 0 (tanpa "sumber riset", nama penyedia, lisensi, URL asal, "Draf AI"), JSON publik bersih, gambar AI tampil tanpa kredit -> kembali draf**; hapus -> FK SET NULL | LULUS 19/19 | `e-e2e-tiruan.txt` |
| E2E lokal NYATA pengukuran 1 (`claude-sonnet-5-5`, max_tokens 12000, tanpa effort): 2 saran (daerah, kebijakan-publik; 400 dan 415 kata; catatan 6-7; sumber 5-6), ditolak 0, terpotong=true (draf ke-3 hilang), 6 pencarian, 82 s; kartu tampil; pakai -> artikel 20 draf tag 5 isi 3154 karakter gambar Wikimedia 1920x1080 (citra satelit, lihat KEPUTUSAN 8); pratinjau 200 bocor 0; editor berpita; publik 404; audit tanpa isi draf | LULUS 7/7 | `e-e2e-nyata-1.txt`, `e-e2e-nyata-1-balasan.json`, `e-e2e-nyata-1-artikel.json` |
| E2E lokal NYATA pengukuran 2 (effort medium, max_tokens 16000, skor gambar baru): **3 saran** (daerah, kebijakan-publik, lingkungan; 300-330 kata; catatan 6-7; sumber 4-6; kueri gambar 3 masing-masing), ditolak 0, terpotong=false, 3 pencarian, 57 s; pakai -> artikel 21 draf tag 5 isi 2593 karakter **gambar Pixabay 1280x853 dari kueri paling spesifik "flash flood damaged village Indonesia"**; pratinjau 200 bocor 0; editor berpita; publik 404; audit lengkap | LULUS 7/7 | `e-e2e-nyata-2.txt`, `e-e2e-nyata-balasan.json`, `e-e2e-nyata-artikel.json` |
| Diagnosis koneksi: percobaan nyata ke-1 dan ke-2 gagal `AI_JARINGAN` (ke-1: 400 `thinking` lalu ECONNRESET; ke-2: ECONNRESET lalu ENOTFOUND) dari proses server, sementara 6 permintaan tak ditagih dari proses node biasa 400-700 ms semua 200/404 -> jaringan Wi-Fi laptop tidak stabil, bukan kode; ulangan koneksi 2x (1 s, 3 s) dipasang; pengukuran 1 dan 2 sesudahnya tanpa ulangan | TEMUAN + perbaikan | `e-diag-koneksi-anthropic.txt`, `e-e2e-nyata.txt` (rekaman gagal pertama tertimpa oleh yang lulus; kronologi di STATUS) |
| UI 375/768/1280 (Chrome headless, profil sementara dihapus): `/staf/artikel/asisten` (2 kartu riwayat, sidebar aktif HANYA "Asisten AI", form), `/staf/artikel` (tombol Asisten AI, aktif "Kelola Artikel"), editor artikel 21 (pita tampil), pratinjau (pita TIDAK bocor); galat konsol 0, permintaan >= 400 0, gulir mendatar 0, tumpang tindih 0, dash 0; interaksi: tombol Cari nonaktif pada 2 karakter, aktif pada "banjir" | LULUS 13 sel 0 gagal | `e-ui-konsol-lokal.txt`, `tangkapan/lokal-{375,768,1280}-*.png` (12 tangkapan) |
| Regresi B1: 49 route x 5 peran + tanpa login (46 lama + 3 AI): `POST /api/staf/ai/saran` 401 / 422 422 422 403 403; `pakai/999999` 401 / 404 404 404 403 403; `bersihkan` 401 / 200 403 403 403 403 | LULUS 264 pemeriksaan 0 gagal | `e-regresi-b1.txt` |
| Penjaga dash (termasuk `--db` lokal: artikel 20 dan 21 = 0 dash), lint, build | bersih / EXIT 0 / EXIT 0 (6 peringatan "Dynamic filesystem access" `lib/unggahan.js` sudah ada sejak QA-1, sama di QA-5) | `build.txt`, `build-awal.txt` |
| Verifikasi PRODUKSI end-to-end (akun uji, 1 panggilan Anthropic, draf ada, publik 404, hapus artikel+saran+gambar sampai bersih) + sapu UI produksi 3 lebar | LULUS 8/8 + 7 sel 0 gagal (bagian 7) | `f-migrasi-produksi.txt`, `laporan/bukti-server/25-redeploy-ai-1.txt`, `e-produksi-e2e.txt`, `e-produksi-balasan.json`, `e-produksi-ui-konsol.txt`, `tangkapan/produksi-*.png` |

Kegagalan yang ditemui selama run (semua diperbaiki, tidak ada ambang yang diturunkan): (1) penjaga badan-bersih awal menolak `<iframe src=https://...>` sebelum sanitasi sehingga saran tiruan ke-1 hilang (KEPUTUSAN 5); (2) `KUOTA_HARIAN` diekspor dari berkas route (Next menolak ekspor asing) -> dipindah ke lib; (3) `thinking: disabled` ditolak model (KEPUTUSAN 2); (4) galat koneksi dari proses server (ulangan dipasang); (5) regex `\b` sempat tertulis sebagai karakter backspace lewat heredoc Python -> diperbaiki lewat byte literal, dipindai: tidak ada karakter kontrol asing di 59 berkas; (6) tiga temuan skrip uji UI (konten `<details>` tertutup punya kotak geometri di Chrome, `innerText` mengikuti `uppercase`, `Runtime.evaluate` async butuh `awaitPromise`).

## 5. Biaya terukur per generasi (usage API, model `claude-sonnet-5-5`)

| Pengukuran | Token masuk | Token keluar | Pencarian web | Durasi | Draf | Perkiraan biaya* |
|---|---|---|---|---|---|---|
| 1: max_tokens 12000, tanpa `output_config` | 109.436 | 12.427 | 6 | 82 s | 2 (ke-3 terpotong) | USD 0,22 + 0,12 + 0,06 = **~0,40** |
| 2: effort medium, max_tokens 16000 | 68.673 | 8.097 | 3 | 57 s | 3 utuh | USD 0,14 + 0,08 + 0,03 = **~0,25** |
| Produksi (effort medium, 16000) | 30.868 | 7.822 | 2 | 53 s | 3 utuh | USD 0,06 + 0,08 + 0,02 = **~0,16** |

*Perkiraan memakai tarif Claude Sonnet 5 (USD 2 per juta token masuk, USD 10 per juta keluar) + pencarian web USD 10 per 1.000;
tarif resmi `claude-sonnet-5-5` perlu dikonfirmasi pemilik di konsol Anthropic (MENUNGGU PEMILIK). Token masuk tinggi karena
hasil pencarian masuk ke konteks pada tiap putaran loop server-side; `cache_read_input_tokens` 0 (tidak ada caching, konteks
pencarian berbeda tiap topik). Kuota 10 panggilan/pengguna/hari = maksimum ~USD 2,5-4 per pengguna per hari pada pola ini.
Panggilan yang gagal (400/koneksi) tidak ditagih. Total panggilan nyata lokal: 2 (batas pemilik: 4).

## 6. Statistik kandidat gambar per penyedia (dari uji)

| Sumber data | Pixabay (mentah/lolos) | Openverse | Wikimedia | Dipilih |
|---|---|---|---|---|
| Unit, "flood river aerial" (1 kueri) | 12/12 | 12/0 | 1/0 (12 hasil: 11 CC BY dibuang, 1 PD < 1200) | - |
| Unit, 3 kueri banjir | 36/35 | 24/1 | 7/5 | Pixabay 1280x853 skor 136 |
| E2E tiruan (kueri tiruan) | 36/35 | 24/0-1 | 7/5 | Pixabay 1280x853 |
| E2E nyata 1 (sebelum skor baru) | 36/33 | 14/2 | 19/19 | Wikimedia 1920x1080 (satelit, KEPUTUSAN 8) |
| E2E nyata 2 (skor baru) | 36/31 | 10/0 | 16/15 | Pixabay 1280x853, kueri spesifik |

Pexels: 0 (tanpa kunci). Openverse paling banyak terbuang karena `width` null/kecil dan tautan asal (flickr) sering tidak
bisa diunduh; Wikimedia lolos lisensi hanya CC0/Public domain (semua CC BY/BY-SA terbuang, terbukti) dan bebas dari judul
bertema satelit/peta. Tidak ada galat penyedia (timeout/429) selama uji.

## 7. Produksi

- Migrasi produksi dijalankan SEBELUM redeploy (aman: tabel baru + kolom nullable): `f-migrasi-produksi.txt`, 2x idempoten, FK terpasang, 1 artikel produksi utuh.
- Commit `764f40b` di-push; webhook Coolify 200 (deployment `vkabia3luwxdlg3jgb06gb5r`); build ~19 menit (skrip redeploy menulis "perlu Redeploy manual" setelah 8 menit, pemantauan dilanjutkan): container `re8snqu...-180510814747` image `764f40b` HEALTHY 7 Okt 2026 01:24 WIB, health 200, container lama dihapus Coolify (`laporan/bukti-server/25-redeploy-ai-1.txt`).
- Container baru memuat `ANTHROPIC_API_KEY` (106 karakter) dan `PIXABAY_API_KEY` (34 karakter) - pemilik sudah menambahkannya di Coolify; container lama (967864e, 11 hari) belum memuatnya. Tanpa sesi: `/staf/artikel/asisten` -> 307 `/login?lanjut=...`; POST saran -> 401.
- **Verifikasi end-to-end akun uji (redaktur id 10, pola sesi-uji-produksi QA-4) LULUS 8/8** (`e-produksi-e2e.txt`, `e-produksi-balasan.json`): sesi 200; halaman asisten 200 + tombol di Kelola Artikel; 401/422; **SATU panggilan Anthropic produksi topik "banjir": 3 saran, ditolak 0, `claude-sonnet-5-5`, 30.868 token masuk, 7.822 keluar, 2 pencarian, 53 s** (judul[0] "Banjir Bandang Solok: 542 Penyintas Masih Mengungsi ..."); pakai -> artikel 14 DRAF (kategori daerah, tag 5, gambar Pixabay di `/unggahan/ai`, badan bersih); gambar tersaji 200 image/jpeg; editor berpita; pratinjau 200 bocor 0; **publik `/berita/[slug]` 404 dan `/api/artikel/[slug]` 404 (tidak ada yang diterbitkan)**; bersih-bersih: artikel 14 dihapus via API, 3 saran + 1 berkas gambar dihapus via SSH (objek warkop saja), sisa 0, publik tetap 404.
- **Sapu konsol UI produksi 7 sel 0 gagal** (`e-produksi-ui-konsol.txt`, `tangkapan/produksi-*.png`): 375/768/1280 halaman asisten + Kelola Artikel, galat konsol 0, sidebar aktif tepat, tombol Cari nonaktif/aktif. Sapu pertama menandai "tidak ada kartu riwayat" karena data uji sudah dihapus oleh langkah bersih-bersih; syarat kartu dibuat khusus lokal, diulang -> LULUS. Akun uji dinonaktifkan kembali (login sesudahnya 401).
- Total panggilan Anthropic nyata sepanjang run: 3 (2 lokal + 1 produksi) dari batas 4. Percobaan yang gagal (400 `thinking`, galat koneksi) tidak ditagih.

## 8. MENUNGGU PEMILIK

1. **Kunci API di Coolify sudah terpasang** (terbaca di container baru 764f40b; container lama belum memuatnya). Pastikan keduanya TIDAK dicentang "Available at Buildtime" (temuan kritis Tahap 9 tentang rahasia di layer image berlaku juga untuk `ANTHROPIC_API_KEY`); periksa: `docker history --no-trunc <image> | grep -c ANTHROPIC_API_KEY` harus 0. Tanpa `ANTHROPIC_API_KEY`, halaman asisten tetap tampil dan POST membalas 503 `AI_TIDAK_DIKONFIGURASI` (ramah); tanpa Pixabay, mesin gambar jalan dengan Openverse + Wikimedia saja.
2. **Konfirmasi ejaan "Podcash" vs "Podcast"** (kategori id 15, slug `podcash`) - masih persis ejaan pemilik; AI diberi tahu `podcash (Podcash)`.
3. **Kuota 10 panggilan/pengguna/hari**: pas atau tidak? Pada pola terukur ~USD 0,25-0,40 per panggilan (bagian 5). Mudah diubah di `lib/ai/saranBerita.js` (`KUOTA_HARIAN`).
4. **Tarif resmi `claude-sonnet-5-5`** untuk mengganti perkiraan di bagian 5; dan apakah `effort` ingin dinaikkan ke `high` (draf lebih panjang, biaya naik).
5. **Kunci Pexels (opsional)**: menambah stok foto terkurasi (saat ini nonaktif).
6. Izin memakai `@anthropic-ai/sdk` resmi (opsional; saat ini `fetch` sesuai aturan 4).
7. Butir MENUNGGU PEMILIK run sebelumnya (QA-1..QA-5, DAFTAR TINDAKAN PEMILIK Tahap 9) tetap berlaku.

## 9. Risiko dan catatan jujur

- Kualitas faktual draf bergantung pada hasil pencarian; catatan verifikasi WAJIB diperiksa manusia (K1). Dua pengukuran nyata memakai topik netral "banjir"; topik korupsi/pengaduan belum diuji (hemat kredit).
- Lisensi: Pixabay/Pexels/CC0/PD tidak mewajibkan atribusi, tetapi foto Wikimedia "Public domain" bergantung pada metadata pengunggah; asal foto selalu tersimpan internal (`gambar_sumber`) bila perlu ditelusuri.
- Openverse tanpa kunci punya batas laju anonim; bila 429, penyedia dilewati (tercatat di `statistik.galat`).
- Pembatas kuota dibaca dari DB (tahan restart), kunci serentak di memori proses (satu container).
- Safari/Firefox tidak diuji (tidak tersedia), sama seperti run sebelumnya.

## 10. Cara menguji ulang

```powershell
# prasyarat: MariaDB lokal (lihat p-db-lokal.txt), .env berisi ANTHROPIC_API_KEY (+ PIXABAY_API_KEY)
node laporan/bukti-ai-1/skrip/p-verifikasi-penyedia.mjs          # kunci/penyedia, tanpa kredit
node laporan/bukti-ai-1/skrip/uji-unit-parse.mjs                  # 20 butir, tanpa jaringan
node laporan/bukti-ai-1/skrip/uji-unit-mesin-gambar.mjs           # 14 butir, panggilan penyedia gambar nyata
npm run build
$env:NODE_ENV='production'; $env:AI_TIRUAN='1'; $env:AI_TIRUAN_JEDA_MS='3000'; Start-Process node server.js
node laporan/bukti-ai-1/skrip/uji-e2e-lokal.mjs tiruan            # 19 langkah, tanpa kredit (proses server harus baru)
# lalu matikan server, nyalakan tanpa AI_TIRUAN:
node laporan/bukti-ai-1/skrip/uji-e2e-lokal.mjs nyata             # 7 langkah, SATU panggilan Anthropic (~USD 0,25-0,40)
node laporan/bukti-ai-1/skrip/uji-ui-konsol.mjs http://localhost:3000
$env:U='http://localhost:3000'; node laporan/bukti-ai-1/skrip/uji-b1-semua-route-semua-peran.mjs
node scripts/penjaga-dash.mjs --db
# produksi (akun uji, 1 panggilan Anthropic, artikel uji dihapus sampai bersih):
bash laporan/bukti-ai-1/skrip/jalankan-verifikasi-produksi.sh
```

# LAPORAN RUN QA-4 - WARKOP NUSANTARA

Mode: OTONOM. Perintah: "SITUS BERITA-DULU + BILAH KATEGORI + HEADER SELULER + PERBURUAN BUG TOTAL".
Mulai 5 September 2026 sekitar 04:35 WIB, selesai 5 September 2026 (jam penutupan di STATUS.md).
Produksi akhir: image `__IMAGE_AKHIR__` (HEALTHY) di https://warkopnusantara.id dan https://staf.warkopnusantara.id.
Semua bukti ada di `laporan/bukti-qa-4/` (skrip di `skrip/`, tangkapan di `tangkapan/`), redeploy di `laporan/bukti-server/21-*` dan `22-*`.

## 1. Ringkasan

| Butir | Hasil | Bukti utama |
|---|---|---|
| P1 sinkron produksi | TIDAK BLOKIR: health 200, DB dari container OK, token webhook sah, kredensial `.env.produksi` = env container (kecuali `SEED_ADMIN_PASSWORD`, wajar), akun staf uji dipakai lalu dinonaktifkan | `p1-sinkron-produksi.txt` |
| P2 volume lampiran | **MENUNGGU PEMILIK** (tidak menghambat): mount `/app/unggahan-terjaga` belum ada, lampiran pengaduan hilang tiap redeploy | `p2-dampak-volume-lampiran.txt` |
| A 11 kategori berita | SELESAI: migrasi idempoten lokal + produksi, 8 artikel dipetakan, 4 kategori lama dinonaktifkan (tidak dihapus), ikon Material resmi, formulir/filter/seed/API menyesuaikan | `a-*.txt` |
| B bilah kategori | SELESAI: semua halaman publik, bg-primary/on-primary, geser di layar sempit, aktif emas, keyboard, URL bisa dibagikan, tanpa lompat gulir (satu bug ditemukan lalu diperbaiki, lihat F5-4), staf tidak diberi | `abcd-uji-*.txt`, `tangkapan/*bilah*` |
| C beranda = berita | SELESAI (KEPUTUSAN PEMILIK): sorotan besar + kartu terkini + Paling Banyak Dibaca; strip identitas LSM + "Sampaikan Pengaduan" + "Lacak Kasus"; statistik & Status Advokasi dipindah ke sisi | `abcd-uji-*.txt`, `tangkapan/*alur-beranda*` |
| D header seluler | SELESAI: 320/375/414/767 merek kiri + hamburger kanan sebaris, laci berfungsi, desktop tak berubah | `abcd-uji-*.txt`, `tangkapan/*header-375-laci*` |
| F1 inventaris | LULUS: 633 sel (35 halaman x 6 identitas x 3 lebar) tanpa galat konsol/jaringan, gulir mendatar, tumpang tindih | `f1-inventaris-lokal.txt` |
| F2 interaksi | LULUS: 25 pemeriksaan (klik semua elemen 23 halaman, ketik semua kolom, anti klik ganda login + pengaduan) | `f2-interaksi-lokal.txt` |
| F3 alur ujung ke ujung | LULUS: 9 suite, 108 langkah (C3a 12, C3b 11, C3c 11, C3d 25, C4 11, QA-3 A+B 11, QA-3 C-F 15, realtime+lampiran terjaga 6 lokal + 6 ulang) | `f3-*.txt`, `f3-ringkasan.txt` |
| F4 server sehat | SEHAT + satu temuan diperbaiki (koneksi DB putus paksa tiap redeploy) | `f4-server-sehat.txt`, `f4-temuan-pool-redeploy.txt` |
| F5 bug | 4 bug produk ditemukan dan DIPERBAIKI dengan uji regresi; 2 temuan hanya di perangkat uji | bagian 9 |
| G regresi | uji-b1 246/0, kesetiaan 14 layar HTTP 200 + cacat export 0 (dasar diperbarui, alasan di bagian 10), penjaga dash bersih (lokal + DB produksi), lint + build hijau, sapu konsol 3 lebar lokal + produksi, verifikasi akhir produksi | `g-*.txt/.md` |

## 2. P1 - sinkron produksi (`p1-sinkron-produksi.txt`)

- `GET /api/health` 200 `sehat` (waktu WIB); DB dijangkau dari container app (22 pengurus, jumlah sama dengan suntingan pemilik QA-3).
- Akun staf uji `qa2.verifikasi.*` (redaktur, id 10) diaktifkan dengan sandi acak yang di-hash **di dalam container**
  (tidak pernah dicetak), dipakai untuk login + uji, lalu dinonaktifkan dan `token_version` dinaikkan. Pola ini dibungkus
  `skrip/sesi-uji-produksi.mjs buka|tutup` dan dipakai semua verifikasi produksi RUN ini. Superadmin pemilik tidak disentuh.
- Token webhook Coolify: `GET /api/v1/applications` 403 (token berlingkup deploy saja), `POST deploy` dengan uuid palsu
  membalas 404 "No resources found" (bukan 401) = token sah.
- Perbandingan rahasia `.env.produksi` vs env container: percobaan pertama salah (sha256sum ikut menghitung baris baru,
  banyak "BERBEDA" palsu); diulang dengan hash node: **semua sama** kecuali `SEED_ADMIN_PASSWORD` (pemilik sudah mengganti
  sandi admin; nilai seed memang tidak dipakai lagi). Tidak ada BLOKIR.

## 3. P2 - volume lampiran (`p2-dampak-volume-lampiran.txt`) - MENUNGGU PEMILIK

`docker inspect` container app: hanya volume `warkop-unggahan -> /app/public/unggahan`. **Tidak ada mount untuk
`/app/unggahan-terjaga`** (`UPLOAD_PRIVATE_DIR`). Dampak nyata saat ini: 6 baris `pengaduan_lampiran` di DB (semua dari
pengaduan uji QA-2 yang sudah dihapus lunak), **0 berkas di disk** karena container sudah beberapa kali diganti.
Risiko: setiap lampiran pengaduan warga sungguhan akan hilang pada redeploy berikutnya walau barisnya tetap ada di DB
(staf melihat lampiran tetapi berkas 404). Tindakan pemilik (Coolify, Storages pada aplikasi warkop): tambah volume,
misal nama `warkop-lampiran`, mount path `/app/unggahan-terjaga`, lalu redeploy. Kode tidak perlu diubah: F3 membuktikan
lampiran tersimpan di jalur itu dan hanya bisa dibuka lewat route staf berperan.

## 4. Butir A - 11 kategori berita final

Sumber tunggal: `lib/kategoriBerita.js` (id, slug, nama, urutan, ikon, alasan) + tabel `kategori_artikel` (kolom baru
`ikon`, `aktif`). Migrasi `database/migrations/20260905-1100-kategori-berita-final.sql` idempoten (dijalankan dua kali di
lokal dan produksi tanpa galat, hasil sama). Skema (`sql/01-schema.sql`, `database/schema.sql`) dan seed
(`sql/02-seed.sql`, `database/seed.sql`) diperbarui sehingga pemasangan baru langsung 11 kategori.

### Urutan tetap, id, dan ikon (Material Symbols dari 77 ikon resmi `components/ui/Ikon.js`)

| Urut | Nama | Slug | id | Ikon | Alasan pilihan |
|---|---|---|---|---|---|
| 1 | Nasional | nasional | 6 | `account_balance` | gedung negara: isu tingkat nasional / lembaga pusat |
| 2 | Daerah | daerah | 7 | `location_on` | penanda lokasi: liputan kabupaten/kota/provinsi |
| 3 | Hukum | hukum | 8 | `gavel` | palu hakim: penegakan dan bantuan hukum |
| 4 | Kebijakan Publik | kebijakan-publik | 9 | `policy` | ikon kebijakan: regulasi dan pelayanan publik |
| 5 | Investigasi | investigasi | 1 | `zoom_in` | kaca pembesar: penelusuran mendalam. **id 1 dipertahankan**, relasi artikel lama utuh |
| 6 | Lingkungan | lingkungan | 10 | `explore` | kompas: alam dan wilayah (daftar resmi tidak punya ikon daun/alam; tidak menambah ikon di luar daftar) |
| 7 | Pekerja | pekerja | 11 | `badge` | kartu identitas pegawai: buruh dan ketenagakerjaan |
| 8 | UMKM | umkm | 12 | `sell` | label harga: usaha dan perdagangan kecil |
| 9 | Sosial | sosial | 13 | `forum` | percakapan komunitas: isu kemasyarakatan |
| 10 | PPA | ppa | 14 | `shield` | perisai: perlindungan perempuan dan anak |
| 11 | Podcash | podcash | 15 | `record_voice_over` | orang berbicara: konten suara/siniar. Ejaan **persis** pemilik (lihat MENUNGGU PEMILIK) |

Tidak ada emoji. Ikon tampil di bilah kategori dan lencana kategori pada kartu/sorotan berita.

### Pemetaan kategori lama (KEPUTUSAN BARU, dilaporkan)

| Kategori lama (id) | Dipetakan ke | Alasan | Artikel produksi yang berpindah |
|---|---|---|---|
| Siaran Pers (2) | Nasional | pernyataan resmi lembaga pusat = berita nasional/lembaga | id 8 "Cara Aman Menyampaikan Laporan Pengaduan" |
| Opini Publik (3) | Kebijakan Publik | opini/analisis kebijakan | id 9 "Pentingnya Pengawasan Sipil Dalam Demokrasi"; id 12 "Opini: Transparansi Anggaran Pendidikan 2025" |
| Kegiatan Daerah (4) | Daerah | kegiatan kantor regional | id 4 "Rapat Dengar Pendapat Mengenai Kualitas Air Bersih Regional"; id 7 "Audit Dana Desa Kuartal III: Temuan Awal" |
| Fasilitas Umum (5) | Kebijakan Publik | kondisi fasilitas & layanan publik | id 2 "Fasilitas Kesehatan Mangkrak di Daerah Pelosok"; id 3 "Evaluasi Proyek Jalan Trans-Sumatera Sektor Selatan"; id 11 "Laporan Infrastruktur Jalan Rusak di Kab. Bandung" |

Empat kategori lama **dinonaktifkan** (`aktif = 0`, urutan 92-95), tidak dihapus: id dan riwayat tetap ada; 0 artikel
tersisa di kategori nonaktif (diperiksa sesudah migrasi dan lagi di verifikasi akhir). Investigasi (4 artikel) tidak berubah.

### Yang menyesuaikan

- `ambilKategoriArtikel()` hanya mengembalikan kategori aktif (formulir artikel, filter `/berita`, bilah); `{ semua: true }`
  tersedia untuk kebutuhan admin masa depan.
- Route `POST /api/staf/artikel` dan `PUT /api/staf/artikel/[id]` memanggil `pastikanKategoriArtikelAktif()` sebelum menulis:
  kategori tidak ada -> 422 `KATEGORI_TIDAK_SAH`, kategori nonaktif -> 422 `KATEGORI_NONAKTIF` (diuji lokal dan produksi).
- Filter `/berita?kategori=<slug>` menerima 11 slug; slug lama masih dibuka (200) tetapi kosong dan tidak ditawarkan di dropdown.

## 5. Butir B - bilah kategori (`components/publik/BilahKategori.js`, dirender dari `app/(publik)/layout.js`)

- Posisi: tepat di bawah navbar di **semua** halaman publik (14 URL diperiksa, termasuk `/lacak`, `/faq`, kebijakan,
  pedoman, `/berita?...`); halaman staf tidak memuatnya (layout staf terpisah, dibuktikan dashboard).
- Gaya WARKOP, bukan Antara: `bg-primary text-on-primary`, item `font-label-md`, aktif = kelas tautan aktif navbar
  desain (`text-secondary-fixed-dim font-bold border-b-2`). Diukur di Chrome: latar `rgb(39,19,16)`, aktif `rgb(233,195,73)`
  dengan garis 2 px.
- Layar sempit: `overflow-x-auto` + `.hide-scrollbar` (kelas ini dipakai desain program tetapi **belum pernah didefinisikan**,
  lihat F5-2); 375 dan 768 bisa digeser, item terakhir "Podcash" tampak utuh, gulir halaman tidak berubah. 1280 muat tanpa geser.
- Klik -> `/berita?kategori=<slug>` (URL bisa dibagikan). Di dalam `/berita` memakai `scroll={false}` (pola QA-2 B6),
  dari halaman lain gulir ke atas wajar. Keyboard: Tab mencapai item, Enter berpindah (diuji).
- Item aktif digulir ke tengah **hanya pada sumbu mendatar** `<ul>` (perbaikan F5-4).

## 6. Butir C - beranda = portal berita (KEPUTUSAN PEMILIK)

`app/(publik)/page.js` ditulis ulang memakai komponen bersama `components/publik/berita/{SorotanBerita,KartuBerita,SisiBerita}.js`
yang markup-nya dipindah **apa adanya** dari halaman `/berita` (desain `portal_berita_beranda`), jadi `/berita` dan beranda
kini memakai satu sumber; `/berita` tetap ada dengan filter dan paginasi.

Susunan beranda: bilah kategori -> strip identitas LSM (lencana, nama panjang, motto "Berani Karena Benar", tombol
**Sampaikan Pengaduan** -> `/kontak` dan **Lacak Kasus** -> `/lacak`) -> sorotan besar (h1, artikel terbit terbaru) ->
"Berita Terkini" 6 kartu -> sisi: Paling Banyak Dibaca, widget laporan, **Status Advokasi** (kasus terbaru tanpa identitas)
dan **Rekam Jejak** (statistik). Dua yang terakhir adalah konten unik beranda lama yang dipindah (KEPUTUSAN BARU:
diletakkan di kolom sisi agar misi tetap terlihat tanpa mendahului berita). Metadata judul/deskripsi beranda diperbarui,
JSON-LD organisasi dipertahankan, sitemap/robots tidak berubah karena URL tidak bertambah. 0 tautan mati (semua href
beranda dibuka: 200/307).

Dasar kesetiaan layar `beranda_warkop_nusantara` berubah 96% -> 76%: kelas yang "hilang" adalah markup hero/statistik lama
yang memang ditinggalkan atas keputusan pemilik (rincian bagian 10). Tidak ada cacat export.

## 7. Butir D - header seluler

`components/publik/NavPublik.js`: baris header menjadi `flex-row justify-between items-center` di semua lebar (sebelumnya
menumpuk di bawah md), merek `min-w-0`, kelompok kanan `shrink-0`, `mt-4` pada nav dihapus. Diukur 320/375/414/767: merek
kiri, hamburger kanan, pusat vertikal selisih <= 4 px, tidak tumpang tindih, laci terbuka/tertutup berfungsi; 1280 tidak berubah
(kesetiaan desktop tetap).

## 8. Perburuan bug F1-F4

- **F1** (`uji-f1-inventaris.mjs`, metode QA-2 C1 + halaman baru: `/struktur?wilayah=13`, `/berita?kategori=podcash`,
  `/berita?q=dana`, editor, pratinjau, detail pengaduan): 35 halaman x tamu + 5 peran x 375/768/1280 = 633 sel;
  0 galat konsol, 0 respons >= 400 (kecuali yang memang diharapkan 401/403/404 netral), 0 gulir mendatar, 0 tumpang tindih.
- **F2** (`uji-f2-interaksi.mjs`): klik setiap elemen yang terlihat di 23 halaman (aksi destruktif dilewati dengan sengaja
  dan dihitung), ketik penuh di setiap kolom (47 kolom utuh), login dan pengaduan tahan klik ganda (1 permintaan).
- **F3**: 9 suite, semuanya LULUS pada build akhir (`f3-ringkasan.txt`): lampiran semua jenis + batas ukuran/jumlah,
  kembali/muat ulang, alur QA-2, 25 aksi ujung ke ujung, regresi bug QA-2, struktur/pengurus QA-3, navbar/footer/sosial/
  kategori program QA-3, serta suite baru `uji-f3-realtime-lampiran.mjs`: `pengaduan:baru` tiba <= 3 s **tanpa identitas
  pelapor**, `pengaduan:status`, lampiran benar-benar ada di `UPLOAD_PRIVATE_DIR` (jalur dibaca dari DB, bukan dari API:
  API detail **tidak** membocorkan `path`), tidak ada di `public/`, terbuka oleh staf berperan dan 401 tanpa sesi,
  sakelar `sosial_youtube` di pengaturan langsung mengubah footer.
- **F4** (`f4-server-sehat.txt`): container app restart 0, OOM tidak, DB restart 0; disk 25% (146 G bebas); log app
  json-file 10m x 3 (rotasi), 24 jam tanpa error/uncaught; log DB hanya "Aborted connection" pada menit-menit redeploy ->
  temuan F5-3.

## 9. F5 - bug ditemukan dan diperbaiki

| # | Gejala | Akar masalah | Perbaikan | Uji regresi |
|---|---|---|---|---|
| 1 | API artikel menerima `kategori_id` apa pun, termasuk kategori yang baru dinonaktifkan atau id yang tidak ada (artikel bisa "hilang" dari semua filter) | tidak ada validasi kategori di route tulis artikel | `lib/validasi/kategoriArtikel.js` dipanggil di POST dan PUT -> 422 | `uji-abcd.mjs` langkah A (lokal + produksi), `uji-g-produksi.mjs` |
| 2 | Kelas `hide-scrollbar` dipakai markup desain (`/program`) tetapi tidak ada definisinya: batang gulir mendatar tampak di bilah kategori/tab program pada peramban tertentu | kelas khusus desain tidak pernah disalin ke `globals.css` | ditambahkan di `app/globals.css` (scrollbar-width none + ::-webkit-scrollbar none) | kesetiaan 14 layar: `hide-scrollbar` kini "ada" di layar program; `uji-g-konsol.mjs` memeriksa `overflow-x` bilah |
| 3 | Log MariaDB produksi: 4-14 baris "Aborted connection ... Got an error reading communication packets" pada **setiap** redeploy | (a) `server.js` menutup HTTP rapi saat SIGTERM tetapi tidak menutup pool DB; (b) `lib/db/index.js` menyimpan pool di variabel modul sehingga tiap bundel Next (server, route, halaman) punya pool sendiri dan `tutupPool()` tidak menjangkau pool route | pool disimpan di `globalThis[Symbol.for('warkop.pool')]` (satu pool per proses, pola sama dengan instance Socket.io); `server.js` memanggil `tutupPool()` setelah `server.close()` lalu keluar; kegagalan menutup pool dicatat tanpa menahan penutupan (batas 20 s tetap) | skrip sekali jalan lokal (pool tunggal, tutup, dibuat ulang); bukti produksi pada redeploy penutup: `bukti-server/22-redeploy-qa4-penutup.txt` (log container lama memuat "pool basis data ditutup", log DB tanpa "Aborted connection") |
| 4 | Mengganti kategori di `/berita` saat halaman sudah digulir (300 px) membuat halaman melompat ke atas (300 -> 51). Ditemukan C3b langkah 1; lolos uji B semula karena uji itu mengganti kategori dari posisi gulir 0 | `useEffect` bilah memanggil `scrollIntoView({ block: 'nearest' })` pada item aktif; bila bilah di luar layar, peramban menggulir **halaman** agar bilah terlihat | hanya `scrollLeft` `<ul>` yang diubah (pusat item vs pusat ul); sumbu vertikal tidak disentuh | `uji-abcd.mjs` langkah 9 baru: gulir 300 -> klik bilah dan ubah select filter -> gulir tetap 300; 375 item aktif tetap digulir ke pandangan |

Temuan **di perangkat uji**, bukan produk (diperbaiki juga agar suite bisa dipercaya):

- Tiga suite lama (C3a, 4b, C4) memakai ruang IP palsu 250 nilai; dijalankan berurutan dalam satu jam mereka bertabrakan
  dengan pembatas laju (429 palsu). Ruang diperluas ke `10.x.y.z`. Pembatas laju produksi sendiri tidak terpengaruh
  (Traefik menimpa `x-forwarded-for`, dibuktikan QA-2).
- Suite 4b dan C4 masih membuat pengurus tanpa `kelompok` / memeriksa blok struktur lama; sejak QA-3 kelompok wajib dan blok
  berubah (DPW, Koordinator Daerah). Langkah-langkahnya ditulis ulang ke kontrak QA-3.

## 10. Butir G - regresi dan verifikasi akhir

### Kesetiaan 14 layar (`g-regresi-kesetiaan-14-layar.md`, selisih vs dasar QA-3 di `g-regresi-kesetiaan-selisih.txt`)

14 layar HTTP 200, sisa cacat export 0 (LULUS). Dasar diperbarui dengan alasan:

| Layar | QA-3 | QA-4 | Alasan perubahan |
|---|---|---|---|
| beranda | 96% | 76% | KEPUTUSAN PEMILIK C: hero/statistik/sorotan lama ditinggalkan (45 kelas hero seperti `bg-gradient-to-t`, `pb-32`, `md:divide-x` memang tidak dipakai lagi); teks "Sorotan Investigasi" hilang, dua judul artikel kini justru tampil |
| struktur, kontak, berita, daftar berita, detail artikel | - | `mt-4` "hilang" | D: `mt-4 md:mt-0` pada nav dihapus karena baris header kini satu baris di semua lebar; bukan penyimpangan visual desktop (`md:mt-0` sudah nol) |
| struktur | 84% | 84% | `inline-flex`, `text-[16px]` kini ada (ikon bilah); netto sama |
| program | 79% | 81% | `hide-scrollbar`, `overflow-x-auto`, `whitespace-nowrap` kini ada (bilah + kelas F5-2) |
| portal berita | 82% | 82% | teks "Kegiatan Daerah" hilang = kategori dinonaktifkan (A); "Lingkungan" kini ada |
| editor artikel | 87% | 87% | teks "Opini Publik", "Siaran Pers" hilang = kategori dinonaktifkan (A) |

Layar lain identik dengan dasar QA-3. Layar 14 (kelola pengaduan 63%) tetap penyimpangan yang sudah dicatat sejak Tahap 9.

### Sisanya

- `uji-b1-semua-route-semua-peran.mjs`: 246 pemeriksaan, 0 gagal (`g-regresi-b1.txt`).
- `scripts/penjaga-dash.mjs --db`: bersih (app/components/lib, seed, migrasi, DB lokal); DB produksi 0 dash di 8 tabel
  (`uji-g-produksi.mjs`).
- `eslint . --max-warnings=0` bersih; `next build` hijau (Node 22, Next 16.3.4).
- `uji-abcd.mjs` 18 langkah lokal LULUS (uji khusus baru: bilah 6 halaman x 3 lebar, keyboard, geser, regresi lompat gulir,
  beranda berita ujung ke ujung, header sejajar 320-767).
- `uji-g-konsol.mjs` lokal (14 halaman publik + 9 halaman staf x 3 lebar): 69 sel, 0 gagal (`g-konsol-lokal.txt`).

### Verifikasi akhir produksi (setelah redeploy `__IMAGE_AKHIR__`)

- `uji-abcd.mjs --produksi`: __ABCD_PROD__ (`abcd-uji-produksi.txt`).
- `uji-g-konsol.mjs --produksi` (14 halaman publik + 9 halaman staf x 3 lebar): __KONSOL_PROD__ (`g-konsol-produksi.txt`).
- `uji-g-produksi.mjs`: __G_PROD__ (`g-verifikasi-produksi.txt`): health WIB, pemisahan host, header keamanan, 11 kategori
  aktif urut + 4 nonaktif + 0 artikel yatim di DB produksi, dropdown/filter/editor 11 kategori, 422 kategori nonaktif,
  bilah di 11 halaman dan tidak di dashboard, pengaduan anonim berlampiran 201 -> lacak bersih -> redaktur 403 -> dihapus lunak,
  K2 0 dash halaman + DB, container healthy restart 0.
- Redeploy penutup (`bukti-server/22-redeploy-qa4-penutup.txt`): __POOL_PROD__.

## 11. Yang TIDAK diuji atau perlu perhatian (jujur)

- Lampiran di produksi: F3 membuktikan penyimpanan di jalur terjaga **di lokal**; di produksi berkas akan tetap hilang saat
  redeploy sampai volume dipasang (P2). Uji produksi hanya memakai satu PDF kecil dan menghapus lunak pengaduannya.
- Realtime diuji di lokal (socket same-origin). Di produksi hanya diperiksa lewat log (tidak ada galat socket) karena uji
  realtime menulis pengaduan; sengaja tidak dilakukan berulang di data produksi.
- "Podcash": dibuat persis seperti ejaan pemilik. Bila maksudnya "Podcast", cukup ubah `nama` (dan bila mau `slug`) di
  `lib/kategoriBerita.js` + baris id 15 di tabel (slug lama tetap dibuka 200).
- Kesetiaan beranda 76% adalah konsekuensi keputusan pemilik; bila kelak ada desain beranda-berita resmi, komponen bersama
  memudahkan penyesuaian tanpa menyentuh `/berita`.

## 12. MENUNGGU PEMILIK

1. **Pasang volume lampiran di Coolify** (P2): Storages -> tambah volume, mount path `/app/unggahan-terjaga`, redeploy.
   Sampai dipasang, lampiran pengaduan warga hilang pada setiap redeploy (baris DB tetap, berkas 404).
2. **Ejaan "Podcash"**: dipakai persis. Konfirmasi apakah maksudnya "Podcast".
3. **Pemetaan kategori lama** (bagian 4): 8 artikel dipindah menurut tabel; bila ada yang ingin dipindah ke kategori lain,
   cukup sunting artikel di ruang staf (kategori kini dipilih dari 11 kategori aktif).
4. Butir MENUNGGU PEMILIK dari RUN QA-1, QA-2, QA-3 dan DAFTAR TINDAKAN PEMILIK Tahap 9 tetap berlaku (daftar kabupaten,
   kerangka Koordinator Daerah, kanal sosial lain, foto sungguhan, subset font, pengerasan firewall, rotasi rahasia,
   proxy Cloudflare, cadangan berkala).

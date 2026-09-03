# TAHAP 6 — MODUL PENGADUAN

> **Sumber di repo ini:** `CLAUDE.md`, `dokumen/CETAK-BIRU-SISTEM.md`,
> `dokumen/REFERENSI.md`, `dokumen/ALUR-KERJA-CLAUDE-CODE.md`,
> `desain/stitch_portal_berita_inklusif/` (ekstrak `Warkop_Nusantara.zip`),
> `LSM_WARKOP.png`, `paket-pendukung/`
>
> **Bergantung pada:** Tahap 0–4
> **Rujukan cetak biru:** bagian 7 (buku besar), 8, Pelajaran nomor 1, 3, 7
> **Rujukan REFERENSI:** 10, 11, 12, 14 (aturan 1, 3, 7, 13), **18 (protokol
> konversi — wajib)**
> **Layar:** `kontak_pengaduan_warkop_nusantara_updated_logo/`,
> `kelola_pengaduan_admin/`

---

## PROMPT INDUK

```
Kamu adalah arsitek dan pengembang senior yang membangun sistem produksi untuk
LSM WARKOP NUSANTARA — lembaga swadaya masyarakat Indonesia yang menjalankan
fungsi kontrol sosial, observasi, dan pengawasan publik.

DOKUMEN WAJIB DIPATUHI — semua sudah ada di repo ini, baca dari jalurnya:

1. dokumen/CETAK-BIRU-SISTEM.md — HUKUM ARSITEKTUR. Bila perlu menyimpang,
   HENTIKAN dan tanyakan lebih dulu.
2. desain/stitch_portal_berita_inklusif/ — desain UI final (hasil ekstrak
   Warkop_Nusantara.zip). Tampilan HARUS mengikuti berkas ini: tata letak,
   warna, tipografi, komponen, susunan setiap layar. Jangan mendesain ulang,
   jangan "memperbaiki" gaya visualnya, jangan mengganti palet. Tugasmu
   mengubahnya menjadi kode Next.js yang hidup, lewat REFERENSI bagian 18.
3. LSM_WARKOP.png — logo resmi. Pakai turunannya di paket-pendukung/ASET/logo.
4. dokumen/REFERENSI.md — keputusan yang sudah ditetapkan.
5. dokumen/ALUR-KERJA-CLAUDE-CODE.md — cara kerja dan bentuk keluaran.
6. paket-pendukung/ — Ikon.js, font, logo turunan, kerangka terverifikasi.
   Pakai apa adanya. Bila salah satu jalur di atas tidak ada, HENTIKAN dan
   beri tahu pemilik — jangan mengarang penggantinya.

ATURAN KERJA:

- Kerjakan HANYA tahap ini.
- Jalankan seluruh butir UJI TAHAP dan laporkan apa adanya.
- Bahasa Indonesia untuk komentar kode, nama fungsi, dan variabel domain.
- Tandai KEPUTUSAN BARU secara eksplisit.
- Bila menemukan cacat pada tahap sebelumnya, laporkan.
- Kerjakan LANGSUNG di repo ini. Keluaranmu adalah berkas yang sudah ada di
  tempatnya + laporan/LAPORAN-TAHAP-XX.md + satu commit git. Bukan ZIP.
- desain/ dan paket-pendukung/ adalah SUMBER BACA-SAJA — jangan pernah
  mengubah, memindah, atau menghapus isinya.
- Jangan git push, jangan menyentuh berkas di luar repo ini, jangan memasang
  perangkat global, tanpa diminta pemilik.
```

---

## TAHAP PALING PENTING DI SELURUH SISTEM

Pengaduan masyarakat adalah **inti organisasi**. Portal berita bisa dibangun
ulang; kepercayaan pelapor tidak.

Seseorang yang melaporkan dugaan korupsi dana desa atau pungutan liar sedang
mengambil risiko nyata. Bila identitasnya bocor, akibatnya bukan sekadar cacat
perangkat lunak. Karena itu tahap ini punya aturan lebih ketat dari tahap mana
pun.

Tiga prinsip yang memandu seluruh keputusan di sini:

1. **Anonim berarti tidak dikirim** — bukan dikirim lalu disembunyikan.
2. **Setiap perubahan status meninggalkan jejak permanen** — pola buku besar.
3. **Identitas pelapor dibatasi berlapis** — di SQL, di route API, dan di
   siaran.

---

## PEKERJAAN

### 1. Formulir pengaduan — `app/(publik)/kontak/page.js`

**PROTOKOL KONVERSI LAYAR (REFERENSI 18)** pada
`kontak_pengaduan_warkop_nusantara_updated_logo/code.html` — ini layar dengan
formulir terpanjang di seluruh sistem; salin kelasnya apa adanya, termasuk
gaya input bergaris bawah yang bergantung pada plugin `forms`. Opsi "Kategori
Masalah" dari `lib/kategoriPengaduan.js` (delapan kategori, REFERENSI 10);
opsi "Wilayah Kejadian" dari tabel `wilayah`. Ringkasan layarnya:

**Judul** — "Pusat Layanan Pengaduan Masyarakat" (Domine) dengan keterangan
"Kami siap mendengarkan, mencatat, dan menindaklanjuti setiap laporan Anda demi
terciptanya transparansi dan keadilan."

**Panel kiri — tiga kartu bertumpuk**

*"Hubungi Kami"* dengan ikon kartu nama: Kantor Pusat (nama gedung, jalan,
kota, kode pos), Hotline Pengaduan (24/7), Email Resmi. Ada watermark ikon
tanda tanya besar samar di kanan atas.

*"Kantor Regional"* dengan gambar peta dan tombol tumpang tindih "Lihat Peta
Penuh".

*"Kerahasiaan Dijamin"* — latar emas muda `#ffe088`, ikon perisai bulat
cokelat, teks: "Identitas pelapor dilindungi sepenuhnya oleh protokol keamanan
tingkat tinggi kami."

**Panel kanan — "Formulir Pengaduan Resmi"**

Kepala panel berlatar `#271310` dengan ikon dokumen, judul "Formulir Pengaduan
Resmi", keterangan "Lengkapi data berikut dengan sebenar-benarnya."

*Indikator tiga langkah*: lingkaran bernomor 1 (aktif, cokelat), 2, 3 dengan
garis penghubung. Label: Identitas, Detail, Bukti.

*"IDENTITAS PELAPOR"* — kotak bergaris tepi berisi kotak centang **"Sembunyikan
Identitas Saya (Laporan Anonim)"** dengan penjelasan: "Pilih opsi ini jika Anda
merasa terancam. Kami menyarankan untuk tetap memberikan kontak agar kami dapat
meminta klarifikasi lebih lanjut (kontak akan dirahasiakan)." Lalu empat input
dua kolom: Nama Lengkap (Sesuai KTP), Nomor Induk Kependudukan (NIK) —
placeholder "16 digit NIK", Nomor Telepon / WhatsApp — placeholder "Contoh:
08123456789", Alamat Email.

*"DETAIL LAPORAN"* — Kategori Masalah (select), Wilayah Kejadian (select),
Deskripsi Lengkap Kejadian (textarea) dengan placeholder "Ceritakan kronologi
kejadian secara detail: Siapa yang terlibat? Kapan terjadinya? Bagaimana
situasinya?"

*"BUKTI PENDUKUNG"* — area unggah bergaris putus-putus, ikon awan unggah,
"Klik untuk mengunggah atau seret file ke sini", "Mendukung format: JPG, PNG,
PDF, MP4 (Maks. 20MB per file)".

*Tombol* — "Simpan Draft" (garis tepi) dan "Kirim Laporan Resmi" (cokelat tua,
ikon kirim).

### 2. Aturan anonim — paling kritis

**Bila kotak anonim dicentang, keempat kolom identitas TIDAK DIKIRIM ke server
sama sekali.**

Bukan dikirim lalu tidak disimpan. Bukan disimpan lalu disembunyikan di
tampilan. **Tidak dikirim.**

Di sisi server, bila `anonim: true`, route API **mengabaikan** kolom identitas
apa pun yang mungkin ikut terkirim, dan menyimpan `NULL` ke keempatnya. Dua
lapis, karena permintaan bisa datang dari luar formulir.

Di sisi tampilan, mencentang kotak menonaktifkan keempat input dan
mengosongkan nilainya.

### 3. Keadaan konfirmasi

Setelah kirim, tampilkan halaman konfirmasi berisi **nomor kasus**
(`WRP-XXXX`) yang besar dan mudah disalin, penjelasan cara memantau status di
`/lacak`, anjuran menyimpan nomor, dan perkiraan waktu tindak lanjut.

Untuk laporan anonim, tekankan bahwa nomor kasus adalah **satu-satunya** cara
memantau laporannya — bila hilang, tidak ada cara memulihkannya, justru karena
identitas mereka tidak disimpan.

### 4. Pelacakan — `app/(publik)/lacak/page.js`

Halaman publik tanpa login: masukkan nomor kasus, lihat status dan riwayatnya.

**Yang ditampilkan:** nomor kasus, kategori, wilayah, status saat ini, linimasa
perubahan status beserta tanggalnya.

**Yang TIDAK PERNAH ditampilkan:** identitas pelapor, catatan internal staf,
nama petugas yang menangani.

**Perlindungan penjelajahan:** nomor kasus tidak mudah ditebak berurutan (sudah
dirancang di Tahap 1). Tambahkan rate limit agar tidak bisa dijelajahi massal.

Nomor kasus yang tidak ada → pesan netral. Jangan membedakan "tidak ada" dan
"ada tapi tidak berhak", karena perbedaan itu sendiri membocorkan informasi.

### 5. Kelola pengaduan — `app/(staf)/staf/pengaduan/page.js`

**PROTOKOL KONVERSI LAYAR** pada `kelola_pengaduan_admin/code.html`; sidebar
dari komponen kanonik (REFERENSI 18.3); lencana status dari
`components/ui/Lencana.js` (REFERENSI 10). Ringkasan layarnya: judul "Kelola Pengaduan" dengan
keterangan tentang meninjau laporan warga dan memastikan bukti diperiksa
sebelum mengubah status; pencarian "Cari ID Kasus atau Wilayah.." + tombol
filter; **pil status** di kanan — "Semua (124)" (aktif, emas), "Baru (12)",
"Diproses (45)" dengan jumlah sungguhan dari basis data; **tabel** kepala
cokelat tua dengan kolom ID Kasus, Kategori, Pelapor, Wilayah, Tanggal, Status,
Aksi.

Kolom Pelapor: nama, atau **ikon mata-tercoret + "Anonim"**.
Lencana status: Baru (merah muda), Diproses (emas), Selesai (abu).
Paginasi: "Menampilkan 1-3 dari 124 laporan".

### 6. Detail pengaduan — `app/(staf)/staf/pengaduan/[id]/page.js`

Layar ini **tidak ada di ZIP** — ikuti REFERENSI 18.4: cetakan
`kelola_artikel_admin` untuk kerangka halaman staf, kartu-kartu dari
`kontak_pengaduan_warkop_nusantara_updated_logo` untuk panel identitas dan
lampiran, linimasa dengan lingkaran bernomor seperti indikator langkah di layar
itu. Tandai sebagai **KEPUTUSAN BARU** dan sebutkan layar cetakannya.

Isinya: nomor kasus, kategori, wilayah, tanggal masuk; identitas pelapor
**hanya untuk `superadmin` dan `verifikator`**, dalam panel terpisah yang jelas
ditandai sebagai data sensitif; deskripsi lengkap; **lampiran** dengan
pratinjau aman (jangan me-render berkas pengguna langsung ke dalam halaman);
**linimasa riwayat** dari `pengaduan_riwayat` menampilkan setiap perpindahan
status beserta siapa dan kapan; kotak ubah status + **catatan internal wajib
diisi**; penugasan petugas.

`params` wajib di-`await`.

### 7. Aturan buku besar — tidak boleh dilanggar

`ubahStatusPengaduan()` sudah dibuat di Tahap 1. Di tahap ini, **pastikan tidak
ada jalan lain.**

- Setiap perubahan status **wajib** menulis `pengaduan_riwayat` dengan
  `status_sebelum` dan `status_sesudah`
- Keduanya dalam **satu transaksi**. Bila penulisan riwayat gagal, perubahan
  status ikut dibatalkan
- **Catatan internal wajib diisi** saat mengubah status — perubahan tanpa
  alasan tidak berguna saat ditelusuri enam bulan kemudian
- Telusuri seluruh kode: **tidak boleh ada** `UPDATE pengaduan SET status` di
  luar fungsi itu

Aturan 7: data tanpa induk merusak laporan. Tegakkan di route API, bukan hanya
di UI.

### 8. Perlindungan identitas berlapis

| Lapisan | Perlindungan |
|---|---|
| Formulir | Anonim → identitas tidak dikirim |
| Route API | `anonim: true` → identitas diabaikan, disimpan `NULL` |
| SQL | `bolehLihatIdentitas: false` → kolom identitas tidak ikut di-`SELECT` |
| Peran | Hanya `superadmin` dan `verifikator` |
| Audit | Setiap pembukaan identitas menulis `audit_log` |
| Publik | Beranda dan `/lacak` tidak pernah menampilkannya |
| Siaran | Socket tidak pernah membawanya (Tahap 8) |

### 9. Route API

| Metode | Route | Peran |
|---|---|---|
| POST | `/api/pengaduan` | publik, rate-limited |
| GET | `/api/pengaduan/lacak/[nomor]` | publik, rate-limited, tanpa identitas |
| GET | `/api/staf/pengaduan` | verifikator, superadmin, pimpinan_wilayah |
| GET | `/api/staf/pengaduan/[id]` | verifikator, superadmin, pimpinan_wilayah |
| POST | `/api/staf/pengaduan/[id]/status` | verifikator, superadmin |

### 10. Unggahan lampiran

Lebih longgar dari artikel (menerima PDF dan MP4), tetapi tetap ketat: tipe
`jpg`/`png`/`pdf`/`mp4`; ukuran dari `UPLOAD_MAX_MB` (20MB per berkas);
**periksa magic bytes**; nama berkas diganti acak; disimpan **tanpa hak
eksekusi**; path tidak mudah ditebak — lampiran pengaduan tidak boleh bisa
dijelajahi dengan menebak URL.

Batasi juga **jumlah berkas** per pengaduan dan **total ukurannya**.

### 11. Rate limit

Formulir terbuka untuk umum, jadi rentan disalahgunakan. Batasi pengiriman per
IP. Pertimbangkan tantangan sederhana — **bukan** CAPTCHA pihak ketiga yang
melacak pengguna; ini organisasi yang menjanjikan kerahasiaan.

Jangan sampai pembatasan menghalangi pelapor sah dari daerah dengan IP bersama
(warnet, kantor desa). Jelaskan penyeimbangannya.

---

## LARANGAN KERAS

| Larangan | Alasan |
|---|---|
| Mengirim identitas ke server saat anonim dicentang | Prinsip inti |
| Menyimpan identitas lalu menyembunyikannya | Bukan anonim |
| Menampilkan identitas di halaman publik atau `/lacak` | Aturan 13 |
| Mengubah status di luar `ubahStatusPengaduan()` | Melewati buku besar |
| Mengubah status tanpa catatan internal | Tidak bisa ditelusuri |
| Nomor kasus berurutan yang mudah ditebak | Bisa dijelajahi |
| Membedakan pesan "tidak ada" dan "tidak berhak" | Membocorkan keberadaan kasus |
| Me-render berkas unggahan langsung ke halaman | Risiko XSS |
| Menyaring identitas di JavaScript | Harus di SQL |

---

## UJI TAHAP 6

**a. UJI ANONIM — paling penting.**

1. Isi formulir **lengkap** dengan nama, NIK, telepon, email
2. **Lalu centang** kotak anonim
3. Kirim
4. Periksa **muatan permintaan jaringan** — keempat kolom identitas tidak boleh
   ada di sana
5. Periksa **langsung di basis data** — keempat kolom harus `NULL`

Lampirkan tangkapan tab Network dan hasil kueri basis data.

**b. UJI ANONIM LEWAT API LANGSUNG** — kirim POST dengan `anonim: true`
**beserta** kolom identitas terisi, lewat curl. Server harus **mengabaikan**
identitas dan menyimpan `NULL`. Buktikan.

**c. Alur laporan bernama** — nomor kasus terbit, halaman konfirmasi muncul.

**d. Pelacakan** — status dan riwayat tampil, **identitas tidak tampil**.
Periksa **balasan JSON mentah**, bukan hanya tampilannya.

**e. Pelacakan nomor asing** — pesan netral. Bandingkan dengan pesan untuk
nomor yang ada tetapi tidak berhak — **harus sama**.

**f. UJI BUKU BESAR** — ubah status lima kali: baru → diverifikasi → diproses →
selesai. Periksa `pengaduan_riwayat`: ada lima baris, `status_sesudah` baris
ke-N = `status_sebelum` baris ke-N+1, setiap baris punya catatan, pelaku, dan
waktu WIB. Lampirkan isi tabelnya.

**g. UJI TRANSAKSI** — simulasikan kegagalan penulisan riwayat → status
pengaduan **tidak boleh berubah**. Buktikan dengan kueri sebelum dan sesudah.

**h. Penelusuran jalan pintas** — telusuri `UPDATE pengaduan` atau perubahan
kolom `status` di luar `ubahStatusPengaduan()`. Nihil.

**i. Catatan wajib** — ubah status tanpa catatan lewat API langsung → ditolak.

**j. UJI PERAN**

| Uji | Harapan |
|---|---|
| `penulis` GET `/api/staf/pengaduan` | 403 |
| `redaktur` GET `/api/staf/pengaduan` | 403 |
| `pimpinan_wilayah` POST status | 403 |
| `pimpinan_wilayah` GET pengaduan wilayah lain | tidak ada di hasil |
| `pimpinan_wilayah` GET detail | **tanpa identitas** di JSON |

**k. UJI LAMPIRAN**

| Uji | Harapan |
|---|---|
| Unggah 25MB | Ditolak |
| `.exe` bernama `.pdf` | Ditolak (magic bytes) |
| `.svg` berisi script | Ditolak |
| Tebak URL lampiran pengaduan lain | Tidak bisa diakses |

**l. Rate limit** — 30 pengaduan berturut-turut dari satu IP → dibatasi, dengan
pesan yang tidak menyalahkan pelapor.

**m. Audit identitas** — buka identitas sebagai `verifikator` → `audit_log`
tercatat.

**n. UJI KESETIAAN** — `uji-kesetiaan.mjs` untuk formulir dan kelola
pengaduan (REFERENSI 18.5); sisa cacat export nol; setiap kelas hilang
beralasan. Bila peramban tersedia, tambahkan perbandingan berdampingan.

**o. Tiga lebar layar** — 375px, 768px, 1280px untuk formulir. Formulir panjang
di layar kecil adalah titik paling rawan — uji sungguh-sungguh, termasuk
keyboard ponsel yang menutupi input.

**p. Zona waktu** — kirim pengaduan, periksa `dibuat_pada` → WIB.

**q. Build hijau** — `npm run build` dan `npm run lint`.

---

## BENTUK KELUARAN (Claude Code)

Kerjakan **langsung di repo ini** — tidak ada paket perubahan, tidak ada
apply.ps1. Di akhir tahap:

1. Seluruh berkas tahap ini sudah ada di tempatnya dan `npm run build` hijau.
2. Tulis `laporan/LAPORAN-TAHAP-06.md` (isi sesuai bagian LAPORAN di bawah).
   Bukti uji (keluaran curl, keluaran uji-kesetiaan, tangkapan bila ada) masuk
   `laporan/bukti-tahap-06/` dan dirujuk dari laporan.
3. `git add -A` lalu `git commit -m "Tahap 06: <ringkasan satu baris>"`.
   Jangan push tanpa diminta pemilik.
4. MODE GERBANG: berhenti, tunggu pemilik memeriksa laporan. MODE OTONOM:
   verifikasi gerbang-mandiri (ALUR bagian 7.2), perbarui laporan/STATUS.md,
   lalu langsung lanjut tahap berikutnya.

## LAPORAN — isi `laporan/LAPORAN-TAHAP-06.md`

1. Daftar halaman, komponen, dan route API yang dibuat
2. **Bukti uji anonim (butir a dan b)** — tangkapan Network dan kueri basis
   data. Ini bukti terpenting di seluruh proyek
3. **Isi `pengaduan_riwayat` setelah uji buku besar (butir f)**
4. **Bukti uji transaksi (butir g)**
5. Hasil penelusuran jalan pintas (butir h)
6. Tabel hasil uji peran (butir j)
7. Hasil uji lampiran (butir k)
8. Tangkapan layar perbandingan dan tiga lebar layar
9. Hasil ketujuh belas butir UJI TAHAP
10. **KEPUTUSAN BARU**: susunan halaman detail pengaduan (tidak ada di ZIP),
    strategi rate limit yang tidak menghalangi pelapor sah, cara pratinjau
    lampiran yang aman

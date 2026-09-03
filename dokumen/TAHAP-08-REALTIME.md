# TAHAP 8 — REALTIME (SOCKET.IO)

> **Sumber di repo ini:** `CLAUDE.md`, `dokumen/CETAK-BIRU-SISTEM.md`,
> `dokumen/REFERENSI.md`, `dokumen/ALUR-KERJA-CLAUDE-CODE.md`,
> `desain/stitch_portal_berita_inklusif/` (ekstrak `Warkop_Nusantara.zip`),
> `LSM_WARKOP.png`, `paket-pendukung/`
>
> **Bergantung pada:** Tahap 0–7
> **Rujukan cetak biru:** bagian 9 (realtime), 1 (custom server)
> **Rujukan REFERENSI:** 4, 11, 14 (aturan 13), 16.5 (Turbopack)
> **Layar terdampak:** `dashboard_staff_warkop/`, `kelola_pengaduan_admin/`

---

## PROMPT INDUK

```
Kamu adalah arsitek dan pengembang senior yang membangun sistem produksi untuk
LSM WARKOP NUSANTARA — lembaga swadaya masyarakat Indonesia yang menjalankan
fungsi kontrol sosial, observasi, dan pengawasan publik, sekaligus menerbitkan
portal berita dan laporan investigasi.

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
- Bahasa Indonesia untuk komentar kode, nama fungsi, dan nama event domain.
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

## TUJUAN

Menghidupkan `server.js` yang kerangkanya dibuat di Tahap 0, sehingga dashboard
staf memperbarui dirinya saat pengaduan baru masuk.

**Realtime di sini adalah penyempurna, bukan tumpuan.** Bila socket terputus,
seluruh sistem harus tetap berfungsi lewat pemuatan biasa. Rancang dengan sikap
itu — jangan ada fitur yang hanya bisa dipakai bila socket hidup.

Satu aturan yang tidak bisa ditawar: **identitas pelapor tidak pernah lewat
socket.** Muatan siaran adalah tempat kebocoran yang paling mudah terlewat,
karena tidak terlihat di antarmuka mana pun.

---

## PEKERJAAN

### 1. Server Socket.io — `lib/socket/server.js`

Pola **cetak biru bagian 9**:

```js
const app = next({ dev, hostname, port });
await app.prepare();
const handle = app.getRequestHandler();
const server = createServer((req, res) => handle(req, res));
initSocket(server);
server.listen(port, hostname);
```

**Simpan instance `io` di `globalThis`** agar route API bisa memakainya
walaupun berada di bundle berbeda. Cetak biru menyebut ini secara khusus.

**Catatan Next.js 16:** Turbopack adalah bundler bawaan. Uji `npm run dev`
**dan** `npm run build` — ketidakcocokan bundler dengan custom server harus
ditemukan di sini, bukan setelah penerapan.

### 2. Autentikasi socket

**Setiap socket wajib diautentikasi sebelum masuk room mana pun.** Jangan ada
data yang disiarkan ke socket yang belum terverifikasi.

- Baca token dari cookie saat handshake
- Verifikasi dengan `jose`, termasuk pemeriksaan `token_version`
- Socket tanpa token atau token tidak sah → **ditolak**, bukan dibiarkan
  terhubung tanpa room

### 3. Room

| Room | Isi | Untuk |
|---|---|---|
| `global` | seluruh socket terverifikasi | siaran umum |
| `user:<id>` | satu pengguna | notifikasi pribadi |
| `staf` | seluruh peran staf | siaran ruang kerja |
| `wilayah:<id>` | staf wilayah tertentu | untuk `pimpinan_wilayah` |

`pimpinan_wilayah` masuk `wilayah:<id>` sesuai wilayahnya, **dan tidak masuk
room wilayah lain**. Lapisan tambahan di atas penyaringan SQL.

### 4. Pembantu siaran — `lib/socket/siaran.js`

**Route API memanggil pembantu, tidak pernah menyentuh `io` langsung.** Aturan
eksplisit di cetak biru bagian 9.

```
siarkanPengaduanBaru(pengaduan)
siarkanStatusPengaduan(pengaduan, statusSebelum, statusSesudah)
siarkanArtikelTerbit(artikel)
```

Setiap fungsi menyusun muatan yang **aman** — penyaringan data sensitif terjadi
di sini, satu tempat, bukan tersebar di setiap pemanggil.

### 5. Kejadian

| Event | Room tujuan | Muatan |
|---|---|---|
| `pengaduan:baru` | `staf` + `wilayah:<id>` | nomor kasus, kategori, wilayah, status, waktu |
| `pengaduan:status` | `staf` + `wilayah:<id>` | nomor kasus, status sebelum, status sesudah, waktu |
| `artikel:terbit` | `staf` | judul, slug, kategori, penulis |

**Muatan `pengaduan:*` TIDAK BOLEH berisi:** nama, NIK, telepon, atau email
pelapor; deskripsi lengkap laporan; catatan internal staf; nama petugas.

Cukup nomor kasus, kategori, wilayah, dan status — sekadar penanda bahwa ada
sesuatu yang berubah, sehingga antarmuka tahu perlu memperbarui diri.

Bila dashboard butuh detail lebih, ia **mengambilnya lewat API biasa** yang
sudah punya penjaga peran. Jangan menempuh jalan pintas lewat socket.

### 6. Sisi klien — `hooks/useSocket.js`

**Sambungkan ke origin yang sama** (`io(window.location.origin, { path: '/socket.io' })`)
— bukan ke `NEXT_PUBLIC_WS_URL` domain utama. Alasannya: cookie `httpOnly`
diterbitkan di `staf.<domain>`; sambungan ke `wss://<domain>` tidak membawa
cookie itu dan pasti ditolak autentikasi socket. `NEXT_PUBLIC_WS_URL` hanya
dipakai bila terisi (REFERENSI 13).

Menangani: menyambung, menyambung ulang saat terputus, membersihkan saat
komponen dilepas.

**Perilaku wajib:**
- Sambungan gagal → antarmuka tetap berfungsi, tanpa pesan galat mengganggu
- Sambungan pulih → **sinkronkan ulang** dengan memuat data terbaru lewat API,
  jangan hanya menunggu event berikutnya (event selama terputus sudah hilang)
- Sambungan terputus → boleh tampilkan penanda halus, bukan peringatan besar

### 7. Penerapan di antarmuka

**Dashboard** — kartu "Pengaduan Masuk" menaikkan angkanya, tabel "Pengaduan
Terbaru" menyisipkan baris baru di atas, panel "Aktivitas Staf" menambah entri.

Perubahan harus **halus**, bukan mengagetkan. Baris baru muncul dengan sorotan
sesaat lalu memudar. **Jangan menggeser posisi gulir** pengguna yang sedang
membaca.

**Kelola pengaduan** — jumlah pada pil status ("Semua (124)", "Baru (12)")
diperbarui; baris baru muncul bila sedang di halaman pertama tanpa filter.

Bila pengguna sedang membuka halaman kedua atau memasang filter, **jangan
mengubah daftarnya di bawah tangan mereka**. Tampilkan penanda "ada 3 laporan
baru — muat ulang" dan biarkan mereka memilih.

### 8. Konfigurasi produksi

Sambungan same-origin otomatis memakai `wss://` di balik HTTPS. Pastikan
Traefik meneruskan WebSocket dengan benar (Coolify melakukannya secara bawaan;
Cloudflare juga meneruskan WebSocket pada paket gratis). Dokumentasikan di
`PENERAPAN.md` bila ada setelan tambahan yang diperlukan.

---

## LARANGAN KERAS

| Larangan | Alasan |
|---|---|
| Menyiarkan identitas pelapor | Aturan 13 |
| Menyiarkan deskripsi laporan atau catatan internal | Data sensitif |
| Socket tanpa autentikasi masuk room | Kebocoran |
| Route API menyentuh `io` langsung | Cetak biru bagian 9 |
| Fitur yang hanya berfungsi bila socket hidup | Realtime adalah penyempurna |
| Mengubah daftar di bawah tangan pengguna yang menyaring | Mengganggu kerja |
| `ws://` di produksi | Tidak terenkripsi |

---

## UJI TAHAP 8

**a. Siaran sampai** — buka dashboard di dua peramban dengan dua akun staf.
Kirim pengaduan dari jendela ketiga (tanpa login) → **kedua dashboard
diperbarui seketika**. Lampirkan tangkapan sebelum dan sesudah.

**b. UJI MUATAN BERSIH — wajib, inti tahap ini.**

Sadap muatan socket di sisi klien (tab Network → WS → Messages, atau log di
`useSocket`). Periksa **setiap** pesan yang diterima.

**Tidak boleh ada:** nama, NIK, telepon, email pelapor, deskripsi laporan,
catatan internal, nama petugas.

Lampirkan muatan mentah beberapa pesan sebagai bukti.

Uji ini dilakukan untuk **laporan bernama**, bukan hanya anonim — karena
laporan bernama justru yang berisiko bocor.

**c. Socket tanpa token** — coba menyambung tanpa cookie → ditolak. Token
kedaluwarsa → ditolak. Token yang `token_version`-nya sudah dinaikkan →
ditolak.

**d. Isolasi room wilayah** — dua `pimpinan_wilayah` dari wilayah berbeda
tersambung. Kirim pengaduan di wilayah A → hanya pimpinan wilayah A yang
menerima. Buktikan dengan menyadap muatan keduanya.

**e. Tanpa socket, sistem tetap jalan** — blokir koneksi WS di peramban →
seluruh halaman tetap berfungsi. Tidak ada tombol yang mati, tidak ada galat
yang muncul ke pengguna.

**f. Pemulihan sambungan** — buka dashboard, putuskan jaringan, kirim pengaduan
dari perangkat lain, sambungkan kembali → dashboard harus **menyusul
ketinggalan**, bukan diam karena event-nya sudah lewat.

**g. Route API tidak menyentuh io** — telusuri seluruh `route.js`: tidak boleh
ada rujukan langsung ke `io` atau `globalThis.io`. Seluruhnya lewat
`lib/socket/siaran.js`.

**h. WSS di balik HTTPS** — uji di lingkungan container (Tahap 3) di balik
Traefik. `NEXT_PUBLIC_WS_URL` memakai `wss://`, sambungan berhasil, tidak ada
peringatan mixed content.

**i. Tidak mengganggu gulir** — buka daftar pengaduan, gulir ke tengah, kirim
pengaduan baru → posisi gulir **tidak bergeser**.

**j. Perilaku saat menyaring** — pasang filter status "Selesai", kirim pengaduan
baru (status "Baru") → daftar **tidak berubah**, tetapi muncul penanda halus.

**k. Beban** — sambungkan 50 socket sekaligus, kirim 20 pengaduan → tidak ada
kebocoran memori, tidak ada pesan hilang, waktu kirim wajar.

**l. Pembersihan** — buka lalu tutup halaman dashboard 20 kali → jumlah socket
aktif kembali ke nol. Tidak ada listener menumpuk.

**m. Build hijau** — `npm run dev` **dan** `npm run build` berhasil dengan
Turbopack. Laporkan bila ada peringatan terkait custom server.

---

## BENTUK KELUARAN (Claude Code)

Kerjakan **langsung di repo ini** — tidak ada paket perubahan, tidak ada
apply.ps1. Di akhir tahap:

1. Seluruh berkas tahap ini sudah ada di tempatnya dan `npm run build` hijau.
2. Tulis `laporan/LAPORAN-TAHAP-08.md` (isi sesuai bagian LAPORAN di bawah).
   Bukti uji (keluaran curl, keluaran uji-kesetiaan, tangkapan bila ada) masuk
   `laporan/bukti-tahap-08/` dan dirujuk dari laporan.
3. `git add -A` lalu `git commit -m "Tahap 08: <ringkasan satu baris>"`.
   Jangan push tanpa diminta pemilik.
4. MODE GERBANG: berhenti, tunggu pemilik memeriksa laporan. MODE OTONOM:
   verifikasi gerbang-mandiri (ALUR bagian 7.2), perbarui laporan/STATUS.md,
   lalu langsung lanjut tahap berikutnya.

## LAPORAN — isi `laporan/LAPORAN-TAHAP-08.md`

1. Daftar berkas socket, event, dan room yang dibuat
2. **Muatan socket mentah sebagai bukti tidak ada identitas (butir b)** — bukti
   terpenting di tahap ini
3. Bukti isolasi room wilayah (butir d)
4. Bukti sistem tetap jalan tanpa socket (butir e)
5. Bukti pemulihan sambungan (butir f)
6. Hasil penelusuran route yang menyentuh `io` (butir g)
7. Hasil ketiga belas butir UJI TAHAP
8. **KEPUTUSAN BARU**: strategi sinkronisasi ulang setelah terputus, cara
   menampilkan penanda data baru tanpa mengganggu, penanganan beban socket

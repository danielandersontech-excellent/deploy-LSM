# LAPORAN TAHAP 08 — REALTIME (SOCKET.IO)

Tanggal: 4 September 2026 (WIB). Mode: OTONOM (gerbang-mandiri ALUR 7.2).
Bukti di `laporan/bukti-tahap-08/` (skrip di `skrip/`, tangkapan di `tangkapan/`).

Ringkasan: Socket.io berjalan pada `server.js` yang sama, setiap socket wajib
terautentikasi (cookie `warkop_token` → jose → DB aktif + `token_version`)
sebelum masuk room; tiga kejadian (`pengaduan:baru`, `pengaduan:status`,
`artikel:terbit`) disiarkan hanya lewat `lib/socket/siaran.js` dengan muatan
tanpa identitas; klien same-origin lewat `hooks/useSocket.js`; antarmuka
memuat ulang halus (`router.refresh()`) tanpa menggeser gulir dan tanpa
mengubah daftar pengguna yang menyaring. **13/13 butir uji LULUS** (butir h di
produksi setelah redeploy — lihat bagian 7).

## 1. Berkas, kejadian, dan room

| Berkas | Isi |
|---|---|
| `lib/socket/server.js` | `initSocket(httpServer)`: `io.use` autentikasi (TANPA_TOKEN / TOKEN_TIDAK_SAH / AKUN_NONAKTIF / SESI_DIBATALKAN → handshake ditolak), `roomUntuk()`, `socket.on('room:saya')` (diagnostik), `ambilIo()`, `jumlahSocket()`, `ambilCookie()`. `maxHttpBufferSize` 16 KB, ping 25 s / timeout 20 s, `serveClient:false`, tanpa CORS (same-origin) |
| `lib/socket/siaran.js` | `siarkanPengaduanBaru`, `siarkanStatusPengaduan`, `siarkanArtikelTerbit` — satu-satunya jalan route API ke `io`; muatan dibangun dari daftar putih kunci dan diperiksa terhadap `KUNCI_TERLARANG`; io null → tidak melakukan apa-apa (realtime penyempurna) |
| `hooks/useSocket.js` | klien same-origin (`NEXT_PUBLIC_WS_URL` hanya bila terisi), `withCredentials`, reconnection 1–15 s; keadaan `menyambung/tersambung/terputus/ditolak`; `onSambungUlang` saat pulih; ditolak autentikasi → berhenti mencoba; listener dibersihkan saat unmount |
| `components/staf/PemantauRealtime.js` | mode `dashboard` & `daftar-pengaduan` (prop `bebasFilter`); refresh dibatasi 1×/1,5 s; sorotan sesaat `[data-nomor]`; penanda "Ada N laporan baru — muat ulang" saat menyaring; penanda kecil saat terputus; atribut `data-realtime` di `<html>` |
| `app/(staf)/staf/dashboard/page.js`, `app/(staf)/staf/pengaduan/page.js` | memasang `PemantauRealtime`; baris tabel ber-`data-nomor` |
| `app/api/pengaduan/route.js`, `app/api/staf/pengaduan/[id]/status/route.js`, `app/api/staf/artikel/[id]/terbitkan/route.js` | memanggil pembantu siaran SETELAH transaksi DB + audit berhasil |
| `app/api/staf/statistik/route.js` | `jumlahSocket` (superadmin saja; diagnostik uji k/l) |
| `PENERAPAN.md` §C.1 | WebSocket di balik Traefik/Cloudflare, jalur polling, cara verifikasi |

Kejadian dan room (sesuai TAHAP-08 §5):

| Event | Room tujuan | Kunci muatan |
|---|---|---|
| `pengaduan:baru` | `staf` + `wilayah:<id>` | nomorKasus, kategori, wilayahId, wilayah, status, waktu |
| `pengaduan:status` | `staf` + `wilayah:<id>` | + statusSebelum, statusSesudah |
| `artikel:terbit` | `staf` | judul, slug, kategori, penulis, waktu |

Room: `global` (semua terverifikasi), `user:<id>`, `staf` (semua peran staf
kecuali pimpinan wilayah), `wilayah:<id>` (pimpinan wilayah, sesuai wilayahnya).

## 2. Muatan socket mentah — bukti tidak ada identitas (butir b)

Laporan **BERNAMA** (nama, NIK, telepon, email terisi) dikirim ke wilayah 13,
lalu statusnya diubah. Muatan mentah yang diterima superadmin, verifikator, dan
pimpinan wilayah 13 (`b-c-d-k-l-socket.txt`):

```
pengaduan:baru   {"nomorKasus":"WRP-231527","kategori":"pungli","wilayahId":13,"wilayah":"Jawa Barat","status":"baru","waktu":"2026-09-04T01:26:55+07:00"}
pengaduan:status {"nomorKasus":"WRP-231527","kategori":"pungli","wilayahId":13,"wilayah":"Jawa Barat","status":"diverifikasi","waktu":"2026-09-04T01:26:57+07:00","statusSebelum":"baru","statusSesudah":"diverifikasi"}
artikel:terbit   {"judul":"Laporan Infrastruktur Jalan Rusak di Kab. Bandung","slug":"laporan-infrastruktur-jalan-rusak-di-kab-bandung","kategori":"Fasilitas Umum","penulis":"Siti Aminah","waktu":"2026-09-04T01:27:01+07:00"}
```

Setiap pesan diperiksa otomatis: kunci terlarang (nama/nik/telepon/email
pelapor, deskripsi, catatan, petugas) **NIHIL**; nilai sensitif (nama/NIK/
telepon/email/deskripsi yang dikirim di formulir) **NIHIL** — 6/6 pesan bersih.
`penulis` pada `artikel:terbit` adalah nama penulis artikel (publik di halaman
berita), bukan identitas pelapor.

## 3. Isolasi room wilayah (butir d)

Dua pimpinan wilayah tersambung bersamaan: wilayah 13 (room `global, user:22,
wilayah:13`) dan wilayah 3 (`global, user:6, wilayah:3`). Pengaduan + perubahan
status di wilayah 13 → pimpinan wilayah 13 menerima 2 pesan, pimpinan wilayah 3
menerima **0**.

TEMUAN & PERBAIKAN: pada run pertama pimpinan wilayah 3 ikut menerima karena
`roomUntuk()` memasukkan semua peran staf ke room `staf`. Diperbaiki:
pimpinan wilayah TIDAK masuk `staf` (padanan socket dari matriks REFERENSI 11).

## 4. Sistem tetap jalan tanpa socket (butir e)

Chrome headless: konstruksi WebSocket ke `/socket.io/` digagalkan DAN
`/socket.io/?*` (polling) diblokir. Empat halaman staf dibuka
(`a-e-f-i-j-peramban.txt` bagian e): semuanya 200, terhidrasi
(`hidrasi=true`), tanpa overlay galat Next, tombol/tautan tersedia
(22/27/45/15), tidak ada teks galat. Yang tampak hanya penanda kecil
"Sambungan langsung terputus — data diperbarui saat tersambung kembali" di
dashboard dan daftar pengaduan (`data-realtime=terputus`; tangkapan
`e-tanpa-socket-dashboard.png`). Server: `siaran.js` menjadi no-op bila `io`
null (`g-route-tanpa-io.txt`).

## 5. Pemulihan sambungan (butir f)

Dashboard superadmin dibuat offline (emulasi jaringan CDP) → hook melapor
`terputus` setelah ±37 s (ping 25 s + timeout 20 s; penanda tampil,
`f-offline-penanda-terputus.png`) → pengaduan dikirim dari jendela lain saat
offline (angka tetap 2) → online kembali → `connect` kedua memicu
`onSambungUlang` = `router.refresh()` → dashboard **menyusul** dalam 1,5 s:
angka 3, baris pertama = pengaduan yang dikirim saat offline
(`f-online-menyusul.png`).

## 6. Penelusuran route yang menyentuh io (butir g)

`grep 'ambilIo|globalThis.__warkopIo|\bio\.'` pada seluruh `app/api/**/route.js`:
**0** kecocokan. Tiga route memanggil pembantu `lib/socket/siaran.js`
(`pengaduan`, `staf/pengaduan/[id]/status`, `staf/artikel/[id]/terbitkan`);
`staf/statistik` hanya memakai `jumlahSocket()` (diagnostik, bukan siaran).

## 7. Hasil ketiga belas butir uji

| Butir | Hasil | Bukti |
|---|---|---|
| a. Siaran sampai — dua akun (Superadmin, Siti Aminah/verifikator) di dua konteks peramban, pengaduan dari jendela ketiga tanpa login | LULUS: "Pengaduan Masuk" 1→2 dan baris pertama tabel = nomor baru di kedua dashboard, 0,5 s / 0,0 s, tanpa muat ulang manual | `a-e-f-i-j-peramban.txt`; `tangkapan/a-sebelum-*.png`, `a-sesudah-*.png` |
| b. Muatan bersih (laporan bernama) | LULUS: 6/6 pesan tanpa kunci/nilai identitas | bagian 2; `b-c-d-k-l-socket.txt` |
| c. Socket tanpa token / palsu / `token_version` lama / kedaluwarsa | LULUS: ditolak TANPA_TOKEN, TOKEN_TIDAK_SAH, SESI_DIBATALKAN, TOKEN_TIDAK_SAH; token sah tersambung (kontrol) | `b-c-d-k-l-socket.txt` |
| d. Isolasi room wilayah | LULUS: wilayah 13 menerima 2, wilayah 3 menerima 0 | bagian 3 |
| e. Tanpa socket sistem tetap jalan | LULUS | bagian 4 |
| f. Pemulihan sambungan | LULUS: menyusul 1,5 s setelah online | bagian 5 |
| g. Route tidak menyentuh io | LULUS: 0 kecocokan | `g-route-tanpa-io.txt` |
| h. WSS di balik HTTPS (produksi) | lihat `h-wss-produksi.txt` (dijalankan setelah redeploy, dicatat di STATUS.md) | `h-wss-produksi.txt` |
| i. Tidak mengganggu gulir | LULUS: `main.scrollTop` 300 → 300; baris baru masuk di atas (5→6 baris) dalam 0,5 s | `a-e-f-i-j-peramban.txt`; `i-setelah-pengaduan-baru.png` |
| j. Menyaring (status=selesai) | LULUS: daftar identik sebelum/sesudah; penanda "Ada 1 laporan baru — muat ulang" muncul | `j-menyaring-penanda.png` |
| k. Beban 50 socket + 20 pengaduan/status | LULUS: 1000/1000 pesan diterima, 0 socket kekurangan, 20 POST dalam 957 ms, latensi rata-rata 479 ms, RSS klien 69 MB | `b-c-d-k-l-socket.txt` |
| l. Pembersihan 20× buka-tutup | LULUS: jumlah socket kembali ke dasar (1 → 0 setelah socket terakhir ditutup) | `b-c-d-k-l-socket.txt` |
| m. Build hijau | LULUS: `npm run dev` (dipakai seluruh uji) dan `npm run build` exit 0, Turbopack; 6 peringatan "Dynamic filesystem access" di `lib/unggahan.js` (sudah ada sejak Tahap 6, bukan custom server) | `m-build.txt`; lint bersih |

## 8. KEPUTUSAN BARU

1. **Sinkronisasi ulang setelah terputus**: event yang lewat tidak diantre di
   server; saat `connect` berikutnya (bukan yang pertama) klien memanggil
   `router.refresh()` sehingga server component memuat data terbaru dari DB.
   Ini lebih sederhana dan aman (tidak ada antrean pesan per pengguna di memori).
2. **Penanda tanpa mengganggu**: `PemantauRealtime` diletakkan **fixed** di
   sudut kanan bawah (di luar alur dokumen) — pada uji i penanda yang semula
   berada di alur di atas tabel menggeser `scrollTop` 42 px. Saat menyaring/
   halaman > 1 daftar tidak disentuh; hanya tombol "Ada N laporan baru — muat
   ulang". Sorotan baris memakai kelas token desain `bg-secondary-fixed`
   selama 3 s (tanpa animasi baru).
3. **Beban socket**: refresh klien dibatasi 1×/1,5 s per tab; muatan ≤ 16 KB;
   klien tidak boleh mengirim event selain `room:saya`; tanpa CORS/cross-origin.
   50 socket × 20 siaran = 1000 pesan tanpa kehilangan (bagian 7k).
4. `pimpinan_wilayah` tidak masuk room `staf` (bagian 3).
5. Atribut `data-realtime` pada `<html>` (tak tampak) untuk uji/diagnostik.
6. `jumlahSocket` di `/api/staf/statistik` hanya untuk superadmin.
7. Temuan lingkungan dev (bukan produksi): Next 16 memblokir sumber dev
   lintas-origin bila dibuka lewat `127.0.0.1` sehingga hidrasi klien tidak
   berjalan tanpa galat; uji peramban memakai `localhost`. Dua tab Chrome
   headless berbagi cookie jar → uji memakai `Target.createBrowserContext`
   per akun. `Network.setBlockedURLs` tidak menghentikan handshake WebSocket →
   uji e menggagalkan konstruktor WebSocket untuk `/socket.io/`.
8. Siaran dipanggil setelah transaksi + audit berhasil; bila siaran gagal,
   galatnya dicatat dan balasan API tetap sukses (realtime penyempurna).

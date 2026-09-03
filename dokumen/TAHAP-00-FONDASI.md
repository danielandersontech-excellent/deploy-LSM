# TAHAP 0 — FONDASI PROYEK

> **Sumber di repo ini:** `CLAUDE.md`, `dokumen/CETAK-BIRU-SISTEM.md`,
> `dokumen/REFERENSI.md`, `dokumen/ALUR-KERJA-CLAUDE-CODE.md`,
> `desain/stitch_portal_berita_inklusif/` (ekstrak `Warkop_Nusantara.zip`),
> `LSM_WARKOP.png`, `paket-pendukung/`
>
> **Rujukan cetak biru:** bagian 3, 4, 5, 8, 9, 12
> **Rujukan REFERENSI:** 6 (struktur), 7 (token), 13 (ENV), 16 (Next.js 16),
> 18 (protokol konversi — dipakai untuk `uji-desain`)

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
- Jalankan seluruh butir UJI TAHAP dan laporkan apa adanya. Dilarang
  melaporkan lulus untuk uji yang belum dijalankan. Bila suatu uji tidak bisa
  dijalankan di lingkunganmu, katakan tidak bisa dan jelaskan alasannya.
- Bahasa Indonesia untuk komentar kode, nama fungsi, dan variabel domain.
- Tandai KEPUTUSAN BARU secara eksplisit.
- Bila menemukan cacat pada desain atau cetak biru, laporkan. Jangan menambal
  diam-diam.
- Kerjakan LANGSUNG di repo ini. Keluaranmu adalah berkas yang sudah ada di
  tempatnya + laporan/LAPORAN-TAHAP-XX.md + satu commit git. Bukan ZIP.
- desain/ dan paket-pendukung/ adalah SUMBER BACA-SAJA — jangan pernah
  mengubah, memindah, atau menghapus isinya.
- Jangan git push, jangan menyentuh berkas di luar repo ini, jangan memasang
  perangkat global, tanpa diminta pemilik.
```

---

## TUJUAN

Kerangka proyek yang **benar sejak awal**. Belum ada fitur. Yang dinilai adalah
ketepatan struktur, konfigurasi, dan token desain — kesalahan di lapisan ini
menular ke sembilan tahap berikutnya.

Tahap ini juga **mengonfirmasi** di lingkunganmu satu hal yang sudah dibuktikan
pada 31 Agustus 2026 (REFERENSI 16.7): `proxy.js` berjalan di bawah custom
server Next.js 16.3.3. Hasilmu harus sama; bila berbeda, itu temuan penting —
laporkan, jangan sembunyikan.

**Sebagian besar berkas tahap ini sudah tersedia terverifikasi** di
`paket-pendukung//paket-pendukung/ASET/`. Ekstrak dan salin; jangan menulis
ulang. Yang kamu kerjakan adalah merangkainya menjadi proyek yang membangun.

---

## PEKERJAAN

### 0. Persiapan repo (khusus Claude Code, sekali saja)

1. Pastikan ada di `D:\Deploy\LSM`: `CLAUDE.md`, `dokumen/`,
   `paket-pendukung/`, `laporan/`, `.gitignore`, `Warkop_Nusantara.zip`,
   `LSM_WARKOP.png`. Salah satu tidak ada → HENTIKAN, beri tahu pemilik.
2. Ekstrak `Warkop_Nusantara.zip` ke `desain/` sehingga terbentuk
   `desain/stitch_portal_berita_inklusif/` (PowerShell:
   `Expand-Archive Warkop_Nusantara.zip -DestinationPath desain`).
   Verifikasi 17 folder layar dan hitung `code.html` (harus 17). `desain/`
   masuk `.gitignore` — memang tidak ikut repo.
3. Bila belum ada `.git`: `git init`, lalu commit pertama berisi dokumen dan
   paket pendukung: `git add -A ; git commit -m "Persiapan: dokumen + paket pendukung"`.
   `git remote add origin https://github.com/danielandersontech-excellent/deploy-LSM.git`
   boleh dipasang sekarang; **jangan push** tanpa perintah pemilik.
4. Baca `dokumen/REFERENSI.md` bagian 9 (cacat export) dan bagian 18
   (protokol konversi) sebelum menyentuh desain.

### 1. Struktur folder

Persis **REFERENSI bagian 6**. Perhatikan segmen bersarang `app/(staf)/staf/`.

Folder yang belum berisi halaman diisi `.gitkeep`, **bukan** `page.js`
berkomentar — berkas `page.js` tanpa ekspor sah menggagalkan `next build`.

Yang **wajib berisi kode sungguhan**:

```
package.json          next.config.mjs       tailwind.config.js
eslint.config.mjs     postcss.config.js     server.js
proxy.js              app/layout.js         app/globals.css
app/api/health/route.js                     lib/navItems.js
lib/db/index.js       lib/utils.js          .env.example
.gitignore            .dockerignore         README.md
public/logo-warkop.png  public/favicon.ico  public/apple-touch-icon.png
```

### 2. package.json

Salin dari **cetak biru bagian 4**:

- `next: ^16.3.0`, `react` dan `react-dom`: `^19.2.0`
- `mysql2`, `bcryptjs`, `jose`, `socket.io`, `socket.io-client`, `dotenv`,
  `cross-env`
- devDependencies: `tailwindcss`, `postcss`, `autoprefixer`, `eslint@^9`,
  `eslint-config-next@^16.3.0`
- `"engines": { "node": ">=22" }`
- Script `lint` memanggil `eslint .` — **`next lint` sudah dihapus di
  Next.js 16**

- devDependencies **wajib** `@tailwindcss/forms@^0.5.9` — export desain memuat
  plugin `forms`; tanpanya `input`/`select` tampak berbeda (REFERENSI 7)

**Tambahan yang dibolehkan, dan hanya ini:** `slugify`, `sharp`,
`isomorphic-dompurify`.

Sertakan `jsconfig.json` dari `paket-pendukung/ASET/kerangka/` agar impor `@/components/...`
bekerja.

**Dilarang:** `jsonwebtoken` (digantikan `jose`), paket streaming apa pun,
paket lain tanpa izin.

**Periksa rilis keamanan terbaru sebelum memasang versi.** Angka di atas benar
per akhir Agustus 2026. Laporkan versi persis yang kamu pasang, dan jalankan
`npm audit`.

### 3. next.config.mjs

- **JANGAN** `output: 'standalone'` (cetak biru bagian 6 catatan 1)
- Kerangka `headers()` untuk header keamanan — diisi lengkap di Tahap 9
- `images` untuk berkas lokal di `public/unggahan`

### 4. proxy.js — bukan middleware.js

**Salin `paket-pendukung/ASET/kerangka/proxy.js` apa adanya.** Isinya: fungsi `proxy` yang
menyetel header uji `x-uji-proxy`, fungsi `urlDariHeader()` (penangkal
jebakan `request.url`, REFERENSI 16.8), logika Tahap 2 dalam komentar, dan
`matcher` yang sudah mengecualikan `fonts` dan `unggahan`.

Logika sesungguhnya diisi di Tahap 2. Yang penting di tahap ini: berkasnya ada,
namanya benar, dan **terbukti dijalankan** (UJI h).

Tiga hal yang mudah salah:

- Fungsi wajib bernama `proxy` atau default export. Berkas yang diganti nama
  tanpa mengganti nama fungsinya melempar galat.
- `runtime` tidak tersedia di berkas proxy; mengisinya melempar galat.
- Bila berkasnya tidak ada, Next.js **tidak** melempar galat — ia hanya
  berjalan tanpa proxy.

### 5. Tailwind — token desain

**Salin `paket-pendukung/ASET/kerangka/tailwind.config.js` dan `paket-pendukung/ASET/kerangka/postcss.config.js`
apa adanya.** Config itu dibangkitkan langsung dari blok `tailwind.config` di
`beranda_warkop_nusantara/code.html` — 47 token warna, 4 radius, 5 spacing,
8 tingkat tipografi dengan `lineHeight`/`fontWeight`/`letterSpacing` — plus
plugin `forms` dan `fontFamily` yang menunjuk ke variabel `next/font`. Sudah
terverifikasi me-render token dengan benar (REFERENSI 7).

Yang boleh kamu ubah hanya `content:` bila menambah folder sumber. **Nilai
token tidak boleh diubah.** Verifikasi dengan membandingkan ulang terhadap
`code.html` (skrip kecil yang mengekstrak blok `tailwind.config` dan
membandingkan objek `colors` — laporkan hasilnya di UJI d).

**Font:** salin `paket-pendukung/ASET/fonts/*.woff2` ke `public/fonts/` dan
`paket-pendukung/ASET/kerangka/font.js` ke `app/font.js`. Lalu di `app/layout.js`:

```js
import { domine, firaSans } from './font';
<html lang="id" className={`${domine.variable} ${firaSans.variable}`}>
```

Jangan memakai `next/font/google` — mengunduh saat build dan gagal di sandbox
tanpa akses ke fonts.gstatic.com. Berkas OFL-nya ikut di `paket-pendukung/ASET/fonts/`;
simpan lisensinya di `public/fonts/`.

**Bila `DESIGN.md` dan `code.html` bertentangan, `code.html` menang.**

### 5b. components/ui/Ikon.js

**Salin `paket-pendukung/ASET/ikon/Ikon.js` ke `components/ui/Ikon.js`.** Berisi jalur SVG
resmi Material Symbols Outlined untuk 77 ikon yang dipakai ZIP (+15 varian
terisi). Seluruh `<span class="material-symbols-outlined">` di layar desain
menjadi `<Ikon nama="..." />` mulai Tahap 2. Jangan menggambar ikon sendiri
(cacat export 4).

### 6. lib/navItems.js

Satu sumber kebenaran menu. **Perhatikan awalan `/staf` pada menu staf** —
konsekuensi segmen bersarang.

```js
export const menuPublik = [
  { label: 'Beranda',            href: '/' },
  { label: 'Tentang Kami',       href: '/tentang' },
  { label: 'Struktur',           href: '/struktur' },
  { label: 'Program',            href: '/program' },
  { label: 'Galeri',             href: '/galeri' },
  { label: 'Kontak & Pengaduan', href: '/kontak' },
  { label: 'Berita',             href: '/berita' },
];

export const menuStaf = [
  { label: 'Dashboard', href: '/staf/dashboard', ikon: 'dashboard',
    peran: ['superadmin','redaktur','penulis','verifikator','pimpinan_wilayah'] },
  { label: 'Kelola Artikel', href: '/staf/artikel', ikon: 'artikel',
    peran: ['superadmin','redaktur','penulis','pimpinan_wilayah'] },
  { label: 'Kelola Pengaduan', href: '/staf/pengaduan', ikon: 'palu',
    peran: ['superadmin','verifikator','pimpinan_wilayah'] },
  // pengurus, program, galeri, pengguna, pengaturan — sesuai REFERENSI 11
];
```

### 7. server.js

**Salin `paket-pendukung/ASET/kerangka/server.js` apa adanya**, lalu buat `lib/socket/server.js`
yang mengekspor `initSocket(httpServer)` — memasang Socket.io pada
`http.Server` yang sama dan menyimpan instance di `globalThis`. Belum ada event;
yang penting kerangkanya ada dan proses menyala. Kerangka ini sudah
terverifikasi menjalankan proxy dan Socket.io bersamaan (REFERENSI 16.7).

### 8. lib/db/index.js

Pool persis **cetak biru bagian 7**, termasuk `timezone: '+07:00'` dan hook
`pool.on('connection')`. Hook itu **tidak boleh dilewat** — penangkal aturan 1.

Belum ada kueri domain. Cukup pool dan `periksaKoneksi()`.

### 9. app/api/health/route.js

Balas **200** dengan status koneksi DB. Bila DB terputus, balas **503**, bukan
200 — healthcheck yang selalu 200 tidak memeriksa apa pun.

```json
{ "status": "sehat", "waktu": "2026-08-31T14:30:00+07:00",
  "basisData": "terhubung", "versi": "0.1.0" }
```

### 10. .env.example

Persis **REFERENSI bagian 13**. Beri komentar penanda pada setiap kelompok:

```
# ===== RAHASIA — tandai "Runtime only" di Coolify =====
# JANGAN "Available at Buildtime". Bila ikut waktu build, nilainya tercetak
# terbuka di log build (cetak biru bagian 11, Pelajaran nomor 2).
```

### 11. .gitignore

`.gitignore` **sudah disediakan** di akar repo (persiapan repo, langkah 0) —
jangan menimpanya dengan bawaan Next.js. Verifikasi isinya memuat minimal:
`.env` dan variannya, `node_modules/`, `.next/`, `_backup*`, `desain/`,
`Warkop_Nusantara.zip`, `LSM_WARKOP.png`, `public/unggahan/*` dengan
pengecualian `.gitkeep`. Tambahkan pola lain hanya bila muncul kebutuhan nyata,
dan catat di laporan.

### 12. Logo dan favicon

**Sudah diturunkan** di `paket-pendukung/ASET/logo/`, dari `LSM_WARKOP.png` yang dipusatkan ke
kanvas persegi:

| Berkas di ASET | Menjadi | Dipakai untuk |
|---|---|---|
| `logo-warkop-512.png` | `public/logo-warkop.png` | navbar, footer, login, sidebar |
| `logo-warkop-1024.png` | `public/logo-warkop-besar.png` | halaman Tentang (filosofi logo), OG |
| `favicon.ico` (16/32/48, potongan burung hantu berlatar cokelat) | `public/favicon.ico` | tab peramban |
| `apple-touch-icon.png` (180) | `public/apple-touch-icon.png` | iOS |
| `og-default.png` (1200×630) | `public/og-default.png` | open-graph bawaan |

`LSM_WARKOP.png` asli (5,7 MB) **tidak** disalin ke `public/` — terlalu besar
untuk disajikan. Simpan hanya turunannya.

### 13. app/uji-desain/page.js

Halaman sementara: seluruh token warna sebagai kotak berlabel nama dan hex,
delapan tingkat tipografi dengan contoh teks Indonesia, contoh radius dan
jarak, **dan seluruh 77 ikon dari `Ikon.js`** (`DAFTAR_IKON`) berlabel nama,
dalam tiga ukuran (`text-sm`, bawaan, `text-3xl`) plus varian `terisi`.

Sertakan juga **satu blok formulir contoh** (input teks, select, textarea,
checkbox) memakai kelas dari `kontak_pengaduan_warkop_nusantara_updated_logo/code.html`
— untuk memastikan plugin `forms` aktif (bandingkan dengan `screen.png`).

Dipakai untuk perbandingan mata di UJI (d), **dihapus di Tahap 9**.

### 14. app/uji-proxy/page.js — sementara

Halaman yang menampilkan nilai header `x-uji-proxy`. Dipakai untuk membuktikan
UJI (j). **Dihapus di Tahap 2** setelah proxy berisi logika sungguhan.

Di `proxy.js`, sisipkan sementara:
```js
const h = new Headers(request.headers);
h.set('x-uji-proxy', 'proxy-berjalan');
return NextResponse.next({ request: { headers: h } });
```

### 15. README.md

Gambaran sistem, prasyarat (Node 22+), cara menjalankan lokal, cara mengisi
`.env`, struktur folder ringkas, dan catatan bahwa penerapan memakai Coolify.

---

## LARANGAN KERAS

| Larangan | Sumber |
|---|---|
| `output: 'standalone'` | Cetak biru bagian 6 catatan 1 |
| CDN Tailwind | Export hanya pratinjau |
| Rahasia di `NEXT_PUBLIC_*` | Cetak biru bagian 5 |
| `!important` | Aturan 4 |
| `100vh` | Aturan 5 |
| Berkas bernama `middleware.js` | Next.js 16 memakai `proxy.js` |
| `next lint` di skrip | Dihapus di Next.js 16 |
| `jsonwebtoken` | Digantikan `jose` |
| Paket streaming | Tidak dipakai sistem ini |
| Mengubah nilai token desain | REFERENSI bagian 7 |

---

## UJI TAHAP 0

**a. Pemasangan** — `npm install` berhasil. Jalankan `npm audit` dan lampirkan
hasilnya. Laporkan versi persis Next.js, React, dan Node yang dipakai.

**b. Dev menyala** — `npm run dev` menyala, Socket.io terpasang tanpa galat.
Lampirkan log awal.

**c. Healthcheck** — `/api/health` balas 200 dengan JSON. Matikan DB → balas
**503**. Nyalakan lagi → pulih 200. Lampirkan ketiga balasan.

**d. Token desain** — buka `/uji-desain`, bandingkan berdampingan dengan
`beranda_warkop_nusantara/screen.png`. Bila lingkunganmu tidak punya peramban,
katakan begitu dan ganti dengan verifikasi numerik CSS produksi (jumlah token
yang benar-benar ter-render) plus penghitungan piksel pada `screen.png`.

**e. Font** — Domine dan Fira Sans dimuat lewat `next/font/local` dari
`public/fonts/`, tanpa permintaan ke fonts.googleapis.com / fonts.gstatic.com.
Bukti: `grep -c "fonts.g" .next/server/app/index.html` → 0, dan tag
`<link rel="preload" ... woff2>` ada di HTML produksi. Lampirkan keduanya.

**f. Build** — `npm run build` berhasil. **Turbopack adalah bundler bawaan di
Next.js 16** — laporkan bila ada peringatan terkait bundler.

**g. Lint** — `npm run lint` berjalan. Pastikan tidak ada rujukan ke `next lint`.

**h. UJI PROXY BERJALAN DI CUSTOM SERVER — wajib, konfirmasi**

Sudah dibuktikan pada 31 Agustus 2026 (REFERENSI 16.7). Ulangi di lingkunganmu:

1. Jalankan lewat `npm run dev` (custom server, **bukan** `next start`)
2. `curl -i http://localhost:3000/uji-proxy`
3. Halaman harus menampilkan `x-uji-proxy: proxy-berjalan`

Lampirkan keluaran curl **apa adanya**. Ulangi pada build produksi
(`npm run build` lalu `npm start`) dan pastikan `next build` mencetak baris
`ƒ Proxy (Middleware)`.

Hasil yang diharapkan: **berjalan** di keduanya. Bila **tidak**, laporkan versi
Next.js persis yang terpasang dan keluaran lengkapnya — jangan menyembunyikan
hasil negatif dan jangan melanjutkan ke Tahap 2 sebelum dibahas.

**h2. Jebakan `request.url`** — tambahkan sementara di proxy:
`res.headers.set('x-diag-url', request.url)`, lalu
`curl -i -H "Host: staf.warkop.test" http://localhost:3000/uji-proxy`.
Nilai `x-diag-url` **akan** berisi `0.0.0.0:3000`, bukan `staf.warkop.test` —
itu yang dibuktikan REFERENSI 16.8. Lampirkan sebagai pengingat untuk Tahap 2,
lalu hapus header diagnosanya.

**i. Penelusuran larangan** — telusuri seluruh proyek, hasilnya harus nihil:
```
output:\s*['"]standalone['"]
cdn\.tailwindcss\.com
!important
100vh
middleware\.js
next lint
jsonwebtoken
```

**j. Rahasia** — `.env` masuk `.gitignore`, `_backup*` masuk `.gitignore`,
tidak ada nilai rahasia ter-commit.

**k. Logo** — `public/logo-warkop.png`, `favicon.ico`, `apple-touch-icon.png`
terpasang dari `paket-pendukung/ASET/logo/` dan tersaji (`curl -I` masing-masing → 200).
Ukuran berkas masuk akal (< 400 KB untuk logo utama). Lampirkan bukti.

**l. Struktur rute** — konfirmasikan `app/(staf)/staf/` memakai segmen
bersarang, sehingga `/program` dan `/staf/program` tidak akan menabrak nanti.

**m. Ikon** — `/uji-desain` me-render 77 SVG (`grep -c 'viewBox="0 -960 960 960"'`
pada HTML-nya ≥ 77) dan **tidak ada** teks `material-symbols-outlined` di HTML.

**n. Plugin forms aktif** — CSS produksi memuat aturan reset
`input:where(:not([type]))` dari `@tailwindcss/forms`
(`grep -c "input:where" .next/static/chunks/*.css` ≥ 1).

---

## BENTUK KELUARAN (Claude Code)

Kerjakan **langsung di repo ini** — tidak ada paket perubahan, tidak ada
apply.ps1. Di akhir tahap:

1. Seluruh berkas tahap ini sudah ada di tempatnya dan `npm run build` hijau.
2. Tulis `laporan/LAPORAN-TAHAP-00.md` (isi sesuai bagian LAPORAN di bawah).
   Bukti uji (keluaran curl, keluaran uji-kesetiaan, tangkapan bila ada) masuk
   `laporan/bukti-tahap-00/` dan dirujuk dari laporan.
3. `git add -A` lalu `git commit -m "Tahap 00: <ringkasan satu baris>"`.
   Jangan push tanpa diminta pemilik.
4. MODE GERBANG: berhenti, tunggu pemilik memeriksa laporan. MODE OTONOM:
   verifikasi gerbang-mandiri (ALUR bagian 7.2), perbarui laporan/STATUS.md,
   lalu langsung lanjut tahap berikutnya.

## LAPORAN — isi `laporan/LAPORAN-TAHAP-00.md`

1. Daftar berkas yang dibuat, dikelompokkan menurut fungsi
2. Versi persis Next.js, React, Node, dan hasil `npm audit`
3. Hasil seluruh butir UJI TAHAP (a sampai n, termasuk h2) dengan bukti
4. **Hasil UJI PROXY (butir h dan h2)** — keluaran curl apa adanya, dev dan produksi
5. **KEPUTUSAN BARU** bila ada
6. Hal yang sengaja belum dikerjakan, beserta tahap yang akan mengerjakannya
7. Pertentangan antara cetak biru dan REFERENSI bila ditemukan

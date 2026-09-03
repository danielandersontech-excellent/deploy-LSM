# LAPORAN TAHAP 02 — AUTENTIKASI DAN PERAN

Tanggal: 3 September 2026 · Mode: OTONOM · Bukti: `laporan/bukti-tahap-02/`
(skrip uji yang bisa dijalankan ulang: `laporan/bukti-tahap-02/skrip/`)

## Ringkasan

Empat lapisan penjaga berdiri dan dibuktikan lewat curl tanpa UI. Inti tahap:
**lapisan 4** — setiap route staf yang ada membalas **403** untuk peran tidak
berhak dan **401** tanpa/dengan token palsu (tabel bagian 2), **pemisahan host**
menghasilkan `Location` **harfiah** `https://staf.warkop.test/…` (nol
`0.0.0.0`/`localhost`, bagian 3), identitas pelapor tidak pernah keluar ke
peran tidak berhak (JSON mentah), dan halaman login **100 % kelas desain**
dengan sisa cacat export nol. Keempat belas butir uji a–n lulus dengan bukti.

## 1. Empat lapisan dan letaknya di kode

| Lapisan | Letak | Fungsi | Sifat |
|---|---|---|---|
| 1 Login | `app/api/auth/login/route.js` | bcrypt.compare (selalu dijalankan, hash penampung untuk email tak terdaftar → waktu setara), JWT `jose` HS256 (`lib/auth/jwt.js`: `sub`, `peran`, `wilayah_id`, `tv`), cookie `warkop_token` httpOnly+sameSite=lax+secure, `terakhir_masuk` dari aplikasi, `audit_log`, rate limit dua sumbu | gerbang |
| 2 Proxy | `proxy.js` | pemisahan host (hanya bila `STAF_HOST`), verifikasi **tanda tangan** JWT (jose diimpor langsung, tanpa modul bersama, tanpa DB), header `x-user-id`/`x-user-role` (header kiriman klien dihapus dulu), `/staf/*` tanpa token → `/login?lanjut=`, `/login` bertoken → dashboard; semua URL absolut lewat `urlDariHeader()` | **kenyamanan** |
| 3 requireUser | `lib/auth/penjaga.js` → dipakai `app/(staf)/staf/layout.js` | `ambilPenggunaSesi()` (`lib/auth/sesi.js`): cookie → JWT → **DB**: `aktif` dan `token_version` harus cocok; gagal → `/login`; peran asing → `/tanpa-akses` | pagar |
| 4 requireRole | `lib/auth/penjaga.js` → `denganPeran([...peran], handler)` di **setiap** route API staf | sesi diverifikasi ke DB lalu peran dicocokkan dengan `lib/auth/hakAkses.js` (matriks REFERENSI 11, acuan tunggal); 401/403 JSON seragam | **pagar utama** |

Berkas lain: `lib/auth/hakAkses.js` (HAK, `bolehLihatIdentitas`,
`wilayahTerbatas`), `lib/auth/pembatasLaju.js`, `app/api/auth/{logout,saya}`,
`app/api/staf/{artikel,pengaduan,pengaduan/[id],statistik}/route.js` (GET),
`app/(auth)/login/page.js` + `components/staf/FormulirLogin.js`,
`app/(auth)/tanpa-akses/page.js` (403), `app/(staf)/staf/dashboard/page.js`
(penampung Tahap 7), `lib/db/users.js` +`ambilUserUntukSesi`. **Dihapus:**
`app/uji-proxy/page.js` dan header `x-uji-proxy` (proxy Tahap 0);
`urlDariHeader()` dipertahankan.

## 2. Tabel uji hak akses (butir c) — bukti `a-b-c-d-e-g-h-i-j-curl.txt`

Semua lewat `curl.exe`, tanpa membuka UI. Route ditulis relatif `http://localhost:3000`.

| Route | Metode | Peran penguji | Kode | Lulus |
|---|---|---|---|---|
| /api/staf/artikel | GET | verifikator | 403 | ya |
| /api/staf/pengaduan | GET | penulis | 403 | ya |
| /api/staf/pengaduan | GET | redaktur | 403 | ya |
| /api/staf/pengaduan/2 | GET | penulis | 403 | ya |
| /api/staf/pengaduan/2 | GET | redaktur | 403 | ya |
| /api/staf/statistik | GET | (tanpa cookie) | 401 | ya |
| /api/staf/artikel | GET | (tanpa cookie) | 401 | ya |
| /api/staf/pengaduan | GET | (tanpa cookie) | 401 | ya |
| /api/auth/saya | GET | (tanpa cookie) | 401 | ya |
| /api/staf/statistik | GET | token palsu (tanda tangan salah) | 401 | ya |
| /api/staf/statistik | GET | header `x-user-role: superadmin` disuntik tanpa cookie | 401 | ya |
| /api/staf/artikel | GET | penulis (berhak) | 200 | pembanding |
| /api/staf/pengaduan | GET | verifikator (berhak) | 200 | pembanding |
| /api/staf/pengaduan/2 | GET | superadmin (berhak) | 200 | pembanding |
| /api/staf/statistik | GET | redaktur (berhak) | 200 | pembanding |

`/api/staf/statistik` terbuka untuk seluruh peran staf (REFERENSI 12) — tidak
ada peran staf yang tidak berhak, jadi diuji tanpa cookie dan dengan token palsu.

**Menyusul** (belum dibuat, akan diuji di tahapnya): POST/PATCH/DELETE artikel
dan `terbitkan` (Tahap 5); POST `pengaduan/[id]/status`, POST `/api/pengaduan`,
`/lacak` (Tahap 6); pengurus, program, galeri, pengguna, pengaturan, unggah
(Tahap 7). Uji otomatis `uji-l-route-tanpa-penjaga.mjs` akan menangkap route
baru yang lupa penjaga.

## 3. Uji pemisahan host (butir f) — bukti `f-pemisahan-host.txt`

Server `STAF_HOST=staf.warkop.test`; curl mengirim `Host`, `X-Forwarded-Host`,
`X-Forwarded-Proto: https` (meniru Traefik). `Location` **harfiah**:

| Uji | Hasil |
|---|---|
| `Host: warkop.test` → `/staf/dashboard` | 307 `location: https://staf.warkop.test/staf/dashboard` |
| `Host: warkop.test` → `/login` | 307 `location: https://staf.warkop.test/login` |
| `Host: staf.warkop.test` → `/tentang` | 307 `location: https://staf.warkop.test/staf/dashboard` |
| `Host: staf.warkop.test` → `/` | 307 `location: https://staf.warkop.test/staf/dashboard` |
| `Host: staf.warkop.test` → `/staf/dashboard` tanpa token | 307 `location: https://staf.warkop.test/login?lanjut=%2Fstaf%2Fdashboard` |
| `Host: warkop.test` → `/api/health` | 200 tanpa token |
| `Host: staf.warkop.test` → `/api/health` | 200 tanpa token |
| `Host: staf.warkop.test` → `/login` | 200 (halaman login) |
| `STAF_HOST` kosong, `/staf/dashboard` di localhost tanpa token (bukti e) | 307 `location: http://localhost:3000/login?lanjut=%2Fstaf%2Fdashboard` |

Terprogram: kemunculan `0.0.0.0` di Location = **0**, `localhost` = **0** (dari 5 baris Location).

## 4. Hasil keempat belas butir UJI TAHAP 2

| Butir | Hasil | Bukti |
|---|---|---|
| a. Login berhasil | LULUS — 200 + `Set-Cookie: warkop_token=…; HttpOnly; SameSite=lax; Max-Age=28800`; `/staf/dashboard` dengan cookie → 200 "Masuk sebagai Superadmin"; `/login` bertoken → 307 dashboard. Tab Application tidak tersedia (tanpa peramban): flag HttpOnly terlihat di header | `a-b-c-d-e-g-h-i-j-curl.txt` |
| b. Login gagal | LULUS — email tak terdaftar dan sandi salah: `401 {"galat":"Email atau kata sandi tidak sesuai","kode":"KREDENSIAL_TIDAK_SESUAI"}` **identik** | idem |
| **c. Lapisan 4** | **LULUS** — tabel bagian 2 | idem |
| d. token_version | LULUS — token sah → 200; `UPDATE users SET token_version+1` → token lama: `/api/auth/saya` 401, `/api/staf/artikel` 401, `/staf/dashboard` 307 → `/login` (proxy meloloskan tanda tangan; lapisan 3/4 menolak); login ulang 200 | idem |
| e. Staf tanpa cookie | LULUS — 307 `http://localhost:3000/login?lanjut=%2Fstaf%2Fdashboard` | idem |
| **f. Pemisahan host** | **LULUS** — tabel bagian 3 | `f-pemisahan-host.txt` |
| g. Penyaringan wilayah | LULUS — pimpinan Sumut: total 0, `/pengaduan/1` (Jabar) → **404**; pimpinan Jabar: total 1 (WRP-009021), `/pengaduan/2` (DKI) → 404; artikel Jabar 3; SQL yang dijalankan: **10** kueri pengaduan/artikel semuanya `WHERE … wilayah_id = ?` [3]/[13], **0** tanpa | `g-sql-log.txt`, curl |
| h. Identitas pelapor | LULUS — JSON pimpinan_wilayah: 0 kunci identitas; redaktur → 403 (tidak punya hak pengaduan sama sekali); pembanding verifikator: 4 kunci + baris `audit_log lihat_identitas_pelapor` tercatat; SQL pimpinan_wilayah tanpa `nama_pelapor` | idem |
| i. Rate limit | LULUS — 20× gagal dari IP 203.0.113.9 → ke-21 **429** (`cobaLagiDetik: 890`); pemilik sah dari IP lain dengan sandi benar → **200** (akun tidak terkunci); IP penyerang dengan sandi benar → 429 | curl |
| j. Cookie aman | LULUS — `HttpOnly; SameSite=lax; Path=/; Max-Age=28800`; dengan `X-Forwarded-Proto: https` (Traefik) / produksi: **`Secure`** ikut; logout → `Max-Age=0` | curl |
| k. Kesetiaan login | LULUS — kelas desain 79/79 (**100 %**), token 18/18, cacat export **semua 0**; 1 "teks hilang" = `Masuk Sistem login` (nama ikon bocor ikut terbaca sebagai teks di desain; render: "Masuk Sistem" + SVG) | `k-kesetiaan-login.txt`, `k-login-render.html` |
| l. Route tanpa penjaga | LULUS — 8 `route.js`: 4 terjaga (`denganPeran`), 4 publik beralasan, **0 tanpa penjaga** | `l-route-penjaga.txt` |
| m. `await` lengkap | LULUS — 6 pemakaian `cookies()/headers()/params/searchParams`, semua `await`; nihil tanpa | `m-await.txt` |
| n. Build & lint | LULUS — `eslint .` 0 masalah; `next build` hijau, `ƒ Proxy (Middleware)` | `n-build-lint.txt` |

## 5. Keluaran `uji-kesetiaan.mjs` halaman login (butir k)

```
Kelas desain       : 79
Ditemukan di render: 79  (100%)
Kelas hilang       : 0
Token desain dipakai desain : 18 | Token hilang di render : 0
Teks tampak desain : 6   hilang di render: 1
  Masuk Sistem login
Sisa cacat export di render (semua HARUS 0):
  ikonSebagaiTeks 0  googleusercontent 0  cdnTailwind 0  fontsGoogleapis 0  important 0  seratusVh 0  hrefKosong 0
HASIL: tidak ada cacat export tersisa.
```

Perubahan yang dilakukan (semuanya dari enam jenis REFERENSI 18.2): (a) 4 span
ikon → `<Ikon>` (`admin_panel_settings` terisi, `badge`, `key`, `login`);
(b) `<img>` watermark googleusercontent → `next/image` `/logo-warkop-besar.png`;
(c) `href="#"` "Lupa Kata Sandi?" → `/kontak` (KEPUTUSAN BARU: tidak ada alur
setel-ulang sandi di dokumen; mengarah ke kontak lembaga); (f) `class`→
`className`, `for`→`htmlFor`. Kelas `<body>` desain dipindahkan ke pembungkus
`<div>` karena `<body>` akar dipakai bersama seluruh situs. Kelas non-Tailwind
`.paper-shadow` dan `.watermark` dari `<style>` export **disalin apa adanya** ke
`app/globals.css` (menentukan bayangan kartu dan opasitas 0,05 watermark).
Kelas `rounded-DEFAULT` (2×) dipertahankan verbatim walau tidak dibangkitkan
Tailwind (cacat export serupa nomor 8). Peramban tidak tersedia: perbandingan
berdampingan 375/768/1280 **tidak dilakukan**; `screen.png` (1280×644,
terpotong) dilihat dengan alat gambar dan cocok dengan struktur `code.html`.

## 6. KEPUTUSAN BARU

1. **Strategi `token_version`** — proxy hanya memverifikasi tanda tangan dan
   kedaluwarsa JWT (tanpa DB, sesuai larangan kueri di proxy). Pemeriksaan
   `token_version` + `aktif` terhadap DB dilakukan di `ambilPenggunaSesi()`
   yang dipanggil lapisan 3 (layout) dan lapisan 4 (`denganPeran` di setiap
   route) — satu kueri ringan per permintaan, di-`cache()` React sehingga
   layout + halaman dalam satu render hanya memeriksa sekali. Bukti d: token
   lama lolos proxy tetapi ditolak lapisan 3/4.
2. **Rate limit dua sumbu di memori proses** (`lib/auth/pembatasLaju.js`):
   per IP 20 gagal/15 menit → 429; per akun 30 gagal/15 menit dari IP mana pun
   → 429 sementara (bukan kunci permanen), login berhasil menghapus hitungan
   akun. Pemilik sah dari IP lain tetap masuk saat akunnya diserang (bukti i);
   gangguan terburuk bagi pemilik = 15 menit saat serangan terdistribusi
   >30 IP. Penyimpanan bersama (Redis) tidak dipakai — paket di luar daftar dan
   arsitektur satu container.
3. **`requireRole` sulit terlupa: dua mekanisme** — pembungkus `denganPeran()`
   (sesi + peran + galat seragam) **dan** uji otomatis
   `uji-l-route-tanpa-penjaga.mjs` yang menelusuri seluruh `app/api/**/route.js`
   dan gagal bila route non-publik tidak memakai `denganPeran`/`requireRole`;
   daftar route publik di skrip itu = REFERENSI 12 + route auth. Dijalankan
   ulang di Tahap 5–9.
4. **Cookie `secure` bersyarat**: `true` bila `NODE_ENV=production` atau
   `X-Forwarded-Proto: https`; di dev `http://localhost` tanpa `Secure` agar
   curl/peramban tetap bisa masuk. Di produksi selalu `Secure` (bukti j).
5. **IP klien** dibaca dari `cf-connecting-ip` → `x-forwarded-for` (pertama) →
   `x-real-ip`. Header ini dapat dipalsukan bila aplikasi terekspos langsung
   tanpa proxy; di arsitektur cetak biru (Cloudflare → Traefik) `cf-connecting-ip`
   tepercaya. Tahap 9 meninjau ulang (mis. hanya menerima dari Traefik).
6. **Waktu balasan login setara**: `bcrypt.compare` selalu dijalankan
   (hash penampung untuk email tak terdaftar / hash `'!'`), pesan 401 satu
   kalimat untuk ketiga kasus (email, sandi, nonaktif); alasan sebenarnya hanya
   ke `audit_log.detail`.
7. **Halaman 403 = `/tanpa-akses`** (`app/(auth)/tanpa-akses/page.js`), cetakan
   kartu login (REFERENSI 18.4); tautan kembali ke `/staf/dashboard` bila ada
   sesi, `/login` bila tidak. Ikon `security` (nama `lock` tidak ada di 77 ikon).
8. **`?lanjut=`** pada pengalihan ke `/login` (hanya jalur `/staf/*` yang
   diterima) agar pengguna kembali ke halaman semula.
9. **Matcher proxy** ditambah `logo-warkop-besar.png|og-default.png|penampung`
   agar aset publik tidak dialihkan ke dashboard di host staf.
10. **`/api/staf/pengaduan/[id]`** mencatat `audit_log` `lihat_identitas_pelapor`
    setiap kali superadmin/verifikator membuka pengaduan bernama (REFERENSI 11
    catatan 2), sudah aktif sejak tahap ini (bukti h).
11. **Route GET yang dibuat lebih awal** (`/api/staf/artikel`, `/api/staf/pengaduan`,
    `/api/staf/pengaduan/[id]`, `/api/staf/statistik`) karena uji c/g/h
    memerlukannya; POST/PATCH/DELETE menyusul di tahapnya.
12. **Akun uji `pimpinan.jabar@warkopnusantara.id`** (pimpinan_wilayah Jawa
    Barat) dibuat lewat `lib/db` oleh `siapkan-akun-uji.mjs` untuk uji g;
    hanya di basis data lokal.

## 7. Route yang belum ada penjaganya karena belum dibuat

| Route | Tahap |
|---|---|
| POST `/api/staf/artikel`, PATCH/DELETE `/api/staf/artikel/[id]`, POST `…/terbitkan` | 5 |
| GET `/api/artikel`, `/api/artikel/[slug]` (publik) | 5 |
| POST `/api/pengaduan`, GET `/api/pengaduan/lacak/[nomor]` (publik, rate-limited) | 6 |
| POST `/api/staf/pengaduan/[id]/status`, `/api/staf/unggah` | 6 |
| `/api/staf/pengurus`, `program`, `galeri`, `pengguna`, `pengaturan` | 7 |

## 8. Temuan

1. **curl + cookie `Secure` di http://localhost**: saat login dikirim dengan
   `X-Forwarded-Proto: https`, cookie ber-`Secure` dan curl menolak mengirimnya
   kembali lewat `http://` — permintaan berikutnya 401. Ini perilaku curl, bukan
   aplikasi; uji g diulang tanpa header proto. Di produksi seluruh lalu lintas
   HTTPS sehingga tidak terjadi.
2. **Node 24.12 di Windows** mencetak `Assertion failed: !(handle->flags &
   UV_HANDLE_CLOSING)` saat `uji-kesetiaan.mjs` keluar setelah `fetch` URL
   (hasil uji sudah lengkap tercetak). Dihindari dengan menyimpan render ke
   berkas lalu menguji berkas itu.
3. `id` akun uji baru = 22 (bukan 7): `INSERT IGNORE` pada seed yang diulang
   tetap mengonsumsi nilai auto-increment InnoDB — tidak berdampak.
4. `pengaduan.dibuat_pada` tampil di JSON sebagai `2026-09-02T07:30:00.000Z`
   (Date → ISO UTC oleh `JSON.stringify`); nilai tersimpan `14:30 WIB` — benar
   (07:30Z = 14:30 WIB). Tampilan WIB memakai `formatTanggalID()` di Tahap 4+.

## 9. Cara menguji ulang (pemilik)

```powershell
cd D:\Deploy\LSM
node laporan\bukti-tahap-02\skrip\uji-l-route-tanpa-penjaga.mjs   # 0 tanpa penjaga
node laporan\bukti-tahap-02\skrip\uji-m-await.mjs                  # 0 tanpa await
npm run dev                                                        # jendela lain:
bash laporan\bukti-tahap-02\skrip\uji-curl-tahap-02.sh             # a,b,c,d,e,g,h,i,j (Git Bash)
# pemisahan host: hentikan dev, lalu
$env:STAF_HOST='staf.warkop.test'; npm run dev
curl.exe -i -H "Host: warkop.test" -H "X-Forwarded-Proto: https" http://localhost:3000/staf/dashboard   # Location https://staf.warkop.test/...
```

`package.json` **tidak berubah**.

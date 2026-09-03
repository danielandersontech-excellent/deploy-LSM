# MULAI DI SINI — menjalankan pembangunan dengan Claude Code

Panduan untuk **kamu** (pemilik). Claude Code membaca `CLAUDE.md` sendiri;
berkas ini berisi persiapan, prompt siap-tempel per tahap, dan apa yang kamu
periksa sebelum mengetik "lanjut".

---

## 1. Persiapan sekali saja

**Prasyarat di laptop:** Node 22+ (`node -v`), Git, **Docker Desktop**
(untuk MariaDB lokal mulai Tahap 1 — pastikan menyala), dan Claude Code.

**Isi `D:\Deploy\LSM` harus seperti ini sebelum mulai:**

```
D:\Deploy\LSM\
  CLAUDE.md                  <- dari paket ini
  MULAI-DI-SINI.md           <- berkas ini
  .gitignore                 <- dari paket ini
  dokumen\                   <- dari paket ini (cetak biru, REFERENSI, alur, TAHAP-00..09)
  paket-pendukung\           <- dari paket ini (ASET + UJI)
  laporan\                   <- dari paket ini (kosong, diisi Claude Code)
  Warkop_Nusantara.zip       <- sudah ada di tempatmu
  LSM_WARKOP.png             <- sudah ada di tempatmu
```

Caranya: ekstrak `WARKOP-CLAUDE-CODE.zip` **langsung ke dalam** `D:\Deploy\LSM`
(isinya sudah tanpa folder pembungkus). Kedua berkas desain/logo biarkan di
tempatnya.

`desain/` belum ada — Tahap 0 yang mengekstraknya dari `Warkop_Nusantara.zip`.

**Jalankan Claude Code dari folder itu:**

```powershell
cd D:\Deploy\LSM
claude
```

**Soal izin ("akses penuh"):** kamu tidak perlu mode tanpa-konfirmasi untuk
seluruh laptop. Cukup izinkan Claude Code membaca/menulis/menjalankan perintah
**di dalam folder proyek ini** (setujui saat diminta, atau atur lewat
`/permissions`). `CLAUDE.md` sudah melarangnya menyentuh apa pun di luar repo,
`git push`, atau deploy tanpa perintahmu — tapi izin yang sempit tetap pagar
terbaik. Perintah yang menghapus banyak berkas atau memasang program global:
baca dulu sebelum menyetujui.

---

## 2A. MODE OTONOM — satu prompt, jalan sendiri Tahap 00–09

Pilihanmu saat ini. Gerbang manusia diganti gerbang-mandiri berbasis bukti
berkas (ALUR bagian 7); jejaknya tetap utuh: satu commit per tahap +
`laporan/LAPORAN-TAHAP-XX.md` + `laporan/STATUS.md`.

**Sebelum menekan Enter:** Docker Desktop MENYALA (dibutuhkan Tahap 1),
laptop tercolok listrik dan tidak sleep, disk lega (build + image Docker
butuh beberapa GB). Dan supaya benar-benar tanpa klik, sesi harus dalam mode
izin otomatis — jalankan `claude` lalu aktifkan auto-accept, atau
`claude --dangerously-skip-permissions`. Jujur soal risikonya: mode itu
melepas pagar konfirmasi; yang tersisa hanya aturan `CLAUDE.md` (dilarang
keluar repo, push, deploy). Jangan pakai mode itu di mesin berisi hal
sensitif lain.

**Prompt tunggalnya — salin-tempel apa adanya:**

```
MODE OTONOM. Baca CLAUDE.md dan dokumen/ALUR-KERJA-CLAUDE-CODE.md sampai
selesai (terutama bagian 7 MODE OTONOM), lalu kerjakan
dokumen/TAHAP-00-FONDASI.md sampai dokumen/TAHAP-09-PENGERASAN-PRODUKSI.md
berurutan tanpa menunggu persetujuanku antar tahap.

Keputusan pemilik sudah final di dokumen — jangan bertanya lagi: lima peran
staf dipakai apa adanya; unggahan = volume lokal; seed 12 artikel sesuai
TAHAP-01; domain belum ada, jadi Tahap 3 kerjakan bagian lokalnya, tandai
butir server MENUNGGU PEMILIK di laporan/STATUS.md, lanjut Tahap 4.

Gerbang-mandiri 7.2 berlaku penuh: setiap butir uji harus punya berkas bukti
di laporan/bukti-tahap-XX/, pemeriksaan kritis diverifikasi terprogram, dan
dilarang menurunkan ambang atau menulis LULUS tanpa bukti. Berhenti hanya
pada kondisi 7.3 (BLOKIR setelah 3 upaya, prasyarat mati, atau butuh
push/kredensial/paket baru) — tulis alasannya di STATUS.md.

Perbarui laporan/STATUS.md setiap mulai/selesai tahap. Bila sesi ini
terputus, prompt yang sama akan dikirim ulang: baca STATUS.md dan git log,
lanjutkan dari tahap pertama yang belum LULUS, jangan ulangi yang sudah.
```

**Bila terputus** (laptop mati, sesi habis): buka `claude` lagi di folder yang
sama dan tempel prompt yang sama persis — ia melanjutkan, bukan mengulang.

**Setelah run selesai, tinjauanmu pindah ke akhir (jangan dilewati):**
1. `laporan/STATUS.md` — semua LULUS? Ada BLOKIR / MENUNGGU PEMILIK?
2. `git log --oneline` — ±1 commit per tahap.
3. Bukti gerbang terpenting: Tahap 4 keluaran uji-kesetiaan per halaman +
   alasan kelas hilang; Tahap 6 bukti anonim (baris DB + JSON); Tahap 2 nilai
   `Location`; Tahap 8 muatan socket.
4. Buka situsnya, sandingkan dengan `screen.png` — matamu gerbang terakhir.
5. Artikel seed = KONTEN CONTOH; wajib ditinjau redaksi sebelum publik.

---

## 2. Prompt per tahap (MODE GERBANG — alternatif, tahap demi tahap)

Satu tahap = satu prompt. Tunggu laporan + commit, periksa gerbang (bagian 3),
baru kirim prompt berikutnya. Kalau sesi terputus di tengah tahap, buka lagi
`claude` di folder yang sama dan tempel: *"Lanjutkan TAHAP-XX yang belum
selesai. Baca laporan/ dan git log untuk tahu posisi terakhir, lalu teruskan."*

**Tahap 0 — Fondasi** *(termasuk ekstrak desain & git init)*

```
Baca CLAUDE.md dan dokumen/ALUR-KERJA-CLAUDE-CODE.md sampai selesai, lalu
kerjakan dokumen/TAHAP-00-FONDASI.md seluruhnya, mulai dari bagian
"0. Persiapan repo". Ikuti Protokol Konversi Layar (REFERENSI bagian 18) untuk
halaman uji-desain. Tutup tahap sesuai alur: seluruh UJI TAHAP dijalankan
sungguhan, laporan/LAPORAN-TAHAP-00.md, build hijau, satu commit, lalu berhenti.
```

**Tahap 1 — Basis data** *(nyalakan Docker Desktop dulu)*

```
Kerjakan dokumen/TAHAP-01-BASIS-DATA.md seluruhnya. MariaDB 11 dijalankan
lokal lewat Docker. Jangan lanjut ke tahap lain. Tutup tahap sesuai
dokumen/ALUR-KERJA-CLAUDE-CODE.md.
```

**Tahap 2 — Autentikasi**

```
Kerjakan dokumen/TAHAP-02-AUTENTIKASI.md seluruhnya. Perhatikan dua fakta di
bagian "BACA DULU" — semua pengalihan lewat urlDariHeader, dan UJI f memeriksa
nilai Location secara harfiah. Tutup tahap sesuai alur.
```

**Tahap 3 — Docker & penerapan** *(butuh: domain + server Coolify siap; push
dan deploy akan kuperintahkan eksplisit saat kamu minta)*

```
Kerjakan dokumen/TAHAP-03-DOCKER-PENERAPAN.md seluruhnya. Berhenti dan tanya
aku sebelum git push atau menyentuh Coolify.
```

**Tahap 4 — Situs publik** *(tahap terberat untuk kemiripan UI)*

```
Kerjakan dokumen/TAHAP-04-SITUS-PUBLIK.md seluruhnya. Setiap halaman WAJIB
lewat Protokol Konversi Layar (REFERENSI 18): baca code.html utuh dari desain/,
salin DOM dan kelas apa adanya, hanya enam perubahan yang diizinkan, navbar/
footer dari markup kanonik 18.3, lalu jalankan
paket-pendukung/UJI/uji-kesetiaan.mjs per halaman dan tulis alasan tiap kelas
yang hilang. Tutup tahap sesuai alur.
```

**Tahap 5 — Modul berita**

```
Kerjakan dokumen/TAHAP-05-MODUL-BERITA.md seluruhnya. Protokol Konversi Layar
untuk kelima layar, uji-kesetiaan per halaman. Tutup tahap sesuai alur.
```

**Tahap 6 — Modul pengaduan** *(tahap terpenting — identitas pelapor)*

```
Kerjakan dokumen/TAHAP-06-MODUL-PENGADUAN.md seluruhnya. Uji anonim wajib
dibuktikan sampai isi baris di basis data. Tutup tahap sesuai alur.
```

**Tahap 7 — Ruang staf**

```
Kerjakan dokumen/TAHAP-07-RUANG-STAF.md seluruhnya. Sidebar dari markup
kanonik, dashboard lewat Protokol Konversi Layar. Tutup tahap sesuai alur.
```

**Tahap 8 — Realtime**

```
Kerjakan dokumen/TAHAP-08-REALTIME.md seluruhnya. Klien socket menyambung
same-origin. Muatan socket mentah wajib dilampirkan di bukti. Tutup tahap
sesuai alur.
```

**Tahap 9 — Pengerasan & kesiapan produksi**

```
Kerjakan dokumen/TAHAP-09-PENGERASAN-PRODUKSI.md seluruhnya. Sikap tahap ini:
cari cacat pada pekerjaanmu sendiri dan laporkan apa adanya, termasuk tabel
uji kesetiaan 14 layar pada build produksi. Tutup tahap sesuai alur.
```

---

## 3. Gerbang: yang kamu periksa sebelum "lanjut"

Setiap tahap: buka `laporan/LAPORAN-TAHAP-XX.md`, jalankan `git show --stat`,
dan `npm run build` sendiri sesekali. Bukti minimum per tahap ada di
`dokumen/ALUR-KERJA-CLAUDE-CODE.md` bagian 3 — intinya:

- **Tahap 0**: keluaran curl butir h/h2 apa adanya (bukan kalimat "lulus").
- **Tahap 2**: tabel `Location` — tidak boleh ada `0.0.0.0`.
- **Tahap 4/5/7/9**: keluaran `uji-kesetiaan.mjs`; setiap kelas hilang ada
  alasannya; sisa cacat export nol.
- **Tahap 6/8**: bukti identitas pelapor tidak bocor (Network, DB, socket).

Kalimat pengecekan yang ampuh kalau laporan terasa terlalu mulus:
*"Tunjukkan keluaran perintah untuk butir <X> apa adanya, jangan diringkas."*

---

## 4. Tiga keputusanmu (REFERENSI, Lampiran paling bawah)

1. **Domain** — perlu sebelum Tahap 3.
2. **Lima peran staf** (superadmin, redaktur, penulis, verifikator,
   pimpinan_wilayah) — terkunci di Tahap 1. Kalau cocok, tak perlu apa-apa;
   kalau mau ubah, bilang ke Claude Code **sebelum** prompt Tahap 1.
3. **Penyimpanan unggahan** — bawaan: volume lokal; bisa ditunda ke Tahap 3.

---

## 5. Hal yang jangan dilakukan

- Jangan minta "kerjakan semua tahap sekaligus" — gerbang antar tahap adalah
  satu-satunya alat kendali mutumu.
- Jangan biarkan `desain/` atau `paket-pendukung/` diubah; kalau Claude Code
  mengusulkan itu, tolak.
- Jangan terima laporan tanpa bukti perintah untuk butir-butir gerbang.
- Jangan `git push` / deploy sebelum Tahap 3 menyuruh dan kamu siap.

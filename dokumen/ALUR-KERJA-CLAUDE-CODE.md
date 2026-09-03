# ALUR KERJA — EDISI CLAUDE CODE

> Menggantikan alur "paket perubahan + apply.ps1" dari v2. Claude Code bekerja
> **langsung di repo** `D:\Deploy\LSM`, jadi keluarannya bukan ZIP — keluarannya
> adalah berkas di tempatnya, laporan, dan commit git yang bisa ditinjau.

---

## 0. Dua mode

- **MODE GERBANG (bawaan)** — bagian 1–6: pemilik memeriksa tiap tahap dan
  mengetik "lanjut".
- **MODE OTONOM** — bagian 7: hanya bila perintah pemilik menyebutnya
  eksplisit. Gerbang manusia diganti gerbang-mandiri berbasis bukti berkas.

## 1. Siklus satu tahap (MODE GERBANG)

```
PEMILIK : "Baca CLAUDE.md, lalu kerjakan dokumen/TAHAP-XX-....md seluruhnya."
              |
CLAUDE  : baca dokumen tahap + rujukan cetak biru/REFERENSI yang disebut
          kerjakan LANGSUNG di repo
          jalankan SELURUH butir UJI TAHAP, simpan bukti di laporan/bukti-tahap-XX/
          tulis laporan/LAPORAN-TAHAP-XX.md
          npm run build  -> WAJIB hijau
          git add -A ; git commit -m "Tahap XX: <ringkasan satu baris>"
          BERHENTI dan sampaikan ringkasan + jalur laporan
              |
PEMILIK : baca laporan, periksa gerbang (bagian 3), lihat `git show --stat`
          puas -> ketik "lanjut" dan beri perintah tahap berikutnya
          belum -> minta perbaikan; perbaikan masuk commit "Tahap XX (perbaikan): ..."
```

**Satu tahap = satu perintah = satu commit** (tahap besar boleh beberapa
commit, tiap commit utuh dan build hijau). Jangan mengerjakan dua tahap dalam
satu perintah walau terasa mudah.

## 2. Yang wajib ada di setiap `laporan/LAPORAN-TAHAP-XX.md`

1. Daftar berkas dibuat/diubah/dihapus, dikelompokkan menurut fungsi
2. Hasil **seluruh** butir UJI TAHAP — lulus/gagal/tidak-bisa + bukti
   (keluaran perintah apa adanya, atau jalur berkas di `laporan/bukti-tahap-XX/`)
3. **KEPUTUSAN BARU** beserta alasannya
4. Hal yang sengaja belum dikerjakan + tahap yang akan mengerjakannya
5. Bagian **"Cara menguji ulang"**: perintah yang bisa dijalankan pemilik
   sendiri untuk memeriksa klaim terpenting tahap itu
6. Disebutkan bila `package.json` berubah

Rincian isi per tahap ada di bagian LAPORAN masing-masing dokumen tahap.

## 3. Gerbang pemilik — bukti minimum sebelum "lanjut"

| Tahap | Wajib dilihat di laporan |
|---|---|
| 0 | Keluaran curl uji proxy (butir h, dev + produksi) dan nilai `x-diag-url` (h2) |
| 1 | Uji zona waktu (3 nilai sama), uji buku besar riwayat |
| 2 | Tabel hak akses via curl semua 403, **nilai `Location`** uji pemisahan host (tanpa `0.0.0.0`) |
| 3 | Log build bersih dari rahasia; proxy terbukti jalan di container |
| 4 | **Keluaran `uji-kesetiaan.mjs` per halaman** + alasan tiap kelas hilang |
| 5 | Uji XSS: muatan tersimpan di DB & ter-render aman |
| 6 | **Uji anonim**: tangkapan Network + isi baris DB (identitas NULL) |
| 7 | Uji daftar putih kunci `pengaturan` |
| 8 | **Muatan socket mentah** (tanpa identitas pelapor) |
| 9 | Tabel 14 aturan + bukti; tabel uji kesetiaan 14 layar |

Cara membaca uji kesetiaan: cakupan 100% **tidak diminta**; yang diminta
sisa cacat export **nol** dan **setiap kelas hilang punya alasan tertulis**
(salah satu dari enam perubahan REFERENSI 18.2 atau komponen kanonik 18.3).
"Cakupan 62%, sisanya perbedaan kecil" tanpa rincian = belum selesai.

Perintah pemeriksaan cepat pemilik:

```powershell
git show --stat            # berkas apa saja yang berubah di commit terakhir
git log --oneline          # satu commit per tahap?
npm run build              # hijau di mesinmu juga
```

## 4. Aturan git

- Commit **hanya** setelah build hijau dan laporan tertulis.
- Pesan: `Tahap XX: <ringkasan>` / `Tahap XX (perbaikan): <apa>`.
- **`git push` hanya atas perintah pemilik** (biasanya menjelang Tahap 3, saat
  Coolify mulai menarik dari GitHub).
- Jangan pernah `git add` berkas rahasia; `.gitignore` sudah mengaturnya —
  jangan dilonggarkan.
- Rusak sebelum commit: `git checkout -- . ; git clean -fd` **kecuali**
  `desain/`, `paket-pendukung/`, `dokumen/`, `laporan/`. Sudah ter-commit:
  `git revert <hash>` — jangan `reset --hard` pada riwayat yang sudah dibagikan.

## 5. Basis data

Perubahan skema = berkas `sql/NN-*.sql` bernomor urut, dijalankan **sadar**:
lokal oleh Claude Code lewat `docker exec` (SELECT/periksa dulu, lalu jalankan,
lalu buktikan hasilnya), di server oleh pemilik mengikuti `PENERAPAN.md`.
Tidak pernah otomatis saat aplikasi menyala.

## 6. Bila dokumen bertentangan

Urutan menang: `CLAUDE.md` → `dokumen/CETAK-BIRU-SISTEM.md` →
`dokumen/REFERENSI.md` → dokumen tahap. Untuk tampilan: `code.html` di
`desain/` menang atas semua deskripsi teks. Temukan pertentangan → catat di
laporan, jangan diam-diam memilih.

---

## 7. MODE OTONOM

Aktif **hanya** bila perintah pemilik menyebut "MODE OTONOM". Claude Code
mengerjakan Tahap 00 → 09 berurutan tanpa menunggu persetujuan antar tahap.
Semua aturan lain tetap berlaku penuh — yang berubah hanya siapa yang menekan
"lanjut".

### 7.1 Lingkaran kerja

```
untuk tiap tahap XX dari posisi di laporan/STATUS.md:
  tandai XX = SEDANG di STATUS.md
  kerjakan dokumen/TAHAP-XX seluruhnya
  jalankan SEMUA butir UJI TAHAP; tiap butir menghasilkan berkas bukti di
     laporan/bukti-tahap-XX/ (keluaran perintah apa adanya)
  periksa GERBANG-MANDIRI (7.2); gagal -> perbaiki dan ulangi
  tulis laporan/LAPORAN-TAHAP-XX.md ; npm run build hijau ; git commit
  tandai XX = LULUS (+ hash commit) di STATUS.md ; lanjut tahap berikutnya
```

### 7.2 Gerbang-mandiri — semua harus terpenuhi sebelum pindah tahap

1. Setiap butir UJI TAHAP berstatus LULUS / GAGAL-DIPERBAIKI-LULUS /
   TIDAK-BISA+alasan, **masing-masing dengan berkas bukti**. Tanpa berkas
   bukti = belum dikerjakan, apa pun yang tertulis.
2. `npm run build` hijau (keluarannya disimpan sebagai bukti).
3. Pemeriksaan kritis tahap itu lolos secara **terprogram**, bukan dibaca
   sekilas: T0 grep `x-uji-proxy: proxy-berjalan` pada bukti curl; T2 grep
   `Location` pada bukti — nol kemunculan `0.0.0.0`; T4/5/7 keluaran
   uji-kesetiaan per halaman: `cacatExport` semua nol + daftar alasan kelas
   hilang tertulis; T6 bukti baris DB pengaduan anonim (kolom identitas NULL)
   + JSON API tanpa identitas; T8 muatan socket mentah tanpa identitas.
4. Satu commit dibuat dan `laporan/STATUS.md` diperbarui.

**Dilarang keras:** menurunkan ambang uji, menghapus/melewati butir uji,
atau menulis LULUS tanpa bukti — itu pelanggaran aturan 2 CLAUDE.md, dan
lebih buruk daripada berhenti.

### 7.3 Kondisi berhenti (satu-satunya alasan sah menghentikan run)

- Gerbang gagal dan tidak lulus setelah **3 upaya perbaikan yang berbeda dan
  sungguh-sungguh** → tulis `BLOKIR` di STATUS.md: butir mana, apa yang sudah
  dicoba, apa yang dibutuhkan dari pemilik. Berhenti — jangan lanjut dengan
  fondasi cacat.
- Prasyarat mati: Docker tidak berjalan (Tahap 1+), disk penuh, npm registry
  tak terjangkau.
- Tindakan yang butuh pemilik: `git push`, deploy Coolify, kredensial,
  domain, paket npm di luar daftar.
Selain kondisi di atas, **jangan berhenti untuk bertanya** — keputusan yang
belum diatur ditandai KEPUTUSAN BARU di laporan dan pekerjaan jalan terus.

### 7.4 Tahap 3 tanpa domain/server (keputusan pemilik)

Kerjakan seluruh bagian lokal: `Dockerfile`, `.dockerignore`, compose lokal,
build image, container menyala + healthcheck + uji proxy/zona-waktu/volume di
container, `PENERAPAN.md`. Butir yang membutuhkan domain, server Coolify, atau
`git push` → tandai `MENUNGGU PEMILIK` di STATUS.md **dan lanjut ke Tahap 4**
— tahap 4–9 tidak bergantung pada server.

### 7.5 Sesi terputus

Run sepanjang ini pasti melewati pemadatan konteks atau terputus. Sumber
kebenaran posisi = `laporan/STATUS.md` + `git log`, bukan ingatan percakapan.
Saat menerima ulang perintah MODE OTONOM: baca keduanya, lanjutkan dari tahap
pertama yang belum LULUS, jangan mengulang yang sudah LULUS (kecuali buktinya
tidak ada — maka ulangi ujinya).

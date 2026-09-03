# PERINTAH PEMILIK — SERVER & PRODUKSI (ringkasan, tanpa nilai rahasia)

> Ditulis Claude Code 3 September 2026 dari prompt MODE OTONOM pemilik, agar
> bertahan melewati pemadatan konteks. Nilai rahasia TIDAK ada di sini —
> semuanya di `D:\Deploy\LSM\.env.produksi` (gitignored). Berkas ini
> melengkapi `CLAUDE.md` dan `dokumen/ALUR-KERJA-CLAUDE-CODE.md` bagian 7.

## 1. Domain dan produksi

- Domain final: **warkopnusantara.id** (publik) dan **staf.warkopnusantara.id**
  (ruang staf). DNS aktif, HTTPS jalan (Traefik/Coolify, sertifikat Let's
  Encrypt). Server menjawab `+07:00` pada `/api/health`.
- Verifikasi produksi **langsung via domain**: `curl.exe https://warkopnusantara.id/api/health`
  harus `200 {"status":"sehat","basisData":"terhubung"}`.
- Seluruh nilai produksi dibaca dari `.env.produksi` (kunci: DOMAIN, STAF_HOST,
  NEXT_PUBLIC_APP_URL, DB_*, JWT_*, SEED_ADMIN_*, UPLOAD_*, TZ,
  COOLIFY_DEPLOY_WEBHOOK, COOLIFY_API_TOKEN). **Jangan pernah menulis nilainya
  ke berkas ter-commit, laporan, bukti, atau log.** Skrip bukti harus
  menyamarkan nilai (mis. `<disembunyikan>`).

## 2. Gerbang Tahap 3 di laptop

- Disk C: sudah dibereskan pemilik. Selesaikan butir a–k Tahap 3 di laptop
  (build image + uji container; skrip di `laporan/bukti-tahap-03/skrip/`).
- Bila Docker laptop kembali bermasalah setelah upaya sungguh-sungguh:
  **JANGAN BLOKIR**. Image yang sama sudah HEALTHY di produksi (dibangun
  Coolify dari repo ini) — pakai bukti produksi via SSH untuk butir uji
  container, tandai KEPUTUSAN BARU, lanjut.

## 3. git push dan redeploy

- `git push origin main` **DIIZINKAN** di akhir setiap tahap.
- Setelah push: picu redeploy dengan `curl.exe` ke `COOLIFY_DEPLOY_WEBHOOK`
  memakai header `Authorization: Bearer <COOLIFY_API_TOKEN>` (keduanya dari
  `.env.produksi`), tunggu ±2 menit, verifikasi `/api/health` produksi tetap
  200. Bila gagal → tulis "perlu Redeploy manual" di `laporan/STATUS.md` dan
  lanjut. Panel Coolify dikelola pemilik; Claude Code memakai webhook saja.

## 4. Akses server (akun deployer, grup docker, tanpa password)

```
ssh -i %USERPROFILE%\.ssh\warkop_deploy deployer@31.97.106.106 "<perintah>"
```

Bebas **membaca** informasi server apa pun yang membantu, tanpa bertanya:
`docker ps -a`, `docker logs`, `docker inspect`, `docker exec <app> env`,
`docker exec -i <db> mariadb ...`, `df -h`, `free -m`, `uptime`,
`docker stats --no-stream`.

**Keadaan server (3 Sep 2026):**
- Aplikasi warkop: container berawalan `re8snqu8jwyxdqg2wmzrbm3w` (label
  warkop-app, HEALTHY), volume `warkop-unggahan` → `/app/public/unggahan`.
- MariaDB warkop: container `kwoz3jwjb037hw3oh669g9c4` (db `warkop_nusantara`,
  user `warkop`; sandi ada di env container `MARIADB_PASSWORD`).
- Database awalnya KOSONG (SHOW TABLES kosong) — diisi tugas 5a.
- Nama container penuh: `docker ps --format '{{.Names}}'`.

**BATAS KERAS** (server menjalankan 4 sistem produksi lain):
- Tindakan TULIS/UBAH hanya pada objek warkop (`re8snqu*`, `kwoz3jwjb*`).
- DILARANG MUTLAK: mengubah/menghentikan/exec ke container lain (`v13*`,
  `fmy*`, `b9uw*`, `bs5m*`, `k118*`, `t128*`, `coolify*`), `docker prune`,
  firewall, `apt`, reboot, `sudo`, membaca env/isi volume aplikasi lain.
- Perintah destruktif hanya pada objek warkop; **SELECT dulu sebelum
  UPDATE/DELETE**. Login root TIDAK dipakai.

## 5. Tugas server — sebelum Tahap 4

a. Jalankan `sql/01-schema.sql` dari container app ke MariaDB warkop, lalu
   `node scripts/seed.js` di container app (pola `PENERAPAN.md` G.1; env
   sudah tersedia di dalam container).
b. Simpan bukti ke `laporan/bukti-server/`: `/api/health` tetap 200; login
   superadmin (SEED_ADMIN dari `.env.produksi`) di
   `https://staf.warkopnusantara.id/login`; pemisahan host — `curl -i
   https://warkopnusantara.id/staf/dashboard` dialihkan ke host staf,
   `Location` TANPA `0.0.0.0`.

## 6. Ritme Tahap 4–9

Gerbang-mandiri ALUR 7.2; berhenti hanya pada kondisi 7.3. Tiap tahap:
kerjakan → uji + bukti → laporan → commit → push → redeploy → verifikasi
`/api/health` produksi 200 → `STATUS.md` → tahap berikutnya.

## 7. Setelah Tahap 9 — verifikasi akhir dan penutup

Verifikasi akhir di domain produksi: uji kesetiaan 14 layar pada build
produksi, pemisahan host, socket `wss`, pengaduan anonim end-to-end. Lalu tulis
di `STATUS.md` ringkasan penutup + **DAFTAR TINDAKAN PEMILIK**:
- ganti kata sandi admin segera;
- tinjau/ganti artikel seed;
- rotasi SEMUA rahasia yang pernah tertulis di chat: DB_PASSWORD, JWT_SECRET,
  SEED_ADMIN_PASSWORD, token API Coolify;
- oranyekan proxy Cloudflare;
- webhook GitHub auto-deploy;
- pengerasan firewall port 8000/5050.

Lalu **BERHENTI**.

## 8. Bila sesi terputus

Prompt dikirim ulang persis. Baca `laporan/STATUS.md` + `git log`, lanjutkan
dari posisi pertama yang belum LULUS. Tahap 00–02 sudah LULUS dan ter-push —
jangan diulang.

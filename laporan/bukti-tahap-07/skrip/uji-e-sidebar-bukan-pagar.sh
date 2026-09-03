#!/usr/bin/env bash
# UJI e Tahap 7 — SIDEBAR BUKAN PAGAR: untuk setiap menu yang DISEMBUNYIKAN dari suatu peran, panggil route API-nya
# langsung dengan cookie peran itu -> harus 403. Peran & menu dari lib/navItems.js + REFERENSI 11.
cd "$(dirname "$0")/../../.." || exit 1
U=http://127.0.0.1:3000; export MSYS_NO_PATHCONV=1; J="$(cygpath -m "$TEMP")/uji-e-07"; rm -rf "$J"; mkdir -p "$J"
ADMIN_EMAIL=$(grep '^SEED_ADMIN_EMAIL=' .env | cut -d= -f2- | tr -d '\r'); ADMIN_PASS=$(grep '^SEED_ADMIN_PASSWORD=' .env | cut -d= -f2- | tr -d '\r'); STAF_PASS=$(grep '^SEED_STAF_PASSWORD=' .env | cut -d= -f2- | tr -d '\r')
login() { curl.exe -s -o /dev/null -w '%{http_code}' -c "$J/$1.txt" -H "content-type: application/json" -d "{\"email\":\"$2\",\"kataSandi\":\"$3\"}" "$U/api/auth/login"; }
k() { curl.exe -s -m 30 -o /dev/null -w '%{http_code}' -b "$J/$1.txt" "${@:2}" "$U$3" 2>/dev/null; }
echo "# Uji e — sidebar bukan pagar ($(date -u +%FT%TZ)). Baris = peran; kolom = route API dari menu yang TIDAK tampil untuk peran itu."
echo "login: superadmin=$(login superadmin "$ADMIN_EMAIL" "$ADMIN_PASS") redaktur=$(login redaktur siti.rahma@warkopnusantara.id "$STAF_PASS") penulis=$(login penulis budi.santoso@warkopnusantara.id "$STAF_PASS") verifikator=$(login verifikator siti.aminah@warkopnusantara.id "$STAF_PASS") pimpinan_wilayah=$(login pimpinan_wilayah pimpinan.jabar@warkopnusantara.id "$STAF_PASS")"
echo; echo "| Peran | Menu tersembunyi | Route API | HTTP (harapan) |"; echo "|---|---|---|---|"
uji() { local p=$1 menu=$2 metode=$3 rute=$4 harap=$5; local kode; kode=$(curl.exe -s -m 30 -o /dev/null -w '%{http_code}' -b "$J/$p.txt" -X "$metode" -H 'content-type: application/json' -d '{}' "$U$rute"); echo "| $p | $menu | $metode $rute | $kode ($harap) |"; }
# redaktur: Kelola Pengaduan, Pengguna, Pengaturan tersembunyi
uji redaktur "Kelola Pengaduan" GET /api/staf/pengaduan 403; uji redaktur "Pengguna" GET /api/staf/pengguna 403; uji redaktur "Pengguna" POST /api/staf/pengguna 403; uji redaktur "Pengaturan" GET /api/staf/pengaturan 403; uji redaktur "Pengaturan" PATCH /api/staf/pengaturan 403
# penulis: Kelola Pengaduan, Pengurus, Program, Galeri, Pengguna, Pengaturan tersembunyi (+ terbitkan)
uji penulis "Kelola Pengaduan" GET /api/staf/pengaduan 403; uji penulis "Pengurus" GET /api/staf/pengurus 403; uji penulis "Pengurus" POST /api/staf/pengurus 403; uji penulis "Program" POST /api/staf/program 403; uji penulis "Galeri" GET /api/staf/galeri 403; uji penulis "Pengguna" GET /api/staf/pengguna 403; uji penulis "Pengaturan" PATCH /api/staf/pengaturan 403; uji penulis "Terbitkan artikel" POST /api/staf/artikel/38/terbitkan 403
# verifikator: Kelola Artikel, Pengurus, Program, Galeri, Pengguna, Pengaturan
uji verifikator "Kelola Artikel" GET /api/staf/artikel 403; uji verifikator "Pengurus" GET /api/staf/pengurus 403; uji verifikator "Program" GET /api/staf/program 403; uji verifikator "Galeri" POST /api/staf/galeri 403; uji verifikator "Pengguna" GET /api/staf/pengguna 403; uji verifikator "Pengaturan" GET /api/staf/pengaturan 403
# pimpinan_wilayah: Pengguna, Pengaturan tersembunyi; menu konten tampil tetapi baca-saja -> tulis 403
uji pimpinan_wilayah "Pengguna" GET /api/staf/pengguna 403; uji pimpinan_wilayah "Pengaturan" PATCH /api/staf/pengaturan 403; uji pimpinan_wilayah "Pengurus (tulis)" POST /api/staf/pengurus 403; uji pimpinan_wilayah "Program (tulis)" POST /api/staf/program 403; uji pimpinan_wilayah "Galeri (tulis)" POST /api/staf/galeri 403; uji pimpinan_wilayah "Artikel (tulis)" POST /api/staf/artikel 403; uji pimpinan_wilayah "Pengaduan status" POST /api/staf/pengaduan/1/status 403
# tanpa sesi
echo "| (tanpa cookie) | semua | GET /api/staf/pengaturan | $(curl.exe -s -o /dev/null -w '%{http_code}' "$U/api/staf/pengaturan") (401) |"
# kontrol positif: superadmin
echo "| superadmin (kontrol) | — | GET /api/staf/pengaturan | $(curl.exe -s -o /dev/null -w '%{http_code}' -b "$J/superadmin.txt" "$U/api/staf/pengaturan") (200) |"
rm -rf "$J"

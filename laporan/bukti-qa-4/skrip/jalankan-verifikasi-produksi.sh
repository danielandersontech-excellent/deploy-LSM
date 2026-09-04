#!/usr/bin/env bash
# QA-4 G — rangkaian verifikasi akhir PRODUKSI. Membuka sesi akun staf uji (token hanya di env proses, tidak dicetak),
# menjalankan tiga skrip verifikasi berurutan, lalu SELALU menutup sesi (akun dinonaktifkan) walau ada yang gagal.
# Pemakaian: bash laporan/bukti-qa-4/skrip/jalankan-verifikasi-produksi.sh
cd "$(dirname "$0")/../../.." || exit 1
B=laporan/bukti-qa-4
TOKEN_STAF=$(node $B/skrip/sesi-uji-produksi.mjs buka) || { echo "sesi uji produksi gagal dibuka"; exit 1; }
export TOKEN_STAF
tutup() { node $B/skrip/sesi-uji-produksi.mjs tutup; }
trap tutup EXIT
node $B/skrip/uji-abcd.mjs https://warkopnusantara.id https://staf.warkopnusantara.id --produksi > $B/abcd-uji-produksi.txt 2>&1
grep -E "RINGKASAN" $B/abcd-uji-produksi.txt
node $B/skrip/uji-g-konsol.mjs https://warkopnusantara.id https://staf.warkopnusantara.id --produksi > $B/g-konsol-produksi.txt 2>&1
grep -E "RINGKASAN" $B/g-konsol-produksi.txt
node $B/skrip/uji-g-produksi.mjs > $B/g-verifikasi-produksi.txt 2>&1
grep -E "RINGKASAN" $B/g-verifikasi-produksi.txt
grep -hE "GAGAL" $B/abcd-uji-produksi.txt $B/g-konsol-produksi.txt $B/g-verifikasi-produksi.txt || echo "tidak ada GAGAL di tiga berkas"

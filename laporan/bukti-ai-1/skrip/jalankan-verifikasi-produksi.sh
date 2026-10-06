#!/usr/bin/env bash
# RUN AI-1 — rangkaian verifikasi PRODUKSI: buka sesi akun uji (token hanya di env proses), e2e asisten AI (1 panggilan
# Anthropic produksi, lalu artikel+saran+gambar uji DIHAPUS), sapu konsol UI 375/768/1280 halaman asisten + Kelola Artikel,
# lalu SELALU tutup sesi (akun dinonaktifkan) walau ada yang gagal.
# Pemakaian: bash laporan/bukti-ai-1/skrip/jalankan-verifikasi-produksi.sh
cd "$(dirname "$0")/../../.." || exit 1
B=laporan/bukti-ai-1
TOKEN_STAF=$(node laporan/bukti-qa-4/skrip/sesi-uji-produksi.mjs buka) || { echo "sesi uji produksi gagal dibuka"; exit 1; }
export TOKEN_STAF
tutup() { node laporan/bukti-qa-4/skrip/sesi-uji-produksi.mjs tutup; }
trap tutup EXIT
node $B/skrip/uji-produksi.mjs > $B/e-produksi-e2e.txt 2>&1
grep -E "RINGKASAN|GAGAL" $B/e-produksi-e2e.txt
node $B/skrip/uji-ui-konsol.mjs https://staf.warkopnusantara.id --produksi > $B/e-produksi-ui-konsol.txt 2>&1
grep -E "RINGKASAN|GAGAL" $B/e-produksi-ui-konsol.txt

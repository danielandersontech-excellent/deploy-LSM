#!/usr/bin/env bash
# QA-4 F3 — ALUR END-TO-END diulang semua dengan skrip yang sudah terbukti pada RUN QA-2/QA-3, ditambah bagian baru
# (uji-f3-realtime-lampiran.mjs). Dijalankan terhadap build produksi lokal. Keluaran per suite ke laporan/bukti-qa-4/.
cd "$(dirname "$0")/../../.." || exit 1
jalankan() { local nama=$1; shift; echo "=== $nama ==="; "$@" > "laporan/bukti-qa-4/f3-$nama.txt" 2>&1; grep -E "^RINGKASAN" "laporan/bukti-qa-4/f3-$nama.txt" || tail -3 "laporan/bukti-qa-4/f3-$nama.txt"; }
jalankan c3a-lampiran-batas      node laporan/bukti-qa-2/skrip/uji-c3a-lampiran.mjs
jalankan c3c-alur-qa2            node laporan/bukti-qa-2/skrip/uji-c3c-alur-qa2.mjs
jalankan c3d-aksi-end-to-end     node laporan/bukti-qa-1/skrip/uji-4-aksi-end-to-end.mjs
jalankan c4-regresi-bug-qa2      node laporan/bukti-qa-2/skrip/uji-c4-regresi-bug.mjs
jalankan qa3-struktur-pengurus   node laporan/bukti-qa-3/skrip/uji-a-struktur-pengurus.mjs
jalankan qa3-cdef                node laporan/bukti-qa-3/skrip/uji-cdef.mjs
jalankan realtime-lampiran       node laporan/bukti-qa-4/skrip/uji-f3-realtime-lampiran.mjs
# C3b (tombol kembali & muat ulang, Chrome) dijalankan terpisah setelah F1 selesai agar tidak berebut Chrome:
#   node laporan/bukti-qa-2/skrip/uji-c3b-kembali-muatulang.mjs > laporan/bukti-qa-4/f3-c3b-kembali-muatulang.txt

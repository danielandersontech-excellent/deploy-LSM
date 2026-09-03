#!/usr/bin/env bash
# UJI p Tahap 7 — kosongkan tabel konten (pengurus, program, galeri, artikel, pengaduan+riwayat+lampiran, audit_log)
# lalu render setiap modul staf (cookie superadmin) + halaman publik terkait -> 200 dengan KeadaanKosong, 0 galat;
# pulihkan dengan node scripts/seed.js. Tabel users/pengaturan/wilayah/kategori tidak dikosongkan (pengguna aktif,
# setelan selalu punya nilai bawaan). Dev server 127.0.0.1:3000.
cd "$(dirname "$0")/../../.." || exit 1
U=http://127.0.0.1:3000; export MSYS_NO_PATHCONV=1; J="$(cygpath -m "$TEMP")/uji-p-07"; rm -rf "$J"; mkdir -p "$J"
ADMIN_EMAIL=$(grep '^SEED_ADMIN_EMAIL=' .env | cut -d= -f2- | tr -d '\r'); ADMIN_PASS=$(grep '^SEED_ADMIN_PASSWORD=' .env | cut -d= -f2- | tr -d '\r')
curl.exe -s -o /dev/null -c "$J/admin.txt" -H "content-type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"kataSandi\":\"$ADMIN_PASS\"}" "$U/api/auth/login"
echo "# Uji p — keadaan kosong seluruh modul ($(date -u +%FT%TZ))"
node --input-type=module -e "
import 'dotenv/config'; import {kueri,hitungBaris,tutupPool} from './lib/db/index.js';
const t=['pengurus','program','galeri','artikel','pengaduan','audit_log'];
console.log('sebelum:', (await Promise.all(t.map(async x=>x+'='+await hitungBaris(x)))).join(' '));
await kueri('DELETE FROM artikel_tag'); await kueri('DELETE FROM artikel'); await kueri('DELETE FROM pengaduan_lampiran'); await kueri('DELETE FROM pengaduan_riwayat'); await kueri('DELETE FROM pengaduan');
await kueri('DELETE FROM pengurus'); await kueri('DELETE FROM program'); await kueri('DELETE FROM galeri'); await kueri('DELETE FROM audit_log');
console.log('setelah DELETE:', (await Promise.all(t.map(async x=>x+'='+await hitungBaris(x)))).join(' '));
await tutupPool();"
for r in /staf/dashboard /staf/artikel /staf/pengaduan /staf/pengurus /staf/program /staf/galeri /staf/pengguna /staf/pengaturan; do
  n=$(echo "$r" | sed 's#^/staf/##'); code=$(curl.exe -s -b "$J/admin.txt" -o "$J/$n.html" -w '%{http_code}' "$U$r")
  ks=$(grep -o 'role="status"' "$J/$n.html" | wc -l); judul=$(grep -oE '<h3 class="font-headline-md text-lg text-primary">[^<]*' "$J/$n.html" | sed 's/<[^>]*>//' | head -3 | tr '\n' '|'); galat=$(grep -c 'Halaman tidak dapat dimuat\|Internal Server Error' "$J/$n.html")
  echo "  $r -> HTTP $code | KeadaanKosong: $ks | judul: $judul | galat: $galat"
done
for r in / /berita /struktur /program /galeri "/lacak?nomor=WRP-009018"; do
  n=$(echo "$r" | sed 's#^/$#beranda#; s#^/##; s#[^a-z0-9]#-#g'); code=$(curl.exe -s -o "$J/pub-$n.html" -w '%{http_code}' "$U$r")
  echo "  publik $r -> HTTP $code | KeadaanKosong: $(grep -o 'role="status"' "$J/pub-$n.html" | wc -l) | galat: $(grep -c 'Halaman tidak dapat dimuat\|Internal Server Error' "$J/pub-$n.html")"
done
echo "\$ node scripts/seed.js (pulihkan)"; node scripts/seed.js 2>&1 | grep -E '^\[seed\] (jumlah|selesai|GAGAL)' | sed -E 's/[^ ]+@[^ ]+/<email>/'
rm -rf "$J"

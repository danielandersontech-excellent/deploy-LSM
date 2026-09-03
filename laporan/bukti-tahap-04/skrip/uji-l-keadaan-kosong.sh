#!/usr/bin/env bash
# UJI l Tahap 4 — keadaan kosong: kosongkan artikel, pengurus, galeri, program di DB LOKAL,
# render setiap halaman publik (harus 200 + KeadaanKosong, bukan galat), lalu pulihkan
# dengan `node scripts/seed.js` (idempoten). Prasyarat: dev server di 127.0.0.1:3000, .env lokal.
cd "$(dirname "$0")/../../.." || exit 1
U=http://127.0.0.1:3000
echo "# Uji l — keadaan kosong ($(date -u +%FT%TZ))"
node --input-type=module -e "
import 'dotenv/config'; import { kueri, hitungBaris, tutupPool } from './lib/db/index.js';
const t = ['artikel','pengurus','galeri','program'];
console.log('sebelum:', (await Promise.all(t.map(async x => x+'='+await hitungBaris(x)))).join(' '));
await kueri('DELETE FROM artikel_tag'); for (const x of t) await kueri('DELETE FROM ' + x);
console.log('setelah DELETE:', (await Promise.all(t.map(async x => x+'='+await hitungBaris(x)))).join(' '));
await tutupPool();"
for r in / /struktur /program /galeri /tentang; do
  n=$(echo "$r" | sed 's#^/$#beranda#; s#^/##')
  code=$(curl.exe -s -o "$TEMP/kosong-$n.html" -w '%{http_code}' "$U$r")
  ks=$(grep -o 'role="status"' "$TEMP/kosong-$n.html" | wc -l)
  judul=$(grep -oE '<h3 class="font-headline-md text-lg text-primary">[^<]*' "$TEMP/kosong-$n.html" | sed 's/<[^>]*>//' | head -3 | tr '\n' '|')
  galat=$(grep -c 'Halaman tidak dapat dimuat\|Internal Server Error' "$TEMP/kosong-$n.html")
  echo "$r -> HTTP $code | KeadaanKosong(role=status): $ks | judul: $judul | galat: $galat"
done
echo "\$ node scripts/seed.js (pulihkan data contoh)"
node scripts/seed.js 2>&1 | grep -E '^\[seed\] (jumlah|selesai|GAGAL)' | sed -E 's/[^ ]+@[^ ]+/<email>/'

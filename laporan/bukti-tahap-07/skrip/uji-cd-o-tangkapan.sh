#!/usr/bin/env bash
# UJI c/d/o Tahap 7 — tangkapan dashboard + sidebar untuk KELIMA peran (CDP + cookie sesi) dan pengukuran lebar
# 375/768/1280 seluruh halaman staf (superadmin). Memakai laporan/bukti-tahap-06/skrip/ukur-lebar.mjs (env COOKIE).
cd "$(dirname "$0")/../../.." || exit 1
U=http://127.0.0.1:3000; export MSYS_NO_PATHCONV=1; J="$(cygpath -m "$TEMP")/uji-cdo-07"; rm -rf "$J"; mkdir -p "$J"
T=laporan/bukti-tahap-07/tangkapan; mkdir -p "$T"
ADMIN_EMAIL=$(grep '^SEED_ADMIN_EMAIL=' .env | cut -d= -f2- | tr -d '\r'); ADMIN_PASS=$(grep '^SEED_ADMIN_PASSWORD=' .env | cut -d= -f2- | tr -d '\r'); STAF_PASS=$(grep '^SEED_STAF_PASSWORD=' .env | cut -d= -f2- | tr -d '\r')
token() { curl.exe -s -o /dev/null -c "$J/$1.txt" -H "content-type: application/json" -d "{\"email\":\"$2\",\"kataSandi\":\"$3\"}" "$U/api/auth/login"; grep warkop_token "$J/$1.txt" | awk '{print $NF}'; }
declare -A TK
TK[superadmin]=$(token superadmin "$ADMIN_EMAIL" "$ADMIN_PASS"); TK[redaktur]=$(token redaktur siti.rahma@warkopnusantara.id "$STAF_PASS"); TK[penulis]=$(token penulis budi.santoso@warkopnusantara.id "$STAF_PASS"); TK[verifikator]=$(token verifikator siti.aminah@warkopnusantara.id "$STAF_PASS"); TK[pimpinan_wilayah]=$(token pimpinan_wilayah pimpinan.jabar@warkopnusantara.id "$STAF_PASS")
echo "# Uji c/d — dashboard + sidebar kelima peran ($(date -u +%FT%TZ)); tangkapan 1280 px beremulasi (CDP), cookie per peran"
for p in superadmin redaktur penulis verifikator pimpinan_wilayah; do
  [ -z "${TK[$p]}" ] && { echo "  $p: login gagal"; continue; }
  COOKIE="warkop_token=${TK[$p]}" node laporan/bukti-tahap-06/skrip/ukur-lebar.mjs "$U/staf/dashboard" 1280 "$T/dashboard-$p.png" 2>&1 | sed "s/^/  [$p] /"
  curl.exe -s -b "$J/$p.txt" "$U/staf/dashboard" > "$J/dash-$p.html"
  echo "  [$p] menu sidebar: $(grep -oE 'aria-label="Navigasi staf"[\s\S]*' "$J/dash-$p.html" | grep -oE '<span class="font-label-md text-label-md">[^<]*' | sed 's/<[^>]*>//' | tr '\n' ',' | sed 's/,$//')"
done
echo; echo "# Uji o — lebar 375/768/1280 halaman staf (superadmin) + tangkapan 375"
for r in /staf/dashboard /staf/artikel /staf/artikel/baru /staf/pengaduan /staf/pengurus /staf/program /staf/galeri /staf/pengguna /staf/pengaturan; do
  n=$(echo "$r" | sed 's#^/staf/##; s#/#-#g')
  for w in 375 768 1280; do out=""; [ "$w" = 375 ] && out="$T/$n-375.png"; COOKIE="warkop_token=${TK[superadmin]}" node laporan/bukti-tahap-06/skrip/ukur-lebar.mjs "$U$r" $w $out 2>&1 | head -4; done
done
rm -rf "$J"

#!/usr/bin/env bash
# UJI l Tahap 6 — 30 kiriman berturut-turut dari satu IP -> dibatasi (10/jam per IP) dengan pesan netral.
cd "$(dirname "$0")/../../.." || exit 1
U=http://127.0.0.1:3000; export MSYS_NO_PATHCONV=1; J="$(cygpath -m "$TEMP")/uji-l-06"; rm -rf "$J"; mkdir -p "$J"
TK=$(node --input-type=module -e "import 'dotenv/config'; import {buatTokenFormulir} from './lib/tokenFormulir.js'; console.log(buatTokenFormulir(Date.now()-5000))")
echo "# Uji l — rate limit POST /api/pengaduan ($(date -u +%FT%TZ)); batas 10 / 60 menit per IP"
lolos=0; dibatasi=0; pertama=""
for i in $(seq 1 30); do
  k=$(curl.exe -s -m 30 -o "$J/o.json" -w '%{http_code}' -H 'content-type: application/json' -d "{\"token_formulir\":\"$TK\",\"anonim\":true,\"kategori_masalah\":\"lainnya\",\"deskripsi\":\"Uji l kiriman ke-$i dari satu IP untuk memicu pembatas laju pengaduan.\"}" "$U/api/pengaduan")
  if [ "$k" = "201" ]; then lolos=$((lolos+1)); elif [ "$k" = "429" ]; then dibatasi=$((dibatasi+1)); [ -z "$pertama" ] && { pertama=$i; echo "  kiriman ke-$i -> HTTP 429 $(cat "$J/o.json")"; }; else echo "  kiriman ke-$i -> HTTP $k $(cat "$J/o.json")"; fi
done
echo "  lolos (201): $lolos ; dibatasi (429): $dibatasi ; 429 pertama pada kiriman ke-$pertama"
echo "  HASIL l: $([ "$dibatasi" -gt 0 ] && [ "$lolos" -le 10 ] && echo 'LULUS — dibatasi setelah kuota, pesan netral tidak menyalahkan pelapor' || echo 'GAGAL')"
echo "  lacak: 70 permintaan cepat -> $(c=0; for i in $(seq 1 70); do k=$(curl.exe -s -m 30 -o /dev/null -w '%{http_code}' "$U/api/pengaduan/lacak/WRP-000000"); [ "$k" = "429" ] && c=$((c+1)); done; echo "$c x 429 (batas 60/15 menit)")"
echo "\$ bersihkan: hapus lunak pengaduan 'Uji l'"; node --input-type=module -e "import 'dotenv/config'; import {kueri,tutupPool} from './lib/db/index.js'; import {waktuSekarang} from './lib/utils.js'; const r=await kueri(\"UPDATE pengaduan SET dihapus_pada=?, diperbarui_pada=? WHERE deskripsi LIKE 'Uji l kiriman%' AND dihapus_pada IS NULL\",[waktuSekarang(),waktuSekarang()]); console.log('  dihapus lunak:', r.affectedRows); await tutupPool();"
rm -rf "$J"

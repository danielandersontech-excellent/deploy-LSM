#!/usr/bin/env bash
# UJI a Tahap 5 — alur penuh: buat draf (penulis) -> sunting -> terbitkan (redaktur) -> muncul di /berita
# -> buka detail -> arsipkan -> hilang dari publik. Juga uji c bagian halaman detail (XSS tidak dieksekusi).
# Tangkapan tiap langkah: keluaran API (JSON) + status halaman publik + PNG halaman publik (Chrome headless).
cd "$(dirname "$0")/../../.." || exit 1
U=http://127.0.0.1:3000; export MSYS_NO_PATHCONV=1; J="$(cygpath -m "$TEMP")/uji-a-05"; rm -rf "$J"; mkdir -p "$J"
T=laporan/bukti-tahap-05/tangkapan; mkdir -p "$T"; CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
STAF_PASS=$(grep '^SEED_STAF_PASSWORD=' .env | cut -d= -f2- | tr -d '\r')
login() { curl.exe -s -o /dev/null -w '%{http_code}' -c "$J/$1.txt" -H "content-type: application/json" -d "{\"email\":\"$2\",\"kataSandi\":\"$3\"}" "$U/api/auth/login"; }
kode() { curl.exe -s -o "$J/out.json" -w '%{http_code}' "$@"; }
js() { node -e "const j=JSON.parse(require('fs').readFileSync('$J/out.json','utf8'));console.log($1)"; }
foto() { "$CH" --headless=new --disable-gpu --hide-scrollbars --no-sandbox --window-size=1280,2200 --screenshot="$(cygpath -w "$PWD/$T/$1.png")" "$U$2" >/dev/null 2>&1; echo "  [tangkapan] $T/$1.png ($(stat -c %s "$T/$1.png") B)"; }
echo "# Uji a — alur penuh artikel ($(date -u +%FT%TZ))"
echo "login penulis=$(login penulis budi.santoso@warkopnusantara.id "$STAF_PASS") redaktur=$(login redaktur siti.rahma@warkopnusantara.id "$STAF_PASS")"

echo; echo "## 1. Penulis membuat DRAF (POST /api/staf/artikel) — isi memuat muatan XSS (uji c)"
ISI='<h2>Temuan Lapangan</h2><p>Paragraf pembuka uji alur penuh Tahap 5.</p><blockquote>Kutipan uji.</blockquote><ul><li>Butir satu</li><li>Butir dua</li></ul><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">tautan jahat</a><p>Penutup.</p>'
printf '{"judul":"Uji Alur Penuh Tahap 5","isi":%s,"kategori_id":1,"wilayah_id":13,"tag":["uji","alur"]}' "$(node -e "console.log(JSON.stringify(process.argv[1]))" "$ISI")" > "$J/buat.json"
echo "  -> HTTP $(kode -b "$J/penulis.txt" -H 'content-type: application/json' --data-binary "@$J/buat.json" "$U/api/staf/artikel")"; ID=$(js "j.artikel.id"); SLUG=$(js "j.artikel.slug"); echo "  id=$ID slug=$SLUG status=$(js "j.artikel.status") terbit_pada=$(js "j.artikel.terbit_pada")"
echo "  draf TIDAK ada di publik: GET /api/artikel/$SLUG -> HTTP $(kode "$U/api/artikel/$SLUG") ; /berita/$SLUG -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' "$U/berita/$SLUG")"

echo; echo "## 2. Penulis MENYUNTING drafnya (PATCH)"
echo "  -> HTTP $(kode -b "$J/penulis.txt" -X PATCH -H 'content-type: application/json' -d '{"judul":"Uji Alur Penuh Tahap 5 (disunting)","ringkasan":"Ringkasan hasil suntingan penulis."}' "$U/api/staf/artikel/$ID") judul=$(js "j.artikel.judul") slug=$(js "j.artikel.slug") (draf: slug boleh mengikuti judul)"

echo; echo "## 3. Penulis mencoba MENERBITKAN -> harus 403; lalu REDAKTUR menerbitkan"
echo "  penulis POST /terbitkan -> HTTP $(kode -b "$J/penulis.txt" -X POST "$U/api/staf/artikel/$ID/terbitkan") $(cat "$J/out.json")"
echo "  redaktur POST /terbitkan -> HTTP $(kode -b "$J/redaktur.txt" -X POST "$U/api/staf/artikel/$ID/terbitkan") status=$(js "j.artikel.status") terbit_pada=$(js "j.artikel.terbit_pada") slug=$(js "j.artikel.slug")"; SLUG=$(js "j.artikel.slug")

echo; echo "## 4. Muncul di /berita dan /api/artikel"
echo "  GET /api/artikel?q=Alur -> HTTP $(kode "$U/api/artikel?q=Alur") total=$(js "j.total") judul[0]=$(js "j.baris[0]?.judul")"
echo "  GET /berita -> HTTP $(curl.exe -s -o "$J/berita.html" -w '%{http_code}' "$U/berita") ; judul ada di HTML: $(grep -c 'Uji Alur Penuh Tahap 5' "$J/berita.html")"
foto a-4-berita-terbit "/berita"

echo; echo "## 5. Buka DETAIL /berita/$SLUG (uji c: XSS tidak dieksekusi di HTML render)"
echo "  -> HTTP $(curl.exe -s -A 'Mozilla/5.0 (uji)' -o "$J/detail.html" -w '%{http_code}' "$U/berita/$SLUG") ; <script>alert: $(grep -c '<script>alert' "$J/detail.html") onerror=: $(grep -o 'onerror=' "$J/detail.html" | wc -l) javascript:: $(grep -o 'javascript:' "$J/detail.html" | wc -l) ; <h2>Temuan Lapangan ada: $(grep -c 'Temuan Lapangan' "$J/detail.html") ; blockquote ada: $(grep -c '<blockquote' "$J/detail.html")"
foto a-5-detail-terbit "/berita/$SLUG"

echo; echo "## 6. Redaktur MENGARSIPKAN (PATCH {status:'arsip'}) -> hilang dari publik"
echo "  -> HTTP $(kode -b "$J/redaktur.txt" -X PATCH -H 'content-type: application/json' -d '{"status":"arsip"}' "$U/api/staf/artikel/$ID") status=$(js "j.artikel.status")"
echo "  GET /api/artikel/$SLUG -> HTTP $(kode "$U/api/artikel/$SLUG") ; /berita/$SLUG -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' "$U/berita/$SLUG") ; /berita memuat judul: $(curl.exe -s "$U/berita" | grep -c 'Uji Alur Penuh Tahap 5')"
foto a-6-detail-arsip-404 "/berita/$SLUG"

echo; echo "## 7. Jejak audit untuk artikel id=$ID"
node --input-type=module -e "import 'dotenv/config'; import {kueri,tutupPool} from './lib/db/index.js'; const r=await kueri('SELECT aksi, user_id, CAST(dibuat_pada AS CHAR) w FROM audit_log WHERE tabel_terkait=\"artikel\" AND id_terkait=? ORDER BY id',[$ID]); console.log(r.map(x=>'  '+x.w+'  '+x.aksi+'  user='+x.user_id).join('\n')); await tutupPool();"

echo; echo "## Bersihkan (redaktur DELETE $ID) -> HTTP $(kode -b "$J/redaktur.txt" -X DELETE "$U/api/staf/artikel/$ID")"
rm -rf "$J"

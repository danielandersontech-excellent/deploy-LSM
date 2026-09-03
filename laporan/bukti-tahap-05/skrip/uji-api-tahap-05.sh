#!/usr/bin/env bash
# UJI TAHAP 5 tingkat API (tanpa UI): b peran, c XSS (+ isi di DB), d unggahan, e slug, f kategori wajib,
# g zona waktu terbit_pada. Prasyarat: dev server 127.0.0.1:3000, .env lokal (SEED_*), akun seed aktif.
# Nilai sandi/email tidak pernah dicetak.
cd "$(dirname "$0")/../../.." || exit 1
U=http://127.0.0.1:3000; export MSYS_NO_PATHCONV=1; J="$(cygpath -m "$TEMP")/uji-api-05"; rm -rf "$J"; mkdir -p "$J"   # jalur Windows: curl.exe tidak mengenal /tmp
ADMIN_EMAIL=$(grep '^SEED_ADMIN_EMAIL=' .env | cut -d= -f2- | tr -d '\r'); ADMIN_PASS=$(grep '^SEED_ADMIN_PASSWORD=' .env | cut -d= -f2- | tr -d '\r'); STAF_PASS=$(grep '^SEED_STAF_PASSWORD=' .env | cut -d= -f2- | tr -d '\r')
login() { curl.exe -s -o /dev/null -w '%{http_code}' -c "$J/$1.txt" -H "content-type: application/json" -d "{\"email\":\"$2\",\"kataSandi\":\"$3\"}" "$U/api/auth/login"; }
kode() { curl.exe -s -o "$J/out.json" -w '%{http_code}' "$@"; }
echo "# Uji API Tahap 5 — $(date -u +%FT%TZ)"
echo "login superadmin=$(login admin "$ADMIN_EMAIL" "$ADMIN_PASS") penulis=$(login penulis budi.santoso@warkopnusantara.id "$STAF_PASS") redaktur=$(login redaktur siti.rahma@warkopnusantara.id "$STAF_PASS") verifikator=$(login verif siti.aminah@warkopnusantara.id "$STAF_PASS") pimpinan_wilayah(wil 3)=$(login pw rahmat.siregar@warkopnusantara.id "$STAF_PASS")"

echo; echo "## f. Kategori wajib — POST tanpa kategori_id (superadmin)"
echo "  -> HTTP $(kode -b "$J/admin.txt" -H 'content-type: application/json' -d '{"judul":"Uji tanpa kategori","isi":"<p>Isi percobaan tanpa kategori.</p>"}' "$U/api/staf/artikel") $(cat "$J/out.json")"

echo; echo "## e1. Slug — dua artikel berjudul sama (penulis membuat draf)"
k1=$(kode -b "$J/penulis.txt" -H 'content-type: application/json' -d '{"judul":"Uji Slug Bentrok Tahap 5","isi":"<p>Artikel pertama untuk uji slug bentrok.</p>","kategori_id":1}' "$U/api/staf/artikel"); ID1=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$J/out.json','utf8')).artikel?.id ?? '')"); S1=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$J/out.json','utf8')).artikel?.slug ?? '')")
k2=$(kode -b "$J/penulis.txt" -H 'content-type: application/json' -d '{"judul":"Uji Slug Bentrok Tahap 5","isi":"<p>Artikel kedua dengan judul yang sama persis.</p>","kategori_id":1}' "$U/api/staf/artikel"); ID2=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$J/out.json','utf8')).artikel?.id ?? '')"); S2=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$J/out.json','utf8')).artikel?.slug ?? '')")
echo "  artikel 1: HTTP $k1 id=$ID1 slug=$S1"; echo "  artikel 2: HTTP $k2 id=$ID2 slug=$S2"; [ -n "$S1" ] && [ -n "$S2" ] && [ "$S1" != "$S2" ] && echo "  HASIL e1: LULUS (slug kedua berakhiran, tidak menimpa)" || echo "  HASIL e1: GAGAL"

echo; echo "## b. UJI PERAN LEWAT CURL"
echo "  penulis POST /terbitkan (miliknya id=$ID1)      -> HTTP $(kode -b "$J/penulis.txt" -X POST "$U/api/staf/artikel/$ID1/terbitkan") $(cat "$J/out.json")"
echo "  penulis PATCH artikel orang lain (id=41, redaktur) -> HTTP $(kode -b "$J/penulis.txt" -X PATCH -H 'content-type: application/json' -d '{"judul":"Diubah penulis lain"}' "$U/api/staf/artikel/41") $(cat "$J/out.json")"
echo "  penulis DELETE artikel miliknya (id=$ID2)       -> HTTP $(kode -b "$J/penulis.txt" -X DELETE "$U/api/staf/artikel/$ID2") $(cat "$J/out.json")"
echo "  penulis DELETE artikel orang lain (id=41)      -> HTTP $(kode -b "$J/penulis.txt" -X DELETE "$U/api/staf/artikel/41") $(cat "$J/out.json")"
echo "  verifikator GET /api/staf/artikel              -> HTTP $(kode -b "$J/verif.txt" "$U/api/staf/artikel") $(cat "$J/out.json")"
echo "  verifikator POST /api/staf/artikel             -> HTTP $(kode -b "$J/verif.txt" -H 'content-type: application/json' -d '{"judul":"Uji verifikator","isi":"<p>tidak boleh</p>","kategori_id":1}' "$U/api/staf/artikel") $(cat "$J/out.json")"
echo "  pimpinan_wilayah POST /api/staf/artikel        -> HTTP $(kode -b "$J/pw.txt" -H 'content-type: application/json' -d '{"judul":"Uji pimpinan wilayah","isi":"<p>tidak boleh</p>","kategori_id":1}' "$U/api/staf/artikel") $(cat "$J/out.json")"
echo "  pimpinan_wilayah PATCH /api/staf/artikel/41    -> HTTP $(kode -b "$J/pw.txt" -X PATCH -H 'content-type: application/json' -d '{"judul":"x"}' "$U/api/staf/artikel/41") $(cat "$J/out.json")"
echo "  pimpinan_wilayah (wil 3) GET /api/staf/artikel -> HTTP $(kode -b "$J/pw.txt" "$U/api/staf/artikel?perHalaman=50") wilayah_id di hasil: $(node -e "const j=JSON.parse(require('fs').readFileSync('$J/out.json','utf8'));console.log('total='+j.total,'wilayah='+JSON.stringify([...new Set(j.baris.map(b=>b.wilayah_id))]))")  (seed: artikel wil 3 tidak ada -> total 0 = benar; artikel wil 12/13/14 tidak muncul)"
echo "  pimpinan_wilayah GET /api/staf/artikel/41 (wil 13) -> HTTP $(kode -b "$J/pw.txt" "$U/api/staf/artikel/41") $(cat "$J/out.json")"
echo "  penulis GET /api/staf/artikel (hanya miliknya)  -> $(kode -b "$J/penulis.txt" "$U/api/staf/artikel?perHalaman=50" >/dev/null; node -e "const j=JSON.parse(require('fs').readFileSync('$J/out.json','utf8'));console.log('total='+j.total,'penulis_id='+JSON.stringify([...new Set(j.baris.map(b=>b.penulis_id))]))")"
echo "  tanpa cookie POST /api/staf/artikel            -> HTTP $(kode -H 'content-type: application/json' -d '{"judul":"x"}' "$U/api/staf/artikel")"
echo "  tanpa cookie + header x-user-role palsu        -> HTTP $(kode -H 'x-user-role: superadmin' -H 'x-user-id: 1' -X POST "$U/api/staf/artikel/41/terbitkan")"

echo; echo "## c. UJI XSS — muatan lewat API langsung (penulis PATCH miliknya id=$ID1)"
XSS='<h2>Judul aman</h2><p>Teks aman</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">tautan</a><p onclick="alert(2)" style="color:red">para</p><iframe src="https://evil"></iframe><a href="https://contoh.id/aman">aman</a><img src="/penampung/artikel-1.jpg" alt="ok"><svg onload=alert(3)></svg>'
printf '{"judul":"Uji XSS Tahap 5","isi":%s,"kategori_id":1}' "$(node -e "console.log(JSON.stringify(process.argv[1]))" "$XSS")" > "$J/xss.json"
echo "  PATCH -> HTTP $(kode -b "$J/penulis.txt" -X PATCH -H 'content-type: application/json' --data-binary "@$J/xss.json" "$U/api/staf/artikel/$ID1")"
echo "  isi TERSIMPAN di DB (SELECT isi):"; node --input-type=module -e "import 'dotenv/config'; import {kueri,tutupPool} from './lib/db/index.js'; const r=await kueri('SELECT isi FROM artikel WHERE id=?',[$ID1]); const isi=r[0].isi; console.log('    '+isi); const bahaya=['<script','onerror','javascript:','onclick','<iframe','<svg','onload','style=']; const sisa=bahaya.filter(b=>isi.toLowerCase().includes(b)); console.log('    sisa berbahaya:', sisa.length? sisa.join(', ') : 'NIHIL'); console.log('    HASIL c (DB):', sisa.length? 'GAGAL':'LULUS — tersimpan sudah bersih; tautan luar diberi rel=noopener'); await tutupPool();"
echo "  terbitkan (redaktur) -> HTTP $(kode -b "$J/redaktur.txt" -X POST "$U/api/staf/artikel/$ID1/terbitkan")"; SLUGX=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$J/out.json','utf8')).artikel?.slug ?? '')")
echo "  halaman detail /berita/$SLUGX -> HTTP $(curl.exe -s -o "$J/detail.html" -w '%{http_code}' "$U/berita/$SLUGX"); di HTML render: <script>alert=$(grep -c '<script>alert' "$J/detail.html") onerror=$(grep -o 'onerror=' "$J/detail.html" | wc -l) javascript:=$(grep -o 'javascript:' "$J/detail.html" | wc -l) (harus 0 semua; bila halaman belum ada -> 404, diulang setelah halaman selesai)"

echo; echo "## g. Zona waktu — terbit_pada artikel id=$ID1 di DB vs WIB aplikasi"
node --input-type=module -e "import 'dotenv/config'; import {kueri,tutupPool} from './lib/db/index.js'; import {waktuSekarang} from './lib/utils.js'; const r=await kueri('SELECT CAST(terbit_pada AS CHAR) t, @@session.time_zone z FROM artikel WHERE id=?',[$ID1]); const wib=waktuSekarang(); const d=s=>Date.parse(s.replace(' ','T')+'Z'); console.log('    terbit_pada tersimpan:', r[0].t, '| WIB aplikasi sekarang:', wib, '| @@session.time_zone:', r[0].z, '| selisih detik:', Math.round((d(wib)-d(r[0].t))/1000)); console.log('    HASIL g:', Math.abs(d(wib)-d(r[0].t))<120000 && r[0].z==='+07:00' ? 'LULUS (WIB)' : 'GAGAL'); await tutupPool();"

echo; echo "## e2. Slug beku — ubah judul artikel TERBIT id=$ID1 (redaktur PATCH)"
echo "  PATCH judul baru -> HTTP $(kode -b "$J/redaktur.txt" -X PATCH -H 'content-type: application/json' -d '{"judul":"Judul Baru Setelah Terbit Tahap 5"}' "$U/api/staf/artikel/$ID1") slug sesudah: $(node -e "console.log(JSON.parse(require('fs').readFileSync('$J/out.json','utf8')).artikel?.slug ?? '')") (sebelum: $SLUGX)"

echo; echo "## d. UJI UNGGAHAN (superadmin, POST /api/staf/unggah)"
printf '<?php system($_GET["c"]); ?>' > "$J/evil.jpg"
echo "  .php diganti nama .jpg      -> HTTP $(kode -b "$J/admin.txt" -F "berkas=@$J/evil.jpg;type=image/jpeg" "$U/api/staf/unggah") $(cat "$J/out.json")"
node -e "require('fs').writeFileSync('$J/besar.jpg', Buffer.concat([Buffer.from([0xff,0xd8,0xff,0xe0]), Buffer.alloc(6*1024*1024)]))"
echo "  6 MB (batas 5 MB)           -> HTTP $(kode -b "$J/admin.txt" -F "berkas=@$J/besar.jpg;type=image/jpeg" "$U/api/staf/unggah") $(cat "$J/out.json")"
printf '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script></svg>' > "$J/jahat.svg"
echo "  .svg berisi script          -> HTTP $(kode -b "$J/admin.txt" -F "berkas=@$J/jahat.svg;type=image/svg+xml" "$U/api/staf/unggah") $(cat "$J/out.json")"
cp public/penampung/artikel-1.jpg "$J/asli.jpg"
echo "  nama '../../evil.jpg' (JPG asli) -> HTTP $(kode -b "$J/admin.txt" -F "berkas=@$J/asli.jpg;filename=../../evil.jpg;type=image/jpeg" "$U/api/staf/unggah") $(cat "$J/out.json")"
JALUR=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$J/out.json','utf8')).jalur ?? '')")
echo "  berkas tersimpan di: $(ls -la "public${JALUR}" 2>/dev/null | awk '{print $1, $5, $NF}')  (di dalam UPLOAD_DIR, nama acak)"
echo "  disajikan GET $JALUR -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code} %{content_type}' "$U$JALUR")   GET /unggahan/../.env -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' "$U/unggahan/..%2F.env")"
echo "  verifikator boleh unggah (HAK.unggah) -> HTTP $(kode -b "$J/verif.txt" -F "berkas=@$J/asli.jpg;type=image/jpeg" "$U/api/staf/unggah")   pimpinan_wilayah -> HTTP $(kode -b "$J/pw.txt" -F "berkas=@$J/asli.jpg;type=image/jpeg" "$U/api/staf/unggah")"
echo "  Content-Type palsu (PNG dikirim sebagai image/jpeg, isi PNG asli) -> HTTP $(node -e "require('fs').writeFileSync('$J/png.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64'))"; kode -b "$J/admin.txt" -F "berkas=@$J/png.png;type=image/jpeg" "$U/api/staf/unggah") $(cat "$J/out.json" | cut -c1-120)  (dikenali dari magic bytes sebagai png)"

echo; echo "## Bersihkan: hapus artikel uji (superadmin DELETE)"
for i in $ID1 $ID2; do [ -n "$i" ] && echo "  DELETE $i -> HTTP $(kode -b "$J/admin.txt" -X DELETE "$U/api/staf/artikel/$i")"; done
rm -rf "$J"

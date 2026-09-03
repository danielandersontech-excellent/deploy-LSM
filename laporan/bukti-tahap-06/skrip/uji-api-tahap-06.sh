#!/usr/bin/env bash
# UJI TAHAP 6 tingkat API (tanpa UI): b anonim via API, c bernama, d/e lacak, f buku besar, g transaksi,
# h jalan pintas, i catatan wajib, j peran, k lampiran, m audit identitas, p zona waktu.
# (l rate limit ada di skrip terpisah karena menghabiskan kuota IP.) Identitas/sandi tidak dicetak.
cd "$(dirname "$0")/../../.." || exit 1
U=http://127.0.0.1:3000; export MSYS_NO_PATHCONV=1; J="$(cygpath -m "$TEMP")/uji-api-06"; rm -rf "$J"; mkdir -p "$J"
ADMIN_EMAIL=$(grep '^SEED_ADMIN_EMAIL=' .env | cut -d= -f2- | tr -d '\r'); ADMIN_PASS=$(grep '^SEED_ADMIN_PASSWORD=' .env | cut -d= -f2- | tr -d '\r'); STAF_PASS=$(grep '^SEED_STAF_PASSWORD=' .env | cut -d= -f2- | tr -d '\r')
login() { curl.exe -s -o /dev/null -w '%{http_code}' -c "$J/$1.txt" -H "content-type: application/json" -d "{\"email\":\"$2\",\"kataSandi\":\"$3\"}" "$U/api/auth/login"; }
kode() { curl.exe -s -m 90 -o "$J/out.json" -w '%{http_code}' "$@"; }
js() { node -e "const j=JSON.parse(require('fs').readFileSync('$J/out.json','utf8'));console.log($1)"; }
token() { node --input-type=module -e "import 'dotenv/config'; import {buatTokenFormulir} from './lib/tokenFormulir.js'; console.log(buatTokenFormulir(Date.now()-5000))"; }
sql() { node --input-type=module -e "import 'dotenv/config'; import {kueri,tutupPool} from './lib/db/index.js'; $1; await tutupPool();"; }
echo "# Uji API Tahap 6 — $(date -u +%FT%TZ)"
echo "login superadmin=$(login admin "$ADMIN_EMAIL" "$ADMIN_PASS") verifikator=$(login verif siti.aminah@warkopnusantara.id "$STAF_PASS") penulis=$(login penulis budi.santoso@warkopnusantara.id "$STAF_PASS") redaktur=$(login redaktur siti.rahma@warkopnusantara.id "$STAF_PASS") pimpinan_wilayah(3)=$(login pw3 rahmat.siregar@warkopnusantara.id "$STAF_PASS") pimpinan_wilayah(13)=$(login pw13 pimpinan.jabar@warkopnusantara.id "$STAF_PASS")"

echo; echo "## b. UJI ANONIM LEWAT API LANGSUNG — anonim:true BESERTA identitas terisi (JSON)"
echo "  -> HTTP $(kode -H 'content-type: application/json' -d "{\"token_formulir\":\"$(token)\",\"anonim\":true,\"nama_pelapor\":\"Nama Yang Harus Diabaikan\",\"nik_pelapor\":\"3201010101010001\",\"telepon_pelapor\":\"081234567890\",\"email_pelapor\":\"diabaikan@contoh.id\",\"kategori_masalah\":\"korupsi\",\"wilayah_id\":13,\"deskripsi\":\"Uji b: laporan anonim lewat API langsung dengan identitas ikut terkirim; server harus menyimpan NULL.\"}" "$U/api/pengaduan") $(cat "$J/out.json")"; NA=$(js "j.nomorKasus")
echo "  baris DB (SELECT langsung):"; sql "const r=await kueri('SELECT nomor_kasus, anonim, nama_pelapor, nik_pelapor, telepon_pelapor, email_pelapor, status, CAST(dibuat_pada AS CHAR) dibuat_pada FROM pengaduan WHERE nomor_kasus=?',['$NA']); console.log('    '+JSON.stringify(r[0])); const nul=['nama_pelapor','nik_pelapor','telepon_pelapor','email_pelapor'].every(k=>r[0][k]===null); console.log('    HASIL b:', nul && r[0].anonim===1 ? 'LULUS — keempat kolom NULL, anonim=1' : 'GAGAL');"

echo; echo "## c. Alur laporan BERNAMA (multipart + 1 lampiran JPG asli) — nomor kasus terbit"
cp public/penampung/artikel-2.jpg "$J/bukti.jpg"
echo "  -> HTTP $(kode -F "token_formulir=$(token)" -F "nama_pelapor=Pelapor Uji Tahap Enam" -F "telepon_pelapor=081200000000" -F "email_pelapor=pelapor.uji@contoh.id" -F "kategori_masalah=infrastruktur" -F "wilayah_id=13" -F "lokasi_kejadian=Jembatan uji" -F "deskripsi=Uji c: laporan bernama lewat multipart dengan satu lampiran gambar yang sah." -F "lampiran=@$J/bukti.jpg;type=image/jpeg" "$U/api/pengaduan") $(cat "$J/out.json")"; NB=$(js "j.nomorKasus")
sql "const r=await kueri('SELECT id, anonim, nama_pelapor IS NOT NULL nama_ada, telepon_pelapor IS NOT NULL tel_ada, CAST(dibuat_pada AS CHAR) dibuat FROM pengaduan WHERE nomor_kasus=?',['$NB']); console.log('    DB:', JSON.stringify(r[0])); const l=await kueri('SELECT id, tipe_mime, ukuran, path FROM pengaduan_lampiran WHERE pengaduan_id=?',[r[0].id]); console.log('    lampiran:', JSON.stringify(l.map(x=>({id:x.id,tipe:x.tipe_mime,ukuran:x.ukuran,path:x.path.replace(/\/[0-9a-f]{24}\//,'/<acak>/').replace(/[0-9a-f]{32}\./,'<acak>.')}))));"
IDB=$(sql "const r=await kueri('SELECT id FROM pengaduan WHERE nomor_kasus=?',['$NB']); console.log(r[0].id);"); LID=$(sql "const r=await kueri('SELECT id FROM pengaduan_lampiran WHERE pengaduan_id=?',[$IDB]); console.log(r[0]?.id ?? '');"); JALUR=$(sql "const r=await kueri('SELECT path FROM pengaduan_lampiran WHERE pengaduan_id=?',[$IDB]); console.log(r[0]?.path ?? '');")

echo; echo "## p. Zona waktu — dibuat_pada pengaduan $NB vs WIB aplikasi"
sql "const {waktuSekarang}=await import('./lib/utils.js'); {const r=await kueri('SELECT CAST(dibuat_pada AS CHAR) t, @@session.time_zone z FROM pengaduan WHERE nomor_kasus=?',['$NB']); const w=waktuSekarang(); const d=s=>Date.parse(s.replace(' ','T')+'Z'); console.log('    dibuat_pada:', r[0].t, '| WIB aplikasi:', w, '| zona sesi:', r[0].z, '| selisih detik:', Math.round((d(w)-d(r[0].t))/1000)); console.log('    HASIL p:', Math.abs(d(w)-d(r[0].t))<120000 && r[0].z==='+07:00' ? 'LULUS (WIB)':'GAGAL');}"

echo; echo "## d. Pelacakan — JSON mentah $NB (bernama) tidak memuat identitas"
echo "  -> HTTP $(kode "$U/api/pengaduan/lacak/$NB")"; echo "    $(cat "$J/out.json")"
echo "    kata 'Pelapor Uji'/'0812'/'contoh.id'/nama_pelapor di JSON: $(grep -c -E 'Pelapor Uji|081200000000|pelapor.uji|nama_pelapor|nik_|telepon_|email_|petugas|catatan' "$J/out.json") (harus 0)"

echo; echo "## e. Pelacakan nomor asing vs nomor yang ada tetapi 'tidak berhak' — pesan HARUS sama"
k1=$(kode "$U/api/pengaduan/lacak/WRP-000001"); P1=$(cat "$J/out.json"); k2=$(kode "$U/api/pengaduan/lacak/WRP-99999999"); P2=$(cat "$J/out.json"); k3=$(kode "$U/api/pengaduan/lacak/xyz"); P3=$(cat "$J/out.json")
echo "  WRP-000001 (tidak ada): HTTP $k1 $P1"; echo "  WRP-99999999 (format salah): HTTP $k2 $P2"; echo "  xyz: HTTP $k3 $P3"; [ "$P1" = "$P2" ] && [ "$P2" = "$P3" ] && echo "  HASIL e: LULUS — ketiga balasan identik (tidak ada pembedaan keberadaan/hak)" || echo "  HASIL e: GAGAL"

echo; echo "## i. Catatan wajib — verifikator POST status tanpa catatan / catatan pendek"
echo "  tanpa catatan  -> HTTP $(kode -b "$J/verif.txt" -H 'content-type: application/json' -d '{"status":"diverifikasi"}' "$U/api/staf/pengaduan/$IDB/status") $(cat "$J/out.json")"
echo "  catatan 'ok'   -> HTTP $(kode -b "$J/verif.txt" -H 'content-type: application/json' -d '{"status":"diverifikasi","catatan":"ok"}' "$U/api/staf/pengaduan/$IDB/status") $(cat "$J/out.json")"

echo; echo "## f. UJI BUKU BESAR — $NB: baru -> diverifikasi -> diproses -> selesai (+ ditolak -> diproses = 5 perubahan)"
for pasangan in "diverifikasi|Bukti foto jembatan cocok dengan laporan warga." "diproses|Diteruskan ke tim advokasi wilayah untuk klarifikasi." "ditolak|Uji cabang: sementara ditolak karena bukti tambahan diminta." "diproses|Bukti tambahan diterima; kembali diproses." "selesai|Perbaikan jembatan dimulai; pelapor mengonfirmasi."; do st=${pasangan%%|*}; ct=${pasangan#*|}; echo "  -> $st : HTTP $(kode -b "$J/verif.txt" -H 'content-type: application/json' -d "{\"status\":\"$st\",\"catatan\":\"$ct\"}" "$U/api/staf/pengaduan/$IDB/status") $(js "JSON.stringify(j.perubahan ?? j)")"; done
echo "  isi pengaduan_riwayat (SELECT):"; sql "const r=await kueri('SELECT r.id, r.status_sebelum, r.status_sesudah, r.catatan, r.oleh_user_id, u.nama oleh, CAST(r.dibuat_pada AS CHAR) waktu FROM pengaduan_riwayat r LEFT JOIN users u ON u.id=r.oleh_user_id WHERE r.pengaduan_id=? ORDER BY r.id',[$IDB]); for (const x of r) console.log('    '+JSON.stringify(x)); let ok=r.length===6; for(let i=1;i<r.length;i++){ if(r[i].status_sebelum!==r[i-1].status_sesudah) ok=false; if(!r[i].catatan||!r[i].oleh_user_id) ok=false; } const s=await kueri('SELECT status FROM pengaduan WHERE id=?',[$IDB]); console.log('    status akhir pengaduan:', s[0].status); console.log('    HASIL f:', ok && s[0].status==='selesai' ? 'LULUS — 1 baris awal + 5 perubahan berantai, semua bercatatan & berpelaku, waktu WIB' : 'GAGAL');"

echo; echo "## g. UJI TRANSAKSI — trigger sementara menggagalkan INSERT riwayat -> status TIDAK berubah"
sql "await kueri(\"DROP TRIGGER IF EXISTS uji_gagal_riwayat\"); await kueri(\"CREATE TRIGGER uji_gagal_riwayat BEFORE INSERT ON pengaduan_riwayat FOR EACH ROW BEGIN IF NEW.catatan = 'GAGALKAN-UJI-G' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'simulasi gagal tulis riwayat'; END IF; END\"); const a=await kueri('SELECT status, (SELECT COUNT(*) FROM pengaduan_riwayat WHERE pengaduan_id=p.id) n FROM pengaduan p WHERE id=?',[$IDB]); console.log('    SEBELUM: status='+a[0].status+' riwayat='+a[0].n);"
echo "  POST status=baru catatan=GAGALKAN-UJI-G -> HTTP $(kode -b "$J/verif.txt" -H 'content-type: application/json' -d '{"status":"baru","catatan":"GAGALKAN-UJI-G"}' "$U/api/staf/pengaduan/$IDB/status") $(cat "$J/out.json")"
sql "const b=await kueri('SELECT status, (SELECT COUNT(*) FROM pengaduan_riwayat WHERE pengaduan_id=p.id) n FROM pengaduan p WHERE id=?',[$IDB]); console.log('    SESUDAH: status='+b[0].status+' riwayat='+b[0].n); console.log('    HASIL g:', b[0].status==='selesai' && Number(b[0].n)===6 ? 'LULUS — status & riwayat tidak berubah (rollback)' : 'GAGAL'); await kueri('DROP TRIGGER IF EXISTS uji_gagal_riwayat'); console.log('    trigger uji dihapus');"

echo; echo "## h. Penelusuran jalan pintas — UPDATE pengaduan … status di luar ubahStatusPengaduan()"
grep -rn -i "UPDATE pengaduan" app lib scripts --include=*.js | grep -i "status" | grep -v "ubahStatusPengaduan\|^lib/db/pengaduan.js:.*SET status = ?, diperbarui_pada = ? WHERE id = ?" | sed 's/^/    /' ; echo "    kemunculan 'SET status' pada tabel pengaduan di luar lib/db/pengaduan.js: $(grep -rn "UPDATE pengaduan SET status\|pengaduan.*SET.*status" app lib scripts --include=*.js | grep -v 'lib/db/pengaduan.js' | wc -l) (harus 0); di dalam lib/db/pengaduan.js hanya di ubahStatusPengaduan: $(grep -n "SET status" lib/db/pengaduan.js | sed 's/^/[/;s/$/]/' | tr '\n' ' ')"

echo; echo "## j. UJI PERAN"
echo "  penulis GET /api/staf/pengaduan               -> HTTP $(kode -b "$J/penulis.txt" "$U/api/staf/pengaduan")"
echo "  redaktur GET /api/staf/pengaduan              -> HTTP $(kode -b "$J/redaktur.txt" "$U/api/staf/pengaduan")"
echo "  pimpinan_wilayah POST status                  -> HTTP $(kode -b "$J/pw13.txt" -H 'content-type: application/json' -d '{"status":"diproses","catatan":"tidak boleh dari pimpinan wilayah"}' "$U/api/staf/pengaduan/$IDB/status")"
echo "  pimpinan_wilayah(3) GET daftar                -> HTTP $(kode -b "$J/pw3.txt" "$U/api/staf/pengaduan?perHalaman=50") $(js "'total='+j.total+' wilayah='+JSON.stringify([...new Set(j.baris.map(b=>b.wilayah_id))])+' kolom identitas ada='+j.baris.some(b=>'nama_pelapor' in b)")"
echo "  pimpinan_wilayah(13) GET daftar               -> HTTP $(kode -b "$J/pw13.txt" "$U/api/staf/pengaduan?perHalaman=50") $(js "'total='+j.total+' wilayah='+JSON.stringify([...new Set(j.baris.map(b=>b.wilayah_id))])+' kolom identitas ada='+j.baris.some(b=>'nama_pelapor' in b)")"
echo "  pimpinan_wilayah(13) GET detail $IDB (wil 13)  -> HTTP $(kode -b "$J/pw13.txt" "$U/api/staf/pengaduan/$IDB") $(js "'kunci='+Object.keys(j.pengaduan).filter(k=>/pelapor/.test(k)).join(',')+' (harus kosong) ; nama/nik/telepon/email di JSON: '+(/Pelapor Uji|081200000000|pelapor\.uji/.test(JSON.stringify(j))?'BOCOR':'0')")"
echo "  pimpinan_wilayah(3) GET detail $IDB (wil 13)   -> HTTP $(kode -b "$J/pw3.txt" "$U/api/staf/pengaduan/$IDB")"
echo "  verifikator GET detail                        -> HTTP $(kode -b "$J/verif.txt" "$U/api/staf/pengaduan/$IDB") $(js "'kunci identitas='+Object.keys(j.pengaduan).filter(k=>/pelapor/.test(k)).join(',')+' ; lampiran url='+(j.lampiran[0]?.url ?? '-')+' ; path disk ada='+JSON.stringify(j.lampiran[0]).includes('/unggahan/')")"

echo; echo "## m. Audit identitas — audit_log 'lihat_identitas_pelapor' oleh verifikator untuk pengaduan $IDB"
sql "const r=await kueri(\"SELECT a.aksi, a.user_id, u.peran, CAST(a.dibuat_pada AS CHAR) w FROM audit_log a JOIN users u ON u.id=a.user_id WHERE a.aksi='lihat_identitas_pelapor' AND a.tabel_terkait='pengaduan' AND a.id_terkait=? ORDER BY a.id DESC LIMIT 3\",[$IDB]); for (const x of r) console.log('    '+JSON.stringify(x)); console.log('    HASIL m:', r.some(x=>x.peran==='verifikator') ? 'LULUS' : 'GAGAL');"

echo; echo "## k. UJI LAMPIRAN (POST /api/pengaduan anonim)"
node -e "require('fs').writeFileSync('$J/besar.pdf', Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(25*1024*1024)]))"
echo "  25 MB (.pdf asli)            -> HTTP $(kode -F "token_formulir=$(token)" -F "anonim=1" -F "kategori_masalah=lainnya" -F "deskripsi=Uji k lampiran 25 MB harus ditolak karena melebihi batas per berkas." -F "lampiran=@$J/besar.pdf;type=application/pdf" "$U/api/pengaduan") $(cat "$J/out.json")"
printf 'MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff' > "$J/jahat.pdf"
echo "  .exe bernama .pdf            -> HTTP $(kode -F "token_formulir=$(token)" -F "anonim=1" -F "kategori_masalah=lainnya" -F "deskripsi=Uji k berkas exe yang diganti nama pdf harus ditolak oleh magic bytes." -F "lampiran=@$J/jahat.pdf;type=application/pdf" "$U/api/pengaduan") $(cat "$J/out.json")"
printf '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script></svg>' > "$J/jahat.svg"
echo "  .svg berisi script           -> HTTP $(kode -F "token_formulir=$(token)" -F "anonim=1" -F "kategori_masalah=lainnya" -F "deskripsi=Uji k berkas svg berisi skrip harus ditolak karena bukan tipe yang didukung." -F "lampiran=@$J/jahat.svg;type=image/svg+xml" "$U/api/pengaduan") $(cat "$J/out.json")"
echo "  6 berkas (maks 5)            -> HTTP $(kode -F "token_formulir=$(token)" -F "anonim=1" -F "kategori_masalah=lainnya" -F "deskripsi=Uji k enam lampiran sekaligus harus ditolak karena melebihi jumlah maksimal." -F "lampiran=@$J/bukti.jpg" -F "lampiran=@$J/bukti.jpg" -F "lampiran=@$J/bukti.jpg" -F "lampiran=@$J/bukti.jpg" -F "lampiran=@$J/bukti.jpg" -F "lampiran=@$J/bukti.jpg" "$U/api/pengaduan") $(cat "$J/out.json")"
echo "  pengaduan setengah jadi dari kiriman yang ditolak? jumlah pengaduan berdeskripsi 'Uji k': $(sql "const r=await kueri(\"SELECT COUNT(*) n FROM pengaduan WHERE deskripsi LIKE 'Uji k %'\"); console.log(r[0].n);") (harus 0)"
echo "  tebak URL lampiran: jalur disk $JALUR"
echo "    GET $JALUR (route publik)          -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' "$U$JALUR")  (harus 404: subfolder pengaduan tidak dilayani)"
echo "    GET /api/staf/pengaduan/$IDB/lampiran/$LID tanpa cookie -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' "$U/api/staf/pengaduan/$IDB/lampiran/$LID")"
echo "    … sebagai penulis -> HTTP $(kode -b "$J/penulis.txt" "$U/api/staf/pengaduan/$IDB/lampiran/$LID") ; pimpinan_wilayah(3, wilayah lain) -> HTTP $(kode -b "$J/pw3.txt" "$U/api/staf/pengaduan/$IDB/lampiran/$LID") ; verifikator -> HTTP $(curl.exe -s -o "$J/lamp.bin" -D "$J/lamp.h" -w '%{http_code}' -b "$J/verif.txt" "$U/api/staf/pengaduan/$IDB/lampiran/$LID") $(grep -iE '^content-type|^content-disposition|^x-content-type|^content-security' "$J/lamp.h" | tr -d '\r' | tr '\n' ' ')"
echo "    lampiran pengaduan LAIN lewat id pengaduan ini: /api/staf/pengaduan/1/lampiran/$LID (verifikator) -> HTTP $(kode -b "$J/verif.txt" "$U/api/staf/pengaduan/1/lampiran/$LID")  (harus 404)"

echo; echo "## Bersihkan: hapus lunak pengaduan uji $NA, $NB (tidak ada DELETE fisik — riwayat RESTRICT)"
sql "const {hapusLunakPengaduan}=await import('./lib/db/pengaduan.js'); for (const n of ['$NA','$NB']) { const r=await kueri('SELECT id FROM pengaduan WHERE nomor_kasus=?',[n]); if (r[0]) console.log('    hapus lunak', n, await hapusLunakPengaduan(r[0].id)); }"
rm -rf "$J"

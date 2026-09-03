#!/usr/bin/env bash
# UJI TAHAP 2 lewat curl (tanpa UI): a, b, c, d, e, g, h, i, j. Dijalankan terhadap
# dev server di http://localhost:3000 dengan STAF_HOST kosong. Kata sandi dari .env (tidak dicetak).
cd "$(dirname "$0")/../../.." || exit 1
U=http://localhost:3000
ADMIN_EMAIL=$(grep '^SEED_ADMIN_EMAIL=' .env | cut -d= -f2)
ADMIN_PASS=$(grep '^SEED_ADMIN_PASSWORD=' .env | cut -d= -f2)
STAF_PASS=$(grep '^SEED_STAF_PASSWORD=' .env | cut -d= -f2)
DB_PASS=$(grep '^DB_PASSWORD=' .env | cut -d= -f2)
J=$(mktemp -d)
sql() { docker exec -i warkop-mariadb mariadb -uwarkop -p"$DB_PASS" warkop_nusantara -e "$1" 2>&1; }
login() { # $1 email $2 sandi $3 jar $4 header tambahan (opsional)
  curl.exe -s -o "$J/badan.json" -w "%{http_code}" -c "$3" -H "content-type: application/json" ${4:+-H "$4"} \
    -d "{\"email\":\"$1\",\"kataSandi\":\"$2\"}" "$U/api/auth/login"; }
kode() { curl.exe -s -o /dev/null -w "%{http_code}" "$@"; }

echo "################ UJI a — login berhasil, cookie httpOnly, sampai ke dashboard"
echo "\$ curl -i -X POST /api/auth/login (superadmin)"
curl.exe -s -i -c "$J/admin.txt" -H "content-type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"kataSandi\":\"$ADMIN_PASS\"}" "$U/api/auth/login" | sed -E 's/(warkop_token=)[^;]+/\1<token-disembunyikan>/'
echo; echo "\$ curl -i /staf/dashboard  (dengan cookie)"; curl.exe -s -i -b "$J/admin.txt" "$U/staf/dashboard" | grep -E "^HTTP|Masuk sebagai" | sed -E 's/<[^>]+>//g'
echo "\$ curl -i /login (sudah bertoken -> dialihkan ke dashboard oleh proxy)"; curl.exe -s -i -b "$J/admin.txt" "$U/login" | grep -iE "^HTTP|^location"
echo "# cookie httpOnly: peramban tidak mengizinkan document.cookie membacanya (flag HttpOnly di Set-Cookie di atas; tidak ada peramban di lingkungan ini)"

echo; echo "################ UJI b — login gagal: email salah vs sandi salah -> pesan IDENTIK"
k1=$(login "tidak.ada@warkopnusantara.id" "sandi-salah" "$J/x1.txt"); b1=$(cat "$J/badan.json")
k2=$(login "$ADMIN_EMAIL" "sandi-salah" "$J/x2.txt"); b2=$(cat "$J/badan.json")
echo "email tidak terdaftar : HTTP $k1  $b1"; echo "sandi salah           : HTTP $k2  $b2"
[ "$b1" = "$b2" ] && echo "=> IDENTIK" || echo "=> BERBEDA (CACAT)"

echo; echo "################ login peran lain"
for u in budi.santoso:penulis siti.rahma:redaktur siti.aminah:verifikator rahmat.siregar:pimpinan_sumut pimpinan.jabar:pimpinan_jabar; do
  e=${u%%:*}; n=${u##*:}; k=$(login "$e@warkopnusantara.id" "$STAF_PASS" "$J/$n.txt"); echo "$e -> HTTP $k"; done

echo; echo "################ UJI c — LAPISAN 4: setiap route staf dengan peran TIDAK berhak (curl saja)"
printf "%-36s %-7s %-18s %-5s %s\n" "Route" "Metode" "Peran penguji" "Kode" "Lulus"
uji_c() { # route metode peran jar harapan
  k=$(curl.exe -s -o /dev/null -w "%{http_code}" -X "$2" -b "$4" "$U$1"); l="TIDAK"; [ "$k" = "$5" ] && l="ya"; printf "%-36s %-7s %-18s %-5s %s\n" "$1" "$2" "$3" "$k" "$l"; }
uji_c /api/staf/artikel GET verifikator "$J/verifikator.txt" 403
uji_c /api/staf/pengaduan GET penulis "$J/penulis.txt" 403
uji_c /api/staf/pengaduan GET redaktur "$J/redaktur.txt" 403
uji_c /api/staf/pengaduan/2 GET penulis "$J/penulis.txt" 403
uji_c /api/staf/pengaduan/2 GET redaktur "$J/redaktur.txt" 403
uji_c /api/staf/statistik GET "(tanpa cookie)" "$J/kosong.txt" 401
uji_c /api/staf/artikel GET "(tanpa cookie)" "$J/kosong.txt" 401
uji_c /api/staf/pengaduan GET "(tanpa cookie)" "$J/kosong.txt" 401
uji_c /api/auth/saya GET "(tanpa cookie)" "$J/kosong.txt" 401
echo "# cookie palsu (token dibuat sendiri, tanda tangan salah):"
echo "warkop_token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicGVyYW4iOiJzdXBlcmFkbWluIiwiaXNzIjoid2Fya29wLW51c2FudGFyYSJ9.palsu" > "$J/palsu.hdr"
k=$(curl.exe -s -o /dev/null -w "%{http_code}" -H "Cookie: $(cat "$J/palsu.hdr")" "$U/api/staf/statistik"); printf "%-36s %-7s %-18s %-5s %s\n" "/api/staf/statistik" GET "token palsu" "$k" "$([ "$k" = 401 ] && echo ya || echo TIDAK)"
echo "# header identitas disuntik klien (x-user-role: superadmin) tanpa cookie -> proxy menghapusnya:"
k=$(curl.exe -s -o /dev/null -w "%{http_code}" -H "x-user-role: superadmin" -H "x-user-id: 1" "$U/api/staf/statistik"); printf "%-36s %-7s %-18s %-5s %s\n" "/api/staf/statistik" GET "x-user-role palsu" "$k" "$([ "$k" = 401 ] && echo ya || echo TIDAK)"
echo "# peran yang BERHAK (pembanding, harus 200):"
uji_c /api/staf/artikel GET penulis "$J/penulis.txt" 200
uji_c /api/staf/pengaduan GET verifikator "$J/verifikator.txt" 200
uji_c /api/staf/pengaduan/2 GET superadmin "$J/admin.txt" 200
uji_c /api/staf/statistik GET redaktur "$J/redaktur.txt" 200
echo "# route yang belum dibuat (menyusul): POST/PATCH/DELETE artikel, terbitkan (T5); POST pengaduan status (T6); pengurus/program/galeri/pengguna/pengaturan/unggah (T7)"

echo; echo "################ UJI d — token_version: token lama ditolak setelah dinaikkan di DB"
login "budi.santoso@warkopnusantara.id" "$STAF_PASS" "$J/budi-lama.txt" >/dev/null
echo "sebelum: /api/auth/saya dengan token -> HTTP $(kode -b "$J/budi-lama.txt" "$U/api/auth/saya")"
echo "\$ SELECT id, token_version FROM users WHERE email='budi.santoso@...'"; sql "SELECT id, email, token_version FROM users WHERE email='budi.santoso@warkopnusantara.id'"
echo "\$ UPDATE users SET token_version = token_version + 1 WHERE email='budi.santoso@...'"; sql "UPDATE users SET token_version = token_version + 1 WHERE email='budi.santoso@warkopnusantara.id'"; sql "SELECT id, email, token_version FROM users WHERE email='budi.santoso@warkopnusantara.id'"
echo "sesudah: /api/auth/saya dengan token LAMA -> HTTP $(kode -b "$J/budi-lama.txt" "$U/api/auth/saya")  (harus 401)"
echo "sesudah: /api/staf/artikel dengan token LAMA -> HTTP $(kode -b "$J/budi-lama.txt" "$U/api/staf/artikel")  (harus 401)"
echo "sesudah: /staf/dashboard dengan token LAMA ->"; curl.exe -s -i -b "$J/budi-lama.txt" "$U/staf/dashboard" | grep -iE "^HTTP|^location"
echo "# tanda tangan token lama masih sah (proxy meloloskan), tetapi lapisan 3/4 menolak karena token_version di DB berbeda"
k=$(login "budi.santoso@warkopnusantara.id" "$STAF_PASS" "$J/budi-baru.txt"); echo "login ulang -> HTTP $k ; /api/auth/saya dengan token BARU -> HTTP $(kode -b "$J/budi-baru.txt" "$U/api/auth/saya")"

echo; echo "################ UJI e — halaman staf tanpa cookie -> /login (STAF_HOST kosong)"
echo "\$ curl -i /staf/dashboard"; curl.exe -s -i "$U/staf/dashboard" | grep -iE "^HTTP|^location"
echo "\$ curl -i /staf/pengaduan/1"; curl.exe -s -i "$U/staf/pengaduan/1" | grep -iE "^HTTP|^location"

echo; echo "################ UJI g — dua pimpinan_wilayah di wilayah berbeda (JSON mentah)"
echo "\$ GET /api/staf/pengaduan sebagai pimpinan Sumatera Utara:"; curl.exe -s -b "$J/pimpinan_sumut.txt" "$U/api/staf/pengaduan"; echo
echo "\$ GET /api/staf/pengaduan sebagai pimpinan Jawa Barat:"; curl.exe -s -b "$J/pimpinan_jabar.txt" "$U/api/staf/pengaduan"; echo
echo "\$ GET /api/staf/pengaduan/1 (WRP-009021, Jawa Barat) sebagai pimpinan Sumut -> HTTP $(kode -b "$J/pimpinan_sumut.txt" "$U/api/staf/pengaduan/1")  (harus 404: bukan wilayahnya)"
echo "\$ GET /api/staf/pengaduan/1 sebagai pimpinan Jabar -> HTTP $(kode -b "$J/pimpinan_jabar.txt" "$U/api/staf/pengaduan/1")  (harus 200)"
echo "\$ GET /api/staf/pengaduan/2 (DKI) sebagai pimpinan Jabar -> HTTP $(kode -b "$J/pimpinan_jabar.txt" "$U/api/staf/pengaduan/2")  (harus 404)"
echo "\$ GET /api/staf/artikel sebagai pimpinan Jabar (total harus 3 = artikel wilayah Jabar):"; curl.exe -s -b "$J/pimpinan_jabar.txt" "$U/api/staf/artikel" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('total',j.total,'| wilayah:',[...new Set(j.baris.map(b=>b.wilayah_nama))].join(','))})"
echo "\$ GET /api/staf/statistik sebagai pimpinan Sumut:"; curl.exe -s -b "$J/pimpinan_sumut.txt" "$U/api/staf/statistik"; echo
echo "# kueri SQL yang dijalankan: lihat g-sql-log.txt (server dijalankan ulang dengan DB_LOG_KUERI=1)"

echo; echo "################ UJI h — identitas pelapor tidak ikut di balasan peran tidak berhak (JSON mentah)"
echo "\$ GET /api/staf/pengaduan/2 (bernama) sebagai pimpinan_wilayah DKI? -> tidak ada pimpinan DKI; dipakai daftar Jabar (WRP-009021 anonim) dan pembanding superadmin"
echo "\$ GET /api/staf/pengaduan sebagai pimpinan Jabar:"; r=$(curl.exe -s -b "$J/pimpinan_jabar.txt" "$U/api/staf/pengaduan"); echo "$r"; echo "kemunculan kunci identitas (nama_pelapor|nik_pelapor|telepon_pelapor|email_pelapor): $(echo "$r" | grep -o 'nama_pelapor\|nik_pelapor\|telepon_pelapor\|email_pelapor' | wc -l)  (harus 0)"
echo "\$ GET /api/staf/pengaduan/2 sebagai redaktur -> HTTP $(kode -b "$J/redaktur.txt" "$U/api/staf/pengaduan/2")  (403: redaktur tidak punya hak pengaduan sama sekali)"
echo "\$ GET /api/staf/pengaduan/2 sebagai verifikator (BERHAK — pembanding):"; r=$(curl.exe -s -b "$J/verifikator.txt" "$U/api/staf/pengaduan/2"); echo "$r" | sed -E 's/("(nik|telepon|email)_pelapor":")[^"]*/\1<disembunyikan-di-bukti>/g'; echo "kemunculan kunci identitas: $(echo "$r" | grep -o 'nama_pelapor\|nik_pelapor\|telepon_pelapor\|email_pelapor' | wc -l)  (4 = berhak)"
echo "\$ audit_log pembukaan identitas:"; sql "SELECT id, user_id, aksi, tabel_terkait, id_terkait, ip, dibuat_pada FROM audit_log WHERE aksi='lihat_identitas_pelapor' ORDER BY id DESC LIMIT 3"

echo; echo "################ UJI i — rate limit: 20 kegagalan dari satu IP -> 429; pemilik sah dari IP lain tetap bisa masuk"
for n in $(seq 1 21); do k=$(login "siti.rahma@warkopnusantara.id" "sandi-salah-$n" "$J/rl.txt" "X-Forwarded-For: 203.0.113.9"); printf "%s " "$k"; done; echo
echo "(20 pertama 401, ke-21 harus 429)  badan ke-21: $(cat "$J/badan.json")"
echo "pemilik sah dari IP lain (198.51.100.7) dengan sandi benar -> HTTP $(login "siti.rahma@warkopnusantara.id" "$STAF_PASS" "$J/rl-ok.txt" "X-Forwarded-For: 198.51.100.7")  (harus 200: akun TIDAK terkunci)"
echo "IP penyerang (203.0.113.9) dengan sandi BENAR -> HTTP $(login "siti.rahma@warkopnusantara.id" "$STAF_PASS" "$J/rl-x.txt" "X-Forwarded-For: 203.0.113.9")  (429: IP itu dibatasi 15 menit)"
echo "# sumbu akun: 30 kegagalan/15 menit dari IP mana pun -> 429 untuk akun itu selama sisa jendela; login berhasil menghapus hitungan akun."

echo; echo "################ UJI j — atribut cookie"
echo "\$ Set-Cookie saat login lewat http (dev):"; curl.exe -s -i -c "$J/j1.txt" -H "content-type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"kataSandi\":\"$ADMIN_PASS\"}" "$U/api/auth/login" | grep -i "^set-cookie" | sed -E 's/(warkop_token=)[^;]+/\1<token>/'
echo "\$ Set-Cookie saat login di balik HTTPS (X-Forwarded-Proto: https, seperti Traefik) / produksi:"; curl.exe -s -i -c "$J/j2.txt" -H "X-Forwarded-Proto: https" -H "content-type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"kataSandi\":\"$ADMIN_PASS\"}" "$U/api/auth/login" | grep -i "^set-cookie" | sed -E 's/(warkop_token=)[^;]+/\1<token>/'
echo "\$ logout -> cookie dihapus:"; curl.exe -s -i -X POST -b "$J/j1.txt" "$U/api/auth/logout" | grep -iE "^HTTP|^set-cookie" | sed -E 's/(warkop_token=)[^;]*/\1<kosong>/'
rm -rf "$J"

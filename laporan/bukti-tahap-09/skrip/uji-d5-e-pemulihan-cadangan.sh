#!/usr/bin/env bash
# Tahap 9 — D5 uji pemulihan (MariaDB dimatikan saat aplikasi berjalan) dan E pencadangan + PEMULIHAN ke basis data kosong.
# Prasyarat: server produksi lokal (NODE_ENV=production node server.js) di 127.0.0.1:3000, container `warkop-mariadb`,
# kredensial di .env (DB_PASSWORD, MARIADB_ROOT_PASSWORD_LOKAL). Kata sandi tidak dicetak.
set -u
cd "$(dirname "$0")/../../.."
U=http://127.0.0.1:3000
DBPW=$(grep '^DB_PASSWORD=' .env | cut -d= -f2- | tr -d '"'); ROOTPW=$(grep '^MARIADB_ROOT_PASSWORD_LOKAL=' .env | cut -d= -f2- | tr -d '"')
DBNAME=$(grep '^DB_NAME=' .env | cut -d= -f2- | tr -d '"'); DBNAME=${DBNAME:-warkop_nusantara}
sql() { MSYS_NO_PATHCONV=1 docker exec -i -e MYSQL_PWD="$ROOTPW" warkop-mariadb mariadb -uroot "$@"; }
kode() { curl.exe -s -o /dev/null -m 10 -w '%{http_code}' "$1"; }
echo "# D5 & E — $(date -u +%FT%TZ)"

echo; echo "## D5. Pemulihan: MariaDB dimatikan saat aplikasi berjalan"
echo "sebelum: /api/health $(kode $U/api/health), / $(kode $U/), /berita $(kode $U/berita)"
echo "\$ docker stop warkop-mariadb"; docker stop warkop-mariadb >/dev/null; sleep 3
H=$(kode $U/api/health); echo "saat DB mati: /api/health -> $H (harus 503): $(curl.exe -s -m 10 $U/api/health)"
B=$(curl.exe -s -m 20 -w '\nHTTP %{http_code}' $U/berita); echo "GET /berita saat DB mati -> $(echo "$B" | tail -1)"
echo "  jejak galat (stack/SQL/ECONNREFUSED) di HTML: $(echo "$B" | grep -ciE 'ECONNREFUSED|at async|node_modules|sqlMessage|stack' ) kemunculan; teks pesan rapi: $(echo "$B" | grep -oE 'Halaman tidak dapat dimuat|Terjadi kesalahan|gangguan|coba lagi|Server sedang' | sort -u | tr '\n' ' ')"
L=$(curl.exe -s -m 20 -o /dev/null -w '%{http_code}' -X POST -H 'content-type: application/json' -d '{"email":"a@b.c","kataSandi":"x"}' $U/api/auth/login); echo "POST /api/auth/login saat DB mati -> $L (harus 500 JSON rapi, bukan crash)"
echo "\$ docker start warkop-mariadb"; docker start warkop-mariadb >/dev/null
for i in $(seq 1 40); do H=$(kode $U/api/health); [ "$H" = "200" ] && break; sleep 2; done
echo "setelah DB kembali (tanpa restart aplikasi): /api/health -> $H setelah ±$((i*2)) s; / $(kode $U/), /berita $(kode $U/berita), login superadmin: $(curl.exe -s -m 20 -o /dev/null -w '%{http_code}' -X POST -H 'content-type: application/json' -d "{\"email\":\"$(grep ^SEED_ADMIN_EMAIL= .env|cut -d= -f2-)\",\"kataSandi\":\"$(grep ^SEED_ADMIN_PASSWORD= .env|cut -d= -f2-)\"}" $U/api/auth/login)"
echo "HASIL D5: $([ "$H" = "200" ] && echo 'LULUS — pulih sendiri' || echo 'GAGAL')"

echo; echo "## E. Pencadangan sungguhan + pemulihan ke basis data KOSONG + verifikasi data utuh"
mkdir -p cadangan
echo "\$ DB_CONTAINER=warkop-mariadb DB_PASSWORD=*** sh scripts/cadangkan-db.sh cadangan"
DB_CONTAINER=warkop-mariadb DB_USER=warkop DB_PASSWORD="$DBPW" DB_NAME="$DBNAME" sh scripts/cadangkan-db.sh cadangan 2>&1 | sed "s/$DBPW/***/g"
BERKAS=$(ls -t cadangan/*.sql.gz | head -1); echo "berkas cadangan: $BERKAS ($(du -h "$BERKAS" | cut -f1)); gunzip -t: $(gunzip -t "$BERKAS" && echo utuh)"
echo "\$ CREATE DATABASE warkop_pulih (kosong) + GRANT ke user warkop"
sql -e "DROP DATABASE IF EXISTS warkop_pulih; CREATE DATABASE warkop_pulih CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL ON warkop_pulih.* TO 'warkop'@'%'; FLUSH PRIVILEGES;"
echo "\$ gunzip -c cadangan | mariadb warkop_pulih"
gunzip -c "$BERKAS" | sql warkop_pulih && echo "pemulihan selesai"
echo; echo "### Perbandingan jumlah baris asli vs pulih"
printf "| tabel | asli | pulih |\n|---|---|---|\n"
for t in users artikel pengaduan pengaduan_riwayat pengaduan_lampiran pengaturan audit_log wilayah pengurus program galeri kategori_artikel; do a=$(sql -N -e "SELECT COUNT(*) FROM $DBNAME.$t" 2>/dev/null); p=$(sql -N -e "SELECT COUNT(*) FROM warkop_pulih.$t" 2>/dev/null); printf "| %s | %s | %s |%s\n" "$t" "$a" "$p" "$([ "$a" = "$p" ] || echo ' BEDA')"; done
echo "### Checksum tabel inti (CHECKSUM TABLE) asli vs pulih"
for t in pengaduan pengaduan_riwayat artikel users pengaturan; do a=$(sql -N -e "CHECKSUM TABLE $DBNAME.$t" | awk '{print $2}'); p=$(sql -N -e "CHECKSUM TABLE warkop_pulih.$t" | awk '{print $2}'); echo "  $t: asli=$a pulih=$p $([ "$a" = "$p" ] && echo SAMA || echo BEDA)"; done
echo "### Riwayat pengaduan di DB pulih: rantai utuh?"
sql -N -e "SELECT CONCAT('pengaduan tanpa riwayat: ', COUNT(*)) FROM warkop_pulih.pengaduan p LEFT JOIN warkop_pulih.pengaduan_riwayat r ON r.pengaduan_id=p.id WHERE r.id IS NULL; SELECT CONCAT('rantai putus: ', COUNT(*)) FROM warkop_pulih.pengaduan_riwayat a JOIN warkop_pulih.pengaduan_riwayat b ON b.pengaduan_id=a.pengaduan_id AND b.id=(SELECT MIN(id) FROM warkop_pulih.pengaduan_riwayat c WHERE c.pengaduan_id=a.pengaduan_id AND c.id>a.id) WHERE a.status_sesudah<>b.status_sebelum;"
echo "### Lampiran: berkas di public/unggahan & unggahan-terjaga (dicadangkan terpisah bersama volume)"
echo "  public/unggahan: $(find public/unggahan -type f | wc -l) berkas; unggahan-terjaga: $(find unggahan-terjaga -type f 2>/dev/null | wc -l) berkas; baris pengaduan_lampiran (pulih): $(sql -N -e 'SELECT COUNT(*) FROM warkop_pulih.pengaduan_lampiran')"
echo; echo "### Aplikasi dijalankan terhadap basis data hasil pemulihan (port 3001, DB_NAME=warkop_pulih)"
powershell.exe -NoProfile -Command 'Set-Location D:\Deploy\LSM; $env:NODE_ENV="production"; $env:PORT="3001"; $env:DB_NAME="warkop_pulih"; $p = Start-Process -FilePath node -ArgumentList "server.js" -WorkingDirectory "D:\Deploy\LSM" -RedirectStandardOutput "$env:TEMP\warkop-pulih.out" -RedirectStandardError "$env:TEMP\warkop-pulih.err" -PassThru -WindowStyle Hidden; $p.Id | Out-File -Encoding ascii "$env:TEMP\warkop-pulih.pid"'
for i in $(seq 1 40); do H=$(kode http://127.0.0.1:3001/api/health); [ "$H" = "200" ] && break; sleep 2; done
echo "  /api/health (DB pulih) -> $H: $(curl.exe -s -m 10 http://127.0.0.1:3001/api/health)"
echo "  / -> $(kode http://127.0.0.1:3001/), /berita -> $(kode http://127.0.0.1:3001/berita), /lacak -> $(kode http://127.0.0.1:3001/lacak)"
TK=$(curl.exe -s -D - -o /dev/null -m 20 -X POST -H 'content-type: application/json' -d "{\"email\":\"$(grep ^SEED_ADMIN_EMAIL= .env|cut -d= -f2-)\",\"kataSandi\":\"$(grep ^SEED_ADMIN_PASSWORD= .env|cut -d= -f2-)\"}" http://127.0.0.1:3001/api/auth/login | grep -io "warkop_token=[^;]*" | cut -d= -f2)
echo "  login superadmin di DB pulih: $([ -n "$TK" ] && echo ok || echo GAGAL); artikel via API: $(curl.exe -s -m 10 http://127.0.0.1:3001/api/artikel | grep -o '"total":[0-9]*'); pengaduan staf: $(curl.exe -s -m 10 -b "warkop_token=$TK" 'http://127.0.0.1:3001/api/staf/pengaduan?perHalaman=1' | grep -o '"total":[0-9]*'); pengaturan: $(curl.exe -s -m 10 -b "warkop_token=$TK" http://127.0.0.1:3001/api/staf/pengaturan | grep -o '"kontak_email":"[^"]*"')"
PID=$(cat "$TEMP/warkop-pulih.pid" 2>/dev/null); [ -n "$PID" ] && powershell.exe -NoProfile -Command "Stop-Process -Id $PID -Force" 2>/dev/null; echo "  server DB pulih dimatikan"
sql -e "DROP DATABASE warkop_pulih;" && echo "  basis data warkop_pulih dihapus (uji selesai); berkas cadangan tetap di cadangan/ (gitignored? $(grep -c '^cadangan' .gitignore))"
echo "HASIL E: lihat tabel perbandingan di atas (semua SAMA = LULUS)"

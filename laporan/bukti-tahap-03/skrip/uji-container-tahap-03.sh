#!/usr/bin/env bash
# UJI TAHAP 3 pada container hasil build (compose lokal): c, d, e, f, g, h, i, j.
# Prasyarat: image warkop-nusantara:lokal sudah dibangun (bukti a), npm run dev TIDAK berjalan (port 3000).
cd "$(dirname "$0")/../../.." || exit 1
U=http://127.0.0.1:3000
ADMIN_EMAIL=$(grep '^SEED_ADMIN_EMAIL=' .env | cut -d= -f2)
ADMIN_PASS=$(grep '^SEED_ADMIN_PASSWORD=' .env | cut -d= -f2)
STAF_PASS=$(grep '^SEED_STAF_PASSWORD=' .env | cut -d= -f2)
J=$(mktemp -d)
sehat() { docker inspect --format '{{.State.Health.Status}}' warkop-lokal-app-1 2>/dev/null; }
tunggu_status() { # $1 status $2 maks detik
  for i in $(seq 1 "$2"); do s=$(sehat); [ "$s" = "$1" ] && { echo "  -> '$1' setelah ${i}s"; return 0; }; sleep 1; done; echo "  -> masih '$(sehat)' setelah $2 s"; return 1; }

echo "################ UJI c — docker compose up (image sudah dibangun, --no-build)"
docker compose down -v --remove-orphans >/dev/null 2>&1
echo "\$ docker compose up -d --no-build"; docker compose up -d --no-build 2>&1 | tail -4
echo "\$ menunggu healthy (start-period 40 s)"; tunggu_status healthy 120
echo "\$ docker compose logs app (log awal)"; docker compose logs --no-log-prefix app 2>&1 | head -12
echo "\$ docker compose ps"; docker compose ps --format 'table {{.Name}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
echo "\$ curl -i /api/health"; curl.exe -s -i "$U/api/health" | grep -E "^HTTP|basisData"

echo; echo "################ UJI d — healthcheck sungguhan: healthy -> (db mati) unhealthy -> (db hidup) healthy"
echo "status awal: $(sehat)"
echo "\$ docker compose stop db"; docker compose stop db >/dev/null 2>&1
echo "\$ curl /api/health (db mati) -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' "$U/api/health")"
echo "\$ menunggu 'unhealthy' (interval 30 s x 3 percobaan gagal)"; tunggu_status unhealthy 150
echo "\$ docker inspect Health (2 log terakhir):"; docker inspect --format '{{range .State.Health.Log}}{{.Start}} exit={{.ExitCode}}{{"\n"}}{{end}}' warkop-lokal-app-1 | tail -2
echo "\$ docker compose start db"; docker compose start db >/dev/null 2>&1
echo "\$ menunggu 'healthy' kembali"; tunggu_status healthy 150
echo "\$ curl /api/health (db hidup) -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' "$U/api/health")"

echo; echo "################ UJI e — login di container (alur Tahap 2)"
echo "\$ docker compose exec app node scripts/seed.js   (superadmin + data awal; skema sudah dari ./sql saat init)"
docker compose exec -T app node scripts/seed.js 2>&1 | grep "^\[seed\]" | head -8
k=$(curl.exe -s -o "$J/b.json" -w "%{http_code}" -c "$J/admin.txt" -H "content-type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"kataSandi\":\"$ADMIN_PASS\"}" "$U/api/auth/login")
echo "POST /api/auth/login (superadmin) -> HTTP $k  $(sed -E 's/"email":"[^"]*"/"email":"<disembunyikan>"/' "$J/b.json")"
echo "GET /api/auth/saya (cookie) -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' -b "$J/admin.txt" "$U/api/auth/saya")"
echo "GET /staf/dashboard (cookie) -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' -b "$J/admin.txt" "$U/staf/dashboard")"
echo "GET /api/staf/pengaduan (cookie superadmin) -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' -b "$J/admin.txt" "$U/api/staf/pengaduan")"
k2=$(curl.exe -s -o "$J/b2.json" -w "%{http_code}" -H "content-type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"kataSandi\":\"salah\"}" "$U/api/auth/login"); echo "login sandi salah -> HTTP $k2 $(cat "$J/b2.json")"
echo "GET /login dengan cookie -> $(curl.exe -s -i -b "$J/admin.txt" "$U/login" | grep -iE '^HTTP|^location' | tr '\n' ' ')"

echo; echo "################ UJI f — PROXY DI CONTAINER (proxy.js tersalin & berjalan)"
echo "\$ docker compose exec app ls -l /app/proxy.js /app/server.js /app/lib/socket/server.js"; docker compose exec -T app ls -l /app/proxy.js /app/server.js /app/lib/socket/server.js
echo "\$ GET /staf/dashboard tanpa cookie (STAF_HOST kosong):"; curl.exe -s -i "$U/staf/dashboard" | grep -iE "^HTTP|^location"
echo "\$ header x-user-role palsu tanpa cookie -> /api/staf/statistik HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' -H 'x-user-role: superadmin' "$U/api/staf/statistik")  (401 = proxy menghapus header)"
echo "\$ container kedua dari image yang SAMA dengan STAF_HOST=staf.warkop.test (port 3001) untuk uji pemisahan host:"
docker rm -f warkop-uji-host >/dev/null 2>&1
docker run -d --name warkop-uji-host --network warkop-lokal_default -p 127.0.0.1:3001:3000 \
  -e DB_HOST=db -e DB_PORT=3306 -e DB_USER=warkop -e DB_PASSWORD="$(grep '^DB_PASSWORD=' .env | cut -d= -f2)" -e DB_NAME=warkop_nusantara \
  -e JWT_SECRET="$(grep '^JWT_SECRET=' .env | cut -d= -f2)" -e STAF_HOST=staf.warkop.test warkop-nusantara:lokal >/dev/null
for i in $(seq 1 30); do curl.exe -s -o /dev/null "http://127.0.0.1:3001/api/health" && break; sleep 1; done
uji_host() { echo "  \$ curl -i -H \"Host: $1\" -H \"X-Forwarded-Host: $1\" -H \"X-Forwarded-Proto: https\" :3001$2"; curl.exe -s -i -H "Host: $1" -H "X-Forwarded-Host: $1" -H "X-Forwarded-Proto: https" "http://127.0.0.1:3001$2" | grep -iE "^HTTP|^location"; }
uji_host warkop.test /staf/dashboard
uji_host warkop.test /login
uji_host staf.warkop.test /tentang
uji_host staf.warkop.test /staf/dashboard
uji_host warkop.test /api/health
echo "  0.0.0.0 di Location: $(curl.exe -s -i -H 'Host: warkop.test' -H 'X-Forwarded-Proto: https' http://127.0.0.1:3001/staf/dashboard | grep -i '^location' | grep -c '0.0.0.0')  localhost di Location: $(curl.exe -s -i -H 'Host: warkop.test' -H 'X-Forwarded-Proto: https' http://127.0.0.1:3001/staf/dashboard | grep -i '^location' | grep -c 'localhost')"
docker rm -f warkop-uji-host >/dev/null 2>&1

echo; echo "################ UJI g — ZONA WAKTU DI CONTAINER"
echo "\$ docker compose exec app date"; docker compose exec -T app date
echo "\$ docker compose exec app cat /etc/timezone"; docker compose exec -T app cat /etc/timezone
echo "\$ curl /api/health -> waktu"; curl.exe -s "$U/api/health" | grep -o '"waktu":"[^"]*"'
echo "\$ dari aplikasi di container (lib/db): INSERT lewat catatAudit, SELECT NOW(), @@session.time_zone, dibuat_pada"
docker compose exec -T app node --input-type=module -e "
import { kueri, tutupPool } from '/app/lib/db/index.js';
import { catatAudit } from '/app/lib/db/audit.js';
import { waktuSekarang } from '/app/lib/utils.js';
const wib = waktuSekarang();
const id = await catatAudit({ aksi: 'uji_zona_waktu_container', tabelTerkait: 'audit_log' });
const [a] = await kueri('SELECT NOW() AS now_db, @@session.time_zone AS zona, @@system_time_zone AS zona_server');
const [b] = await kueri('SELECT CAST(dibuat_pada AS CHAR) AS tersimpan FROM audit_log WHERE id = ?', [id]);
console.log('  WIB sebenarnya (UTC+7 dari JS) :', wib);
console.log('  NOW() lewat pool aplikasi      :', waktuSekarang(a.now_db), '| @@session.time_zone =', a.zona, '| server DB =', a.zona_server);
console.log('  dibuat_pada tersimpan (id', id + ') :', b.tersimpan);
const d = (s) => Date.parse(s.replace(' ', 'T') + 'Z');
const ok = Math.abs(d(waktuSekarang(a.now_db)) - d(wib)) < 5000 && Math.abs(d(b.tersimpan) - d(wib)) < 5000 && a.zona === '+07:00';
console.log('  HASIL:', ok ? 'SELARAS (WIB ketiganya)' : 'TIDAK SELARAS');
await tutupPool();
"

echo; echo "################ UJI h — user non-root"
echo "\$ docker compose exec app whoami -> $(docker compose exec -T app whoami)"; echo "\$ docker compose exec app id -> $(docker compose exec -T app id)"

echo; echo "################ UJI i — volume unggahan bertahan setelah container diganti"
echo "\$ docker compose exec app sh -c 'echo uji-volume-\$(date +%s) > /app/public/unggahan/uji-volume.txt'"; docker compose exec -T app sh -c 'echo "uji-volume-$(date +%s)" > /app/public/unggahan/uji-volume.txt && ls -l /app/public/unggahan/ && cat /app/public/unggahan/uji-volume.txt'
echo "\$ curl /unggahan/uji-volume.txt -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' "$U/unggahan/uji-volume.txt")"
echo "\$ docker compose down (tanpa -v) lalu up -d --no-build (container BARU)"; docker compose down >/dev/null 2>&1; docker compose up -d --no-build >/dev/null 2>&1; tunggu_status healthy 120
echo "\$ isi volume di container baru:"; docker compose exec -T app cat /app/public/unggahan/uji-volume.txt && echo "  -> berkas MASIH ADA"
echo "\$ docker volume ls | grep warkop-compose"; docker volume ls --format '{{.Name}}' | grep warkop-compose

echo; echo "################ UJI j — rollback ke image versi sebelumnya"
echo "\$ docker tag warkop-nusantara:lokal warkop-nusantara:rilis-1   (versi sebelumnya)"; docker tag warkop-nusantara:lokal warkop-nusantara:rilis-1
echo "\$ 'versi baru' = image turunan dengan LABEL rilis=2 (id berbeda):"; printf 'FROM warkop-nusantara:lokal\nLABEL rilis=2\n' | docker build -q -t warkop-nusantara:rilis-2 - 2>&1 | tail -1
docker images warkop-nusantara --format '  {{.Repository}}:{{.Tag}} {{.ID}}'
echo "\$ jalankan rilis-2 menggantikan app compose, lalu 'rusak' -> hentikan, jalankan rilis-1 di port yang sama"
docker compose stop app >/dev/null 2>&1
ENVAPP="-e DB_HOST=db -e DB_PORT=3306 -e DB_USER=warkop -e DB_PASSWORD=$(grep '^DB_PASSWORD=' .env | cut -d= -f2) -e DB_NAME=warkop_nusantara -e JWT_SECRET=$(grep '^JWT_SECRET=' .env | cut -d= -f2)"
docker run -d --name warkop-rilis-2 --network warkop-lokal_default -p 127.0.0.1:3000:3000 $ENVAPP -v warkop-lokal_warkop-compose-unggahan:/app/public/unggahan warkop-nusantara:rilis-2 >/dev/null
for i in $(seq 1 30); do curl.exe -s -o /dev/null "$U/api/health" && break; sleep 1; done
echo "  rilis-2 berjalan: /api/health -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' "$U/api/health") ; image: $(docker inspect --format '{{.Config.Image}}' warkop-rilis-2)"
docker rm -f warkop-rilis-2 >/dev/null 2>&1
echo "  rilis-2 dihentikan & dihapus; /api/health -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' "$U/api/health" 2>/dev/null || echo 'tidak ada koneksi')"
docker run -d --name warkop-rilis-1 --network warkop-lokal_default -p 127.0.0.1:3000:3000 $ENVAPP -v warkop-lokal_warkop-compose-unggahan:/app/public/unggahan warkop-nusantara:rilis-1 >/dev/null
for i in $(seq 1 30); do curl.exe -s -o /dev/null "$U/api/health" && break; sleep 1; done
echo "  rilis-1 (sebelumnya) dijalankan: /api/health -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' "$U/api/health") ; image: $(docker inspect --format '{{.Config.Image}}' warkop-rilis-1)"
echo "  volume unggahan tetap terbaca dari rilis-1: $(docker exec warkop-rilis-1 cat /app/public/unggahan/uji-volume.txt)"
echo "  login di rilis-1 -> HTTP $(curl.exe -s -o /dev/null -w '%{http_code}' -H 'content-type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"kataSandi\":\"$ADMIN_PASS\"}" "$U/api/auth/login")"
docker rm -f warkop-rilis-1 >/dev/null 2>&1
docker compose start app >/dev/null 2>&1; tunggu_status healthy 120
echo "  app compose dipulihkan: $(sehat)"
rm -rf "$J"

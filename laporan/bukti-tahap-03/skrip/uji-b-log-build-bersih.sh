#!/usr/bin/env bash
# UJI b — log build bersih dari rahasia. Memeriksa a-build-log.txt baris per baris:
#   1. NILAI DB_PASSWORD / JWT_SECRET / SEED_ADMIN_PASSWORD (dari .env lokal) tidak boleh muncul
#   2. NAMA variabel rahasia tidak boleh muncul sebagai ARG/ENV di log (hanya NEXT_PUBLIC_* yang wajar)
cd "$(dirname "$0")/../../.." || exit 1
LOG=laporan/bukti-tahap-03/a-build-log.txt
gagal=0
echo "# berkas: $LOG ($(wc -l < "$LOG") baris)"
echo
echo "## 1. nilai rahasia .env lokal di log (harus 0 semua; nilainya sendiri tidak dicetak di sini)"
for v in DB_PASSWORD JWT_SECRET SEED_ADMIN_PASSWORD SEED_STAF_PASSWORD MARIADB_ROOT_PASSWORD_LOKAL; do
  nilai=$(grep "^$v=" .env | cut -d= -f2-)
  [ -z "$nilai" ] && { printf "  %-28s (kosong di .env)\n" "$v"; continue; }
  n=$(grep -F -c -- "$nilai" "$LOG"); printf "  %-28s kemunculan nilai: %s\n" "$v" "$n"; [ "$n" != "0" ] && gagal=1
done
echo
echo "## 2. nama variabel di log build (grep -n)"
for v in DB_PASSWORD JWT_SECRET SEED_ADMIN_PASSWORD; do
  n=$(grep -c "$v" "$LOG"); printf "  %-22s baris: %s\n" "$v" "$n"; grep -n "$v" "$LOG" | head -3 | sed 's/^/      /'; [ "$n" != "0" ] && gagal=1
done
echo
echo "## 3. baris ARG/ENV yang tercetak di log (yang wajar hanya NEXT_PUBLIC_*, NODE_ENV, TZ, PORT, HOSTNAME, NEXT_TELEMETRY_DISABLED)"
grep -nE "\[(builder|runner|deps) +[0-9]+/[0-9]+\] (ARG|ENV) " "$LOG" | sed 's/^/  /'
echo
echo "## 4. potongan log tahap builder di sekitar 'npm run build' (Environments)"
grep -nE "Environments|Next.js 16|Compiled successfully|Proxy \(Middleware\)|npm prune" "$LOG" | sed 's/^/  /'
echo
echo "## 5. transferring context (ukuran konteks SESUDAH .dockerignore)"
grep -i "transferring context" "$LOG" | tail -1 | sed 's/^/  /'
echo
[ "$gagal" = 0 ] && echo "HASIL: LULUS — log build bersih dari nilai maupun nama rahasia" || echo "HASIL: GAGAL — ada rahasia di log build"
exit $gagal

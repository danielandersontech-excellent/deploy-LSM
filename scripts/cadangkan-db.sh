#!/usr/bin/env sh
# scripts/cadangkan-db.sh — dump basis data WARKOP NUSANTARA bertanggal (WIB), terkompresi.
#
# Pemakaian (di server, dari host yang menjalankan Docker):
#   DB_CONTAINER=<nama_container_mariadb> DB_USER=warkop DB_PASSWORD='<sandi>' DB_NAME=warkop_nusantara \
#     sh scripts/cadangkan-db.sh [folder_tujuan]
#   Bawaan folder tujuan: ./cadangan  ->  cadangan/warkop_nusantara-YYYYMMDD-HHMM.sql.gz
#
# Jadwalkan lewat cron (contoh tiap hari 02:00 WIB, simpan 14 hari):
#   0 2 * * * cd /opt/warkop && DB_CONTAINER=... DB_PASSWORD=... sh scripts/cadangkan-db.sh /var/backups/warkop && \
#             find /var/backups/warkop -name '*.sql.gz' -mtime +14 -delete
#
# PEMULIHAN (uji di Tahap 9 — jangan menunggu bencana untuk mencobanya):
#   gunzip -c cadangan/warkop_nusantara-YYYYMMDD-HHMM.sql.gz | \
#     docker exec -i <container_db> mariadb -u<user> -p'<sandi>' warkop_nusantara
#   Pulihkan ke basis data KOSONG (atau salinan) lebih dulu, periksa, baru ke produksi.
#
# Kata sandi tidak dicetak ke layar/log. Jangan commit berkas cadangan ke git.

set -eu

DB_CONTAINER="${DB_CONTAINER:-warkop-mariadb}"
DB_USER="${DB_USER:-warkop}"
DB_NAME="${DB_NAME:-warkop_nusantara}"
TUJUAN="${1:-./cadangan}"

if [ -z "${DB_PASSWORD:-}" ]; then
  echo "[cadangkan] DB_PASSWORD wajib diisi lewat variabel lingkungan" >&2
  exit 1
fi

mkdir -p "$TUJUAN"
STEMPEL="$(TZ=Asia/Jakarta date +%Y%m%d-%H%M)"
BERKAS="$TUJUAN/$DB_NAME-$STEMPEL.sql.gz"

# --single-transaction: snapshot konsisten InnoDB tanpa mengunci tabel
# --routines --triggers --events: ikutkan objek skema lain bila ada
# MYSQL_PWD lewat env container: sandi tidak muncul di daftar proses
docker exec -e MYSQL_PWD="$DB_PASSWORD" "$DB_CONTAINER" \
  mariadb-dump -u"$DB_USER" --single-transaction --quick --routines --triggers --events \
  --default-character-set=utf8mb4 "$DB_NAME" | gzip -9 > "$BERKAS"

UKURAN="$(wc -c < "$BERKAS")"
if [ "$UKURAN" -lt 1024 ]; then
  echo "[cadangkan] GAGAL: berkas terlalu kecil ($UKURAN byte) — periksa kredensial/nama container" >&2
  rm -f "$BERKAS"
  exit 1
fi
echo "[cadangkan] selesai: $BERKAS ($UKURAN byte)"

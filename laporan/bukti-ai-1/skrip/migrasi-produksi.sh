#!/usr/bin/env bash
# RUN AI-1 — migrasi PRODUKSI database/migrations/20261007-0010-ai-saran.sql lewat SSH deployer (pola bukti-server/07):
# sandi DB dibaca dari env container DB di dalam server (tidak dicetak); SELECT pemeriksaan sebelum & sesudah; idempoten
# (dijalankan 2x untuk bukti). Hanya objek warkop (container DB kwoz3jwjb037hw3oh669g9c4).
cd "$(dirname "$0")/../../.." || exit 1
sshj() { ssh -o BatchMode=yes -o ConnectTimeout=15 -i "$USERPROFILE/.ssh/warkop_deploy" deployer@31.97.106.106 "$@"; }
DB=kwoz3jwjb037hw3oh669g9c4
SQLX() { sshj "docker exec -i $DB sh -c 'exec mariadb -u\$MARIADB_USER -p\$MARIADB_PASSWORD \$MARIADB_DATABASE'"; }
echo "# Migrasi produksi 20261007-0010-ai-saran.sql — $(date -u +%FT%TZ)"
echo "## SEBELUM: tabel ai_saran & kolom artikel.ai_saran_id"
printf '%s\n' "SHOW TABLES LIKE 'ai_saran'; SHOW COLUMNS FROM artikel LIKE 'ai_saran_id'; SELECT COUNT(*) AS artikel FROM artikel;" | SQLX
for i in 1 2; do
  echo "## jalan ke-$i (idempoten)"
  tr -d '\r' < database/migrations/20261007-0010-ai-saran.sql | SQLX && echo "OK (tanpa galat)"
done
echo "## SESUDAH"
printf '%s\n' "SHOW CREATE TABLE ai_saran\G" | SQLX | grep -E "CREATE TABLE|CONSTRAINT|KEY"
printf '%s\n' "SHOW COLUMNS FROM artikel LIKE 'ai_saran_id'; SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, DELETE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME IN ('artikel','ai_saran') ORDER BY 1; SELECT COUNT(*) AS artikel FROM artikel; SELECT COUNT(*) AS ai_saran FROM ai_saran;" | SQLX

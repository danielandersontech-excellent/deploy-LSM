#!/usr/bin/env bash
# redeploy.sh <label> <hash-commit-pendek> — picu webhook Coolify dari DALAM server (port 8000 tidak terjangkau
# dari internet) lewat SSH deployer; token dari .env.produksi dikirim via stdin (tidak di argumen/log).
# Lalu tunggu 120 s dan pantau /api/health produksi + tag image container sampai berisi hash yang diharapkan.
cd "$(dirname "$0")/../../.." || exit 1
LABEL=$1; HASH=$2
WH=$(grep '^COOLIFY_DEPLOY_WEBHOOK=' .env.produksi | cut -d= -f2- | tr -d '\r')
TK=$(grep '^COOLIFY_API_TOKEN=' .env.produksi | cut -d= -f2- | tr -d '\r')
WH_LOKAL=$(node -e "const u=new URL(process.argv[1]);u.host='localhost:8000';console.log(u.toString())" "$WH")
# fungsi (bukan variabel) agar jalur kunci dengan spasi ("TUF A15 FX506") tidak pecah
sshj() { ssh -o BatchMode=yes -o ConnectTimeout=15 -i "$USERPROFILE/.ssh/warkop_deploy" deployer@31.97.106.106 "$@"; }
echo "# Redeploy produksi $LABEL (commit $HASH) — $(date -u +%FT%TZ)"
echo "\$ ssh deployer@server 'read TK; curl -s http://localhost:8000/api/v1/deploy?uuid=<uuid>&force=… -H \"Authorization: Bearer \$TK\"'"
printf '%s\n' "$TK" | sshj "read TK; curl -s -m 60 -w '\nHTTP %{http_code}\n' '$WH_LOKAL' -H \"Authorization: Bearer \$TK\"" | sed "s#$TK#<token>#g; s#uuid=[^&\"' ]*#uuid=<uuid>#g"
echo "\$ tunggu 120 s, lalu pantau tiap 30 s (maks 12x)"; sleep 120
for i in $(seq 1 12); do
  H=$(curl.exe -s -m 20 -o /dev/null -w '%{http_code}' https://warkopnusantara.id/api/health)
  IMG=$(sshj 'docker ps --filter name=re8snqu --format "{{.Image}} {{.Status}}"' 2>/dev/null | tr '\n' ' ')
  echo "[$(date -u +%T)Z] health=$H  container: $IMG"
  echo "$IMG" | grep -q "$HASH" && [ "$H" = "200" ] && { echo "HASIL: image $HASH HEALTHY, health 200"; break; }
  sleep 30
done
echo "\$ curl.exe -s https://warkopnusantara.id/api/health"; curl.exe -s -m 20 https://warkopnusantara.id/api/health; echo
echo "$IMG" | grep -q "$HASH" || echo "HASIL: image belum $HASH setelah pemantauan — perlu Redeploy manual"

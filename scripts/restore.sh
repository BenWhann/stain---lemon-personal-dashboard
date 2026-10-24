#!/usr/bin/env bash
# Restore a backup made by backup.sh:  ./scripts/restore.sh backups/dashboard-YYYYMMDD-HHMMSS.db
set -euo pipefail
cd "$(dirname "$0")/.."
FILE="${1:?usage: scripts/restore.sh backups/dashboard-<stamp>.db}"
[ -f "$FILE" ] || { echo "No such file: $FILE" >&2; exit 1; }

echo "Taking a safety backup of the current database first..."
./scripts/backup.sh
docker compose stop api
docker compose run --rm --no-deps -v "$(pwd)/$FILE:/restore.db:ro" --entrypoint sh api \
  -c 'cp /restore.db /data/dashboard.db && rm -f /data/dashboard.db-wal /data/dashboard.db-shm'
docker compose up -d api
echo "Restored $FILE"

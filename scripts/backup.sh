#!/usr/bin/env bash
# Online SQLite backup (safe while the app is running), copied out to ./backups.
# Keeps 14 days. Run from the app directory, e.g. /opt/lemon-stain.
set -euo pipefail
cd "$(dirname "$0")/.."

KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
mkdir -p backups

if ! docker compose ps --status running --services 2>/dev/null | grep -qx api; then
  echo "backup: api container is not running; nothing to back up" >&2
  exit 0
fi

docker compose exec -T api python - "$STAMP" <<'PY'
import sqlite3, sys
stamp = sys.argv[1]
src = sqlite3.connect("/data/dashboard.db")
dst = sqlite3.connect(f"/data/backup-{stamp}.db")
with dst:
    src.backup(dst)
dst.close(); src.close()
PY

docker compose cp "api:/data/backup-${STAMP}.db" "backups/dashboard-${STAMP}.db"
docker compose exec -T api rm -f "/data/backup-${STAMP}.db"
find backups -name 'dashboard-*.db' -mtime "+${KEEP_DAYS}" -delete
echo "backup: saved backups/dashboard-${STAMP}.db"

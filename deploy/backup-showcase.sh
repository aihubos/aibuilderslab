#!/bin/sh
# Daily backup for the showcase database and uploads.
# Keeps 7 days in /opt/backups/aibl-showcase.
# Cron example:
#   15 3 * * * /opt/aibuilderslab/src/deploy/backup-showcase.sh >> /var/log/aibl-showcase-backup.log 2>&1
set -eu

DB=/opt/aibl-showcase/data/showcase.db
DEST=/opt/backups/aibl-showcase
STAMP=$(date -u +%Y%m%dT%H%M%SZ)

mkdir -p "$DEST"

if [ ! -f "$DB" ]; then
  echo "showcase.db is missing: $DB" >&2
  exit 1
fi

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB" ".backup '$DEST/showcase-$STAMP.db'"
else
  docker exec aibl-showcase-api node --input-type=module -e 'import Database from "better-sqlite3"; const db = new Database("/data/showcase.db", { readonly: true, fileMustExist: true }); await db.backup("/data/.showcase-backup.db"); db.close();'
  cp /opt/aibl-showcase/data/.showcase-backup.db "$DEST/showcase-$STAMP.db"
  rm -f /opt/aibl-showcase/data/.showcase-backup.db
fi

tar -C /opt/aibl-showcase -czf "$DEST/uploads-$STAMP.tar.gz" uploads
find "$DEST" -type f -mtime +7 -delete
echo "backup $STAMP complete"

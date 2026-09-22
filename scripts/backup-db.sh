#!/bin/sh
# Бэкап базы PostgreSQL из докер-контейнера db в backups/renta-YYYY-MM-DD.sql.gz,
# хранит последние 8 копий (2 месяца при еженедельном запуске).
#
# Настройка на сервере (раз в неделю, по воскресеньям в 03:00):
#   crontab -e
#   0 3 * * 0 cd /path/to/renta && ./scripts/backup-db.sh >> backups/backup.log 2>&1
set -e
cd "$(dirname "$0")/.."

mkdir -p backups
STAMP=$(date +%F)
OUT="backups/renta-$STAMP.sql.gz"

docker compose exec -T db pg_dump -U renta renta | gzip > "$OUT"
echo "$(date -Iseconds) backup written: $OUT"

ls -1t backups/renta-*.sql.gz 2>/dev/null | tail -n +9 | xargs -r rm --

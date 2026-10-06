#!/usr/bin/env bash
# Ежедневная резервная копия сайта «РЕНТА»: база данных, загруженные файлы и .env.
# Запуск по cron на сервере, например каждый день в 03:30:
#   30 3 * * * /root/renta/scripts/backup-full.sh >> /var/log/renta-backup.log 2>&1
# При любой ошибке недоделанная копия удаляется, а на почту уходит письмо о сбое.
set -Eeuo pipefail

SITE="${SITE:-/root/renta}"
ROOT="${BACKUP_ROOT:-/root/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
DB_CONTAINER="${DB_CONTAINER:-renta-db-1}"

umask 077
STAMP="$(date +%F_%H%M)"
DEST="$ROOT/$STAMP"

notify_failure() {
  local code=$? line="${1:-?}"
  rm -rf "$DEST"
  echo "$(date '+%F %T') ОШИБКА резервной копии (строка $line, код $code)" >&2
  # письмо о сбое — теми же SMTP-настройками, что и уведомления о заявках
  SITE="$SITE" python3 - <<'PY' || true
import os, smtplib
from email.mime.text import MIMEText
env = {}
for l in open(os.environ["SITE"] + "/.env", encoding="utf-8"):
    l = l.rstrip("\n")
    if "=" in l and not l.startswith("#"):
        k, v = l.split("=", 1); env[k] = v
to = env.get("SMTP_TO", "")
if not (to and env.get("SMTP_HOST") and env.get("SMTP_USER") and env.get("SMTP_PASSWORD")):
    raise SystemExit("нет настроек почты — письмо не отправлено")
m = MIMEText("Не удалось сделать ежедневную резервную копию сайта «РЕНТА». "
             "Подробности — в файле /var/log/renta-backup.log на сервере.", "plain", "utf-8")
m["Subject"] = "Сбой резервной копии сайта «РЕНТА»"
m["From"] = env.get("SMTP_FROM") or env["SMTP_USER"]
m["To"] = to
s = smtplib.SMTP(env["SMTP_HOST"], int(env.get("SMTP_PORT", "587")), timeout=20)
s.starttls(); s.login(env["SMTP_USER"], env["SMTP_PASSWORD"]); s.send_message(m); s.quit()
PY
}
trap 'notify_failure $LINENO' ERR

set -a; . "$SITE/.env"; set +a
mkdir -p "$DEST"

docker exec "$DB_CONTAINER" pg_dump -U "${POSTGRES_USER:-renta}" --clean --if-exists "${POSTGRES_DB:-renta}" | gzip > "$DEST/db.sql.gz"
tar czf "$DEST/files.tgz" -C "$SITE" backend/uploads backend/data
cp "$SITE/.env" "$DEST/env.backup"

# проверка, что копия не пустая и читается
gzip -t "$DEST/db.sql.gz"
gzip -dc "$DEST/db.sql.gz" | grep -q "CREATE TABLE public.items"
gzip -dc "$DEST/db.sql.gz" | grep -q "CREATE TABLE public.leads"
tar tzf "$DEST/files.tgz" > /dev/null

# удаляем копии старше KEEP_DAYS суток (только папки с датой в имени)
find "$ROOT" -mindepth 1 -maxdepth 1 -type d -name '20??-??-??_????' -mtime +"$KEEP_DAYS" -exec rm -rf {} +

echo "$(date '+%F %T') OK $DEST $(du -sh "$DEST" | cut -f1), всего копий: $(find "$ROOT" -mindepth 1 -maxdepth 1 -type d -name '20??-??-??_????' | wc -l)"

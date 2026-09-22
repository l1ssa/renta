# Деплой на облачный сервер reg.ru

Инфраструктура готова заранее — этот файл понадобится, когда будет куплен
домен и облачный сервер на reg.ru.

## 1. Домен

В панели reg.ru → Домены → (ваш домен) → DNS-серверы/Управление записями:
добавьте **A-запись** `@` (и при желании `www`), указывающую на IP облачного
сервера. Распространение может занять до нескольких часов.

## 2. Сервер

В панели reg.ru закажите «Облачный сервер» — Ubuntu 22.04, от 2 ГБ RAM
достаточно для старта. Подключитесь по SSH:

```bash
ssh root@<IP-сервера>
```

## 3. Установка Docker

```bash
curl -fsSL https://get.docker.com | sh
```

## 4. Код проекта

```bash
git clone https://github.com/l1ssa/renta.git
cd renta
cp .env.example .env
nano .env   # заполните ADMIN_PASSWORD, ADMIN_SECRET, TELEGRAM_*, DOMAIN
```

`ADMIN_SECRET` — любая случайная строка, например:
```bash
openssl rand -hex 32
```

## 5. Запуск

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Caddy сам выпустит HTTPS-сертификат Let's Encrypt на домен из `.env` — сайт
станет доступен на `https://<DOMAIN>` (порты 80/443 должны быть открыты в
файрволе сервера, что в облаке reg.ru обычно уже так по умолчанию).

Проверка:
```bash
docker compose ps
curl -I https://<DOMAIN>
```

## 6. Резервное копирование

```bash
crontab -e
```
добавьте строку (бэкап каждое воскресенье в 03:00):
```
0 3 * * 0 cd /root/renta && ./scripts/backup-db.sh >> backups/backup.log 2>&1
```

## Обновление после новых изменений в коде

```bash
cd renta
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

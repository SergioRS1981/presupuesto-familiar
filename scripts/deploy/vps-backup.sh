#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.deploy.yml}"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Docker Compose no esta disponible."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "No existe el archivo de entorno: $ENV_FILE"
  exit 1
fi

read_env_value() {
  awk -F= -v key="$1" '$1 == key { print substr($0, index($0, "=") + 1) }' "$ENV_FILE" 2>/dev/null || true
}

BACKUP_DIR_VALUE="$(read_env_value BACKUP_DIR)"
BACKUP_RETENTION_VALUE="$(read_env_value BACKUP_RETENTION_DAYS)"

BACKUP_DIR="${BACKUP_DIR:-${BACKUP_DIR_VALUE:-$ROOT_DIR/backups/postgres}}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-${BACKUP_RETENTION_VALUE:-14}}"

run_compose() {
  (cd "$ROOT_DIR" && $COMPOSE_CMD -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@")
}

postgres_container_id="$(run_compose ps -q postgres)"

if [ -z "$postgres_container_id" ]; then
  echo "No se encontro el contenedor de PostgreSQL."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

timestamp="$(date '+%Y%m%d-%H%M%S')"
backup_file="$BACKUP_DIR/postgres-$timestamp.sql.gz"

echo "Generando copia de seguridad en $backup_file..."
docker exec "$postgres_container_id" sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$backup_file"

find "$BACKUP_DIR" -type f -name 'postgres-*.sql.gz' -mtime +"$BACKUP_RETENTION_DAYS" -delete

echo "Copia completada."

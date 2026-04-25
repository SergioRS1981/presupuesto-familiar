#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.deploy.yml}"
REGISTRY="${REGISTRY:-ghcr.io}"

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

BACKUP_BEFORE_DEPLOY_VALUE="$(read_env_value BACKUP_BEFORE_DEPLOY)"
BACKUP_BEFORE_DEPLOY="${BACKUP_BEFORE_DEPLOY:-${BACKUP_BEFORE_DEPLOY_VALUE:-true}}"

if [ -n "${REGISTRY_USERNAME:-}" ] && [ -n "${REGISTRY_PASSWORD:-}" ]; then
  printf "%s" "$REGISTRY_PASSWORD" | docker login "$REGISTRY" -u "$REGISTRY_USERNAME" --password-stdin
fi

run_compose() {
  (cd "$ROOT_DIR" && $COMPOSE_CMD -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@")
}

wait_for_health() {
  service_name="$1"
  timeout_seconds="${2:-60}"
  elapsed=0

  container_id="$(run_compose ps -q "$service_name")"

  if [ -z "$container_id" ]; then
    echo "No se encontro el contenedor del servicio $service_name."
    exit 1
  fi

  while [ "$elapsed" -lt "$timeout_seconds" ]; do
    health_status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}running{{end}}' "$container_id")"

    if [ "$health_status" = "healthy" ] || [ "$health_status" = "running" ]; then
      return 0
    fi

    sleep 2
    elapsed=$((elapsed + 2))
  done

  echo "El servicio $service_name no alcanzo un estado saludable a tiempo."
  run_compose logs "$service_name"
  exit 1
}

echo "Descargando imagenes publicadas..."
run_compose pull postgres api api-migrate web

echo "Levantando PostgreSQL..."
run_compose up -d postgres
wait_for_health postgres 60

if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
  sh "$ROOT_DIR/scripts/deploy/vps-backup.sh" "$ENV_FILE"
fi

echo "Aplicando migraciones..."
run_compose run --rm api-migrate

echo "Actualizando API y frontend..."
run_compose up -d api web
wait_for_health api 90
wait_for_health web 90

echo "Despliegue completado."
run_compose ps

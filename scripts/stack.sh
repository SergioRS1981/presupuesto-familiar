#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"

ACTION="${1:-}"
TARGET_ENV="${2:-development}"

if [ -z "$ACTION" ]; then
  echo "Uso: ./scripts/stack.sh <up|down|logs> [development|production]"
  exit 1
fi

case "$TARGET_ENV" in
  development|production)
    ;;
  *)
    echo "Entorno no soportado: $TARGET_ENV"
    echo "Usa development o production."
    exit 1
    ;;
esac

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Docker Compose no esta disponible. Instala Docker Desktop o docker-compose."
  exit 1
fi

ENV_FILE="$ROOT_DIR/.env.${TARGET_ENV}.local"
EXAMPLE_FILE="$ROOT_DIR/.env.${TARGET_ENV}.example"

if [ ! -f "$EXAMPLE_FILE" ]; then
  echo "No existe el ejemplo de configuracion para el entorno $TARGET_ENV."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  cp "$EXAMPLE_FILE" "$ENV_FILE"
  echo "Creado $ENV_FILE a partir de $(basename "$EXAMPLE_FILE")"
fi

read_env_value() {
  awk -F= -v key="$1" '$1 == key { print substr($0, index($0, "=") + 1) }' "$ENV_FILE" 2>/dev/null || true
}

COMPOSE_PROJECT_NAME_VALUE="$(read_env_value COMPOSE_PROJECT_NAME)"
WEB_PORT="$(read_env_value WEB_PORT)"
API_PORT="$(read_env_value API_PORT)"

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME_VALUE:-presupuesto-${TARGET_ENV}}"

WEB_PORT="${WEB_PORT:-3000}"
API_PORT="${API_PORT:-3001}"

case "$ACTION" in
  up)
    echo "Levantando Presupuesto Familiar en entorno $TARGET_ENV..."
    (cd "$ROOT_DIR" && $COMPOSE_CMD --env-file "$ENV_FILE" up -d --build)

    echo ""
    echo "Servicios disponibles para $TARGET_ENV:"
    echo "Frontend: http://localhost:$WEB_PORT"
    echo "API: http://localhost:$API_PORT/api"
    echo ""
    echo "Ver logs: ./scripts/stack.sh logs $TARGET_ENV"
    echo "Parar entorno: ./scripts/stack.sh down $TARGET_ENV"
    ;;
  down)
    (cd "$ROOT_DIR" && $COMPOSE_CMD --env-file "$ENV_FILE" down)
    ;;
  logs)
    (cd "$ROOT_DIR" && $COMPOSE_CMD --env-file "$ENV_FILE" logs -f)
    ;;
  *)
    echo "Accion no soportada: $ACTION"
    echo "Usa up, down o logs."
    exit 1
    ;;
esac

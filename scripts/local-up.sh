#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Docker Compose no esta disponible. Instala Docker Desktop o docker-compose."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  cp "$ROOT_DIR/.env.local.example" "$ENV_FILE"
  echo "Creado $ENV_FILE a partir de .env.local.example"
fi

WEB_PORT="$(awk -F= '/^WEB_PORT=/{print $2}' "$ENV_FILE" 2>/dev/null || true)"
API_PORT="$(awk -F= '/^API_PORT=/{print $2}' "$ENV_FILE" 2>/dev/null || true)"

WEB_PORT="${WEB_PORT:-3000}"
API_PORT="${API_PORT:-3001}"

echo "Levantando Presupuesto Familiar en local..."
(cd "$ROOT_DIR" && $COMPOSE_CMD --env-file "$ENV_FILE" up -d --build)

echo ""
echo "Servicios disponibles:"
echo "Frontend: http://localhost:$WEB_PORT"
echo "API: http://localhost:$API_PORT/api"
echo ""
echo "Ver logs: npm run local:logs"
echo "Parar entorno: npm run local:down"

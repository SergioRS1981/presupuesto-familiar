#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
TARGET_ENV="${1:-development}"
ENV_FILE="$ROOT_DIR/.env.${TARGET_ENV}.local"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Docker Compose no esta disponible."
  exit 1
fi

if [ -f "$ENV_FILE" ]; then
  COMPOSE_PROJECT_NAME_VALUE="$(awk -F= '/^COMPOSE_PROJECT_NAME=/{print substr($0, index($0, "=") + 1)}' "$ENV_FILE" 2>/dev/null || true)"
  export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME_VALUE:-presupuesto-${TARGET_ENV}}"
  (cd "$ROOT_DIR" && $COMPOSE_CMD --profile quality --env-file "$ENV_FILE" stop sonarqube sonarqube-db)
else
  (cd "$ROOT_DIR" && $COMPOSE_CMD --profile quality stop sonarqube sonarqube-db)
fi

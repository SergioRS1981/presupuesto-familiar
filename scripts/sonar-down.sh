#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Docker Compose no esta disponible."
  exit 1
fi

if [ -f "$ENV_FILE" ]; then
  (cd "$ROOT_DIR" && $COMPOSE_CMD --profile quality --env-file "$ENV_FILE" stop sonarqube sonarqube-db)
else
  (cd "$ROOT_DIR" && $COMPOSE_CMD --profile quality stop sonarqube sonarqube-db)
fi

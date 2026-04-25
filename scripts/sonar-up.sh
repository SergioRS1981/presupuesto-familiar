#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
TARGET_ENV="${1:-development}"
ENV_FILE="$ROOT_DIR/.env.${TARGET_ENV}.local"
EXAMPLE_FILE="$ROOT_DIR/.env.${TARGET_ENV}.example"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Docker Compose no esta disponible."
  exit 1
fi

if [ ! -f "$EXAMPLE_FILE" ]; then
  echo "No existe configuracion de ejemplo para el entorno $TARGET_ENV."
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
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME_VALUE:-presupuesto-${TARGET_ENV}}"

SONAR_PORT="$(read_env_value SONARQUBE_PORT)"
SONAR_PORT="${SONAR_PORT:-9000}"

echo "Levantando SonarQube en local..."
(cd "$ROOT_DIR" && $COMPOSE_CMD --profile quality --env-file "$ENV_FILE" up -d sonarqube-db sonarqube)

echo "Esperando a que SonarQube este listo..."
for _ in $(seq 1 90); do
  STATUS="$(curl -fsS "http://localhost:${SONAR_PORT}/api/system/status" 2>/dev/null | tr -d '\n' || true)"
  case "$STATUS" in
    *"\"status\":\"UP\""*|*"\"status\":\"WARN\""*)
      echo "SonarQube disponible en http://localhost:${SONAR_PORT}"
      exit 0
      ;;
  esac
  sleep 5
done

echo "SonarQube no ha quedado disponible a tiempo."
exit 1

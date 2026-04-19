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

if [ ! -f "$ENV_FILE" ]; then
  cp "$ROOT_DIR/.env.local.example" "$ENV_FILE"
  echo "Creado $ENV_FILE a partir de .env.local.example"
fi

SONAR_PORT="$(awk -F= '/^SONARQUBE_PORT=/{print $2}' "$ENV_FILE" 2>/dev/null || true)"
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

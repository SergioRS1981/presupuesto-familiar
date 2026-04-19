#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"
TOKEN_FILE="$ROOT_DIR/.sonar.token"

if [ ! -f "$ENV_FILE" ]; then
  cp "$ROOT_DIR/.env.local.example" "$ENV_FILE"
fi

SONAR_PORT="$(awk -F= '/^SONARQUBE_PORT=/{print $2}' "$ENV_FILE" 2>/dev/null || true)"
SONAR_ADMIN_PASSWORD="$(awk -F= '/^SONARQUBE_ADMIN_PASSWORD=/{print $2}' "$ENV_FILE" 2>/dev/null || true)"
SONAR_TOKEN_NAME="$(awk -F= '/^SONARQUBE_TOKEN_NAME=/{print $2}' "$ENV_FILE" 2>/dev/null || true)"

SONAR_PORT="${SONAR_PORT:-9000}"
SONAR_ADMIN_PASSWORD="${SONAR_ADMIN_PASSWORD:-SonarLocal123!}"
SONAR_TOKEN_NAME="${SONAR_TOKEN_NAME:-presupuesto-local-scan}"

"$ROOT_DIR/scripts/sonar-up.sh"
"$ROOT_DIR/scripts/quality-validate.sh"

SONAR_URL="http://localhost:${SONAR_PORT}"

ADMIN_AUTH_CODE="$(curl -s -o /tmp/sonar-auth-response.txt -w '%{http_code}' \
  -u "admin:${SONAR_ADMIN_PASSWORD}" "$SONAR_URL/api/authentication/validate" || true)"

if [ "$ADMIN_AUTH_CODE" != "200" ]; then
  DEFAULT_AUTH_CODE="$(curl -s -o /tmp/sonar-default-auth.txt -w '%{http_code}' \
    -u admin:admin "$SONAR_URL/api/authentication/validate" || true)"

  if [ "$DEFAULT_AUTH_CODE" = "200" ]; then
    curl -fsS -u admin:admin -X POST \
      "$SONAR_URL/api/users/change_password" \
      -d "login=admin" \
      -d "previousPassword=admin" \
      -d "password=${SONAR_ADMIN_PASSWORD}" >/dev/null
  fi
fi

if [ ! -f "$TOKEN_FILE" ]; then
  :
fi

generate_token() {
  curl -s -u "admin:${SONAR_ADMIN_PASSWORD}" -X POST \
    "$SONAR_URL/api/user_tokens/revoke" \
    -d "name=${SONAR_TOKEN_NAME}" >/dev/null || true
  TOKEN_RESPONSE="$(curl -fsS -u "admin:${SONAR_ADMIN_PASSWORD}" -X POST \
    "$SONAR_URL/api/user_tokens/generate" \
    -d "name=${SONAR_TOKEN_NAME}")"
  TOKEN="$(printf '%s' "$TOKEN_RESPONSE" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')"

  if [ -z "$TOKEN" ]; then
    echo "No se ha podido generar el token de SonarQube."
    exit 1
  fi

  printf '%s' "$TOKEN" >"$TOKEN_FILE"
  chmod 600 "$TOKEN_FILE"
}

if [ ! -s "$TOKEN_FILE" ]; then
  generate_token
fi

SONAR_TOKEN="$(cat "$TOKEN_FILE")"
TOKEN_STATUS="$(curl -s -o /tmp/sonar-token-validate.txt -w '%{http_code}' -u "${SONAR_TOKEN}:" \
  "$SONAR_URL/api/authentication/validate" || true)"

if [ "$TOKEN_STATUS" != "200" ]; then
  generate_token
  SONAR_TOKEN="$(cat "$TOKEN_FILE")"
fi

echo "Ejecutando analisis SonarQube..."
docker run --rm \
  --network app_default \
  -e SONAR_HOST_URL="http://sonarqube:9000" \
  -e SONAR_TOKEN="$SONAR_TOKEN" \
  -v "$ROOT_DIR:/usr/src" \
  sonarsource/sonar-scanner-cli

echo "Analisis completado en ${SONAR_URL}"

#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"

echo "Reconstruyendo imagen de validacion de API..."
docker build -t presupuesto-api-validate -f "$ROOT_DIR/apps/api/Dockerfile" "$ROOT_DIR" >/dev/null

echo "Reconstruyendo imagen de validacion de frontend..."
docker build --target build -t presupuesto-web-validate -f "$ROOT_DIR/apps/web/Dockerfile" "$ROOT_DIR" >/dev/null

rm -rf "$ROOT_DIR/coverage"
mkdir -p "$ROOT_DIR/coverage/api" "$ROOT_DIR/coverage/web"

echo "Validando build de API..."
docker run --rm presupuesto-api-validate npm run build

echo "Validando tests con cobertura de API..."
docker run --rm -v "$ROOT_DIR/coverage:/app/coverage" presupuesto-api-validate npm run test:coverage

echo "Validando build de frontend..."
docker run --rm presupuesto-web-validate npm run build

echo "Validando tests con cobertura de frontend..."
docker run --rm -v "$ROOT_DIR/coverage:/app/coverage" presupuesto-web-validate npm run test:coverage

echo "Validaciones completadas."

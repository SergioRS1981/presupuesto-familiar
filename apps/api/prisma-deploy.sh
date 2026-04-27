#!/bin/sh

set -eu

if [ -d "./prisma/migrations" ] && find "./prisma/migrations" -mindepth 1 -maxdepth 1 -type d | grep -q .; then
  echo "Aplicando migraciones versionadas de Prisma..."
  set +e
  DEPLOY_OUTPUT="$(npx prisma migrate deploy 2>&1)"
  DEPLOY_STATUS=$?
  set -e

  if [ "$DEPLOY_STATUS" -eq 0 ]; then
    echo "$DEPLOY_OUTPUT"
    exit 0
  fi

  echo "$DEPLOY_OUTPUT"

  if [ "${APP_ENV:-development}" = "development" ] && printf "%s" "$DEPLOY_OUTPUT" | grep -q "Error: P3005"; then
    echo "La base de desarrollo ya contiene esquema previo. Se aplica prisma db push para preservar datos locales."
    exec npx prisma db push
  fi

  exit "$DEPLOY_STATUS"
fi

echo "No se han encontrado migraciones versionadas. Se aplica prisma db push como compatibilidad."
exec npx prisma db push

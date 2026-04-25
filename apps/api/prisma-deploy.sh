#!/bin/sh

set -eu

if [ -d "./prisma/migrations" ] && find "./prisma/migrations" -mindepth 1 -maxdepth 1 -type d | grep -q .; then
  echo "Aplicando migraciones versionadas de Prisma..."
  exec npx prisma migrate deploy
fi

echo "No se han encontrado migraciones versionadas. Se aplica prisma db push como compatibilidad."
exec npx prisma db push

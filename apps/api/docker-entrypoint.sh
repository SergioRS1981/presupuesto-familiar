#!/bin/sh

set -eu

if [ "${SKIP_DB_DEPLOY:-false}" != "true" ]; then
  npm run db:deploy
fi

exec npm run start

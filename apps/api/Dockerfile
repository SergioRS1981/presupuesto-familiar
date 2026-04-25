FROM node:22-alpine AS base

WORKDIR /app

COPY package.json ./package.json
COPY yarn.lock ./yarn.lock
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN corepack enable && yarn install --frozen-lockfile

COPY apps/api ./apps/api

WORKDIR /app/apps/api

RUN npm run build
RUN chmod +x ./prisma-deploy.sh ./docker-entrypoint.sh ./docker-migrate.sh

EXPOSE 3001

CMD ["sh", "./docker-entrypoint.sh"]

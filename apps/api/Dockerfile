FROM node:22-alpine AS base

WORKDIR /app

COPY package.json ./package.json
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm install

COPY apps/api ./apps/api

WORKDIR /app/apps/api

RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "npm run db:migrate && npm run start"]

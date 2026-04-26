FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./package.json
COPY yarn.lock ./yarn.lock
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN corepack enable && yarn install --frozen-lockfile

COPY apps/web ./apps/web

WORKDIR /app/apps/web

RUN npm run build

FROM nginx:1.27-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

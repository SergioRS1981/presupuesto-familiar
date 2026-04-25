# Despliegue local y operacion

## Requisitos previos

- Docker Desktop o Docker Compose operativo
- Node.js si se quiere ejecutar fuera de contenedor

## Variables de entorno y entornos disponibles

Plantillas disponibles:

- [.env.development.example](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/.env.development.example)
- [.env.production.example](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/.env.production.example)
- [.env.local.example](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/.env.local.example)

El archivo `.env.local.example` se conserva como referencia compatible con el flujo historico de desarrollo, pero el esquema recomendado ahora es uno por entorno.

Variables principales:

- `APP_ENV`
- `NODE_ENV`
- `COMPOSE_PROJECT_NAME`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `API_PORT`
- `WEB_PORT`
- `WEB_PUBLIC_URL`
- `VITE_API_URL`
- `RATE_LIMIT_MAX`
- `SONARQUBE_PORT`
- `SONARQUBE_ADMIN_PASSWORD`

## Separacion entre desarrollo y produccion

Cada entorno queda aislado por tres mecanismos:

- proyecto Docker Compose diferente mediante `COMPOSE_PROJECT_NAME`
- puertos distintos para frontend, API y PostgreSQL
- base de datos y volumenes persistentes distintos

Con ello, un desarrollo puede trabajar con datos de prueba mientras produccion mantiene sus propios datos persistidos.

## Arranque de desarrollo

Flujo recomendado:

```bash
cp .env.development.example .env.development.local
npm run env:dev:up
```

Script implicado:

- [stack.sh](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts/stack.sh)
- [local-up.sh](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts/local-up.sh)

Comportamiento:

- crea `.env.development.local` si no existe
- levanta PostgreSQL, API y frontend
- recompone imagenes con `docker compose up -d --build`
- muestra las URLs finales

URLs esperadas:

- frontend: `http://localhost:3200`
- API: `http://localhost:3201/api`
- healthcheck API: `http://localhost:3201/health`

## Arranque de produccion local

Flujo recomendado:

```bash
cp .env.production.example .env.production.local
npm run env:prod:up
```

URLs esperadas:

- frontend: `http://localhost:3300`
- API: `http://localhost:3301/api`
- healthcheck API: `http://localhost:3301/health`

## Logs y parada

Ver logs:

```bash
npm run env:dev:logs
```

Parar el entorno:

```bash
npm run env:dev:down
```

Scripts relacionados:

- [local-logs.sh](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts/local-logs.sh)
- [local-down.sh](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts/local-down.sh)

Para produccion se usan:

- `npm run env:prod:logs`
- `npm run env:prod:down`

## Servicios definidos en Docker Compose

Archivo:

- [docker-compose.yml](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/docker-compose.yml)

Servicios principales:

- `postgres`
- `api`
- `web`

Servicios de calidad bajo profile `quality`:

- `sonarqube-db`
- `sonarqube`

## Ejecucion en modo desarrollo sin Docker

Backend:

```bash
npm run dev -w @presupuesto/api
```

Frontend:

```bash
npm run dev -w @presupuesto/web
```

Base de datos:

```bash
npm run db:migrate -w @presupuesto/api
```

## Notas operativas

- la API expone `GET /health` para validacion simple
- los contenedores tienen `healthcheck`
- el frontend se construye con Vite y se sirve desde Nginx dentro del contenedor
- el entorno `production` sigue siendo una preparacion operativa local o de servidor simple, no un endurecimiento completo enterprise

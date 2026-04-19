# Despliegue local y operacion

## Requisitos previos

- Docker Desktop o Docker Compose operativo
- Node.js si se quiere ejecutar fuera de contenedor

## Variables de entorno

Plantilla base:

- [.env.local.example](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/.env.local.example)

Variables principales:

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

## Arranque local con un comando

El flujo recomendado es:

```bash
npm run local:up
```

Script implicado:

- [local-up.sh](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts/local-up.sh)

Comportamiento:

- crea `.env.local` si no existe
- levanta PostgreSQL, API y frontend
- recompone imagenes con `docker compose up -d --build`
- muestra las URLs finales

URLs esperadas:

- frontend: `http://localhost:3000`
- API: `http://localhost:3001/api`
- healthcheck API: `http://localhost:3001/health`

## Logs y parada

Ver logs:

```bash
npm run local:logs
```

Parar el entorno:

```bash
npm run local:down
```

Scripts relacionados:

- [local-logs.sh](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts/local-logs.sh)
- [local-down.sh](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts/local-down.sh)

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
- la configuracion esta pensada para entorno local, no para un despliegue productivo endurecido


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
- `VITE_DEV_API_TARGET`
- `RATE_LIMIT_MAX`
- `AUTH_USERNAME`
- `AUTH_PASSWORD_HASH`
- `SESSION_SECRET`
- `SESSION_TTL_HOURS`
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
node scripts/generate-auth-credentials.mjs sergio "TuContrasenaSegura"
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

El login de desarrollo debe definirse en tu `.env.development.local`, que queda fuera de Git por `.gitignore`.

Contenido recomendado para `.env.development.local`:

```env
APP_ENV=development
NODE_ENV=development
COMPOSE_PROJECT_NAME=presupuesto-dev
POSTGRES_DB=presupuesto_familiar_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5442
API_PORT=3201
WEB_PORT=3200
WEB_PUBLIC_URL=http://localhost:3200
RATE_LIMIT_MAX=300
AUTH_USERNAME=sergio
AUTH_PASSWORD_HASH=scrypt:PEGA_AQUI_EL_HASH_GENERADO
SESSION_SECRET=PEGA_AQUI_EL_SECRET_GENERADO
SESSION_TTL_HOURS=12
SONARQUBE_PORT=9000
SONARQUBE_ADMIN_PASSWORD=SonarLocal123!
SONARQUBE_TOKEN_NAME=presupuesto-development-scan
SONARQUBE_DB=sonarqube_dev
SONARQUBE_DB_USER=sonarqube
SONARQUBE_DB_PASSWORD=sonarqube
VITE_DEV_API_TARGET=http://localhost:3001
```

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

Contenido recomendado para `.env.production.local`:

```env
APP_ENV=production
NODE_ENV=production
COMPOSE_PROJECT_NAME=presupuesto-prod
POSTGRES_DB=presupuesto_familiar_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CAMBIA_ESTA_PASSWORD_LARGA
API_PORT=3001
WEB_PORT=3000
WEB_PUBLIC_URL=https://presupuestofamiliar.rodriguezgalvan.es
RATE_LIMIT_MAX=300
AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=scrypt:PEGA_AQUI_EL_HASH_GENERADO
SESSION_SECRET=PEGA_AQUI_EL_SECRET_GENERADO
SESSION_TTL_HOURS=12
BACKUP_BEFORE_DEPLOY=true
BACKUP_RETENTION_DAYS=14
```

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

Notas de desarrollo frontend:

- el frontend usa `/api` por defecto
- Vite reenvia `/api` al backend local usando `proxy`
- si necesitas cambiar el backend del proxy, configura `VITE_DEV_API_TARGET`
- la autenticacion queda separada por entorno usando usuario, hash de contrasena y secreto de sesion propios
- genera esos valores con `node scripts/generate-auth-credentials.mjs admin "TuContrasenaSegura"`
- puedes verificar que Git ignora tus archivos locales con `git check-ignore -v .env.development.local .env.production.local`

Base de datos:

```bash
npm run db:migrate -w @presupuesto/api
```

## Notas operativas

- la API expone `GET /health` para validacion simple
- los contenedores tienen `healthcheck`
- el frontend se construye con Vite y se sirve desde Nginx dentro del contenedor
- el entorno `production` sigue siendo una preparacion operativa local o de servidor simple, no un endurecimiento completo enterprise

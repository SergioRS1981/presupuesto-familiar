# Presupuesto Familiar

Aplicacion full-stack para gestion de presupuesto anual domestico con:

- Backend Node.js + TypeScript + Express.
- Frontend React + Vite + PrimeReact.
- Base de datos PostgreSQL mediante Prisma.
- Docker Compose para orquestacion local.
- Tests unitarios y de interfaz con Vitest.

## Documentacion

La documentacion tecnica ampliada se encuentra en:

- [Documentación/README.md](</Users/sergio/Library/Mobile Documents/com~apple~CloudDocs/Presupuesto Familiar/App/Documentación/README.md>)

## Funcionalidades

- Gestion de partidas presupuestarias de ingreso y gasto.
- Clasificacion por partidas fijas y variables.
- Alta de anos pasados para preparar ejercicios historicos aunque aun no tengan datos.
- Configuracion del presupuesto anual previsto por partida.
- Registro del consumo real por mes y por ano.
- Importacion masiva por Excel de partidas, presupuestos previstos y consumos reales.
- Descarga de plantillas Excel de ejemplo para cada flujo de importacion.
- Informes comparativos previstos vs reales por ano, con diferencia e indice de ejecucion sobre lo previsto.
- Informe mensual real por mes con gastos fijos, variables, gastos totales, ingresos totales y balance.
- Informe por partida con previsto, real, diferencia y porcentaje de ejecucion.
- Descarga en CSV del informe del ano seleccionado y de los totales anuales de todos los ejercicios disponibles.

## Entornos disponibles

El proyecto queda preparado con dos entornos aislados:

- `development`
- `production`

Cada entorno usa:

- archivo de variables propio
- proyecto Docker Compose propio
- puertos propios
- base de datos y volumenes persistentes propios

Esto permite que desarrollo y produccion tengan datos distintos y no se pisen entre si.

Ademas, cada entorno puede usar su propio usuario, hash de contrasena y secreto de sesion.

La sesion dura una semana por defecto y el frontend ofrece una opcion manual para cerrar sesion cuando el usuario lo necesite.

Plantillas disponibles:

- `.env.development.example`
- `.env.production.example`

## Puesta en marcha local

Entorno de desarrollo:

1. Configurar variables del entorno:

```bash
cp .env.development.example .env.development.local
```

2. Generar usuario, hash y secreto de sesion:

```bash
node scripts/generate-auth-credentials.mjs sergio "TuContrasenaSegura"
```

3. Pegar la salida en `.env.development.local`.

Contenido recomendado:

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
SESSION_TTL_HOURS=168
SONARQUBE_PORT=9000
SONARQUBE_ADMIN_PASSWORD=SonarLocal123!
SONARQUBE_TOKEN_NAME=presupuesto-development-scan
SONARQUBE_DB=sonarqube_dev
SONARQUBE_DB_USER=sonarqube
SONARQUBE_DB_PASSWORD=sonarqube
VITE_DEV_API_TARGET=http://localhost:3001
```

4. Levantar el entorno local:

```bash
npm run env:dev:up
```

La aplicacion quedara disponible en:

- Frontend: `http://localhost:3200`
- API: `http://localhost:3201/api`

Cuando ejecutes el frontend con `vite`, la aplicacion usara `/api` por defecto y el proxy de desarrollo reenviara esas peticiones a `http://localhost:3001`.

El login de desarrollo debe vivir en tu archivo local `.env.development.local`, que esta ignorado por Git.
La sesion permanecera activa hasta una semana desde el login, salvo que el usuario cierre sesion manualmente desde el frontend.

Comandos utiles:

```bash
npm run env:dev:logs
npm run env:dev:down
```

Entorno de produccion local:

```bash
cp .env.production.example .env.production.local
npm run env:prod:up
```

Contenido recomendado para una simulacion local de produccion:

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
SESSION_TTL_HOURS=168
BACKUP_BEFORE_DEPLOY=true
BACKUP_RETENTION_DAYS=14
```

La aplicacion quedara disponible en:

- Frontend: `http://localhost:3300`
- API: `http://localhost:3301/api`

Comandos utiles:

```bash
npm run env:prod:logs
npm run env:prod:down
```

Compatibilidad:

- `npm run local:up`
- `npm run local:logs`
- `npm run local:down`

Estos comandos siguen existiendo como alias del entorno `development`.

## Calidad y SonarQube

Levantar SonarQube en local:

```bash
npm run sonar:up
```

Ejecutar build, tests con cobertura y analisis SonarQube:

```bash
npm run sonar:scan
```

Parar SonarQube:

```bash
npm run sonar:down
```

La interfaz de SonarQube quedara en `http://localhost:9000`.

## Desarrollo

Backend:

```bash
npm run dev -w @presupuesto/api
```

Frontend:

```bash
npm run dev -w @presupuesto/web
```

Migraciones:

```bash
npm run db:migrate -w @presupuesto/api
```

Tests:

```bash
npm test
```

## Credenciales seguras por entorno

La autenticacion usa estas variables:

- `AUTH_USERNAME`
- `AUTH_PASSWORD_HASH`
- `SESSION_SECRET`
- `SESSION_TTL_HOURS`

Para generar un hash nuevo y un secreto de sesion:

```bash
node scripts/generate-auth-credentials.mjs admin "TuContrasenaSegura"
```

Estrategia recomendada:

- `*.example`: solo placeholders, nunca credenciales reales.
- `.env.development.local`: secretos de desarrollo en tu maquina, fuera de Git.
- `.env.production`: secretos de produccion solo en el VPS.
- GitHub Secrets: solo secretos de infraestructura y despliegue.

Comprobaciones utiles:

```bash
git check-ignore -v .env.development.local
git check-ignore -v .env.production.local
```

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

Plantillas disponibles:

- `.env.development.example`
- `.env.production.example`

## Puesta en marcha local

Entorno de desarrollo:

1. Configurar variables del entorno:

```bash
cp .env.development.example .env.development.local
```

2. Levantar el entorno local:

```bash
npm run env:dev:up
```

La aplicacion quedara disponible en:

- Frontend: `http://localhost:3200`
- API: `http://localhost:3201/api`

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

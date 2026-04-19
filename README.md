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
- Configuracion del presupuesto anual previsto por partida.
- Registro del consumo real por mes y por ano.
- Informes comparativos previstos vs reales por ano.

## Puesta en marcha local

1. Configurar variables locales:

```bash
cp .env.local.example .env.local
```

2. Levantar el entorno local:

```bash
npm run local:up
```

La aplicacion quedara disponible en:

- Frontend: `http://localhost:3000`
- API: `http://localhost:3001/api`

Comandos utiles:

```bash
npm run local:logs
npm run local:down
```

Si necesitas cambiar puertos o credenciales de PostgreSQL, edita `.env.local`.

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

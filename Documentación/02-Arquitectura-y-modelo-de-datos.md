# Arquitectura y modelo de datos

## Arquitectura de alto nivel

La aplicacion sigue una arquitectura sencilla de tres capas:

1. frontend React para la experiencia de usuario
2. backend Express para exponer la API REST y aplicar reglas de negocio
3. PostgreSQL como almacenamiento persistente

Relacion entre piezas:

- el frontend llama a la API HTTP
- la API usa Prisma para leer y escribir en PostgreSQL
- Docker Compose levanta frontend, API, base de datos y SonarQube

## Frontend

Punto de entrada principal:

- [App.tsx](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/App.tsx)

Responsabilidades principales del frontend:

- cargar categorias, presupuestos, consumos, anos e informe anual
- mantener el ano seleccionado
- mostrar formularios y tablas de gestion
- presentar dashboards y comparativas

Pantallas y componentes clave:

- [BudgetManager.tsx](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/features/budgets/BudgetManager.tsx)
  - gestiona partidas y presupuestos anuales
- [ConsumptionManager.tsx](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/features/consumptions/ConsumptionManager.tsx)
  - gestiona consumos mensuales reales
- [ReportsDashboard.tsx](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/features/reports/ReportsDashboard.tsx)
  - muestra indicadores e informes comparativos
- [client.ts](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/api/client.ts)
  - cliente HTTP del frontend

## Backend

Punto de montaje de middleware y rutas:

- [app.ts](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/api/src/app.ts)

Punto de arranque:

- [server.ts](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/api/src/server.ts)

Modulos principales:

- `categories`
  - CRUD de partidas presupuestarias
- `budgets`
  - presupuesto anual previsto por partida y ano
- `consumptions`
  - consumo mensual real por partida y ano
- `reports`
  - agregados y comparativas para informes

Archivo clave del calculo de informes:

- [report-calculator.ts](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/api/src/modules/reports/report-calculator.ts)

## Modelo de datos

Definido en:

- [schema.prisma](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/api/prisma/schema.prisma)

Entidades principales:

### `BudgetCategory`

Representa una partida presupuestaria.

Campos clave:

- `name`
- `description`
- `kind`: `INCOME` o `EXPENSE`
- `nature`: `FIXED` o `VARIABLE`
- `active`

### `AnnualBudget`

Representa el importe anual previsto para una partida en un ano concreto.

Campos clave:

- `year`
- `plannedAmount`
- `categoryId`

Restriccion importante:

- combinacion unica `year + categoryId`

### `MonthlyConsumption`

Representa el consumo real mensual para una partida y ano.

Campos clave:

- `year`
- `month`
- `actualAmount`
- `categoryId`

Restriccion importante:

- combinacion unica `year + month + categoryId`

## Informes calculados

La API devuelve un objeto `Report` con:

- totales previstos y reales
- comparativa anual por categoria
- comparativa por naturaleza
- comparativa por tipo
- comparativa mensual linealizada con acumulados

La idea de "linealizado" es repartir el presupuesto anual de cada partida en 12 meses iguales para poder compararlo contra el consumo real mensual.


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

Separacion por entornos:

- el mismo `docker-compose.yml` se parametriza para `development` y `production`
- cada entorno se arranca con un `COMPOSE_PROJECT_NAME` distinto
- eso genera redes, contenedores y volumenes independientes
- cada entorno apunta a una base de datos diferente, por lo que los datos no se mezclan

## Frontend

Punto de entrada principal:

- [App.tsx](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/App.tsx)

Responsabilidades principales del frontend:

- cargar categorias, presupuestos, consumos, anos e informe anual
- mantener el ano seleccionado
- mostrar formularios y tablas de gestion
- presentar un resumen anual previsto vs real

Pantallas y componentes clave:

- [BudgetManager.tsx](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/features/budgets/BudgetManager.tsx)
  - gestiona partidas y presupuestos anuales
- [ConsumptionManager.tsx](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/features/consumptions/ConsumptionManager.tsx)
  - gestiona consumos mensuales reales
- [ReportsDashboard.tsx](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/features/reports/ReportsDashboard.tsx)
  - muestra el resumen anual previsto vs real
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

### `ConfiguredYear`

Representa un ano habilitado en la aplicacion.

Su funcion es permitir que un ejercicio aparezca en el selector aunque todavia no tenga presupuestos ni consumos.

Campo clave:

- `year`
- `active`

Regla funcional:

- un ano inactivo conserva sus datos pero no aparece en la navegacion principal

### `BudgetCategory`

Representa una partida presupuestaria.

La categoria es global y comun a todos los ejercicios. No se guarda una copia distinta por ano.

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
- al guardar un presupuesto se asegura tambien la existencia del ano configurado
- al crear un ano o consultar sus presupuestos, el sistema completa automaticamente las partidas que falten con importe `0`
- al crear una partida nueva, el sistema genera tambien su presupuesto vacio en todos los anos ya conocidos

### `MonthlyConsumption`

Representa el consumo real mensual para una partida y ano.

Campos clave:

- `year`
- `month`
- `actualAmount`
- `categoryId`

Restriccion importante:

- combinacion unica `year + month + categoryId`
- al guardar un consumo se asegura tambien la existencia del ano configurado

## Informes calculados

La API devuelve un objeto `Report` con:

- un bloque `planned`
- un bloque `actual`
- una coleccion `monthlyActual`

Cada bloque contiene:

- ingresos fijos
- ingresos variables
- gastos fijos
- gastos variables
- total de ingresos
- total de gastos
- balance

La coleccion `monthlyActual` contiene 12 filas, una por mes, con:

- mes
- gastos fijos reales
- gastos variables reales
- gastos totales reales
- ingresos totales reales
- balance real del mes

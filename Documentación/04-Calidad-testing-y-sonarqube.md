# Calidad, testing y SonarQube

## Estrategia de calidad aplicada

Se han preparado tres niveles de validacion:

1. compilacion
2. tests automatizados
3. analisis estatico con SonarQube

## Tests automatizados

### Backend

Ubicacion principal:

- [app.test.ts](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/api/tests/app.test.ts)
- [report-calculator.test.ts](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/api/tests/report-calculator.test.ts)

Que cubren:

- disponibilidad del endpoint de salud
- calculo de informes anuales
- casos con presupuesto y sin presupuesto previo

### Frontend

Ubicacion principal:

- [BudgetManager.test.tsx](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/features/budgets/BudgetManager.test.tsx)
- [excel-import.test.ts](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/features/imports/excel-import.test.ts)
- [ReportsDashboard.test.tsx](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/features/reports/ReportsDashboard.test.tsx)
- [report-export.test.ts](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/features/reports/report-export.test.ts)
- [sonar-coverage.test.tsx](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/features/sonar-coverage.test.tsx)

Que cubren:

- apertura de formularios
- guardado de partidas y presupuestos
- registro y borrado de consumos
- parseo y validacion de ficheros Excel de importacion
- importacion masiva de partidas, presupuestos y consumos desde la interfaz
- renderizado del informe resumido
- renderizado del informe mensual por meses
- renderizado del informe por partida
- generacion de CSV de informes y totales anuales
- estado vacio de la vista de informes

## Comandos de validacion

Validacion completa local:

```bash
npm run quality:validate
```

Tests globales:

```bash
npm test
```

Cobertura backend:

```bash
npm run test:coverage -w @presupuesto/api
```

Cobertura frontend:

```bash
npm run test:coverage -w @presupuesto/web
```

## SonarQube

Configuracion:

- [sonar-project.properties](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/sonar-project.properties)
- [tsconfig.sonar.json](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/tsconfig.sonar.json)

Scripts implicados:

- [sonar-up.sh](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts/sonar-up.sh)
- [sonar-scan.sh](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts/sonar-scan.sh)
- [sonar-down.sh](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts/sonar-down.sh)

Comandos:

```bash
npm run sonar:up
npm run sonar:scan
npm run sonar:down
```

URL local:

- `http://localhost:9000`

## Resultado de calidad conseguido

Estado final tras los ajustes:

- incidencias abiertas SonarQube: `0`
- Quality Gate: `OK`
- cobertura nueva analizada por SonarQube: `83.1%`

## Hallazgos resueltos

Se resolvieron, entre otros, estos puntos:

- uso incorrecto de `reduce` en el calculo de informes
- funciones inline en tablas PrimeReact que Sonar marcaba como code smell
- import redundante en React
- cobertura insuficiente en cambios recientes
- problema del script de Sonar con la autenticacion del usuario `admin`

## Advertencias no bloqueantes

Durante `vite build` aparece una advertencia por tamano de bundle:

- el JS principal supera 500 kB minificado

Esto no rompe el build ni el Quality Gate, pero conviene revisarlo si se quiere optimizar rendimiento.

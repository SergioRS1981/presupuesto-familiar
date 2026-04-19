# Trabajo realizado y cambios aplicados

## Resumen ejecutivo

Sobre el encargo inicial se ha construido una primera solucion completa y operativa que incluye aplicacion, persistencia, contenedores, pruebas y control de calidad.

## Trabajo funcional implementado

### 1. Aplicacion full-stack

Se ha preparado una aplicacion con:

- backend Node.js + TypeScript
- frontend React + PrimeReact
- base de datos PostgreSQL

### 2. Gestion de negocio

Se han implementado:

- partidas presupuestarias
- presupuestos anuales
- consumos mensuales
- informes anuales comparativos

### 3. Persistencia

La informacion se guarda en PostgreSQL a traves de Prisma.

### 4. Contenerizacion

Se ha dejado el proyecto preparado para levantarse en local mediante Docker Compose.

### 5. Seguridad base

En la API se aplicaron medidas minimas razonables:

- `helmet`
- `cors` controlado por configuracion
- `express-rate-limit`
- validacion de entradas
- limite de tamano de `json`
- ocultacion de `x-powered-by`

### 6. Testing automatizado

Se han dejado tests de backend y frontend con Vitest y cobertura en formato lcov.

### 7. SonarQube

Se integro SonarQube local con:

- base de datos propia
- scripts de arranque y parada
- escaneo automatizado
- Quality Gate operativo

## Ajustes hechos para despliegue local

Se dejo un flujo simple basado en scripts:

- `npm run local:up`
- `npm run local:logs`
- `npm run local:down`

Con esto un desarrollador puede levantar la aplicacion sin conocer antes los detalles internos de Docker Compose.

## Ajustes hechos para SonarQube

Se realizo el trabajo siguiente:

- configuracion del proyecto Sonar
- integracion de cobertura backend y frontend
- ajuste de `tsconfig` para analisis de TypeScript del frontend
- scripts para levantar SonarQube y ejecutar analisis
- correccion del flujo de autenticacion del script de escaneo

## Hallazgos de SonarQube que se corrigieron

### Backend

- se cambio la logica de acumulados en [report-calculator.ts](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/api/src/modules/reports/report-calculator.ts) para eliminar un `reduce` con valor de retorno ignorado

### Frontend

- se extrajeron renderizadores de tablas fuera del JSX en:
  - [BudgetManager.tsx](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/features/budgets/BudgetManager.tsx)
  - [ConsumptionManager.tsx](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/features/consumptions/ConsumptionManager.tsx)
  - [ReportsDashboard.tsx](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web/src/features/reports/ReportsDashboard.tsx)
- se limpio un import redundante de React
- se anadio cobertura de pruebas para los caminos nuevos

## Cambios de soporte y automatizacion

Tambien se dejaron listos:

- [quality-validate.sh](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts/quality-validate.sh)
- [sonar-scan.sh](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts/sonar-scan.sh)
- [sonar-up.sh](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts/sonar-up.sh)
- [local-up.sh](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts/local-up.sh)

## Resultado final del trabajo

El sistema queda:

- ejecutable en local
- persistente
- contenerizado
- validado con tests
- analizado con SonarQube
- con Quality Gate en verde


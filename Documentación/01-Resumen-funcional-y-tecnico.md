# Resumen funcional y tecnico

## Que hace la aplicacion

La aplicacion permite gestionar un presupuesto anual domestico con foco en tres bloques:

- definicion de partidas presupuestarias
- carga de presupuesto previsto por ano
- carga de consumo real por mes

Sobre esos datos, la aplicacion genera informes comparativos entre lo previsto y lo realmente consumido.

## Funcionalidades entregadas

- Alta, edicion y borrado de partidas presupuestarias.
- Clasificacion de partidas por:
  - tipo: `INCOME` o `EXPENSE`
  - naturaleza: `FIXED` o `VARIABLE`
- Activacion o desactivacion de partidas.
- Configuracion del importe anual previsto por partida y ano.
- Registro del consumo real mensual por partida y ano.
- Selector de ano para consultar y trabajar con distintos ejercicios.
- Informes anuales con:
  - ingresos y gastos previstos
  - ingresos y gastos reales acumulados
  - comparativa mensual linealizada previsto vs real
  - comparativa por naturaleza fija/variable
  - comparativa por tipo ingreso/gasto
  - comparativa por partida con porcentaje consumido

## Tecnologias usadas

### Backend

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- Zod

### Frontend

- React
- Vite
- PrimeReact
- PrimeFlex
- Chart.js

### Infraestructura y calidad

- Docker Compose
- Vitest
- Testing Library
- SonarQube

## Estructura general del repositorio

- [apps/api](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/api): API y acceso a datos
- [apps/web](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web): interfaz web
- [scripts](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts): automatizacion de arranque, validacion y SonarQube
- [docker-compose.yml](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/docker-compose.yml): orquestacion local
- [sonar-project.properties](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/sonar-project.properties): configuracion del analisis Sonar

## Flujo de uso para negocio

1. Crear las partidas presupuestarias.
2. Definir el presupuesto anual de cada partida para un ano.
3. Registrar los consumos reales mensuales.
4. Consultar informes del ano seleccionado.

## Estado actual

El proyecto esta preparado para ejecutarse en local con Docker y persistir datos en PostgreSQL. Tambien dispone de validaciones automatizadas y analisis de calidad con SonarQube.


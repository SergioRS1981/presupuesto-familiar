# Resumen funcional y tecnico

## Que hace la aplicacion

La aplicacion permite gestionar un presupuesto anual domestico con foco en tres bloques:

- definicion de partidas presupuestarias
- carga de presupuesto previsto por ano
- carga de consumo real por mes

Sobre esos datos, la aplicacion genera un informe resumido que compara lo previsto frente a lo real.

## Funcionalidades entregadas

- Alta, edicion y borrado de partidas presupuestarias.
- Clasificacion de partidas por:
  - tipo: `INCOME` o `EXPENSE`
  - naturaleza: `FIXED` o `VARIABLE`
- Activacion o desactivacion de partidas.
- Configuracion del importe anual previsto por partida y ano.
- Visualizacion del porcentaje que supone cada partida dentro del total de ingresos o gastos del ano.
- Registro del consumo real mensual por partida y ano.
- Registro opcional de una anotacion libre en cada consumo mensual.
- Alta manual de anos historicos para trabajar sobre ejercicios pasados vacios y completarlos despues.
- Importacion masiva en Excel de:
  - partidas presupuestarias
  - presupuestos previstos
  - consumos reales
- Descarga de plantillas Excel de ejemplo para cada tipo de importacion.
- Selector de ano para consultar y trabajar con distintos ejercicios.
- Informes anuales resumidos con:
  - ingresos fijos previstos y reales
  - ingresos variables previstos y reales
  - gastos fijos previstos y reales
  - gastos variables previstos y reales
  - total de ingresos previsto y real
  - total de gastos previsto y real
  - balance previsto y real
  - diferencia entre previsto y real
  - porcentaje de ejecucion del real sobre el previsto
- Informe mensual real por meses con:
  - gastos fijos
  - gastos variables
  - gastos totales
  - ingresos totales
  - balance mensual
- Informe por partida con:
  - importe previsto
  - importe real
  - diferencia entre real y previsto
  - porcentaje que supone el real frente al previsto
- Exportacion CSV con:
  - descarga del informe completo del ano seleccionado
  - descarga de los totales anuales de todos los anos disponibles

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
- SheetJS (`xlsx`) para importacion y generacion de plantillas Excel

### Infraestructura y calidad

- Docker Compose
- Vitest
- Testing Library
- SonarQube

## Entornos operativos

El proyecto queda preparado con dos entornos aislados:

- `development`
- `production`

Cada uno dispone de:

- variables de entorno propias
- puertos propios
- proyecto Docker Compose propio
- datos persistentes independientes

## Estructura general del repositorio

- [apps/api](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/api): API y acceso a datos
- [apps/web](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/apps/web): interfaz web
- [scripts](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/scripts): automatizacion de arranque, validacion y SonarQube
- [docker-compose.yml](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/docker-compose.yml): orquestacion local
- [sonar-project.properties](/Users/sergio/Library/Mobile%20Documents/com~apple~CloudDocs/Presupuesto%20Familiar/App/sonar-project.properties): configuracion del analisis Sonar

## Flujo de uso para negocio

1. Crear las partidas presupuestarias.
2. Crear, si hace falta, el ano historico sobre el que se quiere trabajar.
3. Definir el presupuesto anual de cada partida para un ano.
4. Registrar o importar los consumos reales mensuales.
5. Consultar informes del ano seleccionado.

## Estado actual

El proyecto esta preparado para ejecutarse en local con Docker y persistir datos en PostgreSQL. Tambien dispone de validaciones automatizadas y analisis de calidad con SonarQube.

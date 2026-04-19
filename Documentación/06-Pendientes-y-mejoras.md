# Pendientes y mejoras recomendadas

## Mejoras funcionales posibles

- carga de datos semilla para demos o arranque rapido
- autenticacion y autorizacion de usuarios
- exportacion de informes a PDF o Excel
- importacion masiva de datos
- gestion de varios hogares o unidades familiares

## Mejoras tecnicas recomendadas

### Seguridad

- autenticacion con sesiones o JWT
- gestion segura de secretos fuera de `.env.local`
- auditoria de acciones criticas
- endurecimiento adicional de cabeceras y CORS para produccion

### Base de datos

- migraciones versionadas si se quiere un ciclo mas formal que `prisma db push`
- datos semilla reproducibles
- backup y restauracion automatizados

### Frontend

- division del bundle con lazy loading
- manejo de notificaciones de exito y error mas elaborado
- mejora de accesibilidad visual y mensajes guiados

### Backend

- mas cobertura sobre servicios y rutas
- autenticacion y permisos por modulo
- logs estructurados
- observabilidad basica

### DevEx

- pipeline CI
- validacion automatica en pull request
- versionado del proyecto
- guia de contribution si va a participar mas gente

## Riesgos o limites actuales

- no hay autenticacion todavia
- la configuracion actual esta orientada a entorno local
- el bundle frontend puede optimizarse
- la cobertura global del proyecto aun puede crecer, aunque la cobertura nueva ya cumple el Quality Gate

## Siguiente paso recomendado

Si el objetivo es evolucionar el proyecto con criterio, el siguiente bloque de trabajo mas rentable seria:

1. autenticacion basica
2. datos semilla
3. CI con tests y SonarQube
4. optimizacion del bundle frontend


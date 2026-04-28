# DevOps y CI-CD

## Objetivo

Dejar el proyecto preparado para un flujo moderno sobre VPS:

- validacion automatica en cada pull request
- imagenes Docker inmutables publicadas en GHCR
- promocion manual y aprobada a produccion
- base de datos con migraciones versionadas de Prisma
- copia de seguridad previa al despliegue
- instalaciones reproducibles con `yarn.lock`
- credenciales de acceso separadas por entorno
- rollback simple por etiqueta de imagen

## Flujo propuesto

### CI

Archivo: `.github/workflows/ci.yml`

Se ejecuta en:

- push a ramas de trabajo distintas de `main`
- `pull_request`
- `workflow_dispatch`

Valida:

- instalacion de dependencias bloqueada por `yarn.lock`
- `yarn build`
- `yarn test`
- build de las imagenes Docker de API y web

### Release

Archivo: `.github/workflows/cd.yml`

Se ejecuta en:

- push a `main`
- lanzamiento manual con `workflow_dispatch`

Pasos:

1. Ejecuta el mismo quality gate que CI.
2. Construye y publica las imagenes `api` y `web` en `ghcr.io`.
3. Publica el tag por SHA y el alias `main`.
4. Deja la release lista para promocion manual.

### Deploy a produccion

Archivo: `.github/workflows/deploy-production.yml`

Se ejecuta en:

- `workflow_dispatch`

Pasos:

1. Seleccionas el tag a desplegar: `main` o un SHA concreto.
2. El job queda asociado al entorno `production`.
3. El VPS genera una copia de seguridad de PostgreSQL antes del despliegue.
4. Se ejecutan migraciones con Prisma.
5. Se actualizan API y frontend.

## Archivos anadidos para despliegue

- `docker-compose.deploy.yml`
- `scripts/deploy/bootstrap-almalinux.sh`
- `scripts/deploy/nginx-presupuestofamiliar.rodriguezgalvan.es.conf`
- `scripts/deploy/github-secrets.presupuestofamiliar.env`
- `scripts/deploy/vps-backup.sh`
- `scripts/deploy/vps-deploy.sh`
- `apps/api/prisma-deploy.sh`
- `apps/api/docker-entrypoint.sh`
- `apps/api/docker-migrate.sh`
- `apps/api/prisma/migrations/20260425190000_init/migration.sql`

## Flujo de trabajo recomendado con ramas

1. Crear una rama desde `main`: `feature/...` o `fix/...`.
2. Desarrollar y validar en tu entorno local `development`.
3. Subir la rama al remoto.
4. Dejar que CI valide la rama y el pull request.
5. Abrir pull request hacia `main`.
6. Fusionar solo cuando CI este en verde.
7. Esperar a que `Release Images` publique las imagenes en GHCR.
8. Ejecutar manualmente `Deploy Production` con el tag a promover.

Con este flujo:

- el desarrollo sigue ocurriendo solo en local
- produccion vive solo en IONOS
- los datos de produccion no se mezclan con local
- cada despliegue usa imagenes inmutables
- puedes redeployar o volver atras a un SHA anterior

## Secretos necesarios en GitHub

### Para conectar con el VPS

- `VPS_HOST`
- `VPS_PORT`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_APP_PATH`

Ejemplo de `VPS_APP_PATH`:

```text
/opt/presupuesto-familiar
```

### Para que el VPS pueda descargar imagenes del registry

Si las imagenes de GHCR son publicas, no necesitas ningun secret adicional de registry.

Solo si algun dia vuelves a hacer privadas las imagenes, podrias usar:

- `REGISTRY_USERNAME`
- `REGISTRY_PASSWORD`

En ese caso, lo normal es un usuario GitHub y un token con permiso de lectura de paquetes.

### Para el entorno de produccion

No se recomienda guardar secretos de aplicacion en GitHub si tu VPS ya puede custodiar su propio `.env.production`.

Estrategia recomendada:

- el archivo `.env.production` vive solo en el VPS
- GitHub Actions solo copia los artefactos de despliegue y decide `API_IMAGE` y `WEB_IMAGE`
- el workflow genera un archivo temporal `.env.production.release` en el servidor y lo elimina al terminar
- para repositorio e imagenes publicas, el despliegue no necesita login a GHCR

Contenido minimo recomendado en el VPS:

```env
APP_ENV=production
NODE_ENV=production
COMPOSE_PROJECT_NAME=presupuesto-prod
POSTGRES_DB=presupuesto_familiar_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=cambia-esta-clave
API_PORT=3001
WEB_PORT=3000
WEB_PUBLIC_URL=https://presupuestofamiliar.rodriguezgalvan.es
RATE_LIMIT_MAX=300
AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=scrypt:REEMPLAZA_SALT:REEMPLAZA_HASH
SESSION_SECRET=REEMPLAZA_POR_UN_SECRET_HEX_LARGO
SESSION_TTL_HOURS=12
BACKUP_BEFORE_DEPLOY=true
BACKUP_RETENTION_DAYS=14
```

Flujo recomendado para generarlo:

```bash
node scripts/generate-auth-credentials.mjs admin "TuContrasenaSeguraDeProduccion"
```

Luego pegas `AUTH_PASSWORD_HASH` y `SESSION_SECRET` en `/opt/presupuesto-familiar/.env.production`.

## Bootstrap inicial del VPS

El workflow asume que el VPS ya tiene:

- Docker
- Docker Compose
- un proxy inverso delante, como Nginx o Caddy
- acceso de lectura al registry

La primera vez basta con crear el directorio de despliegue:

```bash
mkdir -p /opt/presupuesto-familiar
```

Y crear manualmente `/opt/presupuesto-familiar/.env.production` con los secretos reales y permisos restringidos:

```bash
chmod 600 /opt/presupuesto-familiar/.env.production
```

Comprobacion recomendada:

```bash
ls -l /opt/presupuesto-familiar/.env.production
```

Debe quedar accesible solo para el usuario propietario.

Despues, el propio workflow sube los archivos minimos y ejecuta el despliegue.

### Preparacion especifica para AlmaLinux

Se incluye un script listo para el dominio real:

```bash
sudo sh ./scripts/deploy/bootstrap-almalinux.sh presupuestofamiliar.rodriguezgalvan.es tu-email@ejemplo.com
```

Este script:

- instala Docker y Docker Compose
- instala Nginx
- instala snapd y Certbot
- abre `http` y `https` en `firewalld` si esta activo
- crea la configuracion de Nginx para `presupuestofamiliar.rodriguezgalvan.es`
- solicita el certificado TLS

Tambien se incluye la configuracion Nginx lista en:

- `scripts/deploy/nginx-presupuestofamiliar.rodriguezgalvan.es.conf`

Y una referencia rapida de secretos en:

- `scripts/deploy/github-secrets.presupuestofamiliar.env`

## Ajustes manuales en GitHub que no se pueden automatizar desde este repo

Debes configurar estos puntos en la interfaz de GitHub:

### Proteccion de rama `main`

- bloquear pushes directos
- exigir pull request
- exigir que CI pase antes de fusionar

### Entorno `production`

- crear el environment `production`
- marcar `required reviewers` si quieres aprobacion humana antes de desplegar
- cargar ahi los secretos de despliegue del VPS

Esta parte no puedo dejarla hecha desde local porque depende de tu repositorio remoto y de la configuracion web de GitHub.

## Rollback

Como las imagenes se publican por SHA, el rollback consiste en relanzar manualmente `Deploy Production` indicando un SHA anterior.

Si necesitas hacerlo manualmente en el VPS, crea un archivo temporal basado en `.env.production` y anade la version de imagen a restaurar:

```bash
cd /opt/presupuesto-familiar
cp .env.production .env.production.rollback
printf '\nAPI_IMAGE=ghcr.io/sergiors1981/presupuesto-familiar-api:SHA_ANTERIOR\n' >> .env.production.rollback
printf 'WEB_IMAGE=ghcr.io/sergiors1981/presupuesto-familiar-web:SHA_ANTERIOR\n' >> .env.production.rollback
REGISTRY=ghcr.io sh ./scripts/deploy/vps-deploy.sh ./.env.production.rollback
rm -f .env.production.rollback
```

## Notas operativas

- `docker-compose.deploy.yml` no expone PostgreSQL publicamente.
- `docker-compose.deploy.yml` expone API y web solo en `127.0.0.1`, para que Nginx sea el unico punto publico.
- El frontend usa `/api` por defecto, asi que la misma imagen web sirve para local y produccion sin recompilar por dominio.
- La autenticacion no requiere migraciones ni tablas nuevas, por lo que no afecta a los datos de negocio existentes.
- Los secretos de aplicacion no viven en GitHub: desarrollo usa `.env.development.local` y produccion usa `.env.production` solo en el VPS.
- La imagen de API aplica `prisma migrate deploy` si existen migraciones versionadas.
- Si no existieran migraciones, mantiene compatibilidad con `prisma db push`.
- En `development`, si Prisma detecta una base ya existente sin baseline de migraciones, hace `db push` para conservar los datos locales.
- En produccion se usa un servicio `api-migrate` para ejecutar migraciones antes del rollout de la API.
- Antes del despliegue se genera un `pg_dump` comprimido en `backups/postgres`.
- CI y Docker usan `yarn install --frozen-lockfile` para construir exactamente con el lockfile del repo.

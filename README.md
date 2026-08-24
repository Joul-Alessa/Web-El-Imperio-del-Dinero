# El Imperio del Dinero

Aplicacion web familiar para registrar, consultar y analizar ingresos, gastos, movimientos entre cuentas e inversiones (renta fija y variable). Reemplaza un Excel compartido, eliminando el cuello de botella de un solo archivo.

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Inicio rapido (local)](#inicio-rapido-local)
- [Inicio con Docker / Podman](#inicio-con-docker--podman)
- [Variables de entorno](#variables-de-entorno)
- [Backend](#backend)
  - [Estructura de archivos](#estructura-de-archivos-backend)
  - [Endpoints de la API](#endpoints-de-la-api)
  - [Base de datos](#base-de-datos)
  - [Migraciones](#migraciones)
- [Frontend](#frontend)
  - [Estructura de archivos](#estructura-de-archivos-frontend)
  - [Rutas](#rutas)
  - [Servicios](#servicios)
  - [Sistema de diseno](#sistema-de-diseno)
- [Testing](#testing)
- [Containerizacion](#containerizacion)
  - [Desarrollo](#desarrollo)
  - [Produccion](#produccion)
  - [Tests en contenedor](#tests-en-contenedor)
- [Documentacion adicional](#documentacion-adicional)

---

## Arquitectura

```
┌──────────────┐        ┌──────────────┐        ┌────────────┐
│   Angular 19 │  HTTP  │  Express 5   │  Knex  │  SQLite 3  │
│   (SPA)      │───────>│  REST API    │───────>│  (archivo)  │
│   :4200 dev  │        │  :3000       │        │             │
│   :80  prod  │        │              │        │             │
└──────────────┘        └──────────────┘        └────────────┘
       │ (prod)                ▲
       │   nginx reverse      │
       └──────────────────────┘
         proxy /api/ -> :3000
```

- **Frontend:** Angular 19 con componentes standalone y lazy loading.
- **Backend:** Express 5 con Knex.js como query builder.
- **Base de datos:** SQLite 3 (archivo local, sin servidor de BD).
- **Produccion:** Nginx sirve el SPA y hace reverse proxy de `/api/` al backend.

---

## Requisitos previos

| Herramienta | Version minima |
|-------------|---------------|
| Node.js     | 22.x          |
| npm         | 10.x          |
| Angular CLI | 19.x (`npm i -g @angular/cli`) |

Para uso con contenedores: Docker 20+ o Podman 4+.

---

## Inicio rapido (local)

### 1. Backend

```bash
cd BackEnd
npm install
npm run migrate
npm start
```

El servidor arranca en `http://localhost:3000`.

### 2. Frontend

```bash
cd FrontEnd
npm install
ng serve
```

La aplicacion queda disponible en `http://localhost:4200`. Las llamadas a la API van directamente a `http://localhost:3000/api` (CORS habilitado).

---

## Inicio con Docker / Podman

### Desarrollo (con hot reload)

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`
- Los directorios fuente se montan como bind mounts para recarga automatica.

### Produccion

```bash
docker compose up --build
```

- Aplicacion completa: `http://localhost` (puerto 80)
- Nginx sirve el SPA y hace proxy de `/api/` al backend.
- La base de datos se persiste en un volumen Docker (`sqlite_data`).

### Base de datos: insertar y extraer el archivo SQLite

La aplicación en contenedor **no usa** el archivo `BackEnd/db/imperio_del_dinero.sqlite3` del disco cuando se levanta localmente. Tanto en desarrollo como en producción, el `DB_FILENAME` apunta a `/app/data/imperio_del_dinero.sqlite3` dentro del contenedor, y ese directorio está respaldado por el **volumen nombrado** `sqlite_data`. El archivo local de `BackEnd/db/` sólo sirve como fuente/destino para copiarlo con `docker cp`.

> Nota: si se usa Podman, sustituir `docker compose` por `podman compose` en los comandos de `up`, y usar `podman cp` (con el nombre real del contenedor) en lugar de `docker compose cp`.

#### Insertar el archivo local DENTRO del contenedor (sembrar/restaurar datos)

El volumen se crea al levantar el servicio, asi que primero arrancas y luego copias:

```bash
# 1. Levanta el servicio (crea el volumen y genera una BD vacia con las migraciones)
docker compose -f docker-compose.dev.yml up -d backend   # desarrollo
# o bien, para produccion:
docker compose up -d backend

# 2. Deten el backend para que no tenga el archivo abierto
docker compose -f docker-compose.dev.yml stop backend

# 3. Copia tu archivo local al volumen, dentro del contenedor
docker compose -f docker-compose.dev.yml cp ./BackEnd/db/imperio_del_dinero.sqlite3 backend:/app/data/imperio_del_dinero.sqlite3

# 4. Reinicia el backend
docker compose -f docker-compose.dev.yml start backend
```

Alternativa con `docker`/`podman` puro (obten el nombre del contenedor con `docker ps`):

```bash
docker cp ./BackEnd/db/imperio_del_dinero.sqlite3 <nombre_contenedor>:/app/data/imperio_del_dinero.sqlite3
```

#### Extraer el archivo del contenedor a tu equipo (visualizarlo)

```bash
# 1. Deten el backend para copiar un archivo consistente
docker compose -f docker-compose.dev.yml stop backend

# 2. Copia el archivo del volumen a tu disco local
docker compose -f docker-compose.dev.yml cp backend:/app/data/imperio_del_dinero.sqlite3 ./BackEnd/db/imperio_del_dinero.sqlite3

# 3. Reinicia el backend
docker compose -f docker-compose.dev.yml start backend

# 4. Abre BackEnd/db/imperio_del_dinero.sqlite3 con DB Browser for SQLite (u otro visor)
```

> Si prefieres verlo sin tocar la ruta del proyecto, cambia el destino del paso 2 a una copia aparte, por ejemplo `./copia_imperio.sqlite3`.

#### Acceder al sitio desde otro dispositivo de la red (Podman en Windows)

Podman en Windows corre dentro de una VM de WSL2. Los puertos publicados quedan enlazados a `127.0.0.1` en el host Windows, no a todas las interfaces, por lo que otros dispositivos de la red no pueden alcanzarlos directamente.

**Opcion A — Port proxy temporal** (se pierde al reiniciar Windows, requiere PowerShell como administrador):

```powershell
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=80 connectaddress=127.0.0.1 connectport=80
```

Para verificar que quedo activo:

```powershell
netsh interface portproxy show all
```

Para eliminarlo cuando ya no se necesite:

```powershell
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=80
```

**Opcion B — Red espejada de WSL2** (permanente, recomendada): edita o crea `C:\Users\<tu-usuario>\.wslconfig` y agrega:

```ini
[wsl2]
networkingMode=mirrored
```

Luego reinicia WSL2:

```powershell
wsl --shutdown
```

Con el modo espejado WSL2 comparte las interfaces de red de Windows, por lo que los puertos de Podman quedan accesibles desde la red local de forma automatica y sin configuracion adicional.

> En ambos casos, accede desde el otro dispositivo con `http://<IP-local-de-tu-PC>`. Obtén tu IP local con `ipconfig` (busca la "Direccion IPv4" de tu adaptador WiFi o Ethernet).

#### Recomendaciones de seguridad

- **Deten siempre el servicio antes de `cp`** (entrada o salida). Asi evitas copiar un archivo a mitad de escritura y previenes bloqueos (file locks) de SQLite.
- **No abras el archivo con el visor mientras el contenedor esta corriendo y escribiendo** en el. SQLite puede corruptarse si se escribe desde dos procesos a la vez. Si necesitas inspeccionarlo "en vivo", copialo a una copia aparte y abre esa.
- El volumen `sqlite_data` persiste aunque reconstruyas las imagenes (`docker compose build`). Para empezar de cero (borrar la BD y el volumen):

  ```bash
  docker compose down -v
  ```

- Recuerda que `.dockerignore` excluye `db/*.sqlite3`, por lo que el archivo **no** se hornea en la imagen; el unico mecanismo para moverlo es `docker cp` (o un bind mount, si decides cambiar de estrategia).

---

## Variables de entorno

| Variable      | Donde se usa | Default                              | Descripcion                          |
|---------------|-------------|--------------------------------------|--------------------------------------|
| `PORT`        | Backend     | `3000`                               | Puerto del servidor Express          |
| `DB_FILENAME` | Backend     | `./db/imperio_del_dinero.sqlite3`    | Ruta al archivo SQLite               |
| `NODE_ENV`    | Backend     | (no definido)                        | `development` o `production`         |

El frontend usa archivos `environment.ts` de Angular (no variables de entorno del sistema):

| Archivo                          | `apiUrl`                       |
|----------------------------------|-------------------------------|
| `environment.ts` (desarrollo)    | `http://localhost:3000/api`   |
| `environment.production.ts`      | `/api` (relativo, via nginx)  |

---

## Backend

### Estructura de archivos (backend)

```
BackEnd/
  index.js                 # Entry point (Express server)
  knexfile.js              # Configuracion de Knex / SQLite
  vitest.config.js         # Configuracion de Vitest
  Dockerfile               # Multi-stage: dev, test, build, prod
  db/
    knex.js                # Instancia singleton de Knex
    registrarHistorial.js  # Helper de auditoria (tabla historial)
    imperio_del_dinero.sqlite3
  lib/
    balances.js            # Logica pura: calculo de balances y revalorizacion
  routes/
    personas.js            # CRUD personas
    instituciones.js       # CRUD instituciones
    divisas.js             # CRUD divisas
    instrumentos.js        # CRUD instrumentos financieros
    cuentas.js             # CRUD cuentas + balance
    movimientos.js         # CRUD movimientos + logica de revalorizacion
    historial.js           # Lectura del log de auditoria
  migrations/              # 8 archivos de migracion Knex
  tests/
    balances.test.js       # Tests unitarios de lib/balances.js
```

### Endpoints de la API

Todos los endpoints estan bajo el prefijo `/api`. No hay autenticacion; CORS esta abierto.

#### Personas `/api/personas`

| Metodo | Ruta                | Descripcion             |
|--------|---------------------|-------------------------|
| GET    | `/api/personas`     | Listar todas            |
| GET    | `/api/personas/:id` | Obtener por ID          |
| POST   | `/api/personas`     | Crear                   |
| PUT    | `/api/personas/:id` | Actualizar              |
| DELETE | `/api/personas/:id` | Eliminar                |

#### Instituciones `/api/instituciones`

| Metodo | Ruta                     | Descripcion             |
|--------|--------------------------|-------------------------|
| GET    | `/api/instituciones`     | Listar todas            |
| GET    | `/api/instituciones/:id` | Obtener por ID          |
| POST   | `/api/instituciones`     | Crear                   |
| PUT    | `/api/instituciones/:id` | Actualizar              |
| DELETE | `/api/instituciones/:id` | Eliminar                |

#### Divisas `/api/divisas`

| Metodo | Ruta                 | Descripcion             |
|--------|----------------------|-------------------------|
| GET    | `/api/divisas`       | Listar todas            |
| GET    | `/api/divisas/:id`   | Obtener por ID          |
| POST   | `/api/divisas`       | Crear                   |
| PUT    | `/api/divisas/:id`   | Actualizar              |
| DELETE | `/api/divisas/:id`   | Eliminar                |

#### Instrumentos financieros `/api/instrumentos`

| Metodo | Ruta                     | Descripcion                                    |
|--------|--------------------------|------------------------------------------------|
| GET    | `/api/instrumentos`      | Listar todos (con datos de divisa e institucion asociadas) |
| GET    | `/api/instrumentos/:id`  | Obtener por ID                                  |
| POST   | `/api/instrumentos`      | Crear (metadata se guarda como JSON)            |
| PUT    | `/api/instrumentos/:id`  | Actualizar                                      |
| DELETE | `/api/instrumentos/:id`  | Eliminar                                        |

#### Cuentas financieras `/api/cuentas`

| Metodo | Ruta                       | Descripcion                                                     |
|--------|----------------------------|-----------------------------------------------------------------|
| GET    | `/api/cuentas`             | Listar (filtros: `persona_id`, `institucion_id`, `tipo`, `divisa_id`, `instrumento_id`) |
| GET    | `/api/cuentas/resumen`     | Balance, cantidad de titulos y precio unitario de todas las cuentas |
| GET    | `/api/cuentas/:id`         | Obtener por ID                                                   |
| GET    | `/api/cuentas/:id/balance` | Calcular balance a una fecha (`?fecha=...&excludeMovimientoId=...`) |
| GET    | `/api/cuentas/:id/ultimo-movimiento-inversion` | Ultimo movimiento con cantidad y precio unitario no nulos |
| POST   | `/api/cuentas`             | Crear                                                            |
| PUT    | `/api/cuentas/:id`         | Actualizar (incluye campo `activo`)                              |
| DELETE | `/api/cuentas/:id`         | Eliminar                                                         |

#### Movimientos `/api/movimientos`

| Metodo | Ruta                      | Descripcion                                                      |
|--------|---------------------------|------------------------------------------------------------------|
| GET    | `/api/movimientos`        | Listar (filtros: `persona_id`, `cuenta_id`, `tipo`, `fecha_desde`, `fecha_hasta`, `institucion_id`, `instrumento_id`, `divisa_id`) |
| GET    | `/api/movimientos/:id`    | Obtener por ID                                                    |
| POST   | `/api/movimientos`        | Crear (si `tipo=revalorizacion`, calcula delta automaticamente; acepta `cantidad` y `precio_unitario` opcionales) |
| PUT    | `/api/movimientos/:id`    | Actualizar                                                        |
| DELETE | `/api/movimientos/:id`    | Eliminar                                                          |

#### Historial (auditoria) `/api/historial`

| Metodo | Ruta              | Descripcion                                                    |
|--------|--------------------|----------------------------------------------------------------|
| GET    | `/api/historial`   | Listar log de auditoria (filtros: `entidad`, `accion`; paginado con `limit` y `offset`) |

**Total: 30 endpoints.** Todas las operaciones de escritura registran automaticamente una entrada en la tabla `historial`.

### Base de datos

Motor SQLite 3, accedido via Knex.js. El archivo de base de datos reside en `BackEnd/db/imperio_del_dinero.sqlite3` (desarrollo) o en un volumen Docker en `/app/data/` (produccion).

**Esquema (7 tablas):**

| Tabla                     | Descripcion                              |
|---------------------------|------------------------------------------|
| `personas`                | Miembros de la familia                   |
| `instituciones`           | Bancos, fintechs, brokers                |
| `divisas`                 | Monedas (MXN, USD, etc.)                 |
| `instrumentos_financieros`| Instrumentos de inversion                |
| `cuentas_financieras`     | Cuentas por persona, institucion y divisa|
| `movimientos`             | Ingresos, gastos, transferencias         |
| `historial`               | Log de auditoria de todas las operaciones|

### Migraciones

Se ejecutan con Knex:

```bash
cd BackEnd
npm run migrate            # Aplicar migraciones pendientes
npm run migrate:rollback   # Revertir la ultima migracion
```

Migraciones existentes:

1. `20260802000000_create_schema.js` — Esquema inicial (6 tablas)
2. `20260802010000_cuenta_institucion_nullable.js` — `institucion_id` nullable en cuentas
3. `20260802020000_movimiento_fecha_datetime.js` — Campo `fecha` cambia de date a datetime
4. `20260803000000_convert_revalorizacion_to_ingreso_gasto.js` — Migra filas legacy de revalorizacion
5. `20260803010000_cuenta_activo.js` — Agrega flag `activo` a cuentas
6. `20260803020000_create_historial.js` — Crea tabla de auditoria
7. `20260813000000_drop_cuenta_investment_fields.js` — Elimina campos `cantidad`, `valor_compra` y `valor_actual` de cuentas
8. `20260813010000_instrumento_institucion_fk.js` — Convierte `institucion_origen` (texto) a FK `institucion_id` en instrumentos

---

## Frontend

### Estructura de archivos (frontend)

```
FrontEnd/
  angular.json              # Configuracion de Angular CLI
  Dockerfile                # Multi-stage: dev, build, prod (nginx)
  nginx.conf                # Reverse proxy para produccion
  src/
    main.ts                 # Bootstrap standalone
    styles.scss             # Sistema de diseno global (tokens, componentes CSS)
    index.html              # HTML raiz (con script de tema pre-render)
    environments/
      environment.ts        # Desarrollo (apiUrl: localhost:3000)
      environment.production.ts  # Produccion (apiUrl: /api)
    app/
      app.component.ts/.html/.scss  # Shell: sidebar + topbar + router-outlet
      app.config.ts                 # Providers (router, http, zone)
      app.routes.ts                 # Definicion de rutas con lazy loading
      core/
        models.ts                   # Interfaces TypeScript del dominio
        api.config.ts               # Constante API_URL
      services/
        api.service.ts              # Servicio HTTP centralizado
        theme.service.ts            # Toggle de tema claro/oscuro
      shared/
        chart.component.ts          # Wrapper reutilizable de Chart.js
      pages/
        dashboard.component.ts      # Dashboard con graficas
        movimientos.component.ts    # CRUD movimientos
        cuentas.component.ts        # CRUD cuentas
        instrumentos.component.ts   # CRUD instrumentos
        divisas.component.ts        # CRUD divisas
        instituciones.component.ts  # CRUD instituciones
        personas.component.ts       # CRUD personas
        historial.component.ts      # Visor de auditoria
```

### Rutas

Todas las rutas usan **lazy loading** de componentes standalone:

| Ruta              | Componente              |
|-------------------|-------------------------|
| `/`               | Redirige a `/dashboard` |
| `/dashboard`      | Dashboard               |
| `/movimientos`    | Movimientos             |
| `/cuentas`        | Cuentas                 |
| `/instrumentos`   | Instrumentos            |
| `/divisas`        | Divisas                 |
| `/instituciones`  | Instituciones           |
| `/personas`       | Personas                |
| `/historial`      | Historial               |
| `**`              | Redirige a `/dashboard` |

No hay guards de ruta ni interceptores HTTP.

### Servicios

- **`ApiService`** — Servicio unico inyectado en raiz que encapsula todas las llamadas HTTP al backend. Metodos CRUD para cada entidad y soporte de filtros via `HttpParams`.
- **`ThemeService`** — Maneja el toggle claro/oscuro con Angular signals. Persiste la eleccion en `localStorage` y respeta `prefers-color-scheme` como default.

### Sistema de diseno

CSS completamente custom escrito en SCSS — sin frameworks externos (no Bootstrap, no Tailwind, no Angular Material).

- Tokens de color via CSS custom properties con soporte de tema claro y oscuro (`data-theme`)
- Paleta primaria verde (`#0e7c5a`), acento dorado (`#c8971a`)
- Tipografia: Google Fonts "Inter"
- Componentes CSS reutilizables: `.card`, `.btn`, `.badge`, `.modal`, `.switch`, `.spinner`, tablas, formularios
- Responsive con breakpoints a 1024px, 860px y 520px
- Graficas con Chart.js via un componente wrapper reutilizable

---

## Testing

### Backend (Vitest)

```bash
cd BackEnd
npm test              # Ejecucion unica
npm run test:watch    # Modo watch
```

Tests unitarios en `BackEnd/tests/balances.test.js` que cubren las funciones puras `calcularBalance` y `calcularDeltaRevalorizacion`.

### Frontend (Karma + Jasmine)

La infraestructura de testing esta configurada (Karma, Jasmine, tsconfig.spec.json) pero **no existen archivos `.spec.ts`** actualmente.

```bash
cd FrontEnd
npm test    # ng test (sin specs por ahora)
```

### Typecheck del frontend

```bash
cd FrontEnd
npm run typecheck    # tsc --noEmit
```

---

## Containerizacion

El proyecto incluye Dockerfiles multi-stage para ambos servicios y tres archivos Compose para distintos entornos.

### Desarrollo

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Backend: stage `dev`, usa `node --watch` para recarga automatica, ejecuta migraciones al arrancar.
- Frontend: stage `dev`, usa `ng serve --poll=1000`.
- Bind mounts de directorios fuente para edicion en vivo.

### Produccion

```bash
docker compose up --build
```

- Backend: stage `prod`, imagen slim, solo dependencias de produccion.
- Frontend: stage `prod`, build de Angular servido por Nginx (`nginx:1.27.4-alpine`).
- Base de datos en volumen Docker persistente `sqlite_data`.
- Aplicacion accesible en el puerto 80.

### Tests en contenedor

```bash
docker compose -f docker-compose.test.yml up --build
```

- Backend: stage `test`, ejecuta `npm test` (Vitest).
- Frontend: stage `build`, ejecuta typecheck + build de produccion como validacion.

---

## Scripts disponibles

### Backend (`BackEnd/package.json`)

| Script             | Comando              | Descripcion                    |
|--------------------|----------------------|--------------------------------|
| `start`            | `node index.js`      | Iniciar servidor               |
| `migrate`          | `knex migrate:latest`| Ejecutar migraciones           |
| `migrate:rollback` | `knex migrate:rollback`| Revertir ultima migracion    |
| `test`             | `vitest run`         | Ejecutar tests                 |
| `test:watch`       | `vitest`             | Tests en modo watch            |

### Frontend (`FrontEnd/package.json`)

| Script      | Comando                                     | Descripcion                    |
|-------------|---------------------------------------------|--------------------------------|
| `start`     | `ng serve`                                   | Servidor de desarrollo         |
| `build`     | `ng build`                                   | Build de produccion            |
| `watch`     | `ng build --watch --configuration development`| Build en modo watch           |
| `test`      | `ng test`                                    | Ejecutar tests (Karma)         |
| `typecheck` | `tsc --noEmit -p tsconfig.app.json`          | Verificacion de tipos          |

---

## Documentacion adicional

- [`Docs/Requerimientos-y-Ejemplos.md`](Docs/Requerimientos-y-Ejemplos.md) — Requerimientos funcionales del sistema, modelo de datos conceptual y ejemplos de movimientos.
- [`Docs/Database.md`](Docs/Database.md) — Diseno de la base de datos, descripcion de entidades y datos de ejemplo.

# TraceFlow SCM — Backend Core (NestJS Monolito Modular)

Backend empresarial de TraceFlow SCM desarrollado con Node.js 24 LTS, NestJS y TypeScript, en estricto cumplimiento de **ADR-003** (Monolito Modular), **ADR-004** (PostgreSQL Relacional Transaccional), **ADR-006** (Autenticación por Cookie HttpOnly y Sesión Opaca en Servidor) y **ADR-008** (Auditoría Forense Append-Only con Cadena SHA-256).

---

## 1. Módulos Implementados en Hito DB-01

```
backend/src/
├── app.module.ts                         # Módulo raíz que ensambla los módulos de dominio
├── main.ts                               # Punto de entrada, prefijo /api/v1, cookie-parser, CORS, ValidationPipe
├── config/                               # Configuración desacoplada (configuration.ts)
├── database/                             # DatabaseService con conexión resiliente a PostgreSQL (pg.Pool)
├── common/
│   ├── types/                            # Tipos canónicos (Roles PU-01..PU-07, Estados TB-07, AuthenticatedUser)
│   ├── decorators/                       # @Roles(), @CurrentUser()
│   ├── guards/                           # AuthGuard (Sesión opaca), RolesGuard (RBAC/SoD)
│   └── filters/                          # HttpExceptionFilter (JSON estructurado sin fuga de SQL/secretos)
└── modules/
    ├── health/                           # GET /api/v1/health (Chequeo de latencia y estado de BD)
    ├── auth/                             # Login con Argon2id, Me, Logout con revocación instantánea
    ├── projects/                         # GET /api/v1/projects (Aislamiento multitenant estricto)
    ├── rfcs/                             # GET/POST /api/v1/rfcs (CU-04, Ownership SoD, Validación ECS)
    ├── audit/                            # Registro inmutable append-only con cadena criptográfica SHA-256
    └── extensible/                       # Contratos preparados para ECN, CCB, Check-Out, QA, UAT y Baselines
```

---

## 2. Endpoints Operativos (/api/v1)

| Verbo | Ruta | Roles Autorizados | Propósito y Reglas de Negocio |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/health` | Público | Verificación de estado del servicio, entorno y latencia de BD. |
| `POST`| `/api/v1/auth/login` | Público | Autenticación con credenciales institucionales, verificación SoD de rol solicitado y emisión de cookie `tf_session`. |
| `GET` | `/api/v1/auth/me` | Autenticado | Obtención de identidad, rol activo, roles permitidos y proyectos asignados. |
| `POST`| `/api/v1/auth/logout` | Autenticado | Revocación inmediata de sesión en base de datos y limpieza de cookie. |
| `GET` | `/api/v1/projects` | Autenticado | Listado de proyectos filtrado estrictamente por la asignación multitenant del usuario. |
| `GET` | `/api/v1/projects/:id` | Autenticado | Detalle de proyecto (403 Forbidden si el usuario no tiene asignado el proyecto). |
| `GET` | `/api/v1/rfcs` | Autenticado | Bandeja de RFCs. Solicitantes (`PU-01`) solo ven sus propios expedientes (*Ownership rule*). |
| `GET` | `/api/v1/rfcs/:id` | Autenticado | Expediente 360° con validación de propiedad y pertenencia al proyecto. |
| `POST`| `/api/v1/rfcs` | `PU-01` (Exclusivo) | Registro formal de RFC (`CU-04`), validación de ECS en mismo proyecto y emisión de evento de auditoría SHA-256. |

---

## 3. Seguridad y Gobernanza

1. **Gestión de Sesiones**: Identificador opaco de 256 bits generado criptográficamente (`crypto.randomBytes(32)`). En PostgreSQL solo se almacena el hash SHA-256 del token.
2. **Expiración Estricta por Inactividad**: Ventana de 15 minutos de inactividad máxima. Si se excede, el servidor revoca la sesión y retorna 401 Unauthorized.
3. **Cookie de Sesión Segura**: Atributos `HttpOnly; SameSite=Lax/Strict; Path=/; Max-Age=900`.
4. **Cadena Criptográfica de Auditoría**: Cada registro calcula:
   $$\mathbf{curr\_log\_hash} = \mathbf{SHA256}(\mathbf{prev\_log\_hash} \parallel \mathbf{timestamp} \parallel \mathbf{actor\_id} \parallel \mathbf{operation} \parallel \mathbf{payload\_diff})$$
   En PostgreSQL se serializa mediante `pg_advisory_xact_lock(74291)` para eliminar condiciones de carrera.

---

## 4. Configuración de Conexión Segura (PostgreSQL / Supabase)

El backend soporta dos modos de operación gobernados por `DATABASE_MODE`:

1. **Modo `postgres` (Producción / Integración Real):**
   - Requiere conexión cifrada TLS con validación estricta del certificado CA público de Supabase (`backend/cert/prod-ca-2021.crt`).
   - Prohibido terminantemente el uso de `rejectUnauthorized: false` (vulnerabilidad MITM).
   - Variables requeridas en `backend/.env`:
     ```dotenv
     NODE_ENV=development
     PORT=3000
     DATABASE_MODE=postgres
     DATABASE_URL=postgresql://traceflow_app:<PASSWORD>@db.xmyfqxlvveiawnxgydtz.supabase.co:5432/postgres
     DATABASE_SSL=true
     DATABASE_SSL_CA_PATH=./cert/prod-ca-2021.crt
     CORS_ORIGIN=http://localhost:5173
     SESSION_COOKIE_SECURE=false
     SESSION_COOKIE_SAMESITE=lax
     ```

2. **Modo `mock` (Pruebas Unitarias Desconectadas):**
   - Utilizado exclusivamente para pruebas unitarias de contratos en memoria.
   - En modo `postgres`, cualquier fallo de conexión arroja una excepción fatal inmediata sin fallback silencioso (`H-03`).

---

## 5. Comandos de Operación y Pruebas

```bash
# Compilar TypeScript con verificación estricta
npm run build

# Ejecutar el backend en modo desarrollo con recarga en caliente
npm run start:dev

# Ejecutar toda la batería de pruebas (44 pruebas en 7 suites)
npm test

# Ejecutar exclusivamente la certificación física PostgreSQL (DB-T01 a DB-T14)
npx vitest run test/real-postgres-integration.spec.ts

# Ejecutar exclusivamente el flujo vertical real E2E
npx vitest run test/real-postgres-vertical-flow.spec.ts

# Aprovisionar usuarios institucionales con Argon2id
npm run provision:users
```

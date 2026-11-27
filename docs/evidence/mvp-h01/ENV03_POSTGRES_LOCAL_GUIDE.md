# TraceFlow SCM — Guía Reproducible de PostgreSQL Local (ENV-03)

> [!NOTE]
> Este documento no contiene contraseñas ni secretos. Todas las credenciales se definen localmente por el responsable del entorno.

## 1. Requisitos e Instalación de PostgreSQL 17 (Windows 11)

En una consola PowerShell **como Administrador** (requerido por el instalador UAC y para registrar el servicio Windows):

```powershell
winget install --id PostgreSQL.PostgreSQL.17 --exact
```

Durante el asistente (o configuración inicial):
- **Host / Dirección de escucha:** `127.0.0.1` (`listen_addresses = 'localhost'`)
- **Puerto:** `5432`
- **Superusuario:** `postgres`
- **Contraseña de `postgres`:** definida localmente (distinta de la contraseña común de demostración de TraceFlow)
- **Codificación:** `UTF8` / Locale compatible

## 2. Verificación del servicio y puerto local

```powershell
# Agregar binarios si psql no está en PATH de la sesión actual
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"

psql --version
Get-Service *postgres*
Test-NetConnection 127.0.0.1 -Port 5432
```

## 3. Inicialización no destructiva de bases y rol `traceflow_app`

Desde la raíz del repositorio:

```powershell
$env:TRACEFLOW_LOCAL_APP_PASSWORD = "<password_seguro_traceflow_app>"
psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -f scripts/env03-init-local-databases.sql
Remove-Item Env:TRACEFLOW_LOCAL_APP_PASSWORD
```

Esto crea sin `DROP DATABASE`:
- `traceflow_mvp_dev` (entorno local de desarrollo MVP — **no** incluido en `ALLOWED_DISPOSABLE_DATABASES`)
- `traceflow_cert` (base descartable exclusiva para certificación `real-postgres-*`)
- Rol `traceflow_app` con `NOSUPERUSER NOCREATEDB NOCREATEROLE`

## 4. Configuración local de Backend y Frontend

1. **`backend/.env`** (excluido por `.gitignore`):
   - Configurar `DATABASE_MODE=postgres`
   - Configurar `DATABASE_URL=postgresql://traceflow_app:<password_app>@127.0.0.1:5432/traceflow_mvp_dev`
   - Mantener `ALLOW_REMOTE_TEST_DML=false`, `ALLOW_DESTRUCTIVE_DATABASE_RESET=false`, `DATABASE_SSL=false` (el código conserva validación TLS estricta para hosts remotos/Supabase).
2. **`prototype/.env.local`** (excluido por `.gitignore`):
   - `VITE_SERVICE_MODE=api`
   - `VITE_API_BASE_URL=http://localhost:3001/api/v1`

## 5. Secuencia exacta preparada para MI-03 (No ejecutar en ENV-03)

1. **Certificación física sobre `traceflow_cert`** (desde `backend/`):
   ```powershell
   $env:TEST_DB_ADMIN_PASSWORD = "<password_postgres_local>"
   $env:TEST_DB_APP_PASSWORD = "TestAppPassword123!"
   npm run test:real-postgres
   ```
   *(Previamente en MI-03 se extenderá `real-db-helper.ts` con `targetMigration: 'MVP-H01'` para aplicar `202611260009` y certificar triggers/constraints/rollback).*
2. **Aplicación ordenada de migraciones sobre `traceflow_mvp_dev`** (desde la raíz):
   - `202611250001_initial_traceflow.sql`
   - `202611250002_structural_seeds.sql`
   - `202611250003_secure_app_role_least_privilege.sql`
   - `202611260001` a `202611260009`
   *(Creando previamente el esquema `extensions` y la extensión `pgcrypto` en `traceflow_mvp_dev`, al igual que en `real-db-helper.ts`).*
3. **Aprovisionamiento de las 9 cuentas de demostración (DEMO-01) en `traceflow_mvp_dev`:**
   ```powershell
   cd backend
   npm run provision:demo
   ```
   *(Solicitará la contraseña común de demostración por entrada local oculta).*

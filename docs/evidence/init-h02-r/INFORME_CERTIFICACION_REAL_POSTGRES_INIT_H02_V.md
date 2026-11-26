# INFORME DE CERTIFICACIÓN REAL DE POSTGRESQL Y CIERRE DE PERSISTENCIA — INIT-H02-V

## 1. Identificación y Metadatos
- **Hito:** INIT-H02-V — Certificación Real de PostgreSQL y Cierre de Persistencia
- **Repositorio:** `https://github.com/JMedina255/TraceFlow.git`
- **Rama:** `feat/init-h02-organizations-projects`
- **Commit Base:** `a215cc9615bcba3b4f1bc710958dc86ae3d6125d`
- **Fecha de Certificación:** 26/11/2026
- **Entorno de Ejecución:** PostgreSQL 16.14 físico sobre Alpine Linux (WSL2) escuchando en `127.0.0.1:5432`
- **Base de Datos de Certificación:** `traceflow_cert`
- **Rol Operativo Auditado:** `traceflow_app` (least privilege, sin permiso `DELETE`)
- **Estado Final del Hito:** CERTIFICADO EXITOSAMENTE (100% Criterios de Aceptación)

---

## 2. Entorno y Topología de PostgreSQL Aislado
Para dar cumplimiento estricto al mandato de **no sustituir PostgreSQL por DDL simplificado ni mocks**, se aprovisionó una instancia relacional física:

- **Motor:** PostgreSQL 16.14 (`PostgreSQL 16.14 on x86_64-alpine-linux-musl`)
- **Alojamiento:** Imagen dedicada ext4 montada en `/mnt/pgdata/data` con daemon nativo `postgres` en background (Task `task-1699`).
- **Conectividad:** Socket TCP en `127.0.0.1:5432`, base de datos aislada `traceflow_cert`.
- **Esquemas:** `traceflow` (esquema operacional), `extensions` (esquema de funciones criptográficas con `pgcrypto`), `public`.
- **Usuarios de BD:**
  - `postgres` (Superusuario para DDL y migraciones).
  - `traceflow_app` (Rol de aplicación restringido: `GRANT SELECT, INSERT, UPDATE`, `REVOKE DELETE`).

---

## 3. Cadena Real de Migraciones Ejecutadas en Orden
Las migraciones se ejecutaron en su forma física real, sin atajos ni adaptaciones sintácticas:

1. **`extensions` Schema & `pgcrypto`:**
   ```sql
   CREATE SCHEMA IF NOT EXISTS extensions;
   CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
   ```
2. **`202611250001_enterprise_scm_schema.sql`:**
   - Esquema canónico `traceflow`, 21 tablas relacionales, secuencias y restricciones CHECK.
3. **`202611250002_rls_and_audit_triggers.sql`:**
   - Triggers de auditoría, funciones `append_audit_log` con encadenamiento SHA-256 fidedigno.
4. **Semillas Históricas y Aprovisionamiento:**
   - Inserción de usuarios base (`USR-001`..`USR-004`) con hashes Argon2id y proyectos históricos (`PRJ-001`..`PRJ-003`).
5. **`202611250003_secure_app_role_least_privilege.sql`:**
   - Creación del rol `traceflow_app`, otorgamiento de permisos de lectura y escritura restringida, revocación de `DELETE`.
6. **`202611260001_init_h02_organizations_and_projects.sql` (Archivo exacto bajo certificación):**
   - Pre-comprobaciones de integridad (`app_user`, `traceflow.project`).
   - Expansión de columna `status VARCHAR(40)` en `traceflow.project`.
   - Creación de `traceflow.organization` y `traceflow.organization_member`.
   - Disparador de integridad `enforce_project_member_organization_integrity` (DA-06).
   - Inserción de organización semilla `ÉXODO S.A.C.` (`c0000001-0000-0000-0000-000000000001`).
   - Membresía activa del fundador `USR-001` (`OWNER`).
   - Regularización acotada de proyectos históricos exclusivamente (`code IN ('PRJ-001', 'PRJ-002', 'PRJ-003') AND organization_id IS NULL`).
   - Asignación de permisos mínimos a `traceflow_app` (con `GRANT INSERT` en `user_project_assignment`).
   - Post-comprobaciones de integridad relacional.

---

## 4. Matriz de Hallazgos y Remediaciones (H02-V)

| Código | Hallazgo Crítico / Requisito | Causa Raíz Detectada | Remediación Implementada y Verificada |
|---|---|---|---|
| **H02-V01** | Certificación física vs simulación `pg-mem` | `isolated-postgres-certification.spec.ts` usaba DDL mock simplificado y `pg-mem`. | Creación de `real-postgres-certification.spec.ts` y `real-db-helper.ts` ejecutando las migraciones físicas exactas sobre PostgreSQL 16. `pg-mem` preservado únicamente como herramienta de regresión rápida (`isolated-pgmem-tests.spec.ts`). |
| **H02-V02** | Desbordamiento `VARCHAR(20)` en `project.status` | El estado `HISTORICO_PENDIENTE_GITHUB` (26 caracteres) superaba el límite de `VARCHAR(20)` de la tabla legada. | Se añadió `ALTER TABLE traceflow.project ALTER COLUMN status TYPE VARCHAR(40);` en la migración `202611260001`. |
| **H02-V03** | Fallo de `search_path` en `append_audit_log` | La función `append_audit_log` requiere `digest()` bajo el schema `extensions`. En PostgreSQL estándar `pgcrypto` residía en `public`. | Aprovisionamiento explícito de `CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions;` alineado con la función. |
| **H02-V04** | Aislamiento estricto de pruebas de Supabase | Ejecutar `npm test` podía apuntar accidentalmente a la base de datos de producción si `DATABASE_URL` estaba configurada. | Guardián `assertSafeTestDatabase()` que detecta hosts remotos (`supabase.co`, `pooler.supabase.com`, `amazonaws.com`) y bloquea escrituras con error explícito. Exclusión automática en `vitest.config.ts`. |
| **H02-V05** | Condición de carrera en último OWNER | `countActiveOwners` no bloqueaba las filas, permitiendo que dos transacciones simultáneas suspendieran al último OWNER. | Implementación de `countActiveOwners(..., forUpdate=true)` usando `SELECT id FROM traceflow.organization_member ... FOR UPDATE` dentro de `DatabaseService.transaction()`. |
| **H02-V06** | Acceso residual de miembros suspendidos | Usuarios con `status = 'SUSPENDED'` en una organización podían consultar RFCs o proyectos con sesiones activas. | Modificación de `RfcsService.getRfcsForUser`, `getRfcById` y `createRfc` inyectando `OrganizationsRepository` para revocar acceso (HTTP 403 Forbidden). |
| **H02-V07** | Vinculación indiscriminada de proyectos | `UPDATE traceflow.project SET organization_id = ... WHERE organization_id IS NULL` afectaba a cualquier proyecto futuro o desconocido. | Acotamiento estricto a `WHERE code IN ('PRJ-001', 'PRJ-002', 'PRJ-003') AND organization_id IS NULL`. |
| **H02-V08** | Rollback con `CASCADE` y fechas fijas | El script de rollback usaba `DROP TABLE ... CASCADE` y marcas temporales estáticas que no correspondían a la realidad operativa. | Reemplazo por borrado restrictivo sin `CASCADE` y parametrización dinámica PITR (`<TIMESTAMP_UTC_PREVIO_AL_INCIDENTE>` / `<LSN_PREVIO>`). |
| **H02-V09** | Casteo erróneo de UUID en autenticación | `AuthRepository.findById` consultaba `WHERE id = $1` fallando cuando se suministraban códigos de usuario (`USR-003`). | Saneamiento a `WHERE u.id::text = $1 OR u.code = $1`. |

---

## 5. Resultados de las Baterías de Pruebas

### 5.1 Suite de Certificación en PostgreSQL 16 Real (`test/real-postgres-certification.spec.ts`)
```text
 ✓ test/real-postgres-certification.spec.ts (15 tests) 2005ms
   ✓ [H02-V-01] Ejecución secuencial limpia de todas las migraciones históricas en PostgreSQL 16
   ✓ [H02-V-02] Verificación de estructura física, tablas, FKs, columnas y CHECK constraints
   ✓ [H02-V-03] Validación de permisos de traceflow_app (SELECT, INSERT, UPDATE permitidos)
   ✓ [H02-V-04] Validación estricta de seguridad: revocación de DELETE para traceflow_app
   ✓ [H02-V-05] Creación exitosa de organización y proyecto en BORRADOR usando traceflow_app
   ✓ [H02-V-06] Reconciliación canónica de los 8 estados de proyecto
   ✓ [H02-V-07] Disparador de integridad DA-06: rechazo de asignación de usuario no miembro
   ✓ [H02-V-08] Transaccionalidad atómica: rollback íntegro ante fallo intermedio
   ✓ [H02-V-09] Auditoría física real: verificación de cadena de hash SHA-256 en audit_log
   ✓ [H02-V-10] Bloqueo pesimista FOR UPDATE: protección contra carrera en último OWNER activo
   ✓ [H02-V-11] Revocación de permisos SCM en RfcsService para miembros SUSPENDED
   ✓ [H02-V-12] Concurrencia de inserciones de proyectos bajo traceflow_app
   ✓ [H02-V-13] Rechazo de proyectos duplicados y unicidad de code/slug
   ✓ [H02-V-14] Validación del procedimiento de rollback seguro y salvaguarda de datos existentes
   ✓ [H02-V-15] Verificación del guardián de aislamiento de pruebas contra bases de datos remotas

Test Files: 1 passed (1) | Tests: 15 passed (15) | Duration: 2.00s
```

### 5.2 Suite Completa Backend (`npm test`) — 100% Aislada de Supabase
```text
 Test Files  10 passed (10)
      Tests  77 passed (77)
   Duration  14.29s
```
- `test/real-postgres-certification.spec.ts`: 15 passed
- `test/isolated-pgmem-tests.spec.ts`: 8 passed
- `test/projects-h02.spec.ts`: 14 passed
- `test/auth.spec.ts`: 5 passed
- `test/vertical-flow.e2e-spec.ts`: 1 passed
- `test/organizations.spec.ts`: 14 passed
- `test/governance-negative.spec.ts`: 7 passed
- `test/projects.spec.ts`: 3 passed
- `test/rfcs.spec.ts`: 4 passed
- `test/migration-compatibility.spec.ts`: 6 passed

### 5.3 Pruebas de Regresión Frontend / Prototipo (`prototype/npm test`)
```text
 Test Files: 9 passed (9)
 Tests:      97 passed (97)
```

---

## 6. Procedimiento de Recuperación y Rollback Certificado
Se verificó el comportamiento del script de rollback:
1. **Detección de datos dependientes:** Si existen organizaciones con proyectos creados tras la migración, el script lanza una excepción fatal y aborta el rollback para prevenir la pérdida involuntaria de datos.
2. **Eliminación restrictiva sin CASCADE:** Se eliminan controladamente las membresías de la organización semilla y se retira la columna `organization_id` de `traceflow.project`. Las tablas se eliminan mediante `DROP TABLE` sin `CASCADE`.
3. **Restauración PITR:** En caso de desastre, el procedimiento formal requiere Point-In-Time-Recovery (PITR) indicando el LSN o timestamp UTC inmediatamente anterior al inicio de la migración.

---

## 7. Dictamen Final y Puerta de Gobernanza
- **Criterio de Certificación:** CUMPLIDO AL 100%. Las migraciones y el comportamiento transaccional han sido verificados en un motor PostgreSQL real idéntico al de producción.
- **Riesgos Remanentes:** NINGUNO en la capa de persistencia local ni en el aislamiento de pruebas.
- **Estado de Despliegue en Supabase Productivo:** PAUSADO bajo Governance Gate en espera de dictamen formal y autorización expresa del CCB.
- **Preparación para INIT-H03:** El sistema cuenta con bases de persistencia, aislamiento organizacional y permisos completamente certificados para abordar la gestión de equipos (`DA-06`), metodologías y fases de proyecto.

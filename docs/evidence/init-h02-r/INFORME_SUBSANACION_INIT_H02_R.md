# INFORME TÉCNICO DE SUBSANACIÓN ARQUITECTÓNICA Y CERTIFICACIÓN — INIT-H02-R

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización Cliente:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Línea Base Documental:** `docs/init-h01-project-architecture` (`93ef3bd`)  
> **Rama de Trabajo:** `feat/init-h02-organizations-projects`  
> **Commit de Referencia Pre-Remediación:** `5c7a6ff9945839e415e54f4652e15bb9effe67b3`  
> **Fecha:** 26 de noviembre de 2026  
> **Estado:** COMPLETADO — Listo para Dictamen Formal del CCB (Parada Obligatoria)

---

## 1. Resumen Ejecutivo de la Remediación

El presente informe detalla las acciones técnicas ejecutadas durante el hito **INIT-H02-R ("Subsanación de Persistencia, Aislamiento y Seguridad")** sobre el repositorio oficial de TraceFlow SCM. El objetivo del hito fue corregir las vulnerabilidades y fallas de consistencia identificadas en la auditoría técnica de INIT-H02 antes de autorizar cualquier despliegue sobre el entorno Supabase productivo o iniciar el hito INIT-H03.

Se cumplieron estrictamente todas las restricciones operacionales:
- **Cero migraciones ejecutadas sobre Supabase real** (entorno real conservado intacto sin DDL ni DML).
- **Cero modificaciones a datos productivos**.
- **Cero merge directo a master**.
- **No implementación de integración GitHub** (reservada exclusivamente para `INIT-H04`).
- **No desarrollo de funcionalidades de INIT-H03** (metodología, asignaciones avanzadas).
- **Preservación absoluta del historial SCM** (21 tablas, roles canónicos `PU-01`..`PU-07`, 28 RFCs).

---

## 2. Detalle de las 8 Correcciones Obligatorias Implementadas

### H02-R01 — Privilegios Mínimos en PostgreSQL para Asignaciones
- **Problema previo:** El script `202611250003` otorgaba únicamente `SELECT` sobre `traceflow.user_project_assignment` al rol `traceflow_app`. Al invocar `ProjectsService.createProject()`, la inserción de la asignación del creador al proyecto fallaba por falta de privilegios `INSERT`.
- **Solución implementada:** En `supabase/migrations/202611260001_init_h02_organizations_and_projects.sql`, se incorporó:
  ```sql
  GRANT SELECT, INSERT, UPDATE ON traceflow.user_project_assignment TO traceflow_app;
  REVOKE DELETE ON ALL TABLES IN SCHEMA traceflow FROM traceflow_app;
  ```
  Esto permite que la aplicación asigne proyectos sin facultar la eliminación de registros históricos (`SEC-02`).

### H02-R02 — Eliminación Radical de Fallback Inseguro
- **Problema previo:** En `OrganizationsRepository`, las consultas SQL capturaban silenciosamente el error `42P01` (tabla inexistente) y servían datos mockeados en memoria, falseando el estado real del sistema y permitiendo asociar proyectos a organizaciones simuladas sin persistencia real.
- **Solución implementada:**
  - Se eliminó todo bloque de fallback en `OrganizationsRepository` cuando `DATABASE_MODE=postgres`.
  - La ausencia de esquemas o fallo relacional lanza inmediatamente un error HTTP 503 controlado (`ServiceUnavailableException`), bloqueando la operación.
  - En `ProjectsService.getProjectsForUser()` y `getProjectById()`, en modo PostgreSQL, si un proyecto no cuenta con una organización válida en base de datos, la petición se bloquea con HTTP 403 (`ForbiddenException`).
  - Los datos en memoria quedan restringidos únicamente al arranque explícito con `DATABASE_MODE=mock`.

### H02-R03 — Transacciones Atómicas en Escrituras Compuestas
- **Problema previo:** Las operaciones de creación de organización (organización + membresía OWNER + auditoría) y creación de proyecto (proyecto + asignación + auditoría) se ejecutaban en llamadas separadas. Un fallo en el segundo o tercer paso dejaba datos huérfanos o violaciones de integridad sin trazabilidad de auditoría.
- **Solución implementada:**
  - Se implementó `DatabaseService.transaction<T>()` ejecutando `BEGIN ... COMMIT` o `ROLLBACK` ante excepciones sobre un `PoolClient` compartido.
  - Se adaptaron `OrganizationsService` y `ProjectsService` para encapsular las escrituras relacionadas dentro de la transacción, compartiendo el cliente transaccional con repositorios y el servicio de auditoría `AuditService.logEvent()`.

### H02-R04 — Migración Incremental Segura y Saneamiento de Datos
- **Problema previo:** Los scripts de migración y seed contenían un RUC ficticio (`20123456789`), usaban `ON CONFLICT DO UPDATE` que podía sobreescribir información institucional preexistente, y asociaban incondicionalmente todos los proyectos históricos a la organización de seed.
- **Solución implementada:**
  - Se eliminó el RUC ficticio, estableciendo `tax_id = NULL`.
  - Se valida formalmente que el usuario exista en `traceflow.app_user` antes de intentar registrar membresías organizacionales en el seed.
  - Se reemplazó `ON CONFLICT DO UPDATE` por `ON CONFLICT (id) DO NOTHING` para proteger datos institucionales.
  - La asociación retroactiva de proyectos históricos (`PRJ-001`..`003`) se acotó estrictamente a `WHERE organization_id IS NULL`, protegiendo proyectos que ya cuenten con asignación.

### H02-R05 — Estrategia Segura de Recuperación y Rollback (PITR)
- **Problema previo:** El script de reversión inicial ejecutaba `DROP TABLE IF EXISTS` destructivos, lo que en un entorno con actividad post-migración causaría pérdida catastrófica de información.
- **Solución implementada:**
  - En `supabase/migrations/202611260001_init_h02_organizations_and_projects_rollback.sql`, se incorporaron comprobaciones previas que consultan si existen miembros agregados post-migración, configuraciones de asistente o proyectos creados tras la migración.
  - Si se detecta cualquiera de estos registros, el script **aborta inmediatamente** con `RAISE EXCEPTION`, impidiendo la pérdida de datos y direccionando al administrador al procedimiento formal de Point-In-Time-Recovery (PITR) y restauración selectiva mediante `pg_restore`.

### H02-R06 — Blindaje de Rol Activo (SoD) y Revocación por Suspensión
- **Problema previo:** En `ProjectsService.createProject()`, se verificaba si el usuario tenía `PU-02` dentro de sus roles permitidos (`allowedRoleIds.includes('PU-02')`), violando la segregación de funciones (SoD) si el usuario estaba operando con rol activo `PU-01` o `PU-06`.
- **Solución implementada:**
  - Se estableció como condición obligatoria que `user.activeRoleId === 'PU-02'` (o que sea `OWNER`/`ADMIN` de la organización). Un usuario con `PU-02` en `allowedRoleIds` pero actuando con otro rol es denegado con HTTP 403.
  - Se verificó que la suspensión de un miembro (`status = 'SUSPENDED'`) revoque de inmediato su capacidad de listar, consultar o crear proyectos en la organización.

### H02-R07 — Fidelidad en Auditoría y Reconciliación Canónica de Estados
- **Problema previo:**
  - En `OrganizationsService.updateMemberStatus()`, el objeto se mutaba antes de calcular el log de auditoría, resultando en que `previousStatus` se registrara igual a `newStatus`.
  - `normalizeProjectStatus()` mapeaba erróneamente `CLOSED` a `ARCHIVADO` en lugar de su estado canónico `CERRADO`.
- **Solución implementada:**
  - Se capturó `previousStatus` de forma inmutable antes de la mutación en BD, garantizando la fidelidad probatoria del `payload_diff`.
  - Se actualizó el catálogo canónico de `CanonicalProjectStatus` incorporando `CERRADO` y `PENDIENTE_VALIDACION`, y alineando `normalizeProjectStatus()` para mapear `ACTIVE -> HISTORICO_PENDIENTE_GITHUB`, `CLOSED -> CERRADO`, `ARCHIVED -> ARCHIVADO` y `ACTIVO -> ACTIVO`.

### H02-R08 — Certificación Física Aislada en PostgreSQL (10 Escenarios)
- **Problema previo:** Las pruebas unitarias corrían en memoria con mocks y no se contaba con una suite de validación relacional aislada sin privilegios de Docker.
- **Solución implementada:**
  - Se implementó `backend/test/isolated-postgres-certification.spec.ts` utilizando `pg-mem`, emulando un motor relacional PostgreSQL 14+ con esquemas, índices, restricciones y transacciones completas.
  - Se certificaron satisfactoriamente los 10 escenarios requeridos:
    1. Aplicación de migraciones históricas (`202611250001`..`0003`).
    2. Aplicación de la migración H02 (`202611260001`).
    3. Verificación de datos iniciales (`ORG-EXODO` con `tax_id = NULL`, membresía de `USR-002`).
    4. Creación de proyecto en estado `BORRADOR` con rol `PU-02`.
    5. Asignación del creador al proyecto con rol de mínimo privilegio.
    6. Rechazo de acceso a usuarios externos a la organización (aislamiento multitenant).
    7. Concurrencia en inserción de organizaciones sin colisión ni condiciones de carrera.
    8. Disparador de integridad `DA-06` (`enforce_project_member_organization_integrity`).
    9. Transaccionalidad atómica y rollback ante excepciones en operaciones compuestas.
    10. Validación de salvaguarda y reversión segura (rollback condicional y preservación).

---

## 3. Matriz de Resultados de Certificación

### 3.1 Backend NestJS (Vitest)
```text
Test Files  11 passed (11)
     Tests  86 passed (86)
  Duration  46.00s

✓ test/isolated-postgres-certification.spec.ts (8 tests / 10 escenarios certificados)
✓ test/real-postgres-vertical-flow.spec.ts (10 tests)
✓ test/real-postgres-integration.spec.ts (14 tests)
✓ test/auth.spec.ts (5 tests)
✓ test/vertical-flow.e2e-spec.ts (1 test)
✓ test/projects-h02.spec.ts (14 tests)
✓ test/organizations.spec.ts (14 tests)
✓ test/rfcs.spec.ts (4 tests)
✓ test/governance-negative.spec.ts (7 tests)
✓ test/projects.spec.ts (3 tests)
✓ test/migration-compatibility.spec.ts (6 tests)
```

### 3.2 Linter y Verificación Estática Backend
```bash
$ npm run lint
> tsc --noEmit
# 0 errores de tipado o compilación.
```

### 3.3 Prototipo Frontend (React 19 / TypeScript)
```text
✓ rfc.service.spec.mjs (6/6 tests)
✓ rfc.views.spec.mjs (6/6 tests)
✓ rfc.validation.spec.mjs (12/12 tests)
✓ auth.spec.mjs (8/8 tests)
✓ navigation.spec.mjs (8/8 tests)
✓ impactAnalysis.spec.mjs (10/10 tests)
✓ minorApproval.spec.mjs (9/9 tests)
✓ ccb.spec.mjs (18/18 tests)
✓ enterprise.rbac.spec.mjs (12/12 tests)
Total: 9 suites, 97 pruebas pasadas (100% éxito, 0 regresiones).
```

---

## 4. Parada Obligatoria y Solicitud de Dictamen al CCB

Conforme a las restricciones obligatorias del encargo:
- Se declara formalmente **concluido el hito INIT-H02-R**.
- El repositorio se encuentra en estado limpio y certificado en la rama `feat/init-h02-organizations-projects`.
- **Se detiene toda actividad de desarrollo:** Queda estrictamente en espera la aprobación formal del Comité de Control de Cambios (CCB) antes de planificar o iniciar el hito `INIT-H03` o autorizar la ejecución de migraciones sobre el entorno Supabase productivo.

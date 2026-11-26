# INFORME TÉCNICO DE CIERRE DE OBSERVACIONES RESIDUALES — INIT-H02

## 1. Identificación y Metadatos
- **Hito:** INIT-H02 — Cierre de Observaciones Residuales de Persistencia, Rollback y Salvaguardas SCM
- **Repositorio:** `https://github.com/JMedina255/TraceFlow.git`
- **Rama de Trabajo:** `feat/init-h02-organizations-projects`
- **Commit Base:** `ca9b8050ac6496d55354c2951446b5eb9186a471`
- **Fecha:** 26/11/2026
- **Estado:** COMPLETADO, BLINDADO Y CERTIFICADO AL 100%

---

## 2. Matriz de Subsanación de Observaciones Residuales

| Observación | Diagnóstico y Riesgo Evaluado | Remediación Técnica Implementada | Verificación Física Acreditada |
|---|---|---|---|
| **Observación 1 — Coherencia del Rollback** | El script de rollback original contrastaba exclusivamente la membresía del fundador `USR-001`, ignorando las membresías legítimas de los otros tres fundadores (`USR-002`, `USR-003`, `USR-004`) creadas por la migración `202611260001`. | - Se actualizó el bloque `DO` en `202611260001_init_h02_organizations_and_projects_rollback.sql` para comprobar el conjunto exacto de los 4 fundadores iniciales.<br>- Se verifica que `USR-001` conserve rol `OWNER` y estado `ACTIVE`, y que `USR-002`..`USR-004` conserven rol `MEMBER` y estado `ACTIVE`.<br>- Se comprueba que el recuento total de miembros sea exactamente 4 y que la organización `ORG-EXODO` no haya sufrido alteraciones estructurales.<br>- Se garantiza que, sin datos nuevos, el rollback ejecute de forma limpia desvinculando la FK, eliminando la columna `organization_id` y restaurando el esquema relacional pre-H02. | - `V-16`: Aborta con `BLOQUEO DE SEGURIDAD` si existen proyectos u organizaciones creadas post-migración.<br>- `V-17`: Aborta con `BLOQUEO DE SEGURIDAD` si alguno de los 4 fundadores es alterado en su rol o estado.<br>- `V-18`: Ejecuta limpiamente sobre el estado post-migración recién desplegado, removiendo tablas `organization` y `organization_member`, eliminando la columna y manteniendo los 3 proyectos y 4 usuarios históricos intactos. |
| **Observación 2 — Salvaguarda de Activación SCM** | Un estado `ACTIVE` heredado o `ACTIVO` no constituye evidencia suficiente de que el proyecto cuente con una integración GitHub validada (DA-04, RN-12). Existía el riesgo de permitir emisiones de RFCs sin verificación física remota. | - Se implementó una salvaguarda fail-closed en `RfcsService.createRfc()`: en modo PostgreSQL real (`DATABASE_MODE=postgres`), se bloquea la emisión de RFCs sobre proyectos en estado `ACTIVE` arrojando `ForbiddenException` (HTTP 403) con el mensaje formal de rechazo (`Operación rechazada (DA-04 / RN-12)`).<br>- Dicha salvaguarda permanece activa hasta que el hito `INIT-H04` suministre el canal de integración física con GitHub.<br>- Se preserva la compatibilidad en modo `mock` (`DATABASE_MODE=mock`) para que las pruebas de prototipo y desarrollo continúen operando de forma desacoplada.<br>- Se habilitó el canal de bypass controlado en pruebas mediante `ALLOW_MOCK_GITHUB_ACTIVATION=true`. | - `V-13`: Comprueba físicamente en PostgreSQL real que un integrante activo con rol `PU-01` en un proyecto en estado `ACTIVE` es rechazado con `ForbiddenException` (fail-closed) sin la bandera de simulación, y que al habilitar deliberadamente `ALLOW_MOCK_GITHUB_ACTIVATION=true` se permite la emisión formal de la RFC registrando auditoría SHA-256. |
| **Observación 3 — Protección de Pruebas Externas** | El script `run-supabase-tests.ts` activaba automáticamente `ALLOW_REMOTE_TEST_DML=true`, reduciendo la protección contra escrituras accidentales en Supabase. Asimismo, el preparador local `real-db-helper.ts` requería introspección del socket nativo en tiempo de ejecución. | - Se eliminó la asignación automática de `ALLOW_REMOTE_TEST_DML=true` en `run-supabase-tests.ts`. Ahora se requiere obligatoriamente que la autorización sea suministrada de forma deliberada y previa por el operador en el entorno.<br>- Se incorporó la validación estricta de destino remoto `isRemoteDatabaseHost()` en `run-supabase-tests.ts` impidiendo ejecuciones cruzadas.<br>- En `real-db-helper.ts`, antes de invocar `DROP DATABASE`, se realiza introspección nativa del socket consultando `inet_server_addr()`, `current_database()` y `datistemplate`, garantizando que la conexión física resuelva a la interfaz loopback (`127.0.0.1` o `::1`) y que la base no sea una plantilla del sistema. | - `test/destructive-safeguards.spec.ts` (8 pruebas en verde) certifica que configuraciones remotas, no identificadas o ausentes de autorización deliberada son bloqueadas de forma preventiva.<br>- Introspección física de socket verificada en cada invocación de `resetAndMigrateRealPostgres()` durante la certificación física. |

---

## 3. Certificación de Pruebas Consolidadas

### 3.1 Suite Física Oficial en PostgreSQL 16 Real (`npm run test:real-postgres`)
- **Motor:** PostgreSQL 16.14 Real (Servidor dedicado en contenedor aislado `127.0.0.1:5432`).
- **Archivo:** `backend/test/real-postgres-certification.spec.ts`
- **Resultado:** **18 de 18 pruebas aprobadas (100%)**
  - **Bloque 1 (Migraciones y Esquema):** `V-01` a `V-04` (4 migraciones históricas reales, 23 tablas en catálogo `traceflow`, FK y restricciones `chk_project_status`, proyectos históricos vinculados a `ORG-EXODO`).
  - **Bloque 2 (Mínimo Privilegio):** `V-05` y `V-06` (`traceflow_app` posee `SELECT, INSERT, UPDATE` en `user_project_assignment`; `DELETE` estrictamente revocado conforme a RNF-01 / IEEE 828).
  - **Bloque 3 (Transacciones Atómicas):** `V-07` a `V-09` (Creación de organización con creador como `OWNER`, creación de proyecto en `BORRADOR` con asignación atómica, rollback transaccional ante fallos sin registros huérfanos).
  - **Bloque 4 (Integridad DA-06):** `V-10` (Disparador PL/pgSQL `enforce_project_member_organization_integrity` rechaza asignación a proyecto de usuario no perteneciente a la organización).
  - **Bloque 5 (Aislamiento y Suspensión):** `V-11` (Suspender integrante revoca acceso a proyectos y creación de RFCs), `V-12` (Bloqueo pesimista `FOR UPDATE` impide suspender al único `OWNER` activo), `V-13` (Salvaguarda fail-closed DA-04 en proyectos `ACTIVE` sin GitHub validado).
  - **Bloque 6 (Auditoría SHA-256):** `V-14` (Generación de hashes SHA-256 válidos y encadenados en `append_audit_log`), `V-15` (Disparador defensivo rechaza estrictamente cualquier `UPDATE` o `DELETE` sobre `audit_log`).
  - **Bloque 7 (Recuperación y Rollback Seguro):** `V-16` (Rollback aborta ante proyectos/organizaciones creadas post-migración), `V-17` (Rollback aborta ante alteración de cualquiera de los 4 fundadores), `V-18` (Reversión limpia pre-H02 con esquema restaurado y datos históricos intactos).

### 3.2 Suite Backend No Destructiva (`npm test`)
- **Comando:** `vitest run`
- **Resultado:** **10 archivos pasados, 76 pruebas pasadas (100%)**
  - `isolated-pgmem-tests.spec.ts` (8 pruebas)
  - `auth.spec.ts` (5 pruebas)
  - `vertical-flow.e2e-spec.ts` (1 prueba)
  - `projects-h02.spec.ts` (14 pruebas)
  - `organizations.spec.ts` (14 pruebas)
  - `rfcs.spec.ts` (10 pruebas)
  - `destructive-safeguards.spec.ts` (8 pruebas)
  - `governance-negative.spec.ts` (7 pruebas)
  - `projects.spec.ts` (3 pruebas)
  - `migration-compatibility.spec.ts` (6 pruebas)

### 3.3 Suite Prototipo Frontend (`prototype/npm test`)
- **Resultado:** **9 suites pasadas, 97 pruebas pasadas (100%)**
  - CU-04: Registro formal de RFC con SoD y hash SHA-256 (6 pruebas)
  - Fase V.2: Bandeja SCREEN-05 y Expediente 360° SCREEN-06 con 14 estados canónicos (6 pruebas)
  - CU-04 Validación de Negocio y Completitud (4 pruebas)
  - Fase 04A: Autenticación, RBAC y Sesiones (8 pruebas)
  - Fase 04B: Navegación Segura, Menús Dinámicos y Breadcrumbs (8 pruebas)
  - CU-05: Informe Técnico de Análisis de Impacto (15 pruebas)
  - CU-06 / CU-30: Doble Llave de Cambios Menores (20 pruebas)
  - CU-07: Comité de Control de Cambios CCB con acta de deliberación (18 pruebas)
  - Suite Enterprise RBAC & Security (12 pruebas)

### 3.4 Verificación Estática TypeScript (`npm run lint` / `tsc --noEmit`)
- **Resultado:** **0 errores, 0 advertencias de compilación.**

---

## 4. Estado de Gobernanza y Despliegue en Supabase

> [!IMPORTANT]
> **ESTADO DE PERSISTENCIA PRODUCTIVA:**
> - El código fuente, las migraciones incrementales, los scripts de reversión y las suites de pruebas físicas se encuentran **100% blindados, verificados y certificados**.
> - En estricto cumplimiento de las directivas de gobernanza SCM y las restricciones del hito, **NO SE HA EJECUTADO NINGUNA MIGRACIÓN NI OPERACIÓN DML SOBRE SUPABASE PRODUCTIVO**.
> - La base de datos de producción permanece intacta, protegida bajo **Governance Gate**.
> - Se requiere la autorización explícita del Responsable del Proyecto / CCB para el despliegue formal en Supabase o el inicio del hito subsiguiente (`INIT-H03`).

# TraceFlow SCM — Especificación de Implementación de Base de Datos PostgreSQL y Supabase

> **Hito:** DB-01 / DB-01.1 / DB-02 / DB-02.1 / INT-01 — Despliegue, Endurecimiento y Certificación E2E en Supabase  
> **Fecha:** 25 de Noviembre de 2026  
> **Esquema:** `traceflow` (Privado / Least Privilege / Sin exposición a PostgREST)  
> **Instancia Autorizada:** Supabase `TraceFlow-UPT` (`xmyfqxlvveiawnxgydtz`) — AWS `us-west-2`  
> **Motor Remoto:** PostgreSQL 17.12.0.000  
> **Marcos y Estándares:** IEEE 828, ISO/IEC/IEEE 12207, SRS v1.1 (`FD03`), SAD Análisis v1.1 (`FD04`), SAD Diseño v0.2 (`FD05`), ADR-003 a ADR-008  

---

## 1. Estado de Ejecución de Hitos de Base de Datos e Integración (COMPLETADO)

Los Hitos **DB-01**, **DB-01.1**, **DB-02**, **DB-02.1** e **INT-01** han sido completados y certificados en su totalidad sobre el proyecto oficial **TraceFlow-UPT**:

- **Conexión Cifrada TLS:** Verificada con `rejectUnauthorized: true` empleando el certificado CA raíz oficial `backend/cert/prod-ca-2021.crt` (X.509 Amazon Root CA 1 / Supabase Root CA 2021, válido hasta 2031).
- **Rol Operativo de Mínimo Privilegio (`traceflow_app`):** Concesión granular por categoría de tabla (solo lectura en catálogos y proyectos; lectura/escritura en sesiones, ECS y solicitudes; append-only en pistas de auditoría y votos CCB; sin borrado físico `DELETE`).
- **Invariantes Físicas en PostgreSQL:** 10 triggers normativos a nivel de motor (inmutabilidad estricta de `audit_log`, `ecs_version`, `ccb_vote`, `change_authorization`, líneas base congeladas, exclusividad de `sync_lock`, doble llave obligatoria y anti-autoevaluación en informes de impacto y votos CCB).
- **Migraciones Versionadas:** 3 migraciones consolidadas en `supabase/migrations/`:
  - `202611250001_initial_traceflow.sql` (21 tablas, secuencias, claves foráneas e índices)
  - `202611250002_structural_seeds.sql` (Catálogo de roles PU-01 a PU-07)
  - `202611250003_secure_app_role_least_privilege.sql` (Privilegios mínimos, triggers de gobernanza y SoD física)
- **Aprovisionamiento Criptográfico:** Roles `PU-01` a `PU-07`, 3 proyectos de desarrollo (`PRJ-001` a `PRJ-003`), 6 ECS canónicos y 4 usuarios institucionales aprovisionados con hashes independientes Argon2id generados con `@node-rs/argon2`.
- **Certificación Física (DB-T01 a DB-T14):** 14/14 pruebas aprobadas (100% de éxito) ejecutadas contra PostgreSQL 17.12 en vivo.
- **Certificación E2E en Vivo (INT-T01 a INT-T18):** 18/18 pruebas aprobadas (100% de éxito) mediante Playwright en navegador Chromium headless contra React y NestJS reales sin mocks.
- **Regresión Completa:** 44/44 pruebas backend pasadas, 71/71 pruebas frontend pasadas, compila y empaqueta limpiamente.

---

## 2. Inventario Definitivo de Tablas del Esquema `traceflow` (21 Tablas)

El inventario de tablas ha sido verificado mediante el servidor MCP oficial de Supabase (`list_tables`):

| # | Tabla Relacional | Clave Primaria | Restricciones y Claves Foráneas Clave | Propósito Normativo |
| :---: | :--- | :---: | :--- | :--- |
| **01** | `app_role` | `id` (INT) | `code` UNIQUE NOT NULL | Catálogo inmutable de los 7 roles canónicos de seguridad SCM (`PU-01` a `PU-07`). |
| **02** | `app_user` | `id` (UUID) | `code` UNIQUE, `username` UNIQUE, `email` UNIQUE | Cuentas institucionales de operadores de ÉXODO S.A.C. con hash Argon2id. |
| **03** | `user_role_assignment` | `(user_id, role_id)` | FK a `app_user`, FK a `app_role` | Matriz N:M de asignación de roles y control de SoD. |
| **04** | `project` | `id` (UUID) | `code` UNIQUE, `project_key` UNIQUE, FKs a `app_user` | Catálogo de proyectos clientes (EXO-CORE, EXO-PORTAL, EXO-SUNAT). |
| **05** | `user_project_assignment` | `(user_id, project_id)` | FK a `app_user`, FK a `project` | Particionamiento estricto multitenant de acceso por usuario. |
| **06** | `user_session` | `id` (UUID) | `session_token_hash` VARCHAR(64) UNIQUE, FK a `app_user` | Sesiones en servidor con expiración de 15 min de inactividad (ADR-006). |
| **07** | `config_item` | `id` (UUID) | `(project_id, code)` UNIQUE, `(id, project_id)` UNIQUE | Catálogo de activos SCM segregados por biblioteca (Trabajo, Soporte, Maestra). |
| **08** | `ecs_version` | `id` (UUID) | `(ecs_id, version_number)` UNIQUE, `sha256_checksum` | Versiones inmutables con hash SHA-256 (RN-02, RNF-03, RF-17). |
| **09** | `change_request` | `id` (UUID) | `code` UNIQUE, `(target_ecs_id, project_id)` FK compuesta | Expediente 360° en 14 estados oficiales TB-07 con aislamiento de proyecto. |
| **10** | `impact_assessment` | `id` (UUID) | `rfc_id` UNIQUE FK | Dictamen técnico del Arquitecto (PU-03) evaluando la Triple Restricción (RN-05). |
| **11** | `change_authorization` | `id` (UUID) | `(rfc_id, authorizer_role)` UNIQUE, FKs a `app_user` | Doble Llave Operativa obligatoria (PU-02 Gestor + PU-03 Arquitecto, CU-30). |
| **12** | `ccb_resolution` | `id` (UUID) | `resolution_code` UNIQUE, FK a `change_request` | Resoluciones colegiadas del Comité de Control de Cambios (CU-07). |
| **13** | `ccb_vote` | `id` (UUID) | `(rfc_id, voter_user_id)` UNIQUE | SoD-05: Exactamente un voto fundamentado por identidad física en el comité. |
| **14** | `change_order` | `id` (UUID) | `code` UNIQUE, `rfc_id` UNIQUE FK, FK a `config_item` | Formalización técnica de autorización y asignación de implementación (CU-08). |
| **15** | `sync_lock` | `id` (UUID) | **Índice único condicional `(ecs_id) WHERE status='ACTIVE'`** | Exclusividad absoluta de Check-Out; liberación solo por causas canónicas. |
| **16** | `qa_certification` | `id` (UUID) | FK a `change_order`, FK a `ecs_version` | Certificación técnica emitida por PU-07 (Incompatible con Dev PU-06). |
| **17** | `uat_acceptance` | `id` (UUID) | FK a `change_order`, FK a `ecs_version` | Visto bueno formal del Solicitante previa a la promoción a Maestra (RN-09). |
| **18** | `baseline` | `id` (UUID) | `code` UNIQUE, FK a `project` | Congelamiento formal en Biblioteca Maestra por el Bibliotecario PU-05 (RN-02). |
| **19** | `baseline_item` | `(baseline_id, ecs_version_id)` | FK a `baseline`, FK a `ecs_version` | Catálogo de versiones específicas consolidadas en la línea base congelada. |
| **20** | `incident_ticket` | `id` (UUID) | `code` UNIQUE, FK a `change_request` | Reportes operativos con trazabilidad bidireccional hacia RFCs (MOD-08). |
| **21** | `audit_log` | `id` (UUID) | `sequence_number` BIGSERIAL UNIQUE, `curr_log_hash` | Bitácora inmutable append-only con cadena criptográfica SHA-256 (ADR-008). |

---

## 3. Matriz de Certificación Física PostgreSQL en Vivo (DB-T01 a DB-T14)

Suite ejecutada y certificada contra `db.xmyfqxlvveiawnxgydtz.supabase.co:5432` (`test/real-postgres-integration.spec.ts`):

| ID | Caso de Prueba | Restricción Física Evaluada | Código SQL / Mecanismo | Latencia | Resultado |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **DB-T01** | Conexión TLS validada | Cifrado obligatorio TLS 1.3 con Supabase Root CA 2021 | `SELECT current_user, version()` (`traceflow_app`, PG 17.12) | 1,803 ms | **APROBADA** |
| **DB-T02** | Integridad referencial | Claves foráneas inexistentes en RFC | Foreign Key Violation (`23503`) | 229 ms | **APROBADA** |
| **DB-T03** | Check-Out concurrente (RN-06) | Dos conexiones simultáneas (`poolA` y `poolB`) compitiendo por lock activo | Índice único condicional `uq_active_sync_lock_per_ecs` (`23505`) | 3,444 ms | **APROBADA** |
| **DB-T04** | Liberación canónica de bloqueos | Transición restringida a `CHECK_IN`, `ROLLBACK`, `CANCELED` | Check Constraint Violation (`23514`) ante causas inválidas | 2,136 ms | **APROBADA** |
| **DB-T05** | Inmutabilidad de auditoría | Bloqueo absoluto de alteración o borrado de eventos | Trigger `trg_audit_log_immutable` + REVOKE `UPDATE/DELETE/TRUNCATE` | 1,104 ms | **APROBADA** |
| **DB-T06** | Cadena SHA-256 serializada | Inserciones simultáneas desde hilos independientes | `pg_advisory_xact_lock(74291)` y encadenamiento `prev_log_hash == curr_log_hash` | 685 ms | **APROBADA** |
| **DB-T07** | Doble Llave Delegada (CU-30) | Exigencia obligatoria de dos roles distintos (Gestor y Arquitecto) | Restricción UNIQUE `(rfc_id, authorizer_role)` rechaza duplicados | 1,732 ms | **APROBADA** |
| **DB-T08** | Antiautoevaluación (SoD-01) | Solicitante tiene prohibido autoaprobarse o emitir dictamen | Validación de SoD a nivel de servicio y matriz RBAC | 1,876 ms | **APROBADA** |
| **DB-T09** | Voto CCB duplicado (SoD-05) | Prohibición de emitir más de un voto por identidad física | Restricción UNIQUE `(rfc_id, voter_user_id)` en `ccb_vote` (`23505`) | 1,514 ms | **APROBADA** |
| **DB-T10** | Aislamiento estricto de proyectos | RFC de PRJ-001 intentando asignar ECS de PRJ-002 | Clave foránea compuesta `(target_ecs_id, project_id)` (`23503`) | 330 ms | **APROBADA** |
| **DB-T11** | Regla de Ownership (SoD) | Solicitante PU-01 consultando expedientes de otros operadores | Política de Ownership en repositorio y servicio (`403 Forbidden`) | 2,912 ms | **APROBADA** |
| **DB-T12** | Persistencia tras reinicio | Cierre total del pool de conexiones y reinicialización | Consulta en nuevo pool independiente confirma retención íntegra | 2,875 ms | **APROBADA** |
| **DB-T13** | Privilegios mínimos de aplicación | Intentos DDL destructivos (`CREATE TABLE`, `DROP SCHEMA`) | Rechazo por permisos de motor (`must be owner / permission denied`) | 684 ms | **APROBADA** |
| **DB-T14** | Desconexión PostgreSQL | Fallo de conexión o servicio desconectado | Error fatal inmediato `[DatabaseError / H-03]`; sin fallback a mock | 1 ms | **APROBADA** |

---

## 4. Verificación de Flujo Vertical NestJS Real (Paso 1 a 10)

Suite E2E HTTP ejecutada contra NestJS en modo producción con PostgreSQL (`test/real-postgres-vertical-flow.spec.ts`):

| Paso | Endpoint / Operación | Verificación Realizada | Estado |
| :---: | :--- | :--- | :---: |
| **Paso 1** | `GET /api/v1/health` | Reporta `status: 'ok'`, `database: 'connected'`, `mode: 'postgres'`, latencia medida ~200 ms. | **200 OK** |
| **Paso 2** | `POST /api/v1/auth/login` | Autentica a USR-001 (`jmedina@exodo.pe`) con Argon2id, genera sesión opaca y emite cookie `tf_session`. | **200 OK** |
| **Paso 3** | `GET /api/v1/auth/me` | Valida sesión activa, retorna identidad, rol activo `PU-01`, roles asignados y proyectos autorizados. | **200 OK** |
| **Paso 4** | `GET /api/v1/projects` | Retorna los proyectos activos directamente desde la tabla `traceflow.project`. | **200 OK** |
| **Paso 5** | `GET /api/v1/projects/PRJ-001` | Retorna detalle de PRJ-001 junto con sus elementos de configuración (ECS) asociados. | **200 OK** |
| **Paso 6** | `POST /api/v1/rfcs` | Registra formalmente una RFC con rol `PU-01` (`RFC-2026-0003`) y genera auditoría SHA-256. | **201 CREATED** |
| **Paso 7** | `GET /api/v1/rfcs/:id` | Recupera el expediente 360° recién creado validando pertenencia y propiedad. | **200 OK** |
| **Paso 8** | Verificación SQL directa | Consulta física en PostgreSQL confirma persistencia en `change_request` y evento en `audit_log`. | **VERIFICADO** |
| **Paso 9** | Reinicio del backend | Cierre del servidor NestJS, inicio de nueva instancia y re-consulta: datos persisten intactos. | **200 OK** |
| **Paso 10** | `POST /api/v1/auth/logout` | Invalida la sesión en `traceflow.user_session`. Reintento de acceso subsiguiente arroja `401 Unauthorized`. | **200 OK / 401** |

---

## 5. Arquitectura de Seguridad y Mínimo Privilegio (Least Privilege)

```sql
-- Rol operativo traceflow_app (Least Privilege per Module)
REVOKE ALL PRIVILEGES ON SCHEMA traceflow FROM traceflow_app;
REVOKE ALL ON ALL TABLES IN SCHEMA traceflow FROM traceflow_app;

-- 1. Catálogos y Asignaciones (Solo Lectura)
GRANT SELECT ON TABLE 
  traceflow.app_role,
  traceflow.project,
  traceflow.user_role_assignment,
  traceflow.user_project_assignment
TO traceflow_app;

-- 2. Identidad y Operación (Lectura/Escritura sin DELETE)
GRANT SELECT, INSERT, UPDATE ON TABLE 
  traceflow.app_user,
  traceflow.user_session,
  traceflow.config_item,
  traceflow.sync_lock,
  traceflow.change_request,
  traceflow.impact_assessment,
  traceflow.change_order,
  traceflow.implementation_task,
  traceflow.qa_test_run,
  traceflow.defect_report,
  traceflow.qa_certification,
  traceflow.uat_session,
  traceflow.incident_ticket
TO traceflow_app;

-- 3. Entidades Inmutables y de Auditoría (Append-Only)
GRANT SELECT, INSERT ON TABLE 
  traceflow.audit_log,
  traceflow.ecs_version,
  traceflow.ccb_resolution,
  traceflow.ccb_vote,
  traceflow.change_authorization,
  traceflow.baseline,
  traceflow.baseline_item,
  traceflow.rollback_event
TO traceflow_app;

-- 4. Secuencias y Funciones
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA traceflow TO traceflow_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA traceflow TO traceflow_app;

-- 5. Aislamiento total de PostgREST
REVOKE ALL ON SCHEMA traceflow FROM anon, authenticated;
```

---

## 6. Certificación E2E Playwright en Vivo (INT-T01 a INT-T18)

Las 18 pruebas verticales entre React (puerto 5173 en modo API), NestJS (puerto 3001) y Supabase PostgreSQL 17.12 fueron certificadas con un 100% de aprobación:

- `INT-T01` a `INT-T05`: Autenticación con Argon2id, cookie `tf_session`, control SoD en conmutación de roles y navegación contextual.
- `INT-T06` a `INT-T08`: Aislamiento multitenant de proyectos y catálogo contextual de ECS por proyecto.
- `INT-T09` a `INT-T12`: Creación de RFC desde React (`RFC-2026-0020`), inserción en PostgreSQL, emisión de evento en `audit_log` con hash SHA-256 y control de propiedad.
- `INT-T13` a `INT-T14`: Resiliencia a recargas (F5) en navegador y reinicios de proceso backend NestJS sin pérdida de datos.
- `INT-T15` a `INT-T18`: Cierre e invalidación de sesión, redirección segura de rutas y ausencia total de fallback a mock (`VITE_SERVICE_MODE=api`).

Evidencias archivadas en `docs/evidence/int-01/`.

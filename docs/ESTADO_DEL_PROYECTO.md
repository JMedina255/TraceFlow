# Estado Consolidado del Proyecto e Historial de Hitos — TraceFlow SCM

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios
> **Organización Cliente:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam (Medina Quispe, Antayhua Mamani, Loyola Vilca Choque, Rivera Muñoz)
> **Rama Documental:** `docs/alineacion-srs-sad-2026-11-12` | **Línea Base Código:** `master @ 84c832f` (PR #14)
> **Instancia Supabase:** `TraceFlow-UPT` (`xmyfqxlvveiawnxgydtz`, AWS `us-west-2`, PostgreSQL `17.12`)
> **Fecha de Consolidación:** 25 de noviembre de 2026

---

## 1. Propósito del Documento

Este documento consolida el estado real de implementación del sistema **TraceFlow SCM** y preserva de forma compacta los hallazgos, decisiones, métricas de certificación y trazabilidad de commits provenientes de los informes intermedios de las Etapas 01–07R, refactorización empresarial (`feat/traceflow-enterprise-rbac-ux-public`) e hitos de base de datos (`DB-01`, `DB-02`, `INT-01`), eliminando la dispersión documental previa.

*(Todos los informes históricos suprimidos del árbol vigente permanecen íntegramente recuperables en el historial de Git).*

---

## 2. Estado Actual de Implementación por Subsistema

### 2.1 Base de Datos PostgreSQL (`supabase/` — Instancia `TraceFlow-UPT`)
- **Estado:** **Desplegado, endurecido y verificado en lectura (`PostgreSQL 17.12`).**
- **Migraciones versionadas (`supabase/migrations/`):**
  1. `202611250001_initial_traceflow.sql` — 21 tablas en esquema privado `traceflow`, 2 secuencias, FK compuesta multitenant `(target_ecs_id, project_id)` e índice parcial `uq_active_sync_lock_per_ecs`.
  2. `202611250002_structural_seeds.sql` — Catálogo estructural de los 7 roles `PU-01`..`PU-07`.
  3. `202611250003_secure_app_role_least_privilege.sql` — Mínimo privilegio (`SEC-02`) para `traceflow_app` y 10 triggers normativos (`SEC-03` inmutabilidad, `SEC-04` doble llave física, `SEC-05` anti-autoevaluación SoD).
- **Datos actuales observados en lectura (`traceflow_app`):** `7` roles, `4` usuarios (`USR-001`..`USR-004` aprovisionados con Argon2id), `3` proyectos (`PRJ-001`..`PRJ-003`), `6` ECS, `28` RFCs.
- **Pendiente de verificación MCP (`xmyfqxlvveiawnxgydtz`):** lectura de `supabase_migrations.schema_migrations` y configuración externa de plataforma (el usuario `traceflow_app` carece de acceso a `supabase_migrations` por diseño de mínimo privilegio).

### 2.2 Backend NestJS (`backend/` — Monolito Modular)
- **Estado:** **Implementación vertical inicial funcional y conectada a PostgreSQL real.**
- **Módulos operativos (`MOD-01`, `MOD-02`, `MOD-04`, `MOD-07` parciales + Salud):**
  - `HealthModule`: `GET /api/v1/health` (latencia verificada ~169 ms sobre Session Pooler IPv4 con TLS estricto).
  - `AuthModule`: `POST /api/v1/auth/login` (Argon2id, sesión opaca 256-bit, cookie `HttpOnly` `tf_session`), `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`.
  - `ProjectsModule`: `GET /api/v1/projects`, `GET /api/v1/projects/:id` (aislamiento multitenant por usuario).
  - `RfcsModule`: `GET /api/v1/rfcs`, `GET /api/v1/rfcs/:id` (ownership estricto para `PU-01`), `POST /api/v1/rfcs` (`CU-04` exclusivo `PU-01` con verificación de proyecto/ECS y auditoría).
  - `AuditModule`: `append_audit_log()` con `pg_advisory_xact_lock(74291)` y cadena SHA-256 (`curr_log_hash`).
- **Pendientes en Backend (próximos hitos `SCM-01`+):**
  - `CU-05` (Admisión/Observación/Desestimación), `CU-04.1` (Subsanación), `CU-06` (Análisis de Impacto Técnico), `CU-30` (Doble Llave en backend), `CU-07` (CCB), `CU-08` (ECN/ECO), `CU-10..12` (Check-Out/Lock/Check-In y `StoragePort`), `CU-16..19` (QA), `CU-29` (UAT), `CU-20..22` (Líneas Base/Rollback), `CU-23..28` (Incidencias/Auditoría/Reportes).

### 2.3 Frontend React (`prototype/` — React 19 + TypeScript + Vite + Zustand)
- **Estado:** **Prototipo empresarial completo de UI/flujo de cambios (8 pantallas interactivas + 12 placeholders = 20 pantallas canónicas `SCREEN-01`..`SCREEN-20`).**
- **Integración real API (`VITE_SERVICE_MODE=api`):** Conectada para Login/Logout (`useAuthStore`), Proyectos (`useProjectStore`) y Listado/Detalle/Creación de RFC (`useRfcStore` vía `traceFlowAdapter`).
- **Funcionalidades aún en modo simulado (`localStorage`):** `admit`, `observe`, `dismiss`, `subsanar` (`CU-05`/`CU-04.1`), `impactAnalysisService` (`CU-06`), `minorApprovalService` (`CU-30`), `ccbService` (`CU-07`).
- **Funcionalidades en estado Placeholder (12 pantallas):** Gestión de Proyectos UI, ECNs, Repositorio ECS, Operaciones Check-Out/In, QA, UAT, Líneas Base, Rollback, Incidencias, Auditoría, Reportes y Administración de Usuarios.

### 2.4 Estado del Entorno Local (`SCM-00`) y Pendientes Operativos
- **Verificado en el equipo actual:** Node `v24.20.0`, npm `11.19.0`, Git `2.53.0.windows.1`; `npm ci` y compilación exitosos en backend y frontend; `20/20` pruebas unitarias/memoria de backend; `9/9` suites (`97/97` casos) en frontend; conexión PostgreSQL 17.12 con TLS estricto vía Session Pooler IPv4 (`aws-1-us-west-2.pooler.supabase.com:5432`); carga `/login`, recarga y redirección de rutas protegidas verificadas en navegador.
- **Pendiente de cierre manual de SCM-00:** prueba de humo autenticada en navegador con credenciales institucionales ingresadas localmente, activación OAuth de Supabase MCP tras reiniciar Antigravity, y `git credential-manager github login` para publicar ramas.

---

## 3. Registro Histórico Compacto de Hitos y Decisiones Consolidadas

| Etapa / Hito | Commit ref. | Alcance y Resultados Consolidados |
|---|---|---|
| **Etapas 01–02 (Auditoría SRS/SAD)** | `6ff6d7e` | Inventario inicial de brechas (`DOC-001`..`DOC-039`), delimitación de 20 pantallas (8 funcionales + 12 placeholders) y 72 diagramas por renderizar. |
| **Etapa 03 (SRS v1.1)** | `a45eb25` | Formalización de 31 casos de uso (`CU-01`..`CU-30` + `CU-04.1`), tratamiento normativo de `DG-13` (`DOC-006`/`025`) y reescritura de Viabilidad Ambiental (`DOC-020`). |
| **Etapa 04 (SAD Análisis v1.2)** | `012c267` | Delimitación tripartita de arquitectura, catálogo BCE de 31 colaboraciones (`DG-AO-*`), matriz de 14 estados (`TB-07`) y reparación de enlaces (`DOC-008`, `DOC-026`). |
| **Etapa 05 (SAD Diseño v0.5)** | `c7ed0b8` | Conciliación de `ADR-001`..`ADR-010` (sesiones opacas PostgreSQL/HttpOnly en `ADR-006`; Keycloak diferido), catálogo de 20 pantallas/wireframes y acotamiento de métricas RNF como metas de diseño. |
| **Etapa 06 (Recursos Gráficos)** | `c4f95be` | Extracción de 114 fuentes `.puml` (`generales` 13, `analisis` 65, `diseno` 15, `uwe` 21), renderizado dual de 228 archivos (`114 SVG + 114 PNG`), 17 capturas reales a `1440x900` e inserción en `FD03`/`FD04`/`FD05`. |
| **Etapas 07 y 07-R (Auditoría FCA/PCA)** | `f2d2e87`, `9b59478` | Verificación documental FCA/PCA (`0` enlaces rotos en 195 referencias a `assets/`), saneamiento `INC-01`..`INC-06` (versiones `v1.0` de SSOT, catálogo exacto de ADRs, rango `TB-01`..`TB-14`), y aislamiento de colisión `DG-12` (`DOC-030` abierta para dictamen CCB). |
| **Refactor Enterprise RBAC/UX (PR #10)** | `32862be` | Limpieza de metadatos académicos, identidad corporativa ÉXODO S.A.C., RBAC por perfil único (`PU-01`..`PU-07`), flujo `CU-06`, `CU-30` (Doble Llave) y `CU-07` (CCB) en prototipo. Discrepancias resueltas: prohibición de autoaprobación en Doble Llave y unificación de `AUTH` con SHA-256 en modo demo. |
| **DB-01 / DB-01.1 (Reconexión y Seguridad)** | `ea21db7`, `f047b94` | Migración a Supabase `TraceFlow-UPT`, eliminación de credenciales expuestas, aprovisionamiento seguro Argon2id (`provision-users.ts`) y rechazo de fallback silencioso (`H-03`). |
| **DB-02 / DB-02.1 / INT-01 (PR #14)** | `5ad2380`, `c9e3f75`, `84c832f` | Mínimo privilegio `traceflow_app`, 10 triggers físicos en PostgreSQL, certificación física `DB-T01`..`DB-T14` (`14/14`), certificación E2E Playwright `INT-T01`..`INT-T18` (`18/18`), regresión histórica backend `44/44` y frontend `71/71` (`97/97` casos actuales). |
| **DOC-02 (Normalización y Consolidación)** | *Rama actual* | Formalización de `GLOSARIO.md`, `MATRIZ_NOMENCLATURA.md`, `DICCIONARIO_DATOS.md`, `ESTANDAR_PROGRAMACION.md`, consolidación de `FD03`, `SAD_FINAL.md`, `MATRIZ_TRAZABILIDAD.md` y `PLAN_REFACTORIZACION.md`. |
| **INIT-H01-R (Inicialización y GitHub - Subsanación)** | `docs/init-h01-project-architecture` | Subsanación arquitectónica: modelo canónico de 8 estados en español, regularización explícita de proyectos históricos sin TraceFlow.git, matriz oficial de permisos GitHub con tokens en memoria bajo demanda, integridad referencial DA-06 sin INVITED ni DELETE para traceflow_app, fundamento operativo SCM en GitHub (identificación de ECS, correlación de commits/PRs, Policy Gate, líneas base con git tags, detección out-of-band y config_item_path_history), 11 diagramas DG-INIT-01..11, y plan reorganizado en 5 hitos (INIT-H02..H06) con 30 pruebas TDD. |
| **INIT-H02 (Organizaciones, Proyectos y Persistencia)** | `feat/init-h02-organizations-projects` | Implementación modular de `OrganizationsModule` (entidades `organization`, `organization_member`, membresía DA-06, regla bootstrap PU-02) y ampliación de `ProjectsModule` (`POST /api/v1/projects` en estado `BORRADOR`, filtros y aislamiento multitenant por organización, normalización canónica de estados). Migración incremental `202611260001_init_h02_organizations_and_projects.sql` y script de rollback preparados con least privilege (sin DELETE) y disparador de integridad DA-06. Certificación de 72/72 pruebas backend y 97/97 prototipo (169 en verde). Despliegue en Supabase real en pausa bajo Governance Gate. |
| **INIT-H02-R (Subsanación de Persistencia, Aislamiento y Seguridad)** | `feat/init-h02-organizations-projects` | Remediación de 8 hallazgos críticos (H02-R01 a R08): mínimo privilegio `traceflow_app` en asignaciones sin DELETE, eliminación total de fallback silencioso a mock en PostgreSQL (503/403 controlado), transacciones atómicas `DatabaseService.transaction()`, migración incremental saneada (`tax_id` nulo, validación de usuario, `ON CONFLICT DO NOTHING`), rollback seguro condicional con salvaguarda PITR, blindaje estricto de rol activo SoD (`activeRoleId === 'PU-02'`), fidelidad de auditoría (`previousStatus`) y reconciliación de 8 estados canónicos. |
| **INIT-H02-V (Certificación Real de PostgreSQL y Cierre de Persistencia)** | `feat/init-h02-organizations-projects` | Certificación física rigurosa sobre PostgreSQL 16.14 real ejecutando migraciones históricas secuenciales y `202611260001` sin DDL simplificado ni mocks. Auditoría real SHA-256 en `audit_log`, `status VARCHAR(40)` en `project` para `HISTORICO_PENDIENTE_GITHUB`, bloqueo pesimista `FOR UPDATE` en último OWNER, revocación activa de suspendidos en `RfcsService`, rollback seguro sin `CASCADE` con PITR dinámico, y aislamiento mandatario de pruebas con guardián `assertSafeTestDatabase` bloqueando escrituras accidentales en Supabase. |
| **INIT-H02-VF (Cierre Final de Seguridad y Preparación para INIT-H03)** | `feat/init-h02-organizations-projects` | Blindaje final de persistencia y pruebas: lista blanca de bases descartables permitidas (`ALLOWED_DISPOSABLE_DATABASES`), escape seguro con `format(%I, %L)` en creación de roles sin interpolación de contraseñas, desacoplamiento estricto de autorización destructiva (`ALLOW_DESTRUCTIVE_DATABASE_RESET=true` independiente de `ALLOW_REMOTE_TEST_DML`), aislamiento total de `npm test` para ejecutar exclusivamente pruebas no destructivas excluyendo recreaciones de BD y Supabase, autorización SCM obligatoria fail-closed en `RfcsService` (rechazo de dependencias faltantes 503, rechazo de proyectos sin organización 403, bloqueo de suspendidos por sesiones antiguas y conservación de lectura histórica de expedientes), y salvaguarda de rollback exhaustiva bloqueando reversión si existen alteraciones sobre las membresías o la organización inicial. **15/15 pruebas físicas reales**, **76/76 pruebas backend seguras** y **97/97 prototipo** (188 en verde). Persistencia en Supabase en pausa bajo Governance Gate. |
| **INIT-H02 (Cierre de Observaciones Residuales)** | `feat/init-h02-organizations-projects` | Resolución definitiva de las tres observaciones residuales finales: (1) Coherencia total del script de rollback validando la integridad de los cuatro fundadores semilla (`USR-001` como `OWNER`, `USR-002`..`USR-004` como `MEMBER`) y bloqueando ante cualquier alteración de rol/estado o adición posterior; (2) Salvaguarda de Gobernanza SCM fail-closed en `RfcsService.createRfc()` impidiendo la emisión de RFCs sobre proyectos en estado `ACTIVE` o heredados sin integración GitHub validada (DA-04, RN-12); (3) Introspección nativa en runtime del socket PostgreSQL (`inet_server_addr()`, `current_database()`, `datistemplate` en loopback estricto) antes de `DROP DATABASE` y desacoplamiento de flags en `run-supabase-tests.ts`. Certificación ampliada a **18/18 pruebas físicas en PostgreSQL 16 real** (+3 escenarios `V-13`, `V-17`, `V-18`), **76/76 pruebas backend seguras** y **97/97 prototipo frontend** (**191 pruebas consolidadas en verde**). Persistencia productiva en pausa bajo Governance Gate. |

---

## 4. Hallazgos Abiertos, Propuestas al CCB y Recuperación de Trazabilidad Histórica

### 4.1 Decisiones Resueltas (DOC-03.1) y Pendientes de Aprobación
1. **Colisión `DG-12` (`DOC-030` — Resuelta en DOC-03.1):** Ratificado `analisis/DG-12.puml` como único `DG-12` canónico y reclasificado `generales/DG-12.puml` como **`DG-12-HIST`** (preservando contenido histórico y actualizando renders, `DIAGRAMS.md` y `MANIFEST.md`).
2. **Ambigüedades `AMB-01`..`AMB-07` (Resueltas en DOC-03.1):** Formalizadas en [`MATRIZ_NOMENCLATURA.md`](MATRIZ_NOMENCLATURA.md) (singular en tablas, `elemento_configuracion`, `orden_cambio`, `autorizacion_cambio`, separación de campos + diseño futuro `historial_subsanacion_rfc`, conservación de variables `.env` y rol `traceflow_app`, y `PascalCase.tsx` vs `kebab-case`).
3. **Auditoría `SECURITY DEFINER` (`pg_proc` — Hallazgo DOC-03.1):** Las 11 funciones de `traceflow` tienen propietario `postgres` y `search_path` protegido, pero mantienen `EXECUTE` heredado para `PUBLIC`; queda programado `REVOKE EXECUTE ... FROM PUBLIC` en [`PLAN_REFACTORIZACION.md`](PLAN_REFACTORIZACION.md) sin alterar BD todavía.
4. **Pendientes de Dictamen Formal del CCB (`DOC-033` y `DOC-034`):** Permanecen explícitamente **pendientes** hasta aprobación formal del CCB la enmienda híbrida SSOT (`DOCUMENTATION_RULES.md` §15, `DOC-033`) y la formalización de metas de diseño `RTO <= 2h` / `RPO <= 24h` frente a `RNF-09` (`DOC-034`).
5. **Verificación pendiente vía Supabase MCP (`xmyfqxlvveiawnxgydtz`):** Lectura de `supabase_migrations.schema_migrations` y roles/políticas externas de plataforma cuando se reinicie Antigravity con OAuth activo.
6. **Limpieza de ramas históricas (preparada en DOC-03.1):** Commit `e709979` de `docs/presentacion-traceflow-5min` incorporado limpiamente (`af2c729`) en esta rama; las `11` ramas integradas en `master` quedan listas para eliminación tras autorización expresa.
7. **Conectividad IPv4 en equipos sin IPv6:** En redes sin enrutamiento IPv6, usar el Session Pooler IPv4 `aws-1-us-west-2.pooler.supabase.com:5432` con `traceflow_app.xmyfqxlvveiawnxgydtz` y TLS estricto.

### 4.2 Referencias Técnicas Preservadas de Documentos Consolidados (Recuperables vía Git `4f4107d^`)
- **Mecanismo Demo Web Crypto (`AUTH_IMPLEMENTATION_REPORT.md`):** En modo `mock` local (`prototype/src/services/auth.service.ts`), las credenciales de demostración usan SHA-256 con salt `traceflow:exodo:scm:auth:v1`, provisión local vía `authService.setLocalPassword()` y sesión local de 8 horas (en modo `api`/producción rige Argon2id en PostgreSQL y sesión opaca de 15 minutos según `ADR-006`).
- **Certificación BD y E2E (`IMPLEMENTACION_BD_SUPABASE.md`):** Se preservan las matrices históricas `DB-T01`..`DB-T14` (`14/14`) e `INT-T01`..`INT-T18` (`18/18` en `docs/evidence/int-01/`). *(Nota correctiva DOC-03: aquel informe citaba 5 tablas de borrador y "11 secuencias"; la introspección real en [`DICCIONARIO_DATOS.md`](DICCIONARIO_DATOS.md) certifica exactamente **21 tablas**, **2 secuencias** y **120 restricciones**).*
- **Registro `DOC-001`..`DOC-039` y Acta CCB (`MAESTRO_CAMBIOS_SRS_SAD.md` / `PAQUETE_REVISION_CCB_ETAPA07.md`):** Íntegramente preservados en el historial de Git (`4f4107d^`) sin firmas prematuras de aprobación.

### 4.3 Métricas Netas de Consolidación Documental (DOC-02 / DOC-03)
- **Documentos Markdown iniciales:** `53` (`49` en `docs/` + `4` READMEs).
- **Documentos redundantes eliminados (`git rm`):** `17`.
- **Documentos previos preservados:** `36`.
- **Nuevos documentos creados en DOC-02:** `8`.
- **Total final vigente:** `44` archivos Markdown — **reducción neta de 9 documentos (`~17.0%`)** respecto del universo inicial.

---

*Estado consolidado de TraceFlow SCM — Etapa DOC-02.4 — C-SharkTeam / ÉXODO S.A.C.*

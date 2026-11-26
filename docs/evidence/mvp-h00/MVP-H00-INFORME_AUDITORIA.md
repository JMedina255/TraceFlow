# Informe de Auditoría y Preparación del MVP Integral — TraceFlow SCM (MVP-H00)

> **Documento Oficial:** `docs/evidence/mvp-h00/MVP-H00-INFORME_AUDITORIA.md`  
> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Rama de Referencia Auditada:** `feat/init-h04b-webhooks-git-sync` (`1f5e5c8333e441691b0bdd375d7e39c9ee40f7f4` — INIT-H04B-C)  
> **Rama de Trabajo Publicada:** `feat/mvp-integral-traceflow`  
> **Enlace de Publicación:** `https://github.com/JMedina255/TraceFlow/tree/feat/mvp-integral-traceflow`  
> **Fecha de Emisión:** 26 de noviembre de 2026  
> **Estado:** CERRADO — Punto de Detención Obligatorio antes de MVP-H01

---

## 1. Estado Inicial y Final del Repositorio

### 1.1 Estado Inicial Observado
- **Rama activa local al inicio:** `master` en commit `99cf70f1c41249cdf8cc04a8c2c0025e3375ab90` (`Merge pull request #16 from JMedina255/docs/alineacion-srs-sad-2026-11-12`), sincronizada con `origin/master` y árbol de trabajo limpio.
- **Verificación de referencia certificada (`INIT-H04B-C`):**
  - Rama remota `origin/feat/init-h04b-webhooks-git-sync` apuntando al commit `1f5e5c8333e441691b0bdd375d7e39c9ee40f7f4` (`fix(init-h04b-c): cerrar autorizacion scm y seguridad de leases`).
  - Se verificó `git merge-base --is-ancestor master origin/feat/init-h04b-webhooks-git-sync` con resultado `True` (`0` commits exclusivos de `master` frente a `19` commits adelantados en `origin/feat/init-h04b-webhooks-git-sync`, que consolidan `INIT-H02`, `INIT-H03`, `INIT-H04A`, `INIT-H04B` e `INIT-H04B-C`).
- **Configuración local y conectividad:**
  - Únicamente existen plantillas sin secretos: `backend/.env.example` y `prototype/.env.example`. No existen archivos `.env` ni credenciales expuestas en el workspace.
  - **PostgreSQL local (`127.0.0.1:5432`):** No disponible en la máquina actual (`TCP connect to (127.0.0.1 : 5432) failed`).
  - **Supabase Pooler (`aws-0-us-west-2.pooler.supabase.com:5432`):** Alcanzable por TCP (`True`). Por restricción estricta de MVP-H00, **no se accedió ni modificó la instancia productiva Supabase**.

### 1.2 Estado Final del Repositorio (MVP-H00)
- **Rama creada de forma segura:** `feat/mvp-integral-traceflow` desde `1f5e5c8333e441691b0bdd375d7e39c9ee40f7f4`.
- **Alcance de cambios:** Exclusivamente los 4 entregables documentales de auditoría y planificación, sin código funcional nuevo, sin migraciones ejecutadas y sin secretos en el árbol Git.
- **Commit documental:** `docs(mvp): auditar arquitectura y definir plan integral del MVP (MVP-H00)` sobre `feat/mvp-integral-traceflow`.
- **Entregables emitidos:**
  1. [`docs/INVENTARIO_FUNCIONAL_MVP.md`](../../INVENTARIO_FUNCIONAL_MVP.md)
  2. [`docs/MATRIZ_PERFILES_PERMISOS.md`](../../MATRIZ_PERFILES_PERMISOS.md)
  3. [`docs/PLAN_DESARROLLO_MVP.md`](../../PLAN_DESARROLLO_MVP.md)
  4. [`docs/evidence/mvp-h00/MVP-H00-INFORME_AUDITORIA.md`](MVP-H00-INFORME_AUDITORIA.md)

---

## 2. Resultados de Compilación, Linting y Pruebas Ejecutadas

Todas las dependencias se instalaron limpiamente mediante `npm ci` (`Node v24.20.0`, `npm 11.19.0`; `node_modules/` ignorado por `.gitignore`).

| Subsistema | Verificación / Comando | Alcance Real | Resultado |
|---|---|---|---:|
| **Backend NestJS** | `npm run lint` (`tsc --noEmit`) | Todo `backend/src` y `backend/test` | **0 errores (Exit 0)** |
| **Backend NestJS** | `npm run build` (`tsc -p tsconfig.build.json`) | Compilación completa `dist/` | **0 errores (Exit 0)** |
| **Backend NestJS** | `npm test` (`vitest run`) | **13 archivos / 177 pruebas** (12 suites unitarias/mock/e2e + `isolated-pgmem-tests.spec.ts` en `pg-mem`) | **177/177 PASSED (100%)** |
| **Backend PG Real** | `real-postgres-certification*.spec.ts` (4 suites) | 77 pruebas físicas sobre PostgreSQL local | **NO EJECUTADAS** *(excluidas por `vitest.config.ts`; no hay PostgreSQL en `127.0.0.1:5432`)* |
| **Backend Supabase** | `real-postgres-integration.spec.ts` & `vertical-flow` | Pruebas remotas Supabase | **NO EJECUTADAS** *(bloqueadas por seguridad `ALLOW_REMOTE_TEST_DML`)* |
| **Frontend React 19** | `npm run lint` (`oxlint`) | 75 archivos en `prototype/src` | **0 warnings, 0 errors (Exit 0)** |
| **Frontend React 19** | `npm run build` (`tsc -b && vite build`) | 1964 módulos transformados (`dist/`) | **Compilado OK (Exit 0)** *(nota: chunk JS de 667.32 kB > 500 kB)* |
| **Frontend React 19** | `npm test` (`node --experimental-strip-types`) | **9/9 suites** (`rfc.service`, `rfc.views`, `rfc.validation`, `auth` 9/9, `navigation` 8/8, `impactAnalysis` 11/11, `minorApproval` 20/20, `ccb` 18/18, `enterprise.rbac` 12/12) | **9/9 suites PASSED (Exit 0)** |

---

## 3. Funcionalidades Reutilizables y Funcionalidades Pendientes

*(El desglose completo por caso de uso y archivo reside en [`docs/INVENTARIO_FUNCIONAL_MVP.md`](../../INVENTARIO_FUNCIONAL_MVP.md)).*

### 3.1 Núcleo Sólido Reutilizable (Con Persistencia Real / Verificado)
1. **Esquema PostgreSQL completo (33 tablas, `supabase/migrations/202611250001`..`202611260008`)**: Incluye `app_user`, `user_session`, `organization`, `organization_member`, `project`, `project_setup`, `project_team_role`, `project_methodology`, `project_phase`, `project_milestone`, `project_deliverable`, `github_integration`, `organization_github_installation`, `github_event`, `config_item_path_history`, las 14+ tablas del flujo SCM (`change_request`..`incident_ticket`), triggers físicos SoD/inmutabilidad (`202611250003`) y mínimo privilegio de `traceflow_app` sin `DELETE`.
2. **Backend NestJS base (`Auth`, `Audit`, `Organizations`, `Projects` H02/H03, `GitHub` H04A/H04B-C, `Rfcs` CU-04)**: Autenticación Argon2id con cookie `HttpOnly`, cadena SHA-256 `append_audit_log()` con `pg_advisory_xact_lock(74291)`, gestión multiorganización `DA-06`, planificación completa de proyectos H03, integración GitHub App RS256 e ingesta/worker recuperable de webhooks con `claim_token`.
3. **Frontend React 19 (`prototype/src/`)**: Shell institucional (`AppLayout`, `Sidebar`, `Topbar`), guardas `ProtectedRoute`/`RoleGuard`, `LoginView`, `DashboardView`, `apiClient.ts` con `credentials: 'include'`, y 6 vistas interactivas de RFC (`RfcListView`, `RfcCreateView`, `RfcDetailView`, `RfcEditView`, `RfcImpactAnalysisView`, `RfcMinorApprovalView`, `RfcCcbDeliberationView`).

### 3.2 Funcionalidades Pendientes para Completar el MVP
1. **Administración del Sistema (`PU-08`, MVP-H01):** Catálogo extendido con `PU-08`/`PU-09`, `UsersModule`, CRUD/suspensión de usuarios con revocación de sesiones, autorización `can_create_projects`, invitaciones UI+BD (sin email/OAuth externos), y vista `/admin/users`.
2. **Dirección de Proyectos y Equipos (`PU-09`, MVP-H02):** Migración de permisos de creación/gestión de proyecto hacia `PU-09`, endpoint de activación `POST /projects/:id/activate`, resolución de perfil efectivo por proyecto (`project_team_role`) permitiendo roles distintos por proyecto, y vistas reales de `/projects`, `/projects/new` (Wizard 5 pasos) y `/projects/:projectId`.
3. **Flujo SCM Completo en Backend + API (MVP-H03):** Desbloqueo real `DA-04` en `RfcsService.createRfc()`, endpoints backend para `CU-05`, `CU-04.1`, `CU-06`, `CU-30`, `CU-07`, `CU-08`, `CU-09..15` (ECS y `sync_lock`), `CU-16..19` (QA), `CU-29` (UAT), `CU-20..22` (Baselines/Rollback), `CU-23..25` (Incidencias), y conexión de `apiAdapter.ts`.
4. **Consolidación Visual (MVP-H04):** Reemplazo de los 12 `ScreenPlaceholder` por pantallas operativas conectadas a API, más `AuditController` y `ReportsController`.

---

## 4. Hallazgos Críticos Identificados

| ID | Hallazgo Crítico | Evidencia Verificable | Impacto en el MVP |
|---|---|---|---|
| **H-CRIT-01** | **Bloqueo hardcoded en `RfcsService.createRfc()`** | `backend/src/modules/rfcs/rfcs.service.ts#L205-L213` exige `ALLOW_MOCK_GITHUB_ACTIVATION === 'true'` en modo `postgres` en lugar de consultar `github_integration` (`VALIDATED`) y `project.status === 'ACTIVO'`. | Impide registrar RFCs en PostgreSQL real aunque el proyecto tenga GitHub validado. |
| **H-CRIT-02** | **Ausencia de activación de proyecto y flujo SCM posterior a `CU-04` en Backend** | `ProjectsController` carece de `POST /:id/activate`; `app.module.ts` no tiene controladores para `CU-05..30`, `ECN`, `ECS`, `sync_lock`, `QA`, `UAT`, `Baseline`, `Incidents`, `Audit` (`GET`) ni `Reports`. | El 85% del flujo SCM funciona hoy solo en `localStorage` del navegador. |
| **H-CRIT-03** | **12 de 20 pantallas canónicas son `ScreenPlaceholder` y el prototipo corre en modo `mock`** | `prototype/.env.example#L3` (`VITE_SERVICE_MODE=mock`); `prototype/src/routes/AppRouter.tsx#L38-L273`. | No existe aún interfaz operativa real para `/projects`, `/admin/users`, `/ecns`, `/ecs`, `/scm/operations`, `/baselines`, `/qa/...`, `/rfcs/.../uat`, `/incidents`, `/audit`, `/reports`. |
| **H-CRIT-04** | **Desalineamiento de roles globales vs. por proyecto y ausencia de `PU-08`/`PU-09`** | `auth.repository.ts#L113-L160` solo lee `user_role_assignment` (global); `auth.service.ts#L9-L27` mapea solo `1..7`; `permissions.ts#L78` asigna `/admin/users` a `PU-05`; `ProjectsService`/`GitHubService` asignan creación/gestión a `PU-02`. | Impide que una cuenta ejerza distintos roles en distintos proyectos y carece de segregación entre Admin Global (`PU-08`), Jefe de Proyecto (`PU-09`), Gestor de Cambios (`PU-02`) y Bibliotecario (`PU-05`). |
| **H-CRIT-05** | **Privilegio `SELECT`-only sobre `user_role_assignment` para `traceflow_app`** | `supabase/migrations/202611250003_secure_app_role_least_privilege.sql#L271-L278`. | Bloqueará la asignación/modificación de roles desde `UsersModule` (`PU-08`) en PostgreSQL real si no se actualiza en la migración de MVP-H01. |
| **H-CRIT-06** | **Dependencia de `LoginView` sobre `initialUsers.ts` local y fallbacks en `apiAdapter.ts`** | `prototype/src/features/auth/LoginView.tsx#L38-L40`; `prototype/src/services/api/apiAdapter.ts#L103,L111`; `useRfcStore.ts#L54-L65`. | Nuevos usuarios creados en BD no tendrían selector de rol en `/login`; `apiAdapter.createRfc` muestra nombres hardcodeados si no se resuelven desde la API. |
| **H-CRIT-07** | **Brecha de migraciones entre repositorio (11) y Supabase productivo (3)** | `docs/ESTADO_DEL_PROYECTO.md#L23-L28`; `docs/evidence/init-h04b-c/INFORME_ACEPTACION_INIT_H04B_C.md#L80-L91,L153`. | Las migraciones `202611260001`..`202611260008` siguen en pausa bajo Governance Gate; además, falta PostgreSQL local en esta estación para pruebas físicas. |
| **H-CRIT-08** | **Inconsistencias menores de concurrencia/documentación técnica** | `RfcsRepository.getNextCode()` (`rfcs.repository.ts#L223-L227`) usa `SELECT count(*)` (riesgo de colisión/bajas); `github.repository.ts#L1278` valida `PU-06/02/03/05` mientras el acta H04B-C citaba alias en inglés. | Riesgo de duplicidad de código RFC bajo concurrencia y confusión de roles autorizados en commits Git. |

---

## 5. Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación Planificada |
|---|:---:|:---:|---|
| **R-01: Regresión de pruebas H02/H03/H04A** al migrar creación de proyectos de `PU-02` a `PU-09` | Alta | Medio | Actualizar fixtures y casos en MVP-H01/H02 de forma explícita y ejecutar 100% de suites de regresión. |
| **R-02: Complejidad en resolución dual de roles** (rol global vs. rol por proyecto) | Media | Alto | Centralizar la resolución en `AuthService` + `ProjectContextGuard` (`project_team_role` + `user_session.active_project_id`), con pruebas unitarias y `pg-mem` exhaustivas. |
| **R-03: Imposibilidad de certificar SQL físico en esta estación** si no se levanta PostgreSQL local | Alta | Alto | Instalar/levantar PostgreSQL 16/17 local (o contenedor Docker aislado descartable) antes de cerrar MVP-H01/MVP-H05, manteniendo `ALLOW_REMOTE_TEST_DML` bloqueado. |
| **R-04: Alcance excesivo de MVP-H03/H04** retrasando demostración | Media | Alto | Priorizar en MVP-H03 los endpoints mínimos del camino feliz + guardas SoD críticas, reutilizando las 33 tablas y las vistas RFC ya existentes. |
| **R-05: Desincronización de esquema en Supabase** al momento del despliegue final | Media | Alto | Ejecutar secuencia completa `202611250001`..`202611260009`+ en BD local descartable primero y validar con `verify_migration.sql` antes de solicitar pase a Supabase. |

---

## 6. Propuesta Técnica Detallada para MVP-H01 y MVP-H02

*(El detalle completo por hito de MVP-H00 a MVP-H05 y la matriz completa de perfiles se encuentran en [`PLAN_DESARROLLO_MVP.md`](../../PLAN_DESARROLLO_MVP.md) y [`MATRIZ_PERFILES_PERMISOS.md`](../../MATRIZ_PERFILES_PERMISOS.md)).*

### 6.1 Propuesta Técnica MVP-H01 (Administración del Sistema — `PU-08`)
- **Base de Datos (`202611260009_mvp_roles_pu08_pu09_and_admin.sql`):**
  - Insertar `PU-08` (`id = 8`) y `PU-09` (`id = 9`) en `traceflow.app_role`.
  - Añadir a `traceflow.app_user`: `can_create_projects BOOLEAN NOT NULL DEFAULT FALSE`, `project_creation_authorized_by UUID`, `project_creation_authorized_at TIMESTAMPTZ`.
  - Añadir `status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'` a `traceflow.user_role_assignment` y otorgar `SELECT, INSERT, UPDATE` (sin `DELETE`) a `traceflow_app` para revocar roles globales sin borrado físico.
  - Añadir `active_project_id UUID REFERENCES traceflow.project(id)` en `traceflow.user_session`.
  - Crear `traceflow.user_invitation` (`email`, `github_username`, `invitation_channel`, `organization_id`, `project_id`, `intended_role_id`, `token_code`, `status`, `invited_by`, `accepted_user_id`, `expires_at`) con `SELECT, INSERT, UPDATE` sin `DELETE` para `traceflow_app` (sin envío de correo externo ni OAuth).
- **Backend NestJS:**
  - Extender `CanonicalRoleId` y `AuthenticatedUser` (`canCreateProjects`, `activeProjectId`, `projectRoles`).
  - Crear `UsersModule` (`UsersController`, `UsersService`, `UsersRepository`) protegido por `@Roles('PU-08')` para CRUD de usuarios, cambio de estado (revocando sesiones activas en `user_session` ante `SUSPENDED`/`INACTIVE`), asignación de roles globales, toggle auditado de `can_create_projects` y gestión de invitaciones UI+BD.
  - Habilitar a `PU-08` en `OrganizationsModule` y añadir `POST /api/v1/auth/context` para cambiar proyecto y rol efectivo.
- **Frontend React 19:**
  - Incorporar `PU-08` y `PU-09` en `CANONICAL_ROLES`, `ACTION_PERMISSIONS`, `ROUTE_PERMISSIONS` y `SIDEBAR_NAVIGATION`.
  - Mover `/admin/users` exclusivamente a `PU-08` e implementar `AdminUsersView.tsx` conectada a `/api/v1/admin/users`, `/api/v1/admin/invitations` y `/api/v1/organizations`.
  - Adaptar `LoginView.tsx` para permitir login API de usuarios creados dinámicamente sin depender de `initialUsers.ts`.

### 6.2 Propuesta Técnica MVP-H02 (Dirección de Proyectos y Equipos — `PU-09`)
- **Backend NestJS:**
  - En `ProjectsService.createProject()`, validar `user.activeRoleId === 'PU-09'` y `canCreateProjects === true` (además de membresía `ACTIVE` en la organización `DA-06`), asignando automáticamente `PU-09` (`is_lead = true`) en `project_team_role` y registro en `user_project_assignment`.
  - En `ProjectPlanningService` y `GitHubService`, reemplazar la autorización de `PU-02` por `PU-09` asignado (`manager_id`/`created_by` o `project_team_role = PU-09`) para configurar equipo (`PU-01..PU-07`), metodología, fases, hitos, entregables y vinculación GitHub.
  - Implementar `POST /api/v1/projects/:id/activate` (verificando equipo + metodología + `github_integration.validation_status = 'VALIDATED'` para pasar a `ACTIVO`) y `PATCH /api/v1/projects/:id/status` (`SUSPENDIDO`/`ARCHIVADO`).
  - Incorporar `ProjectContextGuard` / resolución del rol activo del usuario **por proyecto** desde `project_team_role` para garantizar que una cuenta desempeñe distintos perfiles en distintos proyectos.
- **Frontend React 19:**
  - Implementar `ProjectsListView.tsx` (`/projects`), `ProjectWizardView.tsx` (`/projects/new` — 5 pasos `DA-05` incluyendo invitaciones y vinculación GitHub sin OAuth) y `ProjectDetailView.tsx` (`/projects/:projectId` — pestañas de resumen, equipo/perfiles, metodología/cronograma, GitHub y activación).
  - Actualizar `Topbar.tsx` y `useProjectStore.ts` para mostrar el proyecto activo y el perfil efectivo que el usuario ejerce en ese proyecto, invocando `POST /auth/context`.

---

## 7. Dictamen de Preparación para Continuar

**DICTAMEN: APTO PARA CONTINUAR CON MVP-H01 (BAJO CONDICIONES CONTROLADAS).**

- **Base certificada íntegra:** El punto de partida `1f5e5c8333e441691b0bdd375d7e39c9ee40f7f4` compila sin errores (`0`), pasa el `100%` de las pruebas ejecutables sin BD externa (`177/177` en backend, `9/9` suites en frontend) y cuenta con un esquema PostgreSQL sólido de 33 tablas.
- **Condición previa operativa:** Para ejecutar la certificación física de `202611260009` en adelante (MVP-H01/H05), será necesario disponer de una instancia PostgreSQL 16/17 local descartable (`127.0.0.1:5432`) en el entorno de desarrollo.
- **Punto de Detención Obligatorio:** Se da por concluido exclusivamente **MVP-H00**. No se inicia **MVP-H01** hasta recibir revisión y aprobación expresa del responsable del proyecto.

---
*Informe emitido en MVP-H00 — TraceFlow SCM / ÉXODO S.A.C.*

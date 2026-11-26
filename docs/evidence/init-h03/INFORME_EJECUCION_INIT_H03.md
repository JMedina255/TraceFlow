# INFORME DE AUDITORÍA, EJECUCIÓN Y CERTIFICACIÓN DEL HITO INIT-H03
## Gestión de Equipos, Metodologías y Planificación de Proyectos — TraceFlow SCM

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Fecha:** 26 de noviembre de 2026  
> **Rama de Trabajo:** `feat/init-h03-team-methodology-planning`  
> **Commit Base Verificado:** `16afb2d63afe657d603baeab79b0eeb6f7f5d8f2`  
> **Línea Base Documental:** `docs/init-h01-project-architecture` (INIT-H01-R) y `ADR-011`  
> **Estado del Hito:** IMPLEMENTADO Y CERTIFICADO LOCALMENTE (100% Criterios de Aceptación)  
> **Governance Gate:** ACTIVO — Detenido para autorización formal antes de INIT-H04  

---

## 1. Resumen Ejecutivo y Alcance del Hito

El hito **INIT-H03** implementa el segundo nivel de inicialización, gobernanza y planificación técnica para proyectos de TraceFlow SCM previo a la futura vinculación con repositorios de GitHub (reservada para `INIT-H04`). 

Se ha dotado a la plataforma de:
1. **Roles Funcionales y Asignación de Miembros (`project_team_role`):** Asignación de los siete roles canónicos (`PU-01` a `PU-07`), con cumplimiento estricto de la regla institucional `DA-06`, control SoD para gestores (`PU-02`) y administradores de organización (`OWNER`/`ADMIN`), y compatibilidad retroactiva garantizada con `user_project_assignment`.
2. **Configuración de Metodología de Desarrollo (`project_methodology`):** Parametrización formal de marcos ágiles e ingenieriles (`SCRUM`, `KANBAN`, `CASCADA`, `HIBRIDA`, `UPT_ACADEMICA`), validación de iteraciones para Scrum (1 a 8 semanas) y configuración flexible en `JSONB`.
3. **Fases y Cronograma de Proyecto (`project_phase`):** Estructura secuencial de ejecución con unicidad compuesta (`project_id, sequence_order` y `project_id, phase_code`) e integridad cronológica estricta (`end_date >= start_date`).
4. **Hitos y Entregables Planificados (`project_milestone`, `project_deliverable`):** Tipología estandarizada de entregables, asignación obligatoria de responsables a miembros activos del equipo, enlace opcional a ECS (sin datos simulados) y disparadores relacionales anti-contaminación entre proyectos distintos.
5. **Asistente Progresivo y Guardado de Borradores (`project_setup`):** Flujo de 5 pasos con soporte de guardado en lote (Pasos 2 y 3) y recuperación de borradores mediante `JSONB draft_payload`.
6. **Persistencia y Seguridad en PostgreSQL 16 Real:** Migración incremental `202611260002`, script de rollback seguro, mínimo privilegio para `traceflow_app` (`REVOKE DELETE`) y certificación en motor relacional real con 33 pruebas físicas aprobadas.

---

## 2. Entorno y Topología de Certificación Aislada

Para garantizar el cumplimiento de las salvaguardas de gobernanza, la certificación física se ejecutó sobre un servidor PostgreSQL real en entorno local completamente desacoplado de la nube:

- **Motor:** PostgreSQL 16.14 (`PostgreSQL 16.14 on x86_64-alpine-linux-musl`, WSL2).
- **Socket:** `127.0.0.1:5432`, base de datos descartable `traceflow_cert`.
- **Esquema:** `traceflow` (operacional) y `extensions` (criptografía con `pgcrypto`).
- **Roles:**
  - `postgres`: Superusuario para DDL y migraciones atómicas.
  - `traceflow_app`: Rol operativo de la aplicación con mínimo privilegio (`SELECT, INSERT, UPDATE` concedidos; `DELETE` estrictamente revocado).
- **Introspección Nativa:** Verificación del socket loopback antes de recreaciones destructivas y salvaguardas `ALLOWED_DISPOSABLE_DATABASES`.

---

## 3. Modelo Relacional Físico y Migraciones Oficiales

La migración incremental oficial [`supabase/migrations/202611260002_init_h03_team_methodology_planning.sql`](../../../supabase/migrations/202611260002_init_h03_team_methodology_planning.sql) expande el catálogo relacional físico del esquema `traceflow` de **23 a 29 tablas**:

```
                       ESQUEMA RELACIONAL TRACEFLOW (H03)
                       =================================
                               +----------------+
                               |  organization  | (H02)
                               +-------+--------+
                                       |
                   +-------------------+-------------------+
                   | 1                                     | 1..*
           +-------v--------+                     +--------v------------+
           |    project     |                     | organization_member | (H02, DA-06)
           +-------+--------+                     +---------------------+
                   |
       +-----------+-----------+---------------+---------------+---------------+
       | 1         | 1..*      | 1             | 1..*          | 1..*          | 1..*
+------v------+ +--v---------+ +v------------+ +v------------+ +v------------+ +v-------------+
|project_setup| |project_team| |project_     | |project_phase| |project_     | |project_      |
|  (DA-05)    | |   _role    | | methodology | |(chk_dates)  | |  milestone  | | deliverable  |
+-------------+ +------------+ +-------------+ +------+------+ +------+------+ +------+-------+
                                                      | 1             | 1             |
                                                      +---------------+---------------+
                                                                Triggers de Aislamiento
```

### 3.1 Tablas Físicas Creadas:
1. `traceflow.project_setup`: Estado y progreso del asistente (pasos 1..5, banderas booleanas de completitud, `draft_payload JSONB`). Clave foránea hacia `project(id)` con `ON DELETE CASCADE`.
2. `traceflow.project_team_role`: Asignación de roles canónicos (`PU-01`..`PU-07`) por proyecto. `ON DELETE RESTRICT`, restricción de unicidad `uq_project_user_role (project_id, user_id, role_id)`.
3. `traceflow.project_methodology`: Configuración de marco de trabajo. Clave foránea `project_id` UNIQUE, CHECK `chk_methodology_type`, CHECK `chk_iteration_duration`, parámetros `JSONB`.
4. `traceflow.project_phase`: Fases secuenciales del proyecto. CHECK `chk_phase_dates (end_date >= start_date)`, unicidad `uq_project_phase_order` y `uq_project_phase_code`.
5. `traceflow.project_milestone`: Hitos de control vinculados opcionalmente a fases del mismo proyecto. Unicidad `uq_project_milestone_code`.
6. `traceflow.project_deliverable`: Entregables planificados con tipología estándar (`SOFTWARE_RELEASE`, `TECHNICAL_DOCUMENT`, `SOURCE_BRANCH`, `TEST_REPORT`, `DB_MIGRATION`), responsable miembro del equipo y enlace opcional a ECS (`associated_ecs_id`).

### 3.2 Disparadores Físicos en PostgreSQL:
- `trg_check_project_team_role_org`: Ejecuta `traceflow.enforce_project_team_role_org_integrity()`. Valida que el usuario exista en `app_user` en estado `ACTIVE` y que sea miembro activo (`ACTIVE`) de la organización propietaria del proyecto (`DA-06`).
- `trg_check_milestone_project`: Ejecuta `traceflow.enforce_milestone_project_consistency()`. Impide que un hito apunte a una fase perteneciente a un proyecto diferente.
- `trg_check_deliverable_project`: Ejecuta `traceflow.enforce_deliverable_project_consistency()`. Impide que un entregable apunte a un hito o fase perteneciente a un proyecto diferente.

### 3.3 Mínimo Privilegio de traceflow_app:
```sql
GRANT SELECT, INSERT, UPDATE ON traceflow.project_setup TO traceflow_app;
GRANT SELECT, INSERT, UPDATE ON traceflow.project_team_role TO traceflow_app;
GRANT SELECT, INSERT, UPDATE ON traceflow.project_methodology TO traceflow_app;
GRANT SELECT, INSERT, UPDATE ON traceflow.project_phase TO traceflow_app;
GRANT SELECT, INSERT, UPDATE ON traceflow.project_milestone TO traceflow_app;
GRANT SELECT, INSERT, UPDATE ON traceflow.project_deliverable TO traceflow_app;

REVOKE DELETE ON ALL TABLES IN SCHEMA traceflow FROM traceflow_app;
```

---

## 4. Endpoints REST Implementados en Backend NestJS

Se han habilitado y securizado los siguientes endpoints en `ProjectsController` (`/api/v1/projects`):

| Método | Ruta | DTO de Entrada | Rol Mínimo / SoD | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/:id/team/roles` | `AssignTeamRoleDto` | Gestor (`PU-02`) / Org Admin | Asigna un rol funcional canónico a un miembro de la organización en el proyecto |
| `GET` | `/:id/team/roles` | — | Miembro del proyecto | Lista todos los integrantes y roles funcionales del proyecto |
| `PATCH` | `/:id/team/roles/:roleAssignmentId/status` | `{ status: 'ACTIVE' \| 'INACTIVE' }` | Gestor (`PU-02`) / Org Admin | Actualiza el estado de la asignación de rol del miembro |
| `POST` | `/:id/methodology` | `ConfigureMethodologyDto` | Gestor (`PU-02`) / Org Admin | Configura el marco metodológico y duración de sprints |
| `GET` | `/:id/methodology` | — | Miembro del proyecto | Obtiene la configuración metodológica activa |
| `POST` | `/:id/phases` | `CreatePhaseDto` | Gestor (`PU-02`) / Org Admin | Registra una fase con validación cronológica y de secuencia |
| `GET` | `/:id/phases` | — | Miembro del proyecto | Lista las fases cronológicamente ordenadas |
| `POST` | `/:id/milestones` | `CreateMilestoneDto` | Gestor (`PU-02`) / Org Admin | Registra un hito de proyecto con enlace opcional a fase |
| `GET` | `/:id/milestones` | — | Miembro del proyecto | Lista los hitos planificados |
| `POST` | `/:id/deliverables` | `CreateDeliverableDto` | Gestor (`PU-02`) / Org Admin | Registra un entregable con responsable asignado y tipo formal |
| `GET` | `/:id/deliverables` | — | Miembro del proyecto | Lista los entregables planificados |
| `GET` | `/:id/setup` | — | Miembro del proyecto | Consulta el estado integral del asistente y sus 5 pasos |
| `PUT` | `/:id/setup/step-2` | `SaveStep2TeamDto` | Gestor (`PU-02`) / Org Admin | Guarda en lote los integrantes del equipo y avanza a paso 3 |
| `PUT` | `/:id/setup/step-3` | `SaveStep3MethodologyDto` | Gestor (`PU-02`) / Org Admin | Guarda en lote metodología, fases e hitos y avanza a paso 4 |
| `PATCH`| `/:id/setup/progress`| `SaveDraftProgressDto` | Gestor (`PU-02`) / Org Admin | Guarda el progreso del borrador arbitrario sin corromper el modelo |

---

## 5. Auditoría Inmutable Criptográfica SHA-256

Todas las mutaciones de planificación quedan asentadas de forma inmutable en `traceflow.audit_log` invocando la función `traceflow.append_audit_log` con cerrojo transaccional `pg_advisory_xact_lock(74291)`:

- `PROJECT_TEAM_ROLE_ASSIGNED`: Registro de asignación de miembro con usuario, rol y titularidad funcional.
- `TEAM_ROLE_STATUS_UPDATED`: Inactivación o reactivación de un integrante.
- `PROJECT_METHODOLOGY_CONFIGURED`: Parametrización metodológica y duración de iteración.
- `PROJECT_PHASE_CREATED`: Fases creadas con orden y rango de fechas.
- `PROJECT_MILESTONE_CREATED`: Hitos y fechas objetivo.
- `PROJECT_DELIVERABLE_CREATED`: Entregables, tipo previsto y responsable.
- `PROJECT_SETUP_STEP3_COMPLETED`: Finalización atómica del Paso 3 del asistente.
- `PROJECT_DRAFT_PROGRESS_SAVED`: Guardado de progreso parcial y borrador JSONB.

Cada registro calcula `curr_log_hash = encode(digest(coalesce(prev_log_hash, '') || ... , 'sha256'), 'hex')`, garantizando inmutabilidad y verificabilidad probatoria (ADR-008, IEEE 828).

---

## 6. Procedimiento de Reversión Limpia y Salvaguardas de Rollback

Se diseñó e implementó [`supabase/migrations/202611260002_init_h03_team_methodology_planning_rollback.sql`](../../../supabase/migrations/202611260002_init_h03_team_methodology_planning_rollback.sql):

1. **Salvaguarda de Integridad Previa SCM:**
   - Comprueba si existen entregables vinculados formalmente a ECS (`associated_ecs_id IS NOT NULL`).
   - Si existen enlaces probatorios a ECS, el script aborta con `RAISE EXCEPTION` para evitar destrucción de trazabilidad SCM, remitiendo a procedimientos formales PITR.
2. **Reversión Limpia Certificada:**
   - Elimina los 3 disparadores relacionales y las 3 funciones PL/pgSQL de integridad.
   - Elimina las 6 tablas DDL de planificación en estricto orden de dependencias relacionales (`RESTRICT`, sin `CASCADE`).
   - Deja intactas las 23 tablas de `INIT-H02` y los datos de organizaciones y proyectos históricos.

---

## 7. Matriz Integral de Certificación y Resultados de Pruebas

### 7.1 Suite de Certificación en PostgreSQL 16 Real (`test:real-postgres`)
**Archivo:** `backend/test/real-postgres-h03-certification.spec.ts` (15/15 pruebas aprobadas):
- `H03-V01`: Ejecución de las 5 migraciones oficiales en orden estricto (100% OK).
- `H03-V02`: Catálogo físico con exactamente 29 tablas en esquema `traceflow` (100% OK).
- `H03-V03`: Restricciones CHECK (`chk_methodology_type`, `chk_iteration_duration`, `chk_phase_dates`) activas (100% OK).
- `H03-V04`: Disparador `trg_check_project_team_role_org` bloquea inserción física de usuarios externos a la organización (100% OK).
- `H03-V05`: Disparador `trg_check_milestone_project` impide asignar hitos a fases de otros proyectos (100% OK).
- `H03-V06`: Disparador `trg_check_deliverable_project` impide asignar entregables a hitos de otros proyectos (100% OK).
- `H03-V07`: Rol `traceflow_app` posee permisos operativos `SELECT`, `INSERT`, `UPDATE` (100% OK).
- `H03-V08`: Rol `traceflow_app` tiene estrictamente denegado el permiso `DELETE` en las 6 tablas (100% OK).
- `H03-V09`: Servicio `ProjectPlanningService` asigna roles canónicos, sincroniza `user_project_assignment` e inactiva roles (100% OK).
- `H03-V10`: Configuración metodológica SCRUM valida límites de iteración (1 a 8 semanas) y rechaza rangos espurios (100% OK).
- `H03-V11`: Planificación de fases cronológicamente ordenadas y rechazo de `end_date < start_date` (100% OK).
- `H03-V12`: Definición de hitos y entregables vinculados con validación de responsable en el equipo (100% OK).
- `H03-V13`: Asistente progresivo de inicialización completa Paso 2, Paso 3 y persiste borradores JSONB (100% OK).
- `H03-V14`: Auditoría inmutable genera hashes SHA-256 encadenados y serializados (100% OK).
- `H03-V15`: Script de rollback revierte limpiamente el esquema a 23 tablas sin alterar proyectos u organizaciones (100% OK).

**Archivo de Regresión H02:** `backend/test/real-postgres-certification.spec.ts` (18/18 pruebas aprobadas).  
**Subtotal PostgreSQL Real:** **33/33 pruebas físicas aprobadas**.

### 7.2 Suite Unitaria y de Aislamiento TDD Backend (`npm test`)
**Archivo:** `backend/test/projects-h03-planning.spec.ts` (22/22 pruebas aprobadas):
- `TDD-H03-01..07`: Asignación de roles de equipo, segregación DA-06, rechazo de no registrados, suspendidos y duplicados (409 Conflict).
- `TDD-H03-08..10`: Configuración metodológica SCRUM, Kanban, Cascada y UPT Académica.
- `TDD-H03-11..13`: Fases cronológicas, unicidad de orden y código.
- `TDD-H03-14..18`: Hitos y entregables vinculados con aislamiento entre proyectos y validación de responsable.
- `TDD-H03-19..22`: Progreso progresivo del asistente (Pasos 1 a 5, guardado en lote y borrador).

**Resto de suites backend:** 10 suites adicionales (76 pruebas de autenticación, proyectos, organizaciones, salvaguardas destructivas, RFCs, governance negative, pg-mem y e2e).  
**Subtotal Backend Unitario:** **98/98 pruebas aprobadas (100%)**.

### 7.3 Suite de Prototipo Frontend (`prototype/`)
- 9 suites (`rfc.service`, `rfc.views`, `rfc.validation`, `auth`, `navigation`, `impactAnalysis`, `minorApproval`, `ccb`, `enterprise.rbac`).  
**Subtotal Frontend:** **97/97 pruebas aprobadas (100%)** con 0 regresiones.

### 7.4 Consolidación General de Pruebas:
$$\text{Total Pruebas en Verde} = 98 \text{ (Backend Unit)} + 33 \text{ (PostgreSQL Real)} + 97 \text{ (Prototipo Frontend)} = \mathbf{228 \text{ Pruebas Exitosas}}$$

---

## 8. Cumplimiento de Restricciones del Hito y Governance Gate

El equipo de arquitectura y desarrollo certifica el cumplimiento absoluto de las restricciones establecidas:

- [x] **Cero ejecución sobre Supabase productivo:** No se ejecutó ninguna sentencia DDL ni DML sobre la instancia remota `TraceFlow-UPT` (`xmyfqxlvveiawnxgydtz`).
- [x] **Cero modificación de datos productivos:** Los datos históricos permanecen intactos.
- [x] **Cero merge a `master`:** El trabajo permanece aislado en la rama oficial `feat/init-h03-team-methodology-planning`.
- [x] **No implementar integración GitHub:** Las llamadas a GitHub API, webhooks y tokens de GitHub App quedan formalmente reservadas para `INIT-H04`.
- [x] **No activar proyectos:** Ningún proyecto ha sido promovido a `ACTIVO`; la activación permanece condicionada a la validación de repositorios de `INIT-H04` y a los flujos de `INIT-H05/H06`.
- [x] **Mínimo Privilegio respetado:** `traceflow_app` carece terminantemente de permisos `DELETE` y `DROP`.
- [x] **Punto de parada obligatorio:** Se detiene el proceso para presentar este informe y solicitar la autorización formal del Responsable / CCB antes de iniciar `INIT-H04`.

---

## 9. Próximos Pasos (Hoja de Ruta hacia INIT-H04)

Una vez aprobada formalmente la línea base técnica de `INIT-H03`:
1. **Creación de rama para INIT-H04:** `feat/init-h04-github-integration`.
2. **Implementación de GitHubIntegrationModule:**
   - Generación de GitHub App Installation Access Tokens bajo demanda en memoria (duración 60 min, cero persistencia en BD).
   - Endpoints de vinculación de repositorios remotos y aprovisionamiento de nuevos repositorios.
   - Recepción e intercepción de webhooks con verificación criptográfica HMAC-SHA256 (`crypto.timingSafeEqual`).
   - Cifrado de secretos en reposo con AES-256-GCM.
3. **Mapeo y Trazabilidad Git de ECS:**
   - Tabla `config_item_path_history` y vinculación de commits/PRs a RFCs.
   - Puerta de control `Policy Gate` con GitHub Checks API.

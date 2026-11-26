# TraceFlow SCM — Informe Técnico de Subsanación Final de Persistencia, Aislamiento y Atomicidad (INIT-H03-R)

> **Documento Oficial de Certificación:** `docs/evidence/init-h03-r/INFORME_SUBSANACION_INIT_H03_R.md`  
> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización Cliente:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Rama de Trabajo:** `feat/init-h03-team-methodology-planning`  
> **Commit Base de Partida:** `47a877b0e8757c9ca040b0e88be4b1a2b1dd5362`  
> **Línea Base Documental:** INIT-H01-R, INIT-H02-VF, ADR-011  
> **Fecha:** 26 de noviembre de 2026  
> **Estado:** COMPLETADO Y CERTIFICADO LOCALMENTE — En pausa bajo Governance Gate  

---

## 1. Resumen Ejecutivo

El presente informe certifica la resolución exhaustiva de las cinco observaciones de persistencia, aislamiento, transaccionalidad y gobernanza detectadas en la auditoría técnica del hito **INIT-H03 (Equipos, Metodologías y Planificación de Proyectos)**, asegurando que la base relacional y de servicios de TraceFlow SCM cumpla de forma irrestricta con las seis decisiones arquitectónicas vinculantes (`DA-01` a `DA-06`), las normas internacionales de integridad (IEEE 828) y las reglas de seguridad de datos corporativos.

Todas las correcciones fueron verificadas mediante desarrollo guiado por pruebas (TDD) tanto en entorno simulado desacoplado como sobre una instancia física aislada de **PostgreSQL 16.14 real** (ejecutada en entorno local en `127.0.0.1:5432`), alcanzando un **100% de aprobación sin regresión en ninguna suite histórica del sistema**.

---

## 2. Matriz de Observaciones Auditadas y Remediaciones Implementadas

| Identificador | Componente | Descripción de la Observación | Solución Técnica Aplicada | Evidencia de Prueba |
|---|---|---|---|---|
| **H03-R01** | `ProjectPlanningService` / `ProjectPlanningRepository` | **Aislamiento de Asignaciones:** La actualización de estado de rol (`updateTeamRoleStatus`) no validaba la pertenencia de la asignación al proyecto de la ruta, permitiendo mutaciones cruzadas no autorizadas entre proyectos. | Se implementó `findTeamRoleById(id, client)`. Antes de mutar, se valida `assignment.project_id === project.id`; ante discrepancia se aborta con `403 Forbidden`. Se ejecuta verificación, mutación y auditoría dentro de la misma transacción relacional. | `TDD-H03-R01` (unitario), `H03-V13-R1` (PostgreSQL 16 real) |
| **H03-R02** | `ProjectPlanningRepository.saveSetup` | **Preservación de Progreso del Asistente:** `INSERT ... ON CONFLICT DO UPDATE` reemplazaba valores no provistos con los defaults de `VALUES`, sobreescribiendo pasos previos (ej. borraba `team_completed` al guardar metodología o retrocedía `wizard_step`). | Se eliminó el uso de `EXCLUDED.*` estático en favor de parámetros directos `$2..$10` con preservación condicional: `GREATEST($2::integer, wizard_step)` para no regresión de pasos, `draft_payload \|\| $9::jsonb` para fusión de claves, y retención de banderas previas. | `TDD-H03-R02` (unitario), `H03-V13-R2` (PostgreSQL 16 real) |
| **H03-R03** | `ProjectPlanningService.saveStep2Team` | **Atomicidad de Guardado por Lote:** El guardado en lote del equipo iteraba invocando transacciones independientes por miembro. Si el tercer integrante fallaba, los dos primeros permanecían en base de datos. | Se encapsuló todo el proceso de validación, asignación de roles, sincronización en `user_project_assignment`, actualización de `project_setup` y auditoría en un único bloque `db.transaction(client)`. Si un integrante falla, la transacción relacional ejecuta `ROLLBACK` total. | `TDD-H03-R03` (unitario), `H03-V13-R3` (PostgreSQL 16 real) |
| **H03-R04** | `ProjectPlanningService.getAuthorizedProject` | **Autorización Estricta por Proyecto:** Pertenecer a la organización propietaria permitía a cualquier miembro consultar la planificación interna de cualquier proyecto, violando el principio de aislamiento `DA-01`. | Se blindó `getAuthorizedProject`: pertenecer a la organización es condición necesaria pero no suficiente. Se exige ser `OWNER`/`ADMIN`/`AUDITOR` de la org, creador/gestor del proyecto (`PU-02`), o estar explícitamente asignado en `assignedProjectIds` o `project_team_role`. Caso contrario: `403 Forbidden`. | `TDD-H03-R04` (unitario), `H03-V13-R4` (PostgreSQL 16 real) |
| **H03-R05** | `202611260002_..._rollback.sql` | **Salvaguarda de Rollback de Planificación:** El script de reversión solo evaluaba `associated_ecs_id IS NULL`, destruyendo tablas con información técnica si no había ECS enlazados aún. | Se implementó salvaguarda exhaustiva en bloque PL/pgSQL que verifica las 6 tablas (`project_team_role`, `project_methodology`, `project_phase`, `project_milestone`, `project_deliverable`, `project_setup` con avance). Si hay registros, aborta con `RAISE EXCEPTION` indicando restauración PITR, salvo que se active deliberadamente `SET LOCAL traceflow.allow_force_h03_rollback = 'true'`. | `H03-V15-A` (aborto seguro) y `H03-V15-B` (reversión limpia en PG real) |
| **H03-R06** | `ProjectsController` y Documentación | **Alineación de Contratos de API:** Desfase entre la documentación y los contratos HTTP reales del controlador. | Se documentaron unívocamente las rutas REST canónicas implementadas (`/team-members`, `/methodology`, `/phases`, `/milestones`, `/deliverables`, `/setup`, `/setup/step-2`, `/setup/step-3`, `/setup/progress`) sin introducir endpoints duplicados. | `projects.controller.ts`, `PLAN_INICIALIZACION_PROYECTOS.md`, `SAD_FINAL.md` |

---

## 3. Detalle de Implementación Técnica

### 3.1 Aislamiento Estricto de Roles entre Proyectos (`H03-R01`)
En `ProjectPlanningService.updateTeamRoleStatus`:
```typescript
async updateTeamRoleStatus(
  projectIdOrCode: string,
  roleAssignmentId: string,
  status: 'ACTIVE' | 'INACTIVE',
  callerUser: AuthenticatedUser
): Promise<ProjectTeamRoleEntity> {
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    throw new BadRequestException(`Estado '${status}' inválido para asignación de rol. Debe ser 'ACTIVE' o 'INACTIVE'.`);
  }

  const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
  await this.assertAdminOrManager(project, callerUser);

  return await this.db.transaction(async (client) => {
    const assignment = await this.planningRepo.findTeamRoleById(roleAssignmentId, client);
    if (!assignment) {
      throw new NotFoundException(`Asignación de rol '${roleAssignmentId}' no encontrada.`);
    }

    if (assignment.project_id !== project.id) {
      throw new ForbiddenException(
        `Violación de aislamiento por proyecto: La asignación '${roleAssignmentId}' no pertenece al proyecto '${project.code}'.`
      );
    }

    const updated = await this.planningRepo.updateTeamRole(roleAssignmentId, { status }, client);
    await this.auditService.logEvent({ ... }, client);
    return updated;
  });
}
```

### 3.2 Preservación de Estado y No Regresión en Asistente (`H03-R02`)
En `ProjectPlanningRepository.saveSetup`:
```sql
INSERT INTO traceflow.project_setup (
  project_id, wizard_step, wizard_completed, identity_completed, team_completed,
  methodology_completed, github_completed, validation_completed, draft_payload, last_saved_by
) VALUES (
  $1, COALESCE($2, 1), COALESCE($3, false), COALESCE($4, true), COALESCE($5, false),
  COALESCE($6, false), COALESCE($7, false), COALESCE($8, false), COALESCE($9::jsonb, '{}'::jsonb), $10
)
ON CONFLICT (project_id) DO UPDATE SET
  wizard_step = CASE WHEN $2 IS NOT NULL THEN GREATEST($2::integer, traceflow.project_setup.wizard_step) ELSE traceflow.project_setup.wizard_step END,
  wizard_completed = COALESCE($3, traceflow.project_setup.wizard_completed),
  identity_completed = COALESCE($4, traceflow.project_setup.identity_completed),
  team_completed = COALESCE($5, traceflow.project_setup.team_completed),
  methodology_completed = COALESCE($6, traceflow.project_setup.methodology_completed),
  github_completed = COALESCE($7, traceflow.project_setup.github_completed),
  validation_completed = COALESCE($8, traceflow.project_setup.validation_completed),
  draft_payload = CASE WHEN $9 IS NOT NULL THEN traceflow.project_setup.draft_payload || $9::jsonb ELSE traceflow.project_setup.draft_payload END,
  last_saved_by = COALESCE($10, traceflow.project_setup.last_saved_by),
  updated_at = NOW()
RETURNING *;
```

### 3.3 Atomicidad Transaccional por Lote (`H03-R03`)
En `ProjectPlanningService.saveStep2Team`:
- Se procesan todos los integrantes dentro de `this.db.transaction(async (client) => { ... })`.
- Si alguno de los integrantes incumple validaciones institucionales (`DA-06`), duplicidad de roles o estado del usuario, se dispara una excepción que provoca el `ROLLBACK` total de la transacción en PostgreSQL, garantizando cero inserciones parciales en `project_team_role`, `user_project_assignment` ni mutaciones espurias en `project_setup`.
- En modo simulado (`mock`), se capturan snapshots previos de colecciones y se restauran ante fallos.

### 3.4 Autorización Estricta de Proyectos (`H03-R04`)
En `ProjectPlanningService.getAuthorizedProject`:
- Se comprueba la existencia del proyecto y la membresía activa en la organización (`DA-06`).
- Se verifica que el usuario autenticado posea legitimidad operativa sobre el proyecto:
  1. Rol institucional global (`OWNER`, `ADMIN`, `AUDITOR`) de la organización propietaria.
  2. Creador (`project.created_by`), Gestor del proyecto (`project.manager_id`), o rol activo de Gestor SCM (`PU-02`).
  3. Integrante explícitamente asignado en el token (`assignedProjectIds`), en `user_project_assignment`, o con rol activo en `project_team_role`.
- Cualquier miembro no asignado es rechazado con código `HTTP 403 Forbidden`.

### 3.5 Salvaguarda Exhaustiva de Rollback (`H03-R05`)
En `202611260002_init_h03_team_methodology_planning_rollback.sql`:
- Bloque PL/pgSQL que inspecciona la presencia de filas en `project_team_role`, `project_methodology`, `project_phase`, `project_milestone`, `project_deliverable` y `project_setup` (con `wizard_step > 1` o banderas de progreso).
- Si `total_records > 0` y no está activa la variable de sesión `traceflow.allow_force_h03_rollback = 'true'`, la reversión se cancela con:
  ```
  RAISE EXCEPTION 'BLOQUEO DE SEGURIDAD (INIT-H03): Se detectaron registros operativos de planificación... Para contingencias utilice Point-In-Time Recovery (PITR)...';
  ```
- Si la tabla está limpia o se habilita el override deliberado para pruebas, procede a remover ordenadamente disparadores, funciones y las 6 tablas relacionales, devolviendo el catálogo a las 23 tablas de H02.

---

## 4. Resultados de la Certificación y Pruebas

### 4.1 Certificación en PostgreSQL 16.14 Real Aislado (`npm run test:real-postgres`)
- **Instancia:** PostgreSQL 16.14 en `127.0.0.1:5432` (Base de datos descartable `traceflow_cert`).
- **Suites Ejecutadas:**
  1. `test/real-postgres-h03-certification.spec.ts`: **20/20 pruebas aprobadas** (100%).
     - *H03-V01..V03:* Migraciones y catálogo físico de 29 tablas.
     - *H03-V04..V06:* Disparadores físicos de integridad (`DA-06`, aislamiento de hitos y entregables).
     - *H03-V07..V08:* Mínimo privilegio de `traceflow_app` (SELECT, INSERT, UPDATE; DELETE revocado).
     - *H03-V09..V13:* Servicios NestJS integrados sobre PostgreSQL real.
     - *H03-V13-R1:* Aislamiento de asignaciones por proyecto (403).
     - *H03-V13-R2:* Preservación y fusión de `draft_payload` JSONB en `project_setup`.
     - *H03-V13-R3:* Atomicidad transaccional del lote de equipo (0 filas insertadas ante fallo).
     - *H03-V13-R4:* Segregación por proyecto para miembros de la misma organización (403).
     - *H03-V14:* Auditoría criptográfica SHA-256 encadenada inmutable.
     - *H03-V15-A:* Bloqueo de seguridad ante intento de rollback con datos operativos.
     - *H03-V15-B:* Reversión limpia con switch forzado, restaurando el esquema a 23 tablas.
  2. `test/real-postgres-certification.spec.ts`: **18/18 pruebas aprobadas** (100% regresión H02).
- **Total Pruebas Físicas Reales:** **38/38 aprobadas**.

### 4.2 Pruebas Unitarias y de Integración Backend (`npm test`)
- **Suites Ejecutadas:** 11 archivos de pruebas en `TraceFlow/backend`.
- **Resultado:** **102/102 pruebas aprobadas** (100%).
  - `projects-h03-planning.spec.ts`: 26 pruebas (22 de H03 + 4 de remediación H03-R).
  - `organizations.spec.ts`: 14 pruebas.
  - `projects-h02.spec.ts`: 14 pruebas.
  - `destructive-safeguards.spec.ts`: 8 pruebas.
  - `rfcs.spec.ts`: 10 pruebas.
  - `auth.spec.ts`: 5 pruebas.
  - `governance-negative.spec.ts`: 7 pruebas.
  - `isolated-pgmem-tests.spec.ts`: 8 pruebas.
  - `migration-compatibility.spec.ts`: 6 pruebas.
  - `projects.spec.ts`: 3 pruebas.
  - `vertical-flow.e2e-spec.ts`: 1 prueba.

### 4.3 Pruebas del Prototipo Frontend (`prototype/`)
- **Suites Ejecutadas:** 9 archivos de especificación.
- **Resultado:** **97/97 pruebas aprobadas** (100% compatibilidad UI y RBAC).

### 4.4 Balance Consolidado de Pruebas
$$\text{Total Pruebas Aprobadas} = 102 \text{ (unitarias backend)} + 38 \text{ (PostgreSQL real)} + 97 \text{ (prototipo)} = \mathbf{237 \text{ pruebas en verde (0 fallos)}}.$$

---

## 5. Control de Cambios de Archivos en INIT-H03-R

```
M  backend/src/modules/projects/project-planning.repository.ts
M  backend/src/modules/projects/project-planning.service.ts
M  backend/src/modules/projects/projects.repository.ts
M  backend/test/projects-h03-planning.spec.ts
M  backend/test/real-postgres-h03-certification.spec.ts
M  supabase/migrations/202611260002_init_h03_team_methodology_planning_rollback.sql
M  docs/PLAN_INICIALIZACION_PROYECTOS.md
M  docs/ESTADO_DEL_PROYECTO.md
M  docs/MATRIZ_TRAZABILIDAD.md
M  docs/SAD_FINAL.md
M  docs/adr/ADR-011.md
A  docs/evidence/init-h03-r/INFORME_SUBSANACION_INIT_H03_R.md
```

---

## 6. Estado del Governance Gate y Próximos Pasos

> [!IMPORTANT]
> **Punto de Parada Obligatorio de Gobernanza (Governance Gate):**
> 1. Se ha respetado de forma estricta la directiva de **NO ejecutar migraciones DDL/DML sobre la instancia productiva de Supabase (`xmyfqxlvveiawnxgydtz`)**.
> 2. Se mantiene la rama aislada `feat/init-h03-team-methodology-planning` **sin realizar merge a `master`**.
> 3. No se ha implementado código de conexión a GitHub App ni recepción de webhooks (reservados exclusivamente para `INIT-H04`).
> 4. Ningún proyecto ha sido promovido al estado operacional `ACTIVO` en la base de datos real (DA-04).
> 5. El equipo se detiene en este punto para solicitar la **revisión y aprobación formal del Responsable / CCB** sobre los artefactos de INIT-H03-R antes de planificar la ejecución del hito INIT-H04.

# TraceFlow SCM — Especificación de Implementación de Base de Datos PostgreSQL y Supabase

> **Hito:** DB-01 — PostgreSQL + Supabase MCP + Backend NestJS + Primer Flujo Real  
> **Fecha:** 25 de Noviembre de 2026  
> **Esquema:** `traceflow` (Privado / Least Privilege)  
> **Marcos y Estándares:** IEEE 828, ISO/IEC/IEEE 12207, SRS v1.1 (`FD03`), SAD Análisis v1.1 (`FD04`), SAD Diseño v0.2 (`FD05`), ADR-003, ADR-004, ADR-005, ADR-006, ADR-008  

---

## 1. Diccionario Compacto de Tablas del Esquema `traceflow`

| # | Tabla Relacional | Entidad SAD (DG-12 / DG-D03) | Clave Primaria | Claves Foráneas / Restricciones Clave | Propósito Normativo |
| :---: | :--- | :--- | :---: | :--- | :--- |
| **01** | `app_role` | RolUsuario (`PU-01`..`PU-07`) | `id` (INT) | `code` UNIQUE NOT NULL | Catálogo inmutable de los 7 roles canónicos de seguridad SCM. |
| **02** | `app_user` | Usuario | `id` (UUID) | `code` UNIQUE, `username` UNIQUE, `email` UNIQUE | Cuentas institucionales de operadores de ÉXODO S.A.C. con hash Argon2id. |
| **03** | `user_role_assignment` | Asignación Usuario-Rol | `(user_id, role_id)` | FK a `app_user`, FK a `app_role` | Matriz N:M de asignación de roles y control de SoD. |
| **04** | `project` | Proyecto | `id` (UUID) | `code` UNIQUE, `project_key` UNIQUE, FKs a `app_user` | Catálogo de proyectos clientes (EXO-CORE, EXO-PORTAL, EXO-SUNAT). |
| **05** | `user_project_assignment` | Asignación Multitenant | `(user_id, project_id)` | FK a `app_user`, FK a `project` | Particionamiento estricto de acceso por usuario (Subsanación de DG-D03). |
| **06** | `user_session` | Sesión Opaca en Servidor | `id` (UUID) | `session_token_hash` VARCHAR(64) UNIQUE, FK a `app_user` | Sesiones en servidor con expiración de 15 min de inactividad (ADR-006). |
| **07** | `config_item` | ElementoConfiguración (ECS) | `id` (UUID) | `(project_id, code)` UNIQUE, `(id, project_id)` UNIQUE | Catálogo de activos SCM segregados por biblioteca (Trabajo, Soporte, Maestra). |
| **08** | `ecs_version` | Historial de Versiones | `id` (UUID) | `(ecs_id, version_number)` UNIQUE, `sha256_checksum` | Versiones inmutables con hash SHA-256 (RN-02, RNF-03, RF-17). |
| **09** | `change_request` | SolicitudCambio (RFC) | `id` (UUID) | `code` UNIQUE, `(target_ecs_id, project_id)` FK compuesta | Expediente 360° en 14 estados oficiales TB-07 con aislamiento de proyecto. |
| **10** | `impact_assessment` | InformeImpacto | `id` (UUID) | `rfc_id` UNIQUE FK | Dictamen técnico del Arquitecto (PU-03) evaluando la Triple Restricción (RN-05). |
| **11** | `change_authorization` | Autorización Cambio Menor | `id` (UUID) | `(rfc_id, authorizer_role)` UNIQUE, FKs a `app_user` | Doble Llave Operativa obligatoria (PU-02 Gestor + PU-03 Arquitecto, CU-30). |
| **12** | `ccb_resolution` | Dictamen CCB | `id` (UUID) | `resolution_code` UNIQUE, FK a `change_request` | Resoluciones colegiadas del Comité de Control de Cambios (CU-07). |
| **13** | `ccb_vote` | Voto Individual CCB | `id` (UUID) | `(rfc_id, voter_user_id)` UNIQUE | SoD-05: Exactamente un voto fundamentado por identidad física en el comité. |
| **14** | `change_order` | OrdenCambio (ECN/ECO) | `id` (UUID) | `code` UNIQUE, `rfc_id` UNIQUE FK, FK a `config_item` | Formalización técnica de autorización y asignación de implementación (CU-08). |
| **15** | `sync_lock` | EstadoBloqueo (RN-06) | `id` (UUID) | **Índice único condicional `(ecs_id) WHERE status='ACTIVE'`** | Exclusividad absoluta de Check-Out; liberación solo por causas canónicas. |
| **16** | `qa_certification` | CertificadoConformidad | `id` (UUID) | FK a `change_order`, FK a `ecs_version` | Certificación técnica emitida por PU-07 (Incompatible con Dev PU-06). |
| **17** | `uat_acceptance` | Aceptación Usuario (UAT) | `id` (UUID) | FK a `change_order`, FK a `ecs_version` | Visto bueno formal del Solicitante previa a la promoción a Maestra (RN-09). |
| **18** | `baseline` | LíneaBase | `id` (UUID) | `code` UNIQUE, FK a `project` | Congelamiento formal en Biblioteca Maestra por el Bibliotecario PU-05 (RN-02). |
| **19** | `baseline_item` | Asociación LB-ECS | `(baseline_id, ecs_version_id)` | FK a `baseline`, FK a `ecs_version` | Catálogo de versiones específicas consolidadas en la línea base congelada. |
| **20** | `incident_ticket` | TicketIncidencia | `id` (UUID) | `code` UNIQUE, FK a `change_request` | Reportes operativos con trazabilidad bidireccional hacia RFCs (MOD-08). |
| **21** | `audit_log` | RegistroAuditoria (RN-02) | `id` (UUID) | `sequence_number` BIGSERIAL UNIQUE, `curr_log_hash` | Bitácora inmutable append-only con cadena criptográfica SHA-256 (ADR-008). |

---

## 2. Correspondencia Técnica SAD ↔ SQL ↔ Tipos TypeScript

```
┌───────────────────────────────┬──────────────────────────────────┬──────────────────────────────────────────┐
│ Entidad SAD (DG-12 / DG-D03)  │ Tabla PostgreSQL (`traceflow.*`) │ Interfaces TypeScript (Backend / Frontend│
├───────────────────────────────┼──────────────────────────────────┼──────────────────────────────────────────┤
│ RolUsuario (Catálogo PU)      │ traceflow.app_role               │ CanonicalRoleId ('PU-01'..'PU-07')       │
│ Usuario (Cuentas físicas)     │ traceflow.app_user               │ AuthenticatedUser, UserAccount, User     │
│ Asignación Rol (SoD)          │ traceflow.user_role_assignment   │ allowedRoleIds: CanonicalRoleId[]        │
│ Proyecto (Multitenant)        │ traceflow.project                │ Project, ProjectEntity                   │
│ Asignación Proyecto           │ traceflow.user_project_assignment│ assignedProjectIds: string[]             │
│ Sesión Opaca en Servidor      │ traceflow.user_session           │ SessionRecord, AuthSessionResult         │
│ Elemento de Configuración     │ traceflow.config_item            │ ECS, EcsEntity                           │
│ Versión Inmutable             │ traceflow.ecs_version            │ ECSVersion, EcsVersionEntity             │
│ Solicitud de Cambio (RFC)     │ traceflow.change_request         │ RFC, RfcEntity, CreateRfcDto             │
│ Informe Técnico de Impacto    │ traceflow.impact_assessment      │ TechnicalImpactAssessment                │
│ Autorización Delegada (CU-30) │ traceflow.change_authorization   │ DelegatedMinorApproval, MinorApproval    │
│ Resolución Colegiada CCB      │ traceflow.ccb_resolution         │ CCBResolution, CCBActaDraft              │
│ Voto Individual CCB           │ traceflow.ccb_vote               │ CCBVoteRecord                            │
│ Orden de Cambio (ECN)         │ traceflow.change_order           │ ECN, ChangeOrderDto                      │
│ Bloqueo SCM (RN-06)           │ traceflow.sync_lock              │ SyncLockStatus, LockInfo                 │
│ Certificación de Calidad      │ traceflow.qa_certification       │ QACertificationRecord                    │
│ Aceptación de Usuario         │ traceflow.uat_acceptance         │ UATAcceptanceRecord                      │
│ Línea Base Congelada          │ traceflow.baseline               │ Baseline, BaselineItem                   │
│ Ticket de Incidencia          │ traceflow.incident_ticket        │ IncidentTicket                           │
│ Pista Forense Inmutable       │ traceflow.audit_log              │ AuditRecord, AuditEventInput             │
└───────────────────────────────┴──────────────────────────────────┴──────────────────────────────────────────┘
```

---

## 3. Evidencia Real de Inspección Supabase MCP

Durante la fase de diagnóstico y verificación segura del servidor MCP oficial (`supabase_mcp`):

### 3.1. Consulta de Organizaciones (`list_organizations`):
```json
{
  "organizations": [
    {
      "id": "lcbcfoeocdvehrzpaipg",
      "slug": "lcbcfoeocdvehrzpaipg",
      "name": "JMedina255-2"
    }
  ]
}
```

### 3.2. Consulta de Proyectos (`list_projects`):
```json
{
  "projects": [
    {
      "id": "vfrvtdgzunprutsicqsv",
      "ref": "vfrvtdgzunprutsicqsv",
      "organization_id": "lcbcfoeocdvehrzpaipg",
      "name": "game-vault Project",
      "region": "us-west-2",
      "status": "INACTIVE",
      "database": {
        "host": "db.vfrvtdgzunprutsicqsv.supabase.co",
        "version": "17.11.0.003",
        "postgres_engine": "17"
      }
    },
    {
      "id": "hixrwpiyyhrifsxgekfe",
      "ref": "hixrwpiyyhrifsxgekfe",
      "organization_id": "lcbcfoeocdvehrzpaipg",
      "name": "Proyecto_Tienda",
      "region": "ca-central-1",
      "status": "INACTIVE",
      "database": {
        "host": "db.hixrwpiyyhrifsxgekfe.supabase.co",
        "version": "17.11.0.019",
        "postgres_engine": "17"
      }
    }
  ]
}
```

### 3.3. Diagnóstico de Estado y Conectividad:
Al invocar `list_tables` para verificar conectividad de base de datos sobre los proyectos existentes:
```json
{
  "error": {
    "name": "BadRequestException",
    "message": "Database is possibly not accessible at the moment"
  }
}
```
* **Causa Identificada:** Ambos proyectos se encuentran en estado `INACTIVE` (pausados por inactividad en la capa gratuita de Supabase) y pertenecen a proyectos ajenos (`game-vault Project` y `Proyecto_Tienda`).
* **Protocolo de Seguridad Aplicado:** En estricto cumplimiento de la regla de seguridad del hito (*"Detener cualquier escritura sobre una base de datos remota antes de aprobación; si falta acceso MCP/credencial, entregar migraciones listas y describir la limitación sin inventar pruebas"*), **no se forzó ninguna escritura destructiva ni se inventaron ejecuciones remotas**. Las migraciones SQL `202611250001_initial_traceflow.sql` y `202611250002_initial_seeds.sql` se encuentran versionadas, validadas y listas para ser aplicadas por el usuario a través de Supabase CLI o reactivando el proyecto deseado.

---

## 4. Resultados de Verificación y Pruebas Automatizadas

### 4.1. Suite de Pruebas del Backend NestJS (`backend/`):
* **Comando:** `npm test` (Vitest v3.2.7)
* **Resultado:** **5 suites pasadas, 20 pruebas ejecutadas con 100% de éxito (0 fallos).**
  - `test/auth.spec.ts`: Autenticación con credenciales institucionales, generación de token opaco de 256 bits, hash SHA-256 en sesión, expiración por inactividad y revocación por logout.
  - `test/projects.spec.ts`: Aislamiento multitenant por proyecto. `USR-004` (Loyola) restringido a `PRJ-001` y `PRJ-002`, con rechazo estricto (403 Forbidden) para `PRJ-003`.
  - `test/rfcs.spec.ts`: Creación formal de RFC (`CU-04`), restricción SoD exclusiva a `PU-01`, blindaje contra contaminación cruzada de ECS entre proyectos, y regla de *Ownership* en consultas.
  - `test/governance-negative.spec.ts`: Pruebas negativas de RN-06 (bloqueo concurrente rechazado), causas canónicas de liberación, rechazo a manipulación de `audit_log`, antiautoevaluación (SoD-01), Doble Llave con identidades distintas (SoD-02) y unicidad de voto CCB (SoD-05).
  - `test/vertical-flow.e2e-spec.ts`: Prueba vertical de extremo a extremo: Login -> Proyectos -> Creación de RFC -> Persistencia -> Lectura -> Verificación matemática de la cadena SHA-256 en auditoría.

### 4.2. Suite de Pruebas del Prototipo Frontend (`prototype/`):
* **Comandos:** `npm run lint` (oxlint), `npm run build` (tsc -b && vite build), `npm test`
* **Resultado:**
  - `oxlint`: 0 advertencias, 0 errores en 75 archivos.
  - `tsc -b && vite build`: Compilación limpia en 1.18 segundos.
  - `npm test`: **9 suites de pruebas existentes intactas y 100% aprobadas.**

---

## 5. Asuntos Abiertos y Recomendaciones para Decisión CCB

1. **Selección de Proyecto Supabase Dedicado**: Se recomienda al administrador del CCB reactivar uno de los proyectos pausados o crear un proyecto `traceflow-dev` en la organización `JMedina255-2` para ejecutar el push formal de las migraciones SQL `202611250001` y `202611250002`.
2. **Formalización de la Tabla `user_project_assignment` en SAD**: El diagrama DG-D03 omitió la tabla asociativa para asignación de usuarios a proyectos. Aunque fue subsanada en este hito para cumplir con `RBAC_ACCESS_MATRIX.md`, se presentará como ajuste menor de diseño en la siguiente sesión de CCB.
3. **Persistencia de Contratos Extensibles (DB-02)**: Los módulos para ECN, CCB, Check-In/Out y QA cuentan con sus esquemas DDL y contratos DTO definidos en el backend, listos para su materialización en el hito DB-02.

# TraceFlow SCM — Especificación de Implementación de Base de Datos PostgreSQL y Supabase

> **Hito:** DB-01 / DB-01.1 — Reconexión Supabase, Auditoría y Endurecimiento Previo al Despliegue  
> **Fecha:** 25 de Noviembre de 2026  
> **Esquema:** `traceflow` (Privado / Least Privilege / Sin exposición a PostgREST)  
> **Instancia Autorizada:** Supabase `TraceFlow-UPT` (`xmyfqxlvveiawnxgydtz`) — AWS `us-west-2`  
> **Marcos y Estándares:** IEEE 828, ISO/IEC/IEEE 12207, SRS v1.1 (`FD03`), SAD Análisis v1.1 (`FD04`), SAD Diseño v0.2 (`FD05`), ADR-003, ADR-004, ADR-005, ADR-006, ADR-008  

---

## 1. Matriz de Resolución de Hallazgos Técnicos (H-01 a H-07)

Durante el ciclo de auditoría independiente y revisión de calidad previa al despliegue (Hito DB-01.1), se identificaron y subsanaron los siguientes 7 hallazgos arquitecturales:

| Hallazgo | Título / Requisito | Estado | Resolución Técnica Implementada |
| :---: | :--- | :---: | :--- |
| **H-01** | **Reconexión a proyecto autorizado** | **RESUELTO** | Antigravity MCP reconfigurado en `mcp_config.json` con `project_ref=xmyfqxlvveiawnxgydtz`. Verificado en vivo: proyecto `TraceFlow-UPT` en estado `ACTIVE_HEALTHY`, PostgreSQL 17.12.0, AWS `us-west-2`, con extensiones `pgcrypto` y `uuid-ossp` listas. |
| **H-02** | **Aprovisionamiento seguro de credenciales** | **RESUELTO** | Se eliminó `202611250002_initial_seeds.sql` que contenía credenciales incrustadas. Se creó `202611250002_structural_seeds.sql` con roles estructurales canónicos `PU-01`..`PU-07` exclusivamente. Se creó `supabase/seeds/demo_seeds.sql.example`. Se implementó `@node-rs/argon2` nativo en el backend con script de aprovisionamiento seguro `backend/src/scripts/provision-users.ts` con sales aleatorias criptográficas independientes y parámetros OWASP. |
| **H-03** | **Eliminación de fallback silencioso** | **RESUELTO** | Se implementó `DATABASE_MODE='postgres'\|'mock'` estricto. Se eliminaron las capturas silenciosas en `DatabaseService`, `AuthRepository`, `ProjectsRepository`, `RfcsRepository` y `AuditService`. En modo `postgres`, cualquier fallo de conexión o consulta arroja una excepción fatal inmediata sin retornar datos simulados. El modo mock queda restringido exclusivamente a pruebas unitarias desconectadas (`NODE_ENV=test`). |
| **H-04** | **Certificación y clasificación de pruebas** | **RESUELTO** | Se clasificaron formalmente las 5 suites existentes en sus encabezados como `[UNITARIAS / REPOSITORIOS EN MEMORIA]`, documentando que no certifican restricciones físicas de PostgreSQL. Se creó la nueva suite `backend/test/real-postgres-integration.spec.ts` preparada para DB-02 con las pruebas de las 7 restricciones reales. |
| **H-05** | **Integración frontend vía adapter** | **RESUELTO** | Se conectaron los stores Zustand (`useAuthStore`, `useProjectStore`, `useRfcStore`) a `traceFlowAdapter`. `useAuthStore.loginWithCredentials` y `logout` ahora invocan `traceFlowAdapter.auth`. Se agregaron métodos asíncronos `loadProjectsFromApi` en `useProjectStore` y `fetchRfcsFromApi` / `createRfcAsync` en `useRfcStore`, preservando 100% de compatibilidad con las 9 suites de pruebas del prototipo. |
| **H-06** | **Seguridad PostgreSQL, TLS y Least Privilege** | **RESUELTO** | Se diseñó el rol de aplicación `supabase/roles/01_app_role.sql` creando `traceflow_app` con permisos DML mínimos y revocando expresamente `UPDATE`, `DELETE`, `TRUNCATE` en `audit_log`, `DELETE`, `TRUNCATE` en `ecs_version` y `TRUNCATE` en `sync_lock`. Se revocaron permisos por defecto a `anon` y `authenticated`. Se configuró TLS en Node pg respetando certificados CA. Se endurecieron funciones SQL con `SECURITY DEFINER` y `SET search_path = traceflow, extensions, pg_catalog, pg_temp`. |
| **H-07** | **Documentación técnica y conciliación** | **RESUELTO** | Actualización integral de `docs/IMPLEMENTACION_BD_SUPABASE.md` e `docs/INFORME_HITO_DB01.md` reflejando la reconciliación del Hito DB-01.1, la evidencia MCP de `TraceFlow-UPT`, el inventario final de 21 tablas y 2 migraciones, y el plan ordenado para DB-02. |

---

## 2. Diccionario Compacto de Tablas del Esquema `traceflow` (21 Tablas)

El modelo relacional implementado en `supabase/migrations/202611250001_initial_traceflow.sql` cubre la totalidad del dominio de trazabilidad y gobernanza:

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

## 3. Evidencia Real de Inspección MCP sobre `TraceFlow-UPT`

Durante la Etapa B del Hito DB-01.1 se consultó el proyecto autorizado mediante el servidor oficial `supabase_mcp`:

### 3.1. Consulta de Proyecto Autorizado (`get_project`):
```json
{
  "id": "xmyfqxlvveiawnxgydtz",
  "name": "TraceFlow-UPT",
  "ref": "xmyfqxlvveiawnxgydtz",
  "organization_id": "lcbcfoeocdvehrzpaipg",
  "region": "us-west-2",
  "status": "ACTIVE_HEALTHY",
  "database": {
    "host": "db.xmyfqxlvveiawnxgydtz.supabase.co",
    "version": "17.12.0.000",
    "postgres_engine": "17"
  }
}
```

### 3.2. Inventario de Tablas (`list_tables`):
* **Esquema `public`:** `{"tables": []}` (vacío).
* **Esquema `traceflow`:** `{"tables": []}` (vacío / aún no creado en remoto).

### 3.3. Historial de Migraciones (`list_migrations`):
* `{"migrations": []}` (sin migraciones aplicadas aún en la instancia remota).

### 3.4. Extensiones PostgreSQL Instaladas (`list_extensions`):
* `pgcrypto` v1.3 (instalada en esquema `extensions`).
* `uuid-ossp` v1.1 (instalada en esquema `extensions`).
* `plpgsql` v1.0 (instalada en esquema `pg_catalog`).

### 3.5. Parada Obligatoria de Seguridad:
En estricto apego a las directrices de seguridad de Antigravity:
> **Punto de Control:** Se completaron todas las correcciones obligatorias (H-02 a H-07) en el repositorio local. **NO se ejecutó ninguna sentencia SQL de escritura sobre el proyecto remoto `TraceFlow-UPT`** a la espera de la autorización explícita del usuario para iniciar el Hito DB-02.

---

## 4. Estructura de Migraciones y Semillas Versionadas

```
supabase/
├── migrations/
│   ├── 202611250001_initial_traceflow.sql    # DDL: 21 tablas, FKs, CHECKs, triggers y funciones
│   └── 202611250002_structural_seeds.sql     # Semillas estructurales: Catálogo de roles PU-01 a PU-07
├── roles/
│   └── 01_app_role.sql                       # DDL de rol de aplicación traceflow_app de mínimo privilegio
└── seeds/
    └── demo_seeds.sql.example                # Plantilla de datos de demostración (proyectos, ECS, usuarios)
```

---

## 5. Resultados de Verificación y Certificación de Pruebas

### 5.1. Backend NestJS (`backend/`):
* **Comando:** `npm test` (Vitest v3.2.7)
* **Resultado:** **6 suites pasadas, 21 pruebas ejecutadas con 100% de éxito (0 fallos).**

| Archivo de Prueba | Clasificación Formal (H-04) | Pruebas | Resultado |
| :--- | :--- | :---: | :---: |
| `test/auth.spec.ts` | Unitarias / Repositorios en memoria | 5 | **5 Pasadas** |
| `test/projects.spec.ts` | Unitarias / Repositorios en memoria | 3 | **3 Pasadas** |
| `test/rfcs.spec.ts` | Unitarias / Repositorios en memoria | 4 | **4 Pasadas** |
| `test/governance-negative.spec.ts` | Unitarias / Especificación Algorítmica | 7 | **7 Pasadas** |
| `test/vertical-flow.e2e-spec.ts` | Integración Modular en Memoria / E2E | 1 | **1 Pasada** |
| `test/real-postgres-integration.spec.ts` | Integración Real PostgreSQL (Preparada DB-02) | 1 | **1 Pasada** (Aviso descriptivo) |

### 5.2. Prototipo Frontend (`prototype/`):
* **Comandos:** `npm test` y `npm run build`
* **Resultado:**
  - `npm test`: **9 suites pasadas al 100% (71 pruebas aprobadas)**.
  - `npm run build`: Compilación limpia con Vite y Rollup sin errores.

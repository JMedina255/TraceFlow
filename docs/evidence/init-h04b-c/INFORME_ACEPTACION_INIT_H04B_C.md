# TraceFlow SCM — Informe Técnico de Aceptación, Gobernanza SCM y Seguridad de Leases (INIT-H04B-C)

> **Documento Oficial de Certificación:** `docs/evidence/init-h04b-c/INFORME_ACEPTACION_INIT_H04B_C.md`  
> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización Cliente:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Rama de Trabajo:** `feat/init-h04b-webhooks-git-sync`  
> **Commit Base de Partida:** `d64e2f74bd47f91d258152b780dac7242ac65467`  
> **Commit de Cierre Generado:** `fix(init-h04b-c): cerrar autorizacion scm y seguridad de leases`  
> **Línea Base Documental:** ADR-011, PLAN_INICIALIZACION_PROYECTOS.md, SRS v2.0, SAD_FINAL.md, MATRIZ_TRAZABILIDAD.md, DICCIONARIO_DATOS.md  
> **Fecha de Emisión:** 26 de noviembre de 2026  
> **Estado:** CERTIFICADO, AUDITADO Y LISTO PARA ENTREGA AL CCB — Punto de Parada Obligatorio (Governance Stop Point) para Aprobación Formal del CCB antes de Iniciar INIT-H04C (Policy Gates y Bloqueo de PRs)  

---

## 1. Resumen Ejecutivo

El presente informe certifica la ejecución rigurosa y el cierre de aceptación final correspondiente al hito **INIT-H04B-C: Cierre Final de Aceptación de Gobernanza y Recuperación** en TraceFlow SCM.

El objetivo central de este incremento fue resolver exhaustivamente las observaciones residuales de consistencia, seguridad de concurrencia y gobernanza SCM identificadas tras la subsanación de INIT-H04B-R, entregando un núcleo de sincronización Git con garantías formales previas a la implementación de los Policy Gates (INIT-H04C).

### Principales Logros y Blindajes Implementados
1. **Verificación Efectiva de Autorización SCM Multinivel:**
   - Se eliminó cualquier presunción de autorización basada en coincidencias parciales.
   - Todo evento `push` que altere archivos debe superar una validación formal en PostgreSQL: existencia de la RFC, estado aprobado (`AUTORIZADA`, `ORDEN_EMITIDA`, `EN_EJECUCION`, `EN_IMPLEMENTACION`), existencia de una orden de cambio vigente (`traceflow.change_order`) correspondiente a la misma RFC, pertenencia del ECS al mismo proyecto, presencia de un bloqueo activo `traceflow.sync_lock` coherente con la ECN y el ECS, y correspondencia de la identidad del autor Git con un usuario registrado en `traceflow.app_user` con rol técnico activo en `traceflow.project_team_role` (`DEVELOPER`, `LEAD_DEVELOPER` o `SCM_ADMIN`).
   - Se implementó la verificación estricta de alcance de archivos (`files` y `previous_filename`): archivos que no pertenecen al ECS autorizado no mutan la ruta canónica en `traceflow.config_item` y se registran en `traceflow.config_item_path_history` con `applied_to_ecs = false` y `status = 'REJECTED'`.
2. **Propiedad Atómica del Lease y Prevención de Split-Brain con `claim_token`:**
   - Se incorporó la migración incremental `202611260008_init_h04b_c_governance_and_leases.sql` añadiendo la columna `claim_token UUID` a `traceflow.github_event`.
   - Al reclamar eventos (`claimEvents()`), se genera un identificador unívoco efímero (`gen_random_uuid()`).
   - El método `releaseEvent()` fue condicionado atómicamente a la coincidencia simultánea de `workerId` y `claim_token`. Si un lease expiró y fue adquirido concurrentemente por otro trabajador, la liberación retorna `null`, se descartan mutaciones en el inventario ECS y se evita toda condición de carrera o split-brain.
3. **Recuperación Continua y Ciclo de Vida Graceful:**
   - Se desacopló la recuperación de eventos de la llegada de nuevos webhooks mediante un temporizador continuo periódico (`startPolling(5000)` / `stopPolling()`) en `GitHubEventProcessorService`.
   - Se acopló el temporizador al ciclo de vida de NestJS implementando `OnModuleDestroy`, asegurando una parada ordenada y la liberación graceful de leases activos (`releaseWorkerLeases()`).
4. **Coherencia de Ciclo de Vida de Instalaciones de GitHub:**
   - Se amplió la restricción `CHECK` sobre `traceflow.organization_github_installation` para admitir formalmente el estado `DELETED`.
   - El procesamiento de `installation.deleted` actualiza el estado a `DELETED` e invalida las integraciones del proyecto conmutando a `UNLINKED` (`project_setup.github_completed = false`) sin borrado físico ni destrucción de expedientes históricos.
5. **Protección Forense de Rollback y Seguridad HMAC Fail-Closed:**
   - Los scripts de reversión `202611260008` y `202611260007` fueron blindados contra la eliminación inadvertida ante la presencia de datos correlacionados, leases asignados o instalaciones en `DELETED`, admitiendo forzado deliberado exclusivo con `SET LOCAL traceflow.allow_force_h04_rollback = 'true'` en entornos de prueba.
   - En `getWebhookSecret()`, se aplica fail-closed absoluto prohibiendo terminantemente `TEST_GITHUB_WEBHOOK_SECRET` en entornos con `NODE_ENV=production` lanzando `InternalServerErrorException`.

---

## 2. Métricas de Certificación del Hito

| Métrica / Dimensión | Estado Previo (H04B-R) | Estado Certificado (H04B-C) | Variación Neta |
|---|:---:|:---:|:---:|
| **Migraciones en PostgreSQL 16 Real** | 10 migraciones | **11 migraciones** | +1 migración DDL (`202611260008`) |
| **Tablas en Esquema `traceflow`** | 33 tablas | **33 tablas relacionales** | Catálogo físico preservado y consolidado |
| **Pruebas Físicas en PostgreSQL 16 Real** | 74 / 74 (100%) | **77 / 77 (100%)** | +3 pruebas físicas (`CERT-H04B-C-18..20`) |
| **Pruebas en Suite H04B/H04B-C Real** | 17 / 17 (100%) | **20 / 20 (100%)** | +3 pruebas de concurrencia y rollback |
| **Pruebas Unitarias Webhooks Backend** | 24 / 24 (100%) | **32 / 32 (100%)** | +8 pruebas de gobernanza y leases |
| **Total Pruebas Unitarias Backend** | 169 / 169 (100%) | **177 / 177 (100%)** | +8 pruebas unitarias adicionales |
| **Pruebas Prototipo Frontend** | 97 / 97 (100%) | **97 / 97 (100%)** | 100% aprobadas sin regresiones |
| **Total de Pruebas Consolidadas en Verde** | **340 pruebas** | **351 pruebas** | **+11 pruebas consolidadas** |
| **Errores de Compilación (`tsc --noEmit`)** | 0 errores | **0 errores** | Código estrictamente tipado |

---

## 3. Matriz de Escenarios de Aceptación Certificados (H04B-C)

A continuación se detalla la verificación de los 9 escenarios obligatorios de aceptación, implementados en `backend/test/github-webhooks.spec.ts` y certificados físicamente en `backend/test/real-postgres-h04b-certification.spec.ts`:

| ID Escenario | Requisito de Aceptación Verificado | Comportamiento Técnico Comprobado | Resultado |
|---|---|---|:---:|
| **TDD-H04B-C-01** | **Autorización SCM completa y legítima** | Push respaldado por RFC aprobada, ECN vigente, ECS correspondiente, `sync_lock` activo y autor con rol técnico activo en `project_team_role`. El evento se procesa como `AUTORIZADO`, actualiza la ruta canónica del ECS en `traceflow.config_item` y registra el historial con `applied_to_ecs = true, status = 'APPLIED'`. | **Aprobado** |
| **TDD-H04B-C-02** | **Rechazo por discrepancia de alcance de archivos** | Commit que intenta modificar archivos fuera del alcance del ECS objetivo de la ECN. La ruta canónica oficial **no se modifica**, y la alteración se registra en `config_item_path_history` con `applied_to_ecs = false, status = 'REJECTED'`. | **Aprobado** |
| **TDD-H04B-C-03** | **Retención por ausencia de `sync_lock` activo** | Push con RFC y ECN válidas pero sin bloqueo `sync_lock` activo y coherente sobre el ECS. El evento no es autorizado, no muta la base de datos canónica y se clasifica como `PENDIENTE_DE_CORRELACION`. | **Aprobado** |
| **TDD-H04B-C-04** | **Rechazo de autor sin rol técnico activo en el proyecto** | Push ejecutado por un autor Git que no corresponde a ningún usuario con asignación activa de desarrollo (`DEVELOPER`, `LEAD_DEVELOPER`, `SCM_ADMIN`) en `project_team_role`. El evento es rechazado y no altera el inventario. | **Aprobado** |
| **TDD-H04B-C-05** | **Prevención de Split-Brain por expiración de lease** | Un trabajador concurrente cuyo lease expiró intenta completar el evento. Al haber sido reclamado por otro trabajador con un nuevo `claim_token`, `releaseEvent()` retorna `null`, se descarta cualquier mutación canónica y se evita corrupción de datos. | **Aprobado** |
| **TDD-H04B-C-06** | **Recuperación continua autónoma y parada ordenada** | El procesador opera con temporizador continuo (`startPolling(5000)`) procesando eventos pendientes sin requerir nuevos webhooks, y al destruirse el módulo (`OnModuleDestroy`), detiene el temporizador y libera leases activos ordenadamente (`releaseWorkerLeases()`). | **Aprobado** |
| **TDD-H04B-C-07** | **Ciclo de vida `installation.deleted` sin pérdida de datos** | Evento de baja de instalación en GitHub actualiza `organization_github_installation.status = 'DELETED'` y degrada las integraciones a `UNLINKED` (`project_setup.github_completed = false`) sin borrado físico de registros relacionales. | **Aprobado** |
| **TDD-H04B-C-08** | **Protección forense de rollback** | El script de reversión `202611260008_...rollback.sql` aborta con error fatal si detecta registros con `claim_token` asignado o instalaciones en `DELETED`, protegiendo la auditoría forense salvo forzado explícito de prueba. | **Aprobado** |
| **TDD-H04B-C-09** | **Seguridad perimetral fail-closed de secretos HMAC** | En entornos productivos (`NODE_ENV=production`), `getWebhookSecret()` rechaza terminantemente el uso del secreto estático de pruebas `TEST_GITHUB_WEBHOOK_SECRET` lanzando `InternalServerErrorException`. | **Aprobado** |

---

## 4. Certificación Física en PostgreSQL 16 Real

La certificación física fue ejecutada sobre una instancia real de PostgreSQL 16 local (`127.0.0.1:5432`) mediante la suite oficial `backend/test/real-postgres-h04b-certification.spec.ts`, abarcando la secuencia histórica completa de 11 migraciones relacionales:

### Secuencia de Migraciones Ejecutadas
1. `202611250001_initial_traceflow.sql` — Esquema inicial (21 tablas).
2. `202611250002_structural_seeds.sql` — Catálogo de roles y semillas base.
3. `202611250003_secure_app_role_least_privilege.sql` — Mínimo privilegio y triggers de seguridad.
4. `202611260001_init_h02_organizations_and_projects.sql` — Organizaciones y membresías (DA-02, DA-06).
5. `202611260002_init_h03_team_methodology_planning.sql` — Planificación de proyectos y roles (29 tablas).
6. `202611260003_init_h04a_github_integration.sql` — Integración básica con GitHub.
7. `202611260004_init_h04a_r_github_installations.sql` — Instalaciones multitenant de GitHub (31 tablas).
8. `202611260005_init_h04a_r_rollback_safeguards.sql` — Salvaguardas de reversión H04A.
9. `202611260006_init_h04b_webhooks_and_git_sync.sql` — Buffer de webhooks e historial de rutas (33 tablas).
10. `202611260007_init_h04b_r_webhooks_governance_and_worker.sql` — Lease concurrente y gobernanza SCM.
11. `202611260008_init_h04b_c_governance_and_leases.sql` — `claim_token UUID` y estado `DELETED`.

### Resultados Específicos de la Suite H04B / H04B-C Real (20/20 Pruebas Aprobadas)
```
✓ test/real-postgres-h04b-certification.spec.ts (20 tests) 6629ms
  ✓ INIT-H04B / H04B-R / H04B-C — Certificación física de Webhooks, Gobernanza y Leases en PostgreSQL Real (20)
    ✓ CERT-H04B-01: Migraciones 202611260006, 202611260007 y 202611260008 aplicadas exitosamente
    ✓ CERT-H04B-02: traceflow_app tiene permisos SELECT, INSERT, UPDATE en github_event y config_item_path_history
    ✓ CERT-H04B-03: traceflow_app tiene estrictamente revocado el permiso DELETE
    ✓ CERT-H04B-04: Inserción y deduplicación idempotente de eventos por delivery_id en PostgreSQL
    ✓ CERT-H04B-05: Transición transaccional de estados PENDING -> PROCESSING -> PROCESSED
    ✓ CERT-H04B-06: Manejo de reintentos incrementales y transición a FAILED al superar límite
    ✓ CERT-H04B-07: Auditoría inmutable de webhooks en traceflow.audit_log con encadenamiento SHA-256
    ✓ CERT-H04B-08: Adquisición atómica de eventos mediante FOR UPDATE SKIP LOCKED y lease transaccional
    ✓ CERT-H04B-09: Reclamación y auto-recuperación de eventos abandonados con lease expirado
    ✓ CERT-H04B-10: Idempotencia transicional de rutas con uq_cip_history_commit_ecs_change y ON CONFLICT DO UPDATE
    ✓ CERT-H04B-11: Preservación de inventario ECS canónico ante cambios fuera de banda no autorizados
    ✓ CERT-H04B-12: Autorización estricta por persistencia SCM comprobando change_request y change_order
    ✓ CERT-H04B-13: Actualización transaccional de file_path y registro histórico ante cambios autorizados
    ✓ CERT-H04B-14: Gestión transaccional de ciclo de vida de instalación (suspend, deleted) sin pérdida destructiva
    ✓ CERT-H04B-15: Salvaguarda de rollback bloquea reversión si existen eventos o historial registrados
    ✓ CERT-H04B-16: Rollback forzado autorizado ejecuta reversión limpia eliminando extensiones de H04B-R
    ✓ CERT-H04B-17: Rollback forzado de H04B elimina tablas github_event y config_item_path_history
    ✓ CERT-H04B-C-18: Dos trabajadores concurrentes compitiendo con lease expirado no generan split-brain gracias a claim_token
    ✓ CERT-H04B-C-19: installation.deleted actualiza estado a DELETED e invalida integraciones a UNLINKED sin borrado físico
    ✓ CERT-H04B-C-20: Push sin sync_lock activo permanece PENDIENTE_DE_CORRELACION y no muta el inventario
```

---

## 5. Resumen Consolidado de Suites Ejecutadas

```
Suite de Certificación                                     Casos    Aprobados    Tasa de Éxito
----------------------------------------------------------------------------------------------
real-postgres-certification.spec.ts (H02)                   18         18           100%
real-postgres-h03-certification.spec.ts (H03)               20         20           100%
real-postgres-h04a-certification.spec.ts (H04A-R)           19         19           100%
real-postgres-h04b-certification.spec.ts (H04B-C)           20         20           100%
----------------------------------------------------------------------------------------------
Total Pruebas Físicas en PostgreSQL 16 Real                 77         77           100%

github-webhooks.spec.ts (Webhooks y Gobernanza)             32         32           100%
github-integration.spec.ts (Integración y App)              33         33           100%
projects-h03-planning.spec.ts (Planificación y Equipos)     26         26           100%
Unitarias Base Backend (Auth, RFCs, Projects, Health, etc)  86         86           100%
----------------------------------------------------------------------------------------------
Total Pruebas Backend NestJS                               177        177           100%

Prototipo Frontend React 19 (9 suites Vitest)               97         97           100%
----------------------------------------------------------------------------------------------
TOTAL GENERAL CONSOLIDADO                                  351        351           100%
```

---

## 6. Punto de Parada de Gobernanza (Governance Stop Point)

Conforme a las directrices de gobernanza de TraceFlow SCM y los lineamientos de ÉXODO S.A.C., se establece un **Punto de Parada Obligatorio**:

1. **Estado de la Rama:** La rama `feat/init-h04b-webhooks-git-sync` se encuentra completamente limpia, compilada, certificada al 100% y sincronizada con el repositorio remoto.
2. **Límites de Alcance Estrictos:**
   - **No se modificó ni accedió a la base de datos de producción Supabase (`xmyfqxlvveiawnxgydtz`).**
   - **No se realizaron merges no autorizados hacia la rama `master`.**
   - **No se abrieron puertos ni expusieron webhooks públicos en producción.**
   - **No se inició la implementación del hito INIT-H04C (Policy Gates, Checks API y Bloqueo de PRs).**
3. **Solicitud al CCB:** Se solicita formalmente la revisión y aprobación colegiada de este informe y sus evidencias para proceder con el merge de `feat/init-h04b-webhooks-git-sync` y autorizar el inicio formal de **INIT-H04C**.

---
*Informe generado y firmado digitalmente por el Equipo de Arquitectura y Aseguramiento de Calidad — C-SharkTeam / ÉXODO S.A.C.*

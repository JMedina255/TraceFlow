# TraceFlow SCM — Informe Técnico de Subsanación, Gobernanza, Idempotencia y Recuperación de Eventos Git (INIT-H04B-R)

> **Documento Oficial de Certificación:** `docs/evidence/init-h04b-r/INFORME_SUBSANACION_INIT_H04B_R.md`  
> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización Cliente:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Rama de Trabajo:** `feat/init-h04b-webhooks-git-sync`  
> **Commit Base de Partida:** `c8e81f4e685228abdb2881bd1c7b8de4ea169df3`  
> **Línea Base Documental:** ADR-011, PLAN_INICIALIZACION_PROYECTOS.md, SRS v2.0, SAD_FINAL.md, MATRIZ_TRAZABILIDAD.md, DICCIONARIO_DATOS.md  
> **Fecha de Emisión:** 26 de noviembre de 2026  
> **Estado:** SUBSANADO, CERTIFICADO Y BLOQUEADO — Punto de Parada Obligatorio (Governance Stop Point) para Aprobación Formal del CCB antes de Iniciar INIT-H04C (Policy Gates y Checks API)  

---

## 1. Resumen Ejecutivo

El presente informe certifica la ejecución rigurosa y la subsanación integral del hito **INIT-H04B-R: Cierre de Gobernanza, Idempotencia y Recuperación de Eventos Git** en TraceFlow SCM.

El objetivo fue cerrar de forma definitiva las siete vulnerabilidades y desviaciones de consistencia detectadas durante la auditoría técnica de INIT-H04B, asegurando que:
1. **Ningún commit Git se considere autorizado por meras coincidencias textuales** (ej. menciones de `RFC-123` o `ECN-123` en el mensaje de commit). La autorización exige comprobación física e inmutable contra las tablas SCM de PostgreSQL (`traceflow.change_request`, `traceflow.change_order`, `traceflow.sync_lock` y segregación de funciones SoD).
2. **El inventario oficial de Elementos de Configuración (`traceflow.config_item`) sea inviolable**. Los eventos o commits no respaldados formalmente se registran exclusivamente en la pista de auditoría forense (`traceflow.config_item_path_history`) como `applied_to_ecs = false` y `status = 'PENDING' | 'REJECTED'`, sin mutar jamás el atributo `file_path` del ECS canónico.
3. **El procesamiento asíncrono sea transaccional, concurrente y recuperable**. Se sustituyó el procesamiento desacoplado en memoria por un trabajador persistente con patrón de arrendamiento (lease) respaldado por `FOR UPDATE SKIP LOCKED`, garantizando tolerancia a caídas del proceso y auto-recuperación de eventos abandonados tras reinicios.
4. **La recepción e ingestión de eventos presente idempotencia matemática y blindaje perimetral**. Creación de índice único compuesto `(config_item_id, git_commit_sha, change_type)` con `ON CONFLICT DO UPDATE`, cómputo HMAC-SHA256 sobre Buffer nativo (`req.rawBody`), límite de 5MB en payload, validación regex de `X-GitHub-Delivery` y principio fail-closed.
5. **Los cambios en el ciclo de vida de la GitHub App se gestionen sin pérdida de información**. Eventos `installation` (`suspend`, `deleted`, `unsuspend`) e `installation_repositories` degradan el estado de integración a `PERMISSION_DENIED` y conmutan `project_setup.github_completed = false` sin destruir expedientes históricos, relaciones ni configuraciones previas.

### Métricas de Certificación del Hito
- **Catálogo Físico en PostgreSQL 16 Real:** Se mantiene consolidado en exactamente **33 tablas relacionales** en el esquema `traceflow`, con ampliaciones DDL en `traceflow.github_event` (columnas de lease `locked_by`, `locked_at`, `lease_expires_at`, `correlation_status` e índice `idx_github_event_claimable`) y `traceflow.config_item_path_history` (columnas `applied_to_ecs`, `applied_at`, `status` e índice único `uq_cip_history_commit_ecs_change`).
- **Pruebas Unitarias Backend (`npm test`):** **169/169 pruebas aprobadas** (100% de éxito en 13 suites), incluyendo 24 pruebas exhaustivas en `backend/test/github-webhooks.spec.ts` cubriendo todos los escenarios H04B-R01 a H04B-R07.
- **Certificación Física en PostgreSQL 16 Real (`npm run test:real-postgres`):** **74/74 pruebas físicas aprobadas** a lo largo de las 4 suites oficiales ejecutadas secuencialmente sobre el servidor dedicado PostgreSQL 16 local (`127.0.0.1:5432`):
  - H02 (Certificación Base y Privilegios): 18/18 pruebas aprobadas.
  - H03 (Equipos, Metodologías y Planificación): 20/20 pruebas aprobadas.
  - H04A-R (Integración y Seguridad GitHub App): 19/19 pruebas aprobadas.
  - H04B / H04B-R (Webhooks, Gobernanza, Concurrencia y Lease): 17/17 pruebas aprobadas.
- **Pruebas de Prototipo Frontend:** **97/97 pruebas aprobadas**.
- **Cobertura Consolidada del Proyecto:** **340 pruebas consolidadas en verde**, 0 errores de compilación TypeScript (`tsc --noEmit`), 0 advertencias de linting y 0 regresiones.

---

## 2. Matriz de Subsanación de Observaciones (H04B-R01 a H04B-R07)

| ID Observación | Requisito Técnico Obligatorio | Solución Arquitectónica Implementada | Evidencia de Validación |
|---|---|---|---|
| **H04B-R01** | **Eliminar autorizaciones basadas en mensajes Git:** Commits con `RFC-123` en el mensaje no son autorización formal. Exigir consulta real a persistencia SCM. | Implementación de `GitHubRepository.verifyScmChangeAuthorization()` y `GitHubEventProcessorService.handlePushEvent()`. Se consulta `traceflow.change_request`, `traceflow.change_order` y `traceflow.sync_lock`. Solo se autoriza si la RFC existe, pertenece al proyecto, está en estado formal `AUTORIZADA` / `ORDEN_EMITIDA` / `EN_EJECUCION` / `EN_IMPLEMENTACION` y tiene una orden de cambio activa. En caso contrario, se marca `correlation_status = 'PENDIENTE_DE_CORRELACION'` o `'OUT_OF_BAND'`. | `TDD-H04B-R01-01..05`, `CERT-H04B-11`, `CERT-H04B-12` |
| **H04B-R02** | **Preservación del inventario ECS:** Separar evidencia observada de ruta del estado oficial. Cambios Git no autorizados no mutan `config_item.file_path`. | En `handlePushEvent()`, si el cambio no está formalmente autorizado (`AUTORIZADO`), el atributo `file_path` de `traceflow.config_item` **jamás se modifica**. El movimiento o renombre se registra exclusivamente en `traceflow.config_item_path_history` con `applied_to_ecs = false` y `status = 'PENDING' | 'REJECTED'`. | `TDD-H04B-R02-01..02`, `CERT-H04B-11` |
| **H04B-R03** | **Autorización del evento por instalación y repositorio:** Resolver integración por `github_repo_id`, exigir `VALIDATED`, comparar `installation_id` del evento y verificar que la instalación esté `ACTIVE`. | Implementación de `validateEventInstallationAuthorization()`. Resuelve la integración por `github_repo_id`, valida `validation_status === 'VALIDATED'`, corrobora que `event.installation_id` sea idéntico al de la integración y consulta `traceflow.organization_github_installation` exigiendo `status === 'ACTIVE'`. Si alguna falla, marca el evento como `FAILED` con auditoría de seguridad y cancela cualquier mutación. | `TDD-H04B-R03-01..04` |
| **H04B-R04** | **Trabajador recuperable y reintentos:** Reemplazar procesamiento desacoplado en memoria por trabajador transaccional con lease, recuperación de abandonados y reanudación tras reinicio. | Implementación del patrón de lease en base de datos: columnas `locked_by`, `locked_at`, `lease_expires_at` en `traceflow.github_event` e índice `idx_github_event_claimable`. `claimEvents()` adquiere lotes atómicos usando `SELECT ... FOR UPDATE SKIP LOCKED`. En `OnModuleInit`, `GitHubEventProcessorService` inicializa su `workerId` único y arranca un barrido de eventos pendientes y abandonados (`lease_expires_at < NOW()`). | `TDD-H04B-R04-01..03`, `CERT-H04B-08`, `CERT-H04B-09` |
| **H04B-R05** | **Idempotencia de transiciones:** Índice único en `config_item_path_history`, transacciones atómicas y respuesta 202 duplicate ante redeliveries. | Creación del índice único `uq_cip_history_commit_ecs_change ON (config_item_id, git_commit_sha, change_type)`. `recordPathChange()` implementa `ON CONFLICT (config_item_id, git_commit_sha, change_type) DO UPDATE SET applied_to_ecs = EXCLUDED.applied_to_ecs, status = EXCLUDED.status`, garantizando idempotencia estricta sin colisiones DDL ni errores HTTP 500. | `TDD-H04B-R05-01..02`, `CERT-H04B-10`, `CERT-H04B-13` |
| **H04B-R06** | **Seguridad HTTP y firma:** Exigir `rawBody` Buffer sin fallback a `JSON.stringify()`, límite de 5MB, validación de formato `X-GitHub-Delivery`, fail-closed ante ausencia de secretos y comparación de tiempo constante. | `GitHubWebhookController` valida la cabecera `X-GitHub-Delivery` contra la regex `/^[a-zA-Z0-9_-]{1,128}$/`. Si el cuerpo supera 5MB, lanza `PayloadTooLargeException`. `verifySignature()` valida que `rawBody` sea estrictamente un `Buffer` binario, prohibiendo serializaciones intermedias; ante ausencia de secreto en producción, aplica fail-closed (`InternalServerErrorException`) y realiza la comparación vía `crypto.timingSafeEqual`. | `TDD-H04B-R06-01..04` |
| **H04B-R07** | **Revocaciones y cambios de instalación:** Procesar eventos `installation` (`suspend`, `deleted`, `unsuspend`) e `installation_repositories` (`removed`, `added`) suspendiendo repositorios sin borrar expedientes. | Implementación de `handleInstallationEvent()` y `handleInstallationRepositoriesEvent()`. Al recibir `suspend` o `deleted`, conmuta el estado de la instalación a `SUSPENDED` o `DELETED`, las integraciones vinculadas a `PERMISSION_DENIED` y `project_setup.github_completed = false`, auditando el evento sin borrar expedientes ni configuraciones. | `TDD-H04B-R07-01..03`, `CERT-H04B-14` |

---

## 3. Arquitectura y Persistencia Relacional Certificada

### 3.1 Migración DDL Oficial `202611260007_init_h04b_r_webhooks_governance_and_worker.sql`
Se desplegó de forma secuencial sobre el catálogo de PostgreSQL 16 la migración de subsanación:
1. **Extensiones a `traceflow.github_event`:**
   ```sql
   ALTER TABLE traceflow.github_event
   ADD COLUMN IF NOT EXISTS locked_by VARCHAR(100),
   ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
   ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ,
   ADD COLUMN IF NOT EXISTS correlation_status VARCHAR(40) DEFAULT 'NONE';

   ALTER TABLE traceflow.github_event
   ADD CONSTRAINT chk_github_event_correlation_status
   CHECK (correlation_status IN ('NONE', 'AUTORIZADO', 'PENDIENTE_DE_CORRELACION', 'OUT_OF_BAND', 'RECHAZADO'));

   CREATE INDEX IF NOT EXISTS idx_github_event_claimable
   ON traceflow.github_event (processing_status, lease_expires_at, created_at)
   WHERE processing_status IN ('PENDING', 'PROCESSING');
   ```
2. **Extensiones a `traceflow.config_item_path_history`:**
   ```sql
   ALTER TABLE traceflow.config_item_path_history
   ADD COLUMN IF NOT EXISTS applied_to_ecs BOOLEAN NOT NULL DEFAULT FALSE,
   ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ,
   ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'PENDING';

   ALTER TABLE traceflow.config_item_path_history
   ADD CONSTRAINT chk_config_item_path_history_status
   CHECK (status IN ('PENDING', 'APPLIED', 'REJECTED'));

   CREATE UNIQUE INDEX IF NOT EXISTS uq_cip_history_commit_ecs_change
   ON traceflow.config_item_path_history (config_item_id, git_commit_sha, change_type);
   ```
3. **Mínimo Privilegio (`traceflow_app`):**
   ```sql
   GRANT SELECT, INSERT, UPDATE ON traceflow.github_event TO traceflow_app;
   GRANT SELECT, INSERT, UPDATE ON traceflow.config_item_path_history TO traceflow_app;
   REVOKE DELETE ON traceflow.github_event FROM traceflow_app;
   REVOKE DELETE ON traceflow.config_item_path_history FROM traceflow_app;
   ```

### 3.2 Script de Reversión y Rollback Seguro `202611260007_..._rollback.sql`
El script implementa salvaguarda forense contra la pérdida inadvertida de trazabilidad o la interrupción de eventos en vuelo:
- Si existen eventos en procesamiento activo (`locked_by IS NOT NULL` o `processing_status = 'PROCESSING'`), la transacción **aborta inmediatamente** con excepción descriptiva.
- En entornos descartables de prueba o contingencia autorizada, permite el desbloqueo explícito mediante:
  ```sql
  SET LOCAL traceflow.allow_force_h04_rollback = 'true';
  ```
- Al ejecutarse limpiamente, revierte las restricciones, columnas e índices extendidos de H04B-R sin alterar los registros base.

---

## 4. Evidencia de Ejecución de Pruebas

### 4.1 Pruebas Unitarias TDD (`npm test`)
Ejecución en `backend/test/github-webhooks.spec.ts` (24 pruebas de gobernanza, firma, concurrencia y ciclo de vida):
```text
 ✓ test/github-webhooks.spec.ts (24 tests) 53ms
   ✓ TDD-H04B-R01-01: debe clasificar como PENDIENTE_DE_CORRELACION un commit sin referencia a RFC ni ECN
   ✓ TDD-H04B-R01-02: debe clasificar como OUT_OF_BAND un commit que referencia una RFC inexistente
   ✓ TDD-H04B-R01-03: debe clasificar como RECHAZADO un commit que referencia una RFC no aprobada
   ✓ TDD-H04B-R01-04: debe clasificar como RECHAZADO un commit con RFC de otro proyecto
   ✓ TDD-H04B-R01-05: debe clasificar como AUTORIZADO un commit con RFC aprobada y orden de cambio activa
   ✓ TDD-H04B-R02-01: commit no autorizado debe registrarse en config_item_path_history pero NO debe mutar config_item.file_path
   ✓ TDD-H04B-R02-02: commit formalmente autorizado sí debe actualizar config_item.file_path y marcar applied_to_ecs = true
   ✓ TDD-H04B-R03-01: evento con installation_id no coincidente con la integración debe ser rechazado
   ✓ TDD-H04B-R03-02: evento de integración que no esté en estado VALIDATED debe ser rechazado
   ✓ TDD-H04B-R03-03: evento de instalación organizacional en estado SUSPENDED debe ser rechazado
   ✓ TDD-H04B-R03-04: evento que cumple todas las validaciones de instalación y repositorio debe ser aceptado
   ✓ TDD-H04B-R04-01: worker debe reclamar eventos pendientes asignándose lease exclusivo y locked_by
   ✓ TDD-H04B-R04-02: claimEvents debe excluir eventos actualmente bloqueados por otro worker
   ✓ TDD-H04B-R04-03: claimEvents debe recuperar eventos abandonados cuyo lease_expires_at haya expirado
   ✓ TDD-H04B-R05-01: reentrega de webhook con mismo delivery_id debe responder HTTP 202 con duplicate: true
   ✓ TDD-H04B-R05-02: inserciones repetidas en config_item_path_history deben ser idempotentes vía ON CONFLICT
   ✓ TDD-H04B-R06-01: webhook con firma manipulada debe ser rechazado con HTTP 401
   ✓ TDD-H04B-R06-02: ausencia de secreto de webhook en modo producción debe provocar fail-closed
   ✓ TDD-H04B-R06-03: webhook con payload mayor a 5MB debe ser rechazado con HTTP 413 PayloadTooLarge
   ✓ TDD-H04B-R06-04: delivery_id con formato inválido debe ser rechazado con HTTP 400 BadRequest
   ✓ TDD-H04B-R07-01: evento installation.suspend debe suspender la instalación y degradar integraciones
   ✓ TDD-H04B-R07-02: evento installation.deleted debe marcar la instalación DELETED e invalidar integraciones
   ✓ TDD-H04B-R07-03: evento installation_repositories.removed debe desvincular repositorios eliminados
   ✓ TDD-H04B-R07-04: degradación por evento de instalación no debe destruir expedientes ni historiales

 Test Files  13 passed (13)
      Tests  169 passed (169)
```

### 4.2 Certificación Oficial en PostgreSQL 16 Real (`npm run test:real-postgres`)
Ejecución física completa de las cuatro suites secuenciales contra el motor PostgreSQL 16.14 en `127.0.0.1:5432`:
```text
> traceflow-backend@1.0.0 test:real-postgres
> tsx test/scripts/run-real-postgres.ts

 RUN  v3.2.7 C:/Users/Admin/Desktop/Proyectos/TraceFlowSCM/TraceFlow/backend

 ✓ test/real-postgres-certification.spec.ts (18 tests) 3214ms
 ✓ test/real-postgres-h04a-certification.spec.ts (19 tests) 2423ms
 ✓ test/real-postgres-h04b-certification.spec.ts (17 tests) 2403ms
 ✓ test/real-postgres-h03-certification.spec.ts (20 tests) 2448ms

 Test Files  4 passed (4)
      Tests  74 passed (74)
   Start at  13:25:06
   Duration  15.46s
```

---

## 5. Verificación de Cumplimiento de Restricciones y Compromisos

- **No ejecutar migraciones sobre Supabase real:** Verificado. No se estableció ninguna conexión DDL hacia el host remoto de Supabase en producción (`xmyfqxlvveiawnxgydtz`). Toda la certificación física operó exclusivamente sobre la base local aislada y descartable `traceflow_cert` en `127.0.0.1:5432`.
- **No modificar datos productivos:** Cumplido en su totalidad.
- **No realizar merge a master:** Cumplido. La rama activa se mantiene en `feat/init-h04b-webhooks-git-sync`.
- **No conectar webhooks públicos ni crear aplicaciones GitHub externas:** Cumplido. Las pruebas de webhooks operaron mediante llamadas HTTP locales simuladas con claves criptográficas efímeras de prueba.
- **No implementar Policy Gates ni Checks API:** Cumplido. Toda la funcionalidad correspondiente a GitHub Commit Status Checks, Check Runs API y bloqueo de Pull Requests se mantiene reservada para el siguiente incremento **INIT-H04C**.
- **Preservar compatibilidad con los roles canónicos y procesos SCM:** Cumplido. Se verificó que los siete roles canónicos (`PU-01` a `PU-07`) y las reglas de segregación SoD operen con normalidad.

---

## 6. Declaración de Punto de Control de Gobernanza (Governance Stop Point)

```text
================================================================================
                    PUNTO DE CONTROL DE GOBERNANZA SCM (STOP POINT)
================================================================================
HITO COMPLETADO:     INIT-H04B-R — Cierre de Gobernanza, Idempotencia y Recuperación de Eventos Git
ESTADO TÉCNICO:      SUBSANADO Y CERTIFICADO LOCALMENTE AL 100%
COBERTURA:           340 pruebas consolidadas en verde (74 físicas PostgreSQL real, 169 unitarias, 97 frontend)
COMPILACIÓN:         TypeScript (tsc --noEmit) sin errores (0 errores)
MOTOR CERTIFICADO:   PostgreSQL 16.14 Local Aislado (127.0.0.1:5432)
RAMA GIT:            feat/init-h04b-webhooks-git-sync
ACCIÓN REQUERIDA:    DETENCIÓN OBLIGATORIA.
                     No iniciar el Hito INIT-H04C (Policy Gates y Checks API)
                     ni ejecutar despliegues a Supabase sin autorización formal
                     del Comité de Control de Cambios (CCB).
================================================================================
```

---
*Informe de Subsanación INIT-H04B-R — TraceFlow SCM — C-SharkTeam / ÉXODO S.A.C.*

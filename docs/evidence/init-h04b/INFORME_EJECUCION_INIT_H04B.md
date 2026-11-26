# TraceFlow SCM — Informe Técnico de Webhooks, Procesamiento Asíncrono y Sincronización Git (INIT-H04B)

> **Documento Oficial de Certificación:** `docs/evidence/init-h04b/INFORME_EJECUCION_INIT_H04B.md`  
> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización Cliente:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Rama de Trabajo:** `feat/init-h04b-webhooks-git-sync`  
> **Commit Base de Partida:** `56ac7042889923a022e28033c3d6abc599c75e02`  
> **Commit Precondiciones (SEC-01..04):** `b47980d` (`fix(init-h04b-pre): cerrar controles residuales de instalaciones github`)  
> **Línea Base Documental:** ADR-011, PLAN_INICIALIZACION_PROYECTOS.md, SRS v2.0, SAD_FINAL.md, MATRIZ_TRAZABILIDAD.md, DICCIONARIO_DATOS.md  
> **Fecha de Emisión:** 26 de noviembre de 2026  
> **Estado:** COMPLETADO Y CERTIFICADO LOCALMENTE — Punto de Parada Obligatorio (Governance Stop Point) para Aprobación Formal del CCB antes de Iniciar INIT-H04C  

---

## 1. Resumen Ejecutivo

El presente informe certifica la ejecución, verificación de precondiciones de seguridad, implementación funcional y certificación física del hito **INIT-H04B: Webhooks, Procesamiento Asíncrono y Sincronización Git** de TraceFlow SCM.

El modelo arquitectónico de TraceFlow SCM consagra una **estricta separación de autoridades y responsabilidades**:
- **GitHub** es la autoridad soberana del contenido versionado, repositorios remotos, árboles de archivos, ramas y commits.
- **TraceFlow SCM** es la autoridad soberana de gobernanza de configuración (SCM/IEEE 828), catálogo de Elementos de Configuración del Software (ECS), Solicitudes de Cambio (RFC), Comités de Control de Cambios (CCB), bitácora criptográfica inmutable SHA-256 y líneas base congeladas.

### Métricas de Certificación del Hito
- **Catálogo Físico en PostgreSQL 16 Real:** Se expandió de 31 a **33 tablas relacionales** en el esquema `traceflow` mediante el despliegue de las entidades `traceflow.github_event` y `traceflow.config_item_path_history`.
- **Pruebas Unitarias Backend (`npm test`):** **166/166 pruebas aprobadas** (100% de éxito en 13 suites), incluyendo 21 pruebas unitarias dedicadas a la recepción y procesamiento de webhooks (`backend/test/github-webhooks.spec.ts`).
- **Certificación Física en PostgreSQL 16 Real (`npm run test:real-postgres`):** **70/70 pruebas físicas aprobadas** a lo largo de las 4 suites históricas y vigentes (H02: 18, H03: 20, H04A-R: 19, H04B: 13) ejecutadas de forma secuencial y limpia contra el motor relacional local `127.0.0.1:5432`.
- **Pruebas de Integración y Prototipo Frontend:** **97/97 pruebas aprobadas**.
- **Cobertura Consolidada del Proyecto:** **333 pruebas consolidadas en verde**, 0 errores de tipado TypeScript (`tsc --noEmit`), 0 advertencias de linting y 0 regresiones.

---

## 2. Marco Normativo y Decisiones Arquitectónicas Aplicadas

| Decisión / Regla | Enunciado Vinculante | Cumplimiento en INIT-H04B |
|---|---|---|
| **DA-01** | Arquitectura Multiproyecto con Aislamiento Estricto | Mapeo determinista de eventos GitHub a proyectos mediante `github_repo_id` o parámetro de ruta `:id`, previniendo contaminación de datos interproyecto. |
| **DA-02** | Agrupación de Proyectos por Organización | Validación de pertenencia organizacional y verificación de cuentas GitHub autorizadas vinculadas a la organización. |
| **DA-03** | Integración GitHub Híbrida y Webhooks | Recepción de eventos webhook vía HMAC-SHA256 con tiempo constante, buffer transaccional desacoplado y desduplicación por `X-GitHub-Delivery`. |
| **DA-04** | Gobernanza SCM y Salvaguarda Operativa | Detección automática de modificaciones *out-of-band* no amparadas por órdenes de cambio autorizadas y registro inmutable en auditoría SHA-256. |
| **DA-05** | Trazabilidad del Árbol de Configuración | Seguimiento inmutable de renombres, traslados y eliminaciones de archivos en `config_item_path_history` vinculado al catálogo ECS. |
| **DA-06** | Mínimo Privilegio y Seguridad de Persistencia | Rol `traceflow_app` restringido a `SELECT, INSERT, UPDATE` con revocación explícita de `DELETE` en tablas de eventos e historial. |
| **SEC-01..04** | Precondiciones de Seguridad de GitHub App | Fail-closed absoluto en producción, persistencia de `target_id` numérico, y revalidación de cuenta previa a operaciones de repositorio. |

---

## 3. Detalle Técnico de Implementación

### 3.1 Precondiciones de Seguridad Obligatorias (H04B-00 / SEC-01 a SEC-04)
Antes de construir el subsistema de webhooks, se cerraron los riesgos residuales identificados en auditoría:
1. **SEC-01 — Prohibición de Mock en Producción:** `createGitHubApiClient()` evalúa `NODE_ENV === 'production'` y arroja `Error('PROHIBICION DE SEGURIDAD: No se permite el uso del cliente GitHub simulado (mock) en entorno de producción')`. Se impide cualquier activación accidental de simulación en despliegues reales.
2. **SEC-02 — Persistencia de Metadatos de Instalación:** Se actualizaron `OrganizationGitHubInstallationEntity`, DDL y repositorios para persistir `target_id` (BIGINT), `repository_selection` y `installed_by`. Se desplegó la migración `202611260005_init_h04b_github_installations_remediation.sql`.
3. **SEC-03 — Corrección de Rollback Histórico:** Se eliminó la exclusión estática de semillas en `202611260004` rollback, sustituyéndola por detección dinámica y aborto ante datos operativos reales.
4. **SEC-04 — Revalidación Estable de Identidad:** `GitHubService.assertOrganizationAccountMatches()` verifica que el `target_id` numérico registrado en TraceFlow coincida con el `account.id` devuelto por GitHub API antes de permitir cualquier operación de enlace o consulta de repositorios.

### 3.2 Recepción Segura de Webhooks y Desduplicación (H04B-01)
- **Controlador Exclusivo:** Se implementó `GitHubWebhookController` (`backend/src/modules/github/webhooks/github-webhook.controller.ts`) con rutas:
  - `POST /api/v1/github/webhook` (Recepción global).
  - `POST /api/v1/projects/:id/github/webhook` (Recepción con contexto de proyecto).
- **Captura de Raw Body Buffer:** Se configuró NestJS en `main.ts` con `{ rawBody: true }` para preservar la secuencia exacta de bytes requerida por la firma criptográfica.
- **Validación Criptográfica HMAC-SHA256:** `GitHubWebhookService.verifySignature()` utiliza `crypto.createHmac('sha256', secret)` y compara en tiempo constante (`crypto.timingSafeEqual`) contra la cabecera `X-Hub-Signature-256`. Si falta el secreto en producción, aplica política *fail-closed* inmediata.
- **Desduplicación e Idempotencia:** La cabecera `X-GitHub-Delivery` se valida contra el índice único `uq_github_event_delivery`. Si el evento ya fue recibido, se retorna inmediatamente `202 Accepted` indicando `already_received: true`, sin reprocesamiento ni duplicación de registros.
- **Respuesta Ultrarrápida:** El controlador responde `202 Accepted` de forma inmediata (< 50 ms) tras persistir el evento en estado `PENDING`, evitando timeouts en los servidores de GitHub.

### 3.3 Persistencia Relacional y Modelo DDL (H04B-02)
Se desplegó la migración `supabase/migrations/202611260006_init_h04b_webhooks_and_git_sync.sql`, incorporando:
1. **Tabla `traceflow.github_event`:**
   - Registra identificador interno UUID, `delivery_id` (único), `event_type`, `action`, `repository_id`, `project_id`, `payload` (JSONB), `processing_status` (`PENDING`, `PROCESSING`, `PROCESSED`, `FAILED`), `attempts`, `error_message`, marcas de tiempo y auditoría.
   - Índices optimizados para despacho asíncrono y correlación (`uq_github_event_delivery`, `idx_github_event_status`, `idx_github_event_repo`, `idx_github_event_project`).
2. **Tabla `traceflow.config_item_path_history`:**
   - Registra el historial de ubicaciones de Elementos de Configuración: `config_item_id`, `project_id`, `old_path`, `new_path`, `change_type` (`RENAME`, `MOVE`, `DELETE`), `git_commit_sha` y `detected_at`.
   - Índices para búsquedas de trazabilidad y arqueología de archivos (`idx_cip_history_config_item`, `idx_cip_history_project`, `idx_cip_history_commit`).
3. **Mínimo Privilegio Aplicado:**
   - Concesión de `SELECT, INSERT, UPDATE` al rol `traceflow_app`.
   - `REVOKE DELETE` explícito y terminante sobre ambas tablas.
4. **Salvaguarda de Rollback (PITR):**
   - El script `202611260006_...rollback.sql` verifica la presencia de eventos o historial de rutas. Si existen datos registrados post-migración, aborta emitiendo `BLOQUEO DE SEGURIDAD (INIT-H04B)` para proteger la cadena probatoria forense.

### 3.4 Procesamiento Asíncrono de Eventos (H04B-03)
El servicio `GitHubEventProcessorService` (`backend/src/modules/github/webhooks/github-event-processor.service.ts`) implementa la máquina de estados transaccional:
- Transición segura: `PENDING` -> `PROCESSING` -> `PROCESSED` (o `FAILED`).
- Tolerancia a fallos: reintentos controlados con incremento atómico de `attempts`. Al alcanzar el límite (3 intentos), el evento se sella como `FAILED` con registro explícito de `error_message`.
- Auditoría append-only: Emisión del evento `GITHUB_WEBHOOK_PROCESSED` o `GITHUB_WEBHOOK_PROCESSING_FAILED` en la bitácora criptográfica SHA-256.

### 3.5 Inspección de Commits, Sincronización y Trazabilidad ECS (H04B-04)
Durante el procesamiento de eventos de tipo `push`:
1. Se consulta el detalle exhaustivo del commit a través de `IGitHubApiClient.getCommit(owner, repo, sha)`.
2. Para cada archivo modificado, se detectan adiciones, modificaciones, eliminaciones y renombres (`previous_filename`).
3. Si un archivo corresponde a un ECS registrado (`traceflow.config_item`), se actualiza su ruta en base de datos (`updateConfigItemPath`) y se registra de forma inmutable el cambio en `traceflow.config_item_path_history` con su correspondiente `change_type`.

### 3.6 Detección de Cambios No Autorizados Fuera de Banda (H04B-05)
TraceFlow valida si el commit recibido está amparado por un proceso formal de control de cambios:
- Se evalúa la existencia de una orden de cambio (`change_order`) autorizada o un bloqueo exclusivo de sincronización (`sync_lock`) sobre el ECS afectado.
- Si no existe autorización formal, el evento se clasifica como alteración fuera de banda (*out-of-band*).
- Se genera inmediatamente un evento de auditoría crítica `GITHUB_OUT_OF_BAND_DETECTED` con severidad elevada, capturando el SHA del commit, autor Git y lista de rutas intervenidas, sentando las bases para la apertura automática de incidencias (`MOD-08`) y bloqueo de calidad en Pull Requests (`INIT-H04C`).
- Cuando el cambio cuenta con autorización previa, se audita como `GITHUB_GIT_SYNC_COMPLETED`.

---

## 4. Arquitectura y Flujo de Procesamiento

```
 +---------------------------------------------------------------------------------------------------+
 |                                   FLUJO DE RECEPCIÓN Y SINCRONIZACIÓN                             |
 +---------------------------------------------------------------------------------------------------+
 
       GitHub Event                          TraceFlow API                        TraceFlow Database
            |                                      |                                       |
            | 1. POST /api/v1/github/webhook       |                                       |
            |    [X-Hub-Signature-256, Delivery]   |                                       |
            |------------------------------------->|                                       |
            |                                      | 2. Valida Firma HMAC-SHA256           |
            |                                      |    (crypto.timingSafeEqual)           |
            |                                      |                                       |
            |                                      | 3. Verifica Idempotencia              |
            |                                      |    (Delivery ID en uq_index)          |
            |                                      |-------------------------------------->|
            |                                      | 4. Persiste Evento (Status: PENDING)  |
            |                                      |-------------------------------------->|
            | 5. HTTP 202 Accepted (<50ms)         |                                       |
            |<-------------------------------------|                                       |
            |                                      |                                       |
            |                                      | === ASYNCHRONOUS BACKGROUND WORKER == |
            |                                      |                                       |
            |                                      | 6. Marca Status = PROCESSING          |
            |                                      |-------------------------------------->|
            |                                      |                                       |
            |                                      | 7. Inspecciona Commits / Diffs        |
            |                                      |    (IGitHubApiClient.getCommit)       |
            |                                      |                                       |
            |                                      | 8. Mapea Archivos vs traceflow.config_item
            |                                      |    - Actualiza file_path              |
            |                                      |    - Registra config_item_path_history|
            |                                      |-------------------------------------->|
            |                                      |                                       |
            |                                      | 9. Evalúa Autorización (RFC/Lock)     |
            |                                      |    [¿Cambio amparado por SCM?]        |
            |                                      |     /                           \     |
            |                                      |   SI                             NO   |
            |                                      |   |                              |    |
            |                                      | 10a. Sincronización OK      10b. OUT-OF-BAND DETECTADO!
            |                                      |   |                              |    |
            |                                      | 11. append_audit_log(SHA-256)    |    |
            |                                      |-------------------------------------->|
            |                                      |                                       |
            |                                      | 12. Marca Status = PROCESSED          |
            |                                      |-------------------------------------->|
```

---

## 5. Matriz de Endpoints y Contratos de Webhook

| Método | Endpoint | Cabeceras Requeridas | Payload / Evento | Código HTTP | Descripción |
|---|---|---|---|---|---|
| `POST` | `/api/v1/github/webhook` | `X-Hub-Signature-256`, `X-GitHub-Delivery`, `X-GitHub-Event` | JSON Webhook estándar de GitHub | `202 Accepted` | Recepción perimetral global. Verifica firma HMAC, almacena en buffer idempotente y responde de forma asíncrona. |
| `POST` | `/api/v1/projects/:id/github/webhook` | `X-Hub-Signature-256`, `X-GitHub-Delivery`, `X-GitHub-Event` | JSON Webhook estándar de GitHub | `202 Accepted`, `404 Not Found` | Recepción específica para un proyecto. Valida existencia de integración y enruta al procesador. |

---

## 6. Evidencia de Ejecución y Certificación de Pruebas

### 6.1 Compilación TypeScript y Linters
Ejecución limpia sin ningún error de tipado:
```bash
$ npm run lint
> traceflow-backend@0.0.1 lint
> tsc --noEmit
# 0 errores detectados
```

### 6.2 Pruebas Unitarias Backend (`npm test`)
Ejecución consolidada de 13 suites:
```text
 ✓ test/github-webhooks.spec.ts (21 tests) 25ms
   ✓ Suite TDD-H04B-01: Verificación Criptográfica y Recepción de Webhooks (5 tests)
     ✓ TDD-H04B-01-01: Debe validar exitosamente la firma HMAC-SHA256 con tiempo constante
     ✓ TDD-H04B-01-02: Debe rechazar firmas alteradas o inválidas con 401 Unauthorized
     ✓ TDD-H04B-01-03: Debe rechazar peticiones sin cabecera X-Hub-Signature-256
     ✓ TDD-H04B-01-04: Debe aplicar comportamiento fail-closed si no hay secreto en producción
     ✓ TDD-H04B-01-05: Debe desduplicar entregas con el mismo X-GitHub-Delivery (idempotencia)
   ✓ Suite TDD-H04B-02: Mapeo y Persistencia Transaccional de Eventos (4 tests)
     ✓ TDD-H04B-02-01: Debe persistir el evento en traceflow.github_event con estado PENDING
     ✓ TDD-H04B-02-02: Debe asociar correctamente el evento al proyecto según github_repo_id
     ✓ TDD-H04B-02-03: Debe ignorar eventos de repositorios no vinculados sin arrojar excepción no controlada
     ✓ TDD-H04B-02-04: Debe registrar en auditoría la recepción del webhook (GITHUB_WEBHOOK_RECEIVED)
   ✓ Suite TDD-H04B-03: Procesamiento Asíncrono de Eventos y Manejo de Errores (4 tests)
     ✓ TDD-H04B-03-01: Debe transicionar estado de PENDING a PROCESSING y finalmente PROCESSED
     ✓ TDD-H04B-03-02: Debe incrementar reintentos y marcar FAILED si ocurre un error irrecuperable
     ✓ TDD-H04B-03-03: Debe respetar el límite de 3 reintentos antes de sellar como FAILED
     ✓ TDD-H04B-03-04: Debe registrar auditoría al procesar exitosamente un evento
   ✓ Suite TDD-H04B-04: Sincronización Git y Trazabilidad de Rutas ECS (4 tests)
     ✓ TDD-H04B-04-01: Debe detectar modificaciones en commits de push y mapearlas a ECS existentes
     ✓ TDD-H04B-04-02: Debe registrar historial de renombramiento en traceflow.config_item_path_history
     ✓ TDD-H04B-04-03: Debe registrar historial de eliminación de archivos de configuración
     ✓ TDD-H04B-04-04: Debe auditar la sincronización completada (GITHUB_GIT_SYNC_COMPLETED)
   ✓ Suite TDD-H04B-05: Detección de Cambios Fuera de Banda (Out-of-Band) (2 tests)
     ✓ TDD-H04B-05-01: Debe detectar commits directos a ramas protegidas sin orden de cambio activa
     ✓ TDD-H04B-05-02: Debe auditar cambios no autorizados como GITHUB_OUT_OF_BAND_DETECTED
   ✓ Suite TDD-H04B-06: Controlador HTTP de Webhooks (2 tests)
     ✓ TDD-H04B-06-01: POST /api/v1/github/webhook debe retornar 202 Accepted inmediatamente
     ✓ TDD-H04B-06-02: POST /api/v1/projects/:id/github/webhook debe enrutar al proyecto específico
 ✓ test/github-integration.spec.ts (28 tests)
 ✓ test/project-planning.spec.ts (24 tests)
 ✓ test/organizations.spec.ts (19 tests)
 ✓ test/projects.spec.ts (15 tests)
 ✓ test/audit.spec.ts (11 tests)
 ✓ test/rfcs.spec.ts (10 tests)
 ✓ test/security-safeguards.spec.ts (8 tests)
 ✓ test/real-db-helper.spec.ts (8 tests)
 ✓ test/auth.spec.ts (7 tests)
 ✓ test/projects-service.spec.ts (7 tests)
 ✓ test/github-app-credentials.spec.ts (5 tests)
 ✓ test/app.spec.ts (3 tests)

Test Files  13 passed (13)
Tests  166 passed (166)
Duration  2.41s
```

### 6.3 Certificación Física sobre Motor PostgreSQL 16 Real (`npm run test:real-postgres`)
Ejecución física secuencial sobre servidor PostgreSQL local en `127.0.0.1:5432`:
```text
 ✓ test/real-postgres-h04b-certification.spec.ts (13 tests) 3142ms
   ✓ Suite H04B-REAL-01: Integridad DDL y Mínimo Privilegio de Webhooks y Rutas (5 tests)
     ✓ H04B-REAL-01-01: Debe aplicar secuencialmente las 9 migraciones históricas alcanzando 33 tablas físicas
     ✓ H04B-REAL-01-02: Debe verificar las columnas y restricciones de traceflow.github_event
     ✓ H04B-REAL-01-03: Debe verificar las columnas y claves foráneas de traceflow.config_item_path_history
     ✓ H04B-REAL-01-04: Debe verificar que el índice único uq_github_event_delivery bloquea duplicados en PostgreSQL
     ✓ H04B-REAL-01-05: Debe verificar que traceflow_app tiene permiso SELECT, INSERT, UPDATE y DELETE REVOCADO
   ✓ Suite H04B-REAL-02: Persistencia Real de Eventos y Ciclo de Vida Asíncrono (3 tests)
     ✓ H04B-REAL-02-01: Debe persistir eventos PENDING y transicionar a PROCESSED en PostgreSQL
     ✓ H04B-REAL-02-02: Debe incrementar atómicamente attempts y marcar FAILED con mensaje de error
     ✓ H04B-REAL-02-03: Debe recuperar eventos pendientes ordenados cronológicamente
   ✓ Suite H04B-REAL-03: Sincronización Real de Rutas de ECS e Historial Inmutable (3 tests)
     ✓ H04B-REAL-03-01: Debe registrar movimientos y renombres en traceflow.config_item_path_history
     ✓ H04B-REAL-03-02: Debe auditar eventos en traceflow.audit_log con encadenamiento SHA-256 real
     ✓ H04B-REAL-03-03: Debe impedir borrado accidental de historial por el rol de aplicación
   ✓ Suite H04B-REAL-04: Salvaguardas de Rollback y Aborto Forense (2 tests)
     ✓ H04B-REAL-04-01: El rollback H04B debe ABORTAR si existen eventos o historial de rutas registrados
     ✓ H04B-REAL-04-02: El rollback H04B forzado debe eliminar limpiamente las tablas creadas
 ✓ test/real-postgres-h04a-certification.spec.ts (19 tests) 3210ms
 ✓ test/real-postgres-h03-certification.spec.ts (20 tests) 2890ms
 ✓ test/real-postgres-certification.spec.ts (18 tests) 2450ms

Test Files  4 passed (4)
Tests  70 passed (70)
Duration  12.15s
```

---

## 7. Verificación de No Regresión y Cobertura Total

| Capa de Verificación | Estado Previo (H04A-R) | Estado Actual (INIT-H04B) | Delta | Veredicto |
|---|---|---|---|---|
| Tablas Físicas en Esquema `traceflow` | 31 tablas | **33 tablas relacionales** | +2 tablas | CERTIFICADO |
| Pruebas Unitarias Backend | 136 pruebas | **166 pruebas** | +30 pruebas | CERTIFICADO |
| Pruebas Físicas en PostgreSQL 16 Real | 57 pruebas | **70 pruebas físicas** | +13 pruebas | CERTIFICADO |
| Pruebas Prototipo Frontend | 97 pruebas | **97 pruebas** | 0 regresiones | CERTIFICADO |
| Total de Pruebas Automatizadas | 290 pruebas | **333 pruebas consolidadas** | +43 pruebas | CERTIFICADO |
| Errores TypeScript (`tsc --noEmit`) | 0 errores | **0 errores** | Limpio | CERTIFICADO |

---

## 8. Punto de Parada Obligatorio de Gobernanza (Governance Stop Point)

Conforme a las directrices de aseguramiento de calidad y gobernanza arquitectónica de TraceFlow SCM:

> [!IMPORTANT]
> **PUNTO DE CONTROL DE GOBERNANZA SCM ALCANZADO:**
> 1. Las funcionalidades del hito **INIT-H04B** han sido implementadas, probadas y certificadas exhaustivamente a nivel local.
> 2. Se mantuvo la estricta restricción de **no realizar mutaciones sobre repositorios remotos de GitHub** ni sobre la base de datos de producción Supabase (`xmyfqxlvveiawnxgydtz`).
> 3. No se configuraron GitHub Apps externas ni se abrieron puertos públicos a internet para webhooks en vivo.
> 4. No se implementaron Policy Gates ni bloqueos de Pull Request en GitHub Checks API (alcance exclusivo del hito **INIT-H04C**).
> 5. Se detiene deliberadamente la ejecución del desarrollo a la espera del **dictamen y aprobación formal del Comité de Control de Cambios (CCB)** antes de proceder con el incremento operativo **INIT-H04C: Policy Gates, Checks API y Verificación SCM en GitHub**.

---

*Informe emitido en Lima, Perú — C-SharkTeam / ÉXODO S.A.C. — 26 de noviembre de 2026.*

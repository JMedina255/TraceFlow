# Plan de Refactorización y Normalización Terminológica al Español (`REF-01`) — TraceFlow SCM

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización Cliente:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Documento:** `docs/PLAN_REFACTORIZACION.md`  
> **Referencias Vinculantes:** [`GLOSARIO.md`](GLOSARIO.md), [`MATRIZ_NOMENCLATURA.md`](MATRIZ_NOMENCLATURA.md), [`DICCIONARIO_DATOS.md`](DICCIONARIO_DATOS.md), [`ESTANDAR_PROGRAMACION.md`](ESTANDAR_PROGRAMACION.md)  
> **Estado:** Plan Propuesto Pendiente de Aprobación (DOC-02.8 — *Sin ejecución durante DOC-02*)  
> **Fecha:** 25 de noviembre de 2026  

---

## 1. Objetivo y Prerrequisitos de Inicio

Ejecutar de forma progresiva, segura y libre de regresiones la normalización al español de los identificadores propios del dominio en código fuente, contratos API y esquema PostgreSQL `traceflow`, **únicamente después de que el responsable del proyecto apruebe formalmente**:
1. Las decisiones sobre elementos ambiguos (`AMB-01` a `AMB-07`, ya resueltas documentalmente en DOC-03.1 dentro de [`MATRIZ_NOMENCLATURA.md`](MATRIZ_NOMENCLATURA.md)), incluyendo la diferenciación de `notas_admision`, `observaciones_subsanacion`, `respuesta_subsanacion`, `motivo_desestimacion` y el diseño propuesto de `historial_subsanacion_rfc` para múltiples ciclos de subsanación.
2. [`DICCIONARIO_DATOS.md`](DICCIONARIO_DATOS.md) (complementando la verificación pendiente vía Supabase MCP).
3. [`ESTANDAR_PROGRAMACION.md`](ESTANDAR_PROGRAMACION.md) (con `PascalCase.tsx` en componentes React y `kebab-case` en lógica/servicios).
4. Este plan `REF-01` y los candidatos finales `FD03` / `SAD_FINAL.md`.

---

## 2. Secuencia Progresiva por Subetapas

### `REF-01.1` — Tipos y Contratos Internos
- **Alcance:** `backend/src/common/types/index.ts`, `backend/src/modules/extensible/contracts.ts`, `prototype/src/types/*.ts`.
- **Acciones:** Normalizar interfaces, tipos, constantes y DTOs internos (`RFC`, `SolicitudCambio`, `CrearRfcDto`, `InformeImpactoTecnico`, `ROLES_CANONICOS`) preservando sin cambios los valores de negocio (`PU-01`..`PU-07`, los 14 estados `TB-07`) y el comportamiento existente.
- **Validación de salida:** `tsc --noEmit` en backend y `npm run lint && npm run build` en frontend.

### `REF-01.2` — Backend NestJS
- **Alcance:** Módulos, servicios, repositorios, DTOs, guards, decoradores, filtros y scripts (`backend/src/`).
- **Acciones:** Traducir clases/métodos/propiedades de dominio conservando sufijos técnicos NestJS (`AutenticacionController`, `ProyectosService`, `GuardiaRoles`) y manteniendo temporalmente los nombres de tablas/columnas SQL actuales en los repositorios hasta ejecutar `REF-01.5`.
- **Validación de salida:** Suites unitarias `20/20` (`auth`, `projects`, `rfcs`, `governance-negative`, `vertical-flow`) + compilación limpia.

### `REF-01.3` — Frontend React
- **Alcance:** Vistas en `prototype/src/features/`, componentes en `src/components/`, tiendas Zustand en `src/store/` (preservando prefijo `use`), servicios en `src/services/` y `src/routes/navigation.ts`.
- **Acciones:** Traducir identificadores internos, props, tiendas (`useAutenticacionStore`, `useProyectoStore`) y adaptar llamadas a través de `adaptadorTraceFlow`. Actualizar las 9 suites `.spec.mjs` al nuevo vocabulario manteniendo íntegros sus casos de prueba.
- **Validación de salida:** `oxlint`, `tsc -b && vite build` y las 9 suites frontend al 100%.

### `REF-01.4` — Contratos API REST (`/api/v1`)
- **Alcance:** Rutas y payloads JSON entre NestJS y React (`apiClient.ts` / controladores).
- **Estrategia de compatibilidad temporal:**
  1. Exponer simultáneamente las rutas originales (`/api/v1/auth/*`, `/api/v1/projects/*`) y las rutas normalizadas en español (`/api/v1/autenticacion/*`, `/api/v1/proyectos/*`) mediante alias de controlador o mapeo dual durante la ventana de transición.
  2. Incluir un adaptador de compatibilidad en `apiAdapter.ts` antes de retirar definitivamente las claves JSON en inglés (`projectId` → `idProyecto`, `status` → `estado`).
  3. Conservar `/api/v1/health` y `/api/v1/rfcs` por estabilidad operativa.
- **Validación de salida:** Flujo HTTP vertical y Playwright E2E `INT-T01`..`INT-T18`.

### `REF-01.5` — Base de Datos PostgreSQL (`traceflow`)
- **Principio rector:** Utilizar **migraciones incrementales nuevas** (`2026XXXX_ref01_5_normalizacion_espanol.sql`) basadas en `ALTER TABLE ... RENAME TO`, `ALTER TABLE ... RENAME COLUMN`, `ALTER INDEX ... RENAME TO` y `ALTER TRIGGER ... RENAME TO`.
- **Prohibiciones estrictas:**
  - **NO** utilizar `DROP TABLE` + `CREATE TABLE` como mecanismo de traducción (preservar todos los registros existentes).
  - **NO** modificar ni editar las migraciones `202611250001`, `0002`, `0003` ya aplicadas en Supabase.
  - **NO** modificar ni recalcular retroactivamente los campos históricos de `audit_log` (`entity_name`, `operation`, `payload_diff`, `curr_log_hash`), para no romper la cadena criptográfica SHA-256 ni violar la inmutabilidad (`RN-03`, `ADR-008`).
- **Lista de verificación técnica previa a `REF-01.5`:**
  1. **Respaldo previo obligatorio:** Exportación lógica (`pg_dump --schema=traceflow`) antes de ejecutar la migración en Supabase.
  2. **Dependencias FK y compuestas:** Verificar que `fk_rfc_target_ecs_same_project` y FKs compuestas sigan íntegras tras renombrar columnas.
  3. **Funciones SQL y Triggers:** Recrear/reemplazar dentro de la **misma transacción (`BEGIN...COMMIT`)** las 11 funciones (`registrar_auditoria`, `validar_*`, `prevenir_*`) y actualizar referencias internas a los nuevos nombres de tablas/columnas en español.
  4. **Índices y Secuencias:** Renombrar `uq_active_sync_lock_per_ecs` → `uq_bloqueo_activo_por_ecs` y secuencias asociadas.
  5. **Privilegios `traceflow_app` y endurecimiento `SECURITY DEFINER`:** Verificar mediante `GRANT` explícito post-renombrado que `traceflow_app` conserve exactamente el mapa de permisos mínimos (`SELECT`, `INSERT`, `UPDATE`, sin `DELETE`) definido en `SEC-02`, y ejecutar `REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA traceflow FROM PUBLIC;` manteniendo `GRANT EXECUTE` exclusivo para `traceflow_app` (hallazgo de auditoría DOC-03.1 sobre `pg_proc`).
  6. **Sincronización con código:** Actualizar `backend/src/modules/*/*.repository.ts`, `provision-users.ts`, semillas y pruebas `real-postgres-*.spec.ts` en el mismo despliegue coordinado.
- **Estrategia de Rollback:** Script de reversión simétrico `RENAME` + restauración desde el snapshot `pg_dump` previo si ocurre anomalía crítica en verificación post-migración.

### `REF-01.6` — Certificación Integral y No Regresión
- **Alcance:** Verificación completa sin mocks tras finalizar las subetapas anteriores:
  1. Pruebas unitarias e in-memory backend (`20/20` o ampliadas).
  2. Pruebas físicas PostgreSQL (`DB-T01`..`DB-T14`, preservando identificadores históricos).
  3. Pruebas HTTP reales (`10/10`).
  4. Pruebas frontend (`npm run lint`, `npm run build`, `9` suites).
  5. Certificación Playwright E2E (`INT-T01`..`INT-T18`).
  6. Verificación de integridad de la cadena SHA-256 en `registro_auditoria` (`verifyChainIntegrity()`).

---

## 3. Gestión de Ramas y Riesgos Principales

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Desincronización entre nombres SQL y repositorios NestJS | Crítico (fallo en runtime) | Ejecutar `REF-01.5` y actualización de repositorios en un mismo PR atómico con ventana controlada. |
| Ruptura de funciones PL/pgSQL tras `RENAME TABLE/COLUMN` | Alto (triggers fallando al insertar) | Actualizar todas las funciones `SECURITY DEFINER` y correr `DB-T01..14` inmediatamente en transacción de prueba/staging. |
| Ruptura de cadena SHA-256 en `audit_log` | Crítico (pérdida de evidencia legal) | Prohibición absoluta de mutar filas históricas de auditoría; solo renombrar estructura de tabla/columnas. |
| Divergencia entre UI API mode y `mock` mode | Medio | Centralizar mapeos en `adaptadorTraceFlow` (`REF-01.3`/`01.4`) y probar ambos modos. |

---

*Plan de Refactorización REF-01 de TraceFlow SCM — Etapa DOC-02.8 — C-SharkTeam / ÉXODO S.A.C.*

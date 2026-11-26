# Informe de Subsanación y Certificación Oficial — INIT-H04A-R: Cierre de Seguridad de GitHub App e Integraciones

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización Cliente:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Documento:** `docs/evidence/init-h04a/INFORME_SUBSANACION_INIT_H04A_R.md`  
> **Rama de Trabajo:** `feat/init-h04a-github-integration`  
> **Commit Base de Partida:** `edd2a6f1abe3bfa78da1aca47214aaa659c422c3`  
> **Fecha de Certificación:** 26 de noviembre de 2026  
> **Estado:** COMPLETADO, BLINDADO Y CERTIFICADO EN POSTGRESQL 16 REAL (Pendiente de Aprobación Formal CCB)

---

## 1. Resumen Ejecutivo

El presente informe certifica el cierre riguroso y la remediación integral de las cinco observaciones de auditoría de seguridad y consistencia detectadas tras la implementación del hito **INIT-H04A** en **TraceFlow SCM**. 

La arquitectura consolida a **GitHub como fuente de verdad y autoridad del contenido versionado** (árboles de archivos, ramas, commits, pull requests) y a **TraceFlow como autoridad de gobernanza, autorización y auditoría de configuración** (ADR-011, IEEE 828, DA-01 a DA-06).

A través del hito **INIT-H04A-R**, se blindó el subsistema de integración eliminando cualquier dependencia de comportamiento simulado en entornos operativos, segregando las instalaciones de GitHub App a nivel organizacional en PostgreSQL, garantizando la unicidad canónica de repositorios activos por su identificador numérico inmutable (`github_repo_id`), asegurando la degradación transaccional automática del estado del proyecto ante revocación de permisos, y protegiendo los scripts de reversión contra pérdida accidental de datos forenses.

---

## 2. Matriz de Remediaciones Obligatorias Ejecutadas

| Código | Área de Remediación | Hallazgo Original | Solución Arquitectónica y Código Implementado | Estado |
| :--- | :--- | :--- | :--- | :---: |
| **H04A-R01** | Seguridad de Entorno y Configuración | Selección implícita de cliente mock en modo PostgreSQL operativo si faltaban credenciales de GitHub App. | Se refactorizó `github.module.ts` con la función `createGitHubApiClient()`. Se prohíbe de forma absoluta el uso de mocks en producción (`NODE_ENV === 'production'`) o en modo PostgreSQL sin la bandera explícita `ALLOW_MOCK_GITHUB=true`. En modo operativo, la ausencia de `GITHUB_APP_ID` o `GITHUB_APP_PRIVATE_KEY` aplica comportamiento **fail-closed** inmediato arrojando error de configuración. Asimismo, `GitHubService` rechaza cualquier intento de validar o vincular integraciones si se detecta un cliente mock en producción. | **SUBSANADO Y CERTIFICADO** |
| **H04A-R02** | Aislamiento Multiorganización de Instalaciones | Confianza ciega en el `installationId` provisto por el cliente, permitiendo que un proyecto vinculara repositorios mediante instalaciones de organizaciones ajenas. | Se creó la migración incremental `202611260004_init_h04a_r_github_security.sql` implementando la tabla `traceflow.organization_github_installation`. Toda consulta o vinculación valida en PostgreSQL que la instalación pertenezca a la `organization_id` del proyecto. Si no coincide, se rechaza de inmediato con **HTTP 403 Forbidden**. Además, se consulta a GitHub vía `getInstallation()` para verificar que la cuenta remota coincida con el `account_login` registrado. | **SUBSANADO Y CERTIFICADO** |
| **H04A-R03** | Unicidad Canónica de Repositorios | El índice `uq_active_github_repo` se basaba únicamente en `(repo_owner, repo_name)`, permitiendo colisiones si un repositorio vinculado era renombrado en GitHub. | Se sustituyó el índice previo por `uq_active_github_repo_id` sobre la columna inmutable `github_repo_id` (numérico bigint asignado por GitHub) para registros activos (`validation_status != 'UNLINKED'`), complementado con el índice auxiliar `uq_active_github_repo_name` sobre `(LOWER(repo_owner), LOWER(repo_name))`. Se previene la duplicidad activa incluso ante renombramiento o transferencia del repositorio en GitHub. Se permite la revinculación una vez que el repositorio previo se encuentra en estado `UNLINKED`. | **SUBSANADO Y CERTIFICADO** |
| **H04A-R04** | Sincronización Transaccional de Estado y Verificación Git | Si durante la revalidación periódica se detectaban permisos revocados, el estado en `github_integration` se degradaba pero el asistente del proyecto mantenía `github_completed = true`. No se validaba la existencia de la rama Git. | En `validateIntegrationAccess()` y `linkExistingRepository()`, se valida la existencia física de la referencia de rama en GitHub mediante `githubClient.getBranch()`. Toda la revalidación se encapsula en una transacción PostgreSQL única (`db.transaction`): si la API de GitHub reporta permisos denegados o rama inexistente, atómicamente se actualiza `validation_status = 'PERMISSION_DENIED'`, se marca `project_setup.github_completed = false` y se registra el evento `GITHUB_INTEGRATION_DEGRADED` en `traceflow.audit_log`. La recuperación a `true` requiere revalidación exitosa con evento `GITHUB_INTEGRATION_VERIFIED`. | **SUBSANADO Y CERTIFICADO** |
| **H04A-R05** | Salvaguardas de Rollback y Protección de Datos | El script de rollback de H04A solo protegía registros con estado `VALIDATED`, permitiendo la eliminación desatendida de registros `UNLINKED`, `PERMISSION_DENIED` o `REVOKED`. | Se blindaron los scripts `202611260004_init_h04a_r_github_security_rollback.sql` y `202611260003_init_h04a_github_integration_rollback.sql`. Ambos abortan con excepción `BLOQUEO DE SEGURIDAD` si existen filas en las tablas correspondientes, sin importar su estado. Para contingencias se remite a Point-In-Time Recovery (PITR); el borrado solo procede si el esquema está limpio o bajo autorización deliberada `SET LOCAL traceflow.allow_force_h04_rollback = 'true'` en pruebas descartables. | **SUBSANADO Y CERTIFICADO** |

---

## 3. Catálogo Relacional Físico Resultante (PostgreSQL 16 Real)

Con la aplicación de la migración `202611260004_init_h04a_r_github_security.sql`, el esquema relacional privado `traceflow` cuenta con exactamente **31 tablas físicas**:

```
 1. app_role                           17. organization_member
 2. app_user                           18. project
 3. audit_log                          19. project_deliverable
 4. baseline                           20. project_methodology
 5. baseline_item                      21. project_milestone
 6. ccb_resolution                     22. project_phase
 7. ccb_vote                           23. project_setup
 8. change_authorization               24. project_team_role
 9. change_order                       25. qa_certification
10. change_request                     26. sync_lock
11. config_item                        27. uat_acceptance
12. ecs_version                        28. user_project_assignment
13. github_integration                 29. user_role_assignment
14. impact_assessment                  30. user_session
15. incident_ticket                    31. organization_github_installation (NUEVA)
16. organization
```

### 3.1 Estructura de `traceflow.organization_github_installation`
- `id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES traceflow.organization(id) ON DELETE RESTRICT`
- `installation_id BIGINT NOT NULL`
- `account_login VARCHAR(100) NOT NULL`
- `account_type VARCHAR(50) NOT NULL DEFAULT 'Organization'`
- `target_id BIGINT`
- `permissions JSONB NOT NULL DEFAULT '{}'::jsonb`
- `repository_selection VARCHAR(50) NOT NULL DEFAULT 'selected'`
- `status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'`
- `installed_by UUID REFERENCES traceflow.app_user(id) ON DELETE SET NULL`
- `installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- **Restricciones de unicidad:** `uq_org_github_installation (organization_id, installation_id)` y `uq_global_github_installation (installation_id)`.
- **Privilegios de traceflow_app:** `SELECT, INSERT, UPDATE` permitidos; `DELETE` estrictamente revocado.

---

## 4. Métricas y Resultados de Certificación

### 4.1 Pruebas Unitarias e Integrales de Backend (`npm test`)
- **Total de Suites Ejecutadas:** 12 archivos de prueba.
- **Total de Pruebas Unitarias:** **136 pruebas aprobadas (100% exitosas)**.
- **Tiempo de Ejecución:** ~12.49 segundos.
- **Suites Destacadas:**
  - `test/github-integration.spec.ts`: **33 pruebas aprobadas** (18 de H04A + 15 de remediación H04A-R).
  - `test/projects-h03-planning.spec.ts`: 27 pruebas aprobadas.
  - `test/organizations.spec.ts`: 14 pruebas aprobadas.
  - `test/projects-h02.spec.ts`: 14 pruebas aprobadas.
  - `test/rfcs.spec.ts`: 10 pruebas aprobadas.
  - `test/destructive-safeguards.spec.ts`: 8 pruebas aprobadas.
  - `test/governance-negative.spec.ts`: 7 pruebas aprobadas.
  - `test/migration-compatibility.spec.ts`: 6 pruebas aprobadas.
  - `test/auth.spec.ts`: 5 pruebas aprobadas.

### 4.2 Certificación Oficial en Motor Físico PostgreSQL 16 Real (`npm run test:real-postgres`)
- **Instancia Relacional:** PostgreSQL 16.14 dedicado en `127.0.0.1:5432`.
- **Base de Datos Descartable:** `traceflow_cert` (aislada con introspección de socket loopback).
- **Total de Suites Físicas Certificadas:** 3 suites completas:
  - `test/real-postgres-h04a-certification.spec.ts`: **19 pruebas físicas aprobadas**.
  - `test/real-postgres-h03-certification.spec.ts`: **20 pruebas físicas aprobadas**.
  - `test/real-postgres-certification.spec.ts`: **18 pruebas físicas aprobadas**.
- **Total de Pruebas Físicas en PostgreSQL Real:** **57 pruebas aprobadas (100% exitosas, 0 fallos)**.
- **Validaciones Físicas Específicas Certificadas:**
  - Aplicación secuencial limpia de las 7 migraciones oficiales (`202611250001` a `202611260004`).
  - Catálogo físico exacto de 31 tablas relacionales en esquema `traceflow`.
  - Integridad de índices `uq_active_github_repo_id` y `uq_active_github_repo_name`.
  - Mínimo privilegio de `traceflow_app` (SELECT, INSERT, UPDATE permitidos; DELETE revocado con error de permisos).
  - Aislamiento multitenant de instalaciones entre organizaciones (HTTP 403 comprobado en PostgreSQL).
  - Sincronización transaccional de degradación: `validation_status = 'PERMISSION_DENIED'`, `project_setup.github_completed = false` y registro del evento `GITHUB_INTEGRATION_DEGRADED` en `traceflow.audit_log`.
  - Recuperación de estado: revalidación exitosa con `project_setup.github_completed = true` y auditoría `GITHUB_INTEGRATION_VERIFIED`.
  - Salvaguarda de rollback: aborto seguro con excepción ante filas existentes en `202611260004` y `202611260003`; reversión limpia escalonada a 30 y 29 tablas con bandera `traceflow.allow_force_h04_rollback`.

### 4.3 Pruebas de Regresión en Prototipo Frontend (`npm test` en `prototype`)
- **Total de Suites:** 9 suites ejecutadas sobre React 19 + TypeScript.
- **Total de Pruebas:** **97 pruebas aprobadas (100% exitosas)**.
- **Consolidación Global del Sistema:** **290 pruebas en verde (136 backend + 57 PostgreSQL real + 97 prototipo)**.

---

## 5. Cumplimiento de Restricciones y Compromisos Normativos

1. **Aislamiento de Producción:** Ninguna migración ni mutación fue ejecutada sobre la base de datos de producción Supabase (`xmyfqxlvveiawnxgydtz`). Toda la persistencia física se certificó en la instancia aislada local PostgreSQL 16.
2. **Control de Ramas Git:** El desarrollo se mantuvo estrictamente en la rama autorizada `feat/init-h04a-github-integration`, sin realizar merge a `master`.
3. **Inmutabilidad Remota:** No se crearon ni eliminaron repositorios externos reales en cuentas de GitHub ajenas.
4. **Respeto al Ciclo de Vida:** No se implementó activación de proyectos (perteneciente a INIT-H05) ni webhooks asíncronos (pertenecientes a INIT-H04B).
5. **Preservación Histórica:** Se mantuvieron intactos los datos semilla de las 4 membresías fundadoras y los proyectos históricos de ÉXODO S.A.C.

---

## 6. Dictamen y Próximos Pasos

El incremento **INIT-H04A-R** se declara **COMPLETADO, REMEDIADO Y CERTIFICADO EXITOSAMENTE**.

Se recomienda someter el incremento a revisión del Comité de Control de Cambios (CCB) para autorizar la integración del código y proceder con el siguiente incremento planificado:
- **Hito INIT-H04B:** Webhooks, Procesamiento Asíncrono HMAC-SHA256 y Mapeo Bidireccional ECS/RFC con Git.

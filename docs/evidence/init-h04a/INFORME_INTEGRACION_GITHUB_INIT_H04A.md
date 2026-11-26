# TraceFlow SCM — Informe Técnico de Integración Segura de Repositorios GitHub (INIT-H04A)

> **Documento Oficial de Certificación:** `docs/evidence/init-h04a/INFORME_INTEGRACION_GITHUB_INIT_H04A.md`  
> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización Cliente:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Rama de Trabajo:** `feat/init-h04a-github-integration`  
> **Commit Base de Partida:** `b5170d65c7a6433fc02062295367d8e27dd1153e`  
> **Línea Base Documental:** ADR-011, PLAN_INICIALIZACION_PROYECTOS.md, SRS v2.0, SAD_FINAL.md, MATRIZ_TRAZABILIDAD.md  
> **Fecha de Emisión:** 26 de noviembre de 2026  
> **Estado:** COMPLETADO Y CERTIFICADO LOCALMENTE — En pausa bajo Governance Gate (Pendiente de Aprobación Formal para Despliegue en Supabase Productivo)  

---

## 1. Resumen Ejecutivo

El presente informe certifica la implementación, endurecimiento de seguridad y certificación física del primer incremento operativo de integración con GitHub: **Hito INIT-H04A — Integración Segura de Repositorios GitHub**.

TraceFlow SCM fundamenta su autoridad de gestión y gobernanza sobre la premisa de que **GitHub es la fuente única de verdad del contenido versionado y del árbol de archivos Git**, mientras que TraceFlow gobierna la clasificación, autorización, trazabilidad inmutable y las líneas base de configuración (IEEE 828).

El hito INIT-H04A alcanza los siguientes logros fundamentales:
1. **Precondición de Seguridad Cumplida:** Se suprimió la vulnerabilidad que permitía a un usuario con rol activo `PU-02` (Gestor) acceder automáticamente a todos los proyectos de su organización; ahora se exige verificación estricta de asignación en base de datos (`findUserProjectAssignments` o `findTeamRolesByProjectId`), rechazando con `403 Forbidden` accesos cruzados no autorizados.
2. **Arquitectura Criptográfica con GitHub App:** Implementación de generación de Installation Access Tokens (IAT, vida útil 60 minutos) bajo demanda en memoria a través de JWT firmados con algoritmo asimétrico `RS256` y clave RSA privada fuera del repositorio (`GITHUB_APP_PRIVATE_KEY_PATH`). Se garantiza **cero claves privadas y cero tokens de acceso en base de datos o archivos de log**.
3. **Persistencia DDL Segura (`traceflow.github_integration`):** Despliegue de la tabla relacional de integración y del índice de unicidad parcial `uq_active_github_repo` sobre `(repo_owner, repo_name) WHERE validation_status != 'UNLINKED'`. Este diseño asegura que un repositorio activo solo pueda estar enlazado a un proyecto simultáneamente, pero permite su revinculación tras una desvinculación lógica.
4. **Mínimo Privilegio Endurecido:** Concesión de `SELECT, INSERT, UPDATE` al rol de aplicación `traceflow_app`, con revocación explícita y estricta de `DELETE` para preservar la trazabilidad forense.
5. **Endpoints REST Completos y Validados:** Implementación de `/api/v1/projects/:id/github` (`GET /`, `GET /available-repos`, `POST /link`, `POST /validate`, `POST /unlink`, `POST /create-draft`) con control de acceso basado en roles y segregación SoD.
6. **Desvinculación Lógica sin Efectos Secundarios Destructivos:** La operación `/github/unlink` actualiza el estado a `UNLINKED`, registra la auditoría y marca `project_setup.github_completed = false` sin ejecutar mutaciones remotas ni eliminación del repositorio en GitHub.
7. **Certificación Oficial en PostgreSQL 16 Real:** Verificación completa sobre servidor local en `127.0.0.1:5432` con **15/15 pruebas físicas aprobadas** (53/53 acumuladas en el servidor PostgreSQL real), **121/121 pruebas unitarias backend** y **97/97 pruebas de prototipo** (**271 pruebas consolidadas en verde**, cero fallos, cero advertencias de compilación).

---

## 2. Marco Normativo y Decisiones Arquitectónicas Aplicadas

| Decisión | Enunciado Vinculante | Cumplimiento en INIT-H04A |
|---|---|---|
| **DA-01** | Arquitectura Multiproyecto con Aislamiento Estricto | Cada registro en `github_integration` está vinculado a un único `project_id`. El índice parcial `uq_active_github_repo` previene colisiones interproyecto. |
| **DA-02** | Agrupación de Proyectos por Organización | Solo miembros autorizados de la organización propietaria con rol administrativo o gestor asignado pueden consultar o mutar la integración GitHub. |
| **DA-03** | Integración GitHub Híbrida | Soportada modalidad de vinculación de repositorios existentes (`POST /link`) y validación de contratos para creación en borrador (`POST /create-draft`). |
| **DA-04** | Integración GitHub Obligatoria para Activación | Se actualiza atómicamente `project_setup.github_completed`. Proyectos sin integración validada (`configured: false`) no pueden transicionar a `ACTIVO`. Bloqueo estricto de `ALLOW_MOCK_GITHUB_ACTIVATION` en producción. |
| **DA-05** | Experiencia Híbrida Asistente / Panel | La vinculación sincroniza directamente el Paso 4 del Asistente de Configuración Inicial, preparando la base para los paneles tabulares de INIT-H05. |
| **DA-06** | Incorporación Exclusiva de Registrados y SoD | Acceso a funciones de integración restringido a Propietarios/Administradores de la organización o Gestores `PU-02` formalmente asignados al proyecto. |

---

## 3. Detalle de Correcciones y Funcionalidades Implementadas

### 3.1 Precondición de Seguridad: Autorización Estricta de Gestores (PU-02)
En versiones anteriores, `ProjectPlanningService.getAuthorizedProject` contenía una condición de cortocircuito:
```typescript
// VULNERABILIDAD ANTERIOR:
if (callerUser.activeRoleId === 'PU-02') {
  isAuthorized = true; // Permitía a cualquier gestor de la organización acceder a todos los proyectos
}
```
**Remediación Implementada:**
Se eliminó dicho bypass. Un usuario con rol activo `PU-02` ahora debe:
1. Pertenecer a la organización propietaria del proyecto con membresía activa (`organization_member.status === 'ACTIVE'`).
2. Contar con asignación verificada en base de datos: ser `created_by`, `manager_id`, estar registrado en `user_project_assignment` o contar con asignación activa en `project_team_role`.
3. Para operaciones de gestión (`assertAdminOrManager`), se exige ser administrador de la organización (`OWNER`, `ADMIN`) o gestor asignado al proyecto con rol `PU-02`. Cualquier otro usuario recibe `403 Forbidden`.

### 3.2 Cliente GitHub App y Gestión Efímera de Tokens en Memoria
El cliente `HttpGitHubApiClient` (`backend/src/modules/github/github-api.client.ts`) implementa:
1. **Generación de JWT App (RS256):** Carga la clave RSA privada desde el sistema de archivos protegido (`GITHUB_APP_PRIVATE_KEY_PATH`), genera un payload con `iss: GITHUB_APP_ID`, `iat: now - 60s`, `exp: now + 600s` y firma con `crypto.createSign('RSA-SHA256')`.
2. **Tokens de Instalación (IAT):** Invoca `POST /app/installations/:id/access_tokens` usando el JWT como cabecera `Authorization: Bearer <jwt>`.
3. **Caché Exclusivo en Memoria:** Almacena tokens en un mapa en memoria con tiempo de expiración (55 minutos para margen de seguridad). Cero tokens se persisten en base de datos relacional.
4. **Verificación de Permisos:** Comprueba que la instalación posea permisos de escritura (`permissions.push: true`) antes de autorizar la vinculación.

### 3.3 Persistencia Relacional y Modelo DDL (`traceflow.github_integration`)
El script `supabase/migrations/202611260003_init_h04a_github_integration.sql` despliega:
- **Tabla `traceflow.github_integration`:**
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `project_id UUID NOT NULL UNIQUE REFERENCES traceflow.project(id) ON DELETE RESTRICT`
  - `integration_mode VARCHAR(30) NOT NULL` (`LINK_EXISTING`, `CREATE_NEW`)
  - `repo_owner VARCHAR(100) NOT NULL`
  - `repo_name VARCHAR(100) NOT NULL`
  - `repo_full_name VARCHAR(210) NOT NULL`
  - `github_repo_id BIGINT NOT NULL` (identificador numérico inmutable provisto por GitHub)
  - `default_branch VARCHAR(100) NOT NULL DEFAULT 'main'`
  - `installation_id BIGINT NOT NULL`
  - `visibility VARCHAR(20) NOT NULL` (`public`, `private`, `internal`)
  - `permissions JSONB NOT NULL DEFAULT '{"push":false,"pull":true,"admin":false}'::jsonb`
  - `validation_status VARCHAR(30) NOT NULL` (`VALIDATED`, `INVALID_CREDENTIALS`, `REPO_NOT_FOUND`, `PERMISSION_DENIED`, `UNLINKED`)
  - `last_validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `unlinked_at TIMESTAMPTZ NULL`, `unlinked_by UUID NULL`
- **Índice de Unicidad Parcial:**
  ```sql
  CREATE UNIQUE INDEX uq_active_github_repo 
  ON traceflow.github_integration (repo_owner, repo_name) 
  WHERE (validation_status != 'UNLINKED');
  ```
- **Mínimo Privilegio:**
  ```sql
  GRANT SELECT, INSERT, UPDATE ON TABLE traceflow.github_integration TO traceflow_app;
  REVOKE DELETE ON TABLE traceflow.github_integration FROM traceflow_app;
  ```

### 3.4 Procedimiento de Rollback Seguro con Salvaguarda PITR
El script `supabase/migrations/202611260003_init_h04a_github_integration_rollback.sql` incorpora un bloque de guarda `DO $$` que detecta integraciones activas:
```sql
IF EXISTS (SELECT 1 FROM traceflow.github_integration WHERE validation_status != 'UNLINKED') THEN
  RAISE EXCEPTION 'BLOQUEO DE SEGURIDAD (INIT-H04A): Se detectaron integraciones GitHub validadas activas. El rollback directo está bloqueado para preservar la gobernanza SCM. Para contingencias utilice Point-In-Time Recovery (PITR) o habilite "SET LOCAL traceflow.allow_force_h04_rollback = ''true'';" para pruebas.';
END IF;
```
Permitiendo reversión limpia y sin pérdida accidental de datos.

---

## 4. Endpoints REST Implementados

Bajo el prefijo canónico `/api/v1/projects/:id/github`:

| Método | Endpoint | Descripción | Guardias / Roles | Códigos HTTP |
|---|---|---|---|---|
| `GET` | `/api/v1/projects/:id/github` | Consulta el estado actual de integración del proyecto. | `AuthGuard`, miembro autorizado | `200 OK`, `403 Forbidden`, `404 Not Found` |
| `GET` | `/api/v1/projects/:id/github/available-repos` | Lista repositorios accesibles por la instalación de GitHub App. | `AuthGuard`, Admin/PU-02 asignado | `200 OK`, `400 Bad Request`, `403 Forbidden` |
| `POST` | `/api/v1/projects/:id/github/link` | Vincula un repositorio existente validando permisos de push y actualiza setup. | `AuthGuard`, Admin/PU-02 asignado | `201 Created`, `400 Bad Request`, `404 Not Found`, `409 Conflict` |
| `POST` | `/api/v1/projects/:id/github/validate` | Revalida la salud y vigencia de permisos del repositorio vinculado. | `AuthGuard`, Admin/PU-02 asignado | `200 OK`, `404 Not Found` |
| `POST` | `/api/v1/projects/:id/github/unlink` | Desvincula lógicamente el repositorio y marca `github_completed = false`. | `AuthGuard`, Admin/PU-02 asignado | `200 OK`, `404 Not Found` |
| `POST` | `/api/v1/projects/:id/github/create-draft` | Valida el contrato sintáctico para creación de repositorio en borrador. | `AuthGuard`, Admin/PU-02 asignado | `200 OK`, `400 Bad Request` |

---

## 5. Matriz de Pruebas y Certificación Oficial

### 5.1 Pruebas Unitarias TDD (`backend/test/github-integration.spec.ts`)
Total: **18 pruebas — 100% aprobadas**:
- `TDD-H04A-01`: Consulta de estado inicial (`configured: false`, `integration: null`).
- `TDD-H04A-02`: Listado de repositorios disponibles para la instalación de GitHub App.
- `TDD-H04A-02-NEG`: Rechazo de `installationId` inválido con `400 Bad Request`.
- `TDD-H04A-03`: Vinculación exitosa de repositorio con permisos de push y actualización de `project_setup.github_completed`.
- `TDD-H04A-04`: Rechazo por repositorio inexistente en GitHub con `404 NotFoundException`.
- `TDD-H04A-05`: Rechazo por permisos técnicos insuficientes (`push: false`) con `400 BadRequestException`.
- `TDD-H04A-06`: Rechazo si el proyecto ya tiene un repositorio activo vinculado con `409 ConflictException`.
- `TDD-H04A-07`: Rechazo de gobernanza si otro proyecto del sistema ya tiene vinculado el mismo repositorio con `409 ConflictException`.
- `TDD-H04A-08`: Revalidación periódica de acceso con preservación del estado `VALIDATED`.
- `TDD-H04A-09`: Revalidación con degradación a `PERMISSION_DENIED` si se revocan permisos de push.
- `TDD-H04A-10`: Desvinculación lógica (`UNLINKED`) sin eliminar repo remoto y actualizando `project_setup`.
- `TDD-H04A-11`: Validación sintáctica del contrato de creación en borrador (`create-draft`).
- `TDD-H04A-11-NEG`: Rechazo de nombres de repositorio que no cumplen convenciones GitHub con `400 BadRequestException`.
- `TDD-H04A-12`: Certificación de cero tokens y cero credenciales persistidos en base de datos.
- `TDD-H04A-13`: Bloqueo estricto de activación ficticia en producción (`NODE_ENV === 'production'`).
- `TDD-H04A-14`: Rechazo con `403 Forbidden` a usuarios externos o sin membresía activa.
- `TDD-H04A-14-PU02`: Rechazo con `403 Forbidden` a usuarios con rol `PU-02` activo no asignados al proyecto.
- `TDD-H04A-14-NON-MGR`: Rechazo con `403 Forbidden` a miembros asignados que carecen de rol gestor `PU-02`.

### 5.2 Certificación Oficial en PostgreSQL 16 Real (`backend/test/real-postgres-h04a-certification.spec.ts`)
Total: **15 pruebas físicas — 100% aprobadas**:
- `CERT-H04A-01`: Ejecución de exactamente 6 migraciones incrementales en orden estricto.
- `CERT-H04A-02`: Catálogo físico del esquema `traceflow` con exactamente **30 tablas físicas**.
- `CERT-H04A-03`: Integridad de columnas y tipos de datos de `traceflow.github_integration`.
- `CERT-H04A-04`: Existencia y definición correcta del índice de unicidad parcial `uq_active_github_repo`.
- `CERT-H04A-05`: Privilegios `SELECT, INSERT, UPDATE` concedidos a `traceflow_app`.
- `CERT-H04A-06`: `DELETE` estrictamente prohibido para `traceflow_app` (violación genera `permission denied`).
- `CERT-H04A-07`: `getIntegrationStatus` reporta `configured: false` antes de vincular.
- `CERT-H04A-08`: `linkExistingRepository` persiste la integración en PostgreSQL real, marca `project_setup.github_completed = true` y registra evento `GITHUB_REPO_LINKED` en `traceflow.audit_log` con hash SHA-256 (`curr_log_hash`).
- `CERT-H04A-09`: `uq_active_github_repo` rechaza vincular el mismo repositorio en un segundo proyecto con `ConflictException`.
- `CERT-H04A-10`: `validateIntegrationAccess` actualiza `last_validated_at` en base de datos física.
- `CERT-H04A-11`: `unlinkRepository` desvincula lógicamente (`UNLINKED`), actualiza `project_setup.github_completed = false` y registra `GITHUB_REPO_UNLINKED` con hash SHA-256.
- `CERT-H04A-12`: Tras desvinculación lógica, el índice parcial `uq_active_github_repo` permite vincular el repositorio en otro proyecto sin conflicto.
- `CERT-H04A-13`: Segregación SoD en PostgreSQL real: gestor `PU-02` no asignado al proyecto es rechazado con `403 Forbidden`.
- `CERT-H04A-14`: Salvaguarda de rollback aborta con excepción si existen integraciones activas validadas.
- `CERT-H04A-15`: Con `traceflow.allow_force_h04_rollback = 'true'`, el rollback se ejecuta limpiamente y retorna el esquema a exactamente 29 tablas físicas.

### 5.3 Resumen Consolidado de Suites de Prueba
- **Certificación PostgreSQL 16 Real (`npm run test:real-postgres`):** **53/53 pruebas aprobadas** (18 de H02, 20 de H03, 15 de H04A).
- **Pruebas de Backend (`npm test`):** **121/121 pruebas aprobadas** en 12 suites (aisladas de operaciones destructivas).
- **Pruebas de Prototipo Frontend (`npm test`):** **97/97 pruebas aprobadas** en 9 suites.
- **Compilación TypeScript (`npm run build`):** Exitosa con cero errores de tipado.
- **Total General:** **271 pruebas consolidadas en verde**.

---

## 6. Dictamen de Cierre y Política de Gobernanza (Governance Gate)

El hito **INIT-H04A** se encuentra completamente implementado, probado y certificado en el entorno de desarrollo y en PostgreSQL 16 real.

Conforme a la directiva de Gobernanza Arquitectónica y las salvaguardas vinculantes:
1. **La rama de trabajo es:** `feat/init-h04a-github-integration`.
2. **Ningún cambio ha sido fusionado a `master`.**
3. **No se han ejecutado migraciones sobre la instancia productiva de Supabase (`xmyfqxlvveiawnxgydtz`).**
4. **No se han creado repositorios remotos externos en GitHub.**
5. **No se han activado proyectos ni se ha omitido la validación de repositorios reales.**

Se declara formalmente el punto de parada (stop-point) para someter los resultados a revisión y autorización del Responsable / CCB antes de proceder con el hito **INIT-H04B (Webhooks y Sincronización Git)** o la migración a producción.

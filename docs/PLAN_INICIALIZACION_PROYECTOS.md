# Plan Maestro de Inicialización, Organización y Configuración de Proyectos — TraceFlow SCM (INIT-H01)

> **Documento Oficial de Línea Base:** `docs/PLAN_INICIALIZACION_PROYECTOS.md`  
> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Autoría:** Arquitecto de Software Sénior, Especialista PostgreSQL, Seguridad de Aplicaciones e Ingeniero GCSW  
> **Rama de Trabajo:** `docs/init-h01-project-architecture` | **Línea Base Git:** `master @ 99cf70f`  
> **Hito:** INIT-H01 (Auditoría, Consolidación Arquitectónica y Diseño Técnico)  
> **Fecha:** 25 de noviembre de 2026  
> **Estado:** PROPUESTO — Pendiente de Aprobación por el Responsable / CCB  

---

## 1. Resumen Ejecutivo

TraceFlow SCM ha alcanzado la certificación funcional y de persistencia de su núcleo básico de control de cambios (hitos `DB-01`, `DB-02`, `INT-01` y etapa `07R`), con 21 tablas relacionales desplegadas en PostgreSQL 17 (Supabase), un backend monolito modular en NestJS 11 y una interfaz empresarial interactiva en React 19.

No obstante, la auditoría exhaustiva del sistema detectó una brecha arquitectónica crítica en la fase previa a la operación SCM: **el sistema carece de un marco formal de inicialización, organización y configuración de proyectos**. Hasta el momento, los proyectos se encontraban precargados estáticamente en la base de datos sin pertenecer a una entidad formal de organización, sin soporte para estados borradores y sin integración activa con un sistema de control de versiones real como GitHub.

El presente Plan Maestro consolida los resultados de la auditoría AS-IS, formaliza la ingeniería de requisitos (RF-19 a RF-23, RN-10 a RN-15, CU-31 a CU-35), establece el diseño arquitectónico TO-BE con 10 nuevos diagramas canónicos (`DG-INIT-01` a `DG-INIT-10`), define el modelo relacional objetivo y su migración incremental no destructiva, diseña la seguridad y la integración criptográfica con GitHub, y estructura la estrategia de pruebas y el orden de desarrollo mediante TDD para el hito ejecutable `INIT-H02`.

---

## 2. Decisiones Aprobadas (Marco Vinculante)

El diseño arquitectónico y funcional se rige obligatoriamente por las siguientes seis Decisiones Aprobadas:

- **DA-01 (Arquitectura Multiproyecto):** TraceFlow SCM debe soportar múltiples proyectos independientes, concurrentes y lógicamente aislados, garantizando que los datos, configuraciones, artefactos y líneas base de un proyecto no sean accesibles ni alterables desde otros proyectos.
- **DA-02 (Agrupación de Proyectos por Organización):** Los proyectos deben estar estructurados y subordinados bajo entidades de nivel superior denominadas organizaciones (clientes corporativos o divisiones de ÉXODO S.A.C.), permitiendo gobierno multitenant, administración centralizada de políticas y delimitación de membresías.
- **DA-03 (Integración GitHub Híbrida):** La plataforma debe soportar dos modalidades de integración con GitHub: (1) vinculación de repositorios remotos existentes y (2) creación/aprovisionamiento automatizado de nuevos repositorios personales u organizacionales.
- **DA-04 (Integración GitHub Obligatoria para Activación):** Ningún proyecto puede transicionar al estado operacional `ACTIVO` ni ejecutar operaciones de gestión de cambios (registro de RFCs, órdenes ECN, check-in de ECS, líneas base) si no cuenta con una integración GitHub formalmente validada y en estado saludable.
- **DA-05 (Experiencia Híbrida Asistente / Panel):** La inicialización de proyectos debe ofrecer una experiencia guiada mediante un Asistente Inicial de 5 pasos con soporte de guardado parcial (borrador) y un Panel de Configuración Posterior para mantenimiento evolutivo.
- **DA-06 (Incorporación Exclusiva de Usuarios Registrados y Autorizados):** La asignación de integrantes al equipo del proyecto queda restringida estrictamente a colaboradores previamente registrados en el sistema (`app_user.status = 'ACTIVE'`) y vinculados formalmente como miembros activos de la organización (`organization_member.status = 'ACTIVE'`).

---

## 3. Diagnóstico AS-IS (Auditoría Exhaustiva del Repositorio)

La inspección detallada del código fuente, esquema de base de datos, pruebas y documentación en la línea base `master @ 99cf70f` arrojó los siguientes hallazgos:

### 3.1 Backend NestJS (`backend/src/`)
- **`ProjectsModule` (`backend/src/modules/projects/`):**
  - El controlador `ProjectsController` únicamente expone dos endpoints de lectura: `GET /api/v1/projects` y `GET /api/v1/projects/:id`. Carece de endpoints para creación (`POST`), edición (`PUT/PATCH`), archivado (`DELETE`), configuración de metodología o integración GitHub.
  - Cuenta con `@UseGuards(AuthGuard)`, pero carece de `@UseGuards(RolesGuard)` y anotación `@Roles()`, omitiendo la restricción que confiere la administración de proyectos al Gestor (`PU-02`).
  - El servicio `ProjectsService` filtra proyectos en memoria basándose en `user.assignedProjectIds`. No valida el estado del proyecto (`ACTIVE`, `CLOSED`, etc.).
  - El repositorio `ProjectsRepository` posee una lista estática de 3 proyectos en memoria (`PRJ-001`..`PRJ-003`) para modo `mock`. En modo `postgres`, ejecuta una consulta plana `SELECT * FROM traceflow.project`. No cuenta con métodos de mutación DDL ni DML.
- **`AuthModule` y Seguridad (`backend/src/modules/auth/`):**
  - Soporta autenticación con Argon2id y sesiones opacas en base de datos (`user_session`).
  - La interfaz `AuthenticatedUser` contiene `organization: string` como un campo plano informativo (ej. `'ÉXODO S.A.C.'`), sin identificador UUID de organización ni verificación contra una tabla de organizaciones.
  - La matriz RBAC implementa los 7 roles canónicos (`PU-01`..`PU-07`), pero no contempla roles a nivel de organización (ej. Administrador de Organización vs Miembro) ni roles específicos dentro del proyecto.
- **`RfcsModule` y Operaciones SCM (`backend/src/modules/rfcs/`):**
  - El servicio `RfcsService.createRfc()` valida el aislamiento multitenant comprobando que `user.assignedProjectIds.includes(dto.projectId)`.
  - **Falla de salvaguarda detectada:** No valida que `project.status === 'ACTIVO'`. Un usuario puede registrar RFCs sobre proyectos cerrados, archivados o incompletos. Tampoco verifica si existe un repositorio de código asociado (violación de DA-04).
- **`AuditModule` (`backend/src/modules/audit/`):**
  - Implementa la función inmutable `traceflow.append_audit_log` con encadenamiento SHA-256 (`curr_log_hash`) y cerrojo transaccional `pg_advisory_xact_lock(74291)`.
  - La interfaz `AuditEventInput` contempla `projectId`, pero no incluye `organizationId`.

### 3.2 Base de Datos PostgreSQL 17 (`supabase/migrations/`)
- **Tabla `traceflow.project`:**
  - Definida en `202611250001_initial_traceflow.sql` (Líneas 57-73).
  - Restricción de estado: `CHECK (status IN ('ACTIVE', 'CLOSED', 'ARCHIVED'))`. No contempla los estados `BORRADOR`, `EN_CONFIGURACION`, `PENDIENTE_VALIDACION`, `SUSPENDIDO` ni `HISTORICO_PENDIENTE_GITHUB`.
  - Carece de clave foránea hacia organizaciones, carece de metadatos de metodología, cronograma o repositorio GitHub.
- **Tabla `traceflow.app_user`:**
  - Campo `organization VARCHAR(120) NOT NULL DEFAULT 'ÉXODO S.A.C.'`. No normalizado relacionalmente.
- **Mínimo Privilegio de `traceflow_app` (`202611250003_secure_app_role_least_privilege.sql`):**
  - La tabla `traceflow.project` y la tabla `traceflow.user_project_assignment` fueron configuradas con **`GRANT SELECT` únicamente** (Sección 4.3, Líneas 271-278).
  - El backend NestJS no tiene permisos de `INSERT` ni `UPDATE` sobre `project` ni `user_project_assignment`. Toda tentativa actual de crear o editar proyectos desde NestJS falla en PostgreSQL con `permission denied for table project`.

### 3.3 Frontend React 19 (`prototype/src/`)
- **Rutas de Proyectos (`prototype/src/routes/AppRouter.tsx`):**
  - Las rutas `/projects` y `/projects/:projectId` están renderizadas mediante el componente provisional `ScreenPlaceholder`.
  - No existe ruta ni componentes para `/projects/new` (Asistente de Inicialización), ni para `/projects/:id/settings` (Panel de Configuración Posterior).
  - No existen flujos de autorización OAuth con GitHub, selección de ramas ni callbacks de instalación de GitHub Apps.
- **Gestión de Estado (`prototype/src/store/useProjectStore.ts`):**
  - Implementa un conmutador de proyecto activo en memoria y `localStorage`. No valida estados de activación ni sincronización con repositorios remotos.

---

## 4. Matriz de Brechas (Gap Analysis)

| ID | Componente | Estado Actual (AS-IS) | Estado Objetivo (TO-BE) | Impacto | Riesgo | Acción Propuesta | Evidencia / Referencia |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **GAP-01** | Modelo de Datos (Organización) | `app_user.organization` es un texto plano `'ÉXODO S.A.C.'`. No existe entidad `organization`. | Entidades relacionales `organization` y `organization_member` con aislamiento estricto (DA-02). | Crítico | Alto | Crear esquema relacional y migrar datos sin afectar usuarios existentes. | `supabase/migrations/202611250001_initial_traceflow.sql#L37` |
| **GAP-02** | Privilegios de Base de Datos | `traceflow_app` solo tiene permiso `SELECT` sobre `project` y `user_project_assignment`. | Permisos mínimos `SELECT, INSERT, UPDATE` sobre `project`, `user_project_assignment` y nuevas tablas. | Crítico | Alto | Ajustar concesión de privilegios en script DDL sin conceder `DELETE`. | `supabase/migrations/202611250003_secure_app_role_least_privilege.sql#L273` |
| **GAP-03** | Ciclo de Vida del Proyecto | Estados restringidos a `ACTIVE`, `CLOSED`, `ARCHIVED`. Creación monolítica directa. | Estados canónicos: `BORRADOR`, `EN_CONFIGURACION`, `PENDIENTE_VALIDACION`, `ACTIVO`, `SUSPENDIDO`, `CERRADO`, `ARCHIVADO`, `HISTORICO_PENDIENTE_GITHUB`. | Alto | Medio | Actualizar restricción `CHECK` y añadir máquina de estados formal. | `backend/src/modules/projects/projects.repository.ts#L31` |
| **GAP-04** | Integración GitHub | Inexistente. Cero vinculación con repositorios Git remotos. | Módulo `GitHubIntegrationModule` con soporte de vinculación y creación vía GitHub App / OAuth (DA-03). | Crítico | Alto | Diseñar módulo backend, cifrado AES-256-GCM y validación de webhooks. | `backend/src/app.module.ts` |
| **GAP-05** | Salvaguarda de Activación SCM | `RfcsService.createRfc()` no valida si el proyecto está activo ni si cuenta con repositorio Git. | Implementación de `ProjectActiveGuard` y rechazo HTTP 412 si el proyecto no está `ACTIVO` (DA-04). | Crítico | Crítico | Crear guardián NestJS e incorporarlo en controladores SCM. | `backend/src/modules/rfcs/rfcs.service.ts#L76-L89` |
| **GAP-06** | Asistente de Inicialización (UI) | Pantallas de proyectos son `ScreenPlaceholder`. | Flujo guiado de 5 pasos con guardado borrador (`project_setup.draft_payload`) (DA-05). | Alto | Medio | Diseñar vistas React 19, componentes por paso y store Zustand. | `prototype/src/routes/AppRouter.tsx#L38-L56` |
| **GAP-07** | Política de Miembros (DA-06) | Proyectos asignan usuarios sin verificar pertenencia institucional. | Validación estricta: solo usuarios con `organization_member.status = 'ACTIVE'` pueden ser asignados. | Alto | Medio | Añadir validación relacional y en servicio NestJS. | `backend/src/modules/projects/projects.service.ts#L13` |
| **GAP-08** | Planificación Metodológica | No existe soporte para metodología, fases, hitos ni entregables en BD ni API. | Entidades `project_methodology`, `project_phase`, `project_milestone`, `project_deliverable`. | Medio | Bajo | Incorporar modelo relacional de planificación y DTOs correspondientes. | `docs/FD03-EPIS-Informe_SRS.md#L528` |
| **GAP-09** | Endpoints de Creación en Backend | `ProjectsController` no posee `@Post()` para inicialización ni activación. | Endpoints REST `/api/v1/projects`, `/api/v1/projects/:id/setup`, `/api/v1/projects/:id/activate`. | Alto | Medio | Definir contratos de API y DTOs validados con `class-validator`. | `backend/src/modules/projects/projects.controller.ts#L7-L28` |
| **GAP-10** | Trazabilidad de Auditoría | `audit_log` registra `project_id`, pero carece de contexto de organización. | Auditoría enriquecida con `organization_id` y eventos específicos de ciclo de vida (`PROJECT_INITIATED`, `GH_LINKED`). | Medio | Bajo | Extender `AuditEventInput` y función PL/pgSQL manteniendo SHA-256. | `backend/src/modules/audit/audit.service.ts#L5-L18` |

---

## 5. Ingeniería de Requisitos (Extensión Normativa)

### 5.1 Nuevos Requisitos Funcionales (RF-19 a RF-23)

- **`RF-19` — Gestión de Organizaciones y Membresías Institucionales (DA-02, DA-06):**
  - El sistema debe permitir a los administradores autorizados registrar organizaciones cliente, configurar su identidad y gestionar las membresías de los usuarios registrados del sistema.
  - Ningún usuario podrá ser asignado a un proyecto sin pertenecer formalmente a la organización propietaria.
- **`RF-20` — Asistente Híbrido de Inicialización de Proyectos (DA-01, DA-05):**
  - El sistema debe proporcionar un asistente interactivo de 5 pasos secuenciales para registrar proyectos en estado `BORRADOR`, permitiendo guardar el progreso parcial y reanudarlo posteriormente.
  - El asistente debe capturar: (1) Identidad y alcance, (2) Asignación de roles por proyecto, (3) Metodología y fases, (4) Integración GitHub, (5) Resumen y activación.
- **`RF-21` — Integración y Vinculación de Repositorios GitHub (DA-03):**
  - El sistema debe permitir vincular un repositorio GitHub preexistente o aprovisionar automáticamente un nuevo repositorio remoto en una cuenta u organización autorizada.
  - Debe validar permisos mínimos de administración o escritura, configurar webhooks autenticados y registrar el identificador remoto de GitHub.
- **`RF-22` — Planificación de Metodologías, Fases, Hitos y Entregables:**
  - El sistema debe permitir asociar al proyecto una metodología de desarrollo (Scrum, Cascada, Híbrida) y estructurar su cronograma base mediante fases ordenadas, hitos temporales y entregables asociados a Elementos de Configuración (`ECS`).
- **`RF-23` — Salvaguardas de Ciclo de Vida y Activación SCM (DA-04):**
  - El sistema debe impedir la transición del proyecto al estado `ACTIVO` si no cuenta con una integración GitHub verificada y validada (`validation_status = 'VALIDATED'`).
  - Debe rechazar toda operación de gestión de cambios (creación de RFCs, emisión de órdenes ECN, modificaciones en bibliotecas) si el proyecto no se encuentra en estado `ACTIVO`.

### 5.2 Nuevas Reglas de Negocio (RN-10 a RN-15)

- **`RN-10` (Pertenencia Obligatoria a Organización):** Todo proyecto debe pertenecer indefectiblemente a una única organización registrada. No se admiten proyectos globales ni huérfanos.
- **`RN-11` (Incorporación Exclusiva de Registrados - DA-06):** La asignación de personal a un proyecto (`project_team_role`) solo puede realizarse sobre usuarios físicos que posean estado `ACTIVE` en `app_user` y estado `ACTIVE` en `organization_member`.
- **`RN-12` (Condición Sine Qua Non de Integración GitHub - DA-04):** Es mandatorio que el repositorio remoto en GitHub esté verificado y con webhook operativo para que el proyecto pueda ser activado.
- **`RN-13` (Bloqueo Estricto de Operaciones SCM en Proyectos Inactivos):** Las solicitudes de cambio (RFC), órdenes de cambio (ECN), bloqueos de sincronización y check-in/out solo pueden ejecutarse en proyectos con estado `ACTIVO`. Proyectos en `BORRADOR`, `EN_CONFIGURACION`, `PENDIENTE_VALIDACION`, `SUSPENDIDO` o `ARCHIVADO` bloquean estas operaciones con error HTTP 412 / 403.
- **`RN-14` (Persistencia y Recuperación de Estado Borrador):** El asistente de inicialización debe persistir automáticamente el avance de cada paso en `project_setup.draft_payload` sin alterar las restricciones relacionales duras hasta la activación final.
- **`RN-15` (Inmutabilidad de Transición de Estados):** Todo cambio en el estado del proyecto (`BORRADOR` $\rightarrow$ `ACTIVO` $\rightarrow$ `SUSPENDIDO` $\rightarrow$ `ARCHIVADO`) debe registrarse en la bitácora inmutable de auditoría con firma SHA-256 del usuario actor.

### 5.3 Nuevos Casos de Uso del Bloque de Inicialización

| ID Caso de Uso | Nombre Formal | Tipo | Actores Principales | Referencias |
| :--- | :--- | :--- | :--- | :--- |
| **`CU-02` (Ext)** | Administrar Ciclo de Vida y Configuración de Proyectos | Administrativo | Analista / Gestor (`PU-02`) | RF-02, RF-23, RN-10, RN-13, RN-15, DG-INIT-04 |
| **`CU-03` (Ext)** | Consultar Directorio y Ficha Multiorganización | Consulta | Todos los Roles Asignados (`PU-01`..`PU-07`) | RF-02, RF-19, RN-10, DG-INIT-03 |
| **`CU-31`** | Administrar Organizaciones y Membresías | Administrativo | Administrador de Organización (`PU-02`) | RF-19, RN-10, RN-11, DG-INIT-03 |
| **`CU-32`** | Inicializar Proyecto mediante Asistente Híbrido | Primario | Analista / Gestor (`PU-02`), Arquitecto (`PU-03`) | RF-20, RN-11, RN-14, DG-INIT-05, DG-INIT-10 |
| **`CU-33`** | Integrar y Validar Repositorio GitHub | Integración | Arquitecto (`PU-03`), Gestor (`PU-02`) | RF-21, RN-12, DG-INIT-07, DG-INIT-08 |
| **`CU-34`** | Configurar Metodología, Fases y Entregables | Planificación | Gestor (`PU-02`), Arquitecto (`PU-03`) | RF-22, DG-INIT-05, DG-INIT-06 |
| **`CU-35`** | Activar, Suspender y Archivar Proyecto con Salvaguarda SCM | Control | Gestor (`PU-02`), Comité CCB (`PU-04`) | RF-23, RN-12, RN-13, RN-15, DG-INIT-09 |

---

## 6. Referencias al Diseño TO-BE y Compendio Gráfico

Se han formalizado y compilado 10 diagramas canónicos en formato PlantUML (`docs/assets/diagramas/plantuml/diseno/`) y sus versiones renderizadas SVG y PNG (`docs/assets/diagramas/render/diseno/`):

1. **Contexto del Sistema (`DG-INIT-01`):**  
   Fuente: [`DG-INIT-01.puml`](assets/diagramas/plantuml/diseno/DG-INIT-01.puml) | [SVG](assets/diagramas/render/diseno/DG-INIT-01.svg) | [PNG](assets/diagramas/render/diseno/DG-INIT-01.png)  
   *Delimita las interacciones entre los actores por rol, la SPA React, el backend NestJS, PostgreSQL 17 y la API/Webhooks de GitHub.*
2. **Arquitectura por Componentes (`DG-INIT-02`):**  
   Fuente: [`DG-INIT-02.puml`](assets/diagramas/plantuml/diseno/DG-INIT-02.puml) | [SVG](assets/diagramas/render/diseno/DG-INIT-02.svg) | [PNG](assets/diagramas/render/diseno/DG-INIT-02.png)  
   *Muestra la evolución modular con `OrganizationsModule`, `ProjectsModule` evolucionado, `GitHubIntegrationModule` y el guardián `ProjectActiveGuard`.*
3. **Organización y Multiproyecto (`DG-INIT-03`):**  
   Fuente: [`DG-INIT-03.puml`](assets/diagramas/plantuml/diseno/DG-INIT-03.puml) | [SVG](assets/diagramas/render/diseno/DG-INIT-03.svg) | [PNG](assets/diagramas/render/diseno/DG-INIT-03.png)  
   *Ilustra la jerarquía de gobierno: Organización $\rightarrow$ Miembros de Organización $\rightarrow$ Proyectos $\rightarrow$ Roles por Proyecto.*
4. **Ciclo de Vida del Proyecto (`DG-INIT-04`):**  
   Fuente: [`DG-INIT-04.puml`](assets/diagramas/plantuml/diseno/DG-INIT-04.puml) | [SVG](assets/diagramas/render/diseno/DG-INIT-04.svg) | [PNG](assets/diagramas/render/diseno/DG-INIT-04.png)  
   *Máquina de estados: `BORRADOR` $\rightarrow$ `EN_CONFIGURACION` $\rightarrow$ `PENDIENTE_VALIDACION` $\rightarrow$ `ACTIVO` $\rightarrow$ `SUSPENDIDO` $\rightarrow$ `CERRADO` $\rightarrow$ `ARCHIVADO`.*
5. **Asistente de Inicialización (`DG-INIT-05`):**  
   Fuente: [`DG-INIT-05.puml`](assets/diagramas/plantuml/diseno/DG-INIT-05.puml) | [SVG](assets/diagramas/render/diseno/DG-INIT-05.svg) | [PNG](assets/diagramas/render/diseno/DG-INIT-05.png)  
   *Diagrama de actividades detallando el flujo de 5 pasos, autosave y bifurcación según resultado de validación.*
6. **Modelo Entidad-Relación Conceptual TO-BE (`DG-INIT-06`):**  
   Fuente: [`DG-INIT-06.puml`](assets/diagramas/plantuml/diseno/DG-INIT-06.puml) | [SVG](assets/diagramas/render/diseno/DG-INIT-06.svg) | [PNG](assets/diagramas/render/diseno/DG-INIT-06.png)  
   *Especifica las entidades relacionales nuevas y su acoplamiento con `project`, `app_user`, `config_item` y `change_request`.*
7. **Secuencia de Vinculación GitHub (`DG-INIT-07`):**  
   Fuente: [`DG-INIT-07.puml`](assets/diagramas/plantuml/diseno/DG-INIT-07.puml) | [SVG](assets/diagramas/render/diseno/DG-INIT-07.svg) | [PNG](assets/diagramas/render/diseno/DG-INIT-07.png)  
   *Secuencia de verificación de repositorio existente, prueba de permisos, configuración de webhook y cifrado AES-256.*
8. **Secuencia de Creación de Repositorio GitHub (`DG-INIT-08`):**  
   Fuente: [`DG-INIT-08.puml`](assets/diagramas/plantuml/diseno/DG-INIT-08.puml) | [SVG](assets/diagramas/render/diseno/DG-INIT-08.svg) | [PNG](assets/diagramas/render/diseno/DG-INIT-08.png)  
   *Secuencia de aprovisionamiento de repositorio nuevo, commit de plantilla, ramas canónicas y webhook.*
9. **Secuencia de Activación del Proyecto (`DG-INIT-09`):**  
   Fuente: [`DG-INIT-09.puml`](assets/diagramas/plantuml/diseno/DG-INIT-09.puml) | [SVG](assets/diagramas/render/diseno/DG-INIT-09.svg) | [PNG](assets/diagramas/render/diseno/DG-INIT-09.png)  
   *Verificación de salvaguarda DA-04, transición a `ACTIVO`, inicialización de bibliotecas y rechazo de RFCs en proyectos inactivos.*
10. **Navegación del Frontend (`DG-INIT-10`):**  
    Fuente: [`DG-INIT-10.puml`](assets/diagramas/plantuml/diseno/DG-INIT-10.puml) | [SVG](assets/diagramas/render/diseno/DG-INIT-10.svg) | [PNG](assets/diagramas/render/diseno/DG-INIT-10.png)  
    *Estructura de enrutamiento React Router: `/projects/new/*`, `/projects/:id/settings/*` y guardianes de ruta.*

---

## 7. Diseño de Persistencia y Migración Incremental (Propuesta DDL No Ejecutable)

> [!WARNING]
> **RESTRICCIÓN FORMAL:** Este código SQL es una propuesta técnica de diseño y análisis para la futura etapa `INIT-H02`. **NO DEBE EJECUTARSE** durante el hito `INIT-H01`.

```sql
-- ============================================================================
-- TRACEFLOW SCM — PROPUESTA DDL INCREMENTAL (INIT-H02 CANDIDATE)
-- Esquema: traceflow | Motor: PostgreSQL 17
-- ============================================================================

-- 1. TABLA DE ORGANIZACIONES (TENANT RAÍZ - DA-02)
CREATE TABLE IF NOT EXISTS traceflow.organization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,               -- ej. ORG-001, ORG-EXODO
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(60) UNIQUE NOT NULL,               -- ej. exodo-sac
    legal_name VARCHAR(150),
    tax_id VARCHAR(30),                             -- RUC / CIF institucional
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')),
    created_by UUID REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA DE MEMBRESÍA ORGANIZACIONAL (DA-06)
CREATE TABLE IF NOT EXISTS traceflow.organization_member (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES traceflow.organization(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    role_in_org VARCHAR(30) NOT NULL DEFAULT 'MEMBER' CHECK (role_in_org IN ('OWNER', 'ADMIN', 'MEMBER', 'AUDITOR')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INVITED', 'SUSPENDED')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    invited_by UUID REFERENCES traceflow.app_user(id) ON DELETE SET NULL,
    CONSTRAINT uq_org_member UNIQUE (organization_id, user_id)
);

-- 3. EVOLUCIÓN DE TABLA PROJECT (AGREGAR FK Y ESTADOS AMPLIADOS)
-- Nota: En migración incremental se agregará organization_id y se migrarán PRJ-001..003
ALTER TABLE traceflow.project 
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES traceflow.organization(id) ON DELETE RESTRICT;

-- Ampliación de restricción de estados para admitir borrador y transición controlada
-- CHECK (status IN ('BORRADOR', 'EN_CONFIGURACION', 'PENDIENTE_VALIDACION', 'ACTIVO', 'SUSPENDIDO', 'CERRADO', 'ARCHIVADO', 'HISTORICO_PENDIENTE_GITHUB'))

-- 4. TABLA DE CONFIGURACIÓN DEL ASISTENTE Y AUTOSAVE (DA-05)
CREATE TABLE IF NOT EXISTS traceflow.project_setup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE NOT NULL REFERENCES traceflow.project(id) ON DELETE CASCADE,
    wizard_step INT NOT NULL DEFAULT 1 CHECK (wizard_step BETWEEN 1 AND 5),
    wizard_completed BOOLEAN NOT NULL DEFAULT FALSE,
    identity_completed BOOLEAN NOT NULL DEFAULT FALSE,
    team_completed BOOLEAN NOT NULL DEFAULT FALSE,
    methodology_completed BOOLEAN NOT NULL DEFAULT FALSE,
    github_completed BOOLEAN NOT NULL DEFAULT FALSE,
    validation_completed BOOLEAN NOT NULL DEFAULT FALSE,
    draft_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_saved_by UUID REFERENCES traceflow.app_user(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLA DE ROLES FUNCIONALES DEL EQUIPO EN EL PROYECTO
CREATE TABLE IF NOT EXISTS traceflow.project_team_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    role_id INT NOT NULL REFERENCES traceflow.app_role(id) ON DELETE RESTRICT,
    functional_title VARCHAR(100),
    is_lead BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES traceflow.app_user(id) ON DELETE SET NULL,
    CONSTRAINT uq_project_user_role UNIQUE (project_id, user_id, role_id)
);

-- 6. TABLA DE METODOLOGÍA DEL PROYECTO
CREATE TABLE IF NOT EXISTS traceflow.project_methodology (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE NOT NULL REFERENCES traceflow.project(id) ON DELETE CASCADE,
    methodology_type VARCHAR(30) NOT NULL CHECK (methodology_type IN ('SCRUM', 'KANBAN', 'CASCADA', 'HIBRIDA', 'UPT_ACADEMICA')),
    iteration_duration_weeks INT DEFAULT 2,
    active_phase_code VARCHAR(30),
    configuration_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABLAS DE CRONOGRAMA, FASES, HITOS Y ENTREGABLES
CREATE TABLE IF NOT EXISTS traceflow.project_phase (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE CASCADE,
    phase_code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    sequence_order INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
    CONSTRAINT uq_project_phase_order UNIQUE (project_id, sequence_order),
    CONSTRAINT uq_project_phase_code UNIQUE (project_id, phase_code),
    CONSTRAINT chk_phase_dates CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS traceflow.project_milestone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES traceflow.project_phase(id) ON DELETE SET NULL,
    code VARCHAR(30) NOT NULL,
    title VARCHAR(150) NOT NULL,
    target_date DATE NOT NULL,
    completion_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACHIEVED', 'DELAYED', 'CANCELLED')),
    CONSTRAINT uq_project_milestone_code UNIQUE (project_id, code)
);

CREATE TABLE IF NOT EXISTS traceflow.project_deliverable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES traceflow.project_milestone(id) ON DELETE SET NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    expected_type VARCHAR(50) NOT NULL CHECK (expected_type IN ('SOFTWARE_RELEASE', 'TECHNICAL_DOCUMENT', 'SOURCE_BRANCH', 'TEST_REPORT', 'DB_MIGRATION')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED')),
    associated_ecs_id UUID REFERENCES traceflow.config_item(id) ON DELETE SET NULL,
    CONSTRAINT uq_project_deliverable_code UNIQUE (project_id, code)
);

-- 8. TABLA DE INTEGRACIÓN GITHUB (DA-03, DA-04)
CREATE TABLE IF NOT EXISTS traceflow.github_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE NOT NULL REFERENCES traceflow.project(id) ON DELETE CASCADE,
    integration_mode VARCHAR(20) NOT NULL CHECK (integration_mode IN ('LINK_EXISTING', 'CREATE_NEW')),
    repo_owner VARCHAR(100) NOT NULL,
    repo_name VARCHAR(100) NOT NULL,
    repo_full_name VARCHAR(200) NOT NULL,
    github_repo_id BIGINT NOT NULL,
    default_branch VARCHAR(50) NOT NULL DEFAULT 'main',
    installation_id BIGINT,
    encrypted_access_token BYTEA,
    token_iv BYTEA,
    token_auth_tag BYTEA,
    token_expires_at TIMESTAMPTZ,
    webhook_id BIGINT,
    encrypted_webhook_secret BYTEA,
    webhook_iv BYTEA,
    webhook_auth_tag BYTEA,
    validation_status VARCHAR(30) NOT NULL DEFAULT 'UNVALIDATED' CHECK (validation_status IN ('UNVALIDATED', 'VALIDATED', 'INVALID_CREDENTIALS', 'REPO_NOT_FOUND', 'PERMISSION_DENIED', 'REVOKED')),
    last_validated_at TIMESTAMPTZ,
    validation_error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_github_repo UNIQUE (repo_owner, repo_name)
);

-- 9. TABLA DE EVENTOS DE WEBHOOK GITHUB
CREATE TABLE IF NOT EXISTS traceflow.github_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE CASCADE,
    github_delivery_id VARCHAR(64) UNIQUE NOT NULL,  -- Idempotencia garantizada por X-GitHub-Delivery
    event_type VARCHAR(50) NOT NULL,
    action VARCHAR(50),
    sender_login VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
    processed_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (processed_status IN ('PENDING', 'PROCESSED', 'IGNORED', 'FAILED')),
    processed_at TIMESTAMPTZ,
    error_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. REAJUSTE DE PRIVILEGIOS MÍNIMOS (LEAST PRIVILEGE)
GRANT SELECT, INSERT, UPDATE ON TABLE 
    traceflow.organization,
    traceflow.project,
    traceflow.project_setup,
    traceflow.project_methodology,
    traceflow.github_integration,
    traceflow.github_event
TO traceflow_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE 
    traceflow.organization_member,
    traceflow.project_team_role,
    traceflow.project_phase,
    traceflow.project_milestone,
    traceflow.project_deliverable
TO traceflow_app;
```

### Estrategia de Migración de Proyectos Preexistentes (Zero Data Loss)
1. **Paso 1 (Creación de Organización Institucional):** Insertar automáticamente la organización inicial `ÉXODO S.A.C.` (`code = 'ORG-001'`, `slug = 'exodo-sac'`).
2. **Paso 2 (Membresía Inicial):** Asociar todos los usuarios preexistentes (`USR-001` a `USR-004`) como miembros activos (`organization_member`) de `ORG-001`.
3. **Paso 3 (Vinculación de Proyectos):** Asignar los proyectos existentes `PRJ-001`, `PRJ-002` y `PRJ-003` a `ORG-001`.
4. **Paso 4 (Estado Histórico sin Infracción de DA-04):** Para cumplir estrictamente con DA-04 sin corromper el historial, **no se asignará automáticamente el estado `ACTIVO`**; en su lugar, se asignará el estado canónico `HISTORICO_PENDIENTE_GITHUB`.
5. **Paso 5 (Compatibilidad Temporal SCM):** Las consultas, reportes y lecturas de expedientes y líneas base históricas permanecerán 100% disponibles. Cualquier nueva solicitud de cambio (`POST /api/v1/rfcs`) solicitará al Gestor la regularización de la vinculación con el repositorio oficial `https://github.com/JMedina255/TraceFlow.git` antes de admitir mutaciones.

---

## 8. Seguridad e Integración GitHub

### 8.1 Matriz de Autorización para los Siete Perfiles Canónicos

| Perfil Canónico | Rol en Organización | Rol en Proyecto | Permisos en Inicialización | Permisos en Integración GitHub | Permisos SCM (Activo) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PU-01 (Solicitante)** | Miembro / Colaborador | Usuario Asignado | Solo lectura de ficha de proyecto | Ninguno | Registro y subsanación de RFCs propias (`CU-04`, `CU-04.1`) |
| **PU-02 (Gestor / Analista)** | Administrador / Gestor | Gestor Responsable | Creación de proyectos, Asistente (Pasos 1-5), Activación, Suspensión (`CU-31`, `CU-32`, `CU-35`) | Vinculación/Creación de repositorios, prueba de conexión | Clasificación, admisión, gestión de ECNs (`CU-05`, `CU-08`) |
| **PU-03 (Arquitecto)** | Miembro Técnico | Arquitecto Líder | Configuración de Metodología y Cronograma (Paso 3) (`CU-34`) | Configuración técnica de ramas y validación de webhooks (`CU-33`) | Análisis de impacto, co-autorización doble llave (`CU-06`, `CU-30`) |
| **PU-04 (Comité CCB)** | Miembro / Directivo | Miembro CCB | Consulta de resumen y viabilidad técnica | Inspección de auditoría de repositorios | Deliberación colegiada, votación y resoluciones (`CU-07`) |
| **PU-05 (Bibliotecario)** | Miembro de Custodia | Custodio SCM | Consulta de estructura de bibliotecas | Inspección de ramas protegidas | Check-In a Maestra, congelamiento de líneas base (`CU-12`, `CU-20`) |
| **PU-06 (Desarrollador)** | Miembro Operativo | Ingeniero de Software | Consulta de ficha de proyecto y metodología | Lectura/escritura de código en Git según ramas autorizadas | Check-Out a Trabajo, implementación técnica de cambios (`CU-10`) |
| **PU-07 (Calidad / QA)** | Miembro de Control | Evaluador QA | Consulta de fases y entregables planificados | Verificación de releases y tags en Git | Pruebas de conformidad, certificación y no conformidades (`CU-16..19`) |

### 8.2 Diferenciación Estricta de Identidades y Facultades
- **Rol del Sistema:** Cuenta de autenticación física en `app_user` (credenciales Argon2id, UUID de usuario).
- **Membresía Organizacional:** Privilegio administrativo dentro del tenant (`OWNER`, `ADMIN`, `MEMBER`, `AUDITOR`).
- **Membresía del Proyecto:** Asignación contextual de acceso a un proyecto específico (`user_project_assignment`).
- **Responsabilidad Funcional:** Especialidad operativa asignada dentro del equipo (`project_team_role`, ej. "Líder de Integración").
- **Permiso Efectivo:** Intersección resultante entre el rol activo canónico (`activeRoleId` en sesión), la membresía del proyecto y el estado del proyecto (`ACTIVO`).
- **Restricción SoD:** Invariantes de segregación física evaluadas en disparadores de PostgreSQL (anti-autoevaluación, doble llave física independiente, incompatibilidad Solicitante vs Votante CCB).

### 8.3 Evaluación Técnica: GitHub App vs OAuth App

| Criterio | GitHub App (Modelo Seleccionado) | OAuth App (Alternativa Secundaria) | Justificación de Elección |
| :--- | :--- | :--- | :--- |
| **Identidad** | Actúa como aplicación institucional propia | Actúa en nombre de un usuario individual | Garantiza que la integración no dependa de la cuenta personal de un empleado que pueda rotar. |
| **Permisos** | Granulares por recurso (ej. `Contents: Read/Write`, `Webhooks: Read/Write`) | Todo o nada en alcances amplios (`repo`, `admin:repo_hook`) | Cumplimiento del principio de mínimo privilegio (`RNF-01`). |
| **Tokens** | Installation Access Tokens temporales (1 hora de vigencia) | Tokens estáticos de larga duración sin expiración automática | Reduce drásticamente la ventana de impacto ante filtraciones. |
| **Webhooks** | Integrados de forma centralizada con secreto compartido | Requiere creación manual por repositorio | Automatización completa desde el Asistente de Inicialización. |
| **Límites de API** | 5,000 peticiones/hora por instalación (escala por organización) | 5,000 peticiones/hora compartidas por usuario | Mayor escalabilidad para despliegues multiproyecto empresariales. |

### 8.4 Almacenamiento Seguro de Credenciales (Criptografía AES-256-GCM)
- Los secretos compartidos de webhooks y tokens de larga duración se cifran a nivel de aplicación mediante el servicio `GitHubCryptoService` antes de guardarse en la base de datos.
- Se utiliza el algoritmo **AES-256-GCM** (Galois/Counter Mode), el cual provee confidencialidad y autenticación de integridad (Authenticated Encryption).
- Cada secreto cifrado almacena tres campos binarios independientes en PostgreSQL:
  - `encrypted_access_token BYTEA` / `encrypted_webhook_secret BYTEA`: Texto cifrado.
  - `token_iv BYTEA` / `webhook_iv BYTEA`: Vector de inicialización criptográficamente aleatorio de 12 bytes (96 bits) generado por `crypto.randomBytes(12)`.
  - `token_auth_tag BYTEA` / `webhook_auth_tag BYTEA`: Etiqueta de autenticación de 16 bytes (128 bits) generada por el cifrador GCM.
- La clave maestra de cifrado (`APP_SECRET_KEY`) se inyecta exclusivamente mediante variable de entorno protegida en el servidor; **nunca se expone al frontend, nunca se incluye en respuestas JSON de la API, nunca se registra en `audit_log` y nunca se almacena en el repositorio Git**.

---

## 9. Contratos Preliminares de API REST (`/api/v1/*`)

### 9.1 Grupo 1: Gestión de Organizaciones (`MOD-10`)
- **`GET /api/v1/organizations`**: Lista organizaciones donde el usuario autenticado tiene membresía activa.
- **`POST /api/v1/organizations`**: Registra nueva organización (exclusivo Administrador del Sistema).
- **`GET /api/v1/organizations/:orgId/members`**: Obtiene lista de miembros registrados para asignación a proyectos (DA-06).

### 9.2 Grupo 2: Asistente y Ciclo de Vida de Proyectos (`MOD-02`)
- **`POST /api/v1/projects/initiate`**:
  - *Descripción:* Crea proyecto en estado `BORRADOR` con datos del Paso 1.
  - *Body:*
    ```json
    {
      "organizationId": "c0000001-0000-0000-0000-000000000001",
      "code": "PRJ-004",
      "projectKey": "EXO-PAY",
      "name": "Billetera Digital Móvil",
      "description": "Aplicación móvil y backend transaccional.",
      "clientName": "Banco Financiero",
      "targetDeliveryDate": "2027-06-30"
    }
    ```
  - *Respuesta (HTTP 201):* `{ "id": "b0000001-...", "status": "BORRADOR", "step": 1 }`
- **`PUT /api/v1/projects/:id/setup/step-2`**: Asigna integrantes y roles del equipo (valida DA-06).
- **`PUT /api/v1/projects/:id/setup/step-3`**: Configura metodología (Scrum/Cascada), fases y cronograma.
- **`POST /api/v1/projects/:id/activate`**:
  - *Descripción:* Valida condiciones obligatorias (DA-04) y activa el proyecto.
  - *Respuesta Éxito (HTTP 200):* `{ "status": "ACTIVO", "message": "Proyecto activado formalmente." }`
  - *Respuesta Rechazo (HTTP 412):* `{ "statusCode": 412, "error": "Precondition Failed", "message": "DA-04: La integración GitHub debe estar validada para activar el proyecto." }`

### 9.3 Grupo 3: Integración GitHub (`MOD-11`)
- **`POST /api/v1/projects/:id/github/link`**:
  - *Descripción:* Vincula un repositorio existente validando permisos remotos (DA-03).
  - *Body:* `{ "repoOwner": "ÉXODO-ORG", "repoName": "traceflow-mobile", "installationId": 123456 }`
  - *Respuesta (HTTP 200):* `{ "validationStatus": "VALIDATED", "defaultBranch": "main" }`
- **`POST /api/v1/projects/:id/github/create`**:
  - *Descripción:* Aprovisiona un nuevo repositorio en GitHub y lo vincula al proyecto (DA-03).
  - *Body:* `{ "orgName": "ÉXODO-ORG", "repoName": "traceflow-mobile", "isPrivate": true, "initBranches": ["develop", "staging"] }`
  - *Respuesta (HTTP 201):* `{ "validationStatus": "VALIDATED", "repoUrl": "https://github.com/..." }`
- **`POST /api/v1/projects/:id/github/webhook`**:
  - *Descripción:* Endpoint de recepción de webhooks de GitHub validado con HMAC-SHA256 (`X-Hub-Signature-256`).

---

## 10. Estrategia de Pruebas y Catálogo TDD (Línea Base para INIT-H02)

### 10.1 Línea Base de Pruebas Existentes (Verificada)
- `backend/test/auth.spec.ts`: Unitarias de login, hash Argon2id y sesiones opacas (Pasa).
- `backend/test/projects.spec.ts`: Unitarias de aislamiento multitenant en servicio (Pasa).
- `backend/test/governance-negative.spec.ts`: Pruebas de violación SoD y anti-autoevaluación (Pasa).
- `prototype/src/services/*.spec.mjs`: 9 suites unitarias de frontend con Node test runner (Pasa).

### 10.2 Catálogo de Pruebas Obligatorias para INIT-H02

| ID Prueba | Tipo | Componente Evaluado | Requisito / Regla | Condición de Aprobación |
| :--- | :--- | :--- | :--- | :--- |
| **`TDD-INIT-01`** | Unitaria | `ProjectsService.initiateProject` | RF-20, RN-10 | Crea proyecto en estado `BORRADOR` con `organization_id` válido. |
| **`TDD-INIT-02`** | Negativa | `ProjectsService.initiateProject` | RN-10 | Rechaza con HTTP 400 si `organization_id` es inexistente. |
| **`TDD-INIT-03`** | Unitaria | `ProjectsService.assignTeamMember` | RF-19, RN-11 (DA-06) | Acepta usuario si pertenece activamente a `organization_member`. |
| **`TDD-INIT-04`** | Negativa | `ProjectsService.assignTeamMember` | RN-11 (DA-06) | Rechaza con HTTP 403 / 400 si el usuario no es miembro de la organización. |
| **`TDD-INIT-05`** | Unitaria | `GitHubAppClientService.linkRepo` | RF-21, DA-03 | Valida repositorio existente y registra estado `VALIDATED`. |
| **`TDD-INIT-06`** | Negativa | `GitHubAppClientService.linkRepo` | RF-21 | Emite error controlado si el repositorio no existe o faltan permisos. |
| **`TDD-INIT-07`** | Unitaria | `GitHubAppClientService.createRepo` | RF-21, DA-03 | Crea repositorio remoto, inicializa ramas y retorna estado `VALIDATED`. |
| **`TDD-INIT-08`** | Integración | `GitHubWebhookController` | RNF-01 | Valida firma HMAC-SHA256 (`X-Hub-Signature-256`) y procesa entrega. |
| **`TDD-INIT-09`** | Negativa | `GitHubWebhookController` | RNF-01 | Rechaza entrega con HTTP 401 si la firma HMAC es inválida o ausente. |
| **`TDD-INIT-10`** | Unitaria | `GitHubCryptoService` | RNF-01 | Cifra y descifra secretos con AES-256-GCM verificando autenticidad (tag). |
| **`TDD-INIT-11`** | Integración | `ProjectLifecycleService.activate` | RF-23, RN-12 (DA-04) | Activa proyecto si GitHub está `VALIDATED` y roles mínimos cubiertos. |
| **`TDD-INIT-12`** | Negativa | `ProjectLifecycleService.activate` | RN-12 (DA-04) | Rechaza activación con HTTP 412 si GitHub no está validado. |
| **`TDD-INIT-13`** | Integración | `ProjectActiveGuard` + `RfcsController` | RN-13 (DA-04) | Bloquea creación de RFC (HTTP 412) si el proyecto está en `BORRADOR` o `SUSPENDIDO`. |
| **`TDD-INIT-14`** | Integración | `ProjectActiveGuard` + `RfcsController` | RN-13 (DA-04) | Permite creación de RFC si el proyecto se encuentra en estado `ACTIVO`. |
| **`TDD-INIT-15`** | Regresión | `AuditService.logEvent` | RF-17, RNF-03 | Registra eventos de activación e integración en cadena SHA-256 inmutable. |

### 10.3 Orden de Implementación TDD para INIT-H02
1. **Fase 1 (Criptografía y Servicios Base):** Escribir `github-crypto.spec.ts` $\rightarrow$ Implementar `GitHubCryptoService`.
2. **Fase 2 (Modelo de Organización y DA-06):** Escribir `organizations.spec.ts` $\rightarrow$ Implementar `OrganizationsModule` y validación de membresía.
3. **Fase 3 (Asistente y Estado Borrador):** Escribir `project-setup.spec.ts` $\rightarrow$ Implementar `ProjectSetupWizardService` y autosave JSONB.
4. **Fase 4 (Cliente GitHub y Webhooks):** Escribir `github-client.spec.ts` y `github-webhook.spec.ts` $\rightarrow$ Implementar `GitHubAppClientService` con mocks de API.
5. **Fase 5 (Activación y Salvaguardas SCM - DA-04):** Escribir `project-activation.spec.ts` y `project-active-guard.spec.ts` $\rightarrow$ Implementar `ProjectLifecycleService` y `@UseGuards(ProjectActiveGuard)` en `RfcsController`.
6. **Fase 6 (Integración E2E y Frontend):** Conectar endpoints en `prototype/src/services/api/` y construir vistas del Asistente y Panel de Configuración.

---

## 11. Riesgos, Limitaciones y Dependencias

| Identificador | Descripción del Riesgo | Impacto | Mitigación Planificada |
| :--- | :--- | :---: | :--- |
| **RSK-INIT-01** | *Límites de tasa (Rate Limiting) en GitHub API:* El consumo intensivo de consultas de validación podría agotar la cuota de peticiones. | Medio | Implementación de caché en memoria para metadatos de repositorios y uso de GitHub App (5,000 req/h por instalación). |
| **RSK-INIT-02** | *Falla de conectividad hacia GitHub durante la activación:* Inestabilidad temporal de red que impida validar el repositorio. | Alto | Reintentos exponenciales con jitter y estado transitorio `PENDIENTE_VALIDACION` con mensaje descriptivo sin bloquear al usuario. |
| **RSK-INIT-03** | *Desalineación de repositorios renombrados o transferidos:* El repositorio enlazado cambia de nombre o propietario en GitHub. | Medio | Detección mediante webhook de evento `repository` (`action: renamed/transferred`) y actualización automática por `github_repo_id` numérico inmutable. |
| **RSK-INIT-04** | *Privilegios insuficientes en PostgreSQL (`traceflow_app`):* El usuario de la aplicación no puede escribir en tablas de proyectos. | Alto | Script DDL formal de mínimo privilegio (`GRANT SELECT, INSERT, UPDATE`) preparado para ejecución controlada en INIT-H02. |
| **RSK-INIT-05** | *Conflictos con proyectos preexistentes:* Los proyectos `PRJ-001`..`PRJ-003` carecen de integración GitHub histórica. | Alto | Estrategia de transición con estado `HISTORICO_PENDIENTE_GITHUB`: consulta histórica abierta y regularización obligatoria para nuevos cambios. |

---

## 12. Criterios de Aceptación y Estado de Aprobación

### 12.1 Criterios de Aceptación Verificables del Hito INIT-H01
1. **Auditoría Exhaustiva:** Se documentan con exactitud las brechas del código real frente a la especificación, con matrices de brechas y citas a archivos y líneas de código.
2. **Cumplimiento de DA-01 a DA-06:** El diseño incorpora de manera estricta todas las decisiones aprobadas sin modificarlas ni omitirlas.
3. **Modelado Gráfico Completo:** Se generan y compilan los 10 diagramas canónicos (`DG-INIT-01` a `DG-INIT-10`) en formatos SVG y PNG con estricto UTF-8 y legibilidad certificada.
4. **Diseño de Persistencia Seguro:** Se propone un modelo de datos incremental normalizado con tipos, restricciones y mínimo privilegio, garantizando cero pérdida de datos históricos y sin ejecutar DDL sobre la base real.
5. **Seguridad y Criptografía:** Se define la arquitectura de integración con GitHub mediante GitHub App, almacenamiento seguro de tokens con AES-256-GCM y validación de webhooks con HMAC-SHA256.
6. **Estrategia TDD:** Se especifica el catálogo de pruebas y la secuencia estricta de desarrollo guiado por pruebas para el hito ejecutable `INIT-H02`.
7. **Control de Calidad Documental:** Trazabilidad formal con SRS, SAD, Diccionario de Datos, Glosario, Matriz de Trazabilidad y Estándares de Programación.

### 12.2 Estado de Aprobación
- **Estado del Documento:** CANDIDATO A APROBACIÓN FORMAL (INIT-H01)
- **Elaborado por:** C-SharkTeam (Arquitectura de Software y Seguridad)
- **Destinatario para Dictamen:** Responsable del Proyecto / Comité de Control de Cambios (CCB)
- **Fecha de Cierre H01:** 25 de noviembre de 2026

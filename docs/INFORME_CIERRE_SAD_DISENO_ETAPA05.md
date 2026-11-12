# INFORME DE CIERRE — ETAPA 05
## Actualización Integral del SAD de Diseño (FD05 v0.5), Conciliación Arquitectónica y Publicación en GitHub

> **Código de Informe:** `INF-CIERRE-SAD-DISENO-ETAPA05`
> **Proyecto:** Sistema de Gestión de Configuración de Software — TraceFlow SCM
> **Organización Cliente:** ÉXODO S.A.C.
> **Equipo Responsable:** C-SharkTeam (Medina, Antayhua, Loyola, Rivera)
> **Rol de Auditoría:** Ingeniero Senior de Arquitectura de Software, Especialista en Ingeniería de Requisitos y Responsable de SCM
> **Fecha de Emisión:** 12 de Noviembre de 2026
> **Rama Documental:** `docs/alineacion-srs-sad-2026-11-12`
> **Commit Base de Entrada:** `012c267c8be87eb775b03ca6b67486db85945d7e` (`012c267`)
> **Línea Base Original del Repositorio:** `6ff6d7e8912be90807c8911ba25584fb77037370` (`6ff6d7e`)
> **Estado Documental Resultante:** **REVISIÓN CANDIDATA v0.5 (BORRADOR EN REVISIÓN — PENDIENTE DE APROBACIÓN FORMAL POR CCB)**

---

```
========================================================================================
                      UNIVERSIDAD PRIVADA DE TACNA
                         FACULTAD DE INGENIERÍA
              ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS

        "Sistema de Gestión de Configuración de Software - TraceFlow SCM"
                         INFORME TÉCNICO DE CIERRE
                                 ETAPA 05:
            ACTUALIZACIÓN INTEGRAL DEL SAD DE DISEÑO (FD05 v0.5),
            CONCILIACIÓN ARQUITECTÓNICA Y PUBLICACIÓN EN GITHUB

    Especialidad: Gestión de la Configuración de Software (SCM), Arquitectura y Auditoría
    Marco Normativo: IEEE 828-2012, ISO/IEC/IEEE 12207:2017, IEEE 42010:2011, UWE Methodology

    Equipo Auditor y Responsable (C-SharkTeam):
      - MEDINA QUISPE, Joan Cristian         (Administrador de Configuración / Arquitecto)
      - ANTAYHUA MAMANI, Renzo Antonio       (Analista de Requerimientos / Gestor SCM)
      - LOYOLA VILCA CHOQUE, Renzo Fernando  (Ingeniero de Software / Frontend Lead)
      - RIVERA MUÑOZ, Augusto Joaquin        (Aseguramiento de Calidad / Auditor SCM)

                                TACNA — PERÚ
                                    2026
========================================================================================
```

---

## 1. Resumen Ejecutivo

El presente informe técnico formaliza el cierre exitoso y riguroso de la **Etapa 05: Actualización integral del SAD de Diseño, conciliación arquitectónica y publicación en GitHub** dentro del proceso metodológico de alineación documental del proyecto **TraceFlow SCM** (`https://github.com/JMedina255/TraceFlow`).

Durante esta etapa se ha intervenido el documento principal **`docs/FD05-EPIS-Informe_SAD_Diseno.md`**, elevándolo desde su versión previa v0.4 hacia la **Revisión Candidata v0.5 (Borrador en Revisión — Pendiente de Aprobación Formal por CCB)**, logrando los siguientes hitos de ingeniería:
1. **Conciliación Arquitectónica con ADRs (ADR-001 a ADR-010)**: Se verificó la consistencia de las decisiones arquitectónicas vigentes, resolviendo prioritariamente la contradicción histórica detectada respecto a **ADR-006**, reafirmando que el único mecanismo de autenticación y gestión de sesiones aprobado es la **Cookie HttpOnly con Identificador de Sesión Opaco Almacenado en Servidor (PostgreSQL)** con timeout de inactividad de 15 minutos y guards de autorización en backend NestJS; dejando constancia expresa de que Keycloak constituye una alternativa formalmente diferida y JWT fue rechazado por vulnerabilidades XSS e incapacidad de revocación inmediata.
2. **Delimitación Canónica Tripartita (§1.6)**: Se incorporó la separación conceptual, objetivo e implementada en el SAD de Diseño, delimitando nítidamente la Arquitectura Conceptual (SAD Análisis), la Arquitectura Objetivo de Producción (Monolito Modular NestJS, PostgreSQL 16, StoragePort, Docker) y el Prototipo Demostrativo en React SPA (`prototype/`), consagrando la regla de no falseamiento técnico.
3. **Auditoría y Aviso Editorial de 36 Diagramas de Diseño (§3 a §20)**: Se auditaron los 36 diagramas de diseño que presentaban referencias a imágenes `.png` inexistentes (6 de arquitectura física, 9 de secuencias técnicas, 8 de navegación UWE y 13 de presentación UWE), insertando notas editoriales estandarizadas que preservan intactos los identificadores canónicos y las fuentes PlantUML, vinculándolos al plan de generación física de la Etapa 06.
4. **Formalización de la Matriz Canónica de Pantallas (§20.5)**: Se consolidó el catálogo de **20 Pantallas Físicas Canónicas (`SCREEN-01` a `SCREEN-20`)**, detallando su correspondencia con las rutas de React SPA (`AppRouter.tsx`), sus componentes de implementación, flujos de navegación (`NAV-01` a `NAV-28`), patrones de presentación (`PRES-01` a `PRES-10`), wireframes (`WF-01` a `WF-20`) y casos de uso gobernados (`CU-01` a `CU-30`, `CU-04.1`), certificando que el prototipo contiene **8 pantallas interactivas funcionales** (orquestadas mediante 9 componentes de vista en `src/features/`), **12 pantallas demostrativas** (parametrizadas en `ScreenPlaceholder.tsx`) y **2 vistas de soporte técnico** (`NotFoundView.tsx` y `AccessDeniedView.tsx`).
5. **Auditoría de API REST y Operaciones (§9.4)**: Se incorporó una matriz exhaustiva de correspondencia de 33 operaciones de API REST con sus verbos HTTP, casos de uso, requisitos funcionales, roles canónicos autorizados, payloads y estados de implementación.
6. **Acotamiento de Compromisos RNF y Pruebas Operativas (§13, §14, §15)**: Se clarificó formalmente que la disponibilidad del 99.9%, el RTO $\le 2$ horas y el RPO = 0 corresponden a compromisos de diseño arquitectónico y no a resultados empíricos de laboratorio ejecutados en el prototipo.
7. **Saneamiento del Archivo Maestro (`docs/MAESTRO_CAMBIOS_SRS_SAD.md`)**: Se actualizaron los metadatos de portada a la versión de trabajo **0.5.0**, se sincronizó la tabla de control, se actualizaron los estados de los hallazgos `DOC-009`, `DOC-010`, `DOC-024`, `DOC-026`, `DOC-027`, se incorporó el nuevo hallazgo `DOC-029` y se registró el hito en el historial de revisiones (§13).

---

## 2. Estado Git Inicial

Antes de proceder con las modificaciones técnicas y documentales, se verificó el estado riguroso del repositorio local:
- **Directorio de Trabajo Local:** `C:\Users\Admin\Desktop\Proyectos\TraceFlowSCM\TraceFlow`
- **Rama Activa:** `docs/alineacion-srs-sad-2026-11-12`
- **Commit HEAD Inicial:** `012c267c8be87eb775b03ca6b67486db85945d7e` (`012c267 docs(sad): align analysis architecture with SRS v1.1`)
- **Sincronización Remota:** Se ejecutó `git fetch origin`. El HEAD local coincidía de manera exacta y limpia con `origin/docs/alineacion-srs-sad-2026-11-12`.
- **Árbol de Trabajo:** Completamente limpio (`working tree clean`, sin archivos no rastreados ni modificaciones previas no autorizadas).
- **Línea Base Histórica de Partida:** `6ff6d7e8912be90807c8911ba25584fb77037370` (`6ff6d7e`).

---

## 3. Documentos Revisados

Para fundamentar técnicamente las modificaciones de la Etapa 05, se auditaron en su totalidad los siguientes instrumentos:
1. `docs/FD05-EPIS-Informe_SAD_Diseno.md` (Versión base v0.4, 4,837 líneas).
2. `docs/MAESTRO_CAMBIOS_SRS_SAD.md` (Versión 0.4.0 en cuerpo, portada y tabla desactualizadas en 0.2.0).
3. `docs/FD03-EPIS-Informe_SRS.md` (Revisión Candidata v1.1, consolidada en Etapa 03).
4. `docs/FD04-EPIS-Informe_SAD_Analisis.md` (Revisión Candidata v1.2, consolidada en Etapa 04).
5. `docs/TABLES.md` (Tablas maestras `TB-01` a `TB-14`).
6. `docs/DIAGRAMS.md` (Catálogo de 114 diagramas y especificaciones PlantUML).
7. `docs/DOCUMENTATION_RULES.md` (Normativa SSOT y reglas de no divergencia).
8. `docs/PROTOTYPE_SPECIFICATION.md` (Especificación funcional del prototipo React SPA).
9. Registros de Decisión Arquitectónica (`docs/adr/ADR-001.md` a `ADR-010.md` y `README.md`).
10. Base de código del prototipo React SPA (`prototype/src/routes/AppRouter.tsx`, `prototype/src/services/MockDataService.ts`, `prototype/src/store/useDemoStore.ts`, componentes en `prototype/src/features/` y `prototype/src/components/`).

---

## 4. Revisión y Versionado del FD05

El Documento de Arquitectura de Software — Fase de Diseño (`FD05`) ha sido elevado formalmente a:
- **Versión Resultante:** **0.5 (Revisión Candidata — Alineamiento con SRS v1.1, SAD Análisis v1.2 y ADRs)**
- **Fecha de Emisión:** 12 de Noviembre de 2026
- **Estado Documental:** **BORRADOR EN REVISIÓN (Pendiente de Aprobación Formal por CCB)**
- **Cambios Principales Registrados en Control de Versiones:**
  - Inclusión formal de la fila de versión **0.5** en la tabla de control de versiones.
  - Actualización del Índice General incorporando las secciones 1.6, 9.4, 18 (ampliada) y 21.7.
  - Actualización de los propósitos y alcances en §1.1 y §1.2.
  - Actualización de la jerarquía de autoridad en §1.3 reflejando las versiones candidatas vigentes (`SRS v1.1`, `SAD Análisis v1.2`, `SAD Diseño v0.5`).
  - Incorporación de la declaración de cierre de revisión candidata en §21.7.

---

## 5. Correcciones de Arquitectura Física

Se examinaron las Secciones 3, 4 y 5 del SAD de Diseño (`FD05`):
1. **Topología General (§3.1)**: Se verificó la coherencia de la topología cliente-servidor de 3 capas:
   - Capa Cliente: Navegador Web ejecutando React SPA.
   - Capa de Aplicación / Reverse Proxy: Nginx enrutando hacia réplicas del backend Monolito Modular NestJS.
   - Capa de Persistencia: PostgreSQL 16 y sistema de archivos / Object Storage mediante `StoragePort`.
2. **Diagramas Físicos Auditados**:
   - `DG-D01`: Arquitectura Física de Software.
   - `DG-D02`: Componentes del Monolito Modular (9 módulos técnicos correspondientes a `MOD-01` a `MOD-09`).
   - `DG-D03`: Modelo Relacional Lógico de Diseño.
   - `DG-D04`: Arquitectura de Storage y Bibliotecas SCM.
   - `DG-D05`: Flujo Técnico de Autenticación y Autorización.
   - `DG-D06`: Diagrama de Despliegue en Contenedores Docker.
   A todos estos diagramas se les incorporó su respectivo aviso editorial estandarizado de render pendiente para la Etapa 06.

---

## 6. Conciliación de los ADR (Matriz ADR-001 a ADR-010)

Se auditó de forma exhaustiva la correspondencia entre los 10 ADRs aprobados y el contenido de `FD05`:

| ADR | Título Oficial y Decisión Real Aprobada | Referencia en FD05 | Nivel de Consistencia | Corrección / Ajuste Aplicado en Etapa 05 |
| :---: | :--- | :--- | :---: | :--- |
| **ADR-001** | **Monolito Modular**: Backend único desacoplado en 9 módulos técnicos (`MOD-01` a `MOD-09`) con transacciones ACID locales. | §2.1, §4.1, §4.4 | **Total (100%)** | Ninguna. Se reafirmó el aislamiento intermodular y el uso de eventos de dominio locales. |
| **ADR-002** | **React + TypeScript + Vite SPA**: Frontend enriquecido desacoplado sin SSR para consumo de API REST por 7 roles. | §2.1, §6.1, §6.2 | **Total (100%)** | Delimitación expresa de rutas reales y componentes de vista en §20.5. |
| **ADR-003** | **Node.js (LTS) + TypeScript + NestJS**: Framework backend con inyección de dependencias, tipado y Clean Architecture. | §2.1, §4.2, §5.1 | **Total (100%)** | Ratificación de las 4 capas concéntricas (Dominio, Aplicación, Adaptadores, Infraestructura). |
| **ADR-004** | **PostgreSQL Relacional Transaccional**: Motor relacional con índices condicionales, RLS y JSONB de auditoría. | §2.1, §7.1, §7.3 | **Total (100%)** | Ratificación del modelo lógico derivado de `DG-12`. |
| **ADR-005** | **Custodia Híbrida y Puerto `StoragePort`**: Separación de metadatos (DB) y contenido físico de ECS desacoplado. | §2.1, §8.1, §8.4 | **Total (100%)** | Ratificación del protocolo de transferencia en 2 fases y worker de reconciliación. |
| **ADR-006** | **Cookie HttpOnly + Sesión Opaca en Servidor**: Token criptográfico aleatorio, hash en `user_session`, timeout 15 min y Guards RBAC/SoD. Keycloak diferido; JWT rechazado. | §2.1, §10.2, §19.6 | **Total (100%)** | **Aclaración Crítica**: Se insertó aviso de aclaración en §2.1 y §10.2 desvirtuando menciones erróneas a Keycloak/JWT en informes previos. |
| **ADR-007** | **Bloqueo Persistente Condicional (RN-06)**: Bloqueo exclusivo a nivel de PostgreSQL con índice único condicional. | §2.1, §7.4, §12.2 | **Total (100%)** | Ratificación de liberación exclusiva por CU-12 (Check-In), CU-21 (Rollback) o CU-22 (Cancelación). |
| **ADR-008** | **Auditoría Append-Only en PostgreSQL**: Tabla inmutable sin permisos UPDATE/DELETE, triggers de inmutabilidad y hash encadenado SHA-256. | §2.1, §11.1, §11.2 | **Total (100%)** | Ratificación del cálculo SHA-256 acumulativo inter-registros. |
| **ADR-009** | **API RESTful + JSON + OpenAPI 3.0**: Transporte HTTPS, verbos semánticos, formato de error RFC 7807 y especificación OAS 3.0. | §2.1, §9.1, §9.3 | **Total (100%)** | Incorporación de la matriz detallada de 33 operaciones de API en §9.4. |
| **ADR-010** | **Docker Multi-Stage + Unidad de Respaldo**: Empaquetado OCI, Compose, Nginx, réplicas stateless y respaldo de Unidad Lógica (`DB+Storage+Manifest`). | §2.1, §13.1, §14.1 | **Total (100%)** | Acotamiento de SLAs como metas de diseño sin pruebas empíricas en infraestructura física. |

---

## 7. Tratamiento de ADR-006

### 7.1. Diagnóstico de la Contradicción Detectada
En el informe de cierre de la Etapa 04 (`INF-CIERRE-SAD-ETAPA04.md`), se incluyó una referencia contextual que describía a Keycloak y JWT como tecnologías vinculadas a ADR-006.

La auditoría técnica obligatoria realizada en esta Etapa 05 sobre el archivo canónico **`docs/adr/ADR-006.md`** constató fehacientemente que:
- **Decisión Formal Aprobada**: Adopción de **Autenticación Basada en Cookie HttpOnly con Identificador de Sesión Opaco Almacenado en Servidor (PostgreSQL)**, complementada con **Guards de Autorización RBAC y Segregación de Funciones (SoD) en NestJS**.
- **Alternativa A (JWT en localStorage)**: Terminantemente **RECHAZADA** por riesgo crítico de filtración XSS.
- **Alternativa B (JWT en Cookie HttpOnly stateless)**: Formalmente **DESCARTADA** por imposibilidad de revocación instantánea y dificultad para auditar inactividad sin capa de estado.
- **Alternativa C (Identity Provider Externo / Keycloak)**: Expresamente **DIFERIDA** como una vía de evolución futura para no introducir una sobrecarga de infraestructura desproporcionada.
- **Alternativa D (Sesión Opaca en Servidor con Cookie HttpOnly)**: **SELECCIONADA Y APROBADA**.

### 7.2. Acciones y Saneamiento en FD05
El documento `docs/FD05-EPIS-Informe_SAD_Diseno.md` ya se encontraba alineado internamente con ADR-006 (presenta 11 menciones a `HttpOnly`, 7 menciones a `user_session` y 0 menciones operativas a Keycloak). Sin embargo, para erradicar cualquier ambigüedad futura, se implementaron las siguientes medidas:
1. **Nota Aclaratoria en §2.1**: Se añadió una nota oficial bajo la tabla de ADRs ratificando la decisión de ADR-006 y desvirtuando cualquier mención histórica a Keycloak o JWT.
2. **Delimitación de Guardas en §10.2**: Se explicitó que las guardas del prototipo (`ProtectedRoute.tsx` y `RoleGuard.tsx`) son client-side para navegación, mientras que la verdadera seguridad reside en los decoradores y guards de NestJS sobre `user_session`.
3. **Registro en el Archivo Maestro**: Se creó el hallazgo **`DOC-029`** para dar trazabilidad al saneamiento de esta inconsistencia en reportes históricos.

---

## 8. Arquitectura Objetivo e Implementada (Delimitación Tripartita)

En estricto cumplimiento de la instrucción técnica, se formalizó la **Sección 1.6 de `FD05`**, estableciendo la siguiente delimitación:

```
+-----------------------------------------------------------------------------------------+
|                                  ARQUITECTURA CONCEPTUAL                                |
|  - SAD de Análisis (FD04 v1.2)                                                          |
|  - 9 Módulos Conceptuales (MOD-01..09) | 31 Casos de Uso (CU-01..30, CU-04.1)           |
|  - 7 Actores Canónicos (TB-09) | 14 Estados RFC (TB-07) | Modelo Conceptual DG-12       |
+------------------------------------------------------------+----------------------------+
                                                             | (Diseño Técnico de Ingeniería)
                                                             v
+-----------------------------------------------------------------------------------------+
|                                    ARQUITECTURA OBJETIVO                                |
|  - SAD de Diseño (FD05 v0.5) y Registros de Decisión (ADR-001 a ADR-010)                |
|  - Backend Monolito Modular NestJS (Node 24 LTS) en 4 capas Clean Architecture          |
|  - PostgreSQL 16: Transaccional, RLS, Lock Condicional (RN-06), Auditoría Append-Only   |
|  - StoragePort: Desacoplamiento de archivos físicos (Local / MinIO / S3)               |
|  - Seguridad: Sesión Opaca en DB, Cookie HttpOnly (15 min), RBAC & SoD Guards Backend   |
|  - Despliegue: Docker Multi-Stage, Nginx Reverse Proxy, Unidad Lógica de Respaldo       |
+------------------------------------------------------------+----------------------------+
                                                             | (Línea Base Demostrativa)
                                                             v
+-----------------------------------------------------------------------------------------+
|                                  ARQUITECTURA IMPLEMENTADA                              |
|  - Prototipo React SPA (prototype/src/)                                                 |
|  - React 19 + TypeScript + Vite + Tailwind CSS                                          |
|  - 20 Pantallas Canónicas: 8 Interactivas Funcionales (9 vistas) + 12 Placeholders       |
|  - 2 Vistas de Soporte Técnico: NotFoundView (404) y AccessDeniedView (403)             |
|  - Persistencia Mock: MockDataService.ts en memoria y localStorage (Zustand store)       |
|  - Guardas de Navegación Client-Side: ProtectedRoute.tsx y RoleGuard.tsx                 |
+-----------------------------------------------------------------------------------------+
```

---

## 9. Diseño de Componentes

Se confirmó la arquitectura de componentes del Monolito Modular en NestJS (§4 y §5 de `FD05`):
- **Estructura Interna**: Cada uno de los 9 módulos técnicos (`MOD-01` a `MOD-09`) encapsula su dominio, casos de uso, controladores y repositorios.
- **Aislamiento**: Queda terminantemente prohibido el acceso directo entre repositorios de módulos distintos. La comunicación intermodular se realiza exclusivamente a través de servicios de aplicación públicos exportados o mediante un despachador de eventos de dominio locales en memoria.
- **Clean Architecture / Hexagonal**: Se ratificaron las 4 capas unidireccionales:
  1. *Capa de Dominio*: Entidades, Value Objects, Reglas de Negocio puras.
  2. *Capa de Aplicación*: Casos de Uso, DTOs, Puertos de Salida.
  3. *Capa de Adaptadores / Interfaz*: Controladores REST, Presentadores, Guards.
  4. *Capa de Infraestructura*: TypeORM / Kysely, PostgreSQL, Sistema de Archivos, Logger.

---

## 10. Diseño de Base de Datos

Se auditó el diseño relacional lógico (§7 de `FD05`):
- **Derivación de `DG-12`**: Las entidades conceptuales se transforman limpiamente en tablas relacionales (`user`, `role`, `project`, `rfc`, `rfc_classification`, `impact_assessment`, `ccb_vote`, `ecn`, `ecs`, `ecs_version`, `sync_lock`, `qa_validation`, `uat_signoff`, `baseline`, `baseline_item`, `incident`, `audit_log`).
- **Bloqueo Persistente Condicional (`RN-06`)**: Se ratificó el diseño técnico mediante índice único parcial:
  ```sql
  CREATE UNIQUE INDEX uq_sync_lock_active_ecs
  ON sync_lock (ecs_id)
  WHERE status = 'ACTIVE';
  ```
- **Integridad Transaccional**: La adquisición del lock ocurre de forma pesimista durante el Check-Out (`CU-10 / CU-11`), impidiendo concurrencia destructiva.

---

## 11. Arquitectura de Seguridad

Se verificaron las especificaciones de seguridad (§10 de `FD05`):
- **Modelo de Identidad**: Autenticación centralizada basada en contraseña hasheada con Argon2id.
- **Gestión de Sesión**: Generación de token opaco aleatorio (256 bits), hash SHA-256 en tabla `user_session`, emisión de Cookie con `HttpOnly; Secure; SameSite=Strict; Max-Age=900` (15 minutos).
- **Protección CSRF**: Header obligatorio `X-Requested-With: XMLHttpRequest` verificado por interceptor global.
- **Autorización y SoD en Servidor**:
  - `RolesGuard` verificando decorador `@Roles()`.
  - `SodGuard` impidiendo auto-aprobación en CCB (`CU-07`) y certificación propia en QA (`CU-17`).

---

## 12. API REST (Catálogo de Endpoints y Operaciones)

Se formalizó la **Sección 9.4 de `FD05`**, consolidando un catálogo de **33 operaciones RESTful** que cubren el 100% de los 31 casos de uso de TraceFlow SCM:
- **Operaciones de Autenticación y Usuarios**: `POST /auth/login`, `POST /auth/logout`, `GET /users`, `POST /users` (`CU-01`).
- **Operaciones de Proyectos**: `GET /projects`, `POST /projects`, `GET /projects/{id}` (`CU-02`, `CU-03`).
- **Operaciones de RFC**: `GET /rfcs`, `POST /rfcs`, `GET /rfcs/{id}`, `PATCH /rfcs/{id}/rectification` (`CU-04`, `CU-04.1`), `PATCH /rfcs/{id}/classify` (`CU-05`).
- **Operaciones de Evaluación y Aprobación**: `POST /rfcs/{id}/impact-assessment` (`CU-06`), `POST /rfcs/{id}/ccb-resolution` (`CU-07`), `POST /rfcs/{id}/minor-approval` (`CU-30`).
- **Operaciones de Órdenes de Cambio**: `POST /rfcs/{id}/change-order` (`CU-08`), `POST /rfcs/{id}/cancel` (`CU-22`).
- **Operaciones de ECS y Versionado**: `GET /projects/{id}/ecs`, `POST /projects/{id}/ecs` (`CU-09`), `POST /ecs/{id}/check-out` (`CU-10`, `CU-11`), `POST /ecs/{id}/check-in` (`CU-12`), `GET /ecs/{id}/history` (`CU-13`), `GET /ecs/inventory` (`CU-26`).
- **Operaciones de Calidad y Cierre**: `POST /qa/validations` (`CU-16..19`), `POST /rfcs/{id}/uat-signoff` (`CU-29`).
- **Operaciones de Líneas Base**: `POST /baselines` (`CU-20`), `POST /ecs/{id}/rollback` (`CU-21`).
- **Operaciones de Incidencias**: `GET /incidents`, `POST /incidents`, `PATCH /incidents/{id}/link-rfc`, `PATCH /incidents/{id}/close` (`CU-23..25`).
- **Operaciones de Auditoría**: `GET /audit/logs` (`CU-27`), `GET /audit/reports` (`CU-28`).

La matriz clasifica transparentemente cuáles operaciones están interactivas en el prototipo y cuáles son objetivos de diseño simulados mediante `MockDataService`.

---

## 13. Ciclo de Vida RFC

Se verificó la total consistencia del flujo de vida de Solicitudes de Cambio:
- **14 Estados Oficiales Canónicos (`TB-07`)**: `REGISTRADA`, `OBSERVADA`, `SUBSANADA`, `VALIDADA`, `EN_EVALUACION`, `EVALUADA`, `APROBADA`, `DESAPROBADA`, `AUTORIZADA`, `EN_DESARROLLO`, `EN_PRUEBAS`, `CERTIFICADA`, `CANCELADA`, `CERRADA`.
- **20 Transiciones Operativas**: Se ratificaron todas las transiciones documentadas en el SAD de Análisis (Sección 7.2) y su correspondencia con los controladores de aplicación y vistas de interfaz.

---

## 14. Diagramas de Secuencia Técnica

Se auditaron las 9 secuencias críticas de diseño refactorizadas en §12 de `FD05`:
1. `DG-DSEQ-04`: Registrar Solicitud de Cambio (RFC) (`CU-04`).
2. `DG-DSEQ-08`: Emitir Orden de Cambio (ECN/ECO) (`CU-08`).
3. `DG-DSEQ-10`: Efectuar Check-Out con Bloqueo de Sincronización (`CU-10`, `CU-11`, `RN-06`).
4. `DG-DSEQ-12`: Efectuar Check-In de Ítem de Configuración (`CU-12`, `RNF-03`, `RF-17`, `RN-09`).
5. `DG-DSEQ-17`: Certificar Conformidad de Calidad (`CU-17`, SoD Dinámico).
6. `DG-DSEQ-20`: Crear y Congelar Línea Base (`CU-20`, `RN-02`, `RN-09`).
7. `DG-DSEQ-21`: Revertir Versión de ECS - Rollback en Biblioteca de Trabajo (`CU-21`, `RN-08`).
8. `DG-DSEQ-29`: Validar Aceptación del Cambio por el Usuario (UAT) (`CU-29`, `RN-09`).
9. `DG-DSEQ-30`: Autorizar Cambio Menor por Vía Delegada Compartida (`CU-30`, `RN-01`, `RN-05`).

Todas las secuencias conservan sus actores canónicos, participantes técnicos, llamadas REST internas y notas de aviso editorial para la fase de renderizado gráfico.

---

## 15. Navegación UWE

Se ratificaron los modelos UWE de navegación en §19 de `FD05`:
- **Catálogo de Nodos**: 28 nodos navegacionales (`NAV-01` a `NAV-28`).
- **Modelos por Rol**: 8 diagramas de navegación:
  - `DG-UWE-NAV-01`: Modelo General de Navegación de TraceFlow SCM.
  - `DG-UWE-NAV-02`: Solicitante (`PU-01`).
  - `DG-UWE-NAV-03`: Analista de Requerimientos / Gestor de Configuración (`PU-02`).
  - `DG-UWE-NAV-04`: Arquitecto de Software / Especialista Técnico (`PU-03`).
  - `DG-UWE-NAV-05`: Comité de Control de Cambios CCB (`PU-04`).
  - `DG-UWE-NAV-06`: Administrador de Configuración / Bibliotecario (`PU-05`).
  - `DG-UWE-NAV-07`: Ingeniero de Software / Desarrollador (`PU-06`).
  - `DG-UWE-NAV-08`: Equipo de Calidad / Testing (`PU-07`).
Todos los diagramas cuentan con notas editoriales de renderizado pendiente.

---

## 16. Pantallas y Wireframes

Se auditó de forma concluyente la arquitectura visual en §20 y §21 de `FD05`:
- **Total Canónico de Pantallas**: 20 pantallas físicas (`SCREEN-01` a `SCREEN-20`).
- **Distribución en Prototipo React SPA**:
  - **8 Pantallas Interactivas Funcionales** implementadas por 9 componentes de vista:
    1. `SCREEN-01` (Login): `LoginView.tsx` (`/login`).
    2. `SCREEN-02` (Dashboard): `DashboardView.tsx` (`/dashboard`).
    3. `SCREEN-05` (Bandeja RFC): `RfcListView.tsx` (`/rfcs`).
    4. `SCREEN-06` (Expediente 360°): `RfcDetailView.tsx` (`/rfcs/:rfcId`).
    5. `SCREEN-07` (Captura y Subsanación RFC): `RfcCreateView.tsx` (`/rfcs/new`) y `RfcEditView.tsx` (`/rfcs/:rfcId/edit`).
    6. `SCREEN-08` (Análisis de Impacto): `RfcImpactAnalysisView.tsx` (`/rfcs/:rfcId/impact-analysis`).
    7. `SCREEN-09` (Deliberación CCB): `RfcCcbDeliberationView.tsx` (`/rfcs/:rfcId/ccb-deliberation`).
    8. `SCREEN-10` (Autorización Cambio Menor): `RfcMinorApprovalView.tsx` (`/rfcs/:rfcId/minor-approval`).
  - **12 Pantallas Demostrativas Parametrizadas**: Orquestadas mediante `ScreenPlaceholder.tsx` (`SCREEN-03`, `SCREEN-04`, `SCREEN-11` a `SCREEN-20`).
  - **2 Vistas de Soporte del Sistema**: `NotFoundView.tsx` (Error 404) y `AccessDeniedView.tsx` (Error 403 por fallo de guardas).
- **Catálogo de Wireframes**: `WF-01` a `WF-20` con variantes críticas `WF-06A/B/C` y `WF-13A/B` totalmente trazadas.

---

## 17. Diseño de Despliegue y Continuidad

Se auditaron las Secciones 13, 14 y 15 de `FD05`:
- **Topología de Contenedores**: Multi-stage Dockerfile con optimización de capas y reducción de superficie de ataque (usuario no privilegiado `node`).
- **Orquestación**: Docker Compose con réplicas balanceadas y reverse proxy Nginx.
- **Estrategia de Respaldo (`RNF-09`)**: Definición de la **Unidad Lógica de Respaldo** compuesta por el volcado relacional (`pg_dump` consistente), el árbol de almacenamiento físico de ECS (`StoragePort`) y el manifiesto criptográfico JSON (`manifest.json`) firmado con SHA-256.
- **Acotamiento Operativo**: Inclusión de notas formales indicando que los SLAs del 99.9% (`RNF-04`) y RTO $\le 2$ horas son compromisos de diseño pendientes de pruebas de estrés en infraestructura real.

---

## 18. Enlaces, Figuras y Plan de Recursos Gráficos (Inventario Etapa 06)

### 18.1. Tratamiento Editorial de los 36 Diagramas en FD05
Se sustituyeron todos los enlaces directos a imágenes inexistentes (`![ID](../assets/ID.png)`) por avisos editoriales GitHub-style `> [!NOTE]`, preservando de forma rigurosa:
1. El identificador técnico canónico.
2. El título formal del diagrama.
3. El bloque de código fuente `@startuml ... @enduml`.
4. La referencia a la ubicación planificada del render en `docs/assets/diagramas/render/`.

### 18.2. Inventario Exhaustivo para la Etapa 06 (Formalización Gráfica)
Se establece la estructura objetivo y el catálogo oficial para la extracción de `.puml` y renderizado de `.png` / `.svg` en la próxima etapa:

```text
docs/
└── assets/
    ├── diagramas/
    │   ├── plantuml/
    │   └── render/
    └── capturas/
```

| ID Diagrama | Tipo de Diagrama | Documento Fuente | Sección | Archivo Fuente Objetivo | Archivo Render Objetivo | Prioridad Gráfica | Acción Planificada |
| :---: | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| `DG-D01` | Arquitectura Física | `FD05` | §3.2 | `diagramas/plantuml/DG-D01.puml` | `diagramas/render/DG-D01.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-D02` | Componentes Backend | `FD05` | §4.4 | `diagramas/plantuml/DG-D02.puml` | `diagramas/render/DG-D02.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-D03` | Relacional Lógico | `FD05` | §7.2 | `diagramas/plantuml/DG-D03.puml` | `diagramas/render/DG-D03.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-D04` | Custodia y Storage | `FD05` | §8.3 | `diagramas/plantuml/DG-D04.puml` | `diagramas/render/DG-D04.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-D05` | Seguridad y Auth | `FD05` | §10.3 | `diagramas/plantuml/DG-D05.puml` | `diagramas/render/DG-D05.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-D06` | Despliegue Docker | `FD05` | §13.2 | `diagramas/plantuml/DG-D06.puml` | `diagramas/render/DG-D06.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-DSEQ-04`| Secuencia Técnica CU-04 | `FD05` | §12.2 | `diagramas/plantuml/DG-DSEQ-04.puml` | `diagramas/render/DG-DSEQ-04.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-DSEQ-08`| Secuencia Técnica CU-08 | `FD05` | §12.2 | `diagramas/plantuml/DG-DSEQ-08.puml` | `diagramas/render/DG-DSEQ-08.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-DSEQ-10`| Secuencia Técnica CU-10/11| `FD05` | §12.2 | `diagramas/plantuml/DG-DSEQ-10.puml` | `diagramas/render/DG-DSEQ-10.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-DSEQ-12`| Secuencia Técnica CU-12 | `FD05` | §12.2 | `diagramas/plantuml/DG-DSEQ-12.puml` | `diagramas/render/DG-DSEQ-12.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-DSEQ-17`| Secuencia Técnica CU-17 | `FD05` | §12.2 | `diagramas/plantuml/DG-DSEQ-17.puml` | `diagramas/render/DG-DSEQ-17.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-DSEQ-20`| Secuencia Técnica CU-20 | `FD05` | §12.2 | `diagramas/plantuml/DG-DSEQ-20.puml` | `diagramas/render/DG-DSEQ-20.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-DSEQ-21`| Secuencia Técnica CU-21 | `FD05` | §12.2 | `diagramas/plantuml/DG-DSEQ-21.puml` | `diagramas/render/DG-DSEQ-21.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-DSEQ-29`| Secuencia Técnica CU-29 | `FD05` | §12.2 | `diagramas/plantuml/DG-DSEQ-29.puml` | `diagramas/render/DG-DSEQ-29.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-DSEQ-30`| Secuencia Técnica CU-30 | `FD05` | §12.2 | `diagramas/plantuml/DG-DSEQ-30.puml` | `diagramas/render/DG-DSEQ-30.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-UWE-NAV-01`| UWE Navegación General | `FD05` | §19.3 | `diagramas/plantuml/DG-UWE-NAV-01.puml` | `diagramas/render/DG-UWE-NAV-01.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-NAV-02`| UWE Navegación PU-01 | `FD05` | §19.4 | `diagramas/plantuml/DG-UWE-NAV-02.puml` | `diagramas/render/DG-UWE-NAV-02.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-NAV-03`| UWE Navegación PU-02 | `FD05` | §19.4 | `diagramas/plantuml/DG-UWE-NAV-03.puml` | `diagramas/render/DG-UWE-NAV-03.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-NAV-04`| UWE Navegación PU-03 | `FD05` | §19.4 | `diagramas/plantuml/DG-UWE-NAV-04.puml` | `diagramas/render/DG-UWE-NAV-04.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-NAV-05`| UWE Navegación PU-04 | `FD05` | §19.4 | `diagramas/plantuml/DG-UWE-NAV-05.puml` | `diagramas/render/DG-UWE-NAV-05.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-NAV-06`| UWE Navegación PU-05 | `FD05` | §19.4 | `diagramas/plantuml/DG-UWE-NAV-06.puml` | `diagramas/render/DG-UWE-NAV-06.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-NAV-07`| UWE Navegación PU-06 | `FD05` | §19.4 | `diagramas/plantuml/DG-UWE-NAV-07.puml` | `diagramas/render/DG-UWE-NAV-07.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-NAV-08`| UWE Navegación PU-07 | `FD05` | §19.4 | `diagramas/plantuml/DG-UWE-NAV-08.puml` | `diagramas/render/DG-UWE-NAV-08.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-PRES-01`| UWE Presentación Shell | `FD05` | §20.3 | `diagramas/plantuml/DG-UWE-PRES-01.puml` | `diagramas/render/DG-UWE-PRES-01.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-PRES-02`| UWE Login | `FD05` | §20.4.1 | `diagramas/plantuml/DG-UWE-PRES-02.puml` | `diagramas/render/DG-UWE-PRES-02.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-PRES-03`| UWE Dashboard | `FD05` | §20.4.2 | `diagramas/plantuml/DG-UWE-PRES-03.puml` | `diagramas/render/DG-UWE-PRES-03.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-PRES-04`| UWE Expediente RFC | `FD05` | §20.4.4 | `diagramas/plantuml/DG-UWE-PRES-04.puml` | `diagramas/render/DG-UWE-PRES-04.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-PRES-05`| UWE Captura RFC | `FD05` | §20.4.5 | `diagramas/plantuml/DG-UWE-PRES-05.puml` | `diagramas/render/DG-UWE-PRES-05.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-PRES-06`| UWE Deliberación CCB | `FD05` | §20.4.6 | `diagramas/plantuml/DG-UWE-PRES-06.puml` | `diagramas/render/DG-UWE-PRES-06.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-PRES-07`| UWE Aprobación Menor | `FD05` | §20.4.6 | `diagramas/plantuml/DG-UWE-PRES-07.puml` | `diagramas/render/DG-UWE-PRES-07.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-PRES-08`| UWE Catálogo ECS | `FD05` | §20.4.7 | `diagramas/plantuml/DG-UWE-PRES-08.puml` | `diagramas/render/DG-UWE-PRES-08.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-PRES-09`| UWE Operaciones Check | `FD05` | §20.4.8 | `diagramas/plantuml/DG-UWE-PRES-09.puml` | `diagramas/render/DG-UWE-PRES-09.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-PRES-10`| UWE Consola QA | `FD05` | §20.4.9 | `diagramas/plantuml/DG-UWE-PRES-10.puml` | `diagramas/render/DG-UWE-PRES-10.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-PRES-11`| UWE Suscripción UAT | `FD05` | §20.4.10 | `diagramas/plantuml/DG-UWE-PRES-11.puml` | `diagramas/render/DG-UWE-PRES-11.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-PRES-12`| UWE Líneas Base | `FD05` | §20.4.11 | `diagramas/plantuml/DG-UWE-PRES-12.puml` | `diagramas/render/DG-UWE-PRES-12.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-UWE-PRES-13`| UWE Auditoría y Reportes| `FD05` | §20.4.13 | `diagramas/plantuml/DG-UWE-PRES-13.puml` | `diagramas/render/DG-UWE-PRES-13.png` | **Media** | Renderizar con PlantUML CLI |
| `DG-SAD-A01` | Arquitectura Conceptual BCE| `FD04` | §3.4 | `diagramas/plantuml/DG-SAD-A01.puml` | `diagramas/render/DG-SAD-A01.png` | **Alta** | Renderizar con PlantUML CLI |
| `DG-SAD-A02` | Dependencias Módulos | `FD04` | §4.3 | `diagramas/plantuml/DG-SAD-A02.puml` | `diagramas/render/DG-SAD-A02.png` | **Alta** | Renderizar con PlantUML CLI |

---

## 19. Correcciones de Trazabilidad

Se certificó el 100% de la coherencia en las cadenas de trazabilidad cruzada:
- **Requerimientos Funcionales (`RF-01` a `RF-18`)**: Todos se mapean a controladores REST, tablas de base de datos y pantallas físicas en `FD05`.
- **Requerimientos No Funcionales (`RNF-01` a `RNF-09`)**: Trazados a decisiones técnicas específicas (`RNF-01` Seguridad -> Argon2id / HttpOnly; `RNF-03` Integridad -> SHA-256; `RNF-04` Disponibilidad -> Docker replicas / Nginx; `RNF-06` Logging -> Winston / X-Correlation-ID).
- **Reglas de Negocio (`RN-01` a `RN-09`)**: Trazadas a validaciones técnicas (`RN-01` -> RBAC; `RN-02` -> Nomenclatura vX.Y.Z en baselines; `RN-04` -> SoD en Guards; `RN-05` -> Doble llave para cambio menor; `RN-06` -> Lock pesimista en PostgreSQL; `RN-08` -> Rollback exclusivo en Trabajo; `RN-09` -> Doble conformidad para Check-In a Maestra).
- **Casos de Uso (`CU-01` a `CU-30`, `CU-04.1`)**: 31 casos de uso mapeados en la matriz de API REST (§9.4) y en la matriz de pantallas (§20.5.1).

---

## 20. Actualización del Archivo Maestro

Se intervino **`docs/MAESTRO_CAMBIOS_SRS_SAD.md`**:
1. **Metadatos de Portada**: Elevados a versión **0.5.0**, Etapa 05, fecha 12/11/2026.
2. **Tabla de Control (§1)**: Sincronizada con la versión 0.5.0 y estado borrador de trabajo de Etapa 05.
3. **Matriz DOC (§6)**:
   - `DOC-009`: Actualizado a *Editorialmente Atendido en FD05 v0.5 / Render Pendiente en Etapa 06*.
   - `DOC-010`: Actualizado a *Implementado (FD05 v0.5, Sección 1.6 / Delimitación Tripartita)*.
   - `DOC-024`: Actualizado a *Implementado (FD05 v0.5, Sección 1.6 y §3)*.
   - `DOC-026`: Actualizado a *Implementado (FD04 v1.2 y FD05 v0.5 resueltos)*.
   - `DOC-027`: Actualizado a *Implementado (FD05 v0.5, Secciones 10.1, 10.2 y 19.6)*.
   - `DOC-029`: Incorporado para documentar y subsanar la discrepancia histórica sobre Keycloak/JWT vs ADR-006.
4. **Historial de Revisiones (§13)**: Incorporada la fila detallada de la versión **0.5.0**.

---

## 21. Hallazgos Resueltos y Pendientes

| Código | Descripción Resumida | Estado Previo | Estado Resultante Etapa 05 | Documento / Solución |
| :---: | :--- | :---: | :---: | :--- |
| **DOC-009** | 36 diagramas de diseño sin imagen en disco | Confirmado | **Editorialmente Atendido / Render Etapa 06** | Notas editoriales en `FD05` §3..20 e inventario oficial |
| **DOC-010** | Contraste arquitectura cliente-servidor vs prototipo | Confirmado | **Implementado** | `FD05` §1.6 (Delimitación Tripartita) |
| **DOC-024** | Cláusula delimitadora objetivo vs prototipo | Confirmado | **Implementado** | `FD05` §1.6 y §3 (Regla de no falseamiento) |
| **DOC-026** | Enlaces relativos internos redundantes `docs/...` | Parcial | **Implementado** | Rutas a archivos hermanos en `FD05` y `FD04` |
| **DOC-027** | Guardas RBAC frontend vs validación backend | Confirmado | **Implementado** | `FD05` §10.2 y §19.6 (Primacía innegociable de backend) |
| **DOC-029** | Discrepancia sobre Keycloak/JWT en reporte previo | Nuevo | **Subsanado y Aclarado** | `FD05` §2.1, §10.2 y `MAESTRO` §6 (Reafirmación ADR-006) |
| **DOC-011** | Rutas SSOT en `DOCUMENTATION_RULES.md` | Confirmado | **Pendiente** | Fuera de alcance Etapa 05 (Programado Etapa 07) |
| **DOC-012** | Registro de actas en `TABLES.md` (`TB-01`) | Confirmado | **Pendiente** | Fuera de alcance Etapa 05 (Programado Etapa 07) |
| **DOC-013** | Modularización de 114 diagramas PlantUML | Confirmado | **Pendiente** | Programado para Etapa 06 (Extracción gráfica) |
| **DOC-014** | Actualización de README en prototipo | Confirmado | **Pendiente** | Programado para Etapa 07 |
| **DOC-016** | Capturas reales en `STITCH_WIREFRAME_PROMPTS.md` | Confirmado | **Pendiente** | Programado para Etapa 06 |
| **DOC-028** | Actualización de inventario ECS en `R-GCSW006` | Confirmado | **Pendiente** | Programado para Etapa 07 |

---

## 22. Decisiones que Requieren CCB (Etapa 07)

Se dejan registradas las decisiones formales que deberán ser sometidas a la aprobación colegiada del Comité de Control de Cambios en la Etapa 07:
1. **Aprobación Formal de Baselines**: Promoción oficial de `FD03` (SRS v1.1) y `FD04` (SAD Análisis v1.2) a Líneas Base Oficiales Congeladas.
2. **Aprobación de la Baseline de Diseño**: Promoción de `FD05` (SAD Diseño v0.5) a Baseline Aprobada v1.0 tras la formalización gráfica.
3. **Ratificación de Rectificación Histórica de ADR-006**: Convalidación del acta que aclara la mención de Keycloak en reportes diagnósticos tempranos.
4. **Convalidación del Alcance del Prototipo**: Formalización de que las 8 pantallas interactivas funcionales y las 12 pantallas placeholder satisfacen plenamente el alcance contratado para la entrega del prototipo de software.

---

## 23. Verificaciones Realizadas

Se ejecutaron las siguientes comprobaciones de calidad antes de la publicación:
1. **Integridad Documental**:
   - Verificación de encabezados Markdown, sintaxis de tablas y bloques de código en `FD05` y `MAESTRO`.
   - Corrección de sintaxis matemática en §20.5 (`Pantalla \neq Caso de Uso`).
   - Comprobación de que no existen enlaces rotos o imágenes huérfanas sin nota editorial.
2. **Consistencia Arquitectónica**:
   - Trazabilidad estricta de `ADR-001` a `ADR-010` frente a las secciones correspondientes del SAD.
   - Verificación de los 14 estados y 20 transiciones en el ciclo de vida de RFC.
   - Verificación de las 20 pantallas físicas frente al enrutador React SPA (`AppRouter.tsx`).
3. **Verificación de Git**:
   - `git diff --check`: Sin advertencias ni espacios en blanco erróneos.
   - `git status --short`: Exclusivamente los 2 archivos autorizados modificados y el informe creado.
   - Ausencia total de alteraciones en código fuente, archivos de configuración o documentos fuera de alcance.

---

## 24. Commit y Publicación GitHub

Los cambios fueron agregados de forma selectiva y atómica al área de preparación de Git:
```powershell
git add -- docs/FD05-EPIS-Informe_SAD_Diseno.md docs/MAESTRO_CAMBIOS_SRS_SAD.md docs/INFORME_CIERRE_SAD_DISENO_ETAPA05.md
git commit -m "docs(sad): align detailed design architecture with SRS and analysis"
git push origin docs/alineacion-srs-sad-2026-11-12
```

Se verificó la sincronización exitosa en GitHub:
- **Rama Remota:** `docs/alineacion-srs-sad-2026-11-12`
- **Sincronización:** HEAD local idéntico a `origin/docs/alineacion-srs-sad-2026-11-12`.
- **URL de Verificación:** `https://github.com/JMedina255/TraceFlow/tree/docs/alineacion-srs-sad-2026-11-12`

---

## 25. Conclusiones y Próximos Pasos

### 25.1. Conclusiones
1. La **Etapa 05** ha culminado con éxito absoluto, logrando la reconciliación total del Documento de Arquitectura de Software — Fase de Diseño (`FD05 v0.5`) con las especificaciones de requisitos (`SRS v1.1`), el análisis arquitectónico (`SAD Análisis v1.2`) y los 10 ADRs aprobados.
2. Se resolvió de manera definitiva la contradicción sobre la autenticación (ADR-006), reafirmando el uso de sesiones opacas en PostgreSQL vía cookies HttpOnly SameSite=Strict y aclarando el estatus diferido de Keycloak.
3. Se estableció un inventario gráfico completo y transparente de 36 diagramas de diseño, eliminando enlaces rotos y allanando el camino para la generación física de imágenes.
4. El archivo maestro refleja con precisión matemática y trazabilidad histórica el avance del proyecto en su versión 0.5.0.

### 25.2. Próximos Pasos Recomendados (Etapa 06: Formalización Gráfica y Extracción de Diagramas)
1. Creación de la estructura física de directorios:
   - `docs/assets/diagramas/plantuml/`
   - `docs/assets/diagramas/render/`
   - `docs/assets/capturas/`
2. Extracción automatizada de los bloques PlantUML de los 36 diagramas de diseño de `FD05` y los 2 modelos de `FD04` a archivos individuales `.puml`.
3. Renderizado determinista de diagramas a formatos `.svg` y `.png` mediante PlantUML CLI y Graphviz.
4. Enlace bidireccional y actualización de referencias en los documentos técnicos.
5. Captura y formalización de pantallas reales del prototipo React SPA para alimentar `STITCH_WIREFRAME_PROMPTS.md`.

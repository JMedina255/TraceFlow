# ÍNDICE GENERAL DE DOCUMENTACIÓN TÉCNICA Y ARTEFACTOS
## Sistema de Gestión de Configuración de Software — TraceFlow SCM

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios
> **Organización Cliente:** ÉXODO S.A.C.
> **Equipo Responsable:** C-SharkTeam (Medina Quispe, Antayhua Mamani, Loyola Vilca Choque, Rivera Muñoz)
> **Rama Oficial:** `docs/alineacion-srs-sad-2026-11-12`
> **Línea Base Documental:** Etapa 07-R (Saneamiento de Inconsistencias Residuales y Preparación Definitiva)
> **Fecha de Actualización:** 12 de Noviembre de 2026
> **Versión del Índice:** `1.0.1`
> **Estado:** **DOCUMENTACIÓN CONSOLIDADA — PAQUETE EN REVISIÓN TÉCNICA DEL CCB**

---

## 1. Propósito de este Índice

Este documento proporciona una guía de navegación centralizada, estructurada y jerárquica hacia todos los instrumentos normativos, especificaciones de ingeniería, decisiones arquitectónicas, modelos visuales y evidencias del prototipo de **TraceFlow SCM**.

Está diseñado para facilitar el acceso rápido del equipo de desarrollo (C-SharkTeam), auditores de configuración (SCM/QA), evaluadores académicos y miembros del Comité de Control de Cambios (CCB).

---

## 2. Mapa de Navegación del Repositorio Documental

```text
TraceFlow/docs/
├── INDICE_DOCUMENTAL.md                         <- [ESTE DOCUMENTO] Navegación centralizada (v1.0.1)
├── DOCUMENTATION_RULES.md                      <- Normativa de gobernanza documental y SSOT (v1.0 Aprobada)
├── TABLES.md                                    <- SSOT de tablas maestras y matrices (TB-01 a TB-14, 15 tablas) (v1.0 Aprobada)
├── DIAGRAMS.md                                  <- Compendio oficial consolidado PlantUML (114 especificaciones, 113 IDs únicos) (v1.0 Aprobada)
├── MAESTRO_CAMBIOS_SRS_SAD.md                   <- Registro histórico y matriz DOC (v0.7.1)
├── PAQUETE_REVISION_CCB_ETAPA07.md             <- Expediente de sustentación formal para el CCB (v1.0.1)
├── ADENDA_AUDITORIA_ETAPA07R.md                 <- Adenda de auditoría correctiva y precisión de alcance FCA/PCA
├── INFORME_AUDITORIA_INTEGRAL_ETAPA07.md        <- Informe de auditoría integral Etapa 07 (v1.0.0)
│
├── [Especificaciones de Ingeniería]
│   ├── FD03-EPIS-Informe_SRS.md                 <- SRS Candidato v1.1 (Requisitos y Casos de Uso)
│   ├── FD04-EPIS-Informe_SAD_Analisis.md        <- SAD Análisis Candidato v1.2 (Lógica y BCE)
│   └── FD05-EPIS-Informe_SAD_Diseno.md          <- SAD Diseño Candidato v0.5 (Técnico, UWE y UI)
│
├── [Decisiones Arquitectónicas (ADR)]
│   └── adr/                                     <- Registros ADR-001 a ADR-010 aprobados
│
├── [Recursos Gráficos y Evidencias]
│   └── assets/
│       ├── README.md                            <- Guía técnica de mantenimiento y regeneración
│       ├── diagramas/
│       │   ├── MANIFEST.md                      <- Manifiesto técnico de 114 diagramas y renders
│       │   ├── plantuml/                        <- 114 especificaciones modulares (.puml)
│       │   └── render/                          <- 228 renders verificados (114 SVG + 114 PNG)
│       └── capturas/
│           ├── INDEX.md                         <- Catálogo de 17 capturas del prototipo React
│           └── [pantallas por módulo]           <- Evidencias de interfaz a 1440x900 px
│
├── [Auditorías y Gestión SCM]
│   ├── gcsw/                                    <- Plan de GCSW, diagnósticos y actas históricas
│   └── [Informes de Cierre de Etapas 01 a 07]   <- Trazabilidad histórica de intervenciones
│
└── [Automatización y Scripts]
    └── scripts/diagramas/                       <- Scripts de extracción, renderizado y auditoría
```

---

## 3. Catálogo de Documentos Principales

### 3.1 Especificaciones de Requisitos y Arquitectura (Revisiones Candidatas)

| Documento | Identificador | Versión Candidata | Estado Normativo | Enfoque y Contenido Principal | Enlace Directo |
|---|---|:---:|:---:|---|:---:|
| **Informe SRS** | `FD03` | **v1.1** | *Borrador en Revisión CCB* | 18 RF, 9 RNF, 9 RN, 31 Casos de Uso (incluyendo CU-04.1, CU-29, CU-30), delimitación prototipo 20 pantallas. | [`FD03-EPIS-Informe_SRS.md`](FD03-EPIS-Informe_SRS.md) |
| **SAD de Análisis** | `FD04` | **v1.2** | *Borrador en Revisión CCB* | Descomposición en 9 módulos lógicos, arquitectura conceptual (DG-SAD-A01/A02), 31 colaboraciones BCE y matriz de 14 estados. | [`FD04-EPIS-Informe_SAD_Analisis.md`](FD04-EPIS-Informe_SAD_Analisis.md) |
| **SAD de Diseño** | `FD05` | **v0.5** | *Borrador en Revisión CCB* | Topología cliente-servidor, base de datos relacional, storage 3 bibliotecas, API REST, secuencias técnicas, modelos UWE y catálogo de 20 pantallas físicas. | [`FD05-EPIS-Informe_SAD_Diseno.md`](FD05-EPIS-Informe_SAD_Diseno.md) |

### 3.2 Gobernanza, Control de Cambios y Fuentes Oficiales

| Documento | Identificador | Versión Verificable | Estado Normativo | Descripción y Propósito | Enlace Directo |
|---|---|:---:|:---:|---|:---:|
| **Reglas de Gobernanza Documental** | `DOC-RULES-001` | **v1.0** | *Aprobado (con Enmienda Propuesta en §15)* | Estándares de nomenclatura, jerarquía documental, políticas SSOT y propuesta de enmienda para fuentes modulares PlantUML. | [`DOCUMENTATION_RULES.md`](DOCUMENTATION_RULES.md) |
| **Cuadros y Tablas Maestras** | `TABLES-SSOT` | **v1.0** | *Aprobado (SSOT Tabular)* | Repositorio centralizado de matrices de datos: 15 tablas canónicas TB-01 a TB-14 (incluyendo decimal TB-11.1). | [`TABLES.md`](TABLES.md) |
| **Catálogo Central de Diagramas** | `DIAGRAMS-SSOT` | **v1.0** | *Aprobado (SSOT Gráfico)* | Compendio consolidado de 114 especificaciones PlantUML (113 IDs únicos, 1 colisión DG-12 en evaluación CCB). | [`DIAGRAMS.md`](DIAGRAMS.md) |
| **Archivo Maestro de Cambios** | `MAESTRO-SRS-SAD-001` | **v0.7.1** | *Borrador de Trabajo (Etapa 07-R)* | Registro maestro consolidado de hallazgos (DOC-001 a DOC-039), inventario cuantitativo y trazabilidad de etapas. | [`MAESTRO_CAMBIOS_SRS_SAD.md`](MAESTRO_CAMBIOS_SRS_SAD.md) |
| **Paquete de Revisión CCB** | `PAQ-CCB-ETAPA07` | **v1.0.1** | *Sometido a Decisión CCB* | Expediente consolidado para el Comité de Cambios: resumen de cambios, matriz de trazabilidad, FCA/PCA y propuestas normativas. | [`PAQUETE_REVISION_CCB_ETAPA07.md`](PAQUETE_REVISION_CCB_ETAPA07.md) |
| **Adenda de Auditoría Correctiva** | `ADENDA-AUD-ETAPA07R` | **v1.0.0** | *Emitido (Etapa 07-R)* | Adenda técnica: precisión de alcance FCA/PCA, rectificación de catálogos ADR/Tablas y saneamiento de versiones. | [`ADENDA_AUDITORIA_ETAPA07R.md`](ADENDA_AUDITORIA_ETAPA07R.md) |
| **Informe de Auditoría Integral** | `INF-AUD-INTEGRAL-ETAPA07` | **v1.0.0** | *Emitido (Etapa 07)* | Informe de auditoría integral, verificación de enlaces, análisis FCA/PCA y dictamen de preparación para CCB. | [`INFORME_AUDITORIA_INTEGRAL_ETAPA07.md`](INFORME_AUDITORIA_INTEGRAL_ETAPA07.md) |

---

## 4. Decisiones Arquitectónicas Aprobadas (ADR)

Ubicadas en `docs/adr/`, formalizan las elecciones estructurales vinculantes del sistema aprobadas formalmente el 2026-10-01:

| Código | Título Exacto de la Decisión Arquitectónica | Estado Formal | Decisión Seleccionada y Alcance Técnico | Archivo Canónico |
|:---:|---|:---:|---|:---:|
| **`ADR-001`** | Adopción del Estilo Arquitectónico Monolito Modular para TraceFlow SCM | **APROBADO** | Despliegue en un único proceso backend estructurado internamente en 9 módulos fuertemente cohesivos (MOD-01..09) con transacciones ACID locales. | [`ADR-001.md`](adr/ADR-001.md) |
| **`ADR-002`** | Adopción de Single Page Application (SPA) con React, TypeScript y Vite para la Interfaz de Usuario | **APROBADO** | Cliente enriquecido estático sin SSR (React 18+, TypeScript, Vite) para los 7 roles canónicos autenticados, consumiendo la API REST. | [`ADR-002.md`](adr/ADR-002.md) |
| **`ADR-003`** | Adopción de Node.js, TypeScript y NestJS como Framework de Backend para el Monolito Modular | **APROBADO** | Backend modular basado en NestJS sobre Node.js 24 LTS con inyección de dependencias, tipado estricto, decoradores y generación OpenAPI. | [`ADR-003.md`](adr/ADR-003.md) |
| **`ADR-004`** | Adopción de PostgreSQL como Motor de Base de Datos Relacional y Transaccional Principal | **APROBADO** | Motor RDBMS ACID unificado para persistencia de metadatos de configuración, índices condicionales parciales y columnas JSONB para auditoría. | [`ADR-004.md`](adr/ADR-004.md) |
| **`ADR-005`** | Estrategia de Custodia Híbrida y Abstracción de Almacenamiento para Elementos de Configuración (ECS) | **APROBADO** | Desacoplamiento entre metadatos (PostgreSQL) y binarios de ECS mediante la interfaz abstracta `StoragePort` (tránsito por las 3 bibliotecas SCM). | [`ADR-005.md`](adr/ADR-005.md) |
| **`ADR-006`** | Mecanismo de Autenticación Segura, Sesiones en Servidor y Autorización RBAC / SoD | **APROBADO** | Sesiones opacas gestionadas en servidor con cookies `HttpOnly` (`SameSite=Strict`), persistencia en PostgreSQL, RBAC y SoD; Keycloak diferido. | [`ADR-006.md`](adr/ADR-006.md) |
| **`ADR-007`** | Implementación del Bloqueo Lógico Persistente de Sincronización en Base de Datos (RN-06) | **APROBADO** | Bloqueo pesimista condicional exclusivo en tabla `scm_locks` con liberación estricta sólo por Check-In (CU-12), Rollback (CU-21) o Cancelación (CU-22). | [`ADR-007.md`](adr/ADR-007.md) |
| **`ADR-008`** | Arquitectura de Registro de Auditoría Append-Only en PostgreSQL y Verificación de Integridad | **APROBADO** | Pistas de auditoría inmutables en PostgreSQL sin permisos `UPDATE`/`DELETE` para la aplicación, triggers de inmutabilidad y encadenamiento SHA-256. | [`ADR-008.md`](adr/ADR-008.md) |
| **`ADR-009`** | Adopción de API RESTful con Cargas Útiles JSON y Especificación Formal OpenAPI 3.0 | **APROBADO** | Contratos de comunicación RESTful estructurados con payloads JSON, DTOs tipados en TypeScript, endpoints versionados y especificación Swagger/OpenAPI. | [`ADR-009.md`](adr/ADR-009.md) |
| **`ADR-010`** | Estrategia de Contenerización Docker, Operación, Alta Disponibilidad y Respaldo de Unidad Lógica | **APROBADO** | Contenerización multi-stage Docker (Nginx, NestJS, PostgreSQL 16), respaldos automáticos diarios programados y metas de diseño de continuidad (RTO $\le$ 2h, RPO $\le$ 24h). | [`ADR-010.md`](adr/ADR-010.md) |

---

## 5. Recursos Gráficos, Modelos y Evidencias Visuales

Ubicados en `docs/assets/`:

- **Guía de Mantenimiento y Regeneración:** [`docs/assets/README.md`](assets/README.md)
- **Manifiesto de Diagramas (114 modelos físicos / 113 identificadores únicos):** [`docs/assets/diagramas/MANIFEST.md`](assets/diagramas/MANIFEST.md)
  - Fuentes PlantUML Modulares: `docs/assets/diagramas/plantuml/` (`generales/`, `analisis/`, `diseno/`, `uwe/`) — 114 archivos `.puml`.
  - Renders Vectoriales y Rasterizados: `docs/assets/diagramas/render/` — 228 archivos verificados (114 `.svg` + 114 `.png`).
  - *Nota de Configuración:* Coexistencia de 2 especificaciones bajo `DG-12` (clases vs conceptual) documentada en `DOC-030` y sometida a resolución del CCB.
- **Índice de Capturas Reales del Prototipo React (17 capturas):** [`docs/assets/capturas/INDEX.md`](assets/capturas/INDEX.md)
  - Capturas de Interfaces: `docs/assets/capturas/` (`autenticacion/`, `dashboard/`, `rfc/`, `analisis-impacto/`, `ccb/`, `autorizaciones/`, `soporte/`, `placeholders/`) a resolución 1440x900 px.
- **Especificaciones de Wireframes y Prompts:** [`docs/STITCH_WIREFRAME_PROMPTS.md`](STITCH_WIREFRAME_PROMPTS.md)

---

## 6. Historial de Informes de Cierre y Auditorías por Etapa

| Etapa | Código de Informe | Título del Entregable | Commit | Estado |
|:---:|---|---|:---:|:---:|
| **01** | `INF-AUD-SRS-SAD-001` | Diagnóstico Inicial y Archivo Maestro de Cambios | `6ff6d7e` | ✅ Concluida |
| **02** | `INF-AUD-SRS-SAD-002` | Auditoría Detallada y Conciliación SRS-SAD-Implementación | `6ff6d7e` | ✅ Concluida |
| **03** | `INF-CIERRE-SRS-ETAPA03` | Corrección, Actualización y Alineamiento del SRS v1.1 | `a45eb25` | ✅ Concluida |
| **04** | `INF-CIERRE-SAD-ANALISIS-ETAPA04` | Alineamiento del SAD de Análisis v1.2 y Publicación GitHub | `012c267` | ✅ Concluida |
| **05** | `INF-CIERRE-SAD-DISENO-ETAPA05` | Actualización Integral del SAD de Diseño v0.5 | `c7ed0b8` | ✅ Concluida |
| **06** | `INF-CIERRE-RECURSOS-GRAFICOS-ETAPA06` | Formalización Gráfica, PlantUML y Capturas del Prototipo | `c4f95be` | ✅ Concluida |
| **07** | `INF-AUD-INTEGRAL-ETAPA07` | Auditoría Integral, Conciliación de Trazabilidad y Preparación CCB | `f2d2e87` | ✅ Concluida |
| **07-R**| `ADENDA-AUD-ETAPA07R` | Saneamiento de Inconsistencias Residuales y Preparación Definitiva | *En curso* | 🔄 En Ejecución |

---

## 7. Scripts de Automatización y Verificación

Ubicados en `docs/scripts/diagramas/`:

- `extract_diagrams.py`: Modulariza 114 especificaciones PlantUML desde `DIAGRAMS.md` hacia archivos `.puml`.
- `validate_diagrams.py`: Verifica la integridad de marcas sintácticas de todos los archivos `.puml`.
- `render_diagrams.py`: Compila de forma determinística los 114 diagramas a formato dual SVG y PNG.
- `capture_screens.py`: Ejecuta el prototipo React en modo headless y captura 17 interfaces reales.
- `generate_manifests.py`: Regenera y sincroniza `MANIFEST.md`, `INDEX.md` y `README.md`.
- `audit_diagram_integrity.py`: Auditoría profunda PCA de diagramas, detección de duplicados (`DG-12`) y comprobación de enlaces Markdown.
- `integrate_markdown.py`: Sincroniza la inserción de imágenes SVG en `FD03`, `FD04` y `FD05`.

---

## 8. Convenciones de Roles para Pruebas del Prototipo

El prototipo navegable React implementa 4 cuentas de prueba simuladas en cliente (`prototype/src/context/AuthContext.tsx`) para validar la navegación y renderizado de los 7 roles canónicos de `TB-09` (sin credenciales reales de producción):

| Usuario Demo | Identificador | Correo Simulado | Roles Asignados | Rol Primario | Módulos Autorizados en Prototipo |
|---|:---:|---|---|:---:|---|
| Joan Cristian Medina Quispe | `USR-001` | `jmedina@exodo.pe` | `PU-02`, `PU-01` | `PU-02` (Gestor SCM) | Dashboard Gestor, Bandeja RFCs, Expediente 360°, Subsanación, Aprobación Menor. |
| Renzo Antonio Antayhua Mamani | `USR-002` | `rantayhua@exodo.pe` | `PU-03`, `PU-06` | `PU-03` (Arquitecto) | Dashboard Arquitecto, Análisis de Impacto Técnico, Aprobación Menor Doble Llave. |
| Augusto Joaquin Rivera Muñoz | `USR-003` | `arivera@exodo.pe` | `PU-05`, `PU-07` | `PU-05` (Bibliotecario) | Explorador de ECS, Operaciones Check-Out/In, Gestión de Líneas Base. |
| Renzo Fernando Loyola Vilca Choque | `USR-004` | `rloyola@exodo.pe` | `PU-04` | `PU-04` (Miembro CCB) | Dashboard CCB, Sala de Deliberación y Votación Colegiada de Cambios Mayores. |

---

*Índice documental oficial de TraceFlow SCM — C-SharkTeam — ÉXODO S.A.C.*

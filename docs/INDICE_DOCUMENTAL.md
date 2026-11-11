# ÍNDICE GENERAL DE DOCUMENTACIÓN TÉCNICA Y ARTEFACTOS
## Sistema de Gestión de Configuración de Software — TraceFlow SCM

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios
> **Organización Cliente:** ÉXODO S.A.C.
> **Equipo Responsable:** C-SharkTeam (Medina, Antayhua, Loyola, Rivera)
> **Rama Oficial:** `docs/alineacion-srs-sad-2026-11-12`
> **Línea Base Documental:** Etapa 07 (Auditoría Integral y Preparación de Línea Base)
> **Fecha de Actualización:** 12 de Noviembre de 2026
> **Estado:** **DOCUMENTACIÓN CONSOLIDADA — EN REVISIÓN TÉCNICA DEL CCB**

---

## 1. Propósito de este Índice

Este documento proporciona una guía de navegación centralizada, estructurada y jerárquica hacia todos los instrumentos normativos, especificaciones de ingeniería, decisiones arquitectónicas, modelos visuales y evidencias del prototipo de TraceFlow SCM.

Está diseñado para facilitar el acceso rápido del equipo de desarrollo (C-SharkTeam), auditores de configuración (SCM/QA), evaluadores académicos y miembros del Comité de Control de Cambios (CCB).

---

## 2. Mapa de Navegación del Repositorio Documental

```text
TraceFlow/docs/
├── INDICE_DOCUMENTAL.md                         <- [ESTE DOCUMENTO] Navegación centralizada
├── DOCUMENTATION_RULES.md                      <- Normativa de gobernanza documental y SSOT
├── TABLES.md                                    <- SSOT de tablas maestras y matrices (TB-01 a TB-16)
├── DIAGRAMS.md                                  <- Compendio oficial consolidado PlantUML (114 diagramas)
├── MAESTRO_CAMBIOS_SRS_SAD.md                   <- Registro histórico y matriz DOC (v0.7.0)
├── PAQUETE_REVISION_CCB_ETAPA07.md             <- Paquete de sustentación formal para el CCB
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
│       │   ├── MANIFEST.md                      <- Manifiesto técnico de los 114 diagramas
│       │   ├── plantuml/                        <- 114 fuentes .puml modulares
│       │   └── render/                          <- 228 renders en formato SVG y PNG
│       └── capturas/
│           ├── INDEX.md                         <- Índice de 17 capturas reales del prototipo
│           └── [subcarpetas funcionales]        <- Capturas PNG por subsistema y rol
│
├── [Auditorías y Gestión SCM]
│   ├── gcsw/                                    <- Plan de GCSW, diagnósticos y auditorías
│   └── [Informes de Cierre de Etapas 01 a 07]   <- Trazabilidad histórica de intervenciones
│
└── [Automatización y Scripts]
    └── scripts/diagramas/                       <- Scripts de extracción, renderizado y auditoría
```

---

## 3. Catálogo de Documentos Principales

### 3.1 Especificaciones de Requisitos y Arquitectura

| Documento | Identificador | Versión Candidata | Estado Normativo | Enfoque y Contenido Principal | Enlace Directo |
|---|---|:---:|:---:|---|:---:|
| **Informe SRS** | `FD03` | **v1.1** | *Borrador en Revisión CCB* | 18 RF, 9 RNF, 9 RN, 31 Casos de Uso (incluyendo CU-04.1, CU-29, CU-30), delimitación prototipo 20 pantallas. | [`FD03-EPIS-Informe_SRS.md`](FD03-EPIS-Informe_SRS.md) |
| **SAD de Análisis** | `FD04` | **v1.2** | *Borrador en Revisión CCB* | Descomposición en 9 módulos lógicos, arquitectura conceptual (DG-SAD-A01/A02), 31 colaboraciones BCE y matriz de 14 estados. | [`FD04-EPIS-Informe_SAD_Analisis.md`](FD04-EPIS-Informe_SAD_Analisis.md) |
| **SAD de Diseño** | `FD05` | **v0.5** | *Borrador en Revisión CCB* | Topología cliente-servidor, base de datos relacional, storage 3 bibliotecas, API REST, 9 secuencias técnicas, modelos UWE y catálogo de 20 pantallas físicas. | [`FD05-EPIS-Informe_SAD_Diseno.md`](FD05-EPIS-Informe_SAD_Diseno.md) |

### 3.2 Gobernanza, Control de Cambios y Preparación CCB

| Documento | Identificador | Versión | Estado | Descripción y Propósito | Enlace Directo |
|---|---|:---:|:---:|---|:---:|
| **Archivo Maestro de Cambios** | `MAESTRO-SRS-SAD-001` | **v0.7.0** | *Borrador de Trabajo* | Registro maestro consolidado de hallazgos (DOC-001 a DOC-035), inventario cuantitativo y trazabilidad de etapas. | [`MAESTRO_CAMBIOS_SRS_SAD.md`](MAESTRO_CAMBIOS_SRS_SAD.md) |
| **Paquete de Revisión CCB** | `PAQ-CCB-ETAPA07` | **v1.0** | *Sometido a Decisión CCB* | Instrumento formal para el Comité de Cambios: resumen de cambios, matriz de trazabilidad, FCA/PCA y propuestas normativas. | [`PAQUETE_REVISION_CCB_ETAPA07.md`](PAQUETE_REVISION_CCB_ETAPA07.md) |
| **Reglas de Gobernanza Documental** | `DOC-RULES-001` | **v1.0** | *Aprobado (con Enmienda Propuesta)* | Estándares de nomenclatura, jerarquía documental, políticas SSOT y propuesta de enmienda para fuentes PlantUML. | [`DOCUMENTATION_RULES.md`](DOCUMENTATION_RULES.md) |
| **Cuadros y Tablas Maestras** | `TABLES-SSOT` | **v2.0** | *Aprobado (SSOT Tabular)* | Repositorio centralizado de matrices de datos: TB-01 a TB-16 (RF, RNF, RN, CU, PU, Matrices de Trazabilidad). | [`TABLES.md`](TABLES.md) |
| **Catálogo Central de Diagramas** | `DIAGRAMS-SSOT` | **v2.0** | *Aprobado (SSOT Gráfico)* | Compendio integral de 114 especificaciones PlantUML con enlaces directos a renders SVG. | [`DIAGRAMS.md`](DIAGRAMS.md) |

---

## 4. Decisiones Arquitectónicas Aprobadas (ADR)

Ubicadas en `docs/adr/`, formalizan las elecciones estructurales vinculantes del sistema:

| Código | Título de la Decisión Arquitectónica | Estado | Módulo / Requisito Principal | Archivo |
|:---:|---|:---:|---|:---:|
| **`ADR-001`** | Adopción de Arquitectura Monolítica Modular | APROBADO | Arquitectura General / RNF-08 | [`ADR-001.md`](adr/ADR-001.md) |
| **`ADR-002`** | Selección de React + TypeScript + Vite como Frontend SPA | APROBADO | Presentación UI / RNF-04, RNF-07 | [`ADR-002.md`](adr/ADR-002.md) |
| **`ADR-003`** | Selección de Node.js + Express + TypeScript para Backend | APROBADO | Lógica del Servidor / RNF-06 | [`ADR-003.md`](adr/ADR-003.md) |
| **`ADR-004`** | Motor de Base de Datos PostgreSQL 16 | APROBADO | Persistencia Transaccional / RNF-03 | [`ADR-004.md`](adr/ADR-004.md) |
| **`ADR-005`** | Modelo de Integridad y Versionamiento de Artefactos (SHA-256) | APROBADO | Integridad SCM / RNF-03, RN-09 | [`ADR-005.md`](adr/ADR-005.md) |
| **`ADR-006`** | Autenticación y Sesiones Seguras (Tokens Opacos + HttpOnly) | APROBADO | Seguridad y Acceso / RNF-01 | [`ADR-006.md`](adr/ADR-006.md) |
| **`ADR-007`** | Esquema de Almacenamiento y 3 Bibliotecas SCM | APROBADO | Almacenamiento Físico / RN-02, RN-06 | [`ADR-007.md`](adr/ADR-007.md) |
| **`ADR-008`** | Estilo de Comunicación y API REST | APROBADO | Interoperabilidad / RNF-07 | [`ADR-008.md`](adr/ADR-008.md) |
| **`ADR-009`** | Estrategia de Auditoría Inmutable y Trazabilidad (Audit Trail) | APROBADO | Seguridad y Registro / RNF-01 | [`ADR-009.md`](adr/ADR-009.md) |
| **`ADR-010`** | Despliegue con Docker y Docker Compose | APROBADO | Despliegue e Infraestructura / RNF-02 | [`ADR-010.md`](adr/ADR-010.md) |

---

## 5. Recursos Gráficos, Modelos y Evidencias Visuales

Ubicados en `docs/assets/`:

- **Guía de Mantenimiento y Regeneración:** [`docs/assets/README.md`](assets/README.md)
- **Manifiesto de Diagramas (114 modelos):** [`docs/assets/diagramas/MANIFEST.md`](assets/diagramas/MANIFEST.md)
  - Fuentes PlantUML Modulares: `docs/assets/diagramas/plantuml/` (`generales/`, `analisis/`, `diseno/`, `uwe/`)
  - Renders Vectoriales y Rasterizados: `docs/assets/diagramas/render/` (114 `.svg` + 114 `.png`)
- **Índice de Capturas Reales del Prototipo React (17 capturas):** [`docs/assets/capturas/INDEX.md`](assets/capturas/INDEX.md)
  - Capturas de Interfaces: `docs/assets/capturas/` (`autenticacion/`, `dashboard/`, `rfc/`, `analisis-impacto/`, `ccb/`, `autorizaciones/`, `soporte/`, `placeholders/`)
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
| **07** | `INF-AUDITORIA-INTEGRAL-ETAPA07` | Auditoría Integral, Conciliación de Trazabilidad y Preparación CCB | *En curso* | 🔄 En Ejecución |

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

El prototipo navegable React implementa 4 cuentas demo preconfiguradas para validar los 7 roles canónicos:

| Usuario Demo | Identificador | Correo Institucional | Roles Asignados | Rol Primario | Módulos Autorizados |
|---|:---:|---|---|:---:|---|
| Joan Cristian Medina Quispe | `USR-001` | `jmedina@exodo.pe` | `PU-02`, `PU-01` | `PU-02` (Gestor SCM) | Dashboard Gestor, Bandeja RFCs, Expediente 360°, Subsanación, Aprobación Menor. |
| Renzo Antonio Antayhua Mamani | `USR-002` | `rantayhua@exodo.pe` | `PU-03`, `PU-06` | `PU-03` (Arquitecto) | Dashboard Arquitecto, Análisis de Impacto Técnico, Aprobación Menor Doble Llave. |
| Augusto Joaquin Rivera Muñoz | `USR-003` | `arivera@exodo.pe` | `PU-05`, `PU-07` | `PU-05` (Bibliotecario) | Explorador de ECS, Operaciones Check-Out/In, Gestión de Líneas Base. |
| Renzo Fernando Loyola Vilca Choque | `USR-004` | `rloyola@exodo.pe` | `PU-04` | `PU-04` (Miembro CCB) | Dashboard CCB, Sala de Deliberación y Votación Colegiada de Cambios Mayores. |

---

*Índice documental oficial de TraceFlow SCM — C-SharkTeam — ÉXODO S.A.C.*

# ÍNDICE GENERAL DE DOCUMENTACIÓN TÉCNICA Y ARTEFACTOS
## Sistema de Gestión de Configuración de Software — TraceFlow SCM

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización Cliente:** ÉXODO S.A.C.  
> **Equipo Responsable:** C-SharkTeam (Medina Quispe, Antayhua Mamani, Loyola Vilca Choque, Rivera Muñoz)  
> **Rama Documental Permanente:** `docs/alineacion-srs-sad-2026-11-12`  
> **Línea Base Código:** `master @ 84c832f` (PR #14)  
> **Fecha de Actualización:** 25 de noviembre de 2026  
> **Versión del Índice:** `2.0.0` (Consolidación DOC-02)  
> **Estado:** **DOCUMENTACIÓN CONSOLIDADA — CANDIDATA A APROBACIÓN DEL RESPONSABLE / CCB**

---

## 1. Propósito de este Índice

Este documento proporciona la guía oficial de navegación hacia todos los instrumentos normativos, especificaciones de ingeniería, estándares técnicos, diccionario de datos, decisiones arquitectónicas, modelos visuales y evidencias de **TraceFlow SCM**.

---

## 2. Mapa de Navegación del Repositorio Documental

```text
TraceFlow/docs/
├── INDICE_DOCUMENTAL.md               <- [ESTE DOCUMENTO] Navegación centralizada (v2.0.0)
├── ESTADO_DEL_PROYECTO.md             <- Estado real, pendientes e historial compacto de hitos
├── DOCUMENTATION_RULES.md             <- Normativa de gobernanza documental y SSOT (v1.0 Aprobada)
├── PLAN_INICIALIZACION_PROYECTOS.md   <- Plan Maestro de Inicialización, Organización y GitHub (INIT-H01)
├── GLOSARIO.md                        <- Terminología oficial en español y siglas normativas
├── MATRIZ_NOMENCLATURA.md             <- Auditoría e inventario de equivalencias inglés–español
├── DICCIONARIO_DATOS.md               <- Modelo físico actual (21 tablas, 198 cols) y objetivo en español
├── ESTANDAR_PROGRAMACION.md           <- Convenciones obligatorias TS, NestJS, React, PG, API y Pruebas
├── MATRIZ_TRAZABILIDAD.md             <- Trazabilidad integral RF/RNF -> RN -> CU -> Módulo -> BD -> Pruebas
├── PLAN_REFACTORIZACION.md            <- Plan progresivo REF-01.1 a REF-01.6 para normalización al español
├── TABLES.md                          <- SSOT de tablas maestras y matrices (TB-01 a TB-14, v1.0 Aprobada)
├── DIAGRAMS.md                        <- Compendio oficial consolidado PlantUML (v1.0 Aprobada)
│
├── [Especificaciones de Ingeniería y Arquitectura]
│   ├── FD01-EPIS-Informe_Factibilidad_v2.md  <- Estudio de factibilidad definitivo (Aprobado)
│   ├── FD01-EPIS-Informe_Factibilidad.md     <- Factibilidad inicial histórica
│   ├── FD03-EPIS-Informe_SRS.md              <- SRS Final Candidato (v1.2 DOC-02)
│   ├── SAD_FINAL.md                          <- Arquitectura consolidada (Análisis + Diseño + Estado real)
│   ├── FD04-EPIS-Informe_SAD_Analisis.md     <- Baseline institucional SAD de Análisis (v1.2)
│   └── FD05-EPIS-Informe_SAD_Diseno.md       <- Baseline institucional SAD de Diseño (v0.5)
│
├── [Decisiones Arquitectónicas (ADR)]
│   └── adr/                           <- Registros ADR-001 a ADR-011 (ADR-011 Propuesto INIT-H01)
│
├── [Especificaciones Técnicas Complementarias]
│   ├── PROTOTYPE_SPECIFICATION.md     <- Matriz de pantallas del prototipo React
│   ├── STITCH_WIREFRAME_PROMPTS.md    <- Especificación de wireframes de baja fidelidad
│   └── refactor/                      <- Matrices normativas RBAC, Identidad, Navegación, CU-06 y CU-30
│
├── [Recursos Gráficos y Evidencias]
│   ├── assets/                        <- 116+ diagramas PlantUML/SVG/PNG y 17 capturas React 1440x900
│   └── evidence/int-01/               <- Evidencias visuales de certificación E2E Playwright
│
├── [Auditorías y Gestión SCM]
│   └── gcsw/                          <- Diagnósticos y actas oficiales de auditoría GCSW
│
└── [Automatización y Scripts]
    └── scripts/diagramas/             <- Scripts de extracción, renderizado y auditoría gráfica
```

---

## 3. Catálogo de Documentos Principales

### 3.1 Especificaciones de Requisitos y Arquitectura

| Documento | Identificador | Versión | Estado Normativo | Enfoque y Contenido Principal | Enlace Directo |
|---|---|---:|---|---|---|
| **Informe SRS** | `FD03` | **v1.2** | *Candidato Final DOC-02 (Pendiente CCB)* | 18 RF, 9 RNF, 9 RN, 31 Casos de Uso (`CU-01`..`CU-30` + `CU-04.1`) y estado real de implementación. | [`FD03-EPIS-Informe_SRS.md`](FD03-EPIS-Informe_SRS.md) |
| **SAD Final Consolidado** | `SAD-FINAL` | **v1.0** | *Candidato Final DOC-02 (Pendiente CCB)* | Arquitectura unificada en 27 secciones: análisis, diseño, seguridad, BD, estado actual y modelo objetivo. | [`SAD_FINAL.md`](SAD_FINAL.md) |
| **SAD de Análisis** | `FD04` | **v1.2** | *Baseline Institucional Preservada* | Descomposición en 9 módulos lógicos, arquitectura conceptual y 31 colaboraciones BCE. | [`FD04-EPIS-Informe_SAD_Analisis.md`](FD04-EPIS-Informe_SAD_Analisis.md) |
| **SAD de Diseño** | `FD05` | **v0.5** | *Baseline Institucional Preservada* | Topología física, contratos API, secuencias técnicas, modelos UWE y catálogo de 20 pantallas. | [`FD05-EPIS-Informe_SAD_Diseno.md`](FD05-EPIS-Informe_SAD_Diseno.md) |
| **Factibilidad Definitiva** | `FD01-v2` | **v2.0** | *Aprobado* | Viabilidad técnica, operativa y económica (VAN, TIR). | [`FD01-EPIS-Informe_Factibilidad_v2.md`](FD01-EPIS-Informe_Factibilidad_v2.md) |

### 3.2 Normalización, Datos, Estándares y Trazabilidad (DOC-02)

| Documento | Estado Normativo | Propósito | Enlace Directo |
|---|---|---|---|
| **Glosario Oficial** | *Candidato DOC-02* | Vocabulario unificado en español y siglas normativas preservadas. | [`GLOSARIO.md`](GLOSARIO.md) |
| **Matriz de Nomenclatura** | *Candidato DOC-02* | Equivalencias inglés–español por capa y elementos ambiguos (`AMB-01`..`AMB-07`). | [`MATRIZ_NOMENCLATURA.md`](MATRIZ_NOMENCLATURA.md) |
| **Diccionario de Datos** | *Candidato DOC-02* | Inventario físico real (21 tablas, 198 columnas, índices, triggers) y modelo objetivo + diagramas ER. | [`DICCIONARIO_DATOS.md`](DICCIONARIO_DATOS.md) |
| **Estándar de Programación** | *Candidato DOC-02* | Convenciones obligatorias TS, NestJS, React, PostgreSQL, REST, pruebas y Git. | [`ESTANDAR_PROGRAMACION.md`](ESTANDAR_PROGRAMACION.md) |
| **Estado del Proyecto** | *Consolidado DOC-02* | Estado real de implementación, pendientes e historial compacto de hitos y commits. | [`ESTADO_DEL_PROYECTO.md`](ESTADO_DEL_PROYECTO.md) |
| **Matriz de Trazabilidad** | *Candidato DOC-02* | Trazabilidad bidireccional `RF/RNF -> RN -> CU -> Módulo -> Componente -> Tabla -> Endpoint -> Prueba`. | [`MATRIZ_TRAZABILIDAD.md`](MATRIZ_TRAZABILIDAD.md) |
| **Plan de Refactorización REF-01** | *Candidato DOC-02* | Estrategia progresiva `REF-01.1`..`REF-01.6` con migraciones seguras y rollback. | [`PLAN_REFACTORIZACION.md`](PLAN_REFACTORIZACION.md) |
| **Plan de Inicialización de Proyectos** | *Candidato INIT-H01* | Gobernanza multiorganización, asistente híbrido y salvaguarda GitHub (DA-01..DA-06, ADR-011). | [`PLAN_INICIALIZACION_PROYECTOS.md`](PLAN_INICIALIZACION_PROYECTOS.md) |

### 3.3 Gobernanza y Fuentes Oficiales SSOT

| Documento | Versión | Estado | Descripción | Enlace Directo |
|---|---:|---|---|---|
| **Reglas de Gobernanza Documental** | **v1.0** | *Aprobado* | Estándares de nomenclatura, jerarquía documental y políticas SSOT. | [`DOCUMENTATION_RULES.md`](DOCUMENTATION_RULES.md) |
| **Cuadros y Tablas Maestras** | **v1.0** | *Aprobado (SSOT Tabular)* | 15 tablas canónicas `TB-01` a `TB-14` (incluyendo `TB-11.1`). | [`TABLES.md`](TABLES.md) |
| **Catálogo Central de Diagramas** | **v1.0** | *Aprobado (SSOT Gráfico)* | Compendio PlantUML oficial (`114` base + 2 ER + 10 `DG-INIT-01..10`). | [`DIAGRAMS.md`](DIAGRAMS.md) |
| **Decisiones Arquitectónicas (ADR)** | **v1.1** | *Aprobado / Propuesto* | `ADR-001` a `ADR-010` (Aprobados) y `ADR-011` (Propuesto INIT-H01). | [`adr/README.md`](adr/README.md) |

---

## 4. Recursos Gráficos, Evidencias y Auditorías GCSW

- **Manifiesto de Diagramas:** [`docs/assets/diagramas/MANIFEST.md`](assets/diagramas/MANIFEST.md) (incluye modelos generales, análisis, diseño, UWE y diagramas ER [`DG-ER-ACTUAL`](assets/diagramas/render/diseno/DG-ER-ACTUAL.svg) / [`DG-ER-OBJETIVO`](assets/diagramas/render/diseno/DG-ER-OBJETIVO.svg)).
- **Capturas del Prototipo React:** [`docs/assets/capturas/INDEX.md`](assets/capturas/INDEX.md) (17 capturas reales a `1440x900`).
- **Evidencias E2E Playwright (`INT-01`):** [`docs/evidence/int-01/`](evidence/int-01/).
- **Auditorías GCSW:** [`ACTA_AUDITORIA_01.md`](gcsw/auditorias/ACTA_AUDITORIA_01.md) y [`DIAGNOSTICO_INICIAL.md`](gcsw/diagnosticos/DIAGNOSTICO_INICIAL.md).
- **Matrices Normativas de Refactorización:** [`IDENTITY_AND_ROLES.md`](refactor/IDENTITY_AND_ROLES.md), [`RBAC_ACCESS_MATRIX.md`](refactor/RBAC_ACCESS_MATRIX.md), [`ROLE_NAVIGATION_MATRIX.md`](refactor/ROLE_NAVIGATION_MATRIX.md), [`RFC_IMPACT_ANALYSIS.md`](refactor/RFC_IMPACT_ANALYSIS.md), [`RFC_MINOR_APPROVAL.md`](refactor/RFC_MINOR_APPROVAL.md).

---

*Índice documental oficial de TraceFlow SCM — Consolidación DOC-02 — C-SharkTeam / ÉXODO S.A.C.*

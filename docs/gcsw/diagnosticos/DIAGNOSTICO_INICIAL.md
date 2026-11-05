# Diagnóstico de Configuración y Trazabilidad Inicial — Fase 1

> **Documento:** `docs/gcsw/diagnosticos/DIAGNOSTICO_INICIAL.md`  
> **Código de Control:** `DIAG-GCSW-001`  
> **Proyecto:** Sistema de Gestión de Configuración de Software — TraceFlow SCM  
> **Organización Cliente:** ÉXODO S.A.C.  
> **Entorno Académico:** Escuela Profesional de Ingeniería de Sistemas — Universidad Privada de Tacna (Semestre 2026-II)  
> **Equipo de Desarrollo:** C-SharkTeam  
>   - Joan Cristian Medina Quispe (Coordinador del Proyecto / Administrador de Configuración)  
>   - Renzo Antonio Antayhua Mamani (Responsable Técnico Backend / Arquitectura)  
>   - Renzo Fernando Loyola Vilca Choque (Responsable Técnico Frontend / Interfaces)  
>   - Augusto Joaquín Rivera Muñoz (Responsable de Calidad y Auditoría SCM)  
> **Docente Asesor:** Dr. Ricardo Eduardo Valcárcel Alvarado  
> **Rol Emisor:** Ingeniero de Gestión de Configuración de Software (SCM) y Auditor Documental  
> **Fecha de Emisión:** 04 de Noviembre de 2026  
> **Fase del Plan:** Fase 1 — Diagnóstico de Trazabilidad (Plan de Mejora R-GCSW004)  
> **Estado:** EMISIÓN FORMAL DE AUDITORÍA (FASE 1 COMPLETADA)  

---

## 1. Alcance, Contexto y Verificación del Entorno Operativo

### 1.1. Contexto de la Auditoría
En el marco del plan de mejora formulado en el **Informe de Estado R-GCSW004** (Fase 1: Diagnóstico de Trazabilidad), se realiza la auditoría de configuración de primer nivel sobre las fuentes del proyecto TraceFlow SCM. El propósito es diagnosticar de forma verificable el estado de los Elementos de Configuración de Software (ECS), las referencias de control de versiones en Git, la red de trazabilidad multidireccional (necesidades, requerimientos, reglas, casos de uso, arquitectura, código y pruebas), el estado de las líneas base y la disponibilidad de los documentos normativos de soporte.

### 1.2. Verificación de Entorno y Aislamiento de Worktrees
Para asegurar la segregación rigurosa de responsabilidades y evitar interferencias operativas con el desarrollo activo del prototipo web de interfaces, se verificó la configuración de worktrees de Git:

| Parámetro | Worktree Documental / Auditoría (Activo) | Worktree de Interfaces (Técnico) |
| :--- | :--- | :--- |
| **Ruta del Directorio** | `C:/Users/HP/Desktop/proyectos/TraceFlow-GCSW` | `C:/Users/HP/Desktop/proyectos/TraceFlow` |
| **Rama Git Activa** | `docs/gcsw-rgcsw004-mejora` | `master` |
| **HEAD Inicial de Auditoría** | `16df0b0` (*docs(rfc): specify delegated minor change authorization*) | `3d6daa1` (*test(rfc): validate delegated minor approval workflow*) |
| **HEAD Actual en Repositorio** | `16df0b0` (56 commits acumulados) | `743b41c` (*docs(ccb): audit governance and voting requirements* - 60 commits acumulados) |
| **Estado del Working Tree** | Limpio (`working tree clean`), sin cambios pendientes previos | Independiente, aislado |

**Declaración de Conformidad de Aislamiento:**
Se confirma que todas las actividades de análisis, inspección y auditoría documental se ejecutan de manera estricta y exclusiva dentro del worktree `TraceFlow-GCSW`, sin modificar el código de interfaces, sin invadir el directorio `TraceFlow`, sin aplicar rebase ni merge sobre ramas activas, y sin avanzar hacia la Fase 2.

---

## 2. Análisis de Disponibilidad de Documentos Normativos y Limitaciones

Conforme a las directrices de auditoría, se evaluó la disponibilidad y el versionamiento de los documentos normativos de Gestión de la Configuración de Software (GCSW).

```
                             FUENTES DEL PROYECTO
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
   EN REPOSITORIO GIT                                 FUERA DEL REPOSITORIO
   (TraceFlow-GCSW)                                   (Google Drive / Descargas)
   • FD01 (Factibilidad v1 y v2)                      • D-GCSW001 (Plan SCM V1.1 / 0.1.0)
   • FD03 (SRS Consolidado v1.0)                      • R-GCSW006 (Identificación ECS V1.1 / 0.2.0)
   • FD04 (SAD Análisis v1.1)                         • R-GCSW004 (Informe de Estado Histórico v0)
   • FD05 (SAD Diseño v0.4 Borrador)                  • R-GCSW001 (Formato Solicitud de Cambio) [NO DISP.]
   • docs/DOCUMENTATION_RULES.md (SSOT Gobernanza)    • R-GCSW002 (Formato Aprobación Cambios) [NO DISP.]
   • docs/TABLES.md (SSOT Matrices TB-01..14)         • R-GCSW003 (Control de Cambios) [NO DISP.]
   • docs/DIAGRAMS.md (SSOT Diagramas PlantUML)       • R-GCSW005 (Informe Auditoría Configuración) [NO DISP.]
   • docs/PROTOTYPE_SPECIFICATION.md                  • R-GCSW007 (Control de Versiones) [NO DISP.]
   • docs/adr/ (ADR-001 a ADR-010)                    • Informes_Contabilidad_Estado.xlsx [NO DISP.]
   • docs/refactor/ (5 documentos de refactorización)
```

### 2.1. Documentos Normativos Auditados

#### A. D-GCSW001: Plan de Gestión de Configuración de Software
- **Disponibilidad:** No versionado en el repositorio Git. Se localizó una copia en formato PDF en el almacenamiento local (`C:\Users\HP\Downloads\G03-d-gcsw001-DOCUMENTO PLAN CONFIGURACIÓN V1.1.docx.pdf`), con respaldo original registrado en Google Drive (carpeta `GCSW-Hojas de Trabajo`).
- **Versión y Metadatos:** En carátula figura Versión `0.1.0` (14/10/2026); en el historial de revisiones (pág. 2) registra versión `0.2.0` (15/10/2026); el nombre del archivo indica `V1.1`.
- **Estado Administrativo:** BORRADOR preliminar sujeto a revisión. **No registra evidencia de aprobación formal** por parte del Comité de Control de Cambios (CCB) ni visto bueno académico del Dr. Ricardo Valcárcel Alvarado.
- **Aspectos Normativos Clave:** Define el alcance académico del proyecto; la asignación operativa de los 4 integrantes; la partición en 3 bibliotecas (Trabajo/Dinámica, Soporte-Maestra/Controlada, Estática/Archivo); el procedimiento de control de cambios en 8 fases; el principio de no auto-aprobación; y la emisión de tres tipos de Informes de Estado (IE-01, IE-02, IE-03).

#### B. R-GCSW006: Identificación de Elementos de la Configuración
- **Disponibilidad:** No versionado en el repositorio Git. Localizado en PDF en almacenamiento local (`C:\Users\HP\Downloads\G03-r-gcsw006-IDENTIFICACION DE ELEMENTOS DE LA CONFIGURACIÓNV1.1.docx.pdf`), con respaldo original registrado en Google Drive.
- **Versión y Metadatos:** Código `R-GCSW006`, versión `0.1.0 - BORRADOR` en carátula (14/10/2026); versión `0.2.0` en historial (15/10/2026); nombre de archivo `V1.1`. Pendiente de acta de aprobación interna y revisión académica.
- **Aspectos Normativos Clave:** Contiene 29 páginas. Establece criterios de selección de ECS, una taxonomía de 26 tipos de entregables, el inventario formal de 24 ECS (ECS-TF-01 a ECS-TF-24) con referencias Git al corte del commit `a12e44f` (14/10/2026), reglas de nomenclatura formal (`NomenclaturaGXvY.extensión`), programación teórica de líneas base (LB-F1I1 a LB-F5I2), y protocolos de respaldo mediante `git bundle` y cálculo de hash SHA-256.

#### C. R-GCSW004: Informe de Estado Histórico
- **Disponibilidad:** No versionado en el repositorio Git. Localizado en PDF (`C:\Users\HP\Downloads\G03-R-GCSW004-INFORME_DE_ESTADO_TraceFlow_SCM.docx.pdf`).
- **Versión y Metadatos:** Código `R-GCSW004`, Versión `0`, Fecha de corte: 22/10/2026.
- **Aspectos Normativos Clave:** Documenta la apertura formal de los 3 reportes:
  1. `IE-01` (Plan 3.3.1): Estado General del Proyecto.
  2. `IE-02` (Plan 3.3.2): Estado de Requerimientos y Cambios.
  3. `IE-03` (Plan 3.3.3): Carga de Trabajo por Integrante.
  Todos en estado solicitado *Propuesto* y estado de implementación *Planificado*.
  Registra advertencias explícitas fundamentales:
  - *"Un cambio «mergeado» en Git no equivale a «aprobado»: vincular la aprobación (R-GCSW002)"*.
  - Ausencia de RFCs formales a la fecha de corte.
  - Necesidad urgente de unificar la versión del plan (V1.1 vs v0.1.0).

#### D. Documentación Técnica en Repositorio (`TraceFlow-GCSW`)
- `FD01-EPIS-Informe_Factibilidad.md` (v1.0) y `FD01-EPIS-Informe_Factibilidad_v2.md` (v2): Estudios de viabilidad técnica, operativa y económica (VAN/TIR).
- `FD03-EPIS-Informe_SRS.md`: Documento maestro consolidado de requerimientos v1.0 (358 KB).
- `FD04-EPIS-Informe_SAD_Analisis.md`: SAD de Análisis Arquitectónico v1.1.
- `FD05-EPIS-Informe_SAD_Diseno.md`: SAD de Diseño Arquitectónico v0.4 (Borrador no congelado).
- `docs/DOCUMENTATION_RULES.md`: Reglas de gobernanza documental v1.0 (SSOT Vinculante).
- `docs/TABLES.md`: Catálogo centralizado de tablas y matrices TB-01 a TB-14 (SSOT Datos Estructurados).
- `docs/DIAGRAMS.md`: Catálogo centralizado de diagramas PlantUML (SSOT Diagramas).
- `docs/PROTOTYPE_SPECIFICATION.md`: Especificación funcional y de navegación del prototipo React v1.0.
- `docs/adr/`: Catálogo y 10 registros de decisión arquitectónica (ADR-001 a ADR-010).
- `docs/refactor/`: 5 especificaciones normativas de refactorización visual y arquitectura técnica.

### 2.2. Registro Explícito de Limitaciones Documentales
Conforme al punto 4 de las actividades normativas, se deja constancia explícita de las siguientes limitaciones documentales objetivas:
1. **Inexistencia local de plantillas y registros operativos de cambio:**
   Los artefactos `R-GCSW001` (Solicitud de Cambio), `R-GCSW002` (Aprobación de Cambios), `R-GCSW003` (Control de Cambios), `R-GCSW005` (Informe de Auditoría de Configuración) y `R-GCSW007` (Control de Versiones) **no están disponibles en el repositorio ni en las descargas locales**. Se encuentran referenciados como archivos externos en Google Drive (`ECS-TF-22`).
2. **Inexistencia de la hoja de cálculo de control:**
   El archivo `Informes_Contabilidad_de_Estado.xlsx` (`ECS-TF-23`) **no se encuentra disponible** en el repositorio ni de forma local.
3. **Falta de actas de aprobación formal:**
   No se dispone de actas firmadas de aprobación de líneas base ni de actas del Comité de Control de Cambios (CCB).
4. **Tratamiento SCM:** En observancia de la regla de no inventar información, estas carencias no han sido suplidas con suposiciones; se clasifican como no conformidades documentales y riesgos de configuración a subsanar.

---

## 3. Auditoría del Inventario de ECS (R-GCSW006)

Se contrastó el inventario normativo de 24 ECS documentado en el registro `R-GCSW006` (págs. 4 a 7, corte al commit `a12e44f` del 14/10/2026) frente a la realidad física y el historial de Git en el worktree `TraceFlow-GCSW` al corte actual (commit `16df0b0`).

### 3.1. Matriz de Auditoría de los ECS Normativos (ECS-TF-01 a ECS-TF-24)

| ID ECS | Componente Registrado en R-GCSW006 | Ubicación en Repo / Entorno | Versión Registrada | Estado Registrado | Responsable Asignado | Commit en R-GCSW006 (14/10/2026) | Estado Real Verificado en Auditoría | Último Commit Real en Git (al corte `16df0b0`) | Dictamen de Auditoría |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| **ECS-TF-01** | Factibilidad (primera versión) | `FD01-EPIS-Informe_Factibilidad.md` | 1.0 | REVISION | Joan C. Medina Quispe | `60e136b` (01/10) | Existe | `60e136b` | **Conforme**. Sin cambios posteriores. |
| **ECS-TF-02** | Factibilidad (versión revisada) | `FD01-EPIS-Informe_Factibilidad_v2.md` | v2 (sin cabecera) | Por confirmar | Joan C. Medina Quispe | `9c18fdf` (01/10) | Existe | `9c18fdf` | **Observado**. Versión sin estandarizar. |
| **ECS-TF-03** | Especificación Requisitos (SRS) | `FD03-EPIS-Informe_SRS.md` | 1.0 | APROBADO (TB-01) | Joan C. Medina Quispe | `b8906e1` (01/10) | Existe | `b8906e1` | **Observado**. Desalineado de CU-30/TO-BE v2. |
| **ECS-TF-04** | SAD Análisis | `FD04-EPIS-Informe_SAD_Analisis.md` | 1.1 | APROBADO | Joan C. Medina Quispe | `9e16183` (01/10) | Existe | `9e16183` | **Conforme**. Documento base estático. |
| **ECS-TF-05** | SAD Diseño | `FD05-EPIS-Informe_SAD_Diseno.md` | 0.4 | BORRADOR | Joan Medina / Renzo Antayhua | `c0a5c30` (01/10) | Existe | `c0a5c30` | **Conforme**. En estado borrador. |
| **ECS-TF-06** | Decisiones Arquitectónicas | `docs/adr/` (11 archivos) | - | APROBADO | Renzo Antonio Antayhua | `0c5e1c8` (01/10) | Existe | `0c5e1c8` | **Conforme**. Colección íntegra ADR 1..10. |
| **ECS-TF-07** | Reglas Gobernanza Documental | `docs/DOCUMENTATION_RULES.md` | 1.0 | APROBADO | Joan C. Medina Quispe | `9234c88` (01/10) | Existe | `9234c88` | **Conforme**. Marco vinculante vigente. |
| **ECS-TF-08** | Catálogo Tablas / Matrices SSOT | `docs/TABLES.md` | 1.0 | APROBADO | Joan C. Medina Quispe | `b8906e1` (01/10) | Existe | `b8906e1` | **Observado**. Discrepancia estado TB-13/14. |
| **ECS-TF-09** | Catálogo Diagramas PlantUML SSOT | `docs/DIAGRAMS.md` | 1.0 | APROBADO | Joan C. Medina Quispe | `c0a5c30` (01/10) | Existe | `c0a5c30` | **Conforme**. Contiene DG-01 a DG-AO-30. |
| **ECS-TF-10** | Diagramas Exportados (44 arch.) | `assets/` | - | APROBADO | Joan C. Medina Quispe | `9d9896c` (30/09) | Existe | `9d9896c` | **Conforme**. Archivos gráficos y puml. |
| **ECS-TF-11** | Especificación Prototipo React | `docs/PROTOTYPE_SPECIFICATION.md` | 1.0 | APROBADO | Renzo Fernando Loyola | `c73b232` (07/10) | Existe | `c73b232` | **Conforme**. Especificación inicial SPA. |
| **ECS-TF-12** | Prompts Wireframes Stitch | `docs/STITCH_WIREFRAME_PROMPTS.md` | Sin versión | Sin estado | Renzo Fernando Loyola | `57b8f2a` (01/10) | Existe | `57b8f2a` | **Observado**. Falta versión y estado. |
| **ECS-TF-13** | README del Repositorio | `README.md` | Sin versión | BORRADOR | Joan C. Medina Quispe | `9c18fdf` (01/10) | Existe | `9c18fdf` | **Conforme**. Guía de acceso al repo. |
| **ECS-TF-14** | Código Fuente Prototipo SPA | `prototype/src/` | 0.0.0 | BORRADOR (Desarr.) | Renzo Loyola / Renzo Antayhua | `f51f843` (14/10) | Modificado | `bf06fcb` (04/11) | **Desactualizado en R-GCSW006**. 11 commits adicionales. |
| **ECS-TF-15** | Configuración de Compilación | `prototype/` (raíz: package, vite) | 0.0.0 | BORRADOR (Desarr.) | Renzo Fernando Loyola | `f51f843` (14/10) | Modificado | `d4fd99c` (04/11) | **Desactualizado en R-GCSW006**. Scripts test agregados. |
| **ECS-TF-16** | Scripts de Prueba Prototipo | `prototype/src/services/*.spec.mjs` | - | BORRADOR (Desarr.) | Augusto Joaquín Rivera | `f51f843` (14/10) | Modificado | `d4fd99c` (04/11) | **Desactualizado en R-GCSW006**. 4 nuevas suites de tests. |
| **ECS-TF-17** | Scripts de Inicio Rápido | Raíz (`iniciar-prototipo.bat/.ps1`) | - | BORRADOR | Renzo Fernando Loyola | `7192488` (07/10) | Existe | `7192488` | **Conforme**. Scripts funcionales. |
| **ECS-TF-18** | Tema Visual Institucional UPT | `upt-theme(1).json` | - | BORRADOR | Renzo Fernando Loyola | `3fcb399` (14/10) | Existe | `3fcb399` | **Conforme**. Tokens de color institucionales. |
| **ECS-TF-19** | Datos de Demostración (Mock) | `prototype/src/data/initial*.ts` | - | BORRADOR (Desarr.) | Augusto Joaquín Rivera | `fd0bff6` (07/10) | Existe | `fd0bff6` | **Conforme**. Datos mock de simulación. |
| **ECS-TF-20** | Plan de Configuración (D-GCSW001) | Google Drive / Descargas | 0.1.0 | BORRADOR | Joan C. Medina Quispe | Sin commit | Fuera de repo | Sin commit | **No Conformidad**. Documento no versionado en Git. |
| **ECS-TF-21** | Identificación de ECS (R-GCSW006) | Google Drive / Descargas | 0.2.0 | BORRADOR | Joan C. Medina Quispe | Sin commit | Fuera de repo | Sin commit | **No Conformidad**. Registro no versionado en Git. |
| **ECS-TF-22** | Plantillas GCSW (001,002,003,005,007)| Google Drive | Por definir | Por definir | Joan C. Medina Quispe | Sin commit | No disponible | Sin commit | **No Conformidad**. Registros ausentes en repo. |
| **ECS-TF-23** | Hoja Contabilidad de Estado | Google Drive (`.xlsx`) | Sin versión | Por definir | Renzo Antonio Antayhua | Sin commit | No disponible | Sin commit | **No Conformidad**. Archivo no incorporado. |
| **ECS-TF-24** | Documentos Origen en Drive | Google Drive (FD01, FD03, Diag.) | Por definir | Por definir | Joan C. Medina Quispe | Sin commit | Fuera de repo | Sin commit | **Informativo**. Archivos fuente originales. |

### 3.2. Hallazgo de Nuevos Elementos No Inventariados (Candidatos a ECS)
Durante el avance entre el commit `a12e44f` y el commit `16df0b0` (17 commits de evolución), se incorporaron artefactos técnicos y normativos en el repositorio que **carecen de código ECS asignado**:

| Artefacto Generado | Ubicación Física | Naturaleza / Propósito | Commit de Creación | Propuesta de Código ECS |
| :--- | :--- | :--- | :---: | :---: |
| Auditoría de Interfaces y Plan | `docs/refactor/UI_AUDIT.md` | Diagnóstico de limpieza visual y metadatos | `cf5fda0` | `ECS-TF-25` |
| Especificación Identidad y Roles | `docs/refactor/IDENTITY_AND_ROLES.md` | Modelo de identidades multirol y SoD | `d319b5a` | `ECS-TF-26` |
| Matriz de Navegación por Rol | `docs/refactor/ROLE_NAVIGATION_MATRIX.md` | Matriz RBAC de rutas y permisos UI | `295605b` | `ECS-TF-27` |
| Especificación Análisis de Impacto | `docs/refactor/RFC_IMPACT_ANALYSIS.md` | Especificación técnica de CU-06 | `3687b31` | `ECS-TF-28` |
| Especificación Autorización Delegada | `docs/refactor/RFC_MINOR_APPROVAL.md` | Especificación técnica de CU-30 | `16df0b0` | `ECS-TF-29` |
| Servicio y Tipos de Impact Analysis | `prototype/src/services/impactAnalysis.*` | Lógica operativa y contratos TypeScript | `dff0492` | (Sub-ECS de TF-14) |
| Tipos de Permisos y Matriz SoD | `prototype/src/types/permissions.ts` | Definición de permisos y matriz SoD | `d1d50f1` | (Sub-ECS de TF-14) |
| Vista de Análisis de Impacto (UI) | `prototype/src/features/rfcs/RfcImpactAnalysisView.tsx` | Pantalla de análisis técnico del arquitecto | `bf06fcb` | (Sub-ECS de TF-14) |

---

## 4. Evaluación de la Red de Trazabilidad Integral

Se auditó la consistencia y coherencia multidireccional a lo largo de toda la cadena de ingeniería del software:
$$\text{Necesidad} \longrightarrow \text{Requerimiento (RF/RNF)} \longrightarrow \text{Regla (RN)} \longrightarrow \text{Caso de Uso (CU)} \longrightarrow \text{Actor (PU)} \longrightarrow \text{Diagramas} \longrightarrow \text{Código} \longrightarrow \text{Pruebas}$$

```
                                  RED DE TRAZABILIDAD SCM
┌─────────────────────────┐
│ TB-03: Necesidades (7)  │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ TB-04: Requisitos RF    │◄───────► TB-05: RNF (Calidad / Seguridad)
│ (RF-01 a RF-18)         │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ TB-06: Reglas Negocio   │◄───────► TB-09: Perfiles PU-01..PU-07
│ (RN-01 a RN-09)         │
└────────────┬────────────┘
             ▼
┌─────────────────────────────────────────────────────────────┐
│ TB-10: Casos de Uso (CU-01 a CU-30)                         │
│ TB-12: Matriz RF vs CU    | TB-13: Matriz RN vs CU          │
│ TB-14: Matriz General     | TB-07: 14 Estados Canónicos RFC │
└────────────┬────────────────────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Modelado (docs/DIAGRAMS.md):                                │
│ • Proceso General TO-BE v2 (DG-03)                          │
│ • Diagramas de Secuencia Conceptual (DG-SEQ-01 a 30)        │
│ • Diagramas de Análisis de Objetos BCE (DG-AO-01 a 30)      │
└────────────┬────────────────────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Implementación y Verificación Técnica (prototype/src/):     │
│ • UI Implementadas: Login, Dashboard, RfcList, Detail, Form │
│ • Servicios: rfc.service.ts, auth.service.ts, impactAnalysis│
│ • Suites Pruebas: 6 specs automatizados (62 tests unitarios)│
└─────────────────────────────────────────────────────────────┘
```

### 4.1. Análisis de Cobertura de Requerimientos Funcionales (TB-12 / TB-14)
- **RF-01 (Usuarios y Roles RBAC):** Cubierto por `CU-01`, modelado en `DG-SEQ-01` y `DG-AO-01`. Implementado en `auth.service.ts` y auditado en `auth.spec.mjs`. UI en modo provisional (`ScreenPlaceholder`).
- **RF-02 (Gestión de Proyectos):** Cubierto por `CU-02` y `CU-03`. Modelado en `DG-SEQ-02`, `DG-SEQ-03` y `DG-AO-02/03`. Datos de demostración en `initialProjects.ts`. UI en modo provisional.
- **RF-03 (Identificación de ECS):** Cubierto por `CU-09`. Modelado en `DG-SEQ-09` y `DG-AO-09`. Normado externamente en `R-GCSW006`. UI en modo provisional.
- **RF-04 (Registro de Solicitudes RFC):** Cubierto por `CU-04` y `CU-04.1`. Modelado en `DG-SEQ-04`, `DG-SEQ-04.1` y `DG-AO-04/04.1`. Totalmente implementado en UI (`RfcCreateView.tsx`, `RfcEditView.tsx`), servicio (`rfc.service.ts`) y validado en `rfc.service.spec.mjs` y `rfc.validation.spec.mjs`.
- **RF-05 (Clasificación y Análisis de Impacto):** Cubierto por `CU-05`, `CU-06` y `CU-30`. Modelado en `DG-SEQ-05/06/30` y `DG-AO-05/06/30`. `CU-05` implementado en `RfcDetailView.tsx` y validado en `rfc.validation.spec.mjs`. `CU-06` implementado en `RfcImpactAnalysisView.tsx`, `impactAnalysis.service.ts` y validado en `impactAnalysis.spec.mjs`. `CU-30` cuenta con especificación normativa en `docs/refactor/RFC_MINOR_APPROVAL.md` en esta rama.
- **RF-06 (Evaluación y Aprobación por CCB):** Cubierto por `CU-07`. Modelado en `DG-SEQ-07` y `DG-AO-07`. UI en modo provisional en esta rama (en `master` abordado en commit `743b41c`).
- **RF-07 (Gestión de Órdenes ECN/ECO):** Cubierto por `CU-08` y `CU-30`. Modelado en `DG-SEQ-08/30` y `DG-AO-08/30`. UI provisional.
- **RF-08 y RF-09 (Bibliotecas, Versiones y Bloqueos):** Cubierto por `CU-10` a `CU-13`. Modelado en diagramas de secuencia y BCE. En prototipo simulado en estructuras de datos; UI provisional.
- **RF-10 y RF-11 (Pruebas, Certificación QA y Re-test):** Cubierto por `CU-15` a `CU-19` y `CU-29` (UAT). Modelado en secuencia y BCE. UI provisional.
- **RF-12 y RF-13 (Rollback, Cancelación y Líneas Base):** Cubierto por `CU-20` a `CU-22`. Modelado completo. UI provisional.
- **RF-14 (Cierre Formal y Notificaciones):** Cubierto en los 4 estados terminales: DESESTIMADA (`CU-05`), RECHAZADA (`CU-07`/`CU-30`), CANCELADA (`CU-22`) e IMPLEMENTADA (`CU-20`).
- **RF-15 (Incidencias y Soporte):** Cubierto por `CU-23` a `CU-25`. Modelado completo. UI provisional.
- **RF-16, RF-17 y RF-18 (Trazabilidad, Auditoría e Integridad, Reportes):** Cubierto por `CU-26` a `CU-28`. Modelado completo. Servicio `audit.service.ts` genera registros inmutables append-only con hash SHA-256 en almacenamiento de sesión demo.

### 4.2. Brecha de Trazabilidad entre Documentos SSOT y el SRS Consolidado
Se detectó una asimetría crítica en la red de trazabilidad:
1. `docs/TABLES.md` y `docs/DIAGRAMS.md` (declarados como SSOT de Nivel 2 en `DOCUMENTATION_RULES.md`) incorporaron de forma exitosa y exhaustiva los casos de uso **`CU-04.1`**, **`CU-29`** (Validación UAT) y **`CU-30`** (Autorización Delegada de Cambio Menor), con sus diagramas de secuencia `DG-SEQ-29/30` y diagramas de análisis de objetos `DG-AO-29/30`.
2. Sin embargo, el documento consolidado de Nivel 3, **`FD03-EPIS-Informe_SRS.md`**, se mantiene en su versión histórica 1.0 (commit `b8906e1` del 01/10/2026), conteniendo únicamente 28 casos de uso (`CUS01` a `CUS28`).
3. Esto viola la regla mandatoria de gobernanza documental:
   > *"Toda modificación efectuada en una fuente oficial (Nivel 2) exige la actualización sincronizada e inmediata del documento consolidado `FD03-EPIS-Informe_SRS.md` (Nivel 3) dentro del mismo ciclo de cambio."* (`DOCUMENTATION_RULES.md`, §3).

---

## 5. Clasificación y Segregación de Estados de Cambio

Uno de los principios cardinales de la Gestión de Configuración de Software y de la auditoría documental es la estricta segregación de los estados de madurez de los artefactos. No debe confundirse una acción operativa en Git con una aprobación de SCM:

```
┌────────────────────┐      git commit      ┌────────────────────┐
│   CAMBIO LOCAL     │ ───────────────────► │  CAMBIO PUBLICADO  │
│ (Árbol de Trabajo) │                      │ (En Rama / Master) │
└────────────────────┘                      └─────────┬──────────┘
                                                      │ Pull Request / Code Review
                                                      ▼
┌────────────────────┐     Acta CCB / SCM   ┌────────────────────┐
│ CAMBIO FORMALMENTE │ ◄─────────────────── │  CAMBIO REVISADO   │
│     APROBADO       │      R-GCSW002       │   (Verificado)     │
└────────────────────┘                      └────────────────────┘
```

### 5.1. Definición y Diagnóstico de Estados al Corte

#### A. Cambios Locales (Árbol de Trabajo / Working Tree)
- **Definición:** Modificaciones presentes únicamente en el sistema de archivos del operador antes de ser confirmadas mediante `git commit`.
- **Estado Actual:** El worktree `TraceFlow-GCSW` se encuentra **100% limpio** (`nothing to commit, working tree clean`). No existen cambios locales volátiles o sin confirmar.

#### B. Cambios Publicados (Historial de Git / Commits en Repositorio)
- **Definición:** Modificaciones que cuentan con un commit formal en el historial distribuido de Git y han sido incorporadas a una rama técnica o a la rama `master`.
- **Estado Actual:**
  * En la rama `docs/gcsw-rgcsw004-mejora`, existen 56 commits integrados hasta el HEAD `16df0b0`.
  * En la rama `master` del repositorio técnico, existen 60 commits integrados hasta `743b41c` (incluyendo `e6d8e79`, `649b724`, `3d6daa1`).
  * Todos estos cambios poseen trazabilidad criptográfica en Git (hash SHA-1, autor, fecha y mensaje convencional).

#### C. Cambios Revisados (Verificación Técnica / Pruebas / PRs)
- **Definición:** Cambios que han superado pruebas automatizadas de regresión, linters o revisión entre pares mediante Pull Requests (PR #1 a PR #7 en GitHub).
- **Estado Actual:** Los servicios `rfc.service.ts`, `auth.service.ts` e `impactAnalysis.service.ts` cuentan con suites de pruebas unitarias (`.spec.mjs`) que validan la máquina de estados canónica de 14 estados (`TB-07`), la matriz SoD y el aislamiento de proyectos.
- **Limitación:** Esta revisión es puramente técnica/automatizada; no cuenta con registro de certificación en el formato `ACCC` (Certificación de Conformidad QA) ni acta de revisión formal.

#### D. Cambios Formalmente Aprobados (Aprobación SCM / CCB / Línea Base)
- **Definición:** Cambios que cuentan con una Solicitud de Cambio formal (`RFC-AAAA-NNN`), un Informe Técnico evaluado, una Orden de Cambio (`ECN/ECO`), un formato `R-GCSW002` firmado por el CCB o la Autoridad Delegada, y un acta de aprobación del docente asesor.
- **ESTADO ACTUAL AUDITADO: CERO CAMBIOS FORMALMENTE APROBADOS.**
- **Sustento del Dictamen:**
  Tal como dictamina el propio Informe de Estado histórico `R-GCSW004` (pág. 1):
  > *"Un cambio «mergeado» en Git no equivale a «aprobado»: vincular la aprobación (R-GCSW002)"*.
  Ni un solo commit desde la creación del repositorio cuenta con un registro `R-GCSW002` diligenciado, ni existe acta de reunión del Comité de Control de Cambios ratificando los cambios de interfaces o de refactorización. Por tanto, en términos de SCM, todos los cambios incorporados a Git tienen la condición de **BORRADOR TÉCNICO EN DESARROLLO** o **PROPUESTA INTEGRADA**, pero no de configuración congelada aprobada.

---

## 6. Verificación de Líneas Base (Baselines) y Evidencias de Aprobación

Se verificó el cumplimiento del procedimiento de establecimiento de líneas base definido en `D-GCSW001` (§3.4.2 y §3.1.3) y `R-GCSW006` (§3.1.3 y páginas 20 a 26).

### 6.1. Procedimiento Normativo de Formalización de Línea Base
El plan establece un proceso formal de 6 pasos obligatorios:
1. *Consolidación:* Identificación de ECS candidatos por el Administrador de Configuración.
2. *Revisión interna:* Verificación de consistencia entre requerimientos, diseño y código.
3. *Revisión académica:* Presentación al docente asesor (Dr. Ricardo Valcárcel) para su evaluación.
4. *Registro de aprobación:* Documentación mediante Acta de Reunión del CCB y registro de control de versiones.
5. *Congelamiento técnico:* Etiquetado inmutable en Git (`LB-F<fase>I<iteración>-v<mayor.menor.parche>`).
6. *Actualización del inventario:* Actualización de `R-GCSW006` y `R-GCSW007` con el hash SHA-1/SHA-256.

### 6.2. Estado Real Auditado de las Líneas Base Planificadas

| Identificador Planificado | Fase / Iteración | ECS Integrantes Planificados | Referencia Git Programada | Existencia de Tag en Git | Existencia de Acta CCB | Evidencia de Aprobación Docente | Estado Real SCM |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **LB-F1I1** | Fase 1 - Iteración 1 (29 ago - 08 sep) | TB-03, DG-02, DG-01, TB-02 (Factibilidad) | Propuesta | **NO EXISTE** (0 tags) | No existe | No formalizada en acta | **PROPUESTA NO CONGELADA** |
| **LB-F1I2** | Fase 1 - Iteración 2 (09 sep - 18 sep) | SRS v1.0 (FD03), DG-11..13 | Propuesta | **NO EXISTE** (0 tags) | No existe | Registro preliminar en TB-01 (16/09) | **PROPUESTA NO CONGELADA** |
| **LB-F2I1** | Fase 2 - Iteración 1 (19 sep - 01 oct) | SRS (CU 1..30), SAD Análisis v1.1 (FD04), TABLES v1.0, DIAGRAMS v1.0, RULES v1.0, assets/ | Propuesta (`9e16183`) | **NO EXISTE** (0 tags) | No existe | Aprobación indicada en cabecera FD04 | **PROPUESTA NO CONGELADA** |
| **LB-F2I2** | Fase 2 - Iteración 2 (02 oct - 09 oct) | ADR-001..010, PROTOTYPE_SPEC v1.0, SAD Diseño v0.4 (Borrador), Prompts | Propuesta (`c73b232`) | **NO EXISTE** (0 tags) | No existe | No formalizada | **PROPUESTA NO CONGELADA** |
| **LB-F3I1** | Fase 3 - Iteración 1 (10 oct - 26 oct) | Prototipo SPA React, Scripts prueba, Scripts inicio | Propuesta (`f51f843`) | **NO EXISTE** (0 tags) | No existe | No formalizada | **PROPUESTA NO CONGELADA** |
| **LB-F3I2 a F5I2** | Fases 3 a 5 (Nov - Dic 2026) | Backend NestJS, Pruebas integración, Despliegue Docker, Cierre | Por definir | **NO EXISTE** | No existe | No formalizada | **PLANIFICADA** |

### 6.3. Hallazgos sobre el Congelamiento Técnico
1. **Ausencia Absoluta de Etiquetas Git (Tags):**  
   Al ejecutar `git tag -l` sobre el repositorio, el resultado es vacío. Ninguna de las líneas base cuenta con una etiqueta de congelamiento técnico inmutable.
2. **Ausencia de GitHub Releases:**  
   No existen paquetes de liberación publicados en GitHub asociados a las iteraciones concluidas.
3. **Ausencia de Respaldos Git Bundle:**  
   No se registran archivos `TraceFlow_AAAAMMDD.bundle` ni hashes SHA-256 en el repositorio para acreditar el respaldo semanal ni el cierre de líneas base.
4. **Ratificación del Registro R-GCSW006:**  
   Esta condición coincide con lo advertido en la página 20 de `R-GCSW006`:
   > *"El repositorio no tiene etiquetas (tags) ni releases. Por tanto, ninguna línea base cuenta aún con referencia técnica de congelamiento verificable. Las referencias de commit indicadas son propuestas y pasan a ser definitivas cuando el CCB apruebe cada línea base y se cree la etiqueta"*.

---

## 7. Identificación de Inconsistencias, Elementos Faltantes y Riesgos de Configuración

A partir de la inspección cruzada de todas las fuentes, se consolida la matriz de hallazgos críticos de configuración:

### 7.1. Inconsistencias Documentales y de Metadatos
1. **Triangulación Discrepante de Versiones en Documentos Normativos:**
   - En `D-GCSW001`, la portada consigna `0.1.0`, el historial consigna `0.2.0` y el archivo físico consigna `V1.1`.
   - En `R-GCSW006`, la portada consigna `0.1.0 - BORRADOR`, el historial `0.2.0 - BORRADOR` y el archivo físico `V1.1`.
   - Impacto: Ambigüedad respecto a cuál es la versión formal vigente del Plan y del Inventario de Configuración.
2. **Discrepancia Interna en el Catálogo de Tablas (`docs/TABLES.md`):**
   - El índice general de tablas (líneas 30 y 31) clasifica a `TB-13` (Matriz RN vs CU) y `TB-14` (Matriz General de Trazabilidad) con estado `REVISION`.
   - En las secciones de detalle correspondientes (líneas 357 y 379), ambas tablas encabezan con estado `APROBADO`.
   - Impacto: Contradicción dentro del propio archivo SSOT de tablas.
3. **Discrepancia en la Convención de Nomenclatura de Casos de Uso:**
   - El documento consolidado `FD03-EPIS-Informe_SRS.md` emplea el código sin guion `CUS01` a `CUS28`.
   - `docs/DOCUMENTATION_RULES.md`, `docs/TABLES.md` y `docs/DIAGRAMS.md` imponen obligatoriamente el formato `CU-XX`.
   - Impacto: Ruptura de coherencia en búsquedas textuales automatizadas y cruces de auditoría.
4. **Contaminación de Contexto Ajeno en el SRS Consolidado:**
   - En `FD03-EPIS-Informe_SRS.md` (§6.1, págs. 30-31), el texto explicativo de perfiles de usuario contiene referencias explícitas a un sistema de tutorías universitarias (*"el mentoreado resuelve dudas temáticas, el mentor gestiona y dicta las clases..."*), completamente ajenas a un sistema de gestión de configuración SCM.
   - Impacto: Afectación severa de la calidad y rigor técnico del documento contractual y académico.
5. **Duplicidad Literal de Viabilidad Ambiental y Social en el SRS:**
   - En `FD03-EPIS-Informe_SRS.md` (§3.5), los 4 numerales de la Viabilidad Ambiental son una copia textual idéntica de la Viabilidad Social.
   - Impacto: Deficiencia en la fundamentación de sostenibilidad del proyecto.
6. **Discrepancia de Autoridad en la Regla de Negocio RN-03:**
   - En `FD03` (tabla 5.3), la autoridad de la regla `RN-03` (*Trazabilidad de Cambios*) está atribuida al *Analista de Requerimientos / Gestor*, a pesar de que su mandato regula la operación técnica de Check-In del *Administrador de Configuración / Bibliotecario*.

### 7.2. Elementos Faltantes (Gaps de Configuración)
1. **Registros Normativos de la Plantilla GCSW Ausentes en Git:**
   - `D-GCSW001`, `R-GCSW006` y `R-GCSW004` no forman parte del repositorio versionado en Git.
   - Los formatos `R-GCSW001`, `R-GCSW002`, `R-GCSW003`, `R-GCSW005`, `R-GCSW007` y la hoja de cálculo de control `Informes_Contabilidad_de_Estado.xlsx` no existen en el entorno de trabajo ni en el repositorio.
2. **Nuevos Artefactos sin Identificador ECS:**
   - Los 5 documentos de `docs/refactor/` (`UI_AUDIT.md`, `IDENTITY_AND_ROLES.md`, `ROLE_NAVIGATION_MATRIX.md`, `RFC_IMPACT_ANALYSIS.md`, `RFC_MINOR_APPROVAL.md`) no han sido incorporados al inventario oficial `R-GCSW006`.
   - Los nuevos módulos TypeScript de permisos y servicios no están catalogados en la estructura de configuración.
3. **Casos de Uso No Sincronizados en el SRS Consolidado:**
   - `CU-04.1` (Subsanación), `CU-29` (UAT) y `CU-30` (Autorización de Cambio Menor) no han sido transcritos al documento maestro `FD03-EPIS-Informe_SRS.md`.
4. **Ausencia de Evidencias Técnicas de Congelamiento:**
   - Cero etiquetas Git (tags) tipo `LB-F*`.
   - Cero paquetes `git bundle` y registros de sumas criptográficas SHA-256.

### 7.3. Matriz de Riesgos de Configuración

| ID Riesgo | Descripción del Riesgo | Probabilidad | Impacto | Nivel de Severidad | Estrategia de Mitigación Recomendada |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **RSK-CFG-01** | **Falsa sensación de aprobación por commits en Git:** Asumir que un pull request o commit integrado equivale a un cambio aprobado por SCM, desatendiendo actas del CCB y formatos normativos. | Alta | Crítico | **CRÍTICO** | Formalizar los expedientes de cambio mediante R-GCSW002 y actas del CCB antes de declarar aprobaciones. |
| **RSK-CFG-02** | **Desincronización documental entre SSOT (`TABLES.md`) y Consolidado (`FD03`):** El SRS presenta 28 casos de uso frente a 30 del SSOT, generando discrepancias en auditorías externas o académicas. | Alta | Alto | **ALTO** | Actualizar `FD03-EPIS-Informe_SRS.md` incorporando formalmente CU-04.1, CU-29 y CU-30. |
| **RSK-CFG-03** | **Gobernanza SCM dispersa fuera del control de versiones:** Mantener el Plan de Configuración y registros en Google Drive sin control Git expone los documentos a pérdidas o modificaciones no auditadas. | Alta | Alto | **ALTO** | Incorporar `D-GCSW001`, `R-GCSW006` y `R-GCSW004` al repositorio bajo `docs/gcsw/`. |
| **RSK-CFG-04** | **Imposibilidad de recuperación determinista de líneas base:** Ante un fallo crítico, la ausencia de etiquetas Git impide restaurar con exactitud el estado congelado de iteraciones previas. | Media | Alto | **ALTO** | Crear y proteger las etiquetas Git (`LB-F1I1`, `LB-F1I2`, `LB-F2I1`, etc.) una vez aprobadas las actas. |
| **RSK-CFG-05** | **Concentración de responsabilidades documentales:** Un solo integrante figura como autor de la gran mayoría de documentos técnicos y normativos, vulnerando el principio de segregación (SoD). | Media | Medio | **MEDIO** | Establecer revisiones cruzadas formales donde el responsable de calidad (Rivera) y los técnicos (Antayhua, Loyola) firmen las revisiones. |

---

## 8. Conclusiones de la Auditoría y Recomendaciones para la Fase 2

### 8.1. Conclusiones del Diagnóstico Inicial
1. **Solidez del Modelado SSOT:**  
   El repositorio cuenta con una base conceptual y técnica sumamente rigurosa en `docs/TABLES.md` y `docs/DIAGRAMS.md`, donde se han definido con precisión matemática las reglas de negocio, los 14 estados canónicos de las RFC, la segregación de funciones (SoD) y la realización conceptual BCE de 30 casos de uso.
2. **Avance Técnico Significativo pero No Formalizado:**  
   El prototipo web en `prototype/` ha evolucionado con rapidez, contando con 6 suites de pruebas automatizadas y pantallas avanzadas para registro, validación y análisis de impacto técnico. Sin embargo, este progreso técnico no ha estado acompañado de la disciplina documental de SCM: no hay formatos R-GCSW001..007 diligenciados, no hay actas de aprobación del CCB y ninguna línea base ha sido congelada con etiquetas Git.
3. **Segregación Operativa Exitosa:**  
   El trabajo mediante worktrees independientes (`TraceFlow-GCSW` para documentación y `TraceFlow` para interfaces) ha protegido la integridad del código fuente, garantizando que el diagnóstico se realice sin alterar componentes de software ni interferir con ramas en desarrollo.

### 8.2. Recomendaciones Específicas para las Siguientes Fases
Para abordar de forma sistemática los hallazgos identificados, se formulan las siguientes recomendaciones estructuradas para el plan de mejora:

1. **Incorporación Normativa al Repositorio (Prioridad 1):**  
   Trasladar los documentos normativos `D-GCSW001`, `R-GCSW006` y `R-GCSW004` al interior del repositorio Git bajo la ruta `docs/gcsw/normativa/`, adoptando formato Markdown y unificando su versión documental en una versión coherente (v1.0 / v1.1).
2. **Actualización del Inventario de ECS (Prioridad 1):**  
   Emitir una versión revisada de `R-GCSW006` que incorpore los nuevos artefactos de `docs/refactor/` (ECS-TF-25 a ECS-TF-29), actualice los commits de referencia de código y pruebas al corte reciente, e inventaríe las nuevas suites de test.
3. **Sincronización del Documento Consolidado SRS (Prioridad 2):**  
   Refactorizar `FD03-EPIS-Informe_SRS.md` para armonizarlo con `TABLES.md` y `DIAGRAMS.md`: transcribir las narrativas de CU-04.1, CU-29 y CU-30, homologar la nomenclatura `CU-XX`, eliminar el texto descontextualizado de tutorías y corregir la duplicidad de viabilidad ambiental.
4. **Formalización del CCB y Primer Paquete de Líneas Base (Prioridad 2):**  
   Convocar formalmente al Comité de Control de Cambios (C-SharkTeam) para sesionar, levantar el Acta de Evaluación de Líneas Base de Fase 1 y Fase 2, y proceder al etiquetado técnico oficial en Git (`git tag LB-F1I1`, `LB-F1I2`, `LB-F2I1`, `LB-F2I2`).
5. **Generación de Paquetes de Respaldo Criptográfico (Prioridad 3):**  
   Ejecutar el procedimiento de respaldo `git bundle create TraceFlow_$(date).bundle --all`, calcular su checksum SHA-256 y registrarlo formalmente para verificar la recuperabilidad ante desastres conforme al Plan de Configuración.

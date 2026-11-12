# ARCHIVO MAESTRO DE CONTROL DE CAMBIOS DOCUMENTALES (SRS Y SAD)
## Sistema de Gestión de Configuración de Software — TraceFlow SCM

> **Código de Control:** `MAESTRO-SRS-SAD-001`
> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios
> **Organización Cliente:** ÉXODO S.A.C.
> **Equipo Responsable:** C-SharkTeam (Medina, Antayhua, Loyola, Rivera)
> **Fecha de Creación:** 12 de Noviembre de 2026
> **Última Actualización:** 12 de Noviembre de 2026 (Etapa 05 — Actualización Integral del SAD de Diseño)
> **Rama de Trabajo:** `docs/alineacion-srs-sad-2026-11-12`
> **Commit Base de Sincronización:** `6ff6d7e8912be90807c8911ba25584fb77037370` (`6ff6d7e`)
> **Versión del Archivo Maestro:** `0.5.0`
> **Estado Documental:** **BORRADOR DE TRABAJO (Alineamiento SAD Diseño Etapa 05 — Pendiente de Aprobación Formal)**

---

```
========================================================================================
                      UNIVERSIDAD PRIVADA DE TACNA
                         FACULTAD DE INGENIERÍA
              ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS

        "Sistema de Gestión de Configuración de Software - TraceFlow SCM"
            ARCHIVO MAESTRO DE CONTROL DE CAMBIOS DOCUMENTALES
                     ALINEACIÓN INTEGRAL SRS — SAD

    Especialidad: Gestión de la Configuración de Software (SCM), Análisis y Arquitectura
    Marco Normativo: IEEE 828-2012, ISO/IEC/IEEE 12207:2017, IEEE 830 / ISO/IEC/IEEE 29148

    Elaborado por:
      - Joan Cristian Medina Quispe         (Administrador de Configuración / Arquitecto)
      - Renzo Antonio Antayhua Mamani       (Analista de Requerimientos / Gestor SCM)
      - Renzo Fernando Loyola Vilca Choque  (Ingeniero de Software / Frontend Lead)
      - Augusto Joaquin Rivera Muñoz        (Aseguramiento de Calidad / Auditor SCM)

                                TACNA — PERÚ
                                    2026
========================================================================================
```

---

## 1. Portada y Metadatos

| Atributo | Detalle de Configuración |
| :--- | :--- |
| **Nombre del Proyecto** | Sistema de Gestión de Configuración de Software — TraceFlow SCM |
| **Título del Documento** | Archivo Maestro de Control de Cambios Documentales (Alineación SRS y SAD) |
| **Identificador Canónico** | `MAESTRO-SRS-SAD-001` |
| **Fecha de Creación** | 12 de Noviembre de 2026 |
| **Fecha de Revisión Vigente**| 12 de Noviembre de 2026 (Etapa 05: Actualización Integral del SAD de Diseño) |
| **Rama de Trabajo Activa** | `docs/alineacion-srs-sad-2026-11-12` |
| **Commit Base Verificado** | `6ff6d7e` (`6ff6d7e8912be90807c8911ba25584fb77037370`) |
| **Repositorio Remoto Oficial** | `https://github.com/JMedina255/TraceFlow` |
| **Versión del Maestro** | `0.5.0` |
| **Condición Documental** | **Borrador de trabajo** *(Alineamiento SAD Diseño Etapa 05 — Pendiente de Aprobación Formal por CCB)* |
| **Clasificación de Seguridad** | Uso Interno / Control de Configuración de Software |

---

## 2. Objetivo y Alcance

### 2.1. Objetivo
El presente **Archivo Maestro de Control de Cambios Documentales** tiene como propósito gobernar, centralizar, auditar y dar seguimiento sistemático a todas las correcciones, actualizaciones, conciliaciones técnicas y decisiones arquitectónicas requeridas para alinear la **Especificación de Requerimientos de Software (SRS)** y el **Documento de Arquitectura de Software (SAD - Fases de Análisis y Diseño)** con la realidad operativa, normativa y prototípica del proyecto **TraceFlow SCM**.

### 2.2. Alcance
El ámbito de aplicación de este archivo abarca:
1. El inventario exhaustivo de toda la documentación técnica, normativa, de arquitectura, requerimientos y gobernanza SCM ubicada en el repositorio.
2. La identificación, categorización y registro de hallazgos sobre inconsistencias, referencias rotas, obsolescencias, discrepancias de numeración y rupturas de trazabilidad entre requisitos (`RF`), reglas de negocio (`RN`), requerimientos no funcionales (`RNF`), casos de uso (`CU`), diagramas conceptuales/lógicos/físicos y el prototipo React SPA.
3. El establecimiento de una matriz de trazabilidad y alineamiento multidireccional sustentada exclusivamente en evidencias verificables del repositorio.
4. La definición del inventario de diagramas (especificaciones PlantUML y archivos de imagen) y el diseño normativo para la reestructuración de recursos gráficos.
5. El plan metodológico de ejecución por etapas para las subsanaciones documentales.

> **Declaración de No Sustitución de Procedimientos Formales SCM:**
> Este documento actúa como instrumento técnico de orquestación analítica y planificación de cambios documentales. **Bajo ninguna circunstancia sustituye a las Solicitudes de Cambio (RFC), al formato oficial de autorización de cambios (`R-GCSW002`), a las deliberaciones del Comité de Control de Cambios (CCB) ni a las actas formales de auditoría SCM**. Cualquier modificación sustantiva de la línea base aprobada deberá ser canalizada por el flujo formal correspondiente.

---

## 3. Línea Base Inicial

### 3.1. Estado Verificado del Repositorio Git
La inspección de solo lectura realizada sobre el entorno de trabajo certifica los siguientes parámetros de partida:
- **Directorio Local:** `C:\Users\Admin\Desktop\Proyectos\TraceFlowSCM\TraceFlow`
- **Estado de Sincronización Remota:** Se ejecutó `git fetch origin` contra `https://github.com/JMedina255/TraceFlow.git`. La rama `master` local se encontraba alineada y en *fast-forward* con `origin/master` en el commit `6ff6d7e`.
- **Árbol de Trabajo:** Controlado. Se mantiene activa la rama de trabajo `docs/alineacion-srs-sad-2026-11-12`.
- **Bifurcación Controlada:** Rama creada a partir de `6ff6d7e`, asegurando que no se efectúen modificaciones sobre la rama principal `master`.

### 3.2. Referencia de Componentes y Documentos Inspeccionados
La línea base analizada comprende:
1. **Documentos de Requisitos y Arquitectura:** `docs/FD01-EPIS-Informe_Factibilidad_v2.md`, `docs/FD03-EPIS-Informe_SRS.md`, `docs/FD04-EPIS-Informe_SAD_Analisis.md`, `docs/FD05-EPIS-Informe_SAD_Diseno.md`.
2. **Normas de Gobernanza y Fuentes Centralizadas:** `docs/DOCUMENTATION_RULES.md`, `docs/TABLES.md` (TB-01 a TB-14), `docs/DIAGRAMS.md` (114 especificaciones PlantUML), `docs/STITCH_WIREFRAME_PROMPTS.md`.
3. **Decisiones Arquitectónicas:** Directorio `docs/adr/` (`ADR-001` a `ADR-010` y `README.md`).
4. **Auditorías SCM:** `docs/gcsw/auditorias/ACTA_AUDITORIA_01.md`, `docs/gcsw/diagnosticos/DIAGNOSTICO_INICIAL.md`, `docs/INFORME_AUDITORIA_SRS_SAD_ETAPA02.md`.
5. **Auditorías y Reportes de Refactorización:** Directorio `docs/refactor/` (11 informes técnicos de RBAC, identidad, seguridad y UX).
6. **Implementación Técnica:** Aplicación React 19 / Vite / TypeScript en `prototype/` (72 archivos fuente, 9 suites de prueba automatizadas).

---

## 4. Inventario de Documentación Existente

A continuación se registra el inventario consolidado de los documentos técnicos y normativos identificados en el repositorio:

| Código / ID | Nombre del Documento | Ruta en el Repositorio | Versión Encontrada | Estado Documental | Observaciones Técnicas |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **`DOC-INV-01`** | Estudio de Factibilidad (v1) | `docs/FD01-EPIS-Informe_Factibilidad.md` | 1.0 | Superado | Versión inicial del estudio de factibilidad técnica y económica. |
| **`DOC-INV-02`** | Estudio de Factibilidad Definitivo | `docs/FD01-EPIS-Informe_Factibilidad_v2.md` | 2.0 | Aprobado | Versión formal aprobada (VAN: S/. 10,801.64, TIR: 68.20%). Reubicado a `docs/` en commit `a2a6322`. |
| **`DOC-INV-03`** | Especificación de Requerimientos de Software (SRS) | `docs/FD03-EPIS-Informe_SRS.md` | 1.0 | Baseline Aprobada | Documento contractual consolidado (16/09/2026). Contiene 18 RF, 9 RNF, 9 RN y casos de uso `CU-01` a `CU-28`. Presenta enlaces rotos a imágenes tras su reubicación a `docs/`. |
| **`DOC-INV-04`** | Documento de Arquitectura de Software (SAD) — Análisis | `docs/FD04-EPIS-Informe_SAD_Analisis.md` | 1.1 | Baseline Aprobada | Baseline corregida y congelada (01/10/2026). Incorpora 3 bibliotecas, 14 estados RFC, 31 diagramas BCE y dictamina obsolescencia de `DG-13`. Diagramas incrustados como `@startuml`. |
| **`DOC-INV-05`** | Documento de Arquitectura de Software (SAD) — Diseño | `docs/FD05-EPIS-Informe_SAD_Diseno.md` | 0.4 | Borrador Controlado | Borrador de diseño controlado (01/10/2026). Especifica 10 ADRs, UWE navegación (`NAV-01..28`), presentación (`PRES-01..13`), 20 pantallas (`SCREEN-01..20`) y 20 wireframes (`WF-01..20`). Enlaces a imágenes (`../assets/DG-D*.png`, `DG-UWE-*.png`) rotos por ausencia física de archivos en disco. |
| **`DOC-INV-06`** | Reglas de Gobernanza Documental | `docs/DOCUMENTATION_RULES.md` | 1.0 | Aprobado | Define la jerarquía documental, el principio SSOT y las reglas de trazabilidad. Requiere actualizar referencias relativas tras mover los FD a `docs/`. |
| **`DOC-INV-07`** | Catálogo Centralizado de Tablas y Matrices | `docs/TABLES.md` | 1.0 (Vivo) | SSOT Activo | Contiene tablas canónicas `TB-01` a `TB-14`. Es la fuente única de verdad tabular para todo el proyecto. |
| **`DOC-INV-08`** | Catálogo Centralizado de Diagramas PlantUML | `docs/DIAGRAMS.md` | 1.0 (Vivo) | SSOT Activo | Contiene 114 bloques `@startuml` oficiales. No cuenta con archivos `.puml` extraídos de forma individual. |
| **`DOC-INV-09`** | Especificación de Arquitectura del Prototipo React | `docs/PROTOTYPE_SPECIFICATION.md` | 1.0 | Aprobado | Matriz de trazabilidad canónica `CU -> SCREEN -> WF -> Ruta React` para la Fase 1 del prototipo SPA. |
| **`DOC-INV-10`** | Prompts de Wireframes para Stitch AI | `docs/STITCH_WIREFRAME_PROMPTS.md` | 1.0 | Aprobado | Instrucciones operativas para generación asistida de interfaces alineadas a `DG-04`, casos de uso y UWE. |
| **`DOC-INV-11`** | Catálogo Oficial de ADRs | `docs/adr/README.md` | 1.0 | Aprobado | Índice y matriz de decisiones técnicas `ADR-001` a `ADR-010` aprobadas el 01/10/2026. |
| **`DOC-INV-12`** | Registros de Decisión Arquitectónica (ADR) | `docs/adr/ADR-001.md` al `ADR-010.md` | 1.0 | Aprobado | Registros individuales: ADR-001 (Monolito Modular), ADR-002 (React SPA), ADR-003 (PostgreSQL), ADR-004 (Bibliotecas), ADR-005 (JWT), ADR-006 (SoD), ADR-007 (Tailwind/Tokens), ADR-008 (Auditoría SHA-256), ADR-009 (Zustand), ADR-010 (Despliegue). |
| **`DOC-INV-13`** | Diagnóstico Inicial GCSW | `docs/gcsw/diagnosticos/DIAGNOSTICO_INICIAL.md` | 0.1.0 | Diagnóstico | Auditoría SCM sobre disponibilidad de documentos, inventario de 24 ECS, líneas base y riesgos. |
| **`DOC-INV-14`** | Acta de Auditoría de Configuración | `docs/gcsw/auditorias/ACTA_AUDITORIA_01.md` | 0.1.0 | Borrador | Código `AUD-GCSW-001`. Emite 5 hallazgos (H-01 a H-05) clasificando brechas PCA y FCA en el repositorio. |
| **`DOC-INV-15`** | Paquete de Auditoría y Refactor Enterprise | `docs/refactor/*.md` (11 archivos) | 2.0 | Aprobado | Informes técnicos que fundamentaron el PR #10: RBAC, identidades institucionales, seguridad, flujo CCB y UX. |
| **`DOC-INV-16`** | Informe de Auditoría Detallada Etapa 02 | `docs/INFORME_AUDITORIA_SRS_SAD_ETAPA02.md` | 1.0 | Documento de Auditoría | Código `INF-AUD-SRS-SAD-002`. Auditoría exhaustiva y conciliación de requisitos, roles, pantallas, diagramas y versiones. |

---

## 5. Diagnóstico Preliminar de Inconsistencias y Brechas

A partir de la inspección cruzada entre el código fuente, la estructura física de directorios y los documentos existentes, se establecen los siguientes hallazgos técnicos sustentados:

### 5.1. Inconsistencias entre SRS y SAD (Confirmado)
- **Extensión del Alcance de Casos de Uso:** El SRS (`FD03` v1.0) lista casos de uso de `CU-01` a `CU-28`. Sin embargo, el SAD de Análisis (`FD04` v1.1) y SAD de Diseño (`FD05` v0.4) incorporan y formalizan tres casos de uso críticos adicionales:
  - `CU-04.1`: Subsanación de Solicitud de Cambio observada.
  - `CU-29`: Validación de Aceptación del Usuario (UAT) y suscripción de acta formal.
  - `CU-30`: Autorización de Cambio Menor por vía delegada compartida (Doble llave: Gestor SCM + Arquitecto).
  *Evidencia:* `TB-10` en `docs/TABLES.md` incluye los 30 casos de uso, pero la narrativa capitular de `FD03` carece de las especificaciones completas para `CU-29` y `CU-30`.
- **Obsolescencia no reflejada del Diagrama `DG-13`:** `FD04` (§13.2) emitió un dictamen formal declarando obsoleto el diagrama `DG-13` ("Modelo Lógico de la Arquitectura TraceFlow SCM") por sobrecarga de responsabilidades y mezcla de capas de análisis con diseño. No obstante, `FD03-EPIS-Informe_SRS.md` y `docs/DIAGRAMS.md` aún mantienen `DG-13` catalogado como diagrama activo sin indicar su condición de reemplazo por `DG-SAD-A01`, `DG-SAD-A02` y `DG-12`.

### 5.2. Enlaces Rotos y Rutas Relativas tras Reubicación Documental (Confirmado)
- En el commit `a2a6322` se movieron los informes `FD01`, `FD03`, `FD04` y `FD05` desde la raíz hacia `docs/`.
- **Ruptura de Enlaces a Imágenes en `FD03`:** En `FD03-EPIS-Informe_SRS.md`, las 42 imágenes existentes se referencian como `![...](assets/DG-*.png)`. Desde la nueva ubicación `docs/`, esta ruta relativa busca dentro de `docs/assets/` (inexistente), provocando que los navegadores y visores markdown no rendericen ninguna de las imágenes situadas en la carpeta raíz `/assets/`. La ruta relativa correcta debe ser `../assets/DG-*.png` (o migrar a la estructura centralizada de recursos en `docs/assets/`).
- **Referencias Internas Desfasadas:** `docs/DOCUMENTATION_RULES.md` y las portadas de los documentos aún mencionan rutas relativas que asumen que los archivos `FD` residen en la raíz del proyecto.

### 5.3. Brecha de Recursos Gráficos y Diagramas Faltantes (Rectificación Matemática Auditada)
Tras la auditoría exhaustiva de la Etapa 02 sobre todos los archivos Markdown de `docs/`, se aclara de forma determinista el recuento de imágenes faltantes:
- **70 Archivos de Imagen `.png` Únicos Referenciados e Inexistentes en Disco:**
  - 31 Diagramas de Análisis de Objetos BCE: `DG-AO-01.png` a `DG-AO-30.png` y `DG-AO-04.1.png` (referenciados en `FD03`).
  - 3 Diagramas de Secuencia de Análisis: `DG-SEQ-04.1.png`, `DG-SEQ-29.png` y `DG-SEQ-30.png` (referenciados en `FD03`).
  - 6 Diagramas de Arquitectura de Diseño: `DG-D01.png` a `DG-D06.png` (referenciados en `FD05`).
  - 9 Diagramas de Secuencia de Diseño: `DG-DSEQ-04.png`, `08`, `10`, `12`, `17`, `20`, `21`, `29`, `30` (referenciados en `FD05`).
  - 8 Diagramas de Navegación UWE: `DG-UWE-NAV-01.png` a `DG-UWE-NAV-08.png` (referenciados en `FD05`).
  - 13 Diagramas de Presentación UWE: `DG-UWE-PRES-01.png` a `DG-UWE-PRES-13.png` (referenciados en `FD05`).
  *(Suma exacta de archivos .png únicos referenciados por `![]()` que arrojan 404: $31 + 3 + 6 + 9 + 8 + 13 = \mathbf{70\text{ archivos}}$).*
- **2 Modelos PlantUML Incrustados en `FD04` sin Render:**
  - `DG-SAD-A01` (Contexto Arquitectónico) y `DG-SAD-A02` (Arquitectura Lógica Conceptual), redactados como bloques `@startuml` sin archivo `.png` ni enlace markdown.
- **Total de Diagramas Pendientes de Render:** $70 + 2 = \mathbf{72\text{ diagramas}}$. *(Nota de trazabilidad: La mención de "69" en el informe inicial obedeció a un error aritmético tipográfico involuntario que queda formalmente rectificado).*
- **Ausencia de Archivos `.puml` Individuales:** Con excepción de `assets/proceso_gestion_cambios.puml`, los 114 bloques `@startuml` residen incrustados en `docs/DIAGRAMS.md`, sin archivos desacoplados en disco.

### 5.4. Diferencias entre Documentación de Arquitectura e Implementación Real (Confirmado)
- **Modelo de Despliegue y Persistencia:**
  - El SAD de Diseño (`FD05`) y los ADRs (`ADR-001`, `ADR-003`, `ADR-004`) especifican una arquitectura física cliente-servidor con backend Node.js modular, motor de base de datos relacional PostgreSQL 16 y almacenamiento de objetos S3/MinIO para la gestión criptográfica de las tres bibliotecas de software.
  - La implementación actual en `prototype/` es estrictamente una **Single Page Application (SPA) en React 19 / Vite**, sin backend conectado, cuya persistencia reside en la memoria volátil del cliente y en el `localStorage` del navegador mediante Zustand (`storage.service.ts`). Los datos son cargados a partir de semillas estáticas (`initialRfcs.ts`, `initialEcs.ts`, `initialUsers.ts`).
  *Dictamen:* Es indispensable transparentar en el SRS y SAD que el componente `prototype/` constituye una **Línea Base Demostrativa de Interfaz de Usuario y Verificación de Lógica de Negocio/RBAC (Fase de Prototipado)**, evitando afirmaciones en los documentos que induzcan a creer que existe un entorno de base de datos transaccional o un servidor de producción actualmente desplegado.

### 5.5. Cobertura Funcional del Prototipo: Vistas Operativas vs Vistas Simuladas (Rectificación Conciliada)
De las 20 pantallas físicas formalizadas en el SAD de Diseño (`SCREEN-01` a `SCREEN-20`), se establece la correlación exacta y determinista:
- **8 Pantallas Canónicas con Vistas Interactivas Funcionales:** Implementadas a través de **9 componentes de vista dedicados**:
  1. `SCREEN-01` (Login/IAM) -> `LoginView.tsx`
  2. `SCREEN-02` (Dashboard adaptativo contextual por rol) -> `DashboardView.tsx`
  3. `SCREEN-05` (Bandeja de RFCs con filtros y búsqueda) -> `RfcListView.tsx`
  4. `SCREEN-06` (Expediente 360° de RFC con historial e inspección integral) -> `RfcDetailView.tsx`
  5. `SCREEN-07` (Captura y Subsanación de RFC) -> Implementada por **dos vistas**: wizard de creación `RfcCreateView.tsx` y formulario de subsanación `RfcEditView.tsx`.
  6. `SCREEN-08` (Consola de Evaluación de Impacto Técnico) -> `RfcImpactAnalysisView.tsx`
  7. `SCREEN-09` (Sala de Deliberación y Votación Colegiada del CCB) -> `RfcCcbDeliberationView.tsx`
  8. `SCREEN-10` (Consola de Autorización Delegada de Cambio Menor - Doble Llave) -> `RfcMinorApprovalView.tsx`
- **12 Pantallas Canónicas Implementadas como Maquetas Guiadas (`ScreenPlaceholder`):**
  `SCREEN-03` (Directorio de Proyectos), `SCREEN-04` (Ficha de Proyecto), `SCREEN-11` (Órdenes ECN), `SCREEN-12` (Explorador de ECS y Bibliotecas), `SCREEN-13` (Operaciones Check-Out/In), `SCREEN-14` (Historial y Diff), `SCREEN-15` (Validación QA y Defectos), `SCREEN-16` (Suscripción Acta UAT), `SCREEN-17` (Líneas Base y Rollback), `SCREEN-18` (Incidencias), `SCREEN-19` (Auditoría SHA-256 y Reportes), y `SCREEN-20` (Administración de Usuarios).
- **2 Vistas de Soporte del Sistema:** `AccessDeniedView.tsx` (Manejo de acceso denegado por rol) y `NotFoundView.tsx` (Ruta 404).
- *Ecuación Canónica Verificada:* $8\text{ funcionales} + 12\text{ placeholders} = \mathbf{20\text{ pantallas canónicas}}$.

### 5.6. Remanentes de Contexto Académico no Pertinentes en `FD03` (Confirmado)
- En `FD03-EPIS-Informe_SRS.md` Sección 6.1 (Líneas 1070 a 1076, Págs. 30-31), se conserva un texto sobre *tutorías universitarias, mentores y mentoreados*, incompatible con el dominio de TraceFlow SCM. Debe ser eliminado y sustituido por la fundamentación de SoD de los 7 roles canónicos.

### 5.7. Duplicidad Literal entre Viabilidad Social y Ambiental en `FD03` (Confirmado)
- En `FD03-EPIS-Informe_SRS.md` Sección 3.5 (Líneas 485 a 530), los 4 numerales de la Viabilidad Ambiental replican palabra por palabra los de la Viabilidad Social. Debe redactarse una sección ambiental especializada enfocada en centros de datos, servidores y consumo digital.

### 5.8. Discrepancia en la Convención de Nomenclatura de Casos de Uso (`CUSXX` vs `CU-XX`) (Confirmado)
- En el cuerpo de `FD03`, las narrativas emplean la codificación `CUS01` a `CUS28`, mientras que `docs/DOCUMENTATION_RULES.md`, `docs/TABLES.md` y `docs/DIAGRAMS.md` definen como estándar canónico obligatorio `CU-XX`.

### 5.9. Autoridad de la Regla de Negocio `RN-03` (Trazabilidad de Cambios) (Confirmado)
- En `FD03` §5.3 y `TB-06`, la regla `RN-03` está asignada únicamente al Analista de Requerimientos / Gestor, cuando el Check-In a bibliotecas es una función técnica propia del Administrador de Configuración / Bibliotecario. La autoridad debe declararse formalmente compartida.

### 5.10. Asimetría en la Trazabilidad Formal del Cierre Exitoso (`RF-14`) (Confirmado)
- En `FD03`, el requerimiento `RF-14` solo se traza explícitamente a `CU-22` (Cancelar Orden de Cambio). Debe formalizarse la trazabilidad del cierre formal exitoso con `CU-20` (Línea Base Maestra) y `CU-07` / `CU-30`.

---

## 6. Registro Maestro de Cambios Documentales (Matriz DOC)

A continuación se presenta el registro oficial consolidado de cambios documentales, incorporando los hallazgos de las Etapas 01 y 02 bajo numeración consecutiva estricta:

| ID | Documento | Sección | Hallazgo | Evidencia | Cambio Propuesto | Prioridad | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **`DOC-001`** | `FD03-EPIS-Informe_SRS.md` | Portada y Control de Versiones | Falta conciliar la versión formal v1.0 con la necesidad de incorporar la fe de erratas y trazabilidad con SAD v1.1. | Pág. 2 y 3 de `FD03`. Última versión registrada: 1.0 (16/09/2026). | Aperturar historial para emisión de versión 1.1 de trabajo en el marco de la auditoría documental. | **Media** | Implementado (SRS v1.1) |
| **`DOC-002`** | `FD03-EPIS-Informe_SRS.md` | General / Todas las figuras | Rutas relativas a imágenes `assets/DG-*.png` rotas tras el movimiento del archivo a la subcarpeta `docs/`. | Líneas 179, 591, 679, etc. de `FD03`. No cargan en renderizadores markdown. | Actualizar enlaces relativos a `../assets/` o a la nueva estructura centralizada `docs/assets/diagramas/render/`. | **Alta** | Implementado (SRS v1.1) |
| **`DOC-003`** | `FD03-EPIS-Informe_SRS.md` | Catálogo de Casos de Uso | Ausencia de la especificación textual detallada para `CU-04.1`, `CU-29` y `CU-30`. | El SRS solo describe formalmente hasta CU-28; `TABLES.md` ya contempla los 30 casos de uso. | Incorporar fichas descriptivas formales de `CU-04.1` (Subsanación), `CU-29` (UAT) y `CU-30` (Aprobación Menor). | **Alta** | Verificado (SRS v1.1) |
| **`DOC-004`** | `FD03-EPIS-Informe_SRS.md` | Diagramas de Objetos BCE | Referencia a 31 imágenes `assets/DG-AO-*.png` que no existen físicamente en el repositorio. | Tabla de imágenes de análisis en `FD03`. Prueba de disco: 31 archivos ausentes. | Generar y renderizar los 31 diagramas PlantUML BCE y ubicarlos en la carpeta de recursos gráficos aprobada. | **Alta** | Editorial OK (SRS/SAD) / Render Pendiente (Etapa 05) |
| **`DOC-005`** | `FD03-EPIS-Informe_SRS.md` | Diagramas de Secuencia | Referencia a imágenes `DG-SEQ-04.1.png`, `DG-SEQ-29.png` y `DG-SEQ-30.png` faltantes en disco. | Verificación de directorio `assets/`: solo existen `DG-SEQ-01` a `DG-SEQ-28`. | Renderizar las 3 secuencias de análisis faltantes a partir de `docs/DIAGRAMS.md`. | **Alta** | Editorial OK (SRS/SAD) / Render Pendiente (Etapa 05) |
| **`DOC-006`** | `FD03-EPIS-Informe_SRS.md` | Arquitectura Conceptual | Mención del diagrama `DG-13` sin advertencia de obsolescencia. | `FD03` §5 / `TABLES.md` TB-11. `FD04` §13.2 dictaminó formalmente su reemplazo. | Incluir nota técnica de obsolescencia de `DG-13` referenciando el dictamen de `FD04` §13.2. | **Media** | Implementado (SRS v1.1) |
| **`DOC-007`** | `FD04-EPIS-Informe_SAD_Analisis.md` | Secciones 3.4 y 4.3 | Diagramas `DG-SAD-A01` y `DG-SAD-A02` incrustados únicamente como código `@startuml` sin enlace a imagen. | Líneas 272 y 362 de `FD04`. Faltan imágenes renderizadas. | Extraer fuentes PlantUML, renderizar imágenes `.png` e insertar enlaces estándar en `FD04`. | **Media** | Implementado (SAD v1.2 — Render Etapa 05) |
| **`DOC-008`** | `FD04-EPIS-Informe_SAD_Analisis.md` | Enlaces a Tablas y Diagramas | Enlaces apuntan a `docs/TABLES.md` y `docs/DIAGRAMS.md` como si `FD04` estuviera en la raíz. | Enlaces de navegación interna en `FD04` hacia `docs/...`. | Corregir rutas relativas internas entre documentos vecinos dentro del directorio `docs/`. | **Baja** | Implementado (SAD v1.2) |
| **`DOC-009`** | `FD05-EPIS-Informe_SAD_Diseno.md` | Secciones 3 a 20 | 36 enlaces a diagramas de diseño (`DG-D*`, `DG-DSEQ-*`, `DG-UWE-*`) apuntaban a archivos `.png` inexistentes. | `FD05` líneas 285, 419, etc. 36 archivos ausentes. | Inserción de avisos editoriales estandarizados en `FD05` preservando identificadores y PlantUML; inventario preparado para generación en Etapa 06. | **Alta** | Editorialmente Atendido en FD05 v0.5 / Render Pendiente en Etapa 06 |
| **`DOC-010`** | `FD05-EPIS-Informe_SAD_Diseno.md` | Sección 1.6 / Arquitectura Física | Contraste entre la arquitectura cliente-servidor formalizada (Node+Postgres) y el prototipo React SPA. | `FD05` §1.6 vs código en `prototype/src/`. | Incorporada Sección 1.6 delimitando formalmente la Arquitectura Conceptual, Arquitectura Objetivo y Prototipo Implementado. | **Media** | Implementado (FD05 v0.5) |
| **`DOC-011`** | `docs/DOCUMENTATION_RULES.md` | Sección 2 | Rutas de archivos en la matriz SSOT desfasadas tras el traslado de documentos FD a `docs/`. | Tabla de responsabilidades de archivo en `DOCUMENTATION_RULES.md` lista `FD03-EPIS...` en raíz. | Actualizar tabla de estructura documental reflejando que los documentos FD residen bajo `docs/`. | **Baja** | Confirmado |
| **`DOC-012`** | `docs/TABLES.md` | Control de Versiones | Falta registrar las últimas transiciones de los documentos FD y la incorporación del prototipo y auditorías. | Tabla `TB-01`. Último registro asociado a la emisión de diseño v0.4. | Actualizar `TB-01` incorporando las actas `AUD-GCSW-001`, `DIAG-GCSW-001` y la rama de refactor enterprise. | **Media** | Confirmado |
| **`DOC-013`** | `docs/DIAGRAMS.md` | Organización de Fuentes | 114 diagramas residen en un único archivo Markdown masivo sin archivos `.puml` individuales. | `docs/DIAGRAMS.md` tiene más de 7,000 líneas y 114 bloques `@startuml`. | Modularizar y exportar los diagramas a archivos individuales `.puml` organizados por tipo y documento. | **Alta** | Confirmado |
| **`DOC-014`** | `prototype/README.md` | Alcance y Ejecución | Falta precisar explícitamente qué pantallas son funcionales y cuáles corresponden a `ScreenPlaceholder`. | `prototype/src/routes/AppRouter.tsx` utiliza `ScreenPlaceholder` en 12 pantallas canónicas. | Sincronizar el README del prototipo con el inventario de 8 pantallas interactivas vs 12 simuladas. | **Baja** | Confirmado |
| **`DOC-015`** | `FD03-EPIS-Informe_SRS.md` | Requerimientos No Funcionales | Uniformizar denominaciones canónicas de RNF con los ADRs y el SAD de Análisis. | `docs/adr/README.md` §0 detalló discrepancias en la titulación de RNF-01 a RNF-09. | Alinear formalmente los títulos y descripciones de `RNF-01` a `RNF-09` en `FD03` con `TB-05`. | **Media** | Implementado (SRS v1.1) |
| **`DOC-016`** | `docs/STITCH_WIREFRAME_PROMPTS.md` | Trazabilidad con Prototipo | Faltan referencias a las capturas reales obtenidas del prototipo para contrastar con los prompts de Stitch. | Directorio `assets/capturas/` no creado; falta evidencia gráfica comparativa. | Planificar incorporación de capturas del prototipo React en la fase gráfica. | **Baja** | Confirmado |
| **`DOC-017`** | `prototype/` / `PROTOTYPE_SPEC` | Matriz de Pantallas | Discrepancia cuantitativa previa sobre el número de pantallas operativas frente a simuladas. | `AppRouter.tsx` define 8 pantallas canónicas interactivas (9 vistas) y 12 maquetas en `ScreenPlaceholder`. | Rectificar formalmente la ecuación canónica: 8 funcionales + 12 placeholders = 20 pantallas canónicas. | **Alta** | Confirmado |
| **`DOC-018`** | `docs/DIAGRAMS.md` / `FD03` / `FD05` | Inventario Gráfico | Discrepancia previa en el conteo de diagramas faltantes (citados 69 vs 72 reales). | Auditoría determinista: 70 imágenes `.png` únicas referenciadas no existen en disco + 2 modelos incrustados en `FD04`. | Rectificar el recuento a 70 imágenes referenciadas ausentes y 72 diagramas totales pendientes de render. | **Alta** | Confirmado |
| **`DOC-019`** | `FD03-EPIS-Informe_SRS.md` | Sección 6.1 (Pág. 30) | Párrafo remanente de contexto universitario ajeno (mención literal a tutorías, mentores y mentoreados). | `FD03` líneas 1070-1076. | Eliminar dicho párrafo y reemplazarlo por la fundamentación de SoD de los 7 roles canónicos de SCM. | **Alta** | Verificado (SRS v1.1) |
| **`DOC-020`** | `FD03-EPIS-Informe_SRS.md` | Sección 3.5 (Pág. 16) | Duplicidad textual idéntica palabra por palabra entre Viabilidad Social y Viabilidad Ambiental. | `FD03` líneas 485-530. Cuenta con comentario HTML de advertencia. | Reescribir la Viabilidad Ambiental con enfoque en eficiencia energética y huella de carbono de TI. | **Media** | Implementado (SRS v1.1) |
| **`DOC-021`** | `FD03-EPIS-Informe_SRS.md` | Sección 6.1.3 | Discrepancia en la nomenclatura de casos de uso (`CUS01..28` vs `CU-01..30`). | Narrativas usan `CUSXX`; normativa `DOCUMENTATION_RULES.md` y `TABLES.md` mandan `CU-XX`. | Adoptar `CU-XX` como identificador canónico principal en todas las especificaciones narrativas. | **Media** | Verificado (SRS v1.1) |
| **`DOC-022`** | `FD03-EPIS-Informe_SRS.md` / `TABLES` | Sección 5.3 (`TB-06`) | Atribución de autoridad en `RN-03` asignada exclusivamente al Analista omitiendo al Administrador SCM. | `TB-06` línea de RN-03. El Check-In es función operativa del Administrador / Bibliotecario. | Declarar autoridad compartida de `RN-03` entre el Analista de Requerimientos y el Bibliotecario SCM. | **Baja** | Implementado (SRS v1.1) |
| **`DOC-023`** | `FD03-EPIS-Informe_SRS.md` | Sección 5.1 y 6.1.3 | Falta de trazabilidad explícita del cierre formal exitoso en el requerimiento `RF-14`. | En las narrativas, `RF-14` solo se traza a cancelaciones (`CU-22`). Falta vínculo formal con `CU-20`. | Formalizar el vínculo explícito entre `CU-20` (Línea Base Maestra) y el cierre exitoso de `RF-14`. | **Media** | Verificado (SRS v1.1) |
| **`DOC-024`** | `FD05-EPIS-Informe_SAD_Diseno.md` | Sección 1.6 y §3 | Ausencia de cláusula delimitadora entre la arquitectura física objetivo (Node/Postgres) y el prototipo React SPA. | `FD05` §3 describe backend y base de datos relacional de producción sin contrastar con `prototype/`. | Incorporada cláusula formal de no falseamiento técnico y delimitación de líneas base demostrativas vs productivas. | **Alta** | Implementado (FD05 v0.5) |
| **`DOC-025`** | `FD03-EPIS-Informe_SRS.md` | Sección 6.1.3 | Carencia de especificaciones canónicas completas para `CU-04.1`, `CU-29` y `CU-30`. | El cuerpo de `FD03` no incluye las fichas de flujo principal, alternativo y postcondición de estos 3 CUs. | Redactar e integrar las 3 fichas completas bajo la plantilla normativa de casos de uso. | **Alta** | Verificado (SRS v1.1) |
| **`DOC-026`** | `FD04`, `FD05`, `RULES` | Enlaces internos | Enlaces internos entre documentos dentro de `docs/` utilizan prefijo redundante `docs/...`. | Rutas relativas como `docs/TABLES.md` desde un archivo ubicado dentro de `docs/`. | Estandarizar hipervínculos internos entre documentos hermanos a rutas directas (`TABLES.md`, `DIAGRAMS.md`).| **Baja** | Implementado (FD04 v1.2 y FD05 v0.5 resueltos) |
| **`DOC-027`** | `FD05-EPIS-Informe_SAD_Diseno.md` | Sección 10 (Seguridad) | Falta explicitar que las guardas RBAC del frontend controlan navegación pero no sustituyen validación backend. | `prototype/src/components/auth/RoleGuard.tsx` opera en cliente. | Documentada la naturaleza client-side de las guardas de interfaz y la primacía innegociable de la validación en backend NestJS (§10.2). | **Media** | Implementado (FD05 v0.5) |
| **`DOC-028`** | `docs/gcsw/diagnosticos/` | `R-GCSW006` | Inventario de ECS desactualizado respecto de nuevos artefactos de refactor, auditoría y código. | `ACTA_AUDITORIA_01.md` hallazgo H-02 reporta 24 ECS al corte del commit `a12e44f`. | Actualizar inventario `R-GCSW006` asignando códigos `ECS-TF-25` en adelante a los nuevos componentes. | **Media** | Confirmado |
| **`DOC-029`** | `docs/adr/ADR-006.md`, `FD05`, Reportes | Sección 2.1 y 10.2 / Reportes de Cierre | Discrepancia en reporte de cierre previo (Etapa 04) que atribuía adopción de Keycloak/JWT a ADR-006, contradiciendo la decisión oficial aprobada que seleccionó Cookie HttpOnly con sesión opaca en PostgreSQL y difirió Keycloak. | ADR-006 §3 y §4 vs Informe Cierre Etapa 04 §4.1. | Reafirmar ADR-006 en SAD de Diseño v0.5 (§2.1 y §10.2), registrar aclaración de seguridad y dejar constancia para rectificación formal de reportes históricos ante el CCB. | **Media** | Subsanado y Aclarado (FD05 v0.5 y Maestro v0.5.0; pendiente convalidación CCB) |

---

## 7. Matriz Consolidada de Trazabilidad: Requerimientos — Arquitectura — Implementación

A continuación se presenta la matriz de referencia multidireccional que servirá de base técnica para las modificaciones de las Etapas 03 y 04:

| Elemento Normativo | Caso de Uso Canónico | Especificación en SRS (`FD03`) | Representación en SAD Análisis (`FD04`) | Representación en SAD Diseño (`FD05`) | Módulo / Servicio Prototipo (`prototype/`) | Estado de Implementación | Acción Requerida en Corrección |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **`RF-01`** | `CU-01` | §5.1 / `TB-04` | §4 (`MOD-RBAC`, `MOD-USER`) | §7 (`DG-D05`, `WF-20`) | `auth.service.ts`, `LoginView.tsx` | Implementado (Client-side) | Sincronizar permisos en SRS con matriz RBAC de `FD05`. |
| **`RF-02`** | `CU-02`, `CU-03` | §5.1 / `TB-04` | §4 (`MOD-PROJ`) | §5 (`DG-D02`, `WF-03`, `WF-04`) | `project.service.ts`, `ScreenPlaceholder` | Simulado (`/projects`) | Mantener consistencia de aislamiento multitenant. |
| **`RF-03`** | `CU-09` | §5.1 / `TB-04` | §4 (`MOD-ECS`) | §5 (`DG-D02`, `DG-D03`, `WF-12`)| `ecs.service.ts`, `RfcCreateView.tsx` | Parcial (En wizard) | Normalizar catálogo de ECS con `R-GCSW006`. |
| **`RF-04`** | `CU-04`, `CU-04.1`| §5.1 / `TB-04` | §7 (`DG-11`, estados 01..03) | §8 (`DG-DSEQ-04`, `WF-07`) | `RfcCreateView.tsx`, `RfcEditView.tsx`| **Totalmente funcional** | Incorporar ficha formal de `CU-04.1` en `FD03`. |
| **`RF-05`** | `CU-05`, `CU-06` | §5.1 / `TB-04` | §4 (`MOD-IMP`) | §9 (`DG-DSEQ-08`, `WF-08`) | `RfcImpactAnalysisView.tsx` | **Totalmente funcional** | Alinear criterios de evaluación de triple restricción. |
| **`RF-06`** | `CU-07` | §5.1 / `TB-04` | §4 (`MOD-CCB`) | §10 (`PRES-06`, `WF-09`) | `RfcCcbDeliberationView.tsx` | **Totalmente funcional** | Formalizar reglas de quórum y acta en `FD03`. |
| **`RF-07`** | `CU-08`, `CU-22` | §5.1 / `TB-04` | §4 (`MOD-ECN`) | §11 (`DG-DSEQ-08`, `WF-11`) | `rfc.service.ts`, `ScreenPlaceholder` | Lógica en servicio | Completar trazabilidad de órdenes en expediente. |
| **`RF-08`** | `CU-10`, `CU-12` | §5.1 / `TB-04` | §4 (3 Bibliotecas) | §6 (ADR-004, `DG-D04`, `WF-13`) | `types/ecs.ts`, `ScreenPlaceholder` | Simulado (`/scm/operations`)| Aclarar en `FD03` la separación estricta de 3 bibliotecas. |
| **`RF-09`** | `CU-11`, `CU-13`, `CU-14`| §5.1 / `TB-04`| §4 (`MOD-LOCK`) | §12 (`DG-DSEQ-10`, `WF-14`) | `types/ecs.ts`, `ScreenPlaceholder` | Lógica conceptual | Reforzar regla de bloqueo `RN-06` no desactivable. |
| **`RF-10`** | `CU-15..17`, `CU-29`| §5.1 / `TB-04` | §4 (`MOD-QA`) | §14, §15 (`DG-DSEQ-17/29`, `WF-15/16`)| `types/qa.ts`, `ScreenPlaceholder` | Simulado (`/qa`, `/uat`) | Incorporar ficha formal de `CU-29` (UAT) en `FD03`. |
| **`RF-11`** | `CU-18`, `CU-19` | §5.1 / `TB-04` | §4 (`MOD-QA`) | §14 (`PRES-10`, `WF-15`) | `types/qa.ts`, `ScreenPlaceholder` | Lógica en estados | Alinear ciclos de re-test y límites de reintentos. |
| **`RF-12`** | `CU-21`, `CU-22` | §5.1 / `TB-04` | §4 (`MOD-ROLL`) | §16 (`DG-DSEQ-21`, `WF-17`) | `rfc.service.ts` | Lógica en servicio | Delimitar que el rollback opera solo en Trabajo. |
| **`RF-13`** | `CU-20` | §5.1 / `TB-04` | §4 (`MOD-BASE`) | §16 (`DG-DSEQ-20`, `WF-17`) | `initialBaselines.ts` | Simulado (`/baselines`) | Exigir doble conformidad (QA+UAT) previa a Maestra. |
| **`RF-14`** | `CU-07/20/22/30` | §5.1 / `TB-04` | §7 (`DG-11`, 4 terminales) | §17 (ADR-008) | `RfcDetailView.tsx` | **Totalmente funcional** | Vincular explícitamente cierre exitoso con `CU-20`. |
| **`RF-15`** | `CU-23..25` | §5.1 / `TB-04` | §4 (`MOD-INC`) | §18 (`PRES-03`, `WF-18`) | `initialIncidents.ts` | Simulado (`/incidents`) | Formular regla de negocio complementaria de incidencias.|
| **`RF-16`** | `CU-13`, `CU-26` | §5.1 / `TB-04` | §12 (`TB-14`) | §17 (ADR-008) | `RfcDetailView.tsx` | **Totalmente funcional** | Consolidar vista de expediente 360° en diseño. |
| **`RF-17`** | `CU-27` | §5.1 / `TB-04` | §4 (`MOD-AUD`) | §17 (ADR-008, `WF-19`) | `audit.service.ts` | Servicio activo | Mantener hashing SHA-256 inmutable en eventos. |
| **`RF-18`** | `CU-28` | §5.1 / `TB-04` | §4 (`MOD-REP`) | §17 (`WF-19`) | `DashboardView.tsx` | Parcial en dashboard | Planificar reportería avanzada en sprint técnico. |
| **`RF-Ext`**| `CU-30` | *Brecha en SRS* | §3.4 (Vía delegada) | §10.2 (`DG-DSEQ-30`, `WF-10`) | `RfcMinorApprovalView.tsx` | **Totalmente funcional** | Incorporar ficha canónica de `CU-30` en `FD03`. |
| **`RNF-01`**| N/A | §5.2 (`TB-05`)| §3.4 (Seguridad) | §7 (ADR-005/006, `DG-D05`) | `auth.service.ts`, `RoleGuard` | Implementado (Client) | Alinear denominación canónica de Seguridad. |
| **`RNF-03`**| N/A | §5.2 (`TB-05`)| §4 (`MOD-AUD`) | §17 (ADR-008, Checksums) | `audit.service.ts` | Lógica en auth | Precisar que hash en archivos físicos es objetivo backend.|
| **`RN-01`** | `CU-07`, `CU-30` | §5.3 (`TB-06`)| §3.4 / §7.2 | §10 (`DG-DSEQ-08`, `WF-09/10`)| `rfc.service.ts`, `ccb.service.ts` | **Totalmente funcional** | Garantizar correspondencia de SoD en CCB y doble llave.|
| **`RN-05`** | `CU-06` | §5.3 (`TB-06`)| §4 (`MOD-IMP`) | §9 (`WF-08`) | `impactAnalysis.service.ts`| **Totalmente funcional** | Mantener precondición de informe técnico obligatorio. |
| **`RN-06`** | `CU-10`, `CU-11` | §5.3 (`TB-06`)| §4 (`MOD-LOCK`) | §12 (`DG-DSEQ-10`) | `types/ecs.ts` | Lógica conceptual | Reafirmar bloqueo no desactivable manualmente. |
| **`RN-07`** | `CU-07/20/22/30` | §5.3 (`TB-06`)| §7.2 (`TB-07`)| §17 | `rfc.service.ts` | **Totalmente funcional** | Consolidar los 4 estados de cierre terminales. |
| **`RN-09`** | `CU-17`, `CU-29` | §5.3 (`TB-06`)| §4 / §7.2 | §14, §15 (`WF-15`, `WF-16`) | `AppRouter.tsx` | Lógica en estados | Reforzar doble conformidad previa a Maestra. |

---

## 8. Inventario de Diagramas y Recursos de Modelado

A continuación se registra el inventario exhaustivo y conciliado de los diagramas del sistema:

| ID Figura | Nombre Canónico del Diagrama | Ubicación Documental | Fuente `.puml` | Archivo `.png` en Disco | Estado Auditado | Acción Requerida |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **`DG-01`** | Organigrama C-SharkTeam y Cliente | `FD03` §2.1 | En `DIAGRAMS.md` | `assets/DG-01.png` | Imagen en raíz / Enlace roto en `FD03` | Corregir enlace a `../assets/DG-01.png` o migrar a `docs/assets/`. |
| **`DG-02`** | Actividades del Proceso Actual (AS-IS) | `FD03` §2.3 | En `DIAGRAMS.md` | `assets/DG-02.png` | Imagen en raíz / Enlace roto en `FD03` | Corregir enlace a `../assets/DG-02.png`. |
| **`DG-03`** | Proceso Propuesto Gestión Cambios (TO-BE v2) | `FD03` §2.4 / `FD04` §7.1 | En `DIAGRAMS.md` | `assets/DG-03.png` | Imagen en raíz / Enlace roto en `FD03` | Corregir enlace a `../assets/DG-03.png`. |
| **`DG-04`** | Diagrama de Paquetes Arquitecturales | `FD03` §5.2 / `FD04` §4.1 | En `DIAGRAMS.md` | `assets/DG-04.png` | Imagen en raíz / Enlace roto en `FD03` | Corregir enlace a `../assets/DG-04.png`. |
| **`DG-05`** | Diagrama General de Casos de Uso | `FD03` §5.2 | En `DIAGRAMS.md` | `assets/DG-05.png` | Imagen en raíz / Enlace roto en `FD03` | Corregir enlace a `../assets/DG-05.png`. |
| **`DG-06`** | Casos de Uso: Usuarios y Proyectos | `FD03` §5.2 | En `DIAGRAMS.md` | `assets/DG-06.png` | Imagen en raíz / Enlace roto en `FD03` | Corregir enlace a `../assets/DG-06.png`. |
| **`DG-07`** | Casos de Uso: Registro y Evaluación RFC | `FD03` §5.2 | En `DIAGRAMS.md` | `assets/DG-07.png` | Imagen en raíz / Enlace roto en `FD03` | Corregir enlace a `../assets/DG-07.png`. |
| **`DG-08`** | Casos de Uso: SCM Core (ECS, Bibliotecas) | `FD03` §5.2 | En `DIAGRAMS.md` | `assets/DG-08.png` | Imagen en raíz / Enlace roto en `FD03` | Corregir enlace a `../assets/DG-08.png`. |
| **`DG-09`** | Casos de Uso: Implementación y Calidad | `FD03` §5.2 | En `DIAGRAMS.md` | `assets/DG-09.png` | Imagen en raíz / Enlace roto en `FD03` | Corregir enlace a `../assets/DG-09.png`. |
| **`DG-10`** | Casos de Uso: Trazabilidad y Auditoría | `FD03` §5.2 | En `DIAGRAMS.md` | `assets/DG-10.png` | Imagen en raíz / Enlace roto en `FD03` | Corregir enlace a `../assets/DG-10.png`. |
| **`DG-11`** | Estados del Ciclo de Vida RFC (14 estados)| `FD03` §5.2 / `FD04` §7.2 | En `DIAGRAMS.md` | `assets/DG-11.png` | Imagen en raíz / Enlace roto en `FD03` | Corregir enlace a `../assets/DG-11.png`. |
| **`DG-12`** | Modelo Conceptual del Dominio | `FD03` §5.2 / `FD04` §6.1 | En `DIAGRAMS.md` y `FD04` | `assets/DG-12.png` | Imagen en raíz / Enlace roto en `FD03` | Corregir enlace a `../assets/DG-12.png`. |
| **`DG-13`** | Modelo Lógico de la Arquitectura | `FD03` §5.2 / `TABLES.md` | En `DIAGRAMS.md` | `assets/DG-13.png` | **OBSOLETO PARA ANÁLISIS** | Marcar nota formal de obsolescencia según `FD04` §13.2.|
| **`DG-SEQ-01..28`**| Diagramas de Secuencia Análisis (28 diag.)| `FD03` §5.3 / `TB-11` | En `DIAGRAMS.md` | `assets/DG-SEQ-01..28.png` | Imágenes en raíz / Enlaces rotos | Corregir enlaces a `../assets/DG-SEQ-*.png`. |
| **`DG-SEQ-04.1`** | Secuencia Análisis: Subsanación de RFC | `FD03` §5.3 / `TB-11` | En `DIAGRAMS.md` | **Inexistente en disco** | **Faltante (404)** | Renderizar `.png` a partir de `DIAGRAMS.md`. |
| **`DG-SEQ-29`** | Secuencia Análisis: Aceptación UAT | `FD03` §5.3 / `TB-11` | En `DIAGRAMS.md` | **Inexistente en disco** | **Faltante (404)** | Renderizar `.png` a partir de `DIAGRAMS.md`. |
| **`DG-SEQ-30`** | Secuencia Análisis: Aprobación Menor | `FD03` §5.3 / `TB-11` | En `DIAGRAMS.md` | **Inexistente en disco** | **Faltante (404)** | Renderizar `.png` a partir de `DIAGRAMS.md`. |
| **`DG-AO-01..30`** | Diagramas de Análisis BCE (31 diagramas) | `FD03` §5.4 / `TB-11.1` | En `DIAGRAMS.md` | **Inexistentes en disco (31)** | **Faltantes (404)** | Renderizar 31 imágenes `.png` y alojarlas. |
| **`DG-SAD-A01`** | Contexto Arquitectónico de TraceFlow SCM | `FD04` §3.4 | Incrustado en `FD04` | **Inexistente en disco** | Sin render / Sin enlace | Extraer `.puml`, renderizar `.png` e insertar enlace.|
| **`DG-SAD-A02`** | Arquitectura Lógica Conceptual (9 módulos)| `FD04` §4.3 | Incrustado en `FD04` | **Inexistente en disco** | Sin render / Sin enlace | Extraer `.puml`, renderizar `.png` e insertar enlace.|
| **`DG-D01`** | Arquitectura Física de TraceFlow SCM | `FD05` §3 | En `DIAGRAMS.md` | **Inexistente en disco** | **Faltante (404)** | Renderizar `.png` y alojar en recursos de diseño. |
| **`DG-D02`** | Componentes del Monolito Modular Backend | `FD05` §5 | En `DIAGRAMS.md` | **Inexistente en disco** | **Faltante (404)** | Renderizar `.png` y alojar en recursos de diseño. |
| **`DG-D03`** | Modelo Relacional Lógico de Base de Datos | `FD05` §5.4 | En `DIAGRAMS.md` | **Inexistente en disco** | **Faltante (404)** | Renderizar `.png` y alojar en recursos de diseño. |
| **`DG-D04`** | Arquitectura de Storage y Bibliotecas SCM | `FD05` §6 | En `DIAGRAMS.md` | **Inexistente en disco** | **Faltante (404)** | Renderizar `.png` y alojar en recursos de diseño. |
| **`DG-D05`** | Flujo Técnico de Autenticación, RBAC y SoD | `FD05` §7 | En `DIAGRAMS.md` | **Inexistente en disco** | **Faltante (404)** | Renderizar `.png` y alojar en recursos de diseño. |
| **`DG-D06`** | Diagrama de Despliegue de TraceFlow SCM | `FD05` §18 | En `DIAGRAMS.md` | **Inexistente en disco** | **Faltante (404)** | Renderizar `.png` y alojar en recursos de diseño. |
| **`DG-DSEQ-*`** | Secuencias de Diseño (9 diagramas) | `FD05` §8 a §17 | En `DIAGRAMS.md` | **Inexistentes en disco (9)** | **Faltantes (404)** | Renderizar 9 imágenes `.png` (`DG-DSEQ-04..30`). |
| **`DG-UWE-NAV-*`**| Modelos UWE de Navegación (8 diagramas) | `FD05` §19 | En `DIAGRAMS.md` | **Inexistentes en disco (8)** | **Faltantes (404)** | Renderizar 8 imágenes `.png` (`DG-UWE-NAV-01..08`). |
| **`DG-UWE-PRES-*`**| Modelos UWE de Presentación (13 diagramas) | `FD05` §20 | En `DIAGRAMS.md` | **Inexistentes en disco (13)** | **Faltantes (404)** | Renderizar 13 imágenes `.png` (`DG-UWE-PRES-01..13`).|

---

## 9. Estructura de Recursos Gráficos Propuesta

Se ratifica la conveniencia de organizar los recursos gráficos bajo `docs/assets/` desacoplando fuentes y renders:
```
docs/
└── assets/
    ├── diagramas/
    │   ├── plantuml/           <-- Fuentes .puml individuales y modulares
    │   │   ├── analisis/       (DG-01..13, DG-SEQ-*, DG-AO-*, DG-SAD-A*)
    │   │   ├── diseno/         (DG-D01..06, DG-DSEQ-*)
    │   │   └── uwe/            (DG-UWE-NAV-*, DG-UWE-PRES-*)
    │   └── render/             <-- Imágenes renderizadas (.png de alta resolución)
    │       ├── analisis/
    │       ├── diseno/
    │       └── uwe/
    └── capturas/               <-- Capturas reales del prototipo React
        ├── auth/               (SCREEN-01)
        ├── dashboard/          (SCREEN-02 por rol)
        ├── rfcs/               (SCREEN-05..10: bandejas, wizard, impacto, CCB)
        └── placeholders/       (Evidencias de pantallas simuladas)
```

---

## 10. Criterios de Calidad y Aceptación Documental

Se establecen los siguientes criterios verificables:
1. **Consistencia Bidireccional:** Todo RF, RN y RNF debe tener reflejo exacto entre `TABLES.md`, `FD03`, `FD04` y `FD05`.
2. **Cero Enlaces Rotos:** Toda referencia markdown `![]()` debe resolver a un archivo de imagen existente en disco.
3. **Desacoplamiento PlantUML:** Cada diagrama debe poseer su archivo `.puml` independiente y compilable.
4. **Veracidad de Implementación:** Las descripciones del sistema deben diferenciar explícitamente entre el prototipo React SPA en cliente y el backend objetivo de producción.
5. **Preservación Histórica:** Se mantiene el congelamiento formal de versiones previas mediante nuevas emisiones controladas (v1.1 en SRS).

---

## 11. Plan de Ejecución por Etapas

La secuencia de intervención se mantiene según lo establecido:
* **Etapa 01:** Creación del Maestro de Cambios (*Completada*).
* **Etapa 02:** Auditoría Detallada y Conciliación SRS–SAD–Implementación (*Completada mediante este informe y el maestro v0.2.0*).
* **Etapa 03:** Corrección y Emisión de la Revisión del SRS (`FD03` v1.1).
* **Etapa 04:** Corrección y Emisión del SAD de Análisis (`FD04` v1.2) y SAD de Diseño (`FD05` v1.0).
* **Etapa 05:** Desacoplamiento de PlantUML, Renderizado y Capturas Gráficas.
* **Etapa 06:** Validación Cruzada de Enlaces, Trazabilidad y Cierre.
* **Etapa 07:** Evaluación de Refinamientos Técnicos del Repositorio.

---

## 12. Riesgos y Decisiones Pendientes

1. **Aprobación de la Emisión v1.1 del SRS (`FD03`):** Requiere aval para aperturar el control de versiones y publicar la versión corregida.
2. **Aprobación de la Estructura `docs/assets/`:** Confirmar la creación de directorios para centralizar fuentes `.puml` y renders `.png`.
3. **Convalidación del Alcance del Prototipo:** Ratificar que las 8 pantallas interactivas y 12 maquetas guiadas satisfacen los requerimientos del prototipo de la entrega académica de SCM.

---

## 13. Historial de Cambios del Archivo Maestro

| Fecha | Versión | Autor / Responsable | Descripción del Cambio | Referencia de Cambio |
| :---: | :---: | :--- | :--- | :--- |
| **12/11/2026** | **0.1.0** | C-SharkTeam (Medina, Antayhua, Loyola, Rivera) | Creación inicial del Archivo Maestro de Control de Cambios Documentales (Etapa 01): inventario exhaustivo, diagnóstico de brechas, matriz DOC preliminar (DOC-001 a DOC-016), matriz de alineamiento funcional, inventario de diagramas y plan de ejecución por etapas. | Instrucción de Agente — Etapa 01 (Rama `docs/alineacion-srs-sad-2026-11-12`) |
| **12/11/2026** | **0.2.0** | C-SharkTeam (Medina, Antayhua, Loyola, Rivera) | Actualización integral de la Etapa 02: rectificación cuantitativa de pantallas (8 interactivas funcionales + 12 placeholders = 20 canónicas), rectificación matemática de diagramas (70 imágenes referenciadas ausentes + 2 modelos en FD04 = 72 pendientes), incorporación de hallazgos DOC-017 a DOC-028, y emisión del informe de auditoría detallado `INF-AUD-SRS-SAD-002`. | Instrucción de Agente — Etapa 02 (Rama `docs/alineacion-srs-sad-2026-11-12`) |
| **12/11/2026** | **0.3.0** | C-SharkTeam (Medina, Antayhua, Loyola, Rivera) | Actualización de la Etapa 03: aplicación de correcciones y alineamiento integral en `docs/FD03-EPIS-Informe_SRS.md` (Revisión Candidata v1.1 borrador en revisión), resolución de 41 enlaces de figuras relativas (DOC-002/006), tratamiento de 34 diagramas pendientes de render (DOC-004/005), alerta de obsolescencia de DG-13 (DOC-006/025), redacción técnica de Viabilidad Ambiental (DOC-020), depuración de contexto (DOC-022), formalización de 31 casos de uso (DOC-003/021/025), delimitación técnica sistema objetivo vs prototipo de 20 pantallas (§1.2, DOC-015/017) y emisión del informe de cierre `INF-CIERRE-SRS-ETAPA03`. | Instrucción de Agente — Etapa 03 (Rama `docs/alineacion-srs-sad-2026-11-12`) |
| **12/11/2026** | **0.4.0** | C-SharkTeam (Medina, Antayhua, Loyola, Rivera) | Actualización de la Etapa 04: alineamiento y corrección integral de `docs/FD04-EPIS-Informe_SAD_Analisis.md` (Revisión Candidata v1.2), incorporación de Sección 1.6 (delimitación tripartita de arquitectura), Sección 4.5 (catálogo conceptual BCE de 31 casos de uso), notas de estado gráfico para `DG-SAD-A01` y `DG-SAD-A02` (DOC-007), matriz operacional de transiciones de 14 estados en Sección 7.2, resolución de 18 enlaces rotos a `TABLES.md` / `DIAGRAMS.md` / `DOCUMENTATION_RULES.md` (DOC-008, DOC-026), actualización de la declaración de baseline v1.2, publicación del commit inicial en GitHub (`origin/docs/alineacion-srs-sad-2026-11-12`) y emisión del informe de cierre `INF-CIERRE-SAD-ETAPA04`. | Instrucción de Agente — Etapa 04 (Rama `docs/alineacion-srs-sad-2026-11-12`) |
| **12/11/2026** | **0.5.0** | C-SharkTeam (Medina, Antayhua, Loyola, Rivera) | Actualización integral de la Etapa 05: consolidación del SAD de Diseño en Revisión Candidata v0.5; corrección de metadatos históricos del archivo maestro (bump a v0.5.0); formalización de la delimitación tripartita de arquitectura en FD05 (§1.6: conceptual, objetivo e implementada); saneamiento y conciliación estricta de ADR-001 a ADR-010 con aclaración de ADR-006 (sesión opaca en PostgreSQL con HttpOnly vs Keycloak diferido); tratamiento editorial estandarizado de los 36 diagramas de diseño pendientes de render (DOC-009); formalización de la matriz canónica de 20 pantallas físicas (§20.5: 8 interactivas funcionales vía 9 vistas, 12 demostrativas placeholder y 2 de soporte); acotamiento de parámetros operativos RNF como metas de diseño sin pruebas empíricas en infraestructura física; incorporación de la matriz detallada de operaciones REST en §9.4; incorporación del hallazgo DOC-029; y emisión del informe de cierre `INF-CIERRE-SAD-DISENO-ETAPA05`. | Instrucción de Agente — Etapa 05 (Rama `docs/alineacion-srs-sad-2026-11-12`) |

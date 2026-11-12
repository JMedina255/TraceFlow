# INFORME DE AUDITORÍA DETALLADA Y CONCILIACIÓN INTEGRAL (ETAPA 02)
## Alineación Técnica: SRS — SAD de Análisis — SAD de Diseño — Prototipo React
### Sistema de Gestión de Configuración de Software — TraceFlow SCM

> **Código de Control:** `INF-AUD-SRS-SAD-002`  
> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software y Control de Cambios  
> **Organización Cliente:** ÉXODO S.A.C.  
> **Equipo Responsable:** C-SharkTeam (Medina, Antayhua, Loyola, Rivera)  
> **Fecha de Emisión:** 12 de Noviembre de 2026  
> **Rama Activa:** `docs/alineacion-srs-sad-2026-11-12`  
> **Commit Base de Sincronización:** `6ff6d7e8912be90807c8911ba25584fb77037370` (`6ff6d7e`)  
> **Estado Documental:** **DOCUMENTO DE AUDITORÍA Y DIAGNÓSTICO (Vigente / Fase de Planificación)**  
> **Marco Normativo:** IEEE 828-2012 (SCM), ISO/IEC/IEEE 12207:2017, IEEE 830 / ISO/IEC/IEEE 29148 (Requisitos)

---

```
========================================================================================
                      UNIVERSIDAD PRIVADA DE TACNA
                         FACULTAD DE INGENIERÍA
              ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS

        "Sistema de Gestión de Configuración de Software - TraceFlow SCM"
              INFORME DE AUDITORÍA DETALLADA Y CONCILIACIÓN TÉCNICA
                                   ETAPA 02

    Especialidades: Auditoría Técnica de Software, Arquitectura y Análisis de Requisitos
    Alcance de Auditoría:
      - Especificación de Requerimientos de Software (SRS - FD03 v1.0)
      - Documento de Arquitectura de Software — Análisis (SAD Análisis - FD04 v1.1)
      - Documento de Arquitectura de Software — Diseño (SAD Diseño - FD05 v0.4)
      - Catálogos Normativos Centralizados (TABLES.md y DIAGRAMS.md)
      - Código Fuente y Suites de Prueba del Prototipo React SPA (prototype/)

                                TACNA — PERÚ
                                    2026
========================================================================================
```

---

## 1. Resumen Ejecutivo

El presente informe constituye el dictamen consolidado de la **Etapa 02: Auditoría detallada y conciliación SRS–SAD–Implementación** para el proyecto **TraceFlow SCM**. 

Durante esta intervención de diagnóstico exhaustivo y de solo lectura sobre la línea base técnica (`6ff6d7e`), se procedió a contrastar de manera bidireccional los requerimientos contractuales, las reglas de gobernanza, el diseño de arquitectura y el código ejecutable de la aplicación web prototipo (`prototype/`).

### Principales Conclusiones Cuantitativas y Cualitativas:
1. **Requerimientos Funcionales:** Se auditaron los 18 Requerimientos Funcionales (`RF-01` a `RF-18`). Se confirma consistencia temática general, pero se detecta que el SRS (`FD03`) carece de la formalización capitular de tres casos de uso operativos esenciales definidos e implementados posteriormente: `CU-04.1` (Subsanación de RFC), `CU-29` (Aceptación formal UAT) y `CU-30` (Autorización delegada de Cambio Menor por doble llave).
2. **Requerimientos No Funcionales:** Los 9 RNF (`RNF-01` a `RNF-09`) fueron contrastados. Se determinó que mientras que atributos como Seguridad (`RNF-01`) e Integridad (`RNF-03`) están parcialmente respaldados en el prototipo mediante hashing criptográfico y RBAC client-side, requerimientos como Disponibilidad del 99.9% (`RNF-02`), Escalabilidad de 50 proyectos (`RNF-05`) y Respaldo automático (`RNF-09`) pertenecen a la **arquitectura física objetivo** y no son exigibles ni verificables en el prototipo actual en memoria/localStorage.
3. **Reglas de Negocio:** Se auditaron las 9 Reglas de Negocio (`RN-01` a `RN-09`). Se detectó una inconsistencia histórica de autoridad en `RN-03` (atribuida solo al Analista cuando el Check-In es función del Administrador de Configuración) y se verificó que la regla crítica de no desactivación del bloqueo (`RN-06`) está conceptualmente protegida.
4. **Conciliación de Pantallas del Prototipo (Rectificación Cuantitativa):** Se resolvió la discrepancia cuantitativa reportada previamente. El catálogo canónico consta de **20 pantallas físicas (`SCREEN-01` a `SCREEN-20`)**. De ellas:
   - **8 pantallas canónicas cuentan con vistas interactivas funcionales** (`SCREEN-01`, `02`, `05`, `06`, `07`, `08`, `09`, `10`), implementadas mediante **9 componentes de vista** (debido a que `SCREEN-07` se descompone en creación `RfcCreateView` y edición/subsanación `RfcEditView`).
   - **12 pantallas canónicas están implementadas como maquetas guiadas** mediante el componente reutilizable `ScreenPlaceholder` (`SCREEN-03`, `04`, `11`, `12`, `13`, `14`, `15`, `16`, `17`, `18`, `19`, `20`).
   - **2 vistas transversales de soporte** complementan el enrutador (`AccessDeniedView` y `NotFoundView`).
   - *Total canónico exacto: 8 funcionales + 12 placeholders = 20 pantallas canónicas.*
5. **Auditoría Definitiva de Diagramas y Recursos Gráficos (Rectificación Cuantitativa):** Se auditó minuciosamente la aparente discrepancia entre 69 y 72 diagramas faltantes reportada en la Etapa 01. Se concluye con exactitud matemática reproducible:
   - Existen **70 archivos `.png` únicos** que están explícitamente referenciados mediante sintaxis markdown `![]()` en los documentos pero que **no existen en disco** (31 de análisis BCE, 3 secuencias de análisis, 6 de arquitectura de diseño, 9 secuencias de diseño, 8 de navegación UWE y 13 de presentación UWE).
   - Existen **2 diagramas de arquitectura conceptual** en `FD04` (`DG-SAD-A01` y `DG-SAD-A02`) redactados en bloques `@startuml` que carecen de enlace y de imagen renderizada.
   - *Total de diagramas pendientes de renderizado y formalización: 70 referenciados + 2 incrustados = **72 diagramas**.* La cifra "69" citada en la narrativa preliminar correspondió a un error tipográfico involuntario de cálculo.
6. **Delimitación Arquitectónica (Target vs Implementación):** Se ratifica que el prototipo React SPA es una herramienta de demostración funcional y validación de interfaces/RBAC. El SAD de Diseño (`FD05`) debe incorporar una cláusula formal que delimite la arquitectura física objetivo (Node/PostgreSQL/S3) frente a la línea base prototípica ejecutable.

---

## 2. Alcance y Metodología de Auditoría

### 2.1. Alcance
La auditoría abarca el 100% de los documentos normativos, especificaciones de análisis y diseño, decisiones arquitectónicas y archivos de código fuente alojados en la rama `docs/alineacion-srs-sad-2026-11-12` a partir del commit `6ff6d7e`.

### 2.2. Metodología
Se aplicó un enfoque riguroso de auditoría cruzada basado en tres directrices:
1. **Principio de Fuente Única de Verdad (SSOT):** Conforme a `docs/DOCUMENTATION_RULES.md`, se tomó `docs/TABLES.md` como autoridad tabular y `docs/DIAGRAMS.md` como autoridad de modelado gráfico, contrastando cómo los documentos consolidados (`FD03`, `FD04`, `FD05`) consumen estas fuentes.
2. **Inspección Física y de Enlaces en Disco:** Verificación determinista de la existencia real de rutas y archivos mediante comandos de scripting, asegurando que ninguna afirmación de existencia o ausencia carezca de respaldo empírico.
3. **Análisis de Cobertura de Código e Interfaces:** Lectura analítica de las definiciones TypeScript (`prototype/src/types/`), servicios (`prototype/src/services/`), componentes y rutas (`AppRouter.tsx`), evaluando la segregación de funciones (SoD) y la fidelidad del prototipo frente a los requisitos.

---

## 3. Inventario de Fuentes Revisadas

A continuación se detallan las fuentes sometidas a examen exhaustivo:

| Identificador | Archivo en Repositorio | Versión / Estado | Rol Metodológico |
| :--- | :--- | :---: | :--- |
| `SRC-01` | `docs/FD03-EPIS-Informe_SRS.md` | v1.0 (Aprobado) | Documento contractual consolidado de requerimientos de software. |
| `SRC-02` | `docs/FD04-EPIS-Informe_SAD_Analisis.md` | v1.1 (Aprobado) | Baseline congelada de arquitectura lógica y conceptual. |
| `SRC-03` | `docs/FD05-EPIS-Informe_SAD_Diseno.md` | v0.4 (Borrador) | Borrador controlado de diseño físico, UWE y wireframes. |
| `SRC-04` | `docs/TABLES.md` | v1.0 (Vivo / SSOT) | Catálogo centralizado de tablas normativas (`TB-01` a `TB-14`). |
| `SRC-05` | `docs/DIAGRAMS.md` | v1.0 (Vivo / SSOT) | Catálogo centralizado de especificaciones PlantUML (114 diagramas). |
| `SRC-06` | `docs/DOCUMENTATION_RULES.md` | v1.0 (Aprobado) | Normativa de gobernanza documental y precedencia. |
| `SRC-07` | `docs/PROTOTYPE_SPECIFICATION.md` | v1.0 (Aprobado) | Matriz de navegación y arquitectura de la Fase 1 del prototipo. |
| `SRC-08` | `docs/adr/*.md` (10 archivos + README) | v1.0 (Aprobados) | Registros oficiales de decisión arquitectónica (`ADR-001` a `ADR-010`). |
| `SRC-09` | `docs/gcsw/auditorias/ACTA_AUDITORIA_01.md` | v0.1.0 (Borrador) | Acta de auditoría SCM (`AUD-GCSW-001`). |
| `SRC-10` | `docs/gcsw/diagnosticos/DIAGNOSTICO_INICIAL.md` | v0.1.0 | Diagnóstico de configuración inicial y 24 ECS. |
| `SRC-11` | `docs/refactor/*.md` (11 archivos) | v2.0 (Aprobados) | Informes de refactorización enterprise (PR #10). |
| `SRC-12` | `prototype/src/` (72 archivos de código) | v0.0.0 (Prototipo) | Implementación React SPA (servicios, componentes, stores, tests). |

---

## 4. Resultados de la Auditoría sobre el SRS (`FD03`)

El documento consolidado `docs/FD03-EPIS-Informe_SRS.md` (358 KB, 6,700+ líneas) fue evaluado exhaustivamente, identificándose los siguientes hallazgos:

### 4.1. Remanentes de Contexto Académico no Pertinentes
* **Ubicación:** `FD03-EPIS-Informe_SRS.md`, Sección 6.1, líneas 1070 a 1076.
* **Evidencia Textual:** En la sección descriptiva de perfiles de usuario se conserva un párrafo que hace alusión literal a un sistema de tutorías universitarias: *"...donde el mentoreado resuelve dudas temáticas, el mentor gestiona y dicta las clases acumulando horas, y la administración supervisa la calidad del servicio tutorial..."*.
* **Evaluación:** Aunque al final del documento (`FD03` línea 6682) se documentó una nota histórica indicando que esto fue "resuelto", el párrafo erróneo continúa presente en el cuerpo de la Sección 6.1.
* **Acción Requerida:** Eliminar de forma definitiva dicho párrafo en la corrección del SRS y reemplazarlo por la justificación de la segregación de funciones entre los 7 roles canónicos de TraceFlow SCM.

### 4.2. Duplicidad Literal entre Viabilidad Social y Ambiental
* **Ubicación:** `FD03-EPIS-Informe_SRS.md`, Sección 3.5, líneas 485 a 530.
* **Evidencia Textual:** Los 4 apartados de la Viabilidad Ambiental (Optimización de hardware, Huella de carbono digital, Cero papel y Trabajo remoto) replican exactamente palabra por palabra los 4 numerales de la Viabilidad Social. Cuenta incluso con un comentario HTML de advertencia previo: `<!-- PENDIENTE DE VALIDACION: La Viabilidad Ambiental duplica literalmente... -->`.
* **Acción Requerida:** Reescribir la Sección de Viabilidad Ambiental enfocándola en eficiencia energética de centros de datos, ciclo de vida del equipamiento de TI y computación verde.

### 4.3. Ruptura de Enlaces a Recursos Gráficos
* **Ubicación:** Secciones 2.1, 2.3, 2.4, 5.2, 5.3, 5.4.
* **Evidencia:** Tras el traslado del archivo a `docs/` en el commit `a2a6322`, 42 referencias a imágenes existentes (`assets/DG-01.png` a `assets/DG-13.png` y `assets/DG-SEQ-01.png` a `assets/DG-SEQ-28.png`) utilizan la ruta `assets/...` en lugar de `../assets/...`. Al renderizarse en navegadores o editores, la imagen no carga (error 404 local).
* **Acción Requerida:** Actualizar los 42 enlaces relativos hacia `../assets/...` o hacia la estructura consolidada de renderizado `assets/diagramas/render/`.

### 4.4. Ausencia Capitular de Casos de Uso Críticos (`CU-04.1`, `CU-29`, `CU-30`)
* **Evidencia:** En `FD03` Sección 6.1.3, las fichas descriptivas formales de casos de uso culminan en `CU-28` (Generación de Reportes). Los casos de uso `CU-04.1` (Subsanación), `CU-29` (Aceptación formal UAT) y `CU-30` (Aprobación delegada de cambio menor) solo aparecen citados tangencialmente en tablas de trazabilidad finales, pero carecen de sus fichas canónicas de especificación (actores, precondiciones, flujo principal, flujos alternativos, postcondiciones).

---

## 5. Resultados de la Auditoría sobre el SAD de Análisis (`FD04`)

El documento `docs/FD04-EPIS-Informe_SAD_Analisis.md` (120 KB, 1,300+ líneas, versión 1.1 congelada) presenta un estándar metodológico riguroso, destacando los siguientes aspectos:

### 5.1. Fortalezas y Cumplimiento Normativo
1. **Normalización de Bibliotecas SCM:** Estableció con éxito la división estricta en 3 bibliotecas: Trabajo (`LIB-WRK`), Soporte (`LIB-SUP`) y Maestra (`LIB-MST`), erradicando terminologías ambiguas.
2. **Ciclo de Vida de 14 Estados Oficiales:** En la Sección 7.2 delimitó con precisión los 14 estados canónicos de la RFC (`DG-11` y `TB-07`), con sus 4 estados terminales mutuamente excluyentes (Implementada, Rechazada Técnica, Rechazada Administrativa, Cancelada).
3. **Análisis de Objetos BCE:** Incorpora la descomposición conceptual de las 31 funciones del sistema mediante el patrón Boundary-Control-Entity.

### 5.2. Brechas Identificadas
1. **Incrustación de `@startuml` sin Enlace a Render:** Los diagramas `DG-SAD-A01` (§3.4) y `DG-SAD-A02` (§4.3) residen como código PlantUML dentro de bloques markdown sin disponer de archivos `.png` generados en disco ni de enlaces markdown estándar.
2. **Dictamen de `DG-13` no Propagado:** En §13.2 declaró formalmente la obsolescencia de `DG-13`, pero esta disposición técnica no fue trasladada ni coordinada con el SRS `FD03` ni con `docs/DIAGRAMS.md`.
3. **Enlaces a Fuentes Vecinas:** Varios enlaces internos utilizan el prefijo `docs/TABLES.md` o `docs/DIAGRAMS.md`, el cual resulta redundante y potencialmente inválido al encontrarse ya dentro del directorio `docs/`.

---

## 6. Resultados de la Auditoría sobre el SAD de Diseño (`FD05`)

El documento `docs/FD05-EPIS-Informe_SAD_Diseno.md` (300 KB, 3,200+ líneas, versión 0.4 borrador controlado) formaliza el diseño arquitectónico detallado:

### 6.1. Fortalezas Técnicas
1. **Modelado UWE Completo:** Formalizó 28 nodos navegacionales (`NAV-01` a `NAV-28`), 10 patrones de presentación (`PRES-01` a `PRES-10`) y el catálogo de 20 pantallas físicas (`SCREEN-01` a `SCREEN-20`).
2. **Especificación de Wireframes:** Define los requerimientos para los wireframes `WF-01` a `WF-20`, incluyendo variantes críticas como `WF-06A/B/C` (expediente según rol) y `WF-10` (doble llave delegada).
3. **Integración de Decisiones Arquitectónicas:** Incorpora armónicamente los principios de `ADR-001` a `ADR-010`.

### 6.2. Brechas Críticas Identificadas
1. **100% de Enlaces a Imágenes de Diseño Rotos:** Los 36 enlaces a diagramas de diseño (`DG-D01` a `DG-D06`, 9 secuencias técnicas `DG-DSEQ-*`, 8 de navegación `DG-UWE-NAV-*` y 13 de presentación `DG-UWE-PRES-*`) apuntan a `../assets/DG-*.png`. **Ninguno de estos 36 archivos existe en disco**.
2. **Contraste no Explicitado entre Target e Implementación Prototípica:** En §3, §4, §5 y §6 se documenta una arquitectura con servidores backend Node.js, pool de conexiones PostgreSQL 16 y almacenamiento de blobs en S3/MinIO. No existe una advertencia clara que explique que el prototipo React SPA en `prototype/` opera de forma autocontenida en el navegador para fines de validación funcional de interfaz y RBAC.

---

## 7. Conciliación Exhaustiva de Requisitos y Casos de Uso

A continuación se audita el alineamiento de los 18 Requerimientos Funcionales, sus entradas, salidas, reglas y casos de uso asociados:

| ID Requisito | Denominación Canónica | Actor Responsable | Entradas Principales | Salidas Principales | Reglas de Negocio | Casos de Uso | Evidencia en SAD | Estado de Implementación |
| :---: | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **`RF-01`** | Gestión de Usuarios y Roles | Administrador / Bibliotecario (`PU-05`) | Datos de identidad, rol asignado, estado | Cuenta creada, credencial, sesión | `RN-01`, `RN-03` | `CU-01` | `FD04` §4 / `FD05` §7 (ADR-005/006, `DG-D05`) | Implementado y verificado (client-side en `auth.service.ts`) |
| **`RF-02`** | Gestión de Proyectos | Analista / Gestor (`PU-02`) | Código proyecto, cliente, alcance, equipo | Proyecto inicializado, configuración activa | `RN-04` | `CU-02`, `CU-03` | `FD04` §4 (`MOD-PROJ`) / `FD05` §5 (`DG-D02`) | Simulado (`ScreenPlaceholder` en `/projects`, semilla en `initialProjects.ts`) |
| **`RF-03`** | Identificación de ECS | Arquitecto (`PU-03`) | Nombre ECS, tipo, ruta repositorio, versión | ECS registrado en catálogo, identificador | `RN-02`, `RN-04` | `CU-09` | `FD04` §4 (`MOD-ECS`) / `FD05` §5 (`DG-D02`, `DG-D03`) | Parcial (Selector de ECS operativo en wizard de creación de RFC) |
| **`RF-04`** | Registro y Subsanación de RFC | Solicitante (`PU-01`) | Título, descripción, justificación, ECS, prioridad | RFC registrada (estado 01) o Subsanada (estado 03) | `RN-01`, `RN-05` | `CU-04`, `CU-04.1` | `FD04` §7 (`DG-11`) / `FD05` §8 (`DG-DSEQ-04`, `WF-07`) | Totalmente implementado y verificado (`RfcCreateView`, `RfcEditView`, `rfc.service.ts`) |
| **`RF-05`** | Clasificación y Análisis de Impacto | Arquitecto (`PU-03`) | RFC admitida, evaluación técnica, triple restricción | Dictamen de impacto (Cambio Menor o Mayor) | `RN-05` | `CU-05`, `CU-06` | `FD04` §4 (`MOD-IMP`) / `FD05` §9 (`PRES-05`, `WF-08`) | Totalmente implementado y verificado (`RfcImpactAnalysisView.tsx`, `impactAnalysis.service.ts`) |
| **`RF-06`** | Deliberación y Aprobación en CCB | Miembros CCB (`PU-04`) | Expediente RFC Mayor, informe técnico | Acta de deliberación, votos, resolución formal | `RN-01`, `RN-07` | `CU-07` | `FD04` §4 (`MOD-CCB`) / `FD05` §10 (`PRES-06`, `WF-09`) | Totalmente implementado y verificado (`RfcCcbDeliberationView.tsx`, `ccb.service.ts`) |
| **`RF-07`** | Gestión y Emisión de Órdenes (ECN) | CCB (`PU-04`) / Gestor (`PU-02`) | Resolución aprobatoria de cambio | Orden de Cambio (ECN/ECO) formalizada | `RN-01`, `RN-03` | `CU-08`, `CU-22` | `FD04` §4 (`MOD-ECN`) / `FD05` §11 (`DG-DSEQ-08`, `WF-11`) | Lógica implementada en `rfc.service.ts`; interfaz en `ScreenPlaceholder` (`/ecns`) |
| **`RF-08`** | Gestión de 3 Bibliotecas SCM | Bibliotecario (`PU-05`) | Orden ECN, ECS a transferir | ECS movido entre Trabajo, Soporte y Maestra | `RN-04`, `RN-06` | `CU-10`, `CU-12` | `FD04` §4 / `FD05` §6 (ADR-004, `DG-D04`) | Diseñado conceptualmente; interfaz en `ScreenPlaceholder` (`/scm/operations`) |
| **`RF-09`** | Control de Versiones y Bloqueos | Bibliotecario (`PU-05`) | Petición Check-Out, identidad del desarrollador | Bloqueo activo (Lock), copia en Trabajo | `RN-02`, `RN-06` | `CU-11`, `CU-13`, `CU-14` | `FD04` §4 (`MOD-LOCK`) / `FD05` §12 (`DG-DSEQ-10`) | Diseñado; interfaces en `ScreenPlaceholder` (`/scm/operations`, `/ecs/:id/history`) |
| **`RF-10`** | Pruebas QA y Aceptación UAT | QA (`PU-07`) y Solicitante (`PU-01`) | Artefacto en Soporte, plan de pruebas | Certificación QA, Acta UAT suscrita | `RN-07`, `RN-09` | `CU-15`, `CU-16`, `CU-17`, `CU-29` | `FD04` §4 / `FD05` §14, §15 (`DG-DSEQ-17`, `DG-DSEQ-29`) | Lógica de estados modelada; interfaces en `ScreenPlaceholder` (`/qa/validation`, `/uat`) |
| **`RF-11`** | Reevaluación y Re-testeo QA | QA (`PU-07`) y Desarrollador (`PU-06`) | No conformidad reportada, corrección de código | Dictamen de re-test (aprobado o no conforme) | `RN-08` | `CU-18`, `CU-19` | `FD04` §4 (`MOD-QA`) / `FD05` §14 (`PRES-10`, `WF-15`) | Modelado en estados de RFC; interfaz en `ScreenPlaceholder` |
| **`RF-12`** | Rollback y Cancelación de Orden | Bibliotecario (`PU-05`) | Orden no subsanable, fallo de pruebas | Rollback en Trabajo, ECN cancelada (terminal) | `RN-07`, `RN-08` | `CU-21`, `CU-22` | `FD04` §4 (`MOD-ROLL`) / `FD05` §16 (`DG-DSEQ-21`) | Lógica de cancelación implementada en `rfc.service.ts`; UI en `ScreenPlaceholder` |
| **`RF-13`** | Gestión de Líneas Base | Bibliotecario (`PU-05`) | ECS verificado con doble conformidad (QA+UAT) | Línea base congelada, versión SemVer | `RN-02`, `RN-04` | `CU-20` | `FD04` §4 (`MOD-BASE`) / `FD05` §16 (`DG-DSEQ-20`) | Modelado de datos en `initialBaselines.ts`; UI en `ScreenPlaceholder` (`/baselines`) |
| **`RF-14`** | Cierre Formal y Notificaciones | CCB (`PU-04`) / Administrador (`PU-05`) | Estado final del expediente RFC | Cierre formal en 1 de 4 estados terminales | `RN-07` | `CU-07`, `CU-20`, `CU-22`, `CU-30` | `FD04` §7 (`DG-11`) / `FD05` §17 (ADR-008) | Totalmente implementado y verificado en `rfc.service.ts` y expediente 360° |
| **`RF-15`** | Gestión de Incidencias y Soporte | Solicitante (`PU-01`) / Gestor (`PU-02`) | Descripción de falla, sistema afectado | Incidencia registrada o derivada a RFC | *Sin RN propia* | `CU-23`, `CU-24`, `CU-25` | `FD04` §4 (`MOD-INC`) / `FD05` §18 (`PRES-03`, `WF-18`) | Simulado con datos demo en `initialIncidents.ts`; UI en `ScreenPlaceholder` |
| **`RF-16`** | Trazabilidad de Configuración | Todos los Actores Técnicos | Consulta de RFC, ECS o ECN | Matriz de relaciones históricas completas | `RN-03` | `CU-13`, `CU-26` | `FD04` §12 (`TB-14`) / `FD05` §17 (ADR-008) | Totalmente implementado y verificado en `RfcDetailView.tsx` (Expediente 360°) |
| **`RF-17`** | Auditoría e Integridad SHA-256 | Administrador (`PU-05`) / CCB (`PU-04`) | Registros de transacciones y artefactos | Log inmutable de auditoría, verificación hash | `RN-03` | `CU-27` | `FD04` §4 (`MOD-AUD`) / `FD05` §17 (ADR-008, `WF-19`) | Servicio implementado en `audit.service.ts`, hash SHA-256 en sesión; UI en placeholder |
| **`RF-18`** | Generación de Reportes | Administrador (`PU-05`) / Gestor (`PU-02`) | Criterios de filtrado temporal, proyecto | Reporte operativo y de estado exportable | *Sin RN propia* | `CU-28` | `FD04` §4 (`MOD-REP`) / `FD05` §17 (`WF-19`) | Parcialmente implementado en métricas de `DashboardView.tsx`; exportación simulada |
| **`RF-Ext`**| Autorización Delegada de Cambio Menor | Gestor (`PU-02`) Y Arquitecto (`PU-03`) | Dictamen técnico de Cambio Menor | Autorización doble llave suscrita (estado 08) | `RN-01`, `RN-05` | `CU-30` | `FD04` §3.4 / `FD05` §10.2 (`DG-DSEQ-30`, `WF-10`) | Totalmente implementado y verificado (`RfcMinorApprovalView.tsx`, `minorApproval.service.ts`) |

---

## 8. Matriz de Roles, Responsabilidades y Permisos (RBAC y SoD)

Se contrastan los 7 roles canónicos definidos en el sistema:

| Rol Canónico | Responsabilidad Metodológica | Casos de Uso Gobernados | Permisos Documentados (SAD §20) | Permisos Implementados en Prototipo | Diferencia / Brecha de Seguridad |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **`PU-01`<br>Solicitante** | Registra solicitudes, subsana observaciones y firma la aceptación final UAT. | `CU-04`, `CU-04.1`, `CU-23`, `CU-29` | Registro de RFCs, edición de RFCs propias observadas, registro de incidencias, suscripción de UAT. | Restringido en `RouteGuard` y `ACTION_PERMISSIONS`. No puede acceder a deliberación CCB ni análisis técnico. | Totalmente alineado en lógica frontend. Validación de ownership en `rfc.service.ts`. |
| **`PU-02`<br>Gestor SCM** | Revisa completitud, clasifica solicitudes, administra proyectos y autoriza Cambios Menores. | `CU-02`, `CU-03`, `CU-05`, `CU-08`, `CU-24`, `CU-25`, `CU-30` | Admisión de RFCs, emisión de ECN delegada, gestión de proyectos, firma 1 de Cambio Menor. | Habilitado en `/rfcs/:id/minor-approval`. No puede firmar como Arquitecto ni votar en el CCB. | Totalmente alineado. Cumple segregación de funciones (SoD). |
| **`PU-03`<br>Arquitecto** | Realiza el análisis de impacto técnico y evalúa la afectación de la Triple Restricción. | `CU-06`, `CU-09`, `CU-30` | Elaboración de informe de impacto, catalogación de ECS, firma técnica 2 de Cambio Menor. | Exclusivo en `/rfcs/:id/impact-analysis`. Participa en doble llave de cambio menor. | Totalmente alineado. Bloqueado de emitir aprobación administrativa. |
| **`PU-04`<br>Comité CCB** | Órgano colegiado. Delibera, vota y emite resolución sobre Cambios Mayores. | `CU-07`, `CU-08`, `CU-27` | Quórum, deliberación, votación colegiada, emisión formal de ECN por resolución. | Exclusivo en `/rfcs/:id/ccb-deliberation`. Quórum validado en `ccb.service.ts`. | Totalmente alineado. Controla votación mayoritaria y generación de acta. |
| **`PU-05`<br>Bibliotecario / Admin** | Custodio de bibliotecas SCM. Ejecuta Check-Out/In, bloqueos, Líneas Base y Rollbacks. | `CU-01`, `CU-10`, `CU-11`, `CU-12`, `CU-13`, `CU-20`, `CU-21`, `CU-27`, `CU-28` | Operaciones de bibliotecas SCM, congelamiento de baselines, rollback, gestión de usuarios. | Asignado como ejecutor autorizado en rutas de SCM y Baselines. | En prototipo, las consolas de operaciones están en `ScreenPlaceholder`. |
| **`PU-06`<br>Desarrollador** | Implementa cambios en la Biblioteca de Trabajo y ejecuta pruebas unitarias locales. | `CU-14`, `CU-15` | Acceso a ítems en Biblioteca de Trabajo asignados con bloqueo activo. | Rol contemplado en semillas; vistas operativas de desarrollo en `ScreenPlaceholder`. | Al no existir backend de código real, el rol interactúa solo como observador. |
| **`PU-07`<br>Equipo de Calidad (QA)**| Ejecuta pruebas de integración en Soporte y emite Certificación de Conformidad. | `CU-16`, `CU-17`, `CU-18`, `CU-19` | Validación técnica, registro de defectos/no conformidades, certificación técnica. | Ruta `/qa/validation/:rfcId` protegida para PU-07 en `RouteGuard`. | Interfaz operativa implementada mediante `ScreenPlaceholder`. |

> **Nota sobre Seguridad Frontend vs Backend:**  
> La auditoría confirma que las reglas de Segregación de Funciones (SoD) y el control de acceso basado en roles (RBAC) están desacoplados de los componentes visuales mediante `ACTION_PERMISSIONS` y `ROUTE_PERMISSIONS` en `prototype/src/types/permissions.ts`. Sin embargo, al residir toda la ejecución en el cliente, estos controles constituyen **seguridad de presentación y lógica de negocio en memoria**. Para un entorno de producción, deberán replicarse obligatoriamente en los controladores de la API REST del backend.

---

## 9. Verificación de Rutas, Pantallas y Componentes del Prototipo

Se auditan de forma unívoca las 20 pantallas canónicas especificadas en el SAD de Diseño (`FD05` §20 y §21):

| Pantalla Canónica | Ruta React | Componente Implementado | Rol Autorizado | Casos de Uso Gobernados | Estado de Verificación | Evidencia en Código Fuente |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **`SCREEN-01`** | `/login` | `LoginView.tsx` | Todos (Público) | Autenticación IAM | **Implementado y verificado** | Selección de cuenta demo, login y switch de roles institucionales. |
| **`SCREEN-02`** | `/dashboard` | `DashboardView.tsx` | Todos (`PU-01..07`) | Resumen operativo | **Implementado y verificado** | Tableros contextuales diferenciados por rol, métricas y accesos directos. |
| **`SCREEN-03`** | `/projects` | `ScreenPlaceholder.tsx` | `PU-02, 03, 04, 05` | `CU-02` | **Placeholder** | Maqueta estructurada con metadatos de `ROUTES_METADATA['/projects']`. |
| **`SCREEN-04`** | `/projects/:projectId` | `ScreenPlaceholder.tsx` | `PU-02, 03, 04, 05` | `CU-02, CU-03` | **Placeholder** | Maqueta guiada vinculada con navegación hacia `/projects`. |
| **`SCREEN-05`** | `/rfcs` | `RfcListView.tsx` | Todos (`PU-01..07`) | `CU-04..08, CU-30` | **Implementado y verificado** | Bandeja completa con filtros por estado, prioridad, tipo y búsqueda. |
| **`SCREEN-06`** | `/rfcs/:rfcId` | `RfcDetailView.tsx` | Todos (`PU-01..07`) | `CU-04..08, CU-30` | **Implementado y verificado** | Expediente 360° con trazabilidad, historial de eventos y acciones contextuales. |
| **`SCREEN-07`** | `/rfcs/new`<br>`/rfcs/:rfcId/edit` | `RfcCreateView.tsx`<br>`RfcEditView.tsx` | Solicitante (`PU-01`) | `CU-04`<br>`CU-04.1` | **Implementado y verificado** | Wizard de captura en 3 pasos y formulario de subsanación de observaciones. |
| **`SCREEN-08`** | `/rfcs/:rfcId/impact-analysis` | `RfcImpactAnalysisView.tsx`| Arquitecto (`PU-03`) | `CU-06` | **Implementado y verificado** | Consola de evaluación técnica de impacto y dictamen Menor/Mayor. |
| **`SCREEN-09`** | `/rfcs/:rfcId/ccb-deliberation`| `RfcCcbDeliberationView.tsx`| CCB (`PU-04`) | `CU-07` | **Implementado y verificado** | Sala de deliberación, registro de quórum, votación individual y acta formal. |
| **`SCREEN-10`** | `/rfcs/:rfcId/minor-approval` | `RfcMinorApprovalView.tsx` | Gestor (`PU-02`) y Arquitecto (`PU-03`) | `CU-30` | **Implementado y verificado** | Consola de doble llave compartida con validación SoD independiente. |
| **`SCREEN-11`** | `/ecns`<br>`/ecns/:ecnId` | `ScreenPlaceholder.tsx` | `PU-02, 04, 05, 06, 07` | `CU-08, CU-22` | **Placeholder** | Maqueta guiada con datos demo de órdenes de cambio. |
| **`SCREEN-12`** | `/ecs`<br>`/ecs/:ecsId` | `ScreenPlaceholder.tsx` | `PU-03, 05, 06, 07` | `CU-09, CU-14, CU-26` | **Placeholder** | Maqueta del explorador de elementos de configuración y bibliotecas. |
| **`SCREEN-13`** | `/scm/operations` | `ScreenPlaceholder.tsx` | Bibliotecario (`PU-05`) | `CU-10, CU-11, CU-12` | **Placeholder** | Maqueta de consola para operaciones Check-Out y Check-In. |
| **`SCREEN-14`** | `/ecs/:ecsId/history` | `ScreenPlaceholder.tsx` | `PU-03, 05, 06, 07` | `CU-13` | **Placeholder** | Maqueta de visor de versiones y comparador diff. |
| **`SCREEN-15`** | `/qa/validation/:rfcId` | `ScreenPlaceholder.tsx` | Calidad (`PU-07`) | `CU-16, 17, 18, 19` | **Placeholder** | Maqueta de validación técnica y registro de no conformidades. |
| **`SCREEN-16`** | `/rfcs/:rfcId/uat` | `ScreenPlaceholder.tsx` | Solicitante (`PU-01`) | `CU-29` | **Placeholder** | Maqueta de suscripción de acta de aceptación final de usuario. |
| **`SCREEN-17`** | `/baselines` | `ScreenPlaceholder.tsx` | Bibliotecario (`PU-05`) | `CU-20, CU-21` | **Placeholder** | Maqueta de gestión de líneas base y rollback en Trabajo. |
| **`SCREEN-18`** | `/incidents`<br>`/incidents/:id` | `ScreenPlaceholder.tsx` | `PU-01, PU-02` | `CU-23, CU-24, CU-25` | **Placeholder** | Maqueta de mesa de entrada de incidencias y derivación a RFC. |
| **`SCREEN-19`** | `/audit`<br>`/reports` | `ScreenPlaceholder.tsx` | `PU-02, PU-04, PU-05` | `CU-27, CU-28` | **Placeholder** | Maqueta de auditoría inmutable SHA-256 y reportes de gestión. |
| **`SCREEN-20`** | `/admin/users` | `ScreenPlaceholder.tsx` | Bibliotecario / Admin (`PU-05`) | `CU-01` | **Placeholder** | Maqueta de administración de cuentas de usuario y asignación de roles. |

### Vistas Transversales Adicionales:
* `/access-denied` -> `AccessDeniedView.tsx` (Implementado y verificado — Manejo de accesos denegados por RoleGuard).
* `*` -> `NotFoundView.tsx` (Implementado y verificado — Pantalla de error 404).

---

## 10. Inventario Consolidado y Conciliación Definitiva de Diagramas

### 10.1. Aclaración del Recuento de Diagramas Faltantes (70 vs 72 vs 69)
La auditoría determinó de forma concluyente el origen del recuento:
1. **70 Archivos `.png` Únicos Referenciados e Inexistentes en Disco:**
   - 31 Diagramas de Análisis de Objetos BCE: `DG-AO-01.png` a `DG-AO-30.png` y `DG-AO-04.1.png`.
   - 3 Diagramas de Secuencia de Análisis: `DG-SEQ-04.1.png`, `DG-SEQ-29.png`, `DG-SEQ-30.png`.
   - 6 Diagramas de Arquitectura de Diseño: `DG-D01.png` a `DG-D06.png`.
   - 9 Diagramas de Secuencia de Diseño: `DG-DSEQ-04.png`, `08`, `10`, `12`, `17`, `20`, `21`, `29`, `30`.
   - 8 Diagramas de Navegación UWE: `DG-UWE-NAV-01.png` a `DG-UWE-NAV-08.png`.
   - 13 Diagramas de Presentación UWE: `DG-UWE-PRES-01.png` a `DG-UWE-PRES-13.png`.
   *(Suma exacta: 31 + 3 + 6 + 9 + 8 + 13 = 70 archivos .png únicos referenciados por `![]()` que arrojan error 404).*
2. **2 Modelos PlantUML Incrustados sin Imagen:**
   - `DG-SAD-A01` (Contexto de Análisis en `FD04` §3.4).
   - `DG-SAD-A02` (Arquitectura Lógica en `FD04` §4.3).
   *(Ambos están en código `@startuml` dentro de `FD04`, pero no tienen ni archivo `.png` en disco ni enlace markdown).*
3. **Total de Diagramas Pendientes de Render:** $70 + 2 = \mathbf{72\text{ diagramas}}$. La referencia a "69" en el informe preliminar fue una errata aritmética en la redacción inicial del resumen.

### 10.2. Situación de `DG-13` frente a `DG-SAD-A01`, `DG-SAD-A02` y `DG-12`
- **Diagnóstico:** El diagrama `DG-13` ("Modelo Lógico de la Arquitectura TraceFlow SCM") fue emitido originalmente en la Sección 6.2 del SRS (pág. 95 del PDF original). Presenta componentes de implementación física (React SPA, API REST Node.js, controladores técnicos, PostgreSQL, Redis, MinIO/S3).
- **Dictamen del SAD de Análisis (`FD04` §13.2):** Se dictaminó formalmente que `DG-13` es **OBSOLETO PARA EL ANÁLISIS**, disponiendo que la arquitectura lógica conceptual queda suficientemente cubierta por:
  - `DG-SAD-A01`: Contexto Arquitectónico de TraceFlow SCM.
  - `DG-SAD-A02`: Paquetes Arquitecturales y Relaciones Lógicas (9 módulos).
  - `DG-12`: Modelo Conceptual del Dominio TraceFlow SCM.
- **Acción Pendiente:** Marcar explícitamente `DG-13` en `FD03-EPIS-Informe_SRS.md`, `docs/TABLES.md` y `docs/DIAGRAMS.md` con la etiqueta `OBSOLETO PARA ANÁLISIS — Reemplazado por DG-SAD-A01/A02 y DG-12; archivado como insumo de diseño`.

---

## 11. Auditoría de Versiones, Estados y Líneas Base

Se evalúa la condición documental de los artefactos del proyecto:

| Documento | Versión Declarada | Fecha | Estado Formal Actual | Categoría de Línea Base | Necesidad de Revisión Controlada |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `FD01-EPIS-Informe_Factibilidad_v2.md` | 2.0 | Septiembre 2026 | Aprobado | Línea Base de Factibilidad | Ninguna; documento cerrado y consistente. |
| `FD03-EPIS-Informe_SRS.md` | 1.0 | 16/09/2026 | Aprobado (Congelado) | Línea Base de Requisitos (SRS) | **Alta**: Requiere emitir la versión `1.1` de trabajo para subsanar enlaces rotos, erratas y agregar CU-04.1/29/30. |
| `FD04-EPIS-Informe_SAD_Analisis.md` | 1.1 | 01/10/2026 | Aprobado (Congelado) | Baseline SAD de Análisis | **Baja**: Requiere revisión menor para enlazar renders de `DG-SAD-A01/A02` y ajustar rutas internas. |
| `FD05-EPIS-Informe_SAD_Diseno.md` | 0.4 | 01/10/2026 | Borrador Controlado | Candidata a Baseline de Diseño | **Alta**: Requiere formalizar versión `1.0` tras incorporar los 36 renders de imágenes y delimitar el prototipo SPA. |
| `docs/TABLES.md` | 1.0 | Vivo (Oct 2026) | SSOT Activo | Fuente Centralizada de Tablas | **Media**: Actualizar `TB-01` y normalizar inconsistencias de autoridad de reglas. |
| `docs/DIAGRAMS.md` | 1.0 | Vivo (Oct 2026) | SSOT Activo | Fuente Centralizada de Modelado | **Alta**: Modularizar las fuentes `@startuml` a archivos `.puml` desacoplados. |
| `prototype/` | 0.0.0 | Noviembre 2026 | Prototipo Demostrativo | Línea Base de Demostración | **Media**: Sincronizar su documentación con las 8 pantallas activas y 12 simuladas. |

---

## 12. Matriz de Discrepancias Priorizadas

Se consolidan las discrepancias detectadas clasificadas por severidad técnica:

| ID | Categoría | Documento Afectado | Descripción de la Discrepancia | Impacto Técnico | Prioridad |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **`DISC-01`** | Recursos Gráficos | `FD05` (§3..§20) | 36 enlaces a imágenes de diseño apuntan a archivos inexistentes en disco. | Ruptura visual completa en la lectura del SAD de Diseño. | **Alta** |
| **`DISC-02`** | Recursos Gráficos | `FD03` (§5.3, §5.4) | 34 enlaces a diagramas (31 BCE y 3 secuencias) apuntan a archivos inexistentes. | Incapacidad de consultar el análisis dinámico de objetos en el SRS. | **Alta** |
| **`DISC-03`** | Integridad de Enlaces | `FD03` (General) | 42 enlaces a imágenes existentes utilizan ruta relativa rota `assets/...` en vez de `../assets/...`. | Los visores Markdown de GitHub no cargan los diagramas aprobados. | **Alta** |
| **`DISC-04`** | Alcance Funcional | `FD03` (§6.1.3) | Omisión de fichas narrativas completas para `CU-04.1`, `CU-29` y `CU-30`. | Asimetría documental frente a `TABLES.md`, `FD04`, `FD05` y el prototipo. | **Alta** |
| **`DISC-05`** | Modularidad de Modelado | `DIAGRAMS.md` | 114 diagramas no cuentan con archivos `.puml` individuales en disco. | Imposibilidad de compilación automatizada y renderizado desacoplado. | **Alta** |
| **`DISC-06`** | Delimitación Arquitectónica | `FD05` (§1.3, §3) | Ausencia de cláusula aclaratoria sobre el prototipo React SPA frente al backend objetivo. | Riesgo de falsa expectativa sobre persistencia en servidor y base de datos. | **Media** |
| **`DISC-07`** | Calidad Editorial | `FD03` (§6.1) | Párrafo remanente sobre tutorías universitarias y mentores en perfiles de usuario. | Afectación severa del rigor formal y coherencia del documento. | **Media** |
| **`DISC-08`** | Calidad Editorial | `FD03` (§3.5) | Duplicidad literal idéntica entre Viabilidad Social y Viabilidad Ambiental. | Redundancia no justificada en el estudio de factibilidad del SRS. | **Media** |
| **`DISC-09`** | Trazabilidad Metodológica | `FD03` (§5.2) / `DIAGRAMS` | Diagrama `DG-13` figura como activo sin advertencia del dictamen de obsolescencia. | Confusión sobre cuál es la arquitectura lógica oficial de análisis. | **Media** |
| **`DISC-10`** | Atribución Normativa | `FD03` (§5.3) / `TABLES` | Regla `RN-03` asignada exclusivamente al Analista omitiendo al Administrador SCM. | Atribución incompleta en el control del Check-In a bibliotecas. | **Baja** |
| **`DISC-11`** | Rutas Internas Markdown | `FD04`, `FD05`, `RULES` | Enlaces internos hacia `docs/TABLES.md` o `docs/DIAGRAMS.md` con prefijo redundante. | Fragilidad de navegación relativa entre documentos hermanos en `docs/`. | **Baja** |

---

## 13. Plan de Correcciones para el SRS (`FD03`)

Para la futura intervención sobre `docs/FD03-EPIS-Informe_SRS.md`, se proyectan las siguientes acciones ordenadas:
1. **Actualización de Metadatos y Control de Versiones:**
   - Aperturar la versión de trabajo `1.1` (Fecha: Noviembre 2026), registrando la subsanación integral de erratas y alineación con las Baselines de Arquitectura y Auditorías GCSW.
2. **Saneamiento Editorial y de Viabilidad:**
   - Reemplazar el párrafo de tutorías universitarias de la Sección 6.1 por la fundamentación técnica de segregación de funciones (SoD) de los 7 roles canónicos (`PU-01` a `PU-07`).
   - Redactar de forma diferenciada la Viabilidad Ambiental en §3.5 enfocándose en métricas de consumo energético de servidores e infraestructura digital.
3. **Normalización de Enlaces Relativos a Imágenes:**
   - Ajustar de forma masiva los 42 enlaces de `assets/DG-*.png` hacia la ruta relativa válida (`../assets/DG-*.png` o a `assets/diagramas/render/`).
4. **Incorporación de Especificaciones de Casos de Uso Faltantes:**
   - Redactar bajo la plantilla estándar las fichas completas de `CU-04.1` (Subsanación de RFC observada), `CU-29` (Validación de aceptación UAT) y `CU-30` (Autorización delegada de cambio menor por doble llave).
5. **Alineación de Denominaciones de RNF y Reglas de Negocio:**
   - Normalizar la redacción de `RNF-01` a `RNF-09` y precisar la autoridad compartida de `RN-03` (Analista + Bibliotecario).
   - Incorporar nota formal en §5.2 señalando la obsolescencia técnica de `DG-13` para la fase de análisis conforme a `FD04` §13.2.

---

## 14. Plan de Correcciones para los SAD (`FD04` y `FD05`)

### 14.1. Acciones sobre el SAD de Análisis (`FD04`)
1. **Extracción y Enlace de Renders Conceptuales:**
   - Extraer las fuentes PlantUML de `DG-SAD-A01` (§3.4) y `DG-SAD-A02` (§4.3).
   - Renderizar sus archivos `.png` e incorporar los enlaces estándar correspondientes en el cuerpo del documento.
2. **Limpieza de Rutas Relativas:**
   - Corregir los enlaces internos hacia `TABLES.md` y `DIAGRAMS.md` eliminando el prefijo redundante `docs/`.

### 14.2. Acciones sobre el SAD de Diseño (`FD05`)
1. **Declaración Explícita sobre la Arquitectura del Prototipo:**
   - Incorporar en la Sección 1.3 y Sección 3 una cláusula que formalice que el componente `prototype/` constituye una **Línea Base Demostrativa de Interfaz y Validación Funcional en Cliente (SPA React 19)**, cuyas decisiones de persistencia local y mock sessions anticipan y validan las reglas de negocio de la arquitectura física de producción objetivo (Node.js + PostgreSQL + S3).
2. **Subsanación de Enlaces de Recursos Gráficos:**
   - Enlazar los 36 diagramas de diseño (`DG-D*`, `DG-DSEQ-*`, `DG-UWE-*`) hacia los archivos renderizados que se generarán en la etapa gráfica.
3. **Elevación de Versión:**
   - Una vez integrados los diagramas y verificados los enlaces, tramitar la elevación del documento desde *Borrador Controlado v0.4* hacia **Baseline de SAD de Diseño v1.0**.

---

## 15. Riesgos y Decisiones que Requieren Aprobación

Se elevan a consideración del Comité y del docente asesor los siguientes puntos:

1. **Aprobación de la Emisión v1.1 del SRS (`FD03`):**
   - *Decisión:* Autorizar formalmente la apertura del control de versiones del SRS para publicar la versión `1.1` subsanada, manteniendo el congelamiento de la versión histórica `1.0`.
2. **Estructura Definitiva de Recursos Gráficos:**
   - *Decisión:* Aprobar la creación del subdirectorio centralizado `docs/assets/diagramas/` (con ramas `plantuml/` y `render/`) y `docs/assets/capturas/` para albergar de forma modular todas las fuentes y renders del proyecto, desaconsejando almacenar nuevos recursos en la raíz `/assets/`.
3. **Formalización del Alcance del Prototipo:**
   - *Decisión:* Convalidar formalmente que las 12 pantallas maquetadas mediante `ScreenPlaceholder` satisfacen los requerimientos de la entrega académica de configuración de software para la presente fase, priorizando la completitud interactiva del flujo troncal de cambios (`SCREEN-01`, `02`, `05`, `06`, `07`, `08`, `09`, `10`).

---

## 16. Criterios de Aceptación para la Próxima Etapa (Etapa 03)

Para dar inicio y declarar conforme la **Etapa 03: Corrección y Emisión del SRS (`FD03`)**, deberán satisfacerse los siguientes criterios:
1. Contar con la aprobación de este informe de auditoría (`INF-AUD-SRS-SAD-002`).
2. Mantener la rama `docs/alineacion-srs-sad-2026-11-12` como espacio exclusivo de trabajo.
3. Asegurar que las modificaciones sobre `docs/FD03-EPIS-Informe_SRS.md` no alteren ni eliminen requerimientos aprobados, limitándose a subsanar erratas, corregir rutas relativas e incorporar las fichas canónicas de `CU-04.1`, `CU-29` y `CU-30`.
4. Verificar que todas las tablas resultantes en el SRS concuerden 100% con `docs/TABLES.md`.

---

## 17. Conclusiones

La auditoría técnica realizada en esta Etapa 02 confirma que **TraceFlow SCM cuenta con una base metodológica y conceptual sólida y coherente**. Las divergencias encontradas corresponden primordialmente a:
- Efectos colaterales de la reorganización física de archivos hacia `docs/` en commits previos.
- Crecimiento evolutivo natural del modelo de diseño (UWE, 20 pantallas, nuevos casos de uso) que no fue retroalimentado hacia la versión congelada del SRS.
- Déficit de renderizado y desacoplamiento físico de archivos PlantUML.

La hoja de ruta planteada garantiza que la regularización documental se ejecute con estricto apego a las normas de configuración de software (IEEE 828), asegurando la total auditabilidad y trazabilidad bidireccional del proyecto.

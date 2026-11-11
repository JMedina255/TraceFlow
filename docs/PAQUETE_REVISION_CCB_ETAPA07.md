# PAQUETE FORMAL DE REVISIÓN DOCUMENTAL PARA EL COMITÉ DE CONTROL DE CAMBIOS (CCB)
## Proyecto: TraceFlow SCM — Sistema de Gestión de Configuración de Software

> **Código de Expediente CCB:** `PAQ-CCB-ETAPA07-20261112` (Revisión Corregida v1.0.1 tras Etapa 07-R)
> **Organización Solicitante:** C-SharkTeam (Medina Quispe, Antayhua Mamani, Loyola Vilca Choque, Rivera Muñoz)
> **Organización Cliente / Propietaria:** ÉXODO S.A.C.
> **Fecha de Emisión del Paquete:** 12 de Noviembre de 2026
> **Rama Documental Sometida:** `docs/alineacion-srs-sad-2026-11-12`
> **Commit Base de Referencia:** `f2d2e873c4dc746bfdf3d0d8bfde51b41f82a94f` (`f2d2e87`)
> **Estado del Trámite:** **EXPEDIENTE PREPARADO Y LISTO PARA DELIBERACIÓN FORMAL DEL CCB (PENDIENTE DE DICTAMEN)**
> **Clasificación:** Confidencial / Gestión de Configuración de Software (IEEE 828-2012)

---

```
========================================================================================
                      UNIVERSIDAD PRIVADA DE TACNA
                         FACULTAD DE INGENIERÍA
              ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS

                  COMITÉ DE CONTROL DE CAMBIOS (CCB)
         EXPEDIENTE TÉCNICO DE SOLICITUD DE APROBACIÓN DE LÍNEA BASE
                     ETAPA 07 — ALINEACIÓN INTEGRAL

    Proyecto: Sistema de Gestión de Configuración de Software - TraceFlow SCM
    Solicitantes: C-SharkTeam (Equipo de Ingeniería de Requisitos y Arquitectura)
    Destinatario: Comité de Control de Cambios (CCB) y Dirección Técnica de ÉXODO S.A.C.
    Normas de Conformidad: IEEE 828-2012, ISO/IEC/IEEE 12207:2017, ISO/IEC/IEEE 29148

                                TACNA — PERÚ
                                    2026
========================================================================================
```

---

## 1. Documentos Sometidos a Revisión del CCB

El presente paquete consolida las tres revisiones candidatas resultantes del proceso de auditoría y saneamiento técnico desarrollado a lo largo de las Etapas 01 a 07:

1. **`docs/FD03-EPIS-Informe_SRS.md`**: Especificación de Requerimientos de Software — **Revisión Candidata v1.1** (Borrador).
2. **`docs/FD04-EPIS-Informe_SAD_Analisis.md`**: Documento de Arquitectura de Software (Fase de Análisis) — **Revisión Candidata v1.2** (Borrador).
3. **`docs/FD05-EPIS-Informe_SAD_Diseno.md`**: Documento de Arquitectura de Software (Fase de Diseño) — **Revisión Candidata v0.5** (Borrador).
4. **`docs/MAESTRO_CAMBIOS_SRS_SAD.md`**: Archivo Maestro de Control de Cambios Documentales — **Revisión de Trabajo v0.7.1** (Borrador de Trabajo).
5. **`docs/ADENDA_AUDITORIA_ETAPA07R.md`**: Adenda Técnica de Auditoría Correctiva — **Versión v1.0.0** (Instrumento Aclaratorio).

---

## 2. Metadatos de las Revisiones Candidatas

| Documento | Versión Histórica Aprobada | Versión Candidata Sometida | Estado Documental Actual | Responsables Técnicos |
|---|:---:|:---:|---|---|
| **SRS (`FD03`)** | v1.0 (16/09/2026) | **v1.1** | Borrador en Revisión CCB | J. Medina, R. Antayhua, R. Loyola, A. Rivera |
| **SAD Análisis (`FD04`)** | v1.0 (16/09/2026) | **v1.2** | Borrador en Revisión CCB | J. Medina, R. Antayhua, R. Loyola, A. Rivera |
| **SAD Diseño (`FD05`)** | v0.4 (01/10/2026) | **v0.5** | Borrador en Revisión CCB | J. Medina, R. Antayhua, R. Loyola, A. Rivera |
| **Maestro de Cambios** | v0.1.0 (12/11/2026) | **v0.7.1** | Instrumento de Trazabilidad (Etapa 07-R) | C-SharkTeam |
| **Adenda Correctiva** | N/A (Nueva) | **v1.0.0** | Instrumento Aclaratorio y Precisión | C-SharkTeam |

> [!IMPORTANT]
> **Declaración de No Aprobación Prematura**: Las revisiones candidatas v1.1, v1.2 y v0.5 **NO constituyen una nueva línea base oficial aprobada** hasta que el Comité de Control de Cambios (CCB) emita la resolución formal y suscriba el acta de aprobación correspondiente.

---

## 3. Commit y Rama Documental de Publicación

- **Repositorio Oficial:** `https://github.com/JMedina255/TraceFlow`
- **Rama Documental Exclusiva:** `docs/alineacion-srs-sad-2026-11-12`
- **Commit Base de Sincronización:** `6ff6d7e8912be90807c8911ba25584fb77037370` (`6ff6d7e`)
- **Compromiso de No Mezcla en Master:** Ningún cambio será fusionado en la rama `master` sin la autorización expresa y escrita del CCB.

---

## 4. Resumen Consolidado de Modificaciones (Etapas 01 a 07)

A lo largo del proceso de alineación se ejecutaron las siguientes intervenciones estructuradas:

1. **Etapa 01 (Diagnóstico Inicial):** Verificación limpia de la línea base `6ff6d7e`, inventario preliminar de brechas y creación de `docs/MAESTRO_CAMBIOS_SRS_SAD.md` (v0.1.0).
2. **Etapa 02 (Auditoría Detallada):** Cuantificación matemática de pantallas (8 interactivas funcionales + 12 placeholders = 20 canónicas), diagnóstico de 72 diagramas pendientes de render y emisión de `INF-AUD-SRS-SAD-002` (Maestro v0.2.0).
3. **Etapa 03 (Consolidación SRS v1.1):** Actualización de `FD03-EPIS-Informe_SRS.md`, formalización de `CU-04.1`, `CU-29`, `CU-30`, advertencia de obsolescencia de `DG-13` (DOC-006/025), redacción técnica de Viabilidad Ambiental y emisión de `INF-CIERRE-SRS-ETAPA03` (Commit `a45eb25`, Maestro v0.3.0).
4. **Etapa 04 (Alineación SAD Análisis v1.2):** Actualización de `FD04-EPIS-Informe_SAD_Analisis.md`, formalización de la delimitación tripartita de arquitectura (§1.6), catálogo conceptual BCE de 31 casos de uso, matriz de 14 estados RFC (§7.2), resolución de enlaces rotos a `TABLES.md` / `DIAGRAMS.md` (DOC-008, DOC-026) y emisión de `INF-CIERRE-SAD-ANALISIS-ETAPA04` (Commit `012c267`, Maestro v0.4.0).
5. **Etapa 05 (Alineación SAD Diseño v0.5):** Actualización de `FD05-EPIS-Informe_SAD_Diseno.md`, conciliación de ADR-001 a ADR-010 (sesión opaca en PostgreSQL/HttpOnly vs Keycloak diferido en ADR-006), tratamiento de 36 diagramas de diseño pendientes, formalización de la matriz canónica de 20 pantallas físicas (§20.5), acotamiento de parámetros RNF como metas de diseño y emisión de `INF-CIERRE-SAD-DISENO-ETAPA05` (Commit `c7ed0b8`, Maestro v0.5.0).
6. **Etapa 06 (Formalización Gráfica y Prototipo):** Extracción de 114 fuentes `.puml` organizadas en 4 categorías, renderizado determinístico de 228 artefactos gráficos (114 SVG + 114 PNG), generación de 17 capturas reales del prototipo React (1440x900) con inyección de sesión SoD, sustitución de notas editoriales por figuras SVG en `FD03`, `FD04` y `FD05`, creación de `MANIFEST.md`, `INDEX.md`, `README.md` y cierre de ítems DOC-004, 005, 007, 009, 013, 016, 018 (Commit `c4f95be`, Maestro v0.6.0).
7. **Etapa 07 (Auditoría Integral y Preparación CCB):** Ejecución de auditorías FCA/PCA, resolución de erratas editoriales de RNF-04 vs RNF-02/06 en `FD05` §13.3, detección y aislamiento de la dualidad de `DG-12`, sustitución de 39 enlaces rotos en `DIAGRAMS.md`, formulación de enmienda SSOT en `DOCUMENTATION_RULES.md`, creación de `INDICE_DOCUMENTAL.md`, actualización de script de auditoría de integridad y emisión del presente paquete CCB.

---

## 5. Matriz de Trazabilidad Integral del Sistema

La siguiente matriz certifica la consistencia bidireccional entre todas las capas del sistema TraceFlow SCM:

| Componente | Universo Canónico | Fuente Oficial | Cobertura en SRS (`FD03`) | Cobertura en SAD Análisis (`FD04`) | Cobertura en SAD Diseño (`FD05`) | Cobertura en Prototipo React | Estado de Alineación |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Requerimientos Funcionales** | 18 (`RF-01` a `RF-18`) | `TB-04` | 100% (§5.1) | 100% (§4.5, §12.1) | 100% (§9.4, §15) | Módulos críticos (RFC, CCB, Doble Llave) | ✅ Consistente |
| **Requerimientos No Funcionales** | 9 (`RNF-01` a `RNF-09`) | `TB-05` | 100% (§5.2) | 100% (§5.1, §12.1) | 100% (§10, §13, §14) | RNF-01 (RBAC/SoD), RNF-04 (Usabilidad) | ✅ Consistente |
| **Reglas de Negocio** | 9 (`RN-01` a `RN-09`) | `TB-06` | 100% (§5.3) | 100% (§5.2, §12.1) | 100% (§10.2, §15) | Validadas en formularios y compuertas | ✅ Consistente |
| **Casos de Uso** | 31 (`CU-01` a `CU-30`, `04.1`) | `TB-10` | 100% (§6.1.3) | 100% (§4.5, §12.1) | 100% (§12, §15) | Flujo principal de cambios implementado | ✅ Consistente |
| **Actores Canónicos** | 7 (`PU-01` a `PU-07`) | `TB-09` | 100% (§6.1) | 100% (§3.2, §8.2) | 100% (§10.2, §19) | 4 cuentas demo soportan los 7 roles | ✅ Consistente |
| **Módulos Conceptuales** | 9 (`MOD-01` a `MOD-09`) | `TB-01`, `DG-04` | 100% (§4.2) | 100% (§4.1, §4.3) | 100% (§4.4 `DG-D02`) | Rutas React mapeadas por módulo | ✅ Consistente |
| **Estados de la RFC** | 14 (`TB-07`) | `TB-07`, `DG-11` | 100% (§5.3) | 100% (§7.2 matriz) | 100% (§6.2 máquina) | Renderizados en badges de estado | ✅ Consistente |
| **Pantallas de Interfaz** | 20 (`SCREEN-01` a `SCREEN-20`) | `FD05` §20.5 | Mapeadas (§1.2) | Mapeadas (§1.6) | 100% (§20.5, §21) | 8 interactivas funcionales + 12 placeholders | ✅ Consistente |
| **Wireframes de Baja Fidelidad** | 20 (`WF-01` a `WF-20`) | `FD05` §21 | N/A (Fase Diseño)| N/A (Fase Diseño)| 100% (§21 ASCII/Salt) | Contrastados contra 17 capturas reales | ✅ Consistente |

---

## 6. Resultados de la Auditoría de Configuración Funcional (FCA) — Alcance Documental y de Trazabilidad

> [!NOTE]
> **Delimitación Estricta del Alcance FCA**: La Auditoría de Configuración Funcional (FCA) conducida en esta etapa evaluó la **completitud, consistencia y trazabilidad documental y de modelado** entre los requerimientos aprobados y los modelos de análisis y diseño. **No constituye una certificación de ejecución funcional en entorno de producción**, ni acredita cobertura empírica automatizada de pruebas end-to-end de los 31 casos de uso sobre infraestructura desplegada.

1. **Completitud y Trazabilidad de Requisitos:** Los 18 RF y 9 RNF se encuentran formalmente especificados en el SRS y descompuestos conceptualmente en el SAD de Análisis y SAD de Diseño, mapeados 1:1 a casos de uso y pantallas.
2. **Especificación Canónica de Casos de Uso:** Se cerró la brecha histórica de especificaciones incompletas formalizando fichas canónicas completas para `CU-04.1` (Subsanación de RFC), `CU-29` (Aceptación UAT) y `CU-30` (Autorización de Cambio Menor por Doble Llave).
3. **Gobernanza y Segregación de Funciones (SoD):** Se verificó que ninguna operación crítica del flujo de cambios pueda ser ejecutada en solitario o por actores no autorizados:
   - Solicitante (`PU-01`) no puede aprobar ni clasificar cambios.
   - Gestor (`PU-02`) requiere concurrencia del Especialista (`PU-03`) para Cambios Menores (`RN-05`).
   - Cambios Mayores exigen deliberación y quórum formal del CCB (`PU-04`, `RN-05`).
   - El Desarrollador (`PU-06`) no puede certificar su propia prueba QA (`RN-07`).
4. **Alcance y Límites de las Evidencias del Prototipo:** Las 17 capturas del prototipo React SPA acreditan el renderizado visual, responsividad y control de navegación client-side (`RoleGuard`) para 8 pantallas interactivas y 12 demostrativas. No sustituyen la verificación de transacciones ACID en PostgreSQL ni la lógica de negocio en backend NestJS.

---

## 7. Resultados de la Auditoría de Configuración Física (PCA) — Inventario Documental y Gráfico

> [!NOTE]
> **Delimitación Estricta del Alcance PCA**: La Auditoría de Configuración Física (PCA) verificó la **integridad física de los recursos documentales, archivos de código PlantUML y artefactos renderizados en disco bajo el directorio `docs/`**. **No constituye una auditoría física de infraestructura de producción**, servidores bare-metal, contenedores en ejecución ni almacenamiento distribuido MinIO/S3.

1. **Integridad de Fuentes PlantUML:** 114 especificaciones físicas `.puml` auditadas en disco sin errores de sintaxis, organizadas en `generales` (13), `analisis` (65), `diseno` (15) y `uwe` (21).
2. **Identificadores Canónicos Únicos vs. Archivos Físicos:** Se identifican **113 identificadores canónicos únicos**. Existe **1 colisión canónica activa (`DG-12`)** debido a la coexistencia del Diagrama de Clases histórico (`generales/DG-12.puml`) y el Modelo Conceptual de Análisis (`analisis/DG-12.puml`), preservados ambos y elevados al CCB en `DOC-030`.
3. **Integridad de Renders:** 228 artefactos gráficos (114 `.svg` vectoriales y 114 `.png` matriciales) verificados en disco con tamaño $>0$ bytes (tasa de completitud: 100.0% de los modelos definidos).
4. **Preservación de Nombres Decimales:** `DG-SEQ-04.1` y `DG-AO-04.1` compilados sin truncamiento en todos los formatos.
5. **Integridad de Enlaces Markdown:** Se inspeccionaron 195 referencias a `assets/` en los documentos principales; se registraron **0 enlaces rotos**.
6. **Catálogo de Tablas Canónicas:** Se verificaron en disco 15 tablas físicas estructuradas en `docs/TABLES.md` (rango `TB-01` a `TB-14`, incluyendo el decimal `TB-11.1`).
7. **Evidencias del Prototipo:** 17 capturas reales de pantalla verificadas en disco (1440 × 900 px, en `docs/assets/capturas/`).

---

## 8. Registro de Hallazgos Resueltos y Cerrados

A través de las acciones correctivas de las Etapas 01 a 07, se resolvieron satisfactoriamente los siguientes hallazgos:

- **`DOC-001`**: Apertura y consolidación de la versión candidata SRS v1.1.
- **`DOC-002`**: Actualización de rutas de imágenes históricas.
- **`DOC-003`**: Incorporación de especificaciones formales de `CU-04.1`, `CU-29` y `CU-30`.
- **`DOC-004`**: Renderizado de 31 diagramas de objetos BCE (`DG-AO-*`) en SVG y PNG.
- **`DOC-005`**: Renderizado de 3 secuencias pendientes (`DG-SEQ-04.1`, `29`, `30`).
- **`DOC-006`**: Inserción de advertencia formal de obsolescencia sobre `DG-13`.
- **`DOC-007`**: Renderizado e integración de `DG-SAD-A01` y `DG-SAD-A02` en SAD de Análisis.
- **`DOC-008`**: Corrección de enlaces rotos a `TABLES.md` / `DIAGRAMS.md` en SAD de Análisis.
- **`DOC-009`**: Integración formal de los 36 diagramas de diseño en `FD05`.
- **`DOC-010`**: Delimitación explícita entre arquitectura física de diseño y prototipo SPA.
- **`DOC-011`**: Normalización de rutas relativas en gobernanza documental.
- **`DOC-012`**: Sincronización de versiones de documentos en `TABLES.md`.
- **`DOC-013`**: Modularización de 114 diagramas en archivos `.puml` individuales.
- **`DOC-014`**: Clasificación explícita de las 20 pantallas en `prototype/README.md`.
- **`DOC-015`**: Normalización de denominaciones canónicas de RNF en `TB-05`.
- **`DOC-016`**: Integración de referencias cruzadas a las 17 capturas en `FD05` y `STITCH`.
- **`DOC-017`**: Rectificación cuantitativa canónica de pantallas (8 interactivas funcionales + 12 placeholders = 20).
- **`DOC-018`**: Cierre del inventario cuantitativo en 114 diagramas canónicos.
- **`DOC-020`**: Reescrutura de Viabilidad Ambiental en `FD03` §3.5 eliminando duplicidad.
- **`DOC-021`**: Estandarización de nomenclatura de casos de uso a `CU-XX`.
- **`DOC-026`**: Normalización de enlaces internos entre documentos dentro de `docs/`.
- **`DOC-027`**: Explicitación de que las guardas RBAC del prototipo son simulación de cliente.
- **`DOC-029`**: Aclaración estricta de ADR-006 sobre sesión opaca en PostgreSQL vs Keycloak diferido.
- **`DOC-031`**: Corrección de erratas de atribución de `RNF-04` vs `RNF-02`/`RNF-06` en `FD05` §13.3.
- **`DOC-032`**: Sustitución de 39 enlaces de imagen rotos en `docs/DIAGRAMS.md`.

---

## 9. Registro de Hallazgos Abiertos y Propuestas para el CCB

Los siguientes hallazgos requieren una decisión o resolución formal por parte del Comité:

### A. Hallazgo `DOC-030`: Coexistencia de Dos Especificaciones bajo el Identificador `DG-12`
- **Diagnóstico:** Existen dos modelos PlantUML bajo el ID `DG-12`:
  1. `generales/DG-12.puml`: *Diagrama de Clases del Dominio* (161 líneas, atributos tipados con primitivas Java/C# y métodos).
  2. `analisis/DG-12.puml`: *Modelo Conceptual del Dominio* (180 líneas, 15 entidades en 4 paquetes conceptuales, sin tipos técnicos ni métodos).
- **Uso Documental Actual:** Los documentos `FD03` (§6.1), `FD04` (§6.1) y `FD05` (§7.1) utilizan exclusivamente el **Modelo Conceptual del Dominio de Análisis** (`analisis/DG-12.svg`).
- **Propuesta Formal al CCB:**
  - Ratificar oficialmente el **Modelo Conceptual del Dominio de Análisis** como el único `DG-12` canónico de la línea base.
  - Reasignar el modelo histórico de clases a un identificador formal de diseño o archivarlo como `DG-12-HIST` / `DG-CLASS-01`.

### B. Hallazgo `DOC-033`: Evolución de la Política SSOT para Fuentes Gráficas PlantUML
- **Diagnóstico:** `DOCUMENTATION_RULES.md` define a `DIAGRAMS.md` como la única SSOT gráfica. La modularización de 114 archivos `.puml` en `docs/assets/diagramas/plantuml/` con `MANIFEST.md` requiere formalizar la gobernanza híbrida sincronizada.
- **Propuesta Formal al CCB:** Aprobar la enmienda normativa formulada en la Sección 15 de `docs/DOCUMENTATION_RULES.md`.

### C. Hallazgo `DOC-034`: Formalización de Parámetros de Diseño RTO/RPO frente a `RNF-09`
- **Diagnóstico:** `RNF-09` en SRS prescribe copias de seguridad automáticas diarias. El diseño arquitectónico (`FD05` §14.3 y ADR-010) incorporó como compromisos técnicos RTO $\le 2$ horas y RPO $\le 24$ horas.
- **Propuesta Formal al CCB:** Ratificar que RTO $\le 2$ h y RPO $\le 24$ h corresponden a especificaciones de diseño complementarias aprobadas que satisfacen `RNF-09`.

### D. Hallazgo `DOC-035`: Alcance y Limitaciones de Verificación del Prototipo React
- **Diagnóstico:** Las 17 capturas demuestran la fidelidad visual, adaptabilidad de rol y componentes UI/UX del prototipo React SPA, pero la inyección en `localStorage` no constituye evidencia de pruebas de penetración ni de seguridad en backend.
- **Propuesta Formal al CCB:** Tomar conocimiento del alcance de las evidencias y programar formalmente las pruebas de carga, estrés y seguridad de backend para la fase de construcción e integración.

---

## 10. Matriz de Riesgos Residuales

| ID | Riesgo Residual Identificado | Severidad | Probabilidad | Estrategia de Mitigación Aprobada |
|:---:|---|:---:|:---:|---|
| **RSK-01** | Disponibilidad del 99.9% en host único ante falla física catastrófica de hardware. | Alta | Baja | Procedimiento de Disaster Recovery respaldado por la Unidad Lógica de Respaldo externa (RTO $\le 2$ h). Ruta de migración a Docker Swarm / Kubernetes (ADR-010). |
| **RSK-02** | Divergencia manual entre archivos `.puml` individuales y `DIAGRAMS.md`. | Media | Media | Script de validación automatizado `audit_diagram_integrity.py` ejecutable en pre-commit o CI. |
| **RSK-03** | Confusión entre simulación de sesión en prototipo vs. autenticación segura backend. | Media | Baja | Notas de advertencia explícitas en `FD05` §10.2, §21.11, `README.md` y este informe. |

---

## 11. Conciliación de Decisiones Arquitectónicas (ADR-001 a ADR-010)

Se auditó directamente la totalidad de los diez registros de decisión técnica aprobados en `docs/adr/` (fecha formal de aprobación: 2026-10-01). Se ratifica la plena consistencia entre los ADRs originales y el SAD de Diseño v0.5 (§2.1):

| Código | Título Oficial Aprobado | Decisión Seleccionada | Consistencia con Modelos de Diseño |
|:---:|---|---|---|
| **ADR-001** | Adopción del Estilo Arquitectónico Monolito Modular | Monolito modular en un único proceso desplegable con 9 módulos desacoplados (MOD-01 a MOD-09). | Coherente con `DG-D02` (Estructura de Paquetes en 4 capas Clean Architecture). |
| **ADR-002** | Adopción de Single Page Application (SPA) con React, TypeScript y Vite | Frontend SPA estático sin SSR para los 7 roles autenticados consumiendo API REST. | Coherente con modelos UWE (`DG-UWE-NAV`, `DG-UWE-PRES`) y las 20 pantallas físicas (§20.5). |
| **ADR-003** | Adopción de Node.js, TypeScript y NestJS como Framework de Backend | Backend modular en NestJS (Node 24 LTS) con inyección de dependencias y OpenAPI (Express descartado). | Coherente con la arquitectura en capas y controladores REST detallados en §9.4. |
| **ADR-004** | Adopción de PostgreSQL como Motor de Base de Datos Relacional Principal | RDBMS ACID unificado para metadatos, índices condicionales y JSONB para auditoría. | Coherente con el modelo relacional formalizado en `DG-D03` (22 tablas de persistencia). |
| **ADR-005** | Estrategia de Custodia Híbrida y Abstracción de Almacenamiento para ECS | Desacoplamiento metadatos-binarios mediante puerto `StoragePort` (tránsito por 3 bibliotecas SCM). | Coherente con el diagrama de despliegue de storage `DG-D04` (Development, Controlled, Static). |
| **ADR-006** | Mecanismo de Autenticación Segura, Sesiones en Servidor y RBAC / SoD | Sesiones opacas en servidor con cookies `HttpOnly` (`SameSite=Strict`) en PostgreSQL; Keycloak diferido. | Coherente con `FD05` §10.2 y guards RBAC; Keycloak formalmente diferido para fase enterprise. |
| **ADR-007** | Implementación del Bloqueo Lógico Persistente de Sincronización en BD | Bloqueo pesimista condicional en `scm_locks` liberable únicamente por Check-In, Rollback o Cancelación (RN-06). | Coherente con las secuencias técnicas de bloqueo `DG-DSEQ-03` y `DG-DSEQ-04`. |
| **ADR-008** | Arquitectura de Registro de Auditoría Append-Only en PostgreSQL | Pistas inmutables sin `UPDATE`/`DELETE` para la aplicación, triggers y encadenamiento criptográfico SHA-256. | Coherente con el esquema relacional de auditoría forense inmutable y requerimiento `RF-18`. |
| **ADR-009** | Adopción de API RESTful con Cargas Útiles JSON y Especificación OpenAPI 3.0 | Contratos RESTful estructurados, DTOs tipados en TypeScript y especificación Swagger/OpenAPI. | Coherente con la matriz exhaustiva de endpoints REST documentada en `FD05` §9.4. |
| **ADR-010** | Estrategia de Contenerización Docker, Operación y Respaldo de Unidad Lógica | Docker Compose multi-stage, respaldos automáticos diarios y metas de diseño (RTO $\le$ 2h, RPO $\le$ 24h). | Coherente con `DG-D06` (Diagrama de Despliegue Físico) y procedimiento de Disaster Recovery. |

---

## 12. Propuestas Formales Sometidas a Resolución del CCB

Se elevan formalmente al CCB las siguientes cuatro propuestas para su deliberación y dictamen expreso:

1. **Resolución Canónica de DG-12 (DOC-030):**
   Ratificar que el identificador canónico `DG-12` designe de manera unívoca al *Modelo Conceptual del Dominio TraceFlow SCM (Fase de Análisis)* (`analisis/DG-12.puml`), y autorizar la reclasificación o archivo del Diagrama de Clases preliminar (`generales/DG-12.puml`) como `DG-12-HIST` o `DG-CLASS-01`.
2. **Aprobación de la Enmienda de Gobernanza SSOT Híbrido (DOC-033):**
   Aprobar formalmente la Sección 15 de `docs/DOCUMENTATION_RULES.md`, reconociendo a los archivos modulares `.puml` en `docs/assets/diagramas/plantuml/` como fuentes de autoría primaria sincronizadas con el compendio maestro `docs/DIAGRAMS.md`.
3. **Reconocimiento y Convalidación Formal de Decisión ADR-006 (DOC-029):**
   Convalidar formalmente que la decisión arquitectónica vigente aprobada en `ADR-006` establece sesiones opacas basadas en cookies `HttpOnly` persistidas en servidor (PostgreSQL) y difiere Keycloak, subsanando definitivamente cualquier mención contradictoria en informes históricos de cierre anteriores.
4. **Elevación de Revisiones Candidatas a Líneas Base Oficiales Aprobadas:**
   Deliberar la transición formal de las especificaciones candidatas a líneas base aprobadas del proyecto:
   - `FD03-EPIS-Informe_SRS.md` v1.1 $
ightarrow$ Línea Base de Requisitos (`BL-REQ-02`), consolidando formalmente 31 Casos de Uso canónicos.
   - `FD04-EPIS-Informe_SAD_Analisis.md` v1.2 $
ightarrow$ Línea Base de Análisis (`BL-ARC-02`).
   - `FD05-EPIS-Informe_SAD_Diseno.md` v0.5 $
ightarrow$ Línea Base de Diseño (`BL-DSN-01`).

---

## 13. Inventario de Evidencias Disponibles para Evaluación

El CCB dispone de los siguientes artefactos verificables en el repositorio:

- **228 Imágenes de Diagramas:** Compiladas en `docs/assets/diagramas/render/` (114 `.svg` para visualización vectorial nítida y 114 `.png` para suites ofimáticas).
- **17 Capturas Reales de Pantalla:** Compiladas en `docs/assets/capturas/` a 1440 × 900 px, documentadas en `docs/assets/capturas/INDEX.md`.
- **Scripts de Validación y Reproducción:** `extract_diagrams.py`, `render_diagrams.py`, `capture_screens.py` y `audit_diagram_integrity.py` en `docs/scripts/diagramas/`.
- **Guía de Mantenimiento:** `docs/assets/README.md`.
- **Índice Central:** `docs/INDICE_DOCUMENTAL.md`.

---

## 14. Limitaciones de Verificación Técnicamente Declaradas

En cumplimiento de los principios de honestidad técnica y rigor de auditoría de configuración (IEEE 828-2012):

1. **Expediente Preparado para Deliberación ≠ Línea Base Aprobada:** La preparación y entrega de este paquete formal de revisión acredita que el acervo documental está conciliado, validado y apto para deliberación, pero **bajo ninguna circunstancia constituye aprobación formal anticipada ni sustituye el voto colegiado del CCB**.
2. **Alcance Documental de las Auditorías FCA/PCA:** La FCA realizada acredita trazabilidad y correspondencia entre especificaciones y modelos; la PCA acredita el inventario físico de artefactos bajo `docs/`. Ninguna de ellas sustituye las pruebas de aceptación de software en producción ni la auditoría física de infraestructura de servidores o bases de datos reales.
3. **Entorno de Demostración del Prototipo:** El prototipo navegable React opera con datos en memoria y `localStorage` en servidor local. No se han ejecutado pruebas de concurrencia masiva, estrés de base de datos ni pruebas de penetración (pentesting).
4. **Metas de Continuidad y Rendimiento RNF:** La disponibilidad del 99.9% (`RNF-02`), tiempos de respuesta sub-segundo (`RNF-06`) y parámetros RTO $\le 2$h / RPO $\le 24$h son **compromisos y metas de diseño arquitectónico**, cuya verificación empírica deberá ejecutarse en la fase de construcción sobre infraestructura física pre-productiva.

---

## 15. Recomendación Técnica Colegiada de los Solicitantes

Los ingenieros de C-SharkTeam, actuando en calidad de Administrador de Configuración, Analista de Requerimientos, Arquitecto de Software y Auditor de Calidad, recomiendan colegiadamente al Comité de Control de Cambios:

> **DICTAMEN TÉCNICO RECOMENDADO: APROBACIÓN CONDICIONADA A RESOLUCIÓN DE PROPUESTAS**
>
> 1. Se recomienda **APROBAR** el paquete documental y elevar formalmente las revisiones candidatas a:
>    - **SRS v1.1 — Línea Base Oficial Aprobada**
>    - **SAD de Análisis v1.2 — Línea Base Oficial Aprobada**
>    - **SAD de Diseño v0.5 — Línea Base Oficial Aprobada**
> 2. Se recomienda **RESOLVER FAVORABLEMENTE** las propuestas sobre el identificador único `DG-12`, la enmienda SSOT en `DOCUMENTATION_RULES.md` y la formalización de los 31 Casos de Uso.
> 3. Se recomienda autorizar el merge controlado de la rama `docs/alineacion-srs-sad-2026-11-12` sobre la rama `master`.

---

## 16. Apartado de Resolución Formal del Comité de Control de Cambios (CCB)

*(Esta sección queda reservada exclusivamente para ser completada y suscrita por los miembros del CCB durante la sesión formal de deliberación. No contiene firmas ni decisiones predeterminadas).*

```
========================================================================================
                 ACTA DE RESOLUCIÓN DEL COMITÉ DE CONTROL DE CAMBIOS (CCB)
========================================================================================

FECHA DE SESIÓN DEL CCB: ____ / ____ / 2026
LUGAR: Sala de Conferencias / Sesión Virtual Institucional — ÉXODO S.A.C.

DECISIÓN DEL COMITÉ:
[  ] APROBADO SIN OBSERVACIONES (Se declara formalmente la Línea Base Oficial)
[  ] APROBADO CON OBSERVACIONES MENORES (Requiere subsanación editorial previa a merge)
[  ] RECHAZADO / DEVUELTO PARA REVISIÓN (Especificar no conformidades bloqueantes abajo)

RESOLUCIÓN SOBRE PROPUESTAS FORMALES:
- Propuesta DG-12 (Modelo Conceptual canónico vs histórico): [  ] APROBADA  [  ] RECHAZADA
- Propuesta Enmienda SSOT (Fuentes modulares .puml):        [  ] APROBADA  [  ] RECHAZADA
- Propuesta de 31 Casos de Uso Canónicos:                   [  ] APROBADA  [  ] RECHAZADA

OBSERVACIONES Y DICTAMEN DEL CCB:
________________________________________________________________________________________
________________________________________________________________________________________
________________________________________________________________________________________

MIEMBROS DEL COMITÉ DE CONTROL DE CAMBIOS (CCB):

____________________________________             ____________________________________
    Presidente del Comité CCB                        Coordinador de Proyectos CCB

____________________________________             ____________________________________
 Administrador de Configuración (SCM)                Líder de Aseguramiento de Calidad
========================================================================================
```

# TraceFlow SCM — Sistema de Gestión de Configuración de Software

<div align="center">

[![Documento Maestro](https://img.shields.io/badge/Documento-SRS%20V1.0-blue.svg)](FD03-EPIS-Informe_SRS.md)
[![Estado del Proyecto](https://img.shields.io/badge/Fase-FD03%20Requerimientos%20%26%20Diseño%20Lógico-success.svg)](#etapa-actual-del-proyecto)
[![Gobernanza SSOT](https://img.shields.io/badge/Gobernanza-SSOT%20Activa-orange.svg)](docs/DOCUMENTATION_RULES.md)
[![Diagramas PlantUML](https://img.shields.io/badge/Diagramas-41%20Aprobados-brightgreen.svg)](docs/DIAGRAMS.md)
[![Integridad SHA-256](https://img.shields.io/badge/Seguridad-SHA--256-blueviolet.svg)](#principios-técnicos-de-scm)

**Plataforma Web Centralizada para el Control de Cambios, Trazabilidad de Artefactos y Gestión de Bibliotecas de Configuración**

*Desarrollado por el equipo **C-SharkTeam** en cooperación con **ÉXODO S.A.C.***  
*Universidad Privada de Tacna — Facultad de Ingeniería — Escuela Profesional de Ingeniería de Sistemas*

</div>

---

## 1. Visión General del Proyecto

**TraceFlow SCM** es una solución integral de software diseñada para sistematizar, estandarizar y gobernar las actividades del **Aseguramiento de la Gestión de la Configuración de Software (SCM)** dentro de empresas y equipos de consultoría tecnológica. 

El proyecto surge como respuesta a la problemática operacional identificada en la empresa consultora **ÉXODO S.A.C.**, donde la ausencia de un repositorio unificado y la administración empírica del código fuente propiciaban pérdidas críticas de avances por sobreescritura, desarticulación en la comunicación técnica y la inexistencia de líneas base (*baselines*) estables a las cuales retornar ante contingencias en entornos de producción.

TraceFlow SCM provee una arquitectura formal de control que garantiza la inmutabilidad, trazabilidad y reproducibilidad de cada activo del ciclo de vida del software mediante políticas estrictas de control de cambios basadas en los estándares **IEEE 828** e **ISO/IEC/IEEE 12207**.

---

## 2. Principios Técnicos y Capacidades Clave

```
[ Solicitante ] ──( RFC )──> [ Analista / Gestor ] ──( Análisis )──> [ Arquitecto ]
                                                                             │
                                                                   ( Informe Técnico )
                                                                             ▼
[ Check-In & Línea Base ] <── [ Validación QA ] <── [ Desarrollo ] <── [ CCB: Aprobación ]
```

- **Ciclo de Vida Formal de Cambios (RFC & ECN/ECO):** Todo cambio en el sistema requiere una Solicitud de Cambio formal (**RFC**), evaluada mediante análisis de impacto técnico multidisciplinario por el **Arquitecto** y dictaminada por el Comité de Control de Cambios (**CCB**), quien expide la Orden de Cambio (**ECN/ECO**).
- **Esquema de Tres Bibliotecas:** Organización jerárquica de activos según su madurez:
  - **Biblioteca de Trabajo (*Work*):** Entorno local y transitorio donde el Ingeniero de Software ejecuta modificaciones autorizadas.
  - **Biblioteca de Soporte (*Support*):** Espacio intermedio de integración y ejecución de pruebas de calidad (*Testing/QA*).
  - **Biblioteca Maestra (*Master*):** Repositorio central, inmutable y restringido que almacena únicamente versiones certificadas y congeladas en Líneas Base.
- **Mecanismos de Exclusión Mutua (Bloqueos de Sincronización):** Durante la operación de *Check-Out*, el sistema bloquea el Elemento de Configuración (**ECS**) en la Biblioteca de Soporte/Maestra, impidiendo modificaciones concurrentes o sobreescrituras no autorizadas.
- **Integridad Criptográfica mediante Checksum SHA-256:** Cada Check-In calcula y contrasta la firma criptográfica del archivo contra la base de datos de auditoría, certificando que el activo no ha sufrido alteraciones maliciosas ni corrupción de datos.
- **Gestión de Líneas Base y Rollback Automatizado:** Capacidad de congelar versiones estables del proyecto y ejecutar reversión transaccional inmediata (*rollback*) en caso de fallos detectados por el equipo de calidad en fases de re-testeo.

---

## 3. Arquitectura del Sistema

El sistema implementa una arquitectura desacoplada en cuatro capas lógicas:

```
┌────────────────────────────────────────────────────────────────────────┐
│               1. Capa de Presentación (Frontend Web SPA)               │
│      React / TypeScript — Módulos RBAC, Proyectos, RFC, SCM, QA       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST API (JSON)
┌───────────────────────────────────▼────────────────────────────────────┐
│          2. Capa de Servicios y Lógica de Negocio (Backend API)        │
│       Controladores de Proyectos, RFC/CCB, Trazabilidad y Reportes     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│          3. Capa SCM Core, Motor de Concurrencia y Seguridad           │
│ Motor de Versionamiento │ Gestor de Bloqueos │ Verificador Hash SHA-256 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│               4. Capa de Almacenamiento y Persistencia                 │
│      PostgreSQL (TraceFlow DB)  │  Storage File System (Bibliotecas)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Roles y Perfiles de Usuario (RBAC)

La plataforma opera bajo un modelo de Control de Acceso Basado en Roles (**RBAC**) que segmenta estrictamente las atribuciones del flujo:

| ID Perfil | Rol Canónico | Responsabilidad Principal en el Flujo SCM |
| :---: | :--- | :--- |
| **PU-01** | **Solicitante** | Registra Solicitudes de Cambio (RFC), reporta incidencias y da seguimiento al estado de atención. |
| **PU-02** | **Analista de Requerimientos / Gestor** | Recepciona, valida completitud, clasifica severidad y gestiona proyectos y usuarios. |
| **PU-03** | **Arquitecto / Especialista Técnico** | Elabora informes de impacto técnico (esfuerzo, costos, arquitectura, riesgos) y cataloga ECS. |
| **PU-04** | **Comité de Control de Cambios (CCB)** | Órgano decisional colegiado; aprueba o rechaza solicitudes y formaliza Órdenes de Cambio (ECN/ECO). |
| **PU-05** | **Administrador de Configuración / Bibliotecario** | Custodio de bibliotecas; ejecuta Check-In/Check-Out, administra bloqueos, congelamientos de Líneas Base y rollbacks. |
| **PU-06** | **Ingeniero de Software / Desarrollador** | Implementa cambios autorizados en la Biblioteca de Trabajo y ejecuta pruebas unitarias locales. |
| **PU-07** | **Equipo de Calidad / Testing** | Ejecuta pruebas de integración, valida criterios de aceptación y emite Certificados de Conformidad. |

---

## 5. Estructura Documental y Gobernanza SSOT

La documentación de TraceFlow SCM adopta el principio de **Fuente Única de Verdad (Single Source of Truth - SSOT)**, distribuida modularmente para prevenir redundancias y divergencias:

```
TraceFlow/
├── FD03-EPIS-Informe_SRS.md     # Documento maestro consolidado de Requerimientos de Software (SRS)
├── README.md                    # Presentación técnica, resumen ejecutivo y estado del proyecto
├── docs/
│   ├── DOCUMENTATION_RULES.md   # Marco normativo de gobernanza, convenciones (RF, RN, CU, DG) y versionamiento
│   ├── TABLES.md                # SSOT de tablas estructuradas, catálogos funcionales y matrices de trazabilidad
│   └── DIAGRAMS.md              # Catálogo oficial SSOT de 41 diagramas en código PlantUML con metadatos
└── assets/                      # Artefactos gráficos compilados en formatos PNG y SVG (DG-01 a DG-28)
```

### Índice de Referencia Documental
- **Documento Maestro SRS:** [FD03-EPIS-Informe_SRS.md](file:///c:/Users/HP/Desktop/proyecto/FD03-EPIS-Informe_SRS.md)
- **Reglas de Gobernanza y Convenciones:** [docs/DOCUMENTATION_RULES.md](file:///c:/Users/HP/Desktop/proyecto/docs/DOCUMENTATION_RULES.md)
- **Tablas y Matrices de Trazabilidad:** [docs/TABLES.md](file:///c:/Users/HP/Desktop/proyecto/docs/TABLES.md)
- **Catálogo Centralizado de Diagramas:** [docs/DIAGRAMS.md](file:///c:/Users/HP/Desktop/proyecto/docs/DIAGRAMS.md)
- **Artefactos Visuales:** [assets/](file:///c:/Users/HP/Desktop/proyecto/assets)

---

## 6. Etapa Actual del Proyecto

Actualmente, el proyecto se encuentra en la etapa:

> ### **FASE 3: Cierre de Especificación Formal de Requerimientos y Diseño Lógico Arquitectural (Hito FD03)**

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐     ┌──────────────┐
│   FASE 1     │     │   FASE 2     │     │        FASE 3        │     │   FASE 4     │
│ Levantamiento│ ──> │  Análisis de │ ──> │   Especificación SRS │ ──> │ Desarrollo e │
│  del Negocio │     │  Procesos    │     │  & Modelado Lógico   │     │Implementación│
│  (Completado)│     │ (Completado) │     │ (★ ETAPA ACTUAL - 100%)    │  (Siguiente) │
└──────────────┘     └──────────────┘     └──────────────────────┘     └──────────────┘
```

### Logros Consolidados en esta Fase:
- [x] **Ingeniería de Requerimientos Completa:**
  - **18 Requerimientos Funcionales (`RF-01` a `RF-18`)** estandarizados y clasificados por prioridad.
  - **9 Requerimientos No Funcionales (`RNF-01` a `RNF-09`)** con métricas de rendimiento, seguridad e interoperabilidad.
  - **9 Reglas de Negocio (`RN-01` a `RN-09`)** con niveles de rigidez y autoridad institucional asignada.
- [x] **Modelado de Comportamiento e Interacción:**
  - **28 Casos de Uso (`CU-01` a `CU-28`)** narrativos formalizados en tablas de detalle.
  - **28 Diagramas de Secuencia (`DG-SEQ-01` a `DG-SEQ-28`)** que modelan la interacción temporal exacta entre frontend, capas de servicio y base de datos.
  - **Diagrama de Estados (`DG-11`)** con los 13 estados del ciclo de vida de la RFC.
- [x] **Modelado Estructural y Arquitectural:**
  - **Diagrama de Clases del Dominio (`DG-12`)** que define las 12 entidades principales y sus relaciones cardinales.
  - **Modelo Lógico Arquitectural (`DG-13`)** que especifica la distribución en 4 capas de software.
  - **Diagrama de Paquetes (`DG-04`)** y diagrama de actividades con swimlanes (**`DG-03`**).
- [x] **Artefactos Visuales Compilados:**
  - **41 diagramas renderizados en PNG** de alta calidad integrados directamente en el documento SRS y el catálogo oficial.
- [x] **Matrices de Trazabilidad Cruzada:**
  - Cobertura bidireccional entre requerimientos, reglas de negocio y casos de uso verificada sin discrepancias.

### Próximos Pasos (Fase 4: Desarrollo e Implementación - FD04):
1. **Configuración del Entorno de Desarrollo y Repositorio de Código:**
   - Inicialización del proyecto Frontend (React / Vite / TailwindCSS).
   - Inicialización del proyecto Backend API (Node.js / Express / TypeScript o Python / FastAPI).
   - Migraciones iniciales de base de datos relacional (PostgreSQL).
2. **Implementación del Módulo Core de SCM:**
   - Servicios de Check-In / Check-Out con manipulación de almacenamiento de archivos.
   - Algoritmo de bloqueo concurrente transaccional.
   - Generación y verificación automática de sumas de comprobación SHA-256.
3. **Automatización de Pruebas y CI/CD:**
   - Suite de pruebas unitarias y de integración para las reglas de negocio críticas (`RN-01` a `RN-09`).

---

## 7. Equipo de Desarrollo — C-SharkTeam

Proyecto desarrollado bajo la asesoría académica del **Dr. Ricardo Eduardo Valcarcel Alvarado** en el curso de *Gestión de la Configuración de Software* (EPIS - UPT, 2026):

| Integrante | Código Estudiantil | Rol Técnico y Responsabilidades |
| :--- | :---: | :--- |
| **Joan Cristian Medina Quispe** | 2022074255 | **Dirección de Proyecto, Análisis, Documentación y Gobernanza SCM:** Coordinación general del ciclo de vida, análisis de requerimientos, documentación técnica bajo SSOT, modelado de procesos (RFC/ECN), políticas de bibliotecas y seguridad RBAC. |
| **Renzo Antonio Antayhua Mamani** | 2022073504 | **Ingeniería de Backend, Lógica de Negocio y Mecanismos SCM:** Lógica de negocio centralizada, microservicios del motor de versionamiento, bloqueos de concurrencia y validación criptográfica SHA-256. |
| **Renzo Fernando Loyola Vilca Choque** | 2021072615 | **Ingeniería de Frontend, Experiencia de Usuario (UX) y Mockups:** Diseño de interfaces interactivas, navegación web, construcción de prototipos/mockups, tableros de control de RFC/ECN y vistas de autogestión. |
| **Augusto Joaquin Rivera Muñoz** | 2022073505 | **QA, Pruebas, Persistencia, Auditoría y Validación:** Modelado y diseño de persistencia relacional, bitácoras de auditoría, suites de pruebas unitarias y de integración, automatización y validación de entregables. |

---

## 8. Licencia y Uso Académico

Este proyecto ha sido desarrollado con fines estrictamente académicos y de investigación aplicada para la Escuela Profesional de Ingeniería de Sistemas de la Universidad Privada de Tacna. Todos los derechos sobre la especificación y el código fuente corresponden al equipo de desarrollo **C-SharkTeam**.

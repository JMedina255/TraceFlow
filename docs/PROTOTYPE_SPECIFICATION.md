# Especificación de Arquitectura y Navegación del Prototipo React — TraceFlow SCM

> **Sistema de Gestión de Configuración de Software - TraceFlow SCM**  
> **Repositorio:** `TraceFlow`  
> **Documento:** `docs/PROTOTYPE_SPECIFICATION.md`  
> **Fase del Proyecto:** Fase 1 — Auditoría y Matriz de Pantallas del Prototipo  
> **Equipo de Desarrollo:** C-SharkTeam (Medina, Antayhua, Loyola, Rivera)  
> **Fecha:** 2026-10-07  
> **Estado:** APROBADO  

---

## 1. Control de Versiones

| Versión | Elaborado por | Revisado por | Fecha | Descripción del Cambio |
| :---: | :--- | :--- | :---: | :--- |
| **1.0** | C-SharkTeam | C-SharkTeam | 07/10/2026 | Emisión formal de la especificación técnica de la Fase 1 del prototipo React SPA: consolidación de matriz de trazabilidad (CU ↔ SCREEN ↔ WF ↔ Ruta React), mapa de navegación basado en DG-04, arquitectura modular de `prototype/` y plan de desarrollo incremental. |

---

## 2. Resumen del Estado del Repositorio y Auditoría Documental

El proyecto **TraceFlow SCM** cuenta con un marco documental exhaustivo y normado bajo el principio de **Fuente Única de Verdad (SSOT)**:

- **Estudio de Factibilidad (`FD01` v2):** Viabilidad técnica, económica y operativa aprobada para la empresa consultora **ÉXODO S.A.C.** (VAN: +S/. 10,801.64, TIR: 68.20%, horizonte a 5 años).
- **Especificación de Requerimientos de Software (`FD03` v1.0):** Baseline de análisis aprobada. Contiene 18 Requerimientos Funcionales (`RF-01` a `RF-18`), 9 Requerimientos No Funcionales (`RNF-01` a `RNF-09`), 9 Reglas de Negocio (`RN-01` a `RN-09`), 7 Perfiles de Usuario (`PU-01` a `PU-07`) y el catálogo de Casos de Uso (`CU-01` a `CU-30`, incluyendo `CU-04.1`, `CU-29` y `CU-30`).
- **Arquitectura de Software — Fase de Análisis (`FD04` v1.1):** Baseline de análisis aprobada. Define la descomposición en 8 paquetes arquitecturales (`DG-04`), el ciclo de vida de la RFC en 14 estados oficiales (`DG-11`) y el análisis conceptual de objetos (patrón BCE).
- **Arquitectura de Software — Fase de Diseño (`FD05` v0.4):** Borrador de diseño controlado con 10 registros de decisión arquitectónica ([ADR-001 a ADR-010](adr/README.md)), modelos de navegación UWE (`NAV-01` a `NAV-28`), patrones de presentación (`PRES-01` a `PRES-10`), catálogo de 20 pantallas físicas (`SCREEN-01` a `SCREEN-20`) y catálogo de wireframes de baja fidelidad (`WF-01` a `WF-20`).
- **Gobernanza SSOT:** Tablas centralizadas en [`docs/TABLES.md`](TABLES.md), diagramas PlantUML centralizados en [`docs/DIAGRAMS.md`](DIAGRAMS.md) y reglas de gobernanza en [`docs/DOCUMENTATION_RULES.md`](DOCUMENTATION_RULES.md).

---

## 3. Matriz de Trazabilidad Canónica: CU $\rightarrow$ SCREEN $\rightarrow$ WF $\rightarrow$ Ruta React

Esta matriz traduce rigurosamente la sección 20.5 y 20.6 del `FD05` y la tabla `TB-10` de `docs/TABLES.md` al enrutamiento de la aplicación web React SPA:

| ID Pantalla | Nombre Oficial de Pantalla | Nodos NAV | Patrón PRES | Casos de Uso Gobernados | Wireframe Oficial | Rol Canónico Principal / Permisos | Ruta React Propuesta |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **`SCREEN-01`** | **Portal de Acceso (Login)** | `NAV-01` | `PRES-01` | Autenticación IAM (`MOD-01`) | `WF-01` | Todos los Actores | `/login` |
| **`SCREEN-02`** | **Dashboard General Adaptativo** | `NAV-02` | `PRES-02` | Resumen operativo, tareas y métricas | `WF-02` | Todos (Vistas contextualizadas por rol) | `/dashboard` (o `/`) |
| **`SCREEN-03`** | **Directorio General de Proyectos** | `NAV-03` | `PRES-03` | `CU-02` (Crear y administrar proyectos) | `WF-03` | Gestor, CCB, Bibliotecario | `/projects` |
| **`SCREEN-04`** | **Ficha Integral de Proyecto** | `NAV-04` | `PRES-04` | `CU-02, CU-03` (Consultar proyecto) | `WF-04` | Gestor, CCB, Bibliotecario, Arquitecto | `/projects/:projectId` |
| **`SCREEN-05`** | **Bandeja de Solicitudes (RFC)** | `NAV-05` | `PRES-03` | `CU-04..08, CU-30` | `WF-05` | Todos (Filtrado según SoD) | `/rfcs` |
| **`SCREEN-06`** | **Expediente 360° de RFC** | `NAV-06` | `PRES-04, PRES-07` | `CU-04..08, CU-30` | `WF-06A/B/C` | Todos (Acciones contextuales por rol y estado) | `/rfcs/:rfcId` |
| **`SCREEN-07`** | **Portal de Captura y Edición de RFC** | `NAV-07, NAV-08` | `PRES-06, PRES-05` | `CU-04` (Registrar), `CU-04.1` (Subsanar) | `WF-07` | Solicitante | `/rfcs/new` / `/rfcs/:rfcId/edit` |
| **`SCREEN-08`** | **Consola de Evaluación de Impacto** | `NAV-09` | `PRES-05` | `CU-06` (Análisis de impacto técnico) | `WF-08` | Arquitecto / Especialista Técnico | `/rfcs/:rfcId/impact-analysis` |
| **`SCREEN-09`** | **Sala de Deliberación CCB** | `NAV-10` | `PRES-07` | `CU-07` (Evaluar Cambio Mayor) | `WF-09` | Miembros del CCB | `/rfcs/:rfcId/ccb-deliberation` |
| **`SCREEN-10`** | **Consola de Autorización de Cambio Menor** | `NAV-11` | `PRES-07` | `CU-30` (Doble llave delegada) | `WF-10` | Gestor Y Arquitecto | `/rfcs/:rfcId/minor-approval` |
| **`SCREEN-11`** | **Ficha de Orden de Cambio (ECN/ECO)** | `NAV-12` | `PRES-04` | `CU-08` (Emitir ECN), `CU-22` (Cancelar) | `WF-11` | CCB, Gestor, Bibliotecario, Dev, QA | `/ecns` / `/ecns/:ecnId` |
| **`SCREEN-12`** | **Explorador de ECS y Bibliotecas SCM** | `NAV-13..15` | `PRES-03, 04, 08` | `CU-09` (Registrar), `CU-14`, `CU-26` | `WF-12` | Bibliotecario, Dev, Arquitecto, QA | `/ecs` / `/ecs/:ecsId` |
| **`SCREEN-13`** | **Consola de Operaciones SCM (Check-Out/In)** | `NAV-16, NAV-17` | `PRES-08` | `CU-10` (Out), `CU-11` (Lock), `CU-12` (In) | `WF-13A/B` | Administrador / Bibliotecario (Dev receptor)| `/scm/operations` |
| **`SCREEN-14`** | **Visor de Historial y Comparador Diff** | `NAV-18` | `PRES-09` | `CU-13` (Historial y comparación diff) | `WF-14` | Todos los roles técnicos | `/ecs/:ecsId/history` |
| **`SCREEN-15`** | **Consola de Validación QA y No Conformidades**| `NAV-19, NAV-20` | `PRES-08, PRES-05` | `CU-16, CU-17` (QA), `CU-18, CU-19` (Re-test) | `WF-15` | Equipo de Calidad (Dev receptor) | `/qa/validation/:rfcId` |
| **`SCREEN-16`** | **Centro de Suscripción de Acta UAT** | `NAV-21` | `PRES-07` | `CU-29` (Aceptación formal de usuario) | `WF-16` | Solicitante (Usuario Final) | `/rfcs/:rfcId/uat` |
| **`SCREEN-17`** | **Gestor de Líneas Base y Rollback SCM** | `NAV-22, NAV-23` | `PRES-08` | `CU-20` (Línea Base), `CU-21` (Rollback) | `WF-17` | Administrador / Bibliotecario | `/baselines` |
| **`SCREEN-18`** | **Mesa de Entrada y Ficha de Incidencias** | `NAV-24, NAV-25` | `PRES-03, PRES-04` | `CU-23` (Ticket), `CU-24`, `CU-25` (Derivar RFC) | `WF-18` | Solicitante (Registra), Gestor (Atiende) | `/incidents` / `/incidents/:incidentId` |
| **`SCREEN-19`** | **Consola de Auditoría y Reportes SCM** | `NAV-26, NAV-27` | `PRES-03, PRES-10` | `CU-27` (Auditoría SHA-256), `CU-28` (Reportes) | `WF-19` | CCB, Bibliotecario, Gestor | `/audit` y `/reports` |
| **`SCREEN-20`** | **Administración de Usuarios y Roles** | `NAV-28` | `PRES-05` | `CU-01` (Gestionar usuarios y perfiles) | `WF-20` | Administrador / Bibliotecario | `/admin/users` |

---

## 4. Dependencias Funcionales y Flujo del Ciclo de Vida SCM

La solución simula con fidelidad los procesos definidos en los 8 paquetes arquitecturales (`DG-04`), los 14 estados de la RFC (`DG-11`, `TB-07`) y las 9 reglas de negocio (`RN-01` a `RN-09`):

### 4.1. Paquetes Arquitecturales de DG-04
1. **Gobernanza y Seguridad:** Autenticación y RBAC (`MOD-RBAC`), Administración de Usuarios (`MOD-USER`).
2. **Gestión de Proyectos:** Aislamiento de Proyectos (`MOD-PROJ`), Asignación de Responsables (`MOD-RESP`).
3. **Gestión de Configuración:** Catálogo de ECS (`MOD-ECS`), Identificación y Tipado (`MOD-TYPE`).
4. **Gestión de Bibliotecas:** Biblioteca de Trabajo (`LIB-WRK`), Soporte (`LIB-SUP`), Maestra (`LIB-MST`), Bloqueos de Sincronización (`MOD-LOCK`).
5. **Control de Cambios:** Gestión y Clasificación de RFC (`MOD-RFC`), Análisis de Impacto (`MOD-IMP`), Evaluación CCB (`MOD-CCB`), Autorización Delegada (`MOD-AUTH-MIN`), Emisión ECN (`MOD-ECN`), Validación QA / UAT (`MOD-QA_UAT`), Orquestación SCM (`MOD-ORQ`).
6. **Soporte e Incidencias:** Tickets de Incidencias (`MOD-TCK`), Derivación a RFC (`MOD-DERIV`).
7. **Trazabilidad y Auditoría:** Registro de Auditoría (`MOD-LOG`), Verificación SHA-256 (`MOD-SHA`), Matriz de Trazabilidad (`MOD-TRAC`).
8. **Reportes:** Generador de Reportes e Inventarios (`MOD-RPT`).

### 4.2. Flujo Integrado de Cambio (Ciclo Completo)
1. **Registro:** El *Solicitante* crea la RFC (`CU-04`) $\rightarrow$ Estado: `Registrada`.
2. **Revisión Inicial:** El *Analista de Requerimientos / Gestor* valida completitud (`CU-05`). Si hay observaciones, pasa a `En Subsanación` (`CU-04.1`) o `Desestimada`. Si es admitida $\rightarrow$ Estado: `Clasificada`.
3. **Análisis de Impacto Técnico:** El *Arquitecto* evalúa arquitectura, dependencias y Triple Restricción (`CU-06`) $\rightarrow$ Estado: `En Análisis Técnico`. Clasifica en Cambio Mayor o Menor.
4. **Dictamen de Decisión:**
   - **Cambio Mayor:** El *CCB* delibera y vota en acta (`CU-07`) $\rightarrow$ Pasa a `Autorizada` o `Rechazada`.
   - **Cambio Menor:** El *Gestor* y el *Arquitecto* emiten autorización compartida ("Doble Llave") (`CU-30`) $\rightarrow$ Pasa a `Autorizada` o `Rechazada`.
5. **Emisión de Orden de Cambio:** Se formaliza la ECN/ECO (`CU-08`) $\rightarrow$ Estado: `Orden Emitida`.
6. **Check-Out & Bloqueo SCM:** El *Bibliotecario* ejecuta Check-Out (`CU-10`) hacia la Biblioteca de Trabajo y activa el bloqueo de sincronización (`CU-11`, regla `RN-06`) $\rightarrow$ Estado: `En Implementación`.
7. **Desarrollo y Verificación Local:** El *Desarrollador* modifica el ECS (`CU-14`) y ejecuta pruebas unitarias (`CU-15`).
8. **Aseguramiento de Calidad (QA):** El *Equipo de Calidad* ejecuta pruebas de integración en Biblioteca de Soporte (`CU-16`) $\rightarrow$ Estado: `En Pruebas`.
   - *Si No Conforme:* Registra hallazgos (`CU-18`) y re-testea (`CU-19`). Si el fallo es insubsanable, el Bibliotecario ejecuta Rollback (`CU-21`) y cancelación de la ECN (`CU-22`) $\rightarrow$ Estado terminal: `Cancelada`.
   - *Si Conforme:* Emite Certificado de Conformidad Técnica (`CU-17`).
9. **Aceptación de Usuario (UAT):** El *Solicitante* valida los criterios de aceptación en entorno controlado y suscribe el Acta UAT (`CU-29`) $\rightarrow$ Estado: `En Aceptación`.
10. **Check-In Definitivo y Línea Base:** Al contar concurrentemente con la doble validación (`RN-09`), el *Bibliotecario* efectúa Check-In a Biblioteca Maestra (`CU-12`), congela la Línea Base bajo versionamiento `mayor.menor.parche` (`CU-20`), libera el bloqueo y emite hash SHA-256 (`RNF-03`) $\rightarrow$ Estado terminal: `Implementada`.

---

## 5. Mapa de Navegación y Estructura del Shell Global

El Shell Global corporativo persistente se compone de:

- **Topbar:**
  - Logo y nombre del sistema: **TraceFlow SCM**.
  - Selector de Proyecto Activo (conmutación entre proyectos aislados de ÉXODO S.A.C.).
  - Selector interactivo de **Usuario de Demostración** (permite alternar en tiempo real entre los 4 integrantes del C-SharkTeam y sus roles asignados).
  - Indicador visual del Rol Activo (`PU-01` a `PU-07`).
  - Botón de **Restablecer Escenario de Demo** (restablece los datos ficticios en `localStorage` al estado inicial).
  - Enlace de Cerrar Sesión.
- **Breadcrumb dinámico:** Rastreo de ruta actual para orientación contextual.
- **Sidebar estructurado por los 8 paquetes de DG-04:**
  - **General:** Dashboard (`/dashboard`).
  - **Proyectos:** Directorio (`/projects`), Detalle de Proyecto (`/projects/:id`).
  - **Control de Cambios:** Bandeja de Solicitudes (`/rfcs`), Nueva RFC (`/rfcs/new`), Órdenes de Cambio (`/ecns`).
  - **SCM & Bibliotecas:** Catálogo de ECS (`/ecs`), Consola Check-Out/In (`/scm/operations`), Líneas Base y Rollback (`/baselines`).
  - **Calidad & Testing:** Validaciones QA (`/qa`).
  - **Soporte:** Mesa de Incidencias (`/incidents`).
  - **Auditoría & Reportes:** Bitácora Forense (`/audit`), Generador de Reportes (`/reports`).
  - **Administración:** Gestión de Usuarios y Roles (`/admin/users`).

---

## 6. Arquitectura de Código del Prototipo (`prototype/`)

```
prototype/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/                       # Interfaces TypeScript normativas
    ├── data/                        # Semillas de demostración de ÉXODO S.A.C.
    ├── services/                    # Lógica de negocio mock desacoplada (Mock API)
    ├── store/                       # Zustand stores reactivos
    ├── components/
    │   ├── layout/                  # Shell Global UWE, Topbar, Sidebar, Breadcrumb
    │   ├── common/                  # Badge de estados, Botones, Modales, Tablas
    │   └── guards/                  # Control de visibilidad y acceso por rol
    ├── features/                    # Las 20 Pantallas Físicas (SCREEN-01 a SCREEN-20)
    └── routes/                      # Enrutamiento React Router
```

---

## 7. Plan de Implementación por Fases Incrementales

- **Fase 1 (Completada):** Auditoría documental, matriz canónica de pantallas y arquitectura de carpetas.
- **Fase 2:** Inicialización de React + Vite + TypeScript en `prototype/`, configuración de Tailwind CSS y definición de tipos normativos.
- **Fase 3:** Construcción del Shell Global corporativo, Topbar, Sidebar y enrutador React Router.
- **Fase 4:** Semillas de datos simulados para ÉXODO S.A.C., store Zustand y conmutador dinámico de roles/usuarios.
- **Fase 5:** Implementación del flujo central de RFC (Captura, Expediente 360°, Evaluación, CCB, Doble Llave y ECN).
- **Fase 6:** Implementación del módulo de Proyectos y SCM Core (Catálogo ECS, Check-Out con bloqueo RN-06, Check-In, Validación QA, Acta UAT y Líneas Base).
- **Fase 7:** Implementación de Incidencias, derivación a RFC, Bitácora de Auditoría SHA-256, Reportes y Administración de Usuarios.
- **Fase 8:** Escenarios negativos (rechazos, no conformidades, re-testeo y rollback automático RN-08).
- **Fase 9:** Documentación técnica del prototipo y guía paso a paso de demostración para evaluación académica.

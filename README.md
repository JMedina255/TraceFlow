# TraceFlow SCM — Sistema de Gestión de Configuración de Software

<div align="center">

[![Documento Maestro](https://img.shields.io/badge/Documento-SRS%20v1.2%20DOC--02-blue.svg)](docs/FD03-EPIS-Informe_SRS.md)
[![Arquitectura](https://img.shields.io/badge/Arquitectura-SAD%20Final%20DOC--02-indigo.svg)](docs/SAD_FINAL.md)
[![Backend NestJS](https://img.shields.io/badge/Backend-NestJS%2011%20%7C%20TypeScript-red.svg)](backend/)
[![Database PostgreSQL](https://img.shields.io/badge/Database-Supabase%20PG%2017.12-blue.svg)](docs/DICCIONARIO_DATOS.md)
[![Pruebas E2E](https://img.shields.io/badge/Playwright-18%2F18%20Passed-brightgreen.svg)](docs/evidence/int-01/)

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

```text
TraceFlow/
├── backend/                     # API REST NestJS (Monolito Modular, ADR-003)
│   ├── cert/                    # Certificado CA raíz oficial (prod-ca-2021.crt)
│   ├── src/                     # Módulos: auth, projects, rfcs, audit, database
│   └── test/                    # Pruebas unitarias, e2e e integración PostgreSQL real
├── prototype/                   # Frontend SPA React 18 + Vite + TailwindCSS + Zustand
│   ├── src/features/            # Vistas operativas de los 7 roles canónicos
│   ├── src/services/api/        # Adaptador de transporte unificado (Mock / REST API)
│   └── src/store/               # Estados globales con persistencia de sesión
├── supabase/                    # Migraciones relacionales e infraestructura de datos
│   ├── migrations/              # Migraciones versionadas (0001, 0002, 0003)
│   ├── roles/                   # Definición de roles de mínimo privilegio (traceflow_app)
│   └── seed/                    # Semillas estructurales de desarrollo
├── scripts/                     # Automatizaciones y runner de certificación E2E Playwright
├── docs/                        # Repositorio documental normativo (IEEE 828, ISO 12207)
│   ├── INDICE_DOCUMENTAL.md     # Navegación centralizada y catálogo oficial
│   ├── ESTADO_DEL_PROYECTO.md   # Estado real, pendientes e historial compacto de hitos
│   ├── FD03-EPIS-Informe_SRS.md # SRS Final Candidato (v1.2 DOC-02)
│   ├── SAD_FINAL.md             # Arquitectura consolidada (Análisis + Diseño)
│   ├── DICCIONARIO_DATOS.md     # Modelo físico PostgreSQL (21 tablas) y objetivo en español
│   ├── ESTANDAR_PROGRAMACION.md # Convenciones obligatorias TS, NestJS, React, PostgreSQL y REST
│   ├── GLOSARIO.md              # Terminología oficial del dominio en español
│   ├── MATRIZ_NOMENCLATURA.md   # Equivalencias inglés–español por capa
│   ├── MATRIZ_TRAZABILIDAD.md   # Trazabilidad integral RF/RNF -> CU -> BD -> Pruebas
│   ├── PLAN_REFACTORIZACION.md  # Plan progresivo REF-01 de normalización al español
│   ├── PLAN_INICIALIZACION_PROYECTOS.md # Plan Maestro de Inicialización, Organización y GitHub (INIT-H01)
│   ├── adr/                     # Registros de Decisiones Arquitectónicas (ADR-001 a ADR-011)
│   └── evidence/int-01/         # Evidencias visuales de integración E2E (capturas de pantalla)
└── README.md                    # Este documento
```

### Índice de Referencia Documental
- **Índice Documental Centralizado:** [docs/INDICE_DOCUMENTAL.md](docs/INDICE_DOCUMENTAL.md)
- **Estado Consolidado del Proyecto:** [docs/ESTADO_DEL_PROYECTO.md](docs/ESTADO_DEL_PROYECTO.md)
- **Documento Maestro SRS:** [docs/FD03-EPIS-Informe_SRS.md](docs/FD03-EPIS-Informe_SRS.md)
- **Arquitectura Consolidada (SAD Final):** [docs/SAD_FINAL.md](docs/SAD_FINAL.md)
- **Diccionario de Datos:** [docs/DICCIONARIO_DATOS.md](docs/DICCIONARIO_DATOS.md)
- **Estándar de Programación:** [docs/ESTANDAR_PROGRAMACION.md](docs/ESTANDAR_PROGRAMACION.md)
- **Glosario y Nomenclatura:** [docs/GLOSARIO.md](docs/GLOSARIO.md) | [docs/MATRIZ_NOMENCLATURA.md](docs/MATRIZ_NOMENCLATURA.md)
- **Trazabilidad y Plan REF-01:** [docs/MATRIZ_TRAZABILIDAD.md](docs/MATRIZ_TRAZABILIDAD.md) | [docs/PLAN_REFACTORIZACION.md](docs/PLAN_REFACTORIZACION.md)
- **Plan Maestro de Inicialización (INIT-H01):** [docs/PLAN_INICIALIZACION_PROYECTOS.md](docs/PLAN_INICIALIZACION_PROYECTOS.md)
- **Reglas de Gobernanza, Tablas y Diagramas SSOT:** [docs/DOCUMENTATION_RULES.md](docs/DOCUMENTATION_RULES.md) | [docs/TABLES.md](docs/TABLES.md) | [docs/DIAGRAMS.md](docs/DIAGRAMS.md) | [docs/adr/ADR-011.md](docs/adr/ADR-011.md)

---

## 6. Refactorización Empresarial (Rama `feat/traceflow-enterprise-rbac-ux`)

La aplicación ha sido sometida a una refactorización integral para convertir el prototipo navegable en una plataforma empresarial operativa:

### 6.1. Acceso Institucional y Cuentas de Evaluación
El acceso se realiza mediante correo institucional corporativo y contraseña con verificación criptográfica SHA-256 + salt de sistema (`traceflow:exodo:scm:auth:v1`).

| ID Usuario | Colaborador | Correo Corporativo | Rol Principal | Rol Secundario | Proyectos Asignados |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **USR-001** | Joan Cristian Medina Quispe | `jmedina@exodo.pe` | **PU-02** (Gestor) | **PU-01** (Solicitante) | PRJ-001, PRJ-002, PRJ-003 |
| **USR-002** | Renzo Antonio Antayhua Mamani | `rantayhua@exodo.pe` | **PU-03** (Arquitecto) | **PU-06** (Desarrollador) | PRJ-001, PRJ-002, PRJ-003 |
| **USR-003** | Augusto Joaquin Rivera Muñoz | `arivera@exodo.pe` | **PU-05** (Bibliotecario)| **PU-07** (Calidad/QA) | PRJ-001, PRJ-002, PRJ-003 |
| **USR-004** | Renzo Fernando Loyola Vilca Choque | `rloyola@exodo.pe` | **PU-04** (CCB) | *(Ninguno)* | PRJ-001, PRJ-002 *(Veto: PRJ-003)* |

* **Aprovisionamiento Seguro de Credenciales:** El sistema no publica contraseñas en texto claro ni secretos en el repositorio. Para evaluaciones locales o aprovisionamiento PostgreSQL, utilice el script `backend/src/scripts/provision-users.ts` o consulte [ESTADO_DEL_PROYECTO.md](docs/ESTADO_DEL_PROYECTO.md).
* **Política de Sesión:** Un solo rol efectivo por sesión activa (`effectiveRoleId`).
* **Política de Rutas:** Denegación estricta por defecto (**Default-Deny**).
* **Segregación de Funciones (SoD):** Antiautoevaluación del Solicitante, Doble Llave con dos identidades físicas distintas en cambios menores y veto de `USR-004` sobre `PRJ-003`.

### 6.2. Documentación Técnica de Referencia RBAC y UX
- **Identidad y Roles Funcionales:** [docs/refactor/IDENTITY_AND_ROLES.md](docs/refactor/IDENTITY_AND_ROLES.md)
- **Matriz de Control de Acceso (RBAC & SoD):** [docs/refactor/RBAC_ACCESS_MATRIX.md](docs/refactor/RBAC_ACCESS_MATRIX.md)
- **Matriz de Navegación por Rol:** [docs/refactor/ROLE_NAVIGATION_MATRIX.md](docs/refactor/ROLE_NAVIGATION_MATRIX.md)
- **Estándar de Programación y UI:** [docs/ESTANDAR_PROGRAMACION.md](docs/ESTANDAR_PROGRAMACION.md)

### 6.3. Verificación Automatizada y Calidad de Código
Desde el directorio `prototype/`:
```bash
# 1. Análisis estático (Linter)
npm run lint

# 2. Compilación de tipos y empaquetado
npm run build

# 3. Ejecución de las 9 suites de pruebas unitarias y de integración
npm test
```

---

## 7. Estado Actual del Proyecto (Hitos DB-01, DB-02, DB-02.1 e INT-01 Certificados)

TraceFlow SCM ha alcanzado la madurez operativa en sus capas de backend, base de datos e integración:

```text
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│     PROTOTIPO SPA      │      │     BACKEND NESTJS     │      │  SUPABASE POSTGRESQL   │
│  React 18 + Zustand    │ <──> │  Monolito Modular 11   │ <──> │  17.12 (AWS us-west-2) │
│  Modo API / HTTP Rest  │      │  Sesiones Opacas + TLS │      │  21 Tablas / 10 Trigg. │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

### Logros Consolidados y Certificados:
- [x] **Base de Datos PostgreSQL 17.12 en Supabase (`TraceFlow-UPT`):**
  - Esquema privado `traceflow` con 21 tablas relacionales, 11 secuencias unívocas y aislamiento de PostgREST (`anon`/`authenticated` bloqueados).
  - 10 triggers físicos de gobernanza (inmutabilidad estricta de `audit_log`, `ecs_version`, `ccb_vote`, `change_authorization`, líneas base congeladas, exclusividad de `sync_lock`, doble llave obligatoria y anti-autoevaluación en informes de impacto y votos CCB).
  - Rol de aplicación de mínimo privilegio (`traceflow_app`) con cifrado TLS 1.3 y certificado CA oficial.
  - 14/14 pruebas de certificación física de base de datos aprobadas (`DB-T01` a `DB-T14`).
- [x] **Backend NestJS (Monolito Modular):**
  - Módulos de autenticación (`AuthModule`), proyectos (`ProjectsModule`), solicitudes de cambio (`RfcsModule`), auditoría (`AuditModule`) y base de datos (`DatabaseModule`).
  - Autenticación criptográfica con Argon2id (`@node-rs/argon2`), sesiones opacas en base de datos y cookies `HttpOnly` (`SameSite=Strict`).
  - Control de acceso RBAC, Segregación de Funciones (SoD) y aislamiento multitenant estricto por proyecto.
  - 44/44 pruebas backend aprobadas (unitarias, servicios y flujo vertical real).
- [x] **Integración Vertical en Vivo y Certificación E2E (Playwright):**
  - 18/18 pruebas de integración vertical aprobadas en navegador Chromium headless (`INT-T01` a `INT-T18`).
  - Creación asíncrona real de RFCs (`POST /rfcs`), asignación de código unívoco (`RFC-2026-0020`), inserción en PostgreSQL y bitácora con hash SHA-256.
  - Cero fallbacks silenciosos a mock en modo API (`VITE_SERVICE_MODE=api`).
  - Evidencias visuales archivadas en [docs/evidence/int-01/](docs/evidence/int-01/).

### Estado de Implementación de los 31 Casos de Uso (SRS v1.1):
- **Implementados y Certificados en Integración Vertical Real (React ↔ NestJS ↔ PostgreSQL):**
  - `CU-01` (Gestión de usuarios y autenticación con roles canónicos)
  - `CU-02` (Aprovisionamiento y administración de proyectos multitenant)
  - `CU-03` (Consulta y filtrado de proyectos por membresía)
  - `CU-04` (Registro formal de Solicitud de Cambio RFC con persistencia)
  - `CU-09` (Resolución e inventario de Elementos de Configuración ECS)
  - `CU-26` (Validación de integridad de datos y hashing criptográfico SHA-256)
  - `CU-27` (Auditoría inmutable de eventos del sistema en base de datos)
- **Implementados en Prototipo + Esquema Físico y Triggers en PostgreSQL (Preparados para endpoints NestJS en fases posteriores):**
  - `CU-04.1` a `CU-08` (Subsanación, clasificación, análisis de impacto técnico, deliberación CCB, orden de cambio ECN/ECO).
  - `CU-10` a `CU-25` (Check-Out, bloqueos, Check-In, versiones, implementación, testing unitario/QA, conformidad, no conformidades, líneas base, rollback, cancelación e incidencias).
  - `CU-28` a `CU-30` (Reportes SCM, aceptación de usuario UAT y autorización de cambios menores con doble llave).

---

## 8. Instrucciones de Instalación y Ejecución Local Reproducible

### Requisitos Previos:
- **Node.js:** v22.x o superior (LTS recomendado).
- **npm:** v10.x o superior.
- **Git:** v2.40 o superior.

### 8.1. Puesta en Marcha del Backend NestJS
```bash
cd backend

# 1. Instalar dependencias exactas
npm ci

# 2. Configurar variables de entorno locales (a partir del ejemplo seguro)
cp .env.example .env
# Configurar DATABASE_URL con las credenciales autorizadas de PostgreSQL en Supabase

# 3. Compilar TypeScript
npm run build

# 4. Iniciar el servidor API (puerto 3001)
npm start
```
El backend estará disponible en `http://localhost:3001/api/v1` (Health: `GET /api/v1/health`).

### 8.2. Puesta en Marcha del Frontend React
```bash
cd ../prototype

# 1. Instalar dependencias exactas
npm ci

# 2. Configurar variables de entorno locales
# Para operar conectado al Backend NestJS real:
echo "VITE_SERVICE_MODE=api" > .env.local
echo "VITE_API_BASE_URL=http://localhost:3001/api/v1" >> .env.local

# 3. Compilar y empaquetar
npm run build

# 4. Iniciar servidor de desarrollo Vite (puerto 5173)
npm run dev
```
La aplicación web estará disponible en `http://localhost:5173`.

### 8.3. Ejecución de Pruebas Automatizadas
```bash
# Backend: Pruebas unitarias e integración en memoria
cd backend
npm test

# Backend: Flujo vertical real contra Supabase PostgreSQL
npx vitest run test/real-postgres-integration.spec.ts test/real-postgres-vertical-flow.spec.ts

# Frontend: Linter, compilación y 9 suites de pruebas unitarias
cd ../prototype
npm run lint
npm run build
npm test

# Certificación E2E Playwright en vivo (requiere backend en :3001 y frontend en :5173)
cd ..
node scripts/e2e-int01-runner.mjs
```

---

## 9. Equipo de Desarrollo — C-SharkTeam

Proyecto desarrollado bajo la asesoría académica del **Dr. Ricardo Eduardo Valcarcel Alvarado** en el curso de *Gestión de la Configuración de Software* (EPIS - UPT, 2026):

| Integrante | Código Estudiantil | Rol Técnico y Responsabilidades |
| :--- | :---: | :--- |
| **Joan Cristian Medina Quispe** | 2022074255 | **Dirección de Proyecto, Análisis, Documentación y Gobernanza SCM:** Coordinación general del ciclo de vida, análisis de requerimientos, documentación técnica bajo SSOT, modelado de procesos (RFC/ECN), políticas de bibliotecas y seguridad RBAC. |
| **Renzo Antonio Antayhua Mamani** | 2022073504 | **Ingeniería de Backend, Lógica de Negocio y Mecanismos SCM:** Lógica de negocio centralizada, microservicios del motor de versionamiento, bloqueos de concurrencia y validación criptográfica SHA-256. |
| **Renzo Fernando Loyola Vilca Choque** | 2021072615 | **Ingeniería de Frontend, Experiencia de Usuario (UX) y Mockups:** Diseño de interfaces interactivas, navegación web, construcción de prototipos/mockups, tableros de control de RFC/ECN y vistas de autogestión. |
| **Augusto Joaquin Rivera Muñoz** | 2022073505 | **QA, Pruebas, Persistencia, Auditoría y Validación:** Modelado y diseño de persistencia relacional, bitácoras de auditoría, suites de pruebas unitarias y de integración, automatización y validación de entregables. |

---

## 10. Licencia y Uso Académico

Este proyecto ha sido desarrollado con fines estrictamente académicos y de investigación aplicada para la Escuela Profesional de Ingeniería de Sistemas de la Universidad Privada de Tacna. Todos los derechos sobre la especificación y el código fuente corresponden al equipo de desarrollo **C-SharkTeam**.

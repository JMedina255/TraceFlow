# Modelo de Identidades, Roles Funcionales y Sesiones — TraceFlow SCM
## Fase 02: Arquitectura de Autenticación Demostrativa, RBAC y Segregación de Funciones (SoD)

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software  
> **Organización Cliente:** ÉXODO S.A.C.  
> **Fecha:** Noviembre 2026  
> **Documento:** `docs/refactor/IDENTITY_AND_ROLES.md`  
> **Estado:** BASELINE DE ARQUITECTURA DE IDENTIDAD (Fase 02)  
> **Referencias Normativas:** `FD03-EPIS-Informe_SRS.md` (TB-06, TB-09, TB-10), `FD04-EPIS-Informe_SAD_Analisis.md`, `FD05-EPIS-Informe_SAD_Diseno.md` (ADR-006)

---

## 1. Introducción y Propósito

El presente documento formaliza la separación conceptual y técnica entre **Cuentas de Usuario (Identidades)**, **Perfiles Funcionales (Roles RBAC)** y **Sesiones Activas** dentro del prototipo frontend de TraceFlow SCM.

En las fases preliminares, el prototipo utilizaba un modelo de simulación directa que permitía a cualquier operador conmutar su identidad o rol en caliente desde la barra superior (`Topbar.tsx`) en medio de cualquier pantalla operativa. Asimismo, el formulario de acceso (`LoginView.tsx`) mantenía credenciales fijas y establecía una sesión predeterminada sin validar la selección.

La Fase 02 reemplaza dicha experiencia por un flujo de acceso empresarial y desacoplado, asegurando que:
1. La identidad del usuario se seleccione o autentique exclusivamente en el **Portal de Acceso (`/login`)**.
2. Cada sesión activa opere bajo un **único rol efectivo** seleccionado entre los roles expresamente asignados a la cuenta.
3. Se apliquen **guardas de navegación (Route Guards)** para restringir el acceso a rutas y acciones no autorizadas.
4. Se mantengan inalteradas las reglas normativas de **Segregación de Funciones (SoD)** y las baselines de requerimientos del SRS y SAD.

---

## 2. Diferenciación Conceptual: Identidad vs. Rol vs. Sesión

```
┌────────────────────────────────┐
│   Cuenta de Usuario (Identity) │
│   - id, username, fullName     │
│   - email, organization        │
│   - assignedRoleIds: [...]     │
│   - assignedProjectIds: [...]  │
└───────────────┬────────────────┘
                │
                ▼ Autenticación / Selección en /login
┌────────────────────────────────┐
│   Sesión Activa (UserSession)  │
│   - token / sessionReference   │
│   - activeUser: UserAccount    │
│   - effectiveRoleId: 'PU-XX'   │ ◄── [ÚNICO ROL EFECTIVO POR SESIÓN]
│   - activeProjectId: 'PRJ-XXX' │
│   - startedAt: timestamp       │
└───────────────┬────────────────┘
                │
                ▼ Gobernanza de Permisos en Runtime
┌────────────────────────────────┐       ┌────────────────────────────────┐
│  Protección de Rutas (Guards)  │       │  Matriz SoD de Servicios Core  │
│  - ProtectedRoute              │       │  - REGISTRAR_RFC (PU-01)       │
│  - RoleGuard                   │       │  - REVISION_INICIAL (PU-02)    │
│  - AccessDeniedView            │       │  - IMPACTO_TECNICO (PU-03)     │
└────────────────────────────────┘       └────────────────────────────────┘
```

### 2.1. Cuenta de Usuario (`UserAccount`)
Representa la persona física registrada en la organización ÉXODO S.A.C. Posee atributos inmutables de filiación institucional (ID, nombre completo, correo institucional, departamento/organización) y la lista de perfiles que tiene autorizado ejercer en el sistema (`assignedRoleIds`), así como los proyectos a los que ha sido asignado (`assignedProjectIds`).

### 2.2. Rol Funcional Canónico (`CanonicalRole`)
Representa un conjunto normalizado de atribuciones y responsabilidades en el ciclo de vida del software (SCM). Corresponde estrictamente a los 7 roles canónicos definidos en la tabla `TB-09` del SRS (`PU-01` a `PU-07`). Los roles no son personas, sino conjuntos de permisos de sistema (`SystemAction`).

### 2.3. Sesión y Rol Efectivo (`effectiveRole`)
En un instante de trabajo dado, un usuario opera bajo un **único rol efectivo**. Aunque una cuenta disponga de múltiples roles asignados para distintos proyectos o tareas (ej. Analista y Solicitante), en una sesión específica no puede mezclar privilegios. Si requiere cambiar de rol efectivo, debe seleccionar el perfil al iniciar sesión o cerrar la sesión activa para alternar de rol.

---

## 3. Catálogo Canónico de Roles y Permisos (TB-09)

| Código Canónico | Nombre del Rol | Nivel Técnico | Responsabilidad en TraceFlow SCM | Acciones de Sistema Autorizadas (`SystemAction`) |
| :---: | :--- | :---: | :--- | :--- |
| **PU-01** | **Solicitante** | Básico | Origina requerimientos, reporta incidentes, subsana observaciones y firma la aceptación final de usuario (UAT). | `REGISTRAR_RFC`, `SUBSANAR_RFC`, `REGISTRAR_INCIDENCIA`, `SUSCRIBIR_UAT` |
| **PU-02** | **Analista de Requerimientos / Gestor** | Avanzado | Recepciona y valida completitud de RFCs, clasifica criticidad, deriva incidencias y autoriza Cambios Menores junto al Arquitecto. | `VALIDAR_CLASIFICAR_RFC`, `AUTORIZAR_CAMBIO_MENOR`, `EMITIR_ECN`, `DERIVAR_INCIDENCIA`, `GESTIONAR_PROYECTOS` |
| **PU-03** | **Arquitecto / Especialista Técnico** | Experto | Realiza el análisis de impacto técnico (arquitectura, riesgos, costos, tiempo), cataloga nuevos ECS y co-autoriza Cambios Menores. | `ANALIZAR_IMPACTO`, `AUTORIZAR_CAMBIO_MENOR`, `REGISTRAR_ECS` |
| **PU-04** | **Comité de Control de Cambios (CCB)** | Avanzado | Órgano colegiado de decisión que delibera la viabilidad de Cambios Mayores, emite Órdenes de Cambio (ECN) y audita el sistema. | `EVALUAR_CCB`, `EMITIR_ECN`, `AUDITAR_SISTEMA` |
| **PU-05** | **Administrador de Configuración / Bibliotecario** | Experto | Custodio físico y lógico de las 3 bibliotecas (Trabajo, Soporte, Maestra), bloqueos de concurrencia, Check-In/Out, Líneas Base y Rollbacks. | `CHECK_OUT`, `CHECK_IN`, `CONGELAR_BASELINE`, `EJECUTAR_ROLLBACK`, `AUDITAR_SISTEMA`, `GESTIONAR_USUARIOS` |
| **PU-06** | **Ingeniero de Software / Desarrollador** | Medio | Modifica los ECS autorizados en la Biblioteca de Trabajo tras recibir la ECN y ejecuta pruebas unitarias locales. | `IMPLEMENTAR_CAMBIO` |
| **PU-07** | **Equipo de Calidad / Testing** | Medio | Ejecuta pruebas de integración y no regresión en la Biblioteca de Soporte y emite Certificaciones de Conformidad o reporta no conformidades. | `VALIDACION_QA` |

---

## 4. Reglas de Segregación de Funciones (SoD) y Conflictos de Interés

Conforme al marco normativo de **IEEE 828** e **ISO/IEC/IEEE 12207** incorporado en el SRS (`RN-01` a `RN-09`):

1. **SoD-01 (Desarrollo vs. Aprobación y Biblioteca Maestra):** Un usuario que actúa con el rol de *Desarrollador (`PU-06`)* sobre una Orden de Cambio no puede ejercer como *Bibliotecario (`PU-05`)* para autorizar su propio Check-In a Maestra ni congelar la Línea Base, ni como miembro del *CCB (`PU-04`)* para aprobar el cambio.
2. **SoD-02 (Desarrollo vs. Certificación de Calidad):** Ningún cambio puede ser certificado por el mismo operador que lo implementó (`RN-09`). La certificación de calidad (`PU-07`) es estrictamente independiente de la codificación en Biblioteca de Trabajo (`PU-06`).
3. **SoD-03 (Solicitante vs. Dictamen):** El actor *Solicitante (`PU-01`)* no puede auto-aprobarse ni como *Gestor (`PU-02`)* en la admisión ni como *CCB (`PU-04`)* en la deliberación para el mismo expediente.
4. **Principio de Sesión Unívoca:** Para evitar la contaminación cruzada de permisos en tiempo de ejecución, una sesión web cuenta con **exactamente un rol efectivo**. Cualquier acción fuera del catálogo de dicho rol es bloqueada tanto en la capa visual (Route Guards y elementos de interfaz) como en la capa de servicios (`authService.assertActionAuthorized`).

---

## 5. Cuentas de Usuario de Demostración (ÉXODO S.A.C.)

Para las evaluaciones del prototipo, se definen las 4 cuentas oficiales asignadas al personal técnico de consultoría:

| ID Usuario | Nombre Completo | Correo Corporativo | Cargo Institucional | Roles Asignados (`assignedRoleIds`) | Proyectos Autorizados (`assignedProjectIds`) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **`USR-001`** | Joan Cristian Medina Quispe | `jmedina@exodo.pe` | Director de Calidad y Procesos | `PU-02` (Gestor - Rol Primario)<br>`PU-01` (Solicitante) | `PRJ-001`, `PRJ-002`, `PRJ-003` |
| **`USR-002`** | Renzo Antonio Antayhua Mamani | `rantayhua@exodo.pe` | Arquitecto de Software Principal | `PU-03` (Arquitecto - Rol Primario)<br>`PU-06` (Desarrollador) | `PRJ-001`, `PRJ-002`, `PRJ-003` |
| **`USR-003`** | Augusto Joaquin Rivera Muñoz | `arivera@exodo.pe` | Jefe de SCM y Aseguramiento | `PU-05` (Bibliotecario - Rol Primario)<br>`PU-07` (Calidad/Testing) | `PRJ-001`, `PRJ-002`, `PRJ-003` |
| **`USR-004`** | Renzo Fernando Loyola Vilca Choque | `rloyola@exodo.pe` | Coordinador de Proyectos y CCB | `PU-04` (CCB - Rol Primario) | `PRJ-001`, `PRJ-002` |

---

## 6. Protección de Rutas y Mapeo de Acceso (Route Guards)

Se establecen dos niveles de protección de navegación:
1. **`ProtectedRoute` (Nivel de Sesión):** Si el operador no ha iniciado sesión (`isAuthenticated === false` o sesión nula), cualquier acceso a rutas internas bajo `/dashboard`, `/rfcs`, `/projects`, etc., es redirigido inmediatamente a `/login`, conservando la ruta solicitada en el estado de navegación para re-enrutamiento posterior.
2. **`RoleGuard` (Nivel de Perfil):** Compara el `effectiveRoleId` de la sesión con los roles requeridos para la ruta específica (derivados de `ROUTES_METADATA[path].canonicalActors` o de políticas declarativas). Si el rol efectivo no cuenta con autorización, se renderiza la vista especializada **`AccessDeniedView`** con código de estado de negocio y accesos directos a las áreas permitidas del usuario.

| Ruta del Prototipo | Título del Módulo | Roles Autorizados en Runtime |
| :--- | :--- | :--- |
| `/dashboard` | Dashboard Principal | Todos los roles con sesión activa |
| `/projects`, `/projects/:projectId` | Gestión de Proyectos | `PU-02`, `PU-04`, `PU-05`, `PU-03` |
| `/rfcs` | Bandeja de Solicitudes | Todos los roles (vista contextualizada) |
| `/rfcs/new` | Registro de RFC | Exclusivo `PU-01` (Solicitante) |
| `/rfcs/:rfcId/edit` | Subsanación de RFC | Exclusivo `PU-01` (Solicitante creador) |
| `/rfcs/:rfcId` | Expediente 360° | Todos los roles (acciones internas restringidas por SoD) |
| `/rfcs/:rfcId/impact-analysis` | Análisis de Impacto | Exclusivo `PU-03` (Arquitecto) |
| `/rfcs/:rfcId/ccb-deliberation`| Deliberación CCB | Exclusivo `PU-04` (Comité CCB) |
| `/rfcs/:rfcId/minor-approval` | Aprobación Cambio Menor | `PU-02` (Gestor) y `PU-03` (Arquitecto) |
| `/ecns`, `/ecns/:ecnId` | Órdenes de Cambio | `PU-04`, `PU-02`, `PU-05`, `PU-06`, `PU-07` |
| `/ecs`, `/ecs/:ecsId`, `/ecs/:ecsId/history` | Catálogo de ECS | `PU-05`, `PU-03`, `PU-06`, `PU-07` |
| `/scm/operations` | Operaciones de Biblioteca | Exclusivo `PU-05` (Bibliotecario) |
| `/baselines` | Líneas Base y Rollback | Exclusivo `PU-05` (Bibliotecario) |
| `/qa/validation/:rfcId` | Consola de Validación QA | Exclusivo `PU-07` (Equipo de Calidad) |
| `/rfcs/:rfcId/uat` | Suscripción de Acta UAT | Exclusivo `PU-01` (Solicitante) |
| `/incidents`, `/incidents/:incidentId` | Mesa de Incidencias | `PU-01` (Registro), `PU-02` (Atención y Derivación) |
| `/audit`, `/reports` | Auditoría y Reportes SCM | `PU-04`, `PU-05`, `PU-02` |
| `/admin/users` | Administración de Usuarios | Exclusivo `PU-05` (Administrador de Configuración) |

---

## 7. Declaración Expresa de Limitaciones de Seguridad

> [!WARNING]  
> **Aviso de Seguridad de Arquitectura:**  
> Las guardas de navegación en React SPA y la persistencia en `localStorage` o memoria del navegador constituyen **mecanismos de experiencia de usuario y control de flujo operacional**, y **NO PROPORCIONAN SEGURIDAD CRIPTOGRÁFICA NI PERIMETRAL** frente a actores maliciosos que puedan manipular el código del cliente o el almacenamiento local.  
> La seguridad integral productiva exige la validación irrestricta en el **Backend API** mediante tokens criptográficos (JWT firmados por clave asimétrica o cookies de sesión `HttpOnly`), donde cada solicitud HTTP compruebe la firma y los claims de rol en la base de datos relacional (PostgreSQL) con control transaccional estricto.

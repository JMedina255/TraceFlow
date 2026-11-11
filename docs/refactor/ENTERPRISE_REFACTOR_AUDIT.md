# Auditoría y Diagnóstico de Refactorización Empresarial — TraceFlow SCM
## Informe Consolidado de Transformación Operativa, RBAC, SoD y Seguridad

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software  
> **Organización Cliente:** ÉXODO S.A.C.  
> **Fecha de Emisión:** 11 de Noviembre de 2026  
> **Rama de Trabajo:** `feat/traceflow-enterprise-rbac-ux`  
> **Línea Base Git Inicial:** Rama `master` limpia (Commit `f048d0a` sincronizado con `origin/master`)  
> **Marco Normativo:** IEEE 828, ISO/IEC/IEEE 12207, SRS (`FD03`), SAD Análisis (`FD04`), SAD Diseño (`FD05`), `DOCUMENTATION_RULES.md`

---

## 1. Resumen Ejecutivo de la Transformación

El presente informe documenta la culminación integral del proceso de refactorización de **TraceFlow SCM**, pasando de un prototipo interactivo con enfoque académico/docente a una **plataforma empresarial operativa de aseguramiento de configuración de software y control de cambios**.

La intervención se estructuró en siete fases rigurosas, preservando intacta la lógica de negocio y las máquinas de estado canónicas (14 estados de RFC, flujos de impacto, comités CCB y doble llave de cambios menores), mientras se sustituyeron los mecanismos demostrativos permisivos por controles criptográficos, autorización multicapa y segregación estricta de funciones.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          TRACEFLOW SCM — MATRIZ DE VERIFICACIÓN                         │
├───────────────────────────────┬──────────────────────────────────┬──────────────────────┤
│ Control / Métrica             │ Estado Previo (Prototipo)        │ Estado Refactorizado │
├───────────────────────────────┼──────────────────────────────────┼──────────────────────┤
│ Autenticación                 │ Tarjetas públicas / Sin password │ Correo institucional │
│                               │ Acceso 1-clic sin verificación   │ Hash SHA-256 + Salt  │
├───────────────────────────────┼──────────────────────────────────┼──────────────────────┤
│ Roles en Sesión               │ Múltiples roles simultáneos      │ 1 Rol Efectivo único │
│                               │ Conmutación libre en caliente    │ por sesión activa    │
├───────────────────────────────┼──────────────────────────────────┼──────────────────────┤
│ Política de Rutas             │ Permitir por defecto (Allow-all) │ Denegación estricta  │
│                               │ Rutas no declaradas públicas     │ (Default-Deny)       │
├───────────────────────────────┼──────────────────────────────────┼──────────────────────┤
│ Aislamiento Multitenant       │ Selectores globales sin filtro   │ Aislamiento estricto │
│                               │ USR-004 podía acceder a PRJ-003  │ USR-004 veto PRJ-003 │
├───────────────────────────────┼──────────────────────────────────┼──────────────────────┤
│ Propiedad (Ownership) Solicit.│ Solicitante veía todas las RFC   │ Solo ve RFC propias  │
├───────────────────────────────┼──────────────────────────────────┼──────────────────────┤
│ Doble Llave Cambios Menores   │ Una sola identidad firmaba todo  │ 2 identidades físicas│
│                               │ Auto-aprobación del solicitante  │ distintas obligatorias│
├───────────────────────────────┼──────────────────────────────────┼──────────────────────┤
│ Presentación Visual           │ Prefijos SCREEN, WF, CU, Fase    │ Nomenclatura negocio │
│                               │ Botón Reset Demo invasivo        │ Limpieza corporativa │
├───────────────────────────────┼──────────────────────────────────┼──────────────────────┤
│ Cobertura de Pruebas          │ 8 suites de prueba funcionales   │ 9 suites (100% pass) │
│                               │ Sin suite integral de seguridad  │ + Suite RBAC/SoD/Sec │
└───────────────────────────────┴──────────────────────────────────┴──────────────────────┘
```

---

## 2. Diagnóstico de Brechas Iniciales y Resolución por Fases

### 2.1. Fase 1: Limpieza Integral de Interfaz
* **Brechas Encontradas:**
  * Presencia de etiquetas académicas (`SCREEN-01` a `SCREEN-19`, `WF-01` a `WF-10`, `PRES-01`, `CU-01` a `CU-30`).
  * Badges de fases docentes (`Fase V`, `Fase CU-06`, etc.) desplegados en encabezados y botones.
  * Botón de `Restablecer Demo` en la barra superior (`Topbar.tsx`) accesible sin control a cualquier usuario.
  * Párrafos extensos de justificación didáctica orientados a rúbricas evaluativas.
* **Resolución Implementada:**
  * Se depuró la presentación visual de `LoginView.tsx`, `Topbar.tsx`, `DashboardView.tsx`, `RfcListView.tsx`, `RfcDetailView.tsx`, `RfcCreateView.tsx`, `RfcEditView.tsx` y `ScreenPlaceholder.tsx`.
  * Se eliminó el botón `Reset Demo` del `Topbar`, dejando únicamente controles corporativos de conmutación de proyectos autorizados y perfil de usuario.
  * Se adoptó terminología de negocio clara (p. ej., "Clasificación formal de requerimiento" en lugar de "Admisión CU-05", "Bandeja de Solicitudes" en lugar de "Bandeja SCREEN-05").
  * Se preservó la trazabilidad técnica en comentarios de código y documentación normativa sin contaminar la UX.

### 2.2. Fase 2: Cuentas y Autenticación Institucional
* **Brechas Encontradas:**
  * Selector público de usuarios en la pantalla de acceso con un solo clic.
  * Contraseñas inexistentes o guardadas en memoria en texto plano.
  * Posibilidad de conmutar libremente identidades mediante `switchUser` o `loginWithAccount`.
* **Resolución Implementada:**
  * Se implementó un formulario de acceso institucional con correo corporativo `@exodo.pe` y contraseña.
  * Se incorporó el esquema criptográfico SHA-256 con salt de sistema (`traceflow:exodo:scm:auth:v1`). Las contraseñas nunca se guardan en texto claro en git ni en el bundle.
  * Se estableció el principio de **Un solo rol efectivo por sesión**. Si una cuenta posee más de un rol asignado (`USR-001`, `USR-002`, `USR-003`), el usuario debe seleccionarlo explícitamente al iniciar sesión o se asume su rol primario.
  * Se aisló el almacenamiento de sesión con tokens criptográficos simulados, marcas de tiempo de expiración (8 horas) y verificación de integridad.

### 2.3. Fase 3: Aplicación Estricta de RBAC (Default-Deny)
* **Brechas Encontradas:**
  * `authService.isRoleAuthorizedForRoute` retornaba `true` para cualquier ruta no mapeada explícitamente.
  * `authService.getRouteAllowedRoles` retornaba todos los roles por defecto.
  * Módulos del sistema en `AppRouter.tsx` no estaban protegidos con `RoleGuard`.
* **Resolución Implementada:**
  * Se modificó la política de autorización a **Denegación por Defecto (Default-Deny)**: cualquier recurso o ruta protegida que no esté explícitamente autorizada para el rol activo retorna `false` y un conjunto vacío de roles.
  * Se envolvieron todas las rutas de `AppRouter.tsx` con `RoleGuard` validando contra `ROUTE_PERMISSIONS`.
  * Se aplicó la autorización en los cuatro niveles: Navegación lateral, Rutas protegidas, Formularios/Botones y Servicios de consulta.

### 2.4. Fase 4: Segregación de Funciones (SoD) y Conflictos de Interés
* **Brechas Encontradas:**
  * El solicitante podía autorizar sus propios cambios en flujos delegados.
  * No se validaba la exigencia de dos identidades físicas distintas en la doble llave de cambios menores.
  * El usuario `USR-004` podía seleccionar y operar sobre el proyecto `PRJ-003`.
* **Resolución Implementada:**
  * Se aplicó la regla de antiautoevaluación: si `rfc.requesterId === user.id`, el usuario no puede emitir voto de aprobación en `minorApprovalService` ni en `ccbService`.
  * En `minorApprovalService`, se exige que la aprobación de Gestor (`PU-02`) y la aprobación de Arquitecto (`PU-03`) pertenezcan a identidades diferentes (`userId1 !== userId2`).
  * En `project.service.ts` y `useProjectStore.ts`, se vetó formalmente el acceso de `USR-004` al proyecto `PRJ-003`, bloqueando la conmutación y las consultas de datos.
  * En `rfc.service.ts`, se restringió la consulta de expedientes para el rol `PU-01` (Solicitante) a aquellos donde `rfc.requesterId === user.id`.

### 2.5. Fase 5: Limpieza del Modelo de Datos y Sesiones
* **Brechas Encontradas:**
  * Filtrado permisivo que mezclaba sesiones y no aislaba el contexto de multitenancy.
* **Resolución Implementada:**
  * Endurecimiento de `useAuthStore`, `useProjectStore` y `useRfcStore`.
  * Los métodos demostrativos fueron aislados exclusivamente para soporte de suites de prueba automatizadas.
  * Se garantizó la preservación histórica: ninguna RFC, acta CCB ni registro forense previo fue eliminado, manteniendo la correlatividad de identificadores canónicos y hashes SHA-256.

### 2.6. Fase 6: Cobertura de Pruebas Automatizadas
* **Implementación:**
  * Se creó la suite integral `enterprise.rbac.spec.mjs` con 12 casos de prueba de seguridad, autorizaciones y SoD.
  * Ejecución exitosa de las 9 suites del sistema (`npm test`) y validación estática total (`npm run lint` y `npm run build`).

---

## 3. Estado Final de las Cuentas Corporativas

| Identificador | Nombre del Colaborador | Correo Institucional | Rol Principal | Rol Secundario | Proyectos Autorizados |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **USR-001** | Joan Cristian Medina Quispe | `jmedina@exodo.pe` | **PU-02** (Gestor) | **PU-01** (Solicitante) | PRJ-001, PRJ-002, PRJ-003 |
| **USR-002** | Renzo Antonio Antayhua Mamani | `rantayhua@exodo.pe` | **PU-03** (Arquitecto) | **PU-06** (Desarrollador) | PRJ-001, PRJ-002, PRJ-003 |
| **USR-003** | Augusto Joaquin Rivera Muñoz | `arivera@exodo.pe` | **PU-05** (Bibliotecario)| **PU-07** (Calidad/QA) | PRJ-001, PRJ-002, PRJ-003 |
| **USR-004** | Renzo Fernando Loyola Vilca Choque | `rloyola@exodo.pe` | **PU-04** (CCB) | *(Ninguno)* | PRJ-001, PRJ-002 *(Veto estricto: PRJ-003)* |

*Nota de seguridad:* Las credenciales son gestionadas localmente sin exponer secretos en el repositorio ni en documentos públicos.

---

## 4. Trazabilidad de Archivos Modificados

1. `prototype/src/services/auth.service.ts`: Hash SHA-256 + salt, política default-deny, tokens de sesión y matching parametrizado de rutas.
2. `prototype/src/store/useAuthStore.ts`: Gestión de credenciales, sesión única con un rol efectivo activo, saneamiento de estado.
3. `prototype/src/features/auth/LoginView.tsx`: Rediseño corporativo, campos email/password, selector condicional de rol asignado y banner de errores.
4. `prototype/src/components/layout/Topbar.tsx`: Supresión de Reset Demo, diseño empresarial de cabecera y filtrado de proyectos asignados.
5. `prototype/src/features/dashboard/DashboardView.tsx`: Limpieza de prefijos académicos en accesos directos e indicadores ejecutivos.
6. `prototype/src/features/rfcs/RfcListView.tsx`: Restricción de visibilidad por propiedad (ownership) para solicitantes.
7. `prototype/src/features/rfcs/RfcDetailView.tsx`: Bloqueo de acceso no autorizado a expedientes ajenos y sanitización de botones/pestañas.
8. `prototype/src/routes/AppRouter.tsx`: Protección integral de rutas con `RoleGuard` según matriz de permisos.
9. `prototype/src/services/project.service.ts`: Control de multitenancy y bloqueo de proyectos no asignados.
10. `prototype/src/store/useProjectStore.ts`: Validación de seguridad en la conmutación de proyectos activos.
11. `prototype/src/services/rfc.service.ts`: Filtros de consulta multitenant y protección de propiedad.
12. `prototype/package.json`: Incorporación de la suite `enterprise.rbac.spec.mjs` en el script `test`.
13. `prototype/src/services/enterprise.rbac.spec.mjs`: Suite de 12 pruebas automatizadas de seguridad corporativa.

---

## 5. Dictamen de Conformidad y Cierre

El sistema **TraceFlow SCM** cumple satisfactoriamente con los criterios de aceptación empresariales, operando bajo las especificaciones de los estándares IEEE 828 e ISO/IEC/IEEE 12207.

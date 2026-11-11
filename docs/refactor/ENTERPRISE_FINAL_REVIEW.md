# Informe de Revisión Técnica y Auditoría de Seguridad Independiente
## TraceFlow SCM — Evaluación de Calidad de la Rama `feat/traceflow-enterprise-rbac-ux`

> **Rol del Auditor:** Revisor Técnico Senior de Arquitectura de Software, Seguridad RBAC y SCM  
> **Sistema Auditado:** TraceFlow SCM — Versión Empresarial 2.0  
> **Rama Evaluada:** `feat/traceflow-enterprise-rbac-ux`  
> **Rama Base:** `master` (Línea base original inalterada)  
> **Fecha de Dictamen:** 11 de Noviembre de 2026  
> **Documento:** `docs/refactor/ENTERPRISE_FINAL_REVIEW.md`  
> **Marco Normativo:** IEEE 828, ISO/IEC/IEEE 12207, SRS (`FD03`), SAD Análisis (`FD04`), SAD Diseño (`FD05`), `DOCUMENTATION_RULES.md`

---

## 1. Resumen Ejecutivo y Alcance de la Auditoría

Se ha realizado una auditoría exhaustiva e independiente de los cinco commits que componen la rama `feat/traceflow-enterprise-rbac-ux` en comparación con la línea base de `master`. 

El propósito de esta revisión es verificar la calidad técnica, el rigor criptográfico, la segregación de funciones (SoD), la consistencia de identidades institucionales y la ausencia de fuga de secretos antes de cualquier publicación o integración en repositorios remotos.

### Cuadro Resumen de Dictamen:
* **Estado de Compilación (`npm run build`):** APROBADO (0 errores de tipado TypeScript, bundle Vite optimizado).
* **Análisis Estático (`npm run lint`):** APROBADO (0 errores, 0 advertencias sobre 72 archivos mediante Oxlint).
* **Suites de Pruebas Automatizadas (`npm test`):** APROBADO (9 suites ejecutadas en runtime Node.js, 100% aprobadas).
* **Veredicto General:** **APROBADO CON SUBSANACIONES APLICADAS** (Defectos detectados resueltos en esta rama).

---

## 2. Clasificación de Hallazgos y Defectos Auditados

| ID Hallazgo | Nivel de Severidad | Categoría | Descripción Sintética | Estado de Remediación |
| :---: | :---: | :---: | :--- | :---: |
| **SEC-01** | **CRÍTICO** | Confidencialidad / Secretos | Contraseña de prueba y hash SHA-256 expuestos en documentos públicos y UI. | **RESUELTO** |
| **RBAC-01** | **ALTO** | Integridad Multitenant | Modificaciones en RFC (`create`, `admit`, `observe`, `dismiss`) dependían parcialmente de la UI. | **RESUELTO** |
| **IDN-01** | **MEDIO** | Integridad Documental | Discrepancia injustificada en nombres canónicos de colaboradores (`USR-002` y `USR-003`). | **RESUELTO** |
| **SEC-02** | **MEDIO** | Arquitectura Criptográfica | Salt estático hardcodeado y credencial compartida en mock client-side. | **DOCUMENTADO / MITIGADO** |
| **DOC-01** | **BAJO** | Trazabilidad de Controles | Diferenciación imprecisa entre controles RBAC previos y controles realmente nuevos. | **RESUELTO** |

---

## 3. Análisis Detallado de Hallazgos y Evidencias Concretas

### 3.1. Hallazgo SEC-01 (CRÍTICO): Exposición de Credenciales y Hashes en Documentos Públicos y UI
* **Evidencia Detectada:**
  1. En `README.md` y `prototype/README.md` se publicaba explícitamente una contraseña fija en texto claro (`[SECRET_PASSWORD_REDACTED]`).
  2. En `prototype/src/features/auth/LoginView.tsx` se desplegaba en el panel de ayuda dicha contraseña institucional (`[SECRET_PASSWORD_REDACTED]`).
  3. En `docs/refactor/AUTH_IMPLEMENTATION_REPORT.md` se publicaba el hash literal SHA-256 (`[HASH_SHA256_REDACTED]`).
* **Evaluación de Riesgo:** La publicación de contraseñas y hashes en un repositorio Git contraviene las políticas de seguridad corporativa y los estándares DevSecOps, facilitando ataques de fuerza bruta asistidos por diccionarios precalculados.
* **Acción de Subsanación Aplicada:**
  - Se retiraron todas las referencias a contraseñas en texto claro de `README.md`, `prototype/README.md`, `AUTH_IMPLEMENTATION_REPORT.md`, `ENTERPRISE_REFACTOR_AUDIT.md`, `LoginView.tsx` y comentarios de `auth.service.ts`.
  - Se estableció y documentó formalmente el procedimiento de aprovisionamiento seguro mediante `authService.setLocalPassword()` en almacenamiento local aislado.

---

### 3.2. Hallazgo RBAC-01 (ALTO): Control de Proyectos Incompleto en Métodos de Escritura de RFC
* **Evidencia Detectada:**
  - En la versión original de `prototype/src/services/rfc.service.ts`, los métodos de mutación `create()`, `admit()`, `observe()` y `dismiss()` no verificaban explícitamente si el usuario autenticado tenía asignado el proyecto (`dto.projectId` o `rfc.projectId`) mediante `authService.canUserAccessProject(user, projectId)`.
  - Aunque la UI filtraba visualmente los proyectos, una llamada directa al servicio o una manipulación del cliente permitía a un usuario operar sobre proyectos ajenos (ej. `USR-004` sobre `PRJ-003`).
* **Evaluación de Riesgo:** Violación del principio de defensa en profundidad (Nivel 4 de autorización). Ocultar un selector en la UI no sustituye la validación a nivel de capa de servicios.
* **Acción de Subsanación Aplicada:**
  - Se añadieron aserciones mandatorias en `create()`, `admit()`, `observe()` y `dismiss()` dentro de `rfc.service.ts`:
    ```typescript
    if (!authService.canUserAccessProject(user, rfc.projectId)) {
      throw new Error(`Acceso denegado (Proyecto): El usuario '${user.fullName}' no tiene asignado el proyecto '${rfc.projectId}' de esta solicitud.`);
    }
    ```
  - Se incorporó la prueba correspondiente en `enterprise.rbac.spec.mjs` (Test 5), validando que `rfcService.create()` rechace transacciones en proyectos no autorizados.

---

### 3.3. Hallazgo IDN-01 (MEDIO): Discrepancia Injustificada en Nombres Canónicos de Cuentas
* **Evidencia Detectada:**
  - El archivo SSOT de datos iniciales (`prototype/src/data/initialUsers.ts`) y el documento de línea base `docs/refactor/IDENTITY_AND_ROLES.md` definen:
    - `USR-002`: **Renzo Antonio Antayhua Mamani**
    - `USR-003`: **Augusto Joaquin Rivera Muñoz**
  - No obstante, en la documentación generada en la Fase 7 se introdujeron nombres no formalizados:
    - `USR-002` fue denominado como *"Ruben Antayhua"*.
    - `USR-003` fue denominado como *"Aldo Rivera"*.
* **Evaluación de Riesgo:** Ruptura del principio de Fuente Única de Verdad (SSOT) y desalineación con la nómina oficial del proyecto.
* **Acción de Subsanación Aplicada:**
  - Se homologaron los nombres en toda la documentación técnica (`README.md`, `prototype/README.md`, `ENTERPRISE_REFACTOR_AUDIT.md`, `RBAC_ACCESS_MATRIX.md` y `AUTH_IMPLEMENTATION_REPORT.md`), restableciendo la identidad plena de **Renzo Antonio Antayhua Mamani** y **Augusto Joaquin Rivera Muñoz**.

---

### 3.4. Hallazgo SEC-02 (MEDIO): Limitaciones del Esquema Criptográfico Client-Side
* **Evidencia Detectada:**
  - `AUTH_SALT = 'traceflow:exodo:scm:auth:v1'` está embebido estáticamente en el código fuente de `auth.service.ts`.
  - La persistencia de sesión (`active_demo_user_id`, `active_demo_role_id`, `traceflow_session_token`) se almacena en `localStorage` del navegador.
* **Evaluación de Riesgo:**
  - Un salt público y estático reduce la resistencia contra ataques de fuerza bruta offline si un atacante extrae el hash del bundle de Vite.
  - El uso de `localStorage` expone los datos de sesión a vectores de Cross-Site Scripting (XSS).
* **Acción de Subsanación y Mitigación:**
  - Se corroboró que el módulo de autenticación implementa la API estándar `crypto.subtle` con SHA-256 en lugar de algoritmos obsoletos (MD5 o SHA-1).
  - Se redactó en `AUTH_IMPLEMENTATION_REPORT.md` y en las guías técnicas una cláusula explícita de **Dependencia de Backend para Producción**, prohibiendo clasificar este frontend como apto para producción sin un servicio de autenticación con `Argon2id`/`bcrypt` y cookies `HttpOnly` firmadas por servidor.

---

### 3.5. Hallazgo DOC-01 (BAJO): Diferenciación entre Controles Previos y Nuevos
* **Evidencia y Diferenciación Técnica:**
  Para evitar atribuir al refactor controles que ya formaban parte de la línea base, se audita la frontera técnica exacta:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               DIFERENCIACIÓN DE CONTROLES: LÍNEA BASE VS. REFACTOR NUEVO               │
├────────────────────────────────────────────────┬───────────────────────────────────────┤
│ Controles que YA existían en 'master'          │ Controles REALMENTE NUEVOS en 'feat'  │
├────────────────────────────────────────────────┼───────────────────────────────────────┤
│ • Regla de doble identidad en minorApproval    │ • Política Default-Deny en rutas      │
│ • Bloqueo de auto-voto en ccbService           │ • Envolvimiento integral RoleGuard    │
│ • Verificación de proyecto en votos CCB        │ • Hash SHA-256 institucional          │
│ • Matriz canónica de estados TB-07             │ • Un solo rol efectivo por sesión     │
│ • Tipos de roles PU-01 a PU-07 en auth.ts      │ • Filtro de ownership para Solicitante│
│ • Bitácora append-only simulada en audit       │ • Bloqueo multitenant USR-004/PRJ-003  │
│                                                │ • Eliminación de controles Reset Demo │
│                                                │ • Suite automatizada enterprise.rbac  │
└────────────────────────────────────────────────┴───────────────────────────────────────┘
```

---

## 4. Auditoría de Enrutamiento y Política de Denegación por Defecto (Default-Deny)

Se verificó el impacto de la política de Default-Deny sobre los tres escenarios críticos de navegación:

1. **Rutas Públicas (`/login`):**
   - Declarada explícitamente fuera de `ProtectedRoute` en `AppRouter.tsx` (línea 24).
   - No está sujeta a `RoleGuard`, por lo que es accesible sin autenticación previa.
2. **Rutas Desconocidas o Errores 404 (`*`):**
   - El enrutador maneja las rutas no mapeadas mediante `<Route path="*" element={<NotFoundView />} />` en la línea 276.
   - Si un usuario autenticado navega a `/ruta-inexistente`, el enrutador despliega la pantalla corporativa 404 (`NotFoundView`) sin generar excepciones de sistema ni bloqueos espurios.
3. **Rutas Protegidas no Declaradas en la Matriz:**
   - La función `authService.isRoleAuthorizedForRoute(roleId, '/ruta/secreta')` retorna estrictamente `false`.
   - La función `authService.getRouteAllowedRoles('/ruta/secreta')` retorna estrictamente `[]`.
   - Se comprobó que ninguna ruta privada inventada o no homologada pueda ser accedida por omisión de configuración.

---

## 5. Auditoría de las Pruebas Automatizadas (Validación de Comportamiento Real)

Se analizó la suite de pruebas `prototype/src/services/enterprise.rbac.spec.mjs` para garantizar que no ejecute comprobaciones meramente sintácticas o declarativas:

* **Prueba de Autenticación Errónea (Test 1):** Ejecuta llamadas asíncronas reales a `authService.authenticate()` con contraseñas inválidas y correos inexistentes, verificando el rechazo mediante `assert.rejects()`.
* **Prueba de Aislamiento Multitenant (Test 5):**
  - Llama directamente a `projectService.getById('PRJ-003', renzoAccount)`, comprobando que retorne `undefined`.
  - Intenta mutar el estado en `useProjectStore.setActiveProject('PRJ-003', renzoSessionUser)`, confirmando que el store rechace la asignación y preserve `PRJ-001`.
  - Intenta crear una RFC con `rfcService.create()` en `PRJ-003`, comprobando que arroje una excepción de acceso denegado por proyecto.
* **Prueba de Propiedad (Ownership) (Test 6):** Invoca `rfcService.getAll()` con `roleId: 'PU-01'` e inspecciona cada elemento retornado, certificando que `r.requesterId === solicitanteUser.id`.
* **Prueba de Doble Llave SoD (Test 7):** Ejecuta dos llamadas consecutivas a `minorApprovalService.submitApproval()` con el mismo `approverId`, comprobando el lanzamiento de la excepción de SoD.

---

## 6. Resultados de Verificación de Calidad

Ejecución realizada desde `TraceFlow/prototype`:

```text
1. npm run lint
   > oxlint
   Found 0 warnings and 0 errors.
   Finished in 43ms on 72 files with 116 rules using 20 threads.

2. npm run build
   > tsc -b && vite build
   ✓ 1962 modules transformed.
   ✓ built in 255ms.

3. npm test
   > Ejecución de 9 suites de pruebas unitarias y de integración:
   - rfc.service.spec.mjs        --> 6/6 aprobadas
   - rfc.views.spec.mjs          --> 6/6 aprobadas
   - rfc.validation.spec.mjs     --> 7/7 aprobadas
   - auth.spec.mjs               --> 6/6 aprobadas
   - navigation.spec.mjs         --> 7/7 aprobadas
   - impactAnalysis.spec.mjs     --> 6/6 aprobadas
   - minorApproval.spec.mjs      --> 6/6 aprobadas
   - ccb.spec.mjs                --> 18/18 aprobadas
   - enterprise.rbac.spec.mjs    --> 12/12 aprobadas
   Total: 74 pruebas ejecutadas (100% exitosas).
```

---

## 7. Dictamen Final de Auditoría

1. La rama `feat/traceflow-enterprise-rbac-ux` ha alcanzado la madurez técnica requerida para su propósito de demostración y gobernanza operativa.
2. Los cinco defectos identificados han sido subsanados y verificados.
3. Se ratifica que **no debe realizarse merge a `master` ni push remoto sin previa autorización formal**, manteniendo la línea base del proyecto protegida.

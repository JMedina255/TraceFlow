# Matriz de Control de Acceso Basado en Roles (RBAC) y Segregación de Funciones (SoD)
## TraceFlow SCM — Especificación Normativa de Autorización y Seguridad

> **Organización Cliente:** ÉXODO S.A.C.  
> **Sistema:** TraceFlow SCM — Versión Empresarial 2.0  
> **Fecha:** 11 de Noviembre de 2026  
> **Documento:** `docs/refactor/RBAC_ACCESS_MATRIX.md`  
> **Marco Normativo:** IEEE 828, ISO/IEC/IEEE 12207, SRS (`FD03`), SAD Análisis (`FD04`), SAD Diseño (`FD05`)

---

## 1. Modelo de Autorización en Cuatro Niveles

Para garantizar que la seguridad no dependa únicamente de la ocultación visual de componentes, TraceFlow SCM implementa una política de **Defensa en Profundidad** estructurada en cuatro niveles independientes:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   NIVEL 1: NAVEGACIÓN Y MENÚ LATERAL                   │
│      Filtrado dinámico de opciones y accesos según el rol efectivo     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   NIVEL 2: ENRUTAMIENTO Y RUTAS PROTEGIDAS             │
│        Guardas de ruta (RoleGuard) con política Default-Deny estricta  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   NIVEL 3: ACCIONES, BOTONES Y FORMULARIOS             │
│      Validación condicional de operaciones UI y bloqueo de acciones    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   NIVEL 4: SERVICIOS Y CONSULTAS DE DATOS              │
│       Filtros multitenant, verificación de propiedad y SoD en API      │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Nivel 1 (Navegación Lateral y Accesos Directos):** El componente `Sidebar` y los accesos rápidos del `Dashboard` consultan `getNavigationForRole(activeRoleId)`. Si un rol no tiene permisos sobre un módulo, la opción no se renderiza.
2. **Nivel 2 (Rutas Protegidas en Enrutador):** `AppRouter.tsx` encapsula cada ruta protegida mediante `RoleGuard`. La función `authService.isRoleAuthorizedForRoute(path, roleId)` evalúa la coincidencia exacta o parametrizada (`/rfcs/:rfcId`). Si la ruta no está explícitamente concedida al rol, se aplica **Denegación por Defecto (Default-Deny)** y se redirige a `/dashboard` con alerta de acceso no autorizado.
3. **Nivel 3 (Acciones, Formularios y Botones):** En vistas detalladas (p. ej. `RfcDetailView.tsx`), los controles para emitir informes técnicos, registrar votos CCB, autorizar cambios menores o realizar Check-In se deshabilitan o condicionan a la concurrencia del rol requerido y las reglas SoD. Nunca se asume que un botón oculto sea un control de seguridad suficiente.
4. **Nivel 4 (Servicios y Consultas de Datos):** Los servicios de negocio (`rfc.service.ts`, `project.service.ts`, `ccb.service.ts`, `minorApproval.service.ts`) validan la identidad física, el rol activo y el proyecto autorizado previo a persistir o devolver datos:
   - Los solicitantes (`PU-01`) solo pueden consultar expedientes creados por su propia identidad.
   - Los usuarios asignados a proyectos específicos (p. ej. `USR-004` sin acceso a `PRJ-003`) son bloqueados a nivel de servicio si intentan consultar o transicionar elementos de proyectos ajenos.

---

## 2. Catálogo Canónico de Roles de Seguridad (PU-01 a PU-07)

| Código | Denominación Canónica | Tipo de Rol | Descripción y Propósito en el Flujo SCM |
| :---: | :--- | :---: | :--- |
| **PU-01** | **Solicitante** | Operativo | Registra Solicitudes de Cambio (RFC), subsana observaciones formales y reporta incidencias de software. |
| **PU-02** | **Analista / Gestor de Configuración** | Gestión | Valida completitud, clasifica solicitudes (Mayor/Menor), gestiona proyectos y co-autoriza cambios menores. |
| **PU-03** | **Arquitecto / Especialista Técnico** | Técnico | Emite Informes Técnicos de Impacto multidisciplinario y co-autoriza cambios menores (Doble Llave). |
| **PU-04** | **Comité de Control de Cambios (CCB)** | Colegiado | Órgano decisional supremo; delibera colegiadamente y emite resoluciones vinculantes (ECN/ECO). |
| **PU-05** | **Bibliotecario / Administrador SCM** | Custodio | Custodio oficial de las tres bibliotecas; ejecuta Check-In a Maestra, administra bloqueos y congelamientos. |
| **PU-06** | **Desarrollador / Ingeniero de Software**| Técnico | Ejecuta cambios aprobados en la Biblioteca de Trabajo e implementa soluciones técnicas autorizadas. |
| **PU-07** | **Calidad / Equipo de Testing (QA)** | Certificación| Ejecuta pruebas de conformidad, reporta no conformidades y emite Certificados de Conformidad Técnica. |

---

## 3. Matriz de Autorización por Rutas y Módulos del Sistema

| Ruta del Sistema | Módulo Funcional | PU-01 | PU-02 | PU-03 | PU-04 | PU-05 | PU-06 | PU-07 | Política por Defecto |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/dashboard` | Tablero de Control Principal | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Acceso universal autenticado |
| `/rfcs` | Bandeja de Solicitudes (RFC) | ✅* | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | *PU-01 filtrado por ownership |
| `/rfcs/new` | Registro de Nueva Solicitud | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Exclusivo Solicitante |
| `/rfcs/:rfcId` | Expediente Detallado de RFC | ✅* | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | *PU-01 restringido a RFC propias |
| `/rfcs/:rfcId/edit` | Subsanación de Observaciones | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | *PU-01 creador del expediente |
| `/projects` | Catálogo de Proyectos | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Restringido a gestión y CCB |
| `/projects/:id` | Detalle y Configuración Proyecto | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Exclusivo Gestor |
| `/ecs` | Elementos de Configuración (ECS) | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | Bibliotecas de configuración |
| `/ecs/:ecsId` | Ficha Técnica de ECS | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | Detalle de activo SCM |
| `/ecns` | Órdenes de Cambio (ECN/ECO) | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | Ejecución de cambios |
| `/incidents` | Registro de Incidencias | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Solicitudes y reportes |
| `/audit` | Bitácora de Auditoría Forense | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | Pistas inmutables SHA-256 |
| `/reports` | Reportes Ejecutivos de Métricas | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | Informes de gobernanza |
| `/baseline` | Congelamiento de Líneas Base | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | Exclusivo Bibliotecario |

---

## 4. Matriz de Segregación de Funciones (Segregation of Duties - SoD)

La segregación de funciones previene el fraude, el error no detectado y la manipulación de artefactos en el ciclo de vida de configuración:

### 4.1. Regla SoD-01: Antiautoevaluación del Solicitante
* **Enunciado:** La identidad física que origina una Solicitud de Cambio (`rfc.requesterId`) tiene prohibido participar en cualquier rol decisional o de aprobación sobre dicho expediente.
* **Impacto en el Sistema:**
  * No puede admitir su propia RFC como Gestor (`CU-05`).
  * No puede evaluar el impacto técnico como Arquitecto (`CU-06`).
  * No puede emitir visto bueno en Cambios Menores (`CU-30`).
  * No puede votar en la sesión del CCB para dicho expediente (`CU-07`).
* **Implementación:** Verificado en `minorApprovalService.submitApproval()` y `ccbService.registerVote()`.

### 4.2. Regla SoD-02: Doble Llave en Cambios Menores (Two-Man Rule)
* **Enunciado:** La autorización delegada para solicitudes clasificadas como `CAMBIO_MENOR` requiere de manera obligatoria la concurrencia de dos aprobaciones:
  1. Aprobación del **Gestor de Configuración** (`PU-02`).
  2. Aprobación del **Arquitecto de Software** (`PU-03`).
* **Condición Criptográfica e Identidad:** Ambas aprobaciones deben ser ejecutadas por **dos identidades físicas distintas** (`gestorId !== arquitectoId`). Una misma persona que ostente ambos roles no puede auto-completar la doble llave.
* **Implementación:** Verificado en `minorApprovalService.submitApproval()`:
  ```typescript
  if (existingApproval && existingApproval.approverId === approval.approverId) {
    throw new Error('Conflicto SoD: La doble llave requiere dos identidades físicas distintas.');
  }
  ```

### 4.3. Regla SoD-03: Incompatibilidad entre Desarrollo y Aseguramiento de Calidad (QA)
* **Enunciado:** El Ingeniero de Software (`PU-06`) que implementó un cambio o emitió la orden técnica en la Biblioteca de Trabajo no puede fungir como el Auditor de Calidad (`PU-07`) que emite el Certificado de Conformidad para dicho cambio.
* **Implementación:** Verificado en los flujos de certificación de pruebas y no conformidades.

### 4.4. Regla SoD-04: Exclusividad en la Custodia de Bibliotecas
* **Enunciado:** Las operaciones de transferencia hacia la Biblioteca Maestra (*Check-In a Maestra*) y el congelamiento formal de Líneas Base (*Baseline*) son de competencia exclusiva y reservada del **Bibliotecario** (`PU-05`).
* **Implementación:** Ni el Desarrollador (`PU-06`) ni el Gestor (`PU-02`) pueden ejecutar transferencias directas a la rama de custodia maestra.

### 4.5. Regla SoD-05: Unicidad e Inmutabilidad del Voto en el CCB
* **Enunciado:** Cada miembro del Comité de Control de Cambios emite a lo sumo un único voto fundamentado (APROBAR, RECHAZAR, ABSTENERSE) por expediente deliberado. La identidad del votante proviene inmutablemente de la sesión activa, impidiendo votos por encargo o suplantación.
* **Implementación:** Verificado en `ccbService.registerVote()`.

---

## 5. Aislamiento Multitenant de Proyectos por Identidad

El acceso a proyectos se encuentra particionado estrictamente a nivel de la identidad del usuario y validado en todas las capas operativas:

| Cuenta | Usuario | Proyectos Asignados | Proyectos Prohibidos | Comportamiento del Sistema |
| :---: | :--- | :---: | :---: | :--- |
| **USR-001** | Joan Cristian Medina Quispe | PRJ-001, PRJ-002, PRJ-003 | Ninguno | Acceso pleno a los 3 proyectos institucionales. |
| **USR-002** | Renzo Antonio Antayhua Mamani | PRJ-001, PRJ-002, PRJ-003 | Ninguno | Acceso técnico y de desarrollo en los 3 proyectos. |
| **USR-003** | Augusto Joaquin Rivera Muñoz | PRJ-001, PRJ-002, PRJ-003 | Ninguno | Acceso de custodia y QA en los 3 proyectos. |
| **USR-004** | Renzo Fernando Loyola Vilca Choque | PRJ-001, PRJ-002 | **PRJ-003** *(Veto Estricto)* | Selector no incluye PRJ-003. Conmutación rechazada. Consultas sobre PRJ-003 bloqueadas. |

---

## 6. Verificación y Cumplimiento Normativo

Esta matriz es verificada automáticamente por la suite de pruebas `prototype/src/services/enterprise.rbac.spec.mjs`, garantizando que ninguna actualización futura degrade los controles de acceso institucionales de ÉXODO S.A.C.

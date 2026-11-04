# Auditoría de Interfaces y Limpieza Visual — TraceFlow SCM
## Fases 00 y 01: Diagnóstico de Metadatos Académicos y Plan de Refactorización

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software  
> **Organización Cliente:** ÉXODO S.A.C.  
> **Fecha de Auditoría:** Noviembre 2026  
> **Línea Base Git (Recovery Point):** `a12e44f56655f7333c9752b26c8359df8735afc6` (Rama: `master`)  
> **Objetivo:** Identificar la contaminación visual provocada por nomenclaturas académicas, códigos de trazabilidad interna y notas docentes para transicionar la plataforma hacia una experiencia de usuario empresarial, sin alterar las reglas de negocio ni la trazabilidad con los documentos SRS (FD03) y SAD (FD04/FD05).

---

## 1. Resumen de la Auditoría del Repositorio

Se realizó una inspección exhaustiva de los módulos de la aplicación web SPA (`prototype/src/`) y la documentación técnica de soporte (`docs/`, `FD01`, `FD03`, `FD04`, `FD05`). Se identificaron los siguientes aspectos clave:

### 1.1. Estado de Interfaces Implementadas vs. Provisionales
- **Interfaces Implementadas (5 pantallas):**
  - `SCREEN-01` (`/login`): Portal de acceso con selección de identidades simuladas.
  - `SCREEN-02` (`/dashboard`): Dashboard general con KPIs, accesos directos y catálogo de módulos.
  - `SCREEN-05` (`/rfcs`): Bandeja de Solicitudes de Cambio con filtros de estado y aislamiento de proyectos.
  - `SCREEN-06` (`/rfcs/:rfcId`): Expediente 360° interactivo con panel contextual según estado de la RFC.
  - `SCREEN-07` (`/rfcs/new` y `/rfcs/:rfcId/edit`): Wizards guiados para creación (`CU-04`) y subsanación (`CU-04.1`).
- **Interfaces Provisionales con Placeholder Guiado (15 pantallas):**
  - Gestionadas a través de `ScreenPlaceholder.tsx` (`/projects`, `/projects/:projectId`, `/ecns`, `/ecns/:ecnId`, `/ecs`, `/ecs/:ecsId`, `/ecs/:ecsId/history`, `/scm/operations`, `/baselines`, `/incidents`, `/incidents/:incidentId`, `/audit`, `/reports`, `/admin/users`, `/qa/validation/:rfcId`).

### 1.2. Contaminación Visual Identificada
Se detectó la presencia masiva de identificadores de artefactos académicos expuestos directamente al usuario final:
- **Prefijos de Casos de Uso y Requisitos:** `CU-04`, `CU-05`, `CU-06`, `CU-07`, `CU-08`, `CU-30`, `CU-04.1`, `RF-04`, `RN-01`, `RN-06`, `RN-07`, `RN-09`.
- **Prefijos Arquitecturales y de Vistas:** `DG-04`, `DG-05`, `DG-11`, `SCREEN-01` a `SCREEN-20`, `WF-01` a `WF-20` (y sus variantes `WF-06A/B/C`), patrones `PRES-01` a `PRES-10`, nodos `NAV-01` a `NAV-28`.
- **Códigos de Roles Académicos:** `PU-01`, `PU-02`, `PU-03`, `PU-04`, `PU-05`, `PU-06`, `PU-07`.
- **Referencias a Documentos Internos:** `FD03`, `FD04`, `FD05`, `SRS`, `SAD`, `ADR-006`, menciones explícitas a "Excepción E1 del SRS", "Flujo alternativo A2", etc.
- **Textos Académicos Docentes:** Justificaciones metodológicas orientadas a evaluación universitaria en lugar de comunicación operativa empresarial.

### 1.3. Mecanismos de Demostración y Simulación
- Conmutador de roles demo en `Topbar.tsx` mediante `switchRole()` y `switchUser()`.
- Botón de reinicio de estado demo (`Reset Demo`).
- Alertas de Segregación de Funciones (SoD) redactadas con jerga académica ("El caso de uso CU-04 está reservado exclusivamente al rol PU-01...").
- Estas capacidades se conservarán intactas en su lógica subyacente durante las Fases 00 y 01, modernizando únicamente su redacción y apariencia visual.

---

## 2. Matriz de Auditoría y Plan de Refactorización Visual

| Módulo / Pantalla | Archivo Fuente | Problema Identificado | Cambio Propuesto | Nivel de Riesgo |
| :--- | :--- | :--- | :--- | :---: |
| **Navegación Lateral** | `Sidebar.tsx` | Título con código académico `Módulos del Sistema (DG-04)`, badge `8 Paquetes`, y badges `S01..S20` en cada ítem de navegación. | Cambiar a `Módulos del sistema`, retirar badge de paquetes y eliminar badges `Sxx` de las etiquetas de menú. | Bajo |
| **Definición de Menús** | `navigation.ts` | Nombres de sección con numeración de paquetes (`2. Gestión de Proyectos`, `5. Control de Cambios`, etc.). | Renombrar a títulos empresariales limpios (`Gestión de proyectos`, `Control de cambios`, `Gestión de configuración`, etc.). | Bajo |
| **Barra Superior** | `Topbar.tsx` | Visualización en vivo del código de rol `{activeRoleId}` (`PU-01`), encabezado `Cambiar Rol Activo (SoD)` y código de equipo `C-SharkTeam`. | Ocultar códigos `PU-xx` de la cabecera principal, conservar nombre del rol empresarial y suavizar etiquetas del menú desplegable. | Bajo |
| **Portal de Acceso** | `LoginView.tsx` | Comentarios y textos visibles de demostración académica: `Autenticación institucional simulada (ADR-006)`. | Reemplazar por `Control de acceso y autenticación corporativa` y simplificar avisos informativos. | Bajo |
| **Dashboard** | `DashboardView.tsx` | Badge `Fase V — CU-04 Registro de Solicitud de Cambio (RFC)`, título `Módulos del Sistema (Arquitectura DG-04)` y mención de rol `({activeRoleId})`. | Cambiar por `Panel de Control SCM`, título `Módulos del sistema` y mostrar únicamente el cargo/rol funcional sin código `PU-xx`. | Bajo |
| **Registro de RFC** | `RfcCreateView.tsx` | Badges de encabezado `CU-04 / RF-04`, `SCREEN-07 / WF-07`, `PRES-06`. Alerta SoD con cita normativa a `FD03 / TB-09 / DG-05 / PU-01`. Textos de excepción del SRS (`Excepción E1`, `Flujo alternativo A2`). | Eliminar badges académicos. Sustituir la alerta SoD por redacción empresarial clara. Limpiar mensajes de validación y confirmación. | Medio |
| **Bandeja de RFC** | `RfcListView.tsx` | Badges `CU-04..08, CU-30`, `SCREEN-05 / WF-05`, `PRES-03`, `14 Estados Oficiales (TB-07)`. Columnas y filtros con mención a `TB-07`. Banner explicativo con cita a `IEEE 828` y `DG-11`. | Retirar badges de encabezado. Simplificar selector de estados a `Todos los estados` y columnas a `Estado`. Redactar aviso de ciclo de vida con tono profesional. | Bajo |
| **Expediente 360°** | `RfcDetailView.tsx` | Metadatos visibles `SCREEN-06 • NAV-06 • PRES-04/07`, `Variante WF-06A`, títulos de pestaña con `CU-04 / RN-01`, `CU-06 / RN-05`, `CU-07 / CU-30`, `ECN/ECO - CU-08`, `PU-01..PU-07`, alertas SoD con códigos académicos. | Mantener toda la funcionalidad interactiva de revisión y estados pero renombrar pestañas y paneles con terminología funcional clara (p. ej. `Información general`, `Análisis técnico`, `Dictamen del comité`). | Medio |
| **Subsanación RFC** | `RfcEditView.tsx` | Subtítulo con `CU-04.1 • WF-07 • DG-11`, bloqueo SoD con `PU-01`, citas a `IEEE 828`, `DG-11`, `RN-01`, `RN-07` y modales con `CU-04.1 A1`. | Limpiar códigos de proceso. Redactar el bloqueo de permisos y confirmación de desistimiento con lenguaje de negocio claro. | Bajo |
| **Pantallas Provisionales** | `ScreenPlaceholder.tsx` | Badges prominentes `SCREEN-xx`, `Wireframe: WF-xx`, cajas de `Casos de Uso Gobernados`, citas al SAD (FD05) y banners de fases académicas. | Transformar el componente a una vista empresarial de "Módulo en preparación / Próxima habilitación", destacando el propósito del módulo y roles autorizados. | Bajo |

---

## 3. Estado de la Línea Base y Validación Inicial (Fase 00)

Antes de iniciar cualquier edición de código, se ejecutaron las herramientas de verificación sobre el commit inicial:

```bash
# Entorno: prototype/
npm run lint   # Oxlint: 53 archivos auditados -> 0 warnings, 0 errors
npm run build  # tsc -b && vite build -> Compilación exitosa (dist/ generado)
npm test       # 3 suites de pruebas automatizadas -> 19 tests aprobados (0 fallos)
```

**Resultado de la Validación Inicial:**
- Repositorio íntegro, sin errores preexistentes de sintaxis, tipos ni lógica de negocio.
- Listo para aplicar las modificaciones de la Fase 01 en commits incrementales sobre la rama `master`.

# Índice Oficial de Capturas del Prototipo React — TraceFlow SCM

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software  
> **Organización:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Línea Base Documental:** Etapa 06 (Evidencia de Implementación en Prototipo)  
> **Fecha de Captura:** 12/11/2026 | **Total de Capturas:** 17  
> **Entorno de Ejecución:** React 19 + TypeScript + Vite en puerto 4173 | Chrome Headless 1440x900  

---

## 1. Resumen Consolidado de Capturas por Subsistema

| Categoría | Subdirectorio | Capturas | Enfoque Funcional | Roles Evaluados | Estado |
|---|---|:---:|---|---|:---:|
| **Autenticación** | `autenticacion/` | 1 | Acceso seguro institucional, hashing local SHA-256 | Público | ✅ Verificado |
| **Dashboards** | `dashboard/` | 3 | Vistas adaptativas por rol con segregación SoD | PU-01, PU-02, PU-04 | ✅ Verificado |
| **Flujo RFC** | `rfc/` | 4 | Bandeja general, expediente 360°, registro y subsanación | PU-01, PU-02 | ✅ Verificado |
| **Análisis de Impacto** | `analisis-impacto/` | 1 | Evaluación técnica multidimensional y riesgos | PU-03 | ✅ Verificado |
| **Deliberación CCB** | `ccb/` | 1 | Votación colegiada, quórum y resolución mayor | PU-04 | ✅ Verificado |
| **Autorizaciones** | `autorizaciones/` | 1 | Gobernanza delegada doble llave para cambio menor | PU-02 + PU-03 | ✅ Verificado |
| **Vistas de Soporte** | `soporte/` | 2 | Errores controlados 404 Not Found y 403 Forbidden | Multi-rol / SoD | ✅ Verificado |
| **Placeholders** | `placeholders/` | 4 | Demostración de rutas secundarias SCM y bibliotecas | PU-02, PU-05 | ✅ Verificado |
| **TOTAL** | `docs/assets/capturas/` | **17** | **Cobertura Integral de Interfaces del Prototipo** | **7 Roles Canónicos** | **✅ 100%** |

---

## 2. Catálogo Maestro de Capturas de Interfaz

| # | Pantalla | Archivo de Captura | Ruta URL | Rol Activo | Tamaño | Componente React | Descripción / Evidencia Técnica |
|:---:|---|---|---|---|:---:|---|---|
| 1 | `SCREEN-01` | [`SCREEN-01_login_institucional.png`](autenticacion/SCREEN-01_login_institucional.png) | `/login` | Público (Sin sesión) | 50,216 bytes | `LoginView.tsx` | Portal de Acceso Institucional y Selección de Rol — Valida CU-01, RF-01, RNF-01 y patrón PRES-01. |
| 2 | `SCREEN-02` | [`SCREEN-02_dashboard_solicitante.png`](dashboard/SCREEN-02_dashboard_solicitante.png) | `/dashboard` | PU-01 (Solicitante) | 104,525 bytes | `DashboardView.tsx` | Dashboard Adaptativo: Vista Solicitante — Valida CU-04, CU-04.1, RF-02 y patrón PRES-02 adaptativo para PU-01. |
| 3 | `SCREEN-02` | [`SCREEN-02_dashboard_gestor.png`](dashboard/SCREEN-02_dashboard_gestor.png) | `/dashboard` | PU-02 (Gestor de Configuración) | 118,027 bytes | `DashboardView.tsx` | Dashboard Adaptativo: Vista Gestor de Configuración — Valida CU-05, CU-30, RF-04, RF-07 y patrón PRES-02 adaptativo para PU-02. |
| 4 | `SCREEN-02` | [`SCREEN-02_dashboard_ccb.png`](dashboard/SCREEN-02_dashboard_ccb.png) | `/dashboard` | PU-04 (Comité de Control de Cambios) | 115,850 bytes | `DashboardView.tsx` | Dashboard Adaptativo: Vista Comité CCB — Valida CU-07, RF-06 y patrón PRES-02 adaptativo para PU-04. |
| 5 | `SCREEN-05` | [`SCREEN-05_bandeja_general_rfcs.png`](rfc/SCREEN-05_bandeja_general_rfcs.png) | `/rfcs` | PU-02 (Gestor) / Multi-rol | 121,696 bytes | `RfcListView.tsx` | Bandeja General de Solicitudes de Cambio (Filtros y Búsqueda) — Valida CU-05, RF-04, navegación NAV-05 y patrón PRES-03. |
| 6 | `SCREEN-06` | [`SCREEN-06_expediente_360_rfc.png`](rfc/SCREEN-06_expediente_360_rfc.png) | `/rfcs/RFC-2026-0001` | PU-02 (Gestor) | 115,919 bytes | `RfcDetailView.tsx` | Expediente Integral 360° de Solicitud de Cambio — Valida CU-04..CU-08, RF-04..RF-08, navegación NAV-06 y patrón PRES-04. |
| 7 | `SCREEN-07` | [`SCREEN-07_captura_rfc.png`](rfc/SCREEN-07_captura_rfc.png) | `/rfcs/new` | PU-01 (Solicitante) | 101,947 bytes | `RfcCreateView.tsx` | Portal de Captura y Registro de Nueva RFC — Valida CU-04, RF-03, navegación NAV-07 y patrón PRES-06. |
| 8 | `SCREEN-07` | [`SCREEN-07_subsanacion_rfc.png`](rfc/SCREEN-07_subsanacion_rfc.png) | `/rfcs/RFC-2026-0001/edit` | PU-01 (Solicitante) | 64,740 bytes | `RfcEditView.tsx` | Consola de Subsanación de RFC Observada — Valida CU-04.1, RF-03, RN-04, navegación NAV-08 y patrón PRES-05. |
| 9 | `SCREEN-08` | [`SCREEN-08_analisis_impacto_tecnico.png`](analisis-impacto/SCREEN-08_analisis_impacto_tecnico.png) | `/rfcs/RFC-2026-0001/impact-analysis` | PU-03 (Arquitecto / Especialista) | 69,678 bytes | `RfcImpactAnalysisView.tsx` | Consola de Análisis de Impacto Técnico Dimensional — Valida CU-06, RF-05, navegación NAV-09 y patrón PRES-07. |
| 10 | `SCREEN-09` | [`SCREEN-09_sala_deliberacion_ccb.png`](ccb/SCREEN-09_sala_deliberacion_ccb.png) | `/rfcs/RFC-2026-0001/ccb-deliberation` | PU-04 (Miembro del CCB) | 69,517 bytes | `RfcCcbDeliberationView.tsx` | Sala de Deliberación y Votación Colegiada del CCB — Valida CU-07, RF-06, RN-05, navegación NAV-10 y patrón PRES-07. |
| 11 | `SCREEN-10` | [`SCREEN-10_autorizacion_cambio_menor.png`](autorizaciones/SCREEN-10_autorizacion_cambio_menor.png) | `/rfcs/RFC-2026-0002/minor-approval` | PU-02 (Gestor) y PU-03 (Arquitecto) | 120,718 bytes | `RfcMinorApprovalView.tsx` | Consola de Autorización Delegada de Cambio Menor — Doble Llave — Valida CU-30, RF-07, RN-01, RN-05, navegación NAV-11 y patrón PRES-07. |
| 12 | `SOPORTE-01` | [`SOPORTE-01_error_404_not_found.png`](soporte/SOPORTE-01_error_404_not_found.png) | `/ruta-inexistente-404` | Público / Autenticado | 67,596 bytes | `NotFoundView.tsx` | Vista Institucional de Error 404 (Recurso No Encontrado) — Valida robustez UX, manejo de excepciones de enrutamiento y patrón PRES-09. |
| 13 | `SOPORTE-02` | [`SOPORTE-02_error_403_access_denied.png`](soporte/SOPORTE-02_error_403_access_denied.png) | `/projects (bajo PU-01)` | PU-01 (Solicitante sin permiso) | 62,627 bytes | `AccessDeniedView.tsx` | Vista de Acceso Denegado (403 Forbidden por RoleGuard) — Valida Segregación de Funciones (SoD), RoleGuard institucional, RNF-01 y patrón PRES-09. |
| 14 | `SCREEN-03` | [`SCREEN-03_directorio_proyectos_placeholder.png`](placeholders/SCREEN-03_directorio_proyectos_placeholder.png) | `/projects` | PU-02 (Gestor) | 100,883 bytes | `ScreenPlaceholder.tsx` | Directorio de Proyectos (Demostración ScreenPlaceholder) — Valida CU-02, CU-03, RF-02, navegación NAV-03 y componente reutilizable ScreenPlaceholder. |
| 15 | `SCREEN-12` | [`SCREEN-12_explorador_ecs_placeholder.png`](placeholders/SCREEN-12_explorador_ecs_placeholder.png) | `/ecs` | PU-05 (Bibliotecario) | 108,717 bytes | `ScreenPlaceholder.tsx` | Explorador de ECS y 3 Bibliotecas (ScreenPlaceholder) — Valida CU-09, RF-09, navegación NAV-14 y arquitectura de almacenamiento DG-D04. |
| 16 | `SCREEN-13` | [`SCREEN-13_operaciones_scm_placeholder.png`](placeholders/SCREEN-13_operaciones_scm_placeholder.png) | `/scm/operations` | PU-05 (Bibliotecario) | 111,080 bytes | `ScreenPlaceholder.tsx` | Consola de Operaciones Check-Out/In (ScreenPlaceholder) — Valida CU-10, CU-11, CU-12, RF-10, RF-11, navegación NAV-16 y DG-DSEQ-10/12. |
| 17 | `SCREEN-17` | [`SCREEN-17_lineas_base_placeholder.png`](placeholders/SCREEN-17_lineas_base_placeholder.png) | `/baselines` | PU-05 (Bibliotecario) | 106,294 bytes | `ScreenPlaceholder.tsx` | Gestión de Líneas Base y Rollback (ScreenPlaceholder) — Valida CU-20, CU-21, RF-15, navegación NAV-22 y DG-DSEQ-20/21. |

---

## 3. Protocolo de Captura y Reproducibilidad

Las capturas fueron tomadas de forma 100% automatizada y reproducible mediante:
1. **Compilación previa:** `npm run build` en `prototype/` para garantizar la generación de bundles optimizados.
2. **Servidor local:** `npx vite preview --port 4173` sirviendo la distribución productiva.
3. **Automatizador:** Script Python Selenium `docs/scripts/diagramas/capture_screens.py` con navegador Google Chrome en modo Headless (`--headless=new`) y resolución fija de 1440 × 900 píxeles.
4. **Inyección de Sesión:** Simulación de autenticación mediante el servicio `storageService` escribiendo claves versionadas `traceflow_demo_v1_*` en `localStorage` antes de cada navegación.

*Índice generado automáticamente en la Etapa 06 — TraceFlow SCM.*

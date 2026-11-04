import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Shield,
  FolderGit2,
  FileCode2,
  Boxes,
  GitPullRequest,
  LifeBuoy,
  History,
  BarChart3,
} from 'lucide-react';
import type { CanonicalRoleId } from '../types';

/**
 * Matriz Centralizada de Permisos por Ruta (Fuente Única de Verdad - SSOT)
 * Define qué roles canónicos (PU-01 a PU-07) tienen autorización para acceder a cada ruta.
 * Utilizado de manera consistente por Sidebar, AppRouter, RouteGuard y authService.
 */
export const ROUTE_PERMISSIONS: Record<string, CanonicalRoleId[]> = {
  '/dashboard': ['PU-01', 'PU-02', 'PU-03', 'PU-04', 'PU-05', 'PU-06', 'PU-07'],
  '/projects': ['PU-02', 'PU-03', 'PU-04', 'PU-05'],
  '/projects/:projectId': ['PU-02', 'PU-03', 'PU-04', 'PU-05'],
  '/rfcs': ['PU-01', 'PU-02', 'PU-03', 'PU-04', 'PU-05', 'PU-06', 'PU-07'],
  '/rfcs/new': ['PU-01'], // Exclusivo Solicitante (CU-04)
  '/rfcs/:rfcId': ['PU-01', 'PU-02', 'PU-03', 'PU-04', 'PU-05', 'PU-06', 'PU-07'],
  '/rfcs/:rfcId/edit': ['PU-01'], // Exclusivo Solicitante (CU-04.1)
  '/rfcs/:rfcId/impact-analysis': ['PU-03'], // Exclusivo Arquitecto (CU-06)
  '/rfcs/:rfcId/ccb-deliberation': ['PU-04'], // Exclusivo Comité CCB (CU-07)
  '/rfcs/:rfcId/minor-approval': ['PU-02', 'PU-03'], // Doble llave Gestor + Arquitecto (CU-30)
  '/rfcs/:rfcId/uat': ['PU-01'], // Exclusivo Solicitante (CU-29)
  '/ecns': ['PU-02', 'PU-04', 'PU-05', 'PU-06', 'PU-07'],
  '/ecns/:ecnId': ['PU-02', 'PU-04', 'PU-05', 'PU-06', 'PU-07'],
  '/ecs': ['PU-03', 'PU-05', 'PU-06', 'PU-07'],
  '/ecs/:ecsId': ['PU-03', 'PU-05', 'PU-06', 'PU-07'],
  '/ecs/:ecsId/history': ['PU-03', 'PU-05', 'PU-06', 'PU-07'],
  '/scm/operations': ['PU-05'], // Exclusivo Bibliotecario SCM (RN-04)
  '/baselines': ['PU-05'], // Exclusivo Bibliotecario SCM (RN-02, RN-08)
  '/qa/validation/:rfcId': ['PU-07'], // Exclusivo Calidad (RN-09)
  '/incidents': ['PU-01', 'PU-02'], // Solicitante y Gestor (CU-23, CU-24)
  '/incidents/:incidentId': ['PU-01', 'PU-02'],
  '/audit': ['PU-02', 'PU-04', 'PU-05'], // Gestor, CCB y Bibliotecario (CU-27)
  '/reports': ['PU-02', 'PU-04', 'PU-05'], // Gestor, CCB y Bibliotecario (CU-28)
  '/admin/users': ['PU-05'], // Exclusivo Bibliotecario / Admin SCM (CU-01)
};

export interface RouteMeta {
  path: string;
  title: string;
  breadcrumbLabel: string;
  screenId: string;
  wireframeId: string;
  packageId: string;
  packageName: string;
  governedUseCases: string[];
  canonicalActors: string[];
  plannedPhase: string;
  description: string;
  samplePath?: string; // Para rutas con parámetros dinámicos
}

export const ROUTES_METADATA: Record<string, RouteMeta> = {
  '/dashboard': {
    path: '/dashboard',
    title: 'Dashboard General Adaptativo',
    breadcrumbLabel: 'Dashboard',
    screenId: 'SCREEN-02',
    wireframeId: 'WF-02',
    packageId: 'PKG_GEN',
    packageName: 'Resumen Operativo',
    governedUseCases: ['Múltiples Casos de Uso'],
    canonicalActors: ['Todos los Actores Canónicos'],
    plannedPhase: 'Fase IV (Integración de Datos)',
    description: 'Tablero central adaptativo con métricas del ciclo de vida, proyectos activos y accesos directos por rol.',
  },
  '/projects': {
    path: '/projects',
    title: 'Directorio General de Proyectos',
    breadcrumbLabel: 'Proyectos',
    screenId: 'SCREEN-03',
    wireframeId: 'WF-03',
    packageId: 'PKG_PROJ',
    packageName: 'Gestión de Proyectos',
    governedUseCases: ['CU-02'],
    canonicalActors: ['Analista de Requerimientos / Gestor', 'CCB', 'Administrador de Configuración / Bibliotecario'],
    plannedPhase: 'Fase VI (Gestión de Proyectos)',
    description: 'Catálogo de proyectos aislados de ÉXODO S.A.C., estado operacional y asignación de responsables.',
  },
  '/projects/:projectId': {
    path: '/projects/:projectId',
    title: 'Ficha Integral de Proyecto',
    breadcrumbLabel: 'Ficha de Proyecto',
    screenId: 'SCREEN-04',
    wireframeId: 'WF-04',
    packageId: 'PKG_PROJ',
    packageName: 'Gestión de Proyectos',
    governedUseCases: ['CU-02', 'CU-03'],
    canonicalActors: ['Gestor', 'CCB', 'Bibliotecario', 'Arquitecto'],
    plannedPhase: 'Fase VI (Gestión de Proyectos)',
    description: 'Detalle de configuración, equipo asignado, métricas de cambios y línea base activa del proyecto.',
    samplePath: '/projects/PRJ-001',
  },
  '/rfcs': {
    path: '/rfcs',
    title: 'Bandeja de Solicitudes (RFC)',
    breadcrumbLabel: 'Solicitudes RFC',
    screenId: 'SCREEN-05',
    wireframeId: 'WF-05',
    packageId: 'PKG_CHG',
    packageName: 'Control de Cambios',
    governedUseCases: ['CU-04..08', 'CU-30'],
    canonicalActors: ['Todos los Actores (Filtrado según SoD)'],
    plannedPhase: 'Fase V (Flujo Principal RFC)',
    description: 'Listado centralizado de Solicitudes de Cambio con filtros por estado, prioridad y proyecto.',
  },
  '/rfcs/new': {
    path: '/rfcs/new',
    title: 'Portal de Captura de RFC',
    breadcrumbLabel: 'Nueva Solicitud',
    screenId: 'SCREEN-07',
    wireframeId: 'WF-07',
    packageId: 'PKG_CHG',
    packageName: 'Control de Cambios',
    governedUseCases: ['CU-04'],
    canonicalActors: ['Solicitante'],
    plannedPhase: 'Fase V (Flujo Principal RFC)',
    description: 'Formulario formal de registro de solicitud de cambio con justificación, criticidad y ECS afectado.',
  },
  '/rfcs/:rfcId': {
    path: '/rfcs/:rfcId',
    title: 'Expediente 360° de RFC',
    breadcrumbLabel: 'Expediente 360°',
    screenId: 'SCREEN-06',
    wireframeId: 'WF-06A/B/C',
    packageId: 'PKG_CHG',
    packageName: 'Control de Cambios',
    governedUseCases: ['CU-04..08', 'CU-30'],
    canonicalActors: ['Todos los Actores (Controles contextuales por Rol)'],
    plannedPhase: 'Fase V (Flujo Principal RFC)',
    description: 'Visor holístico con pestañas de expediente: datos generales, análisis técnico, actas y trazabilidad.',
    samplePath: '/rfcs/RFC-2026-0042',
  },
  '/rfcs/:rfcId/edit': {
    path: '/rfcs/:rfcId/edit',
    title: 'Subsanación de RFC',
    breadcrumbLabel: 'Subsanación',
    screenId: 'SCREEN-07',
    wireframeId: 'WF-07',
    packageId: 'PKG_CHG',
    packageName: 'Control de Cambios',
    governedUseCases: ['CU-04.1'],
    canonicalActors: ['Solicitante'],
    plannedPhase: 'Fase V (Flujo Principal RFC)',
    description: 'Edición y levantamiento de observaciones formuladas por el Gestor sobre una RFC en estado En Subsanación.',
    samplePath: '/rfcs/RFC-2026-0042/edit',
  },
  '/rfcs/:rfcId/impact-analysis': {
    path: '/rfcs/:rfcId/impact-analysis',
    title: 'Consola de Evaluación de Impacto',
    breadcrumbLabel: 'Análisis de Impacto',
    screenId: 'SCREEN-08',
    wireframeId: 'WF-08',
    packageId: 'PKG_CHG',
    packageName: 'Control de Cambios',
    governedUseCases: ['CU-06'],
    canonicalActors: ['Arquitecto / Especialista Técnico'],
    plannedPhase: 'Fase V (Flujo Principal RFC)',
    description: 'Evaluación técnica de afectación a la Triple Restricción, dependencias, riesgos y dictamen Mayor/Menor (RN-05).',
    samplePath: '/rfcs/RFC-2026-0042/impact-analysis',
  },
  '/rfcs/:rfcId/ccb-deliberation': {
    path: '/rfcs/:rfcId/ccb-deliberation',
    title: 'Sala de Deliberación CCB',
    breadcrumbLabel: 'Deliberación CCB',
    screenId: 'SCREEN-09',
    wireframeId: 'WF-09',
    packageId: 'PKG_CHG',
    packageName: 'Control de Cambios',
    governedUseCases: ['CU-07'],
    canonicalActors: ['Comité de Control de Cambios (CCB)'],
    plannedPhase: 'Fase V (Flujo Principal RFC)',
    description: 'Espacio colegiado de votación, dictamen formal aprobatorio/denegatorio y emisión de acta de resolución.',
    samplePath: '/rfcs/RFC-2026-0042/ccb-deliberation',
  },
  '/rfcs/:rfcId/minor-approval': {
    path: '/rfcs/:rfcId/minor-approval',
    title: 'Consola de Autorización de Cambio Menor',
    breadcrumbLabel: 'Autorización Menor',
    screenId: 'SCREEN-10',
    wireframeId: 'WF-10',
    packageId: 'PKG_CHG',
    packageName: 'Control de Cambios',
    governedUseCases: ['CU-30'],
    canonicalActors: ['Analista de Requerimientos / Gestor', 'Arquitecto / Especialista Técnico'],
    plannedPhase: 'Fase V (Flujo Principal RFC)',
    description: 'Autorización conjunta por Doble Llave Operativa para cambios menores calificados sin afectación mayor.',
    samplePath: '/rfcs/RFC-2026-0042/minor-approval',
  },
  '/rfcs/:rfcId/uat': {
    path: '/rfcs/:rfcId/uat',
    title: 'Centro de Suscripción de Acta UAT',
    breadcrumbLabel: 'Aceptación UAT',
    screenId: 'SCREEN-16',
    wireframeId: 'WF-16',
    packageId: 'PKG_CHG',
    packageName: 'Control de Cambios',
    governedUseCases: ['CU-29'],
    canonicalActors: ['Solicitante (Usuario Final)'],
    plannedPhase: 'Fase VI (SCM Core y Validación)',
    description: 'Validación en entorno controlado de pruebas y firma formal del Acta de Aceptación de Usuario (RN-09).',
    samplePath: '/rfcs/RFC-2026-0042/uat',
  },
  '/ecns': {
    path: '/ecns',
    title: 'Bandeja de Órdenes de Cambio (ECN/ECO)',
    breadcrumbLabel: 'Órdenes ECN',
    screenId: 'SCREEN-11',
    wireframeId: 'WF-11',
    packageId: 'PKG_CHG',
    packageName: 'Control de Cambios',
    governedUseCases: ['CU-08', 'CU-22'],
    canonicalActors: ['CCB', 'Gestor', 'Bibliotecario', 'Desarrollador', 'QA'],
    plannedPhase: 'Fase V (Flujo Principal RFC)',
    description: 'Catálogo de órdenes de cambio formalizadas, autorizaciones ejecutivas y asignaciones de desarrollo.',
  },
  '/ecns/:ecnId': {
    path: '/ecns/:ecnId',
    title: 'Ficha de Orden de Cambio (ECN/ECO)',
    breadcrumbLabel: 'Detalle de Orden ECN',
    screenId: 'SCREEN-11',
    wireframeId: 'WF-11',
    packageId: 'PKG_CHG',
    packageName: 'Control de Cambios',
    governedUseCases: ['CU-08', 'CU-22'],
    canonicalActors: ['CCB', 'Gestor', 'Bibliotecario', 'Desarrollador', 'QA'],
    plannedPhase: 'Fase V (Flujo Principal RFC)',
    description: 'Detalle de instrucción técnica, fechas comprometidas, estado de ejecución y trazabilidad.',
    samplePath: '/ecns/ECN-2026-0015',
  },
  '/ecs': {
    path: '/ecs',
    title: 'Explorador de ECS y Bibliotecas SCM',
    breadcrumbLabel: 'Catálogo ECS',
    screenId: 'SCREEN-12',
    wireframeId: 'WF-12',
    packageId: 'PKG_ECS',
    packageName: 'Gestión de Configuración',
    governedUseCases: ['CU-09', 'CU-14', 'CU-26'],
    canonicalActors: ['Bibliotecario', 'Desarrollador', 'Arquitecto', 'QA'],
    plannedPhase: 'Fase VI (SCM Core y Bibliotecas)',
    description: 'Inventario de Elementos de Configuración de Software (código, BD, docs) en las 3 bibliotecas.',
  },
  '/ecs/:ecsId': {
    path: '/ecs/:ecsId',
    title: 'Ficha de Elemento de Configuración (ECS)',
    breadcrumbLabel: 'Detalle de ECS',
    screenId: 'SCREEN-12',
    wireframeId: 'WF-12',
    packageId: 'PKG_ECS',
    packageName: 'Gestión de Configuración',
    governedUseCases: ['CU-09', 'CU-26'],
    canonicalActors: ['Arquitecto', 'Bibliotecario', 'Desarrollador', 'QA'],
    plannedPhase: 'Fase VI (SCM Core y Bibliotecas)',
    description: 'Metadatos, biblioteca actual, versión vigente, hash SHA-256 e historial de custodias.',
    samplePath: '/ecs/ECS-001',
  },
  '/ecs/:ecsId/history': {
    path: '/ecs/:ecsId/history',
    title: 'Visor de Historial y Comparador Diff',
    breadcrumbLabel: 'Historial y Diff',
    screenId: 'SCREEN-14',
    wireframeId: 'WF-14',
    packageId: 'PKG_ECS',
    packageName: 'Gestión de Configuración',
    governedUseCases: ['CU-13'],
    canonicalActors: ['Todos los roles técnicos'],
    plannedPhase: 'Fase VI (SCM Core y Bibliotecas)',
    description: 'Línea de tiempo de versiones con visor visual de diferencias (Diff Split) e integridad criptográfica.',
    samplePath: '/ecs/ECS-001/history',
  },
  '/scm/operations': {
    path: '/scm/operations',
    title: 'Consola de Operaciones SCM (Check-Out / Check-In)',
    breadcrumbLabel: 'Operaciones SCM',
    screenId: 'SCREEN-13',
    wireframeId: 'WF-13A/B',
    packageId: 'PKG_LIB',
    packageName: 'Gestión de Bibliotecas',
    governedUseCases: ['CU-10', 'CU-11', 'CU-12'],
    canonicalActors: ['Administrador de Configuración / Bibliotecario (Ejecutor exclusivo)'],
    plannedPhase: 'Fase VI (SCM Core y Bibliotecas)',
    description: 'Consola de transferencia entre bibliotecas (Trabajo, Soporte, Maestra) con bloqueo condicional RN-06.',
  },
  '/qa/validation/:rfcId': {
    path: '/qa/validation/:rfcId',
    title: 'Consola de Validación QA y No Conformidades',
    breadcrumbLabel: 'Validación QA',
    screenId: 'SCREEN-15',
    wireframeId: 'WF-15',
    packageId: 'PKG_CHG',
    packageName: 'Control de Cambios',
    governedUseCases: ['CU-16', 'CU-17', 'CU-18', 'CU-19'],
    canonicalActors: ['Equipo de Calidad / Testing', 'Ingeniero de Software / Desarrollador'],
    plannedPhase: 'Fase VI (SCM Core y Validación)',
    description: 'Gestión de ejecuciones de pruebas de integración, registro de no conformidades y certificación técnica.',
    samplePath: '/qa/validation/RFC-2026-0042',
  },
  '/baselines': {
    path: '/baselines',
    title: 'Gestor de Líneas Base y Rollback SCM',
    breadcrumbLabel: 'Líneas Base',
    screenId: 'SCREEN-17',
    wireframeId: 'WF-17',
    packageId: 'PKG_LIB',
    packageName: 'Gestión de Bibliotecas',
    governedUseCases: ['CU-20', 'CU-21'],
    canonicalActors: ['Administrador de Configuración / Bibliotecario'],
    plannedPhase: 'Fase VI (SCM Core y Bibliotecas)',
    description: 'Congelamiento de Líneas Base (mayor.menor.parche) y ejecución de rollback ante contingencias (RN-08).',
  },
  '/incidents': {
    path: '/incidents',
    title: 'Mesa de Entrada de Incidencias',
    breadcrumbLabel: 'Incidencias',
    screenId: 'SCREEN-18',
    wireframeId: 'WF-18',
    packageId: 'PKG_SUPP',
    packageName: 'Soporte e Incidencias',
    governedUseCases: ['CU-23', 'CU-24'],
    canonicalActors: ['Solicitante', 'Analista de Requerimientos / Gestor'],
    plannedPhase: 'Fase VII (Incidencias, Auditoría y Reportes)',
    description: 'Recepción, seguimiento y atención de reportes de fallos operativos comunicados por consultores o clientes.',
  },
  '/incidents/:incidentId': {
    path: '/incidents/:incidentId',
    title: 'Ficha de Incidencia y Derivación',
    breadcrumbLabel: 'Detalle de Incidencia',
    screenId: 'SCREEN-18',
    wireframeId: 'WF-18',
    packageId: 'PKG_SUPP',
    packageName: 'Soporte e Incidencias',
    governedUseCases: ['CU-24', 'CU-25'],
    canonicalActors: ['Solicitante', 'Analista de Requerimientos / Gestor'],
    plannedPhase: 'Fase VII (Incidencias, Auditoría y Reportes)',
    description: 'Detalle del ticket y mecanismo para derivar formalmente la incidencia hacia una Solicitud de Cambio (CU-25).',
    samplePath: '/incidents/INC-2026-0008',
  },
  '/audit': {
    path: '/audit',
    title: 'Consola de Auditoría Forense SCM',
    breadcrumbLabel: 'Auditoría Forense',
    screenId: 'SCREEN-19',
    wireframeId: 'WF-19',
    packageId: 'PKG_AUD',
    packageName: 'Trazabilidad y Auditoría',
    governedUseCases: ['CU-27'],
    canonicalActors: ['CCB', 'Administrador de Configuración / Bibliotecario'],
    plannedPhase: 'Fase VII (Incidencias, Auditoría y Reportes)',
    description: 'Registro cronológico append-only inmutable con firmas criptográficas SHA-256 e inspección de integridad.',
  },
  '/reports': {
    path: '/reports',
    title: 'Generador de Reportes SCM',
    breadcrumbLabel: 'Reportes SCM',
    screenId: 'SCREEN-19',
    wireframeId: 'WF-19',
    packageId: 'PKG_REP',
    packageName: 'Reportes',
    governedUseCases: ['CU-28'],
    canonicalActors: ['Bibliotecario', 'CCB', 'Gestor'],
    plannedPhase: 'Fase VII (Incidencias, Auditoría y Reportes)',
    description: 'Informes ejecutivos del flujo de cambios, actas consolidadas e inventario formal de configuración.',
  },
  '/admin/users': {
    path: '/admin/users',
    title: 'Administración de Usuarios y Roles',
    breadcrumbLabel: 'Usuarios y Roles',
    screenId: 'SCREEN-20',
    wireframeId: 'WF-20',
    packageId: 'PKG_GOB',
    packageName: 'Gobernanza y Seguridad',
    governedUseCases: ['CU-01'],
    canonicalActors: ['Administrador de Configuración / Bibliotecario'],
    plannedPhase: 'Fase VII (Incidencias, Auditoría y Reportes)',
    description: 'Gestión de identidades institucionales y asignación de los 7 perfiles de usuario canónicos (PU-01..PU-07).',
  },
};

export interface NavigationItem {
  label: string;
  path: string;
  screenId?: string;
  allowedRoles: CanonicalRoleId[];
}

export interface SidebarSection {
  id: string;
  name: string;
  packageCode?: string;
  icon: LucideIcon;
  items: NavigationItem[];
}

/**
 * Catálogo Canónico Completo de Secciones y Opciones del Menú Lateral
 * Cada opción define explícitamente sus roles autorizados basándose en ROUTE_PERMISSIONS.
 */
export const SIDEBAR_NAVIGATION: SidebarSection[] = [
  {
    id: 'general',
    name: 'General',
    packageCode: 'RESUMEN',
    icon: LayoutDashboard,
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        screenId: 'SCREEN-02',
        allowedRoles: ROUTE_PERMISSIONS['/dashboard'],
      },
    ],
  },
  {
    id: 'projects',
    name: 'Gestión de proyectos',
    packageCode: 'PKG_PROJ',
    icon: FolderGit2,
    items: [
      {
        label: 'Directorio de Proyectos',
        path: '/projects',
        screenId: 'SCREEN-03',
        allowedRoles: ROUTE_PERMISSIONS['/projects'],
      },
    ],
  },
  {
    id: 'changes',
    name: 'Control de cambios',
    packageCode: 'PKG_CHG',
    icon: GitPullRequest,
    items: [
      {
        label: 'Bandeja de solicitudes (RFC)',
        path: '/rfcs',
        screenId: 'SCREEN-05',
        allowedRoles: ROUTE_PERMISSIONS['/rfcs'],
      },
      {
        label: 'Nueva solicitud (RFC)',
        path: '/rfcs/new',
        screenId: 'SCREEN-07',
        allowedRoles: ROUTE_PERMISSIONS['/rfcs/new'],
      },
      {
        label: 'Órdenes de Cambio (ECN)',
        path: '/ecns',
        screenId: 'SCREEN-11',
        allowedRoles: ROUTE_PERMISSIONS['/ecns'],
      },
      {
        label: 'Validación de calidad (QA)',
        path: '/qa/validation/RFC-2026-0042',
        screenId: 'SCREEN-15',
        allowedRoles: ROUTE_PERMISSIONS['/qa/validation/:rfcId'],
      },
    ],
  },
  {
    id: 'ecs',
    name: 'Gestión de configuración',
    packageCode: 'PKG_ECS',
    icon: FileCode2,
    items: [
      {
        label: 'Catálogo de ECS',
        path: '/ecs',
        screenId: 'SCREEN-12',
        allowedRoles: ROUTE_PERMISSIONS['/ecs'],
      },
    ],
  },
  {
    id: 'libraries',
    name: 'Gestión de bibliotecas',
    packageCode: 'PKG_LIB',
    icon: Boxes,
    items: [
      {
        label: 'Operaciones de biblioteca',
        path: '/scm/operations',
        screenId: 'SCREEN-13',
        allowedRoles: ROUTE_PERMISSIONS['/scm/operations'],
      },
      {
        label: 'Líneas base y reversión',
        path: '/baselines',
        screenId: 'SCREEN-17',
        allowedRoles: ROUTE_PERMISSIONS['/baselines'],
      },
    ],
  },
  {
    id: 'support',
    name: 'Soporte e incidencias',
    packageCode: 'PKG_SUPP',
    icon: LifeBuoy,
    items: [
      {
        label: 'Mesa de Incidencias',
        path: '/incidents',
        screenId: 'SCREEN-18',
        allowedRoles: ROUTE_PERMISSIONS['/incidents'],
      },
    ],
  },
  {
    id: 'audit',
    name: 'Trazabilidad y auditoría',
    packageCode: 'PKG_AUD',
    icon: History,
    items: [
      {
        label: 'Bitácora Forense SHA-256',
        path: '/audit',
        screenId: 'SCREEN-19',
        allowedRoles: ROUTE_PERMISSIONS['/audit'],
      },
    ],
  },
  {
    id: 'reports',
    name: 'Reportes del sistema',
    packageCode: 'PKG_REP',
    icon: BarChart3,
    items: [
      {
        label: 'Generador de Reportes',
        path: '/reports',
        screenId: 'SCREEN-19',
        allowedRoles: ROUTE_PERMISSIONS['/reports'],
      },
    ],
  },
  {
    id: 'governance',
    name: 'Administración y seguridad',
    packageCode: 'PKG_GOB',
    icon: Shield,
    items: [
      {
        label: 'Usuarios y roles',
        path: '/admin/users',
        screenId: 'SCREEN-20',
        allowedRoles: ROUTE_PERMISSIONS['/admin/users'],
      },
    ],
  },
];

/**
 * Calcula las secciones y opciones de navegación visibles según el rol efectivo en sesión.
 * Si no hay rol activo o el rol no está autorizado, la opción u sección no se incluye en el menú.
 */
export const getNavigationForRole = (roleId: CanonicalRoleId | null): SidebarSection[] => {
  if (!roleId) return [];

  return SIDEBAR_NAVIGATION.map((section) => {
    // Filtrar únicamente los ítems que admitan el rol activo
    const filteredItems = section.items.filter((item) => item.allowedRoles.includes(roleId));

    return {
      ...section,
      items: filteredItems,
    };
  }).filter((section) => section.items.length > 0); // Excluir secciones que queden vacías
};

/**
 * Valida si una ruta está autorizada para un rol canónico dado.
 */
export const isRouteAuthorizedForRole = (path: string, roleId: CanonicalRoleId | null): boolean => {
  if (!roleId) return false;
  const allowed = ROUTE_PERMISSIONS[path];
  if (!allowed) return true; // Rutas no listadas son abiertas por defecto
  return allowed.includes(roleId);
};

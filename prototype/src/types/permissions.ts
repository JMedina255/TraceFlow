import type { CanonicalRoleId } from './auth';

export type SystemAction =
  | 'REGISTRAR_RFC'           // PU-01 (CU-04)
  | 'SUBSANAR_RFC'           // PU-01 (CU-04.1)
  | 'VALIDAR_CLASIFICAR_RFC' // PU-02 (CU-05)
  | 'ANALIZAR_IMPACTO'       // PU-03 (CU-06)
  | 'EVALUAR_CCB'            // PU-04 (CU-07)
  | 'AUTORIZAR_CAMBIO_MENOR' // PU-02 + PU-03 (CU-30)
  | 'EMITIR_ECN'             // PU-04 / PU-02 (CU-08)
  | 'CHECK_OUT'              // PU-05 (CU-10)
  | 'CHECK_IN'               // PU-05 (CU-11)
  | 'IMPLEMENTAR_CAMBIO'     // PU-06 (CU-15)
  | 'VALIDACION_QA'          // PU-07 (CU-16..19)
  | 'SUSCRIBIR_UAT'          // PU-01 (CU-29)
  | 'CONGELAR_BASELINE'      // PU-05 (CU-20)
  | 'EJECUTAR_ROLLBACK'      // PU-05 (CU-21)
  | 'REGISTRAR_INCIDENCIA'   // PU-01 (CU-23)
  | 'DERIVAR_INCIDENCIA'     // PU-02 (CU-25)
  | 'AUDITAR_SISTEMA'        // PU-04, PU-05 (CU-27)
  | 'GESTIONAR_PROYECTOS'    // PU-02 (CU-02)
  | 'GESTIONAR_USUARIOS';    // PU-05 (CU-01)

/**
 * Matriz de Autorización y Segregación de Funciones (SoD) de Acciones del Sistema
 * Fuente única de verdad desacoplada de la interfaz de presentación.
 */
export const ACTION_PERMISSIONS: Record<SystemAction, CanonicalRoleId[]> = {
  REGISTRAR_RFC: ['PU-01'],
  SUBSANAR_RFC: ['PU-01'],
  VALIDAR_CLASIFICAR_RFC: ['PU-02'],
  ANALIZAR_IMPACTO: ['PU-03'],
  EVALUAR_CCB: ['PU-04'],
  AUTORIZAR_CAMBIO_MENOR: ['PU-02', 'PU-03'],
  EMITIR_ECN: ['PU-04', 'PU-02'],
  CHECK_OUT: ['PU-05'],
  CHECK_IN: ['PU-05'],
  IMPLEMENTAR_CAMBIO: ['PU-06'],
  VALIDACION_QA: ['PU-07'],
  SUSCRIBIR_UAT: ['PU-01'],
  CONGELAR_BASELINE: ['PU-05'],
  EJECUTAR_ROLLBACK: ['PU-05'],
  REGISTRAR_INCIDENCIA: ['PU-01'],
  DERIVAR_INCIDENCIA: ['PU-02'],
  AUDITAR_SISTEMA: ['PU-04', 'PU-05'],
  GESTIONAR_PROYECTOS: ['PU-02'],
  GESTIONAR_USUARIOS: ['PU-05'],
};

/**
 * Matriz Centralizada de Permisos por Ruta para Guardas de Navegación
 * Desacoplada de iconos o componentes visuales de React.
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

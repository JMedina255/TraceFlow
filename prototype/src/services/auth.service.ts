import type { CanonicalRoleId, UserAccount, User } from '../types';
import { INITIAL_USER_ACCOUNTS, INITIAL_DEMO_USERS, type DemoUserConfig } from '../data/initialUsers';

export type SystemAction =
  | 'REGISTRAR_RFC'           // PU-01
  | 'SUBSANAR_RFC'           // PU-01
  | 'VALIDAR_CLASIFICAR_RFC' // PU-02
  | 'ANALIZAR_IMPACTO'       // PU-03
  | 'EVALUAR_CCB'            // PU-04
  | 'AUTORIZAR_CAMBIO_MENOR' // PU-02 + PU-03
  | 'EMITIR_ECN'             // PU-04 / PU-02
  | 'CHECK_OUT'              // PU-05
  | 'CHECK_IN'               // PU-05
  | 'IMPLEMENTAR_CAMBIO'     // PU-06
  | 'VALIDACION_QA'          // PU-07
  | 'SUSCRIBIR_UAT'          // PU-01
  | 'CONGELAR_BASELINE'      // PU-05
  | 'EJECUTAR_ROLLBACK'      // PU-05
  | 'REGISTRAR_INCIDENCIA'   // PU-01
  | 'DERIVAR_INCIDENCIA'     // PU-02
  | 'AUDITAR_SISTEMA'        // PU-04, PU-05
  | 'GESTIONAR_PROYECTOS'    // PU-02
  | 'GESTIONAR_USUARIOS';    // PU-05

// Matriz de Autorización y Segregación de Funciones (SoD)
const ACTION_PERMISSIONS: Record<SystemAction, CanonicalRoleId[]> = {
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

// Matriz de Permisos por Ruta para RouteGuard
const ROUTE_PERMISSIONS: Record<string, CanonicalRoleId[]> = {
  '/dashboard': ['PU-01', 'PU-02', 'PU-03', 'PU-04', 'PU-05', 'PU-06', 'PU-07'],
  '/projects': ['PU-02', 'PU-03', 'PU-04', 'PU-05'],
  '/projects/:projectId': ['PU-02', 'PU-03', 'PU-04', 'PU-05'],
  '/rfcs': ['PU-01', 'PU-02', 'PU-03', 'PU-04', 'PU-05', 'PU-06', 'PU-07'],
  '/rfcs/new': ['PU-01'],
  '/rfcs/:rfcId': ['PU-01', 'PU-02', 'PU-03', 'PU-04', 'PU-05', 'PU-06', 'PU-07'],
  '/rfcs/:rfcId/edit': ['PU-01'],
  '/rfcs/:rfcId/impact-analysis': ['PU-03'],
  '/rfcs/:rfcId/ccb-deliberation': ['PU-04'],
  '/rfcs/:rfcId/minor-approval': ['PU-02', 'PU-03'],
  '/rfcs/:rfcId/uat': ['PU-01'],
  '/ecns': ['PU-02', 'PU-04', 'PU-05', 'PU-06', 'PU-07'],
  '/ecns/:ecnId': ['PU-02', 'PU-04', 'PU-05', 'PU-06', 'PU-07'],
  '/ecs': ['PU-03', 'PU-05', 'PU-06', 'PU-07'],
  '/ecs/:ecsId': ['PU-03', 'PU-05', 'PU-06', 'PU-07'],
  '/ecs/:ecsId/history': ['PU-03', 'PU-05', 'PU-06', 'PU-07'],
  '/scm/operations': ['PU-05'],
  '/baselines': ['PU-05'],
  '/qa/validation/:rfcId': ['PU-07'],
  '/incidents': ['PU-01', 'PU-02'],
  '/incidents/:incidentId': ['PU-01', 'PU-02'],
  '/audit': ['PU-04', 'PU-05', 'PU-02'],
  '/reports': ['PU-04', 'PU-05', 'PU-02'],
  '/admin/users': ['PU-05'],
};

export const authService = {
  getAccounts(): UserAccount[] {
    return INITIAL_USER_ACCOUNTS;
  },

  getAccountById(id: string): UserAccount | undefined {
    return INITIAL_USER_ACCOUNTS.find((a) => a.id === id);
  },

  getDemoUsers(): DemoUserConfig[] {
    return INITIAL_DEMO_USERS;
  },

  getDemoUserById(id: string): DemoUserConfig | undefined {
    return INITIAL_DEMO_USERS.find((u) => u.id === id);
  },

  isActionAuthorized(roleId: CanonicalRoleId, action: SystemAction): boolean {
    const allowed = ACTION_PERMISSIONS[action];
    return allowed ? allowed.includes(roleId) : false;
  },

  assertActionAuthorized(roleId: CanonicalRoleId, action: SystemAction): void {
    if (!this.isActionAuthorized(roleId, action)) {
      throw new Error(
        `Operación denegada (SoD): El rol activo '${roleId}' no tiene autorización para ejecutar la acción '${action}'.`
      );
    }
  },

  getAllowedActions(roleId: CanonicalRoleId): SystemAction[] {
    return (Object.keys(ACTION_PERMISSIONS) as SystemAction[]).filter((act) =>
      ACTION_PERMISSIONS[act].includes(roleId)
    );
  },

  getRouteAllowedRoles(routePath: string): CanonicalRoleId[] {
    return ROUTE_PERMISSIONS[routePath] || ['PU-01', 'PU-02', 'PU-03', 'PU-04', 'PU-05', 'PU-06', 'PU-07'];
  },

  isRoleAuthorizedForRoute(roleId: CanonicalRoleId, routePath: string): boolean {
    const allowed = ROUTE_PERMISSIONS[routePath];
    if (!allowed) return true; // Rutas abiertas por defecto si no están especificadas
    return allowed.includes(roleId);
  },

  canUserAccessProject(user: UserAccount | User, projectId: string): boolean {
    if (!user.assignedProjectIds || user.assignedProjectIds.length === 0) {
      return false;
    }
    return user.assignedProjectIds.includes(projectId);
  },
};

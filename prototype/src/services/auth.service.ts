import type { CanonicalRoleId } from '../types';
import { INITIAL_DEMO_USERS, type DemoUserConfig } from '../data/initialUsers';

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

export const authService = {
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

  getAllowedActions(roleId: CanonicalRoleId): SystemAction[] {
    return (Object.keys(ACTION_PERMISSIONS) as SystemAction[]).filter((act) =>
      ACTION_PERMISSIONS[act].includes(roleId)
    );
  },
};

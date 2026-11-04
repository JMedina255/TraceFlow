import type { CanonicalRoleId, UserAccount, User, SystemAction } from '../types';
import { ACTION_PERMISSIONS, ROUTE_PERMISSIONS } from '../types';
import { INITIAL_USER_ACCOUNTS, INITIAL_DEMO_USERS, type DemoUserConfig } from '../data/initialUsers';

export type { SystemAction };
export { ACTION_PERMISSIONS, ROUTE_PERMISSIONS };

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

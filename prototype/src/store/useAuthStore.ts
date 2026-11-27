import { create } from 'zustand';
import type { User, UserAccount, CanonicalRole, CanonicalRoleId } from '../types';
import { CANONICAL_ROLES } from '../types';
import { INITIAL_USER_ACCOUNTS, INITIAL_DEMO_USERS, type DemoUserConfig } from '../data/initialUsers';
import { authService } from '../services/auth.service';
import { storageService } from '../services/storage.service';
import { traceFlowAdapter } from '../services/api/apiAdapter';

interface AuthState {
  currentUser: User | null;
  activeRole: CanonicalRole | null;
  activeRoleId: CanonicalRoleId | null;
  isAuthenticated: boolean;
  loginWithCredentials: (
    email: string,
    password: string,
    requestedRoleId?: CanonicalRoleId
  ) => Promise<User>;
  refreshSession: () => Promise<boolean>;
  logout: () => void;
  // Métodos de compatibilidad para suites de prueba automatizadas
  availableDemoAccounts: UserAccount[];
  availableDemoUsers: DemoUserConfig[];
  loginWithAccount: (account: UserAccount | DemoUserConfig, effectiveRoleId?: CanonicalRoleId) => void;
  switchUser: (userId: string) => void;
  login: (user: User) => void;
}

const mapApiUserToSession = (apiUser: any, requestedRoleId?: CanonicalRoleId): {
  user: User;
  roleId: CanonicalRoleId;
  role: CanonicalRole;
} => {
  const effectiveRole = (requestedRoleId || apiUser.activeRoleId || apiUser.roleId || 'PU-01') as CanonicalRoleId;
  const roleDef = CANONICAL_ROLES[effectiveRole] || CANONICAL_ROLES['PU-01'];
  const hydratedUser: User = {
    ...apiUser,
    isActive: apiUser.isActive ?? true,
    assignedRoleIds: apiUser.allowedRoleIds || apiUser.assignedRoleIds || [effectiveRole],
    primaryRoleId: apiUser.primaryRoleId || effectiveRole,
    assignedProjectIds: apiUser.assignedProjectIds || [],
    role: roleDef.role,
    roleId: effectiveRole,
    roleLabel: roleDef.label,
    allowedRoleIds: apiUser.allowedRoleIds || apiUser.assignedRoleIds || [effectiveRole],
  };
  return {
    user: hydratedUser,
    roleId: effectiveRole,
    role: roleDef.role,
  };
};

const getInitialSession = (): {
  user: User | null;
  role: CanonicalRole | null;
  roleId: CanonicalRoleId | null;
  isAuthenticated: boolean;
} => {
  const apiUser = storageService.get<any>('tf_api_user', null);
  const apiRoleId = storageService.get<any>('tf_api_role_id', null);
  if (apiUser) {
    const mapped = mapApiUserToSession(apiUser, (apiRoleId || apiUser.activeRoleId || apiUser.roleId) as CanonicalRoleId);
    return {
      user: mapped.user,
      role: mapped.role,
      roleId: mapped.roleId,
      isAuthenticated: true,
    };
  }

  const persisted = authService.validatePersistedSession();
  if (persisted) {
    return {
      user: persisted.user,
      role: persisted.user.role,
      roleId: persisted.roleId,
      isAuthenticated: true,
    };
  }

  return {
    user: null,
    role: null,
    roleId: null,
    isAuthenticated: false,
  };
};

const initialSession = getInitialSession();

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: initialSession.user,
  activeRole: initialSession.role,
  activeRoleId: initialSession.roleId,
  isAuthenticated: initialSession.isAuthenticated,
  availableDemoAccounts: INITIAL_USER_ACCOUNTS,
  availableDemoUsers: INITIAL_DEMO_USERS,

  /**
   * Inicio de sesión formal empresarial con correo institucional y contraseña.
   * Valida credenciales mediante traceFlowAdapter (API NestJS o Mock local seguro).
   */
  loginWithCredentials: async (email: string, password: string, requestedRoleId?: CanonicalRoleId): Promise<User> => {
    if (traceFlowAdapter.isApiMode()) {
      const apiUser = await traceFlowAdapter.auth.login(email, password, requestedRoleId);
      const mapped = mapApiUserToSession(apiUser, requestedRoleId);
      storageService.set('tf_api_user', mapped.user);
      storageService.set('tf_api_role_id', mapped.roleId);
      set({
        currentUser: mapped.user,
        activeRoleId: mapped.roleId,
        activeRole: mapped.role,
        isAuthenticated: true,
      });
      return mapped.user;
    }

    const result = await authService.authenticate(email, password, requestedRoleId);
    set({
      currentUser: result.sessionUser,
      activeRoleId: result.effectiveRoleId,
      activeRole: result.sessionUser.role,
      isAuthenticated: true,
    });
    return result.sessionUser;
  },

  refreshSession: async (): Promise<boolean> => {
    if (!traceFlowAdapter.isApiMode()) {
      return Boolean(authService.validatePersistedSession());
    }
    try {
      const apiUser = await traceFlowAdapter.auth.getMe();
      if (!apiUser) {
        storageService.remove('tf_api_user');
        storageService.remove('tf_api_role_id');
        set({ currentUser: null, activeRoleId: null, activeRole: null, isAuthenticated: false });
        return false;
      }
      const mapped = mapApiUserToSession(apiUser);
      storageService.set('tf_api_user', mapped.user);
      storageService.set('tf_api_role_id', mapped.roleId);
      set({
        currentUser: mapped.user,
        activeRoleId: mapped.roleId,
        activeRole: mapped.role,
        isAuthenticated: true,
      });
      return true;
    } catch {
      storageService.remove('tf_api_user');
      storageService.remove('tf_api_role_id');
      set({ currentUser: null, activeRoleId: null, activeRole: null, isAuthenticated: false });
      return false;
    }
  },

  /**
   * Cierre formal de sesión activa y revocación de tokens vía traceFlowAdapter.
   */
  logout: () => {
    storageService.remove('tf_api_user');
    storageService.remove('tf_api_role_id');
    if (traceFlowAdapter.isApiMode()) {
      traceFlowAdapter.auth.logout().catch(console.error);
    } else {
      authService.logout();
    }
    set({
      currentUser: null,
      activeRoleId: null,
      activeRole: null,
      isAuthenticated: false,
    });
  },

  /**
   * Adaptador de compatibilidad para suites de pruebas y fixtures controlados.
   * Aplica la regla SoD: Si el rol solicitado no está en assignedRoleIds, se fuerza el rol primario.
   */
  loginWithAccount: (account: UserAccount | DemoUserConfig, effectiveRoleId?: CanonicalRoleId) => {
    const selectedRoleId =
      effectiveRoleId && account.assignedRoleIds.includes(effectiveRoleId)
        ? effectiveRoleId
        : account.primaryRoleId || account.assignedRoleIds[0];

    const roleDef = CANONICAL_ROLES[selectedRoleId];
    if (!roleDef) return;

    storageService.set('active_demo_user_id', account.id);
    storageService.set('active_demo_role_id', selectedRoleId);

    // Actualiza persistencia
    const sessionUser: User = {
      ...account,
      roleId: selectedRoleId,
      role: roleDef.role,
      roleLabel: roleDef.label,
      allowedRoleIds: account.assignedRoleIds,
    };

    set({
      currentUser: sessionUser,
      activeRoleId: selectedRoleId,
      activeRole: roleDef.role,
      isAuthenticated: true,
    });
  },

  switchUser: (userId: string) => {
    const account = INITIAL_USER_ACCOUNTS.find((u) => u.id === userId);
    if (!account) return;
    const defaultRoleId = account.primaryRoleId || account.assignedRoleIds[0];
    const roleDef = CANONICAL_ROLES[defaultRoleId];
    if (!roleDef) return;

    storageService.set('active_demo_user_id', account.id);
    storageService.set('active_demo_role_id', defaultRoleId);

    set({
      currentUser: {
        ...account,
        roleId: defaultRoleId,
        role: roleDef.role,
        roleLabel: roleDef.label,
        allowedRoleIds: account.assignedRoleIds,
      },
      activeRoleId: defaultRoleId,
      activeRole: roleDef.role,
      isAuthenticated: true,
    });
  },

  login: (user: User) => {
    const matched = INITIAL_DEMO_USERS.find((u) => u.id === user.id) || {
      ...user,
      assignedRoleIds: [user.roleId],
      assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
      primaryRoleId: user.roleId,
      allowedRoleIds: [user.roleId],
    };

    set({
      currentUser: matched,
      activeRoleId: matched.roleId,
      activeRole: matched.role,
      isAuthenticated: true,
    });
  },
}));

import { create } from 'zustand';
import type { User, UserAccount, CanonicalRole, CanonicalRoleId } from '../types';
import { CANONICAL_ROLES } from '../types';
import { INITIAL_USER_ACCOUNTS, INITIAL_DEMO_USERS, type DemoUserConfig } from '../data/initialUsers';
import { storageService } from '../services/storage.service';

interface AuthState {
  currentUser: User | null;
  activeRole: CanonicalRole | null;
  activeRoleId: CanonicalRoleId | null;
  isAuthenticated: boolean;
  availableDemoAccounts: UserAccount[];
  availableDemoUsers: DemoUserConfig[]; // Alias de compatibilidad
  loginWithAccount: (account: UserAccount | DemoUserConfig, effectiveRoleId?: CanonicalRoleId) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  switchRole: (roleId: CanonicalRoleId) => void;
  login: (user: User) => void;
}

const STORAGE_KEY_USER_ID = 'active_demo_user_id';
const STORAGE_KEY_ROLE_ID = 'active_demo_role_id';

const getInitialSession = (): {
  user: User | null;
  role: CanonicalRole | null;
  roleId: CanonicalRoleId | null;
  isAuthenticated: boolean;
} => {
  const savedUserId = storageService.get<string | null>(STORAGE_KEY_USER_ID, null);
  const savedRoleId = storageService.get<CanonicalRoleId | null>(STORAGE_KEY_ROLE_ID, null);

  if (savedUserId) {
    const account = INITIAL_USER_ACCOUNTS.find((u) => u.id === savedUserId);
    if (account) {
      const effectiveRoleId =
        savedRoleId && account.assignedRoleIds.includes(savedRoleId)
          ? savedRoleId
          : account.primaryRoleId || account.assignedRoleIds[0];
      const roleDef = CANONICAL_ROLES[effectiveRoleId];

      const sessionUser: User = {
        ...account,
        roleId: effectiveRoleId,
        role: roleDef.role,
        roleLabel: roleDef.label,
        allowedRoleIds: account.assignedRoleIds,
      };

      return {
        user: sessionUser,
        role: roleDef.role,
        roleId: effectiveRoleId,
        isAuthenticated: true,
      };
    }
  }

  // Estado por defecto: Si no hay sesión guardada previa, requerir login
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
  availableDemoAccounts: INITIAL_USER_ACCOUNTS,
  availableDemoUsers: INITIAL_DEMO_USERS,
  activeRole: initialSession.role,
  activeRoleId: initialSession.roleId,
  isAuthenticated: initialSession.isAuthenticated,

  loginWithAccount: (account: UserAccount | DemoUserConfig, effectiveRoleId?: CanonicalRoleId) => {
    // Si no se especifica rol, tomar el primario o el primer rol asignado
    const selectedRoleId =
      effectiveRoleId && account.assignedRoleIds.includes(effectiveRoleId)
        ? effectiveRoleId
        : account.primaryRoleId || account.assignedRoleIds[0];

    const roleDef = CANONICAL_ROLES[selectedRoleId];
    if (!roleDef) return;

    storageService.set(STORAGE_KEY_USER_ID, account.id);
    storageService.set(STORAGE_KEY_ROLE_ID, selectedRoleId);

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

  logout: () => {
    storageService.remove(STORAGE_KEY_USER_ID);
    storageService.remove(STORAGE_KEY_ROLE_ID);
    set({
      currentUser: null,
      activeRoleId: null,
      activeRole: null,
      isAuthenticated: false,
    });
  },

  // Métodos de compatibilidad y testing controlado
  switchUser: (userId: string) => {
    const user = INITIAL_DEMO_USERS.find((u) => u.id === userId);
    if (!user) return;
    const defaultRoleId = user.primaryRoleId || user.allowedRoleIds[0];
    const defaultRole = CANONICAL_ROLES[defaultRoleId];

    storageService.set(STORAGE_KEY_USER_ID, user.id);
    storageService.set(STORAGE_KEY_ROLE_ID, defaultRoleId);

    set({
      currentUser: {
        ...user,
        roleId: defaultRoleId,
        role: defaultRole.role,
        roleLabel: defaultRole.label,
      },
      activeRoleId: defaultRoleId,
      activeRole: defaultRole.role,
      isAuthenticated: true,
    });
  },

  switchRole: (roleId: CanonicalRoleId) => {
    const roleDef = CANONICAL_ROLES[roleId];
    if (!roleDef) return;

    set((state) => {
      if (!state.currentUser) return state;
      if (!state.currentUser.assignedRoleIds.includes(roleId)) {
        console.warn(
          `[SoD Security] Intento no autorizado de conmutar al rol ${roleId} para el usuario ${state.currentUser.username}.`
        );
        return state;
      }

      storageService.set(STORAGE_KEY_ROLE_ID, roleId);

      return {
        activeRoleId: roleId,
        activeRole: roleDef.role,
        currentUser: {
          ...state.currentUser,
          roleId: roleId,
          role: roleDef.role,
          roleLabel: roleDef.label,
        },
      };
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

    storageService.set(STORAGE_KEY_USER_ID, matched.id);
    storageService.set(STORAGE_KEY_ROLE_ID, matched.roleId);

    set({
      currentUser: matched,
      activeRoleId: matched.roleId,
      activeRole: matched.role,
      isAuthenticated: true,
    });
  },
}));

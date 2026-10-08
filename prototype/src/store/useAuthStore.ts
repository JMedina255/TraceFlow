import { create } from 'zustand';
import type { User, CanonicalRole, CanonicalRoleId } from '../types';
import { CANONICAL_ROLES } from '../types';
import { INITIAL_DEMO_USERS, type DemoUserConfig } from '../data/initialUsers';
import { storageService } from '../services/storage.service';

interface AuthState {
  currentUser: DemoUserConfig;
  availableDemoUsers: DemoUserConfig[];
  activeRole: CanonicalRole;
  activeRoleId: CanonicalRoleId;
  isAuthenticated: boolean;
  switchUser: (userId: string) => void;
  switchRole: (roleId: CanonicalRoleId) => void;
  login: (user: User) => void;
  logout: () => void;
}

const STORAGE_KEY_USER_ID = 'active_demo_user_id';
const STORAGE_KEY_ROLE_ID = 'active_demo_role_id';

const getInitialUser = (): DemoUserConfig => {
  const savedUserId = storageService.get<string | null>(STORAGE_KEY_USER_ID, null);
  if (savedUserId) {
    const found = INITIAL_DEMO_USERS.find((u) => u.id === savedUserId);
    if (found) return found;
  }
  return INITIAL_DEMO_USERS[0]; // Joan Medina por defecto
};

const getInitialRole = (user: DemoUserConfig): { role: CanonicalRole; roleId: CanonicalRoleId } => {
  const savedRoleId = storageService.get<CanonicalRoleId | null>(STORAGE_KEY_ROLE_ID, null);
  if (savedRoleId && CANONICAL_ROLES[savedRoleId]) {
    return {
      roleId: savedRoleId,
      role: CANONICAL_ROLES[savedRoleId].role,
    };
  }
  return {
    roleId: user.roleId,
    role: user.role,
  };
};

const initialUser = getInitialUser();
const initialRoleInfo = getInitialRole(initialUser);

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: initialUser,
  availableDemoUsers: INITIAL_DEMO_USERS,
  activeRole: initialRoleInfo.role,
  activeRoleId: initialRoleInfo.roleId,
  isAuthenticated: true,

  switchUser: (userId: string) => {
    const user = INITIAL_DEMO_USERS.find((u) => u.id === userId);
    if (!user) return;

    // Asignar primer rol permitido para el usuario
    const defaultRoleId = user.allowedRoleIds[0] || user.roleId;
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

    storageService.set(STORAGE_KEY_ROLE_ID, roleId);

    set((state) => ({
      activeRoleId: roleId,
      activeRole: roleDef.role,
      currentUser: {
        ...state.currentUser,
        roleId: roleId,
        role: roleDef.role,
        roleLabel: roleDef.label,
      },
    }));
  },

  login: (user: User) => {
    const matched = INITIAL_DEMO_USERS.find((u) => u.id === user.id) || {
      ...user,
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

  logout: () => {
    storageService.remove(STORAGE_KEY_USER_ID);
    storageService.remove(STORAGE_KEY_ROLE_ID);
    set({
      isAuthenticated: false,
    });
  },
}));

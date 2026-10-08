import { create } from 'zustand';
import type { User, CanonicalRole, CanonicalRoleId } from '../types';
import { CANONICAL_ROLES } from '../types';

interface AuthState {
  currentUser: User | null;
  activeRole: CanonicalRole;
  activeRoleId: CanonicalRoleId;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  switchRole: (roleId: CanonicalRoleId) => void;
}

// Usuario demo inicial: Joan Cristian Medina Quispe (Gestor / PU-02)
const INITIAL_DEMO_USER: User = {
  id: 'USR-001',
  username: 'jmedina',
  fullName: 'Joan Cristian Medina Quispe',
  email: 'jmedina@exodo.pe',
  roleId: 'PU-02',
  role: 'GESTOR',
  roleLabel: CANONICAL_ROLES['PU-02'].label,
  organization: 'ÉXODO S.A.C.',
  isActive: true,
};

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: INITIAL_DEMO_USER,
  activeRole: 'GESTOR',
  activeRoleId: 'PU-02',
  isAuthenticated: true,

  login: (user: User) =>
    set({
      currentUser: user,
      activeRole: user.role,
      activeRoleId: user.roleId,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      currentUser: null,
      activeRole: 'SOLICITANTE',
      activeRoleId: 'PU-01',
      isAuthenticated: false,
    }),

  switchRole: (roleId: CanonicalRoleId) => {
    const roleDef = CANONICAL_ROLES[roleId];
    set((state) => ({
      activeRoleId: roleId,
      activeRole: roleDef.role,
      currentUser: state.currentUser
        ? {
            ...state.currentUser,
            roleId: roleId,
            role: roleDef.role,
            roleLabel: roleDef.label,
          }
        : null,
    }));
  },
}));

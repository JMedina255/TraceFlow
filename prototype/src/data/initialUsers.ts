import type { CanonicalRoleId, UserAccount, User } from '../types';

export interface DemoUserConfig extends User {
  allowedRoleIds: CanonicalRoleId[];
}

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'USR-001',
    username: 'jmedina',
    fullName: 'Joan Cristian Medina Quispe',
    email: 'jmedina@exodo.pe',
    organization: 'ÉXODO S.A.C.',
    position: 'Director de Calidad y Procesos',
    cargo: 'Director de Calidad y Procesos',
    isActive: true,
    primaryRoleId: 'PU-02',
    assignedRoleIds: ['PU-02', 'PU-01'], // Gestor y Solicitante
    assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
  },
  {
    id: 'USR-002',
    username: 'rantayhua',
    fullName: 'Renzo Antonio Antayhua Mamani',
    email: 'rantayhua@exodo.pe',
    organization: 'ÉXODO S.A.C.',
    position: 'Arquitecto de Software Principal',
    cargo: 'Arquitecto de Software Principal',
    isActive: true,
    primaryRoleId: 'PU-03',
    assignedRoleIds: ['PU-03', 'PU-06'], // Arquitecto y Desarrollador
    assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
  },
  {
    id: 'USR-003',
    username: 'arivera',
    fullName: 'Augusto Joaquin Rivera Muñoz',
    email: 'arivera@exodo.pe',
    organization: 'ÉXODO S.A.C.',
    position: 'Jefe de SCM y Aseguramiento',
    cargo: 'Jefe de SCM y Aseguramiento',
    isActive: true,
    primaryRoleId: 'PU-05',
    assignedRoleIds: ['PU-05', 'PU-07'], // Bibliotecario y Calidad
    assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
  },
  {
    id: 'USR-004',
    username: 'rloyola',
    fullName: 'Renzo Fernando Loyola Vilca Choque',
    email: 'rloyola@exodo.pe',
    organization: 'ÉXODO S.A.C.',
    position: 'Coordinador de Proyectos y CCB',
    cargo: 'Coordinador de Proyectos y CCB',
    isActive: true,
    primaryRoleId: 'PU-04',
    assignedRoleIds: ['PU-04'], // Miembro del CCB
    assignedProjectIds: ['PRJ-001', 'PRJ-002'], // Restringido: NO tiene acceso a PRJ-003
  },
];

// Adaptador de compatibilidad para código existente que use INITIAL_DEMO_USERS
export const INITIAL_DEMO_USERS: DemoUserConfig[] = INITIAL_USER_ACCOUNTS.map((account) => {
  const primaryRole = account.primaryRoleId;
  return {
    ...account,
    roleId: primaryRole,
    role: primaryRole === 'PU-01' ? 'SOLICITANTE'
      : primaryRole === 'PU-02' ? 'GESTOR'
      : primaryRole === 'PU-03' ? 'ARQUITECTO'
      : primaryRole === 'PU-04' ? 'CCB'
      : primaryRole === 'PU-05' ? 'BIBLIOTECARIO'
      : primaryRole === 'PU-06' ? 'DESARROLLADOR' : 'CALIDAD',
    roleLabel: primaryRole,
    allowedRoleIds: account.assignedRoleIds,
  };
});

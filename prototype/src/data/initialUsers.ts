import type { CanonicalRoleId, User } from '../types';

export interface DemoUserConfig extends User {
  allowedRoleIds: CanonicalRoleId[];
}

export const INITIAL_DEMO_USERS: DemoUserConfig[] = [
  {
    id: 'USR-001',
    username: 'jmedina',
    fullName: 'Joan Cristian Medina Quispe',
    email: 'jmedina@exodo.pe',
    roleId: 'PU-02',
    role: 'GESTOR',
    roleLabel: 'Analista de Requerimientos / Gestor',
    organization: 'ÉXODO S.A.C.',
    isActive: true,
    allowedRoleIds: ['PU-02', 'PU-01'], // Gestor y Solicitante
  },
  {
    id: 'USR-002',
    username: 'rantayhua',
    fullName: 'Renzo Antonio Antayhua Mamani',
    email: 'rantayhua@exodo.pe',
    roleId: 'PU-03',
    role: 'ARQUITECTO',
    roleLabel: 'Arquitecto / Especialista Técnico',
    organization: 'ÉXODO S.A.C.',
    isActive: true,
    allowedRoleIds: ['PU-03', 'PU-06'], // Arquitecto y Desarrollador
  },
  {
    id: 'USR-003',
    username: 'arivera',
    fullName: 'Augusto Joaquin Rivera Muñoz',
    email: 'arivera@exodo.pe',
    roleId: 'PU-05',
    role: 'BIBLIOTECARIO',
    roleLabel: 'Administrador de Configuración / Bibliotecario',
    organization: 'ÉXODO S.A.C.',
    isActive: true,
    allowedRoleIds: ['PU-05', 'PU-07'], // Bibliotecario y Calidad
  },
  {
    id: 'USR-004',
    username: 'rloyola',
    fullName: 'Renzo Fernando Loyola Vilca Choque',
    email: 'rloyola@exodo.pe',
    roleId: 'PU-04',
    role: 'CCB',
    roleLabel: 'Comité de Control de Cambios (CCB)',
    organization: 'ÉXODO S.A.C.',
    isActive: true,
    allowedRoleIds: ['PU-04', 'PU-06', 'PU-01'], // CCB, Desarrollador y Solicitante
  },
];

/**
 * Definiciones de Autenticación, Usuarios y Roles Canónicos
 * Basado en: FD03 (TB-09), FD04 (Sección 3.4), FD05 (Sección 20)
 */

export type CanonicalRoleId =
  | 'PU-01'
  | 'PU-02'
  | 'PU-03'
  | 'PU-04'
  | 'PU-05'
  | 'PU-06'
  | 'PU-07';

export type CanonicalRole =
  | 'SOLICITANTE'
  | 'GESTOR'
  | 'ARQUITECTO'
  | 'CCB'
  | 'BIBLIOTECARIO'
  | 'DESARROLLADOR'
  | 'CALIDAD';

export interface RoleDefinition {
  id: CanonicalRoleId;
  role: CanonicalRole;
  label: string;
  technicalLevel: 'Básico' | 'Medio' | 'Avanzado' | 'Experto';
  description: string;
}

export const CANONICAL_ROLES: Record<CanonicalRoleId, RoleDefinition> = {
  'PU-01': {
    id: 'PU-01',
    role: 'SOLICITANTE',
    label: 'Solicitante',
    technicalLevel: 'Básico',
    description: 'Registra RFCs, subsana observaciones y valida la aceptación final (UAT).',
  },
  'PU-02': {
    id: 'PU-02',
    role: 'GESTOR',
    label: 'Analista de Requerimientos / Gestor',
    technicalLevel: 'Avanzado',
    description: 'Valida completitud, clasifica severidad, administra proyectos y autoriza Cambios Menores.',
  },
  'PU-03': {
    id: 'PU-03',
    role: 'ARQUITECTO',
    label: 'Arquitecto / Especialista Técnico',
    technicalLevel: 'Experto',
    description: 'Elabora el informe de impacto técnico y cataloga nuevos ECS.',
  },
  'PU-04': {
    id: 'PU-04',
    role: 'CCB',
    label: 'Comité de Control de Cambios (CCB)',
    technicalLevel: 'Avanzado',
    description: 'Órgano decisional colegiado; aprueba o rechaza Cambios Mayores y emite ECNs.',
  },
  'PU-05': {
    id: 'PU-05',
    role: 'BIBLIOTECARIO',
    label: 'Administrador de Configuración / Bibliotecario',
    technicalLevel: 'Experto',
    description: 'Custodio de bibliotecas SCM; ejecuta Check-Out/In, bloqueos, Líneas Base y Rollbacks.',
  },
  'PU-06': {
    id: 'PU-06',
    role: 'DESARROLLADOR',
    label: 'Ingeniero de Software / Desarrollador',
    technicalLevel: 'Medio',
    description: 'Implementa cambios sobre ECS en la Biblioteca de Trabajo y corre pruebas unitarias.',
  },
  'PU-07': {
    id: 'PU-07',
    role: 'CALIDAD',
    label: 'Equipo de Calidad / Testing',
    technicalLevel: 'Medio',
    description: 'Ejecuta pruebas en Biblioteca de Soporte y emite Certificaciones de Conformidad.',
  },
};

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  roleId: CanonicalRoleId;
  role: CanonicalRole;
  roleLabel: string;
  avatarUrl?: string;
  organization: string; // Ej. "ÉXODO S.A.C."
  isActive: boolean;
}

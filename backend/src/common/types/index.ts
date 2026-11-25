export type CanonicalRoleId =
  | 'PU-01' // Solicitante
  | 'PU-02' // Analista / Gestor de Configuración
  | 'PU-03' // Arquitecto / Especialista Técnico
  | 'PU-04' // Comité de Control de Cambios (CCB)
  | 'PU-05' // Bibliotecario / Administrador SCM
  | 'PU-06' // Desarrollador / Ingeniero de Software
  | 'PU-07'; // Calidad / Testing (QA)

export type RFCStatus =
  | 'REGISTRADA'
  | 'EN_SUBSANACION'
  | 'CLASIFICADA'
  | 'EN_ANALISIS_TECNICO'
  | 'EN_EVALUACION'
  | 'AUTORIZADA'
  | 'ORDEN_EMITIDA'
  | 'EN_IMPLEMENTACION'
  | 'EN_PRUEBAS'
  | 'EN_ACEPTACION'
  | 'DESESTIMADA'
  | 'RECHAZADA'
  | 'CANCELADA'
  | 'IMPLEMENTADA';

export type ChangeClassification = 'CAMBIO_MENOR' | 'CAMBIO_MAYOR' | 'PENDIENTE';
export type Priority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface AuthenticatedUser {
  id: string; // UUID
  code: string; // ej. USR-001
  username: string;
  email: string;
  fullName: string;
  organization: string;
  position: string;
  activeRoleId: CanonicalRoleId;
  allowedRoleIds: CanonicalRoleId[];
  assignedProjectIds: string[]; // Códigos de proyecto ej. PRJ-001
}

/**
 * Definiciones de Órdenes de Cambio (ECN/ECO)
 * Basado en: RF-07, RN-01, RN-03, CU-08, CU-22
 */

export type ECNStatus =
  | 'EMITIDA'      // Formalizada, habilita Check-Out
  | 'EN_CURSO'     // Check-Out realizado, trabajo activo
  | 'CERTIFICADA'  // QA aprobó, UAT suscrita
  | 'CANCELADA'    // Fallo insubsanable con rollback (RN-08)
  | 'CERRADA';     // Check-In y Línea Base completados

export interface ECN {
  id: string; // Ej. "ECN-2026-0015"
  code: string;
  rfcId: string;
  rfcCode: string;
  projectId: string;
  affectedEcsId: string;
  affectedEcsCode: string;
  authorizerRole: 'CCB' | 'AUTORIDAD_DELEGADA';
  authorizers: string[]; // Nombres de los firmantes
  assignedDeveloperId: string; // PU-06 asignado
  assignedDeveloperName: string;
  status: ECNStatus;
  instructions: string;
  plannedCompletionDate: string;
  emittedAt: string;
  closedAt?: string;
}

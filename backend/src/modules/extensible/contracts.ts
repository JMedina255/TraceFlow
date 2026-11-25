/**
 * Contratos y DTOs de Arquitectura Extensible para Fases Subsiguientes
 * (Hitos DB-02 y Posteriores — Conforme al SAD de Diseño v0.2)
 * 
 * NOTA DE GOBERNANZA:
 * Estos contratos formalizan los tipos e interfaces aprobados en los ADR-003 a ADR-008.
 * No deben declararse como endpoints implementados hasta que se desarrollen sus respectivos
 * casos de uso con sus pruebas correspondientes.
 */

export interface ChangeOrderDto {
  code: string; // ECN-2026-XXXX
  rfcId: string;
  ecsId: string;
  assignedDeveloperId: string;
  workBranch: string;
}

export interface CcbVoteDto {
  resolutionId: string;
  rfcId: string;
  decision: 'APROBAR' | 'RECHAZAR' | 'ABSTENERSE';
  justification: string;
}

export interface SyncLockCheckOutDto {
  ecsId: string;
  changeOrderId: string;
  workLibraryPath: string;
}

export interface QaCertificationDto {
  changeOrderId: string;
  ecsVersionId: string;
  result: 'CONFORME' | 'NO_CONFORME';
  testSuiteSummary: string;
}

export interface UatAcceptanceDto {
  changeOrderId: string;
  ecsVersionId: string;
  result: 'ACEPTADO' | 'RECHAZADO';
  observations: string;
}

export interface BaselineFreezeDto {
  projectId: string;
  code: string;
  name: string;
  versionLabel: string; // mayor.menor.parche (RN-02)
  ecsVersionIds: string[];
}

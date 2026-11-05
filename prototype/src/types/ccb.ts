import type { CanonicalRoleId } from './auth';

export type CcbVoteDecision = 'APROBAR' | 'RECHAZAR' | 'ABSTENCION';

export type CcbSessionStatus = 'ABIERTA' | 'EN_DELIBERACION' | 'CERRADA';

export type CcbResolutionStatus = 'BORRADOR' | 'DEFINITIVA';

export type CcbResolutionDecision = 'APROBADO' | 'RECHAZADO' | 'PENDIENTE';

export interface CcbVote {
  id: string;                     // Correlativo ej. "VOTE-2026-0001"
  sessionId: string;
  rfcId: string;
  voterUserId: string;
  voterUserName: string;
  voterRoleId: CanonicalRoleId;   // 'PU-04'
  decision: CcbVoteDecision;      // 'APROBAR' | 'RECHAZAR' | 'ABSTENCION'
  justification: string;          // Mínimo 10 caracteres
  votedAt: string;                // ISO 8601
}

export interface CcbSession {
  id: string;                     // Correlativo ej. "CCB-2026-0001"
  rfcId: string;
  rfcCode: string;
  projectId: string;
  impactReportId: string;
  convenedBy: string;             // User ID que convocó
  convenedByName: string;
  openedAt: string;               // ISO 8601
  closedAt?: string;
  status: CcbSessionStatus;
  participants: string[];         // User IDs autorizados participantes
}

export interface CcbVoteTally {
  approve: number;
  reject: number;
  abstain: number;
  total: number;
}

export interface CcbResolution {
  id: string;                     // Correlativo ej. "ACTA-2026-0001"
  sessionId: string;
  rfcId: string;
  rfcCode: string;
  projectId: string;
  votes: CcbVote[];
  tally: CcbVoteTally;
  resolution: CcbResolutionDecision; // 'APROBADO' | 'RECHAZADO' | 'PENDIENTE'
  justification: string;          // Observaciones de sesión
  issuedBy: string;               // User ID emisor
  issuedByName: string;
  issuedAt: string;               // ISO 8601
  status: CcbResolutionStatus;    // 'BORRADOR' | 'DEFINITIVA'
}

export interface OpenCcbSessionDTO {
  rfcId: string;
}

export interface RegisterCcbVoteDTO {
  sessionId: string;
  decision: CcbVoteDecision;
  justification: string;
}

export interface GenerateCcbResolutionDTO {
  sessionId: string;
  resolution: CcbResolutionDecision;
  justification: string;
  finalize?: boolean;
}

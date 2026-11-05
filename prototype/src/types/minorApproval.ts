import type { CanonicalRoleId } from './auth';

export type ApprovalDecision = 'APROBADO' | 'RECHAZADO';

export type ApprovalRole = 'GESTOR' | 'ARQUITECTO';

export interface MinorApprovalRecord {
  id: string;                     // Correlativo ej. "APR-2026-0001"
  rfcId: string;
  impactReportId: string;
  role: ApprovalRole;
  roleId: CanonicalRoleId;        // 'PU-02' o 'PU-03'
  userId: string;
  userName: string;
  decision: ApprovalDecision;
  justification: string;
  decidedAt: string;              // ISO 8601
  escalateToCcb?: boolean;        // Si se solicitó reescalamiento formal a Cambio Mayor
}

export interface DelegatedMinorApproval {
  rfcId: string;
  impactReportId: string;
  gestorApproval?: MinorApprovalRecord;
  architectApproval?: MinorApprovalRecord;
  overallStatus: 'PENDIENTE' | 'AUTORIZADA' | 'RECHAZADA' | 'REESCALADA_CCB';
  completedAt?: string;
}

export interface RegisterMinorApprovalDTO {
  rfcId: string;
  decision: ApprovalDecision;
  justification: string;
  escalateToCcb?: boolean;
}

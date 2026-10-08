/**
 * Definiciones de Aseguramiento de la Calidad (QA) y Aceptación de Usuario (UAT)
 * Basado en: RF-10, RF-11, RN-09, CU-16, CU-17, CU-18, CU-19, CU-29
 */

export interface NonConformityReport {
  id: string; // Ej. "NC-2026-0003"
  ecnId: string;
  rfcId: string;
  reportedByUserId: string; // PU-07
  reportedByUserName: string;
  defectDescription: string;
  severity: 'MENOR' | 'MAYOR' | 'CRITICA';
  iteration: number; // Número de ciclo de re-testeo (RF-11)
  isResolved: boolean;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface QACertification {
  id: string; // Ej. "CERT-QA-2026-0012"
  ecnId: string;
  rfcId: string;
  qaUserId: string; // PU-07
  qaUserName: string;
  testSuiteResult: 'CONFORME' | 'NO_CONFORME';
  testsPassed: number;
  testsTotal: number;
  certificateNumber: string;
  evidenceNotes: string;
  certifiedAt: string;
}

export interface UATAcceptanceAct {
  id: string; // Ej. "ACTA-UAT-2026-0009"
  rfcId: string;
  requesterId: string; // PU-01
  requesterName: string;
  isAccepted: boolean;
  rejectionReason?: string;
  validationFeedback: string;
  signedAt: string;
}

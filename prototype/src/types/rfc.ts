/**
 * Definiciones de Solicitud de Cambio (RFC) y Ciclo de Vida Oficial
 * Basado en: RF-04, RF-05, RF-06, RF-14, TB-07, DG-11, RN-05, RN-07
 */

export type RFCStatus =
  | 'REGISTRADA'          // 1. Inicial: Creada por Solicitante (CU-04)
  | 'EN_SUBSANACION'      // 2. Intermedio: Observada por Gestor, subsanada por Solicitante (CU-04.1)
  | 'CLASIFICADA'         // 3. Intermedio: Filtro superado, admitida por Gestor (CU-05)
  | 'EN_ANALISIS_TECNICO' // 4. Intermedio: Arquitecto elabora Informe de Impacto (CU-06)
  | 'EN_EVALUACION'       // 5. Intermedio: En deliberación CCB o Autoridad Delegada
  | 'AUTORIZADA'          // 6. Intermedio: Dictamen aprobatorio formal
  | 'ORDEN_EMITIDA'       // 7. Intermedio: ECN/ECO emitida (CU-08)
  | 'EN_IMPLEMENTACION'   // 8. Intermedio: Check-Out realizado, Dev modifica ECS (CU-10, 14)
  | 'EN_PRUEBAS'          // 9. Intermedio: QA ejecuta pruebas en Soporte (CU-16)
  | 'EN_ACEPTACION'       // 10. Intermedio: Solicitante valida UAT (CU-29)
  | 'DESESTIMADA'         // 11. Terminal: Inviable en filtro o no subsanada (CU-05)
  | 'RECHAZADA'           // 12. Terminal: Rechazada por CCB o Autoridad Delegada (CU-07, 30)
  | 'CANCELADA'           // 13. Terminal: Fallo no subsanado en QA/UAT + Rollback (CU-21, 22)
  | 'IMPLEMENTADA';       // 14. Terminal: Doble conformidad + Check-In Maestra + Línea Base (CU-12, 20)

export type ChangeClassification = 'CAMBIO_MENOR' | 'CAMBIO_MAYOR';

export type Priority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type ChangeCategory = 'CORRECTIVO' | 'ADAPTATIVO' | 'PERFECTIVO';

export interface RFCStatusMetadata {
  status: RFCStatus;
  label: string;
  isTerminal: boolean;
  responsibleActor: string;
  badgeVariant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'purple';
}

export const RFC_STATUS_CATALOG: Record<RFCStatus, RFCStatusMetadata> = {
  REGISTRADA: {
    status: 'REGISTRADA',
    label: 'Registrada',
    isTerminal: false,
    responsibleActor: 'Solicitante',
    badgeVariant: 'neutral',
  },
  EN_SUBSANACION: {
    status: 'EN_SUBSANACION',
    label: 'En Subsanación',
    isTerminal: false,
    responsibleActor: 'Solicitante',
    badgeVariant: 'warning',
  },
  CLASIFICADA: {
    status: 'CLASIFICADA',
    label: 'Clasificada',
    isTerminal: false,
    responsibleActor: 'Analista de Requerimientos / Gestor',
    badgeVariant: 'info',
  },
  EN_ANALISIS_TECNICO: {
    status: 'EN_ANALISIS_TECNICO',
    label: 'En Análisis Técnico',
    isTerminal: false,
    responsibleActor: 'Arquitecto / Especialista Técnico',
    badgeVariant: 'info',
  },
  EN_EVALUACION: {
    status: 'EN_EVALUACION',
    label: 'En Evaluación',
    isTerminal: false,
    responsibleActor: 'CCB / Autoridad Delegada',
    badgeVariant: 'purple',
  },
  AUTORIZADA: {
    status: 'AUTORIZADA',
    label: 'Autorizada',
    isTerminal: false,
    responsibleActor: 'CCB / Autoridad Delegada',
    badgeVariant: 'success',
  },
  ORDEN_EMITIDA: {
    status: 'ORDEN_EMITIDA',
    label: 'Orden Emitida',
    isTerminal: false,
    responsibleActor: 'CCB / Gestor',
    badgeVariant: 'purple',
  },
  EN_IMPLEMENTACION: {
    status: 'EN_IMPLEMENTACION',
    label: 'En Implementación',
    isTerminal: false,
    responsibleActor: 'Ingeniero de Software / Desarrollador',
    badgeVariant: 'info',
  },
  EN_PRUEBAS: {
    status: 'EN_PRUEBAS',
    label: 'En Pruebas',
    isTerminal: false,
    responsibleActor: 'Equipo de Calidad / Testing',
    badgeVariant: 'warning',
  },
  EN_ACEPTACION: {
    status: 'EN_ACEPTACION',
    label: 'En Aceptación',
    isTerminal: false,
    responsibleActor: 'Solicitante (Usuario Final)',
    badgeVariant: 'warning',
  },
  DESESTIMADA: {
    status: 'DESESTIMADA',
    label: 'Desestimada',
    isTerminal: true,
    responsibleActor: 'Analista de Requerimientos / Gestor',
    badgeVariant: 'neutral',
  },
  RECHAZADA: {
    status: 'RECHAZADA',
    label: 'Rechazada',
    isTerminal: true,
    responsibleActor: 'CCB / Autoridad Delegada',
    badgeVariant: 'danger',
  },
  CANCELADA: {
    status: 'CANCELADA',
    label: 'Cancelada',
    isTerminal: true,
    responsibleActor: 'Administrador / Bibliotecario',
    badgeVariant: 'danger',
  },
  IMPLEMENTADA: {
    status: 'IMPLEMENTADA',
    label: 'Implementada',
    isTerminal: true,
    responsibleActor: 'Administrador / Bibliotecario',
    badgeVariant: 'success',
  },
};

export interface TechnicalImpactAssessment {
  architectId: string;
  architectName: string;
  classification: ChangeClassification; // RN-05
  architectureImpactDescription: string;
  affectedEcsIds: string[];
  estimatedEffortHours: number;
  estimatedCost: number; // S/.
  estimatedDurationDays: number;
  technicalRisk: 'BAJO' | 'MEDIO' | 'ALTO';
  tripleConstraintImpact: {
    scopeAffected: boolean;
    scheduleAffected: boolean;
    costAffected: boolean;
  };
  reportDate: string;
}

export interface RFC {
  id: string; // Ej. "RFC-2026-0042"
  code: string;
  projectId: string;
  projectName: string;
  requesterId: string; // PU-01
  requesterName: string;
  title: string;
  description: string;
  justification: string;
  priority: Priority;
  category?: ChangeCategory;
  proposedSolution?: string;
  affectedEcsId: string;
  affectedEcsName: string;
  status: RFCStatus;
  classification?: ChangeClassification;
  subsanacionNotes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  technicalImpact?: TechnicalImpactAssessment;
  ecnId?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface CreateRfcDTO {
  projectId: string;
  title: string;
  description: string;
  justification: string;
  proposedSolution?: string;
  priority: Priority;
  category: ChangeCategory;
  affectedEcsId: string;
  attachments?: string[];
}

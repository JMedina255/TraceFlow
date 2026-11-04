import type { ChangeClassification } from './rfc';

export type ImpactRecommendation = 'PROCEDE_MENOR' | 'PROCEDE_MAYOR' | 'RECHAZO_TECNICO';

export type TechnicalRiskLevel = 'BAJO' | 'MEDIO' | 'ALTO';

export interface ImpactAnalysisDTO {
  rfcId: string;
  effortHours: number;
  estimatedCost: number;
  scheduleImpactDays: number;
  technicalSummary: string;
  affectedEcsIds: string[];
  technicalRisk: TechnicalRiskLevel;
  identifiedRisks: string[];
  recommendation: ImpactRecommendation;
  proposedClassification: ChangeClassification;
  rollbackPlan?: string;
}

export interface TechnicalImpactReport {
  id: string; // Ej. "TIA-2026-0001"
  rfcId: string;
  rfcCode: string;
  architectId: string;
  architectName: string;
  classification: ChangeClassification; // Dictamen de clasificación
  proposedClassification: ChangeClassification;
  architectureImpactDescription: string;
  technicalSummary: string;
  affectedEcsIds: string[];
  affectedEcsNames?: string[];
  estimatedEffortHours: number;
  estimatedCost: number;
  estimatedDurationDays: number;
  technicalRisk: TechnicalRiskLevel;
  identifiedRisks: string[];
  recommendation: ImpactRecommendation;
  rollbackPlan?: string;
  tripleConstraintImpact: {
    scopeAffected: boolean;
    scheduleAffected: boolean;
    costAffected: boolean;
  };
  reportDate: string; // ISO
  status: 'COMPLETADO';
}

/**
 * Definiciones de Incidencias y Soporte
 * Basado en: RF-15, PKG_SUPP (DG-04), CU-23, CU-24, CU-25
 */

export type IncidentStatus =
  | 'ABIERTA'
  | 'EN_ANALISIS'
  | 'DERIVADA_A_RFC' // Converted to RFC (CU-25)
  | 'RESUELTA'
  | 'CERRADA';

export type IncidentPriority = 'BAJA' | 'MEDIA' | 'ALTA';

export interface Incident {
  id: string; // Ej. "INC-2026-0008"
  code: string;
  projectId: string;
  projectName: string;
  reportedByUserId: string; // PU-01
  reportedByUserName: string;
  title: string;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  derivedRfcId?: string; // Trazabilidad si se deriva a RFC (CU-25)
  derivedRfcCode?: string;
  createdAt: string;
  updatedAt: string;
}

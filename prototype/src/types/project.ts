/**
 * Definiciones de Proyectos de ÉXODO S.A.C.
 * Basado en: RF-02, CU-02, CU-03, PKG_PROJ (DG-04)
 */

export type ProjectStatus = 'ACTIVO' | 'PLANIFICADO' | 'CONGELADO' | 'FINALIZADO';

export interface Project {
  id: string; // Ej. "PRJ-001"
  code: string; // Ej. "EXO-CORE"
  name: string;
  description: string;
  client: string; // Ej. "Banco Regional del Sur" / "ÉXODO S.A.C."
  managerId: string; // PU-02 asignado
  managerName: string;
  architectId: string; // PU-03 asignado
  architectName: string;
  librarianId: string; // PU-05 asignado
  librarianName: string;
  status: ProjectStatus;
  activeBaselineVersion?: string; // Ej. "v1.2.0"
  createdAt: string;
  updatedAt: string;
}

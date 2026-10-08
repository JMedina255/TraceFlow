/**
 * Definiciones de Elementos de Configuración de Software (ECS) y Bibliotecas
 * Basado en: RF-03, RF-08, RF-09, RN-04, RN-06, CU-09, CU-10, CU-11, CU-12
 */

export type ECSType =
  | 'CODIGO_FUENTE'
  | 'ESQUEMA_BD'
  | 'DOCUMENTO_TECNICO'
  | 'SCRIPT_DESPLIEGUE';

export type LibraryType =
  | 'TRABAJO'  // Work Library (Entorno de desarrollo local/transitorio)
  | 'SOPORTE'  // Support Library (Entorno de pruebas y control QA)
  | 'MAESTRA'; // Master Library (Repositorio congelado e inmutable)

export interface ECSLock {
  isLocked: boolean;
  lockedByUserId?: string;
  lockedByUserName?: string;
  lockedAt?: string;
  ecnId?: string; // Bloqueo estrictamente vinculado a una ECN autorizada (RN-06)
  workLibraryPath?: string;
}

export interface ECS {
  id: string; // Ej. "ECS-001"
  code: string; // Ej. "SRC-AUTH-01"
  name: string;
  description: string;
  type: ECSType;
  projectId: string;
  currentLibrary: LibraryType;
  currentVersion: string; // Formato mayor.menor.parche (RN-02)
  filePath: string;
  sha256Checksum: string; // Firma SHA-256 obligatoria (RNF-03)
  lock: ECSLock;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

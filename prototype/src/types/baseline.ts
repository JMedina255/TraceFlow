/**
 * Definiciones de Líneas Base (Baselines) y Rollback
 * Basado en: RF-12, RF-13, RN-02, RN-08, CU-20, CU-21
 */

export interface BaselineItem {
  ecsId: string;
  ecsCode: string;
  version: string; // Estándar mayor.menor.parche (RN-02)
  sha256Checksum: string;
  librarySource: 'SOPORTE' | 'MAESTRA';
}

export interface Baseline {
  id: string; // Ej. "BSL-2026-0004"
  code: string;
  projectId: string;
  version: string; // Ej. "v1.0.0"
  name: string;
  description: string;
  frozenByUserId: string; // PU-05
  frozenByUserName: string;
  items: BaselineItem[];
  isFrozen: boolean;
  frozenAt: string;
}

export interface RollbackRecord {
  id: string;
  ecsId: string;
  rfcId: string;
  ecnId: string;
  executedByUserId: string; // PU-05
  executedByUserName: string;
  targetVersion: string;
  reason: string;
  timestamp: string;
}

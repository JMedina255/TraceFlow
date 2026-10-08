/**
 * Definiciones de Auditoría Forense e Integridad Criptográfica
 * Basado en: RF-17, RNF-03, PKG_AUD (DG-04), CU-26, CU-27, ADR-008
 */

export type AuditActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'RFC_CREADA'
  | 'RFC_SUBSANADA'
  | 'RFC_CLASIFICADA'
  | 'RFC_EVALUADA_IMPACTO'
  | 'RFC_APROBADA_CCB'
  | 'RFC_APROBADA_MENOR'
  | 'RFC_RECHAZADA'
  | 'ECN_EMITIDA'
  | 'ECN_CANCELADA'
  | 'CHECK_OUT'
  | 'LOCK_APLICADO'
  | 'CHECK_IN'
  | 'LOCK_LIBERADO'
  | 'QA_CERTIFICACION_EMITIDA'
  | 'QA_DEFECTO_REPORTADO'
  | 'UAT_ACTA_SUSCRITA'
  | 'BASELINE_CONGELADA'
  | 'ROLLBACK_EJECUTADO'
  | 'INCIDENCIA_REGISTRADA'
  | 'INCIDENCIA_DERIVADA'
  | 'USUARIO_ACTUALIZADO'
  | 'RESET_DEMO_DATA';

export interface AuditEvent {
  id: string; // Ej. "EVT-2026-0091"
  timestamp: string; // ISO 8601
  userId: string;
  userName: string;
  userRole: string;
  action: AuditActionType;
  entityType: 'RFC' | 'ECN' | 'ECS' | 'BASELINE' | 'INCIDENT' | 'PROJECT' | 'USER' | 'SISTEMA';
  entityId: string;
  details: string;
  ipAddress: string;
  sha256Hash: string; // Verificación criptográfica obligatoria (RNF-03)
  previousEventHash?: string; // Cadena append-only a prueba de manipulación (ADR-008)
}

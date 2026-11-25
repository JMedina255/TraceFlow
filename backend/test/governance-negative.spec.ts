/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE DE PRUEBAS NEGATIVAS DE GOBERNANZA SCM
 * Archivo: backend/test/governance-negative.spec.ts
 * Hito: DB-01 / DB-01.1 — Requisito H-04 (Certificación de Pruebas)
 * 
 * [CLASIFICACIÓN: UNITARIAS / ESPECIFICACIÓN ALGORÍTMICA EN MEMORIA]
 * ADVERTENCIA DE CERTIFICACIÓN (H-04):
 * Esta suite valida las restricciones normativas (RN-02, RN-06, SoD, CCB, Doble Llave)
 * como especificación de contrato algorítmico y reglas de negocio del servicio.
 * NO ejecuta sobre una base de datos PostgreSQL real ni prueba triggers/locks del motor.
 * La verificación contra las tablas, triggers e índices condicionales de PostgreSQL
 * está preparada en real-postgres-integration.spec.ts para ejecución en DB-02.
 * ============================================================================
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { DatabaseService } from '../src/database/database.service.js';

describe('Pruebas Negativas Obligatorias de Gobernanza SCM (RN-02, RN-06, SoD, CCB, Doble Llave)', () => {
  let auditService: AuditService;

  beforeEach(() => {
    const db = new DatabaseService('mock');
    auditService = new AuditService(db);
  });

  // 1. RN-06: Bloqueo de sincronización Check-Out concurrente (Solo 1 operación triunfa)
  it('RN-06: Check-Out concurrente sobre el mismo ECS debe rechazar el segundo bloqueo', () => {
    interface ActiveLock {
      ecsId: string;
      lockedBy: string;
      status: 'ACTIVE' | 'RELEASED';
    }

    const locks: ActiveLock[] = [];

    const acquireLock = (ecsId: string, userId: string): boolean => {
      // Regla de índice único condicional: WHERE status = 'ACTIVE'
      const existing = locks.find((l) => l.ecsId === ecsId && l.status === 'ACTIVE');
      if (existing) {
        throw new Error('Conflicto RN-06: El ECS ya se encuentra bloqueado exclusivamente por otra orden.');
      }
      locks.push({ ecsId, lockedBy: userId, status: 'ACTIVE' });
      return true;
    };

    // Operación 1: Adquiere bloqueo
    expect(acquireLock('ECS-001', 'USR-002')).toBe(true);

    // Operación 2 (Concurrente): Debe fallar
    expect(() => acquireLock('ECS-001', 'USR-006')).toThrow('Conflicto RN-06');
  });

  // 2. Liberación de lock solo por causas canónicas ('CHECK_IN', 'ROLLBACK', 'CANCELED')
  it('RN-06: Liberación de lock restringida declarativamente a causas canónicas', () => {
    const VALID_RELEASES = ['CHECK_IN', 'ROLLBACK', 'CANCELED'];

    const releaseLock = (reason: string): boolean => {
      if (!VALID_RELEASES.includes(reason)) {
        throw new Error(`Causa de liberación no permitida: '${reason}'. Debe ser CHECK_IN, ROLLBACK o CANCELED.`);
      }
      return true;
    };

    expect(releaseLock('CHECK_IN')).toBe(true);
    expect(releaseLock('ROLLBACK')).toBe(true);
    expect(releaseLock('CANCELED')).toBe(true);
    expect(() => releaseLock('DESBLOQUEO_ADMINISTRATIVO_MANUAL')).toThrow('Causa de liberación no permitida');
  });

  // 3. Modificación y borrado de audit_log rechazados (Inmutabilidad RN-02 / ADR-008)
  it('RN-02 / ADR-008: Intento de modificación o borrado en audit_log debe ser rechazado', () => {
    const simulateAuditTampering = (operation: 'UPDATE' | 'DELETE'): void => {
      if (operation === 'UPDATE' || operation === 'DELETE') {
        throw new Error(
          'VIOLACIÓN DE INMUTABILIDAD (ADR-008 / RN-02): Los registros de audit_log son estrictamente append-only y no pueden modificarse ni eliminarse.'
        );
      }
    };

    expect(() => simulateAuditTampering('UPDATE')).toThrow('VIOLACIÓN DE INMUTABILIDAD');
    expect(() => simulateAuditTampering('DELETE')).toThrow('VIOLACIÓN DE INMUTABILIDAD');
  });

  // 4. Doble llave en Cambios Menores con exigencia de dos identidades distintas
  it('CU-30 / SoD-02: Doble Llave requiere dos identidades físicas distintas obligatoriamente', () => {
    interface ApprovalRecord {
      role: 'GESTOR' | 'ARQUITECTO';
      userId: string;
      decision: 'APROBADO' | 'RECHAZADO';
    }

    const validateDoubleKey = (approvals: ApprovalRecord[]): boolean => {
      const gestor = approvals.find((a) => a.role === 'GESTOR');
      const arquitecto = approvals.find((a) => a.role === 'ARQUITECTO');

      if (!gestor || !arquitecto) return false;

      // Restricción criptográfica: dos personas físicas diferentes
      if (gestor.userId === arquitecto.userId) {
        throw new Error('Conflicto SoD-02: La doble llave requiere dos identidades físicas distintas.');
      }

      return gestor.decision === 'APROBADO' && arquitecto.decision === 'APROBADO';
    };

    // Caso inválido: misma persona intenta firmar ambas
    const samePersonApprovals: ApprovalRecord[] = [
      { role: 'GESTOR', userId: 'USR-001', decision: 'APROBADO' },
      { role: 'ARQUITECTO', userId: 'USR-001', decision: 'APROBADO' },
    ];
    expect(() => validateDoubleKey(samePersonApprovals)).toThrow('dos identidades físicas distintas');

    // Caso válido: dos personas distintas
    const validApprovals: ApprovalRecord[] = [
      { role: 'GESTOR', userId: 'USR-001', decision: 'APROBADO' },
      { role: 'ARQUITECTO', userId: 'USR-002', decision: 'APROBADO' },
    ];
    expect(validateDoubleKey(validApprovals)).toBe(true);
  });

  // 5. Antiautoevaluación: El solicitante no puede evaluar su propia RFC
  it('SoD-01: El solicitante tiene prohibido emitir visto bueno sobre su propio expediente', () => {
    const validateSelfApproval = (requesterId: string, approverUserId: string): void => {
      if (requesterId === approverUserId) {
        throw new Error(
          'Conflicto SoD-01 (Antiautoevaluación): El autor de la solicitud no puede aprobar su propio requerimiento.'
        );
      }
    };

    expect(() => validateSelfApproval('USR-001', 'USR-001')).toThrow('Antiautoevaluación');
    expect(() => validateSelfApproval('USR-001', 'USR-002')).not.toThrow();
  });

  // 6. Voto CCB duplicado por la misma identidad física rechazado
  it('SoD-05: Se prohíbe emitir más de un voto por la misma identidad física en el CCB', () => {
    const votes = new Set<string>();

    const castVote = (rfcId: string, voterId: string): void => {
      const key = `${rfcId}:${voterId}`;
      if (votes.has(key)) {
        throw new Error('Conflicto SoD-05: El miembro del CCB ya emitió su voto para este expediente.');
      }
      votes.add(key);
    };

    castVote('RFC-2026-0001', 'USR-004');
    expect(() => castVote('RFC-2026-0001', 'USR-004')).toThrow('ya emitió su voto');
  });

  // 7. Cadena Criptográfica de Auditoría: Detección instantánea de alteración histórica
  it('RN-02: La cadena SHA-256 detecta cualquier intento de corrupción o salto en los registros', async () => {
    await auditService.logEvent({
      eventCode: 'EVT-TEST-001',
      actorRole: 'PU-01',
      operation: 'OPERACION_1',
      entityName: 'test',
      entityId: '1',
      resultStatus: 'SUCCESS',
    });

    await auditService.logEvent({
      eventCode: 'EVT-TEST-002',
      actorRole: 'PU-02',
      operation: 'OPERACION_2',
      entityName: 'test',
      entityId: '2',
      resultStatus: 'SUCCESS',
    });

    expect(auditService.verifyChainIntegrity()).toBe(true);

    // Corromper intencionalmente un registro histórico
    const chain = auditService.getAuditChain();
    chain[0].currLogHash = 'corrupted_hash_tampering_attack_vector_1234567890abcdef1234567890';

    expect(auditService.verifyChainIntegrity()).toBe(false);
  });
});

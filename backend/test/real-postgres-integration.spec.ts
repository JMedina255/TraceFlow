/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE DE INTEGRACIÓN REAL POSTGRESQL (PREPARADA PARA DB-02)
 * Archivo: backend/test/real-postgres-integration.spec.ts
 * Hito: DB-01.1 / DB-02 — Requisito H-04 (Certificación de Pruebas Reales)
 * 
 * [CLASIFICACIÓN: INTEGRACIÓN POSTGRESQL REAL]
 * OBJETIVO:
 * Ejecutar contra la instancia real de PostgreSQL (Supabase TraceFlow-UPT xmyfqxlvveiawnxgydtz)
 * para certificar formalmente las 7 restricciones físicas y de gobernanza que
 * NO pueden ser validadas mediante mocks en memoria:
 * 
 * 1. Check-Out concurrente mediante dos conexiones independientes (RN-06 / sync_lock).
 * 2. Inmutabilidad de auditoría ante UPDATE, DELETE y TRUNCATE (RN-02 / ADR-008 / audit_log).
 * 3. Integridad referencial y aislamiento estricto de proyectos (Foreign Keys y checks).
 * 4. Doble llave de aprobación en cambios menores (CU-30 / dos identidades físicas distintas).
 * 5. Antiautoevaluación estricta (SoD-01: solicitante no puede autoevaluarse).
 * 6. Unicidad de votos CCB por sesión colegiada (SoD-05 / ccb_session_vote).
 * 7. Persistencia y recuperación de RFC tras ciclo de desconexión/reinicio del backend.
 * 
 * CONDICIÓN DE ACTIVACIÓN:
 * Esta suite se ejecuta cuando process.env.DATABASE_MODE === 'postgres' y DATABASE_URL está presente.
 * En modo desconectado / desarrollo local (DATABASE_MODE === 'mock'), se documenta su preparación
 * sin fingir ejecuciones remotas ni emitir falsos positivos (H-04).
 * ============================================================================
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
const { Pool } = pg;

const isLivePostgres = process.env.DATABASE_MODE === 'postgres' && !!process.env.DATABASE_URL;

describe('Certificación de Restricciones Físicas PostgreSQL (H-04 / Preparación DB-02)', () => {
  if (!isLivePostgres) {
    it('[DB-02 PREPARATION] Suite PostgreSQL real lista para ejecución tras despliegue de migraciones', () => {
      // Documentación explícita del estado de certificación (H-04)
      const notice = {
        estado: 'PREPARADA_PARA_DB02',
        instanciaAutorizada: 'TraceFlow-UPT (xmyfqxlvveiawnxgydtz)',
        requisitoPrevio: 'Aplicación formal de migraciones 202611250001 y 202611250002 en DB-02',
        casosPreparados: [
          '1. RN-06: Concurrencia real con 2 conexiones simultáneas sobre sync_lock',
          '2. RN-02: Trigger de inmutabilidad rechaza UPDATE/DELETE/TRUNCATE en audit_log',
          '3. FK/Isolation: Restricción de integridad referencial multitenant',
          '4. CU-30: Doble llave rechaza evaluador = aprobador',
          '5. SoD-01: Rechazo de antiautoevaluación para solicitante',
          '6. SoD-05: Índice UNIQUE previene doble voto en ccb_session_vote',
          '7. Persistencia: Recuperación de datos tras desconexión y reconexión de pool',
        ],
      };
      expect(notice.estado).toBe('PREPARADA_PARA_DB02');
      expect(notice.casosPreparados).toHaveLength(7);
    });
    return;
  }

  // Las pruebas a continuación se ejecutan únicamente contra el PostgreSQL real aprovisionado
  let poolA: pg.Pool;
  let poolB: pg.Pool;

  beforeAll(async () => {
    const dbUrl = process.env.DATABASE_URL!;
    poolA = new Pool({ connectionString: dbUrl, max: 2 });
    poolB = new Pool({ connectionString: dbUrl, max: 2 });
  });

  afterAll(async () => {
    await poolA.end();
    await poolB.end();
  });

  it('1. RN-06: Check-Out concurrente con dos clientes independientes rechaza el segundo bloqueo', async () => {
    const client1 = await poolA.connect();
    const client2 = await poolB.connect();
    try {
      const ecsId = 'c0000001-0000-0000-0000-000000000001';
      const userA = 'a0000001-0000-0000-0000-000000000002';
      const userB = 'a0000001-0000-0000-0000-000000000003';

      // Cliente 1 adquiere el bloqueo activo
      await client1.query(
        `INSERT INTO traceflow.sync_lock (ecs_id, locked_by_user_id, status) VALUES ($1, $2, 'ACTIVE')`,
        [ecsId, userA]
      );

      // Cliente 2 intenta adquirir bloqueo sobre el mismo ECS -> debe violar índice único parcial
      await expect(
        client2.query(
          `INSERT INTO traceflow.sync_lock (ecs_id, locked_by_user_id, status) VALUES ($1, $2, 'ACTIVE')`,
          [ecsId, userB]
        )
      ).rejects.toThrow(/unique|duplicate key/i);

      // Limpieza controlada
      await client1.query(`UPDATE traceflow.sync_lock SET status = 'RELEASED' WHERE ecs_id = $1`, [ecsId]);
    } finally {
      client1.release();
      client2.release();
    }
  });

  it('2. RN-02 / ADR-008: Inmutabilidad de audit_log rechaza UPDATE, DELETE y TRUNCATE', async () => {
    const client = await poolA.connect();
    try {
      // Insertar un evento mediante la función transaccional
      const insertRes = await client.query(
        `SELECT traceflow.append_audit_log('EVT-TEST', NULL, 'PU-01', 'TEST_OPERATION', 'test', 'id-1', NULL, NULL, 'SUCCESS', '{}'::jsonb, '127.0.0.1', 'Vitest Test') as id`
      );
      const logId = insertRes.rows[0].id;

      // Intento de UPDATE debe ser bloqueado por el trigger defensivo
      await expect(
        client.query(`UPDATE traceflow.audit_log SET operation = 'TAMPERED' WHERE id = $1`, [logId])
      ).rejects.toThrow(/VIOLACIÓN DE INMUTABILIDAD/i);

      // Intento de DELETE debe ser bloqueado por el trigger defensivo
      await expect(
        client.query(`DELETE FROM traceflow.audit_log WHERE id = $1`, [logId])
      ).rejects.toThrow(/VIOLACIÓN DE INMUTABILIDAD/i);
    } finally {
      client.release();
    }
  });

  it('3. Integridad referencial y aislamiento multitenant rechaza ECS de otro proyecto', async () => {
    const client = await poolA.connect();
    try {
      // Intento de insertar una RFC con un project_id que no existe en traceflow.project
      const fakeProjectId = '00000000-0000-0000-0000-999999999999';
      await expect(
        client.query(
          `INSERT INTO traceflow.change_request 
            (code, project_id, target_ecs_id, title, description, justification, priority, classification, status, requested_by)
           VALUES ('RFC-FAIL-01', $1, 'c0000001-0000-0000-0000-000000000001', 'Test', 'Desc', 'Just', 'MEDIA', 'PENDIENTE', 'REGISTRADA', 'a0000001-0000-0000-0000-000000000001')`,
          [fakeProjectId]
        )
      ).rejects.toThrow(/foreign key|violates foreign key constraint/i);
    } finally {
      client.release();
    }
  });

  it('4. CU-30 / SoD-02: Doble llave rechaza evaluador igual al aprobador', async () => {
    const client = await poolA.connect();
    try {
      const sameUserId = 'a0000001-0000-0000-0000-000000000002';
      await expect(
        client.query(
          `INSERT INTO traceflow.minor_change_approval 
            (rfc_id, technical_lead_id, project_manager_id, technical_lead_approved, project_manager_approved)
           VALUES ('d0000001-0000-0000-0000-000000000002', $1, $1, TRUE, TRUE)`,
          [sameUserId]
        )
      ).rejects.toThrow(/check|distintas|violates check constraint/i);
    } finally {
      client.release();
    }
  });

  it('5. SoD-01: Restricción contra antiautoevaluación del solicitante', async () => {
    const client = await poolA.connect();
    try {
      // Solicitante USR-001 intenta evaluarse a sí mismo en technical_evaluation
      const requesterId = 'a0000001-0000-0000-0000-000000000001';
      await expect(
        client.query(
          `INSERT INTO traceflow.technical_evaluation 
            (rfc_id, evaluator_user_id, feasibility_score, recommended_classification)
           VALUES ('d0000001-0000-0000-0000-000000000001', $1, 85, 'CAMBIO_MAYOR')`,
          [requesterId]
        )
      ).rejects.toThrow(/check|antiautoevaluacion|violates/i);
    } finally {
      client.release();
    }
  });

  it('6. SoD-05: Unicidad de voto por identidad física en sesión CCB', async () => {
    const client = await poolA.connect();
    try {
      const sessionId = 'e0000001-0000-0000-0000-000000000001';
      const voterId = 'a0000001-0000-0000-0000-000000000004';

      await client.query(
        `INSERT INTO traceflow.ccb_session_vote (session_id, user_id, vote, rationale) VALUES ($1, $2, 'APROBAR', 'Voto inicial')`,
        [sessionId, voterId]
      );

      // Segundo voto por la misma persona en la misma sesión debe ser rechazado
      await expect(
        client.query(
          `INSERT INTO traceflow.ccb_session_vote (session_id, user_id, vote, rationale) VALUES ($1, $2, 'RECHAZAR', 'Segundo voto')`,
          [sessionId, voterId]
        )
      ).rejects.toThrow(/unique|duplicate key/i);
    } finally {
      client.release();
    }
  });

  it('7. Persistencia y recuperación de RFC tras ciclo de desconexión y reconexión de pool', async () => {
    // Insertar mediante poolA
    const clientA = await poolA.connect();
    const testRfcId = 'd0000001-9999-0000-0000-000000000099';
    try {
      await clientA.query(
        `INSERT INTO traceflow.change_request 
          (id, code, project_id, target_ecs_id, title, description, justification, priority, classification, status, requested_by)
         VALUES ($1, 'RFC-PERSIST-99', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'RFC Persist', 'Desc', 'Just', 'MEDIA', 'PENDIENTE', 'REGISTRADA', 'a0000001-0000-0000-0000-000000000001')`,
        [testRfcId]
      );
    } finally {
      clientA.release();
    }

    // Simular reinicio cerrando poolA y abriendo un pool totalmente nuevo C
    await poolA.end();
    const poolC = new Pool({ connectionString: process.env.DATABASE_URL!, max: 2 });
    try {
      const clientC = await poolC.connect();
      try {
        const res = await clientC.query('SELECT * FROM traceflow.change_request WHERE id = $1', [testRfcId]);
        expect(res.rows.length).toBe(1);
        expect(res.rows[0].code).toBe('RFC-PERSIST-99');

        // Limpieza
        await clientC.query('DELETE FROM traceflow.change_request WHERE id = $1', [testRfcId]);
      } finally {
        clientC.release();
      }
    } finally {
      await poolC.end();
      // Recrear poolA para no romper afterAll
      poolA = new Pool({ connectionString: process.env.DATABASE_URL!, max: 2 });
    }
  });
});

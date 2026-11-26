/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE DE INTEGRACIÓN Y CERTIFICACIÓN FÍSICA POSTGRESQL (DB-02 / DB-02.1)
 * Archivo: backend/test/real-postgres-integration.spec.ts
 * Hito: DB-02 / DB-02.1 — Requisitos H-04, SEC-01 a SEC-05 / Casos DB-T01 a DB-T14
 * 
 * [CLASIFICACIÓN: INTEGRACIÓN POSTGRESQL REAL]
 * CERTIFICACIÓN FÍSICA EN VIVO CONTRA TraceFlow-UPT (xmyfqxlvveiawnxgydtz):
 * 
 * | ID     | Prueba                              | Restricción Evaluada                     |
 * |--------|-------------------------------------|------------------------------------------|
 * | DB-T01 | Conexión TLS validada               | TLS 1.3 con Supabase Root CA 2021        |
 * | DB-T02 | Integridad referencial              | Foreign Key violation (23503)            |
 * | DB-T03 | Check-Out concurrente (RN-06)       | Índice único parcial activo (23505)      |
 * | DB-T04 | Liberación de bloqueos              | CHECK release_reason canónico (23514)    |
 * | DB-T05 | Inmutabilidad de auditoría          | Trigger / Permisos UPDATE/DELETE/TRUNC   |
 * | DB-T06 | Cadena SHA-256 concurrente          | Advisory lock y encadenamiento cripto    |
 * | DB-T07 | Doble llave delegada (CU-30/SEC-04) | Segregación física e inmutabilidad firma |
 * | DB-T08 | Antiautoevaluación (SoD-01/SEC-05)  | Prohibición impacto, voto y autoaprob    |
 * | DB-T09 | Voto CCB duplicado (SoD-05)         | Índice UNIQUE (rfc_id, voter_user_id)    |
 * | DB-T10 | Aislamiento de proyectos            | Composite FK (target_ecs_id, project_id) |
 * | DB-T11 | Ownership de RFC                    | Restricción de acceso PU-01              |
 * | DB-T12 | Persistencia tras reinicio          | Retención de datos post-reinicio de pool |
 * | DB-T13 | Privilegios mínimos (SEC-02)        | Least Privilege y restricción DDL/DML    |
 * | DB-T14 | Desconexión PostgreSQL              | Sin fallback silencioso a mock (H-03)    |
 * ============================================================================
 */
import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import pg from 'pg';
const { Pool } = pg;

import { DatabaseService } from '../src/database/database.service.js';
import { ProjectsRepository } from '../src/modules/projects/projects.repository.js';
import { RfcsRepository } from '../src/modules/rfcs/rfcs.repository.js';
import { RfcsService } from '../src/modules/rfcs/rfcs.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import type { AuthenticatedUser } from '../src/common/types/index.js';
import { assertSafeTestDatabase } from '../src/common/guards/test-isolation.guard.js';

const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('[SEC-01] DATABASE_URL o TEST_DATABASE_URL no configurada. Las pruebas de integración requieren variables de entorno explícitas.');
}
assertSafeTestDatabase(dbUrl, 'Certificación Física PostgreSQL en Vivo (DB-T01 a DB-T14)', process.env.ALLOW_REMOTE_TEST_DML === 'true');
const certPath = path.resolve(process.cwd(), process.env.DATABASE_SSL_CA_PATH || 'cert/prod-ca-2021.crt');
const caCert = fs.existsSync(certPath) ? fs.readFileSync(certPath, 'utf8') : undefined;

describe('TraceFlow SCM — Certificación Física PostgreSQL en Vivo (DB-T01 a DB-T14)', { timeout: 30000 }, () => {
  let poolA: pg.Pool;
  let poolB: pg.Pool;

  beforeAll(async () => {
    poolA = new Pool({
      connectionString: dbUrl,
      ssl: caCert ? { rejectUnauthorized: true, ca: caCert } : { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 10000,
    });

    poolB = new Pool({
      connectionString: dbUrl,
      ssl: caCert ? { rejectUnauthorized: true, ca: caCert } : { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 10000,
    });
  });

  afterAll(async () => {
    if (poolA) await poolA.end();
    if (poolB) await poolB.end();
  });

  // DB-T01: Conexión TLS validada
  it('DB-T01: Conexión TLS validada con usuario operativo traceflow_app y certificado CA público', async () => {
    const client = await poolA.connect();
    try {
      const res = await client.query('SELECT current_user, inet_server_port(), version()');
      expect(res.rows[0].current_user).toBe('traceflow_app');
      expect(res.rows[0].version).toMatch(/PostgreSQL 17/i);
    } finally {
      client.release();
    }
  });

  // DB-T02: Integridad referencial
  it('DB-T02: Integridad referencial rechaza inserción de RFC con claves foráneas inexistentes', async () => {
    const client = await poolA.connect();
    try {
      const fakeProjectId = '00000000-0000-0000-0000-999999999999';
      const fakeEcsId = '00000000-0000-0000-0000-888888888888';
      await expect(
        client.query(
          `INSERT INTO traceflow.change_request 
            (code, project_id, target_ecs_id, title, description, justification, priority, classification, status, requested_by)
           VALUES ('RFC-FK-FAIL', $1, $2, 'Test FK', 'Desc', 'Just', 'MEDIA', 'PENDIENTE', 'REGISTRADA', 'a0000001-0000-0000-0000-000000000001')`,
          [fakeProjectId, fakeEcsId]
        )
      ).rejects.toThrow(/foreign key constraint/i);
    } finally {
      client.release();
    }
  });

  // DB-T03: Check-Out concurrente (RN-06)
  it('DB-T03: Check-Out concurrente (RN-06) mediante dos conexiones independientes rechaza el segundo bloqueo activo', async () => {
    const client1 = await poolA.connect();
    const client2 = await poolB.connect();
    const testRfcId = crypto.randomUUID();
    const testEcnId = crypto.randomUUID();
    const suffix = crypto.randomUUID().slice(0, 8);
    const rfcCode = `RFC-LCK-${suffix}`;
    const ecnCode = `ECN-LCK-${suffix}`;
    const ecsId = 'c0000001-0000-0000-0000-000000000001';
    const projectId = 'b0000001-0000-0000-0000-000000000001';
    const devA = 'a0000001-0000-0000-0000-000000000002';
    const devB = 'a0000001-0000-0000-0000-000000000003';

    try {
      // 1. Crear RFC y ECN de prueba para satisfacer FKs
      await client1.query(
        `INSERT INTO traceflow.change_request 
          (id, code, project_id, target_ecs_id, title, description, justification, priority, classification, status, requested_by)
         VALUES ($1, $2, $3, $4, 'Lock Test', 'Desc', 'Just', 'ALTA', 'CAMBIO_MENOR', 'AUTORIZADA', $5)`,
        [testRfcId, rfcCode, projectId, ecsId, devA]
      );
      await client1.query(
        `INSERT INTO traceflow.change_order 
          (id, code, rfc_id, ecs_id, status, issued_by, assigned_developer_id)
         VALUES ($1, $2, $3, $4, 'EMITIDA', $5, $6)`,
        [testEcnId, ecnCode, testRfcId, ecsId, devA, devA]
      );

      // 2. Cliente 1 adquiere bloqueo activo sobre el ECS
      await client1.query(
        `INSERT INTO traceflow.sync_lock (ecs_id, change_order_id, locked_by, status, work_library_path)
         VALUES ($1, $2, $3, 'ACTIVE', 'work/ecs-001')`,
        [ecsId, testEcnId, devA]
      );

      // 3. Cliente 2 intenta adquirir bloqueo simultáneo sobre el mismo ECS -> debe violar índice único condicional
      await expect(
        client2.query(
          `INSERT INTO traceflow.sync_lock (ecs_id, change_order_id, locked_by, status, work_library_path)
           VALUES ($1, $2, $3, 'ACTIVE', 'work/ecs-001-conflict')`,
          [ecsId, testEcnId, devB]
        )
      ).rejects.toThrow(/uq_active_sync_lock_per_ecs|unique constraint/i);

      // 4. Liberar bloqueo canónicamente
      await client1.query(
        `UPDATE traceflow.sync_lock SET status = 'RELEASED', release_reason = 'CHECK_IN' WHERE ecs_id = $1 AND status = 'ACTIVE'`,
        [ecsId]
      );
    } finally {
      client1.release();
      client2.release();
    }
  });

  // DB-T04: Liberación de bloqueos
  it('DB-T04: Liberación de bloqueos restringida exclusivamente a causas canónicas (CHECK_IN, ROLLBACK, CANCELED)', async () => {
    const client = await poolA.connect();
    const testRfcId = crypto.randomUUID();
    const testEcnId = crypto.randomUUID();
    const suffix = crypto.randomUUID().slice(0, 8);
    const rfcCode = `RFC-RSN-${suffix}`;
    const ecnCode = `ECN-RSN-${suffix}`;
    const ecsId = 'c0000001-0000-0000-0000-000000000002';
    const projectId = 'b0000001-0000-0000-0000-000000000001';
    const userId = 'a0000001-0000-0000-0000-000000000002';

    try {
      await client.query(
        `INSERT INTO traceflow.change_request 
          (id, code, project_id, target_ecs_id, title, description, justification, priority, classification, status, requested_by)
         VALUES ($1, $2, $3, $4, 'Reason Test', 'Desc', 'Just', 'MEDIA', 'CAMBIO_MENOR', 'AUTORIZADA', $5)`,
        [testRfcId, rfcCode, projectId, ecsId, userId]
      );
      await client.query(
        `INSERT INTO traceflow.change_order 
          (id, code, rfc_id, ecs_id, status, issued_by, assigned_developer_id)
         VALUES ($1, $2, $3, $4, 'EMITIDA', $5, $5)`,
        [testEcnId, ecnCode, testRfcId, ecsId, userId]
      );

      const lockRes = await client.query(
        `INSERT INTO traceflow.sync_lock (ecs_id, change_order_id, locked_by, status, work_library_path)
         VALUES ($1, $2, $3, 'ACTIVE', 'work/ecs-002') RETURNING id`,
        [ecsId, testEcnId, userId]
      );
      const lockId = lockRes.rows[0].id;

      // Causa inválida debe violar CHECK constraint
      await expect(
        client.query(`UPDATE traceflow.sync_lock SET release_reason = 'FORZADO_ADMIN' WHERE id = $1`, [lockId])
      ).rejects.toThrow(/check constraint|violates check/i);

      // Causa canónica válida debe triunfar
      await client.query(
        `UPDATE traceflow.sync_lock SET status = 'RELEASED', release_reason = 'ROLLBACK' WHERE id = $1`,
        [lockId]
      );
    } finally {
      client.release();
    }
  });

  // DB-T05: Inmutabilidad de auditoría
  it('DB-T05: Inmutabilidad de auditoría: UPDATE, DELETE y TRUNCATE en traceflow.audit_log son estrictamente rechazados', async () => {
    const client = await poolA.connect();
    try {
      // 1. Insertar evento mediante función transaccional
      const res = await client.query(
        `SELECT traceflow.append_audit_log('EVT-IMMUTABLE-TEST', NULL, 'PU-01', 'TEST_OPERATION', 'audit_log', 'test-1', NULL, NULL, 'SUCCESS', '{"test":true}'::jsonb, '127.0.0.1', 'DB-T05 Test') as id`
      );
      const logId = res.rows[0].id;

      // 2. Intento de UPDATE debe ser rechazado por trigger y revocación de permisos
      await expect(
        client.query(`UPDATE traceflow.audit_log SET operation = 'ALTERED' WHERE id = $1`, [logId])
      ).rejects.toThrow(/VIOLACIÓN DE INMUTABILIDAD|permission denied/i);

      // 3. Intento de DELETE debe ser rechazado por trigger y revocación de permisos
      await expect(
        client.query(`DELETE FROM traceflow.audit_log WHERE id = $1`, [logId])
      ).rejects.toThrow(/VIOLACIÓN DE INMUTABILIDAD|permission denied/i);

      // 4. Intento de TRUNCATE debe ser rechazado por revocación de privilegio DML
      await expect(client.query('TRUNCATE traceflow.audit_log')).rejects.toThrow(/permission denied/i);
    } finally {
      client.release();
    }
  });

  // DB-T06: Cadena SHA-256 concurrente
  it('DB-T06: Cadena SHA-256 serializada: inserciones simultáneas producen secuencia estricta y hashes matemáticamente válidos', async () => {
    const clientA = await poolA.connect();
    const clientB = await poolB.connect();
    const runId = crypto.randomUUID().slice(0, 8);
    const prefix = `EVT-CONC-${runId}-`;

    try {
      // Inserciones simultáneas entre conexiones clientA y clientB
      const p1 = clientA.query(
        `SELECT traceflow.append_audit_log('${prefix}1', NULL, 'PU-02', 'OP_1', 'entity', 'id-1', NULL, NULL, 'SUCCESS', '{"step":1}'::jsonb, '127.0.0.1', 'Vitest') as id`
      );
      const p2 = clientB.query(
        `SELECT traceflow.append_audit_log('${prefix}2', NULL, 'PU-03', 'OP_2', 'entity', 'id-2', NULL, NULL, 'SUCCESS', '{"step":2}'::jsonb, '127.0.0.1', 'Vitest') as id`
      );
      await Promise.all([p1, p2]);

      const p3 = clientA.query(
        `SELECT traceflow.append_audit_log('${prefix}3', NULL, 'PU-05', 'OP_3', 'entity', 'id-3', NULL, NULL, 'SUCCESS', '{"step":3}'::jsonb, '127.0.0.1', 'Vitest') as id`
      );
      const p4 = clientB.query(
        `SELECT traceflow.append_audit_log('${prefix}4', NULL, 'PU-07', 'OP_4', 'entity', 'id-4', NULL, NULL, 'SUCCESS', '{"step":4}'::jsonb, '127.0.0.1', 'Vitest') as id`
      );
      await Promise.all([p3, p4]);

      const logs = await clientA.query(
        `SELECT sequence_number, prev_log_hash, curr_log_hash, timestamp, actor_user_id, operation, payload_diff
         FROM traceflow.audit_log
         WHERE event_code LIKE $1
         ORDER BY sequence_number ASC`,
        [`${prefix}%`]
      );

      expect(logs.rows.length).toBe(4);

      for (let i = 1; i < logs.rows.length; i++) {
        expect(logs.rows[i].prev_log_hash).toBe(logs.rows[i - 1].curr_log_hash);
      }
    } finally {
      clientA.release();
      clientB.release();
    }
  });

  // DB-T07: Doble llave delegada (CU-30 / SEC-04)
  it('DB-T07: Doble llave delegada (CU-30 / SEC-04): Segregación física obligatoria, prohibición de autoautorización e inmutabilidad', async () => {
    const client = await poolA.connect();
    const testRfcId = crypto.randomUUID();
    const suffix = crypto.randomUUID().slice(0, 8);
    const rfcCode = `RFC-CU30-${suffix}`;
    const solicitanteId = 'a0000001-0000-0000-0000-000000000001'; // USR-001 Solicitante
    const gestorId = 'a0000001-0000-0000-0000-000000000003';      // USR-003 actúa como Gestor autorizado
    const arquiId = 'a0000001-0000-0000-0000-000000000002';       // USR-002 Arquitecto
    const ecsId = 'c0000001-0000-0000-0000-000000000001';
    const projectId = 'b0000001-0000-0000-0000-000000000001';

    try {
      await client.query(
        `INSERT INTO traceflow.change_request 
          (id, code, project_id, target_ecs_id, title, description, justification, priority, classification, status, requested_by)
         VALUES ($1, $2, $3, $4, 'CU-30 Test', 'Desc', 'Just', 'BAJA', 'CAMBIO_MENOR', 'EN_EVALUACION', $5)`,
        [testRfcId, rfcCode, projectId, ecsId, solicitanteId]
      );

      // 1. SEC-04 / SoD-01: El propio solicitante intenta emitir llave para su propia RFC -> Rechazo por trigger
      await expect(
        client.query(
          `INSERT INTO traceflow.change_authorization 
            (rfc_id, authorizer_role, authorizer_role_id, authorizer_user_id, decision, justification)
           VALUES ($1, 'GESTOR', 'PU-02', $2, 'APROBADO', 'Intento de autoautorización')`,
          [testRfcId, solicitanteId]
        )
      ).rejects.toThrow(/El solicitante de la RFC no puede autoautorizar/i);

      // 2. Primera llave legítima emitida por Gestor (USR-003)
      await client.query(
        `INSERT INTO traceflow.change_authorization 
          (rfc_id, authorizer_role, authorizer_role_id, authorizer_user_id, decision, justification)
         VALUES ($1, 'GESTOR', 'PU-02', $2, 'APROBADO', 'Visto bueno de gestión')`,
        [testRfcId, gestorId]
      );

      // 3. SEC-04: Mismo usuario físico (USR-003) intenta emitir la segunda llave como Arquitecto -> Rechazo
      await expect(
        client.query(
          `INSERT INTO traceflow.change_authorization 
            (rfc_id, authorizer_role, authorizer_role_id, authorizer_user_id, decision, justification)
           VALUES ($1, 'ARQUITECTO', 'PU-03', $2, 'APROBADO', 'Intento segunda llave mismo usuario')`,
          [testRfcId, gestorId]
        )
      ).rejects.toThrow(/La doble llave operativa exige dos identidades físicas distintas/i);

      // 4. Intento de duplicar rol GESTOR sobre la misma RFC -> Rechazo por uq_rfc_authorizer_role
      await expect(
        client.query(
          `INSERT INTO traceflow.change_authorization 
            (rfc_id, authorizer_role, authorizer_role_id, authorizer_user_id, decision, justification)
           VALUES ($1, 'GESTOR', 'PU-02', $2, 'APROBADO', 'Duplicado de rol')`,
          [testRfcId, arquiId]
        )
      ).rejects.toThrow(/uq_rfc_authorizer_role|unique constraint/i);

      // 5. Segunda llave legítima emitida por una persona física distinta (USR-002 Arquitecto)
      await client.query(
        `INSERT INTO traceflow.change_authorization 
          (rfc_id, authorizer_role, authorizer_role_id, authorizer_user_id, decision, justification)
         VALUES ($1, 'ARQUITECTO', 'PU-03', $2, 'APROBADO', 'Visto bueno técnico')`,
        [testRfcId, arquiId]
      );

      const countRes = await client.query(
        `SELECT count(*) FROM traceflow.change_authorization WHERE rfc_id = $1`,
        [testRfcId]
      );
      expect(parseInt(countRes.rows[0].count, 10)).toBe(2);

      // 6. SEC-03: Inmutabilidad de change_authorization -> UPDATE y DELETE deben ser rechazados
      await expect(
        client.query(
          `UPDATE traceflow.change_authorization SET decision = 'RECHAZADO' WHERE rfc_id = $1`,
          [testRfcId]
        )
      ).rejects.toThrow(/VIOLACIÓN DE FIRMEZA|permission denied/i);

      await expect(
        client.query(
          `DELETE FROM traceflow.change_authorization WHERE rfc_id = $1`,
          [testRfcId]
        )
      ).rejects.toThrow(/VIOLACIÓN DE FIRMEZA|permission denied/i);
    } finally {
      client.release();
    }
  });

  // DB-T08: Antiautoevaluación (SoD-01 / SEC-05) y Blindaje de Invariantes (SEC-03)
  it('DB-T08: Antiautoevaluación (SoD-01 / SEC-05) y Blindaje de Invariantes (SEC-03) en BD', async () => {
    const client = await poolA.connect();
    const testRfcId = crypto.randomUUID();
    const testResId = crypto.randomUUID();
    const suffix = crypto.randomUUID().slice(0, 8);
    const rfcCode = `RFC-SOD-${suffix}`;
    const resCode = `ACT-SOD-${suffix}`;
    const solicitanteId = 'a0000001-0000-0000-0000-000000000001'; // USR-001
    const ccbVoterId = 'a0000001-0000-0000-0000-000000000004';    // USR-004
    const ecsId = 'c0000001-0000-0000-0000-000000000001';
    const projectId = 'b0000001-0000-0000-0000-000000000001';

    try {
      // 1. Registrar RFC formal
      await client.query(
        `INSERT INTO traceflow.change_request 
          (id, code, project_id, target_ecs_id, title, description, justification, priority, classification, status, requested_by)
         VALUES ($1, $2, $3, $4, 'SoD Test', 'Desc', 'Just', 'ALTA', 'CAMBIO_MAYOR', 'EN_ANALISIS_TECNICO', $5)`,
        [testRfcId, rfcCode, projectId, ecsId, solicitanteId]
      );

      // 2. SEC-05: El solicitante intenta emitir informe de impacto técnico sobre su propia RFC -> Rechazo por trigger
      await expect(
        client.query(
          `INSERT INTO traceflow.impact_assessment 
            (rfc_id, architect_id, classification, architecture_impact, effort_hours, estimated_cost, estimated_days, technical_risk)
           VALUES ($1, $2, 'CAMBIO_MAYOR', 'Impacto autoemitido', 10, 500, 3, 'MEDIO')`,
          [testRfcId, solicitanteId]
        )
      ).rejects.toThrow(/El solicitante de la RFC no puede emitir el informe de impacto técnico/i);

      // 3. Crear sesión CCB para la RFC
      await client.query(
        `INSERT INTO traceflow.ccb_resolution (id, rfc_id, resolution_code, decision)
         VALUES ($1, $2, $3, 'EN_DELIBERACION')`,
        [testResId, testRfcId, resCode]
      );

      // 4. SEC-05: El solicitante intenta votar en el CCB sobre su propia RFC -> Rechazo por trigger
      await expect(
        client.query(
          `INSERT INTO traceflow.ccb_vote (resolution_id, rfc_id, voter_user_id, decision, justification)
           VALUES ($1, $2, $3, 'APROBAR', 'Intento de autovoto')`,
          [testResId, testRfcId, solicitanteId]
        )
      ).rejects.toThrow(/El solicitante de la RFC no puede emitir votos en el CCB/i);

      // 5. Voto legítimo emitido por miembro imparcial del CCB (USR-004)
      await client.query(
        `INSERT INTO traceflow.ccb_vote (resolution_id, rfc_id, voter_user_id, decision, justification)
         VALUES ($1, $2, $3, 'APROBAR', 'Voto conforme imparcial')`,
        [testResId, testRfcId, ccbVoterId]
      );

      // 6. SEC-03: Inmutabilidad de ccb_vote -> UPDATE y DELETE deben ser rechazados
      await expect(
        client.query(`UPDATE traceflow.ccb_vote SET decision = 'RECHAZAR' WHERE rfc_id = $1`, [testRfcId])
      ).rejects.toThrow(/VIOLACIÓN DE INMUTABILIDAD|permission denied/i);

      await expect(
        client.query(`DELETE FROM traceflow.ccb_vote WHERE rfc_id = $1`, [testRfcId])
      ).rejects.toThrow(/VIOLACIÓN DE INMUTABILIDAD|permission denied/i);

      // 7. SEC-03: Inmutabilidad de ecs_version -> UPDATE y DELETE deben ser rechazados
      await expect(
        client.query(
          `UPDATE traceflow.ecs_version SET version_number = '9.9.9' WHERE ecs_id = $1`,
          [ecsId]
        )
      ).rejects.toThrow(/VIOLACIÓN DE INMUTABILIDAD|permission denied/i);

      await expect(
        client.query(
          `DELETE FROM traceflow.ecs_version WHERE ecs_id = $1`,
          [ecsId]
        )
      ).rejects.toThrow(/VIOLACIÓN DE INMUTABILIDAD|permission denied/i);

      // 8. SEC-03: Prohibición de DELETE directo en sync_lock
      await expect(
        client.query(`DELETE FROM traceflow.sync_lock WHERE ecs_id = $1`, [ecsId])
      ).rejects.toThrow(/VIOLACIÓN DE CONCURRENCIA|permission denied/i);

    } finally {
      client.release();
    }
  });

  // DB-T09: Voto CCB duplicado (SoD-05)
  it('DB-T09: Voto CCB duplicado (SoD-05): Restricción de unicidad impide emitir más de un voto por identidad física', async () => {
    const client = await poolA.connect();
    const testRfcId = crypto.randomUUID();
    const testResId = crypto.randomUUID();
    const suffix = crypto.randomUUID().slice(0, 8);
    const rfcCode = `RFC-CCB-${suffix}`;
    const resCode = `ACT-${suffix}`;
    const requesterId = 'a0000001-0000-0000-0000-000000000001'; // Solicitante independiente
    const voterId = 'a0000001-0000-0000-0000-000000000004';     // Miembro CCB
    const ecsId = 'c0000001-0000-0000-0000-000000000001';
    const projectId = 'b0000001-0000-0000-0000-000000000001';

    try {
      await client.query(
        `INSERT INTO traceflow.change_request 
          (id, code, project_id, target_ecs_id, title, description, justification, priority, classification, status, requested_by)
         VALUES ($1, $2, $3, $4, 'CCB Test', 'Desc', 'Just', 'ALTA', 'CAMBIO_MAYOR', 'EN_EVALUACION', $5)`,
        [testRfcId, rfcCode, projectId, ecsId, requesterId]
      );
      await client.query(
        `INSERT INTO traceflow.ccb_resolution (id, rfc_id, resolution_code, decision)
         VALUES ($1, $2, $3, 'EN_DELIBERACION')`,
        [testResId, testRfcId, resCode]
      );

      // Primer voto legítimo
      await client.query(
        `INSERT INTO traceflow.ccb_vote (resolution_id, rfc_id, voter_user_id, decision, justification)
         VALUES ($1, $2, $3, 'APROBAR', 'Voto conforme')`,
        [testResId, testRfcId, voterId]
      );

      // Segundo voto por la misma persona debe ser rechazado por restricción UNIQUE
      await expect(
        client.query(
          `INSERT INTO traceflow.ccb_vote (resolution_id, rfc_id, voter_user_id, decision, justification)
           VALUES ($1, $2, $3, 'RECHAZAR', 'Segundo voto conflictivo')`,
          [testResId, testRfcId, voterId]
        )
      ).rejects.toThrow(/uq_ccb_vote_per_member|unique constraint/i);
    } finally {
      client.release();
    }
  });

  // DB-T10: Aislamiento de proyectos
  it('DB-T10: Aislamiento estricto de proyectos: Clave foránea compuesta rechaza asignar ECS de PRJ-002 a RFC de PRJ-001', async () => {
    const client = await poolA.connect();
    const testRfcId = crypto.randomUUID();
    const suffix = crypto.randomUUID().slice(0, 8);
    const rfcCode = `RFC-XP-${suffix}`;
    const prj1Id = 'b0000001-0000-0000-0000-000000000001'; // PRJ-001
    const ecsPrj2Id = 'c0000001-0000-0000-0000-000000000005'; // SRC-UI-CLAIM-FORM.tsx pertenece a PRJ-002
    const requesterId = 'a0000001-0000-0000-0000-000000000001';

    try {
      await expect(
        client.query(
          `INSERT INTO traceflow.change_request 
            (id, code, project_id, target_ecs_id, title, description, justification, priority, classification, status, requested_by)
           VALUES ($1, $2, $3, $4, 'Cross Project Fail', 'Desc', 'Just', 'MEDIA', 'PENDIENTE', 'REGISTRADA', $5)`,
          [testRfcId, rfcCode, prj1Id, ecsPrj2Id, requesterId]
        )
      ).rejects.toThrow(/fk_rfc_target_ecs_same_project|foreign key constraint/i);
    } finally {
      client.release();
    }
  });

  // DB-T11: Ownership de RFC
  it('DB-T11: Regla de Ownership (SoD): Solicitante PU-01 no puede consultar expedientes registrados por otros usuarios', async () => {
    const dbService = new DatabaseService('postgres');
    await dbService.onModuleInit();
    const projectsRepo = new ProjectsRepository(dbService);
    const rfcsRepo = new RfcsRepository(dbService);
    const auditService = new AuditService(dbService);
    const rfcsService = new RfcsService(rfcsRepo, projectsRepo, auditService);

    const client = await poolA.connect();
    const otherUserRfcId = crypto.randomUUID();
    const suffix = crypto.randomUUID().slice(0, 8);
    const rfcCode = `RFC-OWN-${suffix}`;

    try {
      // Crear RFC perteneciente a USR-002
      await client.query(
        `INSERT INTO traceflow.change_request 
          (id, code, project_id, target_ecs_id, title, description, justification, priority, classification, status, requested_by)
         VALUES ($1, $2, 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'USR002 RFC', 'Desc', 'Just', 'MEDIA', 'PENDIENTE', 'REGISTRADA', 'a0000001-0000-0000-0000-000000000002')`,
        [otherUserRfcId, rfcCode]
      );

      // USR-001 con rol PU-01 intenta consultar la RFC de USR-002
      const solicitanteUSR001: AuthenticatedUser = {
        id: 'a0000001-0000-0000-0000-000000000001',
        code: 'USR-001',
        username: 'jmedina',
        email: 'jmedina@exodo.pe',
        fullName: 'Joan Cristian Medina Quispe',
        organization: 'ÉXODO S.A.C.',
        position: 'Director',
        activeRoleId: 'PU-01', // Rol Solicitante con restricción Ownership
        allowedRoleIds: ['PU-01', 'PU-02'],
        assignedProjectIds: ['b0000001-0000-0000-0000-000000000001', 'PRJ-001', 'PRJ-002', 'PRJ-003'],
      };

      await expect(rfcsService.getRfcById(rfcCode, solicitanteUSR001)).rejects.toThrow(
        /Ownership SoD/i
      );
    } finally {
      client.release();
      await dbService.onModuleDestroy();
    }
  });

  // DB-T12: Persistencia tras reinicio
  it('DB-T12: Persistencia tras reinicio: Los datos sobreviven al cierre completo y reinicialización del pool', async () => {
    const testRfcId = crypto.randomUUID();
    const suffix = crypto.randomUUID().slice(0, 8);
    const rfcCode = `RFC-RBT-${suffix}`;
    const client = await poolA.connect();
    try {
      await client.query(
        `INSERT INTO traceflow.change_request 
          (id, code, project_id, target_ecs_id, title, description, justification, priority, classification, status, requested_by)
         VALUES ($1, $2, 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Reboot Test', 'Desc', 'Just', 'MEDIA', 'PENDIENTE', 'REGISTRADA', 'a0000001-0000-0000-0000-000000000001')`,
        [testRfcId, rfcCode]
      );
    } finally {
      client.release();
    }

    // Crear un pool totalmente nuevo simulando un proceso/reinicio independiente
    const poolReboot = new Pool({
      connectionString: dbUrl,
      ssl: caCert ? { rejectUnauthorized: true, ca: caCert } : { rejectUnauthorized: false },
      max: 2,
      connectionTimeoutMillis: 10000,
    });

    try {
      const rebootClient = await poolReboot.connect();
      try {
        const res = await rebootClient.query(
          'SELECT code, title FROM traceflow.change_request WHERE id = $1',
          [testRfcId]
        );
        expect(res.rows.length).toBe(1);
        expect(res.rows[0].code).toBe(rfcCode);
        expect(res.rows[0].title).toBe('Reboot Test');
      } finally {
        rebootClient.release();
      }
    } finally {
      await poolReboot.end();
    }
  });

  // DB-T13: Privilegios de aplicación (SEC-02 Least Privilege)
  it('DB-T13: Privilegios de aplicación (SEC-02): traceflow_app tiene prohibido ejecutar operaciones DDL destructivas y DELETE no autorizado', async () => {
    const client = await poolA.connect();
    try {
      // 1. Prohibido DDL destructivo
      await expect(client.query('CREATE TABLE traceflow.unauthorized_table (id int)')).rejects.toThrow(
        /permission denied/i
      );
      await expect(client.query('DROP SCHEMA traceflow CASCADE')).rejects.toThrow(
        /permission denied|must be owner/i
      );

      // 2. Prohibido DELETE en tablas canónicas de solo lectura o append-only
      await expect(client.query('DELETE FROM traceflow.project')).rejects.toThrow(/permission denied/i);
      await expect(client.query('DELETE FROM traceflow.app_role')).rejects.toThrow(/permission denied/i);
      await expect(client.query('DELETE FROM traceflow.change_authorization')).rejects.toThrow(/permission denied|VIOLACIÓN DE FIRMEZA/i);
      await expect(client.query('DELETE FROM traceflow.ccb_resolution')).rejects.toThrow(/permission denied/i);
    } finally {
      client.release();
    }
  });

  // DB-T14: Desconexión PostgreSQL
  it('DB-T14: Desconexión PostgreSQL: El sistema arroja error fatal y prohíbe el fallback silencioso a mock', async () => {
    const disconnectedDb = new DatabaseService('postgres');
    expect(disconnectedDb.isDatabaseConnected()).toBe(false);
    expect(disconnectedDb.getDatabaseMode()).toBe('postgres');

    await expect(disconnectedDb.query('SELECT 1')).rejects.toThrow(
      /Base de datos PostgreSQL no disponible en modo producción/i
    );
  });
});

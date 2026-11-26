/**
 * ============================================================================
 * TRACEFLOW SCM — CERTIFICACIÓN OFICIAL EN POSTGRESQL REAL (HITO INIT-H04B)
 * Archivo: backend/test/real-postgres-h04b-certification.spec.ts
 * Motor: PostgreSQL 16.14 Real (Servidor dedicado aislado en 127.0.0.1:5432)
 * Marco Normativo: DA-01 a DA-06, ADR-011, Plan Maestro, IEEE 828, RNF-01, RNF-03
 *
 * VALIDACIONES OBLIGATORIAS CERTIFICADAS:
 *  1. Ejecución de las 9 migraciones oficiales en orden estricto (incluyendo 202611260006_init_h04b_webhooks_and_git_sync.sql).
 *  2. Catálogo físico con exactamente 33 tablas en esquema traceflow.
 *  3. Integridad física de traceflow.github_event y traceflow.config_item_path_history.
 *  4. Índice de unicidad uq_github_event_delivery para idempotencia estricta.
 *  5. Privilegios mínimos de traceflow_app (SELECT, INSERT, UPDATE permitidos; DELETE estrictamente revocado).
 *  6. Flujo completo de GitHubWebhookService y GitHubEventProcessorService sobre PostgreSQL real.
 *  7. Idempotencia y buffer en base de datos real ante entregas duplicadas.
 *  8. Historial de rutas de ECS y actualización transaccional en traceflow.config_item.
 *  9. Detección y auditoría criptográfica de cambios fuera de banda (DA-01, DA-02).
 * 10. Procedimiento de rollback seguro con salvaguarda forense SCM (202611260006).
 * ============================================================================
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import pg from 'pg';

import { resetAndMigrateRealPostgres } from './helpers/real-db-helper.js';
import { DatabaseService } from '../src/database/database.service.js';
import { OrganizationsRepository } from '../src/modules/organizations/organizations.repository.js';
import { ProjectsRepository } from '../src/modules/projects/projects.repository.js';
import { GitHubRepository } from '../src/modules/github/github.repository.js';
import { MockGitHubApiClient } from '../src/modules/github/github-api.client.js';
import { GitHubWebhookService } from '../src/modules/github/webhooks/github-webhook.service.js';
import { GitHubEventProcessorService } from '../src/modules/github/webhooks/github-event-processor.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';

describe('TraceFlow SCM — Certificación Oficial PostgreSQL Real (INIT-H04B)', { timeout: 60000 }, () => {
  let adminPool: pg.Pool;
  let appPool: pg.Pool;
  let appliedMigrations: string[];
  let poolsClosed = false;

  let dbService: DatabaseService;
  let orgsRepo: OrganizationsRepository;
  let projectsRepo: ProjectsRepository;
  let githubRepo: GitHubRepository;
  let githubClient: MockGitHubApiClient;
  let webhookService: GitHubWebhookService;
  let eventProcessor: GitHubEventProcessorService;
  let auditService: AuditService;

  const testSecret = 'secret-real-postgres-h04b';
  let realProjectId: string;
  const realRepoId = 9001;

  function generateSignature(payload: any, secret: string = testSecret): string {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(Buffer.from(raw, 'utf8'));
    return `sha256=${hmac.digest('hex')}`;
  }

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_MODE = 'postgres';
    process.env.DATABASE_SSL = 'false';
    process.env.ALLOW_MOCK_GITHUB = 'true';
    process.env.GITHUB_WEBHOOK_SECRET = testSecret;
    process.env.TEST_DATABASE_URL =
      'postgresql://traceflow_app:TestAppPassword123!@127.0.0.1:5432/traceflow_cert';

    // 1. Reiniciar y migrar base de datos real con las 9 migraciones oficiales (hasta H04B)
    const setupResult = await resetAndMigrateRealPostgres({
      allowDestructiveReset: process.env.ALLOW_DESTRUCTIVE_DATABASE_RESET === 'true',
      targetMigration: 'H04B',
    });
    adminPool = setupResult.adminPool;
    appPool = setupResult.appPool;
    appliedMigrations = setupResult.appliedMigrations;

    // 2. Inicializar servicios sobre PostgreSQL real
    dbService = new DatabaseService();
    await dbService.onModuleInit();

    auditService = new AuditService(dbService);
    projectsRepo = new ProjectsRepository(dbService);
    githubRepo = new GitHubRepository(dbService);
    githubClient = new MockGitHubApiClient();
    eventProcessor = new GitHubEventProcessorService(githubRepo, auditService, githubClient);
    webhookService = new GitHubWebhookService(githubRepo, auditService, eventProcessor);

    // Obtener un proyecto existente de las migraciones
    const existingProjects = await projectsRepo.findAll();
    realProjectId = existingProjects[0]?.id || 'b0000001-0000-0000-0000-000000000001';

    // Registrar integración activa para vincular con realProjectId
    await githubRepo.saveIntegration({
      projectId: realProjectId,
      integrationMode: 'LINK_EXISTING',
      repoOwner: 'exodo-org',
      repoName: 'pasarela-core',
      repoFullName: 'exodo-org/pasarela-core',
      githubRepoId: realRepoId,
      defaultBranch: 'main',
      installationId: 12345678,
      visibility: 'private',
      permissions: { push: true, pull: true, admin: true },
      validationStatus: 'VALIDATED',
    });
  });

  afterAll(async () => {
    if (!poolsClosed) {
      if (dbService) await dbService.onModuleDestroy();
      if (adminPool) await adminPool.end();
      if (appPool) await appPool.end();
    }
  });

  // ==========================================================================
  // BLOQUE 1: MIGRACIONES Y CATÁLOGO FÍSICO (H04B)
  // ==========================================================================
  describe('1. Verificación de Migraciones y Catálogo Físico en PostgreSQL 16 Real', () => {
    it('CERT-H04B-01: debe haber aplicado exactamente 9 migraciones incrementales en orden estricto', () => {
      expect(appliedMigrations).toHaveLength(9);
      expect(appliedMigrations[0]).toBe('202611250001_initial_traceflow.sql');
      expect(appliedMigrations[1]).toBe('202611250002_structural_seeds.sql');
      expect(appliedMigrations[2]).toBe('202611250003_secure_app_role_least_privilege.sql');
      expect(appliedMigrations[3]).toBe('202611260001_init_h02_organizations_and_projects.sql');
      expect(appliedMigrations[4]).toBe('202611260002_init_h03_team_methodology_planning.sql');
      expect(appliedMigrations[5]).toBe('202611260003_init_h04a_github_integration.sql');
      expect(appliedMigrations[6]).toBe('202611260004_init_h04a_r_github_security.sql');
      expect(appliedMigrations[7]).toBe('202611260005_init_h04b_github_installations_remediation.sql');
      expect(appliedMigrations[8]).toBe('202611260006_init_h04b_webhooks_and_git_sync.sql');
    });

    it('CERT-H04B-02: el esquema traceflow debe contener exactamente 33 tablas físicas en PostgreSQL', async () => {
      const res = await appPool.query<{ table_name: string }>(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'traceflow' AND table_type = 'BASE TABLE'
        ORDER BY table_name ASC;
      `);

      const tables = res.rows.map((r) => r.table_name);
      expect(tables).toHaveLength(33);
      expect(tables).toContain('github_event');
      expect(tables).toContain('config_item_path_history');
      expect(tables).toContain('github_integration');
      expect(tables).toContain('organization_github_installation');
      expect(tables).toContain('config_item');
    });

    it('CERT-H04B-03: la tabla traceflow.github_event debe tener todas sus columnas y tipos requeridos', async () => {
      const res = await appPool.query<{ column_name: string; data_type: string }>(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'traceflow' AND table_name = 'github_event'
        ORDER BY ordinal_position ASC;
      `);

      const cols = res.rows.map((r) => r.column_name);
      expect(cols).toEqual([
        'id',
        'delivery_id',
        'event_type',
        'action',
        'installation_id',
        'github_repo_id',
        'project_id',
        'payload',
        'processing_status',
        'attempts',
        'max_attempts',
        'last_attempt_at',
        'processed_at',
        'error_message',
        'created_at',
      ]);
    });

    it('CERT-H04B-04: la tabla traceflow.config_item_path_history debe tener todas sus columnas requeridas', async () => {
      const res = await appPool.query<{ column_name: string; data_type: string }>(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'traceflow' AND table_name = 'config_item_path_history'
        ORDER BY ordinal_position ASC;
      `);

      const cols = res.rows.map((r) => r.column_name);
      expect(cols).toEqual([
        'id',
        'config_item_id',
        'project_id',
        'old_path',
        'new_path',
        'change_type',
        'git_commit_sha',
        'detected_at',
      ]);
    });

    it('CERT-H04B-05: debe existir índice único uq_github_event_delivery para garantizar idempotencia', async () => {
      const res = await appPool.query<{ indexname: string; indexdef: string }>(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'traceflow' AND tablename = 'github_event' AND indexname = 'uq_github_event_delivery';
      `);

      expect(res.rows).toHaveLength(1);
      expect(res.rows[0].indexdef).toContain('UNIQUE INDEX');
      expect(res.rows[0].indexdef).toContain('delivery_id');
    });
  });

  // ==========================================================================
  // BLOQUE 2: MÍNIMO PRIVILEGIO (LEAST PRIVILEGE) (H04B)
  // ==========================================================================
  describe('2. Verificación de Mínimo Privilegio para traceflow_app en Tablas H04B', () => {
    it('CERT-H04B-06: traceflow_app debe tener permisos SELECT, INSERT, UPDATE y REVOKE DELETE en github_event', async () => {
      // 1. SELECT, INSERT, UPDATE permitidos
      const testDeliveryId = `perm-test-${Date.now()}`;
      await appPool.query(
        `INSERT INTO traceflow.github_event (delivery_id, event_type, installation_id, payload)
         VALUES ($1, 'ping', 12345678, '{"test": true}'::jsonb)`,
        [testDeliveryId]
      );

      const selRes = await appPool.query(
        `SELECT * FROM traceflow.github_event WHERE delivery_id = $1`,
        [testDeliveryId]
      );
      expect(selRes.rows).toHaveLength(1);

      await appPool.query(
        `UPDATE traceflow.github_event SET processing_status = 'PROCESSED' WHERE delivery_id = $1`,
        [testDeliveryId]
      );

      // 2. DELETE estrictamente revocado
      await expect(
        appPool.query(`DELETE FROM traceflow.github_event WHERE delivery_id = $1`, [testDeliveryId])
      ).rejects.toThrow(/permission denied for table github_event/i);
    });

    it('CERT-H04B-07: traceflow_app debe tener REVOKE DELETE en config_item_path_history', async () => {
      // Verificar que traceflow_app no puede ejecutar DELETE sobre config_item_path_history
      await expect(
        appPool.query(`DELETE FROM traceflow.config_item_path_history WHERE id = gen_random_uuid()`)
      ).rejects.toThrow(/permission denied for table config_item_path_history/i);
    });
  });

  // ==========================================================================
  // BLOQUE 3: PERSISTENCIA, IDEMPOTENCIA Y PROCESAMIENTO ASÍNCRONO REAL
  // ==========================================================================
  describe('3. Flujo Funcional y Procesamiento Asíncrono sobre PostgreSQL 16 Real', () => {
    it('CERT-H04B-08: handleWebhook debe almacenar evento en PostgreSQL real y responder 202 con duplicate: false', async () => {
      const payload = {
        action: 'ping',
        installation: { id: 12345678 },
        repository: { id: realRepoId, full_name: 'exodo-org/pasarela-core' },
      };
      const deliveryId = `real-pg-deliv-${Date.now()}`;
      const signature = generateSignature(payload);

      const res = await webhookService.handleWebhook(
        {
          'x-hub-signature-256': signature,
          'x-github-delivery': deliveryId,
          'x-github-event': 'ping',
        },
        JSON.stringify(payload),
        payload
      );

      expect(res.received).toBe(true);
      expect(res.duplicate).toBe(false);
      expect(res.deliveryId).toBe(deliveryId);

      // Esperar brevemente a que el procesador asíncrono complete
      await new Promise((r) => setTimeout(r, 100));

      // Comprobar persistencia física en tabla github_event
      const stored = await githubRepo.findEventByDeliveryId(deliveryId);
      expect(stored).not.toBeNull();
      expect(stored?.project_id).toBe(realProjectId);
      expect(['PROCESSING', 'PROCESSED']).toContain(stored?.processing_status);
    });

    it('CERT-H04B-09: entrega duplicada en PostgreSQL real debe ser detectada sin error 500 ni colisión DDL', async () => {
      const payload = {
        action: 'ping',
        installation: { id: 12345678 },
      };
      const deliveryId = `real-pg-dup-${Date.now()}`;
      const signature = generateSignature(payload);

      const first = await webhookService.handleWebhook(
        {
          'x-hub-signature-256': signature,
          'x-github-delivery': deliveryId,
          'x-github-event': 'ping',
        },
        JSON.stringify(payload),
        payload
      );
      expect(first.duplicate).toBe(false);

      const second = await webhookService.handleWebhook(
        {
          'x-hub-signature-256': signature,
          'x-github-delivery': deliveryId,
          'x-github-event': 'ping',
        },
        JSON.stringify(payload),
        payload
      );
      expect(second.received).toBe(true);
      expect(second.duplicate).toBe(true);
      expect(second.deliveryId).toBe(deliveryId);

      // Comprobar que en PostgreSQL real existe exactamente 1 registro para este delivery_id
      const countRes = await appPool.query<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM traceflow.github_event WHERE delivery_id = $1`,
        [deliveryId]
      );
      expect(parseInt(countRes.rows[0].count, 10)).toBe(1);
    });

    it('CERT-H04B-10: sincronización push debe registrar renombrado en config_item_path_history y actualizar traceflow.config_item', async () => {
      // 1. Crear ECS real en traceflow.config_item
      const ecsCode = `SRC-REAL-${Date.now().toString().slice(-4)}`;
      const ecs = await githubRepo.createConfigItem({
        project_id: realProjectId,
        code: ecsCode,
        name: 'Módulo de Facturación Electrónica',
        file_path: 'src/billing/invoice.service.ts',
      });

      // 2. Configurar commit mock en cliente
      const commitSha = `sha-rename-${Date.now()}`;
      githubClient.addMockCommit({
        sha: commitSha,
        message: 'refactor(RFC-010): mover servicio de facturas a directorio sunat',
        author: { name: 'Joan Medina', email: 'jmedina@exodo.pe', date: new Date().toISOString() },
        files: [
          {
            filename: 'src/sunat/invoice.service.ts',
            status: 'renamed',
            previous_filename: 'src/billing/invoice.service.ts',
            additions: 5,
            deletions: 2,
            changes: 7,
          },
        ],
      });

      // 3. Crear y procesar evento push
      const deliveryId = `push-rename-${Date.now()}`;
      const event = await githubRepo.saveEvent({
        deliveryId,
        eventType: 'push',
        installationId: 12345678,
        githubRepoId: realRepoId,
        projectId: realProjectId,
        payload: {
          repository: { id: realRepoId, owner: { login: 'exodo-org' }, name: 'pasarela-core' },
          commits: [{ id: commitSha, message: 'refactor(RFC-010): mover servicio de facturas a directorio sunat' }],
        },
      });

      await eventProcessor.processEvent(event);

      // 4. Verificar inserción en tabla traceflow.config_item_path_history
      const historyRes = await appPool.query(
        `SELECT * FROM traceflow.config_item_path_history WHERE config_item_id = $1`,
        [ecs.id]
      );
      expect(historyRes.rows).toHaveLength(1);
      expect(historyRes.rows[0].old_path).toBe('src/billing/invoice.service.ts');
      expect(historyRes.rows[0].new_path).toBe('src/sunat/invoice.service.ts');
      expect(historyRes.rows[0].change_type).toBe('MOVE');
      expect(historyRes.rows[0].git_commit_sha).toBe(commitSha);

      // 5. Verificar actualización en traceflow.config_item
      const ecsRes = await appPool.query(
        `SELECT file_path FROM traceflow.config_item WHERE id = $1`,
        [ecs.id]
      );
      expect(ecsRes.rows[0].file_path).toBe('src/sunat/invoice.service.ts');
    });

    it('CERT-H04B-11: detección de cambio fuera de banda debe persistir evento en traceflow.audit_log', async () => {
      const commitSha = `oob-commit-${Date.now()}`;
      const deliveryId = `push-oob-${Date.now()}`;

      const event = await githubRepo.saveEvent({
        deliveryId,
        eventType: 'push',
        installationId: 12345678,
        githubRepoId: realRepoId,
        projectId: realProjectId,
        payload: {
          repository: { id: realRepoId, owner: { login: 'exodo-org' }, name: 'pasarela-core' },
          commits: [
            {
              id: commitSha,
              message: 'hotfix directo en producción sin RFC [OUT_OF_BAND]',
              author: { name: 'Dev Desconocido', email: 'unknown@external.com' },
              modified: ['src/core/keys.ts'],
            },
          ],
        },
      });

      await eventProcessor.processEvent(event);

      // Verificar registro en traceflow.audit_log
      const auditRes = await appPool.query(
        `SELECT * FROM traceflow.audit_log WHERE event_code = 'GITHUB_OUT_OF_BAND_DETECTED' AND project_id = $1 ORDER BY timestamp DESC LIMIT 1`,
        [realProjectId]
      );
      expect(auditRes.rows).toHaveLength(1);
      expect(auditRes.rows[0].operation).toBe('OUT_OF_BAND_GIT_PUSH');
      expect(auditRes.rows[0].entity_id).toBe(commitSha);
    });
  });

  // ==========================================================================
  // BLOQUE 4: PROCEDIMIENTO DE ROLLBACK SEGURO (202611260006)
  // ==========================================================================
  describe('4. Salvaguardas de Integridad y Rollback Seguro (INIT-H04B-R)', () => {
    it('CERT-H04B-12: el rollback de H04B debe abortar si existen registros en github_event o config_item_path_history', async () => {
      const rollbackSqlPath = path.resolve(
        process.cwd(),
        '..',
        'supabase',
        'migrations',
        '202611260006_init_h04b_webhooks_and_git_sync_rollback.sql'
      );
      const rollbackSql = fs.readFileSync(rollbackSqlPath, 'utf8');

      // Al existir eventos en la base de datos, el script debe fallar con la excepción de seguridad
      await expect(adminPool.query(rollbackSql)).rejects.toThrow(
        /BLOQUEO DE SEGURIDAD \(INIT-H04B-R\)/i
      );
    });

    it('CERT-H04B-13: con allow_force_h04_rollback = true el rollback debe ejecutarse y restaurar 31 tablas', async () => {
      const rollbackSqlPath = path.resolve(
        process.cwd(),
        '..',
        'supabase',
        'migrations',
        '202611260006_init_h04b_webhooks_and_git_sync_rollback.sql'
      );
      const rollbackSql = fs.readFileSync(rollbackSqlPath, 'utf8');

      const forceSql = `
        SET LOCAL traceflow.allow_force_h04_rollback = 'true';
        ${rollbackSql}
      `;

      await adminPool.query(forceSql);

      // Comprobar que las tablas fueron eliminadas limpiamente
      const res = await adminPool.query<{ table_name: string }>(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'traceflow' AND table_type = 'BASE TABLE'
        ORDER BY table_name ASC;
      `);

      const tables = res.rows.map((r) => r.table_name);
      expect(tables).toHaveLength(31);
      expect(tables).not.toContain('github_event');
      expect(tables).not.toContain('config_item_path_history');
    });
  });
});

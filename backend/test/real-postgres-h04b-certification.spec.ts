/**
 * ============================================================================
 * TRACEFLOW SCM — CERTIFICACIÓN OFICIAL EN POSTGRESQL REAL (HITO INIT-H04B / INIT-H04B-R)
 * Archivo: backend/test/real-postgres-h04b-certification.spec.ts
 * Motor: PostgreSQL 16.14 Real (Servidor dedicado aislado en 127.0.0.1:5432)
 * Marco Normativo: DA-01 a DA-06, ADR-011, Plan Maestro, IEEE 828, RNF-01, RNF-03
 *
 * VALIDACIONES OBLIGATORIAS CERTIFICADAS:
 *  1. Ejecución de las 10 migraciones oficiales en orden estricto (incluyendo 202611260007_init_h04b_r_webhooks_governance_and_worker.sql).
 *  2. Catálogo físico con exactamente 33 tablas en esquema traceflow.
 *  3. Integridad física y columnas extendidas de traceflow.github_event y traceflow.config_item_path_history.
 *  4. Índices de soporte y unicidad: uq_github_event_delivery, idx_github_event_claimable, uq_cip_history_commit_ecs_change.
 *  5. Privilegios mínimos de traceflow_app (SELECT, INSERT, UPDATE permitidos; DELETE estrictamente revocado).
 *  6. Procesamiento concurrente y lease de trabajador con FOR UPDATE SKIP LOCKED sobre PostgreSQL real.
 *  7. Recuperación de eventos abandonados tras expiración de lease o reinicio.
 *  8. Idempotencia y buffer en base de datos real ante entregas duplicadas (HTTP 202 duplicate: true).
 *  9. Preservación estricta del inventario ECS ante commits Git sin autorización formal SCM.
 * 10. Actualización transaccional de ECS autorizada mediante correlación real contra traceflow.change_request y change_order.
 * 11. Idempotencia a nivel de base de datos en traceflow.config_item_path_history mediante ON CONFLICT DO UPDATE.
 * 12. Revocación de accesos e instalación GitHub (suspend/deleted) con invalidación preventiva sin destrucción de datos.
 * 13. Procedimiento de rollback seguro con salvaguarda forense y control mediante traceflow.allow_force_h04_rollback.
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

describe('TraceFlow SCM — Certificación Oficial PostgreSQL Real (INIT-H04B / INIT-H04B-R)', { timeout: 60000 }, () => {
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
  let realOrgId: string;
  let realUserId: string;
  const realRepoId = 9001;
  const realInstallationId = 12345678;

  function generateSignature(payload: any, secret: string = testSecret): string {
    const raw = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload), 'utf8');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(raw);
    return `sha256=${hmac.digest('hex')}`;
  }

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_MODE = 'postgres';
    process.env.DATABASE_SSL = 'false';
    process.env.ALLOW_MOCK_GITHUB = 'true';
    process.env.GITHUB_WEBHOOK_SECRET = testSecret;
    const appPwd = process.env.TEST_DB_APP_PASSWORD || 'TestAppPassword123!';
    process.env.TEST_DATABASE_URL =
      `postgresql://traceflow_app:${encodeURIComponent(appPwd)}@127.0.0.1:5432/traceflow_cert`;

    // 1. Reiniciar y migrar base de datos real con las 11 migraciones oficiales (hasta H04B-C)
    const setupResult = await resetAndMigrateRealPostgres({
      allowDestructiveReset: process.env.ALLOW_DESTRUCTIVE_DATABASE_RESET === 'true',
      targetMigration: 'H04B-C',
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

    // Obtener organización asociada al proyecto
    const prjRes = await appPool.query<{ organization_id: string }>(
      `SELECT organization_id FROM traceflow.project WHERE id = $1`,
      [realProjectId]
    );
    realOrgId = prjRes.rows[0]?.organization_id;

    // Obtener usuario del sistema para expedientes SCM
    const userRes = await appPool.query<{ id: string }>(
      `SELECT id FROM traceflow.app_user WHERE code = 'USR-001' LIMIT 1`
    );
    realUserId = userRes.rows[0]?.id;

    // Asegurar asignación activa de desarrollo PU-06 en el proyecto
    await appPool.query(
      `INSERT INTO traceflow.project_team_role (project_id, user_id, role_id, status)
       VALUES ($1, $2, 6, 'ACTIVE')
       ON CONFLICT (project_id, user_id, role_id) DO UPDATE SET status = 'ACTIVE'`,
      [realProjectId, realUserId]
    );

    // Registrar instalación activa de organización para validar procedencia de webhooks (H04B-R03)
    await githubRepo.saveOrganizationInstallation({
      organizationId: realOrgId,
      installationId: realInstallationId,
      accountLogin: 'exodo-org',
      accountType: 'Organization',
      targetId: 99887766,
      permissions: { contents: 'write', issues: 'write' },
      status: 'ACTIVE',
      installedBy: realUserId,
    });

    // Registrar integración activa para vincular con realProjectId
    await githubRepo.saveIntegration({
      projectId: realProjectId,
      integrationMode: 'LINK_EXISTING',
      repoOwner: 'exodo-org',
      repoName: 'pasarela-core',
      repoFullName: 'exodo-org/pasarela-core',
      githubRepoId: realRepoId,
      defaultBranch: 'main',
      installationId: realInstallationId,
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
  // BLOQUE 1: MIGRACIONES Y CATÁLOGO FÍSICO (H04B / H04B-R)
  // ==========================================================================
  describe('1. Verificación de Migraciones y Catálogo Físico en PostgreSQL 16 Real', () => {
    it('CERT-H04B-01: debe haber aplicado exactamente 11 migraciones incrementales en orden estricto', () => {
      expect(appliedMigrations).toHaveLength(11);
      expect(appliedMigrations[0]).toBe('202611250001_initial_traceflow.sql');
      expect(appliedMigrations[1]).toBe('202611250002_structural_seeds.sql');
      expect(appliedMigrations[2]).toBe('202611250003_secure_app_role_least_privilege.sql');
      expect(appliedMigrations[3]).toBe('202611260001_init_h02_organizations_and_projects.sql');
      expect(appliedMigrations[4]).toBe('202611260002_init_h03_team_methodology_planning.sql');
      expect(appliedMigrations[5]).toBe('202611260003_init_h04a_github_integration.sql');
      expect(appliedMigrations[6]).toBe('202611260004_init_h04a_r_github_security.sql');
      expect(appliedMigrations[7]).toBe('202611260005_init_h04b_github_installations_remediation.sql');
      expect(appliedMigrations[8]).toBe('202611260006_init_h04b_webhooks_and_git_sync.sql');
      expect(appliedMigrations[9]).toBe('202611260007_init_h04b_r_webhooks_governance_and_worker.sql');
      expect(appliedMigrations[10]).toBe('202611260008_init_h04b_c_governance_and_leases.sql');
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

    it('CERT-H04B-03: la tabla traceflow.github_event debe tener todas sus columnas requeridas (H04B + H04B-R + H04B-C)', async () => {
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
        'locked_by',
        'locked_at',
        'lease_expires_at',
        'correlation_status',
        'claim_token',
      ]);
    });

    it('CERT-H04B-04: la tabla traceflow.config_item_path_history debe tener todas sus columnas requeridas (H04B + H04B-R)', async () => {
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
        'applied_to_ecs',
        'applied_at',
        'status',
      ]);
    });

    it('CERT-H04B-05: deben existir índices únicos y de soporte para worker e idempotencia', async () => {
      const res = await appPool.query<{ indexname: string; tablename: string; indexdef: string }>(`
        SELECT tablename, indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'traceflow' AND indexname IN (
          'uq_github_event_delivery',
          'idx_github_event_claimable',
          'uq_cip_history_commit_ecs_change'
        )
        ORDER BY indexname ASC;
      `);

      const indexNames = res.rows.map((r) => r.indexname);
      expect(indexNames).toContain('uq_github_event_delivery');
      expect(indexNames).toContain('idx_github_event_claimable');
      expect(indexNames).toContain('uq_cip_history_commit_ecs_change');

      const uqHistory = res.rows.find((r) => r.indexname === 'uq_cip_history_commit_ecs_change');
      expect(uqHistory?.indexdef).toContain('UNIQUE INDEX');
      expect(uqHistory?.indexdef).toContain('config_item_id, git_commit_sha, change_type');
    });
  });

  // ==========================================================================
  // BLOQUE 2: MÍNIMO PRIVILEGIO (LEAST PRIVILEGE) (H04B / H04B-R)
  // ==========================================================================
  describe('2. Verificación de Mínimo Privilegio para traceflow_app', () => {
    it('CERT-H04B-06: traceflow_app debe tener permisos SELECT, INSERT, UPDATE y REVOKE DELETE en github_event', async () => {
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

      // DELETE estrictamente revocado
      await expect(
        appPool.query(`DELETE FROM traceflow.github_event WHERE delivery_id = $1`, [testDeliveryId])
      ).rejects.toThrow(/(permission denied for table|permiso denegado a la tabla) github_event/i);
    });

    it('CERT-H04B-07: traceflow_app debe tener REVOKE DELETE en config_item_path_history', async () => {
      await expect(
        appPool.query(`DELETE FROM traceflow.config_item_path_history WHERE id = gen_random_uuid()`)
      ).rejects.toThrow(/(permission denied for table|permiso denegado a la tabla) config_item_path_history/i);
    });
  });

  // ==========================================================================
  // BLOQUE 3: TRABAJADOR TRANSACCIONAL, CONCURRENCIA Y LEASE (FOR UPDATE SKIP LOCKED)
  // ==========================================================================
  describe('3. Concurrencia de Trabajador y Recuperación de Arrendamiento (H04B-R04)', () => {
    it('CERT-H04B-08: dos workers concurrentes con FOR UPDATE SKIP LOCKED deben reclamar eventos distintos sin bloqueo mutuo', async () => {
      // 1. Insertar dos eventos pendientes
      const deliv1 = `claim-conc-1-${Date.now()}`;
      const deliv2 = `claim-conc-2-${Date.now()}`;

      await appPool.query(`
        INSERT INTO traceflow.github_event (delivery_id, event_type, installation_id, github_repo_id, project_id, payload, processing_status)
        VALUES
          ($1, 'push', $3, $4, $5, '{"test": 1}'::jsonb, 'PENDING'),
          ($2, 'push', $3, $4, $5, '{"test": 2}'::jsonb, 'PENDING');
      `, [deliv1, deliv2, realInstallationId, realRepoId, realProjectId]);

      // 2. Worker 1 reclama 1 evento
      const worker1Claims = await githubRepo.claimEvents('worker-real-1', 1, 30);
      expect(worker1Claims).toHaveLength(1);
      const claimed1 = worker1Claims[0];
      expect([deliv1, deliv2]).toContain(claimed1.delivery_id);
      expect(claimed1.locked_by).toBe('worker-real-1');
      expect(claimed1.processing_status).toBe('PROCESSING');

      // 3. Worker 2 reclama 1 evento (SKIP LOCKED debe entregarle el restante)
      const worker2Claims = await githubRepo.claimEvents('worker-real-2', 1, 30);
      expect(worker2Claims).toHaveLength(1);
      const claimed2 = worker2Claims[0];
      expect(claimed2.delivery_id).not.toBe(claimed1.delivery_id);
      expect([deliv1, deliv2]).toContain(claimed2.delivery_id);
      expect(claimed2.locked_by).toBe('worker-real-2');

      // 4. Liberar eventos para limpiar estado
      await githubRepo.releaseEvent(claimed1.id, 'PROCESSED');
      await githubRepo.releaseEvent(claimed2.id, 'PROCESSED');
    });

    it('CERT-H04B-09: worker debe recuperar y reclamar eventos abandonados con lease expirado tras caída de proceso', async () => {
      const abandonedDeliv = `deliv-abandoned-${Date.now()}`;
      // Insertar evento en PROCESSING pero con lease_expires_at expirado (hace 10 minutos)
      await appPool.query(`
        INSERT INTO traceflow.github_event (
          delivery_id, event_type, installation_id, github_repo_id, project_id, payload,
          processing_status, locked_by, locked_at, lease_expires_at
        ) VALUES (
          $1, 'push', $2, $3, $4, '{"test": "abandoned"}'::jsonb,
          'PROCESSING', 'crashed-worker-pid-9999', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '10 minutes'
        );
      `, [abandonedDeliv, realInstallationId, realRepoId, realProjectId]);

      // Nuevo worker reclama lote
      const reclaimed = await githubRepo.claimEvents('worker-healer-1', 10, 30);
      const matched = reclaimed.find((e) => e.delivery_id === abandonedDeliv);

      expect(matched).toBeDefined();
      expect(matched?.locked_by).toBe('worker-healer-1');
      expect(matched?.processing_status).toBe('PROCESSING');
      expect(new Date(matched?.lease_expires_at!).getTime()).toBeGreaterThan(Date.now());

      await githubRepo.releaseEvent(matched!.id, 'PROCESSED');
    });
  });

  // ==========================================================================
  // BLOQUE 4: GOBERNANZA SCM, IDEMPOTENCIA Y PRESERVACIÓN DE ECS (H04B-R01 A H04B-R05)
  // ==========================================================================
  describe('4. Gobernanza SCM, Preservación de Inventario ECS e Idempotencia', () => {
    it('CERT-H04B-10: handleWebhook debe almacenar evento con correlation_status NONE y responder 202 duplicate: false/true', async () => {
      const payload = {
        action: 'ping',
        installation: { id: realInstallationId },
        repository: { id: realRepoId, full_name: 'exodo-org/pasarela-core' },
      };
      const deliveryId = `real-pg-deliv-${Date.now()}`;
      const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
      const signature = generateSignature(rawBody);

      const res = await webhookService.handleWebhook(
        {
          'x-hub-signature-256': signature,
          'x-github-delivery': deliveryId,
          'x-github-event': 'ping',
        },
        rawBody,
        payload
      );

      expect(res.received).toBe(true);
      expect(res.duplicate).toBe(false);
      expect(res.deliveryId).toBe(deliveryId);

      // Reentrega del mismo delivery_id
      const resDup = await webhookService.handleWebhook(
        {
          'x-hub-signature-256': signature,
          'x-github-delivery': deliveryId,
          'x-github-event': 'ping',
        },
        rawBody,
        payload
      );
      expect(resDup.received).toBe(true);
      expect(resDup.duplicate).toBe(true);

      // Comprobar persistencia física en tabla github_event
      const stored = await githubRepo.findEventByDeliveryId(deliveryId);
      expect(stored).not.toBeNull();
      expect(stored?.project_id).toBe(realProjectId);
    });

    it('CERT-H04B-11: commit push sin RFC aprobada NO debe mutar file_path del ECS oficial (H04B-R01, H04B-R02)', async () => {
      // 1. Crear ECS en traceflow.config_item
      const initialPath = 'src/unauthorized/security.service.ts';
      const ecsCode = `SRC-OOB-${Date.now().toString().slice(-4)}`;
      const ecs = await githubRepo.createConfigItem({
        project_id: realProjectId,
        code: ecsCode,
        name: 'Módulo de Seguridad Base',
        file_path: initialPath,
      });

      // 2. Configurar commit mock que intenta mover el archivo sin RFC aprobada
      const commitSha = `sha-oob-${Date.now()}`;
      githubClient.addMockCommit({
        sha: commitSha,
        message: 'refactor: mover seguridad sin orden de cambio formal [UNAUTHORIZED]',
        author: { name: 'Dev Desconocido', email: 'unknown@external.com', date: new Date().toISOString() },
        files: [
          {
            filename: 'src/hacked/security.service.ts',
            status: 'renamed',
            previous_filename: initialPath,
            additions: 1,
            deletions: 1,
            changes: 2,
          },
        ],
      });

      // 3. Crear y procesar evento push
      const deliveryId = `push-unauth-${Date.now()}`;
      const event = await githubRepo.saveEvent({
        deliveryId,
        eventType: 'push',
        installationId: realInstallationId,
        githubRepoId: realRepoId,
        projectId: realProjectId,
        payload: {
          repository: { id: realRepoId, full_name: 'exodo-org/pasarela-core' },
          commits: [{ id: commitSha, message: 'refactor: mover seguridad sin orden de cambio formal [UNAUTHORIZED]' }],
        },
      });

      await eventProcessor.processClaimedEvent(event);

      // 4. PRESERVACIÓN DEL ECS: file_path oficial no debe haber cambiado
      const ecsCheck = await appPool.query<{ file_path: string }>(
        `SELECT file_path FROM traceflow.config_item WHERE id = $1`,
        [ecs.id]
      );
      expect(ecsCheck.rows[0].file_path).toBe(initialPath);

      // 5. EVIDENCIA HISTÓRICA: Se registra en config_item_path_history como PENDING / applied_to_ecs = false
      const historyRes = await appPool.query(
        `SELECT * FROM traceflow.config_item_path_history WHERE config_item_id = $1`,
        [ecs.id]
      );
      expect(historyRes.rows).toHaveLength(1);
      expect(historyRes.rows[0].old_path).toBe(initialPath);
      expect(historyRes.rows[0].new_path).toBe('src/hacked/security.service.ts');
      expect(historyRes.rows[0].applied_to_ecs).toBe(false);
      expect(['PENDING', 'REJECTED']).toContain(historyRes.rows[0].status);

      // 6. El evento debe quedar clasificado como PENDIENTE_DE_CORRELACION u OUT_OF_BAND
      const eventCheck = await githubRepo.findEventByDeliveryId(deliveryId);
      expect(['PENDIENTE_DE_CORRELACION', 'OUT_OF_BAND']).toContain(eventCheck?.correlation_status);
    });

    it('CERT-H04B-12: commit push con RFC aprobada y orden de cambio activa debe actualizar file_path del ECS (H04B-R01, H04B-R02)', async () => {
      // 1. Crear ECS en traceflow.config_item
      const initialPath = 'src/billing/invoice.service.ts';
      const targetPath = 'src/sunat/invoice.service.ts';
      const ecsCode = `SRC-AUTH-${Date.now().toString().slice(-4)}`;
      const ecs = await githubRepo.createConfigItem({
        project_id: realProjectId,
        code: ecsCode,
        name: 'Módulo de Facturación Aprobado',
        file_path: initialPath,
      });

      // 2. Crear RFC en traceflow.change_request con estado AUTORIZADA
      const rfcId = crypto.randomUUID();
      const rfcCode = `RFC-${Date.now().toString().slice(-4)}`;
      await appPool.query(`
        INSERT INTO traceflow.change_request (
          id, project_id, code, title, description, justification, priority,
          classification, status, requested_by, target_ecs_id
        ) VALUES (
          $1, $2, $3, 'Aprobación de Facturación', 'Reestructuración fiscal', 'Cumplimiento SUNAT', 'ALTA',
          'CAMBIO_MENOR', 'AUTORIZADA', $4, $5
        );
      `, [rfcId, realProjectId, rfcCode, realUserId, ecs.id]);

      // 3. Crear Orden de Cambio activa en traceflow.change_order y sync_lock activo (H04B-C)
      const coId = crypto.randomUUID();
      const coCode = `ECN-${Date.now().toString().slice(-4)}`;
      await appPool.query(`
        INSERT INTO traceflow.change_order (
          id, rfc_id, code, ecs_id, status, issued_by, assigned_developer_id
        ) VALUES (
          $1, $2, $3, $4, 'EMITIDA', $5, $5
        );
      `, [coId, rfcId, coCode, ecs.id, realUserId]);

      const lockId = crypto.randomUUID();
      await appPool.query(`
        INSERT INTO traceflow.sync_lock (
          id, ecs_id, change_order_id, locked_by, status, work_library_path
        ) VALUES (
          $1, $2, $3, $4, 'ACTIVE', $5
        );
      `, [lockId, ecs.id, coId, realUserId, initialPath]);

      // 4. Configurar commit mock vinculando la RFC
      const commitSha = `sha-auth-${Date.now()}`;
      githubClient.addMockCommit({
        sha: commitSha,
        message: `feat(${rfcCode}): mover facturación electrónica a paquete fiscal`,
        author: { name: 'Joan Medina', email: 'jmedina@exodo.pe', date: new Date().toISOString() },
        files: [
          {
            filename: targetPath,
            status: 'renamed',
            previous_filename: initialPath,
            additions: 5,
            deletions: 2,
            changes: 7,
          },
        ],
      });

      // 5. Crear y procesar evento push
      const deliveryId = `push-auth-${Date.now()}`;
      const event = await githubRepo.saveEvent({
        deliveryId,
        eventType: 'push',
        installationId: realInstallationId,
        githubRepoId: realRepoId,
        projectId: realProjectId,
        payload: {
          repository: { id: realRepoId, full_name: 'exodo-org/pasarela-core' },
          commits: [{ id: commitSha, message: `feat(${rfcCode}): mover facturación electrónica a paquete fiscal` }],
        },
      });

      await eventProcessor.processClaimedEvent(event);

      // 6. ACTUALIZACIÓN AUTORIZADA: file_path oficial debe haber cambiado
      const ecsCheck = await appPool.query<{ file_path: string }>(
        `SELECT file_path FROM traceflow.config_item WHERE id = $1`,
        [ecs.id]
      );
      expect(ecsCheck.rows[0].file_path).toBe(targetPath);

      // 7. HISTORIAL AUTORIZADO: Se registra con applied_to_ecs = true y status = APPLIED
      const historyRes = await appPool.query(
        `SELECT * FROM traceflow.config_item_path_history WHERE config_item_id = $1 AND git_commit_sha = $2`,
        [ecs.id, commitSha]
      );
      expect(historyRes.rows).toHaveLength(1);
      expect(historyRes.rows[0].applied_to_ecs).toBe(true);
      expect(historyRes.rows[0].status).toBe('APPLIED');

      // 8. Evento clasificado como AUTORIZADO
      const eventCheck = await githubRepo.findEventByDeliveryId(deliveryId);
      expect(eventCheck?.correlation_status).toBe('AUTORIZADO');
    });

    it('CERT-H04B-13: inserciones idénticas en config_item_path_history deben resolverse vía ON CONFLICT DO UPDATE sin error 500 (H04B-R05)', async () => {
      const ecsCode = `SRC-IDEM-${Date.now().toString().slice(-4)}`;
      const ecs = await githubRepo.createConfigItem({
        project_id: realProjectId,
        code: ecsCode,
        name: 'Módulo Idempotencia',
        file_path: 'src/idem/a.ts',
      });

      const commitSha = `sha-idem-${Date.now()}`;

      // Primera inserción
      await githubRepo.recordPathChange({
        configItemId: ecs.id,
        projectId: realProjectId,
        oldPath: 'src/idem/a.ts',
        newPath: 'src/idem/b.ts',
        changeType: 'MOVE',
        gitCommitSha: commitSha,
        appliedToEcs: false,
        status: 'PENDING',
      });

      // Segunda inserción idéntica (redelivery/reintento)
      await githubRepo.recordPathChange({
        configItemId: ecs.id,
        projectId: realProjectId,
        oldPath: 'src/idem/a.ts',
        newPath: 'src/idem/b.ts',
        changeType: 'MOVE',
        gitCommitSha: commitSha,
        appliedToEcs: true,
        status: 'APPLIED',
      });

      // En PostgreSQL real debe existir exactamente 1 fila con los valores actualizados
      const res = await appPool.query(
        `SELECT * FROM traceflow.config_item_path_history WHERE config_item_id = $1 AND git_commit_sha = $2 AND change_type = 'MOVE'`,
        [ecs.id, commitSha]
      );
      expect(res.rows).toHaveLength(1);
      expect(res.rows[0].status).toBe('APPLIED');
      expect(res.rows[0].applied_to_ecs).toBe(true);
    });

    it('CERT-H04B-14: revocación de instalación GitHub (suspend) debe deshabilitar integración sin borrar datos históricos (H04B-R07)', async () => {
      const deliveryId = `inst-suspend-${Date.now()}`;
      const event = await githubRepo.saveEvent({
        deliveryId,
        eventType: 'installation',
        action: 'suspend',
        installationId: realInstallationId,
        projectId: realProjectId,
        payload: {
          action: 'suspend',
          installation: { id: realInstallationId },
        },
      });

      await eventProcessor.processClaimedEvent(event);

      // 1. Estado de la instalación organizacional pasa a SUSPENDED
      const inst = await githubRepo.findInstallationByInstallationId(realInstallationId);
      expect(inst?.status).toBe('SUSPENDED');

      // 2. Integración vinculada pasa a PERMISSION_DENIED
      const integr = await githubRepo.findByProjectId(realProjectId);
      expect(integr?.validation_status).toBe('PERMISSION_DENIED');

      // 3. Configuración del proyecto marcada con github_completed = false
      const setupRes = await appPool.query<{ github_completed: boolean }>(
        `SELECT github_completed FROM traceflow.project_setup WHERE project_id = $1`,
        [realProjectId]
      );
      if (setupRes.rows.length > 0) {
        expect(setupRes.rows[0].github_completed).toBe(false);
      }

      // Restaurar instalación a ACTIVE para no alterar pruebas subsiguientes
      await githubRepo.updateInstallationStatus(realInstallationId, 'ACTIVE');
      await githubRepo.updateIntegrationsByInstallationId(realInstallationId, 'VALIDATED');
    });

    it('CERT-H04B-C-18: dos trabajadores concurrentes con lease expirado en PostgreSQL 16 real previenen split-brain mediante claim_token', async () => {
      // Limpiar eventos previos no completados para aislar la prueba de competencia
      await adminPool.query(`DELETE FROM traceflow.github_event WHERE processing_status != 'PROCESSED'`);

      // 1. Guardar evento de prueba en PostgreSQL real
      const deliveryId = `lease-cert-${Date.now()}`;
      const event = await githubRepo.saveEvent({
        deliveryId,
        eventType: 'ping',
        installationId: realInstallationId,
        payload: { test: 'lease-split-brain' },
      });

      // 2. Worker 1 reclama el evento
      const worker1 = 'worker-pg-alpha';
      const claimedByW1 = await githubRepo.claimEvents(worker1, 1, 1);
      expect(claimedByW1.length).toBe(1);
      const token1 = claimedByW1[0].claim_token;
      expect(token1).toBeDefined();

      // 3. Forzar expiración del lease en PostgreSQL real
      await adminPool.query(
        `UPDATE traceflow.github_event SET lease_expires_at = NOW() - interval '2 seconds' WHERE id = $1`,
        [event.id]
      );

      // 4. Worker 2 reclama el evento abandonado en PostgreSQL real
      const worker2 = 'worker-pg-beta';
      const claimedByW2 = await githubRepo.claimEvents(worker2, 1, 30);
      expect(claimedByW2.length).toBe(1);
      expect(claimedByW2[0].id).toBe(event.id);
      expect(claimedByW2[0].locked_by).toBe(worker2);
      expect(claimedByW2[0].claim_token).not.toBe(token1);

      // 5. Worker 1 intenta liberar el evento con su token y workerId expirado
      const failedRelease = await githubRepo.releaseEvent(
        event.id,
        'PROCESSED',
        worker1,
        token1,
        null,
        'AUTORIZADO'
      );
      // Debe retornar null porque PostgreSQL actualizó 0 filas (condición locked_by y claim_token no coinciden)
      expect(failedRelease).toBeNull();

      // 6. Worker 2 finaliza legítimamente la transacción en PostgreSQL
      const successRelease = await githubRepo.releaseEvent(
        event.id,
        'PROCESSED',
        worker2,
        claimedByW2[0].claim_token,
        null,
        'AUTORIZADO'
      );
      expect(successRelease).not.toBeNull();
      expect(successRelease?.processing_status).toBe('PROCESSED');
      expect(successRelease?.locked_by).toBeNull();
    });

    it('CERT-H04B-C-19: recepción de installation.deleted en PostgreSQL 16 actualiza a DELETED e invalida integración sin borrado físico', async () => {
      const deliveryId = `inst-del-cert-${Date.now()}`;
      const event = await githubRepo.saveEvent({
        deliveryId,
        eventType: 'installation',
        action: 'deleted',
        installationId: realInstallationId,
        payload: { action: 'deleted', installation: { id: realInstallationId } },
      });

      await eventProcessor.processClaimedEvent(event);

      // 1. Estado en PostgreSQL pasa a DELETED sin borrado físico
      const instCheck = await appPool.query<{ status: string; count: string }>(
        `SELECT status, count(*) OVER() as count FROM traceflow.organization_github_installation WHERE installation_id = $1`,
        [realInstallationId]
      );
      expect(instCheck.rows).toHaveLength(1);
      expect(instCheck.rows[0].status).toBe('DELETED');

      // 2. Integración pasa a UNLINKED
      const intCheck = await appPool.query<{ validation_status: string }>(
        `SELECT validation_status FROM traceflow.github_integration WHERE project_id = $1`,
        [realProjectId]
      );
      expect(intCheck.rows[0].validation_status).toBe('UNLINKED');

      // Restaurar para pruebas siguientes
      await adminPool.query(
        `UPDATE traceflow.organization_github_installation SET status = 'ACTIVE' WHERE installation_id = $1`,
        [realInstallationId]
      );
      await adminPool.query(
        `UPDATE traceflow.github_integration SET validation_status = 'VALIDATED' WHERE project_id = $1`,
        [realProjectId]
      );
    });

    it('CERT-H04B-C-20: push con RFC autorizada pero sin sync_lock activo en PostgreSQL 16 queda PENDIENTE_DE_CORRELACION', async () => {
      // 1. Crear ECS
      const ecsId = crypto.randomUUID();
      const code = `ECS-${Date.now().toString().slice(-4)}`;
      const filePath = `src/services/unlocked-${Date.now()}.ts`;
      await githubRepo.createConfigItem({
        id: ecsId,
        project_id: realProjectId,
        code,
        name: 'Módulo sin bloqueo',
        file_path: filePath,
      });

      // 2. Crear RFC autorizada y ECN emitida SIN sync_lock activo
      const rfcId = crypto.randomUUID();
      const rfcCode = `RFC-${Date.now().toString().slice(-4)}`;
      await appPool.query(`
        INSERT INTO traceflow.change_request (
          id, project_id, code, title, description, justification, priority,
          classification, status, requested_by, target_ecs_id
        ) VALUES (
          $1, $2, $3, 'Aprobación sin lock', 'Desc', 'Just', 'ALTA',
          'CAMBIO_MENOR', 'AUTORIZADA', $4, $5
        );
      `, [rfcId, realProjectId, rfcCode, realUserId, ecsId]);

      const coId = crypto.randomUUID();
      const coCode = `ECN-${Date.now().toString().slice(-4)}`;
      await appPool.query(`
        INSERT INTO traceflow.change_order (
          id, rfc_id, code, ecs_id, status, issued_by, assigned_developer_id
        ) VALUES (
          $1, $2, $3, $4, 'EMITIDA', $5, $5
        );
      `, [coId, rfcId, coCode, ecsId, realUserId]);

      // 3. Crear commit y procesar evento push
      const commitSha = `sha-nolock-${Date.now()}`;
      githubClient.addMockCommit({
        sha: commitSha,
        message: `feat(${rfcCode}): intento de cambio sin sync_lock`,
        author: { name: 'Joan Medina', email: 'jmedina@exodo.pe', date: new Date().toISOString() },
        files: [{ filename: filePath, status: 'modified', additions: 1, deletions: 1, changes: 2 }],
      });

      const deliveryId = `push-nolock-${Date.now()}`;
      const event = await githubRepo.saveEvent({
        deliveryId,
        eventType: 'push',
        installationId: realInstallationId,
        githubRepoId: realRepoId,
        projectId: realProjectId,
        payload: {
          repository: { id: realRepoId, full_name: 'exodo-org/pasarela-core' },
          commits: [{ id: commitSha, message: `feat(${rfcCode}): intento de cambio sin sync_lock` }],
        },
      });

      const processed = await eventProcessor.processClaimedEvent(event);
      expect(processed.correlation_status).toBe('PENDIENTE_DE_CORRELACION');

      // Inventario no muta
      const ecsCheck = await appPool.query<{ file_path: string }>(
        `SELECT file_path FROM traceflow.config_item WHERE id = $1`,
        [ecsId]
      );
      expect(ecsCheck.rows[0].file_path).toBe(filePath);
    });
  });

  // ==========================================================================
  // BLOQUE 5: PROCEDIMIENTO DE ROLLBACK SEGURO (H04B-R Y H04B)
  // ==========================================================================
  describe('5. Salvaguardas de Integridad y Rollback Seguro (INIT-H04B-R / INIT-H04B)', () => {
    it('CERT-H04B-15: el rollback de H04B-R (202611260007) debe abortar si existen eventos bloqueados o en procesamiento', async () => {
      // Insertar un evento en estado PROCESSING
      await appPool.query(`
        INSERT INTO traceflow.github_event (
          delivery_id, event_type, installation_id, payload, processing_status, locked_by
        ) VALUES (
          'block-rb-test', 'ping', $1, '{"ping": true}'::jsonb, 'PROCESSING', 'worker-active'
        );
      `, [realInstallationId]);

      const rollbackSqlPath = path.resolve(
        process.cwd(),
        '..',
        'supabase',
        'migrations',
        '202611260007_init_h04b_r_webhooks_governance_and_worker_rollback.sql'
      );
      const rollbackSql = fs.readFileSync(rollbackSqlPath, 'utf8');

      // Al existir eventos bloqueados, debe abortar
      await expect(adminPool.query(rollbackSql)).rejects.toThrow(
        /BLOQUEO DE SEGURIDAD \(INIT-H04B-R\)/i
      );

      // Limpiar el evento de prueba
      await adminPool.query(`DELETE FROM traceflow.github_event WHERE delivery_id = 'block-rb-test'`);
    });

    it('CERT-H04B-16: con allow_force_h04_rollback = true el rollback de H04B-C (202611260008) y H04B-R (202611260007) debe revertir limpiamente', async () => {
      // 1. Revertir H04B-C (202611260008)
      const rollbackH04BCPath = path.resolve(
        process.cwd(),
        '..',
        'supabase',
        'migrations',
        '202611260008_init_h04b_c_governance_and_leases_rollback.sql'
      );
      const rollbackH04BCSql = fs.readFileSync(rollbackH04BCPath, 'utf8');
      await adminPool.query(`
        SET LOCAL traceflow.allow_force_h04_rollback = 'true';
        ${rollbackH04BCSql}
      `);

      const colClaimRes = await adminPool.query<{ column_name: string }>(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'traceflow' AND table_name = 'github_event'
          AND column_name = 'claim_token';
      `);
      expect(colClaimRes.rows).toHaveLength(0);

      // 2. Revertir H04B-R (202611260007)
      const rollbackSqlPath = path.resolve(
        process.cwd(),
        '..',
        'supabase',
        'migrations',
        '202611260007_init_h04b_r_webhooks_governance_and_worker_rollback.sql'
      );
      const rollbackSql = fs.readFileSync(rollbackSqlPath, 'utf8');

      const forceSql = `
        SET LOCAL traceflow.allow_force_h04_rollback = 'true';
        ${rollbackSql}
      `;

      await adminPool.query(forceSql);

      // Comprobar que las columnas e índices de H04B-R fueron eliminados limpiamente
      const colRes = await adminPool.query<{ column_name: string }>(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'traceflow' AND table_name = 'github_event'
          AND column_name IN ('locked_by', 'locked_at', 'lease_expires_at', 'correlation_status');
      `);
      expect(colRes.rows).toHaveLength(0);

      const idxRes = await adminPool.query<{ indexname: string }>(`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'traceflow' AND indexname = 'idx_github_event_claimable';
      `);
      expect(idxRes.rows).toHaveLength(0);
    });

    it('CERT-H04B-17: con allow_force_h04_rollback = true el rollback de H04B (202611260006) debe eliminar tablas y restaurar 31 tablas', async () => {
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

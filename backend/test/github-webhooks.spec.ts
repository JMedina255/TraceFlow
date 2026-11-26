/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE DE PRUEBAS TDD DE WEBHOOKS Y SINCRONIZACIÓN GIT (H04B)
 * Archivo: backend/test/github-webhooks.spec.ts
 * Hito: INIT-H04B — Requisitos DA-01 a DA-06, ADR-011, RNF-01, RNF-03
 *
 * VALIDACIONES OBLIGATORIAS:
 *  1. H04B-01: Verificación de firmas HMAC-SHA256 (tiempo constante, rechazo de tampering, fail-closed).
 *  2. H04B-02: Idempotencia estricta por X-GitHub-Delivery y buffer de eventos (PENDING).
 *  3. H04B-03: Procesamiento asíncrono desacoplado, transiciones y reintentos (PENDING -> PROCESSING -> PROCESSED/FAILED).
 *  4. H04B-04: Sincronización de eventos push y mapeo a proyectos TraceFlow.
 *  5. H04B-05: Detección y registro de renombrados, movimientos y bajas de rutas de ECS en config_item_path_history.
 *  6. H04B-06: Detección de modificaciones fuera de banda (DA-01, DA-02) y auditoría criptográfica.
 *  7. H04B-07: Controladores REST HTTP 202 Accepted sin AuthGuard de usuario humano.
 * ============================================================================
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as crypto from 'node:crypto';
import {
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from '../src/database/database.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { GitHubRepository } from '../src/modules/github/github.repository.js';
import { MockGitHubApiClient } from '../src/modules/github/github-api.client.js';
import { GitHubWebhookService } from '../src/modules/github/webhooks/github-webhook.service.js';
import { GitHubEventProcessorService } from '../src/modules/github/webhooks/github-event-processor.service.js';
import {
  GitHubWebhookController,
  GitHubProjectWebhookController,
} from '../src/modules/github/webhooks/github-webhook.controller.js';

describe('TraceFlow SCM — INIT-H04B: Webhooks, Procesamiento Asíncrono y Sincronización Git (TDD)', () => {
  let db: DatabaseService;
  let auditService: AuditService;
  let githubRepo: GitHubRepository;
  let githubClient: MockGitHubApiClient;
  let eventProcessor: GitHubEventProcessorService;
  let webhookService: GitHubWebhookService;
  let webhookController: GitHubWebhookController;
  let projectWebhookController: GitHubProjectWebhookController;

  const testSecret = 'secret-test-key-traceflow-h04b';
  const testProjectId = 'b0000001-0000-0000-0000-000000000001';
  const testRepoId = 101010101;

  function generateSignature(payload: any, secret: string = testSecret): string {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(Buffer.from(raw, 'utf8'));
    return `sha256=${hmac.digest('hex')}`;
  }

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_MODE = 'mock';
    process.env.ALLOW_MOCK_GITHUB = 'true';
    process.env.GITHUB_WEBHOOK_SECRET = testSecret;

    db = new DatabaseService();
    auditService = new AuditService(db);
    githubRepo = new GitHubRepository(db);
    githubClient = new MockGitHubApiClient();
    eventProcessor = new GitHubEventProcessorService(githubRepo, auditService, githubClient);
    webhookService = new GitHubWebhookService(githubRepo, auditService, eventProcessor);
    webhookController = new GitHubWebhookController(webhookService);
    projectWebhookController = new GitHubProjectWebhookController(webhookService);

    githubRepo.resetMockIntegrations();
    githubRepo.resetMockEvents();
    githubRepo.resetMockPathHistories();
    githubRepo.resetMockConfigItems();

    // Registrar integración activa para vincular con testProjectId
    githubRepo.saveIntegration({
      projectId: testProjectId,
      integrationMode: 'LINK_EXISTING',
      repoOwner: 'JMedina255',
      repoName: 'TraceFlow',
      repoFullName: 'JMedina255/TraceFlow',
      githubRepoId: testRepoId,
      defaultBranch: 'main',
      installationId: 12345678,
      visibility: 'private',
      permissions: { push: true, pull: true, admin: true },
      validationStatus: 'VALIDATED',
    });
  });

  afterEach(() => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
  });

  // ==========================================================================
  // BLOQUE 1: VERIFICACIÓN DE FIRMAS HMAC-SHA256 (H04B-01)
  // ==========================================================================
  describe('H04B-01: Verificación de firmas HMAC-SHA256', () => {
    it('TDD-H04B-01-01: debe verificar exitosamente una firma HMAC-SHA256 válida', () => {
      const payload = { action: 'ping', zen: 'Favoring focus over features.' };
      const signature = generateSignature(payload);

      const isValid = webhookService.verifySignature(JSON.stringify(payload), signature);
      expect(isValid).toBe(true);
    });

    it('TDD-H04B-01-02: debe rechazar con false si la firma fue generada con una clave distinta', () => {
      const payload = { action: 'ping' };
      const invalidSignature = generateSignature(payload, 'clave-invalida-atacante');

      const isValid = webhookService.verifySignature(JSON.stringify(payload), invalidSignature);
      expect(isValid).toBe(false);
    });

    it('TDD-H04B-01-03: debe rechazar con false si el payload fue alterado (tampering)', () => {
      const originalPayload = { action: 'push', commits: [] };
      const signature = generateSignature(originalPayload);

      const tamperedPayload = { action: 'push', commits: [{ message: 'malicious commit' }] };
      const isValid = webhookService.verifySignature(JSON.stringify(tamperedPayload), signature);
      expect(isValid).toBe(false);
    });

    it('TDD-H04B-01-04: debe rechazar si la cabecera X-Hub-Signature-256 es nula, vacía o malformada', () => {
      const payload = { action: 'ping' };
      expect(webhookService.verifySignature(JSON.stringify(payload), undefined)).toBe(false);
      expect(webhookService.verifySignature(JSON.stringify(payload), '')).toBe(false);
      expect(webhookService.verifySignature(JSON.stringify(payload), 'sha1=abcdef')).toBe(false);
      expect(webhookService.verifySignature(JSON.stringify(payload), 'sha256=too_short')).toBe(false);
    });

    it('TDD-H04B-01-05: debe aplicar fail-closed en producción si falta GITHUB_WEBHOOK_SECRET', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.GITHUB_WEBHOOK_SECRET;

      expect(() => webhookService.getWebhookSecret()).toThrow(InternalServerErrorException);
      expect(() => webhookService.getWebhookSecret()).toThrow(/CONFIG_ERROR/);
    });
  });

  // ==========================================================================
  // BLOQUE 2: IDEMPOTENCIA Y BUFFER DE ENTREGA (H04B-02)
  // ==========================================================================
  describe('H04B-02: Idempotencia y buffer de entrega (X-GitHub-Delivery)', () => {
    it('TDD-H04B-02-01: debe exigir cabecera X-GitHub-Delivery y rechazar con 400 si falta', async () => {
      const payload = { zen: 'Keep it logically awesome.' };
      const signature = generateSignature(payload);

      await expect(
        webhookService.handleWebhook(
          {
            'x-hub-signature-256': signature,
            'x-github-event': 'ping',
          },
          JSON.stringify(payload),
          payload
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('TDD-H04B-02-02: debe exigir cabecera X-GitHub-Event y rechazar con 400 si falta', async () => {
      const payload = { zen: 'Keep it logically awesome.' };
      const signature = generateSignature(payload);

      await expect(
        webhookService.handleWebhook(
          {
            'x-hub-signature-256': signature,
            'x-github-delivery': 'deliv-0001-uuid',
          },
          JSON.stringify(payload),
          payload
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('TDD-H04B-02-03: debe rechazar firmas inválidas con 401 Unauthorized', async () => {
      const payload = { zen: 'Keep it logically awesome.' };

      await expect(
        webhookService.handleWebhook(
          {
            'x-hub-signature-256': 'sha256=0000000000000000000000000000000000000000000000000000000000000000',
            'x-github-delivery': 'deliv-0002-uuid',
            'x-github-event': 'ping',
          },
          JSON.stringify(payload),
          payload
        )
      ).rejects.toThrow(UnauthorizedException);
    });

    it('TDD-H04B-02-04: primer arribo debe registrar evento en estado PENDING con duplicate: false', async () => {
      const payload = {
        action: 'ping',
        installation: { id: 12345678 },
        repository: { id: testRepoId, full_name: 'JMedina255/TraceFlow' },
      };
      const deliveryId = 'deliv-0003-first-arrival';
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
      expect(res.status).toBe('PENDING');

      // Verificar persistencia en base de datos
      const stored = await githubRepo.findEventByDeliveryId(deliveryId);
      expect(stored).not.toBeNull();
      expect(stored?.delivery_id).toBe(deliveryId);
      expect(stored?.installation_id).toBe(12345678);
      expect(stored?.project_id).toBe(testProjectId);
    });

    it('TDD-H04B-02-05: segundo arribo con mismo delivery_id debe responder duplicate: true sin error 500', async () => {
      const payload = {
        action: 'ping',
        installation: { id: 12345678 },
      };
      const deliveryId = 'deliv-0004-duplicate';
      const signature = generateSignature(payload);

      const firstCall = await webhookService.handleWebhook(
        {
          'x-hub-signature-256': signature,
          'x-github-delivery': deliveryId,
          'x-github-event': 'ping',
        },
        JSON.stringify(payload),
        payload
      );
      expect(firstCall.duplicate).toBe(false);

      // Redeliver mismo evento
      const secondCall = await webhookService.handleWebhook(
        {
          'x-hub-signature-256': signature,
          'x-github-delivery': deliveryId,
          'x-github-event': 'ping',
        },
        JSON.stringify(payload),
        payload
      );
      expect(secondCall.received).toBe(true);
      expect(secondCall.duplicate).toBe(true);
      expect(secondCall.deliveryId).toBe(deliveryId);
    });
  });

  // ==========================================================================
  // BLOQUE 3: PROCESAMIENTO ASÍNCRONO Y REINTENTOS (H04B-03)
  // ==========================================================================
  describe('H04B-03: Procesamiento Asíncrono desacoplado y transiciones de estado', () => {
    it('TDD-H04B-03-01: processEvent debe transicionar PENDING -> PROCESSING -> PROCESSED', async () => {
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-0005-async-ok',
        eventType: 'ping',
        installationId: 12345678,
        payload: { zen: 'Keep it simple.' },
        status: 'PENDING',
      });

      const processed = await eventProcessor.processEvent(event);
      expect(processed.processing_status).toBe('PROCESSED');
      expect(processed.processed_at).toBeDefined();

      const inRepo = await githubRepo.findEventById(event.id);
      expect(inRepo?.processing_status).toBe('PROCESSED');
    });

    it('TDD-H04B-03-02: si ocurre un fallo debe incrementar attempts y registrar error_message', async () => {
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-0006-fail',
        eventType: 'push',
        installationId: 12345678,
        payload: { commits: null }, // Provocará fallo al iterar
        status: 'PENDING',
      });

      // Simular fallo
      const updated = await githubRepo.incrementEventAttempts(event.id, 'Fallo de conexión simulado');
      expect(updated?.attempts).toBe(1);
      expect(updated?.error_message).toBe('Fallo de conexión simulado');
      expect(updated?.processing_status).toBe('PENDING'); // Aún no supera max_attempts (3)
    });

    it('TDD-H04B-03-03: al alcanzar max_attempts (3) el estado debe transicionar a FAILED', async () => {
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-0007-max-attempts',
        eventType: 'push',
        installationId: 12345678,
        payload: {},
        status: 'PENDING',
      });

      await githubRepo.incrementEventAttempts(event.id, 'Intento 1');
      await githubRepo.incrementEventAttempts(event.id, 'Intento 2');
      const finalAttempt = await githubRepo.incrementEventAttempts(event.id, 'Intento 3');

      expect(finalAttempt?.attempts).toBe(3);
      expect(finalAttempt?.processing_status).toBe('FAILED');
    });

    it('TDD-H04B-03-04: processPendingEvents debe procesar lote de eventos PENDING', async () => {
      await githubRepo.saveEvent({
        deliveryId: 'deliv-batch-1',
        eventType: 'ping',
        installationId: 12345678,
        payload: {},
      });
      await githubRepo.saveEvent({
        deliveryId: 'deliv-batch-2',
        eventType: 'ping',
        installationId: 12345678,
        payload: {},
      });

      const result = await eventProcessor.processPendingEvents(10);
      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);

      const pendingAfter = await githubRepo.findPendingEvents();
      expect(pendingAfter.length).toBe(0);
    });
  });

  // ==========================================================================
  // BLOQUE 4: DETECCIÓN Y REGISTRO DE CAMBIOS DE RUTAS DE ECS (H04B-05)
  // ==========================================================================
  describe('H04B-05: Sincronización y registro de movimientos/renombrados de ECS', () => {
    it('TDD-H04B-05-01: debe registrar RENAME cuando un archivo ECS es renombrado en el mismo directorio', async () => {
      // 1. Crear ECS previo en el catálogo del proyecto
      const ecs = await githubRepo.createConfigItem({
        project_id: testProjectId,
        code: 'ECS-001',
        name: 'Controlador de Autenticación',
        file_path: 'src/modules/auth/auth.controller.ts',
      });

      // 2. Simular commit de renombrado obtenido por cliente GitHub
      const commitSha = 'c00112233445566778899aabbccddeeff001122';
      githubClient.addMockCommit({
        sha: commitSha,
        message: 'refactor(RFC-001): renombrar controlador de auth',
        author: { name: 'Joan Medina', email: 'jmedina@exodo.pe', date: new Date().toISOString() },
        files: [
          {
            filename: 'src/modules/auth/authentication.controller.ts',
            status: 'renamed',
            previous_filename: 'src/modules/auth/auth.controller.ts',
            additions: 0,
            deletions: 0,
            changes: 0,
          },
        ],
      });

      // 3. Procesar evento push
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-0008-rename',
        eventType: 'push',
        installationId: 12345678,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: commitSha, message: 'refactor(RFC-001): renombrar controlador de auth' }],
        },
      });

      await eventProcessor.processEvent(event);

      // 4. Verificar historial de rutas registrado
      const history = await githubRepo.findPathHistoryByConfigItemId(ecs.id);
      expect(history.length).toBe(1);
      expect(history[0].old_path).toBe('src/modules/auth/auth.controller.ts');
      expect(history[0].new_path).toBe('src/modules/auth/authentication.controller.ts');
      expect(history[0].change_type).toBe('RENAME');
      expect(history[0].git_commit_sha).toBe(commitSha);

      // 5. Verificar actualización de ruta en el catálogo config_item
      const updatedEcs = await githubRepo.findConfigItemByPath(
        testProjectId,
        'src/modules/auth/authentication.controller.ts'
      );
      expect(updatedEcs).not.toBeNull();
      expect(updatedEcs?.id).toBe(ecs.id);
    });

    it('TDD-H04B-05-02: debe registrar MOVE cuando un archivo ECS se traslada a otro directorio', async () => {
      const ecs = await githubRepo.createConfigItem({
        project_id: testProjectId,
        code: 'ECS-002',
        name: 'Servicio de Pagos',
        file_path: 'src/services/payment.service.ts',
      });

      const commitSha = 'c002233445566778899aabbccddeeff00112233';
      githubClient.addMockCommit({
        sha: commitSha,
        message: 'refactor(RFC-002): mover pagos a módulo core',
        author: { name: 'Joan Medina', email: 'jmedina@exodo.pe', date: new Date().toISOString() },
        files: [
          {
            filename: 'src/modules/payments/payment.service.ts',
            status: 'renamed',
            previous_filename: 'src/services/payment.service.ts',
            additions: 0,
            deletions: 0,
            changes: 0,
          },
        ],
      });

      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-0009-move',
        eventType: 'push',
        installationId: 12345678,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: commitSha, message: 'refactor(RFC-002): mover pagos a módulo core' }],
        },
      });

      await eventProcessor.processEvent(event);

      const history = await githubRepo.findPathHistoryByConfigItemId(ecs.id);
      expect(history.length).toBe(1);
      expect(history[0].change_type).toBe('MOVE');
      expect(history[0].old_path).toBe('src/services/payment.service.ts');
      expect(history[0].new_path).toBe('src/modules/payments/payment.service.ts');
    });

    it('TDD-H04B-05-03: debe registrar DELETE cuando un archivo ECS es eliminado en un commit', async () => {
      const ecs = await githubRepo.createConfigItem({
        project_id: testProjectId,
        code: 'ECS-003',
        name: 'Componente Deprecado',
        file_path: 'src/legacy/old-auth.ts',
      });

      const commitSha = 'c0033445566778899aabbccddeeff0011223344';
      githubClient.addMockCommit({
        sha: commitSha,
        message: 'chore(RFC-003): eliminar código legado',
        author: { name: 'Joan Medina', email: 'jmedina@exodo.pe', date: new Date().toISOString() },
        files: [
          {
            filename: 'src/legacy/old-auth.ts',
            status: 'removed',
            additions: 0,
            deletions: 50,
            changes: 50,
          },
        ],
      });

      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-0010-delete',
        eventType: 'push',
        installationId: 12345678,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [
            {
              id: commitSha,
              message: 'chore(RFC-003): eliminar código legado',
              removed: ['src/legacy/old-auth.ts'],
            },
          ],
        },
      });

      await eventProcessor.processEvent(event);

      const history = await githubRepo.findPathHistoryByConfigItemId(ecs.id);
      expect(history.length).toBe(1);
      expect(history[0].change_type).toBe('DELETE');
      expect(history[0].old_path).toBe('src/legacy/old-auth.ts');
    });
  });

  // ==========================================================================
  // BLOQUE 5: DETECCIÓN DE CAMBIOS FUERA DE BANDA (DA-01, DA-02) (H04B-06)
  // ==========================================================================
  describe('H04B-06: Detección de cambios fuera de banda y auditoría SCM', () => {
    it('TDD-H04B-06-01: debe auditar GITHUB_OUT_OF_BAND_DETECTED ante commits no asociados a un RFC formal', async () => {
      const commitSha = 'oob-1111222233334444555566667777888899990000';
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-0011-out-of-band',
        eventType: 'push',
        installationId: 12345678,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [
            {
              id: commitSha,
              message: 'hotfix directo en github sin pasar por ccb [OUT_OF_BAND]',
              author: { name: 'Desarrollador Rebelde', email: 'rebelde@externo.com' },
              modified: ['src/auth/secret.key'],
            },
          ],
        },
      });

      await eventProcessor.processEvent(event);

      const auditTrail = auditService.getAuditChain();
      const oobAudit = auditTrail.find((a) => a.eventCode === 'GITHUB_OUT_OF_BAND_DETECTED');
      expect(oobAudit).toBeDefined();
      expect(oobAudit?.operation).toBe('OUT_OF_BAND_GIT_PUSH');
      expect(oobAudit?.projectId).toBe(testProjectId);
      expect(oobAudit?.payloadDiff.commitSha).toBe(commitSha);
    });

    it('TDD-H04B-06-02: debe auditar GITHUB_GIT_SYNC_COMPLETED cuando el commit referencia un RFC formal aprobado', async () => {
      const commitSha = 'auth-1111222233334444555566667777888899990000';
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-0012-authorized',
        eventType: 'push',
        installationId: 12345678,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [
            {
              id: commitSha,
              message: 'feat(RFC-009): implementación autorizada por CCB',
              author: { name: 'Joan Medina', email: 'jmedina@exodo.pe' },
              added: ['src/modules/audit/audit-hash.ts'],
            },
          ],
        },
      });

      await eventProcessor.processEvent(event);

      const auditTrail = auditService.getAuditChain();
      const syncAudit = auditTrail.find((a) => a.eventCode === 'GITHUB_GIT_SYNC_COMPLETED');
      expect(syncAudit).toBeDefined();
      expect(syncAudit?.operation).toBe('SYNC_GIT_COMMITS');
      expect(syncAudit?.projectId).toBe(testProjectId);
    });
  });

  // ==========================================================================
  // BLOQUE 6: CONTROLADORES REST Y ENDPOINTS (H04B-07)
  // ==========================================================================
  describe('H04B-07: Controladores REST y endpoints HTTP', () => {
    it('TDD-H04B-07-01: POST /api/v1/github/webhook debe procesar y retornar 202 Accepted', async () => {
      const payload = {
        action: 'ping',
        installation: { id: 12345678 },
      };
      const signature = generateSignature(payload);
      const headers = {
        'x-hub-signature-256': signature,
        'x-github-delivery': 'controller-deliv-01',
        'x-github-event': 'ping',
      };

      const reqMock = { rawBody: Buffer.from(JSON.stringify(payload), 'utf8') };
      const res = await webhookController.handleWebhook(headers, reqMock, payload);

      expect(res.message).toContain('exitosamente');
      expect(res.data.received).toBe(true);
      expect(res.data.status).toBe('PENDING');
    });

    it('TDD-H04B-07-02: POST /api/v1/projects/:id/github/webhook debe admitir solicitudes de proyecto', async () => {
      const payload = {
        action: 'ping',
        installation: { id: 12345678 },
        repository: { id: testRepoId },
      };
      const signature = generateSignature(payload);
      const headers = {
        'x-hub-signature-256': signature,
        'x-github-delivery': 'controller-deliv-02',
        'x-github-event': 'ping',
      };

      const reqMock = { rawBody: Buffer.from(JSON.stringify(payload), 'utf8') };
      const res = await projectWebhookController.handleProjectWebhook(
        testProjectId,
        headers,
        reqMock,
        payload
      );

      expect(res.message).toContain('exitosamente');
      expect(res.data.received).toBe(true);
    });
  });
});

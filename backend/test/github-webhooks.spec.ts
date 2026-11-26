/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE DE PRUEBAS TDD DE WEBHOOKS Y GOBERNANZA GIT (INIT-H04B / H04B-R)
 * Archivo: backend/test/github-webhooks.spec.ts
 * Hito: INIT-H04B-R — Subsanación de Gobernanza, Idempotencia y Recuperación
 *
 * COBERTURA EXHAUSTIVA DE REQUISITOS H04B-R:
 *  - H04B-R01: Eliminación de autorizaciones basadas en texto; consulta real a persistencia SCM.
 *  - H04B-R02: Preservación del inventario ECS; separación de evidencia observada vs estado oficial.
 *  - H04B-R03: Autorización estricta por instalación, estado VALIDATED y rechazo de cruces.
 *  - H04B-R04: Trabajador recuperable con lease y FOR UPDATE SKIP LOCKED.
 *  - H04B-R05: Idempotencia transaccional y prevención de duplicidad en redeliveries y reintentos.
 *  - H04B-R06: Seguridad HTTP, exigencia de rawBody Buffer, límites de tamaño y fail-closed sin secretos default.
 *  - H04B-R07: Manejo de ciclo de vida de instalación (suspend, deleted, repos removed) sin borrado de datos SCM.
 * ============================================================================
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as crypto from 'node:crypto';
import {
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  PayloadTooLargeException,
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

describe('TraceFlow SCM — INIT-H04B-R: Cierre de Gobernanza, Idempotencia y Recuperación de Eventos Git (TDD)', () => {
  let db: DatabaseService;
  let auditService: AuditService;
  let githubRepo: GitHubRepository;
  let githubClient: MockGitHubApiClient;
  let eventProcessor: GitHubEventProcessorService;
  let webhookService: GitHubWebhookService;
  let webhookController: GitHubWebhookController;
  let projectWebhookController: GitHubProjectWebhookController;

  const testSecret = 'secret-test-key-traceflow-h04b-r';
  const testProjectId = 'b0000001-0000-0000-0000-000000000001';
  const testRepoId = 101010101;
  const testInstallationId = 12345678;

  function generateSignature(payload: any, secret: string = testSecret): string {
    const rawBuf = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload), 'utf8');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBuf);
    return `sha256=${hmac.digest('hex')}`;
  }

  beforeEach(async () => {
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
    githubRepo.resetMockInstallations();
    githubRepo.resetMockScmData();

    // 1. Registrar instalación activa de organización
    githubRepo.addMockInstallation({
      id: 'inst0001-0000-0000-0000-000000000001',
      organization_id: 'c0000001-0000-0000-0000-000000000001',
      installation_id: testInstallationId,
      account_login: 'exodo-org',
      account_type: 'Organization',
      permissions: { contents: 'write', metadata: 'read', pull_requests: 'write' },
      status: 'ACTIVE',
      installed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 2. Registrar integración validada para el proyecto de prueba
    await githubRepo.saveIntegration({
      projectId: testProjectId,
      integrationMode: 'LINK_EXISTING',
      repoOwner: 'JMedina255',
      repoName: 'TraceFlow',
      repoFullName: 'JMedina255/TraceFlow',
      githubRepoId: testRepoId,
      defaultBranch: 'main',
      installationId: testInstallationId,
      visibility: 'private',
      permissions: { push: true, pull: true, admin: true },
      validationStatus: 'VALIDATED',
    });

    // 3. Registrar RFCs de prueba con distintos estados de gobernanza SCM
    // RFC-2026-0001: AUTORIZADA con Orden de Cambio activa para testProjectId
    githubRepo.addMockRfc({
      id: 'rfc-auth-01',
      code: 'RFC-2026-0001',
      project_id: testProjectId,
      status: 'AUTORIZADA',
      target_ecs_id: 'ecs-item-01',
      requested_by: 'a0000001-0000-0000-0000-000000000001',
    });
    githubRepo.addMockChangeOrder({
      id: 'co-auth-01',
      code: 'ECN-2026-0001',
      rfc_id: 'rfc-auth-01',
      ecs_id: 'ecs-item-01',
      status: 'EMITIDA',
      issued_by: 'a0000001-0000-0000-0000-000000000001',
      assigned_developer_id: 'a0000001-0000-0000-0000-000000000002',
    });

    // RFC-2026-0002: REGISTRADA (No aprobada formalmente)
    githubRepo.addMockRfc({
      id: 'rfc-unapproved-02',
      code: 'RFC-2026-0002',
      project_id: testProjectId,
      status: 'REGISTRADA',
      target_ecs_id: 'ecs-item-01',
      requested_by: 'a0000001-0000-0000-0000-000000000001',
    });

    // RFC-2026-0003: AUTORIZADA pero perteneciente a OTRO PROYECTO (PRJ-OTRO)
    githubRepo.addMockRfc({
      id: 'rfc-foreign-03',
      code: 'RFC-2026-0003',
      project_id: 'b0000002-0000-0000-0000-000000000002',
      status: 'AUTORIZADA',
      target_ecs_id: 'ecs-item-02',
      requested_by: 'a0000001-0000-0000-0000-000000000004',
    });

    // RFC-2026-0004: AUTORIZADA pero SIN orden de cambio activa emitida
    githubRepo.addMockRfc({
      id: 'rfc-no-co-04',
      code: 'RFC-2026-0004',
      project_id: testProjectId,
      status: 'AUTORIZADA',
      target_ecs_id: 'ecs-item-01',
      requested_by: 'a0000001-0000-0000-0000-000000000001',
    });
  });

  afterEach(() => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
  });

  // ==========================================================================
  // BLOQUE 1: SEGURIDAD HTTP Y FIRMA CRIPTOGRÁFICA (H04B-R06)
  // ==========================================================================
  describe('H04B-R06: Seguridad HTTP, exigencia de Buffer crudo y fail-closed de secretos', () => {
    it('TDD-H04B-R06-01: debe verificar firma válida comparando Buffer en tiempo constante', () => {
      const payload = { action: 'ping', zen: 'Keep it logical.' };
      const rawBuf = Buffer.from(JSON.stringify(payload), 'utf8');
      const sig = generateSignature(rawBuf);

      expect(webhookService.verifySignature(rawBuf, sig)).toBe(true);
    });

    it('TDD-H04B-R06-02: debe rechazar verificación si no se provee un Buffer (no fallback string/JSON)', () => {
      const payload = { action: 'ping' };
      const sig = generateSignature(payload);

      // Pasar objeto o string no Buffer debe retornar false
      expect(webhookService.verifySignature(payload as any, sig)).toBe(false);
    });

    it('TDD-H04B-R06-03: debe rechazar firmas alteradas o inválidas con 401 Unauthorized', async () => {
      const payload = { action: 'ping' };
      const rawBuf = Buffer.from(JSON.stringify(payload), 'utf8');
      const badSig = 'sha256=0000000000000000000000000000000000000000000000000000000000000000';

      const headers = {
        'x-hub-signature-256': badSig,
        'x-github-delivery': 'deliv-tampered-01',
        'x-github-event': 'ping',
      };

      await expect(webhookService.handleWebhook(headers, rawBuf, payload)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('TDD-H04B-R06-04: debe aplicar comportamiento fail-closed absoluto si GITHUB_WEBHOOK_SECRET no está configurado', () => {
      delete process.env.GITHUB_WEBHOOK_SECRET;
      delete process.env.TEST_GITHUB_WEBHOOK_SECRET;

      expect(() => webhookService.getWebhookSecret()).toThrow(InternalServerErrorException);
    });

    it('TDD-H04B-R06-05: controlador debe rechazar peticiones sin req.rawBody Buffer con 400 Bad Request', async () => {
      const payload = { action: 'ping' };
      const headers = {
        'x-hub-signature-256': generateSignature(payload),
        'x-github-delivery': 'deliv-no-rawbody',
        'x-github-event': 'ping',
      };

      // Simular req sin rawBody Buffer
      const badReq = { body: payload };
      await expect(webhookController.handleWebhook(headers, badReq, payload)).rejects.toThrow(
        BadRequestException
      );
    });

    it('TDD-H04B-R06-06: controlador debe rechazar payloads que superen el límite de 5 MB con PayloadTooLargeException', async () => {
      const hugeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0x61);
      const headers = {
        'x-hub-signature-256': 'sha256=abcdef',
        'x-github-delivery': 'deliv-huge',
        'x-github-event': 'push',
      };

      const reqWithHugeBody = { rawBody: hugeBuffer };
      await expect(webhookController.handleWebhook(headers, reqWithHugeBody, {})).rejects.toThrow(
        PayloadTooLargeException
      );
    });

    it('TDD-H04B-R06-07: debe rechazar cabecera X-GitHub-Delivery con caracteres o formato malicioso', async () => {
      const payload = { action: 'ping' };
      const rawBuf = Buffer.from(JSON.stringify(payload), 'utf8');
      const sig = generateSignature(rawBuf);

      const headers = {
        'x-hub-signature-256': sig,
        'x-github-delivery': '<script>alert(1)</script>',
        'x-github-event': 'ping',
      };

      await expect(webhookService.handleWebhook(headers, rawBuf, payload)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  // ==========================================================================
  // BLOQUE 2: GOBERNANZA SCM Y ELIMINACIÓN DE AUTORIZACIÓN POR TEXTO (H04B-R01)
  // ==========================================================================
  describe('H04B-R01: Eliminación de autorizaciones basadas en texto y verificación formal SCM', () => {
    it('TDD-H04B-R01-01: commit que cita RFC inexistente (ej. RFC-9999) debe ser clasificado OUT_OF_BAND y no mutar inventario', async () => {
      const ecs = await githubRepo.createConfigItem({
        project_id: testProjectId,
        code: 'ECS-001',
        name: 'Controlador de Autenticación',
        file_path: 'src/modules/auth/auth.controller.ts',
      });

      const commitSha = 'sha-fake-rfc-9999';
      githubClient.addMockCommit({
        sha: commitSha,
        message: 'fix(RFC-9999): intento con RFC inventada en commit',
        author: { name: 'Atacante', email: 'attacker@externo.com', date: new Date().toISOString() },
        files: [
          {
            filename: 'src/modules/auth/security.controller.ts',
            status: 'renamed',
            previous_filename: 'src/modules/auth/auth.controller.ts',
            additions: 0,
            deletions: 0,
            changes: 0,
          },
        ],
      });

      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-fake-rfc',
        eventType: 'push',
        installationId: testInstallationId,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: commitSha, message: 'fix(RFC-9999): intento con RFC inventada en commit' }],
        },
      });

      const processed = await eventProcessor.processEvent(event);
      expect(processed.processing_status).toBe('PROCESSED');
      expect(processed.correlation_status).toBe('OUT_OF_BAND');

      // Evidencia guardada como REJECTED
      const history = await githubRepo.findPathHistoryByConfigItemId(ecs.id);
      expect(history.length).toBe(1);
      expect(history[0].applied_to_ecs).toBe(false);
      expect(history[0].status).toBe('REJECTED');

      // Inventario oficial NO mutado
      const unchangedEcs = await githubRepo.findConfigItemByPath(testProjectId, 'src/modules/auth/auth.controller.ts');
      expect(unchangedEcs).not.toBeNull();
    });

    it('TDD-H04B-R01-02: commit con RFC existente pero NO aprobada (REGISTRADA) debe ser clasificado RECHAZADO', async () => {
      const commitSha = 'sha-unapproved-rfc-02';
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-unapproved-rfc',
        eventType: 'push',
        installationId: testInstallationId,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: commitSha, message: 'feat(RFC-2026-0002): commit citando RFC en borrador' }],
        },
      });

      const processed = await eventProcessor.processEvent(event);
      expect(processed.correlation_status).toBe('RECHAZADO');
    });

    it('TDD-H04B-R01-03: commit con RFC aprobada pero de OTRO PROYECTO debe ser RECHAZADO por violación interproyecto', async () => {
      const commitSha = 'sha-foreign-rfc-03';
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-foreign-rfc',
        eventType: 'push',
        installationId: testInstallationId,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: commitSha, message: 'feat(RFC-2026-0003): commit citando RFC de otro proyecto' }],
        },
      });

      const processed = await eventProcessor.processEvent(event);
      expect(processed.correlation_status).toBe('RECHAZADO');
    });

    it('TDD-H04B-R01-04: commit con RFC aprobada pero SIN Orden de Cambio activa debe quedar PENDIENTE_DE_CORRELACION', async () => {
      const commitSha = 'sha-no-co-rfc-04';
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-no-co-rfc',
        eventType: 'push',
        installationId: testInstallationId,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: commitSha, message: 'feat(RFC-2026-0004): commit sin orden de cambio emitida' }],
        },
      });

      const processed = await eventProcessor.processEvent(event);
      expect(processed.correlation_status).toBe('PENDIENTE_DE_CORRELACION');

      const auditTrail = auditService.getAuditChain();
      const pendingAudit = auditTrail.find((a) => a.eventCode === 'GITHUB_CORRELATION_PENDING');
      expect(pendingAudit).toBeDefined();
    });

    it('TDD-H04B-R01-05: commit que cumple RFC aprobada y Orden de Cambio activa debe ser clasificado AUTORIZADO y mutar inventario', async () => {
      const ecs = await githubRepo.createConfigItem({
        id: 'c0000001-0000-0000-0000-000000000001',
        project_id: testProjectId,
        code: 'ECS-001',
        name: 'Módulo de Pagos',
        file_path: 'src/services/billing.ts',
      });

      const commitSha = 'sha-authorized-rfc-01';
      githubClient.addMockCommit({
        sha: commitSha,
        message: 'fix(RFC-2026-0001): implementación formalmente aprobada',
        author: { name: 'Joan Medina', email: 'jmedina@exodo.pe', date: new Date().toISOString() },
        files: [
          {
            filename: 'src/modules/billing/billing.service.ts',
            status: 'renamed',
            previous_filename: 'src/services/billing.ts',
            additions: 10,
            deletions: 0,
            changes: 10,
          },
        ],
      });

      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-authorized-commit',
        eventType: 'push',
        installationId: testInstallationId,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: commitSha, message: 'fix(RFC-2026-0001): implementación formalmente aprobada' }],
        },
      });

      const processed = await eventProcessor.processEvent(event);
      expect(processed.correlation_status).toBe('AUTORIZADO');

      // Evidencia guardada como APPLIED
      const history = await githubRepo.findPathHistoryByConfigItemId(ecs.id);
      expect(history.length).toBe(1);
      expect(history[0].applied_to_ecs).toBe(true);
      expect(history[0].status).toBe('APPLIED');

      // Inventario oficial mutado legítimamente
      const updatedEcs = await githubRepo.findConfigItemByPath(testProjectId, 'src/modules/billing/billing.service.ts');
      expect(updatedEcs).not.toBeNull();
      expect(updatedEcs?.id).toBe(ecs.id);
    });
  });

  // ==========================================================================
  // BLOQUE 3: PRESERVACIÓN DEL INVENTARIO ECS E IDEMPOTENCIA (H04B-R02 / H04B-R05)
  // ==========================================================================
  describe('H04B-R02 & H04B-R05: Preservación de inventario e idempotencia ante reintentos', () => {
    it('TDD-H04B-R02-01: reintentar el procesamiento del mismo commit NO debe duplicar transiciones en path history', async () => {
      const ecs = await githubRepo.createConfigItem({
        id: 'c0000001-0000-0000-0000-000000000001',
        project_id: testProjectId,
        code: 'ECS-001',
        name: 'Controlador Auth',
        file_path: 'src/auth.ts',
      });

      const commitSha = 'sha-idempotency-commit-01';
      githubClient.addMockCommit({
        sha: commitSha,
        message: 'fix(RFC-2026-0001): cambio autorizado',
        author: { name: 'Joan Medina', email: 'jmedina@exodo.pe', date: new Date().toISOString() },
        files: [
          {
            filename: 'src/modules/auth.ts',
            status: 'renamed',
            previous_filename: 'src/auth.ts',
            additions: 0,
            deletions: 0,
            changes: 0,
          },
        ],
      });

      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-idempotent-repeat',
        eventType: 'push',
        installationId: testInstallationId,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: commitSha, message: 'fix(RFC-2026-0001): cambio autorizado' }],
        },
      });

      // Procesar dos veces consecutivas
      await eventProcessor.processEvent(event);
      await eventProcessor.processEvent(event);

      const history = await githubRepo.findPathHistoryByConfigItemId(ecs.id);
      expect(history.length).toBe(1); // Idempotencia estricta por commit y ECS
    });

    it('TDD-H04B-R02-02: entrega duplicada con el mismo deliveryId durante procesamiento retorna 202 duplicate', async () => {
      const payload = { action: 'ping', installation: { id: testInstallationId } };
      const rawBuf = Buffer.from(JSON.stringify(payload), 'utf8');
      const sig = generateSignature(rawBuf);
      const headers = {
        'x-hub-signature-256': sig,
        'x-github-delivery': 'deliv-dup-in-flight',
        'x-github-event': 'ping',
      };

      const res1 = await webhookService.handleWebhook(headers, rawBuf, payload);
      expect(res1.duplicate).toBe(false);

      const res2 = await webhookService.handleWebhook(headers, rawBuf, payload);
      expect(res2.duplicate).toBe(true);
      expect(res2.eventId).toBe(res1.eventId);
    });
  });

  // ==========================================================================
  // BLOQUE 4: AUTORIZACIÓN POR INSTALACIÓN Y RECHAZO DE CRUCES (H04B-R03)
  // ==========================================================================
  describe('H04B-R03: Autorización del evento por instalación y segregación de accesos', () => {
    it('TDD-H04B-R03-01: debe rechazar evento si proviene de una instalación no vinculada al proyecto', async () => {
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-mismatch-inst',
        eventType: 'push',
        installationId: 99999999, // Instalación ajena
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: 'sha-mismatch', message: 'commit no autorizado' }],
        },
      });

      const processed = await eventProcessor.processEvent(event);
      expect(processed.processing_status).toBe('FAILED');
      expect(processed.correlation_status).toBe('RECHAZADO');

      const auditTrail = auditService.getAuditChain();
      const mismatchAudit = auditTrail.find((a) => a.eventCode === 'GITHUB_EVENT_INSTALLATION_MISMATCH');
      expect(mismatchAudit).toBeDefined();
    });

    it('TDD-H04B-R03-02: debe rechazar evento si la integración del proyecto está en PERMISSION_DENIED', async () => {
      // Degradar integración
      await githubRepo.saveIntegration({
        projectId: testProjectId,
        integrationMode: 'LINK_EXISTING',
        repoOwner: 'JMedina255',
        repoName: 'TraceFlow',
        repoFullName: 'JMedina255/TraceFlow',
        githubRepoId: testRepoId,
        defaultBranch: 'main',
        installationId: testInstallationId,
        visibility: 'private',
        permissions: { push: false, pull: true, admin: false },
        validationStatus: 'PERMISSION_DENIED',
      });

      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-permission-denied-repo',
        eventType: 'push',
        installationId: testInstallationId,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: 'sha-denied', message: 'push en repo sin permiso' }],
        },
      });

      const processed = await eventProcessor.processEvent(event);
      expect(processed.processing_status).toBe('FAILED');
      expect(processed.correlation_status).toBe('RECHAZADO');
    });

    it('TDD-H04B-R03-03: debe rechazar evento si la instalación en la organización propietaria está SUSPENDED', async () => {
      await githubRepo.updateInstallationStatus(testInstallationId, 'SUSPENDED');

      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-inst-suspended',
        eventType: 'push',
        installationId: testInstallationId,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: 'sha-inst-suspended', message: 'push con instalacion suspendida' }],
        },
      });

      const processed = await eventProcessor.processEvent(event);
      expect(processed.processing_status).toBe('FAILED');
      expect(processed.correlation_status).toBe('RECHAZADO');
    });
  });

  // ==========================================================================
  // BLOQUE 5: TRABAJADOR RECUPERABLE, LEASE Y CONCURRENCIA (H04B-R04 / H04B-R05)
  // ==========================================================================
  describe('H04B-R04: Trabajador transaccional recuperable con lease y FOR UPDATE SKIP LOCKED', () => {
    it('TDD-H04B-R04-01: claimEvents debe adquirir eventos PENDING asignando workerId y lease_expires_at', async () => {
      await githubRepo.saveEvent({
        deliveryId: 'deliv-claim-01',
        eventType: 'ping',
        installationId: testInstallationId,
        payload: {},
        status: 'PENDING',
      });

      const claimed = await githubRepo.claimEvents('worker-alpha', 5, 30);
      expect(claimed.length).toBe(1);
      expect(claimed[0].locked_by).toBe('worker-alpha');
      expect(claimed[0].processing_status).toBe('PROCESSING');
      expect(claimed[0].lease_expires_at).toBeDefined();
    });

    it('TDD-H04B-R04-02: dos trabajadores concurrentes no deben solaparse ni reclamar el mismo evento', async () => {
      await githubRepo.saveEvent({
        deliveryId: 'deliv-conc-01',
        eventType: 'ping',
        installationId: testInstallationId,
        payload: {},
        status: 'PENDING',
      });
      await githubRepo.saveEvent({
        deliveryId: 'deliv-conc-02',
        eventType: 'ping',
        installationId: testInstallationId,
        payload: {},
        status: 'PENDING',
      });

      const worker1Claim = await githubRepo.claimEvents('worker-1', 1, 30);
      const worker2Claim = await githubRepo.claimEvents('worker-2', 1, 30);

      expect(worker1Claim.length).toBe(1);
      expect(worker2Claim.length).toBe(1);
      expect(worker1Claim[0].id).not.toBe(worker2Claim[0].id);
      expect(worker1Claim[0].locked_by).toBe('worker-1');
      expect(worker2Claim[0].locked_by).toBe('worker-2');
    });

    it('TDD-H04B-R04-03: evento abandonado en PROCESSING con lease expirado debe ser recuperado por otro trabajador', async () => {
      const expiredEvent = await githubRepo.saveEvent({
        deliveryId: 'deliv-abandoned-01',
        eventType: 'ping',
        installationId: testInstallationId,
        payload: {},
        status: 'PROCESSING',
      });

      // Simular lease expirado hace 10 segundos
      expiredEvent.processing_status = 'PROCESSING';
      expiredEvent.locked_by = 'crashed-worker';
      expiredEvent.lease_expires_at = new Date(Date.now() - 10000).toISOString();

      const reclaimed = await githubRepo.claimEvents('recovery-worker', 5, 30);
      expect(reclaimed.some((e) => e.delivery_id === 'deliv-abandoned-01')).toBe(true);
    });

    it('TDD-H04B-R04-04: triggerWorker procesa lote y sella eventos exitosos como PROCESSED liberando lease', async () => {
      await githubRepo.saveEvent({
        deliveryId: 'deliv-worker-flow',
        eventType: 'ping',
        installationId: testInstallationId,
        payload: {},
        status: 'PENDING',
      });

      const res = await eventProcessor.triggerWorker();
      expect(res.processed).toBe(1);

      const evtAfter = await githubRepo.findEventByDeliveryId('deliv-worker-flow');
      expect(evtAfter?.processing_status).toBe('PROCESSED');
      expect(evtAfter?.locked_by).toBeNull();
    });
  });

  // ==========================================================================
  // BLOQUE 6: REVOCACIONES Y CAMBIOS DE INSTALACIÓN (H04B-R07)
  // ==========================================================================
  describe('H04B-R07: Ciclo de vida de instalación y suspensión sin pérdida de datos SCM', () => {
    it('TDD-H04B-R07-01: evento installation.suspend suspende instalación y degrada integración a PERMISSION_DENIED', async () => {
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-lifecycle-suspend',
        eventType: 'installation',
        action: 'suspend',
        installationId: testInstallationId,
        payload: { action: 'suspend', installation: { id: testInstallationId } },
      });

      await eventProcessor.processEvent(event);

      const inst = await githubRepo.findInstallationByInstallationId(testInstallationId);
      expect(inst?.status).toBe('SUSPENDED');

      const integ = await githubRepo.findByProjectId(testProjectId);
      expect(integ?.validation_status).toBe('PERMISSION_DENIED');

      const auditTrail = auditService.getAuditChain();
      const suspendAudit = auditTrail.find((a) => a.eventCode === 'GITHUB_INSTALLATION_SUSPENDED');
      expect(suspendAudit).toBeDefined();
    });

    it('TDD-H04B-R07-02: evento installation.deleted desvincula integración (UNLINKED) conservando registros históricos', async () => {
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-lifecycle-deleted',
        eventType: 'installation',
        action: 'deleted',
        installationId: testInstallationId,
        payload: { action: 'deleted', installation: { id: testInstallationId } },
      });

      await eventProcessor.processEvent(event);

      const inst = await githubRepo.findInstallationByInstallationId(testInstallationId);
      expect(inst?.status).toBe('DELETED');

      const integ = await githubRepo.findByProjectId(testProjectId);
      expect(integ?.validation_status).toBe('UNLINKED');
    });

    it('TDD-H04B-R07-03: evento installation_repositories.removed degrada a PERMISSION_DENIED repositorio revocado', async () => {
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-repos-removed',
        eventType: 'installation_repositories',
        action: 'removed',
        installationId: testInstallationId,
        payload: {
          action: 'removed',
          repositories_removed: [{ id: testRepoId, full_name: 'JMedina255/TraceFlow' }],
        },
      });

      await eventProcessor.processEvent(event);

      const integ = await githubRepo.findByProjectId(testProjectId);
      expect(integ?.validation_status).toBe('PERMISSION_DENIED');

      const auditTrail = auditService.getAuditChain();
      const repoRevokedAudit = auditTrail.find((a) => a.eventCode === 'GITHUB_REPO_ACCESS_REVOKED');
      expect(repoRevokedAudit).toBeDefined();
    });
  });

  // ==========================================================================
  // BLOQUE 7: CIERRE FINAL DE GOBERNANZA, LEASES Y RECUPERACIÓN CONTINUA (INIT-H04B-C)
  // ==========================================================================
  describe('INIT-H04B-C: Cierre Final de Aceptación de Gobernanza, Leases y Recuperación Continua', () => {
    afterEach(() => {
      eventProcessor.stopPolling();
    });

    it('TDD-H04B-C-01: push asociado a RFC aprobada pero sin sync_lock activo queda en PENDIENTE_DE_CORRELACION', async () => {
      githubRepo.resetMockScmData();
      // Remover todos los bloqueos activos
      githubRepo['mockSyncLocks'] = [];

      const commitSha = 'sha-no-lock-01';
      githubClient.addMockCommit({
        sha: commitSha,
        message: 'fix(RFC-2026-0001): cambio sin sync_lock',
        author: { name: 'Joan Medina', email: 'jmedina@exodo.pe', date: new Date().toISOString() },
        files: [{ filename: 'src/services/billing.ts', status: 'modified', additions: 1, deletions: 1, changes: 2 }],
      });

      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-no-lock-01',
        eventType: 'push',
        installationId: testInstallationId,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: commitSha, message: 'fix(RFC-2026-0001): cambio sin sync_lock' }],
        },
      });

      const processed = await eventProcessor.processEvent(event);
      expect(processed.correlation_status).toBe('PENDIENTE_DE_CORRELACION');

      const auditTrail = auditService.getAuditChain();
      const pendingAudit = auditTrail.find(
        (a) => a.eventCode === 'GITHUB_CORRELATION_PENDING' && a.entityId === commitSha
      );
      expect(pendingAudit).toBeDefined();
      expect(pendingAudit?.payloadDiff?.reason).toMatch(/sync_lock/i);
    });

    it('TDD-H04B-C-02: push con ECN emitida pero asociada a un ECS diferente es rechazado sin mutar inventario', async () => {
      githubRepo.resetMockScmData();
      // ECN-2026-0001 está emitida para c0000001-0000-0000-0000-000000000001 (ECS-001)
      const ecsOther = await githubRepo.createConfigItem({
        id: 'c0000001-0000-0000-0000-000000000009',
        project_id: testProjectId,
        code: 'ECS-OTHER',
        name: 'Módulo Secundario',
        file_path: 'src/modules/other.ts',
      });

      const commitSha = 'sha-diff-ecs-02';
      githubClient.addMockCommit({
        sha: commitSha,
        message: 'fix(RFC-2026-0001): intentando mover ECS ajeno a la ECN',
        author: { name: 'Joan Medina', email: 'jmedina@exodo.pe', date: new Date().toISOString() },
        files: [
          {
            filename: 'src/modules/new-other.ts',
            status: 'renamed',
            previous_filename: 'src/modules/other.ts',
            additions: 1,
            deletions: 1,
            changes: 2,
          },
        ],
      });

      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-diff-ecs-02',
        eventType: 'push',
        installationId: testInstallationId,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: commitSha, message: 'fix(RFC-2026-0001): intentando mover ECS ajeno a la ECN' }],
        },
      });

      const processed = await eventProcessor.processEvent(event);
      expect(processed.correlation_status).toBe('RECHAZADO');

      // Comprobar que el archivo original no fue mutado
      const untouchedEcs = await githubRepo.findConfigItemByPath(testProjectId, 'src/modules/other.ts');
      expect(untouchedEcs).not.toBeNull();
      expect(untouchedEcs?.id).toBe(ecsOther.id);
    });

    it('TDD-H04B-C-03: push de commit cuyo autor no corresponde a ningún desarrollador activo es rechazado', async () => {
      githubRepo.resetMockScmData();

      const commitSha = 'sha-unauthorized-author-03';
      githubClient.addMockCommit({
        sha: commitSha,
        message: 'fix(RFC-2026-0001): push desde atacante o usuario no registrado',
        author: { name: 'Atacante Externo', email: 'attacker@externo.org', date: new Date().toISOString() },
        files: [{ filename: 'src/services/billing.ts', status: 'modified', additions: 1, deletions: 1, changes: 2 }],
      });

      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-unauthorized-author-03',
        eventType: 'push',
        installationId: testInstallationId,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: commitSha, message: 'fix(RFC-2026-0001): push desde atacante o usuario no registrado' }],
        },
      });

      const processed = await eventProcessor.processEvent(event);
      expect(processed.correlation_status).toBe('RECHAZADO');

      const auditTrail = auditService.getAuditChain();
      const outOfBandAudit = auditTrail.find(
        (a) => a.eventCode === 'GITHUB_OUT_OF_BAND_DETECTED' && a.entityId === commitSha
      );
      expect(outOfBandAudit).toBeDefined();
      expect(outOfBandAudit?.payloadDiff?.reason).toMatch(/autor del commit/i);
    });

    it('TDD-H04B-C-04: push con archivos modificados fuera del alcance de la ECN no muta rutas ajenas', async () => {
      githubRepo.resetMockScmData();

      // ECS autorizado por ECN
      const authorizedEcs = await githubRepo.createConfigItem({
        id: 'c0000001-0000-0000-0000-000000000001',
        project_id: testProjectId,
        code: 'ECS-001',
        name: 'Módulo Facturación',
        file_path: 'src/services/billing.ts',
      });

      // ECS ajeno fuera del alcance de la ECN
      const outOfScopeEcs = await githubRepo.createConfigItem({
        id: 'c0000001-0000-0000-0000-000000000077',
        project_id: testProjectId,
        code: 'ECS-077',
        name: 'Módulo Seguridad',
        file_path: 'src/security/crypto.ts',
      });

      const commitSha = 'sha-partial-scope-04';
      githubClient.addMockCommit({
        sha: commitSha,
        message: 'fix(RFC-2026-0001): cambio con archivo en scope y archivo fuera de scope',
        author: { name: 'Joan Medina', email: 'jmedina@exodo.pe', date: new Date().toISOString() },
        files: [
          {
            filename: 'src/modules/billing/billing.service.ts',
            status: 'renamed',
            previous_filename: 'src/services/billing.ts',
            additions: 10,
            deletions: 0,
            changes: 10,
          },
          {
            filename: 'src/security/hacked.ts',
            status: 'renamed',
            previous_filename: 'src/security/crypto.ts',
            additions: 5,
            deletions: 0,
            changes: 5,
          },
        ],
      });

      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-partial-scope-04',
        eventType: 'push',
        installationId: testInstallationId,
        githubRepoId: testRepoId,
        projectId: testProjectId,
        payload: {
          repository: { id: testRepoId, owner: { login: 'JMedina255' }, name: 'TraceFlow' },
          commits: [{ id: commitSha, message: 'fix(RFC-2026-0001): cambio con archivo en scope y archivo fuera de scope' }],
        },
      });

      await eventProcessor.processEvent(event);

      // ECS autorizado SÍ se muta
      const updatedAuthEcs = await githubRepo.findConfigItemByPath(testProjectId, 'src/modules/billing/billing.service.ts');
      expect(updatedAuthEcs).not.toBeNull();
      expect(updatedAuthEcs?.id).toBe(authorizedEcs.id);

      // ECS fuera del alcance NO se muta
      const untouchedSecEcs = await githubRepo.findConfigItemByPath(testProjectId, 'src/security/crypto.ts');
      expect(untouchedSecEcs).not.toBeNull();
      expect(untouchedSecEcs?.id).toBe(outOfScopeEcs.id);

      // Historial para ECS fuera de scope queda REJECTED y applied_to_ecs = false
      const secHistory = await githubRepo.findPathHistoryByConfigItemId(outOfScopeEcs.id);
      expect(secHistory.length).toBe(1);
      expect(secHistory[0].applied_to_ecs).toBe(false);
      expect(secHistory[0].status).toBe('REJECTED');
    });

    it('TDD-H04B-C-05: recuperación periódica continua procesa eventos pendientes sin webhooks entrantes', async () => {
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-continuous-recovery-05',
        eventType: 'ping',
        installationId: testInstallationId,
        payload: { zen: 'Non-blocking continuous processing' },
      });

      expect(event.processing_status).toBe('PENDING');

      // Ejecutar triggerWorker directamente simulando el timer continuo
      const result = await eventProcessor.triggerWorker();
      expect(result.processed).toBeGreaterThanOrEqual(1);

      const recoveredEvent = await githubRepo.findEventById(event.id);
      expect(recoveredEvent?.processing_status).toBe('PROCESSED');
      expect(recoveredEvent?.locked_by).toBeNull();
    });

    it('TDD-H04B-C-06: intento de finalizar evento por trabajador con lease perdido/expirado es rechazado (split-brain prevention)', async () => {
      // 1. Crear evento
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-lease-split-brain-06',
        eventType: 'ping',
        installationId: testInstallationId,
        payload: { zen: 'Concurrency Lease Shield' },
      });

      // 2. Worker 1 reclama el evento
      const worker1 = 'worker-alpha';
      const claimedByW1 = await githubRepo.claimEvents(worker1, 1, 1);
      expect(claimedByW1.length).toBe(1);
      const token1 = claimedByW1[0].claim_token;
      expect(token1).toBeDefined();

      // 3. Simular expiración del lease en el mock
      const mockEvent = githubRepo['mockEvents'].find((e) => e.id === event.id);
      expect(mockEvent).toBeDefined();
      mockEvent!.lease_expires_at = new Date(Date.now() - 1000).toISOString();

      // 4. Worker 2 reclama el evento abandonado
      const worker2 = 'worker-beta';
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
      // Debe retornar null (rechazo seguro para evitar split-brain)
      expect(failedRelease).toBeNull();

      // El evento sigue en poder de Worker 2
      const currentEvent = await githubRepo.findEventById(event.id);
      expect(currentEvent?.locked_by).toBe(worker2);
      expect(currentEvent?.processing_status).toBe('PROCESSING');

      // 6. Worker 2 finaliza legítimamente el evento
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

    it('TDD-H04B-C-07: evento installation.deleted actualiza estado a DELETED e invalida integraciones preservando auditoría histórica', async () => {
      const event = await githubRepo.saveEvent({
        deliveryId: 'deliv-h04b-c-deleted-07',
        eventType: 'installation',
        action: 'deleted',
        installationId: testInstallationId,
        payload: { action: 'deleted', installation: { id: testInstallationId } },
      });

      await eventProcessor.processEvent(event);

      // 1. Estado en DELETED (sin borrado físico)
      const inst = await githubRepo.findInstallationByInstallationId(testInstallationId);
      expect(inst).not.toBeNull();
      expect(inst?.status).toBe('DELETED');

      // 2. Integración vinculada degradada a UNLINKED
      const integ = await githubRepo.findByProjectId(testProjectId);
      expect(integ?.validation_status).toBe('UNLINKED');

      // 3. Registro de auditoría emitido
      const auditTrail = auditService.getAuditChain();
      const deletedAudit = auditTrail.find((a) => a.eventCode === 'GITHUB_INSTALLATION_DELETED');
      expect(deletedAudit).toBeDefined();
    });

    it('TDD-H04B-C-09: verificación de secreto HMAC en NODE_ENV=production sin secreto configurado falla de inmediato sin fallback a test', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalSecret = process.env.GITHUB_WEBHOOK_SECRET;
      const originalTestSecret = process.env.TEST_GITHUB_WEBHOOK_SECRET;

      try {
        process.env.NODE_ENV = 'production';
        delete process.env.GITHUB_WEBHOOK_SECRET;
        process.env.TEST_GITHUB_WEBHOOK_SECRET = 'insecure_test_secret_that_must_be_blocked';

        expect(() => {
          webhookService['getWebhookSecret']();
        }).toThrow(InternalServerErrorException);

        expect(() => {
          webhookService['getWebhookSecret']();
        }).toThrow(/TEST_GITHUB_WEBHOOK_SECRET|producción/i);
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        if (originalSecret) process.env.GITHUB_WEBHOOK_SECRET = originalSecret;
        if (originalTestSecret) process.env.TEST_GITHUB_WEBHOOK_SECRET = originalTestSecret;
      }
    });
  });
});

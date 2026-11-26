import * as crypto from 'node:crypto';
import {
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  forwardRef,
} from '@nestjs/common';
import { GitHubRepository } from '../github.repository.js';
import { AuditService } from '../../audit/audit.service.js';
import type { GitHubEventEntity } from '../github.entity.js';
import { GitHubEventProcessorService } from './github-event-processor.service.js';

export interface WebhookHandlingResult {
  received: boolean;
  duplicate: boolean;
  deliveryId: string;
  eventId: string;
  status: string;
}

@Injectable()
export class GitHubWebhookService {
  private readonly logger = new Logger(GitHubWebhookService.name);

  constructor(
    @Inject(GitHubRepository) private readonly githubRepo: GitHubRepository,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(forwardRef(() => GitHubEventProcessorService))
    private readonly eventProcessor: GitHubEventProcessorService
  ) {}

  /**
   * Obtiene el secreto de webhook configurado respetando fail-closed.
   * H04B-R06 / H04B-C: Prohibido usar secretos HMAC predeterminados en servicios operativos.
   * TEST_GITHUB_WEBHOOK_SECRET restringido estrictamente a NODE_ENV === 'test'.
   */
  getWebhookSecret(): string {
    const isProduction = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    const testSecret = process.env.TEST_GITHUB_WEBHOOK_SECRET;

    if (isProduction) {
      if (!secret || secret.trim() === '') {
        throw new InternalServerErrorException(
          '[CONFIG_ERROR] Configuración de seguridad incompleta: GITHUB_WEBHOOK_SECRET obligatorio en entorno de producción.'
        );
      }
      if (testSecret && secret.trim() === testSecret.trim()) {
        throw new InternalServerErrorException(
          '[CONFIG_ERROR] Prohibición de seguridad: En producción no se permite utilizar el secreto de pruebas TEST_GITHUB_WEBHOOK_SECRET.'
        );
      }
      return secret;
    }

    if (!secret || secret.trim() === '') {
      if (isTest && testSecret && testSecret.trim() !== '') {
        return testSecret;
      }
      throw new InternalServerErrorException(
        '[CONFIG_ERROR] Configuración de seguridad incompleta: GITHUB_WEBHOOK_SECRET ausente.'
      );
    }

    return secret;
  }

  /**
   * Valida la firma HMAC-SHA256 del payload crudo contra X-Hub-Signature-256
   * utilizando comparación de tiempo constante (crypto.timingSafeEqual).
   * H04B-R06: Exige Buffer de cuerpo HTTP original sin reconstrucción por JSON.stringify().
   */
  verifySignature(rawBody: Buffer | string, signatureHeader?: string): boolean {
    if (!signatureHeader || typeof signatureHeader !== 'string') {
      return false;
    }

    if (!signatureHeader.startsWith('sha256=')) {
      return false;
    }

    // Exigir explícitamente Buffer para garantizar exactitud de bytes
    if (!Buffer.isBuffer(rawBody)) {
      return false;
    }

    const receivedHex = signatureHeader.substring(7);
    if (!/^[a-fA-F0-9]{64}$/.test(receivedHex)) {
      return false;
    }

    let secret: string;
    try {
      secret = this.getWebhookSecret();
    } catch {
      return false;
    }

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const computedHex = hmac.digest('hex');

    const computedBuf = Buffer.from(computedHex, 'utf8');
    const receivedBuf = Buffer.from(receivedHex, 'utf8');

    if (computedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuf, receivedBuf);
  }

  /**
   * Recepción idempotente y almacenamiento en buffer de eventos webhook de GitHub.
   */
  async handleWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawBody: Buffer | string,
    parsedPayload: any,
    targetProjectId?: string
  ): Promise<WebhookHandlingResult> {
    // Normalizar cabeceras de GitHub (case-insensitive)
    const normalizedHeaders: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(headers)) {
      normalizedHeaders[key.toLowerCase()] = Array.isArray(value) ? value[0] : value;
    }

    const deliveryId = normalizedHeaders['x-github-delivery'];
    const eventType = normalizedHeaders['x-github-event'];
    const signatureHeader = normalizedHeaders['x-hub-signature-256'];

    if (!deliveryId || deliveryId.trim() === '') {
      throw new BadRequestException('Cabecera obligatoria X-GitHub-Delivery ausente o vacía.');
    }

    // H04B-R06: Validar formato del identificador de entrega
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(deliveryId.trim())) {
      throw new BadRequestException('Formato de cabecera X-GitHub-Delivery inválido.');
    }

    if (!eventType || eventType.trim() === '') {
      throw new BadRequestException('Cabecera obligatoria X-GitHub-Event ausente o vacía.');
    }

    // 1. Verificación de firma criptográfica
    const isValidSignature = this.verifySignature(rawBody, signatureHeader);
    if (!isValidSignature) {
      this.logger.warn(`Firma HMAC rechazada para deliveryId: ${deliveryId}, evento: ${eventType}`);
      throw new UnauthorizedException(
        'Firma HMAC-SHA256 inválida o ausente en cabecera X-Hub-Signature-256.'
      );
    }

    // 2. Control de idempotencia estricta por delivery_id
    const existingEvent = await this.githubRepo.findEventByDeliveryId(deliveryId);
    if (existingEvent) {
      this.logger.log(`Evento duplicado recibido (deliveryId: ${deliveryId}), respondiendo idempotente.`);
      return {
        received: true,
        duplicate: true,
        deliveryId,
        eventId: existingEvent.id,
        status: existingEvent.processing_status,
      };
    }

    // 3. Extracción de metadatos del evento
    const action = parsedPayload?.action || null;
    const installationId = parsedPayload?.installation?.id
      ? Number(parsedPayload.installation.id)
      : 0;
    const githubRepoId = parsedPayload?.repository?.id
      ? Number(parsedPayload.repository.id)
      : null;

    // 4. Mapeo a proyecto de TraceFlow si existe integración activa o contexto de ruta
    let projectId: string | null = targetProjectId || null;
    if (githubRepoId) {
      const integration = await this.githubRepo.findActiveByRepoId(githubRepoId);
      if (integration) {
        projectId = integration.project_id;
      }
    }

    // 5. Persistencia del evento en buffer con estado PENDING
    const savedEvent = await this.githubRepo.saveEvent({
      deliveryId,
      eventType,
      action,
      installationId,
      githubRepoId,
      projectId,
      payload: parsedPayload,
      status: 'PENDING',
    });

    // 6. Registro de auditoría criptográfica
    try {
      await this.auditService.logEvent({
        eventCode: 'GITHUB_WEBHOOK_RECEIVED',
        actorRole: 'GITHUB_WEBHOOK',
        actorUserId: null,
        operation: 'RECEIVE_WEBHOOK',
        entityName: 'github_event',
        entityId: savedEvent.id,
        projectId: projectId || undefined,
        resultStatus: 'SUCCESS',
        payloadDiff: {
          deliveryId,
          eventType,
          action,
          githubRepoId,
          projectId,
          installationId,
        },
      });
    } catch (auditErr) {
      this.logger.warn(`Error no fatal registrando auditoría de webhook: ${auditErr}`);
    }

    // 7. H04B-R04: Disparar el trabajador recuperable para procesar eventos pendientes
    // sin bloquear la respuesta HTTP 202
    this.eventProcessor
      .triggerWorker()
      .catch((err) => {
        this.logger.error(`Error no fatal disparando trabajador de eventos: ${err.message}`);
      });

    return {
      received: true,
      duplicate: false,
      deliveryId,
      eventId: savedEvent.id,
      status: 'PENDING',
    };
  }
}

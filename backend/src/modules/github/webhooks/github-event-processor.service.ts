import * as crypto from 'node:crypto';
import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { GitHubRepository } from '../github.repository.js';
import { AuditService } from '../../audit/audit.service.js';
import { IGitHubApiClient } from '../github-api.client.js';
import type {
  GitHubEventEntity,
  GitHubCommitFile,
  GitHubEventCorrelationStatus,
} from '../github.entity.js';

@Injectable()
export class GitHubEventProcessorService implements OnModuleInit {
  private readonly logger = new Logger(GitHubEventProcessorService.name);
  readonly workerId: string = `worker-${process.pid}-${crypto.randomUUID().substring(0, 8)}`;
  private isWorking = false;

  constructor(
    @Inject(GitHubRepository) private readonly githubRepo: GitHubRepository,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject('IGitHubApiClient') private readonly githubClient: IGitHubApiClient
  ) {}

  async onModuleInit() {
    // Al iniciar NestJS, recuperar eventos pendientes o abandonados de forma no bloqueante
    this.triggerWorker().catch((err) => {
      this.logger.warn(`Recuperación inicial de eventos: ${err.message}`);
    });
  }

  /**
   * H04B-R04: Dispara el trabajador recuperable para reclamar y procesar eventos pendientes.
   */
  async triggerWorker(): Promise<{ processed: number; failed: number }> {
    return this.claimAndProcessBatch();
  }

  /**
   * H04B-R04 / H04B-R05: Reclama transaccionalmente un lote de eventos con FOR UPDATE SKIP LOCKED
   * y los procesa de forma mutuamente excluyente con control de lease.
   */
  async claimAndProcessBatch(limit: number = 10): Promise<{ processed: number; failed: number }> {
    if (this.isWorking) {
      return { processed: 0, failed: 0 };
    }
    this.isWorking = true;

    let processed = 0;
    let failed = 0;

    try {
      const claimedEvents = await this.githubRepo.claimEvents(this.workerId, limit, 30);
      if (claimedEvents.length > 0) {
        this.logger.log(
          `Trabajador ${this.workerId} reclamó ${claimedEvents.length} eventos pendientes/abandonados.`
        );
      }

      for (const event of claimedEvents) {
        try {
          const res = await this.processClaimedEvent(event);
          if (res.processing_status === 'PROCESSED') {
            processed++;
          } else {
            failed++;
          }
        } catch (err: any) {
          failed++;
          this.logger.error(`Error procesando evento reclamado ${event.id}: ${err.message}`);
          await this.githubRepo.incrementEventAttempts(event.id, err.message);
        }
      }
    } finally {
      this.isWorking = false;
    }

    return { processed, failed };
  }

  /**
   * Procesa un evento individual reclamado atómicamente por el trabajador.
   */
  async processClaimedEvent(event: GitHubEventEntity): Promise<GitHubEventEntity> {
    this.logger.log(
      `Iniciando procesamiento de evento ${event.id} (tipo: ${event.event_type}, delivery: ${event.delivery_id})`
    );

    let correlationStatus: GitHubEventCorrelationStatus = 'NONE';

    try {
      // H04B-R03: Autorización del evento por instalación y repositorio (excepto installation global)
      if (event.event_type !== 'installation') {
        const authCheck = await this.validateEventInstallationAuthorization(event);
        if (!authCheck.authorized) {
          this.logger.warn(`[SEGURIDAD GITHUB] Evento ${event.id} rechazado: ${authCheck.reason}`);
          const updated = await this.githubRepo.releaseEvent(
            event.id,
            'FAILED',
            authCheck.reason,
            'RECHAZADO'
          );
          return updated || event;
        }
      }

      switch (event.event_type) {
        case 'push':
          correlationStatus = await this.handlePushEvent(event);
          break;
        case 'pull_request':
          await this.handlePullRequestEvent(event);
          correlationStatus = 'AUTORIZADO';
          break;
        case 'installation':
          await this.handleInstallationEvent(event);
          correlationStatus = 'AUTORIZADO';
          break;
        case 'installation_repositories':
          await this.handleInstallationRepositoriesEvent(event);
          correlationStatus = 'AUTORIZADO';
          break;
        case 'ping':
          this.logger.log(`Ping recibido para instalación ${event.installation_id}. Marcando como procesado.`);
          correlationStatus = 'AUTORIZADO';
          break;
        default:
          this.logger.log(`Evento '${event.event_type}' recibido y registrado sin acción adicional.`);
          correlationStatus = 'NONE';
          break;
      }

      // Transición exitosa a PROCESSED y liberación del lease
      const updated = await this.githubRepo.releaseEvent(
        event.id,
        'PROCESSED',
        null,
        correlationStatus
      );
      return updated || event;
    } catch (err: any) {
      this.logger.error(`Fallo procesando evento ${event.id}: ${err.message}`, err.stack);
      const updated = await this.githubRepo.incrementEventAttempts(event.id, err.message);
      return updated || event;
    }
  }

  /**
   * Compatibilidad hacia atrás: procesa un evento individual directamente asegurando claim.
   */
  async processEvent(event: GitHubEventEntity): Promise<GitHubEventEntity> {
    if (event.processing_status !== 'PROCESSING') {
      await this.githubRepo.updateEventStatus(event.id, 'PROCESSING');
    }
    return this.processClaimedEvent(event);
  }

  /**
   * Procesa en lote los eventos PENDING acumulados.
   */
  async processPendingEvents(limit: number = 10): Promise<{ processed: number; failed: number }> {
    return this.claimAndProcessBatch(limit);
  }

  /**
   * H04B-R03: Autorización estricta del evento por instalación y repositorio.
   */
  private async validateEventInstallationAuthorization(
    event: GitHubEventEntity
  ): Promise<{ authorized: boolean; reason?: string }> {
    if (!event.github_repo_id) {
      return { authorized: true };
    }

    // 1. Resolver integración por github_repo_id
    const integration = await this.githubRepo.findActiveByRepoId(event.github_repo_id);
    if (!integration) {
      return {
        authorized: false,
        reason: `Repositorio ${event.github_repo_id} no está vinculado a ningún proyecto TraceFlow activo.`,
      };
    }

    // 2. Exigir estado VALIDATED
    if (integration.validation_status !== 'VALIDATED') {
      await this.auditService.logEvent({
        eventCode: 'GITHUB_EVENT_UNAUTHORIZED_INTEGRATION',
        actorRole: 'GITHUB_WEBHOOK',
        actorUserId: null,
        operation: 'VALIDATE_EVENT_INTEGRATION',
        entityName: 'github_integration',
        entityId: integration.id,
        projectId: integration.project_id,
        resultStatus: 'REJECTED',
        payloadDiff: {
          eventId: event.id,
          deliveryId: event.delivery_id,
          validationStatus: integration.validation_status,
          reason: 'Integración no se encuentra en estado VALIDATED.',
        },
      });
      return {
        authorized: false,
        reason: `La integración del repositorio ${integration.repo_full_name} se encuentra en estado '${integration.validation_status}' (se exige VALIDATED).`,
      };
    }

    // 3. Comparar installation_id del evento con el de la integración
    if (event.installation_id && event.installation_id !== integration.installation_id) {
      await this.auditService.logEvent({
        eventCode: 'GITHUB_EVENT_INSTALLATION_MISMATCH',
        actorRole: 'GITHUB_WEBHOOK',
        actorUserId: null,
        operation: 'VALIDATE_INSTALLATION_MATCH',
        entityName: 'github_integration',
        entityId: integration.id,
        projectId: integration.project_id,
        resultStatus: 'REJECTED',
        payloadDiff: {
          eventId: event.id,
          deliveryId: event.delivery_id,
          eventInstallationId: event.installation_id,
          integrationInstallationId: integration.installation_id,
        },
      });
      return {
        authorized: false,
        reason: `Discrepancia de instalación: El evento proviene de instalación ${event.installation_id}, pero el proyecto está vinculado a ${integration.installation_id}.`,
      };
    }

    // 4. Comprobar que la instalación esté activa en la organización propietaria
    const orgInstallation = await this.githubRepo.findInstallationByInstallationId(integration.installation_id);
    if (!orgInstallation || orgInstallation.status !== 'ACTIVE') {
      await this.auditService.logEvent({
        eventCode: 'GITHUB_EVENT_INSTALLATION_SUSPENDED',
        actorRole: 'GITHUB_WEBHOOK',
        actorUserId: null,
        operation: 'VALIDATE_ORGANIZATION_INSTALLATION',
        entityName: 'organization_github_installation',
        entityId: orgInstallation?.id || String(integration.installation_id),
        projectId: integration.project_id,
        resultStatus: 'REJECTED',
        payloadDiff: {
          eventId: event.id,
          installationId: integration.installation_id,
          status: orgInstallation?.status || 'NOT_FOUND',
        },
      });
      return {
        authorized: false,
        reason: `La instalación ${integration.installation_id} no se encuentra activa en la organización (estado: ${orgInstallation?.status || 'NO_ENCONTRADA'}).`,
      };
    }

    return { authorized: true };
  }

  /**
   * H04B-R07: Manejo de eventos de ciclo de vida de instalación (suspend, deleted, unsuspend).
   */
  private async handleInstallationEvent(event: GitHubEventEntity): Promise<void> {
    const payload = event.payload;
    const action = payload.action;
    const installationId = event.installation_id;

    this.logger.log(`[LIFECYCLE GITHUB] Procesando evento installation (acción: ${action}, id: ${installationId})`);

    if (action === 'suspend') {
      await this.githubRepo.updateInstallationStatus(installationId, 'SUSPENDED');
      const affectedProjects = await this.githubRepo.updateIntegrationsByInstallationId(
        installationId,
        'PERMISSION_DENIED',
        'Instalación suspendida desde GitHub.'
      );
      for (const prjId of affectedProjects) {
        await this.githubRepo.setProjectGithubCompleted(prjId, false);
      }
      await this.auditService.logEvent({
        eventCode: 'GITHUB_INSTALLATION_SUSPENDED',
        actorRole: 'GITHUB_WEBHOOK',
        actorUserId: null,
        operation: 'SUSPEND_INSTALLATION',
        entityName: 'organization_github_installation',
        entityId: String(installationId),
        resultStatus: 'SUCCESS',
        payloadDiff: { installationId, action, affectedProjects },
      });
    } else if (action === 'deleted') {
      await this.githubRepo.updateInstallationStatus(installationId, 'DELETED');
      const affectedProjects = await this.githubRepo.updateIntegrationsByInstallationId(
        installationId,
        'UNLINKED',
        'Instalación eliminada desde GitHub.'
      );
      for (const prjId of affectedProjects) {
        await this.githubRepo.setProjectGithubCompleted(prjId, false);
      }
      await this.auditService.logEvent({
        eventCode: 'GITHUB_INSTALLATION_DELETED',
        actorRole: 'GITHUB_WEBHOOK',
        actorUserId: null,
        operation: 'DELETE_INSTALLATION',
        entityName: 'organization_github_installation',
        entityId: String(installationId),
        resultStatus: 'SUCCESS',
        payloadDiff: { installationId, action, affectedProjects },
      });
    } else if (action === 'unsuspend') {
      await this.githubRepo.updateInstallationStatus(installationId, 'ACTIVE');
      await this.auditService.logEvent({
        eventCode: 'GITHUB_INSTALLATION_RESTORED',
        actorRole: 'GITHUB_WEBHOOK',
        actorUserId: null,
        operation: 'UNSUSPEND_INSTALLATION',
        entityName: 'organization_github_installation',
        entityId: String(installationId),
        resultStatus: 'SUCCESS',
        payloadDiff: { installationId, action },
      });
    }
  }

  /**
   * H04B-R07: Manejo de cambios de repositorios concedidos/revocados por instalación.
   */
  private async handleInstallationRepositoriesEvent(event: GitHubEventEntity): Promise<void> {
    const payload = event.payload;
    const action = payload.action;
    const installationId = event.installation_id;

    if (action === 'removed') {
      const removedRepos: Array<{ id: number; name: string; full_name: string }> =
        payload.repositories_removed || [];

      for (const repo of removedRepos) {
        const repoId = Number(repo.id);
        const affectedProjectId = await this.githubRepo.updateIntegrationStatusByRepoId(
          repoId,
          'PERMISSION_DENIED',
          'Acceso al repositorio revocado en la configuración de la GitHub App.'
        );
        if (affectedProjectId) {
          await this.githubRepo.setProjectGithubCompleted(affectedProjectId, false);
        }
        await this.auditService.logEvent({
          eventCode: 'GITHUB_REPO_ACCESS_REVOKED',
          actorRole: 'GITHUB_WEBHOOK',
          actorUserId: null,
          operation: 'REVOKE_REPO_ACCESS',
          entityName: 'github_integration',
          entityId: String(repoId),
          projectId: affectedProjectId || undefined,
          resultStatus: 'SUCCESS',
          payloadDiff: { repoId, repoName: repo.full_name, installationId },
        });
      }
    } else if (action === 'added') {
      const addedRepos = payload.repositories_added || [];
      await this.auditService.logEvent({
        eventCode: 'GITHUB_REPO_ACCESS_GRANTED',
        actorRole: 'GITHUB_WEBHOOK',
        actorUserId: null,
        operation: 'GRANT_REPO_ACCESS',
        entityName: 'organization_github_installation',
        entityId: String(installationId),
        resultStatus: 'SUCCESS',
        payloadDiff: { count: addedRepos.length, installationId },
      });
    }
  }

  /**
   * H04B-R01 / H04B-R02: Manejo de eventos push de Git con verificación SCM real.
   */
  private async handlePushEvent(event: GitHubEventEntity): Promise<GitHubEventCorrelationStatus> {
    const payload = event.payload;
    let projectId = event.project_id;

    if (!projectId && event.github_repo_id) {
      const integration = await this.githubRepo.findActiveByRepoId(event.github_repo_id);
      if (integration) {
        projectId = integration.project_id;
      }
    }

    if (!projectId) {
      this.logger.warn(`Push ignorado: Repositorio ${event.github_repo_id} no está vinculado a ningún proyecto TraceFlow.`);
      return 'NONE';
    }

    const repoOwner = payload.repository?.owner?.login || payload.repository?.owner?.name || '';
    const repoName = payload.repository?.name || '';
    const commits = payload.commits || (payload.head_commit ? [payload.head_commit] : []);

    let overallCorrelationStatus: GitHubEventCorrelationStatus = 'NONE';

    for (const commit of commits) {
      const commitSha = commit.id || commit.sha;
      const message = commit.message || '';
      const author = commit.author || { name: 'unknown', email: 'unknown' };

      // Obtener detalle de archivos
      let files: GitHubCommitFile[] = [];
      try {
        if (commitSha) {
          const details = await this.githubClient.getCommit(
            repoOwner,
            repoName,
            commitSha,
            event.installation_id
          );
          files = details.files || [];
        }
      } catch (err: any) {
        this.logger.warn(`No se pudo obtener detalles remotos de commit ${commitSha}: ${err.message}. Usando payload.`);
      }

      if (files.length === 0) {
        const added = (commit.added || []).map((f: string) => ({ filename: f, status: 'added', additions: 0, deletions: 0, changes: 0 }));
        const modified = (commit.modified || []).map((f: string) => ({ filename: f, status: 'modified', additions: 0, deletions: 0, changes: 0 }));
        const removed = (commit.removed || []).map((f: string) => ({ filename: f, status: 'removed', additions: 0, deletions: 0, changes: 0 }));
        files = [...added, ...modified, ...removed];
      } else if (commit.removed && Array.isArray(commit.removed)) {
        for (const rem of commit.removed) {
          if (!files.some((f) => f.filename === rem && f.status === 'removed')) {
            files.push({ filename: rem, status: 'removed', additions: 0, deletions: 0, changes: 0 });
          }
        }
      }

      // H04B-R01: Consulta real a persistencia SCM (RFC, aprobación, change_order, SoD)
      const filePaths = files.map((f) => f.filename);
      const scmVerification = await this.githubRepo.verifyScmChangeAuthorization(
        projectId,
        commitSha,
        message,
        filePaths,
        author.email
      );

      const isAuthorized = scmVerification.authorized;
      const commitCorrelationStatus = scmVerification.status;
      overallCorrelationStatus = commitCorrelationStatus;

      // H04B-R02: Separar evidencia observada de la mutación del inventario canónico
      for (const file of files) {
        if (file.status === 'renamed' && file.previous_filename) {
          const existingEcs = await this.githubRepo.findConfigItemByPath(projectId, file.previous_filename);
          if (existingEcs) {
            const isMove = this.isPathMove(file.previous_filename, file.filename);
            const changeType = isMove ? 'MOVE' : 'RENAME';

            // Siempre registrar la evidencia en config_item_path_history
            await this.githubRepo.recordPathChange({
              configItemId: existingEcs.id,
              projectId,
              oldPath: file.previous_filename,
              newPath: file.filename,
              changeType,
              gitCommitSha: commitSha,
              appliedToEcs: isAuthorized,
              status: isAuthorized ? 'APPLIED' : (commitCorrelationStatus === 'PENDIENTE_DE_CORRELACION' ? 'PENDING' : 'REJECTED'),
            });

            // Actualizar inventario canónico ÚNICAMENTE si está formalmente autorizado
            if (isAuthorized) {
              await this.githubRepo.updateConfigItemPath(existingEcs.id, file.filename);
              this.logger.log(`[SCM AUTORIZADO] ECS ${existingEcs.code} ruta actualizada (${changeType}): '${file.previous_filename}' -> '${file.filename}'`);
            } else {
              this.logger.warn(`[SCM BLOQUEO] Renombrado de ECS ${existingEcs.code} registrado como evidencia (${commitCorrelationStatus}). Inventario oficial preservado sin mutación.`);
            }
          }
        }

        if (file.status === 'removed') {
          const existingEcs = await this.githubRepo.findConfigItemByPath(projectId, file.filename);
          if (existingEcs) {
            await this.githubRepo.recordPathChange({
              configItemId: existingEcs.id,
              projectId,
              oldPath: file.filename,
              newPath: '[DELETED]',
              changeType: 'DELETE',
              gitCommitSha: commitSha,
              appliedToEcs: isAuthorized,
              status: isAuthorized ? 'APPLIED' : (commitCorrelationStatus === 'PENDIENTE_DE_CORRELACION' ? 'PENDING' : 'REJECTED'),
            });

            if (isAuthorized) {
              this.logger.log(`[SCM AUTORIZADO] ECS ${existingEcs.code} baja procesada.`);
            } else {
              this.logger.warn(`[SCM BLOQUEO] Eliminación de ECS ${existingEcs.code} registrada como evidencia (${commitCorrelationStatus}). Inventario oficial preservado.`);
            }
          }
        }
      }

      // Auditoría criptográfica según la clasificación formal de persistencia
      if (isAuthorized) {
        await this.auditService.logEvent({
          eventCode: 'GITHUB_GIT_SYNC_COMPLETED',
          actorRole: 'SYSTEM_SYNC',
          actorUserId: null,
          operation: 'SYNC_GIT_COMMITS',
          entityName: 'config_item',
          entityId: commitSha,
          projectId,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            commitSha,
            author,
            message,
            rfcId: scmVerification.rfcId,
            rfcCode: scmVerification.rfcCode,
            changeOrderId: scmVerification.changeOrderId,
            verificationReason: scmVerification.reason,
            filesCount: files.length,
          },
        });
      } else if (commitCorrelationStatus === 'PENDIENTE_DE_CORRELACION') {
        this.logger.warn(`[GOBERNANZA SCM] Commit ${commitSha} pendiente de correlación: ${scmVerification.reason}`);
        await this.auditService.logEvent({
          eventCode: 'GITHUB_CORRELATION_PENDING',
          actorRole: 'EXTERNAL_GIT_PUSHER',
          actorUserId: null,
          operation: 'CHECK_COMMIT_CORRELATION',
          entityName: 'config_item',
          entityId: commitSha,
          projectId,
          resultStatus: 'REJECTED',
          payloadDiff: {
            commitSha,
            author,
            message,
            rfcCode: scmVerification.rfcCode,
            reason: scmVerification.reason,
            filesCount: files.length,
            status: 'PENDIENTE_DE_CORRELACION',
          },
        });
      } else {
        this.logger.warn(`[GOBERNANZA SCM] Cambio fuera de banda / no autorizado en commit ${commitSha}: ${scmVerification.reason}`);
        await this.auditService.logEvent({
          eventCode: 'GITHUB_OUT_OF_BAND_DETECTED',
          actorRole: 'EXTERNAL_GIT_PUSHER',
          actorUserId: null,
          operation: 'OUT_OF_BAND_GIT_PUSH',
          entityName: 'config_item',
          entityId: commitSha,
          projectId,
          resultStatus: 'REJECTED',
          payloadDiff: {
            commitSha,
            author,
            message,
            reason: scmVerification.reason,
            filesCount: files.length,
            status: commitCorrelationStatus,
            warning: 'Modificación realizada directamente en GitHub no amparada por Orden de Cambio formal aprobada.',
          },
        });
      }
    }

    return overallCorrelationStatus;
  }

  /**
   * Manejo de eventos de Pull Request de GitHub.
   */
  private async handlePullRequestEvent(event: GitHubEventEntity): Promise<void> {
    const payload = event.payload;
    const action = payload.action || 'unknown';
    const prNumber = payload.pull_request?.number;
    const prTitle = payload.pull_request?.title;
    const baseBranch = payload.pull_request?.base?.ref;
    const headBranch = payload.pull_request?.head?.ref;

    this.logger.log(`Pull Request #${prNumber} acción: ${action} (${headBranch} -> ${baseBranch})`);

    await this.auditService.logEvent({
      eventCode: 'GITHUB_PR_SYNCHRONIZED',
      actorRole: 'GITHUB_WEBHOOK',
      actorUserId: null,
      operation: 'SYNC_PULL_REQUEST',
      entityName: 'github_event',
      entityId: event.id,
      projectId: event.project_id || undefined,
      resultStatus: 'SUCCESS',
      payloadDiff: {
        action,
        prNumber,
        prTitle,
        baseBranch,
        headBranch,
        author: payload.pull_request?.user?.login,
      },
    });
  }

  private isPathMove(oldPath: string, newPath: string): boolean {
    const oldDir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
    const newDir = newPath.includes('/') ? newPath.substring(0, newPath.lastIndexOf('/')) : '';
    return oldDir !== newDir;
  }
}

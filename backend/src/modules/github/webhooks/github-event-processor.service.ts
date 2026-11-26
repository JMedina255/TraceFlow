import { Injectable, Inject, Logger, forwardRef } from '@nestjs/common';
import { GitHubRepository } from '../github.repository.js';
import { AuditService } from '../../audit/audit.service.js';
import { IGitHubApiClient } from '../github-api.client.js';
import type { GitHubEventEntity, GitHubCommitFile } from '../github.entity.js';

@Injectable()
export class GitHubEventProcessorService {
  private readonly logger = new Logger(GitHubEventProcessorService.name);

  constructor(
    @Inject(GitHubRepository) private readonly githubRepo: GitHubRepository,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject('IGitHubApiClient') private readonly githubClient: IGitHubApiClient
  ) {}

  /**
   * Procesa un evento individual de forma atómica y transicional:
   * PENDING -> PROCESSING -> PROCESSED (o FAILED si supera intentos).
   */
  async processEvent(event: GitHubEventEntity): Promise<GitHubEventEntity> {
    this.logger.log(`Iniciando procesamiento de evento ${event.id} (tipo: ${event.event_type}, delivery: ${event.delivery_id})`);

    // 1. Transición a PROCESSING
    await this.githubRepo.updateEventStatus(event.id, 'PROCESSING');

    try {
      switch (event.event_type) {
        case 'push':
          await this.handlePushEvent(event);
          break;
        case 'pull_request':
          await this.handlePullRequestEvent(event);
          break;
        case 'ping':
          this.logger.log(`Ping recibido para instalación ${event.installation_id}. Marcando como procesado.`);
          break;
        default:
          this.logger.log(`Evento '${event.event_type}' recibido y registrado sin acción adicional.`);
          break;
      }

      // 2. Transición exitosa a PROCESSED
      const updated = await this.githubRepo.updateEventStatus(event.id, 'PROCESSED');
      return updated || event;
    } catch (err: any) {
      this.logger.error(`Fallo procesando evento ${event.id}: ${err.message}`, err.stack);
      const updated = await this.githubRepo.incrementEventAttempts(event.id, err.message);
      return updated || event;
    }
  }

  /**
   * Procesa en lote los eventos PENDING acumulados.
   */
  async processPendingEvents(limit: number = 10): Promise<{ processed: number; failed: number }> {
    const pending = await this.githubRepo.findPendingEvents(limit);
    let processed = 0;
    let failed = 0;

    for (const evt of pending) {
      try {
        const res = await this.processEvent(evt);
        if (res.processing_status === 'PROCESSED') {
          processed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { processed, failed };
  }

  /**
   * Manejo de eventos push de Git:
   *  - Detección de repositorio y proyecto asociado en TraceFlow.
   *  - Verificación de instalación activa en la organización.
   *  - Inspección de commits y archivos afectados (renombrados, movimientos, eliminaciones).
   *  - Mapeo y actualización de Elementos de Configuración (ECS) en traceflow.config_item.
   *  - Registro de cambios de ruta en traceflow.config_item_path_history.
   *  - Detección de cambios fuera de banda (DA-01, DA-02) y auditoría SCM.
   */
  private async handlePushEvent(event: GitHubEventEntity): Promise<void> {
    const payload = event.payload;
    let projectId = event.project_id;

    // Si el evento no tenía projectId mapeado, intentar resolver por github_repo_id
    if (!projectId && event.github_repo_id) {
      const integration = await this.githubRepo.findActiveByRepoId(event.github_repo_id);
      if (integration) {
        projectId = integration.project_id;
      }
    }

    if (!projectId) {
      this.logger.warn(`Push ignorado: Repositorio ${event.github_repo_id} no está vinculado a ningún proyecto TraceFlow.`);
      return;
    }

    const repoOwner = payload.repository?.owner?.login || payload.repository?.owner?.name || '';
    const repoName = payload.repository?.name || '';
    const commits = payload.commits || (payload.head_commit ? [payload.head_commit] : []);

    for (const commit of commits) {
      const commitSha = commit.id || commit.sha;
      const message = commit.message || '';
      const author = commit.author || { name: 'unknown', email: 'unknown' };

      // Obtener detalles de archivos mediante cliente GitHub o payload del webhook
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
        this.logger.warn(`No se pudo obtener detalles remotos de commit ${commitSha}: ${err.message}. Usando archivos de payload.`);
      }

      if (files.length === 0) {
        // Fallback a los archivos listados en el payload del webhook
        const added = (commit.added || []).map((f: string) => ({ filename: f, status: 'added', additions: 0, deletions: 0, changes: 0 }));
        const modified = (commit.modified || []).map((f: string) => ({ filename: f, status: 'modified', additions: 0, deletions: 0, changes: 0 }));
        const removed = (commit.removed || []).map((f: string) => ({ filename: f, status: 'removed', additions: 0, deletions: 0, changes: 0 }));
        files = [...added, ...modified, ...removed];
      } else if (commit.removed && Array.isArray(commit.removed)) {
        for (const rem of commit.removed) {
          if (!files.some((f) => f.filename === rem && f.status === 'removed')) {
            files.push({
              filename: rem,
              status: 'removed',
              additions: 0,
              deletions: 0,
              changes: 0,
            });
          }
        }
      }

      // 1. Detección de cambios de ruta (Renombrados, Movimientos y Bajas de ECS)
      for (const file of files) {
        // Renombrado o Movimiento explícito detectado por Git
        if (file.status === 'renamed' && file.previous_filename) {
          const existingEcs = await this.githubRepo.findConfigItemByPath(projectId, file.previous_filename);
          if (existingEcs) {
            const isMove = this.isPathMove(file.previous_filename, file.filename);
            const changeType = isMove ? 'MOVE' : 'RENAME';

            await this.githubRepo.recordPathChange({
              configItemId: existingEcs.id,
              projectId,
              oldPath: file.previous_filename,
              newPath: file.filename,
              changeType,
              gitCommitSha: commitSha,
            });

            await this.githubRepo.updateConfigItemPath(existingEcs.id, file.filename);
            this.logger.log(`ECS ${existingEcs.code} ruta actualizada (${changeType}): '${file.previous_filename}' -> '${file.filename}'`);
          }
        }

        // Eliminación de archivo vinculado a ECS
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
            });
            this.logger.warn(`ECS ${existingEcs.code} archivo eliminado en commit ${commitSha}: '${file.filename}'`);
          }
        }
      }

      // 2. Detección de Cambios Fuera de Banda (Out-of-band Changes - DA-01, DA-02)
      // Un cambio es "fuera de banda" si se realizó directamente en GitHub sin asociarse a un RFC formal
      // o si contiene directivas explícitas de mutación no autorizada.
      const isAuthorizedScmChange = /^(fix|feat|chore|refactor|docs|test)\(RFC-[0-9]+\):/i.test(message) ||
        /RFC-[0-9]+/i.test(message) ||
        /ECN-[0-9]+/i.test(message);

      const hasOutOfBandDirective = /\[OUT_OF_BAND\]/i.test(message) ||
        /sin autorizaci[oó]n/i.test(message) ||
        !isAuthorizedScmChange;

      if (hasOutOfBandDirective) {
        this.logger.warn(`[GOBERNANZA SCM] Cambio fuera de banda detectado en commit ${commitSha} por ${author.name} <${author.email}>`);
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
            filesCount: files.length,
            files: files.map((f) => f.filename),
            warning: 'Modificación realizada directamente en GitHub sin orden de cambio formal (RFC) aprobada.',
          },
        });
      } else {
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
            filesCount: files.length,
          },
        });
      }
    }
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

  /**
   * Determina si el cambio entre dos rutas corresponde a un movimiento entre carpetas
   * o únicamente a un renombrado de archivo.
   */
  private isPathMove(oldPath: string, newPath: string): boolean {
    const oldDir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
    const newDir = newPath.includes('/') ? newPath.substring(0, newPath.lastIndexOf('/')) : '';
    return oldDir !== newDir;
  }
}

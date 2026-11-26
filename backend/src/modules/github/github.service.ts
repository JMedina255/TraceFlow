import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import { ProjectsRepository, ProjectEntity } from '../projects/projects.repository.js';
import { OrganizationsRepository } from '../organizations/organizations.repository.js';
import { ProjectPlanningRepository } from '../projects/project-planning.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { GitHubRepository } from './github.repository.js';
import { IGitHubApiClient } from './github-api.client.js';
import type { AuthenticatedUser } from '../../common/types/index.js';
import type { LinkRepoDto } from './dtos/link-repo.dto.js';
import type { CreateRepoDraftDto } from './dtos/create-repo-draft.dto.js';
import type { GitHubIntegrationEntity, GitHubRepoDetails } from './github.entity.js';

@Injectable()
export class GitHubService {
  constructor(
    @Inject(DatabaseService)
    private readonly db: DatabaseService,
    @Inject(ProjectsRepository)
    private readonly projectsRepo: ProjectsRepository,
    @Inject(OrganizationsRepository)
    private readonly orgRepo: OrganizationsRepository,
    @Inject(ProjectPlanningRepository)
    private readonly planningRepo: ProjectPlanningRepository,
    @Inject(GitHubRepository)
    private readonly githubRepo: GitHubRepository,
    @Inject('IGitHubApiClient')
    private readonly githubClient: IGitHubApiClient,
    @Inject(AuditService)
    private readonly auditService: AuditService
  ) {}

  // ==========================================================================
  // AUTORIZACIÓN ESTRICTA Y SEGREGACIÓN MULTITENANT (ADR-011 / H04A Precondición)
  // ==========================================================================
  private async getAuthorizedProject(
    projectIdOrCode: string,
    callerUser: AuthenticatedUser
  ): Promise<ProjectEntity> {
    const project = await this.projectsRepo.findByIdOrCode(projectIdOrCode);
    if (!project) {
      throw new NotFoundException(`Proyecto '${projectIdOrCode}' no encontrado.`);
    }

    if (this.db.getDatabaseMode() === 'postgres' && !project.organization_id) {
      throw new ForbiddenException(
        `Acceso denegado: El proyecto '${project.code}' no tiene organización asignada (DA-02).`
      );
    }

    let member: any = null;
    if (project.organization_id) {
      member = await this.orgRepo.findMember(project.organization_id, callerUser.id);
      if (!member || member.status !== 'ACTIVE') {
        throw new ForbiddenException(
          `Acceso denegado (DA-06): El usuario '${callerUser.code}' no es miembro activo de la organización propietaria.`
        );
      }
    }

    let isAuthorized = false;
    if (member && ['OWNER', 'ADMIN', 'AUDITOR'].includes(member.role_in_org)) {
      isAuthorized = true;
    }

    if (project.created_by === callerUser.id || project.manager_id === callerUser.id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      const assignments = await this.projectsRepo.findUserProjectAssignments(callerUser.id);
      if (assignments.includes(project.id) || assignments.includes(project.code)) {
        isAuthorized = true;
      } else {
        const teamRoles = await this.planningRepo.findTeamRolesByProjectId(project.id);
        if (teamRoles.some((tr) => tr.user_id === callerUser.id && tr.status === 'ACTIVE')) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized && this.db.getDatabaseMode() === 'mock') {
      if (
        callerUser.assignedProjectIds?.includes(project.id) ||
        callerUser.assignedProjectIds?.includes(project.code)
      ) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException(
        `Acceso denegado: El usuario '${callerUser.code}' no está asignado al proyecto '${project.code}' ni cuenta con permisos de gestión.`
      );
    }

    return project;
  }

  private async assertAdminOrManager(
    project: ProjectEntity,
    callerUser: AuthenticatedUser
  ): Promise<void> {
    if (!project.organization_id) return;

    const member = await this.orgRepo.findMember(project.organization_id, callerUser.id);
    const isOrgAdmin = member && ['OWNER', 'ADMIN'].includes(member.role_in_org);

    let isProjectManager =
      project.created_by === callerUser.id || project.manager_id === callerUser.id;

    if (!isProjectManager && callerUser.activeRoleId === 'PU-02') {
      const teamRoles = await this.planningRepo.findTeamRolesByProjectId(project.id);
      isProjectManager = teamRoles.some(
        (tr) =>
          tr.user_id === callerUser.id &&
          (tr.role_code === 'PU-02' || tr.role_id === 2) &&
          tr.status === 'ACTIVE'
      );
    }

    if (!isOrgAdmin && !isProjectManager) {
      throw new ForbiddenException(
        `Acceso denegado: Se requiere rol de Propietario/Administrador de la organización o Gestor asignado del proyecto (PU-02) para administrar la integración GitHub.`
      );
    }
  }

  // ==========================================================================
  // CONSULTA DE ESTADO Y REPOSITORIOS DISPONIBLES
  // ==========================================================================
  async getIntegrationStatus(
    projectIdOrCode: string,
    callerUser: AuthenticatedUser
  ): Promise<{
    configured: boolean;
    integration: GitHubIntegrationEntity | null;
  }> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    const integration = await this.githubRepo.findByProjectId(project.id);

    return {
      configured: !!integration && integration.validation_status === 'VALIDATED',
      integration: integration || null,
    };
  }

  async getAvailableRepositories(
    projectIdOrCode: string,
    installationId: number,
    callerUser: AuthenticatedUser
  ): Promise<GitHubRepoDetails[]> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    if (!installationId || installationId <= 0) {
      throw new BadRequestException('El installationId debe ser un número entero positivo válido.');
    }

    return this.githubClient.listInstallationRepositories(installationId);
  }

  // ==========================================================================
  // VINCULACIÓN DE REPOSITORIO EXISTENTE (H04A)
  // ==========================================================================
  async linkExistingRepository(
    projectIdOrCode: string,
    dto: LinkRepoDto,
    callerUser: AuthenticatedUser
  ): Promise<GitHubIntegrationEntity> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    // 1. Comprobar si el proyecto ya tiene una integración GitHub activa
    const existingForProject = await this.githubRepo.findByProjectId(project.id);
    if (existingForProject && existingForProject.validation_status !== 'UNLINKED') {
      throw new ConflictException(
        `El proyecto '${project.code}' ya tiene vinculado el repositorio '${existingForProject.repo_full_name}'. Desvincúlelo previamente si desea cambiar de repositorio.`
      );
    }

    // 2. Comprobar regla de gobernanza: Unicidad del repositorio activo en todo el sistema
    const existingActiveRepo = await this.githubRepo.findActiveByRepo(dto.repoOwner, dto.repoName);
    if (existingActiveRepo && existingActiveRepo.project_id !== project.id) {
      throw new ConflictException(
        `Conflicto de gobernanza SCM: El repositorio '${dto.repoOwner}/${dto.repoName}' ya se encuentra activamente vinculado a otro proyecto en el sistema.`
      );
    }

    // 3. Consultar y verificar el repositorio directamente en GitHub
    let repoDetails: GitHubRepoDetails;
    try {
      repoDetails = await this.githubClient.getRepository(dto.repoOwner, dto.repoName, dto.installationId);
    } catch (err: any) {
      if (err.code === 'REPO_NOT_FOUND' || err.status === 404) {
        throw new NotFoundException(
          `El repositorio '${dto.repoOwner}/${dto.repoName}' no existe en GitHub o la instalación no tiene acceso a él.`
        );
      }
      throw new BadRequestException(
        `Error al validar repositorio en GitHub: ${err.message || 'Fallo de comunicación con la API de GitHub'}`
      );
    }

    // 4. Validar permisos técnicos mínimos efectivos: push es estrictamente obligatorio para SCM
    if (!repoDetails.permissions.push) {
      throw new BadRequestException(
        `Permisos insuficientes: La instalación de GitHub App no posee permisos de escritura (push) sobre '${repoDetails.full_name}'. TraceFlow SCM requiere permisos de push para gobernar ramas y artefactos.`
      );
    }

    // 5. Persistencia atómica de vinculación, actualización del asistente y auditoría SHA-256
    return await this.db.transaction(async (client) => {
      const saved = await this.githubRepo.saveIntegration(
        {
          projectId: project.id,
          integrationMode: 'LINK_EXISTING',
          repoOwner: repoDetails.owner.login,
          repoName: repoDetails.name,
          repoFullName: repoDetails.full_name,
          githubRepoId: repoDetails.id,
          defaultBranch: dto.defaultBranch || repoDetails.default_branch || 'main',
          installationId: dto.installationId,
          visibility: repoDetails.visibility,
          permissions: repoDetails.permissions,
          validationStatus: 'VALIDATED',
        },
        client
      );

      // Marcar paso 4 (GitHub) como completado en el asistente de configuración
      await this.planningRepo.saveSetup(
        project.id,
        {
          github_completed: true,
          last_saved_by: callerUser.id,
        },
        client
      );

      // Auditoría criptográfica inmutable SHA-256
      await this.auditService.logEvent(
        {
          eventCode: 'GITHUB_REPO_LINKED',
          actorUserId: callerUser.id,
          actorRole: callerUser.activeRoleId,
          operation: 'LINK_GITHUB_REPO',
          entityName: 'github_integration',
          entityId: saved.id,
          projectId: project.id,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            projectId: project.id,
            projectCode: project.code,
            repoFullName: saved.repo_full_name,
            githubRepoId: saved.github_repo_id,
            installationId: saved.installation_id,
            defaultBranch: saved.default_branch,
            visibility: saved.visibility,
          },
        },
        client
      );

      return saved;
    });
  }

  // ==========================================================================
  // REVALIDACIÓN Y MONITOREO DE SALUD DE ACCESO GITHUB
  // ==========================================================================
  async validateIntegrationAccess(
    projectIdOrCode: string,
    callerUser: AuthenticatedUser
  ): Promise<GitHubIntegrationEntity> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    const integration = await this.githubRepo.findByProjectId(project.id);
    if (!integration || integration.validation_status === 'UNLINKED') {
      throw new NotFoundException(
        `El proyecto '${project.code}' no tiene ninguna integración GitHub configurada para validar.`
      );
    }

    try {
      const repoDetails = await this.githubClient.getRepository(
        integration.repo_owner,
        integration.repo_name,
        integration.installation_id
      );

      if (!repoDetails.permissions.push) {
        const updated = (await this.githubRepo.updateValidationStatus(
          integration.id,
          'PERMISSION_DENIED',
          'Permisos revocados: La instalación ya no posee permisos de push sobre el repositorio.'
        ))!;
        return updated;
      }

      const updated = (await this.githubRepo.updateValidationStatus(integration.id, 'VALIDATED', null))!;

      await this.auditService.logEvent({
        eventCode: 'GITHUB_INTEGRATION_VERIFIED',
        actorUserId: callerUser.id,
        actorRole: callerUser.activeRoleId,
        operation: 'VERIFY_GITHUB_ACCESS',
        entityName: 'github_integration',
        entityId: updated.id,
        projectId: project.id,
        resultStatus: 'SUCCESS',
        payloadDiff: {
          validationStatus: updated.validation_status,
          repoFullName: updated.repo_full_name,
        },
      });

      return updated;
    } catch (err: any) {
      const status = err.code === 'REPO_NOT_FOUND' ? 'REPO_NOT_FOUND' : 'INVALID_CREDENTIALS';
      const updated = (await this.githubRepo.updateValidationStatus(
        integration.id,
        status,
        err.message || 'Fallo de acceso a GitHub'
      ))!;

      await this.auditService.logEvent({
        eventCode: 'GITHUB_INTEGRATION_VERIFIED',
        actorUserId: callerUser.id,
        actorRole: callerUser.activeRoleId,
        operation: 'VERIFY_GITHUB_ACCESS',
        entityName: 'github_integration',
        entityId: updated.id,
        projectId: project.id,
        resultStatus: 'FAILURE',
        payloadDiff: {
          validationStatus: updated.validation_status,
          errorMessage: updated.validation_error_message,
        },
      });

      return updated;
    }
  }

  // ==========================================================================
  // DESVINCULACIÓN LÓGICA CONFORME A POLÍTICA SCM (SIN ELIMINAR REPO REMOTO)
  // ==========================================================================
  async unlinkRepository(
    projectIdOrCode: string,
    callerUser: AuthenticatedUser
  ): Promise<GitHubIntegrationEntity> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    const integration = await this.githubRepo.findByProjectId(project.id);
    if (!integration || integration.validation_status === 'UNLINKED') {
      throw new NotFoundException(
        `El proyecto '${project.code}' no tiene ninguna integración GitHub activa para desvincular.`
      );
    }

    return await this.db.transaction(async (client) => {
      const unlinked = (await this.githubRepo.unlinkIntegration(project.id, callerUser.id, client))!;

      // Marcar github_completed como falso en el setup
      await this.planningRepo.saveSetup(
        project.id,
        {
          github_completed: false,
          last_saved_by: callerUser.id,
        },
        client
      );

      // Auditoría SHA-256
      await this.auditService.logEvent(
        {
          eventCode: 'GITHUB_REPO_UNLINKED',
          actorUserId: callerUser.id,
          actorRole: callerUser.activeRoleId,
          operation: 'UNLINK_GITHUB_REPO',
          entityName: 'github_integration',
          entityId: unlinked.id,
          projectId: project.id,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            projectId: project.id,
            projectCode: project.code,
            repoFullName: unlinked.repo_full_name,
            unlinkedBy: callerUser.code,
          },
        },
        client
      );

      return unlinked;
    });
  }

  // ==========================================================================
  // PREPARACIÓN DE CONTRATO PARA CREACIÓN DE REPOSITORIOS (H04A)
  // ==========================================================================
  async validateRepoDraftContract(
    projectIdOrCode: string,
    dto: CreateRepoDraftDto,
    callerUser: AuthenticatedUser
  ): Promise<{
    valid: boolean;
    contract: {
      owner: string;
      name: string;
      fullName: string;
      visibility: string;
      initBranches: string[];
      description?: string;
    };
    governanceNotice: string;
  }> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    const validation = this.githubClient.validateRepoDraft({
      name: dto.repoName,
      owner: dto.repoOwner,
      visibility: dto.visibility,
    });

    if (!validation.valid) {
      throw new BadRequestException(
        `Contrato de creación de repositorio inválido: ${validation.errors?.join(', ')}`
      );
    }

    return {
      valid: true,
      contract: {
        owner: dto.repoOwner,
        name: dto.repoName,
        fullName: `${dto.repoOwner}/${dto.repoName}`,
        visibility: dto.visibility,
        initBranches: dto.initBranches && dto.initBranches.length > 0 ? dto.initBranches : ['main', 'develop'],
        description: dto.description,
      },
      governanceNotice:
        'Contrato validado exitosamente. En esta iteración INIT-H04A no se aprovisionan repositorios remotos automáticamente para prevenir mutaciones externas no supervisadas.',
    };
  }
}

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
import type { GitHubIntegrationEntity, GitHubRepoDetails, GitHubValidationStatus } from './github.entity.js';

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
  // CONSULTA DE ESTADO Y REPOSITORIOS DISPONIBLES (H04A-R02 Aislamiento)
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
    installationId: number | undefined,
    callerUser: AuthenticatedUser
  ): Promise<GitHubRepoDetails[]> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    let targetInstallationId = installationId;
    let orgInstallation: OrganizationGitHubInstallationEntity | null = null;

    if (targetInstallationId !== undefined) {
      if (!targetInstallationId || targetInstallationId <= 0 || isNaN(targetInstallationId)) {
        throw new BadRequestException('El installationId debe ser un número entero positivo válido.');
      }

      // H04A-R02: Validar que el installationId pertenezca a la organización del proyecto
      orgInstallation = await this.githubRepo.findInstallationByOrgAndId(
        project.organization_id!,
        targetInstallationId
      );
      if (!orgInstallation || orgInstallation.status !== 'ACTIVE') {
        throw new ForbiddenException(
          `Acceso denegado: La instalación GitHub ${targetInstallationId} no está autorizada para la organización del proyecto.`
        );
      }
    } else {
      // Buscar primera instalación activa de la organización
      const activeInstallations = await this.githubRepo.findActiveInstallationsByOrg(
        project.organization_id!
      );
      if (activeInstallations.length === 0) {
        throw new ForbiddenException(
          `La organización '${project.organization_id}' no posee ninguna instalación de GitHub App activa registrada.`
        );
      }
      orgInstallation = activeInstallations[0];
      targetInstallationId = orgInstallation.installation_id;
    }

    // SEC-04: Revalidar instalación con GitHub API antes de listar repositorios
    let installDetails: GitHubInstallationDetails;
    try {
      installDetails = await this.githubClient.getInstallation(targetInstallationId);
    } catch (err: any) {
      if (err.code === 'INSTALLATION_NOT_FOUND' || err.status === 404) {
        throw new NotFoundException(
          `La instalación GitHub ID ${targetInstallationId} ya no se encuentra activa o no existe en GitHub.`
        );
      }
      throw new BadRequestException(
        `Error al revalidar instalación en GitHub: ${err.message || 'Fallo de acceso'}`
      );
    }

    if (
      installDetails.account.login.toLowerCase() !== orgInstallation.account_login.toLowerCase()
    ) {
      throw new ForbiddenException(
        `Inconsistencia de cuenta GitHub: La instalación remota pertenece a '${installDetails.account.login}', pero está registrada como '${orgInstallation.account_login}'.`
      );
    }

    // SEC-04: Validar identidad estable de cuenta GitHub cuando esté disponible
    if (
      orgInstallation.target_id &&
      installDetails.account.id &&
      orgInstallation.target_id !== installDetails.account.id
    ) {
      throw new ForbiddenException(
        `Inconsistencia crítica de identidad: El ID numérico de cuenta GitHub (${installDetails.account.id}) no coincide con el registrado (${orgInstallation.target_id}).`
      );
    }

    return this.githubClient.listInstallationRepositories(targetInstallationId);
  }

  // ==========================================================================
  // VINCULACIÓN DE REPOSITORIO EXISTENTE (H04A / H04A-R01-R04)
  // ==========================================================================
  async linkExistingRepository(
    projectIdOrCode: string,
    dto: LinkRepoDto,
    callerUser: AuthenticatedUser
  ): Promise<GitHubIntegrationEntity> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    // H04A-R01: En producción, no permitir mock
    if (process.env.NODE_ENV === 'production' && this.githubClient.isMock) {
      throw new ForbiddenException(
        'Operación rechazada: No se permite vincular integraciones con cliente GitHub simulado en entorno de producción.'
      );
    }

    // H04A-R02: Validar que la instalación pertenezca a la organización del proyecto
    const orgInstallation = await this.githubRepo.findInstallationByOrgAndId(
      project.organization_id!,
      dto.installationId
    );
    if (!orgInstallation || orgInstallation.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `Acceso denegado: La instalación GitHub ${dto.installationId} no está registrada o autorizada para la organización del proyecto.`
      );
    }

    // 1. Comprobar si el proyecto ya tiene una integración GitHub activa
    const existingForProject = await this.githubRepo.findByProjectId(project.id);
    if (existingForProject && existingForProject.validation_status !== 'UNLINKED') {
      throw new ConflictException(
        `El proyecto '${project.code}' ya tiene vinculado el repositorio '${existingForProject.repo_full_name}'. Desvincúlelo previamente si desea cambiar de repositorio.`
      );
    }

    // 2. Comprobar regla de gobernanza preliminar por nombre
    const existingActiveRepo = await this.githubRepo.findActiveByRepo(dto.repoOwner, dto.repoName);
    if (existingActiveRepo && existingActiveRepo.project_id !== project.id) {
      throw new ConflictException(
        `Conflicto de gobernanza SCM: El repositorio '${dto.repoOwner}/${dto.repoName}' ya se encuentra activamente vinculado a otro proyecto en el sistema.`
      );
    }

    // 3. Consultar y verificar la instalación y el repositorio directamente en GitHub
    let repoDetails: GitHubRepoDetails;
    try {
      const installDetails = await this.githubClient.getInstallation(dto.installationId);
      if (
        installDetails.account.login.toLowerCase() !== orgInstallation.account_login.toLowerCase()
      ) {
        throw new ForbiddenException(
          `La cuenta GitHub de la instalación (${installDetails.account.login}) no coincide con la registrada (${orgInstallation.account_login}).`
        );
      }

      // SEC-04: Comprobar identidad numérica estable de cuenta
      if (
        orgInstallation.target_id &&
        installDetails.account.id &&
        orgInstallation.target_id !== installDetails.account.id
      ) {
        throw new ForbiddenException(
          `Inconsistencia crítica de identidad: El ID numérico de cuenta GitHub (${installDetails.account.id}) no coincide con el registrado (${orgInstallation.target_id}).`
        );
      }

      repoDetails = await this.githubClient.getRepository(
        dto.repoOwner,
        dto.repoName,
        dto.installationId
      );
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      if (err.code === 'REPO_NOT_FOUND' || err.status === 404) {
        throw new NotFoundException(
          `El repositorio '${dto.repoOwner}/${dto.repoName}' no existe en GitHub o la instalación no tiene acceso a él.`
        );
      }
      throw new BadRequestException(
        `Error al validar repositorio en GitHub: ${err.message || 'Fallo de comunicación con la API de GitHub'}`
      );
    }

    // H04A-R03: Comprobar unicidad canónica por github_repo_id inmutable
    const existingActiveById = await this.githubRepo.findActiveByRepoId(repoDetails.id);
    if (existingActiveById && existingActiveById.project_id !== project.id) {
      throw new ConflictException(
        `Conflicto de gobernanza SCM: El repositorio con ID ${repoDetails.id} (${repoDetails.full_name}) ya se encuentra activamente vinculado a otro proyecto en el sistema.`
      );
    }

    // 4. Validar permisos técnicos mínimos efectivos: push es estrictamente obligatorio para SCM
    if (!repoDetails.permissions.push) {
      throw new BadRequestException(
        `Permisos insuficientes: La instalación de GitHub App no posee permisos de escritura (push) sobre '${repoDetails.full_name}'. TraceFlow SCM requiere permisos de push para gobernar ramas y artefactos.`
      );
    }

    // H04A-R04: Validar existencia de la rama por referencia Git real
    const branchToValidate = dto.defaultBranch || repoDetails.default_branch || 'main';
    try {
      const branchDetails = await this.githubClient.getBranch(
        repoDetails.owner.login,
        repoDetails.name,
        branchToValidate,
        dto.installationId
      );
      if (!branchDetails) {
        throw new BadRequestException(
          `La rama '${branchToValidate}' no existe en el repositorio GitHub.`
        );
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        `Error al validar rama '${branchToValidate}' en GitHub: ${err.message || 'Rama no encontrada'}`
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
          defaultBranch: branchToValidate,
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
  // REVALIDACIÓN, MONITOREO Y ATOMICIDAD (H04A-R04)
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

    // H04A-R01: En producción, no permitir mock
    if (process.env.NODE_ENV === 'production' && this.githubClient.isMock) {
      throw new ForbiddenException(
        'Operación rechazada: No se permite validar integraciones con cliente GitHub simulado en entorno de producción.'
      );
    }

    let isFailure = false;
    let newStatus: GitHubValidationStatus = 'VALIDATED';
    let errorMessage: string | null = null;

    try {
      const repoDetails = await this.githubClient.getRepository(
        integration.repo_owner,
        integration.repo_name,
        integration.installation_id
      );

      if (!repoDetails.permissions.push) {
        isFailure = true;
        newStatus = 'PERMISSION_DENIED';
        errorMessage =
          'Permisos revocados: La instalación ya no posee permisos de push sobre el repositorio.';
      } else {
        // H04A-R04: Validar rama existente
        try {
          const branchDetails = await this.githubClient.getBranch(
            integration.repo_owner,
            integration.repo_name,
            integration.default_branch,
            integration.installation_id
          );
          if (!branchDetails) {
            isFailure = true;
            newStatus = 'INVALID_CREDENTIALS';
            errorMessage = `La rama registrada '${integration.default_branch}' no fue encontrada en GitHub.`;
          }
        } catch (bErr: any) {
          isFailure = true;
          newStatus = 'INVALID_CREDENTIALS';
          errorMessage = `La rama '${integration.default_branch}' ya no existe o no es accesible: ${bErr.message}`;
        }
      }
    } catch (err: any) {
      isFailure = true;
      newStatus = err.code === 'REPO_NOT_FOUND' || err.status === 404 ? 'REPO_NOT_FOUND' : 'INVALID_CREDENTIALS';
      errorMessage = err.message || 'Fallo de acceso a la API de GitHub';
    }

    // H04A-R04: Sincronización atómica en transacción
    return await this.db.transaction(async (client) => {
      const updated = (await this.githubRepo.updateValidationStatus(
        integration.id,
        newStatus,
        errorMessage,
        client
      ))!;

      if (isFailure) {
        // Degradar asistente
        await this.planningRepo.saveSetup(
          project.id,
          {
            github_completed: false,
            last_saved_by: callerUser.id,
          },
          client
        );

        // Auditoría GITHUB_INTEGRATION_DEGRADED
        await this.auditService.logEvent(
          {
            eventCode: 'GITHUB_INTEGRATION_DEGRADED',
            actorUserId: callerUser.id,
            actorRole: callerUser.activeRoleId,
            operation: 'VERIFY_GITHUB_ACCESS',
            entityName: 'github_integration',
            entityId: updated.id,
            projectId: project.id,
            resultStatus: 'FAILURE',
            payloadDiff: {
              previousStatus: integration.validation_status,
              validationStatus: newStatus,
              errorMessage,
              github_completed: false,
            },
          },
          client
        );
      } else {
        // Asegurar que github_completed = true
        await this.planningRepo.saveSetup(
          project.id,
          {
            github_completed: true,
            last_saved_by: callerUser.id,
          },
          client
        );

        // Auditoría GITHUB_INTEGRATION_VERIFIED
        await this.auditService.logEvent(
          {
            eventCode: 'GITHUB_INTEGRATION_VERIFIED',
            actorUserId: callerUser.id,
            actorRole: callerUser.activeRoleId,
            operation: 'VERIFY_GITHUB_ACCESS',
            entityName: 'github_integration',
            entityId: updated.id,
            projectId: project.id,
            resultStatus: 'SUCCESS',
            payloadDiff: {
              validationStatus: newStatus,
              repoFullName: updated.repo_full_name,
              defaultBranch: updated.default_branch,
              github_completed: true,
            },
          },
          client
        );
      }

      return updated;
    });
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

  // ==========================================================================
  // REGISTRO AUTORIZADO DE INSTALACIONES GITHUB APP (SEC-02)
  // ==========================================================================
  async registerOrganizationInstallation(
    organizationIdOrCode: string,
    installationId: number,
    callerUser: AuthenticatedUser
  ): Promise<OrganizationGitHubInstallationEntity> {
    const org = await this.orgRepo.findByIdOrSlugOrCode(organizationIdOrCode);
    if (!org) {
      throw new NotFoundException(`Organización '${organizationIdOrCode}' no encontrada.`);
    }

    const member = await this.orgRepo.findMember(org.id, callerUser.id);
    if (!member || member.status !== 'ACTIVE' || !['OWNER', 'ADMIN'].includes(member.role_in_org)) {
      throw new ForbiddenException(
        'Acceso denegado: Se requiere rol de Propietario (OWNER) o Administrador (ADMIN) de la organización para registrar instalaciones de GitHub App.'
      );
    }

    if (!installationId || installationId <= 0 || isNaN(installationId)) {
      throw new BadRequestException('El installationId debe ser un número entero positivo válido.');
    }

    // Verificar identidad con GitHub API previamente
    let installDetails: GitHubInstallationDetails;
    try {
      installDetails = await this.githubClient.getInstallation(installationId);
    } catch (err: any) {
      if (err.code === 'INSTALLATION_NOT_FOUND' || err.status === 404) {
        throw new NotFoundException(
          `La instalación GitHub ID ${installationId} no existe o no tiene acceso a la GitHub App.`
        );
      }
      throw new BadRequestException(
        `Error al validar instalación en GitHub: ${err.message || 'Fallo de comunicación con GitHub'}`
      );
    }

    return await this.db.transaction(async (client) => {
      const saved = await this.githubRepo.saveOrganizationInstallation(
        {
          organizationId: org.id,
          installationId: installDetails.id,
          accountLogin: installDetails.account.login,
          accountType: installDetails.account.type || 'Organization',
          targetId: installDetails.account.id || null,
          permissions: installDetails.permissions || {},
          repositorySelection: installDetails.repository_selection || 'selected',
          status: 'ACTIVE',
          installedBy: callerUser.id,
        },
        client
      );

      await this.auditService.logEvent(
        {
          eventCode: 'GITHUB_INSTALLATION_REGISTERED',
          actorUserId: callerUser.id,
          actorRole: callerUser.activeRoleId,
          operation: 'REGISTER_GITHUB_INSTALLATION',
          entityName: 'organization_github_installation',
          entityId: saved.id,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            organizationId: org.id,
            installationId: saved.installation_id,
            accountLogin: saved.account_login,
            targetId: saved.target_id,
            installedBy: callerUser.code,
          },
        },
        client
      );

      return saved;
    });
  }
}

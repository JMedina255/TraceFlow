import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import pg from 'pg';
import { DatabaseService } from '../../database/database.service.js';
import { ProjectsRepository, ProjectEntity } from './projects.repository.js';
import { OrganizationsRepository } from '../organizations/organizations.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { AuditService } from '../audit/audit.service.js';
import {
  ProjectPlanningRepository,
  ProjectTeamRoleEntity,
  ProjectMethodologyEntity,
  ProjectPhaseEntity,
  ProjectMilestoneEntity,
  ProjectDeliverableEntity,
  ProjectSetupEntity,
} from './project-planning.repository.js';
import type { AuthenticatedUser } from '../../common/types/index.js';
import type { AssignTeamRoleDto } from './dtos/assign-team-role.dto.js';
import type { ConfigureMethodologyDto } from './dtos/configure-methodology.dto.js';
import type { CreatePhaseDto } from './dtos/create-phase.dto.js';
import type { CreateMilestoneDto } from './dtos/create-milestone.dto.js';
import type { CreateDeliverableDto } from './dtos/create-deliverable.dto.js';
import type {
  SaveDraftProgressDto,
  SaveStep2TeamDto,
  SaveStep3MethodologyDto,
} from './dtos/project-setup.dto.js';

@Injectable()
export class ProjectPlanningService {
  constructor(
    @Inject(DatabaseService)
    private readonly db: DatabaseService,
    @Inject(ProjectsRepository)
    private readonly projectsRepo: ProjectsRepository,
    @Inject(OrganizationsRepository)
    private readonly orgRepo: OrganizationsRepository,
    @Inject(AuthRepository)
    private readonly authRepo: AuthRepository,
    @Inject(ProjectPlanningRepository)
    private readonly planningRepo: ProjectPlanningRepository,
    @Inject(AuditService)
    private readonly auditService: AuditService
  ) {}

  // ==========================================================================
  // MÉTODOS DE APOYO Y VALIDACIÓN DE SEGURIDAD
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

    // 1. Validar pertenencia del usuario a la organización propietaria
    let member: any = null;
    if (project.organization_id) {
      member = await this.orgRepo.findMember(project.organization_id, callerUser.id);
      if (!member || member.status !== 'ACTIVE') {
        throw new ForbiddenException(
          `Acceso denegado (DA-06): El usuario '${callerUser.code}' no es miembro activo de la organización propietaria.`
        );
      }
    }

    // 2. Validar autorización específica sobre el proyecto (H03-R04)
    let isAuthorizedForProject = false;

    // Roles institucionales globales de la organización (OWNER, ADMIN, AUDITOR)
    if (member && ['OWNER', 'ADMIN', 'AUDITOR'].includes(member.role_in_org)) {
      isAuthorizedForProject = true;
    }

    // Creador o Gestor del proyecto o usuario con rol activo PU-02
    if (
      project.created_by === callerUser.id ||
      project.manager_id === callerUser.id ||
      (callerUser.activeRoleId === 'PU-02' && (!member || ['OWNER', 'ADMIN', 'MEMBER'].includes(member.role_in_org)))
    ) {
      isAuthorizedForProject = true;
    }

    // Integrante explícitamente asignado al proyecto (en token, user_project_assignment o project_team_role)
    if (!isAuthorizedForProject) {
      if (
        callerUser.assignedProjectIds?.includes(project.id) ||
        callerUser.assignedProjectIds?.includes(project.code)
      ) {
        isAuthorizedForProject = true;
      } else {
        const assignments = await this.projectsRepo.findUserProjectAssignments(callerUser.id);
        if (assignments.includes(project.id) || assignments.includes(project.code)) {
          isAuthorizedForProject = true;
        } else {
          const teamRoles = await this.planningRepo.findTeamRolesByProjectId(project.id);
          if (teamRoles.some((tr) => tr.user_id === callerUser.id && tr.status === 'ACTIVE')) {
            isAuthorizedForProject = true;
          }
        }
      }
    }

    if (!isAuthorizedForProject) {
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
    const isProjectManager =
      project.created_by === callerUser.id ||
      project.manager_id === callerUser.id ||
      callerUser.activeRoleId === 'PU-02';

    if (!isOrgAdmin && !isProjectManager) {
      throw new ForbiddenException(
        `Acceso denegado: Se requiere rol de Propietario/Administrador de la organización o Gestor del proyecto (PU-02) para modificar la configuración.`
      );
    }
  }

  // ==========================================================================
  // H03.1 — GESTIÓN DE EQUIPOS Y ROLES DE PROYECTO (project_team_role)
  // ==========================================================================
  async assignTeamRole(
    projectIdOrCode: string,
    dto: AssignTeamRoleDto,
    callerUser: AuthenticatedUser,
    client?: pg.PoolClient | null
  ): Promise<ProjectTeamRoleEntity> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    if (client) {
      return this.executeAssignTeamRole(project, dto, callerUser, client);
    }

    return await this.db.transaction(async (trxClient) => {
      return this.executeAssignTeamRole(project, dto, callerUser, trxClient);
    });
  }

  private async executeAssignTeamRole(
    project: ProjectEntity,
    dto: AssignTeamRoleDto,
    callerUser: AuthenticatedUser,
    client?: pg.PoolClient | null
  ): Promise<ProjectTeamRoleEntity> {
    // 1. Resolver usuario objetivo y validar estado activo
    const targetUser = await this.authRepo.findById(dto.userId);
    if (!targetUser) {
      throw new NotFoundException(`Usuario '${dto.userId}' no registrado en el sistema.`);
    }
    if (targetUser.status !== 'ACTIVE') {
      throw new BadRequestException(
        `El usuario '${targetUser.code}' (${targetUser.username}) no se encuentra activo en el sistema (estado: ${targetUser.status}).`
      );
    }

    // 2. Validar membresía activa en la organización propietaria del proyecto (DA-06)
    if (project.organization_id) {
      const targetMember = await this.orgRepo.findMember(project.organization_id, targetUser.id);
      if (!targetMember || targetMember.status !== 'ACTIVE') {
        throw new ForbiddenException(
          `Violación de segregación institucional (DA-06): El usuario '${targetUser.code}' no es miembro activo de la organización propietaria del proyecto.`
        );
      }
    }

    // 3. Resolver rol funcional canónico (PU-01 a PU-07)
    const role = await this.planningRepo.resolveRole(dto.roleIdOrCode);
    if (!role) {
      throw new BadRequestException(
        `Rol '${dto.roleIdOrCode}' inválido. Debe corresponder a uno de los 7 roles canónicos (PU-01 a PU-07).`
      );
    }

    // 4. Comprobar que no exista asignación activa duplicada
    const existing = await this.planningRepo.findTeamRole(project.id, targetUser.id, role.id);
    if (existing && existing.status === 'ACTIVE') {
      throw new ConflictException(
        `El usuario '${targetUser.code}' ya tiene asignado el rol '${role.code}' (${role.name}) en el proyecto.`
      );
    }

    // 5. Persistencia atómica con compatibilidad en user_project_assignment y auditoría SHA-256
    let teamRole: ProjectTeamRoleEntity;
    if (existing) {
      teamRole = (await this.planningRepo.updateTeamRole(
        existing.id,
        {
          status: 'ACTIVE',
          functional_title: dto.functionalTitle,
          is_lead: dto.isLead,
        },
        client
      ))!;
    } else {
      teamRole = await this.planningRepo.addTeamRole(
        {
          projectId: project.id,
          userId: targetUser.id,
          roleId: role.id,
          functionalTitle: dto.functionalTitle,
          isLead: dto.isLead,
          assignedBy: callerUser.id,
        },
        client
      );
    }

    // Compatibilidad garantizada con user_project_assignment
    await this.projectsRepo.assignUserToProject(targetUser.id, project.id, callerUser.id, client);

    // Actualizar estado del asistente de configuración
    await this.planningRepo.saveSetup(
      project.id,
      {
        team_completed: true,
        last_saved_by: callerUser.id,
      },
      client
    );

    // Auditoría inmutable SHA-256
    await this.auditService.logEvent(
      {
        eventCode: 'PROJECT_TEAM_ROLE_ASSIGNED',
        actorUserId: callerUser.id,
        actorRole: callerUser.activeRoleId,
        operation: 'ASSIGN_TEAM_ROLE',
        entityName: 'project_team_role',
        entityId: teamRole.id,
        projectId: project.id,
        resultStatus: 'SUCCESS',
        payloadDiff: {
          projectId: project.id,
          projectCode: project.code,
          userId: targetUser.id,
          userCode: targetUser.code,
          roleId: role.id,
          roleCode: role.code,
          functionalTitle: dto.functionalTitle,
          isLead: dto.isLead ?? false,
        },
      },
      client
    );

    return {
      ...teamRole,
      role_code: role.code,
      role_name: role.name,
      user_code: targetUser.code,
      user_full_name: targetUser.full_name,
      user_email: targetUser.email,
    };
  }

  async getTeamRoles(
    projectIdOrCode: string,
    callerUser: AuthenticatedUser
  ): Promise<ProjectTeamRoleEntity[]> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    return this.planningRepo.findTeamRolesByProjectId(project.id);
  }

  async updateTeamRoleStatus(
    projectIdOrCode: string,
    roleAssignmentId: string,
    status: 'ACTIVE' | 'INACTIVE',
    callerUser: AuthenticatedUser
  ): Promise<ProjectTeamRoleEntity> {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new BadRequestException(
        `Estado '${status}' inválido para asignación de rol. Debe ser 'ACTIVE' o 'INACTIVE'.`
      );
    }

    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    return await this.db.transaction(async (client) => {
      const assignment = await this.planningRepo.findTeamRoleById(roleAssignmentId, client);
      if (!assignment) {
        throw new NotFoundException(`Asignación de rol '${roleAssignmentId}' no encontrada.`);
      }

      if (assignment.project_id !== project.id) {
        throw new ForbiddenException(
          `Violación de aislamiento por proyecto: La asignación '${roleAssignmentId}' no pertenece al proyecto '${project.code}'.`
        );
      }

      const updated = await this.planningRepo.updateTeamRole(roleAssignmentId, { status }, client);
      if (!updated) {
        throw new NotFoundException(`Asignación de rol '${roleAssignmentId}' no encontrada al actualizar.`);
      }

      await this.auditService.logEvent(
        {
          eventCode: 'TEAM_ROLE_STATUS_UPDATED',
          actorUserId: callerUser.id,
          actorRole: callerUser.activeRoleId,
          operation: 'UPDATE_TEAM_ROLE_STATUS',
          entityName: 'project_team_role',
          entityId: updated.id,
          projectId: project.id,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            roleAssignmentId: updated.id,
            previousStatus: assignment.status,
            newStatus: status,
          },
        },
        client
      );

      return updated;
    });
  }

  // ==========================================================================
  // H03.2 — CONFIGURACIÓN DE METODOLOGÍA (project_methodology)
  // ==========================================================================
  async configureMethodology(
    projectIdOrCode: string,
    dto: ConfigureMethodologyDto,
    callerUser: AuthenticatedUser
  ): Promise<ProjectMethodologyEntity> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    // Validar reglas metodológicas específicas
    if (dto.methodologyType === 'SCRUM') {
      if (!dto.iterationDurationWeeks || dto.iterationDurationWeeks < 1 || dto.iterationDurationWeeks > 8) {
        throw new BadRequestException(
          `La metodología SCRUM exige especificar una duración de iteración (sprint) válida entre 1 y 8 semanas.`
        );
      }
    }

    return await this.db.transaction(async (client) => {
      const methodology = await this.planningRepo.saveMethodology(
        {
          projectId: project.id,
          methodologyType: dto.methodologyType,
          iterationDurationWeeks: dto.iterationDurationWeeks,
          activePhaseCode: dto.activePhaseCode,
          configurationParams: dto.configurationParams,
        },
        client
      );

      // Actualizar estado del asistente
      await this.planningRepo.saveSetup(
        project.id,
        {
          methodology_completed: true,
          last_saved_by: callerUser.id,
        },
        client
      );

      // Auditoría inmutable SHA-256
      await this.auditService.logEvent(
        {
          eventCode: 'PROJECT_METHODOLOGY_CONFIGURED',
          actorUserId: callerUser.id,
          actorRole: callerUser.activeRoleId,
          operation: 'CONFIGURE_METHODOLOGY',
          entityName: 'project_methodology',
          entityId: methodology.id,
          projectId: project.id,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            methodologyType: methodology.methodology_type,
            iterationDurationWeeks: methodology.iteration_duration_weeks,
            activePhaseCode: methodology.active_phase_code,
          },
        },
        client
      );

      return methodology;
    });
  }

  async getMethodology(
    projectIdOrCode: string,
    callerUser: AuthenticatedUser
  ): Promise<ProjectMethodologyEntity | null> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    return this.planningRepo.findMethodologyByProjectId(project.id);
  }

  // ==========================================================================
  // H03.3 — FASES Y CRONOGRAMA (project_phase)
  // ==========================================================================
  async createPhase(
    projectIdOrCode: string,
    dto: CreatePhaseDto,
    callerUser: AuthenticatedUser
  ): Promise<ProjectPhaseEntity> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    // Integridad cronológica estricta: fecha fin >= fecha inicio
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException(
        `Inconsistencia cronológica: La fecha de finalización (${dto.endDate}) no puede ser anterior a la fecha de inicio (${dto.startDate}).`
      );
    }

    // Unicidad de código de fase en el proyecto
    const existingCode = await this.planningRepo.findPhaseByCode(project.id, dto.phaseCode);
    if (existingCode) {
      throw new ConflictException(
        `Ya existe una fase registrada con el código '${dto.phaseCode}' en el proyecto.`
      );
    }

    // Unicidad de orden de secuencia en el proyecto
    const phases = await this.planningRepo.findPhasesByProjectId(project.id);
    if (phases.some((p) => p.sequence_order === dto.sequenceOrder)) {
      throw new ConflictException(
        `Ya existe una fase con el número de secuencia ${dto.sequenceOrder} en el proyecto.`
      );
    }

    const phase = await this.planningRepo.createPhase({
      projectId: project.id,
      phaseCode: dto.phaseCode.toUpperCase(),
      name: dto.name,
      sequenceOrder: dto.sequenceOrder,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: dto.status,
    });

    await this.auditService.logEvent({
      eventCode: 'PROJECT_PHASE_CREATED',
      actorUserId: callerUser.id,
      actorRole: callerUser.activeRoleId,
      operation: 'CREATE_PHASE',
      entityName: 'project_phase',
      entityId: phase.id,
      projectId: project.id,
      resultStatus: 'SUCCESS',
      payloadDiff: {
        phaseCode: phase.phase_code,
        name: phase.name,
        sequenceOrder: phase.sequence_order,
        startDate: phase.start_date,
        endDate: phase.end_date,
      },
    });

    return phase;
  }

  async getPhases(
    projectIdOrCode: string,
    callerUser: AuthenticatedUser
  ): Promise<ProjectPhaseEntity[]> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    return this.planningRepo.findPhasesByProjectId(project.id);
  }

  // ==========================================================================
  // H03.4 — HITOS Y ENTREGABLES (project_milestone, project_deliverable)
  // ==========================================================================
  async createMilestone(
    projectIdOrCode: string,
    dto: CreateMilestoneDto,
    callerUser: AuthenticatedUser
  ): Promise<ProjectMilestoneEntity> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    // Si se especifica fase, verificar que exista y pertenezca al MISMO proyecto
    if (dto.phaseId) {
      const phase = await this.planningRepo.findPhaseById(dto.phaseId);
      if (!phase) {
        throw new NotFoundException(`Fase referenciada '${dto.phaseId}' no encontrada.`);
      }
      if (phase.project_id !== project.id) {
        throw new BadRequestException(
          `Violación de consistencia de proyecto: La fase referenciada '${phase.phase_code}' no pertenece al proyecto actual.`
        );
      }
    }

    // Unicidad de código de hito en el proyecto
    const existing = await this.planningRepo.findMilestoneByCode(project.id, dto.code);
    if (existing) {
      throw new ConflictException(
        `Ya existe un hito registrado con el código '${dto.code}' en el proyecto.`
      );
    }

    const milestone = await this.planningRepo.createMilestone({
      projectId: project.id,
      phaseId: dto.phaseId,
      code: dto.code.toUpperCase(),
      title: dto.title,
      targetDate: dto.targetDate,
      completionDate: dto.completionDate,
      status: dto.status,
    });

    await this.auditService.logEvent({
      eventCode: 'PROJECT_MILESTONE_CREATED',
      actorUserId: callerUser.id,
      actorRole: callerUser.activeRoleId,
      operation: 'CREATE_MILESTONE',
      entityName: 'project_milestone',
      entityId: milestone.id,
      projectId: project.id,
      resultStatus: 'SUCCESS',
      payloadDiff: {
        code: milestone.code,
        title: milestone.title,
        targetDate: milestone.target_date,
        phaseId: milestone.phase_id,
      },
    });

    return milestone;
  }

  async getMilestones(
    projectIdOrCode: string,
    callerUser: AuthenticatedUser
  ): Promise<ProjectMilestoneEntity[]> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    return this.planningRepo.findMilestonesByProjectId(project.id);
  }

  async createDeliverable(
    projectIdOrCode: string,
    dto: CreateDeliverableDto,
    callerUser: AuthenticatedUser
  ): Promise<ProjectDeliverableEntity> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    // 1. Validar pertenencia de fase al mismo proyecto
    if (dto.phaseId) {
      const phase = await this.planningRepo.findPhaseById(dto.phaseId);
      if (!phase) {
        throw new NotFoundException(`Fase referenciada '${dto.phaseId}' no encontrada.`);
      }
      if (phase.project_id !== project.id) {
        throw new BadRequestException(
          `Violación de consistencia: La fase referenciada no pertenece al proyecto actual.`
        );
      }
    }

    // 2. Validar pertenencia de hito al mismo proyecto
    if (dto.milestoneId) {
      const milestone = await this.planningRepo.findMilestoneById(dto.milestoneId);
      if (!milestone) {
        throw new NotFoundException(`Hito referenciado '${dto.milestoneId}' no encontrado.`);
      }
      if (milestone.project_id !== project.id) {
        throw new BadRequestException(
          `Violación de consistencia: El hito referenciado no pertenece al proyecto actual.`
        );
      }
    }

    // 3. Validar responsable: debe ser usuario registrado y miembro activo del equipo del proyecto
    if (dto.responsibleUserId) {
      const respUser = await this.authRepo.findById(dto.responsibleUserId);
      if (!respUser) {
        throw new NotFoundException(`Usuario responsable '${dto.responsibleUserId}' no encontrado.`);
      }
      const teamRoles = await this.planningRepo.findTeamRolesByProjectId(project.id);
      const isTeamMember = teamRoles.some(
        (tr) => tr.user_id === respUser.id && tr.status === 'ACTIVE'
      );
      if (!isTeamMember) {
        throw new BadRequestException(
          `El usuario responsable '${respUser.code}' (${respUser.username}) no está asignado al equipo activo del proyecto.`
        );
      }
    }

    // 4. Unicidad de código de entregable en el proyecto
    const existing = await this.planningRepo.findDeliverableByCode(project.id, dto.code);
    if (existing) {
      throw new ConflictException(
        `Ya existe un entregable registrado con el código '${dto.code}' en el proyecto.`
      );
    }

    const deliverable = await this.planningRepo.createDeliverable({
      projectId: project.id,
      phaseId: dto.phaseId,
      milestoneId: dto.milestoneId,
      code: dto.code.toUpperCase(),
      name: dto.name,
      description: dto.description,
      expectedType: dto.expectedType,
      status: dto.status,
      responsibleUserId: dto.responsibleUserId,
      targetDate: dto.targetDate,
      associatedEcsId: dto.associatedEcsId || null,
    });

    await this.auditService.logEvent({
      eventCode: 'PROJECT_DELIVERABLE_CREATED',
      actorUserId: callerUser.id,
      actorRole: callerUser.activeRoleId,
      operation: 'CREATE_DELIVERABLE',
      entityName: 'project_deliverable',
      entityId: deliverable.id,
      projectId: project.id,
      resultStatus: 'SUCCESS',
      payloadDiff: {
        code: deliverable.code,
        name: deliverable.name,
        expectedType: deliverable.expected_type,
        responsibleUserId: deliverable.responsible_user_id,
        associatedEcsId: deliverable.associated_ecs_id,
      },
    });

    return deliverable;
  }

  async getDeliverables(
    projectIdOrCode: string,
    callerUser: AuthenticatedUser
  ): Promise<ProjectDeliverableEntity[]> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    return this.planningRepo.findDeliverablesByProjectId(project.id);
  }

  // ==========================================================================
  // H03.5 — CONFIGURACIÓN PROGRESIVA Y ASISTENTE (project_setup)
  // ==========================================================================
  async getProjectSetup(
    projectIdOrCode: string,
    callerUser: AuthenticatedUser
  ): Promise<{
    project: ProjectEntity;
    setup: ProjectSetupEntity | null;
    team: ProjectTeamRoleEntity[];
    methodology: ProjectMethodologyEntity | null;
    phases: ProjectPhaseEntity[];
    milestones: ProjectMilestoneEntity[];
    deliverables: ProjectDeliverableEntity[];
  }> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    const [setup, team, methodology, phases, milestones, deliverables] = await Promise.all([
      this.planningRepo.findSetupByProjectId(project.id),
      this.planningRepo.findTeamRolesByProjectId(project.id),
      this.planningRepo.findMethodologyByProjectId(project.id),
      this.planningRepo.findPhasesByProjectId(project.id),
      this.planningRepo.findMilestonesByProjectId(project.id),
      this.planningRepo.findDeliverablesByProjectId(project.id),
    ]);

    return {
      project,
      setup,
      team,
      methodology,
      phases,
      milestones,
      deliverables,
    };
  }

  async saveStep2Team(
    projectIdOrCode: string,
    dto: SaveStep2TeamDto,
    callerUser: AuthenticatedUser
  ): Promise<{ team: ProjectTeamRoleEntity[]; setup: ProjectSetupEntity }> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    if (!dto.members || dto.members.length === 0) {
      throw new BadRequestException('Se debe especificar al menos un integrante del equipo.');
    }

    const planningSnapshot = this.planningRepo.snapshotMockState();
    const assignmentSnapshot = this.projectsRepo.snapshotMockAssignments();

    return await this.db.transaction(async (client) => {
      try {
        const assignedRoles: ProjectTeamRoleEntity[] = [];
        for (const memberDto of dto.members) {
          try {
            const assigned = await this.executeAssignTeamRole(project, memberDto, callerUser, client);
            assignedRoles.push(assigned);
          } catch (err) {
            if (err instanceof ConflictException) {
              const role = await this.planningRepo.resolveRole(memberDto.roleIdOrCode);
              if (role) {
                const existing = await this.planningRepo.findTeamRole(project.id, memberDto.userId, role.id);
                if (existing) {
                  assignedRoles.push(existing);
                  continue;
                }
              }
            }
            throw err;
          }
        }

        const setup = await this.planningRepo.saveSetup(
          project.id,
          {
            wizard_step: 3,
            team_completed: true,
            last_saved_by: callerUser.id,
          },
          client
        );

        return {
          team: assignedRoles,
          setup,
        };
      } catch (error) {
        if (this.db.getDatabaseMode() === 'mock') {
          this.planningRepo.restoreMockState(planningSnapshot);
          this.projectsRepo.restoreMockAssignments(assignmentSnapshot);
        }
        throw error;
      }
    });
  }

  async saveStep3MethodologyPlanning(
    projectIdOrCode: string,
    dto: SaveStep3MethodologyDto,
    callerUser: AuthenticatedUser
  ): Promise<{
    methodology: ProjectMethodologyEntity;
    phases: ProjectPhaseEntity[];
    milestones: ProjectMilestoneEntity[];
    deliverables: ProjectDeliverableEntity[];
    setup: ProjectSetupEntity;
  }> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    return await this.db.transaction(async (client) => {
      // 1. Guardar Metodología
      const methodology = await this.planningRepo.saveMethodology(
        {
          projectId: project.id,
          methodologyType: dto.methodology.methodologyType,
          iterationDurationWeeks: dto.methodology.iterationDurationWeeks,
          activePhaseCode: dto.methodology.activePhaseCode,
          configurationParams: dto.methodology.configurationParams,
        },
        client
      );

      // 2. Guardar Fases si fueron proporcionadas
      const createdPhases: ProjectPhaseEntity[] = [];
      if (dto.phases && dto.phases.length > 0) {
        for (const phaseDto of dto.phases) {
          if (phaseDto.endDate < phaseDto.startDate) {
            throw new BadRequestException(
              `Inconsistencia en fase '${phaseDto.phaseCode}': Fecha fin anterior a fecha inicio.`
            );
          }
          const p = await this.planningRepo.createPhase(
            {
              projectId: project.id,
              phaseCode: phaseDto.phaseCode.toUpperCase(),
              name: phaseDto.name,
              sequenceOrder: phaseDto.sequenceOrder,
              startDate: phaseDto.startDate,
              endDate: phaseDto.endDate,
              status: phaseDto.status,
            },
            client
          );
          createdPhases.push(p);
        }
      }

      // 3. Guardar Hitos si fueron proporcionados
      const createdMilestones: ProjectMilestoneEntity[] = [];
      if (dto.milestones && dto.milestones.length > 0) {
        for (const mDto of dto.milestones) {
          const m = await this.planningRepo.createMilestone(
            {
              projectId: project.id,
              phaseId: mDto.phaseId,
              code: mDto.code.toUpperCase(),
              title: mDto.title,
              targetDate: mDto.targetDate,
              completionDate: mDto.completionDate,
              status: mDto.status,
            },
            client
          );
          createdMilestones.push(m);
        }
      }

      // 4. Guardar Entregables si fueron proporcionados
      const createdDeliverables: ProjectDeliverableEntity[] = [];
      if (dto.deliverables && dto.deliverables.length > 0) {
        for (const dDto of dto.deliverables) {
          const d = await this.planningRepo.createDeliverable(
            {
              projectId: project.id,
              phaseId: dDto.phaseId,
              milestoneId: dDto.milestoneId,
              code: dDto.code.toUpperCase(),
              name: dDto.name,
              description: dDto.description,
              expectedType: dDto.expectedType,
              status: dDto.status,
              responsibleUserId: dDto.responsibleUserId,
              targetDate: dDto.targetDate,
              associatedEcsId: dDto.associatedEcsId,
            },
            client
          );
          createdDeliverables.push(d);
        }
      }

      // 5. Actualizar estado del asistente
      const setup = await this.planningRepo.saveSetup(
        project.id,
        {
          wizard_step: 4,
          methodology_completed: true,
          last_saved_by: callerUser.id,
        },
        client
      );

      // Auditoría SHA-256
      await this.auditService.logEvent(
        {
          eventCode: 'PROJECT_SETUP_STEP3_COMPLETED',
          actorUserId: callerUser.id,
          actorRole: callerUser.activeRoleId,
          operation: 'SAVE_SETUP_STEP_3',
          entityName: 'project_setup',
          entityId: setup.id,
          projectId: project.id,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            methodologyType: methodology.methodology_type,
            phasesCount: createdPhases.length,
            milestonesCount: createdMilestones.length,
            deliverablesCount: createdDeliverables.length,
          },
        },
        client
      );

      return {
        methodology,
        phases: createdPhases,
        milestones: createdMilestones,
        deliverables: createdDeliverables,
        setup,
      };
    });
  }

  async saveDraftProgress(
    projectIdOrCode: string,
    dto: SaveDraftProgressDto,
    callerUser: AuthenticatedUser
  ): Promise<ProjectSetupEntity> {
    const project = await this.getAuthorizedProject(projectIdOrCode, callerUser);
    await this.assertAdminOrManager(project, callerUser);

    const setup = await this.planningRepo.saveSetup(project.id, {
      wizard_step: dto.wizardStep,
      draft_payload: dto.draftPayload,
      last_saved_by: callerUser.id,
    });

    await this.auditService.logEvent({
      eventCode: 'PROJECT_DRAFT_PROGRESS_SAVED',
      actorUserId: callerUser.id,
      actorRole: callerUser.activeRoleId,
      operation: 'SAVE_DRAFT_PROGRESS',
      entityName: 'project_setup',
      entityId: setup.id,
      projectId: project.id,
      resultStatus: 'SUCCESS',
      payloadDiff: {
        wizardStep: setup.wizard_step,
        savedBy: callerUser.code,
      },
    });

    return setup;
  }
}

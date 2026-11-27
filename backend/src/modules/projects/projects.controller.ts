import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import { ProjectPlanningService } from './project-planning.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/index.js';
import { CreateProjectDto } from './dtos/create-project.dto.js';
import { AssignTeamRoleDto } from './dtos/assign-team-role.dto.js';
import { ConfigureMethodologyDto } from './dtos/configure-methodology.dto.js';
import { CreatePhaseDto } from './dtos/create-phase.dto.js';
import { CreateMilestoneDto } from './dtos/create-milestone.dto.js';
import { CreateDeliverableDto } from './dtos/create-deliverable.dto.js';
import {
  SaveDraftProgressDto,
  SaveStep2TeamDto,
  SaveStep3MethodologyDto,
} from './dtos/project-setup.dto.js';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(
    @Inject(ProjectsService) private readonly projectsService: ProjectsService,
    @Inject(ProjectPlanningService) private readonly planningService: ProjectPlanningService
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('PU-09')
  async createProject(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.projectsService.createProject(dto, user);
    return {
      message: 'Proyecto en estado BORRADOR creado exitosamente (DA-01, DA-02)',
      data,
    };
  }

  @Get()
  async getProjects(
    @Query('organizationId') orgId: string | undefined,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.projectsService.getProjectsForUser(user, orgId);
    return {
      total: data.length,
      data,
    };
  }

  @Get(':id')
  async getProject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const project = await this.projectsService.getProjectById(id, user);
    return {
      data: project,
    };
  }

  // ==========================================================================
  // H03.1 — EQUIPO Y ROLES DE PROYECTO (project_team_role, DA-06)
  // ==========================================================================
  @Post(':id/team-members')
  async assignTeamRole(
    @Param('id') id: string,
    @Body() dto: AssignTeamRoleDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.assignTeamRole(id, dto, user);
    return {
      message: 'Rol de proyecto asignado exitosamente al integrante (DA-06)',
      data,
    };
  }

  @Get(':id/team-members')
  async getTeamRoles(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.getTeamRoles(id, user);
    return {
      total: data.length,
      data,
    };
  }

  @Patch(':id/team-members/:roleAssignmentId/status')
  async updateTeamRoleStatus(
    @Param('id') id: string,
    @Param('roleAssignmentId') roleAssignmentId: string,
    @Body('status') status: 'ACTIVE' | 'INACTIVE',
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.updateTeamRoleStatus(id, roleAssignmentId, status, user);
    return {
      message: 'Estado del rol de equipo actualizado exitosamente',
      data,
    };
  }

  // ==========================================================================
  // H03.2 — METODOLOGÍA (project_methodology)
  // ==========================================================================
  @Put(':id/methodology')
  async configureMethodology(
    @Param('id') id: string,
    @Body() dto: ConfigureMethodologyDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.configureMethodology(id, dto, user);
    return {
      message: 'Metodología de proyecto configurada exitosamente',
      data,
    };
  }

  @Get(':id/methodology')
  async getMethodology(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.getMethodology(id, user);
    return {
      data,
    };
  }

  // ==========================================================================
  // H03.3 — FASES Y CRONOGRAMA (project_phase)
  // ==========================================================================
  @Post(':id/phases')
  async createPhase(
    @Param('id') id: string,
    @Body() dto: CreatePhaseDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.createPhase(id, dto, user);
    return {
      message: 'Fase de proyecto creada exitosamente',
      data,
    };
  }

  @Get(':id/phases')
  async getPhases(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.getPhases(id, user);
    return {
      total: data.length,
      data,
    };
  }

  // ==========================================================================
  // H03.4 — HITOS Y ENTREGABLES (project_milestone, project_deliverable)
  // ==========================================================================
  @Post(':id/milestones')
  async createMilestone(
    @Param('id') id: string,
    @Body() dto: CreateMilestoneDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.createMilestone(id, dto, user);
    return {
      message: 'Hito de proyecto creado exitosamente',
      data,
    };
  }

  @Get(':id/milestones')
  async getMilestones(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.getMilestones(id, user);
    return {
      total: data.length,
      data,
    };
  }

  @Post(':id/deliverables')
  async createDeliverable(
    @Param('id') id: string,
    @Body() dto: CreateDeliverableDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.createDeliverable(id, dto, user);
    return {
      message: 'Entregable de proyecto creado exitosamente',
      data,
    };
  }

  @Get(':id/deliverables')
  async getDeliverables(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.getDeliverables(id, user);
    return {
      total: data.length,
      data,
    };
  }

  // ==========================================================================
  // H03.5 — ASISTENTE Y CONFIGURACIÓN PROGRESIVA (project_setup, DA-05)
  // ==========================================================================
  @Get(':id/setup')
  async getProjectSetup(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.getProjectSetup(id, user);
    return {
      data,
    };
  }

  @Put(':id/setup/step-2')
  async saveStep2Team(
    @Param('id') id: string,
    @Body() dto: SaveStep2TeamDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.saveStep2Team(id, dto, user);
    return {
      message: 'Paso 2 completado: Integrantes y roles del equipo configurados (DA-06)',
      data,
    };
  }

  @Put(':id/setup/step-3')
  async saveStep3Methodology(
    @Param('id') id: string,
    @Body() dto: SaveStep3MethodologyDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.saveStep3MethodologyPlanning(id, dto, user);
    return {
      message: 'Paso 3 completado: Metodología, fases, hitos y entregables configurados',
      data,
    };
  }

  @Patch(':id/setup/progress')
  async saveDraftProgress(
    @Param('id') id: string,
    @Body() dto: SaveDraftProgressDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.planningService.saveDraftProgress(id, dto, user);
    return {
      message: 'Progreso de borrador guardado exitosamente',
      data,
    };
  }
}

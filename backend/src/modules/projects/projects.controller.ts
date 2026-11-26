import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/index.js';
import { CreateProjectDto } from './dtos/create-project.dto.js';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(
    @Inject(ProjectsService) private readonly projectsService: ProjectsService
  ) {}

  @Post()
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
}

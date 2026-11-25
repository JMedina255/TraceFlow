import { Controller, Get, Param, UseGuards, Inject } from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/index.js';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly projectsService: ProjectsService) {}

  @Get()
  async getProjects(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.projectsService.getProjectsForUser(user);
    return {
      total: data.length,
      data,
    };
  }

  @Get(':id')
  async getProject(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const project = await this.projectsService.getProjectById(id, user);
    return {
      data: project,
    };
  }
}

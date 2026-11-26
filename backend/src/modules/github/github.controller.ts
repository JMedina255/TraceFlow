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
import { GitHubService } from './github.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/index.js';
import { LinkRepoDto } from './dtos/link-repo.dto.js';
import { CreateRepoDraftDto } from './dtos/create-repo-draft.dto.js';

@Controller('projects/:id/github')
@UseGuards(AuthGuard)
export class GitHubController {
  constructor(
    @Inject(GitHubService) private readonly githubService: GitHubService
  ) {}

  @Get()
  async getStatus(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.githubService.getIntegrationStatus(projectId, user);
    return {
      message: 'Estado de integración GitHub recuperado exitosamente',
      data,
    };
  }

  @Get('available-repos')
  async getAvailableRepos(
    @Param('id') projectId: string,
    @Query('installationId') installationId: string | undefined,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const numericId = installationId ? parseInt(installationId, 10) : undefined;
    const data = await this.githubService.getAvailableRepositories(projectId, numericId, user);
    return {
      total: data.length,
      data,
    };
  }

  @Post('link')
  async linkRepository(
    @Param('id') projectId: string,
    @Body() dto: LinkRepoDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.githubService.linkExistingRepository(projectId, dto, user);
    return {
      message: 'Repositorio GitHub vinculado y validado exitosamente (DA-01, ADR-011)',
      data,
    };
  }

  @Post('validate')
  async validateAccess(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.githubService.validateIntegrationAccess(projectId, user);
    return {
      message: 'Acceso a repositorio GitHub revalidado exitosamente',
      data,
    };
  }

  @Post('unlink')
  async unlinkRepository(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.githubService.unlinkRepository(projectId, user);
    return {
      message: 'Repositorio GitHub desvinculado lógicamente del proyecto',
      data,
    };
  }

  @Post('create-draft')
  async validateCreateDraft(
    @Param('id') projectId: string,
    @Body() dto: CreateRepoDraftDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.githubService.validateRepoDraftContract(projectId, dto, user);
    return {
      message: 'Contrato de creación de repositorio validado exitosamente',
      data,
    };
  }
}

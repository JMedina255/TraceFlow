import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { GitHubController } from './github.controller.js';
import { GitHubService } from './github.service.js';
import { GitHubRepository } from './github.repository.js';
import { HttpGitHubApiClient, MockGitHubApiClient } from './github-api.client.js';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => AuthModule),
    AuditModule,
    forwardRef(() => OrganizationsModule),
    forwardRef(() => ProjectsModule),
  ],
  controllers: [GitHubController],
  providers: [
    GitHubRepository,
    GitHubService,
    {
      provide: 'IGitHubApiClient',
      useFactory: () => {
        const clientMode = process.env.GITHUB_CLIENT_MODE || 'mock';
        if (clientMode === 'live') {
          return new HttpGitHubApiClient();
        }
        return new MockGitHubApiClient();
      },
    },
  ],
  exports: [GitHubService, GitHubRepository, 'IGitHubApiClient'],
})
export class GitHubModule {}

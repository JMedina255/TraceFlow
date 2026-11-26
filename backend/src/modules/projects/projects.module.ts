import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { ProjectsRepository } from './projects.repository.js';
import { ProjectPlanningService } from './project-planning.service.js';
import { ProjectPlanningRepository } from './project-planning.repository.js';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => AuthModule),
    AuditModule,
    forwardRef(() => OrganizationsModule),
  ],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ProjectsRepository,
    ProjectPlanningService,
    ProjectPlanningRepository,
  ],
  exports: [
    ProjectsService,
    ProjectsRepository,
    ProjectPlanningService,
    ProjectPlanningRepository,
  ],
})
export class ProjectsModule {}

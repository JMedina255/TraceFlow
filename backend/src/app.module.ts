import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { OrganizationsModule } from './modules/organizations/organizations.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { RfcsModule } from './modules/rfcs/rfcs.module.js';

@Module({
  imports: [
    DatabaseModule,
    AuditModule,
    HealthModule,
    AuthModule,
    OrganizationsModule,
    ProjectsModule,
    RfcsModule,
  ],
})
export class AppModule {}

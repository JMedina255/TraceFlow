import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { OrganizationsRepository } from './organizations.repository.js';
import { OrganizationsService } from './organizations.service.js';
import { OrganizationsController } from './organizations.controller.js';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => AuthModule),
    AuditModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsRepository, OrganizationsService],
  exports: [OrganizationsRepository, OrganizationsService],
})
export class OrganizationsModule {}

import { Module } from '@nestjs/common';
import { RfcsController } from './rfcs.controller.js';
import { RfcsService } from './rfcs.service.js';
import { RfcsRepository } from './rfcs.repository.js';
import { ProjectsModule } from '../projects/projects.module.js';

@Module({
  imports: [ProjectsModule],
  controllers: [RfcsController],
  providers: [RfcsService, RfcsRepository],
  exports: [RfcsService, RfcsRepository],
})
export class RfcsModule {}

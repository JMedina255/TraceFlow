import { Controller, Get, Post, Param, Query, Body, Req, UseGuards, HttpStatus, HttpCode, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { RfcsService } from './rfcs.service.js';
import { CreateRfcDto } from './dtos/create-rfc.dto.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/index.js';

@Controller('rfcs')
@UseGuards(AuthGuard, RolesGuard)
export class RfcsController {
  constructor(@Inject(RfcsService) private readonly rfcsService: RfcsService) {}

  @Get()
  async getRfcs(
    @CurrentUser() user: AuthenticatedUser,
    @Query('projectId') projectId?: string,
  ) {
    const data = await this.rfcsService.getRfcsForUser(user, projectId);
    return {
      total: data.length,
      data,
    };
  }

  @Get(':id')
  async getRfc(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const rfc = await this.rfcsService.getRfcById(id, user);
    return {
      data: rfc,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('PU-01') // Exclusivo Solicitante según Matriz RBAC / SoD (CU-04)
  async createRfc(
    @Body() dto: CreateRfcDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'TraceFlow Client';

    const rfc = await this.rfcsService.createRfc(dto, user, ip, userAgent);
    return {
      message: 'Solicitud de Cambio (RFC) registrada formalmente con auditoría SHA-256.',
      data: rfc,
    };
  }
}

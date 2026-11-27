import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type {
  AuthenticatedUser,
  CanonicalRoleId,
  InvitationChannel,
  InvitationStatus,
  UserAccountStatus,
} from '../../common/types/index.js';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dtos/create-user.dto.js';
import { UpdateUserDto } from './dtos/update-user.dto.js';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto.js';
import { UpdateUserRolesDto } from './dtos/update-user-roles.dto.js';
import { UpdateProjectCreationAuthDto } from './dtos/update-project-creation-auth.dto.js';
import { CreateInvitationDto } from './dtos/create-invitation.dto.js';
import { UpdateInvitationStatusDto } from './dtos/update-invitation-status.dto.js';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('PU-08')
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get('users')
  async listUsers(
    @Query('search') search?: string,
    @Query('status') status?: UserAccountStatus,
    @Query('role') role?: CanonicalRoleId,
    @Query('canCreateProjects') canCreateProjects?: string
  ) {
    const parsedCanCreate =
      canCreateProjects === 'true' ? true : canCreateProjects === 'false' ? false : undefined;

    const result = await this.usersService.listUsers({
      search,
      status,
      role,
      canCreateProjects: parsedCanCreate,
    });

    return {
      total: result.users.length,
      summary: result.summary,
      data: result.users,
    };
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request
  ) {
    const data = await this.usersService.createUser(
      dto,
      user,
      req.ip || req.socket.remoteAddress || '127.0.0.1',
      req.headers['user-agent'] || 'TraceFlow Client'
    );
    return {
      message: 'Usuario registrado exitosamente con auditoría SHA-256.',
      data,
    };
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string) {
    const data = await this.usersService.getUserDetail(id);
    return {
      data,
    };
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request
  ) {
    const data = await this.usersService.updateUser(
      id,
      dto,
      user,
      req.ip || req.socket.remoteAddress || '127.0.0.1',
      req.headers['user-agent'] || 'TraceFlow Client'
    );
    return {
      message: 'Información básica del usuario actualizada exitosamente.',
      data,
    };
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request
  ) {
    const data = await this.usersService.updateUserStatus(
      id,
      dto,
      user,
      req.ip || req.socket.remoteAddress || '127.0.0.1',
      req.headers['user-agent'] || 'TraceFlow Client'
    );
    return {
      message: 'Estado de cuenta actualizado exitosamente.',
      data,
    };
  }

  @Put('users/:id/roles')
  async updateUserRoles(
    @Param('id') id: string,
    @Body() dto: UpdateUserRolesDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request
  ) {
    const data = await this.usersService.updateUserRoles(
      id,
      dto,
      user,
      req.ip || req.socket.remoteAddress || '127.0.0.1',
      req.headers['user-agent'] || 'TraceFlow Client'
    );
    return {
      message: 'Perfiles operativos actualizados exitosamente.',
      data,
    };
  }

  @Patch('users/:id/project-creation-auth')
  async updateProjectCreationAuth(
    @Param('id') id: string,
    @Body() dto: UpdateProjectCreationAuthDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request
  ) {
    const data = await this.usersService.updateProjectCreationAuth(
      id,
      dto,
      user,
      req.ip || req.socket.remoteAddress || '127.0.0.1',
      req.headers['user-agent'] || 'TraceFlow Client'
    );
    return {
      message: dto.authorized
        ? 'Usuario autorizado exitosamente como Jefe de Proyecto (PU-09).'
        : 'Autorización de creación de proyectos revocada exitosamente.',
      data,
    };
  }

  @Get('invitations')
  async listInvitations(
    @Query('status') status?: InvitationStatus,
    @Query('channel') channel?: InvitationChannel,
    @Query('organizationId') organizationId?: string
  ) {
    const data = await this.usersService.listInvitations({
      status,
      channel,
      organizationId,
    });
    return {
      total: data.length,
      data,
    };
  }

  @Post('invitations')
  @HttpCode(HttpStatus.CREATED)
  async createInvitation(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request
  ) {
    const data = await this.usersService.createInvitation(
      dto,
      user,
      req.ip || req.socket.remoteAddress || '127.0.0.1',
      req.headers['user-agent'] || 'TraceFlow Client'
    );
    return {
      message: 'Invitación registrada como pendiente (sin envío externo).',
      data,
    };
  }

  @Patch('invitations/:id/status')
  async updateInvitationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInvitationStatusDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request
  ) {
    const data = await this.usersService.updateInvitationStatus(
      id,
      dto,
      user,
      req.ip || req.socket.remoteAddress || '127.0.0.1',
      req.headers['user-agent'] || 'TraceFlow Client'
    );
    return {
      message: 'Estado de invitación actualizado exitosamente.',
      data,
    };
  }
}

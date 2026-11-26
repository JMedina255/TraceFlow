import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/index.js';
import { CreateOrganizationDto } from './dtos/create-organization.dto.js';
import { AddMemberDto } from './dtos/add-member.dto.js';
import { UpdateMemberStatusDto } from './dtos/update-member-status.dto.js';

@Controller('organizations')
@UseGuards(AuthGuard)
export class OrganizationsController {
  constructor(
    @Inject(OrganizationsService)
    private readonly orgService: OrganizationsService
  ) {}

  @Post()
  async createOrganization(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.orgService.createOrganization(dto, user);
    return {
      message: 'Organización creada exitosamente',
      data,
    };
  }

  @Get()
  async getOrganizations(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.orgService.getOrganizationsForUser(user);
    return {
      total: data.length,
      data,
    };
  }

  @Get(':idOrSlug')
  async getOrganization(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.orgService.getOrganizationByIdOrSlug(idOrSlug, user);
    return {
      data,
    };
  }

  @Get(':idOrSlug/members')
  async getMembers(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.orgService.getMembers(idOrSlug, user);
    return {
      total: data.length,
      data,
    };
  }

  @Post(':idOrSlug/members')
  async addMember(
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.orgService.addMember(idOrSlug, dto, user);
    return {
      message: 'Miembro incorporado exitosamente a la organización (DA-06)',
      data,
    };
  }

  @Patch(':idOrSlug/members/:userId/status')
  async updateMemberStatus(
    @Param('idOrSlug') idOrSlug: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberStatusDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const data = await this.orgService.updateMemberStatus(idOrSlug, userId, dto, user);
    return {
      message: 'Estado de membresía actualizado exitosamente',
      data,
    };
  }
}

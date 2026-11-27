import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import { DatabaseService } from '../../database/database.service.js';
import { UsersRepository, type UserInvitationEntity } from './users.repository.js';
import { AuthRepository, type UserAccountEntity } from '../auth/auth.repository.js';
import { AuthService } from '../auth/auth.service.js';
import { OrganizationsRepository } from '../organizations/organizations.repository.js';
import { AuditService } from '../audit/audit.service.js';
import type {
  AuthenticatedUser,
  CanonicalRoleId,
  InvitationChannel,
  InvitationStatus,
  UserAccountStatus,
} from '../../common/types/index.js';
import type { CreateUserDto } from './dtos/create-user.dto.js';
import type { UpdateUserDto } from './dtos/update-user.dto.js';
import type { UpdateUserStatusDto } from './dtos/update-user-status.dto.js';
import type { UpdateUserRolesDto } from './dtos/update-user-roles.dto.js';
import type { UpdateProjectCreationAuthDto } from './dtos/update-project-creation-auth.dto.js';
import type { CreateInvitationDto } from './dtos/create-invitation.dto.js';
import type { UpdateInvitationStatusDto } from './dtos/update-invitation-status.dto.js';

export interface SanitizedUserDto {
  id: string;
  code: string;
  username: string;
  email: string;
  fullName: string;
  organization: string;
  position: string;
  status: string;
  primaryRoleCode: CanonicalRoleId;
  assignedRoleCodes: CanonicalRoleId[];
  assignedProjectCodes: string[];
  canCreateProjects: boolean;
  projectCreationAuthorizedBy: string | null;
  projectCreationAuthorizedAt: string | Date | null;
  githubUsername: string | null;
  githubUserId: number | null;
  githubIdentityStatus: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(UsersRepository) private readonly usersRepo: UsersRepository,
    @Inject(AuthRepository) private readonly authRepo: AuthRepository,
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(OrganizationsRepository) private readonly orgRepo: OrganizationsRepository,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  private sanitizeUser(entity: UserAccountEntity): SanitizedUserDto {
    return {
      id: entity.id,
      code: entity.code,
      username: entity.username,
      email: entity.email,
      fullName: entity.full_name,
      organization: entity.organization,
      position: entity.position || '',
      status: entity.status,
      primaryRoleCode: entity.primary_role_code,
      assignedRoleCodes: entity.assigned_role_codes || [],
      assignedProjectCodes: entity.assigned_project_codes || [],
      canCreateProjects: Boolean(entity.can_create_projects),
      projectCreationAuthorizedBy: entity.project_creation_authorized_by ?? null,
      projectCreationAuthorizedAt: entity.project_creation_authorized_at ?? null,
      githubUsername: entity.github_username ?? null,
      githubUserId: entity.github_user_id ?? null,
      githubIdentityStatus: entity.github_identity_status || 'UNVERIFIED',
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }

  async listUsers(filters?: {
    search?: string;
    status?: UserAccountStatus;
    role?: CanonicalRoleId;
    canCreateProjects?: boolean;
  }): Promise<{
    users: SanitizedUserDto[];
    summary: {
      total: number;
      active: number;
      suspended: number;
      inactive: number;
      authorizedProjectManagers: number;
    };
  }> {
    const allUsers = await this.usersRepo.findAllUsers();
    const filteredUsers = await this.usersRepo.findAllUsers(filters);

    return {
      users: filteredUsers.map((u) => this.sanitizeUser(u)),
      summary: {
        total: allUsers.length,
        active: allUsers.filter((u) => u.status === 'ACTIVE').length,
        suspended: allUsers.filter((u) => u.status === 'SUSPENDED').length,
        inactive: allUsers.filter((u) => u.status === 'INACTIVE').length,
        authorizedProjectManagers: allUsers.filter(
          (u) => u.status === 'ACTIVE' && Boolean(u.can_create_projects) && u.assigned_role_codes.includes('PU-09')
        ).length,
      },
    };
  }

  async getUserDetail(idOrCode: string): Promise<SanitizedUserDto> {
    const user = await this.authRepo.findById(idOrCode);
    if (!user) {
      throw new NotFoundException(`Usuario '${idOrCode}' no encontrado.`);
    }
    return this.sanitizeUser(user);
  }

  async createUser(
    dto: CreateUserDto,
    caller: AuthenticatedUser,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SanitizedUserDto> {
    if (!dto.fullName || dto.fullName.trim().length < 3) {
      throw new BadRequestException('El nombre completo debe tener al menos 3 caracteres.');
    }
    if (!dto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email.trim())) {
      throw new BadRequestException('Debe ingresar un correo institucional válido.');
    }
    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException('La contraseña inicial debe tener al menos 8 caracteres.');
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const rawUsername = dto.username?.trim() || normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '_');
    const normalizedUsername = rawUsername.toLowerCase();
    const cleanedGithub = dto.githubUsername?.trim() || null;

    const requestedRoles: CanonicalRoleId[] = (dto.roleCodes || [])
      .map((r) => r.trim().toUpperCase() as CanonicalRoleId)
      .filter((r, i, arr) => arr.indexOf(r) === i);

    if (requestedRoles.includes('PU-08') || dto.primaryRoleCode === 'PU-08') {
      throw new ForbiddenException(
        'Prohibición de seguridad (MVP-H01): No está permitido crear ni elevar cuentas al perfil PU-08 mediante el formulario administrativo general.'
      );
    }

    if ((requestedRoles.includes('PU-09') || dto.primaryRoleCode === 'PU-09') && !dto.authorizeProjectCreation) {
      throw new BadRequestException(
        'El perfil PU-09 (Jefe de Proyecto) se habilita exclusivamente mediante la autorización de creación de proyectos.'
      );
    }

    const operationalRoles = requestedRoles.filter((r) => r !== 'PU-09');
    if (operationalRoles.length === 0 && !dto.authorizeProjectCreation) {
      operationalRoles.push('PU-01');
    }

    if (dto.primaryRoleCode && dto.primaryRoleCode !== 'PU-09' && !operationalRoles.includes(dto.primaryRoleCode)) {
      throw new BadRequestException(
        `El perfil principal '${dto.primaryRoleCode}' debe estar incluido en los perfiles asignados.`
      );
    }

    const existingEmail = await this.authRepo.findByEmail(normalizedEmail);
    if (existingEmail) {
      throw new ConflictException(`Ya existe una cuenta registrada con el correo '${normalizedEmail}'.`);
    }

    const existingUsername = await this.usersRepo.findByUsername(normalizedUsername);
    if (existingUsername) {
      throw new ConflictException(`Ya existe una cuenta registrada con el nombre de usuario '${normalizedUsername}'.`);
    }

    let orgToAssign: { id: string; code: string; name: string } | null = null;
    if (dto.organizationId) {
      const org = await this.orgRepo.findByIdOrSlugOrCode(dto.organizationId);
      if (!org) {
        throw new NotFoundException(`Organización '${dto.organizationId}' no encontrada.`);
      }
      orgToAssign = org;
    }

    const passwordHash = await this.authService.hashPassword(dto.password);
    const initialStatus: UserAccountStatus = dto.status || 'ACTIVE';
    const githubStatus = cleanedGithub ? 'DECLARED' : 'UNVERIFIED';

    const created = await this.db.transaction(async (client) => {
      const code = await this.usersRepo.getNextUserCode(client);
      const userId = crypto.randomUUID();

      await this.usersRepo.createUser(
        {
          id: userId,
          code,
          username: normalizedUsername,
          email: normalizedEmail,
          passwordHash,
          fullName: dto.fullName.trim(),
          organization: orgToAssign ? orgToAssign.name : (dto.organization?.trim() || 'ÉXODO S.A.C.'),
          position: dto.position?.trim() || 'Consultor SCM',
          status: initialStatus,
          githubUsername: cleanedGithub,
          githubIdentityStatus: githubStatus,
        },
        client
      );

      const primaryCode: CanonicalRoleId =
        dto.primaryRoleCode ||
        (operationalRoles.length > 0 ? operationalRoles[0] : 'PU-09');

      for (const rCode of operationalRoles) {
        const roleDef = await this.authRepo.resolveRoleByCode(rCode, client);
        if (!roleDef) {
          throw new BadRequestException(`Perfil canónico inválido: '${rCode}'.`);
        }
        await this.usersRepo.upsertUserRole(
          userId,
          roleDef.id,
          roleDef.code,
          roleDef.code === primaryCode,
          caller.id,
          client
        );
      }

      if (dto.authorizeProjectCreation) {
        const pu09 = await this.authRepo.resolveRoleByCode('PU-09', client);
        if (!pu09) {
          throw new BadRequestException('El perfil canónico PU-09 no existe en el catálogo.');
        }
        await this.usersRepo.upsertUserRole(
          userId,
          pu09.id,
          'PU-09',
          operationalRoles.length === 0 || primaryCode === 'PU-09',
          caller.id,
          client
        );
        await this.usersRepo.setProjectCreationAuthorization(userId, true, caller.id, client);
      }

      if (orgToAssign) {
        await this.orgRepo.addMember(
          {
            organization_id: orgToAssign.id,
            user_id: userId,
            role_in_org: 'MEMBER',
            status: 'ACTIVE',
            added_by: caller.id,
            user_code: code,
            user_full_name: dto.fullName.trim(),
            user_email: normalizedEmail,
          },
          client
        );
      }

      await this.auditService.logEvent(
        {
          eventCode: 'USER_CREATED',
          actorUserId: caller.id,
          actorRole: caller.activeRoleId,
          operation: 'ADMIN_CREATE_USER',
          entityName: 'app_user',
          entityId: userId,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            code,
            username: normalizedUsername,
            email: normalizedEmail,
            status: initialStatus,
            roles: dto.authorizeProjectCreation ? [...operationalRoles, 'PU-09'] : operationalRoles,
            canCreateProjects: Boolean(dto.authorizeProjectCreation),
            githubUsername: cleanedGithub,
            githubIdentityStatus: githubStatus,
          },
          ipAddress,
          userAgent,
        },
        client
      );

      return (await this.authRepo.findById(userId, client))!;
    });

    return this.sanitizeUser(created);
  }

  async updateUser(
    idOrCode: string,
    dto: UpdateUserDto,
    caller: AuthenticatedUser,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SanitizedUserDto> {
    const updated = await this.db.transaction(async (client) => {
      const target = await this.usersRepo.findByIdForUpdate(idOrCode, client);
      if (!target) {
        throw new NotFoundException(`Usuario '${idOrCode}' no encontrado.`);
      }

      const previousValues = {
        fullName: target.full_name,
        position: target.position,
        organization: target.organization,
        githubUsername: target.github_username ?? null,
        githubIdentityStatus: target.github_identity_status ?? 'UNVERIFIED',
      };

      const cleanedGithub =
        dto.githubUsername !== undefined ? (dto.githubUsername.trim() || null) : undefined;
      const nextGithubStatus =
        cleanedGithub !== undefined
          ? (cleanedGithub ? 'DECLARED' : 'UNVERIFIED')
          : undefined;

      await this.usersRepo.updateUserBasicInfo(
        target.id,
        {
          fullName: dto.fullName?.trim(),
          position: dto.position?.trim(),
          organization: dto.organization?.trim(),
          githubUsername: cleanedGithub,
          githubIdentityStatus: nextGithubStatus,
        },
        client
      );

      const refreshed = (await this.authRepo.findById(target.id, client))!;

      await this.auditService.logEvent(
        {
          eventCode: 'USER_UPDATED',
          actorUserId: caller.id,
          actorRole: caller.activeRoleId,
          operation: 'ADMIN_UPDATE_USER',
          entityName: 'app_user',
          entityId: target.id,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            targetUserCode: target.code,
            previousValues,
            newValues: {
              fullName: refreshed.full_name,
              position: refreshed.position,
              organization: refreshed.organization,
              githubUsername: refreshed.github_username ?? null,
              githubIdentityStatus: refreshed.github_identity_status ?? 'UNVERIFIED',
            },
          },
          ipAddress,
          userAgent,
        },
        client
      );

      return refreshed;
    });

    return this.sanitizeUser(updated);
  }

  async updateUserStatus(
    idOrCode: string,
    dto: UpdateUserStatusDto,
    caller: AuthenticatedUser,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SanitizedUserDto> {
    const updated = await this.db.transaction(async (client) => {
      const target = await this.usersRepo.findByIdForUpdate(idOrCode, client);
      if (!target) {
        throw new NotFoundException(`Usuario '${idOrCode}' no encontrado.`);
      }

      if (target.id === caller.id && dto.status !== 'ACTIVE') {
        throw new ForbiddenException(
          'Operación denegada: Un administrador no puede suspender o desactivar su propia cuenta activa.'
        );
      }

      if (target.assigned_role_codes.includes('PU-08') && dto.status !== 'ACTIVE') {
        const activeAdmins = await this.usersRepo.countActiveGlobalAdmins(client, true);
        if (activeAdmins <= 1) {
          throw new BadRequestException(
            'Operación bloqueada: No se puede suspender ni desactivar al último Administrador del Sistema (PU-08) activo.'
          );
        }
      }

      const previousStatus = target.status;
      await this.usersRepo.updateUserStatus(target.id, dto.status, client);

      let revokedSessions = 0;
      if (dto.status !== 'ACTIVE') {
        revokedSessions = await this.authRepo.revokeAllUserSessions(target.id, client);
      }

      const eventCode =
        dto.status === 'SUSPENDED'
          ? 'USER_SUSPENDED'
          : dto.status === 'ACTIVE' && previousStatus !== 'ACTIVE'
            ? 'USER_REACTIVATED'
            : 'USER_STATUS_CHANGED';

      await this.auditService.logEvent(
        {
          eventCode,
          actorUserId: caller.id,
          actorRole: caller.activeRoleId,
          operation: 'ADMIN_UPDATE_USER_STATUS',
          entityName: 'app_user',
          entityId: target.id,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            targetUserCode: target.code,
            previousStatus,
            newStatus: dto.status,
            revokedSessions,
            reason: dto.reason || null,
          },
          ipAddress,
          userAgent,
        },
        client
      );

      return (await this.authRepo.findById(target.id, client))!;
    });

    return this.sanitizeUser(updated);
  }

  async updateUserRoles(
    idOrCode: string,
    dto: UpdateUserRolesDto,
    caller: AuthenticatedUser,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SanitizedUserDto> {
    const requestedCodes = dto.roleCodes
      .map((r) => r.trim().toUpperCase() as CanonicalRoleId)
      .filter((r, i, arr) => arr.indexOf(r) === i);

    if (requestedCodes.includes('PU-08') || dto.primaryRoleCode === 'PU-08') {
      throw new ForbiddenException(
        'Prohibición de escalamiento de privilegios (MVP-H01): No está permitido asignar el perfil PU-08 mediante gestión de perfiles.'
      );
    }

    if (requestedCodes.includes('PU-09')) {
      throw new BadRequestException(
        'Separación de responsabilidades (MVP-H01): El perfil PU-09 se asigna o revoca exclusivamente mediante la autorización de creación de proyectos.'
      );
    }

    const updated = await this.db.transaction(async (client) => {
      const target = await this.usersRepo.findByIdForUpdate(idOrCode, client);
      if (!target) {
        throw new NotFoundException(`Usuario '${idOrCode}' no encontrado.`);
      }

      if (target.id === caller.id) {
        throw new ForbiddenException(
          'Operación denegada (SoD): Un administrador no puede modificar sus propios perfiles desde este endpoint.'
        );
      }

      if (target.assigned_role_codes.includes('PU-08')) {
        const activeAdmins = await this.usersRepo.countActiveGlobalAdmins(client, true);
        if (activeAdmins <= 1) {
          throw new BadRequestException(
            'Operación bloqueada: No se pueden alterar ni revocar los perfiles del último Administrador del Sistema (PU-08) activo.'
          );
        }
      }

      const previousRoles = [...target.assigned_role_codes];
      const hasActivePU09 = previousRoles.includes('PU-09');
      const finalActiveRoles: CanonicalRoleId[] = hasActivePU09
        ? [...requestedCodes, 'PU-09']
        : [...requestedCodes];

      const primaryCode: CanonicalRoleId =
        dto.primaryRoleCode && finalActiveRoles.includes(dto.primaryRoleCode)
          ? dto.primaryRoleCode
          : finalActiveRoles[0];

      // Activar / actualizar roles incluidos
      for (const rCode of finalActiveRoles) {
        const roleDef = await this.authRepo.resolveRoleByCode(rCode, client);
        if (!roleDef) {
          throw new BadRequestException(`Perfil canónico inválido: '${rCode}'.`);
        }
        await this.usersRepo.upsertUserRole(
          target.id,
          roleDef.id,
          roleDef.code,
          roleDef.code === primaryCode,
          caller.id,
          client
        );
      }

      // Revocar lógicamente los roles operativos anteriores que ya no estén en finalActiveRoles
      const revokedCodes: CanonicalRoleId[] = [];
      for (const prevCode of previousRoles) {
        if (!finalActiveRoles.includes(prevCode)) {
          const prevRoleDef = await this.authRepo.resolveRoleByCode(prevCode, client);
          if (prevRoleDef) {
            await this.usersRepo.revokeUserRole(target.id, prevRoleDef.id, prevCode, caller.id, client);
            await this.authRepo.revokeUserRoleSessions(target.id, prevRoleDef.id, client);
            revokedCodes.push(prevCode);
          }
        }
      }

      await this.auditService.logEvent(
        {
          eventCode: 'USER_ROLES_UPDATED',
          actorUserId: caller.id,
          actorRole: caller.activeRoleId,
          operation: 'ADMIN_UPDATE_USER_ROLES',
          entityName: 'user_role_assignment',
          entityId: target.id,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            targetUserCode: target.code,
            previousRoles,
            newRoles: finalActiveRoles,
            revokedRoles: revokedCodes,
            primaryRole: primaryCode,
          },
          ipAddress,
          userAgent,
        },
        client
      );

      return (await this.authRepo.findById(target.id, client))!;
    });

    return this.sanitizeUser(updated);
  }

  async updateProjectCreationAuth(
    idOrCode: string,
    dto: UpdateProjectCreationAuthDto,
    caller: AuthenticatedUser,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SanitizedUserDto> {
    const updated = await this.db.transaction(async (client) => {
      const target = await this.usersRepo.findByIdForUpdate(idOrCode, client);
      if (!target) {
        throw new NotFoundException(`Usuario '${idOrCode}' no encontrado.`);
      }

      if (dto.authorized && target.status !== 'ACTIVE') {
        throw new BadRequestException(
          `No se puede autorizar como Jefe de Proyecto a la cuenta '${target.code}' porque su estado es '${target.status}'.`
        );
      }

      const pu09 = await this.authRepo.resolveRoleByCode('PU-09', client);
      if (!pu09) {
        throw new BadRequestException('El perfil PU-09 no se encuentra registrado en app_role.');
      }

      const previousCanCreate = Boolean(target.can_create_projects);
      const previousRoles = [...target.assigned_role_codes];

      if (dto.authorized) {
        const shouldBePrimary = target.assigned_role_codes.length === 0 || target.primary_role_code === 'PU-09';
        await this.usersRepo.upsertUserRole(
          target.id,
          pu09.id,
          'PU-09',
          shouldBePrimary,
          caller.id,
          client
        );
        await this.usersRepo.setProjectCreationAuthorization(target.id, true, caller.id, client);
      } else {
        await this.usersRepo.setProjectCreationAuthorization(target.id, false, caller.id, client);
        await this.usersRepo.revokeUserRole(target.id, pu09.id, 'PU-09', caller.id, client);
        await this.authRepo.revokeUserRoleSessions(target.id, pu09.id, client);
      }

      const refreshed = (await this.authRepo.findById(target.id, client))!;

      await this.auditService.logEvent(
        {
          eventCode: dto.authorized
            ? 'USER_PRJ_CREATION_AUTHORIZED'
            : 'USER_PRJ_CREATION_REVOKED',
          actorUserId: caller.id,
          actorRole: caller.activeRoleId,
          operation: dto.authorized
            ? 'ADMIN_AUTHORIZE_PROJECT_MANAGER'
            : 'ADMIN_REVOKE_PROJECT_MANAGER',
          entityName: 'app_user',
          entityId: target.id,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            targetUserCode: target.code,
            previousCanCreateProjects: previousCanCreate,
            newCanCreateProjects: dto.authorized,
            previousRoles,
            newRoles: refreshed.assigned_role_codes,
            reason: dto.reason || null,
          },
          ipAddress,
          userAgent,
        },
        client
      );

      return refreshed;
    });

    return this.sanitizeUser(updated);
  }

  // ==========================================================================
  // INVITACIONES PENDIENTES (UI + VALIDACIONES + PERSISTENCIA SIN SERVICIO EXTERNO)
  // ==========================================================================
  async listInvitations(filters?: {
    status?: InvitationStatus;
    channel?: InvitationChannel;
    organizationId?: string;
  }): Promise<UserInvitationEntity[]> {
    return this.usersRepo.findInvitations(filters);
  }

  async createInvitation(
    dto: CreateInvitationDto,
    caller: AuthenticatedUser,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserInvitationEntity> {
    const intendedRoleCode = dto.intendedRoleCode.trim().toUpperCase() as CanonicalRoleId;

    if (intendedRoleCode === 'PU-08') {
      throw new ForbiddenException(
        'Prohibición de seguridad (MVP-H01): No está permitido asignar el perfil PU-08 (Administrador del Sistema) mediante invitaciones.'
      );
    }

    const roleDef = await this.authRepo.resolveRoleByCode(intendedRoleCode);
    if (!roleDef) {
      throw new BadRequestException(`El perfil propuesto '${intendedRoleCode}' no es válido.`);
    }

    let email: string | null = null;
    let githubUsername: string | null = null;
    let recipient = '';

    if (dto.channel === 'EMAIL') {
      if (!dto.email || !dto.email.trim()) {
        throw new BadRequestException('El correo electrónico es obligatorio cuando el canal es EMAIL.');
      }
      email = dto.email.trim().toLowerCase();
      recipient = email;
    } else if (dto.channel === 'GITHUB') {
      if (!dto.githubUsername || !dto.githubUsername.trim()) {
        throw new BadRequestException('El nombre de usuario de GitHub es obligatorio cuando el canal es GITHUB.');
      }
      githubUsername = dto.githubUsername.trim().replace(/^@/, '');
      recipient = githubUsername;
    } else {
      throw new BadRequestException('Canal de invitación inválido.');
    }

    let resolvedOrg: { id: string; code: string; name: string } | null = null;
    if (dto.organizationId) {
      const org = await this.orgRepo.findByIdOrSlugOrCode(dto.organizationId);
      if (!org) {
        throw new NotFoundException(`Organización '${dto.organizationId}' no encontrada.`);
      }
      resolvedOrg = org;
    }

    let expiresAtIso: string | null = null;
    if (dto.expiresAt) {
      const parsed = new Date(dto.expiresAt);
      if (isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        throw new BadRequestException('La fecha de expiración debe ser una fecha futura válida.');
      }
      expiresAtIso = parsed.toISOString();
    }

    return this.db.transaction(async (client) => {
      const duplicate = await this.usersRepo.findDuplicatePendingInvitation(
        {
          channel: dto.channel,
          recipient,
          organizationId: resolvedOrg?.id || null,
          projectId: dto.projectId || null,
          intendedRoleId: roleDef.id,
        },
        client
      );

      if (duplicate) {
        throw new ConflictException(
          `Ya existe una invitación PENDING para '${recipient}' con el perfil '${roleDef.code}' en el mismo ámbito.`
        );
      }

      const invitation = await this.usersRepo.createInvitation(
        {
          channel: dto.channel,
          email,
          githubUsername,
          organizationId: resolvedOrg?.id || null,
          organizationCode: resolvedOrg?.code || null,
          organizationName: resolvedOrg?.name || null,
          projectId: dto.projectId || null,
          intendedRoleId: roleDef.id,
          intendedRoleCode: roleDef.code,
          intendedRoleName: roleDef.name,
          invitedBy: caller.id,
          invitedByCode: caller.code,
          invitedByName: caller.fullName,
          notes: dto.notes?.trim() || null,
          expiresAt: expiresAtIso,
        },
        client
      );

      await this.auditService.logEvent(
        {
          eventCode: 'USER_INVITATION_CREATED',
          actorUserId: caller.id,
          actorRole: caller.activeRoleId,
          operation: 'ADMIN_CREATE_INVITATION',
          entityName: 'user_invitation',
          entityId: invitation.id,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            channel: invitation.channel,
            recipient,
            intendedRoleCode: roleDef.code,
            organizationId: resolvedOrg?.id || null,
            status: 'PENDING',
          },
          ipAddress,
          userAgent,
        },
        client
      );

      return invitation;
    });
  }

  async updateInvitationStatus(
    invitationId: string,
    dto: UpdateInvitationStatusDto,
    caller: AuthenticatedUser,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserInvitationEntity> {
    if (dto.status === 'ACCEPTED') {
      throw new ForbiddenException(
        'Operación bloqueada (MVP-H01): La aceptación externa de invitaciones no está habilitada hasta contar con verificación formal de identidad.'
      );
    }

    if (dto.status !== 'CANCELLED' && dto.status !== 'EXPIRED') {
      throw new BadRequestException(
        `Transición de estado de invitación no permitida: '${dto.status}'.`
      );
    }

    return this.db.transaction(async (client) => {
      const existing = await this.usersRepo.findInvitationById(invitationId, client);
      if (!existing) {
        throw new NotFoundException(`Invitación '${invitationId}' no encontrada.`);
      }

      if (existing.status !== 'PENDING') {
        throw new BadRequestException(
          `Solo se pueden cancelar o expirar invitaciones en estado PENDING (estado actual: '${existing.status}').`
        );
      }

      const updated = await this.usersRepo.updateInvitationStatus(
        existing.id,
        dto.status,
        caller.id,
        client
      );

      await this.auditService.logEvent(
        {
          eventCode:
            dto.status === 'CANCELLED' ? 'USER_INVITATION_CANCELLED' : 'USER_INVITATION_EXPIRED',
          actorUserId: caller.id,
          actorRole: caller.activeRoleId,
          operation: 'ADMIN_UPDATE_INVITATION_STATUS',
          entityName: 'user_invitation',
          entityId: existing.id,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            previousStatus: existing.status,
            newStatus: dto.status,
            reason: dto.reason || null,
          },
          ipAddress,
          userAgent,
        },
        client
      );

      return updated;
    });
  }
}

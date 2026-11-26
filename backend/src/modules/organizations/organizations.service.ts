import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  OrganizationsRepository,
  OrganizationEntity,
  OrganizationMemberEntity,
} from './organizations.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { AuditService } from '../audit/audit.service.js';
import type { AuthenticatedUser } from '../../common/types/index.js';
import type { CreateOrganizationDto } from './dtos/create-organization.dto.js';
import type { AddMemberDto } from './dtos/add-member.dto.js';
import type { UpdateMemberStatusDto } from './dtos/update-member-status.dto.js';

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(OrganizationsRepository)
    private readonly orgRepo: OrganizationsRepository,
    @Inject(forwardRef(() => AuthRepository))
    private readonly authRepo: AuthRepository,
    @Inject(AuditService)
    private readonly auditService: AuditService
  ) {}

  async createOrganization(
    dto: CreateOrganizationDto,
    user: AuthenticatedUser
  ): Promise<OrganizationEntity> {
    const totalCount = await this.orgRepo.count();

    if (totalCount === 0) {
      // Regla Bootstrap: La primera organización puede ser inicializada por el rol PU-02 Gestor
      const isPU02 =
        user.activeRoleId === 'PU-02' ||
        user.allowedRoleIds.includes('PU-02');
      if (!isPU02) {
        throw new ForbiddenException(
          'Acceso denegado: La inicialización de la primera organización del sistema requiere el rol PU-02 (Gestor de Configuración).'
        );
      }
    } else {
      // Regla Organizaciones Subsiguientes: No todos los usuarios PU-02 pueden crear organizaciones.
      // Debe ser OWNER de una organización existente o contar con autorización administrativa explícita.
      const userOrgs = await this.orgRepo.findOrganizationsForUser(user.id);
      let isOwnerInAny = false;
      for (const org of userOrgs) {
        const mem = await this.orgRepo.findMember(org.id, user.id);
        if (mem && mem.role_in_org === 'OWNER' && mem.status === 'ACTIVE') {
          isOwnerInAny = true;
          break;
        }
      }

      if (!isOwnerInAny) {
        throw new ForbiddenException(
          'Acceso denegado: Se requiere rol de Propietario (OWNER) u autorización administrativa explícita para crear nuevas organizaciones.'
        );
      }
    }

    // Validación de unicidad de código y slug
    const existingCode = await this.orgRepo.findByCode(dto.code);
    if (existingCode) {
      throw new ConflictException(
        `Ya existe una organización registrada con el código '${dto.code}'.`
      );
    }

    const existingSlug = await this.orgRepo.findBySlug(dto.slug);
    if (existingSlug) {
      throw new ConflictException(
        `Ya existe una organización registrada con el slug '${dto.slug}'.`
      );
    }

    const org = await this.orgRepo.create({
      code: dto.code,
      name: dto.name,
      slug: dto.slug,
      legal_name: dto.legalName,
      tax_id: dto.taxId,
      status: 'ACTIVE',
      created_by: user.id,
    });

    // DA-06: El creador se incorpora automáticamente como OWNER activo
    await this.orgRepo.addMember({
      organization_id: org.id,
      user_id: user.id,
      role_in_org: 'OWNER',
      status: 'ACTIVE',
      added_by: user.id,
      user_code: user.code,
      user_full_name: user.fullName,
      user_email: user.email,
    });

    // Auditoría inmutable SHA-256
    await this.auditService.logEvent({
      eventCode: 'ORG_CREATED',
      actorUserId: user.id,
      actorRole: user.activeRoleId,
      operation: 'CREATE',
      entityName: 'organization',
      entityId: org.id,
      resultStatus: 'SUCCESS',
      payloadDiff: {
        code: org.code,
        name: org.name,
        slug: org.slug,
        createdBy: user.code,
      },
    });

    return org;
  }

  async getOrganizationsForUser(
    user: AuthenticatedUser
  ): Promise<OrganizationEntity[]> {
    return this.orgRepo.findOrganizationsForUser(user.id);
  }

  async getOrganizationByIdOrSlug(
    idOrSlug: string,
    user: AuthenticatedUser
  ): Promise<OrganizationEntity> {
    const org = await this.orgRepo.findByIdOrSlugOrCode(idOrSlug);
    if (!org) {
      throw new NotFoundException(
        `Organización '${idOrSlug}' no encontrada.`
      );
    }

    // Aislamiento multitenant institucional: El usuario debe ser miembro activo
    const member = await this.orgRepo.findMember(org.id, user.id);
    if (!member || member.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `Acceso denegado: El usuario '${user.code}' no es miembro activo de la organización '${org.code}'.`
      );
    }

    return org;
  }

  async getMembers(
    idOrSlug: string,
    user: AuthenticatedUser
  ): Promise<OrganizationMemberEntity[]> {
    const org = await this.getOrganizationByIdOrSlug(idOrSlug, user);
    return this.orgRepo.findMembersByOrgId(org.id);
  }

  async addMember(
    idOrSlug: string,
    dto: AddMemberDto,
    user: AuthenticatedUser
  ): Promise<OrganizationMemberEntity> {
    const org = await this.orgRepo.findByIdOrSlugOrCode(idOrSlug);
    if (!org) {
      throw new NotFoundException(
        `Organización '${idOrSlug}' no encontrada.`
      );
    }

    // Verificación de privilegios: Solo OWNER o ADMIN de la organización puede incorporar
    const callerMember = await this.orgRepo.findMember(org.id, user.id);
    if (
      !callerMember ||
      callerMember.status !== 'ACTIVE' ||
      !['OWNER', 'ADMIN'].includes(callerMember.role_in_org)
    ) {
      throw new ForbiddenException(
        'Acceso denegado: Solo los propietarios o administradores de la organización pueden incorporar miembros.'
      );
    }

    // DA-06: Incorporación exclusiva de usuarios previamente registrados y autorizados
    let targetUser = await this.authRepo.findById(dto.userCodeOrEmailOrId);
    if (!targetUser) {
      targetUser = await this.authRepo.findByEmail(dto.userCodeOrEmailOrId);
    }

    if (!targetUser) {
      throw new NotFoundException(
        `Usuario '${dto.userCodeOrEmailOrId}' no registrado. La incorporación está restringida exclusivamente a usuarios previamente registrados en la plataforma (DA-06).`
      );
    }

    if (targetUser.status !== 'ACTIVE') {
      throw new BadRequestException(
        `El usuario '${targetUser.code}' no se encuentra en estado ACTIVO y no puede ser incorporado.`
      );
    }

    // Verificar si ya es miembro
    const existingMember = await this.orgRepo.findMember(org.id, targetUser.id);
    if (existingMember) {
      throw new ConflictException(
        `El usuario '${targetUser.code}' ya es miembro de la organización '${org.code}'.`
      );
    }

    const member = await this.orgRepo.addMember({
      organization_id: org.id,
      user_id: targetUser.id,
      role_in_org: dto.roleInOrg || 'MEMBER',
      status: 'ACTIVE',
      added_by: user.id,
      user_code: targetUser.code,
      user_full_name: targetUser.full_name,
      user_email: targetUser.email,
    });

    // Auditoría
    await this.auditService.logEvent({
      eventCode: 'ORG_MEMBER_ADDED',
      actorUserId: user.id,
      actorRole: user.activeRoleId,
      operation: 'CREATE',
      entityName: 'organization_member',
      entityId: member.id,
      resultStatus: 'SUCCESS',
      payloadDiff: {
        organizationId: org.id,
        organizationCode: org.code,
        addedUserId: targetUser.id,
        addedUserCode: targetUser.code,
        roleInOrg: member.role_in_org,
      },
    });

    return member;
  }

  async updateMemberStatus(
    idOrSlug: string,
    targetUserIdOrCode: string,
    dto: UpdateMemberStatusDto,
    user: AuthenticatedUser
  ): Promise<OrganizationMemberEntity> {
    const org = await this.orgRepo.findByIdOrSlugOrCode(idOrSlug);
    if (!org) {
      throw new NotFoundException(`Organización '${idOrSlug}' no encontrada.`);
    }

    const callerMember = await this.orgRepo.findMember(org.id, user.id);
    if (
      !callerMember ||
      callerMember.status !== 'ACTIVE' ||
      !['OWNER', 'ADMIN'].includes(callerMember.role_in_org)
    ) {
      throw new ForbiddenException(
        'Acceso denegado: Solo los propietarios o administradores de la organización pueden modificar el estado de un miembro.'
      );
    }

    let targetUser = await this.authRepo.findById(targetUserIdOrCode);
    if (!targetUser) {
      targetUser = await this.authRepo.findByEmail(targetUserIdOrCode);
    }
    const targetUserId = targetUser ? targetUser.id : targetUserIdOrCode;

    const targetMember = await this.orgRepo.findMember(org.id, targetUserId);
    if (!targetMember) {
      throw new NotFoundException(
        `Membresía no encontrada para el usuario '${targetUserIdOrCode}' en la organización '${org.code}'.`
      );
    }

    // Regla de salvaguarda de gobernanza: ADMIN no puede suspender a un OWNER
    if (callerMember.role_in_org === 'ADMIN' && targetMember.role_in_org === 'OWNER') {
      throw new ForbiddenException(
        'Acceso denegado: Un administrador no puede suspender ni modificar el estado de un propietario.'
      );
    }

    // Prohibición de dejar a la organización sin propietarios
    if (targetMember.role_in_org === 'OWNER' && dto.status === 'SUSPENDED') {
      const allMembers = await this.orgRepo.findMembersByOrgId(org.id);
      const activeOwners = allMembers.filter(
        (m) => m.role_in_org === 'OWNER' && m.status === 'ACTIVE'
      );
      if (activeOwners.length <= 1) {
        throw new BadRequestException(
          'Acción bloqueada: No se puede suspender al único propietario activo de la organización.'
        );
      }
    }

    await this.orgRepo.updateMemberStatus(org.id, targetUserId, dto.status);
    targetMember.status = dto.status;

    await this.auditService.logEvent({
      eventCode: 'ORG_MEMBER_STATUS_CHANGED',
      actorUserId: user.id,
      actorRole: user.activeRoleId,
      operation: 'UPDATE',
      entityName: 'organization_member',
      entityId: targetMember.id,
      resultStatus: 'SUCCESS',
      payloadDiff: {
        organizationId: org.id,
        targetUserId,
        previousStatus: targetMember.status,
        newStatus: dto.status,
      },
    });

    return targetMember;
  }
}

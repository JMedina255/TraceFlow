import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ProjectsRepository, ProjectEntity } from './projects.repository.js';
import { OrganizationsRepository } from '../organizations/organizations.repository.js';
import { AuditService } from '../audit/audit.service.js';
import type { AuthenticatedUser } from '../../common/types/index.js';
import { normalizeProjectStatus } from '../../common/types/index.js';
import type { CreateProjectDto } from './dtos/create-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(ProjectsRepository)
    private readonly projectsRepo: ProjectsRepository,
    @Inject(forwardRef(() => OrganizationsRepository))
    private readonly orgRepo: OrganizationsRepository,
    @Inject(AuditService)
    private readonly auditService: AuditService
  ) {}

  async createProject(
    dto: CreateProjectDto,
    user: AuthenticatedUser
  ): Promise<ProjectEntity> {
    // 1. Validar que la organización exista y esté activa (DA-02)
    const org = await this.orgRepo.findByIdOrSlugOrCode(dto.organizationId);
    if (!org) {
      throw new NotFoundException(
        `Organización '${dto.organizationId}' no encontrada. La creación de proyectos requiere una organización válida (DA-02).`
      );
    }

    if (org.status !== 'ACTIVE') {
      throw new BadRequestException(
        `La organización '${org.code}' se encuentra en estado ${org.status} y no admite nuevos proyectos.`
      );
    }

    // 2. Validar membresía y permisos del usuario en la organización (DA-06)
    const member = await this.orgRepo.findMember(org.id, user.id);
    if (!member || member.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `Acceso denegado: El usuario '${user.code}' no es miembro activo de la organización '${org.code}' (DA-06).`
      );
    }

    const hasCreationPermission =
      ['OWNER', 'ADMIN'].includes(member.role_in_org) ||
      user.activeRoleId === 'PU-02' ||
      user.allowedRoleIds.includes('PU-02');

    if (!hasCreationPermission) {
      throw new ForbiddenException(
        `Acceso denegado: Se requiere rol de Propietario (OWNER), Administrador de la organización o Gestor PU-02 para registrar proyectos.`
      );
    }

    // 3. Validar unicidad de código y clave nemotécnica
    const existingCode = await this.projectsRepo.findByCode(dto.code);
    if (existingCode) {
      throw new ConflictException(
        `Ya existe un proyecto registrado con el código '${dto.code}'.`
      );
    }

    const existingKey = await this.projectsRepo.findByKey(dto.projectKey);
    if (existingKey) {
      throw new ConflictException(
        `Ya existe un proyecto registrado con la clave '${dto.projectKey}'.`
      );
    }

    // 4. Crear proyecto en estado estrictamente BORRADOR (no activo en este hito)
    const project = await this.projectsRepo.create({
      code: dto.code.toUpperCase(),
      project_key: dto.projectKey.toUpperCase(),
      name: dto.name,
      description: dto.description || '',
      client_name: dto.clientName,
      status: 'BORRADOR',
      organization_id: org.id,
      created_by: user.id,
      manager_id: user.id,
    });

    // 5. Asignar al creador como integrante del proyecto
    await this.projectsRepo.assignUserToProject(user.id, project.id, user.id);
    if (!user.assignedProjectIds.includes(project.code)) {
      user.assignedProjectIds.push(project.code);
    }
    if (!user.assignedProjectIds.includes(project.id)) {
      user.assignedProjectIds.push(project.id);
    }

    // 6. Auditoría inmutable SHA-256
    await this.auditService.logEvent({
      eventCode: 'PRJ_CREATED_DRAFT',
      actorUserId: user.id,
      actorRole: user.activeRoleId,
      operation: 'CREATE',
      entityName: 'project',
      entityId: project.id,
      projectId: project.id,
      resultStatus: 'SUCCESS',
      payloadDiff: {
        code: project.code,
        projectKey: project.project_key,
        name: project.name,
        organizationId: org.id,
        organizationCode: org.code,
        status: 'BORRADOR',
        createdBy: user.code,
      },
    });

    return {
      ...project,
      status: normalizeProjectStatus(project.status),
    };
  }

  async getProjectsForUser(
    user: AuthenticatedUser,
    organizationIdFilter?: string
  ): Promise<ProjectEntity[]> {
    const allProjects = await this.projectsRepo.findAll();
    const userOrgs = await this.orgRepo.findOrganizationsForUser(user.id);
    const userOrgIds = userOrgs.map((o) => o.id);

    let targetOrgId: string | null = null;
    if (organizationIdFilter) {
      const org = await this.orgRepo.findByIdOrSlugOrCode(organizationIdFilter);
      if (!org || !userOrgIds.includes(org.id)) {
        throw new ForbiddenException(
          `Acceso denegado: El usuario no tiene autorización sobre la organización solicitada.`
        );
      }
      targetOrgId = org.id;
    }

    // Recuperar asignaciones dinámicas del usuario en la base de datos o mock
    const dynamicAssignments = await this.projectsRepo.findUserProjectAssignments(user.id);

    // Aislamiento multitenant estricto (ADR-006 / DA-01, DA-02):
    // 1. El proyecto debe pertenecer a una organización donde el usuario es miembro activo
    // 2. El usuario debe estar asignado al proyecto O ser OWNER/ADMIN de la organización propietaria
    return allProjects
      .filter((p) => {
        // Validación de pertenencia a organización del usuario
        // Si el proyecto histórico no tiene organization_id aún, se asocia por defecto a la org institucional
        const orgMatch = p.organization_id
          ? userOrgIds.includes(p.organization_id)
          : true;

        if (!orgMatch) return false;

        if (targetOrgId && p.organization_id !== targetOrgId) {
          return false;
        }

        // Validación de asignación o propiedad
        const isAssigned =
          user.assignedProjectIds.includes(p.code) ||
          user.assignedProjectIds.includes(p.id) ||
          dynamicAssignments.includes(p.id) ||
          p.created_by === user.id;

        return isAssigned;
      })
      .map((p) => ({
        ...p,
        status: normalizeProjectStatus(p.status),
      }));
  }

  async getProjectById(
    idOrCode: string,
    user: AuthenticatedUser
  ): Promise<ProjectEntity> {
    const project = await this.projectsRepo.findByIdOrCode(idOrCode);
    if (!project) {
      throw new NotFoundException(`Proyecto '${idOrCode}' no encontrado.`);
    }

    // Verificación de aislamiento organizacional (DA-02)
    if (project.organization_id) {
      const member = await this.orgRepo.findMember(project.organization_id, user.id);
      if (!member || member.status !== 'ACTIVE') {
        throw new ForbiddenException(
          `Acceso denegado: El usuario '${user.code}' no es miembro de la organización propietaria del proyecto.`
        );
      }
    }

    // Verificación de asignación directa
    const dynamicAssignments = await this.projectsRepo.findUserProjectAssignments(user.id);
    const hasAccess =
      user.assignedProjectIds.includes(project.code) ||
      user.assignedProjectIds.includes(project.id) ||
      dynamicAssignments.includes(project.id) ||
      project.created_by === user.id;

    if (!hasAccess) {
      throw new ForbiddenException(
        `Acceso no autorizado: El usuario '${user.code}' no tiene asignado el proyecto '${project.code}'.`
      );
    }

    const ecs = await this.projectsRepo.findEcsByProjectId(project.id);
    return {
      ...project,
      status: normalizeProjectStatus(project.status),
      ecs,
    };
  }
}

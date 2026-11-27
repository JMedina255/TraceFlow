import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import { ProjectsRepository, ProjectEntity } from './projects.repository.js';
import { OrganizationsRepository } from '../organizations/organizations.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { AuditService } from '../audit/audit.service.js';
import type { AuthenticatedUser } from '../../common/types/index.js';
import { normalizeProjectStatus } from '../../common/types/index.js';
import type { CreateProjectDto } from './dtos/create-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(DatabaseService)
    private readonly db: DatabaseService,
    @Inject(ProjectsRepository)
    private readonly projectsRepo: ProjectsRepository,
    @Inject(forwardRef(() => OrganizationsRepository))
    private readonly orgRepo: OrganizationsRepository,
    @Inject(AuditService)
    private readonly auditService: AuditService,
    @Optional()
    @Inject(forwardRef(() => AuthRepository))
    private readonly authRepo?: AuthRepository
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

    // 2. Política estricta MVP-H01 de creación de proyectos:
    //    - Perfil efectivo activo PU-09 (Jefe de Proyecto)
    //    - Autorización vigente can_create_projects = true
    //    - Membresía activa en la organización propietaria (DA-06)
    //    Sin rutas de compatibilidad para PU-02 ni OWNER/ADMIN sin autorización PU-09.
    if (user.activeRoleId !== 'PU-09') {
      throw new ForbiddenException(
        `Acceso denegado (MVP-H01): La creación de proyectos requiere operar con el perfil activo PU-09 (Jefe de Proyecto). Rol actual: '${user.activeRoleId}'.`
      );
    }

    if (this.authRepo) {
      const liveUser = await this.authRepo.findById(user.id);
      if (
        !liveUser ||
        liveUser.status !== 'ACTIVE' ||
        !Boolean(liveUser.can_create_projects) ||
        !liveUser.assigned_role_codes.includes('PU-09')
      ) {
        throw new ForbiddenException(
          `Acceso denegado (MVP-H01): La cuenta '${user.code}' no posee autorización vigente para crear proyectos (can_create_projects = true y perfil PU-09 activo).`
        );
      }
    } else if (!user.canCreateProjects) {
      throw new ForbiddenException(
        `Acceso denegado (MVP-H01): La cuenta '${user.code}' no está autorizada para crear proyectos.`
      );
    }

    const member = await this.orgRepo.findMember(org.id, user.id);
    if (!member || member.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `Acceso denegado: El usuario '${user.code}' no es miembro activo de la organización '${org.code}' (DA-06).`
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

    // 4. H02-R03: Crear proyecto, asignar creador y registrar auditoría atómicamente en una única transacción
    const project = await this.db.transaction(async (client) => {
      const prj = await this.projectsRepo.create(
        {
          code: dto.code.toUpperCase(),
          project_key: dto.projectKey.toUpperCase(),
          name: dto.name,
          description: dto.description || '',
          client_name: dto.clientName,
          status: 'BORRADOR',
          organization_id: org.id,
          created_by: user.id,
          manager_id: user.id,
        },
        client
      );

      // Asignar al creador como integrante del proyecto
      await this.projectsRepo.assignUserToProject(user.id, prj.id, user.id, client);

      // Auditoría inmutable SHA-256
      await this.auditService.logEvent(
        {
          eventCode: 'PRJ_CREATED_DRAFT',
          actorUserId: user.id,
          actorRole: user.activeRoleId,
          operation: 'CREATE',
          entityName: 'project',
          entityId: prj.id,
          projectId: prj.id,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            code: prj.code,
            projectKey: prj.project_key,
            name: prj.name,
            organizationId: org.id,
            organizationCode: org.code,
            status: 'BORRADOR',
            createdBy: user.code,
          },
        },
        client
      );

      return prj;
    });

    if (!user.assignedProjectIds.includes(project.code)) {
      user.assignedProjectIds.push(project.code);
    }
    if (!user.assignedProjectIds.includes(project.id)) {
      user.assignedProjectIds.push(project.id);
    }

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
      // H02-R06: Comprobar que el usuario sea miembro activo (si está suspendido, acceso denegado)
      const callerMember = await this.orgRepo.findMember(org.id, user.id);
      if (!callerMember || callerMember.status !== 'ACTIVE') {
        throw new ForbiddenException(
          `Acceso denegado: La membresía del usuario '${user.code}' en la organización '${org.code}' está inactiva o suspendida.`
        );
      }
      targetOrgId = org.id;
    }

    // Recuperar asignaciones dinámicas del usuario en la base de datos o mock
    const dynamicAssignments = await this.projectsRepo.findUserProjectAssignments(user.id);

    // Aislamiento multitenant estricto (ADR-006 / DA-01, DA-02):
    // 1. En PostgreSQL, el proyecto debe tener obligatoriamente organización institucional asignada (H02-R02)
    // 2. El usuario debe ser miembro activo de dicha organización (DA-06)
    // 3. El usuario debe estar asignado al proyecto O ser su creador
    return allProjects
      .filter((p) => {
        // H02-R02: En modo postgres, nunca considerar autorizado un proyecto sin organización
        if (this.db.getDatabaseMode() === 'postgres' && !p.organization_id) {
          return false;
        }

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

    // H02-R02: En modo PostgreSQL, rechazar proyectos sin organización institucional válida
    if (this.db.getDatabaseMode() === 'postgres' && !project.organization_id) {
      throw new ForbiddenException(
        `Acceso denegado: El proyecto '${project.code}' carece de organización institucional válida.`
      );
    }

    // Verificación de aislamiento organizacional (DA-02, DA-06)
    if (project.organization_id) {
      const member = await this.orgRepo.findMember(project.organization_id, user.id);
      if (!member || member.status !== 'ACTIVE') {
        throw new ForbiddenException(
          `Acceso denegado: El usuario '${user.code}' no es miembro activo de la organización propietaria del proyecto.`
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

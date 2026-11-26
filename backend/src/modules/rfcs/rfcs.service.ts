import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
  Inject,
  Optional,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import { RfcsRepository, RfcEntity } from './rfcs.repository.js';
import { ProjectsRepository } from '../projects/projects.repository.js';
import { OrganizationsRepository } from '../organizations/organizations.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { DatabaseService } from '../../database/database.service.js';
import { CreateRfcDto } from './dtos/create-rfc.dto.js';
import type { AuthenticatedUser } from '../../common/types/index.js';

@Injectable()
export class RfcsService {
  constructor(
    @Inject(RfcsRepository) private readonly rfcsRepo: RfcsRepository,
    @Inject(ProjectsRepository) private readonly projectsRepo: ProjectsRepository,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Optional() @Inject(OrganizationsRepository) private readonly orgRepo?: OrganizationsRepository,
    @Optional() @Inject(DatabaseService) private readonly db?: DatabaseService,
  ) {}

  private isPostgresMode(): boolean {
    if (this.db) {
      return this.db.getDatabaseMode() === 'postgres';
    }
    const mode = process.env.DATABASE_MODE;
    return mode === 'postgres' || (!mode && Boolean(process.env.DATABASE_URL));
  }

  private ensureAuthDependency(): OrganizationsRepository {
    if (this.isPostgresMode() && !this.orgRepo) {
      throw new ServiceUnavailableException(
        '[AUTH-ERR / H02-VF] Dependencia de autorización organizacional (OrganizationsRepository) no disponible en modo PostgreSQL.'
      );
    }
    return this.orgRepo!;
  }

  async getRfcsForUser(user: AuthenticatedUser, projectId?: string): Promise<RfcEntity[]> {
    const isPostgres = this.isPostgresMode();
    if (isPostgres && !this.orgRepo) {
      throw new ServiceUnavailableException(
        '[AUTH-ERR / H02-VF] Dependencia de autorización organizacional (OrganizationsRepository) no disponible en modo PostgreSQL.'
      );
    }

    const all = await this.rfcsRepo.findAll();

    // H02-V / H02-VF (DA-06): Recuperar organizaciones activas del usuario para revocar acceso si está suspendido
    let activeOrgIds: Set<string> | null = null;
    if (this.orgRepo) {
      const activeOrgs = await this.orgRepo.findOrganizationsForUser(user.id);
      activeOrgIds = new Set(activeOrgs.map((o) => o.id));
    }

    const filtered: RfcEntity[] = [];
    for (const rfc of all) {
      // 1. Filtrado multitenant por proyecto asignado
      const projectMatches =
        user.assignedProjectIds.includes(rfc.project_id) ||
        (Boolean((rfc as any).project_code) && user.assignedProjectIds.includes((rfc as any).project_code));
      if (!projectMatches) continue;

      if (projectId && rfc.project_id !== projectId) continue;

      // H02-VF / DA-02 / DA-06: Validar membresía activa en la organización del proyecto
      if (this.orgRepo) {
        const prj = await this.projectsRepo.findByIdOrCode(rfc.project_id);
        if (isPostgres && (!prj || !prj.organization_id)) {
          continue; // Rechazar proyectos sin organización válida en PostgreSQL
        }
        if (prj && prj.organization_id) {
          if (activeOrgIds && !activeOrgIds.has(prj.organization_id)) {
            continue; // Suspendido o no miembro en la organización propietaria
          }
          const member = await this.orgRepo.findMember(prj.organization_id, user.id);
          if (!member || member.status !== 'ACTIVE') {
            continue; // Impedir que sesiones antiguas o asignaciones cacheadas permitan acceso tras suspensión
          }
        }
      }

      // 2. Regla de Ownership para Solicitante (PU-01): Solo ve sus propios expedientes
      if (user.activeRoleId === 'PU-01') {
        if (rfc.requested_by !== user.id && rfc.requested_by !== user.code) {
          continue;
        }
      }

      // 3. Conservar la consulta histórica autorizada conforme a los estados del proyecto:
      // Miembros activos autorizados acceden a la lectura de RFCs de proyectos históricos,
      // activos, archivados o cerrados.
      filtered.push(rfc);
    }

    return filtered;
  }

  async getRfcById(idOrCode: string, user: AuthenticatedUser): Promise<RfcEntity> {
    const isPostgres = this.isPostgresMode();
    if (isPostgres && !this.orgRepo) {
      throw new ServiceUnavailableException(
        '[AUTH-ERR / H02-VF] Dependencia de autorización organizacional (OrganizationsRepository) no disponible en modo PostgreSQL.'
      );
    }

    const rfc = await this.rfcsRepo.findByIdOrCode(idOrCode);
    if (!rfc) {
      throw new NotFoundException(`Expediente de RFC '${idOrCode}' no encontrado.`);
    }

    // Verificación de pertenencia al proyecto
    const hasProjectAccess =
      user.assignedProjectIds.includes(rfc.project_id) ||
      (Boolean((rfc as any).project_code) && user.assignedProjectIds.includes((rfc as any).project_code));
    if (!hasProjectAccess) {
      throw new ForbiddenException(`Acceso no autorizado al proyecto de la RFC '${rfc.code}'.`);
    }

    // H02-VF / DA-02 / DA-06: Validar que el proyecto tenga organización y que el usuario sea miembro activo
    if (this.orgRepo) {
      const prj = await this.projectsRepo.findByIdOrCode(rfc.project_id);
      if (isPostgres && (!prj || !prj.organization_id)) {
        throw new ForbiddenException(
          `Operación rechazada (DA-02): El proyecto de la RFC '${rfc.code}' no cuenta con una organización válida asignada.`
        );
      }
      if (prj && prj.organization_id) {
        const member = await this.orgRepo.findMember(prj.organization_id, user.id);
        if (!member || member.status !== 'ACTIVE') {
          throw new ForbiddenException(
            `Acceso denegado (DA-06): El usuario '${user.code}' no es miembro activo de la organización propietaria del proyecto. Estado de membresía: '${member?.status || 'NO_MIEMBRO'}'.`
          );
        }
      }
    }

    // Regla de Ownership estricta para PU-01
    if (user.activeRoleId === 'PU-01') {
      const isOwner =
        rfc.requested_by === user.id ||
        rfc.requested_by === user.code ||
        (Boolean((rfc as any).requester_code) && (rfc as any).requester_code === user.code);
      if (!isOwner) {
        throw new ForbiddenException(
          `Acceso denegado (Ownership SoD): El solicitante '${user.code}' solo puede consultar sus propios expedientes.`
        );
      }
    }

    // Consulta histórica autorizada: el usuario activo autorizado puede leer la RFC
    return rfc;
  }

  async createRfc(dto: CreateRfcDto, user: AuthenticatedUser, ipAddress?: string, userAgent?: string): Promise<RfcEntity> {
    const isPostgres = this.isPostgresMode();
    if (isPostgres && !this.orgRepo) {
      throw new ServiceUnavailableException(
        '[AUTH-ERR / H02-VF] Dependencia de autorización organizacional (OrganizationsRepository) no disponible en modo PostgreSQL.'
      );
    }

    // 1. Regla SoD-CU-04: Exclusivo Solicitante (PU-01)
    if (user.activeRoleId !== 'PU-01') {
      throw new ForbiddenException(
        `Violación de SoD (CU-04 / RN-01): Solo el Solicitante (PU-01) está facultado para emitir solicitudes de cambio. Rol activo actual: '${user.activeRoleId}'.`
      );
    }

    // 2. Validación de existencia del proyecto
    const project = await this.projectsRepo.findByIdOrCode(dto.projectId);
    if (!project) {
      throw new NotFoundException(`El proyecto '${dto.projectId}' no existe.`);
    }

    // H02-VF / DA-02: Rechazar proyectos sin organización válida en modo PostgreSQL
    if (isPostgres && !project.organization_id) {
      throw new ForbiddenException(
        `Operación rechazada (DA-02): El proyecto '${project.code}' no tiene una organización válida asignada.`
      );
    }

    // H02-VF / DA-06: Validar membresía activa en la organización propietaria del proyecto
    if (this.orgRepo && project.organization_id) {
      const member = await this.orgRepo.findMember(project.organization_id, user.id);
      if (!member || member.status !== 'ACTIVE') {
        throw new ForbiddenException(
          `Acceso denegado (DA-06): El usuario '${user.code}' no es miembro activo de la organización propietaria del proyecto. Estado de membresía: '${member?.status || 'NO_MIEMBRO'}'.`
        );
      }
    }

    // 3. Salvaguarda de Gobernanza SCM (DA-04 / RN-12):
    // Un estado 'ACTIVE' heredado o 'ACTIVO' no constituye evidencia suficiente de que el proyecto
    // disponga de una integración GitHub validada. En modo PostgreSQL, se aplica una salvaguarda
    // temporal fail-closed que bloquea la emisión de RFCs hasta que INIT-H04 suministre el mecanismo real.
    // El modo mock (DATABASE_MODE=mock) preserva compatibilidad para desarrollo y prototipo.
    if (isPostgres) {
      const allowMockActivation = process.env.ALLOW_MOCK_GITHUB_ACTIVATION === 'true';
      if (!allowMockActivation) {
        throw new ForbiddenException(
          `Operación rechazada (DA-04 / RN-12): El proyecto '${project.code}' no dispone de una integración GitHub validada. ` +
            `El estado '${project.status}' heredado no autoriza operaciones SCM hasta que el mecanismo de verificación de GitHub sea activado en INIT-H04.`
        );
      }
    }

    // 4. Reglas SCM de Ciclo de Vida (RN-12 / RN-13): Escritura restringida exclusivamente a proyectos ACTIVO
    const statusUpper = (project.status || '').toUpperCase();
    if (statusUpper !== 'ACTIVE' && statusUpper !== 'ACTIVO') {
      throw new ForbiddenException(
        `Operación rechazada (RN-12 / RN-13): No se pueden crear solicitudes de cambio en proyectos con estado '${project.status}'. El proyecto debe estar ACTIVO con integración GitHub validada.`
      );
    }

    // 5. Validación de asignación del proyecto
    const hasProjectAccess =
      user.assignedProjectIds.includes(project.code) || user.assignedProjectIds.includes(project.id);
    if (!hasProjectAccess) {
      throw new ForbiddenException(
        `Aislamiento multitenant: El usuario '${user.code}' no tiene asignado el proyecto '${project.code}'.`
      );
    }

    // 5. Validación del Elemento de Configuración (ECS)
    const ecs = await this.rfcsRepo.findEcsByIdOrCode(dto.targetEcsId);
    if (!ecs) {
      throw new NotFoundException(`El Elemento de Configuración (ECS) '${dto.targetEcsId}' no existe.`);
    }

    // 6. Blindaje contra contaminación entre proyectos: El ECS debe pertenecer al mismo proyecto
    const ecsProjectMatches =
      ecs.project_id === project.id || ecs.project_id === project.code || (ecs as any).project_code === project.code;
    if (!ecsProjectMatches) {
      throw new BadRequestException(
        `Violación de Integridad: El ECS '${ecs.code}' pertenece a un proyecto distinto (${ecs.project_id}) al especificado (${project.code}).`
      );
    }

    const id = crypto.randomUUID();
    const code = await this.rfcsRepo.getNextCode();
    const now = new Date().toISOString();

    const entity: RfcEntity = {
      id,
      code,
      project_id: project.code,
      target_ecs_id: ecs.id,
      target_ecs_code: ecs.code,
      title: dto.title.trim(),
      description: dto.description.trim(),
      justification: dto.justification.trim(),
      priority: dto.priority,
      classification: 'PENDIENTE',
      status: 'REGISTRADA',
      requested_by: user.code,
      requester_name: user.fullName,
      created_at: now,
      updated_at: now,
    };

    const saved = await this.rfcsRepo.create(entity);

    // 7. Emisión de Evento de Auditoría Append-Only con SHA-256 (RN-02 / ADR-008)
    await this.auditService.logEvent({
      eventCode: 'EVT-RFC-CREATED',
      actorUserId: user.id,
      actorRole: user.activeRoleId,
      operation: 'REGISTRAR_RFC_CU04',
      entityName: 'change_request',
      entityId: saved.id,
      projectId: project.code,
      resultStatus: 'SUCCESS',
      payloadDiff: {
        code: saved.code,
        title: saved.title,
        priority: saved.priority,
        targetEcsCode: ecs.code,
        status: saved.status,
      },
      ipAddress,
      userAgent,
    });

    return saved;
  }
}

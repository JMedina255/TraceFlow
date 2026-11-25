import { Injectable, ForbiddenException, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { RfcsRepository, RfcEntity } from './rfcs.repository.js';
import { ProjectsRepository } from '../projects/projects.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateRfcDto } from './dtos/create-rfc.dto.js';
import type { AuthenticatedUser } from '../../common/types/index.js';

@Injectable()
export class RfcsService {
  constructor(
    @Inject(RfcsRepository) private readonly rfcsRepo: RfcsRepository,
    @Inject(ProjectsRepository) private readonly projectsRepo: ProjectsRepository,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async getRfcsForUser(user: AuthenticatedUser, projectId?: string): Promise<RfcEntity[]> {
    const all = await this.rfcsRepo.findAll();

    return all.filter((rfc) => {
      // 1. Filtrado multitenant por proyecto asignado
      const projectMatches = user.assignedProjectIds.includes(rfc.project_id);
      if (!projectMatches) return false;

      // Si se especificó un proyecto de filtro
      if (projectId && rfc.project_id !== projectId) return false;

      // 2. Regla de Ownership para Solicitante (PU-01): Solo ve sus propios expedientes
      if (user.activeRoleId === 'PU-01') {
        return rfc.requested_by === user.id || rfc.requested_by === user.code;
      }

      // Los demás roles de gestión, arquitectura, CCB, calidad ven todas las RFCs del proyecto asignado
      return true;
    });
  }

  async getRfcById(idOrCode: string, user: AuthenticatedUser): Promise<RfcEntity> {
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

    return rfc;
  }

  async createRfc(dto: CreateRfcDto, user: AuthenticatedUser, ipAddress?: string, userAgent?: string): Promise<RfcEntity> {
    // 1. Regla SoD-CU-04: Exclusivo Solicitante (PU-01)
    if (user.activeRoleId !== 'PU-01') {
      throw new ForbiddenException(
        `Violación de SoD (CU-04 / RN-01): Solo el Solicitante (PU-01) está facultado para emitir solicitudes de cambio. Rol activo actual: '${user.activeRoleId}'.`
      );
    }

    // 2. Validación de asignación del proyecto
    const project = await this.projectsRepo.findByIdOrCode(dto.projectId);
    if (!project) {
      throw new NotFoundException(`El proyecto '${dto.projectId}' no existe.`);
    }

    const hasProjectAccess =
      user.assignedProjectIds.includes(project.code) || user.assignedProjectIds.includes(project.id);
    if (!hasProjectAccess) {
      throw new ForbiddenException(
        `Aislamiento multitenant: El usuario '${user.code}' no tiene asignado el proyecto '${project.code}'.`
      );
    }

    // 3. Validación del Elemento de Configuración (ECS)
    const ecs = await this.rfcsRepo.findEcsByIdOrCode(dto.targetEcsId);
    if (!ecs) {
      throw new NotFoundException(`El Elemento de Configuración (ECS) '${dto.targetEcsId}' no existe.`);
    }

    // 4. Blindaje contra contaminación entre proyectos: El ECS debe pertenecer al mismo proyecto
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

    // 5. Emisión de Evento de Auditoría Append-Only con SHA-256 (RN-02 / ADR-008)
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

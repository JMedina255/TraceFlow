import type { RFC, RFCStatus, CreateRfcDTO, User } from '../types';
import { INITIAL_RFCS } from '../data/initialRfcs';
import { storageService } from './storage.service';
import { authService } from './auth.service';
import { projectService } from './project.service';
import { ecsService } from './ecs.service';
import { auditService } from './audit.service';

const STORAGE_KEY = 'rfcs';

// Matriz oficial de transiciones de estados derivada de DG-11 y TB-07
const ALLOWED_TRANSITIONS: Record<RFCStatus, RFCStatus[]> = {
  REGISTRADA: ['CLASIFICADA', 'EN_SUBSANACION', 'DESESTIMADA'],
  EN_SUBSANACION: ['CLASIFICADA', 'DESESTIMADA'],
  CLASIFICADA: ['EN_ANALISIS_TECNICO'],
  EN_ANALISIS_TECNICO: ['EN_EVALUACION'],
  EN_EVALUACION: ['AUTORIZADA', 'RECHAZADA'],
  AUTORIZADA: ['ORDEN_EMITIDA'],
  ORDEN_EMITIDA: ['EN_IMPLEMENTACION'],
  EN_IMPLEMENTACION: ['EN_PRUEBAS'],
  EN_PRUEBAS: ['EN_ACEPTACION', 'EN_IMPLEMENTACION', 'CANCELADA'],
  EN_ACEPTACION: ['IMPLEMENTADA', 'CANCELADA'],
  DESESTIMADA: [],
  RECHAZADA: [],
  CANCELADA: [],
  IMPLEMENTADA: [],
};

export const rfcService = {
  getAll(projectId?: string): RFC[] {
    const all = storageService.get<RFC[]>(STORAGE_KEY, INITIAL_RFCS);
    if (!projectId) return all;
    return all.filter((r) => r.projectId === projectId);
  },

  getById(id: string): RFC | undefined {
    const all = this.getAll();
    return all.find((r) => r.id === id || r.code === id);
  },

  isTransitionAllowed(fromStatus: RFCStatus, toStatus: RFCStatus): boolean {
    const targets = ALLOWED_TRANSITIONS[fromStatus];
    return targets ? targets.includes(toStatus) : false;
  },

  getAvailableTransitions(currentStatus: RFCStatus): RFCStatus[] {
    return ALLOWED_TRANSITIONS[currentStatus] || [];
  },

  generateNextRfcCode(): string {
    const allRfcs = this.getAll();
    const currentYear = 2026;
    const prefix = `RFC-${currentYear}-`;
    
    let maxCorrelative = 0;
    for (const rfc of allRfcs) {
      if (rfc.code && rfc.code.startsWith(prefix)) {
        const numPart = parseInt(rfc.code.slice(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxCorrelative) {
          maxCorrelative = numPart;
        }
      }
    }

    const nextNum = maxCorrelative + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  },

  create(dto: CreateRfcDTO, user: User): RFC {
    // 1. Verificación estricta de autorización y Segregación de Funciones (SoD)
    if (!authService.isActionAuthorized(user.roleId, 'REGISTRAR_RFC')) {
      throw new Error(
        `Operación denegada (SoD): El rol '${user.roleLabel}' (${user.roleId}) no posee autorización para registrar solicitudes de cambio. Esta acción es exclusiva del rol Solicitante (PU-01) conforme a FD03 (TB-09) y CU-04.`
      );
    }

    // 2. Validación de proyecto activo existente
    const project = projectService.getById(dto.projectId);
    if (!project) {
      throw new Error(`Proyecto inválido o no encontrado: '${dto.projectId}'.`);
    }

    // 3. Validaciones de datos y reglas de negocio del SRS (CU-04 / RN-01)
    const title = dto.title.trim();
    if (!title) {
      throw new Error('El título de la Solicitud de Cambio es mandatorio.');
    }
    if (title.length < 5 || title.length > 120) {
      throw new Error('El título debe tener entre 5 y 120 caracteres.');
    }

    const description = dto.description.trim();
    if (!description || description.length < 15) {
      throw new Error('La descripción detallada del requerimiento o falla debe contener al menos 15 caracteres.');
    }

    const justification = dto.justification.trim();
    if (!justification || justification.length < 15) {
      throw new Error('La justificación operativa de negocio debe contener al menos 15 caracteres (Excepción E1 del SRS).');
    }

    // 4. Validación del ECS afectado
    if (!dto.affectedEcsId) {
      throw new Error('Debe seleccionar al menos un Elemento de Configuración de Software (ECS) afectado.');
    }
    const ecs = ecsService.getById(dto.affectedEcsId);
    if (!ecs) {
      throw new Error(`El Elemento de Configuración (ECS) '${dto.affectedEcsId}' no existe en el catálogo.`);
    }
    if (ecs.projectId !== dto.projectId) {
      throw new Error('El ECS seleccionado no pertenece al proyecto asignado (Excepción E2 del SRS).');
    }

    // 5. Generación de código correlativo unívoco oficial RFC-YYYY-NNNN
    const generatedCode = this.generateNextRfcCode();
    const nowIso = new Date().toISOString();

    // 6. Construcción formal de la entidad en estado REGISTRADA
    const newRfc: RFC = {
      id: generatedCode,
      code: generatedCode,
      projectId: project.id,
      projectName: project.name,
      requesterId: user.id,
      requesterName: user.fullName,
      title,
      description,
      justification,
      proposedSolution: dto.proposedSolution?.trim() || undefined,
      priority: dto.priority,
      category: dto.category,
      affectedEcsId: ecs.id,
      affectedEcsName: `${ecs.code} - ${ecs.name}`,
      status: 'REGISTRADA', // Estado oficial inicial según TB-07 y DG-11
      attachments: dto.attachments && dto.attachments.length > 0 ? dto.attachments : undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 7. Persistencia atómica en localStorage
    const currentRfcs = storageService.get<RFC[]>(STORAGE_KEY, INITIAL_RFCS);
    const updatedRfcs = [newRfc, ...currentRfcs];
    storageService.set(STORAGE_KEY, updatedRfcs);

    // 8. Registro de auditoría simulado append-only con firma criptográfica
    auditService.record({
      action: 'RFC_CREADA',
      entityType: 'RFC',
      entityId: newRfc.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roleLabel,
      details: `Registro formal de Solicitud de Cambio ${newRfc.code}: "${newRfc.title}" en estado REGISTRADA para el proyecto ${newRfc.projectName} (ECS: ${newRfc.affectedEcsName}).`,
      ipAddress: '192.168.1.105',
    });

    return newRfc;
  },
};


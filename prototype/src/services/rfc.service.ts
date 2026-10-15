import type { RFC, RFCStatus, CreateRfcDTO, SubsanarRfcDTO, User } from '../types';
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
  EN_SUBSANACION: ['REGISTRADA', 'DESESTIMADA'], // Alineado estrictamente con DG-11 y CU-04.1
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

  // CU-05 A: Admitir Solicitud formalmente (REGISTRADA -> CLASIFICADA)
  admit(rfcId: string, notes: string, user: User): RFC {
    if (!authService.isActionAuthorized(user.roleId, 'VALIDAR_CLASIFICAR_RFC')) {
      throw new Error(
        `Operación denegada (SoD): El rol '${user.roleLabel}' (${user.roleId}) no posee autorización para emitir dictámenes de admisión en CU-05. Acción exclusiva del Analista de Requerimientos / Gestor (PU-02).`
      );
    }

    const rfc = this.getById(rfcId);
    if (!rfc) {
      throw new Error(`Solicitud de Cambio no encontrada: '${rfcId}'.`);
    }

    if (rfc.status !== 'REGISTRADA') {
      throw new Error(
        `Transición inválida: La solicitud ${rfc.code} está en estado '${rfc.status}' y no puede ser admitida. Solo solicitudes en estado 'REGISTRADA' pueden admitirse mediante CU-05.`
      );
    }

    if (!this.isTransitionAllowed(rfc.status, 'CLASIFICADA')) {
      throw new Error(`Transición no autorizada en la máquina de estados DG-11: ${rfc.status} -> CLASIFICADA.`);
    }

    const nowIso = new Date().toISOString();
    const updatedRfc: RFC = {
      ...rfc,
      status: 'CLASIFICADA',
      admissionNotes: notes?.trim() || 'Solicitud admitida formalmente tras verificación de completitud y pertinencia.',
      admittedBy: user.fullName,
      admittedAt: nowIso,
      updatedAt: nowIso,
    };

    const currentRfcs = storageService.get<RFC[]>(STORAGE_KEY, INITIAL_RFCS);
    const updatedRfcs = currentRfcs.map((r) => (r.id === updatedRfc.id ? updatedRfc : r));
    storageService.set(STORAGE_KEY, updatedRfcs);

    auditService.record({
      action: 'RFC_ADMITIDA',
      entityType: 'RFC',
      entityId: updatedRfc.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roleLabel,
      details: `Admisión formal de Solicitud de Cambio ${updatedRfc.code} por ${user.fullName} (${user.roleLabel}). Estado transiciona a CLASIFICADA para posterior análisis técnico (CU-06).`,
      ipAddress: '192.168.1.105',
    });

    return updatedRfc;
  },

  // CU-05 B: Observar Solicitud formalmente (REGISTRADA -> EN_SUBSANACION)
  observe(rfcId: string, observations: string, user: User): RFC {
    if (!authService.isActionAuthorized(user.roleId, 'VALIDAR_CLASIFICAR_RFC')) {
      throw new Error(
        `Operación denegada (SoD): El rol '${user.roleLabel}' (${user.roleId}) no posee autorización para formular observaciones formales. Acción exclusiva del Gestor (PU-02).`
      );
    }

    const trimmedObs = observations?.trim();
    if (!trimmedObs || trimmedObs.length < 10) {
      throw new Error('El pliego de observaciones de subsanación es obligatorio y debe contener al menos 10 caracteres descriptivos.');
    }

    const rfc = this.getById(rfcId);
    if (!rfc) {
      throw new Error(`Solicitud de Cambio no encontrada: '${rfcId}'.`);
    }

    if (rfc.status !== 'REGISTRADA') {
      throw new Error(
        `Transición inválida: La solicitud ${rfc.code} está en estado '${rfc.status}'. Solo solicitudes en estado 'REGISTRADA' pueden ser observadas.`
      );
    }

    if (!this.isTransitionAllowed(rfc.status, 'EN_SUBSANACION')) {
      throw new Error(`Transición no autorizada en la máquina de estados DG-11: ${rfc.status} -> EN_SUBSANACION.`);
    }

    const nowIso = new Date().toISOString();
    const updatedRfc: RFC = {
      ...rfc,
      status: 'EN_SUBSANACION',
      subsanacionNotes: trimmedObs,
      observedBy: user.fullName,
      observedAt: nowIso,
      updatedAt: nowIso,
    };

    const currentRfcs = storageService.get<RFC[]>(STORAGE_KEY, INITIAL_RFCS);
    const updatedRfcs = currentRfcs.map((r) => (r.id === updatedRfc.id ? updatedRfc : r));
    storageService.set(STORAGE_KEY, updatedRfcs);

    auditService.record({
      action: 'RFC_OBSERVADA',
      entityType: 'RFC',
      entityId: updatedRfc.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roleLabel,
      details: `Emisión de pliego formal de observaciones para ${updatedRfc.code} por Gestor ${user.fullName}. Estado transiciona a EN_SUBSANACION para corrección por el Solicitante (CU-04.1).`,
      ipAddress: '192.168.1.105',
    });

    return updatedRfc;
  },

  // CU-05 C y CU-04.1 A1: Desestimar Solicitud formalmente (REGISTRADA / EN_SUBSANACION -> DESESTIMADA)
  dismiss(rfcId: string, reason: string, user: User): RFC {
    const trimmedReason = reason?.trim();
    if (!trimmedReason || trimmedReason.length < 10) {
      throw new Error('La fundamentación de desestimación es obligatoria y debe contener al menos 10 caracteres.');
    }

    const rfc = this.getById(rfcId);
    if (!rfc) {
      throw new Error(`Solicitud de Cambio no encontrada: '${rfcId}'.`);
    }

    if (!['REGISTRADA', 'EN_SUBSANACION'].includes(rfc.status)) {
      throw new Error(
        `Transición inválida: La solicitud ${rfc.code} se encuentra en estado '${rfc.status}' y no puede ser desestimada. Solo solicitudes en 'REGISTRADA' o 'EN_SUBSANACION' pueden ser desestimadas.`
      );
    }

    // Regla SoD: En REGISTRADA desestima Gestor (PU-02); en EN_SUBSANACION puede desistir Solicitante (PU-01) o Gestor por plazo (CU-04.1 A1/E1)
    if (rfc.status === 'REGISTRADA' && user.roleId !== 'PU-02') {
      throw new Error(
        `Operación denegada (SoD): Solo el Analista de Requerimientos / Gestor (PU-02) puede desestimar solicitudes en revisión inicial conforme a CU-05 A2 y RN-07.`
      );
    }

    if (rfc.status === 'EN_SUBSANACION' && user.roleId !== 'PU-01' && user.roleId !== 'PU-02') {
      throw new Error(
        `Operación denegada (SoD): El rol '${user.roleLabel}' no puede ejecutar el cierre formal de una solicitud observada.`
      );
    }

    const nowIso = new Date().toISOString();
    const updatedRfc: RFC = {
      ...rfc,
      status: 'DESESTIMADA',
      dismissalReason: trimmedReason,
      dismissedBy: user.fullName,
      dismissedAt: nowIso,
      closedAt: nowIso,
      updatedAt: nowIso,
    };

    const currentRfcs = storageService.get<RFC[]>(STORAGE_KEY, INITIAL_RFCS);
    const updatedRfcs = currentRfcs.map((r) => (r.id === updatedRfc.id ? updatedRfc : r));
    storageService.set(STORAGE_KEY, updatedRfcs);

    auditService.record({
      action: 'RFC_DESESTIMADA',
      entityType: 'RFC',
      entityId: updatedRfc.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roleLabel,
      details: `Desestimación formal y cierre anticipado de ${updatedRfc.code} por ${user.fullName} (${user.roleLabel}) en estado terminal DESESTIMADA bajo RN-07. Motivo: "${trimmedReason}".`,
      ipAddress: '192.168.1.105',
    });

    return updatedRfc;
  },

  // CU-04.1: Subsanar Solicitud de Cambio (EN_SUBSANACION -> REGISTRADA)
  subsanar(rfcId: string, dto: SubsanarRfcDTO, user: User): RFC {
    if (!authService.isActionAuthorized(user.roleId, 'SUBSANAR_RFC')) {
      throw new Error(
        `Operación denegada (SoD): El rol '${user.roleLabel}' (${user.roleId}) no posee autorización para subsanar solicitudes de cambio. Esta acción es exclusiva del Solicitante (PU-01) conforme a CU-04.1.`
      );
    }

    const rfc = this.getById(rfcId);
    if (!rfc) {
      throw new Error(`Solicitud de Cambio no encontrada: '${rfcId}'.`);
    }

    if (rfc.status !== 'EN_SUBSANACION') {
      throw new Error(
        `Transición inválida: La solicitud ${rfc.code} está en estado '${rfc.status}' y no requiere subsanación. Solo solicitudes en 'EN_SUBSANACION' pueden ser subsanadas.`
      );
    }

    if (!this.isTransitionAllowed(rfc.status, 'REGISTRADA')) {
      throw new Error(`Transición no autorizada en la máquina de estados DG-11: ${rfc.status} -> REGISTRADA.`);
    }

    // Validaciones de datos y reglas de negocio del SRS (CU-04.1 / RN-01)
    const title = dto.title.trim();
    if (!title || title.length < 5 || title.length > 120) {
      throw new Error('El título subsanado debe tener entre 5 y 120 caracteres.');
    }

    const description = dto.description.trim();
    if (!description || description.length < 15) {
      throw new Error('La descripción detallada debe contener al menos 15 caracteres.');
    }

    const justification = dto.justification.trim();
    if (!justification || justification.length < 15) {
      throw new Error('La justificación operativa de negocio debe contener al menos 15 caracteres (Excepción E1 del SRS).');
    }

    if (!dto.affectedEcsId) {
      throw new Error('Debe seleccionar al menos un Elemento de Configuración de Software (ECS) afectado.');
    }

    const ecs = ecsService.getById(dto.affectedEcsId);
    if (!ecs) {
      throw new Error(`El Elemento de Configuración (ECS) '${dto.affectedEcsId}' no existe en el catálogo.`);
    }

    if (ecs.projectId !== rfc.projectId) {
      throw new Error('El ECS seleccionado no pertenece al proyecto asignado a la solicitud.');
    }

    const nowIso = new Date().toISOString();
    const updatedRfc: RFC = {
      ...rfc,
      title,
      description,
      justification,
      proposedSolution: dto.proposedSolution?.trim() || undefined,
      priority: dto.priority,
      category: dto.category,
      affectedEcsId: ecs.id,
      affectedEcsName: `${ecs.code} - ${ecs.name}`,
      status: 'REGISTRADA', // Retorna formalmente a REGISTRADA conforme a DG-11 y CU-04.1
      attachments: dto.attachments && dto.attachments.length > 0 ? dto.attachments : undefined,
      subsanacionResponseNotes: dto.subsanacionResponseNotes?.trim() || undefined,
      subsanatedAt: nowIso,
      updatedAt: nowIso,
    };

    const currentRfcs = storageService.get<RFC[]>(STORAGE_KEY, INITIAL_RFCS);
    const updatedRfcs = currentRfcs.map((r) => (r.id === updatedRfc.id ? updatedRfc : r));
    storageService.set(STORAGE_KEY, updatedRfcs);

    auditService.record({
      action: 'RFC_SUBSANADA',
      entityType: 'RFC',
      entityId: updatedRfc.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roleLabel,
      details: `Reingreso formal de Solicitud de Cambio ${updatedRfc.code} tras subsanación de observaciones por el Solicitante ${user.fullName}. Estado retorna a REGISTRADA para nueva revisión por el Gestor.`,
      ipAddress: '192.168.1.105',
    });

    return updatedRfc;
  },
};


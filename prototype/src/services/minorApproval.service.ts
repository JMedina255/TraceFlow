import type {
  RFC,
  User,
  MinorApprovalRecord,
  DelegatedMinorApproval,
  RegisterMinorApprovalDTO,
  ApprovalRole,
} from '../types';
import { INITIAL_RFCS } from '../data/initialRfcs';
import { storageService } from './storage.service';
import { authService } from './auth.service';
import { auditService } from './audit.service';
import { rfcService } from './rfc.service';

const STORAGE_KEY = 'minor_approvals';
const RFCS_STORAGE_KEY = 'rfcs';

export const minorApprovalService = {
  getAll(): MinorApprovalRecord[] {
    return storageService.get<MinorApprovalRecord[]>(STORAGE_KEY, []);
  },

  getByRfcId(rfcId: string): MinorApprovalRecord[] {
    const all = this.getAll();
    return all.filter((rec) => rec.rfcId === rfcId);
  },

  /**
   * Consulta el estado global de la autorización delegada (Doble Llave)
   * Analiza si faltan conformidades o si se ha completado la aprobación compartida.
   */
  getDelegatedStatus(rfcId: string): DelegatedMinorApproval {
    const records = this.getByRfcId(rfcId);
    const rfc = rfcService.getById(rfcId);
    const impactReportId = rfc?.impactAnalysisId || (rfc?.technicalImpact as { id?: string })?.id || 'TIA-2026-0001';

    const gestorApproval = records.find((r) => r.role === 'GESTOR');
    const architectApproval = records.find((r) => r.role === 'ARQUITECTO');

    let overallStatus: DelegatedMinorApproval['overallStatus'] = 'PENDIENTE';

    if (records.some((r) => r.decision === 'RECHAZADO' && r.escalateToCcb)) {
      overallStatus = 'REESCALADA_CCB';
    } else if (records.some((r) => r.decision === 'RECHAZADO')) {
      overallStatus = 'RECHAZADA';
    } else if (gestorApproval?.decision === 'APROBADO' && architectApproval?.decision === 'APROBADO') {
      overallStatus = 'AUTORIZADA';
    }

    const completedAt =
      overallStatus === 'AUTORIZADA' || overallStatus === 'RECHAZADA' || overallStatus === 'REESCALADA_CCB'
        ? architectApproval?.decidedAt || gestorApproval?.decidedAt
        : undefined;

    return {
      rfcId,
      impactReportId,
      gestorApproval,
      architectApproval,
      overallStatus,
      completedAt,
    };
  },

  /**
   * Retorna los roles que aún tienen pendiente emitir su visto bueno
   */
  getPendingRoles(rfcId: string): ApprovalRole[] {
    const existing = this.getByRfcId(rfcId);
    const roles: ApprovalRole[] = ['GESTOR', 'ARQUITECTO'];
    return roles.filter((role) => !existing.some((r) => r.role === role));
  },

  /**
   * CU-30: Registrar dictamen de Autoridad Delegada (Doble Llave Gestor + Arquitecto)
   * Exclusivo para Gestor (PU-02) y Arquitecto (PU-03).
   */
  registerApproval(
    dto: RegisterMinorApprovalDTO,
    user: User
  ): { record: MinorApprovalRecord; updatedRfc: RFC; delegatedStatus: DelegatedMinorApproval } {
    // 1. Verificación SoD: El rol debe pertenecer a la Autoridad Delegada (PU-02 o PU-03)
    if (!authService.isActionAuthorized(user.roleId, 'AUTORIZAR_CAMBIO_MENOR')) {
      throw new Error(
        `Operación denegada (SoD): El rol '${user.roleLabel}' (${user.roleId}) no posee autorización para dictaminar cambios menores. Acción reservada exclusivamente al Gestor (PU-02) y Arquitecto (PU-03) conforme a CU-30 y RN-01.`
      );
    }

    const role: ApprovalRole = user.roleId === 'PU-02' ? 'GESTOR' : 'ARQUITECTO';

    // 2. Consulta y validación de existencia del expediente RFC
    const currentRfcs = storageService.get<RFC[]>(RFCS_STORAGE_KEY, INITIAL_RFCS);
    const rfc = currentRfcs.find((r) => r.id === dto.rfcId || r.code === dto.rfcId);
    if (!rfc) {
      throw new Error(`Solicitud de Cambio no encontrada: '${dto.rfcId}'.`);
    }

    // 3. Precondición de estado del ciclo de vida: Debe encontrarse en EN_EVALUACION
    if (rfc.status !== 'EN_EVALUACION') {
      throw new Error(
        `Transición inválida: La solicitud ${rfc.code} se encuentra en estado '${rfc.status}'. Solo solicitudes en estado 'EN_EVALUACION' pueden ser resueltas por vía delegada mediante CU-30.`
      );
    }

    // 4. Precondición de clasificación: Debe ser un CAMBIO_MENOR
    if (rfc.classification !== 'CAMBIO_MENOR') {
      throw new Error(
        `Operación inválida: La solicitud ${rfc.code} está clasificada como '${rfc.classification || 'SIN_CLASIFICAR'}'. La autorización delegada por CU-30 aplica exclusivamente a solicitudes dictaminadas como CAMBIO_MENOR.`
      );
    }

    // 5. Insumo obligatorio: Informe Técnico de Impacto emitido y completado (RN-05)
    const impactReportId = rfc.impactAnalysisId || (rfc.technicalImpact as { id?: string })?.id;
    if (!impactReportId && !rfc.technicalImpact) {
      throw new Error(
        `Operación inválida: La solicitud ${rfc.code} no cuenta con un Informe Técnico de Impacto emitido y congelado requerido por RN-05.`
      );
    }

    // 6. Aislamiento multitenant de proyectos por cuenta
    if (!authService.canUserAccessProject(user, rfc.projectId)) {
      throw new Error(
        `Acceso denegado (Proyecto): El usuario '${user.fullName}' no tiene asignado el proyecto '${rfc.projectId}' (${rfc.projectName}) de esta solicitud.`
      );
    }

    // 7. Regla SoD de antiautoevaluación: El solicitante original no puede autorizar su propio cambio
    if (rfc.requesterId && rfc.requesterId === user.id) {
      throw new Error(
        `Operación denegada (SoD): El usuario '${user.fullName}' (${user.id}) es el solicitante original de ${rfc.code} y tiene prohibido emitir la autorización de su propio requerimiento conforme a RN-01.`
      );
    }

    // 8. Prevención de duplicación de visto bueno para el mismo rol
    const existingRecords = this.getByRfcId(rfc.id);
    if (existingRecords.some((r) => r.role === role)) {
      throw new Error(
        `La conformidad de ${role === 'GESTOR' ? 'Gestión (PU-02)' : 'Arquitectura (PU-03)'} ya ha sido emitida previamente para la solicitud ${rfc.code}.`
      );
    }

    // 9. Control Adicional de Seguridad: Segregación por Identidad (Dos personas distintas)
    const otherApproval = existingRecords.find((r) => r.role !== role);
    if (otherApproval && otherApproval.userId === user.id) {
      throw new Error(
        `Violación de Segregación de Funciones por Identidad: El usuario '${user.fullName}' (${user.id}) ya emitió la conformidad como ${otherApproval.role}. La Doble Llave Operativa exige que ambas conformidades sean suscritas por personas distintas.`
      );
    }

    // 10. Validación de fundamentación obligatoria
    const trimmedJust = dto.justification?.trim();
    if (!trimmedJust || trimmedJust.length < 10) {
      throw new Error('La fundamentación del dictamen es obligatoria y debe contener al menos 10 caracteres descriptivos.');
    }

    if (!['APROBADO', 'RECHAZADO'].includes(dto.decision)) {
      throw new Error('Decisión de autorización inválida. Debe ser APROBADO o RECHAZADO.');
    }

    // 11. Generación de identificador correlativo para el dictamen
    const allRecords = this.getAll();
    const currentYear = 2026;
    const prefix = `APR-${currentYear}-`;
    let maxNum = 0;
    allRecords.forEach((rec) => {
      if (rec.id && rec.id.startsWith(prefix)) {
        const numPart = parseInt(rec.id.slice(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
    const newId = `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
    const nowIso = new Date().toISOString();

    const record: MinorApprovalRecord = {
      id: newId,
      rfcId: rfc.id,
      impactReportId: impactReportId || 'TIA-2026-0001',
      role,
      roleId: user.roleId as 'PU-02' | 'PU-03',
      userId: user.id,
      userName: user.fullName,
      decision: dto.decision,
      justification: trimmedJust,
      decidedAt: nowIso,
      escalateToCcb: Boolean(dto.escalateToCcb && dto.decision === 'RECHAZADO'),
    };

    // 12. Resolución de la máquina de estados según el resultado conjunto
    let updatedRfc: RFC = { ...rfc };
    let auditAction: 'RFC_APROBADA_MENOR' | 'RFC_APROBACION_PARCIAL_MENOR' | 'RFC_RECHAZADA' | 'RFC_REESCALADA_CCB';
    let auditDetails = '';

    if (record.decision === 'RECHAZADO') {
      if (record.escalateToCcb) {
        // Alternativa C.2: Reescalamiento por rebasamiento de límites delegados (DG-SEQ-30 A1)
        // Se reclasifica a CAMBIO_MAYOR y permanece en EN_EVALUACION para el Comité CCB (CU-07)
        updatedRfc = {
          ...rfc,
          classification: 'CAMBIO_MAYOR',
          status: 'EN_EVALUACION',
          updatedAt: nowIso,
        };
        auditAction = 'RFC_REESCALADA_CCB';
        auditDetails = `Reescalamiento formal de Cambio Menor a Cambio Mayor para deliberación en CCB (CU-07) emitido por ${role} ${user.fullName} (${user.roleLabel}). Motivo: "${trimmedJust}".`;
      } else {
        // Alternativa C.1: Rechazo definitivo (RN-07)
        updatedRfc = {
          ...rfc,
          status: 'RECHAZADA',
          rejectionReason: trimmedJust,
          closedAt: nowIso,
          updatedAt: nowIso,
        };
        auditAction = 'RFC_RECHAZADA';
        auditDetails = `Dictamen denegatorio definitivo emitido por ${role} ${user.fullName} (${user.roleLabel}) para Cambio Menor ${rfc.code}. Motivo: "${trimmedJust}". Estado transiciona a RECHAZADA.`;
      }
    } else {
      // Dictamen APROBADO
      if (otherApproval && otherApproval.decision === 'APROBADO') {
        // Escenario B: Ambas llaves aprobatorias concurrentes por distintas identidades
        const gestorName = role === 'GESTOR' ? user.fullName : otherApproval.userName;
        const architectName = role === 'ARQUITECTO' ? user.fullName : otherApproval.userName;

        updatedRfc = {
          ...rfc,
          status: 'AUTORIZADA',
          authorizedAt: nowIso,
          authorizedBy: `Autoridad Delegada (Gestor: ${gestorName} / Arquitecto: ${architectName})`,
          updatedAt: nowIso,
        };
        auditAction = 'RFC_APROBADA_MENOR';
        auditDetails = `Autorización formal delegada completa (Doble Llave suscrita por Gestor y Arquitecto) para ${rfc.code}. Estado transiciona a AUTORIZADA habilitando emisión de ECN (CU-08).`;
      } else {
        // Escenario A: Primera aprobación registrada, permanece en EN_EVALUACION
        updatedRfc = {
          ...rfc,
          status: 'EN_EVALUACION',
          updatedAt: nowIso,
        };
        auditAction = 'RFC_APROBACION_PARCIAL_MENOR';
        auditDetails = `Conformidad de ${role === 'GESTOR' ? 'Gestión' : 'Arquitectura'} emitida por ${user.fullName} (${user.roleLabel}) para ${rfc.code}. Expediente permanece en EN_EVALUACION a la espera de la segunda conformidad.`;
      }
    }

    // 13. Persistencia atómica demostrativa
    const updatedRecords = [record, ...allRecords];
    storageService.set(STORAGE_KEY, updatedRecords);

    const updatedRfcs = currentRfcs.map((r) => (r.id === updatedRfc.id ? updatedRfc : r));
    storageService.set(RFCS_STORAGE_KEY, updatedRfcs);

    // 14. Registro en bitácora de auditoría demostrativa
    auditService.record({
      action: auditAction,
      entityType: 'RFC',
      entityId: updatedRfc.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roleLabel,
      details: auditDetails,
      ipAddress: '192.168.1.105',
    });

    const delegatedStatus = this.getDelegatedStatus(rfc.id);

    return { record, updatedRfc, delegatedStatus };
  },
};

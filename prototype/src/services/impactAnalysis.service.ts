import type {
  RFC,
  User,
  TechnicalImpactReport,
  ImpactAnalysisDTO,
} from '../types';
import { INITIAL_RFCS } from '../data/initialRfcs';
import { storageService } from './storage.service';
import { authService } from './auth.service';
import { ecsService } from './ecs.service';
import { auditService } from './audit.service';

const REPORTS_STORAGE_KEY = 'technical_impact_reports';
const RFCS_STORAGE_KEY = 'rfcs';

// Extraer informes iniciales a partir de RFCs precargadas
function getInitialReports(): TechnicalImpactReport[] {
  const reports: TechnicalImpactReport[] = [];
  INITIAL_RFCS.forEach((rfc, index) => {
    if (rfc.technicalImpact) {
      const ti = rfc.technicalImpact;
      const num = String(index + 1).padStart(4, '0');
      reports.push({
        id: `TIA-2026-${num}`,
        rfcId: rfc.id,
        rfcCode: rfc.code,
        architectId: ti.architectId,
        architectName: ti.architectName,
        classification: ti.classification,
        proposedClassification: ti.classification,
        architectureImpactDescription: ti.architectureImpactDescription,
        technicalSummary: ti.architectureImpactDescription,
        affectedEcsIds: ti.affectedEcsIds,
        affectedEcsNames: ti.affectedEcsIds.map((id) => {
          const e = ecsService.getById(id);
          return e ? `${e.code} - ${e.name}` : id;
        }),
        estimatedEffortHours: ti.estimatedEffortHours,
        estimatedCost: ti.estimatedCost,
        estimatedDurationDays: ti.estimatedDurationDays,
        technicalRisk: ti.technicalRisk,
        identifiedRisks: [
          'Complejidad en compatibilidad de versiones concurrentes.',
          'Riesgo de regresión en pruebas de integración del pipeline.',
        ],
        recommendation: ti.classification === 'CAMBIO_MAYOR' ? 'PROCEDE_MAYOR' : 'PROCEDE_MENOR',
        rollbackPlan: 'Reversión a la última versión estable congelada en Línea Base y restauración de esquema de base de datos.',
        tripleConstraintImpact: ti.tripleConstraintImpact,
        reportDate: ti.reportDate,
        status: 'COMPLETADO',
      });
    }
  });
  return reports;
}

export const impactAnalysisService = {
  getAll(): TechnicalImpactReport[] {
    return storageService.get<TechnicalImpactReport[]>(REPORTS_STORAGE_KEY, getInitialReports());
  },

  getByRfcId(rfcId: string): TechnicalImpactReport | undefined {
    const all = this.getAll();
    return all.find((rep) => rep.rfcId === rfcId || rep.rfcCode === rfcId);
  },

  getById(id: string): TechnicalImpactReport | undefined {
    const all = this.getAll();
    return all.find((rep) => rep.id === id);
  },

  /**
   * CU-06: Realizar Análisis de Impacto Técnico
   * Operación ejecutada exclusivamente por el Arquitecto / Especialista Técnico (PU-03).
   * Evalúa la triple restricción, dependencias arquitectónicas, riesgos y emite el dictamen.
   */
  registerAnalysis(
    dto: ImpactAnalysisDTO,
    user: User
  ): { report: TechnicalImpactReport; updatedRfc: RFC } {
    // 1. Verificación SoD: Exclusivo Arquitecto (PU-03) conforme a RN-05
    if (!authService.isActionAuthorized(user.roleId, 'ANALIZAR_IMPACTO')) {
      throw new Error(
        `Operación denegada (SoD): El rol '${user.roleLabel}' (${user.roleId}) no posee autorización para elaborar informes de impacto técnico. Acción reservada al Arquitecto / Especialista Técnico (PU-03) conforme a CU-06 y RN-05.`
      );
    }

    // 2. Consulta y validación de existencia del expediente RFC
    const currentRfcs = storageService.get<RFC[]>(RFCS_STORAGE_KEY, INITIAL_RFCS);
    const rfc = currentRfcs.find((r) => r.id === dto.rfcId || r.code === dto.rfcId);
    if (!rfc) {
      throw new Error(`Solicitud de Cambio no encontrada: '${dto.rfcId}'.`);
    }

    // 3. Aislamiento multitenant de proyectos por cuenta
    if (!authService.canUserAccessProject(user, rfc.projectId)) {
      throw new Error(
        `Acceso denegado (Proyecto): El usuario '${user.fullName}' no tiene asignado el proyecto '${rfc.projectId}' (${rfc.projectName}) de esta solicitud.`
      );
    }

    // 4. Regla SoD de antiautoevaluación: Solicitante no puede evaluar técnicamente su propia solicitud
    if (rfc.requesterId && rfc.requesterId === user.id) {
      throw new Error(
        `Operación denegada (SoD): El usuario '${user.fullName}' (${user.id}) es el solicitante original de ${rfc.code} y tiene prohibido evaluar técnicamente su propio expediente conforme a las políticas de segregación de funciones (RN-05).`
      );
    }

    // 5. Integridad del dictamen: No duplicar análisis sobre expedientes que ya cuentan con informe formal
    if (rfc.impactAnalysisId) {
      throw new Error(
        `El expediente ${rfc.code} ya cuenta con un Informe Técnico de Impacto emitido y congelado (${rfc.impactAnalysisId}).`
      );
    }

    // 6. Precondición de estado del ciclo de vida (DG-11 / TB-07)
    if (rfc.status !== 'CLASIFICADA' && rfc.status !== 'EN_ANALISIS_TECNICO') {
      throw new Error(
        `Transición inválida: La solicitud ${rfc.code} se encuentra en estado '${rfc.status}'. Solo solicitudes formalmente admitidas en estado 'CLASIFICADA' o 'EN_ANALISIS_TECNICO' pueden ser evaluadas técnicamente mediante CU-06.`
      );
    }

    // 7. Validaciones cuantitativas de Triple Restricción
    if (typeof dto.effortHours !== 'number' || isNaN(dto.effortHours) || dto.effortHours <= 0) {
      throw new Error('El esfuerzo técnico estimado debe ser un valor numérico positivo mayor a 0 horas.');
    }

    if (typeof dto.estimatedCost !== 'number' || isNaN(dto.estimatedCost) || dto.estimatedCost < 0) {
      throw new Error('El costo estimado en moneda local debe ser un valor numérico mayor o igual a 0.');
    }

    if (typeof dto.scheduleImpactDays !== 'number' || isNaN(dto.scheduleImpactDays) || dto.scheduleImpactDays < 0) {
      throw new Error('El impacto en cronograma debe ser un valor numérico mayor o igual a 0 días.');
    }

    const summary = dto.technicalSummary?.trim();
    if (!summary || summary.length < 15) {
      throw new Error('El resumen y fundamentación técnica del impacto debe contener al menos 15 caracteres descriptivos.');
    }

    if (!dto.affectedEcsIds || !Array.isArray(dto.affectedEcsIds) || dto.affectedEcsIds.length === 0) {
      throw new Error('Debe seleccionar al menos un Elemento de Configuración de Software (ECS) afectado en la evaluación.');
    }

    // Validar existencia y consistencia de cada ECS seleccionado
    const ecsNames: string[] = [];
    for (const ecsId of dto.affectedEcsIds) {
      const ecs = ecsService.getById(ecsId);
      if (!ecs) {
        throw new Error(`El Elemento de Configuración (ECS) '${ecsId}' no existe en el catálogo.`);
      }
      if (ecs.projectId !== rfc.projectId) {
        throw new Error(`El ECS '${ecs.code}' no pertenece al proyecto asignado a la solicitud (${rfc.projectName}).`);
      }
      ecsNames.push(`${ecs.code} - ${ecs.name}`);
    }

    if (!['PROCEDE_MENOR', 'PROCEDE_MAYOR', 'RECHAZO_TECNICO'].includes(dto.recommendation)) {
      throw new Error('La recomendación técnica del dictamen no es válida.');
    }

    if (!['CAMBIO_MENOR', 'CAMBIO_MAYOR'].includes(dto.proposedClassification)) {
      throw new Error('La clasificación técnica propuesta debe ser CAMBIO_MENOR o CAMBIO_MAYOR.');
    }

    // 8. Generación del identificador correlativo para el informe
    const currentReports = this.getAll();
    const currentYear = 2026;
    const prefix = `TIA-${currentYear}-`;
    let maxNum = 0;
    currentReports.forEach((rep) => {
      if (rep.id && rep.id.startsWith(prefix)) {
        const numPart = parseInt(rep.id.slice(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
    const newId = `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
    const nowIso = new Date().toISOString();

    // 9. Construcción del Informe Técnico de Impacto (Entidad Inmutable)
    const report: TechnicalImpactReport = {
      id: newId,
      rfcId: rfc.id,
      rfcCode: rfc.code,
      architectId: user.id,
      architectName: user.fullName,
      classification: dto.proposedClassification,
      proposedClassification: dto.proposedClassification,
      architectureImpactDescription: summary,
      technicalSummary: summary,
      affectedEcsIds: dto.affectedEcsIds,
      affectedEcsNames: ecsNames,
      estimatedEffortHours: dto.effortHours,
      estimatedCost: dto.estimatedCost,
      estimatedDurationDays: dto.scheduleImpactDays,
      technicalRisk: dto.technicalRisk || 'MEDIO',
      identifiedRisks: dto.identifiedRisks && dto.identifiedRisks.length > 0
        ? dto.identifiedRisks
        : ['Afectación potencial a componentes dependientes en la integración.'],
      recommendation: dto.recommendation,
      rollbackPlan: dto.rollbackPlan?.trim() || 'Restauración de versión anterior desde Biblioteca Maestra y rollback de scripts.',
      tripleConstraintImpact: {
        scopeAffected: dto.affectedEcsIds.length > 1,
        scheduleAffected: dto.scheduleImpactDays > 0,
        costAffected: dto.estimatedCost > 0,
      },
      reportDate: nowIso,
      status: 'COMPLETADO',
    };

    // 10. Transición canónica en máquina de estados DG-11 y TB-07
    // Toda solicitud con informe técnico emitido transiciona a EN_EVALUACION (TB-07, Estado 5).
    // La clasificación determina la vía evaluadora:
    // - CAMBIO_MAYOR: Deliberación colegiada en Comité CCB (CU-07)
    // - CAMBIO_MENOR: Evaluación y autorización delegada en Doble Llave Gestor + Arquitecto (CU-30)
    const nextStatus = 'EN_EVALUACION';

    const updatedRfc: RFC = {
      ...rfc,
      status: nextStatus,
      classification: dto.proposedClassification,
      impactAnalysisId: report.id,
      technicalImpact: report,
      updatedAt: nowIso,
    };

    // 11. Persistencia atómica en almacenamiento local
    const updatedReports = [report, ...currentReports.filter((r) => r.id !== report.id)];
    storageService.set(REPORTS_STORAGE_KEY, updatedReports);

    const updatedRfcs = currentRfcs.map((r) => (r.id === updatedRfc.id ? updatedRfc : r));
    storageService.set(RFCS_STORAGE_KEY, updatedRfcs);

    // 12. Emisión de evento en bitácora de auditoría demostrativa
    auditService.record({
      action: 'RFC_ANALISIS_TECNICO_REGISTRADO',
      entityType: 'RFC',
      entityId: updatedRfc.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.roleLabel,
      details: `Emisión formal de Informe Técnico de Impacto ${report.id} para ${updatedRfc.code} por Arquitecto ${user.fullName} (${user.roleLabel}). Clasificación: ${report.classification}, Dictamen: ${report.recommendation}. Esfuerzo: ${report.estimatedEffortHours}h, Costo: S/.${report.estimatedCost}, Plazo: ${report.estimatedDurationDays}d. Estado transiciona a ${updatedRfc.status}.`,
      ipAddress: '192.168.1.105',
    });

    return { report, updatedRfc };
  },
};
